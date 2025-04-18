// Secure authentication utilities for AniList OAuth with API token proxy
import { queryClient } from "./queryClient";
import { CacheService, CACHE_EXPIRY } from "./cache-service";

// Constants
const ANILIST_AUTH_URL = "https://anilist.co/api/v2/oauth/authorize";
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
  return `${backendOrigin}/auth/callback`;
}

/**
 * Start the login flow by redirecting to AniList
 */
async function login(): Promise<void> {
  try {
    // Store the redirect URI for callback validation (server handles this now)
    const redirectUri = getRedirectUri();

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
    if (apiToken) {
      console.log("Calling server logout endpoint with API token...");
      // Call server logout endpoint
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`
        },
        credentials: "include" // Include cookies if session is also used server-side
      });
    } else {
      console.log("No API token found, calling server logout endpoint without token...");
      // Fallback if no API token but maybe a session exists?
      await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
        method: "POST",
        credentials: "include" // Include cookies
      });
    }
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
      throw new Error(errorBody?.error || `AniList API proxy error: ${response.statusText}`);
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
      // Re-throw generic GraphQL errors if not auth related
      throw new Error(`GraphQL error: ${result.errors.map((e: any) => e.message).join(', ')}`);
    }
    return result; // Contains { data: ..., errors: ... }
  } catch (error) {
    console.error("AniList query function error:", error);
    // Check if the error is due to clearing auth data, if so re-throw a specific error
    if (error instanceof Error && (error.message.includes("Authentication required") || error.message.includes("Authentication expired"))) {
      throw error; // Re-throw auth specific errors
    }
    // Throw a generic error for other network/unexpected issues
    throw new Error("Failed to query AniList");
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
export async function refreshApiToken(): Promise<boolean> {
  console.warn("refreshApiToken function is not fully implemented.");
  // This needs a corresponding server endpoint (e.g., /api/auth/refresh)
  // that uses the AniList refresh token (if applicable) or re-validates the session/existing token
  // to issue a new apiToken. AniList itself doesn't support refresh tokens currently.
  // This might involve the server checking its stored AniList token validity
  // or simply re-issuing the internal apiToken if the server session is still valid.

  try {
    const currentToken = getApiToken();
    if (!currentToken) return false; // Can't refresh without a current token

    console.log("Attempting to refresh API token...");
    const response = await fetch(API_ENDPOINTS.AUTH_REFRESH, {
      method: "POST",
      credentials: "include", // Include session cookies
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentToken}` // Send current token for validation
      }
    });

    if (!response.ok) {
      console.error("Failed to refresh token, server responded with status:", response.status);
      if (response.status === 401) {
        clearAuthData(); // Clear data if refresh is unauthorized
      }
      return false; // Indicate refresh failed
    }

    const data = await response.json();
    console.log("Token refresh response:", data);

    // Store the new API token and expiry
    if (data.apiToken && data.expiresIn) {
      console.log("Storing refreshed API token and expiry.");
      sessionStorage.setItem(STORAGE_KEYS.API_TOKEN, data.apiToken);
      const expiryTime = Date.now() + (data.expiresIn * 1000);
      sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
      queryClient.invalidateQueries({ queryKey: ["auth"] }); // Invalidate auth state
      return true; // Indicate refresh succeeded
    } else {
      console.warn("Refresh response did not contain apiToken and expiresIn.");
      return false;
    }

  } catch (error) {
    console.error("Error during token refresh:", error);
    return false;
  }
}

// Export individual functions and types
export {
  login,
  logout,
  getApiToken,
  clearAuthData,
  queryAniList,
  type User,
  isTokenExpired,
};