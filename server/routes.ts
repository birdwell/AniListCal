import type { Express } from "express";
import { registerAllRoutes } from "./routes/index";
import type { SessionStoreSetup } from "./auth/session";

export async function registerRoutes(app: Express): Promise<SessionStoreSetup> {
  return registerAllRoutes(app);
}
