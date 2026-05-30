import nodePersist from 'node-persist';
import { AniListToken, AniListUser } from './types';
import { decryptToken, encryptToken } from './tokenCrypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_ANILIST_EXPIRES_IN_SEC = 365 * 24 * 60 * 60;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

const Keys = {
  ANILIST_TOKEN: (userId: string) => `anilist_token_${userId}`,
  USER_INFO: (userId: string) => `user_info_${userId}`,
};

export class PersistentStorage {
  private isInitialized = false;

  constructor() {
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      await nodePersist.init({
        dir: path.join(__dirname, '../.persist-storage'),
        expiredInterval: CLEANUP_INTERVAL_MS,
        logging: process.env.NODE_ENV !== 'production',
      });
      this.isInitialized = true;
      console.log('[Storage] node-persist initialized.');
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

  async storeToken(
    userId: string,
    accessToken: string,
    expiresInSeconds?: number
  ): Promise<void> {
    await this.ensureInitialized();
    const key = Keys.ANILIST_TOKEN(userId);
    const sec =
      typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
        ? Math.min(expiresInSeconds, 2 * 365 * 24 * 60 * 60)
        : DEFAULT_ANILIST_EXPIRES_IN_SEC;
    const ttlMs = sec * 1000;
    const tokenData: AniListToken = {
      userId,
      accessToken: encryptToken(accessToken),
      expiresAt: Date.now() + ttlMs
    };
    await nodePersist.setItem(key, tokenData, { ttl: ttlMs });
  }

  async getToken(userId: string): Promise<string | null> {
    await this.ensureInitialized();
    const key = Keys.ANILIST_TOKEN(userId);
    const tokenData: AniListToken | undefined = await nodePersist.getItem(key);

    if (!tokenData || (tokenData.expiresAt && tokenData.expiresAt < Date.now())) {
      if (tokenData) await nodePersist.removeItem(key);
      return null;
    }

    try {
      return decryptToken(tokenData.accessToken);
    } catch (error) {
      // Token can't be decrypted (e.g. SESSION_SECRET rotated). Drop it and
      // force re-authentication rather than returning a broken token.
      console.warn(`[Storage] Failed to decrypt token for user ${userId}, removing it.`, error);
      await nodePersist.removeItem(key);
      return null;
    }
  }

  async storeUserInfo(userId: string, username: string, avatarUrl?: string): Promise<void> {
    await this.ensureInitialized();
    const key = Keys.USER_INFO(userId);
    const userInfo = { username, avatarUrl };
    await nodePersist.setItem(key, userInfo);
  }

  async getUserInfo(userId: string): Promise<Omit<AniListUser, 'id'> | null> {
    await this.ensureInitialized();
    const key = Keys.USER_INFO(userId);
    return (await nodePersist.getItem(key)) || null;
  }

  async revokeToken(userId: string): Promise<boolean> {
    await this.ensureInitialized();
    const anilistKey = Keys.ANILIST_TOKEN(userId);
    const exists = await nodePersist.getItem(anilistKey);
    if (exists) {
      await nodePersist.removeItem(anilistKey);
      return true;
    }
    return false;
  }

  async cleanupExpiredTokens(): Promise<void> {
    if (!this.isInitialized) return;
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

export const storage = new PersistentStorage();
