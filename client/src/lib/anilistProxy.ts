// AniList GraphQL proxy transport — rate-limit circuit breaker and error handling.

import { clearAuthData, AuthError } from "./auth/session";

const ANILIST_PROXY = "/api/anilist/proxy";

interface ProxyErrorBody {
  error?: string;
  code?: string;
}

// Client-side circuit breaker for proxy rate limiting. Once the proxy returns
// 429, every in-flight query (auth, anime list, details) would otherwise keep
// hitting the rate-limited endpoint and dig the hole deeper. After one 429 we
// "open" the circuit and fail fast — without a network request — until the
// cooldown expires, honoring the server's Retry-After header when present.
const DEFAULT_RATE_LIMIT_COOLDOWN_MS = 60 * 1000;
const MAX_RATE_LIMIT_COOLDOWN_MS = 15 * 60 * 1000;
let rateLimitedUntil = 0;

const RATE_LIMIT_MESSAGE =
  "Too many requests. Please wait a moment and try again.";

function openRateLimitCircuit(retryAfterHeader: string | null): void {
  const retryAfterSeconds = Number(retryAfterHeader);
  const cooldownMs =
    Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? Math.min(retryAfterSeconds * 1000, MAX_RATE_LIMIT_COOLDOWN_MS)
      : DEFAULT_RATE_LIMIT_COOLDOWN_MS;
  rateLimitedUntil = Date.now() + cooldownMs;
}

/** Reset the rate-limit circuit (e.g. on logout so the next session starts fresh). */
export function resetRateLimitCircuit(): void {
  rateLimitedUntil = 0;
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

export async function queryAniList<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<{ data?: T; errors?: { message: string; status?: number }[] }> {
  if (Date.now() < rateLimitedUntil) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }

  const response = await fetch(ANILIST_PROXY, {
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
      openRateLimitCircuit(response.headers.get("Retry-After"));
      throw new Error(errorBody?.error || RATE_LIMIT_MESSAGE);
    }
    throw new Error(errorBody?.error || `AniList API proxy error: ${response.status}`);
  }

  rateLimitedUntil = 0;

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
