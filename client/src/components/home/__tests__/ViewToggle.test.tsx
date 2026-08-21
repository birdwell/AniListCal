import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ViewToggle } from "@/components/home/ViewToggle";

describe("ViewToggle", () => {
  it("names the destination view and keeps a 44px target", () => {
    const onToggle = vi.fn();
    render(<ViewToggle isCompact onToggle={onToggle} />);

    const toggle = screen.getByRole("button", { name: "Show grid view" });
    expect(toggle).toHaveClass("min-h-11", "min-w-11");
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("does not replace the browser's Cmd/Ctrl+G shortcut", () => {
    const onToggle = vi.fn();
    render(<ViewToggle isCompact={false} onToggle={onToggle} />);

    fireEvent.keyDown(window, { key: "g", metaKey: true });
    fireEvent.keyDown(window, { key: "g", ctrlKey: true });

    expect(onToggle).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Show list view" }),
    ).toBeInTheDocument();
  });
});
