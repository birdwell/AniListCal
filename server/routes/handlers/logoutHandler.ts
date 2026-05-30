import type { Request, Response, NextFunction } from 'express';
import { PersistentStorage } from '../../storage';
import { logger } from '../../logger';
import { getSessionCookieName } from '../../auth/sessionConfig';
import { invalidateUserAniListCache } from '../../cache/aniListCache';

export async function handleLogout(
  req: Request,
  res: Response,
  next: NextFunction,
  storageService: PersistentStorage
) {
  try {
    const userId = req.user?.id ?? (req as { userId?: string }).userId;

    if (userId) {
      logger.debug(`[handleLogout] Revoking AniList token for user ${userId}.`);
      await storageService.revokeToken(userId);
      await invalidateUserAniListCache(userId);
    }

    if (req.isAuthenticated?.()) {
      logger.debug('[handleLogout] Destroying session...');
      return req.logout(err => {
        if (err) {
          logger.error('[handleLogout] Passport logout error:', err);
          return next(err);
        }
        req.session.destroy(err2 => {
          if (err2) {
            logger.error('[handleLogout] Session destruction error:', err2);
          }
          res.clearCookie(getSessionCookieName());
          return res.json({ success: true });
        });
      });
    }

    res.clearCookie(getSessionCookieName());
    res.json({ success: true });
  } catch (error) {
    logger.error('[handleLogout] Error during logout:', error);
    next(error);
  }
}
