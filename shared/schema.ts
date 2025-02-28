// This schema file has been simplified to focus only on session management.
// We now directly use the AniList API for all user and anime data.

// User type for session storage, to avoid circular imports this is duplicated from server/storage.ts
export interface AniListUser {
  id: string;        // AniList user ID 
  username: string;  // AniList username
  accessToken: string; // AniList access token
}