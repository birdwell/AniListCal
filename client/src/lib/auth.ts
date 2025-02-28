// Authentication utilities for AniList OAuth
import { queryClient } from "./queryClient";

const ANILIST_AUTH_URL = "https://anilist.co/api/v2/oauth/authorize";

// Get client ID from environment or config endpoint
async function getClientId(): Promise<string> {
  // First check if we've cached it
  const cachedClientId = sessionStorage.getItem("anilist_client_id");
  if (cachedClientId) {
    return cachedClientId;
  }

  // Try to get it from import.meta.env
  const envClientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
  if (envClientId) {
    // Cache it for future use
    sessionStorage.setItem("anilist_client_id", envClientId);
    return envClientId;
  }

  // As a fallback, fetch from server config
  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const config = await response.json();
      if (config.clientId) {
        // Cache it for future use
        sessionStorage.setItem("anilist_client_id", config.clientId);
        return config.clientId;
      }
    }
  } catch (error) {
    console.error("Failed to fetch client ID from config:", error);
  }

  throw new Error("Anilist client ID is not configured");
}

// Start the login flow
export async function login() {
  try {
    console.log("Starting Anilist OAuth flow");

    const clientId = await getClientId();
    // Use window.location.origin to dynamically determine the callback URL
    const redirectUri = `${window.location.origin}/auth/callback`;

    console.log("Using redirect URI:", redirectUri);
    console.log("Client ID exists:", !!clientId);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
    });

    const authUrl = `${ANILIST_AUTH_URL}?${params.toString()}`;
    console.log("Authorization URL:", authUrl);

    // Store the current timestamp to prevent stale responses
    sessionStorage.setItem("auth_request_time", Date.now().toString());

    // Store the redirect URI for token exchange
    sessionStorage.setItem("auth_redirect_uri", redirectUri);

    // Redirect to AniList for authentication
    window.location.href = authUrl;
  } catch (error) {
    console.error("Login initialization failed:", error);
    throw error;
  }
}

// Handle the OAuth callback
export async function handleAuthCallback(code: string): Promise<any> {
  try {
    console.log(
      "Processing auth callback with code:",
      code.substring(0, 5) + "..."
    );

    // Get the redirect URI we originally used (or use current origin as fallback)
    const redirectUri =
      sessionStorage.getItem("auth_redirect_uri") ||
      `${window.location.origin}/auth/callback`;

    // Clean up
    sessionStorage.removeItem("auth_redirect_uri");
    sessionStorage.removeItem("auth_code");

    console.log("Using redirect URI for token exchange:", redirectUri);

    const response = await fetch("/api/auth/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        redirectUri,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Auth callback error:", errorData);
      throw new Error(errorData.error || "Authentication failed");
    }

    const data = await response.json();
    console.log("Authentication successful");

    // Refresh user data
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    return data;
  } catch (error) {
    console.error("Auth callback processing failed:", error);
    throw error;
  }
}

// Log out the current user
export async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to logout");
    }

    // Clear any auth-related data from session storage
    sessionStorage.removeItem("auth_redirect_uri");

    // Clear user data from cache
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });

    // Redirect to login page
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}

// Get the currently logged in user
export async function getUser() {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated is an expected state
        return null;
      }
      throw new Error("Failed to get user info");
    }

    const userData = await response.json();

    console.log("Userdata: ", userData);

    // Store the access token in memory (not localStorage for security)
    if (userData.accessToken) {
      // We'll use this token for API requests
      console.log("Access token received");
    }

    // Return user data without exposing the token in the app state
    return {
      id: userData.id,
      username: userData.username,
      anilistId: userData.anilistId || userData.id, // Default to id if anilistId isn't set
      accessToken: userData.accessToken // Include the token for API requests
    };
  } catch (error) {
    console.error("Get user failed:", error);
    // Return null instead of throwing - more graceful
    return null;
  }
}
