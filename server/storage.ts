import nodePersist from 'node-persist';
import { AniListToken, AniListUser } from './types';
import { decryptToken, encryptToken } from './tokenCrypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ANILIST_EXPIRES_IN_SEC = 365 * 24 * 60 * 60;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Separate from session (`anilistcal:sess:`) and API cache keys. */
export const STORAGE_REDIS_KEY_PREFIX = 'anilistcal:store:';

const Keys = {
  ANILIST_TOKEN: (userId: string) => `anilist_token_${userId}`,
  USER_INFO: (userId: string) => `user_info_${userId}`,
};

const RedisKeys = {
  ANILIST_TOKEN: (userId: string) => `${STORAGE_REDIS_KEY_PREFIX}token:${userId}`,
  USER_INFO: (userId: string) => `${STORAGE_REDIS_KEY_PREFIX}user:${userId}`,
};

interface RedisClientForStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<unknown>;
  del(key: string | string[]): Promise<unknown>;
}

export class PersistentStorage {
  private isInitialized = false;
  private redisClient?: RedisClientForStorage;
  private useRedis = false;

  constructor(redisClient?: RedisClientForStorage) {
    if (redisClient) {
      this.redisClient = redisClient;
      this.useRedis = true;
      this.isInitialized = true;
      logger.debug('[Storage] Using Redis for AniList tokens and user info.');
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.warn(
          '[Storage] REDIS_URL is not set — AniList tokens use ephemeral disk storage and will be lost on deploy. Set REDIS_URL to persist tokens alongside sessions.'
        );
      }
      void this.initializeNodePersist();
    }
  }

  private async initializeNodePersist() {
    try {
      await nodePersist.init({
        dir: path.join(__dirname, '../.persist-storage'),
        expiredInterval: CLEANUP_INTERVAL_MS,
        logging: process.env.NODE_ENV !== 'production',
      });
      this.isInitialized = true;
      logger.debug('[Storage] Using node-persist for AniList tokens (local dev).');
      setInterval(() => this.cleanupExpiredTokens(), CLEANUP_INTERVAL_MS);
    } catch (error) {
      console.error('[Storage] Failed to initialize node-persist:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      console.warn('[Storage] Waiting for initialization...');
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!this.isInitialized) {
        throw new Error('[Storage] Initialization failed or timed out.');
      }
    }
  }

  private resolveTokenTtlSeconds(expiresInSeconds?: number): number {
    if (
      typeof expiresInSeconds === 'number' &&
      Number.isFinite(expiresInSeconds) &&
      expiresInSeconds > 0
    ) {
      return Math.min(expiresInSeconds, 2 * 365 * 24 * 60 * 60);
    }
    return DEFAULT_ANILIST_EXPIRES_IN_SEC;
  }

  async storeToken(
    userId: string,
    accessToken: string,
    expiresInSeconds?: number
  ): Promise<void> {
    await this.ensureInitialized();
    const ttlSec = this.resolveTokenTtlSeconds(expiresInSeconds);
    const ttlMs = ttlSec * 1000;
    const tokenData: AniListToken = {
      userId,
      accessToken: encryptToken(accessToken),
      expiresAt: Date.now() + ttlMs,
    };

    if (this.useRedis && this.redisClient) {
      await this.redisClient.set(
        RedisKeys.ANILIST_TOKEN(userId),
        JSON.stringify(tokenData),
        { EX: ttlSec }
      );
      return;
    }

    await nodePersist.setItem(Keys.ANILIST_TOKEN(userId), tokenData, { ttl: ttlMs });
  }

  async getToken(userId: string): Promise<string | null> {
    await this.ensureInitialized();

    let tokenData: AniListToken | undefined;

    if (this.useRedis && this.redisClient) {
      const raw = await this.redisClient.get(RedisKeys.ANILIST_TOKEN(userId));
      if (!raw) return null;
      try {
        tokenData = JSON.parse(raw) as AniListToken;
      } catch (error) {
        logger.warn(`[Storage] Invalid token JSON for user ${userId}, removing.`, error);
        await this.redisClient.del(RedisKeys.ANILIST_TOKEN(userId));
        return null;
      }
    } else {
      tokenData = await nodePersist.getItem(Keys.ANILIST_TOKEN(userId));
    }

    if (!tokenData || (tokenData.expiresAt && tokenData.expiresAt < Date.now())) {
      if (tokenData) await this.revokeToken(userId);
      return null;
    }

    try {
      return decryptToken(tokenData.accessToken);
    } catch (error) {
      console.warn(`[Storage] Failed to decrypt token for user ${userId}, removing it.`, error);
      await this.revokeToken(userId);
      return null;
    }
  }

  async storeUserInfo(userId: string, username: string, avatarUrl?: string): Promise<void> {
    await this.ensureInitialized();
    const userInfo = { username, avatarUrl };

    if (this.useRedis && this.redisClient) {
      await this.redisClient.set(
        RedisKeys.USER_INFO(userId),
        JSON.stringify(userInfo)
      );
      return;
    }

    await nodePersist.setItem(Keys.USER_INFO(userId), userInfo);
  }

  async getUserInfo(userId: string): Promise<Omit<AniListUser, 'id'> | null> {
    await this.ensureInitialized();

    if (this.useRedis && this.redisClient) {
      const raw = await this.redisClient.get(RedisKeys.USER_INFO(userId));
      if (!raw) return null;
      try {
        return JSON.parse(raw) as Omit<AniListUser, 'id'>;
      } catch (error) {
        logger.warn(`[Storage] Invalid user info JSON for user ${userId}, removing.`, error);
        await this.redisClient.del(RedisKeys.USER_INFO(userId));
        return null;
      }
    }

    return (await nodePersist.getItem(Keys.USER_INFO(userId))) || null;
  }

  async revokeToken(userId: string): Promise<boolean> {
    await this.ensureInitialized();

    if (this.useRedis && this.redisClient) {
      const key = RedisKeys.ANILIST_TOKEN(userId);
      const existing = await this.redisClient.get(key);
      if (existing) {
        await this.redisClient.del(key);
        return true;
      }
      return false;
    }

    const anilistKey = Keys.ANILIST_TOKEN(userId);
    const exists = await nodePersist.getItem(anilistKey);
    if (exists) {
      await nodePersist.removeItem(anilistKey);
      return true;
    }
    return false;
  }

  async cleanupExpiredTokens(): Promise<void> {
    if (!this.isInitialized || this.useRedis) return;

    console.log('[Storage] Running explicit cleanup...');
    const now = Date.now();

    const allAnilistTokens = await nodePersist.valuesWithKeyMatch(/^anilist_token_/);
    for (const tokenData of allAnilistTokens as AniListToken[]) {
      if (tokenData.expiresAt && tokenData.expiresAt < now) {
        console.log(`[Storage] Cleaning expired AniList token for user ${tokenData.userId}`);
        await nodePersist.removeItem(Keys.ANILIST_TOKEN(tokenData.userId));
      }
    }
    console.log('[Storage] Explicit cleanup finished.');
  }
}

/** Default instance (node-persist); replaced by initStorage() when Redis is available. */
export let storage: PersistentStorage = new PersistentStorage();

/**
 * Wire AniList token storage to Redis when REDIS_URL is available (production).
 * Falls back to node-persist on disk for local dev without Redis.
 */
export function initStorage(redisClient?: RedisClientForStorage): PersistentStorage {
  storage = new PersistentStorage(redisClient);
  return storage;
}
