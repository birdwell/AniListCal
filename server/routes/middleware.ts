import type { Express, Request, Response, NextFunction } from "express";
import session, { SessionOptions } from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db";
import { AniListUser } from "../types";
import { storage } from "../storage";

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

  // Configure session
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
      done(err);
    }
  });
}
