import { beforeEach, describe, expect, it, vi } from "vitest";
import { MediaListStatus } from "@/generated/graphql";

const queryAniList = vi.fn();

vi.mock("../anilistProxy", () => ({
  queryAniList: (...args: unknown[]) => queryAniList(...args),
}));

vi.mock("../logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe("searchAnime", () => {
  beforeEach(() => {
    queryAniList.mockReset();
  });

  it("returns empty results for blank search without calling the proxy", async () => {
    const { searchAnime } = await import("../anilist");

    await expect(searchAnime("   ")).resolves.toEqual({
      media: [],
      pageInfo: null,
    });
    expect(queryAniList).not.toHaveBeenCalled();
  });

  it("queries AniList and returns media with list status", async () => {
    const { searchAnime } = await import("../anilist");

    queryAniList.mockResolvedValue({
      data: {
        Page: {
          pageInfo: {
            currentPage: 1,
            hasNextPage: false,
            perPage: 20,
            total: 1,
          },
          media: [
            {
              id: 21,
              title: { romaji: "One Piece", english: "One Piece", native: null },
              coverImage: { large: "https://example.com/op.jpg", extraLarge: null },
              status: "RELEASING",
              format: "TV",
              episodes: null,
              seasonYear: 1999,
              mediaListEntry: {
                id: 9,
                status: MediaListStatus.Current,
                progress: 1100,
              },
            },
            null,
          ],
        },
      },
    });

    const result = await searchAnime("one piece", 1, 20);

    expect(queryAniList).toHaveBeenCalledWith(
      expect.stringContaining("SearchMedia"),
      { search: "one piece", page: 1, perPage: 20 }
    );
    expect(result.media).toHaveLength(1);
    expect(result.media[0]?.id).toBe(21);
    expect(result.media[0]?.mediaListEntry?.status).toBe(MediaListStatus.Current);
    expect(result.pageInfo?.total).toBe(1);
  });
});
