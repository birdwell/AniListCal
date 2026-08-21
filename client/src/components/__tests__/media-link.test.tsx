import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { MediaType } from "@/generated/graphql";
import { getMediaDestination, MediaLink } from "@/components/media-link";

describe("MediaLink", () => {
  it("keeps anime details inside AniListCal", () => {
    const { hook } = memoryLocation({ path: "/", static: true });
    render(
      <Router hook={hook}>
        <MediaLink mediaId={42} mediaType={MediaType.Anime} label="Open Anime">
          Anime
        </MediaLink>
      </Router>,
    );

    expect(screen.getByRole("link", { name: "Open Anime" })).toHaveAttribute(
      "href",
      "/show/42",
    );
  });

  it("routes manga-format media to AniList instead of the anime-only detail page", () => {
    expect(getMediaDestination(77, MediaType.Manga)).toEqual({
      href: "https://anilist.co/manga/77",
      external: true,
    });

    render(
      <MediaLink mediaId={77} mediaType={MediaType.Manga} label="Open Manga">
        Manga
      </MediaLink>,
    );

    const link = screen.getByRole("link", {
      name: "Open Manga on AniList (opens in a new tab)",
    });
    expect(link).toHaveAttribute("href", "https://anilist.co/manga/77");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
