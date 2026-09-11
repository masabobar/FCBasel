/**
 * US-036 — Hero 2's primary answer, end to end.
 *
 * THE ACCEPTANCE CRITERIA, in order:
 *   1. the chip label is the section's heading and the keyword set stays
 *      US-030's (asserted by not being restated);
 *   2. two tiles in a fixed order — grouped bars over eight fixtures, then the
 *      totals tile with `-0.6%`, both seasons as labelled compare bars and the
 *      absolute change;
 *   3. a FULL-WIDTH month-by-month line chart, both seasons, current filled,
 *      with a legend and a hover;
 *   4. the narrative is VERBATIM.
 *
 * AND THE ONE RISK THAT IS NOT IN THE LIST. The two charts are at DIFFERENT
 * SCOPES: eight fixtures (CHF 7.83M) against every home fixture (CHF 9.77M).
 * Both labels must be on screen and they must differ, or an unlabelled mismatch
 * reads as an arithmetic error. That is `④ TWO SCOPES` below, and it asserts the
 * mismatch is genuine rather than assuming it.
 *
 * Three techniques are reused rather than reinvented:
 *
 *   - **Verbatim** at the BYTE level (US-032's method, as US-034 applied it):
 *     UTF-8 hex against a retyped literal, exact length, an ASCII sweep, the
 *     hyphens pinned to 0x2d, and a match against the sentence in the backlog
 *     itself — so the two copies in this repository cannot drift together.
 *   - **No figure re-typed** by SCANNING the sources (US-013's method): every
 *     figure the section can display, in every spelling, absent from the
 *     component and loader code.
 *   - **Collision proved as ARITHMETIC** from `groupedBarGeometry` (US-019's
 *     method): eight pairs and eight chips, measured, with the real fixtures.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GROUPED_BAR_SEASON,
  groupedBarGeometry,
  type GroupedBarGeometry,
} from "../../app/components/charts/grouped-bars";
import {
  Hero2Body,
  HERO_2_TILE_TITLE_KEY,
} from "../../app/components/heroes/hero-2";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import { HERO_CHIP_LABEL_KEY } from "../../app/lib/dashboard/chips";
import {
  InsightPhase,
  type InsightSections as SectionList,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import {
  chfFromThousands,
  formatMoneyCompact,
  formatMoneyMillions,
  formatNumber,
  formatSignedMoneyCompact,
  formatSignedNumber,
  formatSignedPercent,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import {
  fixtureTotals,
  monthlyTotals,
  percentChange,
} from "../../app/lib/repositories/derive";
import {
  HeroId,
  VarianceDirection,
  VarianceJudgement,
} from "../../app/lib/repositories/enums";
import { type FixtureRevenue } from "../../app/lib/repositories/types";
import { HEROES } from "./support/hero-data";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
  type FrameStub,
} from "./support/motion-harness";
import { t } from "./support/i18n";

/* ----------------------------------------------------------------- DATA -- */

const PRIMARY = HEROES.hero2.primary;
const FOLLOW_UP = HEROES.hero2.followUp;
const FIXTURES = PRIMARY.fixtures.fixtures;
const MONTHS = PRIMARY.monthly.months;
const TOTALS = fixtureTotals(FIXTURES);
const MONTHLY = monthlyTotals(MONTHS);

/* --------------------------------------------------------------- SOURCE -- */

/**
 * Every source file between the dataset and the screen. The scan below covers
 * all of them, so a figure cannot be re-typed one layer up instead.
 */
const SCANNED_SOURCES = [
  "app/components/heroes/hero-2.tsx",
  "app/components/heroes/hero-section.tsx",
  "app/components/heroes/insight-sections.tsx",
  "app/components/tiles/compare-bars.tsx",
  "app/lib/dashboard/heroes.ts",
  "app/root.tsx",
] as const;

/** Comments explain the figures; only executable code may not restate them. */
function code(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

const SOURCES = SCANNED_SOURCES.map((path) => ({ path, code: code(path) }));

const HERO_2_SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/heroes/hero-2.tsx"),
  "utf8",
);

/**
 * The acceptance criteria as written, whitespace-collapsed.
 *
 * The verbatim narrative is checked against THIS as well as against a literal
 * below, so the two copies in the repository cannot drift together: the backlog
 * is the document the client signed off, and it wraps the sentence across three
 * lines.
 */
const BACKLOG = readFileSync(
  resolve(
    process.cwd(),
    ".project-management/input/backlog/phase-3b-heroes.md",
  ),
  "utf8",
).replace(/\s+/g, " ");

/**
 * Values below 100 are excluded from the scan: a two-digit figure collides with
 * Tailwind spans, icon sizes and array indices, so scanning for them would be
 * noise rather than a guard. Every fixture and month figure is far above it,
 * and the three figures that are not — the `-0.6%`, the `-50` and the `-CHF
 * 50k` — are scanned for by their own exact spellings below.
 */
const FIGURE_FLOOR = 100;

/** Every figure the section can put on screen, at or above the floor. */
const DISPLAYED_FIGURES: readonly number[] = [
  ...FIXTURES.flatMap((fixture) => [
    fixture.previous,
    fixture.current,
    fixture.current - fixture.previous,
  ]),
  ...MONTHS.flatMap((month) => [month.previous, month.current]),
  TOTALS.previous,
  TOTALS.current,
].filter((value) => Math.abs(value) >= FIGURE_FLOOR);

/* ------------------------------------------------------------- HARNESS -- */

function money(thousands: number): string {
  return formatMoneyCompact(chfFromThousands(thousands));
}

function signedMoney(thousands: number): string {
  return formatSignedMoneyCompact(chfFromThousands(thousands));
}

function moneyMillions(thousands: number): string {
  return formatMoneyMillions(chfFromThousands(thousands));
}

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

function section(): HTMLElement {
  return slot("insight-section")!;
}

function cards(): HTMLElement[] {
  return slots("card", section());
}

function cardTitles(): (string | null)[] {
  return cards().map((card) => card.querySelector("h3")!.textContent);
}

function subtitleOf(index: number): string {
  return slot("card-subtitle", cards()[index]!)!.textContent!;
}

/** Runs every count-up and growth transition to completion. */
function settle(frames: FrameStub): void {
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
}

function renderSections(
  sections: SectionList = withHeroShown([], HeroId.HERO_2),
  { settled = true }: { settled?: boolean } = {},
) {
  const frames = stubFrames();
  const result = render(
    <InsightSections sections={sections} heroes={HEROES} focus={null} />,
  );
  if (settled) settle(frames);
  return { ...result, frames };
}

/* ---- the fixture chart ---- */

function pair(name: string): HTMLElement {
  const found = slots("grouped-bar-pair", section()).find(
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

/** The first stop colour of the gradient a bar is actually painted with. */
function barColour(name: string, season: "previous" | "current"): string {
  const id = bar(name, season).getAttribute("fill")!.slice(5, -1);
  return document
    .getElementById(id)!
    .querySelector("stop")!
    .getAttribute("stop-color")!;
}

function chip(name: string): HTMLElement {
  const cell = slots("grouped-bar-chip-cell", section()).find(
    (candidate) => candidate.dataset.name === name,
  );
  if (!cell) throw new Error(`no chip cell for "${name}"`);
  return slot("delta-chip", cell)!;
}

function fixtureLabels(): string[] {
  return slots("grouped-bar-label", section()).map((node) => node.textContent!);
}

/* ---- the monthly chart ---- */

function monthlyPlot(): HTMLElement {
  return slot("line-chart-plot", section())!;
}

function lineFor(name: string): HTMLElement {
  const found = slots("line-chart-line", section()).find(
    (candidate) => candidate.dataset.series === name,
  );
  if (!found) throw new Error(`no line for series "${name}"`);
  return found;
}

/**
 * jsdom lays nothing out, so the plot's box is stated here — which is also what
 * makes "hovered at this month" an exact assertion.
 */
function hoverMonth(index: number): void {
  const plot = monthlyPlot();
  plot.getBoundingClientRect = (): DOMRect =>
    ({
      left: 0,
      width: 600,
      right: 600,
      top: 0,
      bottom: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  fireEvent.mouseMove(plot, {
    clientX: (index / (MONTHS.length - 1)) * 600,
  });
}

function tooltipRows(): string[] {
  return slots("line-chart-tooltip-row", section()).map((row) =>
    [...row.children]
      .map((cell) => cell.textContent)
      .filter((text) => text !== "")
      .join(" "),
  );
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ============================================ ① THE SECTION HEAD ======== */

describe("Hero 2 — the head states the question and its answer", () => {
  it("titles the section with US-029's chip label, not a second wording", () => {
    renderSections();

    const heading = within(section()).getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent(t(HERO_CHIP_LABEL_KEY[HeroId.HERO_2]));
    expect(t(HERO_CHIP_LABEL_KEY[HeroId.HERO_2])).toBe(
      "Ticket revenue, this year vs last",
    );
    // Imported, never retyped — one string for the chip and the heading it
    // answers.
    expect(code("app/components/heroes/hero-2.tsx")).toContain(
      "t(HERO_CHIP_LABEL_KEY[HeroId.HERO_2])",
    );
  });

  it("labels the section by that heading, so the canvas stays walkable", () => {
    renderSections();

    expect(section()).toHaveAccessibleName(
      t(HERO_CHIP_LABEL_KEY[HeroId.HERO_2]),
    );
  });

  it("states the narrative BEFORE any chart or tile", () => {
    renderSections();

    const narrative = slot("section-narrative", section())!;
    for (const node of [...cards(), ...section().querySelectorAll("svg")]) {
      expect(
        narrative.compareDocumentPosition(node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(section().querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("puts NO scope line on the head — the two scopes differ", () => {
    // A single line over the head would have to describe both scopes and would
    // therefore describe neither. Each tile states its own; see ④.
    renderSections();

    expect(slot("section-scope", section())).toBeNull();
  });

  it("carries no period filter — the question compares two named seasons", () => {
    renderSections();

    expect(slot("section-control", section())).toBeNull();
    expect(slots("segmented-option", section())).toHaveLength(0);
    expect(code("app/components/heroes/hero-2.tsx")).not.toMatch(
      /Segmented|PeriodKey|useState/,
    );
  });

  it("restates no keyword set of its own — matching stays US-030's", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/matchday.*keyword|keyword/i);
      expect(source.code).not.toMatch(/\bgate\b|\bfixtures\/|25 26/i);
    }
  });
});

/* ============================================ ② VERBATIM NARRATIVE ====== */

/**
 * The narrative EXACTLY as the backlog states it. Every hazard a text pass
 * could "improve" is in it: a parenthesised negative percentage, a colon, a
 * comma-spliced list of six clubs, and a compact money figure whose minus sign
 * sits before the currency unit.
 */
const AUTHORED =
  "Overall matchday ticket revenue is roughly flat year on year (-0.6%), but " +
  "it varies sharply by fixture: YB, Servette and St. Gallen are up, while " +
  "FCZ, Lugano and Sion are down. The FCZ match is the single biggest drop, " +
  "-CHF 150k.";

/** UTF-8 bytes, so "byte-identical" is asserted rather than approximated. */
function bytes(value: string): string {
  return Buffer.from(value, "utf8").toString("hex");
}

describe("Hero 2 — the narrative is the contract (criterion 4)", () => {
  it("renders the dataset's string, byte for byte", () => {
    renderSections();

    const rendered = slot("section-narrative", section())!.textContent!;
    expect(bytes(rendered)).toBe(bytes(AUTHORED));
    expect(bytes(t(PRIMARY.narrativeKey))).toBe(bytes(AUTHORED));
    expect(rendered).toHaveLength(AUTHORED.length);
    expect(AUTHORED).toHaveLength(229);
  });

  it("matches the acceptance criterion in the backlog itself", () => {
    // Two copies inside this repository could drift together; the signed-off
    // document cannot, so the string is checked against it as well.
    expect(BACKLOG).toContain(t(PRIMARY.narrativeKey));
  });

  it("is plain ASCII — no smart quote, no em dash, no minus glyph", () => {
    for (const character of t(PRIMARY.narrativeKey)) {
      expect(character.codePointAt(0)!).toBeLessThan(0x80);
    }
    expect(t(PRIMARY.narrativeKey)).not.toMatch(/[‘’“”–—−]/u);
  });

  it("pins both signs to an ASCII hyphen, 0x2d", () => {
    // The two figures the room reads off this sentence. A minus glyph or an en
    // dash here would not match the tiles below, which format with U+002D.
    for (const fragment of ["(-0.6%)", "-CHF 150k"]) {
      expect(t(PRIMARY.narrativeKey)).toContain(fragment);
      const index = t(PRIMARY.narrativeKey).indexOf(fragment);
      expect(
        t(PRIMARY.narrativeKey).codePointAt(index + fragment.indexOf("-")),
      ).toBe(0x2d);
    }
  });

  it("is never assembled, truncated or transformed on the way to the screen", () => {
    renderSections();

    const line = slot("section-narrative", section())!;
    expect(line.textContent).toBe(t(PRIMARY.narrativeKey));
    expect(line.className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
    // No copy of the sentence exists in the component layer at all.
    for (const source of SOURCES) {
      expect(source.code).not.toContain("Overall matchday");
      expect(source.code).not.toContain("varies sharply");
    }
  });

  it("quotes figures the tiles actually show", () => {
    // The -0.6% and the -CHF 150k are DERIVED from the same eight pairs the
    // bars plot, so the sentence and the charts under it cannot disagree.
    expect(formatSignedPercent(TOTALS.deltaPercent)).toBe("-0.6%");
    expect(t(PRIMARY.narrativeKey)).toContain("(-0.6%)");

    const fcz = FIXTURES.find((fixture) => fixture.opponent === "FCZ")!;
    expect(signedMoney(fcz.current - fcz.previous)).toBe("-CHF 150k");
    expect(t(PRIMARY.narrativeKey)).toContain("-CHF 150k");
  });

  it("names the six clubs the fixtures actually moved for", () => {
    const up = FIXTURES.filter((one) => one.current > one.previous);
    const down = FIXTURES.filter((one) => one.current < one.previous);

    for (const club of ["YB", "Servette", "St. Gallen"]) {
      expect(up.map((one) => one.opponent)).toContain(club);
      expect(t(PRIMARY.narrativeKey)).toContain(club);
    }
    for (const club of ["FCZ", "Lugano", "Sion"]) {
      expect(down.map((one) => one.opponent)).toContain(club);
      expect(t(PRIMARY.narrativeKey)).toContain(club);
    }
  });
});

/* ============================================ ③ THE TILES, IN ORDER ===== */

describe("Hero 2 — three visuals, in the defined order", () => {
  it("renders exactly three tiles for the primary answer", () => {
    renderSections();

    expect(cards()).toHaveLength(3);
  });

  it("orders them grouped bars, totals, then the monthly line chart", () => {
    renderSections();

    expect(cardTitles()).toEqual([
      t(HERO_2_TILE_TITLE_KEY.fixtures),
      t(HERO_2_TILE_TITLE_KEY.totals),
      t(HERO_2_TILE_TITLE_KEY.months),
    ]);
    expect(cardTitles()[0]).toBe(
      "Matchday ticket revenue by fixture (CHF 000)",
    );
    // The chart is the second visual, the KPI the first tile after it — the
    // DOM order IS the reading order.
    expect(slot("grouped-bars", cards()[0]!)).not.toBeNull();
    expect(slot("kpi-figure", cards()[1]!)).not.toBeNull();
    expect(slot("line-chart", cards()[2]!)).not.toBeNull();
  });

  it("titles the tiles as h3 under the section's own h2", () => {
    renderSections();

    expect(
      within(section()).getAllByRole("heading", { level: 2 }),
    ).toHaveLength(1);
    expect(
      within(section()).getAllByRole("heading", { level: 3 }),
    ).toHaveLength(3);
  });

  it("gives the monthly chart the FULL width of the canvas grid", () => {
    renderSections();

    // Criterion 3: twelve months across a third of the grid is unreadable.
    expect(cards()[2]!.className).toContain("col-span-full");
    expect(cards()[2]!.className).not.toMatch(/lg:col-span-\d/);
    // The two tiles above it share one row — eight-of-twelve and four — but
    // only from `xl`: at the `lg` breakpoint itself two thirds of the canvas
    // leaves a 51.8px chip cell for a 59.5px chip, so they stack instead.
    expect(cards()[0]!.className).toContain("xl:col-span-8");
    expect(cards()[1]!.className).toContain("xl:col-span-4");
    for (const card of cards()) {
      expect(card.className).toContain("col-span-full");
      expect(card.className).not.toMatch(/lg:col-span-\d/);
    }
  });
});

describe("Hero 2 — the fixture chart (criterion 2, first tile)", () => {
  it("plots eight fixtures, two bars each, in the dataset's order", () => {
    renderSections();

    expect(FIXTURES).toHaveLength(8);
    expect(slots("grouped-bar-pair", section())).toHaveLength(8);
    expect(slots("grouped-bar", section())).toHaveLength(16);
    expect(fixtureLabels()).toEqual(
      FIXTURES.map((fixture) => fixture.opponent),
    );
    expect(fixtureLabels()).toEqual([
      "YB",
      "FCZ",
      "Servette",
      "St. Gallen",
      "Luzern",
      "Sion",
      "GC",
      "Lugano",
    ]);
  });

  it("paints 25/26 navy and 26/27 red, from the token set", () => {
    renderSections();

    for (const fixture of FIXTURES) {
      expect(barColour(fixture.opponent, "previous")).toBe(
        GROUPED_BAR_SEASON.previous,
      );
      expect(barColour(fixture.opponent, "current")).toBe(
        GROUPED_BAR_SEASON.current,
      );
    }
    // Token references, not hexes — and the legend says which is which in
    // WORDS, so the colour is never the only carrier.
    expect(GROUPED_BAR_SEASON.previous).toContain("--color-series-tertiary");
    expect(GROUPED_BAR_SEASON.current).toContain("--color-series-primary");
    expect(
      slots("grouped-bar-legend-item", section()).map(
        (item) => item.textContent,
      ),
    ).toEqual([
      t(PRIMARY.previousSeason.labelKey),
      t(PRIMARY.currentSeason.labelKey),
    ]);
  });

  it("scopes the tile to the eight highest-grossing home fixtures", () => {
    renderSections();

    expect(subtitleOf(0)).toBe(t(PRIMARY.fixtures.scopeLabelKey));
    expect(subtitleOf(0).toLowerCase()).toContain(
      "eight highest-grossing home fixtures",
    );
  });

  it("states all eight movements, signed, with an arrow and a word", () => {
    renderSections();

    const expected: readonly [string, number][] = [
      ["YB", 130],
      ["FCZ", -150],
      ["Servette", 70],
      ["St. Gallen", 70],
      ["Luzern", -70],
      ["Sion", -70],
      ["GC", 80],
      ["Lugano", -110],
    ];

    for (const [name, delta] of expected) {
      const fixture = FIXTURES.find((one) => one.opponent === name)!;
      // The movement is the dataset's own arithmetic, not this list's.
      expect(fixture.current - fixture.previous).toBe(delta);
      expect(chip(name)).toHaveTextContent(formatSignedNumber(delta));
      expect(chip(name)).toHaveAttribute(
        "data-direction",
        delta > 0 ? VarianceDirection.UP : VarianceDirection.DOWN,
      );
      // Three carriers: the arrow, the explicit sign, and the spoken word.
      expect(slot("delta-arrow", chip(name))).not.toBeNull();
      expect(chip(name)).toHaveTextContent(delta > 0 ? "up" : "down");
    }
    expect(slots("grouped-bar-chip-cell", section())).toHaveLength(8);
  });

  it("shows both seasons WITH their unit, and the movement, on hover", () => {
    renderSections();

    fireEvent.mouseEnter(pair("FCZ"));
    const tooltip = slot("grouped-bars-tooltip", section())!;

    expect(slot("fixture-tooltip-name", tooltip)).toHaveTextContent("FCZ");
    expect(tooltip).toHaveTextContent(
      `${t(PRIMARY.previousSeason.labelKey)} ${money(1_390)}`,
    );
    expect(tooltip).toHaveTextContent(
      `${t(PRIMARY.currentSeason.labelKey)} ${money(1_240)}`,
    );
    expect(tooltip).toHaveTextContent(signedMoney(-150));
    expect(tooltip).toHaveAttribute("role", "status");
  });

  it("keeps the hover reading available from the keyboard", () => {
    renderSections();

    fireEvent.keyDown(slot("grouped-bars-plot", section())!, {
      key: "ArrowRight",
    });

    expect(slot("fixture-tooltip-name", section())).toHaveTextContent("YB");
  });
});

describe("Hero 2 — the totals tile (criterion 2, second tile)", () => {
  it("headlines CHF 7.83M for 26/27", () => {
    renderSections();

    expect(slot("kpi-value", cards()[1]!)!.textContent).toBe(
      moneyMillions(TOTALS.current),
    );
    expect(slot("kpi-value", cards()[1]!)!.textContent).toBe("CHF 7.83M");
    expect(slot("kpi-subtitle", cards()[1]!)).toHaveTextContent(
      `${t(PRIMARY.currentSeason.labelKey)} vs ${t(PRIMARY.previousSeason.labelKey)}`,
    );
  });

  it("states -0.6% with the negative token, an explicit sign and a DOWN arrow", () => {
    renderSections();

    const delta = slot("delta-chip", slot("kpi-figure", cards()[1]!)!)!;
    expect(delta).toHaveTextContent(formatSignedPercent(TOTALS.deltaPercent));
    expect(delta).toHaveTextContent("-0.6%");
    expect(delta).toHaveAttribute("data-direction", VarianceDirection.DOWN);
    expect(delta).toHaveAttribute("data-judgement", VarianceJudgement.ADVERSE);
    expect(delta.className).toContain("text-variance-negative");
    expect(slot("delta-arrow", delta)).not.toBeNull();
    expect(delta).toHaveTextContent("down");
  });

  it("draws both seasons as labelled compare bars on one shared scale", () => {
    renderSections();

    const bars = slots("compare-bar", cards()[1]!);
    expect(bars).toHaveLength(2);
    expect(
      bars.map((one) => slot("compare-bar-label", one)!.textContent),
    ).toEqual([
      t(PRIMARY.previousSeason.labelKey),
      t(PRIMARY.currentSeason.labelKey),
    ]);
    expect(
      bars.map((one) => slot("compare-bar-value", one)!.textContent),
    ).toEqual([moneyMillions(TOTALS.previous), moneyMillions(TOTALS.current)]);
    expect(
      bars.map((one) => slot("compare-bar-value", one)!.textContent),
    ).toEqual(["CHF 7.88M", "CHF 7.83M"]);

    // 25/26 is the larger figure, so it fills the track and this season reads
    // as a proportion of it — the comparison is the point.
    const width = (index: number): number =>
      Number(slot("compare-bar-fill", bars[index]!)!.style.width.slice(0, -1));
    expect(width(0)).toBeCloseTo(100, 5);
    expect(width(1)).toBeLessThan(width(0));
  });

  it("matches the bars' own colours: navy last season, red this one", () => {
    renderSections();

    const bars = slots("compare-bar", cards()[1]!);
    expect(slot("compare-bar-fill", bars[0]!)).toHaveAttribute(
      "data-series",
      "navy",
    );
    expect(slot("compare-bar-fill", bars[1]!)).toHaveAttribute(
      "data-series",
      "red",
    );
  });

  it("states the ABSOLUTE change as well as the percentage", () => {
    renderSections();

    const change = slot("totals-change", cards()[1]!)!;
    expect(change).toHaveTextContent(signedMoney(TOTALS.delta));
    expect(change).toHaveTextContent("-CHF 50k");
    expect(change).toHaveTextContent(
      `vs ${t(PRIMARY.previousSeason.labelKey)}`,
    );
    expect(slot("delta-chip", change)).toHaveAttribute(
      "data-direction",
      VarianceDirection.DOWN,
    );
  });

  it("scopes the totals to the fixtures they total", () => {
    renderSections();

    expect(subtitleOf(1)).toBe(t(PRIMARY.fixtures.scopeLabelKey));
  });
});

describe("Hero 2 — the monthly chart (criterion 3)", () => {
  it("plots twelve months, July to June, in the dataset's order", () => {
    renderSections();

    expect(MONTHS).toHaveLength(12);
    expect(
      slots("line-chart-axis-label", section()).map((node) => node.textContent),
    ).toEqual(MONTHS.map((month) => t(month.labelKey)));
    expect(MONTHS.map((month) => t(month.labelKey)).slice(0, 2)).toEqual([
      "Jul",
      "Aug",
    ]);
    expect(t(MONTHS[11]!.labelKey)).toBe("Jun");
  });

  it("draws both seasons, with the CURRENT one filled", () => {
    renderSections();

    expect(slots("line-chart-line", section())).toHaveLength(2);
    expect(lineFor(t(PRIMARY.previousSeason.labelKey))).not.toBeNull();
    expect(lineFor(t(PRIMARY.currentSeason.labelKey))).not.toBeNull();
    // Exactly one area, and it belongs to the season being asked about.
    const areas = slots("line-chart-area", section());
    expect(areas).toHaveLength(1);
    expect(
      areas[0]!.compareDocumentPosition(
        lineFor(t(PRIMARY.currentSeason.labelKey)),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Neither season is dashed: both are real, measured seasons.
    for (const line of slots("line-chart-line", section())) {
      expect(line).toHaveAttribute("data-style", "solid");
    }
  });

  it("carries a legend naming both seasons", () => {
    renderSections();

    expect(
      slots("line-chart-legend-item", section()).map((one) => one.textContent),
    ).toEqual([
      t(PRIMARY.previousSeason.labelKey),
      t(PRIMARY.currentSeason.labelKey),
    ]);
  });

  it("shows BOTH seasons' figures on hover, with their unit", () => {
    renderSections();

    hoverMonth(2);

    const heading = slot("line-chart-tooltip-heading", section())!;
    expect(heading).toHaveTextContent(t(MONTHS[2]!.labelKey));
    expect(tooltipRows()).toEqual([
      `${t(PRIMARY.previousSeason.labelKey)} ${money(MONTHS[2]!.previous)}`,
      `${t(PRIMARY.currentSeason.labelKey)} ${money(MONTHS[2]!.current)}`,
    ]);
    expect(tooltipRows()[0]).toContain("CHF 1’180k");
    expect(tooltipRows()[1]).toContain("CHF 1’240k");
  });
});

/* ============================================ ④ TWO SCOPES ============= */

describe("Hero 2 — two scopes, both stated (the scope-label trap)", () => {
  it("renders BOTH scope labels, and they differ", () => {
    renderSections();

    const subtitles = cards().map(
      (card) => slot("card-subtitle", card)!.textContent,
    );
    expect(subtitles[0]).toBe(t(PRIMARY.fixtures.scopeLabelKey));
    expect(subtitles[2]).toBe(t(PRIMARY.monthly.scopeLabelKey));
    expect(t(PRIMARY.fixtures.scopeLabelKey)).not.toBe(
      t(PRIMARY.monthly.scopeLabelKey),
    );
  });

  it("says which scope each chart is at, in words the room can read", () => {
    renderSections();

    // The narrower one names the eight fixtures; the broader one names EVERY
    // home fixture. Both name the exclusion that makes the figures matchday
    // revenue rather than total ticketing revenue.
    expect(subtitleOf(0).toLowerCase()).toContain("eight highest-grossing");
    expect(subtitleOf(2).toLowerCase()).toContain("all home fixtures");
    for (const index of [0, 2]) {
      expect(subtitleOf(index).toLowerCase()).toContain(
        "excluding the season-ticket base",
      );
    }
  });

  it("is a GENUINE mismatch: the months really do total more", () => {
    // If this ever stopped being true the labels would be describing a
    // difference that no longer exists, which is its own kind of lie.
    expect(MONTHLY.current).toBeGreaterThan(TOTALS.current);
    expect(MONTHLY.previous).toBeGreaterThan(TOTALS.previous);
    expect(MONTHLY.current).toBe(9_770);
    expect(TOTALS.current).toBe(7_830);
  });

  it("takes both labels from the DATASET, not from the component", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toContain("highest-grossing");
      expect(source.code).not.toContain("All home fixtures");
      expect(source.code).not.toContain("season-ticket");
    }
    expect(code("app/components/heroes/hero-2.tsx")).toContain(
      "t(fixtures.scopeLabelKey)",
    );
    expect(code("app/components/heroes/hero-2.tsx")).toContain(
      "t(monthly.scopeLabelKey)",
    );
  });
});

/* ============================================ ⑤ DERIVED, NOT STORED ==== */

describe("Hero 2 — every total is derived (no stored figure to read)", () => {
  it("has no total, delta or percentage stored anywhere in the dataset", () => {
    const keys = [
      ...Object.keys(PRIMARY),
      ...Object.keys(PRIMARY.fixtures),
      ...Object.keys(PRIMARY.monthly),
      ...FIXTURES.flatMap((fixture) => Object.keys(fixture)),
      ...MONTHS.flatMap((month) => Object.keys(month)),
    ];

    for (const key of keys) {
      expect(key).not.toMatch(/total|delta|pct|percent|change|sum|diff/i);
    }
    // And the figures themselves are absent, so nothing could be read even by
    // a stray index: the fixtures are stored, their sums are not. The
    // narrative is excluded because it QUOTES the -0.6% in prose, which is the
    // point of it — it is checked against the derived figure in ② instead.
    const serialised = JSON.stringify({ ...PRIMARY, narrative: "" });
    for (const figure of [7_830, 7_880, -50, -0.6, 9_770]) {
      expect(serialised).not.toContain(String(figure));
    }
  });

  it("derives the two totals from the same eight pairs the bars plot", () => {
    const sum = (values: readonly number[]): number =>
      values.reduce((total, value) => total + value, 0);

    expect(TOTALS.current).toBe(sum(FIXTURES.map((one) => one.current)));
    expect(TOTALS.previous).toBe(sum(FIXTURES.map((one) => one.previous)));
    expect(TOTALS.delta).toBe(TOTALS.current - TOTALS.previous);
    expect(TOTALS.delta).toBe(-50);
  });

  it("derives -0.6% through the app's ONE percentage rule", () => {
    expect(TOTALS.deltaPercent).toBe(
      percentChange(TOTALS.current, TOTALS.previous),
    );
    expect(TOTALS.deltaPercent).toBe(-0.6);
    expect(formatSignedPercent(TOTALS.deltaPercent)).toBe("-0.6%");
  });

  it("moves the headline when a fixture moves — the proof it is not stored", () => {
    const edited: FixtureRevenue[] = FIXTURES.map((fixture) =>
      fixture.opponent === "FCZ" ? { ...fixture, current: 1_390 } : fixture,
    );
    const after = fixtureTotals(edited);

    expect(after.current).toBe(TOTALS.current + 150);
    expect(after.deltaPercent).not.toBe(TOTALS.deltaPercent);
    expect(formatSignedPercent(after.deltaPercent)).toBe("+1.3%");
  });

  it("re-types not one displayed figure in the component layer", () => {
    // Every spelling: the raw number, the grouped number, and the money forms.
    for (const value of DISPLAYED_FIGURES) {
      const spellings = [
        String(value),
        formatNumber(value),
        money(value),
        signedMoney(value),
      ];
      for (const source of SOURCES) {
        for (const spelling of spellings) {
          expect(
            source.code,
            `${spelling} appears in ${source.path}`,
          ).not.toContain(spelling);
        }
      }
    }
  });

  it("re-types none of the derived headline figures either", () => {
    for (const source of SOURCES) {
      for (const spelling of [
        "0.6",
        "7.83",
        "7.88",
        "9.77",
        "CHF 50k",
        "-50",
      ]) {
        expect(source.code).not.toContain(spelling);
      }
    }
  });

  it("builds no chart of its own — the section is composition", () => {
    // US-034's proof, applied to the second hero: not one primitive of a chart
    // is written here.
    // Scanned with the comments stripped: the prose above the code explains
    // that there is no `<svg>` here, and an explanation is not a violation.
    const source = code("app/components/heroes/hero-2.tsx");
    expect(source).not.toMatch(/<svg|<rect|<path|viewBox|<line\b/);
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/\brgba?\(/);
    // No em dash, en dash or minus glyph in anything this file can render.
    expect(source).not.toMatch(/[–—−]/u);
    expect(source).not.toMatch(/dangerouslySetInnerHTML/);
    // The raw file still exists to be read; nothing else needs it.
    expect(HERO_2_SOURCE.length).toBeGreaterThan(source.length);
  });
});

/* ============================================ ⑥ CHIPS DO NOT COLLIDE === */

describe("Hero 2 — eight pairs and eight chips, measured", () => {
  const geometry = groupedBarGeometry(
    FIXTURES.map((fixture) => ({
      name: fixture.opponent,
      previous: fixture.previous,
      current: fixture.current,
    })),
  )!;

  /** The top of the tallest bar — the smallest `y` on screen. */
  function tallestBarTop(one: GroupedBarGeometry): number {
    return Math.min(
      ...one.pairs.flatMap((layout) => [layout.previous.y, layout.current.y]),
    );
  }

  it("gives every chip its own slot, none overlapping its neighbour", () => {
    expect(geometry.pairs).toHaveLength(8);

    for (const [index, layout] of geometry.pairs.entries()) {
      const next = geometry.pairs[index + 1];
      expect(layout.chipRight).toBeGreaterThan(layout.chipLeft);
      if (next) expect(next.chipLeft).toBeGreaterThanOrEqual(layout.chipRight);
    }
    // Eight equal cells across the plot, and not one wider than its share.
    const widths = geometry.pairs.map((one) => one.chipRight - one.chipLeft);
    expect(new Set(widths.map((width) => width.toFixed(2))).size).toBe(1);
    expect(widths[0]).toBeCloseTo(geometry.plotWidth / 8, 2);
  });

  it("starts the chip band to the RIGHT of the axis figures", () => {
    // Review decision 1: the scale is in its own gutter, so no chip and no bar
    // can ever be drawn over an axis figure.
    expect(geometry.axisLabelX).toBeLessThan(geometry.plotLeft);
    expect(geometry.pairs[0]!.chipLeft).toBeGreaterThanOrEqual(
      geometry.plotLeft,
    );
    expect(geometry.pairs[7]!.chipRight).toBeLessThanOrEqual(
      geometry.plotRight,
    );
  });

  it("keeps the tallest of the sixteen bars out of the chip band", () => {
    // Review decision 2, with the REAL data: YB's 1,610 is the tallest bar and
    // its top still sits below the reserved headroom.
    expect(tallestBarTop(geometry)).toBeGreaterThanOrEqual(
      geometry.chipBandTop + geometry.chipBandHeight,
    );
    expect(geometry.max).toBeGreaterThanOrEqual(1_610);
    expect(geometry.barZoneHeight).toBeLessThan(geometry.plotHeight);
  });

  it("renders one chip per pair, inside the band, in the mounted section", () => {
    renderSections();

    const band = slot("grouped-bar-chips", section())!;
    expect(slots("delta-chip", band)).toHaveLength(8);
    expect(slots("grouped-bar-chip-cell", band)).toHaveLength(8);
    // Every cell is an equal flex share, so two chips cannot share a column.
    for (const cell of slots("grouped-bar-chip-cell", band)) {
      expect(cell.className).toContain("flex-1");
      expect(cell.className).toContain("min-w-0");
    }
    expect(band.className).toContain("pointer-events-none");
  });

  it("keeps every chip short enough to sit in its own cell", () => {
    // The chips are bare signed magnitudes (`+130`), which is why the tile
    // title carries the unit: `+CHF 130k` in eight cells is the collision the
    // gutter and the band exist to prevent, and no formatter here re-creates
    // it. Longest chip text, in characters, against the cell's own share.
    renderSections();

    const longest = Math.max(
      ...slots("grouped-bar-chip-cell", section()).map(
        (cell) =>
          slot("delta-chip", cell)!.textContent!.replace(/up|down/, "").length,
      ),
    );
    expect(longest).toBeLessThanOrEqual("-110".length);
  });
});

/* ============================================ ⑦ THE SECTION MECHANIC ==== */

describe("Hero 2 — asking twice refreshes the section in place", () => {
  it("keeps ONE section with three tiles when the hero is re-asked", () => {
    const asked = withHeroShown([], HeroId.HERO_2);
    const { rerender, frames } = renderSections(asked);

    rerender(
      <InsightSections
        sections={withHeroShown(asked, HeroId.HERO_2)}
        heroes={HEROES}
        focus={null}
      />,
    );
    settle(frames);

    expect(slots("insight-section")).toHaveLength(1);
    expect(cards()).toHaveLength(3);
    expect(cardTitles()).toEqual([
      t(HERO_2_TILE_TITLE_KEY.fixtures),
      t(HERO_2_TILE_TITLE_KEY.totals),
      t(HERO_2_TILE_TITLE_KEY.months),
    ]);
    expect(slot("kpi-value", cards()[1]!)!.textContent).toBe("CHF 7.83M");
  });

  it("keeps the follow-up beat inside the same section", () => {
    renderSections(
      withFollowUpShown(withHeroShown([], HeroId.HERO_2), HeroId.HERO_2),
    );

    // The beat (US-037) is a fourth tile of THIS section plus its seam and its
    // panel, never a second section. Its content is asserted in
    // `tests/unit/hero2-follow-up.test.tsx`.
    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
    expect(cards()).toHaveLength(4);
  });

  it("renders the primary answer alone until the follow-up is asked", () => {
    renderSections();

    expect(section()).toHaveAttribute("data-phase", InsightPhase.PRIMARY);
    expect(cards()).toHaveLength(3);
  });

  it("staggers the three tiles through the section's one shared step", () => {
    renderSections();

    expect(cards()[0]!.style.animationDelay).toBe("");
    expect(cards()[1]!.style.animationDelay).toBe("90ms");
    expect(cards()[2]!.style.animationDelay).toBe("180ms");
  });
});

/* ============================================ ⑧ REDUCED MOTION ========= */

describe("Hero 2 — reduced motion shows the final state, not a frozen one", () => {
  it("draws every bar, every figure and both lines in the first render", () => {
    stubMatchMedia(true);
    stubFrames();
    render(
      <InsightSections
        sections={withHeroShown([], HeroId.HERO_2)}
        heroes={HEROES}
        focus={null}
      />,
    );

    // No frames advanced: the geometry and the figures are already final.
    for (const fixture of FIXTURES) {
      expect(
        Number(bar(fixture.opponent, "current").getAttribute("height")),
      ).toBeGreaterThan(0);
    }
    expect(slot("kpi-value", cards()[1]!)!.textContent).toBe("CHF 7.83M");
    expect(
      slots("compare-bar-value", section()).map((one) => one.textContent),
    ).toEqual(["CHF 7.88M", "CHF 7.83M"]);
    expect(
      Number(slot("compare-bar-fill", section())!.style.width.slice(0, -1)),
    ).toBeCloseTo(100, 5);
    for (const line of slots("line-chart-line", section())) {
      expect(line.getAttribute("stroke-dashoffset")).toBe("0");
    }
    // And no zero is left on screen as a "reading".
    expect(slots("grouped-bar-zero", section())).toHaveLength(0);
  });

  it("still renders all three tiles, in order", () => {
    stubMatchMedia(true);
    stubFrames();
    render(
      <InsightSections
        sections={withHeroShown([], HeroId.HERO_2)}
        heroes={HEROES}
        focus={null}
      />,
    );

    expect(cardTitles()).toEqual([
      t(HERO_2_TILE_TITLE_KEY.fixtures),
      t(HERO_2_TILE_TITLE_KEY.totals),
      t(HERO_2_TILE_TITLE_KEY.months),
    ]);
  });
});

/* ============================================ ⑨ THE BODY ON ITS OWN ==== */

describe("Hero2Body — the section body, mounted directly", () => {
  it("renders the head and the three tiles without the frame around it", () => {
    const frames = stubFrames();
    render(
      <Hero2Body
        primary={PRIMARY}
        followUp={FOLLOW_UP}
        phase={InsightPhase.PRIMARY}
      />,
    );
    settle(frames);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      t(HERO_CHIP_LABEL_KEY[HeroId.HERO_2]),
    );
    expect(slots("card")).toHaveLength(3);
    expect(slot("section-narrative")).toHaveTextContent(
      t(PRIMARY.narrativeKey),
    );
  });

  it("reads the dataset through the root loader, not from a fixture of its own", () => {
    // `heroes.ts` hands both heroes down from one read; the section imports no
    // repository and no mock.
    expect(HEROES.hero2.primary).toBe(PRIMARY);
    expect(code("app/components/heroes/hero-2.tsx")).not.toMatch(
      /lib\/mock|Repository|createMock/,
    );
    expect(code("app/lib/dashboard/heroes.ts")).toContain(
      "hero2Repository.hero()",
    );
  });
});
