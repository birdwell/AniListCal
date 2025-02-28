import type { Express } from "express";

export function registerConfigRoutes(app: Express) {
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
}
