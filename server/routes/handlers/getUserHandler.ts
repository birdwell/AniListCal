import type { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { logger } from '../../logger';
import { prefetchListSnapshots } from '../../cache/prefetchListSnapshots';

/**
 * Returns the current authenticated user's information.
 * Requires requireAuth middleware to set req.userId and req.anilistToken.
 *
 * Also kicks off a background warm-up of the user's list snapshots: the
 * client requests its anime list right after this call resolves, so starting
 * the AniList fetch now lets that request hit the cache (or join the
 * in-flight fetch) instead of paying the full AniList round trip.
 */
export async function handleGetUser(req: Request, res: Response, next: NextFunction) {
  const { userId, anilistToken } = req as Request & { userId?: string; anilistToken?: string };
  if (!userId) {
    // This should theoretically be caught by requireAuth first
    logger.warn('[handleGetUser] userId not found on request despite protected route.');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    logger.debug(`[handleGetUser] Fetching user info for user ${userId}...`);
    const userInfo = await storage.getUserInfo(userId);
    if (!userInfo) {
      logger.warn(`[handleGetUser] User info not found in storage for user ${userId}`);
      // Perhaps the user data wasn't stored correctly during callback?
      return res.status(404).json({ error: 'User data not found in storage' });
    }

    if (anilistToken) {
      prefetchListSnapshots(userId, anilistToken);
    }

    logger.debug(`[handleGetUser] Returning user info for user ${userId}`);
    return res.json({
      id: userId,
      username: userInfo.username,
      avatarUrl: userInfo.avatarUrl,
    });
  } catch (error) {
    logger.error(`[handleGetUser] Error fetching user info for user ${userId}:`, error);
    next(error); // Pass error to global handler
  }
}
