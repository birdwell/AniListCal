import session, { type Store } from "express-session";
import MemoryStoreFactory from "memorystore";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { log } from "../vite";
import { logger } from "../logger";
import {
  buildSessionOptions,
  getSessionMaxAgeMs,
  SESSION_REDIS_KEY_PREFIX,
} from "./sessionConfig";

export type { SessionOptions } from "express-session";
export {
  buildSessionOptions,
  getSessionMaxAgeMs,
  getSessionCookieName,
} from "./sessionConfig";

export interface SessionStoreSetup {
  store: Store;
  redisClient?: ReturnType<typeof createClient>;
}

/**
 * Redis when REDIS_URL is set; otherwise in-memory (local dev only — not durable across restarts).
 */
export async function createSessionStore(): Promise<SessionStoreSetup> {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (redisUrl) {
    const redisClient = createClient({ url: redisUrl });
    redisClient.on("error", (err) => {
      logger.error("[Session] Redis client error:", err);
    });

    await redisClient.connect();
    log("[Session] Using Redis session store.");

    return {
      store: new RedisStore({
        client: redisClient,
        prefix: SESSION_REDIS_KEY_PREFIX,
        ttl: Math.ceil(getSessionMaxAgeMs() / 1000),
      }),
      redisClient,
    };
  }

  if (process.env.NODE_ENV === "production") {
    log(
      "WARNING: REDIS_URL is not set in production. Sessions use in-memory storage and will be lost on restart. Add a Redis add-on on Railway and set REDIS_URL."
    );
  } else {
    log("[Session] REDIS_URL not set — using in-memory session store (local dev).");
  }

  const MemoryStore = MemoryStoreFactory(session);
  return {
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };
}

export async function closeSessionStore(setup?: SessionStoreSetup): Promise<void> {
  if (setup?.redisClient?.isOpen) {
    await setup.redisClient.quit();
    log("[Session] Redis connection closed.");
  }
}
