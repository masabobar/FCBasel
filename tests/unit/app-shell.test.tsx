import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import {
  AppShell,
  CANVAS_GRID_CLASS,
  PROMPT_BAR_CLEARANCE_CLASS,
} from "../../app/components/chrome/app-shell";
import { INERT_NAV_ITEMS } from "../../app/components/chrome/sidebar";
import { CONNECTION_STATUS_TEXT } from "../../app/components/chrome/top-bar";
import { CREST_LABEL } from "../../app/components/chrome/crest";
import { AVATAR_INITIALS, WORKSPACE_LABEL } from "../../app/lib/persona";

const SHELL_SOURCE = readFileSync(
  resolve(__dirname, "../../app/components/chrome/app-shell.tsx"),
  "utf8",
);

function renderShell(props: Parameters<typeof AppShell>[0] = {}) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <AppShell {...props} />
    </MemoryRouter>,
  );
}

function slot(name: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
}

describe("AppShell — composition", () => {
  it("frames the canvas with the sidebar and the app bar", () => {
    renderShell();

    expect(slot("sidebar")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBe(slot("top-bar"));
    expect(screen.getByRole("main")).toBe(slot("canvas"));
  });

  it("puts the sidebar before the app bar and the canvas in the document", () => {
    renderShell();

    const sidebar = slot("sidebar");
    const topBar = slot("top-bar");
    const canvas = slot("canvas");

    expect(
      sidebar.compareDocumentPosition(topBar) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      topBar.compareDocumentPosition(canvas) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows the crest, the workspace label, the status and the avatar", () => {
    renderShell();

    expect(screen.getByRole("img", { name: CREST_LABEL })).toBeInTheDocument();
    expect(screen.getByText(WORKSPACE_LABEL)).toBeInTheDocument();
    expect(screen.getByText(CONNECTION_STATUS_TEXT)).toBeInTheDocument();
    expect(screen.getByText(AVATAR_INITIALS)).toBeInTheDocument();
  });

  it("carries the dimmed placeholder items and only the one real link", () => {
    renderShell();

    for (const { label } of INERT_NAV_ITEMS) {
      expect(screen.getByText(label)).toHaveAttribute("aria-disabled", "true");
    }
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("forwards the Reset control to the injected handler", async () => {
    const onReset = vi.fn();
    renderShell({ onReset });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe("AppShell — the canvas grid", () => {
  it("holds a grid region inside the main landmark", () => {
    renderShell();

    expect(screen.getByRole("main")).toContainElement(slot("canvas-grid"));
  });

  it("is a twelve-column grid from the large breakpoint upwards", () => {
    renderShell();

    expect(slot("canvas-grid")).toHaveClass("grid", "lg:grid-cols-12");
  });

  it("steps down to eight and four columns on narrower viewports", () => {
    renderShell();

    // 8 and 4 both divide 12's usual tile spans (3, 4, 6), so a tile keeps a
    // clean fraction of the row at every step.
    expect(slot("canvas-grid")).toHaveClass("sm:grid-cols-8", "grid-cols-4");
  });

  it("separates tiles with the 16px grid-gap token", () => {
    renderShell();

    expect(slot("canvas-grid")).toHaveClass("gap-grid-gap");
  });

  it("exports the grid class so inserted tiles can assert their container", () => {
    expect(CANVAS_GRID_CLASS).toContain("lg:grid-cols-12");
  });

  it("renders whatever children are handed to it as grid items", () => {
    renderShell({ children: <div data-testid="tile">tile</div> });

    expect(slot("canvas-grid")).toContainElement(screen.getByTestId("tile"));
  });

  it("leaves the canvas empty when no tiles are supplied", () => {
    // US-013 and US-014 populate this; the shell deliberately does not.
    renderShell();

    expect(slot("canvas-grid").childElementCount).toBe(0);
  });
});

describe("AppShell — the prompt bar slot", () => {
  it("renders the supplied bar after the canvas, inside the canvas column", () => {
    // Last in the tree, so the canvas keeps the tab order it had and the bar
    // is the final stop (US-028).
    renderShell({ promptBar: <div data-testid="bar">bar</div> });

    const bar = screen.getByTestId("bar");
    expect(slot("top-bar").parentElement).toContainElement(bar);
    expect(
      slot("canvas").compareDocumentPosition(bar) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(slot("canvas-grid")).not.toContainElement(bar);
  });

  it("reserves the strip the pinned bar covers when one is supplied", () => {
    renderShell({ promptBar: <div data-testid="bar">bar</div> });

    expect(slot("canvas")).toHaveClass(
      PROMPT_BAR_CLEARANCE_CLASS,
      "p-grid-gap",
    );
  });

  it("keeps the canvas padding untouched when there is no bar", () => {
    // The shell does not depend on there being a prompt bar; US-012's frame
    // stands on its own.
    renderShell();

    expect(slot("canvas")).not.toHaveClass(PROMPT_BAR_CLEARANCE_CLASS);
    expect(slot("canvas")).toHaveClass("p-grid-gap");
  });
});

describe("AppShell — no horizontal scroll at 1920x1080", () => {
  it("clips sideways overflow at the shell and at the canvas", () => {
    renderShell();

    expect(slot("app-shell")).toHaveClass("overflow-x-hidden", "w-full");
    expect(slot("canvas")).toHaveClass("overflow-x-hidden");
  });

  it("lets the canvas column shrink instead of pushing the page wider", () => {
    renderShell();

    // The sidebar is the only fixed-width box; the column beside it must be
    // free to shrink, which `min-w-0` on a flex child is what allows.
    const canvasColumn = slot("top-bar").parentElement!;
    expect(canvasColumn).toHaveClass("min-w-0", "flex-1");
    expect(slot("canvas")).toHaveClass("min-w-0");
  });

  it("declares no fixed pixel width anywhere in the shell", () => {
    expect(SHELL_SOURCE).not.toMatch(/w-\[\d+px\]/);
    expect(SHELL_SOURCE).not.toMatch(/min-w-\[\d+px\]/);
  });
});

describe("AppShell — token discipline", () => {
  it("uses no literal colour value", () => {
    expect(SHELL_SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SHELL_SOURCE).not.toMatch(/\brgba?\(/);
  });

  it("never injects raw HTML", () => {
    expect(SHELL_SOURCE).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
