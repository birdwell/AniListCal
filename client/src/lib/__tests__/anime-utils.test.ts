import { describe, it, expect, vi, afterEach } from "vitest";
import {
  availableEpisodeCount,
  episodesBehind,
  findWatchNextEntry,
  getProgressColor,
  progressCeiling,
} from "../anime-utils";

type Entry = {
  progress?: number | null;
  status?: string | null;
  media?: {
    id?: number | null;
    episodes?: number | null;
    nextAiringEpisode?: { episode: number; airingAt?: number | null } | null;
  } | null;
};

function entry(partial: Entry): Entry {
  return partial;
}

describe("episodesBehind", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses next airing episode minus one when not yet aired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const future = Math.floor(Date.now() / 1000) + 86_400;

    expect(
      episodesBehind(
        entry({
          progress: 3,
          media: {
            nextAiringEpisode: { episode: 5, airingAt: future },
          },
        })
      )
    ).toBe(1); // available = 4
  });

  it("treats next episode as available once airingAt has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const past = Math.floor(Date.now() / 1000) - 60;

    expect(
      episodesBehind(
        entry({
          progress: 4,
          media: {
            nextAiringEpisode: { episode: 5, airingAt: past },
          },
        })
      )
    ).toBe(1); // available = 5
  });

  it("falls back to media.episodes when there is no next airing", () => {
    expect(
      episodesBehind(
        entry({
          progress: 10,
          media: { episodes: 12 },
        })
      )
    ).toBe(2);
  });
});

describe("availableEpisodeCount", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses next episode minus one when that episode has not aired", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const future = Math.floor(Date.now() / 1000) + 86_400;

    expect(
      availableEpisodeCount(
        entry({
          media: {
            nextAiringEpisode: { episode: 5, airingAt: future },
          },
        })
      )
    ).toBe(4);
  });

  it("treats next episode as available once airingAt has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const past = Math.floor(Date.now() / 1000) - 60;

    expect(
      availableEpisodeCount(
        entry({
          media: {
            nextAiringEpisode: { episode: 5, airingAt: past },
          },
        })
      )
    ).toBe(5);
  });

  it("falls back to media.episodes when there is no next airing", () => {
    expect(
      availableEpisodeCount(entry({ media: { episodes: 12 } }))
    ).toBe(12);
  });
});

describe("progressCeiling", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("caps at available episodes, not the season total, when next airing exists", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const future = Math.floor(Date.now() / 1000) + 86_400;

    expect(
      progressCeiling(
        entry({
          media: {
            episodes: 12,
            nextAiringEpisode: { episode: 5, airingAt: future },
          },
        })
      )
    ).toBe(4);
  });

  it("uses the season total when there is no next airing", () => {
    expect(progressCeiling(entry({ media: { episodes: 12 } }))).toBe(12);
  });

  it("returns null when neither next airing nor a season total is known", () => {
    expect(progressCeiling(entry({ media: {} }))).toBeNull();
    expect(progressCeiling(entry({}))).toBeNull();
  });
});

describe("getProgressColor", () => {
  it("is muted when progress is 0", () => {
    expect(getProgressColor(0, 12)).toBe("text-muted-foreground");
  });

  it("is green when 1 episode behind", () => {
    expect(getProgressColor(3, 4)).toBe("text-success");
  });

  it("is yellow when 2 or more episodes behind", () => {
    expect(getProgressColor(2, 4)).toBe("text-warning");
  });

  it("is muted when available is unknown or zero", () => {
    expect(getProgressColor(5, 0)).toBe("text-muted-foreground");
  });
});

describe("findWatchNextEntry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("prefers fewer unwatched episodes over higher progress", () => {
    const deepBacklogHighProgress = entry({
      status: "CURRENT",
      progress: 20,
      media: { id: 1, episodes: 30 }, // behind 10
    });
    const closerLowerProgress = entry({
      status: "CURRENT",
      progress: 5,
      media: { id: 2, episodes: 7 }, // behind 2
    });

    expect(
      findWatchNextEntry([deepBacklogHighProgress, closerLowerProgress])
    ).toBe(closerLowerProgress);
  });

  it("ignores caught-up and non-CURRENT entries", () => {
    const caughtUp = entry({
      status: "CURRENT",
      progress: 12,
      media: { id: 1, episodes: 12 },
    });
    const paused = entry({
      status: "PAUSED",
      progress: 50,
      media: { id: 2, episodes: 60 },
    });
    const watching = entry({
      status: "CURRENT",
      progress: 3,
      media: { id: 3, episodes: 12 },
    });

    expect(findWatchNextEntry([caughtUp, paused, watching])).toBe(watching);
  });

  it("on equal gap, prefers higher progress", () => {
    const lowerProgress = entry({
      status: "CURRENT",
      progress: 3,
      media: { id: 1, episodes: 5 }, // behind 2
    });
    const higherProgress = entry({
      status: "CURRENT",
      progress: 10,
      media: { id: 2, episodes: 12 }, // behind 2
    });

    expect(findWatchNextEntry([lowerProgress, higherProgress])).toBe(
      higherProgress
    );
  });

  it("handles airing shows via nextAiringEpisode", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const future = Math.floor(Date.now() / 1000) + 86_400;

    const airing = entry({
      status: "CURRENT",
      progress: 8,
      media: {
        id: 1,
        nextAiringEpisode: { episode: 10, airingAt: future }, // available 9, behind 1
      },
    });
    const finished = entry({
      status: "CURRENT",
      progress: 4,
      media: { id: 2, episodes: 12 }, // behind 8
    });

    expect(findWatchNextEntry([finished, airing])).toBe(airing);
  });

  it("returns null when empty or all caught up", () => {
    expect(findWatchNextEntry([])).toBeNull();
    expect(
      findWatchNextEntry([
        entry({
          status: "CURRENT",
          progress: 12,
          media: { id: 1, episodes: 12 },
        }),
      ])
    ).toBeNull();
  });

  it("breaks remaining ties by lower media id", () => {
    const higherId = entry({
      status: "CURRENT",
      progress: 5,
      media: { id: 20, episodes: 10 },
    });
    const lowerId = entry({
      status: "CURRENT",
      progress: 5,
      media: { id: 10, episodes: 10 },
    });

    expect(findWatchNextEntry([higherId, lowerId])).toBe(lowerId);
  });
});
