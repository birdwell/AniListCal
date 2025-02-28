import type { Express } from "express";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import { log } from "../vite";

dotenv.config();

// Initialize OpenAI but don't use it for now
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY || "",
// });

export function registerAIRoutes(app: Express) {
  // Log a warning that OpenAI integration is disabled
  log("⚠️ OpenAI integration is currently disabled. Using mock recommendations instead.");
  
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { shows } = req.body;
      if (!Array.isArray(shows) || shows.length === 0) {
        throw new Error("Shows array is required and must not be empty");
      }

      // Return a mock response instead of calling OpenAI API
      const mockResponse = {
        recommendations: [
          {
            title: "Steins;Gate",
            reason: "This is a mock recommendation. OpenAI integration is currently disabled."
          },
          {
            title: "Fullmetal Alchemist: Brotherhood",
            reason: "This is a mock recommendation. OpenAI integration is currently disabled."
          },
          {
            title: "Hunter x Hunter",
            reason: "This is a mock recommendation. OpenAI integration is currently disabled."
          }
        ],
        message: "Note: AI recommendations are currently disabled. These are static suggestions."
      };

      // Uncomment to re-enable OpenAI integration
      /*
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
      */
      
      res.json(mockResponse);
    } catch (error: any) {
      console.error("AI recommendation error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate recommendations",
      });
    }
  });
}
