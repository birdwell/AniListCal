import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { logger } from "../logger";

/**
 * Requires a valid Passport session and a stored AniList token for the user.
 * Sets req.userId and req.anilistToken for downstream handlers.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = req.user;
  if (!req.isAuthenticated?.() || !user?.id) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const anilistToken = await storage.getToken(user.id);
    if (!anilistToken) {
      logger.warn(`[requireAuth] Session for user ${user.id} has no AniList token`);
      req.logout(() => {
        res.status(401).json({ error: "Session expired, please log in again." });
      });
      return;
    }

    req.userId = user.id;
    req.anilistToken = anilistToken;
    next();
  } catch (error) {
    logger.error("[requireAuth] Error loading session data:", error);
    next(error);
  }
}
