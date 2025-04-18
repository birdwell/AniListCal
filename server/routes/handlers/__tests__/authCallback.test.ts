import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { handleAuthCallback } from '../authCallback';
import { storage } from '../../../storage';
import { createMockReqResNext } from './mockUtils';
import type { Request, Response, NextFunction } from 'express';
import { ANILIST_TOKEN_URL, ANILIST_GRAPHQL_URL } from '../../../constants';

// Mock environment variables needed by the handler
process.env.ANILIST_CLIENT_ID = 'mockClientId';
process.env.ANILIST_CLIENT_SECRET = 'mockClientSecret';
// Mock frontend URL if needed for redirect tests
// process.env.FRONTEND_URL = 'http://mockfrontend.com';

describe('handleAuthCallback', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let resSpies: ReturnType<typeof createMockReqResNext>['resSpies'];
  let storeTokenSpy: any;
  let fetchMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    storeTokenSpy = vi.spyOn(storage, 'storeToken').mockResolvedValue(undefined);
    fetchMock = vi.fn();

    const mocks = createMockReqResNext();
    req = mocks.req;
    res = mocks.res;
    next = mocks.next;
    resSpies = mocks.resSpies;
  });

  it('redirects to frontend error on missing code', async () => {
    req.query = {};
    await handleAuthCallback(req, res, next, fetchMock);
    expect(resSpies.redirect).toHaveBeenCalledWith(expect.stringContaining('#authError=Authorization%20code%20is%20required%20from%20AniList%20redirect'));
    expect(storeTokenSpy).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects to frontend error on AniList token exchange failure (non-OK response)', async () => {
    req.query = { code: 'testcode', state: 'samestate' };
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error_description: 'Invalid code' })
    });

    await handleAuthCallback(req, res, next, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(ANILIST_TOKEN_URL, expect.anything());
    expect(resSpies.redirect).toHaveBeenCalledWith(expect.stringContaining('#authError=Failed%20to%20get%20access%20token'));
    expect(storeTokenSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects to frontend error if fetch itself throws during token exchange', async () => {
    req.query = { code: 'testcode', state: 'samestate' };
    const fetchError = new Error('Network Failed');
    fetchMock.mockRejectedValueOnce(fetchError);

    await handleAuthCallback(req, res, next, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(ANILIST_TOKEN_URL, expect.anything());
    expect(resSpies.redirect).toHaveBeenCalledWith(expect.stringContaining('#authError=Network%20Failed'));
    expect(storeTokenSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('redirects to frontend error on AniList user fetch failure', async () => {
    req.query = { code: 'testcode', state: 'samestate' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'anilist_token', expires_in: 3600 }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => ({ message: 'Internal Server Error' })
    });

    await handleAuthCallback(req, res, next, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, ANILIST_TOKEN_URL, expect.anything());
    expect(fetchMock).toHaveBeenNthCalledWith(2, ANILIST_GRAPHQL_URL, expect.anything());
    expect(resSpies.redirect).toHaveBeenCalledWith(expect.stringContaining('#authError=Failed%20to%20get%20user%20info'));
    expect(storeTokenSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('handles error storing token (after successful fetches)', async () => {
    req.query = { code: 'testcode', state: 'samestate' };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'anilist_token', expires_in: 3600 }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { Viewer: { id: 123, name: 'TestUser', avatar: { medium: 'url' } } } })
    });
    const storeError = new Error('Storage failed');
    storeTokenSpy.mockRejectedValue(storeError);

    await handleAuthCallback(req, res, next, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(storeTokenSpy).toHaveBeenCalledWith('123', 'anilist_token');
    expect(resSpies.redirect).toHaveBeenCalledWith(expect.stringContaining('#authError=Storage%20failed'));
    expect(next).not.toHaveBeenCalled();
  });

  it('successfully exchanges code, fetches user, stores token, generates API token, and redirects', async () => {
    req.query = { code: 'testcode', state: 'samestate' };
    const tokenPayload = { access_token: 'anilist_token', expires_in: 3600 };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => tokenPayload });
    const userPayload = { data: { Viewer: { id: 123, name: 'TestUser', avatar: { medium: 'avatar_url' } } } };
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => userPayload });
    const generateApiTokenSpy = vi.spyOn(storage, 'generateApiToken').mockResolvedValue('internal-api-token');
    const storeUserInfoSpy = vi.spyOn(storage, 'storeUserInfo').mockResolvedValue(undefined);

    await handleAuthCallback(req, res, next, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(1, ANILIST_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ grant_type: 'authorization_code', client_id: 'mockClientId', client_secret: 'mockClientSecret', redirect_uri: 'http://localhost:3001/auth/callback', code: 'testcode' })
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: 'Bearer anilist_token' },
      body: JSON.stringify({ query: `query { Viewer { id name avatar { medium } } }` })
    });
    expect(storeTokenSpy).toHaveBeenCalledWith('123', 'anilist_token');
    expect(storeUserInfoSpy).toHaveBeenCalledWith('123', 'TestUser', 'avatar_url');
    expect(generateApiTokenSpy).toHaveBeenCalledWith('123');
    expect(resSpies.redirect).toHaveBeenCalledWith('http://localhost:5001/#apiToken=internal-api-token&expiresIn=14400');
    expect(next).not.toHaveBeenCalled();
  });
});
