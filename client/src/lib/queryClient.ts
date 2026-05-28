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
      gcTime: 30 * 60 * 1000,
      retry: false,
      throwOnError: false,
    },
    mutations: {
      retry: false,
      throwOnError: true,
    },
  },
});
