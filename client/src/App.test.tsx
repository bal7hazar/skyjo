import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

/** Currently revealable/targetable slots (highlighted for the active phase). */
function targetableSlots(): HTMLElement[] {
  return screen
    .getAllByRole("button")
    .filter((b) => b.classList.contains("slot--targetable"));
}

/** Reveal the two mandatory opening slots; the client then auto-draws. */
function completeSetup() {
  fireEvent.click(targetableSlots()[0]);
  fireEvent.click(targetableSlots()[0]);
}

describe("<App>", () => {
  it("opens in setup: 12 hidden slots, score 100, no action buttons yet", () => {
    render(<App />);
    expect(screen.getAllByText("?")).toHaveLength(12);

    const score = screen.getByText("Score").closest(".stat");
    expect(within(score as HTMLElement).getByText("100")).toBeInTheDocument();

    expect(screen.getByText(/to start, reveal/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /place in a slot/i }),
    ).not.toBeInTheDocument();
  });

  it("requires two opening reveals, then auto-draws into the action choice", () => {
    render(<App />);
    // All 12 hidden slots are revealable during setup.
    expect(targetableSlots()).toHaveLength(12);

    completeSetup();

    // Two slots revealed → 10 hidden `?` remain.
    expect(screen.getAllByText("?")).toHaveLength(10);

    // Auto-draw advanced the turn (setup itself is free) and offered the actions.
    expect(
      screen.getByRole("button", { name: /place in a slot/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /discard & reveal/i }),
    ).toBeInTheDocument();

    const turns = screen.getByText("Turns").closest(".stat");
    expect(within(turns as HTMLElement).getByText("1")).toBeInTheDocument();
  });

  it("reveals a slot via Discard & reveal after setup", () => {
    render(<App />);
    completeSetup();

    fireEvent.click(screen.getByRole("button", { name: /discard & reveal/i }));
    const targets = targetableSlots();
    expect(targets.length).toBeGreaterThan(0);

    fireEvent.click(targets[0]);
    // One more slot revealed → 9 hidden `?` remain.
    expect(screen.getAllByText("?")).toHaveLength(9);
  });
});
