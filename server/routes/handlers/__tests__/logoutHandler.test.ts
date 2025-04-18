import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLogout } from '../logoutHandler';
import { PersistentStorage } from '../../../storage'; // Import the *type*
import { mock, instance, when, verify, resetCalls, anyString } from '@typestrong/ts-mockito';
import { createMockReqResNext } from './mockUtils';
import type { Request, Response, NextFunction } from 'express';

describe('handleLogout', () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;
  let reqSpies: ReturnType<typeof createMockReqResNext>['reqSpies'];
  let resSpies: ReturnType<typeof createMockReqResNext>['resSpies'];
  // Declare the ts-mockito mock for PersistentStorage
  let storageMock: PersistentStorage;

  beforeEach(() => {
    // Create a new mock instance for each test
    storageMock = mock(PersistentStorage);

    // Use the shared utility
    const mocks = createMockReqResNext();
    req = mocks.req;
    res = mocks.res;
    next = mocks.next;
    reqSpies = mocks.reqSpies;
    resSpies = mocks.resSpies;

    // Reset spies from createMockReqResNext (optional, as new ones created each time)
    vi.clearAllMocks(); // Ensures vitest spies are clean
    // Re-apply necessary defaults for req/res spies if needed after clearAllMocks
    resSpies.status.mockImplementation(() => res); // Re-apply chaining for status

    // Default mock behaviors for storage (can be overridden in tests)
    // Use anyString() or specific values as needed
    when(storageMock.revokeApiToken(anyString())).thenResolve(true);
    when(storageMock.revokeToken(anyString())).thenResolve(true); // revokeToken returns boolean
  });

  it('revokes bearer token if present', async () => {
    req.headers.authorization = 'Bearer token123';
    when(storageMock.revokeApiToken('token123')).thenResolve(true); // Specific expectation

    // Pass the mock instance to the handler
    await handleLogout(req, res, next, instance(storageMock));

    verify(storageMock.revokeApiToken('token123')).once();
    expect(resSpies.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
    verify(storageMock.revokeToken(anyString())).never(); // Ensure other revoke not called
  });

  it('revokes user token if userId present', async () => {
    (req as any).userId = '1';
    when(storageMock.revokeToken('1')).thenResolve(true); // Specific expectation

    await handleLogout(req, res, next, instance(storageMock));

    verify(storageMock.revokeToken('1')).once();
    expect(resSpies.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
    verify(storageMock.revokeApiToken(anyString())).never(); // Ensure other revoke not called
  });

  it('revokes both if bearer token and userId present', async () => {
    req.headers.authorization = 'Bearer token456';
    (req as any).userId = '2';
    when(storageMock.revokeApiToken('token456')).thenResolve(true);
    when(storageMock.revokeToken('2')).thenResolve(true);

    await handleLogout(req, res, next, instance(storageMock));

    verify(storageMock.revokeApiToken('token456')).once();
    verify(storageMock.revokeToken('2')).once();
    // It proceeds to session check, then default success response
    expect(resSpies.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles session-based logout success', () => {
    reqSpies.isAuthenticated.mockReturnValue(true);
    // Mock logout and destroy to succeed
    reqSpies.logout.mockImplementation((cb: any) => cb && cb());
    reqSpies.session.destroy.mockImplementation((cb: any) => cb && cb());

    handleLogout(req, res, next, instance(storageMock)); // Pass instance

    expect(reqSpies.logout).toHaveBeenCalled();
    expect(reqSpies.session.destroy).toHaveBeenCalled();
    expect(resSpies.clearCookie).toHaveBeenCalledWith('sid');
    expect(resSpies.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
    verify(storageMock.revokeApiToken(anyString())).never();
    verify(storageMock.revokeToken(anyString())).never();
  });

  it('handles session-based logout error', () => {
    const logoutError = new Error('Logout failed');
    reqSpies.isAuthenticated.mockReturnValue(true);
    reqSpies.logout.mockImplementation((cb: any) => cb && cb(logoutError));

    handleLogout(req, res, next, instance(storageMock)); // Pass instance

    expect(reqSpies.logout).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(logoutError);
    expect(resSpies.status).not.toHaveBeenCalled();
    expect(resSpies.json).not.toHaveBeenCalled();
    verify(storageMock.revokeApiToken(anyString())).never();
    verify(storageMock.revokeToken(anyString())).never();
  });

  it('handles session destruction error', () => {
    const destroyError = new Error('Session destruction failed');
    reqSpies.isAuthenticated.mockReturnValue(true);
    reqSpies.logout.mockImplementation((cb: any) => cb && cb()); // Logout succeeds
    reqSpies.session.destroy.mockImplementation((cb: any) => cb && cb(destroyError)); // Destroy fails

    handleLogout(req, res, next, instance(storageMock)); // Pass instance

    expect(reqSpies.logout).toHaveBeenCalled();
    expect(reqSpies.session.destroy).toHaveBeenCalled();
    // Handler should still clear cookie and send success even if destroy fails
    expect(resSpies.clearCookie).toHaveBeenCalledWith('sid');
    expect(resSpies.json).toHaveBeenCalledWith({ success: true });
    expect(resSpies.status).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled(); // Error is logged, not passed to next
    verify(storageMock.revokeApiToken(anyString())).never();
    verify(storageMock.revokeToken(anyString())).never();
  });

  it('returns success for token-based auth with nothing to revoke/no session', async () => {
    // Ensure not authenticated
    reqSpies.isAuthenticated.mockReturnValue(false);

    await handleLogout(req, res, next, instance(storageMock)); // Pass instance

    verify(storageMock.revokeApiToken(anyString())).never();
    verify(storageMock.revokeToken(anyString())).never();
    expect(reqSpies.logout).not.toHaveBeenCalled(); // Should not attempt session logout
    expect(resSpies.json).toHaveBeenCalledWith({ success: true });
    expect(next).not.toHaveBeenCalled();
  });
});
