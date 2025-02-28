import type { Express, Request, Response, NextFunction } from "express";
import session, { SessionOptions } from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db";
import { AniListUser } from "../types";
import { storage } from "../storage";
import { log } from "../vite";

/**
 * Middleware to validate API tokens
 */
export function validateApiToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const tokenData = storage.validateApiToken(token);
  
  if (!tokenData) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  // Add user info to request for use in protected routes
  req.userId = tokenData.userId;
  
  // Add the AniList token to the request if needed for proxy operations
  const anilistToken = storage.getToken(tokenData.userId);
  if (anilistToken) {
    req.anilistToken = anilistToken;
  }
  
  next();
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
      message: "The database is currently unavailable. Please try again later."
    });
  }
  
  // For other errors, pass to the next error handler
  next(err);
}

export function registerMiddleware(app: Express) {
  // Enable CORS for the frontend domain
  app.use((req, res, next) => {
    const allowedOrigins = [
      "https://anime-ai-tracker-xtjfxz26j.replit.app",
      "http://localhost:5000",
      "http://localhost:5001",
      "http://localhost:4173", // Vite preview server
    ];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
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

  // Configure session with error handling
  try {
    const PostgresStore = connectPgSimple(session);

    const sessionOptions: SessionOptions = {
      secret: process.env.SESSION_SECRET || "anime-calendar-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
      store: new PostgresStore({
        pool: pool as any,
        tableName: "session",
        errorCallback: (error: Error) => {
          log(`Session store error: ${error.message}`);
          // Don't crash the server on session store errors
        }
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
        const token = storage.getToken(id);
        if (!token) {
          return done(null, false);
        }

        // Get user info from storage
        const userInfo = storage.getUserInfo(id);
        if (!userInfo) {
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
        done(null, false); // Continue without user instead of failing
      }
    });
  } catch (error) {
    log(`Session setup error: ${error}`);
    // Continue without session support in case of setup errors
  }

  // Add database error handling middleware at the end
  app.use(databaseErrorMiddleware);
}
