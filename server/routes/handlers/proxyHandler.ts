import type { Request, Response, NextFunction } from 'express';
import { ANILIST_GRAPHQL_URL } from '../../constants';

/**
 * Proxies GraphQL requests to AniList API using stored access token.
 * Requires validateApiToken middleware to set req.userId and req.anilistToken.
 * @param req Express Request with body { query, variables }
 * @param res Express Response
 * @param next Express NextFunction
 */
export async function handleProxy(req: Request, res: Response, next: NextFunction) {
  const { userId, anilistToken } = req as any;
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
      headers: { 'Content-Type':'application/json','Accept':'application/json', 'Authorization': `Bearer ${anilistToken}` },
      body: JSON.stringify({ query, variables }),
    });
    const data = await apiRes.json();
    return res.json(data);
  } catch (error: any) {
    console.error('AniList proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy request to AniList' });
  }
}
