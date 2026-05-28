import type { Express } from "express";
import { requireAuth } from "../auth/requireAuth";
import { handleGetUser } from "./handlers/getUserHandler";
import { handleGetSession } from "./handlers/sessionHandler";
import { handleProxy } from "./handlers/proxyHandler";
import { handleLogout } from "./handlers/logoutHandler";
import { storage } from "../storage";
import { passport } from "../auth/passport";
import { handleAniListCallback } from "../auth/anilistCallback";

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/session", handleGetSession);

  app.use(["/api/anilist", "/api/auth/user"], requireAuth);

  app.get("/api/auth/login", passport.authenticate("anilist"));
  app.get("/api/auth/callback", handleAniListCallback);

  app.get("/api/auth/user", handleGetUser);
  app.post("/api/anilist/proxy", handleProxy);

  app.post("/api/auth/logout", (req, res, next) => {
    handleLogout(req, res, next, storage);
  });
}
