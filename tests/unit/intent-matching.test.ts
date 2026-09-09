/**
 * US-030 — INTENT NORMALISATION, SCORING AND TIE-BREAKING.
 *
 * This is the highest-risk story in the build and its acceptance is
 * qualitative: "resolves the intended hero across several paraphrases" is
 * judged, not asserted. So THIS SUITE IS THE DELIVERABLE as much as the module
 * is. It does not describe the matcher's behaviour, it pins it — input by
 * input, score by score — because the live moment it protects (the owner typing
 * their own wording in front of the room) has no second take.
 *
 * What is driven here:
 *
 *   ① `normaliseQuestion` — case, the exact punctuation set, collapsed
 *     whitespace, the space padding, and `"25/26"` → `"2526"`.
 *   ② The static config — six intents, the order that IS the tie-break, the
 *     per-kind threshold and parent-gating flag, keywords in normalised shape.
 *   ③ FAITHFULNESS TO THE APPROVED REFERENCE — an oracle re-implementation of
 *     the reference formula (including the redundant disjunct the module
 *     collapses) is asserted to agree on every input in the corpus, for both
 *     the score and the winner.
 *   ④ Paraphrase tolerance — eight or more phrasings per hero, including the
 *     three the acceptance criteria name.
 *   ⑤ The three canonical prompts, WITH THEIR MARGIN over their own follow-up.
 *   ⑥ The three follow-up phrasings, including the loose "why is marketing
 *     high?" edge case the spec calls out (exactly 3 = the threshold).
 *   ⑦ Threshold boundaries — exactly 2 matches a hero, exactly 2 does NOT match
 *     a follow-up, exactly 3 does.
 *   ⑧ Deterministic tie-break, including a three-way tie, and the invariant
 *     that ONE input never yields two intents.
 *   ⑨ Off-script input, "sales" alone, and an XSS payload.
 *   ⑩ The two documented over-matches (prefix, substring), pinned as the
 *     CURRENT CONTRACT — see the block above them.
 *   ⑪ No dependency, no `fetch`, no model call: a source scan.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  ChipKind,
  FOLLOW_UP_CHIP_LABEL,
  HERO_CHIP_LABEL,
} from "../../app/lib/dashboard/chips";
import {
  askQuestion,
  INTENT_REQUIRES_PARENT,
  INTENT_THRESHOLD,
  INTENTS,
  type IntentDefinition,
  matchIntent,
  normaliseQuestion,
  scoreIntent,
  STRONG_KEYWORD_SCORE,
  WEAK_KEYWORD_SCORE,
} from "../../app/lib/dashboard/intents";
import { HERO_IDS, HeroId } from "../../app/lib/repositories/enums";

/** The module's source, comments stripped — several checks are about absence. */
const INTENTS_CODE = readFileSync(
  resolve(process.cwd(), "app/lib/dashboard/intents.ts"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const PACKAGE_JSON = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

/* ------------------------------------------------------------- HELPERS -- */

/** The intent definition for one hero and one half of it. */
function intent(heroId: HeroId, kind: ChipKind): IntentDefinition {
  const found = INTENTS.find(
    (candidate) => candidate.heroId === heroId && candidate.kind === kind,
  );
  expect(found).toBeDefined();
  return found!;
}

const hero = (heroId: HeroId) => intent(heroId, ChipKind.HERO);
const follow = (heroId: HeroId) => intent(heroId, ChipKind.FOLLOW_UP);

/** A hero's primary answer, as a match. */
function heroMatch(heroId: HeroId) {
  return { heroId, kind: ChipKind.HERO };
}

/** A hero's follow-up, as a match. */
function followMatch(heroId: HeroId) {
  return { heroId, kind: ChipKind.FOLLOW_UP };
}

/**
 * Every phrasing exercised anywhere in this suite, in one list.
 *
 * It is the corpus the reference-faithfulness oracle and the
 * "never two intents" invariant sweep, so a phrasing added to any test below
 * should be added here too — the two properties then cover it for free.
 */
const CORPUS: readonly string[] = [
  ...Object.values(HERO_CHIP_LABEL),
  ...Object.values(FOLLOW_UP_CHIP_LABEL),
  "kit sales",
  "how are shirts selling",
  "trikot",
  "shirt",
  "shirts",
  "kit",
  "kits",
  "jersey",
  "jerseys sold",
  "trikot sales",
  "kit-sales",
  "shirt sale numbers",
  "how many jerseys did we sell",
  "kit revenue split home away",
  "whats the trikot split",
  "how are shirt sales split between home, away and third kits?",
  "don't know about shirts",
  "SHIRT SALES!!!",
  "  shirt   sales  ",
  "are shirt sales up? yes!",
  "name printed",
  "names",
  "ticket",
  "tickets",
  "gate",
  "gate revenue",
  "matchday",
  "ticket money last year vs this year",
  "how much gate revenue did we take",
  "matchday income compared to last season",
  "how does ticket revenue this season compare to 25/26?",
  "25/26 tickets",
  "fcz match",
  "budget",
  "budgets",
  "actuals",
  "department spend",
  "are we on budget",
  "over budget",
  "over target",
  "department performance vs target",
  "actual vs budget by department",
  "how are departments tracking against budget?",
  "marketing",
  "why is marketing high?",
  "why marketing",
  "explain marketing",
  "marketing why",
  "why is marketing over",
  "badge",
  "sponsor",
  "which badge",
  "which badge next",
  "badge sponsor",
  "what should we promote",
  "fixtures",
  "matches",
  "which fixtures",
  "which matches are lower",
  "why the decline",
  "why is the drop",
  "kit gate",
  "trikot budget",
  "ticket budget",
  "shirt ticket budget",
  "budgets marketing why",
  "which fixtures matchday",
  "kit sales and department budgets",
  "shirt sales and ticket revenue",
  "sales",
  "the difference",
  "kitchen",
  "How is the kitchen doing?",
  "gateway",
  "gateway timeout",
  "overall performance",
  "recover the nameplate",
  "nameplate",
  "overall",
  "recover",
  "show me player injuries",
  "who is our best player",
  "asdkjhasd",
  "qwertyuiop",
  "!!!",
  "",
  "   ",
  '<img src=x onerror="alert(1)">',
];

/* ----------------------------------------------------------- NORMALISE -- */

describe("normaliseQuestion — criterion 1", () => {
  it("lowercases the question", () => {
    expect(normaliseQuestion("SHIRT Sales")).toBe(" shirt sales ");
  });

  it("strips every character in the punctuation set /.,?!'\"()", () => {
    // The exact set the reference removes, one character at a time.
    for (const mark of ["/", ".", ",", "?", "!", "'", '"', "(", ")"]) {
      expect(normaliseQuestion(`kit${mark}sales`)).toBe(" kitsales ");
    }
  });

  it("leaves every other character alone — the set is closed", () => {
    // `&`, `-`, `%` and `:` survive, which is why a keyword hit only ever needs
    // the run of letters BEFORE them. `kit-sales` still scores as `kit`.
    expect(normaliseQuestion("Kit-sales & co: 50%")).toBe(
      " kit-sales & co: 50% ",
    );
  });

  it("collapses any run of whitespace to a single space", () => {
    expect(normaliseQuestion("shirt    sales")).toBe(" shirt sales ");
    expect(normaliseQuestion("shirt\tsales\n\nnow")).toBe(" shirt sales now ");
  });

  it("trims the ends and then pads with exactly one space each side", () => {
    // Padding AFTER the trim is what lets a keyword test for a word start
    // without special-casing the first and last word of the question.
    expect(normaliseQuestion("   shirt sales   ")).toBe(" shirt sales ");
    expect(normaliseQuestion("shirt")).toBe(" shirt ");
  });

  it("turns 25/26 into 2526, which is the keyword the config carries", () => {
    expect(normaliseQuestion("season 25/26")).toBe(" season 2526 ");
    expect(normaliseQuestion("26/27")).toBe(" 2627 ");
    expect(scoreIntent("25/26", hero(HeroId.HERO_2))).toBe(WEAK_KEYWORD_SCORE);
  });

  it("normalises an empty or all-whitespace question to two spaces", () => {
    expect(normaliseQuestion("")).toBe("  ");
    expect(normaliseQuestion("     ")).toBe("  ");
    expect(normaliseQuestion("\t\n")).toBe("  ");
  });

  it("is idempotent on an already-normalised question", () => {
    const once = normaliseQuestion("How are SHIRTS selling?");
    expect(normaliseQuestion(once)).toBe(once);
  });

  it("never mutates its argument and holds no state between calls", () => {
    const question = "Shirt Sales?";
    expect(normaliseQuestion(question)).toBe(normaliseQuestion(question));
    expect(question).toBe("Shirt Sales?");
  });
});

/* -------------------------------------------------------------- CONFIG -- */

describe("the intent config — criterion 7", () => {
  it("holds six definitions: three heroes and their three follow-ups", () => {
    expect(INTENTS).toHaveLength(6);
    expect(INTENTS.map((definition) => definition.heroId)).toEqual([
      ...HERO_IDS,
      ...HERO_IDS,
    ]);
    expect(INTENTS.map((definition) => definition.kind)).toEqual([
      ChipKind.HERO,
      ChipKind.HERO,
      ChipKind.HERO,
      ChipKind.FOLLOW_UP,
      ChipKind.FOLLOW_UP,
      ChipKind.FOLLOW_UP,
    ]);
  });

  it("carries the priority order criterion 4 fixes: heroes, then follow-ups", () => {
    const heroes = INTENTS.filter(
      (definition) => definition.kind === ChipKind.HERO,
    );
    const followUps = INTENTS.filter(
      (definition) => definition.kind === ChipKind.FOLLOW_UP,
    );

    // Every hero is listed before every follow-up, so no follow-up can take a
    // tie off a hero.
    expect(INTENTS.indexOf(heroes[heroes.length - 1]!)).toBeLessThan(
      INTENTS.indexOf(followUps[0]!),
    );
    expect(heroes.map((definition) => definition.heroId)).toEqual([
      ...HERO_IDS,
    ]);
  });

  it("maps every intent to a flow, a keyword set and a kind", () => {
    for (const definition of INTENTS) {
      expect(Object.values(HeroId)).toContain(definition.heroId);
      expect(Object.values(ChipKind)).toContain(definition.kind);
      expect(definition.strong.length).toBeGreaterThan(0);
      expect(definition.weak.length).toBeGreaterThan(0);
    }
  });

  it("holds the threshold per kind: 2 for a hero, 3 for a follow-up", () => {
    expect(INTENT_THRESHOLD[ChipKind.HERO]).toBe(2);
    expect(INTENT_THRESHOLD[ChipKind.FOLLOW_UP]).toBe(3);
    // A hero's bar is one strong keyword; a follow-up needs more than that.
    expect(INTENT_THRESHOLD[ChipKind.HERO]).toBe(STRONG_KEYWORD_SCORE);
    expect(INTENT_THRESHOLD[ChipKind.FOLLOW_UP]).toBeGreaterThan(
      INTENT_THRESHOLD[ChipKind.HERO],
    );
  });

  it("holds the parent-gating flag: only a follow-up needs its hero first", () => {
    expect(INTENT_REQUIRES_PARENT[ChipKind.HERO]).toBe(false);
    expect(INTENT_REQUIRES_PARENT[ChipKind.FOLLOW_UP]).toBe(true);
    // The flag is complete: every kind in the config has an answer, so US-033
    // cannot read `undefined` for one.
    for (const definition of INTENTS) {
      expect(typeof INTENT_REQUIRES_PARENT[definition.kind]).toBe("boolean");
    }
  });

  it("stores keywords in the shape normalisation produces", () => {
    // A keyword carrying punctuation, an upper-case letter or a doubled space
    // could never match anything, because the question has already been
    // stripped by the time it is tested. `2526` and not `25/26`.
    for (const definition of INTENTS) {
      for (const keyword of [...definition.strong, ...definition.weak]) {
        expect(normaliseQuestion(keyword)).toBe(` ${keyword} `);
      }
    }
  });

  it("lists no keyword twice within one intent, so no weight is doubled", () => {
    for (const definition of INTENTS) {
      const all = [...definition.strong, ...definition.weak];
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it("reuses the shared HeroId enum rather than a competing id set", () => {
    expect(INTENTS_CODE).toMatch(
      /import \{ HeroId \} from "\.\.\/repositories\/enums"/,
    );
    for (const heroId of Object.values(HeroId)) {
      expect(INTENTS_CODE).not.toContain(`"${heroId}"`);
    }
  });

  it("reuses US-029's ChipKind rather than restating hero/follow-up", () => {
    expect(INTENTS_CODE).toMatch(/import \{ ChipKind[^}]*\} from "\.\/chips"/);
    expect(INTENTS_CODE).not.toContain('"followUp"');
  });
});

/* ------------------------------------------- FAITHFULNESS TO THE REFERENCE -- */

describe("faithfulness to the approved reference algorithm", () => {
  /**
   * The reference formula, re-expressed here as an ORACLE.
   *
   * The user's decision for this story was "port faithfully, pin with tests",
   * so the port is checked against the formula rather than trusted. Note the
   * strong-keyword test keeps the reference's redundant disjunct
   * (`" k "` OR `" k"`, the first strictly subsumed by the second) that the
   * module collapses to one test — these assertions are what prove collapsing
   * it changed nothing.
   */
  function referenceScore(text: string, definition: IntentDefinition): number {
    const n =
      " " +
      text
        .toLowerCase()
        .replace(/[/.,?!'"()]/g, "")
        .replace(/\s+/g, " ")
        .trim() +
      " ";
    let score = 0;
    for (const k of definition.strong) {
      if (n.includes(" " + k + " ") || n.includes(" " + k)) score += 2;
    }
    for (const k of definition.weak) {
      if (n.includes(k)) score += 1;
    }
    return score;
  }

  function referenceMatch(text: string) {
    let best: IntentDefinition | null = null;
    let bestScore = 0;
    for (const definition of INTENTS) {
      const score = referenceScore(text, definition);
      const threshold = definition.kind === ChipKind.FOLLOW_UP ? 3 : 2;
      if (score >= threshold && score > bestScore) {
        best = definition;
        bestScore = score;
      }
    }
    return best === null ? null : { heroId: best.heroId, kind: best.kind };
  }

  it("scores identically to the reference on every input in the corpus", () => {
    for (const question of CORPUS) {
      for (const definition of INTENTS) {
        expect(scoreIntent(question, definition)).toBe(
          referenceScore(question, definition),
        );
      }
    }
  });

  it("picks the same winner as the reference on every input in the corpus", () => {
    for (const question of CORPUS) {
      expect(matchIntent(question)).toEqual(referenceMatch(question));
    }
  });
});

/* --------------------------------------------------------------- SCORE -- */

describe("scoreIntent — criterion 2", () => {
  it("adds 2 for a strong keyword and 1 for a weak one", () => {
    expect(STRONG_KEYWORD_SCORE).toBe(2);
    expect(WEAK_KEYWORD_SCORE).toBe(1);

    // "trikot" is strong for Hero 1 and matches nothing else in that intent.
    expect(scoreIntent("trikot", hero(HeroId.HERO_1))).toBe(
      STRONG_KEYWORD_SCORE,
    );
    // "sales" is weak for Hero 1 and matches nothing else.
    expect(scoreIntent("sales", hero(HeroId.HERO_1))).toBe(WEAK_KEYWORD_SCORE);
    // Together, the two weights add.
    expect(scoreIntent("trikot sales", hero(HeroId.HERO_1))).toBe(
      STRONG_KEYWORD_SCORE + WEAK_KEYWORD_SCORE,
    );
  });

  it("scores every strong keyword at 2 or more on its own intent", () => {
    // "or more" because the reference's keyword sets overlap by design:
    // "shirts" also contains "shirt", so it scores 4.
    for (const definition of INTENTS) {
      for (const keyword of definition.strong) {
        expect(scoreIntent(keyword, definition)).toBeGreaterThanOrEqual(
          STRONG_KEYWORD_SCORE,
        );
      }
    }
  });

  it("scores every weak keyword at 1 or more on its own intent", () => {
    for (const definition of INTENTS) {
      for (const keyword of definition.weak) {
        expect(scoreIntent(keyword, definition)).toBeGreaterThanOrEqual(
          WEAK_KEYWORD_SCORE,
        );
      }
    }
  });

  it("accumulates without a cap, so a full question outscores a terse one", () => {
    expect(scoreIntent("kit", hero(HeroId.HERO_1))).toBe(2);
    expect(scoreIntent("kit sales", hero(HeroId.HERO_1))).toBe(3);
    expect(
      scoreIntent(
        "How are shirt sales split between home, away and third kits?",
        hero(HeroId.HERO_1),
      ),
    ).toBe(11);
  });

  it("scores zero for a question with nothing of that intent in it", () => {
    for (const definition of INTENTS) {
      expect(scoreIntent("show me player injuries", definition)).toBe(0);
      expect(scoreIntent("", definition)).toBe(0);
    }
  });

  it("is unaffected by case, punctuation and spacing", () => {
    const expected = scoreIntent("shirt sales", hero(HeroId.HERO_1));

    expect(scoreIntent("SHIRT SALES!!!", hero(HeroId.HERO_1))).toBe(expected);
    expect(scoreIntent("  shirt   sales  ", hero(HeroId.HERO_1))).toBe(
      expected,
    );
    expect(scoreIntent("Shirt, sales.", hero(HeroId.HERO_1))).toBe(expected);
  });
});

/* ---------------------------------------------------------- PARAPHRASES -- */

describe("paraphrase tolerance — criterion 5", () => {
  /**
   * Several phrasings per hero, which is the whole of this story's qualitative
   * acceptance. The first three of Hero 1's are the ones the criterion names by
   * hand: "kit sales", "how are shirts selling", "trikot".
   */
  const PARAPHRASES: Record<HeroId, readonly string[]> = {
    [HeroId.HERO_1]: [
      "kit sales",
      "how are shirts selling",
      "trikot",
      "shirt sale numbers",
      "how many jerseys did we sell",
      "kit revenue split home away",
      "whats the trikot split",
      "How are shirt sales split between home, away and third kits?",
      "don't know about shirts",
      "SHIRT SALES!!!",
      "  shirt   sales  ",
      "are shirt sales up? yes!",
      "kit-sales",
      "kits",
    ],
    [HeroId.HERO_2]: [
      "ticket revenue",
      "tickets",
      "gate revenue",
      "matchday",
      "ticket money last year vs this year",
      "how much gate revenue did we take",
      "matchday income compared to last season",
      "How does ticket revenue this season compare to 25/26?",
      "25/26 tickets",
      "fcz match",
    ],
    [HeroId.HERO_3]: [
      "department budgets",
      "budgets",
      "actuals",
      "department spend",
      "are we on budget",
      "over budget",
      "department performance vs target",
      "actual vs budget by department",
      "How are departments tracking against budget?",
      "wheres the department variance",
    ],
  };

  for (const heroId of HERO_IDS) {
    it(`resolves several paraphrases of ${heroId} to that hero`, () => {
      const phrasings = PARAPHRASES[heroId];
      expect(phrasings.length).toBeGreaterThanOrEqual(8);

      for (const question of phrasings) {
        expect(matchIntent(question), question).toEqual(heroMatch(heroId));
      }
    });
  }

  it("resolves the three phrasings criterion 5 names by hand", () => {
    // Spelled out separately from the table above so this criterion cannot be
    // weakened by an edit to it.
    expect(matchIntent("kit sales")).toEqual(heroMatch(HeroId.HERO_1));
    expect(matchIntent("how are shirts selling")).toEqual(
      heroMatch(HeroId.HERO_1),
    );
    expect(matchIntent("trikot")).toEqual(heroMatch(HeroId.HERO_1));
  });
});

/* ------------------------------------------------------- CANONICAL PROMPTS -- */

describe("the three canonical prompts resolve to their own hero", () => {
  /**
   * The suggestion-chip labels ARE the canonical prompts, imported from US-029
   * rather than retyped — a presenter who reads a chip aloud and types it must
   * get that chip's hero.
   *
   * THE MARGIN IS THE POINT. Each canonical prompt outscores its own hero's
   * follow-up by a wide gap, so the prepared question can never be mistaken for
   * the deep-dive behind it. Asserting the winner alone would leave a
   * one-keyword edit able to close the gap unnoticed.
   */
  const EXPECTED_SCORES: Record<HeroId, { primary: number; follow: number }> = {
    [HeroId.HERO_1]: { primary: 8, follow: 4 },
    [HeroId.HERO_2]: { primary: 4, follow: 0 },
    [HeroId.HERO_3]: { primary: 10, follow: 1 },
  };

  for (const heroId of HERO_IDS) {
    it(`resolves the ${heroId} chip label to ${heroId}, not its follow-up`, () => {
      const question = HERO_CHIP_LABEL[heroId];
      const { primary, follow: followScore } = EXPECTED_SCORES[heroId];

      expect(matchIntent(question)).toEqual(heroMatch(heroId));
      expect(scoreIntent(question, hero(heroId))).toBe(primary);
      expect(scoreIntent(question, follow(heroId))).toBe(followScore);
      expect(primary).toBeGreaterThan(followScore);
    });
  }

  it("beats the follow-up by at least 3 points on every canonical prompt", () => {
    for (const heroId of HERO_IDS) {
      const question = HERO_CHIP_LABEL[heroId];
      const margin =
        scoreIntent(question, hero(heroId)) -
        scoreIntent(question, follow(heroId));

      expect(margin).toBeGreaterThanOrEqual(3);
    }
  });
});

/* --------------------------------------------------------- FOLLOW-UPS -- */

describe("the three follow-up phrasings resolve to the follow-up", () => {
  it("resolves each follow-up chip label to that hero's follow-up", () => {
    for (const heroId of HERO_IDS) {
      expect(matchIntent(FOLLOW_UP_CHIP_LABEL[heroId])).toEqual(
        followMatch(heroId),
      );
    }
  });

  it('resolves "Which badge should we push next?" to Hero 1\'s follow-up', () => {
    const question = FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1];

    expect(question).toBe("Which badge should we push next?");
    expect(matchIntent(question)).toEqual(followMatch(HeroId.HERO_1));
    expect(scoreIntent(question, follow(HeroId.HERO_1))).toBe(5);
    expect(scoreIntent(question, hero(HeroId.HERO_1))).toBe(1);
  });

  it('resolves "Which fixtures are driving the drop?" to Hero 2\'s follow-up', () => {
    const question = FOLLOW_UP_CHIP_LABEL[HeroId.HERO_2];

    expect(question).toBe("Which fixtures are driving the drop?");
    expect(matchIntent(question)).toEqual(followMatch(HeroId.HERO_2));
    expect(scoreIntent(question, follow(HeroId.HERO_2))).toBe(7);
    expect(scoreIntent(question, hero(HeroId.HERO_2))).toBe(2);
  });

  it("resolves the Marketing follow-up label to Hero 3's follow-up", () => {
    const question = FOLLOW_UP_CHIP_LABEL[HeroId.HERO_3];

    expect(matchIntent(question)).toEqual(followMatch(HeroId.HERO_3));
    expect(scoreIntent(question, follow(HeroId.HERO_3))).toBe(7);
    // The only case where a follow-up legitimately beats its parent hero: the
    // question names Marketing, and 7 > 4 is a genuine win, not a tie.
    expect(scoreIntent(question, hero(HeroId.HERO_3))).toBe(4);
  });

  it('resolves the loose "why is marketing high?" — exactly at the threshold', () => {
    // The edge case the specification names. `marketing` (2) + `why` (1) = 3,
    // which is EXACTLY the follow-up threshold, while Hero 3's primary intent
    // scores nothing at all: "marketing" is not one of its keywords.
    const question = "why is marketing high?";

    expect(scoreIntent(question, follow(HeroId.HERO_3))).toBe(3);
    expect(scoreIntent(question, follow(HeroId.HERO_3))).toBe(
      INTENT_THRESHOLD[ChipKind.FOLLOW_UP],
    );
    expect(scoreIntent(question, hero(HeroId.HERO_3))).toBe(0);
    expect(matchIntent(question)).toEqual(followMatch(HeroId.HERO_3));
  });

  it("resolves other loose follow-up phrasings too", () => {
    expect(matchIntent("why marketing")).toEqual(followMatch(HeroId.HERO_3));
    expect(matchIntent("explain marketing")).toEqual(
      followMatch(HeroId.HERO_3),
    );
    expect(matchIntent("why is marketing over")).toEqual(
      followMatch(HeroId.HERO_3),
    );
    expect(matchIntent("which badge")).toEqual(followMatch(HeroId.HERO_1));
    expect(matchIntent("which badge next")).toEqual(followMatch(HeroId.HERO_1));
    expect(matchIntent("badge sponsor")).toEqual(followMatch(HeroId.HERO_1));
    expect(matchIntent("which matches are lower")).toEqual(
      followMatch(HeroId.HERO_2),
    );
    expect(matchIntent("fixtures")).toEqual(followMatch(HeroId.HERO_2));
  });
});

/* --------------------------------------------------- THRESHOLD BOUNDARIES -- */

describe("threshold boundaries — criterion 3", () => {
  it("matches a hero on a score of EXACTLY 2", () => {
    for (const question of ["trikot", "kit", "shirt", "gate", "budget"]) {
      const winner = matchIntent(question)!;
      expect(winner, question).not.toBeNull();
      expect(scoreIntent(question, intent(winner.heroId, winner.kind))).toBe(2);
      expect(winner.kind).toBe(ChipKind.HERO);
    }
  });

  it("does NOT match a follow-up on a score of exactly 2", () => {
    // Each of these clears nothing else, so the whole input falls through.
    for (const question of ["marketing", "badge", "sponsor", "which what"]) {
      const followUps = INTENTS.filter(
        (definition) => definition.kind === ChipKind.FOLLOW_UP,
      );
      const best = Math.max(
        ...followUps.map((definition) => scoreIntent(question, definition)),
      );

      expect(best, question).toBe(2);
      expect(matchIntent(question), question).toBeNull();
    }
  });

  it("matches a follow-up on a score of EXACTLY 3", () => {
    for (const question of ["why is marketing high?", "which badge"]) {
      const winner = matchIntent(question)!;
      expect(winner, question).not.toBeNull();
      expect(winner.kind).toBe(ChipKind.FOLLOW_UP);
      expect(scoreIntent(question, intent(winner.heroId, winner.kind))).toBe(3);
    }
  });

  it("holds both halves of the boundary on ONE input: 'over target'", () => {
    // Hero 3's primary and its follow-up score the same 2. The hero's bar is 2,
    // so it matches; the follow-up's bar is 3, so it does not. This single
    // input is criterion 3's whole point — a follow-up cannot steal its
    // parent's simpler phrasing.
    expect(scoreIntent("over target", hero(HeroId.HERO_3))).toBe(2);
    expect(scoreIntent("over target", follow(HeroId.HERO_3))).toBe(2);
    expect(matchIntent("over target")).toEqual(heroMatch(HeroId.HERO_3));
  });

  it("falls through when nothing reaches its own threshold", () => {
    // Every intent scores 1 or 0 here, so there is no winner at all.
    const question = "the difference";
    for (const definition of INTENTS) {
      expect(scoreIntent(question, definition)).toBeLessThan(2);
    }
    expect(matchIntent(question)).toBeNull();
  });
});

/* ------------------------------------------------------------ TIE-BREAK -- */

describe("deterministic tie-break — criterion 4", () => {
  it("gives a two-way tie to Hero 1 over Hero 2", () => {
    // "kit" is strong for Hero 1, "gate" is strong for Hero 2: 2 and 2, both
    // clearing the hero threshold. Hero 1 is listed first, so Hero 1 wins.
    expect(scoreIntent("kit gate", hero(HeroId.HERO_1))).toBe(2);
    expect(scoreIntent("kit gate", hero(HeroId.HERO_2))).toBe(2);
    expect(matchIntent("kit gate")).toEqual(heroMatch(HeroId.HERO_1));
  });

  it("gives a two-way tie to Hero 1 over Hero 3", () => {
    expect(scoreIntent("trikot budget", hero(HeroId.HERO_1))).toBe(2);
    expect(scoreIntent("trikot budget", hero(HeroId.HERO_3))).toBe(2);
    expect(matchIntent("trikot budget")).toEqual(heroMatch(HeroId.HERO_1));
  });

  it("gives a two-way tie to Hero 2 over Hero 3", () => {
    expect(scoreIntent("ticket budget", hero(HeroId.HERO_2))).toBe(2);
    expect(scoreIntent("ticket budget", hero(HeroId.HERO_3))).toBe(2);
    expect(matchIntent("ticket budget")).toEqual(heroMatch(HeroId.HERO_2));
  });

  it("gives a THREE-way tie to Hero 1 — the whole priority order at once", () => {
    const question = "shirt ticket budget";

    expect(scoreIntent(question, hero(HeroId.HERO_1))).toBe(2);
    expect(scoreIntent(question, hero(HeroId.HERO_2))).toBe(2);
    expect(scoreIntent(question, hero(HeroId.HERO_3))).toBe(2);
    expect(matchIntent(question)).toEqual(heroMatch(HeroId.HERO_1));
  });

  it("gives a hero-versus-follow-up tie to the HERO", () => {
    // Both clear their own thresholds and score 4. The hero is listed first, so
    // a follow-up can never take a tie off its own parent.
    const question = "budgets marketing why";

    expect(scoreIntent(question, hero(HeroId.HERO_3))).toBe(4);
    expect(scoreIntent(question, follow(HeroId.HERO_3))).toBe(4);
    expect(matchIntent(question)).toEqual(heroMatch(HeroId.HERO_3));
  });

  it("gives a Hero 2 tie against its own follow-up to the hero", () => {
    const question = "which fixtures matchday";

    expect(scoreIntent(question, hero(HeroId.HERO_2))).toBe(5);
    expect(scoreIntent(question, follow(HeroId.HERO_2))).toBe(5);
    expect(matchIntent(question)).toEqual(heroMatch(HeroId.HERO_2));
  });

  it("lets a strictly higher score win regardless of position", () => {
    // The tie-break is ONLY a tie-break: Hero 3 is listed last of the heroes
    // and still wins here, 6 against Hero 1's 3.
    const question = "kit sales and department budgets";

    expect(scoreIntent(question, hero(HeroId.HERO_1))).toBe(3);
    expect(scoreIntent(question, hero(HeroId.HERO_3))).toBe(6);
    expect(matchIntent(question)).toEqual(heroMatch(HeroId.HERO_3));
  });

  it("returns ONE intent for a double-barrelled question — never two heroes", () => {
    const question = "shirt sales and ticket revenue";

    expect(scoreIntent(question, hero(HeroId.HERO_1))).toBe(3);
    expect(scoreIntent(question, hero(HeroId.HERO_2))).toBe(3);
    expect(matchIntent(question)).toEqual(heroMatch(HeroId.HERO_1));
  });

  it("never yields two intents for one input, across the whole corpus", () => {
    // Criterion 4's invariant, stated structurally: the return is a single
    // value with exactly one hero and one kind, or nothing at all.
    for (const question of CORPUS) {
      const match = matchIntent(question);
      if (match === null) continue;

      expect(Array.isArray(match), question).toBe(false);
      expect(Object.keys(match).sort(), question).toEqual(["heroId", "kind"]);
      expect(Object.values(HeroId)).toContain(match.heroId);
      expect(Object.values(ChipKind)).toContain(match.kind);
    }
  });

  it("is deterministic — the same question always resolves the same way", () => {
    for (const question of CORPUS) {
      expect(matchIntent(question)).toEqual(matchIntent(question));
    }
  });
});

/* ------------------------------------------------- A SINGLE COMMON WORD -- */

describe("a single common word — criterion 6", () => {
  it('resolves "sales" to NOTHING: it clears no hero threshold', () => {
    // "sales" is weak for Hero 1 alone and scores 1, below the bar of 2. A word
    // that vague must not pick a hero on the presenter's behalf.
    expect(scoreIntent("sales", hero(HeroId.HERO_1))).toBe(1);
    for (const definition of INTENTS) {
      expect(scoreIntent("sales", definition)).toBeLessThan(2);
    }
    expect(matchIntent("sales")).toBeNull();
  });

  it("resolves a single word that DOES clear exactly one threshold", () => {
    // The other half of the criterion: one strong word is enough, and it
    // resolves to the one hero it belongs to.
    expect(matchIntent("trikot")).toEqual(heroMatch(HeroId.HERO_1));
    expect(matchIntent("tickets")).toEqual(heroMatch(HeroId.HERO_2));
    expect(matchIntent("budgets")).toEqual(heroMatch(HeroId.HERO_3));
  });

  it("falls back for other lone common words", () => {
    for (const question of [
      "sales",
      "revenue",
      "difference",
      "compare",
      "variance",
      "spend",
      "target",
      "why",
      "which",
      "next",
    ]) {
      expect(matchIntent(question), question).toBeNull();
    }
  });
});

/* ----------------------------------------------------------- OFF-SCRIPT -- */

describe("off-script input falls through — no match, never an error", () => {
  it("returns null for the extreme case the backlog names", () => {
    expect(matchIntent("show me player injuries")).toBeNull();
    expect(matchIntent("who is our best player")).toBeNull();
  });

  it("returns null for gibberish", () => {
    for (const question of ["asdkjhasd", "qwertyuiop", "zzz", "42", "!!!"]) {
      expect(matchIntent(question), question).toBeNull();
    }
  });

  it("returns null for empty and whitespace-only input", () => {
    for (const question of ["", " ", "   ", "\t", "\n\n", " \t \n "]) {
      expect(matchIntent(question), question).toBeNull();
    }
  });

  it("returns null rather than throwing on anything at all", () => {
    for (const question of [
      "🙂🙂🙂",
      "SELECT * FROM shirts",
      "../../etc/passwd",
      "${process.env}",
      "a".repeat(5000),
    ]) {
      expect(() => matchIntent(question)).not.toThrow();
    }
    // A SQL-shaped string is not special: it mentions shirts, so it scores like
    // any other question that does. Nothing is executed either way.
    expect(matchIntent("SELECT * FROM shirts")).toEqual(
      heroMatch(HeroId.HERO_1),
    );
  });
});

/* ------------------------------------------ THE TWO INHERITED OVER-MATCHES -- */

/**
 * THE CURRENT CONTRACT, PINNED ON PURPOSE.
 *
 * The assertions in this block describe behaviour that is arguably WRONG, and
 * they are here so that it cannot change by accident. Both edges are inherited
 * from the approved reference algorithm, which the user chose to port faithfully
 * ("port faithfully, pin with tests") so the demo stays predictable.
 *
 * Tightening either one — a word-boundary test for strong keywords, a padded
 * test for weak ones — is a DELIBERATE future decision. It would break these
 * tests, which is the intended signal: whoever tightens it is then choosing to
 * change the contract, with the paraphrase suite above to re-verify against.
 */
describe("inherited over-match 1: a strong keyword matches a word PREFIX", () => {
  it("matches `kit` inside `kitchen`, for a full 2 points", () => {
    expect(scoreIntent("kitchen", hero(HeroId.HERO_1))).toBe(
      STRONG_KEYWORD_SCORE,
    );
    expect(matchIntent("How is the kitchen doing?")).toEqual(
      heroMatch(HeroId.HERO_1),
    );
  });

  it("matches `gate` inside `gateway`, for a full 2 points", () => {
    expect(scoreIntent("gateway", hero(HeroId.HERO_2))).toBe(
      STRONG_KEYWORD_SCORE,
    );
    expect(matchIntent("gateway timeout")).toEqual(heroMatch(HeroId.HERO_2));
  });

  it("is the same leniency that makes real paraphrases work", () => {
    // The edge is not gratuitous: the prefix test is why a plural, a hyphen and
    // a trailing suffix all resolve without keyword entries of their own.
    expect(matchIntent("kits")).toEqual(heroMatch(HeroId.HERO_1));
    expect(matchIntent("kit-sales")).toEqual(heroMatch(HeroId.HERO_1));
    expect(matchIntent("gates")).toEqual(heroMatch(HeroId.HERO_2));
  });

  it("still requires the keyword to start a word", () => {
    // Mid-word is NOT a strong hit: the padding space is load-bearing.
    expect(scoreIntent("basket", hero(HeroId.HERO_2))).toBe(0);
    expect(scoreIntent("tricot", hero(HeroId.HERO_1))).toBe(0);
  });
});

describe("inherited over-match 2: a weak keyword matches ANY substring", () => {
  it("matches `over` inside `overall` and `recover`", () => {
    expect(scoreIntent("overall", hero(HeroId.HERO_3))).toBe(
      WEAK_KEYWORD_SCORE,
    );
    expect(scoreIntent("recover", hero(HeroId.HERO_3))).toBe(
      WEAK_KEYWORD_SCORE,
    );
    // Enough of them together DO clear a threshold: `over` + `performance`.
    expect(scoreIntent("overall performance", hero(HeroId.HERO_3))).toBe(2);
    expect(matchIntent("overall performance")).toEqual(
      heroMatch(HeroId.HERO_3),
    );
  });

  it("matches `name` inside `names` (intended) and `nameplate` (not)", () => {
    expect(scoreIntent("names", hero(HeroId.HERO_1))).toBe(2);
    expect(scoreIntent("nameplate", hero(HeroId.HERO_1))).toBe(
      WEAK_KEYWORD_SCORE,
    );
  });

  it("cannot clear a threshold on a single stray substring", () => {
    // The containment is the mitigation: a weak keyword is worth 1, so one
    // accidental substring is never enough on its own.
    expect(scoreIntent("recover the nameplate", hero(HeroId.HERO_1))).toBe(1);
    expect(scoreIntent("recover the nameplate", hero(HeroId.HERO_3))).toBe(1);
    expect(matchIntent("recover the nameplate")).toBeNull();
    expect(matchIntent("nameplate")).toBeNull();
    expect(matchIntent("overall")).toBeNull();
  });

  it("is what lets the two-word weak keywords match mid-sentence", () => {
    // `last year` and `this year` are weak keywords with a space in them, and
    // the unpadded test is the only reason they hit at all.
    expect(
      scoreIntent("ticket money last year vs this year", hero(HeroId.HERO_2)),
    ).toBe(4);
  });
});

/* ----------------------------------------------------------- THE SEAM -- */

describe("askQuestion — the typed-question seam", () => {
  function actions() {
    return { showHero: vi.fn(), showFollowUp: vi.fn() };
  }

  it("shows the hero for a matched hero question, and nothing else", () => {
    const spies = actions();

    expect(askQuestion("kit sales", spies)).toEqual(heroMatch(HeroId.HERO_1));
    expect(spies.showHero).toHaveBeenCalledExactlyOnceWith(HeroId.HERO_1);
    expect(spies.showFollowUp).not.toHaveBeenCalled();
  });

  it("shows the follow-up for a matched follow-up question", () => {
    const spies = actions();

    expect(askQuestion("why is marketing high?", spies)).toEqual(
      followMatch(HeroId.HERO_3),
    );
    expect(spies.showFollowUp).toHaveBeenCalledExactlyOnceWith(HeroId.HERO_3);
    expect(spies.showHero).not.toHaveBeenCalled();
  });

  it("does nothing at all for an off-script question", () => {
    const spies = actions();

    expect(askQuestion("show me player injuries", spies)).toBeNull();
    expect(spies.showHero).not.toHaveBeenCalled();
    expect(spies.showFollowUp).not.toHaveBeenCalled();
  });

  it("calls exactly one action per question, over the whole corpus", () => {
    for (const question of CORPUS) {
      const spies = actions();
      const match = askQuestion(question, spies);
      const calls =
        spies.showHero.mock.calls.length + spies.showFollowUp.mock.calls.length;

      expect(calls, question).toBe(match === null ? 0 : 1);
    }
  });

  it("resolves every question through the matcher, never through a chip", () => {
    // The two paths are kept apart BY TYPE. `askQuestion` takes a string;
    // `selectChip` takes a chip. Neither will accept the other's argument, so
    // no refactor can quietly route a tapped chip through the scoring above.
    const spies = actions();
    const chip = { heroId: HeroId.HERO_1, kind: ChipKind.HERO };

    // @ts-expect-error — a chip is the OTHER path's argument and must not
    // typecheck here. This line fails `pnpm typecheck` if the seam loosens.
    // It throws at runtime too, which is the same separation seen from the
    // other side: there is no text on a chip to normalise.
    expect(() => askQuestion(chip, spies)).toThrow(TypeError);

    expect(spies.showHero).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------- NO MODEL, NO QUERY, NO NETWORK -- */

describe("the golden rule: no model is called and no answer is computed", () => {
  it("imports nothing but the shared enum and the chip vocabulary", () => {
    const imports = [...INTENTS_CODE.matchAll(/from "([^"]+)"/g)].map(
      (found) => found[1],
    );

    expect(imports).toEqual(["../repositories/enums", "./chips"]);
  });

  it("makes no network call of any kind", () => {
    expect(INTENTS_CODE).not.toMatch(
      /fetch|XMLHttpRequest|WebSocket|EventSource|axios|navigator\.send/i,
    );
  });

  it("calls no model, loads no embedding and uses no matching library", () => {
    expect(INTENTS_CODE).not.toMatch(
      /openai|anthropic|claude|gpt|llm|embedding|vector|transformers|tensorflow|onnx|fuzzy|fuse\.|levenshtein/i,
    );
  });

  it("generates no SQL and evaluates nothing", () => {
    expect(INTENTS_CODE).not.toMatch(
      /\bSELECT\b|\bFROM\b|\$queryRaw|\beval\(|new Function|import\(/,
    );
  });

  it("adds no dependency to the project", () => {
    const installed = [
      ...Object.keys(PACKAGE_JSON.dependencies),
      ...Object.keys(PACKAGE_JSON.devDependencies),
    ];

    for (const name of installed) {
      expect(name).not.toMatch(
        /openai|anthropic|langchain|ai-sdk|@ai-|embedding|transformers|tensorflow|onnx|fuzzy|fuse|leven|match-sorter|natural|nlp/i,
      );
    }
  });

  it("does the matching with plain string work only", () => {
    // `String.includes` and two literal regexes. No regex is ever BUILT from
    // the typed text, so a typed pattern cannot change how matching behaves.
    expect(INTENTS_CODE).toMatch(/\.includes\(/);
    expect(INTENTS_CODE).not.toMatch(/new RegExp/);
  });

  it("stores nothing and logs nothing — the question is discarded", () => {
    // A03: the typed string never becomes markup, a URL, a selector, a storage
    // key or a log line. It is read, scored and dropped.
    expect(INTENTS_CODE).not.toMatch(
      /localStorage|sessionStorage|indexedDB|document\.cookie|console\./,
    );
    expect(INTENTS_CODE).not.toMatch(
      /innerHTML|dangerouslySetInnerHTML|querySelector|createElement|location\./,
    );
  });

  it("scores an XSS payload to nothing and returns no match", () => {
    const payload = '<img src=x onerror="alert(1)">';

    for (const definition of INTENTS) {
      expect(scoreIntent(payload, definition)).toBe(0);
    }
    expect(matchIntent(payload)).toBeNull();
  });
});
