/**
 * Suggestion chips — the tappable prompts, DERIVED from the session list.
 *
 * THE ONE DECISION THIS MODULE PROTECTS
 * The chip row is **not state**. It is a pure function of the sections on
 * screen ({@link suggestionChips}), so there is nothing for Reset to remember
 * to clear: US-015 restores `BASELINE_SECTIONS`, this function is evaluated
 * again, and the three hero chips are back with the follow-up chips gone. A
 * parallel `useState` of visible chips would have been a second source of truth
 * that Reset — and every future flow — could forget, and US-015's own note
 * named this derivation as the intended wiring for exactly that reason.
 *
 * So the lifecycle in US-029 criterion 3 ("the follow-up chip is removed once
 * that follow-up has been shown") is not implemented anywhere. It falls out of
 * the filter below: a follow-up chip is offered exactly while its hero's
 * section is at {@link InsightPhase.PRIMARY}. The moment `withFollowUpShown`
 * flips that phase, the chip is no longer derived, so it is no longer on
 * screen. Nothing removes it.
 *
 * A CHIP TAP DOES NOT GO THROUGH THE MATCHER — criterion 2, and it is a
 * correctness rule rather than a shortcut. A chip already knows which hero it
 * means, so {@link selectChip} reads its {@link SuggestionChip.heroId} and
 * calls the dashboard. There is no string in that path: no normalising, no
 * keyword scoring, no threshold and no tie-break, and therefore no way for a
 * tapped chip to resolve to a different hero than the one it names. US-030's
 * scoring is the OTHER path — it starts at the prompt bar's `onSubmit`, which
 * carries a `string` — and the two share nothing but the two dashboard actions
 * they end in.
 *
 * THE LABELS ARE HERE, NOT ON `HeroId`. A hero's id is an identifier and is
 * never rendered (`../repositories/enums.ts`); these are the chip's SHORT
 * labels, which are a property of the chip row. Phase 3b's section headings
 * happen to reuse the same wording, and will import it from here rather than
 * retyping it.
 */

import { HERO_IDS, HeroId } from "../repositories/enums";
import { InsightPhase, type InsightSections } from "./sections";

/* ---------------------------------------------------------------- KINDS -- */

/**
 * What a chip asks for: a hero's primary question, or that hero's follow-up.
 *
 * `camelCase` rather than the `SCREAMING_SNAKE_CASE` the enum rule mandates,
 * for the same reason `InsightPhase` is (`./sections.ts`): that rule covers
 * values crossing a layer boundary (`.claude/rules/enums-and-constants.md`
 * §1), and this one never leaves the browser tab. There is no wire, no
 * database and no API in this prototype.
 */
export const ChipKind = {
  /** The hero's own question. Always offered — criterion 4. */
  HERO: "hero",
  /** That hero's follow-up. Offered only while its answer is un-sharpened. */
  FOLLOW_UP: "followUp",
} as const;

export type ChipKind = (typeof ChipKind)[keyof typeof ChipKind];

/* --------------------------------------------------------------- LABELS -- */

/**
 * The three hero prompts, verbatim from the reference build's `HEROES[*].chip`.
 *
 * Keyed by the shared {@link HeroId} rather than by three loose strings, so a
 * fourth hero cannot be added without its chip label being supplied too.
 */
export const HERO_CHIP_LABEL: Record<HeroId, string> = {
  [HeroId.HERO_1]: "Shirt sales by kit & sponsor badges",
  [HeroId.HERO_2]: "Ticket revenue, this year vs last",
  [HeroId.HERO_3]: "Department budgets vs actuals",
};

/**
 * The follow-up prompts, verbatim from the reference build's
 * `FOLLOWUPS[*].chip`. Each is phrased as the question a presenter would ask
 * NEXT, which is why it only makes sense once its hero is already answered.
 */
export const FOLLOW_UP_CHIP_LABEL: Record<HeroId, string> = {
  [HeroId.HERO_1]: "Which badge should we push next?",
  [HeroId.HERO_2]: "Which fixtures are driving the drop?",
  [HeroId.HERO_3]: "Why is Marketing over budget & behind target?",
};

/* ---------------------------------------------------------------- CHIPS -- */

/** One offered prompt: which hero it means, which half of it, and its label. */
export interface SuggestionChip {
  /** The hero this chip resolves to. The whole of criterion 2. */
  readonly heroId: HeroId;
  /** Primary question or follow-up. */
  readonly kind: ChipKind;
  /** The short label, rendered verbatim. */
  readonly label: string;
}

export type SuggestionChips = readonly SuggestionChip[];

/** React key for a chip: hero plus kind, which is unique in any derived row. */
export function chipKey(chip: SuggestionChip): string {
  return `${chip.heroId}#${chip.kind}`;
}

/** The three hero chips, in the order `HERO_IDS` offers them. A stable value. */
export const HERO_CHIPS: SuggestionChips = Object.freeze(
  HERO_IDS.map((heroId) => ({
    heroId,
    kind: ChipKind.HERO,
    label: HERO_CHIP_LABEL[heroId],
  })),
);

/**
 * THE CHIP ROW — a pure function of the session, and the whole of US-029's
 * lifecycle.
 *
 * Two rules, and they are the acceptance criteria almost word for word:
 *
 *   1. **The three hero chips, always** (criteria 1 and 4). They lead the row
 *      in `HERO_IDS` order, whatever is on the canvas, so the prepared
 *      questions never stop being discoverable — including at the baseline,
 *      which is what "exactly three chips on load" means, and including
 *      immediately after Reset, which is US-015 criterion 2.
 *   2. **A follow-up chip per un-sharpened answer** (criterion 3). Its hero has
 *      a section AND that section is still at `PRIMARY`. A section that has
 *      already shown its follow-up contributes nothing, so the chip is gone.
 *
 * Follow-ups keep the order of `sections`, which is the order the questions
 * were asked — the same reading the canvas gives.
 */
export function suggestionChips(sections: InsightSections): SuggestionChips {
  const followUps = sections
    .filter((section) => section.phase === InsightPhase.PRIMARY)
    .map((section) => ({
      heroId: section.heroId,
      kind: ChipKind.FOLLOW_UP,
      label: FOLLOW_UP_CHIP_LABEL[section.heroId],
    }));

  return [...HERO_CHIPS, ...followUps];
}

/* ------------------------------------------------------------ RESOLUTION -- */

/**
 * The only two things a chip tap may do. `useDashboard`'s state satisfies this
 * structurally, so the hook is handed over as it stands.
 */
export interface ChipActions {
  showHero: (heroId: HeroId) => void;
  showFollowUp: (heroId: HeroId) => void;
}

/**
 * Resolve a chip tap DIRECTLY to its mapped intent — criterion 2.
 *
 * The argument is a {@link SuggestionChip}, not a `string`, and that is the
 * point: there is no text to normalise and nothing to score, so this path
 * cannot reach US-030's matcher even by accident. A chip means the hero it was
 * derived from, always.
 */
export function selectChip(chip: SuggestionChip, actions: ChipActions): void {
  if (chip.kind === ChipKind.FOLLOW_UP) {
    actions.showFollowUp(chip.heroId);
    return;
  }

  actions.showHero(chip.heroId);
}
