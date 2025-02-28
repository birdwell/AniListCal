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
// Store token expiry times
const tokenExpiryStore = new Map<string, number>();

export const storage = {
  // Store a user's AniList token
  storeToken(userId: string, token: string, expiresIn?: number): void {
    tokenStore.set(userId, token);
    
    // If expiry time is provided, store it
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      tokenExpiryStore.set(userId, expiryTime);
    }
  },

  // Get a user's AniList token
  getToken(userId: string): string | undefined {
    // Check if token exists
    const token = tokenStore.get(userId);
    if (!token) return undefined;
    
    // Check if token has expired
    const expiryTime = tokenExpiryStore.get(userId);
    if (expiryTime && Date.now() > expiryTime) {
      // Token has expired, remove it
      this.removeToken(userId);
      return undefined;
    }
    
    return token;
  },

  // Remove a user's token (on logout)
  removeToken(userId: string): void {
    tokenStore.delete(userId);
    tokenExpiryStore.delete(userId);
  }
};