import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { clearAuthData } from "./auth";
import { logger } from "./logger";

const AUTH_FETCH_INIT: RequestInit = {
  credentials: "include",
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      clearAuthData();
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      ...AUTH_FETCH_INIT,
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    logger.error("API request error:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const url = queryKey[0] as string;

      try {
        const res = await fetch(url, AUTH_FETCH_INIT);

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          clearAuthData();
          return null;
        }

        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        logger.error("Query function error:", error);
        throw error;
      }
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: false,
      throwOnError: false,
    },
    mutations: {
      retry: false,
      throwOnError: true,
    },
  },
});

/** localStorage key for the persisted React Query cache. */
export const PERSIST_QUERY_KEY = "anilistcal-query-cache";

/** Matches server list snapshot TTL — persisted client cache max age. */
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Bumped to v3 to discard any persisted `null` auth user written by the old
// build (which caused freshly logged-in sessions to look logged out).
export const PERSIST_BUSTER = "v3";

export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  // Only persist anime data for offline/instant display. Auth state is never
  // persisted: the server session is the source of truth and must be
  // re-verified via getUser on every load. Persisting a `null` user (written
  // by clearAuthData) would make a freshly logged-in session look logged out.
  return queryKey[0] === "/anilist/anime";
}
