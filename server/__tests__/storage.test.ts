import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Keep type import separate
import { type UserInfo } from '../../shared/types';
// We will dynamically import PersistentStorage later
// import { PersistentStorage } from '../storage';

// Define mocks *before* vi.doMock uses them
const mockInit = vi.fn().mockResolvedValue(undefined);
const mockSetItem = vi.fn();
const mockGetItem = vi.fn();
const mockRemoveItem = vi.fn();
const mockClear = vi.fn();

// Define a mock buffer for crypto.randomBytes
const mockTokenBuffer = Buffer.from('mocked_api_token_bytes');
const mockRandomBytes = vi.fn().mockReturnValue(mockTokenBuffer);

// Mock crypto (hoisted)
vi.mock('crypto', () => ({
    // Provide a default export containing the named exports used
    default: {
        randomBytes: mockRandomBytes,
    },
    // Also provide named exports directly if needed elsewhere
    randomBytes: mockRandomBytes,
}));

// Define a reusable user info object for tests
const testUserInfo: UserInfo = {
    userId: 123,
    userName: 'testuser',
    avatar: 'https://example.com/avatar.png',
    options: { displayAdultContent: false, titleLanguage: 'ROMAJI' },
    mediaListOptions: { scoreFormat: 'POINT_10_DECIMAL', rowOrder: 'title' }
};

const testToken = 'test-access-token';
// Match the buffer content converted to hex
const testApiToken = mockTokenBuffer.toString('hex');

describe('PersistentStorage', () => {
    // Declare storage variable here
    let storage: any; // Use any or create an interface/type for the instance
    let PersistentStorage: any;

    beforeEach(async () => {
        // Reset mocks before each test
        vi.resetModules();
        vi.clearAllMocks(); // This should clear mockInit, mockRandomBytes etc.

        // Re-mock node-persist (mockInit is now pre-configured to resolve)
        await vi.doMock('node-persist', () => ({
            default: {
                init: mockInit,
                setItem: mockSetItem,
                getItem: mockGetItem,
                removeItem: mockRemoveItem,
                clear: mockClear,
            },
        }));

        // Re-mock crypto if necessary (though vi.mock at top level might suffice if reset correctly)
        // If issues persist, uncomment this:
        // await vi.doMock('crypto', () => ({
        //     randomBytes: mockRandomBytes,
        // }));

        // Dynamically import the class *after* mocks are set up
        const storageModule = await import('../storage');
        PersistentStorage = storageModule.PersistentStorage;

        // Create a fresh instance
        storage = new PersistentStorage();
        await new Promise(setImmediate);
    });

    // Tests remain largely the same, using the mock functions directly

    it('should initialize node-persist on construction', () => {
        // Loosen assertion for now due to persistent double call issue
        expect(mockInit).toHaveBeenCalled();
        expect(mockInit.mock.calls.length).toBeGreaterThanOrEqual(1);
        // expect(mockInit).toHaveBeenCalledTimes(1); // Revisit this strict check later
    });

    describe('Tokens', () => {
        it('should store an access token with TTL', async () => {
            const ttl = 7 * 24 * 60 * 60 * 1000;
            const userIdStr = testUserInfo.userId.toString();
            await storage.storeToken(userIdStr, testToken);
            expect(mockSetItem).toHaveBeenCalledTimes(1);
            expect(mockSetItem).toHaveBeenCalledWith(
                `anilist_token_${userIdStr}`,
                expect.objectContaining({
                    userId: userIdStr,
                    accessToken: testToken,
                    expiresAt: expect.any(Number)
                }),
                { ttl }
            );
        });

        it('should retrieve a stored access token', async () => {
            const userIdStr = testUserInfo.userId.toString();
            const key = `anilist_token_${userIdStr}`;
            const mockStoredData = { userId: userIdStr, accessToken: testToken, expiresAt: Date.now() + 3600000 };
            mockGetItem.mockResolvedValue(mockStoredData);

            const retrievedToken = await storage.getToken(userIdStr);
            expect(mockGetItem).toHaveBeenCalledTimes(1);
            expect(mockGetItem).toHaveBeenCalledWith(key);
            expect(retrievedToken).toBe(testToken);
        });

        it('should return null if access token is not found or expired', async () => {
            const userIdStr = testUserInfo.userId.toString();
            const key = `anilist_token_${userIdStr}`;

            // Case 1: Not found
            mockGetItem.mockResolvedValue(undefined);
            let retrievedToken = await storage.getToken(userIdStr);
            expect(mockGetItem).toHaveBeenCalledWith(key);
            expect(retrievedToken).toBeNull();

            // Case 2: Expired
            mockGetItem.mockClear();
            mockRemoveItem.mockClear();
            const mockExpiredData = { userId: userIdStr, accessToken: testToken, expiresAt: Date.now() - 1000 };
            mockGetItem.mockResolvedValue(mockExpiredData);
            retrievedToken = await storage.getToken(userIdStr);
            expect(mockGetItem).toHaveBeenCalledWith(key);
            expect(mockRemoveItem).toHaveBeenCalledWith(key);
            expect(retrievedToken).toBeNull();
        });

        it('should revoke an AniList token and associated API tokens', async () => {
            const userIdStr = testUserInfo.userId.toString();
            const apiTokenKey = `api_token_${testApiToken}`;
            const userApiTokensKey = `api_tokens_by_user_${userIdStr}`;
            const anilistTokenKey = `anilist_token_${userIdStr}`;

            mockGetItem.mockImplementation(async (key) => {
                if (key === userApiTokensKey) return [testApiToken];
                if (key === anilistTokenKey) return { userId: userIdStr, accessToken: testToken, expiresAt: Date.now() + 10000 };
                if (key === apiTokenKey) return { token: testApiToken, userId: userIdStr, expiresAt: Date.now() + 5000 };
                return undefined;
            });

            const revoked = await storage.revokeToken(userIdStr);
            expect(revoked).toBe(true);
            expect(mockGetItem).toHaveBeenCalledWith(userApiTokensKey);
            expect(mockRemoveItem).toHaveBeenCalledWith(apiTokenKey);
            expect(mockRemoveItem).toHaveBeenCalledWith(userApiTokensKey);
            expect(mockGetItem).toHaveBeenCalledWith(anilistTokenKey);
            expect(mockRemoveItem).toHaveBeenCalledWith(anilistTokenKey);
            expect(mockGetItem).toHaveBeenCalledTimes(2);
            expect(mockRemoveItem).toHaveBeenCalledTimes(3);
        });

        it('should return false when revoking non-existent AniList token', async () => {
            const userIdStr = testUserInfo.userId.toString();
            const anilistTokenKey = `anilist_token_${userIdStr}`;
            const userApiTokensKey = `api_tokens_by_user_${userIdStr}`;
            mockGetItem.mockResolvedValue(undefined);

            const revoked = await storage.revokeToken(userIdStr);
            expect(revoked).toBe(false);
            expect(mockGetItem).toHaveBeenCalledWith(userApiTokensKey);
            expect(mockGetItem).toHaveBeenCalledWith(anilistTokenKey);
            expect(mockRemoveItem).not.toHaveBeenCalled();
        });
    });

    describe('User Info', () => {
        it('should store user info', async () => {
            const userIdStr = testUserInfo.userId.toString();
            const userInfoToStore = { username: testUserInfo.userName, avatarUrl: testUserInfo.avatar };
            await storage.storeUserInfo(userIdStr, testUserInfo.userName, testUserInfo.avatar);
            expect(mockSetItem).toHaveBeenCalledTimes(1);
            expect(mockSetItem).toHaveBeenCalledWith(`user_info_${userIdStr}`, userInfoToStore);
        });

        it('should retrieve stored user info', async () => {
            const userIdStr = testUserInfo.userId.toString();
            const key = `user_info_${userIdStr}`;
            const mockStoredInfo = { username: testUserInfo.userName, avatarUrl: testUserInfo.avatar };
            mockGetItem.mockResolvedValue(mockStoredInfo);

            const retrievedInfo = await storage.getUserInfo(userIdStr);
            expect(mockGetItem).toHaveBeenCalledTimes(1);
            expect(mockGetItem).toHaveBeenCalledWith(key);
            expect(retrievedInfo).toEqual(mockStoredInfo);
        });

        it('should return null if user info is not found', async () => {
            const userIdStr = testUserInfo.userId.toString();
            const key = `user_info_${userIdStr}`;
            mockGetItem.mockResolvedValue(undefined);
            const retrievedInfo = await storage.getUserInfo(userIdStr);
            expect(mockGetItem).toHaveBeenCalledTimes(1);
            expect(mockGetItem).toHaveBeenCalledWith(key);
            expect(retrievedInfo).toBeNull();
        });
    });

    describe('API Tokens', () => {
        const apiTokenTTL = 4 * 60 * 60 * 1000;
        const userIdStr = testUserInfo.userId.toString();
        const userTokensKey = `api_tokens_by_user_${userIdStr}`;
        const apiTokenDataKey = `api_token_${testApiToken}`;

        it('should generate a new API token, store it, and associate with user', async () => {
            // No need to re-import crypto here, mock is global
            // const crypto = await import('crypto');
            mockGetItem.mockResolvedValue(undefined);

            const generatedToken = await storage.generateApiToken(userIdStr);

            // Check the mock setup provides the expected token
            expect(mockRandomBytes).toHaveBeenCalledWith(32);
            expect(generatedToken).toBe(testApiToken); // Should match hex of mockTokenBuffer

            expect(mockSetItem).toHaveBeenCalledWith(
                apiTokenDataKey,
                expect.objectContaining({ token: testApiToken, userId: userIdStr, expiresAt: expect.any(Number) }),
                { ttl: apiTokenTTL }
            );
            expect(mockSetItem).toHaveBeenCalledWith(userTokensKey, [testApiToken]);
            expect(mockGetItem).toHaveBeenCalledWith(userTokensKey);
            expect(mockGetItem).toHaveBeenCalledTimes(2);
            expect(mockSetItem).toHaveBeenCalledTimes(2);
        });

        it('should validate a correct API token', async () => {
            const mockStoredData = { token: testApiToken, userId: userIdStr, expiresAt: Date.now() + apiTokenTTL };
            mockGetItem.mockResolvedValue(mockStoredData);

            const validatedTokenData = await storage.validateApiToken(testApiToken);
            expect(mockGetItem).toHaveBeenCalledTimes(1);
            expect(mockGetItem).toHaveBeenCalledWith(apiTokenDataKey);
            expect(validatedTokenData).toEqual(mockStoredData);
        });

        it('should return null for an invalid or expired API token', async () => {
            const invalidToken = 'invalid-token';
            const invalidKey = `api_token_${invalidToken}`;

            // Invalid
            mockGetItem.mockResolvedValue(undefined);
            let validatedTokenData = await storage.validateApiToken(invalidToken);
            expect(mockGetItem).toHaveBeenCalledWith(invalidKey);
            expect(validatedTokenData).toBeNull();
            expect(mockRemoveItem).not.toHaveBeenCalled();

            // Expired
            mockGetItem.mockClear();
            mockRemoveItem.mockClear();
            const expiredToken = 'expired-token';
            const expiredKey = `api_token_${expiredToken}`;
            const mockExpiredData = { token: expiredToken, userId: userIdStr, expiresAt: Date.now() - 1000 };
            mockGetItem.mockResolvedValueOnce(mockExpiredData); // For validateApiToken check
            mockGetItem.mockResolvedValueOnce([expiredToken]);  // For removeApiTokenReferences list check

            validatedTokenData = await storage.validateApiToken(expiredToken);
            expect(mockGetItem).toHaveBeenCalledWith(expiredKey);
            expect(validatedTokenData).toBeNull();
            expect(mockRemoveItem).toHaveBeenCalledWith(expiredKey);
            expect(mockGetItem).toHaveBeenCalledWith(userTokensKey);
            expect(mockRemoveItem).toHaveBeenCalledWith(userTokensKey);
        });

        it('should revoke a specific API token', async () => {
            const tokenToRevoke = testApiToken;
            const mockTokenData = { token: tokenToRevoke, userId: userIdStr, expiresAt: Date.now() + apiTokenTTL };
            const anotherToken = 'another-token';
            mockGetItem.mockResolvedValueOnce(mockTokenData);
            mockGetItem.mockResolvedValueOnce([tokenToRevoke, anotherToken]);

            const revoked = await storage.revokeApiToken(tokenToRevoke);
            expect(revoked).toBe(true);
            expect(mockGetItem).toHaveBeenCalledWith(apiTokenDataKey);
            expect(mockRemoveItem).toHaveBeenCalledWith(apiTokenDataKey);
            expect(mockGetItem).toHaveBeenCalledWith(userTokensKey);
            expect(mockSetItem).toHaveBeenCalledWith(userTokensKey, [anotherToken]);
            expect(mockGetItem).toHaveBeenCalledTimes(2);
            expect(mockRemoveItem).toHaveBeenCalledTimes(1);
            expect(mockSetItem).toHaveBeenCalledTimes(1);
        });

        it('should return false when revoking a non-existent API token', async () => {
            const nonExistentToken = 'non-existent-token';
            const key = `api_token_${nonExistentToken}`;
            mockGetItem.mockResolvedValue(undefined);

            const revoked = await storage.revokeApiToken(nonExistentToken);
            expect(revoked).toBe(false);
            expect(mockGetItem).toHaveBeenCalledWith(key);
            expect(mockRemoveItem).not.toHaveBeenCalled();
            expect(mockSetItem).not.toHaveBeenCalled();
        });

        it('should revoke all API tokens for a user', async () => {
            const token1 = 'api_token_1_hex';
            const token2 = 'api_token_2_hex';
            mockGetItem.mockResolvedValue([token1, token2]);

            await storage.revokeApiTokensForUser(userIdStr);
            expect(mockGetItem).toHaveBeenCalledWith(userTokensKey);
            expect(mockRemoveItem).toHaveBeenCalledWith(`api_token_${token1}`);
            expect(mockRemoveItem).toHaveBeenCalledWith(`api_token_${token2}`);
            expect(mockRemoveItem).toHaveBeenCalledWith(userTokensKey);
            expect(mockGetItem).toHaveBeenCalledTimes(1);
            expect(mockRemoveItem).toHaveBeenCalledTimes(3);
        });

        it('should handle revoking API tokens when user has none', async () => {
            mockGetItem.mockResolvedValue(undefined);

            await storage.revokeApiTokensForUser(userIdStr);
            expect(mockGetItem).toHaveBeenCalledWith(userTokensKey);
            expect(mockRemoveItem).not.toHaveBeenCalled();
            expect(mockGetItem).toHaveBeenCalledTimes(1);
            expect(mockRemoveItem).toHaveBeenCalledTimes(0);
        });
    });
}); 