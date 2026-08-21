import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  patchAnimeEntryCaches,
  restoreAnimeEntryCaches,
  revalidateActiveAnimeLists,
  snapshotAnimeEntryCaches,
} from "@/lib/animeCache";
import { queryKeys } from "@/lib/queryKeys";
import {
  MediaListStatus,
  type EntyFragmentFragment,
  type MediaFragmentFragment,
} from "@/generated/graphql";
import type { SearchMediaPage } from "@/lib/anilist";

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe("anime cache mutation helpers", () => {
  it("patches list, detail, and search entries and restores exact snapshots", () => {
    const client = createClient();
    const listKey = queryKeys.animeList(7, [MediaListStatus.Current]);
    const detailKey = queryKeys.animeDetail(42);
    const searchKey = queryKeys.animeSearch("test");

    const list = [
      {
        id: 9,
        status: MediaListStatus.Current,
        progress: 3,
        media: { id: 42 },
      },
    ] as EntyFragmentFragment[];
    const detail = {
      id: 42,
      mediaListEntry: {
        id: 9,
        status: MediaListStatus.Current,
        progress: 3,
      },
    } as MediaFragmentFragment;
    const search = {
      media: [
        {
          id: 42,
          mediaListEntry: {
            id: 9,
            status: MediaListStatus.Current,
            progress: 3,
          },
        },
      ],
      pageInfo: null,
    } as SearchMediaPage;

    client.setQueryData(listKey, list);
    client.setQueryData(detailKey, detail);
    client.setQueryData(searchKey, search);
    const snapshot = snapshotAnimeEntryCaches(client, 42);

    patchAnimeEntryCaches(client, 42, {
      progress: 4,
      status: MediaListStatus.Paused,
    });

    expect(client.getQueryData<EntyFragmentFragment[]>(listKey)?.[0]).toMatchObject({
      progress: 4,
      status: MediaListStatus.Paused,
    });
    expect(client.getQueryData<MediaFragmentFragment>(detailKey)?.mediaListEntry).toMatchObject({
      progress: 4,
      status: MediaListStatus.Paused,
    });
    expect(client.getQueryData<SearchMediaPage>(searchKey)?.media[0].mediaListEntry).toMatchObject({
      progress: 4,
      status: MediaListStatus.Paused,
    });

    restoreAnimeEntryCaches(client, snapshot);

    expect(client.getQueryData(listKey)).toEqual(list);
    expect(client.getQueryData(detailKey)).toEqual(detail);
    expect(client.getQueryData(searchKey)).toEqual(search);
  });

  it("revalidates active list queries without invalidating detail or search", () => {
    const client = createClient();
    const invalidate = vi.spyOn(client, "invalidateQueries");

    revalidateActiveAnimeLists(client);

    expect(invalidate).toHaveBeenCalledOnce();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.animeLists(),
      refetchType: "active",
    });
  });

  it("patches entries inside an infinite search cache", () => {
    const client = createClient();
    const searchKey = queryKeys.animeSearch("frieren");

    client.setQueryData(searchKey, {
      pages: [
        {
          media: [
            {
              id: 42,
              mediaListEntry: null,
            },
          ],
          pageInfo: {
            currentPage: 1,
            hasNextPage: false,
            perPage: 20,
            total: 1,
          },
        },
      ],
      pageParams: [1],
    });

    patchAnimeEntryCaches(client, 42, {
      status: MediaListStatus.Planning,
    });

    expect(
      client.getQueryData<{
        pages: SearchMediaPage[];
        pageParams: number[];
      }>(searchKey),
    ).toMatchObject({
      pages: [
        {
          media: [
            {
              id: 42,
              mediaListEntry: {
                status: MediaListStatus.Planning,
              },
            },
          ],
        },
      ],
      pageParams: [1],
    });
  });
});
