import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
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

    expect(updateProgress).toHaveBeenCalledWith(
      { mediaId: 1, progress: 4 },
      expect.objectContaining({ onError: expect.any(Function) }),
    );
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("exposes a named group and 44px touch targets", () => {
    render(
      <EpisodeControls mediaId={1} currentEpisode={3} totalEpisodes={12} compact />
    );

    expect(
      screen.getByRole("group", { name: "Episode progress controls" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Decrease episode" })).toHaveClass(
      "h-11",
      "w-11",
    );
    expect(screen.getByRole("button", { name: "Increase episode" })).toHaveClass(
      "h-11",
      "w-11",
    );
  });

  it("restores the displayed value when an update fails", () => {
    render(
      <EpisodeControls mediaId={1} currentEpisode={3} totalEpisodes={12} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Increase episode" }));
    expect(screen.getByText("4")).toBeInTheDocument();

    const mutationOptions = updateProgress.mock.calls[0][1];
    act(() => mutationOptions.onError());

    expect(screen.getByText("3")).toBeInTheDocument();
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
