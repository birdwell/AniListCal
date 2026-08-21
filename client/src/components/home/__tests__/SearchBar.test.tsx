import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchBar } from "@/components/home/SearchBar";

describe("SearchBar", () => {
  it("does not steal focus on mount but supports the explicit search shortcut", () => {
    render(
      <SearchBar
        searchQuery=""
        setSearchQuery={vi.fn()}
        totalResults={null}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Search anime" });
    expect(input).not.toHaveFocus();

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(input).toHaveFocus();
  });

  it("uses a named 44px clear target", () => {
    const setSearchQuery = vi.fn();
    render(
      <SearchBar
        searchQuery="frieren"
        setSearchQuery={setSearchQuery}
        totalResults={1}
      />,
    );

    const clear = screen.getByRole("button", { name: "Clear search" });
    expect(clear).toHaveClass("h-11", "w-11");
    fireEvent.click(clear);
    expect(setSearchQuery).toHaveBeenCalledWith("");
  });
});
