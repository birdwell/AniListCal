import type { Request } from "express";
import { storage } from "../storage";
import { getSessionCookieName } from "./sessionConfig";
import { logger } from "../logger";

export const ANILIST_TOKEN_EXPIRED_CODE = "ANILIST_TOKEN_EXPIRED";

export const ANILIST_TOKEN_EXPIRED_MESSAGE =
  "Your AniList authorization has expired. Please sign in again.";

/** Revoke stored tokens and destroy the Passport session after AniList rejects the access token. */
export async function clearUserSession(req: Request, userId: string): Promise<void> {
  await storage.revokeToken(userId);

  await new Promise<void>((resolve) => {
    if (!req.isAuthenticated?.()) {
      resolve();
      return;
    }

    req.logout((logoutErr) => {
      if (logoutErr) {
        logger.error("[clearUserSession] Passport logout error:", logoutErr);
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          logger.error("[clearUserSession] Session destroy error:", destroyErr);
        }
        resolve();
      });
    });
  });
}

export function sendAniListTokenExpired(res: import("express").Response): void {
  res.clearCookie(getSessionCookieName());
  res.status(401).json({
    error: ANILIST_TOKEN_EXPIRED_MESSAGE,
    code: ANILIST_TOKEN_EXPIRED_CODE,
  });
}

export function isAniListAuthFailure(status: number, body: unknown): boolean {
  if (status === 401) {
    return true;
  }

  if (!body || typeof body !== "object") {
    return false;
  }

  const errors = (body as { errors?: { message?: string; status?: number }[] }).errors;
  if (!Array.isArray(errors)) {
    return false;
  }

  return errors.some(
    (err) =>
      err.status === 401 ||
      err.message?.includes("Unauthorized") ||
      err.message?.toLowerCase().includes("invalid token")
  );
}
