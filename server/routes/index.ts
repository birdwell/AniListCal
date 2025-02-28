import type { Express } from "express";
import { registerMiddleware } from "./middleware";
import { registerConfigRoutes } from "./config";
import { registerAuthRoutes } from "./auth";
import { registerAnimeRoutes } from "./anime";
import { registerAIRoutes } from "./ai";

// Add type declaration for Express Request.user
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      accessToken: string;
      anilistId: string;
    }
  }
}

export function registerAllRoutes(app: Express, httpServer: any) {
  // Register middleware first
  registerMiddleware(app);
  
  // Register all route modules
  registerConfigRoutes(app);
  registerAuthRoutes(app);
  registerAnimeRoutes(app);
  registerAIRoutes(app);
}
