/**
 * US-035 — Hero 1's follow-up: "which badge should we push next?"
 *
 * THE FOUR ACCEPTANCE CRITERIA, in order:
 *   1. the chip label is US-029's and the triggers are US-030's — both reused,
 *      neither restated (asserted here by NOT being reimplemented);
 *   2. a gold "Follow-up" divider separates the beat;
 *   3. a driver tile "Badge selection trend (last 3 drops)" — Bitpanda
 *      flat-high, Sunrise +38%, Allianz +6%, IWB -3% — plus a recommendation
 *      panel;
 *   4. the narrative is VERBATIM.
 *
 * This is a "so-what" beat, so two of the assertions below are about MEANING
 * rather than markup and are worth stating plainly:
 *
 *   - **The panel must not read as another metric.** US-024 made the
 *     difference structural — an `aside` announced as a complementary region,
 *     an accent down its SIDE, no card chrome — so the tests read the
 *     structure, not the styling.
 *   - **Sunrise is the point.** The tile keeps the dataset's authored order, so
 *     the assertions check that Sunrise is nonetheless the LONGEST bar in the
 *     list: `HBars` scales every row against the largest magnitude, and +38 is
 *     it. The recommendation that follows turns on that bar.
 *
 * Two techniques carry over from US-034 unchanged:
 *
 *   - **Verbatim** is asserted at the BYTE level: the UTF-8 hex of the rendered
 *     string against the hex of a retyped literal, its exact length, an
 *     ASCII-range sweep, the hyphen in "fastest - up" pinned to `0x2d`, and a
 *     match against the sentence in the backlog itself — so the two copies in
 *     this repository cannot drift together.
 *   - **No figure re-typed** is asserted by SCANNING the sources: every figure
 *     the beat can display, in every spelling, must be absent from the
 *     component and loader code.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { hBarMax, hBarPercent } from "../../app/components/charts/h-bars";
import {
  HERO_1_FOLLOW_UP_TITLE,
  HERO_1_TILE_TITLES,
} from "../../app/components/heroes/hero-1";
import {
  FOLLOW_UP_DIVIDER_LABEL,
  tileDelayMs,
} from "../../app/components/heroes/hero-section";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import { FOLLOW_UP_CHIP_HINT } from "../../app/components/chrome/suggestion-chips";
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
import { formatSignedPercent, varianceDirection } from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { HeroId, VarianceDirection } from "../../app/lib/repositories/enums";
import App from "../../app/root";
import { HEROES } from "./support/hero-data";
import {
  type FrameStub,
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";
import { settleThinkingBeat } from "./support/thinking-harness";

/* ----------------------------------------------------------------- DATA -- */

const PRIMARY = HEROES.hero1.primary;
const FOLLOW_UP = HEROES.hero1.followUp;

/* --------------------------------------------------------------- SOURCE -- */

/**
 * Every source file between the dataset and the screen. The scan below covers
 * all of them, so a figure or a sentence cannot be re-typed one layer up.
 */
const SCANNED_SOURCES = [
  "app/components/heroes/hero-1.tsx",
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
 * Movements below this are scanned for only in their FORMATTED spelling: a
 * bare `2`, `6` or `3` collides with a Tailwind span, an icon size and an array
 * index, so scanning for them would be noise rather than a guard. `38` — the
 * figure the whole beat turns on — is above it and is scanned both ways.
 */
const FIGURE_FLOOR = 10;

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

function divider(): HTMLElement | null {
  return slot("follow-up-divider", section());
}

function panel(): HTMLElement | null {
  return slot("recommendation-panel", section());
}

/** The follow-up's card — the driver tile, which is the LAST card in the beat. */
function trendTile(): HTMLElement {
  const tile = cards().find(
    (card) => card.querySelector("h3")?.textContent === HERO_1_FOLLOW_UP_TITLE,
  );
  if (!tile) throw new Error("the badge-trend tile is not on screen");
  return tile;
}

/** The trend rows as `[label, value]` pairs, in render order. */
function trendRows(): [string, string][] {
  return slots("h-bar-row", trendTile()).map((row) => [
    slot("h-bar-label", row)!.textContent!,
    slot("h-bar-value", row)!.textContent!,
  ]);
}

/** Runs every count-up and growth transition to completion. */
function settle(frames: FrameStub): void {
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
}

/** The section list with Hero 1 answered AND its follow-up shown. */
const SHARPENED: SectionList = withFollowUpShown(
  withHeroShown([], HeroId.HERO_1),
  HeroId.HERO_1,
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

describe("Hero 1 follow-up — the section GROWS, it does not multiply", () => {
  it("renders ONE section, not two", () => {
    renderSections();

    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute("data-hero-id", HeroId.HERO_1);
    expect(section()).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
  });

  it("keeps all three primary tiles and adds ONE more", () => {
    renderSections();

    expect(
      cards().map((card) => card.querySelector("h3")!.textContent),
    ).toEqual([
      `${HERO_1_TILE_TITLES.kits} (${PRIMARY.periods[0]!.label.toLowerCase()})`,
      HERO_1_TILE_TITLES.badges,
      HERO_1_TILE_TITLES.names,
      HERO_1_FOLLOW_UP_TITLE,
    ]);
  });

  it("is the SAME section the primary answer rendered — one h2, one head", () => {
    renderSections();

    expect(
      within(section()).getAllByRole("heading", { level: 2 }),
    ).toHaveLength(1);
    expect(slots("section-head", section())).toHaveLength(1);
    expect(
      within(section()).getByRole("heading", { level: 2 }),
    ).toHaveTextContent(HERO_CHIP_LABEL[HeroId.HERO_1]);
  });

  it("shows nothing of the beat while the phase is still PRIMARY", () => {
    renderSections(withHeroShown([], HeroId.HERO_1));

    expect(divider()).toBeNull();
    expect(panel()).toBeNull();
    expect(cards()).toHaveLength(3);
    expect(section().textContent).not.toContain(HERO_1_FOLLOW_UP_TITLE);
  });

  it("continues the section's ONE cascade rather than starting a second", () => {
    renderSections();

    expect(divider()!.style.animationDelay).toBe(`${tileDelayMs(3)}ms`);
    expect(trendTile().style.animationDelay).toBe(`${tileDelayMs(4)}ms`);
    expect(panel()!.style.animationDelay).toBe(`${tileDelayMs(5)}ms`);
  });
});

/* ============================================ ② THE GOLD DIVIDER ======== */

describe("Hero 1 follow-up — a gold divider separates the beat (criterion 2)", () => {
  it("renders, and reads 'Follow-up'", () => {
    renderSections();

    expect(divider()).not.toBeNull();
    expect(slot("follow-up-divider-label", divider()!)).toHaveTextContent(
      FOLLOW_UP_DIVIDER_LABEL,
    );
    expect(FOLLOW_UP_DIVIDER_LABEL).toBe("Follow-up");
  });

  it("SEPARATES: every primary tile before it, every follow-up element after", () => {
    renderSections();

    const rule = divider()!;
    const before = cards().slice(0, 3);
    const after = [trendTile(), panel()!];

    for (const node of before) {
      expect(
        rule.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING,
      ).toBeTruthy();
    }
    for (const node of after) {
      expect(
        rule.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("is gold, from the token — never a hex and never a second spelling", () => {
    renderSections();

    const rule = slot("follow-up-divider-rule", divider()!)!;
    expect(rule.className).toContain("bg-gold");
    expect(rule).toHaveAttribute("aria-hidden", "true");
    expect(slot("follow-up-divider-label", divider()!)!.className).toContain(
      "text-accent-follow-up",
    );
  });

  it("is a seam on the canvas grid, not a card and not a wrapper", () => {
    renderSections();

    const rule = divider()!;
    expect(rule).not.toHaveAttribute("data-slot", "card");
    expect(rule.className).toContain("col-span-full");
    // It contains its label and its rule and nothing else — no tile is nested
    // inside it, so the beat's tiles stay direct children of the section grid.
    expect(slots("card", rule)).toHaveLength(0);
    expect(slots("recommendation-panel", rule)).toHaveLength(0);
  });

  it("lives in the shared frame, so US-037 and US-039 reuse it", () => {
    // The divider is defined ONCE, in `hero-section.tsx`, and imported by the
    // hero — not re-drawn per beat. Three near-identical gold rules across the
    // prototype's three peak moments is the defect this guards.
    expect(code("app/components/heroes/hero-section.tsx")).toContain(
      "export function FollowUpDivider",
    );
    expect(code("app/components/heroes/hero-1.tsx")).toContain(
      "<FollowUpDivider",
    );
    expect(code("app/components/heroes/hero-1.tsx")).not.toContain("Follow-up");
  });

  it("spends gold ONCE per beat: the seam and the advice, not the chart", () => {
    renderSections();

    // The driver tile carries no gold accent bar of its own — a chart inside
    // the beat is still a chart (`app/lib/tokens.ts`, colour discipline 4).
    const accent = slot("card-accent", trendTile());
    expect(accent?.className ?? "").not.toContain("bg-gold");
  });
});

/* ============================================ ③ THE DRIVER TILE ========= */

describe("Hero 1 follow-up — the badge trend (criterion 3)", () => {
  it("titles the tile exactly as the criteria pin it", () => {
    renderSections();

    expect(trendTile().querySelector("h3")).toHaveTextContent(
      "Badge selection trend (last 3 drops)",
    );
    expect(HERO_1_FOLLOW_UP_TITLE).toBe("Badge selection trend (last 3 drops)");
  });

  it("shows the four sponsors with their signed percentages", () => {
    renderSections();

    expect(trendRows()).toEqual([
      ["Bitpanda", "+2%"],
      ["Sunrise", "+38%"],
      ["Allianz", "+6%"],
      ["IWB", "-3%"],
    ]);
  });

  it("reads those four straight off the dataset, formatted once", () => {
    renderSections();

    expect(trendRows()).toEqual(
      FOLLOW_UP.trend.map((entry) => [
        entry.sponsor,
        formatSignedPercent(entry.deltaPercent),
      ]),
    );
  });

  it("keeps the AUTHORED order — the badge-selection order, not magnitude", () => {
    // `rank="none"`, deliberately: the trend arrives in `badgeSplit` order, so
    // the column reads down from the badge people pick most. Ranked by
    // magnitude, Bitpanda's flat +2 would fall to third and read as "losing".
    expect(FOLLOW_UP.trend.map((entry) => entry.sponsor)).toEqual(
      PRIMARY.badgeSplit.map((share) => share.sponsor),
    );
    const shares = PRIMARY.badgeSplit.map((share) => share.percent);
    expect([...shares].sort((a, b) => b - a)).toEqual(shares);

    renderSections();
    expect(trendRows().map(([name]) => name)).toEqual(
      FOLLOW_UP.trend.map((entry) => entry.sponsor),
    );
  });

  it("SUNRISE IS THE POINT: +38% is the longest bar in the list", () => {
    renderSections();

    const fills = slots("h-bar-fill", trendTile()).map(
      (fill) => fill.style.width,
    );
    const values = FOLLOW_UP.trend.map((entry) => entry.deltaPercent);
    const max = hBarMax(values.map((value) => ({ name: "", value })));

    expect(fills).toEqual(values.map((value) => `${hBarPercent(value, max)}%`));
    // The Sunrise row fills the track; nothing else comes close.
    expect(fills[1]).toBe("100%");
    for (const [index, width] of fills.entries()) {
      if (index !== 1) expect(Number.parseFloat(width!)).toBeLessThan(100);
    }
  });

  it("shows IWB's -3% as a decline, in both directions of the row", () => {
    renderSections();

    const rows = slots("h-bar-row", trendTile());
    expect(rows.map((row) => row.getAttribute("data-direction"))).toEqual(
      FOLLOW_UP.trend.map((entry) => varianceDirection(entry.deltaPercent)),
    );
    expect(rows[3]).toHaveAttribute("data-direction", VarianceDirection.DOWN);
    // The declining row is not carried by colour alone: its value keeps the
    // explicit minus that `formatSignedPercent` writes.
    expect(slot("h-bar-value", rows[3]!)!.textContent).toBe("-3%");
  });

  it("adds no total badge — four percentage movements do not sum to anything", () => {
    renderSections();

    expect(slot("card-action", trendTile())).toBeNull();
    expect(trendTile().textContent).not.toContain("total");
  });

  it("draws no bar of its own: every row is US-021's shared row", () => {
    renderSections();

    expect(slots("h-bar-row", trendTile())).toHaveLength(
      FOLLOW_UP.trend.length,
    );
    expect(code("app/components/heroes/hero-1.tsx")).not.toMatch(
      /h-bar-|<svg|viewBox/,
    );
  });
});

/* ============================================ ④ THE RECOMMENDATION ====== */

describe("Hero 1 follow-up — the recommendation panel (criterion 3)", () => {
  it("renders, once, inside the same section", () => {
    renderSections();

    expect(slots("recommendation-panel", section())).toHaveLength(1);
  });

  it("is structurally NOT a data tile", () => {
    renderSections();

    const aside = panel()!;
    // The element itself: a complementary landmark, not a div of prose.
    expect(aside.tagName).toBe("ASIDE");
    expect(aside).toHaveAttribute("data-slot", "recommendation-panel");
    expect(aside.getAttribute("data-slot")).not.toBe("card");
    expect(within(section()).getByRole("complementary")).toBe(aside);
    // No card chrome: no tile shadow, no `rounded-tile`, no h3 heading.
    expect(aside.className).not.toContain("shadow-tile");
    expect(aside.className).toContain("rounded-panel");
    expect(aside.querySelector("h3")).toBeNull();
    // It is not counted among the section's tiles at all.
    expect(cards()).not.toContain(aside);
  });

  it("carries its accent down the SIDE, where a tile carries it across the top", () => {
    renderSections();

    const accent = slot("recommendation-accent", panel()!)!;
    // A vertical bar, down the leading edge — never the card's 3px top rule.
    expect(accent.className).toContain("w-[3px]");
    expect(accent.className).not.toContain("h-[3px]");
    expect(accent.className).toContain("bg-gold");
    expect(accent).toHaveAttribute("aria-hidden", "true");
    // It is the FIRST child of the panel: the accent leads the prose.
    expect(panel()!.firstElementChild).toBe(accent);
  });

  it("is announced as 'Recommendation' — the advice, named", () => {
    renderSections();

    expect(panel()).toHaveAccessibleName(RECOMMENDATION_LABEL);
    expect(slot("recommendation-label", panel()!)).toHaveTextContent(
      "Recommendation",
    );
    expect(panel()).toHaveAttribute("data-variant", "recommendation");
  });

  it("carries the advice, and it follows the bar that earned it", () => {
    renderSections();

    const body = slot("recommendation-body", panel()!)!;
    expect(body.textContent).toContain(
      "Recommendation: feature Sunrise in the next drop",
    );
    expect(body.textContent).toContain(
      "keeping Bitpanda as the default option",
    );
    // The advice comes AFTER the evidence, never before it.
    expect(
      trendTile().compareDocumentPosition(panel()!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

/* ============================================ ⑤ VERBATIM NARRATIVE ====== */

/**
 * The narrative EXACTLY as the backlog states it, retyped here so the rendered
 * string is compared against a second, independent copy.
 *
 * Every hazard a text pass could "improve" is in it: a spaced hyphen in
 * "fastest - up" that an autocorrect would make an en dash, a percentage, a
 * colon after "Recommendation", and two clauses joined by "while".
 */
const AUTHORED =
  "Bitpanda already leads badge selection, but Sunrise is growing fastest - " +
  "up 38% over the last three drops off a smaller base. Recommendation: " +
  "feature Sunrise in the next drop to convert its momentum, while keeping " +
  "Bitpanda as the default option.";

/** UTF-8 bytes, so "byte-identical" is asserted rather than approximated. */
function bytes(value: string): string {
  return Buffer.from(value, "utf8").toString("hex");
}

describe("Hero 1 follow-up — the narrative is the contract (criterion 4)", () => {
  it("renders the dataset's string, byte for byte", () => {
    renderSections();

    const rendered = slot("recommendation-body", panel()!)!.textContent!;
    expect(bytes(rendered)).toBe(bytes(AUTHORED));
    expect(bytes(FOLLOW_UP.narrative)).toBe(bytes(AUTHORED));
    expect(rendered).toBe(AUTHORED);
    expect(rendered).toHaveLength(AUTHORED.length);
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

  it("pins the hyphen in 'fastest - up' to an ASCII 0x2d", () => {
    // The single most likely silent corruption in this sentence: a spaced
    // hyphen is exactly what an editor turns into an en dash.
    const index = FOLLOW_UP.narrative.indexOf("-");
    expect(FOLLOW_UP.narrative.slice(index - 8, index + 4)).toBe(
      "fastest - up",
    );
    expect(FOLLOW_UP.narrative.codePointAt(index)).toBe(0x2d);
    // And it is the ONLY hyphen in the sentence.
    expect(FOLLOW_UP.narrative.split("-")).toHaveLength(2);
  });

  it("is never assembled, truncated or transformed on the way to the screen", () => {
    renderSections();

    const body = slot("recommendation-body", panel()!)!;
    expect(body.textContent).toBe(FOLLOW_UP.narrative);
    expect(body.className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
    expect(body.querySelector("*")).toBeNull();
  });

  it("exists nowhere in the component layer — it is rendered FROM the dataset", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toContain("Bitpanda already leads");
      expect(source.code).not.toContain("Recommendation: feature Sunrise");
      expect(source.code).not.toContain("Sunrise");
    }
  });

  it("quotes the figure the bars actually show", () => {
    // "up 38%" is the Sunrise row, not a number written into the sentence.
    const sunrise = FOLLOW_UP.trend.find(
      (entry) => entry.sponsor === "Sunrise",
    )!;
    expect(sunrise.deltaPercent).toBe(38);
    expect(FOLLOW_UP.narrative).toContain("up 38% over the last three drops");
    renderSections();
    expect(trendRows()[1]![1]).toBe(formatSignedPercent(sunrise.deltaPercent));
  });
});

/* ============================================ ⑥ DERIVED, NOT RE-TYPED === */

describe("Hero 1 follow-up — every figure comes from the dataset", () => {
  it("re-types none of the four movements anywhere on the way to the screen", () => {
    for (const entry of FOLLOW_UP.trend) {
      for (const source of SOURCES) {
        expect(source.code).not.toContain(
          formatSignedPercent(entry.deltaPercent),
        );
        // A single-digit movement collides with Tailwind spans, icon sizes and
        // array indices, so only its FORMATTED spelling is scanned for; the one
        // figure the beat turns on (+38) is scanned bare as well. Bounded on
        // both sides, so a story number like `US-038` is not a false hit.
        if (Math.abs(entry.deltaPercent) < FIGURE_FLOOR) continue;
        expect(source.code).not.toMatch(
          new RegExp(`(?<![\\d-])${Math.abs(entry.deltaPercent)}(?!\\d)`),
        );
      }
    }
    // The guard above is only worth having if it actually scans for 38.
    expect(
      FOLLOW_UP.trend.some(
        (entry) => Math.abs(entry.deltaPercent) >= FIGURE_FLOOR,
      ),
    ).toBe(true);
  });

  it("names no sponsor in code — the row labels are the dataset's own", () => {
    for (const entry of FOLLOW_UP.trend) {
      for (const source of SOURCES) {
        expect(source.code).not.toContain(entry.sponsor);
      }
    }
  });

  it("formats the percentages through app/lib/format.ts, not by hand", () => {
    expect(code("app/components/heroes/hero-1.tsx")).toContain(
      "format={formatSignedPercent}",
    );
    expect(code("app/components/heroes/hero-1.tsx")).not.toMatch(/\+\$\{|"%"/);
  });
});

/* ============================================ ⑦ REDUCED MOTION ========== */

describe("Hero 1 follow-up — reduced motion renders the final state", () => {
  it("shows every trend figure at its target with no frame run", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    expect(trendRows()).toEqual(
      FOLLOW_UP.trend.map((entry) => [
        entry.sponsor,
        formatSignedPercent(entry.deltaPercent),
      ]),
    );
  });

  it("leaves no bar in the beat stranded at zero width", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    for (const fill of slots("h-bar-fill", trendTile())) {
      expect(fill.style.width).not.toBe("0%");
    }
  });

  it("still renders the divider and the advice, in full", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    expect(divider()).not.toBeNull();
    expect(slot("recommendation-body", panel()!)!.textContent).toBe(
      FOLLOW_UP.narrative,
    );
  });
});

/* ============================================ ⑧ ON THE REAL DASHBOARD === */

describe("Hero 1 follow-up — asked for real, from the chip row", () => {
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

  /**
   * The follow-up chip's accessible name carries US-029's visually-hidden
   * "Follow-up:" hint, so a screen-reader user hears WHICH kind of prompt it
   * is. Named here rather than spelled out at each call site.
   */
  const followUpChipName = `${FOLLOW_UP_CHIP_HINT} ${
    FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]
  }`;

  function followUpChips(): HTMLElement[] {
    return screen.queryAllByRole("button", { name: followUpChipName });
  }

  async function tap(user: UserEvent, label: string) {
    await user.click(screen.getAllByRole("button", { name: label })[0]!);
    await settleThinkingBeat();
  }

  it("flips the section it is already on — ONE section, four tiles", async () => {
    const user = userEvent.setup();
    renderApp();

    await tap(user, HERO_CHIP_LABEL[HeroId.HERO_1]);
    expect(cards()).toHaveLength(3);

    await tap(user, followUpChipName);

    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
    expect(cards()).toHaveLength(4);
    expect(divider()).not.toBeNull();
    expect(panel()).not.toBeNull();
    // The dashboard GREW: the baseline is untouched under it.
    expect(screen.getByText("baseline")).toBeInTheDocument();
  });

  it("withdraws the follow-up chip once the beat is on screen", async () => {
    const user = userEvent.setup();
    renderApp();

    // Not offered at the baseline; offered once the hero is answered.
    expect(followUpChips()).toHaveLength(0);
    await tap(user, HERO_CHIP_LABEL[HeroId.HERO_1]);
    expect(followUpChips()).not.toHaveLength(0);

    await tap(user, followUpChipName);

    // US-029's derived visibility: a sharpened section offers no follow-up.
    expect(followUpChips()).toHaveLength(0);
    // The hero's own chip is always offered, sharpened or not.
    expect(
      screen.queryAllByRole("button", {
        name: HERO_CHIP_LABEL[HeroId.HERO_1],
      }),
    ).not.toHaveLength(0);
  });

  it("restates neither the chip label nor a keyword set of its own", () => {
    // Criteria 1 is satisfied by NOT being reimplemented: the hero renders, it
    // does not decide whether it was asked for.
    expect(FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]).toBe(
      "Which badge should we push next?",
    );
    for (const source of SOURCES) {
      expect(source.code).not.toContain("Which badge");
      expect(source.code).not.toMatch(/promote|keyword|trigger/i);
    }
  });
});

/* ============================================ ⑨ DISCIPLINE ============== */

describe("Hero 1 follow-up — composition, not invention", () => {
  it("uses tokens only — no hex, no rgba, no arbitrary colour", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source.code).not.toMatch(/rgba?\(/);
      expect(source.code).not.toMatch(
        /(?:text|bg|rounded|shadow|border|from|to)-\[/,
      );
    }
  });

  it("writes no em or en dash into anything the room sees", () => {
    renderSections();

    expect(section().textContent).not.toMatch(/[–—]/);
  });

  it("builds neither the bars nor the panel — both are Phase 2b components", () => {
    const hero = code("app/components/heroes/hero-1.tsx");
    expect(hero).toContain("<DriverTile");
    expect(hero).toContain("<RecommendationPanel");
    expect(hero).not.toMatch(/<aside|<svg|viewBox|animationDelay/);
  });
});
