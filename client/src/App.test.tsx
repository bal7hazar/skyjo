import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("<App>", () => {
  it("renders 12 slots, all hidden, with score 100", () => {
    render(<App />);
    const hidden = screen.getAllByText("?");
    expect(hidden).toHaveLength(12);

    const score = screen.getByText("Score").closest(".stat");
    expect(within(score as HTMLElement).getByText("100")).toBeInTheDocument();
  });

  it("draws a number and then offers place / reveal actions", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /draw a number/i }));

    expect(
      screen.getByRole("button", { name: /place in a slot/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /discard & reveal/i }),
    ).toBeInTheDocument();

    // Turns advanced to 1 after the draw.
    const turns = screen.getByText("Turns").closest(".stat");
    expect(within(turns as HTMLElement).getByText("1")).toBeInTheDocument();
  });

  it("reveals a slot via Discard & reveal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /draw a number/i }));
    fireEvent.click(screen.getByRole("button", { name: /discard & reveal/i }));

    // After choosing flip, hidden slots become clickable targets.
    const targets = screen
      .getAllByRole("button")
      .filter((b) => b.classList.contains("slot--targetable"));
    expect(targets.length).toBeGreaterThan(0);

    fireEvent.click(targets[0]);
    // One slot revealed → 11 hidden `?` remain.
    expect(screen.getAllByText("?")).toHaveLength(11);
  });
});
