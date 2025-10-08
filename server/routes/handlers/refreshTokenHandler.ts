import type { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { logger } from '../../logger';

/**
 * Generates and returns a new API token for the authenticated user.
 * Requires validateApiToken middleware to set req.userId.
 * @param req Express Request with userId property
 * @param res Express Response
 * @param next Express NextFunction
 */
export async function handleRefreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const apiToken = await storage.generateApiToken(userId);
    return res.json({ success: true, apiToken, expiresIn: 24 * 3600 });

  } catch (error) {
    logger.error('[handleRefreshToken] Error generating token:', error);
    next(error);
  }
}
