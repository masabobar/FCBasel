import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  AXIS_GUTTER,
  CHIP_BAND,
  DEFAULT_GROUPED_BAR_HEIGHT,
  GROUPED_BAR_SEASON,
  GROUPED_BAR_VIEW_WIDTH,
  GroupedBars,
  GroupedBarTile,
  groupedBarDelta,
  groupedBarGeometry,
  type GroupedBarGeometry,
  type GroupedBarGroup,
} from "../../app/components/charts/grouped-bars";
import {
  chfFromThousands,
  formatMoneyCompact,
  formatNumber,
  formatSignedMoneyCompact,
} from "../../app/lib/format";
import { VarianceDirection } from "../../app/lib/repositories/enums";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

const GROUPED_BARS_CODE = readFileSync(
  resolve(process.cwd(), "app/components/charts/grouped-bars.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/**
 * US-036 Hero 2, verbatim: the eight highest-grossing home fixtures, matchday
 * ticket revenue in CHF thousands, previous season (25/26) against the current
 * one (26/27). EIGHT PAIRS IS THE POINT — sixteen bars and eight chips in one
 * tile is exactly the density the gutter and the headroom exist for.
 */
const FIXTURES: readonly GroupedBarGroup[] = [
  { name: "YB", previous: 1_480, current: 1_610 },
  { name: "FCZ", previous: 1_390, current: 1_240 },
  { name: "Servette", previous: 980, current: 1_050 },
  { name: "St. Gallen", previous: 1_020, current: 1_090 },
  { name: "Luzern", previous: 890, current: 820 },
  { name: "Sion", previous: 760, current: 690 },
  { name: "GC", previous: 640, current: 720 },
  { name: "Lugano", previous: 720, current: 610 },
];

/** The same eight fixtures at a smaller scale — a data change, same names. */
const FIXTURES_HALVED: readonly GroupedBarGroup[] = FIXTURES.map((fixture) => ({
  ...fixture,
  previous: fixture.previous / 2,
  current: fixture.current / 2,
}));

/**
 * A restated dataset in which ONE fixture moves: YB's current season drops to
 * 900. The axis top is unchanged (YB's previous season is still the tallest
 * bar), so YB's red bar genuinely shrinks on screen — which is what makes this
 * a transition test rather than a re-scaling test.
 */
const FIXTURES_YB_DROP: readonly GroupedBarGroup[] = FIXTURES.map((fixture) =>
  fixture.name === "YB" ? { ...fixture, current: 900 } : fixture,
);

/**
 * A re-rank: the same fixtures in a different order. This is what separates
 * "keyed by fixture" from "keyed by index" — an index key reuses the element by
 * POSITION, so with an unchanged order it looks identical.
 */
const FIXTURES_RERANKED: readonly GroupedBarGroup[] = [...FIXTURES].reverse();

const PREVIOUS_SEASON = "25/26";
const CURRENT_SEASON = "26/27";

/** Hero 2 stores CHF thousands; every figure on screen goes through US-011. */
function money(thousands: number): string {
  return formatMoneyCompact(chfFromThousands(thousands));
}

function signedMoney(thousands: number): string {
  return formatSignedMoneyCompact(chfFromThousands(thousands));
}

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

/** The pair for a fixture, as the presenter would point at it. */
function pair(name: string): HTMLElement {
  const found = slots("grouped-bar-pair").find(
    (candidate) => candidate.dataset.name === name,
  );
  if (!found) throw new Error(`no pair for "${name}"`);
  return found;
}

function bar(name: string, season: "previous" | "current"): HTMLElement {
  const found = slots("grouped-bar", pair(name)).find(
    (candidate) => candidate.dataset.season === season,
  );
  if (!found) throw new Error(`no ${season} bar for "${name}"`);
  return found;
}

function barGeometry(name: string, season: "previous" | "current") {
  const rect = bar(name, season);
  return {
    x: rect.getAttribute("x"),
    y: rect.getAttribute("y"),
    height: rect.getAttribute("height"),
  };
}

function chipCell(name: string): HTMLElement {
  const found = slots("grouped-bar-chip-cell").find(
    (candidate) => candidate.dataset.name === name,
  );
  if (!found) throw new Error(`no chip cell for "${name}"`);
  return found;
}

function chip(name: string): HTMLElement {
  return slot("delta-chip", chipCell(name))!;
}

function plot(): HTMLElement {
  return slot("grouped-bars-plot")!;
}

/** The top of the tallest bar in the plot — the smallest `y` on screen. */
function tallestBarTop(geometry: GroupedBarGeometry): number {
  return Math.min(
    ...geometry.pairs.flatMap((one) => [one.previous.y, one.current.y]),
  );
}

/** A percentage written by the component, read back as a number. */
function percentOf(style: string): number {
  return Number(style.replace("%", ""));
}

/**
 * Renders and lets the growth land, so a geometry assertion sees grown bars
 * while still exercising the real (non-reduced) path.
 */
function renderSettled(ui: ReactElement) {
  const frames = stubFrames();
  const result = render(ui);
  frames.advance();
  frames.advance();
  return { ...result, frames };
}

function renderFixtures(
  props: Partial<Parameters<typeof GroupedBars>[0]> = {},
) {
  return renderSettled(
    <GroupedBars
      groups={FIXTURES}
      previousLabel={PREVIOUS_SEASON}
      currentLabel={CURRENT_SEASON}
      format={money}
      formatDelta={signedMoney}
      {...props}
    />,
  );
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

describe("groupedBarGeometry — the layout, without a DOM", () => {
  it("pairs two bars per fixture, side by side and centred on the slot", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;

    expect(geometry.pairs).toHaveLength(8);
    expect(geometry.width).toBe(GROUPED_BAR_VIEW_WIDTH);
    expect(geometry.height).toBe(DEFAULT_GROUPED_BAR_HEIGHT);

    for (const one of geometry.pairs) {
      // Previous on the left, current on the right, a gap between them.
      expect(one.previous.x).toBeLessThan(one.current.x);
      expect(one.previous.x + geometry.barWidth).toBeLessThan(one.current.x);
      // The pair straddles the slot centre.
      expect(one.previous.x + geometry.barWidth).toBeLessThanOrEqual(
        one.centerX,
      );
      expect(one.current.x).toBeGreaterThanOrEqual(one.centerX);
      // And stays inside its own slot, so pairs never touch.
      expect(one.previous.x).toBeGreaterThan(one.slotX);
      expect(one.current.x + geometry.barWidth).toBeLessThan(
        one.slotX + geometry.slotWidth,
      );
    }
  });

  it("stands every bar on the baseline, scaled against the axis top", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;

    for (const one of geometry.pairs) {
      for (const season of [one.previous, one.current]) {
        expect(season.y + season.height).toBeCloseTo(geometry.baselineY, 1);
        expect(season.height / geometry.plotHeight).toBeCloseTo(
          season.value / geometry.max,
          2,
        );
      }
    }
  });

  it("derives each pair's delta as current minus previous", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;
    const deltas = geometry.pairs.map((one) => one.delta);

    expect(deltas).toEqual([130, -150, 70, 70, -70, -70, 80, -110]);
  });

  it("treats a hole in either season as nothing rather than NaN", () => {
    expect(
      groupedBarDelta({ name: "x", previous: Number.NaN, current: 100 }),
    ).toBe(100);
    expect(
      groupedBarDelta({ name: "x", previous: 100, current: Number.NaN }),
    ).toBe(-100);

    const geometry = groupedBarGeometry([
      { name: "x", previous: Number.NaN, current: 100 },
    ])!;
    expect(geometry.pairs[0]!.previous.height).toBe(0);
    expect(Number.isFinite(geometry.max)).toBe(true);
  });

  it("labels the scale from zero to the axis top, on the gridlines", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;

    expect(geometry.ticks).toHaveLength(5);
    expect(geometry.ticks[0]).toEqual({ value: 0, y: geometry.baselineY });
    expect(geometry.ticks.at(-1)).toEqual({
      value: geometry.max,
      y: geometry.plotTop,
    });
    // Evenly spaced, top to bottom.
    for (const [index, tick] of geometry.ticks.entries()) {
      expect(tick.y).toBeCloseTo(
        geometry.baselineY - (index / 4) * geometry.plotHeight,
        1,
      );
    }
  });

  it("has nothing to draw for an empty list or an impossible height", () => {
    expect(groupedBarGeometry([])).toBeNull();
    expect(groupedBarGeometry(FIXTURES, 0)).toBeNull();
    expect(groupedBarGeometry(FIXTURES, -10)).toBeNull();
    expect(groupedBarGeometry(FIXTURES, Number.NaN)).toBeNull();
  });

  it("stays finite at a height too small to hold the chip band at all", () => {
    // Nothing is legible this small, but the headroom factor must not divide
    // by a negative band and put a NaN into every bar's height.
    const geometry = groupedBarGeometry(FIXTURES, 20)!;

    expect(geometry.barZoneHeight).toBeLessThan(0);
    for (const one of geometry.pairs) {
      expect(Number.isFinite(one.previous.height)).toBe(true);
      expect(one.previous.height).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(one.current.y)).toBe(true);
    }
  });

  it("takes a caller's height for the plot", () => {
    const geometry = groupedBarGeometry(FIXTURES, 320)!;

    expect(geometry.height).toBe(320);
    expect(geometry.plotHeight).toBeGreaterThan(
      groupedBarGeometry(FIXTURES)!.plotHeight,
    );
  });
});

describe("groupedBarGeometry — THE LEFT GUTTER (review decision 1)", () => {
  it("gives the scale a gutter of its own, ending before the plot starts", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;

    expect(geometry.axisGutter).toBe(AXIS_GUTTER);
    expect(geometry.axisGutter).toBeGreaterThan(0);
    // The figures are right-anchored INSIDE the gutter, so the text ends
    // before the plot's left edge — the axis and the plot cannot meet.
    expect(geometry.axisLabelX).toBeLessThan(geometry.plotLeft);
    expect(geometry.plotLeft).toBeGreaterThanOrEqual(geometry.axisGutter);
    expect(geometry.plotWidth).toBe(geometry.plotRight - geometry.plotLeft);
  });

  it("keeps every bar and every chip slot right of the gutter", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;

    for (const one of geometry.pairs) {
      expect(one.slotX).toBeGreaterThanOrEqual(geometry.plotLeft);
      expect(one.previous.x).toBeGreaterThan(geometry.plotLeft);
      // THE COLLISION THAT WAS REPORTED: a chip reaching back over the scale.
      expect(one.chipLeft).toBeGreaterThanOrEqual(geometry.plotLeft);
      expect(one.chipLeft).toBeGreaterThan(geometry.axisLabelX);
      expect(one.chipRight).toBeLessThanOrEqual(geometry.plotRight);
    }
  });

  it("leaves the gutter wide enough for the widest figure it holds", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;

    // The ticks are right-anchored, so a figure runs LEFTWARD from
    // `axisLabelX` inside the gutter. A compact money label at the chart-axis
    // size needs roughly 34 view-box units, and the gutter reserves that much
    // before the gap to the plot — the scale is never squeezed into the bars.
    expect(geometry.axisLabelX).toBeGreaterThanOrEqual(34);
    expect(geometry.plotLeft - geometry.axisLabelX).toBeGreaterThan(0);
    expect(geometry.plotWidth).toBeGreaterThan(geometry.axisGutter);
  });

  it("keeps the gutter clear whatever the number of fixtures", () => {
    for (const count of [1, 2, 4, 8]) {
      const geometry = groupedBarGeometry(FIXTURES.slice(0, count))!;

      expect(geometry.pairs).toHaveLength(count);
      for (const one of geometry.pairs) {
        expect(one.chipLeft).toBeGreaterThanOrEqual(geometry.plotLeft);
        expect(one.previous.x).toBeGreaterThan(geometry.axisLabelX);
      }
    }
  });
});

describe("groupedBarGeometry — NO CHIP COLLIDES (review decision 1 + 2)", () => {
  it("gives each chip its own slot, so no chip overlaps its neighbour", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;

    // Measured, not assumed: slot i ends at or before slot i+1 begins, for
    // every one of the eight pairs.
    for (const [index, one] of geometry.pairs.entries()) {
      expect(one.chipRight).toBeGreaterThan(one.chipLeft);
      const next = geometry.pairs[index + 1];
      if (!next) continue;
      expect(one.chipRight).toBeLessThanOrEqual(next.chipLeft);
    }

    // Every slot is the same width and they tile the plot exactly.
    const widths = geometry.pairs.map((one) => one.chipRight - one.chipLeft);
    expect(new Set(widths).size).toBe(1);
    expect(widths[0]! * geometry.pairs.length).toBeCloseTo(
      geometry.plotWidth,
      1,
    );
  });

  it("keeps the chip band clear of every bar it sits above", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;
    const bandBottom = geometry.chipBandTop + geometry.chipBandHeight;

    expect(geometry.chipBandTop).toBe(geometry.plotTop);
    expect(geometry.chipBandHeight).toBe(CHIP_BAND);
    for (const one of geometry.pairs) {
      expect(one.previous.y).toBeGreaterThanOrEqual(bandBottom);
      expect(one.current.y).toBeGreaterThanOrEqual(bandBottom);
    }
  });

  it("still holds when the chips are as many as the plot can hold", () => {
    const many: GroupedBarGroup[] = Array.from({ length: 14 }, (_, index) => ({
      name: `F${index}`,
      previous: 1_000 + index,
      current: 1_000 - index,
    }));
    const geometry = groupedBarGeometry(many)!;

    for (const [index, one] of geometry.pairs.entries()) {
      expect(one.chipLeft).toBeGreaterThanOrEqual(geometry.plotLeft);
      const next = geometry.pairs[index + 1];
      if (next) expect(one.chipRight).toBeLessThanOrEqual(next.chipLeft);
    }
  });
});

describe("groupedBarGeometry — THE HEADROOM (review decision 2)", () => {
  it("holds the axis top above the tallest bar by the whole chip band", () => {
    const geometry = groupedBarGeometry(FIXTURES)!;
    const tallest = tallestBarTop(geometry);

    // The plot's top is ABOVE the tallest bar's top (smaller y), by at least
    // the band the chips live in — this is the headroom, measured.
    expect(geometry.plotTop).toBeLessThan(tallest);
    expect(tallest - geometry.plotTop).toBeGreaterThanOrEqual(CHIP_BAND);
    expect(geometry.barZoneHeight).toBe(geometry.plotHeight - CHIP_BAND);
  });

  it("chooses an axis top no bar can reach, whatever the figures", () => {
    const datasets: readonly (readonly GroupedBarGroup[])[] = [
      FIXTURES,
      FIXTURES_HALVED,
      // A maximum sitting exactly on a round step — the case a fixed 10%
      // headroom would round away and leave the chip touching the bar.
      [{ name: "a", previous: 1_000, current: 2_000 }],
      [{ name: "a", previous: 500, current: 500 }],
      [{ name: "a", previous: 1, current: 1 }],
      [{ name: "a", previous: 0, current: 0 }],
      [
        { name: "a", previous: 9_999, current: 10_000 },
        { name: "b", previous: 1, current: 2 },
      ],
    ];

    for (const groups of datasets) {
      for (const height of [160, DEFAULT_GROUPED_BAR_HEIGHT, 400]) {
        const geometry = groupedBarGeometry(groups, height)!;
        const tallest = tallestBarTop(geometry);

        expect(tallest - geometry.plotTop).toBeGreaterThanOrEqual(CHIP_BAND);
        for (const one of geometry.pairs) {
          expect(one.previous.height).toBeLessThanOrEqual(
            geometry.barZoneHeight,
          );
          expect(one.current.height).toBeLessThanOrEqual(
            geometry.barZoneHeight,
          );
        }
      }
    }
  });
});

describe("GroupedBars — sixteen bars, navy against red", () => {
  it("renders two bars per fixture: eight pairs, sixteen bars", () => {
    renderFixtures();

    expect(slots("grouped-bar-pair")).toHaveLength(8);
    expect(slots("grouped-bar")).toHaveLength(16);
    for (const fixture of FIXTURES) {
      expect(slots("grouped-bar", pair(fixture.name))).toHaveLength(2);
    }
  });

  it("paints the previous season navy and the current season red", () => {
    renderFixtures();

    const gradients = slots("grouped-bar-gradient");
    expect(gradients).toHaveLength(2);

    const stopColour = (season: "previous" | "current"): string | null => {
      const id = bar("YB", season)
        .getAttribute("fill")!
        .replace("url(#", "")
        .replace(")", "");
      return document
        .getElementById(id)!
        .querySelector("stop")!
        .getAttribute("stop-color");
    };

    expect(stopColour("previous")).toBe(GROUPED_BAR_SEASON.previous);
    expect(stopColour("current")).toBe(GROUPED_BAR_SEASON.current);
    // Navy for last season, club red for this one — the tokens, not hexes.
    expect(GROUPED_BAR_SEASON.previous).toBe("var(--color-series-tertiary)");
    expect(GROUPED_BAR_SEASON.current).toBe("var(--color-series-primary)");
  });

  it("grows both bars of a pair from the baseline to their own share", () => {
    const frames = stubFrames();
    render(<GroupedBars groups={FIXTURES} />);

    const geometry = groupedBarGeometry(FIXTURES)!;
    expect(barGeometry("YB", "current").height).toBe("0");
    expect(barGeometry("YB", "current").y).toBe(String(geometry.baselineY));

    frames.advance();
    frames.advance();

    expect(barGeometry("YB", "current")).toEqual({
      x: String(geometry.pairs[0]!.current.x),
      y: String(geometry.pairs[0]!.current.y),
      height: String(geometry.pairs[0]!.current.height),
    });
    // YB is up year on year, so its red bar is taller than its navy one.
    expect(Number(barGeometry("YB", "current").height)).toBeGreaterThan(
      Number(barGeometry("YB", "previous").height),
    );
    // FCZ is down, so the reverse.
    expect(Number(barGeometry("FCZ", "current").height)).toBeLessThan(
      Number(barGeometry("FCZ", "previous").height),
    );
  });

  it("transitions height AND position in CSS, timed from the motion token", () => {
    renderFixtures();

    expect(bar("YB", "current")).toHaveClass(
      "transition-[y,height]",
      "duration-(--duration-grow)",
      "ease-enter",
    );
    expect(APP_CSS).toMatch(/--duration-grow:/);
    expect(APP_CSS).toMatch(/--ease-enter:/);
  });

  it("draws the gridlines and the axis the bars stand on", () => {
    renderFixtures();

    expect(slots("grouped-bar-grid")).toHaveLength(5);
    expect(slot("grouped-bar-grid")).toHaveClass("stroke-line");
    expect(slot("grouped-bar-axis")).toHaveClass("stroke-border");
  });

  it("keeps the plot itself out of the accessibility tree", () => {
    renderFixtures({ label: "Ticket revenue by fixture" });

    expect(slot("grouped-bars-svg")).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByRole("group", { name: "Ticket revenue by fixture" }),
    ).toBe(plot());
  });
});

describe("GroupedBars — the scale in its gutter, on screen", () => {
  it("writes every tick in the gutter, right-anchored and formatted", () => {
    renderFixtures();

    const geometry = groupedBarGeometry(FIXTURES)!;
    const labels = slots("grouped-bar-axis-label");

    expect(labels).toHaveLength(5);
    for (const [index, label] of labels.entries()) {
      expect(label).toHaveAttribute("text-anchor", "end");
      expect(label).toHaveAttribute("x", String(geometry.axisLabelX));
      expect(label.textContent).toBe(money(geometry.ticks[index]!.value));
    }
    // The scale reads in the app's own money format, never a bare number.
    expect(labels.at(-1)!.textContent).toBe(money(geometry.max));
  });

  it("insets the chip strip, the fixture strip and the legend by the gutter", () => {
    renderFixtures();

    const geometry = groupedBarGeometry(FIXTURES)!;
    const gutterPercent = (geometry.plotLeft / geometry.width) * 100;

    expect(percentOf(slot("grouped-bar-chips")!.style.left)).toBeCloseTo(
      gutterPercent,
      3,
    );
    expect(
      percentOf(slot("grouped-bar-labels")!.style.paddingLeft),
    ).toBeCloseTo(gutterPercent, 3);
    expect(
      percentOf(slot("grouped-bar-legend")!.style.paddingLeft),
    ).toBeCloseTo(gutterPercent, 3);
  });
});

describe("GroupedBars — a delta chip above every pair", () => {
  it("puts one chip in its own cell above each of the eight pairs", () => {
    renderFixtures();

    expect(slots("grouped-bar-chip-cell")).toHaveLength(8);
    expect(slots("delta-chip", slot("grouped-bar-chips")!)).toHaveLength(8);
    for (const fixture of FIXTURES) {
      expect(chip(fixture.name)).not.toBeNull();
    }
  });

  it("states the movement with an arrow, an explicit sign and a word", () => {
    renderFixtures();

    expect(chip("YB")).toHaveAttribute("data-direction", VarianceDirection.UP);
    expect(chip("YB")).toHaveTextContent(signedMoney(130));
    expect(chip("YB")).toHaveTextContent("up");
    expect(slot("delta-arrow", chip("YB"))).not.toBeNull();

    expect(chip("FCZ")).toHaveAttribute(
      "data-direction",
      VarianceDirection.DOWN,
    );
    expect(chip("FCZ")).toHaveTextContent(signedMoney(-150));
    expect(chip("FCZ")).toHaveTextContent("down");
  });

  it("renders mixed signs in both directions across one tile", () => {
    renderFixtures();

    const directions = FIXTURES.map(
      (fixture) => chip(fixture.name).dataset.direction,
    );

    expect(directions).toEqual([
      VarianceDirection.UP,
      VarianceDirection.DOWN,
      VarianceDirection.UP,
      VarianceDirection.UP,
      VarianceDirection.DOWN,
      VarianceDirection.DOWN,
      VarianceDirection.UP,
      VarianceDirection.DOWN,
    ]);
    expect(new Set(directions).size).toBe(2);
  });

  it("labels an unchanged fixture as unchanged rather than as a rise", () => {
    renderSettled(
      <GroupedBars
        groups={[{ name: "Flat", previous: 900, current: 900 }]}
        formatDelta={signedMoney}
      />,
    );

    expect(chip("Flat")).toHaveAttribute(
      "data-direction",
      VarianceDirection.FLAT,
    );
    expect(chip("Flat")).toHaveTextContent("unchanged");
  });

  it("lays the cells out as equal, non-overlapping flex slots", () => {
    renderFixtures();

    // Flex items cannot overlap: this is the layout half of the collision fix,
    // read off the rendered cells rather than assumed.
    for (const fixture of FIXTURES) {
      expect(chipCell(fixture.name)).toHaveClass(
        "flex-1",
        "min-w-0",
        "justify-center",
      );
    }
    expect(slot("grouped-bar-chips")).toHaveClass("absolute", "flex");
  });

  it("confines the strip to the reserved headroom band", () => {
    renderFixtures();

    const geometry = groupedBarGeometry(FIXTURES)!;
    const strip = slot("grouped-bar-chips")!;
    const top = percentOf(strip.style.top);
    const height = percentOf(strip.style.height);

    expect(top).toBeCloseTo((geometry.chipBandTop / geometry.height) * 100, 3);
    expect(height).toBeCloseTo(
      (geometry.chipBandHeight / geometry.height) * 100,
      3,
    );
    // The band ends above every bar on screen — the headroom, on the DOM.
    const bandBottom =
      ((geometry.chipBandTop + geometry.chipBandHeight) / geometry.height) *
      100;
    expect(top + height).toBeCloseTo(bandBottom, 3);
    for (const fixture of FIXTURES) {
      const y = Number(barGeometry(fixture.name, "current").y);
      expect((y / geometry.height) * 100).toBeGreaterThanOrEqual(bandBottom);
    }
  });
});

describe("GroupedBars — the per-fixture hover tooltip (criterion 3)", () => {
  it("shows both seasons and the delta for the hovered fixture", () => {
    renderFixtures();

    expect(slot("grouped-bars-tooltip")).toBeNull();
    fireEvent.mouseEnter(pair("FCZ"));

    const box = slot("grouped-bars-tooltip")!;
    expect(box).toHaveTextContent("FCZ");
    expect(box).toHaveTextContent(`${PREVIOUS_SEASON} ${money(1_390)}`);
    expect(box).toHaveTextContent(`${CURRENT_SEASON} ${money(1_240)}`);
    expect(slot("delta-chip", box)).toHaveTextContent(signedMoney(-150));
    expect(slot("delta-chip", box)).toHaveAttribute(
      "data-direction",
      VarianceDirection.DOWN,
    );
    expect(box).toHaveAttribute("role", "status");
  });

  it("follows the pointer to another fixture, and highlights only that pair", () => {
    renderFixtures();

    fireEvent.mouseEnter(pair("YB"));
    expect(pair("YB")).toHaveAttribute("data-hovered", "true");
    expect(pair("GC")).toHaveAttribute("data-hovered", "false");
    expect(bar("YB", "current")).toHaveClass("brightness-110");

    fireEvent.mouseEnter(pair("GC"));
    expect(slot("grouped-bars-tooltip")).toHaveTextContent(
      `${CURRENT_SEASON} ${money(720)}`,
    );
    expect(bar("YB", "current")).not.toHaveClass("brightness-110");
  });

  it("hovers the whole slot, so a short fixture is as reachable as a tall one", () => {
    renderFixtures();

    const geometry = groupedBarGeometry(FIXTURES)!;
    const hit = slot("grouped-bar-hit", pair("Lugano"))!;

    expect(hit).toHaveAttribute("width", String(geometry.slotWidth));
    expect(hit).toHaveAttribute("height", String(geometry.plotHeight));
    expect(hit).toHaveAttribute("fill", "transparent");
  });

  it("clears the tooltip when the pointer or focus leaves", () => {
    renderFixtures();

    fireEvent.mouseEnter(pair("YB"));
    expect(slot("grouped-bars-tooltip")).not.toBeNull();

    fireEvent.mouseLeave(plot());
    expect(slot("grouped-bars-tooltip")).toBeNull();

    fireEvent.mouseEnter(pair("YB"));
    fireEvent.blur(plot());
    expect(slot("grouped-bars-tooltip")).toBeNull();
  });

  it("is keyboard reachable and arrow-driven, without trapping focus", () => {
    renderFixtures();

    expect(plot()).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(slot("grouped-bars-tooltip")).toHaveTextContent("YB");

    fireEvent.keyDown(plot(), { key: "End" });
    expect(slot("grouped-bars-tooltip")).toHaveTextContent("Lugano");

    fireEvent.keyDown(plot(), { key: "Escape" });
    expect(slot("grouped-bars-tooltip")).toBeNull();

    // Tab is not captured — the tab order is untouched.
    const tab = fireEvent.keyDown(plot(), { key: "Tab" });
    expect(tab).toBe(true);
  });

  it("pins the box over the hovered pair, flipped inside the plot at the edges", () => {
    renderFixtures();

    const geometry = groupedBarGeometry(FIXTURES)!;

    fireEvent.mouseEnter(pair("YB"));
    let box = slot("grouped-bars-tooltip")!;
    expect(percentOf(box.style.left)).toBeCloseTo(
      (geometry.pairs[0]!.centerX / geometry.width) * 100,
      3,
    );
    // The gutter already pushes the first pair clear of the left edge, so at
    // eight fixtures every box is centred until the last one.
    expect(box.style.transform).toBe("translateX(-50%)");

    fireEvent.mouseEnter(pair("Lugano"));
    box = slot("grouped-bars-tooltip")!;
    expect(box.style.transform).toBe("translateX(-100%)");

    fireEvent.mouseEnter(pair("St. Gallen"));
    box = slot("grouped-bars-tooltip")!;
    expect(box.style.transform).toBe("translateX(-50%)");
  });

  it("sits below the chip band, so it never covers the movement", () => {
    renderFixtures();

    const geometry = groupedBarGeometry(FIXTURES)!;
    fireEvent.mouseEnter(pair("YB"));

    expect(percentOf(slot("grouped-bars-tooltip")!.style.top)).toBeCloseTo(
      ((geometry.chipBandTop + geometry.chipBandHeight) / geometry.height) *
        100,
      3,
    );
  });

  it("flips the box off the left edge in a denser chart", () => {
    // With fourteen pairs the first slot's centre falls inside the edge band,
    // which is the only way to reach `tooltipAnchor`'s left branch here.
    const many: GroupedBarGroup[] = Array.from({ length: 14 }, (_, index) => ({
      name: `F${index}`,
      previous: 900,
      current: 950,
    }));
    renderSettled(<GroupedBars groups={many} />);

    fireEvent.mouseEnter(pair("F0"));
    expect(slot("grouped-bars-tooltip")!.style.transform).toBe("translateX(0)");
  });

  it("lets a caller replace the body with its own renderer", () => {
    renderFixtures({
      tooltip: (index) => {
        const fixture = FIXTURES[index]!;
        return (
          <span data-slot="fixture-tip">
            {`${fixture.name} · ${money(fixture.current)}`}
          </span>
        );
      },
    });

    fireEvent.mouseEnter(pair("Servette"));
    expect(slot("fixture-tip")).toHaveTextContent(`Servette · ${money(1_050)}`);
    expect(slot("grouped-bars-tooltip-season")).toBeNull();
  });
});

describe("GroupedBars — pairs persist across a data change", () => {
  it("keeps the SAME rects per fixture, so nothing snaps to zero", () => {
    const { rerender } = renderFixtures();

    const before = Object.fromEntries(
      FIXTURES.map((fixture) => [
        fixture.name,
        [bar(fixture.name, "previous"), bar(fixture.name, "current")],
      ]),
    );
    const grown = barGeometry("YB", "current");
    expect(Number(grown.height)).toBeGreaterThan(0);

    rerender(
      <GroupedBars
        groups={FIXTURES_YB_DROP}
        format={money}
        formatDelta={signedMoney}
      />,
    );

    for (const fixture of FIXTURES) {
      // Element identity: the very same DOM nodes, not fresh ones.
      expect(bar(fixture.name, "previous")).toBe(before[fixture.name]![0]);
      expect(bar(fixture.name, "current")).toBe(before[fixture.name]![1]);
    }

    // The surviving rect's own geometry moved, which is what the CSS
    // transition runs on — a remount would have put it back at zero height.
    const after = barGeometry("YB", "current");
    const expected = groupedBarGeometry(FIXTURES_YB_DROP)!.pairs[0]!.current;
    expect(Number(after.height)).toBeGreaterThan(0);
    expect(Number(after.height)).toBeLessThan(Number(grown.height));
    expect(Number(after.y)).toBeGreaterThan(Number(grown.y));
    expect(after.height).toBe(String(expected.height));

    // Nothing else was disturbed: the axis top did not move.
    expect(chip("YB")).toHaveTextContent(signedMoney(-580));
    expect(chip("FCZ")).toHaveTextContent(signedMoney(-150));
  });

  it("keeps its rects when the fixtures RE-RANK — the index-key proof", () => {
    // With an index key this fails: `YB` would be handed the element of
    // whatever now sits in the first slot.
    const { rerender } = renderFixtures();

    const before = Object.fromEntries(
      FIXTURES.map((fixture) => [fixture.name, bar(fixture.name, "current")]),
    );
    const wasAt = barGeometry("YB", "current").x;

    rerender(
      <GroupedBars
        groups={FIXTURES_RERANKED}
        format={money}
        formatDelta={signedMoney}
      />,
    );

    for (const fixture of FIXTURES) {
      expect(bar(fixture.name, "current")).toBe(before[fixture.name]);
    }

    // Position transitions too: YB is now in the last slot.
    const reranked = groupedBarGeometry(FIXTURES_RERANKED)!;
    expect(Number(barGeometry("YB", "current").x)).toBeGreaterThan(
      Number(wasAt),
    );
    expect(barGeometry("YB", "current").x).toBe(
      String(reranked.pairs[7]!.current.x),
    );
  });

  it("keeps each chip with its OWN fixture when they re-rank", () => {
    const { rerender } = renderFixtures();

    const cells = Object.fromEntries(
      FIXTURES.map((fixture) => [fixture.name, chipCell(fixture.name)]),
    );

    rerender(
      <GroupedBars
        groups={FIXTURES_RERANKED}
        format={money}
        formatDelta={signedMoney}
      />,
    );

    for (const fixture of FIXTURES) {
      expect(chipCell(fixture.name)).toBe(cells[fixture.name]);
    }
    expect(chip("YB")).toHaveTextContent(signedMoney(130));
    expect(chip("FCZ")).toHaveTextContent(signedMoney(-150));
  });

  it("grows a fixture that is genuinely new, without disturbing the rest", () => {
    const { rerender } = renderSettled(
      <GroupedBars groups={FIXTURES.slice(0, 7)} />,
    );
    const yb = bar("YB", "current");

    rerender(<GroupedBars groups={FIXTURES} />);

    expect(bar("YB", "current")).toBe(yb);
    expect(Number(barGeometry("YB", "current").height)).toBeGreaterThan(0);
    expect(bar("Lugano", "current")).not.toBeNull();
  });
});

describe("GroupedBars — the fixture labels", () => {
  it("labels every pair in the DOM, under its own slot", () => {
    renderFixtures();

    const labels = slots("grouped-bar-label").map((one) => one.textContent);
    expect(labels).toEqual(FIXTURES.map((fixture) => fixture.name));
  });

  it("WRAPS a long fixture name rather than clipping it", () => {
    renderFixtures();

    const long = slots("grouped-bar-label").find(
      (one) => one.textContent === "St. Gallen",
    )!;

    expect(long).toHaveClass("break-words", "min-w-0", "flex-1");
    expect(long.className).not.toMatch(/truncate|text-ellipsis|line-clamp/);
    expect(long).not.toHaveClass("whitespace-nowrap");
  });

  it("names both seasons in a legend, with the word beside the swatch", () => {
    renderFixtures();

    const items = slots("grouped-bar-legend-item");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(PREVIOUS_SEASON);
    expect(items[1]).toHaveTextContent(CURRENT_SEASON);
    // The swatch is decoration; the label is what a projector cannot wash out.
    expect(slot("grouped-bar-legend-swatch", items[0]!)).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(slot("grouped-bar-legend")).toHaveClass("flex-wrap");
  });
});

describe("GroupedBars — a zero reading", () => {
  it("renders a LABELLED zero rather than an invisible bar", () => {
    renderSettled(
      <GroupedBars
        groups={[
          { name: "Sold out", previous: 900, current: 0 },
          { name: "Normal", previous: 800, current: 850 },
        ]}
        format={money}
        formatDelta={signedMoney}
      />,
    );

    expect(barGeometry("Sold out", "current").height).toBe("0");
    const zero = slots("grouped-bar-zero");
    expect(zero).toHaveLength(1);
    expect(zero[0]).toHaveTextContent(money(0));
    expect(zero[0]).toHaveAttribute("data-season", "current");

    // And it still says what happened, through the chip.
    expect(chip("Sold out")).toHaveTextContent(signedMoney(-900));
  });

  it("renders an all-zero tile without a NaN height", () => {
    renderSettled(
      <GroupedBars
        groups={[{ name: "None", previous: 0, current: 0 }]}
        format={money}
      />,
    );

    for (const rect of slots("grouped-bar")) {
      expect(rect.getAttribute("height")).toBe("0");
      expect(rect.getAttribute("y")).not.toMatch(/NaN/);
    }
    expect(slots("grouped-bar-zero")).toHaveLength(2);
  });

  it("renders nothing at all for an empty list", () => {
    const { container } = renderSettled(<GroupedBars groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("GroupedBars — two charts on one screen", () => {
  it("gives each instance its own gradient ids, each bar pointing at its own", () => {
    renderSettled(
      <div>
        <GroupedBars groups={FIXTURES} />
        <GroupedBars groups={FIXTURES} />
      </div>,
    );

    const ids = slots("grouped-bar-gradient").map((one) => one.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);

    for (const rect of slots("grouped-bar")) {
      const target = rect.getAttribute("fill")!.slice(5, -1);
      expect(ids).toContain(target);
      // The bar points at a gradient in ITS OWN chart.
      const chart = rect.closest("[data-slot='grouped-bars']")!;
      expect(
        [...chart.querySelectorAll("[data-slot='grouped-bar-gradient']")].map(
          (one) => one.id,
        ),
      ).toContain(target);
    }
  });
});

describe("GroupedBars — reduced motion", () => {
  it("renders the final heights immediately, nothing stranded at zero", () => {
    stubMatchMedia(true);
    const frames = stubFrames();

    render(
      <GroupedBars
        groups={FIXTURES}
        format={money}
        formatDelta={signedMoney}
      />,
    );

    const geometry = groupedBarGeometry(FIXTURES)!;
    expect(barGeometry("YB", "current")).toEqual({
      x: String(geometry.pairs[0]!.current.x),
      y: String(geometry.pairs[0]!.current.y),
      height: String(geometry.pairs[0]!.current.height),
    });
    for (const rect of slots("grouped-bar")) {
      expect(Number(rect.getAttribute("height"))).toBeGreaterThan(0);
    }
    // No animation was even requested — the last frame is the first frame.
    expect(frames.requested()).toBe(0);
  });

  it("moves straight to the new heights on a data change", () => {
    stubMatchMedia(true);
    const frames = stubFrames();
    const { rerender } = render(<GroupedBars groups={FIXTURES} />);

    rerender(<GroupedBars groups={FIXTURES_HALVED} />);

    const halved = groupedBarGeometry(FIXTURES_HALVED)!;
    expect(barGeometry("YB", "current").height).toBe(
      String(halved.pairs[0]!.current.height),
    );
    expect(frames.requested()).toBe(0);
  });
});

describe("GroupedBarTile — the card around the bars", () => {
  it("is the shared Card, not a second card anatomy", () => {
    renderSettled(
      <GroupedBarTile title="Ticket revenue by fixture" groups={FIXTURES} />,
    );

    expect(slot("card")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Ticket revenue by fixture" }),
    ).toHaveClass("tile-title");
    expect(slot("grouped-bars", slot("card")!)).not.toBeNull();
  });

  it("forwards the card's own slots rather than restating them", () => {
    renderSettled(
      <GroupedBarTile
        title="Ticket revenue by fixture"
        period="eight highest-grossing home fixtures"
        groups={FIXTURES}
        headingLevel={2}
        icon={<span>icon</span>}
        action={<span>filter</span>}
        accent="red"
        caption="FCZ is the single biggest drop"
        isNew
        delayMs={80}
        className="col-span-2"
      />,
    );

    expect(slot("card-subtitle")).toHaveTextContent(
      "eight highest-grossing home fixtures",
    );
    expect(slot("card-icon")).not.toBeNull();
    expect(slot("card-action")).toHaveTextContent("filter");
    expect(slot("card-accent")).not.toBeNull();
    expect(slot("card-caption")).toHaveTextContent("biggest drop");
    expect(slot("card")).toHaveClass("fcb-enter", "col-span-2");
    expect(slot("card")!.style.animationDelay).toBe("80ms");
    expect(
      screen.getByRole("heading", { level: 2, name: /Ticket revenue/ }),
    ).not.toBeNull();
  });
});

describe("GroupedBarTile — the consumer it was designed for (US-036 Hero 2)", () => {
  it("carries eight fixtures, sixteen bars, eight chips and a fixture tooltip", () => {
    renderSettled(
      <GroupedBarTile
        title="Matchday ticket revenue by fixture"
        period="eight highest-grossing home fixtures"
        groups={FIXTURES}
        previousLabel={PREVIOUS_SEASON}
        currentLabel={CURRENT_SEASON}
        format={money}
        formatDelta={signedMoney}
        label="Matchday ticket revenue by fixture, both seasons"
      />,
    );

    expect(slots("grouped-bar")).toHaveLength(16);
    expect(slots("delta-chip", slot("grouped-bar-chips")!)).toHaveLength(8);
    expect(slots("grouped-bar-label").map((one) => one.textContent)).toEqual([
      "YB",
      "FCZ",
      "Servette",
      "St. Gallen",
      "Luzern",
      "Sion",
      "GC",
      "Lugano",
    ]);

    // The biggest drop, as the narrative names it.
    expect(chip("FCZ")).toHaveTextContent(signedMoney(-150));

    fireEvent.mouseEnter(pair("St. Gallen"));
    const box = slot("grouped-bars-tooltip")!;
    expect(box).toHaveTextContent("St. Gallen");
    expect(box).toHaveTextContent(`${PREVIOUS_SEASON} ${money(1_020)}`);
    expect(box).toHaveTextContent(`${CURRENT_SEASON} ${money(1_090)}`);
    expect(slot("delta-chip", box)).toHaveTextContent(signedMoney(70));
  });
});

describe("GroupedBars — values come from tokens and formatters, never literals", () => {
  it("uses no hardcoded colour", () => {
    expect(GROUPED_BARS_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(GROUPED_BARS_CODE).not.toMatch(/\brgba?\(/);
  });

  it("names its season colours from the series tokens only", () => {
    for (const value of Object.values(GROUPED_BAR_SEASON)) {
      expect(value).toMatch(/^var\(--color-series-\w+\)$/);
      expect(APP_CSS).toMatch(
        new RegExp(`${value.slice(4, -1)}:`.replaceAll("-", "\\-")),
      );
    }
  });

  it("writes no currency string and no percentage of its own", () => {
    expect(GROUPED_BARS_CODE).not.toMatch(/CHF/);
    expect(GROUPED_BARS_CODE).not.toMatch(/toLocaleString/);
    expect(GROUPED_BARS_CODE).not.toMatch(/toFixed\(\d\)%/);
  });

  it("defaults every figure to a formatter from the format module", () => {
    renderSettled(<GroupedBars groups={FIXTURES} />);

    // No `format` prop: the axis and the chip still read as app-formatted
    // strings, never as raw JavaScript numbers.
    expect(slots("grouped-bar-axis-label").at(-1)!.textContent).toBe(
      formatNumber(groupedBarGeometry(FIXTURES)!.max),
    );
    expect(chip("YB")).toHaveTextContent("+130");
  });

  it("keeps the figures tabular, so a column of chips stays aligned", () => {
    renderFixtures();

    expect(slot("grouped-bar-axis-label")).toHaveClass("tabular-nums");
    fireEvent.mouseEnter(pair("YB"));
    expect(slot("grouped-bars-tooltip-season")).toHaveClass("tabular-nums");
  });

  it("uses no dangerouslySetInnerHTML", () => {
    expect(GROUPED_BARS_CODE).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it("uses the shared hooks rather than motion of its own", () => {
    expect(GROUPED_BARS_CODE).toMatch(/useGrow\(\)/);
    expect(GROUPED_BARS_CODE).toMatch(/useUid\(/);
    expect(GROUPED_BARS_CODE).not.toMatch(/matchMedia/);
    expect(GROUPED_BARS_CODE).not.toMatch(/setTimeout/);
    expect(GROUPED_BARS_CODE).not.toMatch(/requestAnimationFrame/);
  });
});
