import crypto from 'crypto';
import nodePersist from 'node-persist';
import { AniListToken, ApiToken, AniListUser } from './types';
import path from 'path';
import { fileURLToPath } from 'url'; // Import necessary function

// Calculate __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AniList OAuth access tokens are long-lived (docs: ~1 year). Persist for the full `expires_in` from the
// token response, with this fallback if the field is missing.
const DEFAULT_ANILIST_EXPIRES_IN_SEC = 365 * 24 * 60 * 60;

// Internal proxy API token: sliding session length (client refresh extends). Override via env in production.
const API_TOKEN_EXPIRY_MS =
  Number.parseInt(process.env.INTERNAL_API_TOKEN_TTL_MS || '', 10) ||
  30 * 24 * 60 * 60 * 1000; // 30 days default

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Clean expired tokens every hour

/** Exposed for auth callback redirect hash and JSON responses */
export function getInternalApiTokenExpiresInSeconds(): number {
  return Math.floor(API_TOKEN_EXPIRY_MS / 1000);
}

// Storage Keys (prefixes for node-persist)
const Keys = {
  ANILIST_TOKEN: (userId: string) => `anilist_token_${userId}`,
  API_TOKEN: (token: string) => `api_token_${token}`,
  USER_INFO: (userId: string) => `user_info_${userId}`,
  API_TOKEN_BY_USER: (userId: string) => `api_tokens_by_user_${userId}` // To track tokens per user
};

/**
 * Token and user storage manager using node-persist
 */
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
      // Start periodic cleanup manually just in case interval isn't reliable on all platforms
      setInterval(() => this.cleanupExpiredTokens(), CLEANUP_INTERVAL_MS);
    } catch (error) {
      console.error('[Storage] Failed to initialize node-persist:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      console.warn('[Storage] Waiting for initialization...');
      // Basic wait loop - consider a more robust promise-based approach if needed
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!this.isInitialized) {
        throw new Error('[Storage] Initialization failed or timed out.');
      }
    }
  }

  /**
   * Store an AniList access token. Pass `expiresInSeconds` from the OAuth token response
   * (`expires_in`); when omitted, uses the documented ~1 year default.
   */
  async storeToken(
    userId: string,
    accessToken: string,
    expiresInSeconds?: number
  ): Promise<void> {
    await this.ensureInitialized();
    const key = Keys.ANILIST_TOKEN(userId);
    const sec =
      typeof expiresInSeconds === 'number' && Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
        ? Math.min(expiresInSeconds, 2 * 365 * 24 * 60 * 60) // safety cap: 2 years
        : DEFAULT_ANILIST_EXPIRES_IN_SEC;
    const ttlMs = sec * 1000;
    const tokenData: AniListToken = {
      userId,
      accessToken,
      expiresAt: Date.now() + ttlMs
    };
    await nodePersist.setItem(key, tokenData, { ttl: ttlMs });
  }

  /** Get an AniList token for a user */
  async getToken(userId: string): Promise<string | null> {
    await this.ensureInitialized();
    const key = Keys.ANILIST_TOKEN(userId);
    const tokenData: AniListToken | undefined = await nodePersist.getItem(key);

    // node-persist handles expiry automatically, but double check just in case
    if (!tokenData || (tokenData.expiresAt && tokenData.expiresAt < Date.now())) {
      if (tokenData) await nodePersist.removeItem(key);
      return null;
    }
    return tokenData.accessToken;
  }

  /** Store user information */
  async storeUserInfo(userId: string, username: string, avatarUrl?: string): Promise<void> {
    await this.ensureInitialized();
    const key = Keys.USER_INFO(userId);
    const userInfo = { username, avatarUrl };
    await nodePersist.setItem(key, userInfo);
  }

  /** Get user information */
  async getUserInfo(userId: string): Promise<Omit<AniListUser, 'id'> | null> {
    await this.ensureInitialized();
    const key = Keys.USER_INFO(userId);
    return (await nodePersist.getItem(key)) || null;
  }

  /** Generate a new API token for a user */
  async generateApiToken(userId: string): Promise<string> {
    await this.ensureInitialized();
    await this.revokeApiTokensForUser(userId); // Ensure only one active token per user

    const token = crypto.randomBytes(32).toString('hex');
    const key = Keys.API_TOKEN(token);
    const tokenData: ApiToken = {
      token,
      userId,
      expiresAt: Date.now() + API_TOKEN_EXPIRY_MS
    };

    // Store the main token data with TTL
    await nodePersist.setItem(key, tokenData, { ttl: API_TOKEN_EXPIRY_MS });

    // Store a reference for the user to find this token
    const userTokensKey = Keys.API_TOKEN_BY_USER(userId);
    const currentTokens: string[] = (await nodePersist.getItem(userTokensKey)) || [];
    currentTokens.push(token);
    // Store this reference without TTL, cleanup handles it
    await nodePersist.setItem(userTokensKey, currentTokens);

    return token;
  }

  /** Validate an API token and return the associated user data */
  async validateApiToken(token: string): Promise<ApiToken | null> {
    await this.ensureInitialized();
    const key = Keys.API_TOKEN(token);
    const tokenData: ApiToken | undefined = await nodePersist.getItem(key);

    // node-persist handles expiry, but double check
    if (!tokenData || (tokenData.expiresAt && tokenData.expiresAt < Date.now())) {
      if (tokenData) await this.removeApiTokenReferences(token, tokenData.userId);
      return null;
    }
    return tokenData;
  }

  /** Revoke a specific API token */
  async revokeApiToken(token: string): Promise<boolean> {
    await this.ensureInitialized();
    const key = Keys.API_TOKEN(token);
    const tokenData: ApiToken | undefined = await nodePersist.getItem(key);
    if (tokenData) {
      await this.removeApiTokenReferences(token, tokenData.userId);
      return true;
    }
    return false;
  }

  /** Revoke all API tokens for a specific user */
  async revokeApiTokensForUser(userId: string): Promise<void> {
    await this.ensureInitialized();
    const userTokensKey = Keys.API_TOKEN_BY_USER(userId);
    const tokens: string[] | undefined = await nodePersist.getItem(userTokensKey);

    if (tokens && tokens.length > 0) {
      for (const token of tokens) {
        await nodePersist.removeItem(Keys.API_TOKEN(token));
      }
      await nodePersist.removeItem(userTokensKey);
    }
  }

  /** Revoke an AniList token and associated API tokens */
  async revokeToken(userId: string): Promise<boolean> {
    await this.ensureInitialized();
    await this.revokeApiTokensForUser(userId); // Also revokes API tokens
    const anilistKey = Keys.ANILIST_TOKEN(userId);
    const exists = await nodePersist.getItem(anilistKey);
    if (exists) {
      await nodePersist.removeItem(anilistKey);
      return true;
    }
    return false;
  }

  // Helper to remove token references when deleting/expiring
  private async removeApiTokenReferences(token: string, userId: string) {
    await nodePersist.removeItem(Keys.API_TOKEN(token));
    const userTokensKey = Keys.API_TOKEN_BY_USER(userId);
    const currentTokens: string[] | undefined = await nodePersist.getItem(userTokensKey);
    if (currentTokens) {
      const updatedTokens = currentTokens.filter(t => t !== token);
      if (updatedTokens.length > 0) {
        await nodePersist.setItem(userTokensKey, updatedTokens);
      } else {
        await nodePersist.removeItem(userTokensKey);
      }
    }
  }

  /**
   * Clean up expired tokens explicitly (complementary to node-persist interval)
   */
  async cleanupExpiredTokens(): Promise<void> {
    if (!this.isInitialized) return;
    console.log('[Storage] Running explicit cleanup...');
    const now = Date.now();

    // node-persist should handle this via TTL, but we can be extra sure
    const allApiTokens = await nodePersist.valuesWithKeyMatch(/^api_token_/);
    for (const tokenData of allApiTokens as ApiToken[]) {
      if (tokenData.expiresAt && tokenData.expiresAt < now) {
        console.log(`[Storage] Cleaning expired API token for user ${tokenData.userId}`);
        await this.removeApiTokenReferences(tokenData.token, tokenData.userId);
      }
    }

    const allAnilistTokens = await nodePersist.valuesWithKeyMatch(/^anilist_token_/);
    for (const tokenData of allAnilistTokens as AniListToken[]) {
      if (tokenData.expiresAt && tokenData.expiresAt < now) {
        console.log(`[Storage] Cleaning expired AniList token for user ${tokenData.userId}`);
        await nodePersist.removeItem(Keys.ANILIST_TOKEN(tokenData.userId));
        // Optionally revoke associated API tokens if not already done
        // await this.revokeApiTokensForUser(tokenData.userId);
      }
    }
    console.log('[Storage] Explicit cleanup finished.');
  }
}

// Export a singleton instance
export const storage = new PersistentStorage();