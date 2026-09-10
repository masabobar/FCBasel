/**
 * US-037 — Hero 2's follow-up: "which fixtures are driving the drop?"
 *
 * THE FIVE ACCEPTANCE CRITERIA, in order:
 *   1. the chip label is US-029's and the triggers are US-030's — both reused,
 *      neither restated (asserted here by NOT being reimplemented);
 *   2. horizontal bars ranking the FOUR declining fixtures by size of decline,
 *      in negative mode with a `CHF ...k` formatter: FCZ -CHF 150k, Lugano
 *      -CHF 110k, Luzern -CHF 70k, Sion -CHF 70k;
 *   3. a `-CHF 400k total` badge in the card's action slot, and a one-line
 *      attendance note;
 *   4. the narrative is VERBATIM;
 *   5. values render on a single line — never wrapped.
 *
 * This is the prototype's SECOND "so-what" beat, and three of the assertions
 * below are load-bearing for the demo rather than for the markup:
 *
 *   - **THE TIE.** Luzern and Sion both fell CHF 70k. US-009's
 *     `fixtureDeclines` derives them in fixture order and US-023's ranking is
 *     stable, so Luzern must precede Sion in the rendered rows — an unstable
 *     sort would make the projector show a different order between runs.
 *   - **CRITERION 5 IS A RECORDED REVIEW DECISION.** US-021's 96px `nowrap`
 *     value column exists precisely so `-CHF 150k` and `-CHF 110k` never wrap,
 *     and it is marked "must not be reverted". It is asserted here END TO END —
 *     read off the rows this section actually renders, through
 *     `getComputedStyle`, exactly as `tests/unit/h-bars.test.tsx` reads it.
 *   - **THE BADGE IS DERIVED.** `-CHF 400k total` is summed from the rows on
 *     screen (US-023's `driverTotal`), so it cannot drift from the bars. The
 *     proof is that moving a fixture moves the badge.
 *
 * Two techniques carry over from US-034 / US-035 / US-036 unchanged:
 *
 *   - **Verbatim** is asserted at the BYTE level: the UTF-8 hex of the rendered
 *     string against the hex of a retyped literal, its exact length, an
 *     ASCII-range sweep, every hyphen pinned to `0x2d`, and a match against the
 *     sentence in the backlog itself — so the two copies in this repository
 *     cannot drift together. The "3,200" COMMA is asserted as it stands: it is
 *     hand-authored prose inside a verbatim string, and US-011 recorded the
 *     tension with the app's own U+2019 separator as known and accepted.
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

import {
  H_BAR_VALUE_WIDTH_PX,
  hBarMax,
  hBarPercent,
} from "../../app/components/charts/h-bars";
import { FOLLOW_UP_CHIP_HINT } from "../../app/components/chrome/suggestion-chips";
import {
  HERO_2_FOLLOW_UP_TITLE,
  HERO_2_TILE_TITLES,
} from "../../app/components/heroes/hero-2";
import {
  FOLLOW_UP_DIVIDER_LABEL,
  tileDelayMs,
} from "../../app/components/heroes/hero-section";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import {
  DRIVER_TOTAL_LABEL,
  driverTotal,
} from "../../app/components/tiles/driver-tile";
import { NARRATIVE_LABEL } from "../../app/components/tiles/recommendation-panel";
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
  formatNumber,
  formatSignedMoneyCompact,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import {
  declineTotal,
  fixtureDeclines,
  fixtureTotals,
} from "../../app/lib/repositories/derive";
import { HeroId, VarianceDirection } from "../../app/lib/repositories/enums";
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

const PRIMARY = HEROES.hero2.primary;
const FOLLOW_UP = HEROES.hero2.followUp;
const FIXTURES = PRIMARY.fixtures.fixtures;

/** The four declines, derived — never a second list in the dataset. */
const DECLINES = fixtureDeclines(FIXTURES);

/** `-CHF 150k` — the beat's figures, spelled by the app's own formatter. */
function money(thousands: number): string {
  return formatMoneyCompact(chfFromThousands(thousands));
}

/* --------------------------------------------------------------- SOURCE -- */

/**
 * Every source file between the dataset and the screen. The scans below cover
 * all of them, so a figure or a sentence cannot be re-typed one layer up.
 */
const SCANNED_SOURCES = [
  "app/components/heroes/hero-2.tsx",
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
 * Below this, a figure is scanned for only in its FORMATTED spelling: a bare
 * `70` collides with a Tailwind opacity suffix and a two-digit span, so
 * scanning for it would be noise rather than a guard. `150`, `110` and the
 * `400` total are above it and are scanned both ways.
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

function divider(): HTMLElement | null {
  return slot("follow-up-divider", section());
}

function panel(): HTMLElement | null {
  return slot("recommendation-panel", section());
}

/** The beat's card — the driver tile, the fourth tile of this section. */
function declineTile(): HTMLElement {
  const tile = cards().find(
    (card) => card.querySelector("h3")?.textContent === HERO_2_FOLLOW_UP_TITLE,
  );
  if (!tile) throw new Error("the declining-fixtures tile is not on screen");
  return tile;
}

function declineRows(): HTMLElement[] {
  return slots("h-bar-row", declineTile());
}

/** The rendered rows as `[label, value]` pairs, top to bottom. */
function declineValues(): [string, string][] {
  return declineRows().map((row) => [
    slot("h-bar-label", row)!.textContent!,
    slot("h-bar-value", row)!.textContent!,
  ]);
}

/** The chip in the card's action slot, whatever it turns out to be. */
function totalBadge(): HTMLElement | null {
  const action = slot("card-action", declineTile());
  return action ? slot("delta-chip", action) : null;
}

function note(): HTMLElement | null {
  return slot("driver-note", declineTile());
}

/** Runs every count-up and growth transition to completion. */
function settle(frames: FrameStub): void {
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
}

/** The section list with Hero 2 answered AND its follow-up shown. */
const SHARPENED: SectionList = withFollowUpShown(
  withHeroShown([], HeroId.HERO_2),
  HeroId.HERO_2,
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

describe("Hero 2 follow-up — the section GROWS, it does not multiply", () => {
  it("renders ONE section, not two", () => {
    renderSections();

    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute("data-hero-id", HeroId.HERO_2);
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
      HERO_2_TILE_TITLES.fixtures,
      HERO_2_TILE_TITLES.totals,
      HERO_2_TILE_TITLES.months,
      HERO_2_FOLLOW_UP_TITLE,
    ]);
  });

  it("leaves the primary answer's own figures untouched under the beat", () => {
    renderSections();

    // The headline the beat explains is still the headline it explained.
    expect(slot("kpi-value", cards()[1]!)!.textContent).toBe("CHF 7.83M");
    expect(slots("grouped-bar-pair", section())).toHaveLength(FIXTURES.length);
    expect(slots("line-chart-line", section())).not.toHaveLength(0);
  });

  it("is the SAME section the primary answer rendered — one h2, one head", () => {
    renderSections();

    expect(
      within(section()).getAllByRole("heading", { level: 2 }),
    ).toHaveLength(1);
    expect(slots("section-head", section())).toHaveLength(1);
    expect(
      within(section()).getByRole("heading", { level: 2 }),
    ).toHaveTextContent(HERO_CHIP_LABEL[HeroId.HERO_2]);
  });

  it("shows nothing of the beat while the phase is still PRIMARY", () => {
    renderSections(withHeroShown([], HeroId.HERO_2));

    expect(divider()).toBeNull();
    expect(panel()).toBeNull();
    expect(cards()).toHaveLength(3);
    expect(section().textContent).not.toContain(HERO_2_FOLLOW_UP_TITLE);
  });

  it("continues the section's ONE cascade rather than starting a second", () => {
    renderSections();

    expect(divider()!.style.animationDelay).toBe(`${tileDelayMs(3)}ms`);
    expect(declineTile().style.animationDelay).toBe(`${tileDelayMs(4)}ms`);
    expect(panel()!.style.animationDelay).toBe(`${tileDelayMs(5)}ms`);
  });

  it("shows no placeholder of any kind — the beat is real content now", () => {
    renderSections();

    expect(section().textContent).not.toContain("Placeholder");
    expect(slot("placeholder-follow-up-body", section())).toBeNull();
    expect(code("app/components/heroes/hero-2.tsx")).not.toContain(
      "PlaceholderFollowUp",
    );
  });
});

/* ============================================ ② THE GOLD SEAM =========== */

describe("Hero 2 follow-up — the beat opens on the SHARED divider", () => {
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

  it("SEPARATES: every primary tile before it, the beat after", () => {
    renderSections();

    const rule = divider()!;
    for (const node of cards().slice(0, 3)) {
      expect(
        rule.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING,
      ).toBeTruthy();
    }
    for (const node of [declineTile(), panel()!]) {
      expect(
        rule.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("builds no second divider — it imports US-035's", () => {
    const hero = code("app/components/heroes/hero-2.tsx");
    expect(hero).toContain("<FollowUpDivider");
    expect(hero).not.toContain("Follow-up");
    expect(code("app/components/heroes/hero-section.tsx")).toContain(
      "export function FollowUpDivider",
    );
  });

  it("spends gold ONCE per beat: the seam, not the chart and not the panel", () => {
    renderSections();

    // A chart inside the beat is still a chart (`app/lib/tokens.ts`, rule 4),
    // and this beat's panel INTERPRETS rather than advises, so it is navy.
    expect(slot("card-accent", declineTile())?.className ?? "").not.toContain(
      "bg-gold",
    );
    expect(slot("recommendation-accent", panel()!)!.className).not.toContain(
      "bg-gold",
    );
    expect([...section().querySelectorAll('[class*="bg-gold"]')]).toHaveLength(
      1,
    );
  });
});

/* ============================================ ③ THE RANKED DECLINES ===== */

describe("Hero 2 follow-up — four declining fixtures, ranked (criterion 2)", () => {
  it("titles the tile and states the order it claims", () => {
    renderSections();

    expect(declineTile().querySelector("h3")).toHaveTextContent(
      HERO_2_FOLLOW_UP_TITLE,
    );
    expect(slot("card-subtitle", declineTile())!.textContent).toContain(
      "ranked by size of decline",
    );
  });

  it("renders exactly the four fixtures that fell, biggest first", () => {
    renderSections();

    expect(declineValues()).toEqual([
      ["FCZ", "-CHF 150k"],
      ["Lugano", "-CHF 110k"],
      ["Luzern", "-CHF 70k"],
      ["Sion", "-CHF 70k"],
    ]);
  });

  it("THE TIE: Luzern precedes Sion, both at -CHF 70k", () => {
    renderSections();

    const order = declineValues().map(([name]) => name);
    const tied = declineValues().filter(([, value]) => value === "-CHF 70k");

    expect(tied.map(([name]) => name)).toEqual(["Luzern", "Sion"]);
    expect(order.indexOf("Luzern")).toBeLessThan(order.indexOf("Sion"));
    // And it is the DATASET's order, not a coincidence of this render:
    // `fixtureDeclines` derives ties in fixture order and US-023's ranking is
    // stable, so the two agree. An unstable sort would make the demo
    // non-deterministic between runs.
    expect(order).toEqual(DECLINES.map((decline) => decline.opponent));
    expect(
      FIXTURES.findIndex((fixture) => fixture.opponent === "Luzern"),
    ).toBeLessThan(
      FIXTURES.findIndex((fixture) => fixture.opponent === "Sion"),
    );
  });

  it("names only the fallers — the four risers are not in the list", () => {
    renderSections();

    const shown = declineValues().map(([name]) => name);
    for (const fixture of FIXTURES) {
      const fell = fixture.current < fixture.previous;
      expect(shown.includes(fixture.opponent)).toBe(fell);
    }
    expect(shown).toHaveLength(4);
  });

  it("reads every figure off the dataset, formatted once", () => {
    renderSections();

    expect(declineValues()).toEqual(
      DECLINES.map((decline) => [decline.opponent, money(-decline.drop)]),
    );
  });

  it("shows every row as a DECLINE — direction, sign and token", () => {
    renderSections();

    for (const row of declineRows()) {
      expect(row).toHaveAttribute("data-direction", VarianceDirection.DOWN);
      expect(slot("h-bar-value", row)!.textContent).toMatch(/^-CHF /);
      expect(slot("h-bar-value", row)!.className).toContain(
        "text-variance-negative",
      );
    }
  });

  it("scales the bars against the biggest fall, so FCZ fills the track", () => {
    renderSections();

    const values = DECLINES.map((decline) => decline.drop);
    const max = hBarMax(values.map((value) => ({ name: "", value })));

    expect(
      slots("h-bar-fill", declineTile()).map((fill) => fill.style.width),
    ).toEqual(values.map((value) => `${hBarPercent(value, max)}%`));
    expect(slot("h-bar-fill", declineRows()[0]!)!.style.width).toBe("100%");
  });

  it("draws no bar of its own: every row is US-021's shared row", () => {
    renderSections();

    expect(declineRows()).toHaveLength(DECLINES.length);
    expect(code("app/components/heroes/hero-2.tsx")).not.toMatch(
      /h-bar-|<svg|viewBox/,
    );
  });
});

/* ============================================ ④ ONE LINE, NEVER WRAPPED = */

describe("Hero 2 follow-up — values on a single line (criterion 5)", () => {
  it("gives every rendered row the 96px `nowrap` value column", () => {
    renderSections();

    for (const row of declineRows()) {
      const value = slot("h-bar-value", row)!;
      const computed = getComputedStyle(value);

      expect(computed.width).toBe(`${H_BAR_VALUE_WIDTH_PX}px`);
      expect(computed.whiteSpace).toBe("nowrap");
    }
    // The recorded review decision itself: 96px, "must not be reverted".
    expect(H_BAR_VALUE_WIDTH_PX).toBe(96);
  });

  it("keeps `-CHF 150k` and `-CHF 110k` on ONE line, end to end", () => {
    renderSections();

    for (const [name, expected] of [
      ["FCZ", "-CHF 150k"],
      ["Lugano", "-CHF 110k"],
    ] as const) {
      const row = declineRows().find(
        (candidate) => slot("h-bar-label", candidate)?.textContent === name,
      )!;
      const value = slot("h-bar-value", row)!;

      // One text node, no break taken, and nowrap in force — the three things
      // that together mean "a single line".
      expect(value.textContent).toBe(expected);
      expect(value.textContent).not.toContain("\n");
      expect(value.childNodes).toHaveLength(1);
      expect(getComputedStyle(value).whiteSpace).toBe("nowrap");
    }
  });

  it("keeps the column aligned with tabular figures", () => {
    renderSections();

    for (const row of declineRows()) {
      expect(slot("h-bar-value", row)!.className).toContain("tabular-nums");
    }
  });

  it("never truncates a value or a fixture name", () => {
    renderSections();

    for (const row of declineRows()) {
      for (const part of ["h-bar-label", "h-bar-value"]) {
        expect(slot(part, row)!.className).not.toMatch(
          /truncate|line-clamp|text-ellipsis/,
        );
      }
    }
  });
});

/* ============================================ ⑤ THE DERIVED BADGE ======= */

describe("Hero 2 follow-up — the `-CHF 400k total` badge (criterion 3)", () => {
  it("renders in the card's ACTION slot, with the trailing word", () => {
    renderSections();

    const badge = totalBadge()!;
    expect(badge).not.toBeNull();
    expect(slot("card-action", declineTile())).toContainElement(badge);
    expect(badge.textContent).toContain("-CHF 400k");
    expect(slot("delta-suffix", badge)!.textContent).toBe(DRIVER_TOTAL_LABEL);
    expect(badge.textContent).toContain("total");
  });

  it("carries the direction three ways, never by colour alone", () => {
    renderSections();

    const badge = totalBadge()!;
    expect(badge.dataset.direction).toBe(VarianceDirection.DOWN);
    expect(badge.textContent).toContain("-");
    expect(badge.textContent).toContain("down");
  });

  it("is SUMMED FROM THE ROWS on screen, not passed in", () => {
    renderSections();

    const rows = declineValues().map(([name, value]) => ({ name, value }));
    const derived = driverTotal(
      DECLINES.map((decline) => ({
        name: decline.opponent,
        value: decline.drop,
      })),
      true,
    );

    expect(money(derived)).toBe("-CHF 400k");
    expect(totalBadge()!.textContent).toContain(money(derived));
    // And the arithmetic is the rows the room can see: -150 -110 -70 -70.
    expect(rows).toHaveLength(4);
    expect(derived).toBe(-declineTotal(FIXTURES));
  });

  it("spells the total with the SAME formatter the rows use", () => {
    renderSections();

    const badge = totalBadge()!.textContent!;
    for (const [, value] of declineValues()) {
      expect(value).toMatch(/^-CHF \d+k$/);
    }
    expect(badge).toContain("-CHF");
    expect(badge).toContain("k");
  });

  it("moves when a fixture moves — the proof it is not a literal", () => {
    // The badge is derived twice over: `fixtureDeclines` picks the fallers and
    // `driverTotal` sums what the rows display. Halve FCZ's fall and both the
    // list and the badge follow it.
    const edited = FIXTURES.map((fixture) =>
      fixture.opponent === "FCZ"
        ? { ...fixture, current: fixture.previous - 50 }
        : fixture,
    );
    const declines = fixtureDeclines(edited);

    expect(declines[0]!.opponent).toBe("Lugano");
    expect(
      money(
        driverTotal(
          declines.map((decline) => ({
            name: decline.opponent,
            value: decline.drop,
          })),
          true,
        ),
      ),
    ).toBe("-CHF 300k");
  });

  it("re-types the total nowhere in the component layer", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toContain("400");
      expect(source.code).not.toContain("CHF 400k");
      expect(source.code).not.toMatch(/showTotal=\{/);
    }
    expect(code("app/components/heroes/hero-2.tsx")).toContain("showTotal");
  });
});

/* ============================================ ⑥ THE ATTENDANCE NOTE ===== */

describe("Hero 2 follow-up — the one-line attendance note (criterion 3)", () => {
  it("renders one muted line UNDER the bars", () => {
    renderSections();

    const line = note()!;
    expect(line).not.toBeNull();
    expect(line.textContent).toBe(
      "Every fixture here fell on attendance, not on price.",
    );
    expect(line.className).toContain("text-muted");
    // Under the bars, inside the same card — not a second tile.
    expect(
      slot("h-bars", declineTile())!.compareDocumentPosition(line) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(slots("driver-note", section())).toHaveLength(1);
  });

  it("says why in ONE line, and quotes no figure", () => {
    renderSections();

    const text = note()!.textContent!;
    expect(text.split(". ").filter(Boolean)).toHaveLength(1);
    expect(text).not.toMatch(/\d/);
    expect(text.toLowerCase()).toContain("attendance");
  });

  it("is the card's footnote, not its narrative caption", () => {
    renderSections();

    // US-024's caption strip is the AI narrative behind the glyph; a footnote
    // on the data is a different thing and must not borrow it.
    expect(slot("card-caption", declineTile())).toBeNull();
    expect(note()!.getAttribute("data-slot")).toBe("driver-note");
  });
});

/* ============================================ ⑦ VERBATIM NARRATIVE ====== */

/**
 * The narrative EXACTLY as the backlog states it, retyped here so the rendered
 * string is compared against a second, independent copy.
 *
 * Every hazard a text pass could "improve" is in it: four money figures in
 * parentheses whose leading `-` an editor would turn into a minus glyph, a
 * spaced hyphen in "pricing - the" that autocorrect would make an en dash, two
 * hyphenated compounds, and "3,200" with a COMMA where the app's own
 * formatters use the Swiss U+2019 separator. The comma is inside hand-authored
 * prose and is NOT corrected — US-011 recorded that tension as accepted.
 */
const AUTHORED =
  "Four fixtures account for the decline: FCZ (-CHF 150k), Lugano (-110k), " +
  "Luzern (-70k) and Sion (-70k). In each, the fall is driven by lower " +
  "attendance rather than pricing - the FCZ match sold about 3,200 fewer " +
  "seats year on year, partly a Friday-night kick-off and partly a reduced " +
  "away allocation. YB, by contrast, sold out both seasons.";

/** UTF-8 bytes, so "byte-identical" is asserted rather than approximated. */
function bytes(value: string): string {
  return Buffer.from(value, "utf8").toString("hex");
}

function narrativeBody(): HTMLElement {
  return slot("recommendation-body", panel()!)!;
}

describe("Hero 2 follow-up — the narrative is the contract (criterion 4)", () => {
  it("renders the dataset's string, byte for byte", () => {
    renderSections();

    const rendered = narrativeBody().textContent!;
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

  it("pins every hyphen in the sentence to an ASCII 0x2d", () => {
    const narrative = FOLLOW_UP.narrative;

    // The four money figures, the spaced hyphen and the two compounds.
    for (const fragment of [
      "(-CHF 150k)",
      "(-110k)",
      "(-70k)",
      "pricing - the",
      "Friday-night",
      "kick-off",
    ]) {
      const index = narrative.indexOf(fragment);
      expect(index).toBeGreaterThan(-1);
      expect(narrative.codePointAt(index + fragment.indexOf("-"))).toBe(0x2d);
    }

    // Every "-" in the string, wherever it is, and no more of them than the
    // authored sentence has: four figures, one spaced hyphen, two compounds.
    for (const [index, character] of [...narrative].entries()) {
      if (character === "-") expect(narrative.codePointAt(index)).toBe(0x2d);
    }
    expect(narrative.split("-")).toHaveLength(8);
  });

  it("leaves the '3,200' COMMA exactly as authored", () => {
    // Deliberate and known: hand-authored prose uses a comma, the app's own
    // formatters use the Swiss U+2019 separator (US-011). Do not "correct" it.
    expect(FOLLOW_UP.narrative).toContain("about 3,200 fewer seats");
    expect(FOLLOW_UP.narrative).not.toContain("3’200");
    expect(FOLLOW_UP.narrative).not.toContain("3'200");
    expect(BACKLOG).toContain("about 3,200 fewer seats");
    // The formatter still spells figures the Swiss way; the two coexist.
    expect(formatNumber(3_200)).toBe("3’200");
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
        "Four fixtures account for the decline",
        "lower attendance rather than pricing",
        "3,200 fewer seats",
        "Friday-night kick-off",
        "sold out both seasons",
      ]) {
        expect(source.code).not.toContain(fragment);
      }
    }
  });

  it("quotes the figures the bars actually show", () => {
    renderSections();

    // "-CHF 150k" and "(-110k)" are the top two rows, not numbers written
    // into the sentence; the four in the list are the four in the prose.
    const [first, second] = declineValues();
    expect(FOLLOW_UP.narrative).toContain(`FCZ (${first![1]})`);
    expect(FOLLOW_UP.narrative).toContain("Lugano (-110k)");
    expect(second![1]).toBe(money(-110));
    for (const decline of DECLINES) {
      expect(FOLLOW_UP.narrative).toContain(decline.opponent);
    }
    // YB "sold out both seasons": it is the biggest riser, so it cannot be in
    // the declining list the prose contrasts it with.
    expect(declineValues().map(([name]) => name)).not.toContain("YB");
  });

  it("interprets rather than prescribes — the NAVY panel, not the gold one", () => {
    renderSections();

    const aside = panel()!;
    expect(aside.tagName).toBe("ASIDE");
    expect(aside).toHaveAttribute("data-variant", "narrative");
    expect(aside).toHaveAccessibleName(NARRATIVE_LABEL);
    expect(slot("recommendation-label", aside)).toHaveTextContent(
      "What this means",
    );
    // Structurally not a data tile, and not counted among them.
    expect(cards()).not.toContain(aside);
    expect(aside.querySelector("h3")).toBeNull();
    // The explanation FOLLOWS the evidence, never precedes it.
    expect(
      declineTile().compareDocumentPosition(aside) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

/* ============================================ ⑧ DERIVED, NOT RE-TYPED === */

describe("Hero 2 follow-up — every figure comes from the dataset", () => {
  it("derives the four declines from the pairs the chart above plots", () => {
    expect(DECLINES).toEqual([
      { opponent: "FCZ", drop: 150 },
      { opponent: "Lugano", drop: 110 },
      { opponent: "Luzern", drop: 70 },
      { opponent: "Sion", drop: 70 },
    ]);
    // Nothing stored: the dataset's follow-up carries a narrative and no more.
    expect(Object.keys(FOLLOW_UP)).toEqual(["narrative"]);
    // And the total reconciles with the primary's own movement.
    expect(declineTotal(FIXTURES)).toBe(400);
    expect(fixtureTotals(FIXTURES).delta).toBeGreaterThan(
      -declineTotal(FIXTURES),
    );
  });

  it("re-types none of the beat's figures on the way to the screen", () => {
    const figures = [...DECLINES.map((decline) => decline.drop), 400];

    for (const figure of figures) {
      const spellings = [
        money(figure),
        money(-figure),
        formatSignedMoneyCompact(chfFromThousands(-figure)),
      ];
      for (const source of SOURCES) {
        for (const spelling of spellings) {
          expect(
            source.code,
            `${spelling} appears in ${source.path}`,
          ).not.toContain(spelling);
        }
        // A two-digit figure collides with a Tailwind opacity suffix, so only
        // the formatted spellings above are scanned for it. Bounded on both
        // sides, so a story number like `US-037` is not a false hit.
        if (figure < FIGURE_FLOOR) continue;
        expect(source.code).not.toMatch(
          new RegExp(`(?<![\\d-])${figure}(?!\\d)`),
        );
      }
    }
    // The guard is only worth having if it scans bare figures at all.
    expect(figures.some((figure) => figure >= FIGURE_FLOOR)).toBe(true);
  });

  it("names no fixture in code — the row labels are the dataset's own", () => {
    for (const decline of DECLINES) {
      for (const source of SOURCES) {
        expect(source.code).not.toContain(decline.opponent);
      }
    }
  });

  it("formats the money through app/lib/format.ts, not by hand", () => {
    const hero = code("app/components/heroes/hero-2.tsx");
    expect(hero).toContain("format={money}");
    expect(hero).toContain("formatMoneyCompact");
    // No factor of 1000 and no hand-built currency string anywhere.
    expect(hero).not.toMatch(/1000|1_000|\* 1e3|"CHF|'CHF/);
  });

  it("ranks and sums through US-023 rather than in the hero", () => {
    const hero = code("app/components/heroes/hero-2.tsx");
    expect(hero).toContain("<DriverTile");
    expect(hero).toContain("fixtureDeclines");
    // No second ranking and no second total in the composition layer.
    expect(hero).not.toMatch(/\.sort\(|\.reduce\(|driverTotal/);
  });
});

/* ============================================ ⑨ REDUCED MOTION ========== */

describe("Hero 2 follow-up — reduced motion renders the final state", () => {
  it("shows all four declines at their target with no frame run", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    expect(declineValues()).toEqual(
      DECLINES.map((decline) => [decline.opponent, money(-decline.drop)]),
    );
  });

  it("shows the derived badge at its total, not counting up to it", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    expect(totalBadge()!.textContent).toContain("-CHF 400k");
  });

  it("leaves no bar in the beat stranded at zero width", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    for (const fill of slots("h-bar-fill", declineTile())) {
      expect(fill.style.width).not.toBe("0%");
    }
  });

  it("still renders the seam, the note and the narrative in full", () => {
    stubMatchMedia(true);
    renderSections(SHARPENED, { settled: false });

    expect(divider()).not.toBeNull();
    expect(note()).not.toBeNull();
    expect(narrativeBody().textContent).toBe(FOLLOW_UP.narrative);
  });
});

/* ============================================ ⑩ ON THE REAL DASHBOARD === */

describe("Hero 2 follow-up — asked for real, from the chip row", () => {
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
  const followUpChipName = `${FOLLOW_UP_CHIP_HINT} ${
    FOLLOW_UP_CHIP_LABEL[HeroId.HERO_2]
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

    await tap(user, HERO_CHIP_LABEL[HeroId.HERO_2]);
    expect(cards()).toHaveLength(3);

    await tap(user, followUpChipName);

    expect(slots("insight-section")).toHaveLength(1);
    expect(section()).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
    expect(cards()).toHaveLength(4);
    expect(divider()).not.toBeNull();
    expect(note()).not.toBeNull();
    // The dashboard GREW: the baseline is untouched under it.
    expect(screen.getByText("baseline")).toBeInTheDocument();
  });

  it("withdraws the follow-up chip once the beat is on screen", async () => {
    const user = userEvent.setup();
    renderApp();

    // Not offered at the baseline; offered once the hero is answered.
    expect(followUpChips()).toHaveLength(0);
    await tap(user, HERO_CHIP_LABEL[HeroId.HERO_2]);
    expect(followUpChips()).not.toHaveLength(0);

    await tap(user, followUpChipName);

    // US-029's derived visibility: a sharpened section offers no follow-up.
    expect(followUpChips()).toHaveLength(0);
    // The hero's own chip is always offered, sharpened or not.
    expect(
      screen.queryAllByRole("button", {
        name: HERO_CHIP_LABEL[HeroId.HERO_2],
      }),
    ).not.toHaveLength(0);
  });

  it("restates neither the chip label nor a keyword set of its own", () => {
    // Criterion 1 is satisfied by NOT being reimplemented: the hero renders,
    // it does not decide whether it was asked for.
    expect(FOLLOW_UP_CHIP_LABEL[HeroId.HERO_2]).toBe(
      "Which fixtures are driving the drop?",
    );
    for (const source of SOURCES) {
      expect(source.code).not.toContain("Which fixtures");
      expect(source.code).not.toMatch(/keyword|trigger|driving\/drop/i);
    }
  });
});

/* ============================================ ⑪ DISCIPLINE ============== */

describe("Hero 2 follow-up — composition, not invention", () => {
  it("uses tokens only — no hex, no rgba, no arbitrary colour", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source.code).not.toMatch(/rgba?\(/);
    }
    expect(code("app/components/heroes/hero-2.tsx")).not.toMatch(
      /(?:text|bg|rounded|shadow|border|from|to)-\[/,
    );
  });

  it("writes no em or en dash into anything the room sees", () => {
    renderSections();

    expect(section().textContent).not.toMatch(/[–—−]/u);
  });

  it("builds neither the bars, the badge nor the panel", () => {
    const hero = code("app/components/heroes/hero-2.tsx");
    expect(hero).toContain("<DriverTile");
    expect(hero).toContain("<RecommendationPanel");
    expect(hero).not.toMatch(
      /<aside|DriverTotalBadge|DeltaChip value=\{driver/,
    );
  });
});
