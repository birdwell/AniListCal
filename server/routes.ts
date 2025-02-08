import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWatchlistSchema } from "@shared/schema";
import OpenAI from "openai";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

// Initialize OpenAI with error handling for missing API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '' // Empty string fallback for type safety
});

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Set up session middleware
  app.use(
    session({
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: 'your-secret-key', // In production, use a proper secret from environment variables
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // Set to true if using HTTPS
    })
  );

  app.post("/api/auth/callback", async (req, res) => {
    try {
      const { code } = req.body;

      // Exchange the authorization code for an access token
      const tokenResponse = await fetch('https://anilist.co/api/v2/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.VITE_ANILIST_CLIENT_ID,
          redirect_uri: `${req.protocol}://${req.get('host')}/callback`,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const tokenData = await tokenResponse.json();

      // Get user info from Anilist
      const userResponse = await fetch('https://graphql.anilist.co', {
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

      // Store user session
      if (req.session) {
        req.session.userId = anilistUser.id;
        req.session.accessToken = tokenData.access_token;
      }

      // Create or update user in our database
      let user = await storage.getUser(anilistUser.id.toString());
      if (!user) {
        user = await storage.createUser({
          auth0Id: anilistUser.id.toString(), // We'll use this field for Anilist ID
          username: anilistUser.name,
          anilistId: anilistUser.id.toString(),
          lastSync: new Date(),
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ error: 'Authentication failed' });
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

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session?.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    try {
      const user = await storage.getUser(req.session.userId.toString());
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
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