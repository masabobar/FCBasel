import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  axisLabelAnchor,
  axisLabelShown,
  DEFAULT_LINE_CHART_HEIGHT,
  hoverIndex,
  LINE_CHART_VIEW_WIDTH,
  LINE_SERIES_COLORS,
  LineChart,
  LineChartLegend,
  LineChartTile,
  lineChartBounds,
  lineChartGeometry,
  lineSeriesColorToken,
  nextHoverIndex,
  NO_HOVER,
  smoothPath,
  tooltipAnchor,
  valueAt,
  type LineSeries,
} from "../../app/components/charts/line-chart";
import {
  chfFromThousands,
  formatMoney,
  formatMoneyCompact,
} from "../../app/lib/format";
import { cssVariable } from "../../app/lib/tokens";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

const LINE_CHART_CODE = readFileSync(
  resolve(process.cwd(), "app/components/charts/line-chart.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/* ------------------------------------------------------------- FIXTURES -- */

/**
 * The hero band's webshop chart (US-016): six weeks of the selected period
 * against the same six of the previous one — a gold area line over a dashed
 * white line.
 */
const BAND_XS = ["W1", "W2", "W3", "W4", "W5", "W6"] as const;
const BAND_CURRENT = [
  118_400, 126_900, 121_200, 134_800, 129_500, 148_200,
] as const;
const BAND_PREVIOUS = [
  112_100, 118_300, 116_400, 121_900, 120_800, 132_700,
] as const;

const BAND_SERIES: readonly LineSeries[] = [
  { name: "Previous", values: BAND_PREVIOUS, color: "white", dash: true },
  { name: "This month", values: BAND_CURRENT, color: "gold", area: true },
];

/**
 * Hero 2's month-by-month chart (US-036): twelve months, both seasons, the
 * current one filled. July of the previous season is a real ZERO — the month
 * with no home fixture — which is why it is in the fixture.
 */
const MONTH_XS = [
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
] as const;
const SEASON_2526 = [
  0, 920, 1_180, 1_040, 860, 640, 720, 980, 1_120, 1_060, 900, 480,
] as const;
const SEASON_2627 = [
  210, 980, 1_240, 990, 820, 610, 690, 1_010, 1_080, 1_140, 960, 520,
] as const;

const MONTH_SERIES: readonly LineSeries[] = [
  { name: "Season 25/26", values: SEASON_2526, color: "navy" },
  { name: "Season 26/27", values: SEASON_2627, color: "red", area: true },
];

/** Hero 2 stores CHF thousands; the formatter composition is the caller's. */
const thousands = (value: number): string =>
  formatMoneyCompact(chfFromThousands(value));

/* --------------------------------------------------------------- HELPERS -- */

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

function plot(within: ParentNode = document): HTMLElement {
  const found = slot("line-chart-plot", within);
  if (!found) throw new Error("no plot area");
  return found;
}

/**
 * An element's class list, read off the attribute.
 *
 * `element.className` is an `SVGAnimatedString` on an svg node, not a string,
 * so comparing two of those compares two objects and always "differs" —
 * which would make the light-versus-dark assertions below pass for free.
 */
function classOf(element: Element | null): string | null {
  return element?.getAttribute("class") ?? null;
}

/** The line drawn for a named series. */
function lineFor(name: string, within: ParentNode = document): HTMLElement {
  const found = slots("line-chart-line", within).find(
    (candidate) => candidate.dataset.series === name,
  );
  if (!found) throw new Error(`no line for series "${name}"`);
  return found;
}

/**
 * jsdom lays nothing out, so every box is 0x0 and a pointer position cannot be
 * mapped to a data index. The plot's box is stated here instead, which is also
 * what makes "hovered at this x" an exact assertion.
 */
function stubPlotBox(element: HTMLElement, left = 0, width = 600): void {
  element.getBoundingClientRect = (): DOMRect =>
    ({
      left,
      width,
      right: left + width,
      top: 0,
      bottom: 0,
      height: 0,
      x: left,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** Hover the point at `index` of `count`, through the real pointer path. */
function hoverPoint(index: number, count: number): void {
  const area = plot();
  stubPlotBox(area);
  fireEvent.mouseMove(area, { clientX: (index / (count - 1)) * 600 });
}

/** Renders with the entrance animation run to completion. */
function renderDrawn(ui: ReactElement) {
  const frames = stubFrames();
  const result = render(ui);
  frames.advance();
  frames.advance();
  return { ...result, frames };
}

/** The tooltip, as a presenter reads it: the heading and every row. */
function tooltipRows(): string[] {
  return slots("line-chart-tooltip-row").map((row) =>
    [...row.children].map((cell) => cell.textContent).join("|"),
  );
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* =========================================================== GEOMETRY === */

describe("smoothPath — the reference build's smoothing", () => {
  it("draws a quadratic through each point to the midpoint of the segment", () => {
    expect(
      smoothPath([
        [0, 10],
        [10, 30],
        [20, 20],
      ]),
    ).toBe("M 0,10 Q 0,10 5,20 Q 10,30 15,25 L 20,20");
  });

  it("is deterministic — the same points always produce the same string", () => {
    const points = [
      [0, 4],
      [8, 12],
      [16, 6],
    ] as const;

    expect(smoothPath(points)).toBe(smoothPath([...points]));
  });

  it("has nothing to draw for fewer than two points", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([[0, 0]])).toBe("");
  });

  it("rounds coordinates rather than emitting float noise into `d`", () => {
    expect(
      smoothPath([
        [0, 1 / 3],
        [1, 2 / 3],
      ]),
    ).toBe("M 0,0.33 Q 0,0.33 0.5,0.5 L 1,0.67");
  });
});

describe("lineChartBounds — one shared scale", () => {
  it("spans every series, so two seasons are comparable", () => {
    const { min, max } = lineChartBounds(MONTH_XS.length, [
      SEASON_2526,
      SEASON_2627,
    ]);

    expect(min).toBeLessThan(0);
    expect(max).toBeGreaterThan(1_240);
  });

  it("gives a flat series a range instead of dividing by zero", () => {
    const { min, max } = lineChartBounds(3, [[5, 5, 5]]);

    expect(max).toBeGreaterThan(min);
    expect(Number.isFinite(min)).toBe(true);
  });

  it("falls back to a usable range when there is nothing to measure", () => {
    const { min, max } = lineChartBounds(0, []);

    expect(max).toBeGreaterThan(min);
  });
});

describe("valueAt — a zero or missing reading", () => {
  it("reads a real zero as a zero", () => {
    expect(valueAt([0, 1], 0)).toBe(0);
  });

  it("reads a missing or non-finite point as a zero, never `NaN`", () => {
    expect(valueAt([1, 2], 9)).toBe(0);
    expect(valueAt([Number.NaN], 0)).toBe(0);
    expect(valueAt([Number.POSITIVE_INFINITY], 0)).toBe(0);
  });
});

describe("lineChartGeometry", () => {
  it("produces one path and one point per index for every series", () => {
    const geometry = lineChartGeometry(MONTH_XS.length, [
      SEASON_2526,
      SEASON_2627,
    ]);

    expect(geometry?.series).toHaveLength(2);
    expect(geometry?.xs).toHaveLength(12);
    for (const series of geometry?.series ?? []) {
      expect(series.points).toHaveLength(12);
      expect(series.line.startsWith("M ")).toBe(true);
    }
  });

  it("closes the area path back to the baseline", () => {
    const geometry = lineChartGeometry(3, [[1, 2, 3]], 100);

    expect(geometry?.series[0]?.area).toContain(`,${geometry?.baselineY} Z`);
  });

  it("never emits `NaN` into a path, even for a short series", () => {
    const geometry = lineChartGeometry(6, [[1, 2]]);

    expect(geometry?.series[0]?.line).not.toContain("NaN");
  });

  it("draws a single reading flat across the plot rather than as a dot", () => {
    const geometry = lineChartGeometry(1, [[42]]);
    const [first, last] = geometry?.series[0]?.points ?? [];

    expect(geometry?.series[0]?.line).not.toBe("");
    expect(first).toBeDefined();
    expect(last).toBeUndefined();
  });

  it("has nothing to draw without data", () => {
    expect(lineChartGeometry(0, [[1, 2]])).toBeNull();
    expect(lineChartGeometry(3, [])).toBeNull();
    expect(lineChartGeometry(Number.NaN, [[1]])).toBeNull();
  });
});

describe("axisLabelShown — legible at 1080p", () => {
  it("keeps all twelve months", () => {
    for (let index = 0; index < 12; index += 1) {
      expect(axisLabelShown(index, 12)).toBe(true);
    }
  });

  it("thins a long axis but always keeps the last label", () => {
    const shown = Array.from({ length: 40 }, (_unused, index) =>
      axisLabelShown(index, 40),
    ).filter(Boolean);

    expect(shown.length).toBeLessThan(40);
    expect(axisLabelShown(39, 40)).toBe(true);
  });
});

describe("axisLabelAnchor — the end labels are not clipped", () => {
  it("anchors the first label to the start and the last to the end", () => {
    // The defect US-016's first real mount of this chart exposed in Chrome: a
    // CENTRED end label loses its outer half to the svg's own bounds.
    expect(axisLabelAnchor(0, 4)).toBe("start");
    expect(axisLabelAnchor(3, 4)).toBe("end");
  });

  it("centres every label in between", () => {
    expect(axisLabelAnchor(1, 4)).toBe("middle");
    expect(axisLabelAnchor(2, 4)).toBe("middle");
  });

  it("centres a single label, whose point is drawn mid-plot", () => {
    expect(axisLabelAnchor(0, 1)).toBe("middle");
    expect(axisLabelAnchor(0, 0)).toBe("middle");
  });

  it("anchors the rendered labels the same way", () => {
    renderDrawn(
      <LineChart
        xs={[...BAND_XS]}
        series={[{ name: "Current", values: [...BAND_CURRENT] }]}
      />,
    );

    const anchors = slots("line-chart-axis-label").map((label) =>
      label.getAttribute("text-anchor"),
    );

    expect(anchors.at(0)).toBe("start");
    expect(anchors.at(-1)).toBe("end");
    expect(anchors.slice(1, -1).every((anchor) => anchor === "middle")).toBe(
      true,
    );
  });
});

describe("hoverIndex / nextHoverIndex / tooltipAnchor", () => {
  it("maps a pointer position to the nearest data index", () => {
    const rect = { left: 0, width: 600 };

    expect(hoverIndex(0, rect, 6)).toBe(0);
    expect(hoverIndex(240, rect, 6)).toBe(2);
    expect(hoverIndex(600, rect, 6)).toBe(5);
  });

  it("clamps a pointer that leaves the box instead of indexing past the data", () => {
    const rect = { left: 100, width: 600 };

    expect(hoverIndex(-500, rect, 6)).toBe(0);
    expect(hoverIndex(5_000, rect, 6)).toBe(5);
  });

  it("survives an unlaid-out box and an empty chart", () => {
    expect(hoverIndex(10, { left: 0, width: 0 }, 6)).toBe(0);
    expect(hoverIndex(10, { left: 0, width: 600 }, 0)).toBe(NO_HOVER);
  });

  it("moves the guide with the arrow keys and clears it on Escape", () => {
    expect(nextHoverIndex("ArrowRight", NO_HOVER, 6)).toBe(0);
    expect(nextHoverIndex("ArrowRight", 2, 6)).toBe(3);
    expect(nextHoverIndex("ArrowRight", 5, 6)).toBe(5);
    expect(nextHoverIndex("ArrowLeft", NO_HOVER, 6)).toBe(5);
    expect(nextHoverIndex("ArrowLeft", 0, 6)).toBe(0);
    expect(nextHoverIndex("Home", 3, 6)).toBe(0);
    expect(nextHoverIndex("End", 3, 6)).toBe(5);
    expect(nextHoverIndex("Escape", 3, 6)).toBe(NO_HOVER);
  });

  it("leaves every other key alone, so the tab order is untouched", () => {
    expect(nextHoverIndex("Tab", 2, 6)).toBeNull();
    expect(nextHoverIndex("Enter", 2, 6)).toBeNull();
    expect(nextHoverIndex("ArrowRight", 2, 0)).toBeNull();
  });

  it("pins the tooltip inside the plot near either edge", () => {
    expect(tooltipAnchor(0).transform).toBe("translateX(0)");
    expect(tooltipAnchor(50).transform).toBe("translateX(-50%)");
    expect(tooltipAnchor(100).transform).toBe("translateX(-100%)");
    expect(tooltipAnchor(140).left).toBe("100%");
  });
});

/* ============================================================= SERIES === */

describe("LineChart — one or more series", () => {
  it("draws every series it is given", () => {
    renderDrawn(<LineChart xs={MONTH_XS} series={MONTH_SERIES} />);

    expect(slots("line-chart-line")).toHaveLength(2);
    expect(lineFor("Season 25/26")).toBeInTheDocument();
    expect(lineFor("Season 26/27")).toBeInTheDocument();
  });

  it("draws a single series without a comparison", () => {
    renderDrawn(
      <LineChart
        xs={BAND_XS}
        series={[{ name: "Only", values: BAND_CURRENT }]}
      />,
    );

    expect(slots("line-chart-line")).toHaveLength(1);
  });

  it("renders nothing when there is no data to plot", () => {
    const { container } = renderDrawn(<LineChart xs={[]} series={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("plots every series against ONE scale, so the comparison is honest", () => {
    renderDrawn(<LineChart xs={MONTH_XS} series={MONTH_SERIES} />);

    // The lower season's line must sit BELOW the higher one at the month they
    // diverge most (September: 1'180 against 1'240) — same axes, not two.
    hoverPoint(2, MONTH_XS.length);
    const [previousDot, currentDot] = slots("line-chart-dot");

    expect(Number(previousDot?.getAttribute("cy"))).toBeGreaterThan(
      Number(currentDot?.getAttribute("cy")),
    );
  });
});

describe("LineChart — `area` and `dash` apply independently", () => {
  it("fills only the series asked for an area", () => {
    renderDrawn(<LineChart xs={MONTH_XS} series={MONTH_SERIES} />);

    // Two series, one `area` — so exactly one fill and one gradient.
    expect(slots("line-chart-area")).toHaveLength(1);
    expect(slots("line-chart-area-gradient")).toHaveLength(1);
  });

  it("dashes only the series asked for a dash, and leaves the other solid", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    const previous = lineFor("Previous");
    const current = lineFor("This month");

    expect(previous.dataset.style).toBe("dash");
    expect(previous.getAttribute("stroke-dasharray")).toBe("5 5");
    expect(current.dataset.style).toBe("solid");
    expect(current.getAttribute("stroke-dasharray")).toBe("1");
  });

  it("takes the two together — a dashed line with no fill beside a filled one", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    const areas = slots("line-chart-area");

    expect(areas).toHaveLength(1);
    expect(lineFor("Previous").getAttribute("stroke")).toBe(
      LINE_SERIES_COLORS.white,
    );
    expect(lineFor("This month").getAttribute("stroke")).toBe(
      LINE_SERIES_COLORS.gold,
    );
  });

  it("names series colours from the token set — never a colour string", () => {
    expect(LINE_SERIES_COLORS.red).toBe(cssVariable("color", "seriesPrimary"));
    expect(LINE_SERIES_COLORS.gold).toBe(
      cssVariable("color", "accentTargetHit"),
    );
    expect(APP_CSS).toMatch(/--color-series-primary:/);
    expect(APP_CSS).toMatch(/--color-accent-target-hit:/);
  });

  it("defaults an unnamed series to a legible colour for its surface", () => {
    expect(lineSeriesColorToken(undefined, 0, false)).toBe("red");
    expect(lineSeriesColorToken(undefined, 1, false)).toBe("blue");
    // Club red on navy cannot be read, so the band starts from gold.
    expect(lineSeriesColorToken(undefined, 0, true)).toBe("gold");
    expect(lineSeriesColorToken(undefined, 1, true)).toBe("white");
    expect(lineSeriesColorToken("navy", 0, true)).toBe("navy");
  });
});

/* ============================================================= LEGEND === */

describe("LineChart — the legend", () => {
  it("lists EVERY series", () => {
    renderDrawn(<LineChart xs={MONTH_XS} series={MONTH_SERIES} />);

    const items = slots("line-chart-legend-item");

    expect(items).toHaveLength(2);
    expect(items.map((item) => item.textContent)).toEqual([
      "Season 25/26",
      "Season 26/27",
    ]);
  });

  it("draws a dashed series' swatch dashed, so colour is not the only clue", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    const [previous, current] = slots("line-chart-legend-swatch");

    expect(previous?.dataset.style).toBe("dash");
    expect(previous).toHaveClass("border-dashed");
    expect(previous?.style.getPropertyValue("--line-series")).toBe(
      LINE_SERIES_COLORS.white,
    );

    expect(current?.dataset.style).toBe("solid");
    expect(current).not.toHaveClass("border-dashed");
    expect(current).toHaveClass("bg-[var(--line-series)]");
    expect(current?.style.getPropertyValue("--line-series")).toBe(
      LINE_SERIES_COLORS.gold,
    );
  });

  it("can be placed by the caller instead — the hero band puts it in its header", () => {
    renderDrawn(
      <>
        <LineChartLegend series={BAND_SERIES} dark />
        <LineChart xs={BAND_XS} series={BAND_SERIES} dark legend={false} />
      </>,
    );

    expect(slots("line-chart-legend")).toHaveLength(1);
    expect(slots("line-chart-legend-item")).toHaveLength(2);
  });

  it("has nothing to list with no series", () => {
    const { container } = render(<LineChartLegend series={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("is not clipped — it wraps rather than overflowing (E8)", () => {
    renderDrawn(<LineChart xs={MONTH_XS} series={MONTH_SERIES} />);

    expect(slot("line-chart-legend")).toHaveClass("flex-wrap");
    expect(slot("line-chart-legend")?.className).not.toMatch(
      /truncate|overflow-hidden/,
    );
  });
});

/* ============================================================== HOVER === */

describe("LineChart — the hover guide and tooltip", () => {
  it("draws a guide at the hovered x with a dot on EVERY series", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    expect(slot("line-chart-guide")).toBeNull();

    hoverPoint(3, BAND_XS.length);

    const guide = slot("line-chart-guide");
    expect(guide).not.toBeNull();
    expect(slots("line-chart-dot")).toHaveLength(2);
    // The guide sits on the hovered index's own x coordinate.
    const geometry = lineChartGeometry(BAND_XS.length, [BAND_CURRENT]);
    expect(guide?.querySelector("line")?.getAttribute("x1")).toBe(
      String(geometry?.xs[3]),
    );
  });

  it("shows EVERY series' value at the hovered point, through the formatter", () => {
    renderDrawn(
      <LineChart xs={BAND_XS} series={BAND_SERIES} format={formatMoney} />,
    );

    hoverPoint(5, BAND_XS.length);

    expect(slot("line-chart-tooltip-heading")?.textContent).toBe("W6");
    expect(tooltipRows()).toEqual([
      `|Previous|${formatMoney(132_700)}`,
      `|This month|${formatMoney(148_200)}`,
    ]);
  });

  it("follows the pointer to a different index", () => {
    renderDrawn(
      <LineChart xs={BAND_XS} series={BAND_SERIES} format={formatMoney} />,
    );

    hoverPoint(0, BAND_XS.length);
    expect(slot("line-chart-tooltip-heading")?.textContent).toBe("W1");
    expect(screen.getByText(formatMoney(118_400))).toBeInTheDocument();

    hoverPoint(2, BAND_XS.length);
    expect(slot("line-chart-tooltip-heading")?.textContent).toBe("W3");
    expect(screen.getByText(formatMoney(121_200))).toBeInTheDocument();
  });

  it("clears the guide when the pointer leaves", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    hoverPoint(3, BAND_XS.length);
    expect(slot("line-chart-tooltip")).not.toBeNull();

    fireEvent.mouseLeave(plot());
    expect(slot("line-chart-tooltip")).toBeNull();
    expect(slot("line-chart-guide")).toBeNull();
  });

  it("clears the guide when focus leaves, so it cannot be left stuck open", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(slot("line-chart-tooltip")).not.toBeNull();

    fireEvent.blur(plot());
    expect(slot("line-chart-tooltip")).toBeNull();
  });

  it("is keyboard reachable and arrow-driven, without trapping focus", () => {
    renderDrawn(
      <LineChart
        xs={BAND_XS}
        series={BAND_SERIES}
        format={formatMoney}
        label="Webshop revenue over time"
      />,
    );

    const area = screen.getByRole("group", {
      name: "Webshop revenue over time",
    });
    expect(area).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(area, { key: "ArrowRight" });
    expect(slot("line-chart-tooltip-heading")?.textContent).toBe("W1");

    fireEvent.keyDown(area, { key: "End" });
    expect(slot("line-chart-tooltip-heading")?.textContent).toBe("W6");

    // Tab is not handled here, so focus can still leave the chart.
    fireEvent.keyDown(area, { key: "Tab" });
    expect(slot("line-chart-tooltip")).not.toBeNull();

    fireEvent.keyDown(area, { key: "Escape" });
    expect(slot("line-chart-tooltip")).toBeNull();
  });

  it("announces the reading it moves to, so the arrow keys are useful", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    hoverPoint(1, BAND_XS.length);

    expect(slot("line-chart-tooltip")).toHaveAttribute("role", "status");
    expect(slot("line-chart-tooltip")).toHaveClass("pointer-events-none");
  });

  it("shows a zero as a LABELLED zero rather than breaking the axis", () => {
    renderDrawn(
      <LineChart xs={MONTH_XS} series={MONTH_SERIES} format={thousands} />,
    );

    // July 25/26 is a real zero in the dataset.
    hoverPoint(0, MONTH_XS.length);

    expect(tooltipRows()).toEqual([
      `|Season 25/26|${thousands(0)}`,
      `|Season 26/27|${thousands(210)}`,
    ]);
    expect(thousands(0)).toBe("CHF 0k");
    // The axis still runs the full twelve months.
    expect(slots("line-chart-axis-label")).toHaveLength(12);
  });

  it("labels a missing reading as a zero too", () => {
    renderDrawn(
      <LineChart
        xs={BAND_XS}
        series={[{ name: "Partial", values: [1_000, 2_000] }]}
        format={formatMoney}
      />,
    );

    hoverPoint(5, BAND_XS.length);

    expect(tooltipRows()).toEqual([`|Partial|${formatMoney(0)}`]);
  });
});

/* ====================================================== STROKE DRAW === */

describe("LineChart — the stroke-draw entrance", () => {
  /** A solid line's draw state: `1` is hidden, `0` is fully drawn. */
  function drawOffset(name: string): string | null {
    return lineFor(name).getAttribute("stroke-dashoffset");
  }

  it("draws the solid line in from nothing over the grow duration", () => {
    const frames = stubFrames();
    render(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    const current = lineFor("This month");
    expect(current.getAttribute("pathLength")).toBe("1");
    expect(current.getAttribute("stroke-dasharray")).toBe("1");
    expect(drawOffset("This month")).toBe("1");
    expect(current).toHaveClass("transition-[stroke-dashoffset]");

    frames.advance();
    frames.advance();

    expect(drawOffset("This month")).toBe("0");
    expect(APP_CSS).toMatch(/--duration-grow:/);
  });

  it("fades the dashed line in — its dasharray is already its pattern", () => {
    const frames = stubFrames();
    render(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    expect(lineFor("Previous")).toHaveClass("opacity-0");
    expect(lineFor("Previous").getAttribute("pathLength")).toBeNull();

    frames.advance();
    frames.advance();

    expect(lineFor("Previous")).toHaveClass("opacity-90");
  });

  it("fades the area fill in with its line", () => {
    const frames = stubFrames();
    render(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    expect(slot("line-chart-area")).toHaveClass("opacity-0");

    frames.advance();
    frames.advance();

    expect(slot("line-chart-area")).toHaveClass("opacity-100");
  });

  it("REPLAYS when the chart is re-keyed on a filter change", () => {
    function Band({ period }: { period: string }) {
      return <LineChart key={period} xs={BAND_XS} series={BAND_SERIES} dark />;
    }

    const frames = stubFrames();
    const { rerender } = render(<Band period="thisMonth" />);

    frames.advance();
    frames.advance();
    expect(drawOffset("This month")).toBe("0");

    // The presenter presses another period: the element is re-keyed, so the
    // chart remounts and draws itself again from nothing.
    rerender(<Band period="last3Months" />);
    expect(drawOffset("This month")).toBe("1");
    expect(lineFor("Previous")).toHaveClass("opacity-0");

    frames.advance();
    frames.advance();
    expect(drawOffset("This month")).toBe("0");
  });

  it("does NOT replay when only the data changes, so there is no flash", () => {
    const frames = stubFrames();
    const { rerender } = render(
      <LineChart xs={BAND_XS} series={BAND_SERIES} />,
    );

    frames.advance();
    frames.advance();
    expect(drawOffset("This month")).toBe("0");

    rerender(
      <LineChart
        xs={BAND_XS}
        series={[
          BAND_SERIES[0] as LineSeries,
          { name: "This month", values: BAND_PREVIOUS, area: true },
        ]}
      />,
    );

    expect(drawOffset("This month")).toBe("0");
  });

  it("clears the hover guide when it is re-keyed", () => {
    function Band({ period }: { period: string }) {
      return <LineChart key={period} xs={BAND_XS} series={BAND_SERIES} />;
    }

    const { rerender } = renderDrawn(<Band period="thisMonth" />);
    hoverPoint(3, BAND_XS.length);
    expect(slot("line-chart-tooltip")).not.toBeNull();

    rerender(<Band period="lastMonth" />);
    expect(slot("line-chart-tooltip")).toBeNull();
  });
});

describe("LineChart — reduced motion", () => {
  it("renders every path FULLY DRAWN in the first render, never stranded", () => {
    stubMatchMedia(true);
    const frames = stubFrames();

    render(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    // No frame has run and none was even requested: the final state is the
    // FIRST state, so nothing waits for a transition that will not happen.
    expect(frames.requested()).toBe(0);
    expect(lineFor("This month").getAttribute("stroke-dashoffset")).toBe("0");
    expect(lineFor("Previous")).toHaveClass("opacity-90");
    expect(lineFor("Previous")).not.toHaveClass("opacity-0");
    expect(slot("line-chart-area")).toHaveClass("opacity-100");
  });

  it("stays drawn when it is re-keyed under reduced motion", () => {
    stubMatchMedia(true);
    stubFrames();

    function Band({ period }: { period: string }) {
      return <LineChart key={period} xs={BAND_XS} series={BAND_SERIES} />;
    }

    const { rerender } = render(<Band period="thisMonth" />);
    rerender(<Band period="lastMonth" />);

    expect(lineFor("This month").getAttribute("stroke-dashoffset")).toBe("0");
    expect(lineFor("Previous")).toHaveClass("opacity-90");
  });

  it("is drawn the moment the preference is turned on mid-entrance", () => {
    const media = stubMatchMedia(false);
    stubFrames();

    render(<LineChart xs={BAND_XS} series={BAND_SERIES} />);
    expect(lineFor("This month").getAttribute("stroke-dashoffset")).toBe("1");

    media.set(true);

    expect(lineFor("This month").getAttribute("stroke-dashoffset")).toBe("0");
  });

  it("collapses every transition to its final frame in the stylesheet", () => {
    expect(APP_CSS).toMatch(/prefers-reduced-motion: reduce/);
    expect(APP_CSS).toMatch(/transition-duration: 1ms !important/);
  });
});

/* ======================================================== GRADIENT IDS === */

describe("LineChart — gradient ids", () => {
  it("gives two charts on screen DISTINCT gradient ids", () => {
    renderDrawn(
      <>
        <LineChart xs={BAND_XS} series={BAND_SERIES} dark />
        <LineChart xs={MONTH_XS} series={MONTH_SERIES} />
      </>,
    );

    const ids = slots("line-chart-area-gradient").map((node) => node.id);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(id).not.toBe("");
  });

  it("points each area fill at its OWN gradient", () => {
    renderDrawn(
      <>
        <LineChart xs={BAND_XS} series={BAND_SERIES} dark />
        <LineChart xs={MONTH_XS} series={MONTH_SERIES} />
      </>,
    );

    const gradients = slots("line-chart-area-gradient");
    const fills = slots("line-chart-area").map((node) =>
      node.getAttribute("fill"),
    );

    expect(fills).toEqual(gradients.map((node) => `url(#${node.id})`));
    expect(new Set(fills).size).toBe(2);
  });

  it("gets those ids from the shared hook, not a local counter", () => {
    expect(LINE_CHART_CODE).toMatch(/useUid\(/);
    expect(LINE_CHART_CODE).not.toMatch(/id="[a-z]/i);
  });
});

/* =============================================================== DARK === */

describe("LineChart — the `dark` variant for the navy band", () => {
  it("differs from the light chart in gridlines, axis, dots and tooltip", () => {
    const { unmount } = renderDrawn(
      <LineChart xs={BAND_XS} series={BAND_SERIES} />,
    );
    hoverPoint(2, BAND_XS.length);

    const light = {
      grid: classOf(slot("line-chart-grid")),
      axis: classOf(slot("line-chart-axis-label")),
      dot: classOf(slot("line-chart-dot")),
      tooltip: classOf(slot("line-chart-tooltip")),
    };
    unmount();

    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} dark />);
    hoverPoint(2, BAND_XS.length);

    expect(light.grid).not.toBeNull();
    expect(classOf(slot("line-chart-grid"))).not.toBe(light.grid);
    expect(classOf(slot("line-chart-axis-label"))).not.toBe(light.axis);
    expect(classOf(slot("line-chart-dot"))).not.toBe(light.dot);
    expect(classOf(slot("line-chart-tooltip"))).not.toBe(light.tooltip);
  });

  it("keeps the axis labels legible on navy and the dots on the band colour", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} dark />);
    hoverPoint(2, BAND_XS.length);

    expect(slot("line-chart-axis-label")).toHaveClass("chart-axis-label");
    expect(slot("line-chart-axis-label")).toHaveClass("fill-bg/60");
    expect(slot("line-chart-dot")).toHaveClass("fill-navy");
    expect(slot("line-chart-tooltip")).toHaveClass("bg-bg");
  });

  it("inverts the tooltip on white, so it reads on either surface", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);
    hoverPoint(2, BAND_XS.length);

    expect(slot("line-chart-tooltip")).toHaveClass("bg-navy");
  });

  it("lightens the legend on the band", () => {
    renderDrawn(<LineChartLegend series={BAND_SERIES} dark />);

    expect(slot("line-chart-legend-item")).toHaveClass("text-bg/80");
  });

  it("uses a deeper area fade on navy than on white", () => {
    expect(LINE_CHART_CODE).toMatch(/AREA_OPACITY_DARK = 0\.32/);
    expect(LINE_CHART_CODE).toMatch(/AREA_OPACITY_LIGHT = 0\.18/);
  });
});

/* ============================================================ SCALING === */

describe("LineChart — scaling to its container", () => {
  it("carries a viewBox and `width: 100%`", () => {
    renderDrawn(<LineChart xs={BAND_XS} series={BAND_SERIES} />);

    const svg = slot("line-chart-svg");

    expect(svg?.getAttribute("viewBox")).toBe(
      `0 0 ${LINE_CHART_VIEW_WIDTH} ${DEFAULT_LINE_CHART_HEIGHT}`,
    );
    expect(svg?.getAttribute("width")).toBe("100%");
    expect(svg).toHaveClass("block");
  });

  it("takes the height each consumer needs without a variant", () => {
    renderDrawn(<LineChart xs={MONTH_XS} series={MONTH_SERIES} height={210} />);

    expect(slot("line-chart-svg")?.getAttribute("viewBox")).toBe(
      `0 0 ${LINE_CHART_VIEW_WIDTH} 210`,
    );
  });

  it("prints one axis label per month, not one per pixel", () => {
    renderDrawn(<LineChart xs={MONTH_XS} series={MONTH_SERIES} />);

    expect(
      slots("line-chart-axis-label").map((node) => node.textContent),
    ).toEqual([...MONTH_XS]);
  });
});

/* =============================================================== TILE === */

describe("LineChartTile", () => {
  it("is `Card` + `LineChart`, with the card slots passing through", () => {
    renderDrawn(
      <LineChartTile
        title="Ticket revenue by month"
        period="All home fixtures"
        action={<span>filter</span>}
        caption="Written by the assistant"
        xs={MONTH_XS}
        series={MONTH_SERIES}
        format={thousands}
      />,
    );

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Ticket revenue by month",
    );
    expect(slot("card-subtitle")?.textContent).toBe("All home fixtures");
    expect(slot("card-action")?.textContent).toBe("filter");
    expect(slot("card-caption")?.textContent).toContain(
      "Written by the assistant",
    );
    expect(slot("line-chart-svg")).not.toBeNull();
  });

  it("carries the entrance stagger of a newly inserted tile", () => {
    renderDrawn(
      <LineChartTile isNew delayMs={150} xs={BAND_XS} series={BAND_SERIES} />,
    );

    expect(slot("card")?.style.animationDelay).toBe("150ms");
  });
});

/* ====================================================== DISCIPLINE === */

describe("LineChart — token and formatting discipline", () => {
  it("contains NO hardcoded colour of any kind", () => {
    expect(LINE_CHART_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(LINE_CHART_CODE).not.toMatch(/\brgba?\(/);
    expect(LINE_CHART_CODE).not.toMatch(/\bhsla?\(/);
  });

  it("formats no number of its own — every string comes from the formatter", () => {
    expect(LINE_CHART_CODE).toMatch(/from "\.\.\/\.\.\/lib\/format"/);
    expect(LINE_CHART_CODE).not.toMatch(/Intl\.NumberFormat/);
    expect(LINE_CHART_CODE).not.toMatch(/toLocaleString/);
    expect(LINE_CHART_CODE).not.toMatch(/CHF/);
  });

  it("invents no motion — the entrance is US-027's `useGrow` only", () => {
    expect(LINE_CHART_CODE).toMatch(/useGrow\(/);
    expect(LINE_CHART_CODE).not.toMatch(
      /setTimeout|setInterval|requestAnimationFrame|matchMedia/,
    );
  });

  it("holds only the hovered index in state — nothing else is local", () => {
    expect(LINE_CHART_CODE.match(/useState/g)).toHaveLength(2);
  });

  it("renders tooltip figures with tabular numerals so they do not jitter", () => {
    renderDrawn(
      <LineChart xs={BAND_XS} series={BAND_SERIES} format={formatMoney} />,
    );
    hoverPoint(4, BAND_XS.length);

    expect(slot("line-chart-tooltip-row")).toHaveClass("tabular-nums");
    expect(APP_CSS).toMatch(/--text-chart-axis: 12px/);
  });
});
