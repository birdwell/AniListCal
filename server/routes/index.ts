import type { Express } from "express";
import { registerMiddleware } from "./middleware";
import { registerConfigRoutes } from "./config";
import { registerAuthRoutes } from "./auth";
import { createSessionStore, type SessionStoreSetup } from "../auth/session";
import { initCacheStore } from "../cache/cacheStore";

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
  initCacheStore(sessionSetup.redisClient as Parameters<typeof initCacheStore>[0]);
  registerMiddleware(app, sessionSetup.store);
  registerConfigRoutes(app);
  registerAuthRoutes(app);

  // Unmatched /api/* → JSON 404 so SPA catch-alls never see API paths.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return sessionSetup;
}
