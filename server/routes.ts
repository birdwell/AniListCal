import type { Express } from "express";
import express from "express";
import { storage, AniListUser } from "./storage";
import OpenAI from "openai";
import session, { SessionOptions } from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const PostgresStore = connectPgSimple(session);

// Initialize OpenAI with error handling for missing API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // Empty string fallback for type safety
});

const ANILIST_TOKEN_URL = "https://anilist.co/api/v2/oauth/token";
const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

// Interface for airing anime shows
interface AiringShow {
  id: number;
  title: string;
  status: string;
  episodes?: number;
  mediaListEntry?: {
    status: string;
    progress: number;
  };
  nextAiringEpisode?: {
    airingAt: number;
    episode: number;
    timeUntilAiring: number;
  };
}

// Add type declaration for Express Request.user
declare global {
  namespace Express {
    interface User extends AniListUser {}
  }
}

export function registerRoutes(app: Express, httpServer: any) {
  // Add a config endpoint for client-side setup
  app.get("/api/config", (req, res) => {
    res.json({
      clientId:
        process.env.VITE_ANILIST_CLIENT_ID || process.env.ANILIST_CLIENT_ID,
      apiEndpoints: {
        airingAnime: "/api/anime/airing",
        user: "/api/auth/user",
        callback: "/api/auth/callback",
        logout: "/api/auth/logout",
      },
    });
  });

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

  // AniList auth callback endpoint
  app.post("/api/auth/callback", async (req, res) => {
    try {
      const { code, redirectUri } = req.body;
      if (!code) {
        throw new Error("Authorization code is required");
      }

      if (
        !process.env.ANILIST_CLIENT_ID ||
        !process.env.ANILIST_CLIENT_SECRET
      ) {
        throw new Error(
          "AniList client credentials are not properly configured"
        );
      }

      // Exchange the code for a token
      const tokenPayload = {
        grant_type: "authorization_code",
        client_id: process.env.ANILIST_CLIENT_ID,
        client_secret: process.env.ANILIST_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: code,
      };

      const tokenResponse = await fetch(ANILIST_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(tokenPayload),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Token exchange failed:", errorData);
        throw new Error(
          `Failed to get access token: ${
            errorData.message || tokenResponse.statusText
          }`
        );
      }

      const tokenData = await tokenResponse.json();

      // Get user info from AniList
      const userResponse = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          query: `
            query {
              Viewer {
                id
                name
                avatar {
                  medium
                }
              }
            }
          `,
        }),
      });

      if (!userResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const userData = await userResponse.json();
      const anilistUser = userData.data.Viewer;

      // Store token in our simple storage
      storage.storeToken(anilistUser.id.toString(), tokenData.access_token);

      // Create user object for session
      const user: AniListUser = {
        id: anilistUser.id.toString(),
        username: anilistUser.name,
        accessToken: tokenData.access_token,
        anilistId: anilistUser.id.toString() // Set anilistId to match the AniList user ID
      };

      // Log the user in by establishing a session
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Failed to establish session" });
        }
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            anilistId: user.anilistId // Include anilistId in the response
          },
        });
      });
    } catch (error: any) {
      console.error("Auth callback error:", error);
      res.status(500).json({ error: error.message || "Authentication failed" });
    }
  });

  // HTML page for OAuth callback
  app.get("/auth/callback", (req, res) => {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect("/login?error=No_authorization_code_received");
    }

    console.log(
      "Received auth callback with code:",
      code.substring(0, 5) + "..."
    );

    // Send the auth code to the client for processing via the SPA router
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating...</title>
          <script>
            window.onload = function() {
              // Extract the code from the URL
              const code = "${code}";
              console.log("Got authentication code, storing temporarily...");
              
              // Store it in sessionStorage for the client-side app
              sessionStorage.setItem('auth_code', code);
              
              // Redirect to the SPA auth callback handler without the code parameter
              // Use a small timeout to ensure sessionStorage is set
              setTimeout(() => {
                console.log("Redirecting to SPA auth callback handler...");
                window.location.href = '/auth/callback-process';
              }, 100);
            }
          </script>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f9fafb;
              color: #333;
              text-align: center;
            }
            .loader {
              border: 4px solid #f3f3f3;
              border-radius: 50%;
              border-top: 4px solid #3498db;
              width: 40px;
              height: 40px;
              margin: 0 auto 20px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div>
            <div class="loader"></div>
            <p>Authenticating with AniList...</p>
          </div>
        </body>
      </html>
    `);
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    // Only return safe user info (not the token)
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      anilistId: user.anilistId
    });
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    if (req.user) {
      const user = req.user;
      storage.removeToken(user.id);
    }

    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ error: "Failed to destroy session" });
        }
        res.clearCookie("sid"); // Use the custom cookie name
        res.json({ success: true });
      });
    });
  });

  // Get current user's airing anime
  app.get("/api/anime/airing", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = req.user;

      // Query AniList API for user's anime list
      const response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: JSON.stringify({
          query: `
            query {
              MediaListCollection(userId: ${user.id}, type: ANIME, status_in: [CURRENT, PLANNING]) {
                lists {
                  status
                  entries {
                    id
                    status
                    progress
                    media {
                      id
                      title {
                        english
                        romaji
                      }
                      episodes
                      status
                      nextAiringEpisode {
                        airingAt
                        episode
                        timeUntilAiring
                      }
                    }
                  }
                }
              }
            }
          `,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch anime list");
      }

      const data = await response.json();

      // Process the data to match the format the client expects
      const processedData = {
        type: "airing_update",
        data: [] as AiringShow[],
      };

      // Extract and transform the data
      if (data?.data?.MediaListCollection?.lists) {
        const allEntries = [];
        for (const list of data.data.MediaListCollection.lists) {
          for (const entry of list.entries) {
            if (entry.media) {
              allEntries.push({
                id: entry.media.id,
                title: entry.media.title.english || entry.media.title.romaji,
                status: entry.media.status,
                episodes: entry.media.episodes,
                mediaListEntry: {
                  status: entry.status,
                  progress: entry.progress,
                },
                nextAiringEpisode: entry.media.nextAiringEpisode,
              });
            }
          }
        }
        processedData.data = allEntries;
      }

      res.json(processedData);
    } catch (error) {
      console.error("Error fetching airing anime:", error);
      res.status(500).json({ error: "Failed to fetch airing anime" });
    }
  });

  // AI recommendations endpoint
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { shows } = req.body;
      if (!Array.isArray(shows) || shows.length === 0) {
        throw new Error("Shows array is required and must not be empty");
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an anime recommendation expert. Analyze the user's watchlist and provide personalized recommendations with explanations.",
          },
          {
            role: "user",
            content: `Based on these shows: ${shows.join(
              ", "
            )}, suggest 3 anime with explanations.`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No recommendations generated");
      }

      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error("AI recommendation error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate recommendations",
      });
    }
  });

  // No need to return the httpServer since it was passed as a parameter
}
