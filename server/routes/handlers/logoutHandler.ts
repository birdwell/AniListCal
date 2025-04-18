import type { Request, Response, NextFunction } from 'express';
import { PersistentStorage } from '../../storage';

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
      console.log('[handleLogout] Attempting to revoke bearer token.');
      revokedToken = await storageService.revokeApiToken(token);
      console.log(`[handleLogout] Bearer token revoked: ${revokedToken}`);
    }

    // Revoke all tokens for this user if userId is present (might be set by validateApiToken)
    const userId = (req as any).userId;
    if (userId) {
      console.log(`[handleLogout] Attempting to revoke all tokens for user ${userId}.`);
      await storageService.revokeToken(userId);
      console.log(`[handleLogout] All tokens revoked for user ${userId}.`);
    }

    // If session-based auth, logout and destroy session
    if (req.isAuthenticated?.()) {
      console.log('[handleLogout] User is authenticated via session, logging out...');
      return req.logout(err => {
        if (err) {
          console.error('[handleLogout] Passport logout error:', err);
          return next(err); // Pass error to global handler
        }
        console.log('[handleLogout] Passport logout successful, destroying session...');
        req.session.destroy(err2 => {
          if (err2) {
            console.error('[handleLogout] Session destruction error:', err2);
            // Still try to clear cookie and respond
          }
          console.log('[handleLogout] Session destroyed, clearing cookie.');
          res.clearCookie('sid');
          return res.json({ success: true });
        });
      });
    }

    // Default response for token-based auth or if session wasn't used
    console.log('[handleLogout] No active session or already logged out, sending success response.');
    res.json({ success: true });

  } catch (error) {
    console.error('[handleLogout] Error during logout:', error);
    next(error); // Pass error to global handler
  }
}
