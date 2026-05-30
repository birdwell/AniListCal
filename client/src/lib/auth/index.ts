// Session-cookie authentication — AniList tokens stay on the server.

import { queryClient, PERSIST_QUERY_KEY } from "../queryClient";
import { queryKeys } from "../queryKeys";
import { logger } from "../logger";

const API_ENDPOINTS = {
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_SESSION: "/api/auth/session",
  ANILIST_PROXY: "/api/anilist/proxy",
};

export const ANILIST_TOKEN_EXPIRED_CODE = "ANILIST_TOKEN_EXPIRED";

const AUTH_FETCH_INIT: RequestInit = {
  credentials: "include",
};

interface User {
  id: number;
  name: string;
  avatar: {
    medium: string;
  };
}

interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

interface ProxyErrorBody {
  error?: string;
  code?: string;
}

export class AuthError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

/**
 * Mark the user as logged out after a 401/expired token.
 *
 * We deliberately use `setQueryData` instead of `invalidateQueries`: this runs
 * from inside the auth query's own error path, and invalidating would
 * immediately refetch it, hit another 401, and re-enter here — an infinite
 * refetch loop that storms the proxy until the rate limiter returns 429.
 * Writing `null` clears the user without scheduling any network request.
 */
export function clearAuthData(): void {
  logger.log("Clearing client auth cache...");
  queryClient.setQueryData(queryKeys.authUser, null);
}

/** Redirect to server OAuth login (sets HttpOnly session cookie on callback). */
export function login(): void {
  window.location.href = API_ENDPOINTS.AUTH_LOGIN;
}

export async function logout(): Promise<void> {
  try {
    await fetch(API_ENDPOINTS.AUTH_LOGOUT, {
      method: "POST",
      ...AUTH_FETCH_INIT,
    });
  } catch (error) {
    logger.error("Server logout endpoint failed:", error);
  } finally {
    // Always tear down local state and redirect, even if the request failed
    // (e.g. a 429). Don't depend on a query refetch to detect the logout.
    queryClient.clear();
    try {
      window.localStorage.removeItem(PERSIST_QUERY_KEY);
    } catch {
      // localStorage may be unavailable (private mode); ignore.
    }
    window.location.href = "/login";
  }
}

export async function checkSession(): Promise<boolean> {
  try {
    const response = await fetch(API_ENDPOINTS.AUTH_SESSION, AUTH_FETCH_INIT);
    if (!response.ok) {
      return false;
    }
    const data: SessionResponse = await response.json();
    return data.authenticated === true;
  } catch (error) {
    logger.error("Session check failed:", error);
    return false;
  }
}

async function parseProxyError(response: Response): Promise<ProxyErrorBody | undefined> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function throwAuthError(message: string, code?: string): never {
  clearAuthData();
  throw new AuthError(message, code);
}

async function queryAniList<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: T; errors?: { message: string; status?: number }[] }> {
  const response = await fetch(API_ENDPOINTS.ANILIST_PROXY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorBody = await parseProxyError(response);
    if (response.status === 401) {
      throwAuthError(
        errorBody?.error || "Authentication required",
        errorBody?.code
      );
    }
    if (response.status === 429) {
      throw new Error(
        errorBody?.error || "Too many requests. Please wait a moment and try again."
      );
    }
    throw new Error(errorBody?.error || `AniList API proxy error: ${response.status}`);
  }

  const result = await response.json();

  if (result.errors) {
    const isAuthError = result.errors.some(
      (err: { status?: number; message?: string }) =>
        err.status === 401 || err.message?.includes("Unauthorized")
    );
    if (isAuthError) {
      throwAuthError("Authentication required");
    }
    throw new Error(`GraphQL error: ${result.errors.map((e: { message: string }) => e.message).join(", ")}`);
  }

  return result;
}

export async function getUser(): Promise<User | null | undefined> {
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
    return response?.data?.Viewer;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw error;
  }
}

export { queryAniList, type User };
