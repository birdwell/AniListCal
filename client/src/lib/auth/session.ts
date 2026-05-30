// Client auth session cache — leaf module (no anilistProxy import) to avoid circular deps.

import { queryClient } from "../queryClient";
import { queryKeys } from "../queryKeys";
import { logger } from "../logger";

export const ANILIST_TOKEN_EXPIRED_CODE = "ANILIST_TOKEN_EXPIRED";

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
