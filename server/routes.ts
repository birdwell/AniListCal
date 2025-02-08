import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWatchlistSchema } from "@shared/schema";
import OpenAI from "openai";
import express from "express";
import session from "express-session";
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '' 
});

const ANILIST_TOKEN_URL = 'https://anilist.co/api/v2/oauth/token';
const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';
const UPDATE_INTERVAL = 60000; 

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432', 10), 
});

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Import connect-pg-simple dynamically
  const { default: connectPgSimple } = await import('connect-pg-simple');
  const PostgresStore = connectPgSimple(session);

  // Set up session middleware with PostgreSQL store
  app.use(
    session({
      store: new PostgresStore({
        pool,
        tableName: 'session'
      }),
      secret: process.env.REPL_ID!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
      }
    })
  );

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/airing'
  });

  const clients: Set<WebSocket> = new Set();

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  async function broadcastAiringUpdates() {
    if (clients.size === 0) return;

    try {
      const userList = await Promise.all(
        Array.from(clients).map(async () => {
          return { anilistId: '' };
        })
      );

      const activeUsers = userList.filter(u => u.anilistId);

      if (activeUsers.length === 0) return;

      for (const user of activeUsers) {
        try {
          const shows = await fetchUserAnime(parseInt(user.anilistId));
          const airingShows = shows.filter(show =>
            show.status === "RELEASING" && show.nextAiringEpisode
          );

          const message = JSON.stringify({
            type: 'airing_update',
            data: airingShows
          });

          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
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

  setInterval(broadcastAiringUpdates, UPDATE_INTERVAL);

  app.post("/api/auth/callback", async (req, res) => {
    try {
      const { code, redirectUri } = req.body;
      if (!code) {
        throw new Error('Authorization code is required');
      }

      if (!process.env.ANILIST_CLIENT_ID || !process.env.ANILIST_CLIENT_SECRET) {
        throw new Error('Anilist client credentials are not properly configured');
      }

      const tokenResponse = await fetch(ANILIST_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.ANILIST_CLIENT_ID,
          client_secret: process.env.ANILIST_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error('Token exchange failed:', errorData);
        throw new Error(`Failed to get access token: ${errorData.message || tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();

      const userResponse = await fetch(ANILIST_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          query: `
            query {
              Viewer {
                id
                name
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

      // Store the session data
      req.session.userId = anilistUser.id;
      req.session.accessToken = tokenData.access_token;

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

      res.json({ success: true });
    } catch (error: any) {
      console.error('Auth callback error:', error);
      res.status(500).json({ error: error.message || 'Authentication failed' });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(req.session.userId.toString());
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'User not found' });
      }

      if (user.accessToken) {
        const verifyResponse = await fetch(ANILIST_GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify({
            query: `{ Viewer { id } }`,
          }),
        });

        if (!verifyResponse.ok) {
          req.session.destroy(() => {});
          await storage.updateUserByAuth0Id(user.auth0Id, { accessToken: null });
          return res.status(401).json({ error: 'Session expired' });
        }
      }

      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy(() => {
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });

  return httpServer;
}

async function fetchUserAnime(anilistId: number): Promise<any[]> {
  return [
    { id: 1, title: "Anime A", status: "RELEASING", nextAiringEpisode: { timeUntilAiring: 1234567 } },
    { id: 2, title: "Anime B", status: "FINISHED" },
    { id: 3, title: "Anime C", status: "RELEASING", nextAiringEpisode: { timeUntilAiring: 7654321 } }
  ];
}