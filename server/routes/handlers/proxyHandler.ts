import type { Request, Response, NextFunction } from 'express';
import { ANILIST_GRAPHQL_URL } from '../../constants';
import { logger } from '../../logger';
import {
  clearUserSession,
  isAniListAuthFailure,
  sendAniListTokenExpired,
} from '../../auth/clearSession';

/**
 * Proxies GraphQL requests to AniList API using stored access token.
 * Requires requireAuth middleware to set req.userId and req.anilistToken.
 */
export async function handleProxy(req: Request, res: Response, next: NextFunction) {
  const { userId, anilistToken } = req as Request & { userId?: string; anilistToken?: string };
  if (!userId || !anilistToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { query, variables } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'GraphQL query required' });
    }

    const apiRes = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${anilistToken}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    let responseBody: unknown;
    try {
      responseBody = await apiRes.json();
    } catch {
      responseBody = undefined;
    }

    if (isAniListAuthFailure(apiRes.status, responseBody)) {
      logger.warn(`[handleProxy] AniList rejected token for user ${userId}`);
      await clearUserSession(req, userId);
      return sendAniListTokenExpired(res);
    }

    if (!apiRes.ok) {
      logger.error('[handleProxy] AniList API error:', responseBody ?? apiRes.statusText);
      return res.status(502).json({ error: 'AniList API request failed' });
    }

    return res.json(responseBody);
  } catch (error) {
    logger.error('AniList proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy request to AniList' });
  }
}
