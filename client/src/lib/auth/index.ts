// Session-cookie authentication — AniList tokens stay on the server.

import { queryClient, PERSIST_QUERY_KEY } from "../queryClient";
import { logger } from "../logger";
import { queryAniList, resetRateLimitCircuit } from "../anilistProxy";
import {
  ANILIST_TOKEN_EXPIRED_CODE,
  AuthError,
  clearAuthData,
} from "./session";

export { ANILIST_TOKEN_EXPIRED_CODE, AuthError, clearAuthData };

const API_ENDPOINTS = {
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_SESSION: "/api/auth/session",
};

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
    resetRateLimitCircuit();
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

export { type User };
