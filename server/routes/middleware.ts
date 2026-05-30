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

function buildContentSecurityPolicy(): string {
  const connectSrc = [
    "'self'",
    "https://graphql.anilist.co",
    "https://cloud.umami.is",
    "https://api-gateway.umami.dev",
    "https://*.ingest.us.sentry.io",
  ];

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cloud.umami.is",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://s4.anilist.co https://img.anili.st data:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

// Add Content Security Policy middleware
export function addSecurityHeaders(app: Express) {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }

    if (process.env.NODE_ENV === "production") {
      res.setHeader("Content-Security-Policy", buildContentSecurityPolicy());
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

  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    log("WARNING: No SESSION_SECRET set in production. Using a default secret is insecure.");
  }

  // Paths exempt from the general API limiter. `req.path` is relative to the
  // `/api/` mount point, so these omit the prefix. Health checks and
  // session-management endpoints (logout/session) are cheap and must keep
  // working even when the proxy budget is exhausted — otherwise a rate-limited
  // user can never log out.
  const rateLimitExemptPaths = new Set(["/health", "/auth/logout", "/auth/session"]);

  // IP-based limiter for most API routes. Runs before session/Passport so
  // cheap endpoints don't pay session deserialization cost just to rate-limit.
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
    skip: (req) =>
      process.env.NODE_ENV !== "production" ||
      rateLimitExemptPaths.has(req.path) ||
      req.path === "/anilist/proxy",
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts from this IP, please try again after an hour",
    skip: (req) => process.env.NODE_ENV !== "production",
  });

  app.use("/api/", apiLimiter);

  configurePassport();
  app.use(session(buildSessionOptions(sessionStore)) as any);
  app.use(passport.initialize() as any);
  app.use(passport.session());

  // Per-user limiter for the AniList proxy only. Passport must run first so
  // the key can use req.user; NAT/shared-IP users get independent budgets.
  const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again after 15 minutes",
    keyGenerator: (req) => {
      const userId = req.user?.id;
      return userId ? `user:${userId}` : `ip:${req.ip ?? "unknown"}`;
    },
    skip: (req) => process.env.NODE_ENV !== "production",
  });

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/callback", authLimiter);
  app.use("/api/anilist/proxy", proxyLimiter);
}
