import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAuthCallback } from '../authCallback';
import { storage } from '../../../storage';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const fakeReq = (body = {}) => ({ body, login: vi.fn((user, cb) => cb && cb()), session: {}, headers: {} });
const fakeRes = () => {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return res;
};

describe('handleAuthCallback', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = fakeReq();
    res = fakeRes();
    next = vi.fn();
    vi.spyOn(storage, 'storeToken').mockReset();
    vi.spyOn(storage, 'storeUserInfo').mockReset();
    vi.spyOn(storage, 'generateApiToken').mockReturnValue('apitoken');
    mockFetch.mockReset();
    process.env.ANILIST_CLIENT_ID = 'id';
    process.env.ANILIST_CLIENT_SECRET = 'secret';
  });

  it('returns error if code missing', async () => {
    req.body = { code: undefined };
    await handleAuthCallback(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Authorization code is required') }));
  });

  it('returns error if client credentials missing', async () => {
    process.env.ANILIST_CLIENT_ID = '';
    await handleAuthCallback(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('AniList client credentials are not properly configured') }));
  });

  it('returns error if token fetch fails', async () => {
    req.body = { code: 'abc', redirectUri: 'uri' };
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ message: 'fail' }) });
    await handleAuthCallback(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Failed to get access token') }));
  });

  it('returns error if user fetch fails', async () => {
    req.body = { code: 'abc', redirectUri: 'uri' };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'tok' }) });
    mockFetch.mockResolvedValueOnce({ ok: false });
    await handleAuthCallback(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Failed to get user info') }));
  });

  it('handles successful callback and session', async () => {
    req.body = { code: 'abc', redirectUri: 'uri' };
    const viewer = { id: 1, name: 'bob', avatar: { medium: 'url' } };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'tok' }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { Viewer: viewer } }) });
    req.login = vi.fn((user, cb) => cb());
    await handleAuthCallback(req, res, next);
    expect(storage.storeToken).toHaveBeenCalledWith('1', 'tok');
    expect(storage.storeUserInfo).toHaveBeenCalledWith('1', 'bob', 'url');
    expect(storage.generateApiToken).toHaveBeenCalledWith('1');
    expect(req.login).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, user: { id: '1', username: 'bob', avatarUrl: 'url' }, apiToken: 'apitoken', expiresIn: 4 * 3600 }));
  });

  it('handles login error', async () => {
    req.body = { code: 'abc', redirectUri: 'uri' };
    const viewer = { id: 1, name: 'bob', avatar: { medium: 'url' } };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'tok' }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { Viewer: viewer } }) });
    req.login = vi.fn((user, cb) => cb('fail'));
    await handleAuthCallback(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to establish session' });
  });

  it('handles code and redirectUri in req.query', async () => {
    req.body = {};
    req.query = { code: 'abc', redirectUri: 'uri' };
    const viewer = { id: 1, name: 'bob', avatar: { medium: 'url' } };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ access_token: 'tok' }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { Viewer: viewer } }) });
    req.login = vi.fn((user, cb) => cb());
    await handleAuthCallback(req, res, next);
    expect(storage.storeToken).toHaveBeenCalledWith('1', 'tok');
    expect(storage.storeUserInfo).toHaveBeenCalledWith('1', 'bob', 'url');
    expect(storage.generateApiToken).toHaveBeenCalledWith('1');
    expect(req.login).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, user: { id: '1', username: 'bob', avatarUrl: 'url' }, apiToken: 'apitoken', expiresIn: 4 * 3600 }));
  });

  it('handles error without message property in catch', async () => {
    req.body = { code: 'abc', redirectUri: 'uri' };
    // Simulate error thrown without .message
    const error = { foo: 'bar' };
    const orig = global.fetch;
    global.fetch = () => { throw error; };
    await handleAuthCallback(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
    global.fetch = orig;
  });

  it('handles tokenRes error without message property', async () => {
    req.body = { code: 'abc', redirectUri: 'uri' };
    mockFetch.mockResolvedValueOnce({ ok: false, json: () => Promise.resolve({ foo: 'bar' }), statusText: 'Bad Request' });
    await handleAuthCallback(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Failed to get access token: Bad Request') }));
  });
});
