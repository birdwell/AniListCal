import { logger } from "../logger";

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
}

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

class MemoryCacheStore implements CacheStore {
  private entries = new Map<string, MemoryEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }
}

interface RedisClientForCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
  del(keys: string | string[]): Promise<unknown>;
  scan(
    cursor: string,
    options: { MATCH: string; COUNT: number }
  ): Promise<{ cursor: string; keys: string[] }>;
}

class RedisCacheStore implements CacheStore {
  constructor(private client: RedisClientForCache) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.set(key, value, { EX: ttlSeconds });
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    let cursor = "0";
    do {
      const result = await this.client.scan(cursor, {
        MATCH: `${prefix}*`,
        COUNT: 100,
      });
      cursor = result.cursor;
      if (result.keys.length > 0) {
        await this.client.del(result.keys);
      }
    } while (cursor !== "0");
  }
}

let cacheStore: CacheStore | null = null;

export function initCacheStore(redisClient?: RedisClientForCache): CacheStore {
  if (redisClient) {
    cacheStore = new RedisCacheStore(redisClient);
    logger.debug("[Cache] Using Redis cache store.");
  } else {
    cacheStore = new MemoryCacheStore();
    logger.debug("[Cache] Using in-memory cache store (local dev).");
  }
  return cacheStore;
}

export function getCacheStore(): CacheStore {
  if (!cacheStore) {
    cacheStore = new MemoryCacheStore();
    logger.debug("[Cache] Cache store lazily initialized (in-memory).");
  }
  return cacheStore;
}
