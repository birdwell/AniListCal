import type { Express } from "express";
import { registerMiddleware } from "./middleware";
import { registerConfigRoutes } from "./config";
import { registerAuthRoutes } from "./auth";
import { registerAIRoutes } from "./ai";

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
  registerMiddleware(app);

  registerConfigRoutes(app);
  registerAuthRoutes(app);
  registerAIRoutes(app);
}
