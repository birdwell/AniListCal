// Secure authentication utilities for AniList OAuth with API token proxy
import { queryClient } from "./queryClient";
import { CacheService, CACHE_EXPIRY } from "./cache-service";

// Constants
const ANILIST_AUTH_URL = "https://anilist.co/api/v2/oauth/authorize";
const API_ENDPOINTS = {
  CONFIG: "/api/config",
  AUTH_CALLBACK: "/api/auth/callback",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_USER: "/api/auth/user",
  AUTH_REFRESH: "/api/auth/refresh-token",
  ANILIST_PROXY: "/api/anilist/proxy"
};

// Session storage keys
const STORAGE_KEYS = {
  CLIENT_ID: "anilist_client_id",
  AUTH_REQUEST_TIME: "auth_request_time",
  AUTH_REDIRECT_URI: "auth_redirect_uri",
  API_TOKEN: "api_token", 
  TOKEN_EXPIRY: "api_token_expiry"
};

// Token refresh threshold (refresh when less than 10 minutes left)
const TOKEN_REFRESH_THRESHOLD_MS = 10 * 60 * 1000;

// Create auth-specific cache service
const authCache = new CacheService("auth_", 5);

// User interface
export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
}

/**
 * Get client ID from environment or config endpoint
 * @returns Promise resolving to the client ID
 */
async function getClientId(): Promise<string> {
  // First check if we've cached it
  const cachedClientId = sessionStorage.getItem(STORAGE_KEYS.CLIENT_ID);
  if (cachedClientId) {
    console.log("Using cached client ID:", cachedClientId);
    return cachedClientId;
  }

  // Try to get it from import.meta.env
  const envClientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
  if (envClientId) {
    console.log("Using client ID from environment:", envClientId);
    // Cache it for future use
    sessionStorage.setItem(STORAGE_KEYS.CLIENT_ID, envClientId);
    return envClientId;
  }

  // As a fallback, fetch from server config
  try {
    console.log("Fetching client ID from server config...");
    const response = await fetch(API_ENDPOINTS.CONFIG);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    
    const config = await response.json();
    console.log("Received config from server:", config);
    
    if (!config.clientId) {
      throw new Error("Client ID not found in config response");
    }
    
    // Cache it for future use
    sessionStorage.setItem(STORAGE_KEYS.CLIENT_ID, config.clientId);
    console.log("Using client ID from server config:", config.clientId);
    return config.clientId;
  } catch (error) {
    console.error("Failed to fetch client ID from config:", error);
    throw new Error("Anilist client ID is not configured");
  }
}

/**
 * Get the redirect URI for OAuth
 * @returns The redirect URI based on current origin
 */
function getRedirectUri(): string {
  const baseUri = window.location.origin;
  return `${baseUri}/auth/callback`;
}

/**
 * Start the login flow by redirecting to AniList
 */
export async function login(): Promise<void> {
  try {
    // Store the current time for state validation
    const authRequestTime = Date.now().toString();
    sessionStorage.setItem(STORAGE_KEYS.AUTH_REQUEST_TIME, authRequestTime);
    
    // Store the redirect URI for callback validation
    const redirectUri = getRedirectUri();
    sessionStorage.setItem(STORAGE_KEYS.AUTH_REDIRECT_URI, redirectUri);
    
    // Get client ID 
    const clientId = await getClientId();
    
    // Construct authorization URL
    const authUrl = new URL(ANILIST_AUTH_URL);
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("response_type", "code");
    
    // Redirect to AniList auth page
    window.location.href = authUrl.toString();
  } catch (error) {
    console.error("Failed to initiate login:", error);
    throw error;
  }
}

/**
 * Handle the OAuth callback
 * @param code The authorization code from AniList
 * @returns Promise resolving to the auth result
 */
export async function handleAuthCallback(code: string): Promise<any> {
  try {
    // Get the stored redirect URI for validation
    const redirectUri = sessionStorage.getItem(STORAGE_KEYS.AUTH_REDIRECT_URI);
    if (!redirectUri) {
      throw new Error("Missing redirect URI in session");
    }
    
    // Exchange code for API token
    const response = await fetch(API_ENDPOINTS.AUTH_CALLBACK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        redirectUri,
      }),
      credentials: "include", // For session cookies
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to authenticate");
    }
    
    const data = await response.json();
    
    // Store the API token (not the actual AniList token)
    if (data.apiToken) {
      sessionStorage.setItem(STORAGE_KEYS.API_TOKEN, data.apiToken);
      
      // Store token expiration time
      if (data.expiresIn) {
        const expiryTime = Date.now() + (data.expiresIn * 1000);
        sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      }
    }
    
    // Invalidate any cached queries that might depend on auth state
    queryClient.invalidateQueries({ queryKey: ["auth"] });
    
    return data;
  } catch (error) {
    console.error("Auth callback error:", error);
    throw error;
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  try {
    const apiToken = getApiToken();
    
    if (apiToken) {
      // Call logout endpoint
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiToken}`
        },
        credentials: "include", // For session cookies
      });
    } else {
      // Fallback to session-based logout
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
        method: "POST",
        credentials: "include", // For session cookies
      });
    }
    
    // Clear client-side auth data
    clearAuthData();
    
    // Invalidate any cached queries
    queryClient.invalidateQueries();
    
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if server logout fails, clear client data
    clearAuthData();
    
    throw error;
  }
}

/**
 * Refresh the API token
 * @returns Promise resolving to the new API token
 */
export async function refreshApiToken(): Promise<string | null> {
  try {
    const currentToken = getApiToken();
    if (!currentToken) {
      return null;
    }
    
    const response = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentToken}`
      },
      credentials: "include",
    });
    
    if (!response.ok) {
      // If token refresh fails, clear auth data
      clearAuthData();
      return null;
    }
    
    const data = await response.json();
    
    if (data.apiToken) {
      // Update stored token
      sessionStorage.setItem(STORAGE_KEYS.API_TOKEN, data.apiToken);
      
      // Update expiration time
      if (data.expiresIn) {
        const expiryTime = Date.now() + (data.expiresIn * 1000);
        sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      }
      
      return data.apiToken;
    }
    
    return null;
  } catch (error) {
    console.error("Token refresh error:", error);
    clearAuthData();
    return null;
  }
}

/**
 * Make an authenticated request to AniList via our server proxy
 * @param query GraphQL query
 * @param variables Query variables
 * @returns Promise resolving to the query result
 */
export async function queryAniList<T = any>(query: string, variables?: any): Promise<{ data?: T; errors?: any[] }> {
  try {
    // First, ensure we have a valid token
    let apiToken = getApiToken();
    
    // Check if token needs refreshing
    const tokenExpiry = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    const expiryTime = tokenExpiry ? parseInt(tokenExpiry, 10) : 0;
    
    if (expiryTime && Date.now() > expiryTime - TOKEN_REFRESH_THRESHOLD_MS) {
      // Token is expiring soon, refresh it
      apiToken = await refreshApiToken();
    }
    
    if (!apiToken) {
      throw new Error("Not authenticated");
    }
    
    // Make request to our server proxy
    const response = await fetch(API_ENDPOINTS.ANILIST_PROXY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
    
    if (!response.ok) {
      // Check if this is an auth error
      if (response.status === 401) {
        // Clear auth data and report not authenticated
        clearAuthData();
        throw new Error("Authentication expired");
      }
      
      throw new Error(`AniList API error: ${response.statusText}`);
    }
    
    // Parse and return the GraphQL response
    return await response.json();
  } catch (error) {
    console.error("AniList query error:", error);
    throw error;
  }
}

/**
 * Get the currently logged in user
 * @returns Promise resolving to the user or null if not logged in
 */
export async function getUser(): Promise<User | null> {
  try {
    // Check for cached user data first
    const cachedUser = authCache.get<User>("current_user");
    if (cachedUser) {
      return cachedUser;
    }
    
    // Check if we have an API token
    const apiToken = getApiToken();
    if (!apiToken) {
      return null;
    }
    
    // Make request to get current user
    const response = await fetch(API_ENDPOINTS.AUTH_USER, {
      headers: {
        "Authorization": `Bearer ${apiToken}`
      },
      credentials: "include",
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Auth expired, clear data
        clearAuthData();
        return null;
      }
      
      throw new Error(`Failed to get user: ${response.statusText}`);
    }
    
    const user = await response.json();
    
    // Cache user data
    authCache.set("current_user", user, CACHE_EXPIRY.SHORT);
    
    return user;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

/**
 * Check if the user is authenticated
 * @returns Promise resolving to true if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return !!user;
}

/**
 * Get the current API token
 * @returns The API token or null if not available
 */
export function getApiToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.API_TOKEN);
}

/**
 * Clear all auth-related cache and storage
 */
export function clearAuthData(): void {
  // Clear session storage items
  sessionStorage.removeItem(STORAGE_KEYS.API_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_REQUEST_TIME);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_REDIRECT_URI);
  
  // Clear auth cache
  authCache.clear();
  
  // Invalidate auth-related queries
  queryClient.invalidateQueries({ queryKey: ["auth"] });
}

// Export auth service methods
const authService = {
  login,
  logout,
  handleAuthCallback,
  getUser,
  isAuthenticated,
  refreshApiToken,
  queryAniList,
  getApiToken,
  clearAuthData
};

export default authService;
