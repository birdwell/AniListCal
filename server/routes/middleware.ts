import type { Express } from "express";
import session, { type Store } from "express-session";
import rateLimit from "express-rate-limit";
import { buildSessionOptions } from "../auth/sessionConfig";
import { configurePassport, passport } from "../auth/passport";
import { getFrontendUrl } from "../auth/urls";
import { log } from "../vite";

function getAllowedOrigins(): string[] {
  const origins = new Set<string>();
  const frontendUrl = getFrontendUrl();
  if (frontendUrl) {
    origins.add(frontendUrl.replace(/\/$/, ""));
  }
  return [...origins];
}

// Add Content Security Policy middleware
export function addSecurityHeaders(app: Express) {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Content-Security-Policy",
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://cloud.umami.is",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https://s4.anilist.co https://img.anili.st data:",
          "font-src 'self'",
          "connect-src 'self' https://graphql.anilist.co https://cloud.umami.is",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; ")
      );
    }
    next();
  });
}

export function registerMiddleware(app: Express, sessionStore: Store) {
  app.use((req, res, next) => {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.headers.origin;

    if (process.env.NODE_ENV === "production") {
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
    } else {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  });

  addSecurityHeaders(app);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
    skip: (req) => process.env.NODE_ENV !== "production" || req.path === "/api/health",
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts from this IP, please try again after an hour",
    skip: (req) => process.env.NODE_ENV !== "production",
  });

  app.use("/api/", apiLimiter);
  app.use("/api/auth/", authLimiter);

  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    log("WARNING: No SESSION_SECRET set in production. Using a default secret is insecure.");
  }

  configurePassport();
  app.use(session(buildSessionOptions(sessionStore)) as any);
  app.use(passport.initialize() as any);
  app.use(passport.session());
}
