import type { Express } from "express";
import session, { SessionOptions } from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../db";
import { AniListUser, storage } from "../storage";

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
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
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
      // Only get the token, which is all we need
      const token = storage.getToken(id);
      if (!token) {
        return done(null, false);
      }

      // Return minimal user object with token
      const user: AniListUser = {
        id,
        username: "", // We can fetch this from AniList API if needed
        accessToken: token,
        anilistId: id  // Set anilistId to match the AniList user ID
      };

      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}
