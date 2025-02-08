import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertWatchlistSchema } from "@shared/schema";
import OpenAI from "openai";

// Initialize OpenAI with error handling for missing API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || '' // Empty string fallback for type safety
});

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

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

  app.get("/api/watchlist/:userId", async (req, res) => {
    const items = await storage.getWatchlist(parseInt(req.params.userId));
    res.json(items);
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
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
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