import type { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';

/**
 * Returns the current authenticated user's information.
 * Requires validateApiToken middleware to set req.userId.
 * @param req Express Request with userId property
 * @param res Express Response
 * @param next Express NextFunction
 */
export async function handleGetUser(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  if (!userId) {
    // This should theoretically be caught by validateApiToken first
    console.warn('[handleGetUser] userId not found on request despite protected route.');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    console.log(`[handleGetUser] Fetching user info for user ${userId}...`);
    const userInfo = await storage.getUserInfo(userId);
    if (!userInfo) {
      console.warn(`[handleGetUser] User info not found in storage for user ${userId}`);
      // Perhaps the user data wasn't stored correctly during callback?
      return res.status(404).json({ error: 'User data not found in storage' });
    }

    console.log(`[handleGetUser] Returning user info for user ${userId}`);
    return res.json({
      id: userId,
      username: userInfo.username,
      avatarUrl: userInfo.avatarUrl,
    });
  } catch (error) {
    console.error(`[handleGetUser] Error fetching user info for user ${userId}:`, error);
    next(error); // Pass error to global handler
  }
}
