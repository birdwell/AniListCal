import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { clearAuthData, getApiToken, refreshApiToken } from "./auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Special handling for authentication errors
    if (res.status === 401) {
      // Clear any stale auth data and trigger redirect in the UI
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
  // Check if this is an authenticated request (not login/register)
  const isAuthRequest = !url.includes("/auth/login") && !url.includes("/auth/register");

  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(isAuthRequest && getApiToken() ? { "Authorization": `Bearer ${getApiToken()}` } : {})
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Handle token refresh if needed
    if (res.status === 401 && isAuthRequest) {
      // Try to refresh the token
      const refreshed = await refreshApiToken();
      if (refreshed) {
        // Retry the original request with the new token
        return apiRequest(method, url, data);
      }
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      // Check if this is an authenticated request
      const url = queryKey[0] as string;
      const isAuthRequest = !url.includes("/auth/login") && !url.includes("/auth/register");

      try {
        const res = await fetch(url, {
          headers: isAuthRequest && getApiToken() ? {
            "Authorization": `Bearer ${getApiToken()}`
          } : {},
          credentials: "include",
        });

        // Handle token refresh if needed
        if (res.status === 401 && isAuthRequest) {
          // Try to refresh the token
          const refreshed = await refreshApiToken();
          if (refreshed) {
            // Retry the query with the new token
            const retryRes = await fetch(url, {
              headers: {
                "Authorization": `Bearer ${getApiToken()}`
              },
              credentials: "include",
            });

            if (retryRes.ok) {
              return await retryRes.json();
            }
          }
        }

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        console.error("Query function error:", error);
        throw error;
      }
    };

// Configure the QueryClient with improved caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      // Don't refetch on window focus for better UX
      refetchOnWindowFocus: false,
      // Consider data fresh for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 30 minutes (renamed from cacheTime in React Query v5)
      gcTime: 30 * 60 * 1000,
      // Don't retry failed requests automatically
      retry: false,
      // Show loading state immediately for better UX
      throwOnError: false,
    },
    mutations: {
      // Don't retry failed mutations
      retry: false,
      // Show error states immediately
      throwOnError: true,
    },
  },
});