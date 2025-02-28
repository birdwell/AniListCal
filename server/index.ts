import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import * as dotenv from 'dotenv';
import { createServer } from "http";

// Load environment variables from .env file
dotenv.config();

// We'll no longer extend the Request interface here to avoid type conflicts
// Passport will handle the user type internally

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add database connection check
async function checkDatabaseConnection() {
  try {
    // Test query to verify database connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    log("Database connection successful");
  } catch (error) {
    log("Database connection failed: " + error);
    throw error;
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
        // Include a short summary of the response if it's not too big
        const responseKeys = Object.keys(capturedJsonResponse);
        if (responseKeys.length <= 5) {
          const summary = responseKeys.map(k => {
            const val = capturedJsonResponse![k];
            if (Array.isArray(val)) {
              return `${k}: [${val.length} items]`;
            } else if (typeof val === "object" && val !== null) {
              return `${k}: {${Object.keys(val).length} props}`;
            } else {
              return `${k}: ${val}`;
            }
          }).join(", ");
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

// Define the port to listen on
const PORT = process.env.PORT || 5001;

// Check the database connection before starting the server
checkDatabaseConnection()
  .then(async () => {
    // Create HTTP server first
    const httpServer = createServer(app);
    
    // Register all application routes first
    registerRoutes(app, httpServer);

    // Initialize Vite middleware for development
    if (process.env.NODE_ENV !== 'production') {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }
    
    // Start the HTTP server
    httpServer.listen(PORT, () => {
      log(`Server running on http://localhost:${PORT}/`);
    });

    // Handle server shutdown
    ["SIGINT", "SIGTERM"].forEach((signal) => {
      process.on(signal, () => {
        log(`Received ${signal}, shutting down...`);
        httpServer.close(() => {
          log("Server closed");
          process.exit(0);
        });
      });
    });
  })
  .catch((error) => {
    log(`Startup error: ${error}`);
    process.exit(1);
  });