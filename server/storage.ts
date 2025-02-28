// Simplified storage that just handles AniList auth tokens

// User type to store only what we need
export interface AniListUser {
  id: string;        // AniList user ID 
  username: string;  // AniList username
  accessToken: string; // AniList access token
  anilistId: string; // AniList ID - same as id but explicitly for client use
}

// In-memory token storage - in a production app you'd use Redis or similar
const tokenStore = new Map<string, string>();

export const storage = {
  // Store a user's AniList token
  storeToken(userId: string, token: string): void {
    tokenStore.set(userId, token);
  },

  // Get a user's AniList token
  getToken(userId: string): string | undefined {
    return tokenStore.get(userId);
  },

  // Remove a user's token (on logout)
  removeToken(userId: string): void {
    tokenStore.delete(userId);
  }
};