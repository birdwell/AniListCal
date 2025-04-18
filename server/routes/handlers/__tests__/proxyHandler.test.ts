import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleProxy } from '../proxyHandler';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('handleProxy', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = { body: {}, userId: '1', anilistToken: 'token' };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
    mockFetch.mockReset();
  });

  it('returns 401 if not authenticated', async () => {
    req.userId = undefined;
    await handleProxy(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });

  it('returns 400 if query missing', async () => {
    req.body = {};
    await handleProxy(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'GraphQL query required' });
  });

  it('proxies request and returns data', async () => {
    req.body = { query: '{foo}', variables: { a: 1 } };
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ data: 123 }), ok: true });
    await handleProxy(req, res, next);
    expect(mockFetch).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ data: 123 });
  });

  it('handles fetch error', async () => {
    req.body = { query: '{foo}' };
    mockFetch.mockRejectedValue(new Error('fail'));
    await handleProxy(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to proxy request to AniList' });
  });

  it('handles non-ok fetch', async () => {
    req.body = { query: '{foo}' };
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ error: 'bad' }), ok: false });
    await handleProxy(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ error: 'bad' });
  });
});
