import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import { AppState } from "../app-state";

describe("AppState", () => {
  it("announces loading without exposing the decorative spinner", () => {
    render(<AppState kind="loading" title="Loading your schedule" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading your schedule");
  });

  it("uses an assertive alert for recoverable errors", () => {
    render(
      <AppState
        kind="error"
        title="Your list could not be loaded"
        description="Try again in a moment."
      />,
    );

    expect(screen.getByRole("alert")).toHaveAttribute(
      "aria-live",
      "assertive",
    );
  });
});
