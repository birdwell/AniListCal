import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersistentStorage } from '../storage';
import { decryptToken } from '../tokenCrypto';

const mockInit = vi.fn().mockResolvedValue(undefined);
const mockSetItem = vi.fn();
const mockGetItem = vi.fn();
const mockRemoveItem = vi.fn();
const mockClear = vi.fn();

vi.mock('node-persist', () => ({
  default: {
    init: mockInit,
    setItem: mockSetItem,
    getItem: mockGetItem,
    removeItem: mockRemoveItem,
    clear: mockClear,
    valuesWithKeyMatch: vi.fn().mockResolvedValue([]),
  },
}));

const testUserInfo = {
  userId: 123,
  userName: 'testuser',
  avatar: 'https://example.com/avatar.png',
};

const testToken = 'test-access-token';

describe('PersistentStorage', () => {
  let storage: PersistentStorage;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const storageModule = await import('../storage');
    storage = new storageModule.PersistentStorage();
    await new Promise(setImmediate);
  });

  it('should initialize node-persist on construction', () => {
    expect(mockInit).toHaveBeenCalled();
  });

  describe('AniList tokens', () => {
    it('should store an access token with TTL matching AniList expires_in', async () => {
      const expiresInSec = 3600;
      const ttl = expiresInSec * 1000;
      const userIdStr = testUserInfo.userId.toString();
      await storage.storeToken(userIdStr, testToken, expiresInSec);
      expect(mockSetItem).toHaveBeenCalledWith(
        `anilist_token_${userIdStr}`,
        expect.objectContaining({
          userId: userIdStr,
          accessToken: expect.stringMatching(/^enc:v1:/),
        }),
        { ttl }
      );

      // Stored token is encrypted at rest but round-trips back to the original.
      const storedToken = mockSetItem.mock.calls[0][1].accessToken;
      expect(storedToken).not.toBe(testToken);
      expect(decryptToken(storedToken)).toBe(testToken);
    });

    it('should retrieve a stored access token', async () => {
      const userIdStr = testUserInfo.userId.toString();
      const key = `anilist_token_${userIdStr}`;
      mockGetItem.mockResolvedValue({
        userId: userIdStr,
        accessToken: testToken,
        expiresAt: Date.now() + 3600000,
      });

      const retrievedToken = await storage.getToken(userIdStr);
      expect(mockGetItem).toHaveBeenCalledWith(key);
      expect(retrievedToken).toBe(testToken);
    });

    it('should revoke an AniList token', async () => {
      const userIdStr = testUserInfo.userId.toString();
      const anilistTokenKey = `anilist_token_${userIdStr}`;
      mockGetItem.mockResolvedValue({ userId: userIdStr, accessToken: testToken });

      const revoked = await storage.revokeToken(userIdStr);
      expect(revoked).toBe(true);
      expect(mockGetItem).toHaveBeenCalledWith(anilistTokenKey);
      expect(mockRemoveItem).toHaveBeenCalledWith(anilistTokenKey);
    });
  });

  describe('User Info', () => {
    it('should store and retrieve user info', async () => {
      const userIdStr = testUserInfo.userId.toString();
      const userInfoToStore = { username: testUserInfo.userName, avatarUrl: testUserInfo.avatar };
      await storage.storeUserInfo(userIdStr, testUserInfo.userName, testUserInfo.avatar);
      expect(mockSetItem).toHaveBeenCalledWith(`user_info_${userIdStr}`, userInfoToStore);

      mockGetItem.mockResolvedValue(userInfoToStore);
      const retrievedInfo = await storage.getUserInfo(userIdStr);
      expect(retrievedInfo).toEqual(userInfoToStore);
    });
  });
});
