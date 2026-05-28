// Session-cookie authentication — AniList tokens stay on the server.

import { queryClient } from "../queryClient";
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

function invalidateAuthQueries(): void {
  queryClient.invalidateQueries({ queryKey: ["auth"] });
  queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
  queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
}

/** Clear client-side auth cache after logout or 401. */
export function clearAuthData(): void {
  logger.log("Clearing client auth cache...");
  invalidateAuthQueries();
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
    clearAuthData();
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
