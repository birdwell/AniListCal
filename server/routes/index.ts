import type { Express } from "express";
import { registerMiddleware } from "./middleware";
import { registerConfigRoutes } from "./config";
import { registerAuthRoutes } from "./auth";
import { createSessionStore, type SessionStoreSetup } from "../auth/session";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      avatarUrl?: string;
    }

    interface Request {
      userId?: string; // Set by requireAuth from Passport session
      anilistToken?: string; // Loaded server-side for AniList proxy calls
    }
  }
}

export async function registerAllRoutes(app: Express): Promise<SessionStoreSetup> {
  const sessionSetup = await createSessionStore();
  registerMiddleware(app, sessionSetup.store);
  registerConfigRoutes(app);
  registerAuthRoutes(app);
  return sessionSetup;
}
