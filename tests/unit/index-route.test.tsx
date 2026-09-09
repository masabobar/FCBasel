import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Index, { meta } from "../../app/routes/_index";
import { WORKSPACE_LABEL } from "../../app/lib/persona";

describe("index route", () => {
  it("gives the single screen an h1 for the growing dashboard to hang off", () => {
    render(<Index />);

    const heading = screen.getByRole("heading", {
      level: 1,
      name: `${WORKSPACE_LABEL} dashboard`,
    });
    expect(heading).toBeInTheDocument();
  });

  it("hides that heading visually — the app bar already shows the identity", () => {
    render(<Index />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("sr-only");
  });

  it("names no individual — the heading is the workspace role", () => {
    const { container } = render(<Index />);

    expect(container.textContent).toBe(`${WORKSPACE_LABEL} dashboard`);
  });

  it("leaves the canvas otherwise empty for US-013 and US-014", () => {
    const { container } = render(<Index />);

    // The shell's grid is deliberately unpopulated by this story: the four
    // baseline tiles are US-013 and inserted hero sections are US-014.
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(0);
    expect(container.childElementCount).toBe(1);
  });

  it("sets the document title", () => {
    expect(meta()).toEqual([{ title: "FC Basel Intelligence Platform" }]);
  });
});
