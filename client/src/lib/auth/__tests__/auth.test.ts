import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { queryClient as realQueryClient } from '../../queryClient'; // Real queryClient for invalidation checks
// Removed direct import of auth here, will import dynamically later if needed
// import * as auth from '../../auth';
import { CacheService as RealCacheService } from '../../cache-service';

// --- Define Mock Functions First ---
const mockInvalidateQueries = vi.fn();
const mockCacheClear = vi.fn();
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
const mockCacheDelete = vi.fn();

// --- Use vi.mock (hoisted) ---
vi.mock('../../queryClient', () => ({
    queryClient: {
        invalidateQueries: mockInvalidateQueries,
    }
}));

vi.mock('../../cache-service', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../cache-service')>();
    return {
        ...actual, // Keep other potential exports like CACHE_EXPIRY
        CacheService: vi.fn().mockImplementation(() => ({
            get: mockCacheGet,
            set: mockCacheSet,
            delete: mockCacheDelete,
            clear: mockCacheClear,
        })),
    };
});

// --- Mocks ---

// Mock fetch
global.fetch = vi.fn();

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string): string | null => store[key] || null),
        setItem: vi.fn((key: string, value: string): void => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string): void => {
            delete store[key];
        }),
        clear: vi.fn((): void => {
            store = {};
        }),
    };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock window.location.href
const originalLocation = window.location;
// @ts-ignore
delete window.location;
// @ts-ignore
window.location = { ...originalLocation, href: '' };
const locationHrefSpy = vi.spyOn(window.location, 'href', 'set');

// Mock import.meta.env
// Vitest automatically mocks import.meta.env but we need to set the value
vi.stubEnv('VITE_ANILIST_CLIENT_ID', 'test-client-id');

// --- Constants ---
// Remove locally defined STORAGE_KEYS, we will use the ones from the imported auth module
// const STORAGE_KEYS = {
//     API_TOKEN: 'apiToken',
//     TOKEN_EXPIRY: 'tokenExpiry',
// };
const MOCK_API_TOKEN = 'mock-api-token-123';
const MOCK_ANILIST_CODE = 'mock-anilist-code';
const MOCK_USER_ID = 123;
const MOCK_USER_DATA = { id: MOCK_USER_ID, name: 'TestUser', avatar: { medium: 'avatar.jpg' } };
const API_ENDPOINTS = { // Re-define for use in tests
    AUTH_LOGOUT: "/api/auth/logout",
    AUTH_USER: "/api/auth/user",
    AUTH_REFRESH: "/api/auth/refresh-token",
    ANILIST_PROXY: "/api/anilist/proxy"
};

// --- Test Suite ---

// Use dynamic import inside describe to ensure mocks are applied first
describe('Authentication Utilities (auth.ts)', async () => {
    // Dynamically import the module under test AFTER mocks are set up
    const auth = await import('../../auth');

    beforeEach(() => {
        // Reset mocks and storage before each test
        vi.clearAllMocks(); // Clears calls, instances, etc. for ALL mocks
        sessionStorageMock.clear();
        locationHrefSpy.mockClear();
        // Reset Date.now mock if used
        vi.useRealTimers();
    });

    afterEach(() => {
        // Ensure timers are restored
        vi.useRealTimers();
    });

    // --- Helper to set valid token ---
    const setValidToken = (expiryOffsetMs = 3600 * 1000) => {
        const expiryTime = Date.now() + expiryOffsetMs;
        // Use the keys exported by the actual auth module
        sessionStorageMock.setItem(auth.STORAGE_KEYS.API_TOKEN, MOCK_API_TOKEN);
        sessionStorageMock.setItem(auth.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
    };

    // --- Test Cases ---

    describe('login()', () => {
        it('should redirect to AniList authorization URL with correct parameters', async () => {
            await auth.login();
            // Construct expected URL string directly to match implementation
            const clientId = 'test-client-id';
            const redirectUri = 'http://localhost:3001/auth/callback'; // Assuming dev
            const expectedUrlString = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

            expect(locationHrefSpy).toHaveBeenCalledTimes(1);
            // Decode the received URL before comparing
            const receivedUrl = locationHrefSpy.mock.calls[0]?.[0] || '';
            expect(decodeURIComponent(receivedUrl)).toEqual(expectedUrlString);
        });

        it('should throw error if client ID is missing', async () => {
            // Explicitly set env var to undefined for this test
            vi.stubEnv('VITE_ANILIST_CLIENT_ID', undefined);
            await expect(auth.login()).rejects.toThrow("Anilist client ID is not configured");
            vi.stubEnv('VITE_ANILIST_CLIENT_ID', 'test-client-id'); // Restore for other tests
        });
    });

    describe('getApiToken()', () => {
        it('should return token from sessionStorage', () => {
            setValidToken();
            expect(auth.getApiToken()).toBe(MOCK_API_TOKEN);
            // Use the actual keys from the auth module
            expect(sessionStorageMock.getItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
        });

        it('should return null if token not in sessionStorage', () => {
            expect(auth.getApiToken()).toBeNull();
            // Use the actual keys from the auth module
            expect(sessionStorageMock.getItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
        });
    });

    describe('isTokenExpired()', () => {
        it('should return false for a token with sufficient time remaining', () => {
            vi.useFakeTimers();
            const now = Date.now();
            setValidToken(30 * 60 * 1000);
            vi.setSystemTime(now);
            expect(auth.isTokenExpired()).toBe(false);
            // Use the actual keys from the auth module
            expect(sessionStorageMock.getItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
        });

        it('should return true for a token nearing expiry (within threshold)', () => {
            vi.useFakeTimers();
            const now = Date.now();
            setValidToken(5 * 60 * 1000); // Expires in 5 mins (less than 10 min threshold)
            vi.setSystemTime(now);

            expect(auth.isTokenExpired()).toBe(true);
        });

        it('should return true for an already expired token', () => {
            vi.useFakeTimers();
            const now = Date.now();
            setValidToken(-60 * 1000); // Expired 1 min ago
            vi.setSystemTime(now);

            expect(auth.isTokenExpired()).toBe(true);
        });

        it('should return true if expiry time is not set', () => {
            // Set only the token, not the expiry
            sessionStorageMock.setItem(auth.STORAGE_KEYS.API_TOKEN, MOCK_API_TOKEN);
            expect(auth.isTokenExpired()).toBe(true);
            // Use the actual keys from the auth module
            expect(sessionStorageMock.getItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
        });
    });

    describe('clearAuthData()', () => {
        it('should remove token and expiry from sessionStorage', () => {
            setValidToken();
            auth.clearAuthData();
            // Use the actual keys from the auth module
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
        });

        it('should invalidate auth queries in queryClient', () => {
            auth.clearAuthData();
            // Use the specific mock function we defined
            expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["auth"] });
            expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["auth", "user"] });
        });

        it('should clear the auth cache', () => {
            // Assuming clearAuthData internally gets/creates a CacheService instance
            // and calls .clear() on it.
            auth.clearAuthData();

            // Check if the clear method from our specific mock CacheService was called
            expect(mockCacheClear).toHaveBeenCalled();

            // We can no longer easily check if the constructor itself was called
            // because the vi.fn() is now internal to the factory.
            // Checking mockCacheClear is sufficient for this test's purpose.
        });
    });

    describe('logout()', () => {
        it('should call server logout with token if present and clear data', async () => {
            setValidToken();
            (fetch as Mock).mockResolvedValueOnce({ ok: true });
            await auth.logout();
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(API_ENDPOINTS.AUTH_LOGOUT, {
                method: "POST",
                headers: { "Authorization": `Bearer ${MOCK_API_TOKEN}` },
                credentials: "include"
            });
            // Use the actual keys from the auth module
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
            expect(mockInvalidateQueries).toHaveBeenCalled();
        });

        it('should call server logout without token if absent and clear data', async () => {
            (fetch as Mock).mockResolvedValueOnce({ ok: true });
            await auth.logout();
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(API_ENDPOINTS.AUTH_LOGOUT, {
                method: "POST",
                headers: {},
                credentials: "include"
            });
            // Use the actual keys from the auth module
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
            expect(mockInvalidateQueries).toHaveBeenCalled();
        });

        it('should clear client data even if server logout fails', async () => {
            setValidToken();
            (fetch as Mock).mockRejectedValueOnce(new Error("Network error"));
            await auth.logout();
            expect(fetch).toHaveBeenCalledTimes(1);
            // Use the actual keys from the auth module
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
            expect(mockInvalidateQueries).toHaveBeenCalled();
        });
    });

    describe('queryAniList()', () => {
        const testQuery = `query { Viewer { id } }`;
        const testVariables = { someVar: 'value' };

        it('should successfully fetch via proxy with valid token', async () => {
            setValidToken();
            const mockResponseData = { data: { Viewer: { id: MOCK_USER_ID } } };
            (fetch as Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponseData,
            });

            const result = await auth.queryAniList(testQuery, testVariables);

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(API_ENDPOINTS.ANILIST_PROXY, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${MOCK_API_TOKEN}`
                },
                body: JSON.stringify({ query: testQuery, variables: testVariables })
            });
            expect(result).toEqual(mockResponseData);
        });

        it('should throw auth error if no token is present', async () => {
            await expect(auth.queryAniList(testQuery))
                .rejects.toThrow("Authentication required (no token)");
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should throw auth error and clear data if token is expired', async () => {
            vi.useFakeTimers();
            setValidToken(-1000);
            vi.setSystemTime(Date.now());
            await expect(auth.queryAniList(testQuery))
                .rejects.toThrow("Authentication required (token expired)");
            expect(fetch).not.toHaveBeenCalled();
            // Use the actual keys from the auth module
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
        });

        it('should throw auth error and clear data if proxy returns 401', async () => {
            setValidToken();
            (fetch as Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
            });
            await expect(auth.queryAniList(testQuery))
                .rejects.toThrow("Authentication required (proxy returned 401)");
            expect(fetch).toHaveBeenCalledTimes(1);
            // Use the actual keys from the auth module
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
        });

        it('should throw proxy error if proxy returns non-401 error', async () => {
            setValidToken();
            const mockErrorBody = { error: 'Server blew up' };
            (fetch as Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: async () => mockErrorBody
            });

            await expect(auth.queryAniList(testQuery))
                .rejects.toThrow(mockErrorBody.error); // Expect original error message
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(sessionStorageMock.removeItem).not.toHaveBeenCalled(); // Don't clear data on non-auth error
        });

        it('should throw GraphQL error if response contains non-auth errors', async () => {
            setValidToken();
            const mockGraphQLError = { errors: [{ message: "Invalid query syntax" }] };
            (fetch as Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockGraphQLError,
            });

            await expect(auth.queryAniList(testQuery))
                .rejects.toThrow(`GraphQL error: ${mockGraphQLError.errors[0].message}`);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(sessionStorageMock.removeItem).not.toHaveBeenCalled();
        });

        it('should throw auth error and clear data if response contains GraphQL auth error', async () => {
            setValidToken();
            const mockGraphQLAuthError = { errors: [{ message: "User not authenticated", status: 401 }] };
            (fetch as Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockGraphQLAuthError,
            });
            await expect(auth.queryAniList(testQuery))
                .rejects.toThrow("Authentication required (GraphQL auth error)");
            expect(fetch).toHaveBeenCalledTimes(1);
            // Use the actual keys from the auth module
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
        });

        it('should throw generic fetch error if fetch itself fails', async () => {
            setValidToken();
            const networkError = new Error("Network Failed");
            (fetch as Mock).mockRejectedValueOnce(networkError);

            await expect(auth.queryAniList(testQuery))
                .rejects.toThrow(networkError); // Expect original Error object/message
            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('getUser()', () => {
        it('should return user data on successful query', async () => {
            setValidToken();
            const mockResponse = { data: { Viewer: MOCK_USER_DATA } };
            (fetch as Mock).mockResolvedValue({ ok: true, json: async () => mockResponse }); // Mock underlying fetch for queryAniList

            const user = await auth.getUser();
            expect(user).toEqual(MOCK_USER_DATA);
            expect(fetch).toHaveBeenCalledTimes(1);
        });

        it('should return null if queryAniList throws auth error', async () => {
            // No token set, queryAniList will throw auth error
            const user = await auth.getUser();
            expect(user).toBeNull();
            expect(fetch).not.toHaveBeenCalled(); // queryAniList throws before fetch
        });

        it('should return undefined if query response has no Viewer data', async () => {
            setValidToken();
            const mockResponse = { data: {} }; // No Viewer key
            (fetch as Mock).mockResolvedValue({ ok: true, json: async () => mockResponse });

            const user = await auth.getUser();
            expect(user).toBeUndefined();
        });

        it('should re-throw non-auth errors from queryAniList', async () => {
            setValidToken();
            const genericError = new Error("Some other query error");
            (fetch as Mock).mockRejectedValueOnce(genericError); // Make queryAniList throw this error

            await expect(auth.getUser()).rejects.toThrow(genericError); // Expect original Error object/message
        });
    });

    describe('isAuthenticated()', () => {
        it('should return true if token exists and is not expired', () => {
            setValidToken();
            expect(auth.isAuthenticated()).toBe(true);
        });

        it('should return false if token does not exist', () => {
            expect(auth.isAuthenticated()).toBe(false);
        });

        it('should return false if token is expired', () => {
            vi.useFakeTimers();
            setValidToken(-1000); // Expired
            vi.setSystemTime(Date.now());
            expect(auth.isAuthenticated()).toBe(false);
        });
    });

    describe('refreshApiToken()', () => {
        it('should return false if no current token exists', async () => {
            const result = await auth.refreshApiToken();
            expect(result).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should successfully refresh token and store new data', async () => {
            setValidToken();
            const newToken = 'refreshed-api-token';
            const expiresIn = 1800;
            const mockRefreshResponse = { apiToken: newToken, expiresIn: expiresIn };
            (fetch as Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRefreshResponse,
            });
            const nowBefore = Date.now();
            const expectedExpiryLowerBound = nowBefore + expiresIn * 1000 - 1000;
            const expectedExpiryUpperBound = nowBefore + expiresIn * 1000 + 1000;
            const result = await auth.refreshApiToken();
            expect(result).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(API_ENDPOINTS.AUTH_REFRESH, expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ Authorization: `Bearer ${MOCK_API_TOKEN}` })
            }));
            // Use the actual keys from the auth module
            expect(sessionStorageMock.setItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN, newToken);
            const setItemCalls = sessionStorageMock.setItem.mock.calls;
            // Use the actual keys from the auth module
            const lastExpiryCall = setItemCalls.filter(call => call[0] === auth.STORAGE_KEYS.TOKEN_EXPIRY).pop();
            const actualExpiry = parseInt(lastExpiryCall?.[1] || '0', 10);
            expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiryLowerBound);
            expect(actualExpiry).toBeLessThanOrEqual(expectedExpiryUpperBound);
            expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["auth"] });
        });

        it('should return false and clear data if refresh returns 401', async () => {
            setValidToken();
            (fetch as Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
            });
            const result = await auth.refreshApiToken();
            expect(result).toBe(false);
            expect(fetch).toHaveBeenCalledTimes(1);
            // Use the actual keys from the auth module
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.API_TOKEN);
            expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(auth.STORAGE_KEYS.TOKEN_EXPIRY);
        });

        it('should return false if refresh returns other non-OK status', async () => {
            setValidToken();
            (fetch as Mock).mockResolvedValueOnce({ ok: false, status: 500 });

            const result = await auth.refreshApiToken();
            expect(result).toBe(false);
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(sessionStorageMock.removeItem).not.toHaveBeenCalled(); // Don't clear data on other errors
        });

        it('should return false if refresh response is missing token data', async () => {
            setValidToken();
            (fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
            sessionStorageMock.setItem.mockClear();
            const result = await auth.refreshApiToken();
            expect(result).toBe(false);
            expect(fetch).toHaveBeenCalledTimes(1);
            const setItemCallsAfter = sessionStorageMock.setItem.mock.calls;
            // Use the actual keys from the auth module
            expect(setItemCallsAfter.some(call => call[0] === auth.STORAGE_KEYS.API_TOKEN)).toBe(false);
        });

        it('should return false if fetch throws an error', async () => {
            setValidToken();
            (fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

            const result = await auth.refreshApiToken();
            expect(result).toBe(false);
            expect(fetch).toHaveBeenCalledTimes(1);
        });
    });

}); 