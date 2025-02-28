import type { Express } from "express";
import { registerAllRoutes } from "./routes/index";

export function registerRoutes(app: Express, httpServer: any) {
  // Use the modular route registration system
  registerAllRoutes(app, httpServer);
}
