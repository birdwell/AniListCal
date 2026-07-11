import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initCacheStore } from '../cache/cacheStore';
import {
  getCachedProxyResponse,
  getListSnapshotKey,
  getProxyCacheKey,
  invalidateUserAniListCache,
  isGraphQLMutation,
  isMediaListQuery,
  setCachedProxyResponse,
} from '../cache/aniListCache';

describe('aniListCache', () => {
  beforeEach(() => {
    initCacheStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects GraphQL mutations', () => {
    expect(isGraphQLMutation('mutation Update { SaveMediaListEntry { id } }')).toBe(true);
    expect(isGraphQLMutation('  mutation Foo { bar }')).toBe(true);
    expect(isGraphQLMutation('query { Viewer { id } }')).toBe(false);
  });

  it('detects media list queries', () => {
    expect(isMediaListQuery('query { MediaListCollection { lists { entries { id } } } }')).toBe(true);
    expect(isMediaListQuery('query { Viewer { id } }')).toBe(false);
  });

  it('builds stable list snapshot keys', () => {
    expect(getListSnapshotKey('42', { userId: 42, status: ['CURRENT', 'PLANNING'] }))
      .toBe('anilistcal:list:42:CURRENT,PLANNING');
    expect(getListSnapshotKey('42', { userId: 42, status: ['PLANNING', 'CURRENT'] }))
      .toBe('anilistcal:list:42:CURRENT,PLANNING');
  });

  it('stores and retrieves proxy cache entries', async () => {
    const query = 'query { Viewer { id } }';
    const variables = {};
    const response = { data: { Viewer: { id: 1 } } };

    await setCachedProxyResponse('7', query, variables, response);
    const cached = await getCachedProxyResponse('7', query, variables);

    expect(cached).toEqual(response);
    expect(getProxyCacheKey('7', query, variables)).toContain('anilistcal:proxy:7:');
  });

  it('stores list snapshots for MediaListCollection queries', async () => {
    const query = 'query { MediaListCollection { lists { entries { id } } } }';
    const variables = { userId: 9, status: ['CURRENT'] };
    const response = { data: { MediaListCollection: { lists: [] } } };

    await setCachedProxyResponse('9', query, variables, response);

    const listKey = getListSnapshotKey('9', variables)!;
    const cachedViaList = await getCachedProxyResponse('9', query, variables);
    expect(cachedViaList).toEqual(response);
    expect(listKey).toBe('anilistcal:list:9:CURRENT');
  });

  it('invalidates all cache entries for a user', async () => {
    const query = 'query { Viewer { id } }';
    const listQuery = 'query { MediaListCollection { lists { entries { id } } } }';
    const listVariables = { userId: 3, status: ['CURRENT'] };

    await setCachedProxyResponse('3', query, {}, { data: { Viewer: { id: 3 } } });
    await setCachedProxyResponse('3', listQuery, listVariables, { data: { MediaListCollection: {} } });

    await invalidateUserAniListCache('3');

    expect(await getCachedProxyResponse('3', query, {})).toBeNull();
    expect(await getCachedProxyResponse('3', listQuery, listVariables)).toBeNull();
  });

  it('still evicts cached entries when the epoch bump fails', async () => {
    vi.useFakeTimers();
    try {
      const store = initCacheStore();
      const query = 'query { Viewer { id } }';
      await setCachedProxyResponse('5', query, {}, { data: { Viewer: { id: 5 } } });

      const originalSet = store.set.bind(store);
      vi.spyOn(store, 'set').mockImplementation(async (key, value, ttl) => {
        if (key.startsWith('anilistcal:epoch:')) {
          throw new Error('epoch store unavailable');
        }
        return originalSet(key, value, ttl);
      });

      await invalidateUserAniListCache('5');

      expect(await getCachedProxyResponse('5', query, {})).toBeNull();

      // Drain the background bump retries so no timers outlive the test.
      await vi.advanceTimersByTimeAsync(30_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-evicts entries committed while the shared epoch write was failing', async () => {
    vi.useFakeTimers();
    try {
      const store = initCacheStore();
      const query = 'query { Viewer { id } }';
      const staleBody = { data: { Viewer: { id: 6, progress: 1 } } };

      let failEpochWrites = true;
      const originalSet = store.set.bind(store);
      vi.spyOn(store, 'set').mockImplementation(async (key, value, ttl) => {
        if (key.startsWith('anilistcal:epoch:') && failEpochWrites) {
          throw new Error('epoch store unavailable');
        }
        return originalSet(key, value, ttl);
      });

      // Mutation invalidates, but the shared epoch bump fails.
      await invalidateUserAniListCache('6');

      // Another replica's pre-mutation read commits after the eviction — it
      // saw the old epoch, so it writes straight through.
      await setCachedProxyResponse('6', query, {}, staleBody);
      expect(await getCachedProxyResponse('6', query, {})).toEqual(staleBody);

      // The store recovers; the background retry bumps and re-evicts.
      failEpochWrites = false;
      await vi.advanceTimersByTimeAsync(30_000);

      expect(await getCachedProxyResponse('6', query, {})).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
