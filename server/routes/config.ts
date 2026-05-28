import type { Express } from "express";

export function registerConfigRoutes(app: Express) {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
}
