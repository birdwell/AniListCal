import type { Request, Response, NextFunction } from 'express';
import { PersistentStorage } from '../../storage';
import { logger } from '../../logger';

/**
 * Logs out the user by revoking tokens and destroying session.
 * @param storageService - The storage service instance.
 */
export async function handleLogout(
  req: Request,
  res: Response,
  next: NextFunction,
  storageService: PersistentStorage
) {
  try {
    let revokedToken = false;
    // Revoke bearer token if present
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      const token = auth.slice(7);
      logger.debug('[handleLogout] Attempting to revoke bearer token.');
      revokedToken = await storageService.revokeApiToken(token);
      logger.debug(`[handleLogout] Bearer token revoked: ${revokedToken}`);
    }

    // Revoke all tokens for this user if userId is present (might be set by validateApiToken)
    const userId = (req as any).userId;
    if (userId) {
      logger.debug(`[handleLogout] Attempting to revoke all tokens for user ${userId}.`);
      await storageService.revokeToken(userId);
      logger.debug(`[handleLogout] All tokens revoked for user ${userId}.`);
    }

    // If session-based auth, logout and destroy session
    if (req.isAuthenticated?.()) {
      logger.debug('[handleLogout] User is authenticated via session, logging out...');
      return req.logout(err => {
        if (err) {
          logger.error('[handleLogout] Passport logout error:', err);
          return next(err); // Pass error to global handler
        }
        logger.debug('[handleLogout] Passport logout successful, destroying session...');
        req.session.destroy(err2 => {
          if (err2) {
            logger.error('[handleLogout] Session destruction error:', err2);
            // Still try to clear cookie and respond
          }
          logger.debug('[handleLogout] Session destroyed, clearing cookie.');
          res.clearCookie('sid');
          return res.json({ success: true });
        });
      });
    }

    // Default response for token-based auth or if session wasn't used
    logger.debug('[handleLogout] No active session or already logged out, sending success response.');
    res.json({ success: true });

  } catch (error) {
    logger.error('[handleLogout] Error during logout:', error);
    next(error); // Pass error to global handler
  }
}
