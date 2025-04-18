import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { ANILIST_GRAPHQL_URL, ANILIST_TOKEN_URL } from "../constants";
import { AniListUser } from "../types";
import { validateApiToken } from "./middleware";
import { handleAuthCallback } from "./handlers/authCallback";
import { handleGetUser } from "./handlers/getUserHandler";
import { handleRefreshToken } from "./handlers/refreshTokenHandler";
import { handleProxy } from "./handlers/proxyHandler";
import { handleLogout } from "./handlers/logoutHandler";

/**
 * Registers authentication and AniList proxy routes on the Express app.
 * Applies token validation middleware where appropriate.
 */
export function registerAuthRoutes(app: Express) {
  // Protect API routes
  app.use(
    ["/api/anilist", "/api/auth/user", "/api/auth/refresh-token"],
    validateApiToken
  );

  // OAuth callback endpoint - AniList redirects HERE
  app.get("/auth/callback", handleAuthCallback);

  // Session and token endpoints
  app.get("/api/auth/user", handleGetUser);
  app.post("/api/auth/refresh-token", handleRefreshToken);

  // AniList GraphQL proxy
  app.post("/api/anilist/proxy", handleProxy);

  // Logout endpoint
  app.post("/api/auth/logout", handleLogout);
}
