import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWatchlistSchema } from "@shared/schema";
import OpenAI from "openai";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import passport from 'passport';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MemoryStoreSession = MemoryStore(session);
const PostgresStore = connectPgSimple(session);

// Initialize OpenAI with error handling for missing API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '' // Empty string fallback for type safety
});

const ANILIST_TOKEN_URL = 'https://anilist.co/api/v2/oauth/token';
const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';
const UPDATE_INTERVAL = 60000; // Check for updates every minute

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Enable CORS for the frontend domain
  app.use((req, res, next) => {
    const allowedOrigins = [
      'https://anime-ai-tracker-xtjfxz26j.replit.app',
      'http://localhost:5000'
    ];
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Set up session middleware with PostgreSQL store
  app.use(
    session({
      store: new PostgresStore({
        pool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.REPL_ID!, // Using REPL_ID as the session secret
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: 'auto', // Will be secure in production
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax'
      },
      name: 'sid' // Custom session cookie name
    })
  );

  // Initialize Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.auth0Id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Set up WebSocket server
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/airing'
  });

  // Track connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Broadcast updates to all connected clients
  async function broadcastAiringUpdates() {
    // Only proceed if there are connected clients
    if (clients.size === 0) return;

    try {
      // Get all users with their Anilist IDs
      const userList = await Promise.all(
        Array.from(clients).map(async () => {
          // This is a placeholder - we'll implement proper user tracking
          return { anilistId: null };
        })
      );

      // Filter out users without Anilist IDs
      const activeUsers = userList.filter(u => u.anilistId);

      if (activeUsers.length === 0) return;

      // Update each user's airing shows
      for (const user of activeUsers) {
        try {
          const shows = await fetchUserAnime(parseInt(user.anilistId));
          const airingShows = shows.filter(show =>
            show.status === "RELEASING" && show.nextAiringEpisode
          );

          // Broadcast to all clients
          const message = JSON.stringify({
            type: 'airing_update',
            data: airingShows
          });

          for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          }
        } catch (error) {
          console.error('Error fetching user anime:', error);
        }
      }
    } catch (error) {
      console.error('Error in broadcast:', error);
    }
  }

  // Start the update interval
  setInterval(broadcastAiringUpdates, UPDATE_INTERVAL);

  // Update the callback section in the post handler
  app.post("/api/auth/callback", async (req, res) => {
    try {
      const { code, redirectUri } = req.body;
      if (!code) {
        throw new Error('Authorization code is required');
      }

      if (!process.env.ANILIST_CLIENT_ID || !process.env.ANILIST_CLIENT_SECRET) {
        throw new Error('Anilist client credentials are not properly configured');
      }

      const tokenPayload = {
        grant_type: 'authorization_code',
        client_id: process.env.ANILIST_CLIENT_ID,
        client_secret: process.env.ANILIST_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: code,
      };

      const tokenResponse = await fetch(ANILIST_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(tokenPayload),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Token exchange failed:', errorData);
        throw new Error(`Failed to get access token: ${errorData.message || tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();

      // Get user info from Anilist
      const userResponse = await fetch(ANILIST_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`,
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
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();
      const anilistUser = userData.data.Viewer;

      // Create or update user in our database
      let user = await storage.getUser(anilistUser.id.toString());
      if (!user) {
        user = await storage.createUser({
          auth0Id: anilistUser.id.toString(),
          username: anilistUser.name,
          anilistId: anilistUser.id.toString(),
          lastSync: new Date(),
          accessToken: tokenData.access_token,
          avatar: anilistUser.avatar?.medium
        });
      } else {
        user = await storage.updateUserByAuth0Id(anilistUser.id.toString(), {
          lastSync: new Date(),
          accessToken: tokenData.access_token,
          avatar: anilistUser.avatar?.medium
        });
      }

      // Log the user in by establishing a session
      req.login(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ error: 'Failed to establish session' });
        }
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            anilistId: user.anilistId,
            avatar: user.avatar
          }
        });
      });

    } catch (error: any) {
      console.error('Auth callback error:', error);
      res.status(500).json({ error: error.message || 'Authentication failed' });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ error: 'Failed to destroy session' });
        }
        res.clearCookie('sid'); // Use the custom cookie name
        res.json({ success: true });
      });
    });
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Invalid request' });
    }
  });

  app.get("/api/users/:auth0Id", async (req, res) => {
    const user = await storage.getUser(req.params.auth0Id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  });

  app.post("/api/watchlist", async (req, res) => {
    try {
      const item = insertWatchlistSchema.parse(req.body);
      const watchlistItem = await storage.addToWatchlist(item);
      res.json(watchlistItem);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Invalid request' });
    }
  });

  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { shows } = req.body;
      if (!Array.isArray(shows) || shows.length === 0) {
        throw new Error('Shows array is required and must not be empty');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an anime recommendation expert. Analyze the user's watchlist and provide personalized recommendations with explanations."
          },
          {
            role: "user",
            content: `Based on these shows: ${shows.join(", ")}, suggest 3 anime with explanations.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No recommendations generated');
      }

      res.json(JSON.parse(content));
    } catch (error: any) {
      console.error('AI recommendation error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate recommendations'
      });
    }
  });

  return httpServer;
}

// Placeholder function - needs actual implementation
async function fetchUserAnime(anilistId: number): Promise<any[]> {
  // Replace with your actual Anilist API call to fetch user's anime list
  // This example returns a mock array
  return [
    { id: 1, title: "Anime A", status: "RELEASING", nextAiringEpisode: { timeUntilAiring: 1234567 } },
    { id: 2, title: "Anime B", status: "FINISHED" },
    { id: 3, title: "Anime C", status: "RELEASING", nextAiringEpisode: { timeUntilAiring: 7654321 } }
  ];
}