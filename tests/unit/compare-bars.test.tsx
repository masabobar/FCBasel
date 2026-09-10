/**
 * `CompareBar` / `CompareBars` (US-036) — two figures of the same measure on
 * ONE shared scale.
 *
 * WHAT THIS SUITE IS ACTUALLY GUARDING
 * The component exists because Hero 2's totals tile has to state last season
 * against this season inside a narrow KPI tile, and US-021's `HBars` cannot go
 * there (its fixed 150px / 96px columns are a review decision for a ranked
 * list). So the risk is not "does a bar render" — it is that a second bar
 * component drifts away from the first: a second scaling rule, a second colour
 * table, a hex, a second rounding. Every one of those is asserted below against
 * `h-bars.tsx`'s own exports.
 */

import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  H_BAR_SERIES,
  hBarMax,
  hBarPercent,
} from "../../app/components/charts/h-bars";
import {
  CompareBar,
  CompareBars,
  type CompareRow,
} from "../../app/components/tiles/compare-bars";
import {
  chfFromThousands,
  formatMoneyMillions,
  formatNumber,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
  type FrameStub,
} from "./support/motion-harness";

const CODE = readFileSync(
  resolve(process.cwd(), "app/components/tiles/compare-bars.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

/* ------------------------------------------------------------- FIXTURES -- */

/** Hero 2's own comparison, in CHF thousands: 7,880 last season, 7,830 this. */
const SEASONS: readonly CompareRow[] = [
  { name: "Season 25/26", value: 7_880, series: "navy" },
  { name: "Season 26/27", value: 7_830, series: "red" },
];

function money(thousands: number): string {
  return formatMoneyMillions(chfFromThousands(thousands));
}

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

function bar(name: string): HTMLElement {
  const found = slots("compare-bar").find(
    (candidate) => candidate.dataset.name === name,
  );
  if (!found) throw new Error(`no compare bar for "${name}"`);
  return found;
}

function fill(name: string): HTMLElement {
  return slot("compare-bar-fill", bar(name))!;
}

function widthOf(name: string): number {
  return Number(fill(name).style.width.replace("%", ""));
}

function valueOf(name: string): string {
  return slot("compare-bar-value", bar(name))!.textContent!;
}

/** Renders with the growth and the count-up run to completion. */
function renderSettled(ui: ReactElement): { frames: FrameStub } {
  const frames = stubFrames();
  render(ui);
  frames.advance();
  frames.advance(COUNT_UP_DURATION_MS);
  return { frames };
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ================================================== ONE SHARED SCALE ==== */

describe("CompareBars — one scale, or the comparison is a lie", () => {
  it("renders one labelled bar per row, in the order given", () => {
    renderSettled(<CompareBars rows={SEASONS} format={money} />);

    expect(slots("compare-bar")).toHaveLength(2);
    expect(slots("compare-bar-label").map((node) => node.textContent)).toEqual([
      "Season 25/26",
      "Season 26/27",
    ]);
  });

  it("scales every bar against the LARGEST figure, not its own", () => {
    renderSettled(<CompareBars rows={SEASONS} format={money} />);

    const max = hBarMax(SEASONS);
    expect(max).toBe(7_880);
    // The larger figure fills the track; the smaller reads as a proportion of
    // it — 99.37%, not 100%, which is the whole point of a shared scale.
    expect(widthOf("Season 25/26")).toBeCloseTo(100, 5);
    expect(widthOf("Season 26/27")).toBeCloseTo(hBarPercent(7_830, max), 5);
    expect(widthOf("Season 26/27")).toBeLessThan(widthOf("Season 25/26"));
  });

  it("borrows US-021's scale and width arithmetic rather than restating it", () => {
    // A second rounding rule or a second `Math.max` here is how two bars of the
    // same measure end up disagreeing.
    expect(CODE).toContain("hBarMax");
    expect(CODE).toContain("hBarPercent");
    expect(CODE).not.toMatch(/Math\.(max|abs|min)/);
    expect(CODE).not.toMatch(/toFixed/);
  });

  it("renders nothing at all when there is nothing to compare", () => {
    const { container } = render(<CompareBars rows={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("draws no bar, and no NaN, when every figure is zero", () => {
    renderSettled(
      <CompareBars rows={[{ name: "Budget", value: 0 }]} format={money} />,
    );

    expect(widthOf("Budget")).toBe(0);
    expect(fill("Budget").style.width).toBe("0%");
    expect(valueOf("Budget")).toBe("CHF 0M");
  });
});

/* ========================================================== THE FIGURE == */

describe("CompareBar — the figure carries the value", () => {
  it("formats every figure through the caller's formatter", () => {
    renderSettled(<CompareBars rows={SEASONS} format={money} />);

    expect(valueOf("Season 25/26")).toBe("CHF 7.88M");
    expect(valueOf("Season 26/27")).toBe("CHF 7.83M");
  });

  it("formats nothing itself", () => {
    // No currency unit and no thousands separator is assembled here; the one
    // `%` in the file is the CSS unit on the bar's own width.
    expect(CODE).not.toMatch(/CHF|’/);
    expect(CODE.match(/%/g)).toHaveLength(1);
    expect(CODE).toContain("format");
  });

  it("defaults to a plain grouped count", () => {
    renderSettled(<CompareBar name="Units" value={22_400} max={22_400} />);

    expect(valueOf("Units")).toBe(formatNumber(22_400));
  });

  it("counts up to the figure rather than appearing at it", () => {
    const frames = stubFrames();
    render(<CompareBars rows={SEASONS} format={money} />);

    frames.advance();
    const midway = valueOf("Season 25/26");
    frames.advance(COUNT_UP_DURATION_MS / 2);
    const later = valueOf("Season 25/26");
    frames.advance(COUNT_UP_DURATION_MS);

    expect(midway).not.toBe("CHF 7.88M");
    expect(later).not.toBe(midway);
    expect(valueOf("Season 25/26")).toBe("CHF 7.88M");
  });

  it("keeps the digits tabular, so two figures align while they count", () => {
    renderSettled(<CompareBars rows={SEASONS} format={money} />);

    for (const row of SEASONS) {
      expect(slot("compare-bar-value", bar(row.name))).toHaveClass(
        "tabular-nums",
      );
    }
  });

  it("hides the track from the accessibility tree — the figure is the value", () => {
    renderSettled(<CompareBars rows={SEASONS} format={money} />);

    for (const row of SEASONS) {
      expect(slot("compare-bar-track", bar(row.name))).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
  });
});

/* =========================================================== COLOURS ==== */

describe("CompareBar — colours are token references, named by the caller", () => {
  it("paints each bar with US-021's own series fill", () => {
    renderSettled(<CompareBars rows={SEASONS} format={money} />);

    expect(fill("Season 25/26").className).toContain(H_BAR_SERIES.navy);
    expect(fill("Season 26/27").className).toContain(H_BAR_SERIES.red);
  });

  it("defaults to the comparison year's navy", () => {
    renderSettled(<CompareBar name="Budget" value={10} max={10} />);

    expect(fill("Budget").className).toContain(H_BAR_SERIES.navy);
    expect(fill("Budget")).toHaveAttribute("data-series", "navy");
  });

  it("holds no colour table and no literal colour of its own", () => {
    expect(CODE).toContain("H_BAR_SERIES");
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\brgba?\(/);
    // No colour prop, so a caller cannot smuggle one in either.
    expect(CODE).not.toMatch(/color\??:/);
  });
});

/* ====================================================== MOTION ========== */

describe("CompareBars — motion, and the absence of it", () => {
  it("grows from nothing on the first paint", () => {
    stubFrames();
    render(<CompareBars rows={SEASONS} format={money} />);

    expect(widthOf("Season 25/26")).toBe(0);
    expect(fill("Season 25/26").className).toContain("transition-[width]");
  });

  it("grows the pair TOGETHER — a comparison is not a ranking", () => {
    renderSettled(<CompareBars rows={SEASONS} format={money} />);

    // No per-row stagger, in the DOM or in the source: two bars entering in
    // sequence would read as first and second place.
    for (const row of SEASONS) {
      expect(fill(row.name).style.transitionDelay).toBe("");
    }
    expect(CODE).not.toMatch(/transitionDelay|delayMs|STAGGER/);
  });

  it("states the final geometry outright under reduced motion", () => {
    stubMatchMedia(true);
    stubFrames();
    render(<CompareBars rows={SEASONS} format={money} />);

    // First render, no frames advanced: full width and the final figures.
    expect(widthOf("Season 25/26")).toBeCloseTo(100, 5);
    expect(valueOf("Season 25/26")).toBe("CHF 7.88M");
    expect(valueOf("Season 26/27")).toBe("CHF 7.83M");
  });

  it("holds no state and no timer of its own", () => {
    // Every piece of motion is US-027's hook; a local `setInterval` here would
    // be a second animation clock in the product.
    expect(CODE).not.toMatch(/useState|setTimeout|setInterval/);
    expect(CODE).toContain("useGrow");
    expect(CODE).toContain("useCountUp");
  });

  it("transitions the SAME bar when a figure changes", () => {
    const frames = stubFrames();
    const { rerender } = render(<CompareBars rows={SEASONS} format={money} />);
    frames.advance();
    frames.advance(COUNT_UP_DURATION_MS);
    const before = fill("Season 26/27");

    rerender(
      <CompareBars
        rows={[SEASONS[0]!, { ...SEASONS[1]!, value: 4_000 }]}
        format={money}
      />,
    );
    frames.advance(COUNT_UP_DURATION_MS);

    // Keyed by name: the element persists, so the width transitions from what
    // is on screen instead of the bar remounting at zero.
    expect(fill("Season 26/27")).toBe(before);
    expect(widthOf("Season 26/27")).toBeCloseTo(hBarPercent(4_000, 7_880), 5);
  });
});
