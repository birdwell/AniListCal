import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MediaFormat, MediaListStatus } from "@/generated/graphql";
import { SearchResultRow } from "../SearchResultRow";

const updateStatus = vi.fn();

vi.mock("@/hooks/useUpdateStatus", () => ({
  useUpdateStatus: () => ({
    updateStatus,
    isUpdating: false,
  }),
}));

describe("SearchResultRow", () => {
  beforeEach(() => {
    updateStatus.mockClear();
  });

  it("renders title metadata and updates watch status", () => {
    render(
      <SearchResultRow
        media={{
          id: 42,
          title: {
            romaji: "Frieren",
            english: "Frieren: Beyond Journey's End",
            native: null,
          },
          coverImage: { large: "https://example.com/frieren.jpg", extraLarge: null },
          status: null,
          format: MediaFormat.Tv,
          episodes: 28,
          seasonYear: 2023,
          mediaListEntry: {
            id: 1,
            status: MediaListStatus.Planning,
            progress: 0,
          },
        }}
      />
    );

    expect(
      screen.getByText("Frieren: Beyond Journey's End")
    ).toBeInTheDocument();
    expect(screen.getByText("TV · 2023 · 28 eps")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/show/42");

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Watching" }));

    expect(updateStatus).toHaveBeenCalledWith({
      mediaId: 42,
      status: MediaListStatus.Current,
    });
  });

  it("allows setting status when the show is not on the list", () => {
    render(
      <SearchResultRow
        media={{
          id: 7,
          title: { romaji: "New Show", english: null, native: null },
          coverImage: { large: null, extraLarge: null },
          status: null,
          format: MediaFormat.Movie,
          episodes: 1,
          seasonYear: 2024,
          mediaListEntry: null,
        }}
      />
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Set Status");

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Plan to Watch" }));

    expect(updateStatus).toHaveBeenCalledWith({
      mediaId: 7,
      status: MediaListStatus.Planning,
    });
  });
});
