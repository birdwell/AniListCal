import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { Layout } from "../layout";

vi.mock("@/lib/auth", () => ({
  logout: vi.fn(),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

describe("Layout", () => {
  it("docks the mobile tab bar outside the scrolling main region", () => {
    const { hook } = memoryLocation({ path: "/", static: true });

    const { container } = render(
      <Router hook={hook}>
        <Layout>
          <div>Page content</div>
        </Layout>
      </Router>,
    );

    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toContain("h-dvh");
    expect(shell.className).toContain("flex-col");
    expect(shell.className).toContain("overflow-hidden");

    const main = screen.getByRole("main");
    expect(main.className).toContain("overflow-y-auto");
    expect(main.className).toContain("flex-1");
    expect(main).toHaveTextContent("Page content");

    const tabBar = screen.getByRole("navigation", { name: "Primary" });
    expect(tabBar.className).not.toContain("fixed");
    expect(tabBar.className).toContain("shrink-0");
    expect(main.compareDocumentPosition(tabBar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(
      tabBar.querySelectorAll("a").length,
    ).toBe(4);
    expect(tabBar).toHaveTextContent("Home");
    expect(tabBar).toHaveTextContent("Search");
    expect(tabBar).toHaveTextContent("Calendar");
    expect(tabBar).toHaveTextContent("Profile");
  });
});
