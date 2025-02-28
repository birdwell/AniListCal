import type { Express } from "express";
import express from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWatchlistSchema } from "@shared/schema";
import OpenAI from "openai";
import session, { SessionOptions } from "express-session";
import { WebSocketServer, WebSocket as WS } from 'ws';
import passport from 'passport';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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

  // Add a config endpoint for client-side setup
  app.get("/api/config", (req, res) => {
    res.json({
      websocketPath: '/ws/airing',
      clientId: process.env.VITE_ANILIST_CLIENT_ID || process.env.ANILIST_CLIENT_ID
    });
  });

  // Enable CORS for the frontend domain
  app.use((req, res, next) => {
    const allowedOrigins = [
      'https://anime-ai-tracker-xtjfxz26j.replit.app',
      'http://localhost:5000',
      'http://localhost:5001',
      'http://localhost:4173' // Vite preview server
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

  // Update the cookie settings and session store configuration
  const sessionConfig: SessionOptions = {
      store: new PostgresStore({
        pool: pool as any, // Type assertion to bypass the type incompatibility
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.REPL_ID || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
      },
      name: 'sid'
    };
    
  app.use(session(sessionConfig) as any);

  app.use(passport.initialize() as any);
  app.use(passport.session() as any);
  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.auth0Id); // Use auth0Id for consistency
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
  const clients = new Set<WS>();

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
          const shows = await fetchUserAnime(parseInt(user.anilistId || "0"));
          const airingShows = shows.filter(show =>
            show.status === "RELEASING" && show.nextAiringEpisode
          );

          // Broadcast to all clients
          const message = JSON.stringify({
            type: 'airing_update',
            data: airingShows
          });

          // Convert Set to Array before iteration to avoid TypeScript errors
          Array.from(clients).forEach(client => {
            if (client.readyState === WS.OPEN) {
              client.send(message);
            }
          });
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
        });
      } else {
        user = await storage.updateUserByAuth0Id(anilistUser.id.toString(), {
          lastSync: new Date(),
          accessToken: tokenData.access_token,
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
          }
        });
      });

    } catch (error: any) {
      console.error('Auth callback error:', error);
      res.status(500).json({ error: error.message || 'Authentication failed' });
    }
  });

  app.get("/auth/callback", (req, res) => {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect('/login?error=No_authorization_code_received');
    }
    
    console.log('Received auth callback with code:', code.substring(0, 5) + '...');
    
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
              
              // Redirect to the SPA router's auth callback route
              // Use a small timeout to ensure sessionStorage is set
              setTimeout(() => {
                console.log("Redirecting to SPA auth callback handler...");
                window.location.href = '/auth/callback';
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

  app.get("/debug/ws-status", (req, res) => {
    res.json({
      clients: clients.size
    });
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