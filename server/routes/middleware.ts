import type { Express, Request, Response, NextFunction } from "express";
import session, { SessionOptions } from "express-session";
import passport from "passport";
import MemoryStore from 'memorystore';
import { AniListUser } from "../types";
import { storage } from "../storage";
import { log } from "../vite";
import rateLimit from "express-rate-limit";

/**
 * Middleware to validate API tokens
 */
export async function validateApiToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const tokenData = await storage.validateApiToken(token);

    if (!tokenData) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Add user info to request for use in protected routes
    req.userId = tokenData.userId;

    // Add the AniList token to the request if needed for proxy operations
    const anilistToken = await storage.getToken(tokenData.userId);
    if (anilistToken) {
      req.anilistToken = anilistToken;
    } else {
      // If the API token is valid but the underlying AniList token is gone, it's an issue
      console.warn(`[validateApiToken] Valid API token found for user ${tokenData.userId}, but no corresponding AniList token in storage.`);
      // Decide how to handle this - maybe revoke the API token?
      await storage.revokeApiToken(token); // Revoke the now useless API token
      return res.status(401).json({ error: "Associated session data missing, please log in again." });
    }

    next();
  } catch (error) {
    console.error('[validateApiToken] Error during token validation:', error);
    next(error); // Pass error to the global error handler
  }
}

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
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' https://s4.anilist.co https://img.anili.st data:",
          "font-src 'self'",
          "connect-src 'self' https://graphql.anilist.co",
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

export function registerMiddleware(app: Express) {
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
    skip: (req) => process.env.NODE_ENV !== 'production' || req.path === '/api/config'
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
    const MemoryStoreFactory = MemoryStore(session);

    // Ensure a strong session secret is set
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret && process.env.NODE_ENV === "production") {
      log("WARNING: No SESSION_SECRET set in production. Using a default secret is insecure.");
    }

    const sessionOptions: SessionOptions = {
      secret: sessionSecret || "anime-calendar-secret-do-not-use-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true, // Prevents JavaScript access to the cookie
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // CSRF protection
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
      store: new MemoryStoreFactory({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      name: "sid", // Custom cookie name
    };

    app.use(session(sessionOptions) as any);
    app.use(passport.initialize() as any);
    app.use(passport.session());

    // Configure passport
    passport.serializeUser((user: AniListUser, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        // Make storage calls async
        const token = await storage.getToken(id);
        if (!token) {
          console.log(`[Passport Deserialize] No AniList token found for user ${id}`);
          return done(null, false);
        }

        // Get user info from storage
        const userInfo = await storage.getUserInfo(id);
        if (!userInfo) {
          console.log(`[Passport Deserialize] No user info found for user ${id}`);
          return done(null, false);
        }

        const user: AniListUser = {
          id,
          username: userInfo.username,
          avatarUrl: userInfo.avatarUrl,
        };

        done(null, user);
      } catch (err) {
        log(`Passport deserialize error: ${err}`);
        done(err); // Pass the error to Passport
      }
    });
  } catch (error) {
    log(`Session setup error: ${error}`);
    // Continue without session support in case of setup errors
  }

  // Add database error handling middleware at the end
  app.use(databaseErrorMiddleware);
}
