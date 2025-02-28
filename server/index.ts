import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import * as dotenv from "dotenv";
import { createServer } from "http";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log(`Error: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    log("Database connection successful");
    return true;
  } catch (error) {
    log("Database connection failed: " + error);
    // Don't throw the error, just return false
    return false;
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responseKeys = Object.keys(capturedJsonResponse);
        if (responseKeys.length <= 5) {
          const summary = responseKeys
            .map((k) => {
              const val = capturedJsonResponse![k];
              if (Array.isArray(val)) {
                return `${k}: [${val.length} items]`;
              } else if (typeof val === "object" && val !== null) {
                return `${k}: {${Object.keys(val).length} props}`;
              } else {
                return `${k}: ${val}`;
              }
            })
            .join(", ");
          logLine += ` - Response: {${summary}}`;
        } else {
          logLine += ` - Response: {${responseKeys.length} keys}`;
        }
      }
      log(logLine);
    }
  });

  next();
});

const PORT = process.env.PORT || 5001;

// Add a database status flag
let isDatabaseConnected = false;

// Add a health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    database: {
      status: isDatabaseConnected ? 'connected' : 'disconnected'
    },
    environment: process.env.NODE_ENV
  };
  
  // If the database is disconnected, return a degraded status
  if (!isDatabaseConnected) {
    health.status = 'DEGRADED';
    return res.status(200).json(health);
  }
  
  // Check if we can actually query the database
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    health.database.status = 'healthy';
  } catch (error) {
    health.status = 'DEGRADED';
    health.database.status = 'unhealthy';
    log(`Health check database error: ${error}`);
  }
  
  return res.status(health.status === 'OK' ? 200 : 200).json(health);
});

// Start the server regardless of database connection status
async function startServer() {
  const httpServer = createServer(app);

  // Check database connection but don't fail if it's not available
  isDatabaseConnected = await checkDatabaseConnection();
  
  registerRoutes(app, httpServer);

  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  httpServer.listen(PORT, () => {
    log(`Server running on http://localhost:${PORT}/`);
    if (!isDatabaseConnected) {
      log('Warning: Server started without database connection. Some features may not work.');
    }
  });

  ["SIGINT", "SIGTERM"].forEach((signal) => {
    process.on(signal, () => {
      log(`Received ${signal}, shutting down...`);
      httpServer.close(() => {
        log("Server closed");
        process.exit(0);
      });
    });
  });
}

// Start the server and catch any startup errors
startServer().catch((error) => {
  log(`Startup error: ${error}`);
  log('Attempting to start server in degraded mode...');
  
  // Try again without requiring database
  const httpServer = createServer(app);
  
  registerRoutes(app, httpServer);
  
  if (process.env.NODE_ENV !== "production") {
    setupVite(app, httpServer).catch(err => log(`Vite setup error: ${err}`));
  } else {
    serveStatic(app);
  }
  
  httpServer.listen(PORT, () => {
    log(`Server running in degraded mode on http://localhost:${PORT}/`);
    log('Warning: Some features requiring database access will not work.');
  });
});
