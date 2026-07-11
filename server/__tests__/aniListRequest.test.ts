import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initCacheStore } from '../cache/cacheStore';
import { getCachedProxyResponse } from '../cache/aniListCache';
import { fetchAniListQuery, hasGraphQLErrors } from '../cache/aniListRequest';

const QUERY = 'query { Viewer { id } }';

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('aniListRequest', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initCacheStore();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('detects GraphQL errors in response bodies', () => {
    expect(hasGraphQLErrors({ errors: [{ message: 'boom' }] })).toBe(true);
    expect(hasGraphQLErrors({ errors: [] })).toBe(false);
    expect(hasGraphQLErrors({ data: {} })).toBe(false);
    expect(hasGraphQLErrors(undefined)).toBe(false);
  });

  it('caches successful responses for subsequent cache reads', async () => {
    const body = { data: { Viewer: { id: 1 } } };
    fetchSpy.mockResolvedValue(mockFetchResponse(body));

    const result = await fetchAniListQuery('1', 'token', QUERY, {});

    expect(result).toEqual({ status: 200, ok: true, body });
    expect(await getCachedProxyResponse('1', QUERY, {})).toEqual(body);
  });

  it('does not cache responses with GraphQL errors', async () => {
    const body = { errors: [{ message: 'Invalid token', status: 401 }] };
    fetchSpy.mockResolvedValue(mockFetchResponse(body));

    await fetchAniListQuery('1', 'token', QUERY, {});

    expect(await getCachedProxyResponse('1', QUERY, {})).toBeNull();
  });

  it('does not cache non-ok responses', async () => {
    fetchSpy.mockResolvedValue(
      mockFetchResponse({ errors: [{ message: 'oops' }] }, false, 500)
    );

    const result = await fetchAniListQuery('1', 'token', QUERY, {});

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(await getCachedProxyResponse('1', QUERY, {})).toBeNull();
  });

  it('coalesces concurrent identical requests into one AniList call', async () => {
    const body = { data: { Viewer: { id: 1 } } };
    let resolveFetch!: (value: Response) => void;
    fetchSpy.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      })
    );

    const first = fetchAniListQuery('1', 'token', QUERY, {});
    const second = fetchAniListQuery('1', 'token', QUERY, {});
    resolveFetch(mockFetchResponse(body));

    expect(await first).toEqual(await second);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not coalesce requests for different users or variables', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse({ data: {} }));

    await Promise.all([
      fetchAniListQuery('1', 'token', QUERY, {}),
      fetchAniListQuery('2', 'token', QUERY, {}),
      fetchAniListQuery('1', 'token', QUERY, { status: ['CURRENT'] }),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('fetches fresh again after the in-flight request settles', async () => {
    fetchSpy.mockResolvedValue(
      mockFetchResponse({ errors: [{ message: 'oops' }] }, false, 500)
    );

    await fetchAniListQuery('1', 'token', QUERY, {});
    await fetchAniListQuery('1', 'token', QUERY, {});

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
