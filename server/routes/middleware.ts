import type { Express, Request, Response, NextFunction } from "express";
import session, { type Store } from "express-session";
import { logger } from '../logger';
import { log } from "../vite";
import rateLimit from "express-rate-limit";
import { buildSessionOptions } from "../auth/sessionConfig";
import { configurePassport, passport } from "../auth/passport";

/**
 * Middleware to handle database errors
 */
export function databaseErrorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check if it's a database-related error
  if (
    err.message &&
    (err.message.includes("database") ||
      err.message.includes("connection") ||
      err.message.includes("pool") ||
      err.message.includes("sql") ||
      err.message.includes("terminating connection"))
  ) {
    log(`Database error in request to ${req.path}: ${err.message}`);
    return res.status(503).json({
      error: "Database service unavailable",
      message: "The database is currently unavailable. Please try again later.",
    });
  }

  // For other errors, pass to the next error handler
  next(err);
}

// Add Content Security Policy middleware
export function addSecurityHeaders(app: Express) {
  app.use((req, res, next) => {
    // Skip CSP for API endpoints
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // Only apply CSP to HTML responses in production
    if (process.env.NODE_ENV === "production") {
      // Set Content Security Policy
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

// Add rate limiting middleware
export function addRateLimiting(app: Express) {
  // Apply rate limiting to all routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
    // Skip rate limiting in development
    skip: (req) => process.env.NODE_ENV !== 'production',
  });

  // Apply a stricter rate limit to authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // Limit each IP to 10 login requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts from this IP, please try again after an hour',
    // Skip rate limiting in development
    skip: (req) => process.env.NODE_ENV !== 'production',
  });

  // Apply to all requests
  app.use('/api/', apiLimiter);

  // Apply to auth endpoints
  app.use('/api/auth/', authLimiter);
}

export function registerMiddleware(app: Express, sessionStore: Store) {
  // Enable CORS for the frontend domain - this needs to come first
  app.use((req, res, next) => {
    // In production, only allow specific origins
    // In development, allow all origins
    const productionOrigins = [
      "https://anime-ai-tracker-xtjfxz26j.replit.app",
      "https://2047b52c-bec0-4945-b1b7-feb231404996-00-38qei4b1h64ey.worf.replit.dev:3000/",
      "https://anilistcal.onrender.com",
      // Add your production domain here
    ];

    const origin = req.headers.origin;
    if (process.env.NODE_ENV === "production") {
      if (origin && productionOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
    } else {
      // In development, allow any origin
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }

    // Set security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  });

  // Add security headers after CORS
  addSecurityHeaders(app);

  // Add rate limiting but exclude the config endpoint
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    skip: (req) => process.env.NODE_ENV !== 'production' || req.path === '/api/config' || req.path === '/api/health'
  });

  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts from this IP, please try again after an hour',
    skip: (req) => process.env.NODE_ENV !== 'production'
  });

  // Apply rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);

  // Configure session with error handling
  try {
    if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
      log("WARNING: No SESSION_SECRET set in production. Using a default secret is insecure.");
    }

    configurePassport();
    app.use(session(buildSessionOptions(sessionStore)) as any);
    app.use(passport.initialize() as any);
    app.use(passport.session());
  } catch (error) {
    log(`Session setup error: ${error}`);
    // Continue without session support in case of setup errors
  }

  // Add database error handling middleware at the end
  app.use(databaseErrorMiddleware);
}
