// Secure authentication utilities for AniList OAuth with API token proxy

import { CacheService } from "../cache-service";
import { queryClient } from "../queryClient";

// Constants
const API_ENDPOINTS = {
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_USER: "/api/auth/user",
  AUTH_REFRESH: "/api/auth/refresh-token",
  ANILIST_PROXY: "/api/anilist/proxy"
};

// Token refresh threshold (refresh when less than 10 minutes left)
const TOKEN_REFRESH_THRESHOLD_MS = 10 * 60 * 1000;

// Export storage keys for use in App.tsx
export const STORAGE_KEYS = {
  API_TOKEN: "api_token",
  TOKEN_EXPIRY: "api_token_expiry"
};

// Create auth-specific cache service
const authCache = new CacheService("auth_", 5);

// User interface
interface User {
  id: number;
  name: string;
  avatar: {
    medium: string;
  };
}

// Response type for the refresh token endpoint
interface RefreshTokenResponse {
  apiToken?: string;
  expiresIn?: number; // Assuming seconds
}

/**
 * Get client ID from environment
 * @returns Promise resolving to the client ID
 */
async function getClientId(): Promise<string> {
  // Try to get it from import.meta.env first
  const envClientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
  if (envClientId) {
    console.log("Using client ID from environment:", envClientId);
    return envClientId;
  }

  // If not found in env, throw an error as it's required for auth flow
  console.error("VITE_ANILIST_CLIENT_ID is not defined in the environment.");
  // Explicitly throw the error here
  throw new Error("Anilist client ID is not configured in the client environment.");
}

/**
 * Get the redirect URI for OAuth - **MUST MATCH ANILIST SETTINGS**
 * @returns The redirect URI pointing to the backend server
 */
function getRedirectUri(): string {
  // This now points to the BACKEND server endpoint that handles the callback
  // Ensure this matches the Redirect URI set in your AniList app settings
  // AND the URI used by the server when exchanging the code.
  // Using process.env.NODE_ENV to potentially switch between dev/prod backend URLs
  const backendOrigin = process.env.NODE_ENV === 'production'
    ? window.location.origin // Assuming prod backend is same origin or adjust as needed
    : 'http://localhost:3001'; // Development backend URL
  return `${backendOrigin}/api/auth/callback`;
}

/**
 * Start the login flow by redirecting to AniList
 */
export const login = async () => {
  console.log("Login function called");
  try {
    // Call and await the internal async function getClientId
    const clientId = await getClientId();
    const redirectUri = getRedirectUri();
    console.log(`Redirecting to AniList with Client ID: ${clientId} and Redirect URI: ${redirectUri}`);
    window.location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
  } catch (error) {
    console.error("Failed to initiate login:", error);
    // Re-throw the error to be caught by the caller or global handler
    throw error;
  }
};

/**
 * Get the current API token from session storage
 * @returns The API token or null if not available
 */
function getApiToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.API_TOKEN);
}

/**
 * Check if the stored API token is expired or close to expiry
 * @returns boolean
 */
function isTokenExpired(): boolean {
  const expiryString = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  const currentTime = Date.now();
  let isExpired = true; // Default to expired if no string
  let expiryTime = null;

  if (expiryString) {
    expiryTime = parseInt(expiryString, 10);
    isExpired = currentTime >= expiryTime - TOKEN_REFRESH_THRESHOLD_MS;
  }

  console.log('[isTokenExpired Check]', {
    expiryString,
    expiryTime,
    currentTime,
    threshold: TOKEN_REFRESH_THRESHOLD_MS,
    result: isExpired
  });

  return isExpired;
}

/**
 * Clear all auth-related cache and storage
 */
function clearAuthData(): void {
  console.log("Clearing client-side auth data...");
  // Clear session storage items
  sessionStorage.removeItem(STORAGE_KEYS.API_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);

  // Clear auth cache
  authCache.clear();

  // Invalidate auth-related queries
  console.log("Invalidating auth queries...");
  queryClient.invalidateQueries({ queryKey: ["auth"] });
  queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
}

/**
 * Log out the current user
 */
async function logout(): Promise<void> {
  console.log("Initiating logout...");
  const apiToken = getApiToken();
  try {
    // Construct headers conditionally
    const headers: HeadersInit = {};
    if (apiToken) {
      headers["Authorization"] = `Bearer ${apiToken}`;
      console.log("Calling server logout endpoint with API token...");
    } else {
      console.log("No API token found, calling server logout endpoint without token...");
    }

    // Call server logout endpoint
    await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
      method: "POST",
      headers: headers, // Use the conditionally constructed headers
      credentials: "include" // Include cookies if session is also used server-side
    });

  } catch (error) {
    console.error("Server logout endpoint failed:", error);
    // Continue with client-side cleanup even if server fails
  } finally {
    // Always clear client-side data on logout attempt
    clearAuthData();
  }
}

/**
 * Make an authenticated request to AniList via our server proxy
 * @param query GraphQL query
 * @param variables Query variables
 * @returns Promise resolving to the query result
 */
async function queryAniList<T = any>(
  query: string,
  variables?: any
): Promise<{ data?: T; errors?: any[] }> {
  const apiToken = getApiToken();
  const tokenIsExpired = isTokenExpired();

  // Add detailed logging before the check
  const expiryString = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  const expiryTimestamp = expiryString ? parseInt(expiryString, 10) : null;
  console.log('[queryAniList Check]', {
    apiTokenPresent: !!apiToken,
    tokenIsExpired: tokenIsExpired,
    expiryString: expiryString,
    expiryTimestamp: expiryTimestamp,
    currentTime: Date.now(),
    threshold: TOKEN_REFRESH_THRESHOLD_MS,
    checkResult: !apiToken || tokenIsExpired
  });

  if (!apiToken) {
    console.warn("[queryAniList] No API token found in session storage.");
    // Consider redirecting to login immediately?
    // setLocation('/login');
    throw new Error("Authentication required (no token)");
  }

  if (tokenIsExpired) {
    console.warn("[queryAniList] API token is expired or nearing expiry.");
    clearAuthData(); // Clear data if token is expired
    // setLocation('/login'); // Redirect to login?
    throw new Error("Authentication required (token expired)");
  }

  // Make request to our server proxy
  try {
    console.log('Sending request to AniList proxy...');
    const response = await fetch(API_ENDPOINTS.ANILIST_PROXY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiToken}` // Use the internally stored API token
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      console.error(`AniList proxy error: ${response.status} ${response.statusText}`);
      if (response.status === 401) {
        console.log("[queryAniList] Received 401 from proxy, clearing auth data.");
        clearAuthData(); // Clear data on explicit unauthorized error
        // setLocation('/login'); // Redirect to login?
        throw new Error("Authentication required (proxy returned 401)");
      }
      // Try to parse error message from backend
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) { /* ignore json parsing error */ }
      // Throw a more specific error from the proxy response
      throw new Error(errorBody?.error || `AniList API proxy error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Received response from AniList proxy.');
    // Check for GraphQL errors within the response body
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      // Handle specific GraphQL errors if needed, e.g., authentication errors
      const isAuthError = result.errors.some((err: any) => err.status === 401 || err.message?.includes('Unauthorized'));
      if (isAuthError) {
        console.log("[queryAniList] GraphQL error indicates authorization issue, clearing auth data.");
        clearAuthData();
        // setLocation('/login'); // Redirect to login?
        throw new Error("Authentication required (GraphQL auth error)");
      }
      // Throw specific GraphQL error message if not auth related
      throw new Error(`GraphQL error: ${result.errors.map((e: any) => e.message).join(', ')}`);
    }
    return result; // Contains { data: ..., errors: ... }
  } catch (error) {
    console.error("AniList query function error:", error);
    // Re-throw specific errors that were already constructed
    if (error instanceof Error && (
      error.message.startsWith("Authentication required") ||
      error.message.startsWith("AniList API proxy error:") ||
      error.message.startsWith("GraphQL error:")
    )) {
      throw error; // Re-throw the specific error
    }
    // Only wrap if it's NOT already an Error instance we expected to handle
    if (error instanceof Error) {
      // If it's an Error but not one of the specific messages, re-throw it directly
      // Or potentially wrap it if it signifies a different kind of failure
      console.warn('Caught unexpected Error instance:', error);
      throw error; // Re-throwing for now, might need refinement
    } else {
      // Wrap non-Error throwables (e.g., strings, numbers)
      throw new Error("Failed to query AniList due to unexpected issue", { cause: error });
    }
  }
}

/**
 * Get the current user's data from AniList via proxy
 */
export async function getUser(): Promise<User | null | undefined> {
  console.log('Attempting to get user data...');
  try {
    const response = await queryAniList<{ Viewer: User }>(`
      query {
        Viewer {
          id
          name
          avatar {
            medium
          }
        }
      }
    `);
    console.log('getUser response:', response);
    // If response contains data.Viewer, return it.
    // If response contains errors (like auth error handled in queryAniList), it will throw.
    // If response has neither data nor errors (unlikely), return undefined.
    return response?.data?.Viewer;
  } catch (error) {
    console.error("Failed to get user:", error);
    // If the error was an auth error from queryAniList, re-throw or handle
    if (error instanceof Error && (error.message.includes("Authentication required") || error.message.includes("Authentication expired"))) {
      // Don't throw here, let the caller (useQuery) handle it. Return null/undefined.
      return null; // Indicate user is not available due to auth issue
    }
    // For other errors, maybe re-throw or return null
    throw error; // Re-throw other unexpected errors
  }
}

/**
 * Check if user is authenticated client-side
 */
export function isAuthenticated(): boolean {
  const token = getApiToken();
  const expired = isTokenExpired(); // This will call the logged version
  const result = !!token && !expired;
  console.log(`[isAuthenticated Check]: token present=${!!token}, expired=${expired}, result=${result}`);
  return result;
}

/**
 * Refresh the API token - TODO: Needs implementation if server supports it
 */
export const refreshApiToken = async (): Promise<boolean> => {
  console.log("Attempting to refresh API token...");
  const currentToken = getApiToken();
  if (!currentToken) {
    console.error("No current API token found, cannot refresh.");
    return false;
  }

  try {
    // TODO: Implement actual refresh logic using a backend endpoint
    // This requires a backend endpoint that takes the current (potentially expired)
    // token or refresh token and returns a new one.
    console.warn("refreshApiToken function is not fully implemented.");
    // Simulate fetch call
    const response = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include Authorization if your backend requires the old token
        Authorization: `Bearer ${currentToken}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.error(`Failed to refresh token, server responded with status: ${response.status}`);
      if (response.status === 401) {
        console.warn("Refresh token invalid or expired, clearing client data.");
        clearAuthData(); // Clear data if unauthorized
      }
      return false;
    }

    const data: RefreshTokenResponse = await response.json();
    console.log("Token refresh response:", data);

    if (data.apiToken && data.expiresIn) {
      console.log("Storing refreshed API token and expiry.");
      const expiryTimestamp = Date.now() + data.expiresIn * 1000;
      sessionStorage.setItem(STORAGE_KEYS.API_TOKEN, data.apiToken);
      sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTimestamp.toString());
      // Optionally, invalidate queries that depend on auth state
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      console.log("Token refreshed successfully.");
      return true;
    } else {
      console.error("Refresh response did not contain valid apiToken and expiresIn.");
      return false;
    }
  } catch (error) {
    console.error("Error during token refresh:", error);
    return false;
  }
};

// Export individual functions and types
export {
  logout,
  getApiToken,
  clearAuthData,
  queryAniList,
  type User,
  isTokenExpired,
};