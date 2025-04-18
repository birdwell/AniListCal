import type { Express } from "express";
import { log } from "../vite";

export function registerConfigRoutes(app: Express) {
  app.get("/api/config", (req, res) => {
    const clientId = process.env.VITE_ANILIST_CLIENT_ID || process.env.ANILIST_CLIENT_ID;

    // Log environment variables for debugging
    log('Environment variables:');
    log(`VITE_ANILIST_CLIENT_ID: ${process.env.VITE_ANILIST_CLIENT_ID || 'not set'}`);
    log(`ANILIST_CLIENT_ID: ${process.env.ANILIST_CLIENT_ID || 'not set'}`);

    // Log the client ID being sent
    log(`Providing client ID to frontend: ${clientId ? 'Set (length: ' + clientId.length + ')' : 'Not set'}`);

    // Set proper content type
    res.setHeader('Content-Type', 'application/json');

    // Send response
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
