import type { Express } from "express";
import OpenAI from "openai";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI with error handling for missing API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // Empty string fallback for type safety
});

export function registerAIRoutes(app: Express) {
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
}
