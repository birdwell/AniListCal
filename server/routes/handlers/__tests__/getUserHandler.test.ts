import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGetUser } from '../getUserHandler';
import { storage } from '../../../storage';
import { createMockReqResNext } from './mockUtils'; // Import shared utility
import type { Request, Response, NextFunction } from 'express';

describe('handleGetUser', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let resSpies: ReturnType<typeof createMockReqResNext>['resSpies'];
  // Declare spy for storage method
  let getUserInfoSpy: any; // Using any for simplicity

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup spy on storage
    getUserInfoSpy = vi.spyOn(storage, 'getUserInfo');

    // Use shared mocks
    const mocks = createMockReqResNext();
    req = mocks.req;
    res = mocks.res;
    next = mocks.next;
    resSpies = mocks.resSpies;
  });

  it('returns 401 if not authenticated (no userId)', async () => {
    // req.userId is undefined by default in mock
    await handleGetUser(req, res, next); // Pass next
    expect(resSpies.status).toHaveBeenCalledWith(401);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(getUserInfoSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 if user not found in storage', async () => {
    (req as any).userId = '1'; // Set userId for this test
    getUserInfoSpy.mockResolvedValue(null); // Configure spy

    await handleGetUser(req, res, next);

    expect(getUserInfoSpy).toHaveBeenCalledWith('1');
    expect(resSpies.status).toHaveBeenCalledWith(404);
    expect(resSpies.json).toHaveBeenCalledWith({ error: 'User data not found in storage' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns user info on success', async () => {
    (req as any).userId = '1';
    const mockUserInfo = { username: 'test', avatarUrl: 'url' };
    getUserInfoSpy.mockResolvedValue(mockUserInfo); // Configure spy

    await handleGetUser(req, res, next);

    expect(getUserInfoSpy).toHaveBeenCalledWith('1');
    expect(resSpies.status).not.toHaveBeenCalled(); // Should be 200 OK (default)
    expect(resSpies.json).toHaveBeenCalledWith({ id: '1', username: 'test', avatarUrl: 'url' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with error if storage fails', async () => {
    (req as any).userId = '1';
    const storageError = new Error('Storage failure');
    getUserInfoSpy.mockRejectedValue(storageError); // Configure spy

    await handleGetUser(req, res, next);

    expect(getUserInfoSpy).toHaveBeenCalledWith('1');
    expect(next).toHaveBeenCalledWith(storageError);
    expect(resSpies.status).not.toHaveBeenCalled();
    expect(resSpies.json).not.toHaveBeenCalled();
  });
});
