import crypto from 'crypto';
import { AniListToken, ApiToken, AniListUser } from './types';

// Constants
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_TOKEN_EXPIRY_MS = 4 * 60 * 60 * 1000; // 4 hours
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Clean expired tokens every hour

// Storage maps
const tokenStorage = new Map<string, AniListToken>();
const apiTokenStorage = new Map<string, ApiToken>();
const userInfoStorage = new Map<string, Omit<AniListUser, 'id'>>();

/**
 * Token and user storage manager
 */
class Storage {
  // Setup cleanup interval
  constructor() {
    setInterval(() => this.cleanupExpiredTokens(), CLEANUP_INTERVAL_MS);
  }

  /**
   * Store an AniList token for a user
   */
  storeToken(userId: string, accessToken: string): void {
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;
    
    tokenStorage.set(userId, {
      userId,
      accessToken,
      expiresAt
    });
  }

  /**
   * Get an AniList token for a user
   */
  getToken(userId: string): string | null {
    const tokenData = tokenStorage.get(userId);
    
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      // Token expired or not found
      tokenStorage.delete(userId);
      return null;
    }
    
    return tokenData.accessToken;
  }

  /**
   * Store user information
   */
  storeUserInfo(userId: string, username: string, avatarUrl?: string): void {
    userInfoStorage.set(userId, { username, avatarUrl });
  }

  /**
   * Get user information
   */
  getUserInfo(userId: string): Omit<AniListUser, 'id'> | null {
    return userInfoStorage.get(userId) || null;
  }

  /**
   * Generate a new API token for a user
   */
  generateApiToken(userId: string): string {
    // Remove any existing tokens for this user
    this.revokeApiTokensForUser(userId);
    
    // Generate a new random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + API_TOKEN_EXPIRY_MS;
    
    // Store the token
    apiTokenStorage.set(token, {
      token,
      userId,
      expiresAt
    });
    
    return token;
  }

  /**
   * Validate an API token and return the associated user data
   */
  validateApiToken(token: string): ApiToken | null {
    const tokenData = apiTokenStorage.get(token);
    
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      // Token expired or not found
      if (tokenData) {
        apiTokenStorage.delete(token);
      }
      return null;
    }
    
    return tokenData;
  }

  /**
   * Revoke a specific API token
   */
  revokeApiToken(token: string): boolean {
    return apiTokenStorage.delete(token);
  }

  /**
   * Revoke all API tokens for a specific user
   */
  revokeApiTokensForUser(userId: string): void {
    Array.from(apiTokenStorage.entries()).forEach(([token, data]) => {
      if (data.userId === userId) {
        apiTokenStorage.delete(token);
      }
    });
  }

  /**
   * Revoke an AniList token
   */
  revokeToken(userId: string): boolean {
    // Revoke any API tokens for this user
    this.revokeApiTokensForUser(userId);
    
    // Revoke the AniList token
    return tokenStorage.delete(userId);
  }

  /**
   * Clean up expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    
    // Clean up AniList tokens
    Array.from(tokenStorage.entries()).forEach(([userId, tokenData]) => {
      if (tokenData.expiresAt < now) {
        tokenStorage.delete(userId);
      }
    });
    
    // Clean up API tokens
    Array.from(apiTokenStorage.entries()).forEach(([token, tokenData]) => {
      if (tokenData.expiresAt < now) {
        apiTokenStorage.delete(token);
      }
    });
  }
}

// Export a singleton instance
export const storage = new Storage();