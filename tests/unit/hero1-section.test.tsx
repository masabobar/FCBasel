/**
 * US-034 — Hero 1's primary answer, end to end.
 *
 * THE SIX ACCEPTANCE CRITERIA, in order:
 *   1. the chip label is the section's heading — US-029's config, reused;
 *   2. the keyword set is US-030's, untouched (asserted by not being restated);
 *   3. three tiles in a fixed order with the pinned figures;
 *   4. the narrative is VERBATIM;
 *   5. ONE section-level `Segmented` drives all three tiles, with badge
 *      segments derived per period and their rounding corrected;
 *   6. a bar's hover shows units, share and revenue, and labels count up on a
 *      filter change.
 *
 * Two of these need a technique rather than an assertion, and both are used
 * here as earlier stories used them:
 *
 *   - **Verbatim** is asserted at the BYTE level (US-032's method): the UTF-8
 *     hex of the rendered string against the hex of a literal, its exact
 *     length, an ASCII-range check, and a match against the sentence in the
 *     backlog itself — so the two copies in this repository cannot drift
 *     together.
 *   - **No figure re-typed** is asserted by SCANNING the sources (US-013's
 *     method): every figure the section can display, in every spelling, must
 *     be absent from the component and loader code.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  Hero1Body,
  HERO_1_PERIOD,
  HERO_1_PERIOD_LABEL_KEY,
  HERO_1_TILE_TITLE_KEY,
} from "../../app/components/heroes/hero-1";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import { HERO_CHIP_LABEL_KEY } from "../../app/lib/dashboard/chips";
import {
  InsightPhase,
  type InsightSections as SectionList,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import {
  formatMoney,
  formatMoneyMillions,
  formatNumber,
  formatSharePercent,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import {
  badgeSegments,
  badgeShare,
  homeKitShare,
  kitRevenue,
  kitRevenueRows,
  kitRevenueTotal,
  kitUnitsShare,
  kitUnitsTotal,
  SHIRT_PRICE_CHF,
} from "../../app/lib/repositories/derive";
import {
  HeroId,
  KitVariant,
  PeriodKey,
} from "../../app/lib/repositories/enums";
import { type Hero1Period } from "../../app/lib/repositories/types";
import App, { loader as rootLoader } from "../../app/root";
import { HEROES } from "./support/hero-data";
import { settleThinkingBeat } from "./support/thinking-harness";
import {
  type FrameStub,
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";
import { signIn } from "./support/sign-in";
import { t } from "./support/i18n";
import { PERIOD_INLINE_LABEL_KEY } from "../../app/lib/repositories/enums";

/* ----------------------------------------------------------------- DATA -- */

const PRIMARY = HEROES.hero1.primary;
/** The follow-up travels with the primary; US-035's own suite exercises it. */
const FOLLOW_UP = HEROES.hero1.followUp;

function periodFor(key: PeriodKey): Hero1Period {
  const period = PRIMARY.periods.find((one) => one.key === key);
  if (!period) throw new Error(`Hero 1 has no period ${key}`);
  return period;
}

const SEASON = periodFor(PeriodKey.SEASON_TO_DATE);
const LAST_3_MONTHS = periodFor(PeriodKey.LAST_3_MONTHS);

/* --------------------------------------------------------------- SOURCE -- */

/**
 * Every source file between the dataset and the screen. The scan below covers
 * all of them, so a figure cannot be re-typed one layer up instead.
 */
const SCANNED_SOURCES = [
  "app/components/heroes/hero-1.tsx",
  "app/components/heroes/hero-section.tsx",
  "app/components/heroes/insight-sections.tsx",
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

const HERO_1_SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/heroes/hero-1.tsx"),
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
 * Values below 100 are excluded from the scan: a two-digit unit count collides
 * with Tailwind spans, icon sizes and array indices, so scanning for them would
 * be noise rather than a guard. Every figure the criteria pin is far above it.
 */
const FIGURE_FLOOR = 100;

const DISPLAYED_FIGURES: readonly number[] = PRIMARY.periods
  .flatMap((period) => [
    ...period.kits.map((kit) => kit.units),
    ...kitRevenueRows(period).map((kit) => kit.revenue),
    kitUnitsTotal(period),
    kitRevenueTotal(period),
    period.badgeTotal,
    ...badgeSegments(period.badgeTotal, PRIMARY.badgeSplit).map(
      (segment) => segment.value,
    ),
    ...period.printedNames.map((printed) => printed.units),
  ])
  .filter((value) => Math.abs(value) >= FIGURE_FLOOR);

/* ------------------------------------------------------------- HARNESS -- */

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

/** Runs every count-up and growth transition to completion. */
function settle(frames: FrameStub): void {
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
}

function renderSections(
  sections: SectionList = withHeroShown([], HeroId.HERO_1),
  { settled = true }: { settled?: boolean } = {},
) {
  const frames = stubFrames();
  const result = render(
    <InsightSections sections={sections} heroes={HEROES} focus={null} />,
  );
  if (settled) settle(frames);
  return { ...result, frames };
}

/** The bar chart's three value labels, in render order. */
function barValues(): string[] {
  return slots("v-bar-value", section()).map((node) => node.textContent!);
}

/** The bar chart's three category labels, in render order. */
function barNames(): string[] {
  return slots("v-bar-label", section()).map((node) => node.textContent!);
}

function donutCentre(): string {
  return slot("donut-centre-value", section())!.textContent!;
}

function legendValues(): string[] {
  return slots("donut-legend-value", section()).map(
    (node) => node.textContent!,
  );
}

/** The printed-names list as `[label, value]` pairs, in render order. */
function nameRows(): [string, string][] {
  return slots("h-bar-row", section()).map((row) => [
    slot("h-bar-label", row)!.textContent!,
    slot("h-bar-value", row)!.textContent!,
  ]);
}

function periodOption(label: string): HTMLElement {
  const option = slots("segmented-option", section()).find(
    (button) => button.textContent === label,
  );
  if (!option) throw new Error(`No period option labelled ${label}`);
  return option;
}

/** Press a period and run every transition it starts to completion. */
function pressPeriod(frames: FrameStub, label: string): void {
  fireEvent.click(periodOption(label));
  settle(frames);
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ============================================ ① THE SECTION HEAD ======== */

describe("Hero 1 — the head states the question and its answer", () => {
  it("titles the section with US-029's chip label, not a second wording", () => {
    renderSections();

    const heading = within(section()).getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent(t(HERO_CHIP_LABEL_KEY[HeroId.HERO_1]));
    expect(t(HERO_CHIP_LABEL_KEY[HeroId.HERO_1])).toBe(
      "Shirt sales by kit & sponsor badges",
    );
    // The label is imported, never retyped — one string for the chip and the
    // heading it answers.
    expect(code("app/components/heroes/hero-1.tsx")).toContain(
      "t(HERO_CHIP_LABEL_KEY[HeroId.HERO_1])",
    );
  });

  it("labels the section by that heading, so the canvas stays walkable", () => {
    renderSections();

    expect(section()).toHaveAccessibleName(
      t(HERO_CHIP_LABEL_KEY[HeroId.HERO_1]),
    );
  });

  it("surfaces the dataset's own scope label", () => {
    renderSections();

    expect(slot("section-scope", section())).toHaveTextContent(
      t(PRIMARY.scopeLabelKey),
    );
    expect(t(PRIMARY.scopeLabelKey)).toBe("Season-to-date merchandising");
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

  it("restates no keyword set of its own — matching stays US-030's", () => {
    // Criterion 2 is satisfied by NOT being reimplemented: the hero renders,
    // it does not decide whether it was asked for.
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/trikot|jersey|keyword/i);
    }
  });
});

/* ============================================ ② VERBATIM NARRATIVE ====== */

/**
 * The narrative EXACTLY as the backlog states it. Every hazard a text pass
 * could "improve" is in it: a plain hyphen in `flock-printing`, semicolons,
 * whole percentages, and three clauses in one sentence.
 */
const AUTHORED =
  "Pulled from Merchandising, Webshop and flock-printing. The Home kit drives " +
  "58% of shirt sales; about 8% of shirts carry a sponsor badge, with Bitpanda " +
  "the most printed; Shaqiri is comfortably the most printed name.";

/** UTF-8 bytes, so "byte-identical" is asserted rather than approximated. */
function bytes(value: string): string {
  return Buffer.from(value, "utf8").toString("hex");
}

describe("Hero 1 — the narrative is the contract (criterion 4)", () => {
  it("renders the dataset's string, byte for byte", () => {
    renderSections();

    const rendered = slot("section-narrative", section())!.textContent!;
    expect(bytes(rendered)).toBe(bytes(AUTHORED));
    expect(bytes(t(PRIMARY.narrativeKey))).toBe(bytes(AUTHORED));
    expect(rendered).toHaveLength(AUTHORED.length);
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
    // The one hyphen in the sentence is an ASCII 0x2d.
    expect(t(PRIMARY.narrativeKey)).toContain("flock-printing");
    expect(
      t(PRIMARY.narrativeKey).codePointAt(t(PRIMARY.narrativeKey).indexOf("-")),
    ).toBe(0x2d);
  });

  it("is never assembled, truncated or transformed on the way to the screen", () => {
    renderSections();

    // Rendered whole: the section variant of the caption strip does not
    // truncate, because truncating a verbatim narrative deletes the answer.
    const line = slot("section-narrative", section())!;
    expect(line.textContent).toBe(t(PRIMARY.narrativeKey));
    expect(line.className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
    // No copy of the sentence exists in the component layer at all.
    for (const source of SOURCES) {
      expect(source.code).not.toContain("Pulled from");
    }
  });

  it("quotes figures the tiles actually show", () => {
    // 58% and 8% are DERIVED from the same period the tiles render, so the
    // sentence and the charts under it cannot disagree.
    expect(formatSharePercent(homeKitShare(SEASON))).toBe("58%");
    expect(formatSharePercent(badgeShare(SEASON))).toBe("8%");
    expect(t(PRIMARY.narrativeKey)).toContain("58% of shirt sales");
    expect(t(PRIMARY.narrativeKey)).toContain("about 8% of shirts");
  });
});

/* ============================================ ③ THREE TILES, IN ORDER === */

describe("Hero 1 — three tiles, in the defined order (criterion 3)", () => {
  it("renders exactly three tiles for the primary answer", () => {
    renderSections();

    expect(cards()).toHaveLength(3);
  });

  it("orders them bar chart, donut, horizontal bars", () => {
    renderSections();

    const titles = cards().map((card) => card.querySelector("h3")!.textContent);
    expect(titles).toEqual([
      `${t(HERO_1_TILE_TITLE_KEY.kits)} (${t(PERIOD_INLINE_LABEL_KEY[SEASON.key])})`,
      t(HERO_1_TILE_TITLE_KEY.badges),
      t(HERO_1_TILE_TITLE_KEY.names),
    ]);
    expect(titles[0]).toBe("Shirt sales by kit (season to date)");
    expect(titles[1]).toBe("Sponsor badges printed");
    expect(titles[2]).toBe("Top printed names");
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

  it("plots Home 22'400, Away 10'300 and 3rd 5'800 units", () => {
    renderSections();

    expect(barNames()).toEqual(SEASON.kits.map((kit) => t(kit.labelKey)));
    expect(barNames()).toEqual(["Home", "Away", "3rd"]);
    expect(barValues()).toEqual(
      SEASON.kits.map((kit) => formatNumber(kit.units)),
    );
    expect(barValues()).toEqual(["22’400", "10’300", "5’800"]);
  });

  it("scopes the bar tile with the derived total and its revenue", () => {
    renderSections();

    const subtitle = slot("card-subtitle", cards()[0]!)!;
    expect(subtitle).toHaveTextContent(
      `${formatNumber(kitUnitsTotal(SEASON))} shirts · ${formatMoneyMillions(
        kitRevenueTotal(SEASON),
      )}`,
    );
    expect(subtitle.textContent).toBe("38’500 shirts · CHF 3.81M");
  });

  it("centres the donut on 3'080 badged shirts, about 8% of units", () => {
    renderSections();

    expect(donutCentre()).toBe(formatNumber(SEASON.badgeTotal));
    expect(donutCentre()).toBe("3’080");
    expect(slot("donut-centre-label", section())).toHaveTextContent("shirts");
    expect(slot("card-subtitle", cards()[1]!)!.textContent).toBe(
      "3’080 shirts · ~8% of units",
    );
  });

  it("splits the ring Bitpanda 44, Sunrise 24, Allianz 20, IWB 12", () => {
    renderSections();

    const legend = slots("donut-legend-row", section());
    expect(
      legend.map((row) => slot("donut-legend-name", row)!.textContent),
    ).toEqual(PRIMARY.badgeSplit.map((share) => share.sponsor));
    expect(
      legend.map((row) => slot("donut-legend-share", row)!.textContent),
    ).toEqual(PRIMARY.badgeSplit.map((share) => `${share.percent}%`));
    expect(
      legend.map((row) => slot("donut-legend-name", row)!.textContent),
    ).toEqual(["Bitpanda", "Sunrise", "Allianz", "IWB"]);
  });

  it("ranks the printed names Shaqiri, Sow, Metinho, Custom, Daniliuc", () => {
    renderSections();

    expect(nameRows()).toEqual(
      SEASON.printedNames.map((printed) => [
        printed.name,
        formatNumber(printed.units),
      ]),
    );
    expect(nameRows()).toEqual([
      ["Shaqiri", "3’180"],
      ["Sow", "1’240"],
      ["Metinho", "1’080"],
      ["Custom", "920"],
      ["Daniliuc", "760"],
    ]);
  });

  it("shows the squad names as PRINT COUNTS and nothing else", () => {
    // Merchandising data. No performance figure, no rating, no salary may
    // appear anywhere in the section.
    renderSections();

    expect(section().textContent).not.toMatch(
      /goal|assist|minutes|rating|salary|wage|appearance/i,
    );
    for (const [, value] of nameRows()) {
      expect(value).toMatch(/^[\d’]+$/);
    }
  });

  it("marks every tile as newly inserted, staggered as one cascade", () => {
    renderSections();

    const delays = cards().map((card) => card.style.animationDelay);
    expect(delays).toEqual(["", "90ms", "180ms"]);
  });

  it("adds the follow-up beat to the same section, never a second one", () => {
    renderSections(
      withFollowUpShown(withHeroShown([], HeroId.HERO_1), HeroId.HERO_1),
    );

    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
    // Three primary tiles plus the beat's one driver tile. The divider and the
    // recommendation panel are NOT cards; US-035's suite asserts them.
    expect(cards()).toHaveLength(4);
    expect(cards()[3]!.style.animationDelay).toBe("360ms");
  });
});

/* ============================================ ④ ONE FILTER, THREE TILES = */

describe("Hero 1 — ONE filter drives all three tiles (criterion 5)", () => {
  it("puts exactly one period control in the section, in its head", () => {
    renderSections();

    const controls = slots("segmented", section());
    expect(controls).toHaveLength(1);
    expect(slot("section-head", section())!).toContainElement(controls[0]!);
    // No tile owns a filter of its own — that is what would let two tiles
    // disagree about which period they show.
    for (const card of cards()) {
      expect(slot("card-action", card)).toBeNull();
    }
  });

  it("offers the four periods the dataset names, in its wording", () => {
    renderSections();

    expect(
      slots("segmented-option", section()).map((one) => one.textContent),
    ).toEqual(PRIMARY.periods.map((period) => t(period.labelKey)));
    expect(
      slots("segmented-option", section()).map((one) => one.textContent),
    ).toEqual([
      "Season to date",
      "Last 3 months",
      "Last month",
      "Current month",
    ]);
  });

  it("opens on season to date, the scope the criteria pin", () => {
    renderSections();

    expect(HERO_1_PERIOD).toBe(PeriodKey.SEASON_TO_DATE);
    expect(periodOption(t(SEASON.labelKey))).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("names the control for what it drives", () => {
    renderSections();

    expect(
      within(section()).getByRole("radiogroup", {
        name: t(HERO_1_PERIOD_LABEL_KEY),
      }),
    ).toBe(slot("segmented", section()));
  });

  it("moves the bars, the ring AND the names on a single press", () => {
    const { frames } = renderSections();

    expect(barValues()).toEqual(
      SEASON.kits.map((kit) => formatNumber(kit.units)),
    );
    expect(donutCentre()).toBe(formatNumber(SEASON.badgeTotal));
    expect(nameRows().map(([, value]) => value)).toEqual(
      SEASON.printedNames.map((printed) => formatNumber(printed.units)),
    );

    pressPeriod(frames, t(LAST_3_MONTHS.labelKey));

    // ONE press, three tiles — none of them left on the old period.
    expect(barValues()).toEqual(
      LAST_3_MONTHS.kits.map((kit) => formatNumber(kit.units)),
    );
    expect(donutCentre()).toBe(formatNumber(LAST_3_MONTHS.badgeTotal));
    expect(nameRows().map(([, value]) => value)).toEqual(
      LAST_3_MONTHS.printedNames.map((printed) => formatNumber(printed.units)),
    );
  });

  it("moves the scope lines and the tile title with the figures", () => {
    const { frames } = renderSections();

    pressPeriod(frames, t(LAST_3_MONTHS.labelKey));

    expect(cards()[0]!.querySelector("h3")).toHaveTextContent(
      `${t(HERO_1_TILE_TITLE_KEY.kits)} (${t(PERIOD_INLINE_LABEL_KEY[LAST_3_MONTHS.key])})`,
    );
    expect(slot("card-subtitle", cards()[0]!)!.textContent).toBe(
      `${formatNumber(kitUnitsTotal(LAST_3_MONTHS))} shirts · ${formatMoneyMillions(
        kitRevenueTotal(LAST_3_MONTHS),
      )}`,
    );
    expect(slot("card-subtitle", cards()[1]!)!.textContent).toBe(
      `${formatNumber(LAST_3_MONTHS.badgeTotal)} shirts · ~${formatSharePercent(
        badgeShare(LAST_3_MONTHS),
      )} of units`,
    );
  });

  it("keeps the highlight and the tiles on the same period", () => {
    const { frames } = renderSections();

    pressPeriod(frames, t(LAST_3_MONTHS.labelKey));

    expect(periodOption(t(LAST_3_MONTHS.labelKey))).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(periodOption(t(SEASON.labelKey))).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("renders every period the dataset carries, not just the pinned one", () => {
    const { frames } = renderSections();

    for (const period of PRIMARY.periods) {
      pressPeriod(frames, t(period.labelKey));

      expect(barValues()).toEqual(
        period.kits.map((kit) => formatNumber(kit.units)),
      );
      expect(donutCentre()).toBe(formatNumber(period.badgeTotal));
    }
  });
});

/* ============================================ ⑤ BADGE SEGMENTS ADD UP === */

describe("Hero 1 — the badge segments sum EXACTLY to the centre figure", () => {
  it("holds for all four periods, on screen", () => {
    const { frames } = renderSections();

    for (const period of PRIMARY.periods) {
      pressPeriod(frames, t(period.labelKey));

      const shown = legendValues().map((text) =>
        Number(text.replace(/\D/g, "")),
      );
      expect(shown).toHaveLength(PRIMARY.badgeSplit.length);
      expect(shown.reduce((total, value) => total + value, 0)).toBe(
        period.badgeTotal,
      );
      expect(donutCentre()).toBe(formatNumber(period.badgeTotal));
    }
  });

  it("derives them per period rather than storing four splits", () => {
    // The split is ONE fixed set of percentages; the absolute segments come
    // from `badgeSegments`, rounding correction included.
    for (const period of PRIMARY.periods) {
      const segments = badgeSegments(period.badgeTotal, PRIMARY.badgeSplit);
      expect(segments.reduce((total, one) => total + one.value, 0)).toBe(
        period.badgeTotal,
      );
    }
    expect(
      PRIMARY.badgeSplit.reduce((total, share) => total + share.percent, 0),
    ).toBe(100);
  });

  it("does the arithmetic in derive.ts, never in the hero", () => {
    expect(code("app/components/heroes/hero-1.tsx")).not.toContain(
      "badgeSegments",
    );
    expect(code("app/components/charts/donut.tsx")).toContain("badgeSegments(");
  });
});

/* ============================================ ⑥ DERIVED, NOT STORED ===== */

describe("Hero 1 — kit revenue and the home share are derived", () => {
  it("prices revenue off the units, at CHF 99 a shirt", () => {
    expect(kitRevenueTotal(SEASON)).toBe(
      kitUnitsTotal(SEASON) * SHIRT_PRICE_CHF,
    );
    for (const kit of kitRevenueRows(SEASON)) {
      expect(kit.revenue).toBe(kitRevenue(kit.units));
    }
  });

  it("stores no revenue, total, share or segment on the dataset", () => {
    // The fixture holds MEASUREMENTS only. A stored 58 or a stored 3.81M can
    // outlive an edit to the units beneath it, so neither exists to read.
    for (const period of PRIMARY.periods) {
      expect(Object.keys(period).sort()).toEqual([
        "badgeTotal",
        "key",
        "kits",
        "labelKey",
        "printedNames",
      ]);
      for (const kit of period.kits) {
        expect(Object.keys(kit).sort()).toEqual([
          "labelKey",
          "units",
          "variant",
        ]);
      }
    }
    expect(Object.keys(PRIMARY).sort()).toEqual([
      "badgeSplit",
      "narrativeKey",
      "periods",
      "scopeLabelKey",
    ]);
  });

  it("derives the Home share from the same units the bars plot", () => {
    expect(homeKitShare(SEASON)).toBeCloseTo(22_400 / 38_500, 6);
    expect(kitUnitsShare(SEASON, KitVariant.HOME)).toBe(homeKitShare(SEASON));
    expect(formatSharePercent(homeKitShare(SEASON))).toBe("58%");
  });

  it("contains no displayed figure as a numeric literal, however spelt", () => {
    expect(DISPLAYED_FIGURES.length).toBeGreaterThanOrEqual(20);
    expect(DISPLAYED_FIGURES).toContain(22_400);
    expect(DISPLAYED_FIGURES).toContain(3_080);
    expect(DISPLAYED_FIGURES).toContain(3_811_500);

    for (const figure of DISPLAYED_FIGURES) {
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

  it("pre-formats no money, percentage or unit string", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/CHF\s*\d/);
      expect(source.code).not.toMatch(/\d\s*%/);
      expect(source.code).not.toMatch(/\d[’,]\d/);
    }
  });
});

/* ============================================ ⑦ HOVER, AND COUNT-UP ===== */

describe("Hero 1 — a bar's hover reads units, share and revenue", () => {
  function hoverKit(label: string): HTMLElement {
    const column = slots("v-bar-column", section()).find(
      (node) => node.getAttribute("data-name") === label,
    )!;
    fireEvent.mouseEnter(column);
    return slot("v-bars-tooltip", section())!;
  }

  it("shows all three readings for the Home kit", () => {
    renderSections();

    const tooltip = hoverKit("Home");
    const home = kitRevenueRows(SEASON)[0]!;

    expect(slot("kit-tooltip-name", tooltip)).toHaveTextContent(
      t(home.labelKey),
    );
    expect(slot("kit-tooltip-units", tooltip)!.textContent).toBe(
      `${formatNumber(home.units)} shirts`,
    );
    expect(slot("kit-tooltip-share", tooltip)!.textContent).toBe(
      `${formatSharePercent(
        kitUnitsShare(SEASON, home.variant),
      )} of shirt sales`,
    );
    expect(slot("kit-tooltip-revenue", tooltip)!.textContent).toBe(
      formatMoney(home.revenue),
    );
    expect(tooltip.textContent).toContain("58% of shirt sales");
  });

  it("reads each kit's own figures, not the leader's", () => {
    renderSections();

    for (const kit of kitRevenueRows(SEASON)) {
      const tooltip = hoverKit(t(kit.labelKey));
      expect(tooltip.textContent).toContain(formatNumber(kit.units));
      expect(tooltip.textContent).toContain(formatMoney(kit.revenue));
      expect(tooltip.textContent).toContain(
        formatSharePercent(kitUnitsShare(SEASON, kit.variant)),
      );
    }
  });

  it("announces the reading, since the plot itself is decorative", () => {
    renderSections();

    expect(hoverKit("Away")).toHaveAttribute("role", "status");
  });

  it("counts up from the figure ON SCREEN rather than snapping to zero", () => {
    const { frames } = renderSections();

    // The bar element must SURVIVE the press, or the transition restarts from
    // the baseline — that is what keying by category buys.
    const homeBar = slots("v-bar-column", section()).find(
      (node) => node.getAttribute("data-name") === "Home",
    )!;

    fireEvent.click(periodOption(t(LAST_3_MONTHS.labelKey)));
    frames.advance();
    frames.advance();

    const midFlight = slots("v-bar-value", section())[0]!.textContent!;
    expect(midFlight).not.toBe("0");
    expect(midFlight).not.toBe(formatNumber(LAST_3_MONTHS.kits[0]!.units));

    settle(frames);

    expect(
      slots("v-bar-column", section()).find(
        (node) => node.getAttribute("data-name") === "Home",
      ),
    ).toBe(homeBar);
    expect(barValues()[0]).toBe(formatNumber(LAST_3_MONTHS.kits[0]!.units));
  });
});

/* ============================================ ⑧ REDUCED MOTION ========== */

describe("Hero 1 — reduced motion renders the final state", () => {
  it("shows every figure at its target with no frame run", () => {
    stubMatchMedia(true);
    renderSections(undefined, { settled: false });

    expect(barValues()).toEqual(
      SEASON.kits.map((kit) => formatNumber(kit.units)),
    );
    expect(donutCentre()).toBe(formatNumber(SEASON.badgeTotal));
    expect(nameRows().map(([, value]) => value)).toEqual(
      SEASON.printedNames.map((printed) => formatNumber(printed.units)),
    );
  });

  it("leaves no bar, arc or row stranded at zero", () => {
    stubMatchMedia(true);
    renderSections(undefined, { settled: false });

    for (const bar of slots("v-bar", section())) {
      expect(Number(bar.getAttribute("height"))).toBeGreaterThan(0);
    }
    for (const arc of slots("donut-arc", section())) {
      expect(arc.getAttribute("stroke-dasharray")).not.toMatch(/^0 /);
    }
    for (const fill of slots("h-bar-fill", section())) {
      expect(fill.style.width).not.toBe("0%");
    }
  });

  it("still moves all three tiles on a filter press", () => {
    stubMatchMedia(true);
    const { frames } = renderSections(undefined, { settled: false });

    pressPeriod(frames, t(LAST_3_MONTHS.labelKey));

    expect(barValues()).toEqual(
      LAST_3_MONTHS.kits.map((kit) => formatNumber(kit.units)),
    );
    expect(donutCentre()).toBe(formatNumber(LAST_3_MONTHS.badgeTotal));
  });
});

/* ============================================ ⑨ RE-ASKING REFRESHES ===== */

describe("Hero 1 — asking twice refreshes in place", () => {
  it("renders ONE section with three tiles, not two sections", () => {
    const asked = withHeroShown(
      withHeroShown([], HeroId.HERO_1),
      HeroId.HERO_1,
    );

    renderSections(asked);

    expect(slots("insight-section")).toHaveLength(1);
    expect(cards()).toHaveLength(3);
    expect(barValues()).toEqual(
      SEASON.kits.map((kit) => formatNumber(kit.units)),
    );
  });

  it("re-opens on the pinned period, because the refresh remounts it", () => {
    const { frames, rerender } = renderSections();
    pressPeriod(frames, t(LAST_3_MONTHS.labelKey));
    expect(donutCentre()).toBe(formatNumber(LAST_3_MONTHS.badgeTotal));

    rerender(
      <InsightSections
        sections={withHeroShown(
          withHeroShown([], HeroId.HERO_1),
          HeroId.HERO_1,
        )}
        heroes={HEROES}
        focus={null}
      />,
    );
    settle(frames);

    expect(slots("insight-section")).toHaveLength(1);
    expect(periodOption(t(SEASON.labelKey))).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(donutCentre()).toBe(formatNumber(SEASON.badgeTotal));
  });
});

/* ============================================ ⑨a DEGRADES SAFELY ======== */

describe("Hero 1 — a dataset that cannot answer degrades rather than lying", () => {
  it("falls back to the first period when the pinned one is absent", () => {
    // The dataset and `HERO_1_PERIOD` drifting apart must not leave the
    // section with a hole in it — and the CONTROL follows the tiles, so the
    // highlight can never lead them.
    stubMatchMedia(true);
    const narrowed = PRIMARY.periods.filter(
      (period) => period.key !== HERO_1_PERIOD,
    );
    render(
      <Hero1Body
        primary={{ ...PRIMARY, periods: narrowed }}
        followUp={FOLLOW_UP}
        phase={InsightPhase.PRIMARY}
      />,
    );

    expect(slot("donut-centre-value")).toHaveTextContent(
      formatNumber(narrowed[0]!.badgeTotal),
    );
    expect(
      slots("segmented-option").find(
        (option) => option.textContent === t(narrowed[0]!.labelKey),
      ),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("renders nothing at all when there is no period to show", () => {
    const { container } = render(
      <Hero1Body
        primary={{ ...PRIMARY, periods: [] }}
        followUp={FOLLOW_UP}
        phase={InsightPhase.PRIMARY}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

/* ============================================ ⑨b ON THE REAL DASHBOARD == */

describe("Hero 1 — asked for real, from the chip row", () => {
  function renderApp() {
    const mounted = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App loaderData={HEROES} />}>
            <Route index element={<p>baseline</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    signIn();
    return mounted;
  }

  async function tapHeroChip(user: UserEvent) {
    await user.click(
      screen.getAllByRole("button", {
        name: t(HERO_CHIP_LABEL_KEY[HeroId.HERO_1]),
      })[0]!,
    );
    await settleThinkingBeat();
  }

  it("inserts the section with its narrative and its three tiles", async () => {
    const user = userEvent.setup();
    renderApp();

    await tapHeroChip(user);

    expect(section()).toHaveAttribute("data-hero-id", HeroId.HERO_1);
    expect(slot("section-narrative", section())!.textContent).toBe(
      t(PRIMARY.narrativeKey),
    );
    expect(cards()).toHaveLength(3);
    // The baseline is still there: the dashboard GREW, it did not clear.
    expect(screen.getByText("baseline")).toBeInTheDocument();
  });

  it("refreshes in place when it is asked a second time", async () => {
    const user = userEvent.setup();
    renderApp();

    await tapHeroChip(user);
    await tapHeroChip(user);

    expect(slots("insight-section")).toHaveLength(1);
    expect(cards()).toHaveLength(3);
    expect(
      cards().map((card) => card.querySelector("h3")!.textContent),
    ).toEqual([
      `${t(HERO_1_TILE_TITLE_KEY.kits)} (${t(PERIOD_INLINE_LABEL_KEY[SEASON.key])})`,
      t(HERO_1_TILE_TITLE_KEY.badges),
      t(HERO_1_TILE_TITLE_KEY.names),
    ]);
  });
});

/* ============================================ ⑩ DISCIPLINE ============== */

describe("Hero 1 — composition, not invention", () => {
  it("builds no chart of its own", () => {
    // Every visual is a Phase 2b component; this file contributes layout, copy
    // and ONE piece of period state.
    expect(HERO_1_SOURCE).not.toMatch(/<svg|<circle|<rect|viewBox/);
    expect(HERO_1_SOURCE).toMatch(/VBarTile|DonutTile|HBarTile/);
  });

  it("uses tokens only — no hex, no rgba, no arbitrary value", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source.code).not.toMatch(/rgba?\(/);
      expect(source.code).not.toMatch(
        /(?:text|bg|rounded|shadow|border|from|to)-\[/,
      );
    }
  });

  it("writes no em or en dash into any string it renders", () => {
    // Prose in the doc comments uses them; nothing the room SEES may.
    expect(code("app/components/heroes/hero-1.tsx")).not.toMatch(/[–—]/);
    renderSections();
    expect(section().textContent).not.toMatch(/[–—]/);
  });

  it("holds no timer, makes no request and never injects raw HTML", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/setTimeout|setInterval/);
      expect(source.code).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|axios/);
      expect(source.code).not.toMatch(/dangerouslySetInnerHTML/);
    }
  });

  it("persists nothing — the session lives in React and nowhere else", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(
        /localStorage|sessionStorage|indexedDB|document\.cookie/,
      );
    }
  });

  it("loads the hero datasets in the root loader, from the repository", async () => {
    await expect(rootLoader()).resolves.toEqual(HEROES);
  });

  it("keeps the fixtures out of the client: the loader reads the repository", () => {
    expect(code("app/root.tsx")).toMatch(
      /from "\.\/lib\/repositories\/index\.server"/,
    );
    for (const path of [
      "app/components/heroes/hero-1.tsx",
      "app/components/heroes/insight-sections.tsx",
    ]) {
      expect(code(path)).not.toMatch(/index\.server|lib\/mock/);
    }
  });
});
