/**
 * Insight-section state — the list the dashboard grows.
 *
 * THE ONE BEHAVIOUR THIS MODULE PROTECTS
 * The dashboard **never clears to show an answer, it grows**. So the session's
 * answers are a list of sections that is only ever appended to or sharpened in
 * place, never replaced. Everything here is a pure transformation of that list;
 * React state, animation and DOM live in `./use-dashboard.ts` and in
 * `app/components/heroes/`, so the rules below can be read and tested without
 * rendering anything.
 *
 * Three rules, all of them load-bearing:
 *
 *   1. **One section per hero, keyed by hero id.** Asking the same question
 *      twice refreshes the section that is already there; it never appends a
 *      second one ({@link withHeroShown}).
 *   2. **Order is the order the questions were asked.** A refresh keeps a
 *      section where it is rather than moving it to the end, so the dashboard
 *      reads as a transcript of the session.
 *   3. **A follow-up flips a phase, it does not append.** The follow-up is the
 *      same answer sharpened from *what happened* to *why, and what to do*, so
 *      it belongs to the section that is already on screen
 *      ({@link withFollowUpShown}). US-033 gates when that is allowed.
 *
 * NO PERSISTENCE. This list is memory-only, by specification
 * (`technical-spec.md` §4.3): no `localStorage`, no `sessionStorage`, no
 * cookie, no IndexedDB anywhere in the app. A reload starts an empty session,
 * which is the intended demo behaviour and not a limitation to fix.
 */

import { type HeroId } from "../repositories/enums";

/* --------------------------------------------------------------- PHASE -- */

/**
 * How far an answer has been taken: the primary answer alone, or the primary
 * answer plus its follow-up.
 *
 * The two values are `camelCase` rather than the `SCREAMING_SNAKE_CASE` the
 * enum rule mandates, and deliberately so: that rule covers values that cross
 * a layer boundary (`.claude/rules/enums-and-constants.md` §1), and this one
 * never leaves the browser tab — there is no wire, no database and no API in
 * this prototype. The spelling is the one `technical-spec.md` §4.3 fixes.
 */
export const InsightPhase = {
  /** The answer to the question that was asked. */
  PRIMARY: "primary",
  /** That answer plus its follow-up: why, and what to do. */
  WITH_FOLLOW_UP: "withFollowUp",
} as const;

export type InsightPhase = (typeof InsightPhase)[keyof typeof InsightPhase];

/* ------------------------------------------------------------- SECTIONS -- */

/** One answered question, as a descriptor of what to render for it. */
export interface InsightSection {
  /** Which hero answered. The dedupe key — never rendered. */
  readonly heroId: HeroId;
  /** Primary answer, or primary plus follow-up. */
  readonly phase: InsightPhase;
  /**
   * How many times this hero has been re-asked. `0` on first insertion.
   *
   * It exists so that "re-asking refreshes" is observable rather than a silent
   * no-op: the counter changes, so {@link sectionKey} changes, so the section
   * remounts and replays its entrance animation in the position it already
   * held. Without it a re-ask would look like nothing happened.
   */
  readonly revision: number;
}

export type InsightSections = readonly InsightSection[];

/** The empty session. A module-level constant so a reset is a stable value. */
export const NO_SECTIONS: InsightSections = Object.freeze([]);

/** The section for a hero, if it has been asked this session. */
export function findSection(
  sections: InsightSections,
  heroId: HeroId,
): InsightSection | undefined {
  return sections.find((section) => section.heroId === heroId);
}

/** Whether this hero has already been shown — US-033's gating question. */
export function hasSection(sections: InsightSections, heroId: HeroId): boolean {
  return findSection(sections, heroId) !== undefined;
}

/**
 * React key for a section: the hero it answers, plus its revision.
 *
 * Including the revision is what makes a refresh re-insert. Keying on the hero
 * id alone would leave a re-asked section untouched in the DOM and the answer
 * would arrive with no visible change at all.
 */
export function sectionKey(section: InsightSection): string {
  return `${section.heroId}#${section.revision}`;
}

/* ---------------------------------------------------------- TRANSITIONS -- */

/**
 * Show a hero's primary answer: append a section for it, or refresh the one
 * already there.
 *
 * DEDUPE BY HERO ID — the highest-value rule in this story. A presenter who
 * asks the same question twice (or taps a chip twice) must not end up with two
 * copies of the same answer stacked down the canvas.
 *
 * A refresh keeps both the section's POSITION and its PHASE. Position, because
 * the order is the order the questions were asked. Phase, because a section
 * that already shows its follow-up must not silently lose it — the dashboard
 * grows and sharpens; it never regresses.
 */
export function withHeroShown(
  sections: InsightSections,
  heroId: HeroId,
): InsightSections {
  if (!hasSection(sections, heroId)) {
    return [...sections, { heroId, phase: InsightPhase.PRIMARY, revision: 0 }];
  }

  return sections.map((section) =>
    section.heroId === heroId
      ? { ...section, revision: section.revision + 1 }
      : section,
  );
}

/**
 * Show a hero's follow-up: flip its existing section's phase.
 *
 * The flip is the whole point — the follow-up sharpens the section already on
 * screen instead of appending a second one about the same question.
 *
 * A follow-up for a hero that has not been shown is left alone here: deciding
 * what to do about it is US-033's gating, not this list's business. The hook
 * that drives this module shows the parent hero first, which is what US-033
 * builds its chip offer on top of.
 */
export function withFollowUpShown(
  sections: InsightSections,
  heroId: HeroId,
): InsightSections {
  return sections.map((section) =>
    section.heroId === heroId
      ? { ...section, phase: InsightPhase.WITH_FOLLOW_UP }
      : section,
  );
}
