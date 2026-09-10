/**
 * US-039 — Hero 3's follow-up: "why is Marketing over budget and behind
 * target?" **THE CAUSAL PEAK**, and the last story of Phase 3b.
 *
 * THE THREE ACCEPTANCE CRITERIA, in order:
 *   1. the chip label is US-029's and the triggers are US-030's — both reused,
 *      neither restated (asserted here by NOT being reimplemented);
 *   2. a driver tile "What's driving Marketing" showing the overspend split
 *      (match activations ~CHF 240k over; paid social) AND the outcome gap
 *      (webshop conversion 2.2% against a 2.6% plan), plus a recommendation
 *      panel that is visually and STRUCTURALLY distinct from the data tiles;
 *   3. the narrative is VERBATIM.
 *
 * ── WHY THIS FILE IS THE ONE THAT MATTERS ───────────────────────────────────
 * Per the brief, this is the beat the owner is expected to lean forward on: the
 * moment the dashboard stops reporting and starts explaining. Four of the
 * assertions below are load-bearing for the demo rather than for the markup:
 *
 *   - **THE DRIVERS EXPLAIN THE WHOLE OVERSPEND.** 240 + 150 + 20 = 410, and
 *     410 IS the variance `derive.ts` computes for the department the table
 *     above flags. The badge is summed from the rows on screen, so the beat
 *     cannot claim to explain more or less of the overspend than it shows.
 *   - **THE AGENCY RETAINER RENDERS ANYWAY.** The narrative names two areas and
 *     not the retainer; the retainer is what makes the arithmetic close. Both
 *     are correct at once ("concentrated in two areas" — 390 of the 410), so
 *     the row must be on screen and absent from the sentence.
 *   - **BOTH HALVES OF THE STORY.** Marketing overspent AND underdelivered. The
 *     conversion pair is asserted on the tile, not only in the prose.
 *   - **THE RECOMMENDATION IS NOT A METRIC.** An `aside`, a complementary
 *     region, an accent down its side, no card chrome, not counted among the
 *     tiles — advice, at the one moment advice is the product.
 *
 * The techniques carry over from US-034 / US-035 / US-036 / US-037 / US-038:
 *
 *   - **Verbatim** at the BYTE level: UTF-8 hex against a retyped literal, its
 *     exact length (468), an ASCII-range sweep, every hyphen pinned to `0x2d`,
 *     the apostrophe in "Marketing's" pinned to `0x27`, and a match against the
 *     sentence in the backlog itself — so the two copies in this repository
 *     cannot drift together.
 *   - **No figure re-typed**, by SCANNING the sources: every figure the beat can
 *     display, in every spelling, absent from the component and loader code.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  H_BAR_VALUE_WIDTH_PX,
  hBarMax,
  hBarPercent,
} from "../../app/components/charts/h-bars";
import { FOLLOW_UP_CHIP_HINT } from "../../app/components/chrome/suggestion-chips";
import {
  HERO_3_FOLLOW_UP_TITLE,
  HERO_3_TILE_TITLES,
} from "../../app/components/heroes/hero-3";
import {
  FOLLOW_UP_DIVIDER_LABEL,
  tileDelayMs,
} from "../../app/components/heroes/hero-section";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import {
  DRIVER_TOTAL_LABEL,
  driverTotal as driverTotalOnScreen,
} from "../../app/components/tiles/driver-tile";
import { RECOMMENDATION_LABEL } from "../../app/components/tiles/recommendation-panel";
import {
  FOLLOW_UP_CHIP_LABEL,
  HERO_CHIP_LABEL,
} from "../../app/lib/dashboard/chips";
import {
  InsightPhase,
  type InsightSections as SectionList,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import {
  chfFromThousands,
  formatMoneyCompact,
  formatPercent,
  formatSignedMoneyCompact,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import {
  conversionShortfall,
  departmentsNeedingAttention,
  departmentVariance,
  driverTotal,
} from "../../app/lib/repositories/derive";
import {
  HERO_IDS,
  HeroId,
  VarianceDirection,
  VarianceJudgement,
} from "../../app/lib/repositories/enums";
import App from "../../app/root";
import { HEROES } from "./support/hero-data";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
  type FrameStub,
} from "./support/motion-harness";
import { settleThinkingBeat } from "./support/thinking-harness";

/* ----------------------------------------------------------------- DATA -- */

const PRIMARY = HEROES.hero3.primary;
const FOLLOW_UP = HEROES.hero3.followUp;
const DEPARTMENTS = PRIMARY.departments;
const DRIVERS = FOLLOW_UP.drivers;
const CONVERSION = FOLLOW_UP.conversion;

/**
 * The department the beat is ABOUT, derived exactly as the table above derives
 * its flag: the one both over budget and behind target. Never looked up by
 * name, here or in the component.
 */
const FLAGGED = departmentsNeedingAttention(DEPARTMENTS)[0]!;

/** `CHF 240k` — the beat's bar labels, spelled by the app's own formatter. */
function money(thousands: number): string {
  return formatMoneyCompact(chfFromThousands(thousands));
}

/** `+CHF 410k` — the beat's TOTAL, which is a variance and so carries its sign. */
function signedMoney(thousands: number): string {
  return formatSignedMoneyCompact(chfFromThousands(thousands));
}

/* --------------------------------------------------------------- SOURCE -- */

/**
 * Every source file between the dataset and the screen. The scans below cover
 * all of them, so a figure or a sentence cannot be re-typed one layer up.
 */
const SCANNED_SOURCES = [
  "app/components/heroes/hero-3.tsx",
  "app/components/heroes/hero-section.tsx",
  "app/components/heroes/insight-sections.tsx",
  "app/components/tiles/driver-tile.tsx",
  "app/components/tiles/recommendation-panel.tsx",
  "app/lib/dashboard/heroes.ts",
] as const;

/** Comments explain the figures; only executable code may not restate them. */
function code(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

const SOURCES = SCANNED_SOURCES.map((path) => ({ path, code: code(path) }));

const HERO_3_CODE = code("app/components/heroes/hero-3.tsx");

/**
 * The acceptance criteria as written, whitespace-collapsed.
 *
 * The verbatim narrative is checked against THIS as well as against a literal
 * below, so the two copies in the repository cannot drift together: the backlog
 * is the document the client signed off, and it wraps the sentence across six
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
 * Below this, a figure is scanned for only in its FORMATTED spelling: the
 * agency retainer's bare `20` collides with a Tailwind spacing suffix and an
 * icon size, so scanning for it would be noise rather than a guard. The 240,
 * the 150 and the derived 410 are above it and are scanned both ways.
 */
const FIGURE_FLOOR = 100;

/* ------------------------------------------------------------- HARNESS -- */

function slot(name: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, root: ParentNode = document): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
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

function divider(): HTMLElement | null {
  return slot("follow-up-divider", section());
}

function panel(): HTMLElement | null {
  return slot("recommendation-panel", section());
}

/** The beat's card — the driver tile, the third tile of this section. */
function driverTile(): HTMLElement {
  const tile = cards().find(
    (card) => card.querySelector("h3")?.textContent === HERO_3_FOLLOW_UP_TITLE,
  );
  if (!tile) throw new Error("the Marketing driver tile is not on screen");
  return tile;
}

function driverRows(): HTMLElement[] {
  return slots("h-bar-row", driverTile());
}

/** The rendered rows as `[label, value]` pairs, top to bottom. */
function driverValues(): [string, string][] {
  return driverRows().map((row) => [
    slot("h-bar-label", row)!.textContent!,
    slot("h-bar-value", row)!.textContent!,
  ]);
}

/** The chip in the card's action slot, whatever it turns out to be. */
function totalBadge(): HTMLElement | null {
  const action = slot("card-action", driverTile());
  return action ? slot("delta-chip", action) : null;
}

function note(): HTMLElement | null {
  return slot("driver-note", driverTile());
}

function conversionFigures(): HTMLElement | null {
  return slot("conversion-gap", driverTile());
}

function narrativeBody(): HTMLElement {
  return slot("recommendation-body", panel()!)!;
}

/** Runs every count-up and growth transition to completion. */
function settle(frames: FrameStub): void {
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
}

/** The section list with Hero 3 answered AND its follow-up shown. */
const SHARPENED: SectionList = withFollowUpShown(
  withHeroShown([], HeroId.HERO_3),
  HeroId.HERO_3,
);

function renderSections(
  sections: SectionList = SHARPENED,
  { settled = true }: { settled?: boolean } = {},
) {
  const frames = stubFrames();
  const result = render(
    <InsightSections sections={sections} heroes={HEROES} focus={null} />,
  );
  if (settled) settle(frames);
  return { ...result, frames };
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ============================================ ① THE PHASE FLIPS ========= */

describe("Hero 3 follow-up — the section GROWS, it does not multiply", () => {
  it("renders ONE section, not two", () => {
    renderSections();

    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute("data-hero-id", HeroId.HERO_3);
    expect(section()).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
  });

  it("keeps both primary tiles and adds ONE more", () => {
    renderSections();

    expect(cardTitles()).toEqual([
      HERO_3_TILE_TITLES.table,
      HERO_3_TILE_TITLES.overall,
      HERO_3_FOLLOW_UP_TITLE,
    ]);
  });

  it("leaves the table and the overall tile untouched under the beat", () => {
    renderSections();

    // The figures the beat explains are still the figures it explains.
    expect(slots("department-row", section())).toHaveLength(DEPARTMENTS.length);
    expect(slot("department-total-row", section())).not.toBeNull();
    expect(slot("kpi-value", cards()[1]!)!.textContent).toBe("CHF 69.68M");
    // Including the row this beat interrogates, still flagged by the data.
    expect(
      slots("department-row", section()).filter(
        (row) => row.dataset.flagged === "true",
      ),
    ).toHaveLength(1);
  });

  it("is the SAME section the primary answer rendered — one h2, one head", () => {
    renderSections();

    expect(
      within(section()).getAllByRole("heading", { level: 2 }),
    ).toHaveLength(1);
    expect(slots("section-head", section())).toHaveLength(1);
    expect(
      within(section()).getByRole("heading", { level: 2 }),
    ).toHaveTextContent(HERO_CHIP_LABEL[HeroId.HERO_3]);
  });

  it("shows nothing of the beat while the phase is still PRIMARY", () => {
    renderSections(withHeroShown([], HeroId.HERO_3));

    expect(divider()).toBeNull();
    expect(panel()).toBeNull();
    expect(cards()).toHaveLength(2);
    expect(section().textContent).not.toContain(HERO_3_FOLLOW_UP_TITLE);
  });

  it("continues the section's ONE cascade rather than starting a second", () => {
    renderSections();

    expect(divider()!.style.animationDelay).toBe(`${tileDelayMs(2)}ms`);
    expect(driverTile().style.animationDelay).toBe(`${tileDelayMs(3)}ms`);
    expect(panel()!.style.animationDelay).toBe(`${tileDelayMs(4)}ms`);
  });

  it("shows no placeholder — the LAST stand-in in the product is gone", () => {
    renderSections();

    expect(section().textContent).not.toMatch(/placeholder/i);
    expect(slot("placeholder-follow-up-body", section())).toBeNull();
    for (const source of SOURCES) {
      expect(source.code).not.toContain("PlaceholderFollowUp");
      expect(source.code).not.toContain("PLACEHOLDER_FOLLOW_UP_BODY");
    }
  });
});

/* ============================================ ② THE GOLD SEAM =========== */

describe("Hero 3 follow-up — the beat opens on the SHARED divider", () => {
  it("renders one gold 'Follow-up' seam, from the frame", () => {
    renderSections();

    expect(slots("follow-up-divider", section())).toHaveLength(1);
    expect(slot("follow-up-divider-label", divider()!)).toHaveTextContent(
      FOLLOW_UP_DIVIDER_LABEL,
    );
    expect(slot("follow-up-divider-rule", divider()!)!.className).toContain(
      "bg-gold",
    );
  });

  it("SEPARATES: both primary tiles before it, the beat after", () => {
    renderSections();

    const rule = divider()!;
    for (const node of cards().slice(0, 2)) {
      expect(
        rule.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING,
      ).toBeTruthy();
    }
    for (const node of [driverTile(), panel()!]) {
      expect(
        rule.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("builds no third divider — it imports US-035's", () => {
    expect(HERO_3_CODE).toContain("<FollowUpDivider");
    expect(HERO_3_CODE).not.toContain("Follow-up");
    expect(code("app/components/heroes/hero-section.tsx")).toContain(
      "export function FollowUpDivider",
    );
  });

  it("spends gold on the seam and the ADVICE, never on the chart", () => {
    renderSections();

    // A chart inside the beat is still a chart (`app/lib/tokens.ts`, rule 4);
    // the advice is the second half of the follow-up treatment, so it IS gold.
    expect(slot("card-accent", driverTile())?.className ?? "").not.toContain(
      "bg-gold",
    );
    expect(slot("recommendation-accent", panel()!)!.className).toContain(
      "bg-gold",
    );
    // EVERY gold-filled node in the section belongs to the seam or to the
    // advice — the two halves of the follow-up treatment — and none of them is
    // in a tile: the seam's rule, the panel's tint and the panel's accent.
    const gold = [...section().querySelectorAll('[class*="bg-gold"]')];
    expect(gold).toHaveLength(3);
    for (const node of gold) {
      expect(divider()!.contains(node) || panel()!.contains(node)).toBe(true);
    }
    for (const card of cards()) {
      expect([...card.querySelectorAll('[class*="bg-gold"]')]).toHaveLength(0);
    }
  });
});

/* ============================================ ③ THE OVERSPEND SPLIT ===== */

describe("Hero 3 follow-up — what is driving Marketing (criterion 2)", () => {
  it("titles the tile exactly as the criteria pin it", () => {
    renderSections();

    expect(driverTile().querySelector("h3")).toHaveTextContent(
      HERO_3_FOLLOW_UP_TITLE,
    );
    expect(HERO_3_FOLLOW_UP_TITLE).toBe("What's driving Marketing");
    expect(slot("card-subtitle", driverTile())!.textContent).toContain(
      "biggest first",
    );
  });

  it("names the department the TABLE flags, not a department of its own", () => {
    renderSections();

    // The title names Marketing because the question does; the department it
    // names is the one `departmentsNeedingAttention` picks from the figures.
    expect(
      FLAGGED.name.startsWith(HERO_3_FOLLOW_UP_TITLE.split(" ").pop()!),
    ).toBe(true);
    expect(
      departmentsNeedingAttention(DEPARTMENTS).map((one) => one.name),
    ).toEqual([FLAGGED.name]);
  });

  it("renders the three drivers, biggest slice of the overspend first", () => {
    renderSections();

    expect(driverValues()).toEqual([
      ["Match activations", "CHF 240k"],
      ["Paid social", "CHF 150k"],
      ["Agency retainer", "CHF 20k"],
    ]);
  });

  it("reads every figure off the dataset, formatted once", () => {
    renderSections();

    expect(driverValues()).toEqual(
      DRIVERS.map((driver) => [driver.name, money(driver.amount)]),
    );
  });

  it("shows the AGENCY RETAINER even though the narrative omits it", () => {
    renderSections();

    // The sentence says "concentrated in two areas" and names two; the
    // retainer is the third row and is what makes the arithmetic close. Both
    // are true at once, and the row must not be dropped to match the prose.
    const retainer = DRIVERS[2]!;
    expect(FOLLOW_UP.narrative.toLowerCase()).not.toContain("retainer");
    expect(FOLLOW_UP.narrative.toLowerCase()).not.toContain("agency");
    expect(driverValues().map(([name]) => name)).toContain(retainer.name);
    // And the two the prose DOES name are 390 of the 410 — "concentrated".
    expect(DRIVERS[0]!.amount + DRIVERS[1]!.amount).toBe(390);
    expect(driverTotal(DRIVERS)).toBe(410);
  });

  it("renders the paid-social ROW from the money, not from the 18%", () => {
    renderSections();

    // Two different facts about one driver: the sentence quotes the 18% rise,
    // the row quotes the CHF 150k of overspend. The dataset carries only the
    // money (US-011 allowlisted the 18% as narrative-only), so the row must
    // not try to say 18%.
    const paidSocial = driverValues()[1]!;
    expect(paidSocial[1]).toBe(money(DRIVERS[1]!.amount));
    expect(paidSocial[1]).not.toContain("18");
    expect(FOLLOW_UP.narrative).toContain("rose 18%");
    expect(JSON.stringify(DRIVERS)).not.toContain("18");
  });

  it("shows every row as spend, not as a decline", () => {
    renderSections();

    for (const row of driverRows()) {
      expect(row).toHaveAttribute("data-direction", VarianceDirection.UP);
      expect(slot("h-bar-value", row)!.textContent).toMatch(/^CHF /);
    }
  });

  it("scales the bars against the biggest driver", () => {
    renderSections();

    const values = DRIVERS.map((driver) => driver.amount);
    const max = hBarMax(values.map((value) => ({ name: "", value })));

    expect(
      slots("h-bar-fill", driverTile()).map((fill) => fill.style.width),
    ).toEqual(values.map((value) => `${hBarPercent(value, max)}%`));
    expect(slot("h-bar-fill", driverRows()[0]!)!.style.width).toBe("100%");
  });

  it("draws no bar of its own: every row is US-021's shared row", () => {
    renderSections();

    expect(driverRows()).toHaveLength(DRIVERS.length);
    expect(HERO_3_CODE).not.toMatch(/h-bar-|<svg|viewBox/);
  });

  it("keeps every value on ONE line, in the 96px column", () => {
    renderSections();

    for (const row of driverRows()) {
      const value = slot("h-bar-value", row)!;
      const computed = getComputedStyle(value);

      expect(computed.width).toBe(`${H_BAR_VALUE_WIDTH_PX}px`);
      expect(computed.whiteSpace).toBe("nowrap");
      expect(value.childNodes).toHaveLength(1);
      expect(value.className).toContain("tabular-nums");
    }
  });
});

/* ============================ ④ THE TOTAL *IS* MARKETING'S VARIANCE ===== */

describe("Hero 3 follow-up — the drivers explain the WHOLE overspend", () => {
  it("badges `+CHF 410k total` in the card's action slot", () => {
    renderSections();

    const badge = totalBadge()!;
    expect(badge).not.toBeNull();
    expect(slot("card-action", driverTile())).toContainElement(badge);
    expect(badge.textContent).toContain(signedMoney(driverTotal(DRIVERS)));
    expect(badge.textContent).toContain("+CHF 410k");
    expect(slot("delta-suffix", badge)!.textContent).toBe(DRIVER_TOTAL_LABEL);
  });

  /**
   * US-044 measured this on the SERVED page and found it unsigned: the one
   * variance chip on the whole canvas with no sign in front of it.
   *
   * The rows stay unsigned — each is an amount that went somewhere, not a
   * movement — so the badge and the bars are checked against each other here,
   * spelling CHF thousands identically and differing only in the sign.
   */
  it("signs the total even though the movement is a RISE, and leaves the rows unsigned", () => {
    renderSections();

    const badge = totalBadge()!;
    expect(badge.textContent).toMatch(/\+CHF/);
    expect(badge.dataset.direction).toBe(VarianceDirection.UP);
    expect(badge.dataset.judgement).toBe(VarianceJudgement.ADVERSE);

    for (const value of slots("h-bar-value", driverTile())) {
      expect(value.textContent).not.toMatch(/^[+-]/);
      expect(value.textContent).toContain("CHF");
    }
  });

  it("EQUALS the variance the table above derives — 240 + 150 + 20 = 410", () => {
    renderSections();

    // THE SUBSTANCE OF THE BEAT. The breakdown reconciles with the row it
    // explains, so the three drivers account for the whole overspend rather
    // than for an unstated part of it.
    const total = driverTotal(DRIVERS);
    expect(total).toBe(410);
    expect(total).toBe(departmentVariance(FLAGGED));
    expect(total).toBe(FLAGGED.variance);
    expect(DRIVERS.reduce((sum, driver) => sum + driver.amount, 0)).toBe(total);
    // And it is the figure ON SCREEN, in both places at once.
    expect(totalBadge()!.textContent).toContain(money(total));
    expect(
      driverTotalOnScreen(
        DRIVERS.map((driver) => ({ name: driver.name, value: driver.amount })),
      ),
    ).toBe(total);
  });

  it("is SUMMED FROM THE ROWS on screen, not passed in", () => {
    renderSections();

    // The proof it is not a literal: move a driver and the badge follows.
    const edited = DRIVERS.map((driver, index) =>
      index === 0
        ? { name: driver.name, value: 40 }
        : {
            name: driver.name,
            value: driver.amount,
          },
    );

    expect(money(driverTotalOnScreen(edited))).toBe("CHF 210k");
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/showTotal=\{/);
    }
    expect(HERO_3_CODE).toContain("showTotal");
  });

  it("reads the overspend as BAD NEWS, and gets that from the data", () => {
    renderSections();

    // US-022's trap, one level up: a rising total is money earned for a
    // revenue department and an overspend for this cost centre. The badge is
    // told which by `derive.ts`, through the flagged row's own judgement.
    const badge = totalBadge()!;
    expect(badge.dataset.judgement).toBe(VarianceJudgement.ADVERSE);
    expect(FLAGGED.judgement).toBe(VarianceJudgement.ADVERSE);
    expect(badge.dataset.direction).toBe(VarianceDirection.UP);
    // Three carriers, never colour alone: the arrow, the direction word, and
    // the token class.
    expect(badge.textContent).toContain("up");
    // The verdict is nowhere in the component layer.
    expect(HERO_3_CODE).not.toMatch(/FAVOURABLE|ADVERSE/);
  });

  it("flips with the department's TYPE, which is what proves it is derived", () => {
    // Turn the cost centre into a revenue department and the same +410 becomes
    // FAVOURABLE — the badge follows the data, with no component edit.
    const asRevenue = DEPARTMENTS.map((department) =>
      department.name === FLAGGED.name
        ? { ...department, type: "REVENUE" as const }
        : department,
    );

    const flagged = departmentsNeedingAttention(asRevenue)[0]!;
    expect(flagged.name).toBe(FLAGGED.name);
    expect(flagged.judgement).toBe(VarianceJudgement.FAVOURABLE);
  });
});

/* ============================================ ⑤ THE OUTCOME GAP ========= */

describe("Hero 3 follow-up — the conversion gap, on the tile (criterion 2)", () => {
  it("shows webshop conversion 2.2% against a 2.6% plan", () => {
    renderSections();

    const figures = conversionFigures()!;
    expect(figures).not.toBeNull();
    expect(figures.textContent).toBe("webshop conversion 2.2% vs 2.6% plan");
    expect(figures.textContent).toContain(
      formatPercent(CONVERSION.actualPercent),
    );
    expect(figures.textContent).toContain(
      formatPercent(CONVERSION.planPercent),
    );
  });

  it("surfaces BOTH halves of the story in one tile", () => {
    renderSections();

    // Overspent AND underdelivered: the bars are the spend, this is what the
    // spend bought. A tile with only the bars answers half the question.
    const text = driverTile().textContent!;
    expect(text).toContain(money(DRIVERS[0]!.amount));
    expect(text).toContain(formatPercent(CONVERSION.actualPercent));
    expect(text).toContain(formatPercent(CONVERSION.planPercent));
    // The gap is real, and `derive.ts` is what says so.
    expect(CONVERSION.actualPercent).toBeLessThan(CONVERSION.planPercent);
    expect(conversionShortfall(CONVERSION).gapPoints).toBe(-0.4);
    expect(conversionShortfall(CONVERSION).attainmentPercent).toBeLessThan(100);
  });

  it("renders under the bars, inside the same card — not a second tile", () => {
    renderSections();

    const line = note()!;
    expect(line).not.toBeNull();
    expect(
      slot("h-bars", driverTile())!.compareDocumentPosition(line) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(slots("driver-note", section())).toHaveLength(1);
    expect(cards()).toHaveLength(3);
    // A footnote on the data, not US-024's narrative caption strip.
    expect(slot("card-caption", driverTile())).toBeNull();
    expect(line.getAttribute("data-slot")).toBe("driver-note");
  });

  it("states the two percentages ONCE each and rounds neither", () => {
    renderSections();

    const text = conversionFigures()!.textContent!;
    for (const percent of [CONVERSION.actualPercent, CONVERSION.planPercent]) {
      expect(text.split(formatPercent(percent))).toHaveLength(2);
    }
    // The app's one percentage rule, not a hand-built string.
    expect(HERO_3_CODE).toContain("formatPercent");
    expect(HERO_3_CODE).not.toMatch(/toFixed|%`|"%"/);
  });

  it("is worded independently of the verbatim clause", () => {
    // The dataset's sentence makes the same point at length; that copy exists
    // in exactly one place, so this line must not be a second copy of it.
    for (const source of SOURCES) {
      expect(source.code).not.toContain("conversion landed at");
      expect(source.code).not.toContain("underdelivered");
    }
  });
});

/* ======================================= ⑥ THE RECOMMENDATION PANEL ===== */

describe("Hero 3 follow-up — the advice is NOT a data tile (criterion 2)", () => {
  it("is an `aside`, a complementary region with no card chrome", () => {
    renderSections();

    const aside = panel()!;
    expect(aside.tagName).toBe("ASIDE");
    expect(aside).toHaveAttribute("data-variant", "recommendation");
    expect(aside).toHaveAccessibleName(RECOMMENDATION_LABEL);
    // Not counted among the tiles, and it carries no tile heading.
    expect(cards()).not.toContain(aside);
    expect(aside.querySelector("h3")).toBeNull();
    expect(aside.dataset.slot).toBe("recommendation-panel");
    expect(slot("card", aside)).toBeNull();
  });

  it("wears its accent down the SIDE, where a tile wears it across the top", () => {
    renderSections();

    const accent = slot("recommendation-accent", panel()!)!;
    expect(accent.className).toContain("w-[3px]");
    expect(accent.className).not.toContain("h-[3px]");
    expect(accent).toHaveAttribute("aria-hidden", "true");
    expect(panel()!.firstElementChild).toBe(accent);
    // The panel sits ON the canvas: rounder, and it does not float.
    expect(panel()!.className).toContain("rounded-panel");
    expect(panel()!.className).not.toContain("shadow-tile");
  });

  it("is announced as 'Recommendation' — advice, named as advice", () => {
    renderSections();

    expect(slot("recommendation-label", panel()!)).toHaveTextContent(
      RECOMMENDATION_LABEL,
    );
    expect(RECOMMENDATION_LABEL).toBe("Recommendation");
    // The GOLD variant, because this copy ends in an explicit recommendation —
    // unlike Hero 2's beat, which interprets and is navy.
    expect(panel()!.className).toContain("bg-gold/10");
  });

  it("carries the advice, and FOLLOWS the evidence", () => {
    renderSections();

    expect(narrativeBody().textContent).toContain("Recommendation: pause");
    expect(
      driverTile().compareDocumentPosition(panel()!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("builds no panel of its own — it composes US-024's", () => {
    expect(HERO_3_CODE).toContain("<RecommendationPanel");
    expect(HERO_3_CODE).not.toMatch(/<aside|role="complementary"/);
  });
});

/* ============================================ ⑦ VERBATIM NARRATIVE ====== */

/**
 * The narrative EXACTLY as the backlog states it, retyped here so the rendered
 * string is compared against a second, independent copy.
 *
 * Every hazard a text pass could "improve" is in it: the apostrophe in
 * "Marketing's" that a smart-quote pass would turn into U+2019, a spaced hyphen
 * in "underdelivered - conversion" that autocorrect would make an en dash, the
 * hyphenated "paid-social" twice, "matchday" as ONE word, two colons, and four
 * figures at three different precisions.
 */
const AUTHORED =
  "Marketing's overspend is concentrated in two areas: the derby and YB " +
  "match activations ran about CHF 240k over plan combined, and paid-social " +
  "spend rose 18% chasing a webshop conversion target that underdelivered - " +
  "conversion landed at 2.2% against a 2.6% plan. Recommendation: pause the " +
  "incremental paid-social spend and reallocate about CHF 150k to the " +
  "matchday activations that did convert, and revisit the conversion target " +
  "with Webshop before the winter campaign.";

/** UTF-8 bytes, so "byte-identical" is asserted rather than approximated. */
function bytes(value: string): string {
  return Buffer.from(value, "utf8").toString("hex");
}

describe("Hero 3 follow-up — the narrative is the contract (criterion 3)", () => {
  it("renders the dataset's string, byte for byte", () => {
    renderSections();

    const rendered = narrativeBody().textContent!;
    expect(bytes(rendered)).toBe(bytes(AUTHORED));
    expect(bytes(FOLLOW_UP.narrative)).toBe(bytes(AUTHORED));
    expect(rendered).toBe(AUTHORED);
    expect(rendered).toHaveLength(AUTHORED.length);
    expect(rendered).toHaveLength(468);
  });

  it("matches the acceptance criterion in the backlog itself", () => {
    // Two copies inside this repository could drift together; the signed-off
    // document cannot, so the string is checked against it as well.
    expect(BACKLOG).toContain(FOLLOW_UP.narrative);
    expect(BACKLOG).toContain(AUTHORED);
  });

  it("is plain ASCII — no smart quote, no em dash, no minus glyph", () => {
    for (const character of FOLLOW_UP.narrative) {
      expect(character.codePointAt(0)!).toBeLessThan(0x80);
    }
    expect(FOLLOW_UP.narrative).not.toMatch(/[‘’“”–—−]/u);
  });

  it('pins the apostrophe in "Marketing\'s" to an ASCII 0x27', () => {
    const index = FOLLOW_UP.narrative.indexOf("Marketing's");
    expect(index).toBe(0);
    expect(FOLLOW_UP.narrative.codePointAt(index + "Marketing".length)).toBe(
      0x27,
    );
    expect(FOLLOW_UP.narrative.split("'")).toHaveLength(2);
  });

  it("pins every hyphen in the sentence to an ASCII 0x2d", () => {
    const narrative = FOLLOW_UP.narrative;

    // The two compounds and the spaced hyphen before the conversion clause.
    for (const fragment of [
      "paid-social spend rose",
      "underdelivered - conversion",
      "incremental paid-social spend",
    ]) {
      const index = narrative.indexOf(fragment);
      expect(index).toBeGreaterThan(-1);
      expect(narrative.codePointAt(index + fragment.indexOf("-"))).toBe(0x2d);
    }

    // Every "-" in the string, wherever it is, and no more of them than the
    // authored sentence has: two compounds and one spaced hyphen.
    for (const [index, character] of [...narrative].entries()) {
      if (character === "-") expect(narrative.codePointAt(index)).toBe(0x2d);
    }
    expect(narrative.split("-")).toHaveLength(4);
    // "matchday" is ONE word, not a compound — a text pass would hyphenate it.
    expect(narrative).toContain("matchday activations");
    expect(narrative).not.toContain("match-day");
  });

  it("is never assembled, truncated or transformed on the way to the screen", () => {
    renderSections();

    const body = narrativeBody();
    expect(body.textContent).toBe(FOLLOW_UP.narrative);
    expect(body.className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
    expect(body.querySelector("*")).toBeNull();
  });

  it("exists nowhere in the component layer — it is rendered FROM the dataset", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toContain(FOLLOW_UP.narrative);
      for (const fragment of [
        "overspend is concentrated",
        "match activations ran about",
        "chasing a webshop conversion target",
        "pause the incremental",
        "matchday activations that did convert",
        "before the winter campaign",
      ]) {
        expect(source.code).not.toContain(fragment);
      }
    }
  });

  it("quotes the figures the tile actually shows", () => {
    renderSections();

    // The CHF 240k, the CHF 150k and the two conversion percentages in the
    // prose are the figures on the tile, not numbers written into a sentence.
    const [activations, paidSocial] = driverValues();
    expect(FOLLOW_UP.narrative).toContain(`about ${activations![1]} over plan`);
    expect(FOLLOW_UP.narrative).toContain(`about ${paidSocial![1]} to the`);
    expect(FOLLOW_UP.narrative).toContain(
      `landed at ${formatPercent(CONVERSION.actualPercent)} against a ` +
        `${formatPercent(CONVERSION.planPercent)} plan`,
    );
  });
});

/* ============================================ ⑧ DERIVED, NOT RE-TYPED === */

describe("Hero 3 follow-up — every figure comes from the dataset", () => {
  it("stores the drivers and the conversion, and nothing derivable", () => {
    expect(Object.keys(FOLLOW_UP)).toEqual([
      "drivers",
      "conversion",
      "narrative",
    ]);
    expect(DRIVERS.map((driver) => driver.amount)).toEqual([240, 150, 20]);
    expect(CONVERSION).toEqual({ actualPercent: 2.2, planPercent: 2.6 });
    // No stored total and no stored shortfall beside them.
    expect(JSON.stringify(FOLLOW_UP)).not.toContain("410");
    expect(JSON.stringify(FOLLOW_UP.conversion)).not.toContain("0.4");
  });

  it("re-types none of the beat's figures on the way to the screen", () => {
    const figures = [...DRIVERS.map((driver) => driver.amount), 410];

    for (const figure of figures) {
      for (const source of SOURCES) {
        for (const spelling of [money(figure), money(-figure)]) {
          expect(
            source.code,
            `${spelling} appears in ${source.path}`,
          ).not.toContain(spelling);
        }
        // A two-digit figure collides with a Tailwind spacing suffix, so only
        // the formatted spellings above are scanned for it. Bounded on both
        // sides, so a story number like `US-039` is not a false hit.
        if (figure < FIGURE_FLOOR) continue;
        expect(source.code).not.toMatch(
          new RegExp(`(?<![\\d-])${figure}(?!\\d)`),
        );
      }
    }
    expect(figures.some((figure) => figure >= FIGURE_FLOOR)).toBe(true);
  });

  it("re-types neither conversion percentage either", () => {
    for (const source of SOURCES) {
      for (const spelling of ["2.2", "2.6", "2.2%", "2.6%"]) {
        expect(
          source.code,
          `${spelling} appears in ${source.path}`,
        ).not.toContain(spelling);
      }
    }
  });

  it("names no driver in code — the row labels are the dataset's own", () => {
    for (const driver of DRIVERS) {
      for (const source of SOURCES) {
        expect(source.code).not.toContain(driver.name);
      }
    }
  });

  it("formats the money through app/lib/format.ts, not by hand", () => {
    expect(HERO_3_CODE).toContain("format={money}");
    expect(HERO_3_CODE).toContain("formatMoneyCompact");
    expect(HERO_3_CODE).not.toMatch(/1000|1_000|\* 1e3|"CHF|'CHF/);
  });

  it("ranks and sums through US-023 rather than in the hero", () => {
    expect(HERO_3_CODE).toContain("<DriverTile");
    expect(HERO_3_CODE).not.toMatch(/\.sort\(|\.reduce\(|driverTotal/);
  });
});

/* ============================================ ⑨ REDUCED MOTION ========== */

describe("Hero 3 follow-up — reduced motion renders the final state", () => {
  it("shows all three drivers at their target with no frame run", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    expect(driverValues()).toEqual(
      DRIVERS.map((driver) => [driver.name, money(driver.amount)]),
    );
  });

  it("shows the derived badge at its total, not counting up to it", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    expect(totalBadge()!.textContent).toContain(money(driverTotal(DRIVERS)));
  });

  it("leaves no bar in the beat stranded at zero width", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    for (const fill of slots("h-bar-fill", driverTile())) {
      expect(fill.style.width).not.toBe("0%");
    }
  });

  it("still renders the seam, the conversion gap and the advice in full", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    expect(divider()).not.toBeNull();
    expect(conversionFigures()!.textContent).toContain(
      formatPercent(CONVERSION.actualPercent),
    );
    expect(narrativeBody().textContent).toBe(FOLLOW_UP.narrative);
  });
});

/* ============================================ ⑩ ON THE REAL DASHBOARD === */

function renderApp() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<App loaderData={HEROES} />}>
          <Route index element={<p>baseline</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/** US-029's visually-hidden "Follow-up:" hint is part of the chip's name. */
function followUpChipName(heroId: HeroId): string {
  return `${FOLLOW_UP_CHIP_HINT} ${FOLLOW_UP_CHIP_LABEL[heroId]}`;
}

async function tap(user: UserEvent, label: string) {
  await user.click(screen.getAllByRole("button", { name: label })[0]!);
  await settleThinkingBeat();
}

describe("Hero 3 follow-up — asked for real, from the chip row", () => {
  it("flips the section it is already on — ONE section, three tiles", async () => {
    const user = userEvent.setup();
    renderApp();

    await tap(user, HERO_CHIP_LABEL[HeroId.HERO_3]);
    expect(cards()).toHaveLength(2);

    await tap(user, followUpChipName(HeroId.HERO_3));

    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
    expect(cards()).toHaveLength(3);
    expect(divider()).not.toBeNull();
    expect(panel()).not.toBeNull();
    // The dashboard GREW: the baseline is untouched under it.
    expect(screen.getByText("baseline")).toBeInTheDocument();
  });

  it("withdraws the follow-up chip once the beat is on screen", async () => {
    const user = userEvent.setup();
    renderApp();

    const chips = () =>
      screen.queryAllByRole("button", {
        name: followUpChipName(HeroId.HERO_3),
      });

    expect(chips()).toHaveLength(0);
    await tap(user, HERO_CHIP_LABEL[HeroId.HERO_3]);
    expect(chips()).not.toHaveLength(0);

    await tap(user, followUpChipName(HeroId.HERO_3));

    // US-029's derived visibility: a sharpened section offers no follow-up.
    expect(chips()).toHaveLength(0);
    expect(
      screen.queryAllByRole("button", {
        name: HERO_CHIP_LABEL[HeroId.HERO_3],
      }),
    ).not.toHaveLength(0);
  });

  it("restates neither the chip label nor a keyword set of its own", () => {
    // Criterion 1 is satisfied by NOT being reimplemented: the hero renders,
    // it does not decide whether it was asked for.
    expect(FOLLOW_UP_CHIP_LABEL[HeroId.HERO_3]).toBe(
      "Why is Marketing over budget & behind target?",
    );
    for (const source of SOURCES) {
      expect(source.code).not.toContain("Why is Marketing");
      expect(source.code).not.toMatch(/keyword|trigger|why\b.*marketing/i);
    }
  });
});

/* ============================================ ⑪ THE FULL DEMO SCRIPT ==== */

/**
 * Six questions on REAL timers, each with US-031's thinking beat in front of
 * it. The default 5s budget is for a test, not for a presentation.
 */
const DEMO_TIMEOUT_MS = 30_000;

describe("the demo script — three heroes, three follow-ups, one session", () => {
  it(
    "runs every beat of the presentation in order",
    async () => {
      const user = userEvent.setup();
      renderApp();

      // Baseline first: four tiles and no answer yet.
      expect(slots("insight-section")).toHaveLength(0);

      for (const heroId of HERO_IDS) {
        await tap(user, HERO_CHIP_LABEL[heroId]);
        await tap(user, followUpChipName(heroId));
      }

      // Three sections, in the order they were asked, every one SHARPENED.
      const sections = slots("insight-section");
      expect(sections).toHaveLength(3);
      expect(sections.map((node) => node.dataset.heroId)).toEqual([
        ...HERO_IDS,
      ]);
      for (const node of sections) {
        expect(node.dataset.phase).toBe(InsightPhase.WITH_FOLLOW_UP);
        expect(slot("follow-up-divider", node)).not.toBeNull();
        expect(slot("recommendation-panel", node)).not.toBeNull();
      }

      // Every narrative on screen, primary and beat, all six verbatim.
      for (const hero of [HEROES.hero1, HEROES.hero2, HEROES.hero3]) {
        expect(document.body.textContent).toContain(hero.primary.narrative);
        expect(document.body.textContent).toContain(hero.followUp.narrative);
      }

      // NOT ONE STAND-IN ANYWHERE, which is what closes Phase 3b.
      expect(document.body.textContent).not.toMatch(/placeholder/i);
      // And the baseline the dashboard grew from is still under all of it.
      expect(screen.getByText("baseline")).toBeInTheDocument();
      // Six real thinking beats on real timers: this one test is the whole
      // presentation, so it is given the room to run it.
    },
    DEMO_TIMEOUT_MS,
  );

  it(
    "offers no follow-up chip once all three beats have run",
    async () => {
      const user = userEvent.setup();
      renderApp();

      for (const heroId of HERO_IDS) {
        await tap(user, HERO_CHIP_LABEL[heroId]);
        await tap(user, followUpChipName(heroId));
      }

      for (const heroId of HERO_IDS) {
        expect(
          screen.queryAllByRole("button", { name: followUpChipName(heroId) }),
        ).toHaveLength(0);
      }
    },
    DEMO_TIMEOUT_MS,
  );
});

/* ============================================ ⑫ DISCIPLINE ============== */

describe("Hero 3 follow-up — composition, not invention", () => {
  it("uses tokens only — no hex, no rgba, no arbitrary colour", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source.code).not.toMatch(/rgba?\(/);
    }
    expect(HERO_3_CODE).not.toMatch(
      /(?:text|bg|rounded|shadow|border|from|to)-\[/,
    );
  });

  it("writes no em or en dash into anything the room sees", () => {
    renderSections();

    expect(section().textContent).not.toMatch(/[–—−]/u);
  });

  it("builds neither the bars, the badge nor the panel", () => {
    expect(HERO_3_CODE).toContain("<DriverTile");
    expect(HERO_3_CODE).toContain("<RecommendationPanel");
    expect(HERO_3_CODE).not.toMatch(
      /DriverTotalBadge|DeltaChip value=\{driver/,
    );
  });

  it("keeps the section AGGREGATE — departments, never people", () => {
    renderSections();

    // The phase guardrail, on the beat that comes closest to it: this is a
    // budget breakdown of one department, and it names spend categories.
    const text = section().textContent!;
    expect(text).not.toMatch(
      /salary|salaries|wage|bonus|headcount|fte\b|employee|payroll/i,
    );
    for (const [name] of driverValues()) {
      expect(DRIVERS.map((driver) => driver.name)).toContain(name);
    }
    expect(FOLLOW_UP.narrative).not.toMatch(
      /salary|salaries|wage|bonus|headcount|payroll/i,
    );
  });
});
