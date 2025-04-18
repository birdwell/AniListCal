import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRefreshToken } from '../refreshTokenHandler';
import { storage } from '../../../storage';

describe('handleRefreshToken', () => {
  let req: any;
  let res: any;
  beforeEach(() => {
    req = {};
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    vi.spyOn(storage, 'generateApiToken').mockReturnValue('newToken');
  });

  it('returns 401 if not authenticated', () => {
    req.userId = null;
    handleRefreshToken(req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
  });

  it('returns new token on success', () => {
    req.userId = '1';
    handleRefreshToken(req, res, () => {});
    expect(storage.generateApiToken).toHaveBeenCalledWith('1');
    expect(res.json).toHaveBeenCalledWith({ apiToken: 'newToken', expiresIn: 14400 });
  });
});
