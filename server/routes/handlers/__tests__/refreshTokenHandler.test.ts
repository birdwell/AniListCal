import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRefreshToken } from '../refreshTokenHandler';
import { storage } from '../../../storage';
import { createMockReqResNext } from './mockUtils';
import type { Request, Response, NextFunction } from 'express';

describe('handleRefreshToken', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let resSpies: ReturnType<typeof createMockReqResNext>['resSpies'];
  let generateApiTokenSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    generateApiTokenSpy = vi.spyOn(storage, 'generateApiToken');

    const mocks = createMockReqResNext();
    req = mocks.req;
    res = mocks.res;
    next = mocks.next;
    resSpies = mocks.resSpies;
  });

  it('returns 401 if not authenticated (no userId)', async () => {
    await handleRefreshToken(req, res, next);
    expect(resSpies.status).toHaveBeenCalledWith(401);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(generateApiTokenSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns new API token on success', async () => {
    (req as any).userId = 'user123';
    const newApiToken = 'new-token-abc';
    generateApiTokenSpy.mockResolvedValue(newApiToken);

    await handleRefreshToken(req, res, next);

    expect(generateApiTokenSpy).toHaveBeenCalledWith('user123');
    expect(resSpies.json).toHaveBeenCalledWith({
      success: true,
      apiToken: newApiToken,
      expiresIn: 86400,
    });
    expect(resSpies.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error if token generation fails', async () => {
    (req as any).userId = 'user123';
    const tokenError = new Error('Token generation failed');
    generateApiTokenSpy.mockRejectedValue(tokenError);

    await handleRefreshToken(req, res, next);

    expect(generateApiTokenSpy).toHaveBeenCalledWith('user123');
    expect(next).toHaveBeenCalledWith(tokenError);
    expect(resSpies.status).not.toHaveBeenCalled();
    expect(resSpies.json).not.toHaveBeenCalled();
  });
});
