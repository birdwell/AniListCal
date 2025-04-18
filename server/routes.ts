import type { Express } from "express";
import { registerAllRoutes } from "./routes/index";

export function registerRoutes(app: Express) {
  // Use the modular route registration system
  registerAllRoutes(app);
}
