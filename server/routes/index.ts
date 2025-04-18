import type { Express } from "express";
import { registerMiddleware } from "./middleware";
import { registerConfigRoutes } from "./config";
import { registerAuthRoutes } from "./auth";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      avatarUrl?: string;
    }

    interface Request {
      userId?: string; // User ID from API token
      anilistToken?: string; // AniList token from API token auth
    }
  }
}

export function registerAllRoutes(app: Express) {
  registerMiddleware(app);
  registerConfigRoutes(app);
  registerAuthRoutes(app);
}
