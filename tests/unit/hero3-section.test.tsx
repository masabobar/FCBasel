/**
 * US-038 — Hero 3's primary answer, end to end.
 *
 * THE ACCEPTANCE CRITERIA, in order:
 *   1. the chip label is the section's heading and the keyword set stays
 *      US-030's (asserted by not being restated);
 *   2. two tiles in a fixed order — the department table (six departments plus
 *      a total row, each tagged Revenue or Cost, with its variance and its % of
 *      target, Marketing flagged as BOTH over budget and behind target, figures
 *      in CHF millions) and then the overall tile (CHF 69.68M against
 *      CHF 69.00M, +1.0%, blended target 96%, budget-vs-actual compare bars and
 *      an above-target count);
 *   3. the narrative is VERBATIM;
 *   4. the Revenue / Cost tagging reads correctly.
 *
 * ── THE ONE THING THIS FILE EXISTS FOR ──────────────────────────────────────
 * `④ THE REVENUE / COST TRAP`. For a revenue department an actual above budget
 * is money earned; for the Marketing COST CENTRE it is an OVERSPEND. A table
 * that painted "variance > 0" green would show Marketing's +410 as a success
 * directly above the follow-up that calls it the club's one problem department.
 * US-022 closed that STRUCTURALLY — the component cannot compute the judgement —
 * and this suite asserts the outcome END TO END, on the real data, on screen:
 * Marketing's +0.41 renders ADVERSE while Sponsoring's +0.84 renders
 * FAVOURABLE, in the same rendered table.
 *
 * The other techniques are the ones US-034 / US-036 / US-037 established:
 *
 *   - **Verbatim** at the BYTE level: UTF-8 hex against a retyped literal,
 *     exact length, an ASCII sweep, the hyphen pinned to `0x2d`, and a match
 *     against the sentence in the backlog itself — so the two copies in this
 *     repository cannot drift together.
 *   - **No figure re-typed**, by SCANNING the sources: every figure the section
 *     can display, in every spelling, absent from the component and loader
 *     code.
 */

import { render, screen, within } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  Hero3Body,
  HERO_3_COMPARE_LABELS,
  HERO_3_FOLLOW_UP_TITLE,
  HERO_3_FOOTER_LABELS,
  HERO_3_TILE_TITLES,
} from "../../app/components/heroes/hero-3";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import {
  FLAG_LABEL,
  FLAGGED_ROW_CLASS,
  MILLIONS_NOTE,
  NEAR_TARGET_MIN_PERCENT,
  TARGET_MARK_LABEL,
  TargetMark,
  TOTAL_LABEL,
} from "../../app/components/tiles/department-table";
import { HERO_CHIP_LABEL } from "../../app/lib/dashboard/chips";
import {
  InsightPhase,
  type InsightSections as SectionList,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import {
  chfFromThousands,
  formatMillions,
  formatMoneyMillionsFixed,
  formatNumber,
  formatPercent,
  formatSignedMillions,
  formatSignedPercent,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import {
  type DepartmentPerformance,
  departmentPerformanceRows,
  departmentsNeedingAttention,
  departmentsOnTarget,
  departmentTotals,
  departmentVariancePercent,
  ON_TARGET_PERCENT,
} from "../../app/lib/repositories/derive";
import {
  DepartmentType,
  HeroId,
  VarianceDirection,
  VarianceJudgement,
} from "../../app/lib/repositories/enums";
import { type Department } from "../../app/lib/repositories/types";
import { HEROES } from "./support/hero-data";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
  type FrameStub,
} from "./support/motion-harness";

/* ----------------------------------------------------------------- DATA -- */

const PRIMARY = HEROES.hero3.primary;
/** The beat's own dataset. US-039's suite asserts it; here it is only wired. */
const FOLLOW_UP = HEROES.hero3.followUp;
const DEPARTMENTS = PRIMARY.departments;
const ROWS: readonly DepartmentPerformance[] =
  departmentPerformanceRows(DEPARTMENTS);
const TOTALS = departmentTotals(DEPARTMENTS);
const ON_TARGET = departmentsOnTarget(DEPARTMENTS);
const BLENDED = PRIMARY.blendedTargetPercent;

const SPONSORING = "Sponsoring & Partnerships";
const TICKETING = "Ticketing";
const HOSPITALITY = "Hospitality";
const MERCHANDISING = "Merchandising (Fanshop)";
const EVENTS = "Events";
const MARKETING = "Marketing & Communications";

/* --------------------------------------------------------------- SOURCE -- */

/**
 * Every source file between the dataset and the screen. The scan below covers
 * all of them, so a figure cannot be re-typed one layer up instead.
 */
const SCANNED_SOURCES = [
  "app/components/heroes/hero-3.tsx",
  "app/components/heroes/hero-section.tsx",
  "app/components/heroes/insight-sections.tsx",
  "app/components/tiles/compare-bars.tsx",
  "app/components/tiles/department-table.tsx",
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

const HERO_3_PATH = "app/components/heroes/hero-3.tsx";
const HERO_3_SOURCE = readFileSync(resolve(process.cwd(), HERO_3_PATH), "utf8");
const HERO_3_CODE = code(HERO_3_PATH);

/**
 * The acceptance criteria as written, whitespace-collapsed.
 *
 * The verbatim narrative is checked against THIS as well as against a literal
 * below, so the two copies in the repository cannot drift together: the backlog
 * is the document the client signed off, and it wraps the sentence across four
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
 * Values below 100 are excluded from the figure scan: a two-digit figure
 * collides with Tailwind spans, icon sizes and array indices, so scanning for
 * them would be noise rather than a guard. Every budget, actual and total is
 * far above it; the figures that are not — the three attainment percentages
 * below target, the blended 96, the +1.0% and the counts — are scanned for by
 * their own exact spellings in `⑦`.
 */
const FIGURE_FLOOR = 100;

/** Every figure the section can put on screen, at or above the floor. */
const DISPLAYED_FIGURES: readonly number[] = [
  ...ROWS.flatMap((row) => [
    row.budget,
    row.actual,
    row.variance,
    row.targetPercent,
  ]),
  TOTALS.budget,
  TOTALS.actual,
  TOTALS.variance,
].filter((value) => Math.abs(value) >= FIGURE_FLOOR);

/* ------------------------------------------------------------- HARNESS -- */

/** `CHF 69.00M` — the tile's one composition, as the hero composes it. */
function moneyMillions(thousands: number): string {
  return formatMoneyMillionsFixed(chfFromThousands(thousands));
}

/** `21.84` — a bare table cell, under the tile's "CHF millions" note. */
function millions(thousands: number): string {
  return formatMillions(chfFromThousands(thousands));
}

/** `+0.41` — a variance chip in the table. */
function signedMillions(thousands: number): string {
  return formatSignedMillions(chfFromThousands(thousands));
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

function tableCard(): HTMLElement {
  return cards()[0]!;
}

function overallCard(): HTMLElement {
  return cards()[1]!;
}

/** Runs every count-up and growth transition to completion. */
function settle(frames: FrameStub): void {
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
}

function renderSections(
  sections: SectionList = withHeroShown([], HeroId.HERO_3),
  { settled = true }: { settled?: boolean } = {},
) {
  const frames = stubFrames();
  const result = render(
    <InsightSections sections={sections} heroes={HEROES} focus={null} />,
  );
  if (settled) settle(frames);
  return { ...result, frames };
}

/* ---- the table ---- */

/** The row for a department, found the way a presenter finds it: by name. */
function row(name: string): HTMLElement {
  const found = slots("department-row", section()).find(
    (candidate) => candidate.dataset.department === name,
  );
  if (!found) throw new Error(`no row for "${name}"`);
  return found;
}

function cell(name: string, column: string): HTMLElement {
  const found = row(name).querySelector<HTMLElement>(
    `[data-column="${column}"]`,
  );
  if (!found) throw new Error(`no ${column} cell for "${name}"`);
  return found;
}

function totalCell(column: string): HTMLElement {
  const found = slot("department-total-row", section())!.querySelector(
    `[data-column="${column}"]`,
  );
  if (!found) throw new Error(`no total ${column} cell`);
  return found as HTMLElement;
}

function varianceChip(name: string): HTMLElement {
  return slot("delta-chip", cell(name, "variance"))!;
}

function target(name: string): HTMLElement {
  return slot("department-target", cell(name, "targetPercent"))!;
}

function rowNames(): string[] {
  return slots("department-row", section()).map(
    (node) => node.dataset.department!,
  );
}

/* ---- the overall tile ---- */

function compareBars(): HTMLElement[] {
  return slots("compare-bar", overallCard());
}

function compareValues(): (string | null)[] {
  return compareBars().map(
    (bar) => slot("compare-bar-value", bar)!.textContent,
  );
}

function overallDelta(): HTMLElement {
  return slot("delta-chip", slot("kpi-figure", overallCard())!)!;
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ============================================ ① THE SECTION HEAD ======== */

describe("Hero 3 — the head states the question and its answer", () => {
  it("titles the section with US-029's chip label, not a second wording", () => {
    renderSections();

    const heading = within(section()).getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent(HERO_CHIP_LABEL[HeroId.HERO_3]);
    expect(HERO_CHIP_LABEL[HeroId.HERO_3]).toBe(
      "Department budgets vs actuals",
    );
    // Imported, never retyped — one string for the chip and the heading it
    // answers.
    expect(HERO_3_CODE).toContain("HERO_CHIP_LABEL[HeroId.HERO_3]");
  });

  it("labels the section by that heading, so the canvas stays walkable", () => {
    renderSections();

    expect(section()).toHaveAccessibleName(HERO_CHIP_LABEL[HeroId.HERO_3]);
  });

  it("states the narrative BEFORE any tile", () => {
    renderSections();

    const narrative = slot("section-narrative", section())!;
    for (const node of cards()) {
      expect(
        narrative.compareDocumentPosition(node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("carries no period filter — a full-year budget is a closed period", () => {
    renderSections();

    expect(slot("section-control", section())).toBeNull();
    expect(slots("segmented-option", section())).toHaveLength(0);
    expect(HERO_3_CODE).not.toMatch(/Segmented|PeriodKey|useState/);
  });

  it("restates no keyword set of its own — matching stays US-030's", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/keyword/i);
      expect(source.code).not.toMatch(/\bactuals\b|\bachieved\b|\bspend\b/i);
    }
  });
});

/* ============================================ ② VERBATIM NARRATIVE ====== */

/**
 * The narrative EXACTLY as the backlog states it. Every hazard a text pass
 * could "improve" is in it: a colon, an ampersand inside a department name,
 * three percentages at two different precisions, and — the one most likely to
 * be "fixed" — a spaced HYPHEN standing in for a dash before the final clause.
 */
const AUTHORED =
  "Most departments are on or ahead of plan. Two need attention: " +
  "Merchandising is 7.7% under its revenue target, and Marketing & " +
  "Communications is 12% over its spend budget while sitting at 84% of its " +
  "outcome target - the only department both over budget and behind target.";

/** UTF-8 bytes, so "byte-identical" is asserted rather than approximated. */
function bytes(value: string): string {
  return Buffer.from(value, "utf8").toString("hex");
}

describe("Hero 3 — the narrative is the contract (criterion 3)", () => {
  it("renders the dataset's string, byte for byte", () => {
    renderSections();

    const rendered = slot("section-narrative", section())!.textContent!;
    expect(bytes(rendered)).toBe(bytes(AUTHORED));
    expect(bytes(PRIMARY.narrative)).toBe(bytes(AUTHORED));
    expect(rendered).toHaveLength(AUTHORED.length);
    expect(AUTHORED).toHaveLength(270);
  });

  it("matches the acceptance criterion in the backlog itself", () => {
    // Two copies inside this repository could drift together; the signed-off
    // document cannot, so the string is checked against it as well.
    expect(BACKLOG).toContain(PRIMARY.narrative);
  });

  it("is plain ASCII — no smart quote, no em dash, no minus glyph", () => {
    for (const character of PRIMARY.narrative) {
      expect(character.codePointAt(0)!).toBeLessThan(0x80);
    }
    expect(PRIMARY.narrative).not.toMatch(/[‘’“”–—−]/u);
  });

  it("pins the dash before the final clause to an ASCII hyphen, 0x2d", () => {
    // "target - the only department both over budget and behind target" is the
    // sentence's verdict, and the hyphen is the one character a text pass would
    // promote to an em dash.
    const fragment = "target - the only";
    expect(PRIMARY.narrative).toContain(fragment);
    const index = PRIMARY.narrative.indexOf(fragment);
    expect(PRIMARY.narrative.codePointAt(index + fragment.indexOf("-"))).toBe(
      0x2d,
    );
    // It is the ONLY hyphen in the sentence, so there is nothing else to slip.
    expect([...PRIMARY.narrative].filter((one) => one === "-")).toHaveLength(1);
  });

  it("is never assembled, truncated or transformed on the way to the screen", () => {
    renderSections();

    const line = slot("section-narrative", section())!;
    expect(line.textContent).toBe(PRIMARY.narrative);
    expect(line.className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
    // No copy of the sentence exists in the component layer at all.
    for (const source of SOURCES) {
      expect(source.code).not.toContain("Most departments");
      expect(source.code).not.toContain("Two need attention");
      expect(source.code).not.toContain("both over budget and behind target");
    }
  });

  it("quotes figures the tiles actually show", () => {
    const merchandising = DEPARTMENTS.find(
      (one) => one.name === MERCHANDISING,
    )!;
    const marketing = DEPARTMENTS.find((one) => one.name === MARKETING)!;

    // 7.7% under its revenue target, 12% over its spend budget, 84% of its
    // outcome target — all three derived from the rows the table renders.
    expect(departmentVariancePercent(merchandising)).toBe(-7.7);
    expect(PRIMARY.narrative).toContain("7.7% under");
    expect(Math.round(departmentVariancePercent(marketing))).toBe(12);
    expect(PRIMARY.narrative).toContain("12% over");
    expect(formatPercent(marketing.targetPercent)).toBe("84%");
    expect(PRIMARY.narrative).toContain("84% of its outcome target");
  });

  it("names the ONE department the figures actually flag", () => {
    // "the only department both over budget and behind target" is
    // `departmentsNeedingAttention`, not a claim typed beside the sentence.
    const flagged = departmentsNeedingAttention(DEPARTMENTS);

    expect(flagged).toHaveLength(1);
    expect(flagged[0]!.name).toBe(MARKETING);
    expect(PRIMARY.narrative).toContain("Marketing & Communications");
    expect(PRIMARY.narrative).toContain("the only department");
  });
});

/* ============================================ ③ THE TILES, IN ORDER ===== */

describe("Hero 3 — two tiles, in the defined order (criterion 2)", () => {
  it("renders exactly two tiles for the primary answer", () => {
    renderSections();

    expect(cards()).toHaveLength(2);
  });

  it("orders them the table, then the overall tile", () => {
    renderSections();

    expect(cardTitles()).toEqual([
      HERO_3_TILE_TITLES.table,
      HERO_3_TILE_TITLES.overall,
    ]);
    expect(cardTitles()[0]).toBe("Departmental performance (full year)");
    // The DOM order IS the reading order: the table first, the headline after.
    expect(slot("department-table", tableCard())).not.toBeNull();
    expect(slot("kpi-figure", overallCard())).not.toBeNull();
    expect(slot("department-table", overallCard())).toBeNull();
  });

  it("titles the tiles as h3 under the section's own h2", () => {
    renderSections();

    expect(
      within(section()).getAllByRole("heading", { level: 2 }),
    ).toHaveLength(1);
    expect(
      within(section()).getAllByRole("heading", { level: 3 }),
    ).toHaveLength(2);
  });

  it("gives the table two thirds of the grid and the tile the third", () => {
    renderSections();

    // The pair shares a row only from `xl`: at `lg` two thirds of the canvas
    // leaves the six columns short enough to wrap the long names.
    expect(tableCard().className).toContain("xl:col-span-8");
    expect(overallCard().className).toContain("xl:col-span-4");
    for (const card of cards()) {
      expect(card.className).toContain("col-span-full");
      expect(card.className).not.toMatch(/lg:col-span-\d/);
    }
  });
});

describe("Hero 3 — the table (criterion 2, first tile)", () => {
  it("lists the six departments in the dataset's order, plus a total row", () => {
    renderSections();

    expect(DEPARTMENTS).toHaveLength(6);
    expect(rowNames()).toEqual(DEPARTMENTS.map((one) => one.name));
    expect(rowNames()).toEqual([
      SPONSORING,
      TICKETING,
      HOSPITALITY,
      MERCHANDISING,
      EVENTS,
      MARKETING,
    ]);
    expect(slot("department-total-row", section())).not.toBeNull();
    expect(slot("department-total-row", section())).toHaveTextContent(
      TOTAL_LABEL,
    );
  });

  it("tags every department Revenue or Cost, from the datum's own label", () => {
    renderSections();

    for (const each of DEPARTMENTS) {
      const tag = slot("department-type-tag", cell(each.name, "type"))!;
      expect(tag).toHaveTextContent(each.typeLabel);
      expect(tag.dataset.type).toBe(each.type);
    }
    // Five earn, one spends — which is what makes the sign of a variance
    // insufficient on its own.
    expect(
      DEPARTMENTS.filter((one) => one.type === DepartmentType.REVENUE),
    ).toHaveLength(5);
    const cost = DEPARTMENTS.filter((one) => one.type === DepartmentType.COST);
    expect(cost.map((one) => one.name)).toEqual([MARKETING]);
    // The club is neither, so the total row's tag cell is empty rather than
    // carrying an invented type.
    expect(totalCell("type").textContent).toBe("");
  });

  it("states every budget, actual, variance and % of target", () => {
    renderSections();

    for (const each of ROWS) {
      expect(cell(each.name, "budget").textContent).toBe(millions(each.budget));
      expect(cell(each.name, "actual").textContent).toBe(millions(each.actual));
      expect(varianceChip(each.name)).toHaveTextContent(
        signedMillions(each.variance),
      );
      expect(
        slot("department-target-percent", target(each.name))!.textContent,
      ).toBe(formatPercent(each.targetPercent));
    }
    // The four figures the room reads first, spelled out.
    expect(cell(SPONSORING, "budget").textContent).toBe("21.00");
    expect(cell(SPONSORING, "actual").textContent).toBe("21.84");
    expect(cell(MARKETING, "budget").textContent).toBe("3.40");
    expect(cell(MARKETING, "actual").textContent).toBe("3.81");
  });

  it("totals the rows on screen: 69.00 against 69.68", () => {
    renderSections();

    expect(totalCell("budget").textContent).toBe(millions(TOTALS.budget));
    expect(totalCell("actual").textContent).toBe(millions(TOTALS.actual));
    expect(totalCell("budget").textContent).toBe("69.00");
    expect(totalCell("actual").textContent).toBe("69.68");
    expect(slot("delta-chip", totalCell("variance"))).toHaveTextContent(
      signedMillions(TOTALS.variance),
    );
    // Neutral at club level: mixed signs across five revenue departments and
    // one cost centre are a fact, not a verdict (US-022).
    expect(slot("delta-chip", totalCell("variance"))).toHaveAttribute(
      "data-judgement",
      VarianceJudgement.NEUTRAL,
    );
  });

  it("shows the STORED blended attainment on the total row", () => {
    renderSections();

    expect(
      slot("department-target-percent", totalCell("targetPercent"))!
        .textContent,
    ).toBe(formatPercent(BLENDED));
    expect(formatPercent(BLENDED)).toBe("96%");
  });

  it("quotes the table in CHF MILLIONS, with the note that says so", () => {
    renderSections();

    // US-022's review decision, which must not be reverted.
    expect(slot("department-millions-note", tableCard())!.textContent).toBe(
      MILLIONS_NOTE,
    );
    expect(MILLIONS_NOTE).toBe("figures in CHF millions");
    expect(slot("card-subtitle", tableCard())).toHaveTextContent(MILLIONS_NOTE);
  });

  it("shows no '000' and no thousands figure anywhere in the tile", () => {
    renderSections();

    const text = tableCard().textContent!;
    expect(text).not.toMatch(/000/);
    expect(text).not.toMatch(/CHF 0/i);
    for (const raw of ["21’000", "24’000", "69’000", "69’680"]) {
      expect(text).not.toContain(raw);
    }
    // Nor in the title, which the acceptance criteria word as "(CHF 000)" —
    // the half US-022 was reported for and corrected.
    expect(HERO_3_TILE_TITLES.table).not.toContain("000");
    expect(HERO_3_TILE_TITLES.table).toContain("full year");
  });
});

/* ============================================ ④ THE REVENUE/COST TRAP == */

describe("Hero 3 — above budget is EARNED for revenue, OVERSPENT for cost", () => {
  it("renders Marketing's +0.41 as ADVERSE and Sponsoring's +0.84 as FAVOURABLE", () => {
    // THE STORY'S CENTRAL CORRECTNESS CLAIM, on the real data, on screen.
    renderSections();

    const marketing = ROWS.find((one) => one.name === MARKETING)!;
    const sponsoring = ROWS.find((one) => one.name === SPONSORING)!;

    expect(marketing.variance).toBe(410);
    expect(sponsoring.variance).toBe(840);

    // Same sign, same arrow, OPPOSITE meaning.
    for (const each of [marketing, sponsoring]) {
      expect(varianceChip(each.name)).toHaveAttribute(
        "data-direction",
        VarianceDirection.UP,
      );
      expect(slot("delta-arrow", varianceChip(each.name))).not.toBeNull();
      expect(varianceChip(each.name)).toHaveTextContent("up");
    }

    expect(varianceChip(MARKETING)).toHaveAttribute(
      "data-judgement",
      VarianceJudgement.ADVERSE,
    );
    expect(varianceChip(MARKETING).className).toContain(
      "text-variance-negative",
    );
    expect(varianceChip(SPONSORING)).toHaveAttribute(
      "data-judgement",
      VarianceJudgement.FAVOURABLE,
    );
    expect(varianceChip(SPONSORING).className).toContain(
      "text-variance-positive",
    );
  });

  it("reads every one of the six rows the way its type demands", () => {
    renderSections();

    for (const each of ROWS) {
      expect(varianceChip(each.name)).toHaveAttribute(
        "data-judgement",
        each.judgement,
      );
      expect(row(each.name)).toHaveAttribute("data-judgement", each.judgement);
    }
    // Four departments came in above budget; only THREE of them happily.
    const above = ROWS.filter((one) => one.overBudget);
    expect(above.map((one) => one.name)).toEqual([
      SPONSORING,
      TICKETING,
      EVENTS,
      MARKETING,
    ]);
    expect(
      above.filter((one) => one.judgement === VarianceJudgement.ADVERSE),
    ).toHaveLength(1);
  });

  it("takes the judgement from the DATA — the tiles cannot compute it", () => {
    // US-022's structural close, re-asserted from the hero's side: neither the
    // table nor this section can decide good news from a sign.
    for (const path of [
      "app/components/tiles/department-table.tsx",
      HERO_3_PATH,
    ]) {
      const source = code(path);
      expect(source).not.toMatch(/FAVOURABLE|ADVERSE/);
      expect(source).not.toMatch(/variance\s*[<>]/);
      expect(source).not.toMatch(/actual\s*-\s*budget/);
    }
    expect(code("app/components/tiles/department-table.tsx")).toContain(
      "row.judgement",
    );
  });

  it("flips the reading when a type flips — the proof it is not the sign", () => {
    // Marketing as a REVENUE department would make the same +410 good news.
    const flipped: Department[] = DEPARTMENTS.map((each) =>
      each.name === MARKETING
        ? { ...each, type: DepartmentType.REVENUE }
        : each,
    );
    const after = departmentPerformanceRows(flipped).find(
      (one) => one.name === MARKETING,
    )!;

    expect(after.variance).toBe(410);
    expect(after.judgement).toBe(VarianceJudgement.FAVOURABLE);
  });
});

/* ============================================ ⑤ ONE ROW IS FLAGGED ===== */

describe("Hero 3 — exactly one department is flagged, and the data picks it", () => {
  it("flags Marketing, and nothing else, as over budget AND behind target", () => {
    renderSections();

    const flagged = slots("department-row", section()).filter(
      (node) => node.dataset.flagged === "true",
    );

    expect(flagged).toHaveLength(1);
    expect(flagged[0]!.dataset.department).toBe(MARKETING);
    expect(row(MARKETING).className).toContain(FLAGGED_ROW_CLASS);
    // The tint is visual; the icon and the sentence carry the same news.
    expect(slot("department-flag", row(MARKETING))).not.toBeNull();
    expect(row(MARKETING)).toHaveTextContent(FLAG_LABEL);
    expect(FLAG_LABEL).toBe("Over budget and behind target");
  });

  it("takes the flag from `needsAttention`, never from a name", () => {
    renderSections();

    for (const each of ROWS) {
      expect(row(each.name).dataset.flagged).toBe(String(each.needsAttention));
    }
    expect(
      ROWS.filter((one) => one.needsAttention).map((one) => one.name),
    ).toEqual([MARKETING]);
    // The flag cannot outlive the figures: no component decides it from a
    // name. Marketing is named in exactly ONE place in the whole layer — the
    // TITLE of US-039's follow-up tile, which the acceptance criteria pin as
    // "What's driving Marketing" — and never in a comparison, a lookup or a
    // condition. The primary answer's table names no department at all.
    for (const source of SOURCES) {
      expect(source.code).not.toContain("Merchandising");
      if (source.path === HERO_3_PATH) continue;
      expect(source.code).not.toContain("Marketing");
    }
    expect(HERO_3_CODE.match(/Marketing/g)).toHaveLength(1);
    expect(HERO_3_CODE).toContain(`"${HERO_3_FOLLOW_UP_TITLE}"`);
    expect(HERO_3_FOLLOW_UP_TITLE).toContain("Marketing");
    // A name used as DATA rather than as copy: never compared, never matched.
    expect(HERO_3_CODE).not.toMatch(
      /===\s*"Marketing|Marketing"\s*===|includes\("Marketing|find\(/,
    );
  });

  it("moves the flag when the figures move", () => {
    // Hospitality is behind target but UNDER budget, so it is not flagged.
    // Push it over budget and it is — with no edit to a component.
    const edited: Department[] = DEPARTMENTS.map((each) =>
      each.name === HOSPITALITY ? { ...each, actual: each.budget + 1 } : each,
    );

    expect(departmentsNeedingAttention(edited).map((one) => one.name)).toEqual([
      HOSPITALITY,
      MARKETING,
    ]);
  });
});

/* ============================================ ⑥ THE GOLD TARGET BAND === */

describe("Hero 3 — the near-target gold band, on the rendered rows", () => {
  it("marks Hospitality (95) near target and Merchandising (92) not at all", () => {
    renderSections();

    const hospitality = DEPARTMENTS.find((one) => one.name === HOSPITALITY)!;
    const merchandising = DEPARTMENTS.find(
      (one) => one.name === MERCHANDISING,
    )!;

    expect(hospitality.targetPercent).toBe(NEAR_TARGET_MIN_PERCENT);
    expect(merchandising.targetPercent).toBeLessThan(NEAR_TARGET_MIN_PERCENT);

    expect(target(HOSPITALITY).dataset.mark).toBe(TargetMark.NEAR);
    expect(slot("department-target-dot", target(HOSPITALITY))).not.toBeNull();
    expect(target(HOSPITALITY)).toHaveTextContent(
      TARGET_MARK_LABEL[TargetMark.NEAR],
    );

    expect(target(MERCHANDISING).dataset.mark).toBe(TargetMark.BEHIND);
    expect(slot("department-target-dot", target(MERCHANDISING))).toBeNull();
    expect(target(MERCHANDISING)).not.toHaveTextContent(
      TARGET_MARK_LABEL[TargetMark.NEAR],
    );
  });

  it("marks the three departments at or above their target as hits", () => {
    renderSections();

    for (const each of DEPARTMENTS) {
      const expected =
        each.targetPercent >= ON_TARGET_PERCENT
          ? TargetMark.HIT
          : each.targetPercent >= NEAR_TARGET_MIN_PERCENT
            ? TargetMark.NEAR
            : TargetMark.BEHIND;
      expect(target(each.name).dataset.mark).toBe(expected);
    }
    expect(
      slots("department-target", section()).filter(
        (node) => node.dataset.mark === TargetMark.HIT,
      ),
    ).toHaveLength(3);
    // Marketing's 84 is the one row with no mark and no near ring either.
    expect(target(MARKETING).dataset.mark).toBe(TargetMark.BEHIND);
  });
});

/* ============================================ ⑦ THE OVERALL TILE ======= */

describe("Hero 3 — the overall tile (criterion 2, second tile)", () => {
  it("headlines CHF 69.68M, derived from the rows beside it", () => {
    renderSections();

    expect(slot("kpi-value", overallCard())!.textContent).toBe(
      moneyMillions(TOTALS.actual),
    );
    expect(slot("kpi-value", overallCard())!.textContent).toBe("CHF 69.68M");
    expect(slot("kpi-subtitle", overallCard())).toHaveTextContent(
      "Actual across all departments",
    );
  });

  it("states +1.0% against budget, NEUTRAL, with a sign and an arrow", () => {
    renderSections();

    // The value IS the acceptance criteria's +1.0% (+0.99% before rounding);
    // the app's one percentage rule spells a whole number without a redundant
    // `.0`, which is why the chip reads `+1%`.
    expect(TOTALS.variancePercent).toBe(1);
    expect(overallDelta()).toHaveTextContent(
      formatSignedPercent(TOTALS.variancePercent),
    );
    expect(overallDelta()).toHaveTextContent("+1%");
    expect(overallDelta()).toHaveAttribute(
      "data-direction",
      VarianceDirection.UP,
    );
    // NEUTRAL, exactly as the table's own total row states the same movement:
    // it is arithmetic across mixed signs, not a verdict.
    expect(overallDelta()).toHaveAttribute(
      "data-judgement",
      VarianceJudgement.NEUTRAL,
    );
    expect(slot("delta-arrow", overallDelta())).not.toBeNull();
  });

  it("draws budget against actual as labelled compare bars on one scale", () => {
    renderSections();

    expect(compareBars()).toHaveLength(2);
    expect(
      compareBars().map((bar) => slot("compare-bar-label", bar)!.textContent),
    ).toEqual([HERO_3_COMPARE_LABELS.budget, HERO_3_COMPARE_LABELS.actual]);
    expect(compareValues()).toEqual([
      moneyMillions(TOTALS.budget),
      moneyMillions(TOTALS.actual),
    ]);
    // The acceptance criteria's own two strings, on screen, both at two
    // decimals so the pair reads as one measure.
    expect(compareValues()).toEqual(["CHF 69.00M", "CHF 69.68M"]);

    // The actual is the larger figure, so it fills the track and the budget
    // reads as a proportion of it.
    const width = (index: number): number =>
      Number(
        slot("compare-bar-fill", compareBars()[index]!)!.style.width.slice(
          0,
          -1,
        ),
      );
    expect(width(1)).toBeCloseTo(100, 5);
    expect(width(0)).toBeLessThan(width(1));
  });

  it("colours the plan navy and what happened club blue", () => {
    renderSections();

    expect(slot("compare-bar-fill", compareBars()[0]!)).toHaveAttribute(
      "data-series",
      "navy",
    );
    expect(slot("compare-bar-fill", compareBars()[1]!)).toHaveAttribute(
      "data-series",
      "blue",
    );
  });

  it("states the blended target — the one figure that is stored", () => {
    renderSections();

    const blended = slot("overall-blended", overallCard())!;
    expect(blended).toHaveTextContent(HERO_3_FOOTER_LABELS.blended);
    expect(slot("overall-blended-value", blended)!.textContent).toBe(
      formatPercent(BLENDED),
    );
    expect(slot("overall-blended-value", blended)!.textContent).toBe("96%");
    expect(BLENDED).toBe(PRIMARY.blendedTargetPercent);
  });

  it("counts the departments above target — DERIVED, three of six", () => {
    renderSections();

    const above = slot("overall-above-target", overallCard())!;
    expect(above).toHaveTextContent(HERO_3_FOOTER_LABELS.aboveTarget);
    expect(slot("overall-above-target-value", above)!.textContent).toBe(
      `${formatNumber(ON_TARGET.length)}of ${formatNumber(ROWS.length)}`,
    );
    expect(above).toHaveTextContent("3of 6");

    // The count is the length of `departmentsOnTarget`, not a literal: the
    // three departments that hit or beat their own outcome target.
    expect(ON_TARGET.map((one) => one.name)).toEqual([
      SPONSORING,
      TICKETING,
      EVENTS,
    ]);
    for (const each of ON_TARGET) {
      expect(each.targetPercent).toBeGreaterThanOrEqual(ON_TARGET_PERCENT);
    }
  });

  it("moves that count when a department's attainment moves", () => {
    // The proof it is derived: lift Hospitality to its target and the count
    // becomes four, with no edit to a component.
    const edited: Department[] = DEPARTMENTS.map((each) =>
      each.name === HOSPITALITY
        ? { ...each, targetPercent: ON_TARGET_PERCENT }
        : each,
    );

    expect(departmentsOnTarget(edited)).toHaveLength(ON_TARGET.length + 1);
  });
});

/* ============================================ ⑧ ONE SCOPE, STATED ====== */

describe("Hero 3 — one scope, and the mismatch with Hero 2 is labelled", () => {
  it("puts the dataset's scope line on the head, above both tiles", () => {
    renderSections();

    const scope = slot("section-scope", section())!;
    expect(scope.textContent).toBe(PRIMARY.scopeLabel);
    // Both tiles are the same six departments over the same full year, so the
    // scope is stated once rather than twice — unlike Hero 2, whose two charts
    // are at two different scopes and each carry their own line.
    expect(slots("section-scope", section())).toHaveLength(1);
  });

  it("names the season-ticket inclusion, which is what makes both correct", () => {
    renderSections();

    const scope = slot("section-scope", section())!.textContent!.toLowerCase();
    expect(scope).toContain("full-year departmental totals");
    expect(scope).toContain("ticketing includes the season-ticket base");
  });

  it("is a GENUINE mismatch: Ticketing here really does exceed Hero 2's", () => {
    // If this stopped being true the label would describe a difference that no
    // longer exists, which is its own kind of lie.
    const ticketing = DEPARTMENTS.find((one) => one.name === TICKETING)!;
    const fixtures = HEROES.hero2.primary.fixtures.fixtures;
    const shown = fixtures.reduce((total, one) => total + one.current, 0);

    expect(ticketing.actual).toBeGreaterThan(shown);
    expect(ticketing.actual).toBe(24_360);
    expect(shown).toBe(7_830);
  });

  it("takes the label from the DATASET, not from the component", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toContain("season-ticket");
      expect(source.code).not.toContain("Full-year departmental totals");
    }
    expect(HERO_3_CODE).toContain("primary.scopeLabel");
  });
});

/* ============================================ ⑨ DERIVED, NOT STORED ==== */

describe("Hero 3 — every total, variance and flag is derived", () => {
  it("stores no total, variance, judgement or flag in the dataset", () => {
    const keys = [
      ...Object.keys(PRIMARY),
      ...DEPARTMENTS.flatMap((each) => Object.keys(each)),
    ];

    for (const key of keys) {
      expect(key).not.toMatch(
        /total|variance|delta|judgement|flag|attention|sum|diff/i,
      );
    }
    // And the figures themselves are absent, so nothing could be read even by
    // a stray index. The narrative is excluded because it QUOTES the 7.7%, the
    // 12% and the 84% in prose, which is the point of it — those are checked
    // against the derived figures in ②.
    // Matched as a stored VALUE (`"variance":410`) rather than as a substring,
    // because 840 lives inside Sponsoring's legitimate 21840.
    const serialised = JSON.stringify({ ...PRIMARY, narrative: "" });
    for (const figure of [69_000, 69_680, 680, 840, 410, -750, -360]) {
      expect(serialised).not.toMatch(new RegExp(`:\\s*${figure}\\b`));
    }
  });

  it("keeps `blendedTargetPercent` stored — and it is not a mean", () => {
    // The ONE stored figure, and it has to be: no arithmetic over the six rows
    // reproduces it, which is why a tile is handed it rather than deriving it.
    const plainMean =
      DEPARTMENTS.reduce((total, one) => total + one.targetPercent, 0) /
      DEPARTMENTS.length;
    const budgetWeighted =
      DEPARTMENTS.reduce(
        (total, one) => total + one.targetPercent * one.budget,
        0,
      ) / TOTALS.budget;

    expect(BLENDED).toBe(96);
    expect(Math.round(plainMean * 10) / 10).toBe(97);
    expect(Math.round(budgetWeighted * 10) / 10).toBe(99.7);
    expect(BLENDED).not.toBe(Math.round(plainMean));
    expect(BLENDED).not.toBe(Math.round(budgetWeighted));
    // Passed through untouched, never recomputed.
    expect(HERO_3_CODE).toContain(
      "blendedTargetPercent={blendedTargetPercent}",
    );
  });

  it("derives the totals from the same six rows the table lists", () => {
    const sum = (values: readonly number[]): number =>
      values.reduce((total, value) => total + value, 0);

    expect(TOTALS.budget).toBe(sum(DEPARTMENTS.map((one) => one.budget)));
    expect(TOTALS.actual).toBe(sum(DEPARTMENTS.map((one) => one.actual)));
    expect(TOTALS.variance).toBe(TOTALS.actual - TOTALS.budget);
    expect(TOTALS.variance).toBe(sum(ROWS.map((one) => one.variance)));
    expect(TOTALS.variance).toBe(680);
  });

  it("moves the headline when a department moves", () => {
    const edited: Department[] = DEPARTMENTS.map((each) =>
      each.name === EVENTS ? { ...each, actual: each.budget } : each,
    );
    const after = departmentTotals(edited);

    expect(after.actual).toBe(TOTALS.actual - 180);
    expect(formatSignedPercent(after.variancePercent)).toBe("+0.7%");
  });

  it("re-types not one displayed figure in the component layer", () => {
    // Every spelling: the raw number, the grouped number, and both millions
    // forms the section can render.
    for (const value of DISPLAYED_FIGURES) {
      const spellings = [
        String(value),
        formatNumber(value),
        millions(value),
        signedMillions(value),
        moneyMillions(value),
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

  it("re-types none of the small figures either, in the hero itself", () => {
    // The ones the floor excludes from the scan above, plus the derived
    // headline spellings the tile puts on screen.
    for (const spelling of [
      "96",
      "95",
      "92",
      "84",
      "69.00",
      "69.68",
      "0.68",
      "12.1",
      "7.7",
      "410",
      "840",
    ]) {
      expect(HERO_3_CODE, `${spelling} appears in the hero`).not.toContain(
        spelling,
      );
    }
  });

  it("builds no chart, no table and no colour of its own", () => {
    // Composition, like Hero 1 and Hero 2: not one primitive is written here.
    expect(HERO_3_CODE).not.toMatch(/<svg|<rect|<path|viewBox|<line\b/);
    expect(HERO_3_CODE).not.toMatch(/<table|<thead|<tbody|<tfoot|<tr\b|<td\b/);
    expect(HERO_3_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(HERO_3_CODE).not.toMatch(/\brgba?\(/);
    // No em dash, en dash or minus glyph in anything this file can render.
    expect(HERO_3_CODE).not.toMatch(/[–—−]/u);
    expect(HERO_3_CODE).not.toMatch(/dangerouslySetInnerHTML/);
    // The raw file still exists to be read; nothing else needs it.
    expect(HERO_3_SOURCE.length).toBeGreaterThan(HERO_3_CODE.length);
  });

  it("puts DEPARTMENTS on screen, never people (the phase guardrail)", () => {
    // This is the section closest to the named-individual guardrail, so it is
    // asserted on the RENDERED text rather than only on the dataset: budgets,
    // actuals and outcome attainment, all aggregate.
    renderSections();

    const text = section().textContent!;
    expect(text).not.toMatch(
      /salary|salaries|wage|bonus|headcount|fte\b|employee|payroll/i,
    );
    // Every row header is a department from the dataset, so no person's name
    // can have reached a row.
    expect(rowNames()).toHaveLength(DEPARTMENTS.length);
    for (const name of rowNames()) {
      expect(DEPARTMENTS.map((one) => one.name)).toContain(name);
    }
  });

  it("writes no currency, percent or factor of a thousand", () => {
    expect(HERO_3_CODE).not.toMatch(/CHF/);
    expect(HERO_3_CODE).not.toMatch(/1_000|1000/);
    expect(HERO_3_CODE).not.toMatch(/toFixed/);
  });
});

/* ============================================ ⑩ THE SECTION MECHANIC ==== */

describe("Hero 3 — asking twice refreshes the section in place", () => {
  it("keeps ONE section with two tiles when the hero is re-asked", () => {
    const asked = withHeroShown([], HeroId.HERO_3);
    const { rerender, frames } = renderSections(asked);

    rerender(
      <InsightSections
        sections={withHeroShown(asked, HeroId.HERO_3)}
        heroes={HEROES}
        focus={null}
      />,
    );
    settle(frames);

    expect(slots("insight-section")).toHaveLength(1);
    expect(cards()).toHaveLength(2);
    expect(cardTitles()).toEqual([
      HERO_3_TILE_TITLES.table,
      HERO_3_TILE_TITLES.overall,
    ]);
    expect(slots("department-row", section())).toHaveLength(6);
    expect(slot("kpi-value", overallCard())!.textContent).toBe("CHF 69.68M");
  });

  it("renders the primary answer alone until the follow-up is asked", () => {
    renderSections();

    expect(section()).toHaveAttribute("data-phase", InsightPhase.PRIMARY);
    expect(cards()).toHaveLength(2);
    expect(section().textContent).not.toContain("Placeholder");
  });

  it("keeps US-039's beat inside the same section, as a third tile", () => {
    renderSections(
      withFollowUpShown(withHeroShown([], HeroId.HERO_3), HeroId.HERO_3),
    );

    // The causal peak: the phase flip GROWS this section rather than appending
    // one, and the two primary tiles stay in place. The beat itself is
    // asserted in `tests/unit/hero3-follow-up.test.tsx`.
    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
    expect(cards()).toHaveLength(3);
    expect(cardTitles().slice(0, 2)).toEqual([
      HERO_3_TILE_TITLES.table,
      HERO_3_TILE_TITLES.overall,
    ]);
    expect(slots("department-row", section())).toHaveLength(6);
  });

  it("staggers the two tiles through the section's one shared step", () => {
    renderSections();

    expect(cards()[0]!.style.animationDelay).toBe("");
    expect(cards()[1]!.style.animationDelay).toBe("90ms");
  });
});

/* ============================================ ⑪ REDUCED MOTION ========= */

describe("Hero 3 — reduced motion shows the final state, not a frozen one", () => {
  it("draws every figure, every bar and every target at its final value", () => {
    stubMatchMedia(true);
    stubFrames();
    render(
      <InsightSections
        sections={withHeroShown([], HeroId.HERO_3)}
        heroes={HEROES}
        focus={null}
      />,
    );

    // No frames advanced: the figures and the widths are already final.
    expect(slot("kpi-value", overallCard())!.textContent).toBe("CHF 69.68M");
    expect(compareValues()).toEqual(["CHF 69.00M", "CHF 69.68M"]);
    expect(
      Number(
        slot("compare-bar-fill", compareBars()[1]!)!.style.width.slice(0, -1),
      ),
    ).toBeCloseTo(100, 5);

    // Not one target bar is left stranded at zero width.
    for (const each of DEPARTMENTS) {
      const fill = slot("department-target-fill", target(each.name))!;
      expect(Number(fill.style.width.slice(0, -1))).toBeGreaterThan(0);
    }
    expect(
      slot("department-target-fill", totalCell("targetPercent"))!.style.width,
    ).not.toBe("0%");
  });

  it("still renders both tiles, in order, with all six rows", () => {
    stubMatchMedia(true);
    stubFrames();
    render(
      <InsightSections
        sections={withHeroShown([], HeroId.HERO_3)}
        heroes={HEROES}
        focus={null}
      />,
    );

    expect(cardTitles()).toEqual([
      HERO_3_TILE_TITLES.table,
      HERO_3_TILE_TITLES.overall,
    ]);
    expect(rowNames()).toEqual(DEPARTMENTS.map((one) => one.name));
    expect(varianceChip(MARKETING)).toHaveAttribute(
      "data-judgement",
      VarianceJudgement.ADVERSE,
    );
  });
});

/* ============================================ ⑫ THE BODY ON ITS OWN ==== */

describe("Hero3Body — the section body, mounted directly", () => {
  it("renders the head and both tiles without the frame around it", () => {
    const frames = stubFrames();
    render(
      <Hero3Body
        primary={PRIMARY}
        followUp={FOLLOW_UP}
        phase={InsightPhase.PRIMARY}
      />,
    );
    settle(frames);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      HERO_CHIP_LABEL[HeroId.HERO_3],
    );
    expect(slots("card")).toHaveLength(2);
    expect(slot("section-narrative")).toHaveTextContent(PRIMARY.narrative);
    expect(slots("department-row")).toHaveLength(6);
  });

  it("reads the dataset through the root loader, not a fixture of its own", () => {
    // `heroes.ts` hands all three heroes down from one read; the section
    // imports no repository and no mock.
    expect(HEROES.hero3.primary).toBe(PRIMARY);
    expect(HERO_3_CODE).not.toMatch(/lib\/mock|Repository|createMock/);
    expect(code("app/lib/dashboard/heroes.ts")).toContain(
      "hero3Repository.hero()",
    );
    expect(code("app/root.tsx")).toContain("hero3Repository");
  });

  it("keeps the beat's own figures out of the PRIMARY answer", () => {
    // US-039 added `followUp` to the body's props and to the dispatch in one
    // move. At `primary` the beat renders nothing at all, so no figure from
    // the causal peak can reach a screen that was asked the first question —
    // and the stand-in it replaced is gone from the product entirely.
    const frames = stubFrames();
    render(
      <Hero3Body
        primary={PRIMARY}
        followUp={FOLLOW_UP}
        phase={InsightPhase.PRIMARY}
      />,
    );
    settle(frames);

    expect(slots("card")).toHaveLength(2);
    expect(slot("recommendation-panel")).toBeNull();
    expect(slot("follow-up-divider")).toBeNull();
    expect(document.body.textContent).not.toContain(FOLLOW_UP.narrative);
    expect(HERO_3_CODE).not.toContain("PlaceholderFollowUp");
  });
});
