import { users, watchlist, type User, type WatchlistItem, type InsertUser, type InsertWatchlistItem } from "@shared/schema";

export interface IStorage {
  getUser(auth0Id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;

  getWatchlist(userId: number): Promise<WatchlistItem[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  updateWatchlistItem(id: number, data: Partial<WatchlistItem>): Promise<WatchlistItem>;
  removeFromWatchlist(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private watchlist: Map<number, WatchlistItem>;
  private userId = 1;
  private watchlistId = 1;

  constructor() {
    this.users = new Map();
    this.watchlist = new Map();
  }

  async getUser(auth0Id: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.auth0Id === auth0Id);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = {
      id,
      auth0Id: userData.auth0Id,
      username: userData.username,
      anilistId: userData.anilistId || null,
      lastSync: userData.lastSync || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async getWatchlist(userId: number): Promise<WatchlistItem[]> {
    return Array.from(this.watchlist.values()).filter(item => item.userId === userId);
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const id = this.watchlistId++;
    const watchlistItem: WatchlistItem = {
      id,
      userId: item.userId,
      anilistId: item.anilistId,
      title: item.title,
      imageUrl: item.imageUrl || null,
      status: item.status,
      aiScore: item.aiScore || null,
      aiNotes: item.aiNotes || null
    };
    this.watchlist.set(id, watchlistItem);
    return watchlistItem;
  }

  async updateWatchlistItem(id: number, data: Partial<WatchlistItem>): Promise<WatchlistItem> {
    const item = this.watchlist.get(id);
    if (!item) throw new Error("Watchlist item not found");
    const updated = { ...item, ...data };
    this.watchlist.set(id, updated);
    return updated;
  }

  async removeFromWatchlist(id: number): Promise<void> {
    this.watchlist.delete(id);
  }
}

export const storage = new MemStorage();