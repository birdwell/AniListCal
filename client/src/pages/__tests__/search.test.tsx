import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MediaFormat, MediaListStatus } from "@/generated/graphql";
import SearchPage from "../search";

const searchAnime = vi.fn();

vi.mock("@/lib/anilist", () => ({
  searchAnime: (...args: unknown[]) => searchAnime(...args),
}));

vi.mock("@/hooks/useUpdateStatus", () => ({
  useUpdateStatus: () => ({
    updateStatus: vi.fn(),
    isUpdating: false,
  }),
}));

function renderSearchPage() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>
      <SearchPage />
    </QueryClientProvider>
  );
}

describe("SearchPage", () => {
  beforeEach(() => {
    searchAnime.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears results immediately when the search input is emptied", async () => {
    searchAnime.mockResolvedValue({
      media: [
        {
          id: 1,
          title: { romaji: "Naruto", english: "Naruto", native: null },
          coverImage: { large: null, extraLarge: null },
          status: null,
          format: MediaFormat.Tv,
          episodes: 220,
          seasonYear: 2002,
          mediaListEntry: {
            id: 1,
            status: MediaListStatus.Completed,
            progress: 220,
          },
        },
      ],
      pageInfo: {
        currentPage: 1,
        hasNextPage: false,
        perPage: 20,
        total: 1,
      },
    });

    renderSearchPage();

    const input = screen.getByPlaceholderText("Search anime...");
    fireEvent.change(input, { target: { value: "naruto" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Naruto")).toBeInTheDocument();
    });

    fireEvent.change(input, { target: { value: "" } });

    expect(screen.queryByText("Naruto")).not.toBeInTheDocument();
    expect(screen.queryByText(/result/i)).not.toBeInTheDocument();
  });

  it("loads additional pages when Load more is pressed", async () => {
    searchAnime
      .mockResolvedValueOnce({
        media: [
          {
            id: 1,
            title: { romaji: "Show One", english: null, native: null },
            coverImage: { large: null, extraLarge: null },
            status: null,
            format: MediaFormat.Tv,
            episodes: 12,
            seasonYear: 2020,
            mediaListEntry: null,
          },
        ],
        pageInfo: {
          currentPage: 1,
          hasNextPage: true,
          perPage: 20,
          total: 40,
        },
      })
      .mockResolvedValueOnce({
        media: [
          {
            id: 2,
            title: { romaji: "Show Two", english: null, native: null },
            coverImage: { large: null, extraLarge: null },
            status: null,
            format: MediaFormat.Movie,
            episodes: 1,
            seasonYear: 2021,
            mediaListEntry: null,
          },
        ],
        pageInfo: {
          currentPage: 2,
          hasNextPage: false,
          perPage: 20,
          total: 40,
        },
      });

    renderSearchPage();

    fireEvent.change(screen.getByPlaceholderText("Search anime..."), {
      target: { value: "show" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await waitFor(() => {
      expect(screen.getByText("Show One")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    await waitFor(() => {
      expect(screen.getByText("Show Two")).toBeInTheDocument();
    });

    expect(searchAnime).toHaveBeenNthCalledWith(1, "show", 1);
    expect(searchAnime).toHaveBeenNthCalledWith(2, "show", 2);
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("shows a controlled error message instead of transport details", async () => {
    vi.useRealTimers();
    searchAnime.mockRejectedValue(new Error("GraphQL error: Internal server error"));

    renderSearchPage();

    fireEvent.change(screen.getByPlaceholderText("Search anime..."), {
      target: { value: "fail" },
    });

    await waitFor(
      () => {
        expect(
          screen.getByText("Failed to search anime. Please try again.")
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    expect(screen.queryByText(/GraphQL error/i)).not.toBeInTheDocument();
  });
});
