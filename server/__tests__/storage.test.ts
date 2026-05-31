import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decryptToken } from '../tokenCrypto';

const {
  mockInit,
  mockSetItem,
  mockGetItem,
  mockRemoveItem,
} = vi.hoisted(() => ({
  mockInit: vi.fn().mockResolvedValue(undefined),
  mockSetItem: vi.fn(),
  mockGetItem: vi.fn(),
  mockRemoveItem: vi.fn(),
}));

vi.mock('node-persist', () => ({
  default: {
    init: mockInit,
    setItem: mockSetItem,
    getItem: mockGetItem,
    removeItem: mockRemoveItem,
    clear: vi.fn(),
    valuesWithKeyMatch: vi.fn().mockResolvedValue([]),
  },
}));

const testUserInfo = {
  userId: 123,
  userName: 'testuser',
  avatar: 'https://example.com/avatar.png',
};

const testToken = 'test-access-token';

describe('PersistentStorage (node-persist)', () => {
  let PersistentStorage: typeof import('../storage').PersistentStorage;
  let storage: import('../storage').PersistentStorage;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ PersistentStorage } = await import('../storage'));
    storage = new PersistentStorage();
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

describe('PersistentStorage (Redis)', () => {
  const mockRedisGet = vi.fn();
  const mockRedisSet = vi.fn();
  const mockRedisDel = vi.fn();

  const redisClient = {
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
  };

  let initStorage: typeof import('../storage').initStorage;
  let storage: import('../storage').PersistentStorage;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ initStorage } = await import('../storage'));
    storage = initStorage(redisClient);
  });

  it('stores encrypted tokens in Redis with EX TTL', async () => {
    const userIdStr = testUserInfo.userId.toString();
    const expiresInSec = 3600;

    await storage.storeToken(userIdStr, testToken, expiresInSec);

    expect(mockRedisSet).toHaveBeenCalledWith(
      `anilistcal:store:token:${userIdStr}`,
      expect.stringContaining('"accessToken":"enc:v1:'),
      { EX: expiresInSec }
    );
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('retrieves and decrypts a token from Redis', async () => {
    const userIdStr = testUserInfo.userId.toString();
    mockRedisGet.mockResolvedValue(
      JSON.stringify({
        userId: userIdStr,
        accessToken: testToken,
        expiresAt: Date.now() + 3600000,
      })
    );

    const token = await storage.getToken(userIdStr);
    expect(mockRedisGet).toHaveBeenCalledWith(`anilistcal:store:token:${userIdStr}`);
    expect(token).toBe(testToken);
  });

  it('revokes tokens via Redis DEL', async () => {
    const userIdStr = testUserInfo.userId.toString();
    mockRedisGet.mockResolvedValue('{"userId":"123"}');

    const revoked = await storage.revokeToken(userIdStr);
    expect(revoked).toBe(true);
    expect(mockRedisDel).toHaveBeenCalledWith(`anilistcal:store:token:${userIdStr}`);
  });

  it('stores and retrieves user info in Redis', async () => {
    const userIdStr = testUserInfo.userId.toString();
    const userInfo = { username: testUserInfo.userName, avatarUrl: testUserInfo.avatar };

    await storage.storeUserInfo(userIdStr, testUserInfo.userName, testUserInfo.avatar);
    expect(mockRedisSet).toHaveBeenCalledWith(
      `anilistcal:store:user:${userIdStr}`,
      JSON.stringify(userInfo)
    );

    mockRedisGet.mockResolvedValue(JSON.stringify(userInfo));
    const retrieved = await storage.getUserInfo(userIdStr);
    expect(retrieved).toEqual(userInfo);
  });
});
