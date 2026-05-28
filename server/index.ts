import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import * as dotenv from "dotenv";
import { createServer } from "http";
import { logger } from "./logger";
import { getLocalDevAppUrl, openInSystemBrowser } from "./utils/openBrowser";

dotenv.config();

// ** Add log here to check loaded env vars **
logger.debug(`[Server Startup] Loaded ANILIST_CLIENT_ID: ${process.env.ANILIST_CLIENT_ID}`);
logger.debug(`[Server Startup] Loaded FRONTEND_URL: ${process.env.FRONTEND_URL}`); // Check if this is loaded if defined
logger.debug(`[Server Startup] Loaded BACKEND_CALLBACK_URL: ${process.env.BACKEND_CALLBACK_URL}`); // Check if this is loaded if defined

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  log(`Error: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

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

const PORT = parseInt(process.env.PORT || "5001", 10);

function logDevSetupHints(): void {
  if (process.env.NODE_ENV === "production") return;

  const missing: string[] = [];
  if (!process.env.ANILIST_CLIENT_ID) missing.push("ANILIST_CLIENT_ID");
  if (!process.env.ANILIST_CLIENT_SECRET) missing.push("ANILIST_CLIENT_SECRET");
  if (!process.env.VITE_ANILIST_CLIENT_ID) missing.push("VITE_ANILIST_CLIENT_ID");

  if (missing.length > 0) {
    log(
      `Missing .env values: ${missing.join(", ")} — copy .env.example and add your AniList API credentials.`
    );
  }

  const appUrl = getLocalDevAppUrl(PORT);
  log(`Local app: ${appUrl}`);
  if (PORT === 3001) {
    log("Split dev: UI is on http://localhost:5001 (API on 3001). Set VITE_BACKEND_ORIGIN=http://localhost:3001 in .env.");
  }
}

// Start the server
async function startServer() {
  const httpServer = createServer(app);

  registerRoutes(app);

  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    log(`Server running on http://0.0.0.0:${PORT}/`);
    logDevSetupHints();

    if (
      process.env.NODE_ENV !== "production" &&
      process.env.OPEN_BROWSER !== "false"
    ) {
      openInSystemBrowser(getLocalDevAppUrl(PORT));
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

// Start the server
startServer().catch((error) => {
  log(`Failed to start server: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
