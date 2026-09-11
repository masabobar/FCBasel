/**
 * US-016 — the hero band, end to end, on the real dataset.
 *
 * THE SIX ACCEPTANCE CRITERIA, and where each is proven:
 *   ① ONE `Segmented` filter drives BOTH the webshop chart and the attendance
 *      ring from the same period entry — the suite clicks ONE control once and
 *      asserts both widgets moved, and proves there is no second period state
 *      in the file for a second control to hide behind;
 *   ② the selected period against the previous one: a GOLD AREA line over a
 *      DASHED WHITE line, with a legend, in the WIDER left column;
 *   ③ hover draws a vertical guide and a tooltip carrying BOTH series' values;
 *   ④ the ring's centre swaps to "% of capacity" on hover and the arc glows
 *      (the ring's own suite is `attendance-ring.test.tsx`);
 *   ⑤ on every filter change the number counts from its CURRENT value, the
 *      line redraws, and the ring sweeps;
 *   ⑥ the webshop total and its delta are COMPUTED from the series — asserted
 *      as equal to `seriesTotals` off the plotted arrays, and guarded by a
 *      source scan that fails on any stored figure in the band's code.
 *
 * Nothing below is a hand-written figure: every expected string comes from the
 * US-007 repository through `derive.ts` and `format.ts`, which is also the only
 * way criterion ⑥ can be tested rather than asserted.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ringGeometry } from "../../app/components/charts/attendance-ring";
import { LINE_SERIES_COLORS } from "../../app/components/charts/line-chart";
import {
  BAND_CHART_HEIGHT,
  HERO_BAND_LABEL_KEY,
  HERO_BAND_PERIOD_LABEL_KEY,
  HERO_BAND_SUBTITLE_KEY,
  HeroBand,
  PREVIOUS_SERIES_NAME_KEY,
} from "../../app/components/dashboard/hero-band";
import { type Clock } from "../../app/lib/calendar";
import {
  BASELINE_PERIOD,
  type BaselineData,
  loadBaseline,
} from "../../app/lib/dashboard/baseline";
import {
  formatMoney,
  formatNumber,
  formatSharePercent,
  formatSignedPercent,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { createMockBaselineRepository } from "../../app/lib/mock/baseline";
import { WORKSPACE_LABEL_KEY } from "../../app/lib/persona";
import {
  attendanceChangePercent,
  attendanceShare,
  scoreline,
  seriesTotals,
} from "../../app/lib/repositories/derive";
import { PeriodKey } from "../../app/lib/repositories/enums";
import { type BaselinePeriod } from "../../app/lib/repositories/types";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";
import { t } from "./support/i18n";
import { type TranslationKey } from "../../app/lib/i18n";
import { personaGreeting } from "../../app/lib/persona";

/* --------------------------------------------------------------- SOURCE -- */

/** Comments explain the figures; only executable code may not restate them. */
function code(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

const BAND_CODE = code("app/components/dashboard/hero-band.tsx");
const SCANNED_SOURCES = [
  "app/components/dashboard/hero-band.tsx",
  "app/components/charts/attendance-ring.tsx",
  "app/lib/dashboard/baseline.ts",
  "app/lib/persona.ts",
] as const;
const SOURCES = SCANNED_SOURCES.map((path) => ({ path, code: code(path) }));

/* -------------------------------------------------------------- FIXTURE -- */

/** A fixed clock: two periods label their axis from today's date. */
const SEPTEMBER: Clock = () => new Date(2026, 8, 9);

const DATA: BaselineData = await loadBaseline(
  createMockBaselineRepository(SEPTEMBER),
  SEPTEMBER,
);

const PERIODS = DATA.band.periods;

/** The period on screen at load, and the one the filter cases switch to. */
const FIRST: BaselinePeriod = PERIODS.find(
  (period) => period.key === BASELINE_PERIOD,
)!;
const NEXT: BaselinePeriod = PERIODS.find(
  (period) => period.key === PeriodKey.LAST_MONTH,
)!;

const FIRST_TOTALS = seriesTotals(FIRST.webshop);
const NEXT_TOTALS = seriesTotals(NEXT.webshop);

/* ------------------------------------------------------------- HARNESS -- */

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

/** SVG `className` is an `SVGAnimatedString`; read classes off the attribute. */
function classesOf(element: Element | null): string {
  return element?.getAttribute("class") ?? "";
}

function line(style: "solid" | "dash"): HTMLElement {
  return slots("line-chart-line").find(
    (path) => path.getAttribute("data-style") === style,
  )!;
}

function renderSettled(ui: ReactElement) {
  const frames = stubFrames();
  const result = render(ui);
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
  return { ...result, frames };
}

function renderBand() {
  return renderSettled(<HeroBand {...DATA.band} latest={DATA.match} />);
}

/** The figure the band's KPI currently shows, as a number. */
function shownTotal(): number {
  return Number(slot("kpi-value")!.textContent!.replace(/\D/g, ""));
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ------------------------------------------------------------ THE BAND --- */

/** The band resolves its keyed axis with `t`; so does this suite. */
function bandLabels(period: {
  webshop: { labelKeys: readonly TranslationKey[] };
}): string[] {
  return period.webshop.labelKeys.map((key) => t(key));
}

describe("HeroBand — the greeting band above the row", () => {
  it("greets the persona with the string the loader resolved", () => {
    renderBand();

    expect(slot("hero-band-greeting")).toHaveTextContent(
      personaGreeting(t, DATA.band.greeting),
    );
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: personaGreeting(t, DATA.band.greeting),
      }),
    ).toBeInTheDocument();
  });

  it("names the workspace and no individual", () => {
    renderBand();

    expect(slot("hero-band-greeting")).toHaveTextContent(
      t(WORKSPACE_LABEL_KEY),
    );
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/Shaqiri|Sow|Metinho|Daniliuc/);
    }
  });

  it("says what the band is and what to do next", () => {
    renderBand();

    expect(slot("hero-band-subtitle")).toHaveTextContent(
      t(HERO_BAND_SUBTITLE_KEY),
    );
  });

  it("labels the section by its greeting, for a screen reader walking it", () => {
    renderBand();

    const band = slot("hero-band")!;
    expect(band.getAttribute("aria-labelledby")).toBe(
      slot("hero-band-greeting")!.id,
    );
  });

  it("is ONE grid item on the canvas, with its own padded surface", () => {
    const { container } = renderBand();

    expect(container.childElementCount).toBe(1);
    expect(classesOf(slot("hero-band"))).toContain("col-span-full");
    expect(classesOf(slot("hero-band"))).toContain("fcb-band");
  });

  it("renders nothing at all for a dataset with no periods", () => {
    // Degradation, not a hole in the band: an empty period list means there is
    // no reading to show, and half a band is worse than none.
    const { container } = render(
      <HeroBand
        greeting={DATA.band.greeting}
        periods={[]}
        latest={DATA.match}
      />,
    );

    expect(container.childElementCount).toBe(0);
  });

  it("falls back to the first period when the key is unknown", () => {
    // The band starts on `BASELINE_PERIOD`; a dataset that dropped it must
    // still render a period rather than an empty band.
    const withoutBaseline = PERIODS.filter(
      (period) => period.key !== BASELINE_PERIOD,
    );
    renderSettled(
      <HeroBand
        greeting={DATA.band.greeting}
        periods={withoutBaseline}
        latest={DATA.match}
      />,
    );

    expect(screen.getByRole("radio", { checked: true })).toHaveTextContent(
      t(withoutBaseline[0]!.labelKey),
    );
  });
});

/* -------------------------------- ① ONE FILTER DRIVES BOTH WIDGETS ------- */

describe("HeroBand — one control drives the chart AND the ring", () => {
  it("renders exactly one period filter, named for what it drives", () => {
    renderBand();

    const groups = screen.getAllByRole("radiogroup");
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveAttribute(
      "aria-label",
      t(HERO_BAND_PERIOD_LABEL_KEY),
    );
    // Dark, because it sits on the navy band rather than on a white card.
    expect(groups[0]).toHaveAttribute("data-variant", "dark");
  });

  it("offers the dataset's four periods, starting on this month", () => {
    renderBand();

    expect(
      slots("segmented-option").map((option) => option.textContent),
    ).toEqual(PERIODS.map((period) => t(period.labelKey)));
    expect(PERIODS).toHaveLength(4);
    expect(screen.getByRole("radio", { checked: true })).toHaveTextContent(
      t(FIRST.labelKey),
    );
  });

  it("moves the chart and the ring on the SAME single press", async () => {
    // Criterion ①, stated as one interaction: one click, two widgets.
    const user = userEvent.setup();
    const { frames } = renderBand();

    const chartBefore = line("solid").getAttribute("d");
    const ringBefore = slot("attendance-ring-arc")!.getAttribute(
      "stroke-dasharray",
    );

    await user.click(screen.getByRole("radio", { name: t(NEXT.labelKey) }));
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);

    // The chart now plots the new period …
    expect(line("solid").getAttribute("d")).not.toBe(chartBefore);
    // … and the ring is at the new period's share, from that one press.
    expect(slot("attendance-ring-arc")).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(attendanceShare(NEXT.attendance)).dashArray,
    );
    expect(
      slot("attendance-ring-arc")!.getAttribute("stroke-dasharray"),
    ).not.toBe(ringBefore);
    // … and both are describing the period the control says is selected.
    expect(screen.getByRole("radio", { checked: true })).toHaveTextContent(
      t(NEXT.labelKey),
    );
  });

  it("reads both widgets off the same period entry", async () => {
    const user = userEvent.setup();
    const { frames } = renderBand();

    await user.click(screen.getByRole("radio", { name: t(NEXT.labelKey) }));
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);

    // The KPI is the new period's webshop sum, the ring the new period's
    // attendance, and the stats the new period's matches — one entry, no
    // chance of the two halves showing different months.
    expect(slot("kpi-value")).toHaveTextContent(
      formatMoney(NEXT_TOTALS.current),
    );
    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatNumber(NEXT.attendance.average),
    );
    expect(slot("hero-band-stats")).toHaveTextContent(
      formatNumber(NEXT.attendance.matches),
    );
  });

  it("keeps exactly one period state in the file — no second filter can exist", () => {
    // The structural half of criterion ①: one `useState` in the band, and the
    // ring and the chart both receive their period as a prop.
    expect(BAND_CODE.match(/useState[<(]/g)).toHaveLength(1);
    expect(BAND_CODE.match(/<Segmented/g)).toHaveLength(1);
    expect(BAND_CODE).toContain("periods.find");
  });

  it("drives the filter with the arrow keys, as a radiogroup must", async () => {
    const user = userEvent.setup();
    const { frames } = renderBand();

    await user.click(screen.getByRole("radio", { name: t(FIRST.labelKey) }));
    await user.keyboard("{ArrowRight}");
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);

    expect(screen.getByRole("radio", { checked: true })).toHaveTextContent(
      t(NEXT.labelKey),
    );
    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatNumber(NEXT.attendance.average),
    );
  });
});

/* ------------------------ ② GOLD AREA OVER DASHED WHITE, WIDER COLUMN --- */

describe("HeroBand — the webshop chart", () => {
  it("plots the selected period against the previous one", () => {
    renderBand();

    expect(slots("line-chart-line")).toHaveLength(2);
    expect(line("solid")).toHaveAttribute("data-series", t(FIRST.labelKey));
    expect(line("dash")).toHaveAttribute(
      "data-series",
      t(PREVIOUS_SERIES_NAME_KEY),
    );
  });

  it("draws the current period as a GOLD line with an area fill", () => {
    renderBand();

    expect(line("solid")).toHaveAttribute("stroke", LINE_SERIES_COLORS.gold);
    expect(slots("line-chart-area")).toHaveLength(1);
    expect(
      slot("line-chart-area-gradient")!.querySelector("stop"),
    ).toHaveAttribute("stop-color", LINE_SERIES_COLORS.gold);
  });

  it("draws the previous period as a DASHED WHITE line under it", () => {
    renderBand();

    expect(line("dash")).toHaveAttribute("stroke", LINE_SERIES_COLORS.white);
    expect(line("dash").getAttribute("stroke-dasharray")).toMatch(/\d+ \d+/);
    // The gold line is stroked AFTER the dashed one, so it reads as on top.
    expect(
      line("dash").compareDocumentPosition(line("solid")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("carries a legend naming both series, the dashed one dashed", () => {
    renderBand();

    const items = slots("line-chart-legend-item").map(
      (item) => item.textContent,
    );
    expect(slots("line-chart-legend")).toHaveLength(1);
    expect(items).toContain(t(FIRST.labelKey));
    expect(items).toContain(t(PREVIOUS_SERIES_NAME_KEY));
    expect(
      slots("line-chart-legend-swatch").map((swatch) =>
        swatch.getAttribute("data-style"),
      ),
    ).toEqual(["dash", "solid"]);
  });

  it("spans the WIDER left column, with the ring in the narrower one", () => {
    renderBand();

    expect(classesOf(slot("hero-band-chart"))).toContain("lg:col-span-8");
    expect(classesOf(slot("hero-band-attendance"))).toContain("lg:col-span-4");
    // A wide chart shrinks rather than pushing the page out (US-012's rule).
    expect(classesOf(slot("hero-band-chart"))).toContain("min-w-0");
  });

  it("plots the period's own x labels, at the band's height", () => {
    renderBand();

    expect(
      slots("line-chart-axis-label").map((label) => label.textContent),
    ).toEqual([...bandLabels(FIRST)]);
    expect(slot("line-chart-svg")!.getAttribute("viewBox")).toContain(
      String(BAND_CHART_HEIGHT),
    );
  });

  it("labels the plot for a screen reader, naming the period shown", () => {
    renderBand();

    const plot = slot("line-chart-plot")!;
    expect(plot.getAttribute("aria-label")).toContain(
      t(HERO_BAND_LABEL_KEY.webshop),
    );
    expect(plot.getAttribute("aria-label")).toContain(t(FIRST.labelKey));
  });
});

/* ----------------------------- ③ HOVER: GUIDE PLUS BOTH SERIES' VALUES -- */

describe("HeroBand — hovering the chart", () => {
  function hover() {
    fireEvent.mouseMove(slot("line-chart-plot")!, { clientX: 0 });
  }

  it("draws a vertical guide with one dot per series", () => {
    renderBand();
    hover();

    expect(slot("line-chart-guide")).toBeInTheDocument();
    expect(slots("line-chart-dot")).toHaveLength(2);
  });

  it("shows BOTH series' values at that point, as money", () => {
    // The comparison is the whole reason the chart exists, so a tooltip
    // carrying only the nearer series would be useless.
    renderBand();
    hover();

    const tooltip = slot("line-chart-tooltip")!;
    const rows = slots("line-chart-tooltip-row", tooltip).map(
      (row) => row.textContent,
    );

    expect(rows).toHaveLength(2);
    expect(tooltip).toHaveTextContent(formatMoney(FIRST.webshop.current[0]!));
    expect(tooltip).toHaveTextContent(formatMoney(FIRST.webshop.previous[0]!));
    expect(tooltip).toHaveTextContent(bandLabels(FIRST)[0]!);
  });

  it("clears the guide when the pointer leaves", () => {
    renderBand();
    hover();

    fireEvent.mouseLeave(slot("line-chart-plot")!);

    expect(slot("line-chart-guide")).toBeNull();
    expect(slot("line-chart-tooltip")).toBeNull();
  });
});

/* ------------------------ ④ THE RING SWAPS AND GLOWS, INSIDE THE BAND --- */

describe("HeroBand — the attendance ring and its stats", () => {
  it("shows the period's average attendance, swapping on hover", () => {
    renderBand();

    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatNumber(FIRST.attendance.average),
    );

    fireEvent.mouseEnter(slot("attendance-ring")!);

    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatSharePercent(attendanceShare(FIRST.attendance)),
    );
    expect(classesOf(slot("attendance-ring-arc"))).toContain("fcb-ring-glow");
  });

  it("states the movement in a chip that stays legible on navy", () => {
    renderBand();

    const chip = slots("delta-chip").at(-1)!;
    expect(chip).toHaveTextContent(
      formatSignedPercent(attendanceChangePercent(FIRST.attendance)),
    );
    // The `light` variant drops colour coding: the negative token is illegible
    // on navy, so the arrow and the sign carry the direction.
    expect(chip.className).toContain("bg-bg/15");
    expect(chip.className).toContain("text-bg");
  });

  it("quotes the matches, the capacity share and the latest fixture", () => {
    renderBand();

    const stats = slot("hero-band-stats")!;
    expect(stats).toHaveTextContent(
      `${formatNumber(FIRST.attendance.matches)} home matches`,
    );
    expect(stats).toHaveTextContent(
      `${formatSharePercent(
        attendanceShare(FIRST.attendance),
      )} of ~${formatNumber(FIRST.attendance.capacity)}`,
    );
    // The scoreline comes from `derive.ts`, so it cannot disagree with the
    // match tile's — and it is a plain hyphen, never an en dash.
    expect(stats).toHaveTextContent(scoreline(DATA.match));
    expect(stats.textContent).not.toMatch(/\d\s*[–—]\s*\d/);
  });

  it("pluralises a single home match rather than saying `1 home matches`", () => {
    const onePeriod: BaselinePeriod = {
      ...FIRST,
      attendance: { ...FIRST.attendance, matches: 1 },
    };
    renderSettled(
      <HeroBand
        greeting={DATA.band.greeting}
        periods={[onePeriod]}
        latest={DATA.match}
      />,
    );

    expect(slot("hero-band-stats")).toHaveTextContent("1 home match");
    expect(slot("hero-band-stats")!.textContent).not.toContain(
      "1 home matches",
    );
  });

  it("names the attendance block, so the ring is not an unlabelled circle", () => {
    renderBand();

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: t(HERO_BAND_LABEL_KEY.attendance),
      }),
    ).toBeInTheDocument();
  });
});

/* ------------- ⑤ ON A FILTER CHANGE: COUNT, REDRAW, SWEEP --------------- */

describe("HeroBand — a filter change counts, redraws and sweeps", () => {
  it("counts the total from the figure ON SCREEN, never from zero", async () => {
    // The trap this asserts against: a naive `0 → total` would flash CHF 0 on
    // the projector on every press.
    const user = userEvent.setup();
    const { frames } = renderBand();

    expect(shownTotal()).toBe(FIRST_TOTALS.current);

    await user.click(screen.getByRole("radio", { name: t(NEXT.labelKey) }));

    // Before a single frame runs, the OLD figure is still on screen.
    expect(shownTotal()).toBe(FIRST_TOTALS.current);
    expect(slot("kpi-value")).not.toHaveTextContent(formatMoney(0));

    // The first frame only records its start; the second carries the count.
    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS / 4);

    const middle = shownTotal();
    expect(middle).toBeLessThan(FIRST_TOTALS.current);
    expect(middle).toBeGreaterThan(NEXT_TOTALS.current);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(shownTotal()).toBe(NEXT_TOTALS.current);
  });

  it("redraws the line from nothing — the chart is re-keyed by period", async () => {
    const user = userEvent.setup();
    const { frames } = renderBand();

    const before = line("solid");
    expect(before).toHaveAttribute("stroke-dashoffset", "0");

    await user.click(screen.getByRole("radio", { name: t(NEXT.labelKey) }));

    // A NEW element, undrawn: `key={period.key}` remounts the chart, which is
    // what replays US-025's stroke draw instead of morphing the old path.
    const after = line("solid");
    expect(after).not.toBe(before);
    expect(after).toHaveAttribute("stroke-dashoffset", "1");
    expect(classesOf(after)).toContain("transition-[stroke-dashoffset]");

    frames.advance();
    frames.advance();
    expect(line("solid")).toHaveAttribute("stroke-dashoffset", "0");
  });

  it("sweeps the ring on the SAME element, so the arc travels", async () => {
    const user = userEvent.setup();
    renderBand();

    const arc = slot("attendance-ring-arc")!;
    await user.click(screen.getByRole("radio", { name: t(NEXT.labelKey) }));

    // Not re-keyed, deliberately: the ring must transition between two dash
    // pairs, where the chart must start its draw again.
    expect(slot("attendance-ring-arc")).toBe(arc);
    expect(arc).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(attendanceShare(NEXT.attendance)).dashArray,
    );
    expect(classesOf(arc)).toContain("transition-[stroke-dasharray]");
  });

  it("counts the ring's centre from the figure on screen too", async () => {
    const user = userEvent.setup();
    const { frames } = renderBand();

    await user.click(screen.getByRole("radio", { name: t(NEXT.labelKey) }));
    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS / 4);

    const shown = Number(
      slot("attendance-ring-value")!.textContent!.replace(/\D/g, ""),
    );
    expect(shown).toBeLessThan(FIRST.attendance.average);
    expect(shown).toBeGreaterThan(NEXT.attendance.average);
  });
});

/* --------------- ⑥ THE TOTAL AND ITS DELTA ARE COMPUTED, NOT STORED ----- */

describe("HeroBand — the headline is computed from the plotted series", () => {
  it("shows the SUM of the current series, through the money formatter", () => {
    renderBand();

    expect(slot("kpi-value")).toHaveTextContent(
      formatMoney(FIRST_TOTALS.current),
    );
    // Equal to summing the very array the gold line plots.
    expect(FIRST_TOTALS.current).toBe(
      FIRST.webshop.current.reduce((total, value) => total + value, 0),
    );
  });

  it("shows the movement against the previous series as its delta", () => {
    renderBand();

    const chip = slots("delta-chip")[0]!;
    expect(chip).toHaveTextContent(
      formatSignedPercent(FIRST_TOTALS.deltaPercent),
    );
  });

  it("agrees with the webshop tile, because both sum the same array", () => {
    renderBand();

    // The band and US-013's KPI tile are two presentations of one reading.
    expect(slot("kpi-value")).toHaveTextContent(
      formatMoney(DATA.webshop.total),
    );
    expect(FIRST_TOTALS.deltaPercent).toBe(DATA.webshop.deltaPercent);
  });

  it("recomputes both for every period, with no stored figure to fall back on", () => {
    for (const period of PERIODS) {
      const totals = seriesTotals(period.webshop);
      expect(totals.current).toBeGreaterThan(0);
      // There is no `total` on the entry at all — the shape makes it impossible
      // to read one instead of computing it.
      expect(period.webshop).not.toHaveProperty("total");
      expect(period).not.toHaveProperty("deltaPercent");
      expect(totals.deltaPercent).toBe(
        seriesTotals(period.webshop).deltaPercent,
      );
    }
  });

  it("computes them in the band, and stores neither anywhere", () => {
    expect(BAND_CODE).toContain("seriesTotals(period.webshop)");
    expect(BAND_CODE).not.toMatch(/\btotal:\s/);
    expect(BAND_CODE).not.toMatch(/deltaPercent:\s/);
  });
});

/* -------------------------------------------------------- REDUCED MOTION -- */

describe("HeroBand — reduced motion renders the final state everywhere", () => {
  it("shows every figure and every shape at once, with no frames run", () => {
    stubMatchMedia(true);
    render(<HeroBand {...DATA.band} latest={DATA.match} />);

    // The number is at its value …
    expect(slot("kpi-value")).toHaveTextContent(
      formatMoney(FIRST_TOTALS.current),
    );
    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatNumber(FIRST.attendance.average),
    );
    // … the line is fully drawn and the dashed one visible …
    expect(line("solid")).toHaveAttribute("stroke-dashoffset", "0");
    expect(classesOf(line("dash"))).toContain("opacity-90");
    expect(classesOf(slot("line-chart-area"))).toContain("opacity-100");
    // … and the ring is at its share, not stranded at an empty arc.
    const share = attendanceShare(FIRST.attendance);
    expect(slot("attendance-ring-arc")).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(share).dashArray,
    );
    expect(
      slot("attendance-ring-arc")!.getAttribute("stroke-dasharray"),
    ).not.toBe(ringGeometry(share).emptyDashArray);
  });

  it("still switches period, and still lands on the final state", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    render(<HeroBand {...DATA.band} latest={DATA.match} />);

    await user.click(screen.getByRole("radio", { name: t(NEXT.labelKey) }));

    expect(slot("kpi-value")).toHaveTextContent(
      formatMoney(NEXT_TOTALS.current),
    );
    expect(line("solid")).toHaveAttribute("stroke-dashoffset", "0");
    expect(slot("attendance-ring-arc")).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(attendanceShare(NEXT.attendance)).dashArray,
    );
  });
});

/* ------------------------------------------------- TOKEN AND COPY DISCIPLINE */

describe("HeroBand — token, figure and formatter discipline", () => {
  it("contains no hex colour and no rgba() anywhere in its code", () => {
    for (const source of SOURCES) {
      expect(source.code, source.path).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source.code, source.path).not.toMatch(/rgba?\(/);
    }
  });

  it("restates no figure the band displays, however spelt", () => {
    const figures = [
      FIRST_TOTALS.current,
      NEXT_TOTALS.current,
      ...PERIODS.flatMap((period) => [
        ...period.webshop.current,
        ...period.webshop.previous,
        period.attendance.average,
        period.attendance.capacity,
      ]),
    ].filter((value) => Math.abs(value) >= 100);

    for (const figure of figures) {
      const spellings = [
        String(figure),
        String(figure).replace(/\B(?=(\d{3})+(?!\d))/g, "_"),
        formatNumber(figure),
      ];
      for (const source of SOURCES) {
        for (const spelling of spellings) {
          expect(
            source.code,
            `${source.path} restates the figure ${spelling}`,
          ).not.toContain(spelling);
        }
      }
    }
  });

  it("contains no pre-formatted money or percentage string", () => {
    for (const source of SOURCES) {
      expect(source.code, source.path).not.toMatch(/CHF\s*\d/);
      expect(source.code, source.path).not.toMatch(/\d+(\.\d+)?%/);
    }
  });

  it("assembles no scoreline of its own", () => {
    for (const source of SOURCES) {
      expect(source.code, source.path).not.toContain("FCB");
      expect(source.code, source.path).not.toContain("Sion");
    }
  });

  it("builds no number string itself — every figure goes through format.ts", () => {
    for (const source of SOURCES) {
      expect(source.code, source.path).not.toContain("toLocaleString");
      expect(source.code, source.path).not.toContain("Intl.NumberFormat");
    }

    // `toFixed` appears exactly once across the four, inside the ring's
    // `round()` — that is GEOMETRY rounding of a dash length, precisely as the
    // line chart rounds a coordinate, and never a displayed figure.
    const ring = SOURCES.find((source) => source.path.includes("ring"))!;
    expect(ring.code.match(/toFixed/g)).toHaveLength(1);
    expect(ring.code).toMatch(/function round[\s\S]{0,80}toFixed/);
    for (const source of SOURCES.filter((one) => one !== ring)) {
      expect(source.code, source.path).not.toContain("toFixed");
    }
  });

  it("invents no chart, no control and no motion of its own", () => {
    // Everything the band draws is a Phase 2b component; it contributes
    // layout, copy and one piece of state.
    expect(BAND_CODE).toContain("<LineChart");
    expect(BAND_CODE).toContain("<LineChartLegend");
    expect(BAND_CODE).toContain("<Segmented");
    expect(BAND_CODE).toContain("<KpiFigure");
    expect(BAND_CODE).toContain("<AttendanceRing");
    expect(BAND_CODE).toContain("<DeltaChip");
    expect(BAND_CODE).not.toContain("<svg");
    expect(BAND_CODE).not.toContain("setTimeout");
    expect(BAND_CODE).not.toContain("requestAnimationFrame");
  });

  it("is not imported by the baseline row — the band is cuttable", () => {
    // P1, first in the documented cut order: removing the band must not unpick
    // US-013. Only the route knows it exists.
    const row = code("app/components/dashboard/baseline-row.tsx");
    expect(row).not.toContain("hero-band");
    expect(row).not.toContain("HeroBand");
    expect(code("app/routes/_index.tsx")).toContain("HeroBand");
  });
});
