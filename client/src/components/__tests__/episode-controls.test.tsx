import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { EpisodeControls } from "../episode-controls";
import "@testing-library/jest-dom";

const updateProgress = vi.fn();

vi.mock("@/hooks", () => ({
  useUpdateProgress: () => ({
    updateProgress,
    isUpdating: false,
  }),
}));

describe("EpisodeControls", () => {
  beforeEach(() => {
    updateProgress.mockClear();
  });

  it("allows incrementing when season total is unknown (0)", () => {
    render(
      <EpisodeControls mediaId={1} currentEpisode={3} totalEpisodes={0} />
    );

    const increase = screen.getByRole("button", { name: "Increase episode" });
    expect(increase).toBeEnabled();

    fireEvent.click(increase);

    expect(updateProgress).toHaveBeenCalledWith({ mediaId: 1, progress: 4 });
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("blocks incrementing once known total is reached", () => {
    render(
      <EpisodeControls mediaId={1} currentEpisode={12} totalEpisodes={12} />
    );

    const increase = screen.getByRole("button", { name: "Increase episode" });
    expect(increase).toBeDisabled();

    fireEvent.click(increase);
    expect(updateProgress).not.toHaveBeenCalled();
  });
});
