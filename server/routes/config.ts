import type { Express } from "express";
import { log } from "../vite";

export function registerConfigRoutes(app: Express) {
  app.get("/api/config", (req, res) => {
    const clientId = process.env.VITE_ANILIST_CLIENT_ID || process.env.ANILIST_CLIENT_ID;
    
    // Log the client ID for debugging
    log(`Providing client ID to frontend: ${clientId ? 'Set (length: ' + clientId.length + ')' : 'Not set'}`);
    
    res.json({
      clientId,
      apiEndpoints: {
        user: "/api/auth/user",
        callback: "/api/auth/callback",
        logout: "/api/auth/logout",
      },
    });
  });
}
