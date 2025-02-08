import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  auth0Id: text("auth0_id").notNull().unique(),
  anilistId: text("anilist_id"),
  username: text("username").notNull(),
  lastSync: timestamp("last_sync"),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  anilistId: integer("anilist_id").notNull(),
  title: text("title").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull(), // watching, completed, planned
  aiScore: integer("ai_score"),
  aiNotes: text("ai_notes"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertWatchlistSchema = createInsertSchema(watchlist).omit({ id: true });

export type User = typeof users.$inferSelect;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistSchema>;
