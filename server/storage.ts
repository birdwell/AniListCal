import { users, watchlist, type User, type WatchlistItem, type InsertUser, type InsertWatchlistItem } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(auth0Id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateUserByAuth0Id(auth0Id: string, data: Partial<User>): Promise<User>;

  getWatchlist(userId: number): Promise<WatchlistItem[]>;
  addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem>;
  updateWatchlistItem(id: number, data: Partial<WatchlistItem>): Promise<WatchlistItem>;
  removeFromWatchlist(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(auth0Id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.auth0Id, auth0Id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserByAuth0Id(auth0Id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.auth0Id, auth0Id))
      .returning();
    return user;
  }

  async getWatchlist(userId: number): Promise<WatchlistItem[]> {
    return await db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId));
  }

  async addToWatchlist(item: InsertWatchlistItem): Promise<WatchlistItem> {
    const [watchlistItem] = await db
      .insert(watchlist)
      .values(item)
      .returning();
    return watchlistItem;
  }

  async updateWatchlistItem(id: number, data: Partial<WatchlistItem>): Promise<WatchlistItem> {
    const [item] = await db
      .update(watchlist)
      .set(data)
      .where(eq(watchlist.id, id))
      .returning();
    return item;
  }

  async removeFromWatchlist(id: number): Promise<void> {
    await db
      .delete(watchlist)
      .where(eq(watchlist.id, id));
  }
}

export const storage = new DatabaseStorage();