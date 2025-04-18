import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleProxy } from '../proxyHandler';
import { storage } from '../../../storage';
import { createMockReqResNext } from './mockUtils';
import type { Request, Response, NextFunction } from 'express';
import { ANILIST_GRAPHQL_URL } from '../../../constants';

describe('handleProxy', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let resSpies: ReturnType<typeof createMockReqResNext>['resSpies'];
  let getTokenSpy: any;
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    getTokenSpy = vi.spyOn(storage, 'getToken');
    fetchSpy = vi.spyOn(globalThis, 'fetch');

    const mocks = createMockReqResNext();
    req = mocks.req;
    res = mocks.res;
    next = mocks.next;
    resSpies = mocks.resSpies;

    (req as any).anilistToken = undefined;
  });

  it('returns 401 if not authenticated (no userId)', async () => {
    await handleProxy(req, res, next);
    expect(resSpies.status).toHaveBeenCalledWith(401);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(getTokenSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 if anilistToken is missing on request', async () => {
    await handleProxy(req, res, next);
    expect(resSpies.status).toHaveBeenCalledWith(401);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
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

    expect(getTokenSpy).not.toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      ANILIST_GRAPHQL_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer token-from-middleware`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(req.body),
      }
    );
    expect(resSpies.json).toHaveBeenCalledWith(aniListResponse);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 if query is missing from request body', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = {};

    await handleProxy(req, res, next);

    expect(resSpies.status).toHaveBeenCalledWith(400);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'GraphQL query required' });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 if fetch itself throws an error', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = { query: '{ Viewer { id } }' };
    const fetchError = new Error('Network Error');

    fetchSpy.mockRejectedValue(fetchError);

    await handleProxy(req, res, next);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(resSpies.status).toHaveBeenCalledWith(500);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Failed to proxy request to AniList' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 if fetch response is not ok', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = { query: '{ Viewer { id } }' };
    const errorResponse = { errors: [{ message: 'Invalid token' }] };

    fetchSpy.mockResolvedValue({
      ok: false,
      json: async () => errorResponse,
    });

    await handleProxy(req, res, next);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(resSpies.status).toHaveBeenCalledWith(500);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Failed to proxy request to AniList' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 500 if response.json() throws an error', async () => {
    (req as any).userId = '1';
    (req as any).anilistToken = 'token-from-middleware';
    req.body = { query: '{ Viewer { id } }' };
    const jsonError = new Error('Invalid JSON');

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => { throw jsonError; },
    });

    await handleProxy(req, res, next);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(resSpies.status).toHaveBeenCalledWith(500);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Failed to proxy request to AniList' });
    expect(next).not.toHaveBeenCalled();
  });
});
