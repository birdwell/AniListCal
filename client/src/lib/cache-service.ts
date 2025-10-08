/**
 * Cache service for storing and retrieving data from localStorage
 * Provides a generic way to cache any type of data with expiration
 */

import { logger } from './logger';

// Default cache expiration times (in milliseconds)
export const CACHE_EXPIRY = {
  SHORT: 5 * 60 * 1000,        // 5 minutes
  MEDIUM: 30 * 60 * 1000,      // 30 minutes
  LONG: 24 * 60 * 60 * 1000,   // 24 hours
  WEEK: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class CacheService {
  private prefix: string;
  private maxEntries: number;

  /**
   * Create a new cache service
   * @param prefix Prefix for all cache keys to avoid collisions
   * @param maxEntries Maximum number of entries to keep in this cache
   */
  constructor(prefix: string, maxEntries = 20) {
    this.prefix = prefix;
    this.maxEntries = maxEntries;
  }

  /**
   * Generate a storage key with the service prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get all keys in this cache
   */
  private getAllKeys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix));
  }

  /**
   * Set an item in the cache
   * @param key Unique identifier for the item
   * @param data Data to store
   * @param expiryMs Time in milliseconds until the cache expires
   */
  set<T>(key: string, data: T, expiryMs: number): void {
    try {
      const storageKey = this.getKey(key);
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: expiryMs
      };
      
      localStorage.setItem(storageKey, JSON.stringify(entry));
      
      // Manage cache size
      this.pruneCache();
    } catch (error) {
      logger.error(`Error saving to cache (${key}):`, error);
    }
  }

  /**
   * Get an item from the cache
   * @param key Unique identifier for the item
   * @returns The cached data, or null if not found or expired
   */
  get<T>(key: string): T | null {
    try {
      const storageKey = this.getKey(key);
      const json = localStorage.getItem(storageKey);
      
      if (!json) return null;
      
      const entry = JSON.parse(json) as CacheEntry<T>;
      const now = Date.now();
      
      // Check if entry has expired
      if (now - entry.timestamp > entry.expiry) {
        // Remove expired entry
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      logger.error(`Error reading from cache (${key}):`, error);
      return null;
    }
  }

  /**
   * Remove an item from the cache
   * @param key Unique identifier for the item
   */
  remove(key: string): void {
    try {
      const storageKey = this.getKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      logger.error(`Error removing from cache (${key}):`, error);
    }
  }

  /**
   * Clear all items in this cache
   */
  clear(): void {
    try {
      const keys = this.getAllKeys();
      keys.forEach(key => localStorage.removeItem(key));
      logger.debug(`Cleared ${keys.length} items from ${this.prefix} cache`);
    } catch (error) {
      logger.error(`Error clearing cache:`, error);
    }
  }

  /**
   * Prune the cache to stay within the maximum number of entries
   * Removes oldest entries first
   */
  private pruneCache(): void {
    try {
      const keys = this.getAllKeys();
      
      if (keys.length <= this.maxEntries) return;
      
      // Get all entries with their timestamps
      const entries = keys.map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          return { key, timestamp: data.timestamp || 0 };
        } catch {
          return { key, timestamp: 0 };
        }
      });
      
      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);
      
      // Remove oldest entries to stay within limit
      const keysToRemove = entries
        .slice(0, entries.length - this.maxEntries)
        .map(entry => entry.key);
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      logger.debug(`Pruned ${keysToRemove.length} old entries from ${this.prefix} cache`);
    } catch (error) {
      logger.error('Error pruning cache:', error);
    }
  }
}

// Create and export cache instances for different data types
export const animeListCache = new CacheService('anilist_list_', 10);
export const animeDetailsCache = new CacheService('anilist_media_', 30);
