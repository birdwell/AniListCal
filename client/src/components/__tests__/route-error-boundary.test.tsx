import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteErrorBoundary } from "../route-error-boundary";

function BrokenRoute(): never {
  throw new Error("chunk missing");
}

describe("RouteErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers a reload recovery when a route fails to load", () => {
    const reload = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <RouteErrorBoundary reload={reload}>
        <BrokenRoute />
      </RouteErrorBoundary>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Update required" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This page could not be loaded",
    );
    screen.getByRole("button", { name: "Reload app" }).click();
    expect(reload).toHaveBeenCalledOnce();
  });
});
