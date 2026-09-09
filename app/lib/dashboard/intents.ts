/**
 * Intent matching — the ONE place a freely TYPED question becomes an answer,
 * and the highest-risk code in the prototype.
 *
 * The moment this module exists for: the owner ignores the chips, types their
 * own wording, and presses Enter in front of the room. There is no second
 * chance at that moment, so everything here is chosen for PREDICTABILITY over
 * cleverness, and the suite in `tests/unit/intent-matching.test.ts` pins the
 * behaviour input by input rather than describing it.
 *
 * NO MODEL, NO QUERY, NO NETWORK — `.project-management/input/constraints.md`
 * §2, which calls this "a considered decision, not a shortcut" and says in
 * terms: do not upgrade it to call a live model. The "intelligence" is keyword
 * matching over pre-authored responses. This file therefore has no dependency
 * beyond the shared hero enum and the chip vocabulary, makes no `fetch`, opens
 * no socket, loads no embedding and imports no matching library. Plain string
 * work only, and a source scan in the suite keeps it that way.
 *
 * THE ALGORITHM IS A FAITHFUL PORT of the approved reference build, kept
 * behaviour-for-behaviour so the demo is predictable:
 *
 *   normalise  lowercase, strip `/.,?!'"()`, collapse whitespace, trim, then
 *              pad with a single space at each end
 *   score      +{@link STRONG_KEYWORD_SCORE} per strong keyword hit,
 *              +{@link WEAK_KEYWORD_SCORE} per weak keyword hit
 *   match      walk {@link INTENTS} in order; an intent must clear its own
 *              threshold ({@link INTENT_THRESHOLD}) AND STRICTLY BEAT the
 *              leader, so equal scores resolve to the EARLIER intent
 *
 * TWO INHERITED ROUGH EDGES, DELIBERATELY KEPT. Both are real, both are pinned
 * by tests as the current contract, and tightening either one is a deliberate
 * future decision rather than an accident:
 *
 *   1. A strong keyword matches at a WORD START, not a whole word — see
 *      {@link hasStrongKeyword}. `kit` therefore hits `"kitchen"` and `gate`
 *      hits `"gateway"`, and each scores a full 2.
 *   2. A weak keyword matches ANYWHERE inside a word — see
 *      {@link hasWeakKeyword}. `over` therefore hits `"overall"` and
 *      `"recover"`, and `name` hits `"names"` (intended) as well as
 *      `"nameplate"` (not).
 *
 * They are the price of the reference's tolerance, and that tolerance is the
 * point: `kit-sales`, `shirts?`, `SHIRT SALES!!!` and `don't know about shirts`
 * all resolve, because a prefix/substring test does not care about the
 * punctuation and inflection a presenter actually types.
 *
 * TWO HEROES NEVER RENDER FROM ONE QUESTION (criterion 4). {@link matchIntent}
 * returns at most ONE match — a single value, not a list — so a question that
 * mentions shirts and tickets in one breath resolves to whichever scores
 * higher, and to Hero 1 if they score the same.
 *
 * THE OTHER PATH IS THE CHIP PATH, and the two share nothing but the two
 * dashboard actions they end in. A chip tap carries a {@link ChipKind} and a
 * {@link HeroId} and never a string (`./chips.ts`), so it cannot reach the
 * scoring below even by accident; this module never sees a chip.
 *
 * SECURITY — A03, the user-input trigger (`.claude/rules/security-review.md`).
 * The typed string is READ AND DISCARDED. It is lowercased into a local, tested
 * against a fixed keyword list with `String.includes`, and dropped when the
 * function returns; the only thing that escapes is a {@link HeroId} and a
 * {@link ChipKind}, both drawn from this module's own config. It never becomes
 * markup, a URL, a query, a DOM selector, a storage key, a React key or a log
 * line — there is no `innerHTML`, no `dangerouslySetInnerHTML`, no
 * `querySelector`, no `fetch`, no storage and no logging anywhere in this file,
 * and no regular expression is ever BUILT from it (the two below are literals),
 * so it cannot inject a pattern either. An `<img onerror>` payload scores zero
 * and falls through to the fallback like any other off-script question.
 */

import { HeroId } from "../repositories/enums";
import { ChipKind, type ChipActions } from "./chips";

/* ------------------------------------------------------------- SCORING -- */

/** A strong keyword names the subject outright: `shirt`, `ticket`, `budget`. */
export const STRONG_KEYWORD_SCORE = 2;

/** A weak keyword only leans that way: `sales`, `revenue`, `variance`. */
export const WEAK_KEYWORD_SCORE = 1;

/**
 * The score an intent must reach before it may win anything — criterion 3.
 *
 * A follow-up is held to a HIGHER bar than a hero on purpose: it must not
 * steal its parent hero's simpler phrasings. "budget" alone (2) is a Hero 3
 * question, not a request for the Marketing deep-dive; "marketing" alone (2)
 * clears no bar at all and falls through to the fallback, because one word is
 * not enough to jump straight to a follow-up.
 */
export const INTENT_THRESHOLD: Record<ChipKind, number> = {
  [ChipKind.HERO]: 2,
  [ChipKind.FOLLOW_UP]: 3,
};

/**
 * THE PARENT-GATING FLAG (criterion 7): whether a kind of question only makes
 * sense once its hero has already been answered this session.
 *
 * Held once per KIND rather than repeated on all six definitions below,
 * because it is a property of the kind and not of the individual intent — a
 * hero's own question always stands alone, a follow-up never does.
 *
 * US-033 READS IT, in `./follow-up-gate.ts` and only there: that module asks
 * this flag and the section list what a question actually renders, and both the
 * answer (`./use-dashboard.ts`) and the beat (`./use-thinking.ts`) call it.
 * Nothing in this module gates anything itself, so the matcher stays a pure
 * function of the text and never sees the session.
 */
export const INTENT_REQUIRES_PARENT: Record<ChipKind, boolean> = {
  [ChipKind.HERO]: false,
  [ChipKind.FOLLOW_UP]: true,
};

/* -------------------------------------------------------- NORMALISATION -- */

/**
 * The punctuation a typed question is stripped of, exactly as the reference
 * defines it: slash, full stop, comma, question mark, exclamation mark,
 * apostrophe, double quote and both parentheses.
 *
 * The slash is why `"25/26"` becomes `"2526"` and matches the `2526` keyword —
 * a presenter writes the season with a slash, and the keyword list carries the
 * stripped spelling. Nothing else is removed: `&`, `-`, `%` and `:` survive
 * into the normalised text, which is harmless because a keyword hit only needs
 * the run of letters BEFORE them (`kit-sales` scores as `kit`).
 */
const PUNCTUATION = /[/.,?!'"()]/g;

/** Any run of whitespace — tabs and newlines included — collapses to one space. */
const WHITESPACE = /\s+/g;

/**
 * Normalise a typed question for matching — criterion 1.
 *
 * Lowercased, punctuation stripped, whitespace collapsed, trimmed, and then
 * PADDED with one space at each end. The padding is what lets a keyword test
 * for a word start (`" kit"`) without special-casing the first and last word of
 * the question, which is why it is applied AFTER the trim rather than before.
 *
 * An empty or all-whitespace question normalises to `"  "` — two spaces — which
 * contains no keyword and therefore scores zero everywhere.
 */
export function normaliseQuestion(question: string): string {
  return (
    " " +
    question
      .toLowerCase()
      .replace(PUNCTUATION, "")
      .replace(WHITESPACE, " ")
      .trim() +
    " "
  );
}

/* -------------------------------------------------------------- CONFIG -- */

/** One scripted question, as the keywords that resolve to it. */
export interface IntentDefinition {
  /** The flow this intent maps to — the shared enum, never a local string. */
  readonly heroId: HeroId;
  /** The hero's own question, or that hero's follow-up. */
  readonly kind: ChipKind;
  /** Words that name the subject. Worth {@link STRONG_KEYWORD_SCORE} each. */
  readonly strong: readonly string[];
  /** Words that merely lean that way. Worth {@link WEAK_KEYWORD_SCORE} each. */
  readonly weak: readonly string[];
}

/**
 * THE INTENT CONFIG — static data, verbatim from the approved reference, and
 * criterion 7's "id, keyword set, mapped flow, parent-gating flag" (the flag
 * being {@link INTENT_REQUIRES_PARENT}, keyed by the `kind` field here).
 *
 * **THE ORDER IS SIGNIFICANT AND IS PART OF THE CONTRACT.** It is the priority
 * criterion 4 fixes — Hero 1, Hero 2, Hero 3, then the three follow-ups — and
 * {@link matchIntent}'s strictly-greater comparison turns it into the
 * tie-break: when two intents score the same, the one listed FIRST wins. So
 * "shirt ticket budget" (2 each, three ways) is a Hero 1 question, and a
 * follow-up can never take a tie off its own parent hero.
 *
 * Keywords are stored lowercase and punctuation-free, in the same shape
 * {@link normaliseQuestion} produces — `2526`, not `25/26`. A keyword that
 * carried punctuation could never match anything, since the question has had
 * its punctuation removed by the time it is tested.
 */
export const INTENTS: readonly IntentDefinition[] = [
  {
    heroId: HeroId.HERO_1,
    kind: ChipKind.HERO,
    strong: ["shirt", "shirts", "trikot", "kit", "kits", "jersey", "jerseys"],
    weak: [
      "sales",
      "sold",
      "split",
      "home",
      "away",
      "third",
      "3rd",
      "badge",
      "badges",
      "sponsor",
      "printed",
      "name",
      "names",
    ],
  },
  {
    heroId: HeroId.HERO_2,
    kind: ChipKind.HERO,
    strong: ["ticket", "tickets", "matchday", "gate"],
    weak: [
      "revenue",
      "last year",
      "this year",
      "season",
      "2526",
      "2627",
      "fixture",
      "fixtures",
      "difference",
      "compare",
      "fcz",
      "match",
      "matches",
    ],
  },
  {
    heroId: HeroId.HERO_3,
    kind: ChipKind.HERO,
    strong: [
      "budget",
      "budgets",
      "department",
      "departments",
      "actuals",
      "actual",
    ],
    weak: [
      "variance",
      "spend",
      "difference",
      "over",
      "under",
      "target",
      "achieved",
      "performance",
    ],
  },
  {
    heroId: HeroId.HERO_1,
    kind: ChipKind.FOLLOW_UP,
    strong: ["badge", "sponsor"],
    weak: ["push", "promote", "next", "drop", "recommend", "which", "what"],
  },
  {
    heroId: HeroId.HERO_2,
    kind: ChipKind.FOLLOW_UP,
    strong: ["fixtures", "matches", "fixture"],
    weak: ["driving", "drop", "down", "decline", "why", "which", "lower"],
  },
  {
    heroId: HeroId.HERO_3,
    kind: ChipKind.FOLLOW_UP,
    strong: ["marketing"],
    weak: ["why", "over", "budget", "behind", "target", "explain", "driving"],
  },
];

/* --------------------------------------------------------------- SCORE -- */

/**
 * A strong keyword hit: the keyword appears at the START of a word.
 *
 * ROUGH EDGE 1, INHERITED AND PINNED. The reference tests
 * `n.includes(" " + k + " ") || n.includes(" " + k)`, whose first half is
 * strictly subsumed by its second — so this single test is the same predicate
 * with the same results, and it states the real rule plainly instead of
 * implying a word match the code never performed. The consequence is a latent
 * false positive: `kit` matches `" kitchen"` and `gate` matches `" gateway"`,
 * each for a full {@link STRONG_KEYWORD_SCORE}. It is the same leniency that
 * makes `kit-sales`, `kits` and `shirts` resolve without an entry of their own,
 * and tightening it to a word boundary would be a deliberate change of
 * behaviour with its own tests, not a tidy-up.
 */
function hasStrongKeyword(normalised: string, keyword: string): boolean {
  return normalised.includes(` ${keyword}`);
}

/**
 * A weak keyword hit: the keyword appears ANYWHERE, word boundaries ignored.
 *
 * ROUGH EDGE 2, INHERITED AND PINNED. Unpadded on purpose — it is what lets the
 * multi-word `"last year"` and `"this year"` match mid-sentence, and what lets
 * `name` cover `names`. It also means `over` hits `"overall"` and `"recover"`,
 * and `name` hits `"nameplate"`. Weak keywords are only worth
 * {@link WEAK_KEYWORD_SCORE}, so a stray substring alone cannot clear a
 * threshold: `"recover the nameplate"` scores 1 for two different intents and
 * resolves to neither.
 */
function hasWeakKeyword(normalised: string, keyword: string): boolean {
  return normalised.includes(keyword);
}

/** Score an already-normalised question. The inner loop of {@link matchIntent}. */
function scoreNormalised(normalised: string, intent: IntentDefinition): number {
  let score = 0;

  for (const keyword of intent.strong) {
    if (hasStrongKeyword(normalised, keyword)) score += STRONG_KEYWORD_SCORE;
  }

  for (const keyword of intent.weak) {
    if (hasWeakKeyword(normalised, keyword)) score += WEAK_KEYWORD_SCORE;
  }

  return score;
}

/**
 * Score a raw typed question against one intent — criterion 2.
 *
 * Every keyword that hits adds its weight; there is no cap, no decay and no
 * normalisation by length, so a fully-phrased question outscores a two-word
 * one by a wide margin. That margin is the safety property worth having: the
 * canonical Hero 1 prompt scores 8 against its own follow-up's 4, so the
 * prepared question can never be mistaken for the deep-dive behind it.
 */
export function scoreIntent(
  question: string,
  intent: IntentDefinition,
): number {
  return scoreNormalised(normaliseQuestion(question), intent);
}

/* --------------------------------------------------------------- MATCH -- */

/** What a typed question resolved to: one flow, and which half of it. */
export interface IntentMatch {
  readonly heroId: HeroId;
  readonly kind: ChipKind;
}

/**
 * Resolve a typed question to at most ONE intent — criteria 3, 4, 5 and 6.
 *
 * Walks {@link INTENTS} in priority order and keeps the leader. Two conditions
 * have to hold for an intent to take the lead, and each is a criterion:
 *
 *   - `score >= threshold` — its own bar, 2 for a hero and 3 for a follow-up
 *     ({@link INTENT_THRESHOLD}). Below it the intent cannot win at all, which
 *     is why a single common word such as "sales" (1) resolves to nothing and
 *     falls through to the fallback (criterion 6).
 *   - `score > best` — STRICTLY greater, never equal. A later intent must BEAT
 *     the leader to displace it, so a tie resolves to the earlier intent and
 *     the priority order in {@link INTENTS} IS the tie-break (criterion 4).
 *
 * Returns `null` for anything off-script — that is not a failure, it is the
 * input US-032's fallback panel is built to answer.
 */
export function matchIntent(question: string): IntentMatch | null {
  const normalised = normaliseQuestion(question);

  let best: IntentDefinition | null = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    const score = scoreNormalised(normalised, intent);

    if (score >= INTENT_THRESHOLD[intent.kind] && score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }

  return best === null ? null : { heroId: best.heroId, kind: best.kind };
}

/* --------------------------------------------------------------- ANSWER -- */

/**
 * THE TYPED-QUESTION SEAM — match a question and act on it. Wired to the
 * prompt bar's `onSubmit` in `app/root.tsx`, which is the only caller.
 *
 * The branch is four lines and it is deliberately NOT shared with `selectChip`
 * in `./chips.ts`, even though both end in the same pair of dashboard actions.
 * Keeping them separate is what preserves US-029's type-level guarantee: the
 * chip path takes a chip and the typed path takes a string, and no refactor can
 * quietly route a tapped chip through the scoring above.
 *
 * Returns the MATCH, which is a fact about the text: `null` raises US-032's
 * fallback panel, and a match tells the caller an answer is on its way.
 *
 * IT IS NOT A REPORT OF WHAT RENDERED, and it deliberately does not become one.
 * A follow-up matched cold renders its parent instead (US-033), but that
 * decision belongs to the session, not to the text: it is taken once inside
 * `showFollowUp`, against the section list, in `./follow-up-gate.ts`. Gating
 * here as well would need this pure function to be handed the session, and
 * would put the same rule in two places where the two could drift apart. So the
 * TYPED path is gated exactly like the tapped path: through the action it calls.
 */
export function askQuestion(
  question: string,
  actions: ChipActions,
): IntentMatch | null {
  const match = matchIntent(question);

  if (match === null) return null;

  if (match.kind === ChipKind.FOLLOW_UP) {
    actions.showFollowUp(match.heroId);
  } else {
    actions.showHero(match.heroId);
  }

  return match;
}
