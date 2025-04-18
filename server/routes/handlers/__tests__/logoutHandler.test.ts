import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLogout } from '../logoutHandler';
import { storage } from '../../../storage';

function mockReqRes() {
  const req: any = {
    headers: {},
    isAuthenticated: undefined,
    logout: undefined,
    session: { destroy: vi.fn((cb) => cb && cb()) },
    userId: undefined
  };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    clearCookie: vi.fn()
  };
  return { req, res };
}

describe('handleLogout', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    ({ req, res } = mockReqRes());
    vi.spyOn(storage, 'revokeApiToken').mockReset();
    vi.spyOn(storage, 'revokeToken').mockReset();
  });

  it('revokes bearer token if present', () => {
    req.headers.authorization = 'Bearer token123';
    handleLogout(req, res);
    expect(storage.revokeApiToken).toHaveBeenCalledWith('token123');
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('revokes user token if userId present', () => {
    req.userId = '1';
    handleLogout(req, res);
    expect(storage.revokeToken).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('handles session-based logout success', () => {
    req.isAuthenticated = () => true;
    req.logout = vi.fn((cb) => cb());
    handleLogout(req, res);
    expect(req.logout).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('sid');
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('handles session-based logout error', () => {
    req.isAuthenticated = () => true;
    req.logout = vi.fn((cb) => cb('err'));
    handleLogout(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Logout failed' });
  });

  it('handles session destruction error', () => {
    req.isAuthenticated = () => true;
    req.logout = vi.fn((cb) => {
      req.session.destroy = (cb2) => cb2('err2');
      cb();
    });
    handleLogout(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Session destruction failed' });
  });

  it('returns success for token-based auth with nothing to revoke', () => {
    handleLogout(req, res);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
