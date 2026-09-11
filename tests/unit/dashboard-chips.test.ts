/**
 * US-029 — the chip row as a PURE FUNCTION of the session list.
 *
 * The whole of the chip lifecycle lives in `suggestionChips`, and this suite
 * exists to prove that claim rather than assert it in a comment. Three things
 * are driven here, none of which needs a rendered component:
 *
 *   ① The three hero chips are always derived, in `HERO_IDS` order, with the
 *     labels exactly as authored (criteria 1 and 4).
 *   ② A follow-up chip is visible EXACTLY when its hero has a section AND that
 *     section is still at `PRIMARY` — asserted over every one of the 27
 *     combinations three heroes × {absent, primary, withFollowUp} can be in
 *     (criterion 3).
 *   ③ A chip resolves DIRECTLY to its hero (criterion 2): `selectChip` takes a
 *     chip, not a string, and calls one dashboard action and nothing else.
 *     There is no scoring vocabulary in the module at all — a source scan says
 *     so, so US-030's matcher cannot quietly become part of this path.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  ChipKind,
  chipKey,
  FOLLOW_UP_CHIP_LABEL_KEY,
  HERO_CHIP_LABEL_KEY,
  HERO_CHIPS,
  selectChip,
  suggestionChips,
  type SuggestionChip,
} from "../../app/lib/dashboard/chips";
import {
  BASELINE_SECTIONS,
  InsightPhase,
  type InsightSection,
  type InsightSections,
  NO_SECTIONS,
  withBaselineRestored,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import { HERO_IDS, HeroId } from "../../app/lib/repositories/enums";
import { de, t } from "./support/i18n";

/**
 * The module's source with comments stripped. Several checks below are about
 * what the code may NOT contain, and the doc comment legitimately names
 * scoring, normalising and thresholds while explaining why none of them is in
 * this path.
 */
const CHIPS_CODE = readFileSync(
  resolve(process.cwd(), "app/lib/dashboard/chips.ts"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

function labels(sections: InsightSections): string[] {
  return suggestionChips(sections).map((chip) => t(chip.labelKey));
}

function heroLabels(): string[] {
  return HERO_IDS.map((heroId) => t(HERO_CHIP_LABEL_KEY[heroId]));
}

function section(
  heroId: HeroId,
  phase: InsightPhase,
  revision = 0,
): InsightSection {
  return { heroId, phase, revision };
}

/* ------------------------------------------------------ THE THREE CHIPS -- */

describe("suggestionChips — the three hero chips", () => {
  it("derives exactly three chips at the baseline, which is the load state", () => {
    const chips = suggestionChips(BASELINE_SECTIONS);

    expect(chips).toHaveLength(3);
    expect(chips.every((chip) => chip.kind === ChipKind.HERO)).toBe(true);
  });

  it("shows the three hero prompts verbatim, in HERO_IDS order", () => {
    expect(labels(NO_SECTIONS)).toEqual([
      "Shirt sales by kit & sponsor badges",
      "Ticket revenue, this year vs last",
      "Department budgets vs actuals",
    ]);
    expect(labels(NO_SECTIONS)).toEqual(heroLabels());
  });

  it("maps each chip to the hero it means", () => {
    expect(suggestionChips(NO_SECTIONS).map((chip) => chip.heroId)).toEqual([
      HeroId.HERO_1,
      HeroId.HERO_2,
      HeroId.HERO_3,
    ]);
  });

  it("keeps the three hero chips through every state of the session", () => {
    // Criterion 4, stated as an invariant: whatever is on the canvas, the
    // prepared questions are still offered.
    let sections: InsightSections = NO_SECTIONS;

    for (const heroId of HERO_IDS) {
      sections = withHeroShown(sections, heroId);
      expect(labels(sections).slice(0, 3)).toEqual(heroLabels());

      sections = withFollowUpShown(sections, heroId);
      expect(labels(sections).slice(0, 3)).toEqual(heroLabels());
    }

    expect(labels(withBaselineRestored(sections))).toEqual(heroLabels());
  });

  it("offers a stable hero-chip value rather than rebuilding one per call", () => {
    expect(HERO_CHIPS).toHaveLength(3);
    expect(suggestionChips(NO_SECTIONS).slice(0, 3)).toEqual([...HERO_CHIPS]);
    expect(Object.isFrozen(HERO_CHIPS)).toBe(true);
  });
});

/* ------------------------------------------------- THE FOLLOW-UP LIFECYCLE -- */

describe("suggestionChips — the follow-up chip lifecycle", () => {
  it("adds a hero's follow-up chip once that hero has rendered", () => {
    const sections = withHeroShown(NO_SECTIONS, HeroId.HERO_1);
    const chips = suggestionChips(sections);

    expect(chips).toHaveLength(4);
    expect(chips[3]).toEqual({
      heroId: HeroId.HERO_1,
      kind: ChipKind.FOLLOW_UP,
      labelKey: FOLLOW_UP_CHIP_LABEL_KEY[HeroId.HERO_1],
    });
    expect(t(chips[3]!.labelKey)).toBe("Which badge should we push next?");
    expect(de(chips[3]!.labelKey)).toBe(
      "Welches Badge sollen wir als Nächstes pushen?",
    );
  });

  it("removes that chip once the follow-up has been shown", () => {
    const primary = withHeroShown(NO_SECTIONS, HeroId.HERO_1);
    const sharpened = withFollowUpShown(primary, HeroId.HERO_1);

    expect(labels(primary)).toHaveLength(4);
    expect(labels(sharpened)).toEqual(heroLabels());
  });

  it("shows the three follow-up prompts verbatim", () => {
    for (const heroId of HERO_IDS) {
      const chips = suggestionChips([section(heroId, InsightPhase.PRIMARY)]);

      expect(t(chips[3]!.labelKey)).toBe(t(FOLLOW_UP_CHIP_LABEL_KEY[heroId]));
    }

    expect(
      HERO_IDS.map((heroId) => t(FOLLOW_UP_CHIP_LABEL_KEY[heroId])),
    ).toEqual([
      "Which badge should we push next?",
      "Which fixtures are driving the drop?",
      "Why is Marketing over budget & behind target?",
    ]);
  });

  it("offers follow-ups in the order the questions were asked", () => {
    const sections = withHeroShown(
      withHeroShown(NO_SECTIONS, HeroId.HERO_3),
      HeroId.HERO_1,
    );

    expect(labels(sections)).toEqual([
      ...heroLabels(),
      t(FOLLOW_UP_CHIP_LABEL_KEY[HeroId.HERO_3]),
      t(FOLLOW_UP_CHIP_LABEL_KEY[HeroId.HERO_1]),
    ]);
  });

  it("touches only the chip of the hero whose follow-up was shown", () => {
    const both = withHeroShown(
      withHeroShown(NO_SECTIONS, HeroId.HERO_1),
      HeroId.HERO_2,
    );

    expect(labels(withFollowUpShown(both, HeroId.HERO_1))).toEqual([
      ...heroLabels(),
      t(FOLLOW_UP_CHIP_LABEL_KEY[HeroId.HERO_2]),
    ]);
  });

  it("ignores the revision counter — a re-ask does not change the row", () => {
    const asked = withHeroShown(NO_SECTIONS, HeroId.HERO_2);
    const reasked = withHeroShown(asked, HeroId.HERO_2);

    expect(reasked[0]?.revision).toBe(1);
    expect(labels(reasked)).toEqual(labels(asked));
  });

  it("is visible EXACTLY when the section exists and is still primary", () => {
    // All 27 combinations of three heroes × {absent, primary, withFollowUp}.
    // The visibility rule is one line of code; this is the whole truth table.
    const states = [null, InsightPhase.PRIMARY, InsightPhase.WITH_FOLLOW_UP];

    for (const first of states) {
      for (const second of states) {
        for (const third of states) {
          const phases = [first, second, third];
          const sections = HERO_IDS.flatMap((heroId, index) => {
            const phase = phases[index]!;
            return phase === null ? [] : [section(heroId, phase)];
          });

          const expected = HERO_IDS.filter(
            (_, index) => phases[index] === InsightPhase.PRIMARY,
          ).map((heroId) => t(FOLLOW_UP_CHIP_LABEL_KEY[heroId]));

          expect(labels(sections)).toEqual([...heroLabels(), ...expected]);
        }
      }
    }
  });
});

/* -------------------------------------------------------------- PURITY -- */

describe("suggestionChips — it is a pure function, not state", () => {
  it("returns the same row for the same session, every time", () => {
    const sections = withHeroShown(NO_SECTIONS, HeroId.HERO_1);

    expect(suggestionChips(sections)).toEqual(suggestionChips(sections));
    // Order of calls cannot matter: there is nothing to accumulate.
    expect(suggestionChips(NO_SECTIONS)).toEqual(suggestionChips(NO_SECTIONS));
    expect(suggestionChips(sections)).not.toEqual(suggestionChips(NO_SECTIONS));
  });

  it("never mutates the session it is given", () => {
    const sections: InsightSections = [
      section(HeroId.HERO_1, InsightPhase.PRIMARY),
      section(HeroId.HERO_2, InsightPhase.WITH_FOLLOW_UP, 2),
    ];
    const before = structuredClone(sections);

    suggestionChips(sections);

    expect(sections).toEqual(before);
  });

  it("returns a fresh array, so a caller cannot corrupt the next row", () => {
    const first = suggestionChips(NO_SECTIONS) as SuggestionChip[];
    first.pop();

    expect(suggestionChips(NO_SECTIONS)).toHaveLength(3);
  });

  it("holds no state of its own — the module declares no mutable binding", () => {
    expect(CHIPS_CODE).not.toMatch(/\blet\b|\bvar\b/);
    expect(CHIPS_CODE).not.toMatch(/useState|useRef|useMemo/);
  });

  it("keys a chip by hero and kind, so both chips of one hero can coexist", () => {
    const chips = suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_1));
    const keys = chips.map(chipKey);

    expect(new Set(keys).size).toBe(chips.length);
    expect(keys).toContain(`${HeroId.HERO_1}#${ChipKind.HERO}`);
    expect(keys).toContain(`${HeroId.HERO_1}#${ChipKind.FOLLOW_UP}`);
  });
});

/* ------------------------------------------- DIRECT RESOLUTION, NO SCORING -- */

describe("selectChip — a tap resolves directly to its mapped intent", () => {
  function actions() {
    return { showHero: vi.fn(), showFollowUp: vi.fn() };
  }

  it("calls showHero for a hero chip, and nothing else", () => {
    const spies = actions();

    for (const chip of HERO_CHIPS) {
      selectChip(chip, spies);
    }

    expect(spies.showHero.mock.calls).toEqual([
      [HeroId.HERO_1],
      [HeroId.HERO_2],
      [HeroId.HERO_3],
    ]);
    expect(spies.showFollowUp).not.toHaveBeenCalled();
  });

  it("calls showFollowUp for a follow-up chip, and nothing else", () => {
    const spies = actions();
    const sections = withHeroShown(NO_SECTIONS, HeroId.HERO_2);
    const followUp = suggestionChips(sections)[3]!;

    selectChip(followUp, spies);

    expect(spies.showFollowUp.mock.calls).toEqual([[HeroId.HERO_2]]);
    expect(spies.showHero).not.toHaveBeenCalled();
  });

  it("resolves the chip's own hero — never a re-derived or scored one", () => {
    const spies = actions();

    selectChip(
      {
        heroId: HeroId.HERO_3,
        kind: ChipKind.HERO,
        labelKey: HERO_CHIP_LABEL_KEY[HeroId.HERO_1],
      },
      spies,
    );

    // The LABEL is decoration; the heroId is the intent. A chip whose label
    // says nothing recognisable still resolves to Hero 3.
    expect(spies.showHero).toHaveBeenCalledWith(HeroId.HERO_3);
  });

  it("takes a chip and not a question string, so no matcher can be reached", () => {
    const spies = actions();

    // @ts-expect-error — a typed question is US-030's `onSubmit` path, and it
    // must not typecheck here. This line fails `pnpm typecheck` the moment the
    // chip argument loosens to `string`.
    selectChip("shirt sales by kit", spies);

    expect(spies.showHero).not.toHaveBeenCalledWith("shirt sales by kit");
  });

  it("contains no scoring vocabulary anywhere in the module", () => {
    // US-030 builds normalise → score → threshold → tie-break for TYPED text.
    // None of it may appear in the chip path, in this story or a later one.
    expect(CHIPS_CODE).not.toMatch(
      /score|threshold|keyword|normalis|normaliz|tie-?break|toLowerCase/i,
    );
  });
});

/* ---------------------------------------------------------- ENUM REUSE -- */

describe("the chip module reuses the shared hero enum", () => {
  it("imports HeroId and HERO_IDS instead of declaring a competing id set", () => {
    expect(CHIPS_CODE).toMatch(
      /import \{ HERO_IDS, HeroId \} from "\.\.\/repositories\/enums"/,
    );
  });

  it("contains no hero id literal at all — the enum is the only source", () => {
    for (const heroId of Object.values(HeroId)) {
      expect(CHIPS_CODE).not.toContain(`"${heroId}"`);
    }
  });

  it("reads the phase from the shared InsightPhase, not a literal", () => {
    expect(CHIPS_CODE).toMatch(/InsightPhase\.PRIMARY/);
    expect(CHIPS_CODE).not.toContain('"primary"');
    expect(CHIPS_CODE).not.toContain('"withFollowUp"');
  });

  it("labels every hero, so a fourth hero cannot ship without its chips", () => {
    for (const heroId of HERO_IDS) {
      expect(t(HERO_CHIP_LABEL_KEY[heroId])).toBeTruthy();
      expect(t(FOLLOW_UP_CHIP_LABEL_KEY[heroId])).toBeTruthy();
    }
    expect(Object.keys(HERO_CHIP_LABEL_KEY)).toHaveLength(HERO_IDS.length);
    expect(Object.keys(FOLLOW_UP_CHIP_LABEL_KEY)).toHaveLength(HERO_IDS.length);
  });
});

/* ---------------------------------------------------------------- COPY -- */

describe("chip labels — rendered verbatim, so the strings are the contract", () => {
  // Both languages: the rules below (no em dash, sentence case, length) are
  // properties of the COPY, so the German pass has to satisfy them too.
  const every = [
    ...Object.values(HERO_CHIP_LABEL_KEY).map((key) => t(key)),
    ...Object.values(FOLLOW_UP_CHIP_LABEL_KEY).map((key) => t(key)),
    ...Object.values(HERO_CHIP_LABEL_KEY).map((key) => de(key)),
    ...Object.values(FOLLOW_UP_CHIP_LABEL_KEY).map((key) => de(key)),
  ];

  it("uses no em or en dash anywhere", () => {
    for (const label of every) {
      expect(label).not.toMatch(/[–—]/);
    }
  });

  it("carries no leading, trailing or doubled whitespace to trim away", () => {
    for (const label of every) {
      expect(label).toBe(label.trim());
      expect(label).not.toMatch(/\s{2,}/);
    }
  });
});
