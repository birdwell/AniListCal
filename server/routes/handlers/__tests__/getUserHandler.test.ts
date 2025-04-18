import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleGetUser } from '../getUserHandler';
import { storage } from '../../../storage';

describe('handleGetUser', () => {
  let req: any;
  let res: any;
  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.spyOn(storage, 'getUserInfo').mockReset();
  });

  it('returns 401 if not authenticated', () => {
    req.userId = null;
    handleGetUser(req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });

  it('returns 404 if user not found', () => {
    req.userId = '1';
    storage.getUserInfo = vi.fn().mockReturnValue(null);
    handleGetUser(req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('returns user info on success', () => {
    req.userId = '1';
    storage.getUserInfo = vi.fn().mockReturnValue({ username: 'test', avatarUrl: 'url' });
    handleGetUser(req, res, () => {});
    expect(res.json).toHaveBeenCalledWith({ id: '1', username: 'test', avatarUrl: 'url' });
  });
});
