import type { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';

/**
 * Generates and returns a new API token for the authenticated user.
 * Requires validateApiToken middleware to set req.userId.
 * @param req Express Request with userId property
 * @param res Express Response
 * @param next Express NextFunction
 */
export function handleRefreshToken(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).userId;
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const apiToken = storage.generateApiToken(userId);
  return res.json({ apiToken, expiresIn: 4 * 3600 });
}
