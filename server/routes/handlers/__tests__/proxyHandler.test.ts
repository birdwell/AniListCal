import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleProxy } from '../proxyHandler';
import { storage } from '../../../storage';
import { createMockReqResNext } from './mockUtils';
import type { Request, Response, NextFunction } from 'express';
import { ANILIST_GRAPHQL_URL } from '../../../constants';
import {
  ANILIST_TOKEN_EXPIRED_CODE,
  ANILIST_TOKEN_EXPIRED_MESSAGE,
} from '../../../auth/clearSession';

vi.mock('../../../cache/aniListCache', () => ({
  getCachedProxyResponse: vi.fn().mockResolvedValue(null),
  setCachedProxyResponse: vi.fn().mockResolvedValue(undefined),
  invalidateUserAniListCache: vi.fn().mockResolvedValue(undefined),
  isGraphQLMutation: vi.fn((query: string) => /^\s*mutation\b/i.test(query)),
}));

import {
  getCachedProxyResponse,
  setCachedProxyResponse,
  invalidateUserAniListCache,
} from '../../../cache/aniListCache';

describe('handleProxy', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let resSpies: ReturnType<typeof createMockReqResNext>['resSpies'];
  let reqSpies: ReturnType<typeof createMockReqResNext>['reqSpies'];
  let revokeTokenSpy: ReturnType<typeof vi.spyOn>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCachedProxyResponse).mockResolvedValue(null);

    revokeTokenSpy = vi.spyOn(storage, 'revokeToken').mockResolvedValue(true);
    fetchSpy = vi.spyOn(globalThis, 'fetch');

    const mocks = createMockReqResNext();
    req = mocks.req;
    res = mocks.res;
    next = mocks.next;
    resSpies = mocks.resSpies;
    reqSpies = mocks.reqSpies;

    (req as any).anilistToken = undefined;
  });

  it('returns 401 if not authenticated (no userId)', async () => {
    await handleProxy(req, res, next);
    expect(resSpies.status).toHaveBeenCalledWith(401);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns cached response without calling AniList when cache hits', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = { query: '{ Viewer { id } }', variables: {} };
    const cachedResponse = { data: { Viewer: { id: 123 } } };

    vi.mocked(getCachedProxyResponse).mockResolvedValue(cachedResponse);

    await handleProxy(req, res, next);

    expect(getCachedProxyResponse).toHaveBeenCalledWith('1', '{ Viewer { id } }', {});
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(resSpies.json).toHaveBeenCalledWith(cachedResponse);
  });

  it('proxies request to AniList using req.anilistToken and returns response', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = { query: '{ Viewer { id } }', variables: { var1: 'value1' } };
    const aniListResponse = { data: { Viewer: { id: 123 } } };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => aniListResponse,
    });

    await handleProxy(req, res, next);

    expect(fetchSpy).toHaveBeenCalledWith(
      ANILIST_GRAPHQL_URL,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-from-middleware',
        }),
      })
    );
    expect(setCachedProxyResponse).toHaveBeenCalledWith(
      '1',
      '{ Viewer { id } }',
      { var1: 'value1' },
      aniListResponse
    );
    expect(resSpies.json).toHaveBeenCalledWith(aniListResponse);
  });

  it('invalidates user cache after successful mutation', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = {
      query: 'mutation Update { SaveMediaListEntry(mediaId: 1, progress: 2) { id } }',
      variables: { mediaId: 1, progress: 2 },
    };
    const mutationResponse = { data: { SaveMediaListEntry: { id: 1 } } };

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => mutationResponse,
    });

    await handleProxy(req, res, next);

    expect(setCachedProxyResponse).not.toHaveBeenCalled();
    expect(invalidateUserAniListCache).toHaveBeenCalledWith('1');
    expect(resSpies.json).toHaveBeenCalledWith(mutationResponse);
  });

  it('returns 400 if query is missing from request body', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = {};

    await handleProxy(req, res, next);

    expect(resSpies.status).toHaveBeenCalledWith(400);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'GraphQL query required' });
  });

  it('returns 401 and clears session when AniList responds with HTTP 401', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'expired-token';
    req.body = { query: '{ Viewer { id } }' };
    reqSpies.isAuthenticated.mockReturnValue(true);

    fetchSpy.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ errors: [{ message: 'Invalid token' }] }),
    });

    await handleProxy(req, res, next);

    expect(revokeTokenSpy).toHaveBeenCalledWith('1');
    expect(reqSpies.logout).toHaveBeenCalled();
    expect(resSpies.clearCookie).toHaveBeenCalledWith('sid');
    expect(resSpies.status).toHaveBeenCalledWith(401);
    expect(resSpies.json).toHaveBeenCalledWith({
      error: ANILIST_TOKEN_EXPIRED_MESSAGE,
      code: ANILIST_TOKEN_EXPIRED_CODE,
    });
  });

  it('returns 401 when AniList returns GraphQL auth errors in a 200 response', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'expired-token';
    req.body = { query: '{ Viewer { id } }' };
    reqSpies.isAuthenticated.mockReturnValue(true);

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ errors: [{ message: 'Invalid token', status: 401 }] }),
    });

    await handleProxy(req, res, next);

    expect(revokeTokenSpy).toHaveBeenCalledWith('1');
    expect(resSpies.status).toHaveBeenCalledWith(401);
    expect(resSpies.json).toHaveBeenCalledWith({
      error: ANILIST_TOKEN_EXPIRED_MESSAGE,
      code: ANILIST_TOKEN_EXPIRED_CODE,
    });
  });

  it('returns 502 if fetch response is a non-auth AniList error', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = { query: '{ Viewer { id } }' };

    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({ errors: [{ message: 'Internal error' }] }),
    });

    await handleProxy(req, res, next);

    expect(resSpies.status).toHaveBeenCalledWith(502);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'AniList API request failed' });
    expect(revokeTokenSpy).not.toHaveBeenCalled();
  });

  it('returns 500 if fetch itself throws an error', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = { query: '{ Viewer { id } }' };

    fetchSpy.mockRejectedValue(new Error('Network Error'));

    await handleProxy(req, res, next);

    expect(resSpies.status).toHaveBeenCalledWith(500);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Failed to proxy request to AniList' });
  });
});
