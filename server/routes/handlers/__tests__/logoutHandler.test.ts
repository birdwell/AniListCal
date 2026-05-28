import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLogout } from '../logoutHandler';
import { PersistentStorage } from '../../../storage';
import { mock, instance, when, verify, anyString } from '@typestrong/ts-mockito';
import { createMockReqResNext } from './mockUtils';
import type { Request, Response, NextFunction } from 'express';

describe('handleLogout', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let reqSpies: ReturnType<typeof createMockReqResNext>['reqSpies'];
  let resSpies: ReturnType<typeof createMockReqResNext>['resSpies'];
  let storageMock: PersistentStorage;

  beforeEach(() => {
    storageMock = mock(PersistentStorage);
    const mocks = createMockReqResNext();
    req = mocks.req;
    res = mocks.res;
    next = mocks.next;
    reqSpies = mocks.reqSpies;
    resSpies = mocks.resSpies;
    vi.clearAllMocks();
    resSpies.status.mockImplementation(() => res);
    when(storageMock.revokeToken(anyString())).thenResolve(true);
  });

  it('revokes AniList token and destroys session when authenticated', async () => {
    req.user = { id: '1', username: 'test' };
    reqSpies.isAuthenticated.mockReturnValue(true);
    reqSpies.logout.mockImplementation((cb: (err?: Error) => void) => cb && cb());
    reqSpies.session.destroy.mockImplementation((cb: (err?: Error) => void) => cb && cb());

    await handleLogout(req, res, next, instance(storageMock));

    verify(storageMock.revokeToken('1')).once();
    expect(reqSpies.logout).toHaveBeenCalled();
    expect(reqSpies.session.destroy).toHaveBeenCalled();
    expect(resSpies.clearCookie).toHaveBeenCalledWith('sid');
    expect(resSpies.json).toHaveBeenCalledWith({ success: true });
  });

  it('returns success when not authenticated', async () => {
    reqSpies.isAuthenticated.mockReturnValue(false);

    await handleLogout(req, res, next, instance(storageMock));

    verify(storageMock.revokeToken(anyString())).never();
    expect(resSpies.json).toHaveBeenCalledWith({ success: true });
  });

  it('passes logout errors to next', async () => {
    req.user = { id: '1', username: 'test' };
    reqSpies.isAuthenticated.mockReturnValue(true);
    const logoutError = new Error('Logout failed');
    reqSpies.logout.mockImplementation((cb: (err?: Error) => void) => cb && cb(logoutError));

    await handleLogout(req, res, next, instance(storageMock));

    expect(next).toHaveBeenCalledWith(logoutError);
  });
});
