import type { SessionOptions, Store } from "express-session";

/** Slightly under AniList's documented ~1 year access token lifetime. */
const DEFAULT_SESSION_MAX_AGE_MS = 364 * 24 * 60 * 60 * 1000;

const SESSION_COOKIE_NAME = "sid";

export function getSessionMaxAgeMs(): number {
  const parsed = Number.parseInt(process.env.SESSION_MAX_AGE_MS || "", 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return DEFAULT_SESSION_MAX_AGE_MS;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function buildSessionOptions(store: Store): SessionOptions {
  const sessionSecret = process.env.SESSION_SECRET;

  return {
    secret: sessionSecret || "anime-calendar-secret-do-not-use-in-production",
    resave: false,
    saveUninitialized: false,
    store,
    name: SESSION_COOKIE_NAME,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Lax is required for OAuth redirects back from AniList (Strict breaks cross-site GET callback).
      sameSite: "lax",
      maxAge: getSessionMaxAgeMs(),
    },
  };
}

export const SESSION_REDIS_KEY_PREFIX = "anilistcal:sess:";
