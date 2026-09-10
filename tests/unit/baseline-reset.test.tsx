/**
 * US-013 × US-015 — **Reset restores exactly the four baseline tiles.**
 *
 * US-015 shipped Reset as a pure transition back to a named
 * `BASELINE_SECTIONS`, and left criterion ① of its own story ("clears all hero
 * sections and restores exactly the four baseline tiles") as a seam for this
 * story. It offered two ways to close it, and said so: list the tiles as
 * descriptors in that constant, or — "a baseline tile which is static chrome —
 * always on the canvas, never removed by an answer — needs no entry here at
 * all: reset only has to restore what a question can change."
 *
 * US-013 took the second. The four tiles are rendered by the ROUTE, above and
 * outside the session list, so no question can remove them and Reset therefore
 * cannot fail to restore them. That claim is only worth what a test makes of
 * it, so this suite drives the whole mechanic: baseline on load → sections
 * inserted below it → Reset → exactly the four tiles, in order, and nothing
 * else.
 *
 * WHY A HARNESS AND NOT `App` ITSELF. The four baseline tiles reach the canvas
 * through the ROUTE's SSR loader, which `App` alone does not run, so the
 * harness below is `app/root.tsx`'s composition with the baseline row mounted
 * directly and one test-only button that asks a question. The final case
 * asserts that the composition it mirrors is the one `root.tsx` really renders.
 *
 * `App` can now ask a question for itself — US-029's suggestion chips are wired
 * — and US-015's OTHER reset criterion (② "re-shows the three initial
 * suggestion chips and removes any follow-up chips") is driven end to end on
 * the real `App` in `tests/unit/suggestion-chips.test.tsx`.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "../../app/components/chrome/app-shell";
import {
  BASELINE_TILE_ORDER,
  BaselineRow,
} from "../../app/components/dashboard/baseline-row";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import { HEROES } from "./support/hero-data";
import { type Clock } from "../../app/lib/calendar";
import {
  type BaselineData,
  loadBaseline,
} from "../../app/lib/dashboard/baseline";
import {
  BASELINE_SECTIONS,
  NO_SECTIONS,
} from "../../app/lib/dashboard/sections";
import { useDashboard } from "../../app/lib/dashboard/use-dashboard";
import { createMockBaselineRepository } from "../../app/lib/mock/baseline";
import { HeroId } from "../../app/lib/repositories/enums";
import { restoreMotionStubs, stubMatchMedia } from "./support/motion-harness";

const ROOT_SOURCE = readFileSync(
  resolve(process.cwd(), "app/root.tsx"),
  "utf8",
);

const SEPTEMBER: Clock = () => new Date(2026, 8, 9);

const DATA: BaselineData = await loadBaseline(
  createMockBaselineRepository(SEPTEMBER),
);

/**
 * `app/root.tsx`'s tree, plus a control that asks a question — which is the
 * only thing the real root cannot do yet.
 */
function Harness() {
  const { sections, focus, reset, showHero } = useDashboard();

  return (
    <AppShell onReset={reset}>
      <BaselineRow data={DATA} />
      <InsightSections sections={sections} heroes={HEROES} focus={focus} />
      <button type="button" onClick={() => showHero(HeroId.HERO_1)}>
        ask hero 1
      </button>
      <button type="button" onClick={() => showHero(HeroId.HERO_2)}>
        ask hero 2
      </button>
    </AppShell>
  );
}

function renderHarness() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Harness />
    </MemoryRouter>,
  );
}

function tileTitles(): (string | null)[] {
  return [...document.querySelectorAll<HTMLElement>('[data-slot="card"]')]
    .filter((card) => card.closest('[data-slot="insight-section"]') === null)
    .map((card) => card.querySelector("h2")?.textContent ?? null);
}

function sectionCount(): number {
  return document.querySelectorAll('[data-slot="insight-section"]').length;
}

beforeEach(() => {
  // Reduced motion: the reveal is US-014's and is already covered there; this
  // suite is about what is on the canvas, not how it got there.
  stubMatchMedia(true);
  Object.assign(window, { scrollTo: vi.fn() });
});

afterEach(() => {
  restoreMotionStubs();
});

describe("the baseline is the load state", () => {
  it("shows the four tiles before a question is asked", () => {
    renderHarness();

    expect(tileTitles()).toEqual([...BASELINE_TILE_ORDER]);
    expect(sectionCount()).toBe(0);
  });

  it("keeps the session list itself empty — the tiles are not in it", () => {
    // The seam, stated as a value: `BASELINE_SECTIONS` means "the answers",
    // and at the baseline there are none. The tiles are static chrome.
    expect(BASELINE_SECTIONS).toEqual(NO_SECTIONS);
    expect(BASELINE_SECTIONS).toHaveLength(0);
  });
});

describe("a question ADDS to the baseline", () => {
  it("inserts sections without removing or reordering a baseline tile", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "ask hero 1" }));
    await user.click(screen.getByRole("button", { name: "ask hero 2" }));

    expect(sectionCount()).toBe(2);
    expect(tileTitles()).toEqual([...BASELINE_TILE_ORDER]);
  });

  it("inserts them BELOW the baseline row, on the same canvas", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "ask hero 1" }));

    const grid = document.querySelector('[data-slot="canvas-grid"]')!;
    const lastTile = [
      ...document.querySelectorAll('[data-slot="card"]'),
    ].filter((card) => card.closest('[data-slot="insight-section"]') === null);
    const section = document.querySelector('[data-slot="insight-section"]')!;

    expect(grid).toContainElement(section as HTMLElement);
    expect(
      lastTile.at(-1)!.compareDocumentPosition(section) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("Reset restores exactly the four baseline tiles", () => {
  async function askThenReset() {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole("button", { name: "ask hero 1" }));
    await user.click(screen.getByRole("button", { name: "ask hero 2" }));
    expect(sectionCount()).toBe(2);

    await user.click(screen.getByRole("button", { name: "Reset" }));
    return user;
  }

  it("clears every section and leaves the four tiles, in order", async () => {
    await askThenReset();

    expect(sectionCount()).toBe(0);
    expect(tileTitles()).toEqual([...BASELINE_TILE_ORDER]);
  });

  it("leaves exactly four tiles — no duplicate and no survivor", async () => {
    await askThenReset();

    expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(4);
  });

  it("leaves every figure on those tiles intact", async () => {
    await askThenReset();

    // Reset is not a reload: the baseline tiles never unmounted, so their
    // figures are still the loader's.
    expect(
      document.querySelectorAll('[data-slot="partner-card"]'),
    ).toHaveLength(DATA.partners.length);
    expect(document.querySelectorAll('[data-slot="h-bar-row"]')).toHaveLength(
      DATA.topProducts[0]!.rows.length,
    );
    expect(document.querySelectorAll('[data-slot="kpi-value"]')).toHaveLength(
      2,
    );
  });

  it("is stable when pressed repeatedly, and with nothing to reset", async () => {
    const user = await askThenReset();
    const reset = screen.getByRole("button", { name: "Reset" });

    await user.click(reset);
    await user.click(reset);
    await user.click(reset);

    expect(sectionCount()).toBe(0);
    expect(tileTitles()).toEqual([...BASELINE_TILE_ORDER]);
  });

  it("returns the canvas to the DOM it had on load", async () => {
    // React's `useId` counter advances per mount, so the SVG gradient ids the
    // sparkline generates differ between the two renders. They are the only
    // thing allowed to differ, so they are normalised rather than excused.
    const canvas = () =>
      document
        .querySelector('[data-slot="canvas-grid"]')!
        .innerHTML.replace(/_r_[0-9a-z]+_/g, "_r_x_");

    const { unmount } = renderHarness();
    const onLoad = canvas();
    unmount();

    const user = userEvent.setup();
    renderHarness();
    await user.click(screen.getByRole("button", { name: "ask hero 1" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(canvas()).toBe(onLoad);
  });
});

describe("the seam is closed the way US-015 described it", () => {
  it("keeps the baseline tiles out of the reset path entirely", async () => {
    const SECTIONS_SOURCE = readFileSync(
      resolve(process.cwd(), "app/lib/dashboard/sections.ts"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");

    // No baseline special-case anywhere in the transitions: reset restores the
    // named constant and nothing else, exactly as US-015 shipped it.
    expect(SECTIONS_SOURCE).not.toMatch(/webshop|partner|product|tile/i);
    expect(SECTIONS_SOURCE).toMatch(
      /export function withBaselineRestored[\s\S]*BASELINE_SECTIONS/,
    );
  });

  it("mirrors the composition root.tsx actually renders", () => {
    // The harness above is only evidence if it is the real tree: the routed
    // page (which renders the baseline row) inside the shell, with the
    // sections after it, and Reset wired to the hook.
    expect(ROOT_SOURCE).toMatch(/<AppShell\s+onReset=\{reset\}/);
    expect(ROOT_SOURCE.indexOf("<Outlet />")).toBeLessThan(
      ROOT_SOURCE.indexOf("<InsightSections"),
    );
    const ROUTE_SOURCE = readFileSync(
      resolve(process.cwd(), "app/routes/_index.tsx"),
      "utf8",
    );
    expect(ROUTE_SOURCE).toMatch(/<BaselineRow data=\{loaderData\} \/>/);
  });
});
