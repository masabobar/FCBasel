import { type HeroId } from "../repositories/enums";
import { ChipKind } from "./chips";
import { INTENT_REQUIRES_PARENT } from "./intents";
import { hasSection, type InsightSections } from "./sections";

/**
 * FOLLOW-UP CONTEXT GATING - US-033, and the whole of it.
 *
 * A follow-up only makes sense after its parent hero: "Which fixtures are
 * driving the drop?" is a question about an answer that is already on screen.
 * Asked cold it is not an error and it is not nothing, so this module answers
 * one question and one only:
 *
 *   > given the session, what does a request for this hero and this kind of
 *   > question ACTUALLY render right now?
 *
 * {@link renderedKind} is that answer. Nothing here mutates, schedules,
 * renders or holds state; it is a pure function of the section list plus the
 * static flag, so both halves of the behaviour (the answer that lands, and the
 * beat that precedes it) can read it without either owning it.
 *
 * ┌──────────────────────────── WHAT IT DECIDES ──────────────────────────────┐
 * │ asked         parent on screen?   renders            the presenter sees   │
 * │ hero          either              hero               the answer           │
 * │ follow-up     yes                 follow-up          the deep-dive        │
 * │ follow-up     NO                  hero (gated)       the parent, then a   │
 * │                                                      follow-up chip       │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * THE GATED ROW IS THE STORY (criterion 2). The parent renders FIRST, and the
 * follow-up is then OFFERED rather than taken: US-029's chip row derives a
 * follow-up chip for every section still at {@link InsightPhase.PRIMARY}, so
 * the parent landing at `primary` is itself the offer. There is no second
 * mechanism, no queue and no "pending follow-up" to remember; the presenter
 * taps the chip when they want it, which is also the moment they would have
 * tapped it had they asked in order.
 *
 * ONE SOURCE OF TRUTH, READ TWICE (criterion 4). "Which heroes have been shown"
 * is the section list and nothing else, read here through
 * `./sections.ts`'s {@link hasSection}. That single predicate drives BOTH:
 *
 *   - the GATE, through this module (`./use-dashboard.ts` picks the transition,
 *     `./use-thinking.ts` picks the beat), and
 *   - CHIP VISIBILITY, through `./chips.ts`'s `suggestionChips`, which filters
 *     the same list.
 *
 * So the two can never disagree about whether a follow-up is available, and
 * Reset needs no gating logic of its own: it restores `BASELINE_SECTIONS`, the
 * list is empty again, and every follow-up is gated again by derivation.
 *
 * EACH HERO IS INDEPENDENT (criterion 5). The lookup is by `heroId`, so a
 * hero's gate is a fact about ITS OWN parent and about nothing else on the
 * canvas. Hero 2 can run primary to follow-up with Heroes 1 and 3 never
 * touched, which is exactly what a presenter showing one flow needs.
 *
 * WHY THE FLAG RATHER THAN A HARD-CODED `kind === FOLLOW_UP`. US-030 put
 * {@link INTENT_REQUIRES_PARENT} in the intent config as a property of the KIND
 * of question, held once instead of repeated on six definitions. Reading it
 * here is what makes it load-bearing: the rule "a hero stands alone, a
 * follow-up does not" is stated in the config and applied in one function, so a
 * third kind of question would declare its own gating and need no new branch.
 *
 * NOT IN `./intents.ts` AND NOT IN `./sections.ts`, on purpose. The matcher
 * stays a pure function of the TEXT (it never sees the session), and the
 * section list stays a set of pure transitions (it never decides what a
 * question means). This is the seam between them, which is why it is its own
 * small module rather than a branch inside either.
 */

/**
 * What a request for `asked` on `heroId` renders against this session.
 *
 * Returns `asked` unchanged unless the request is gated, in which case it
 * returns {@link ChipKind.HERO}: the parent renders first. A hero's own
 * question is never gated ({@link INTENT_REQUIRES_PARENT} says so), so for
 * `ChipKind.HERO` this is the identity.
 *
 * `./use-thinking.ts` calls it to choose the thinking message, which is why it
 * returns a kind rather than a boolean: the panel must name the answer that is
 * about to appear, so a gated follow-up shows the PARENT's beat.
 */
export function renderedKind(
  sections: InsightSections,
  heroId: HeroId,
  asked: ChipKind,
): ChipKind {
  return INTENT_REQUIRES_PARENT[asked] && !hasSection(sections, heroId)
    ? ChipKind.HERO
    : asked;
}

/**
 * Whether a follow-up for this hero is held back because its parent has not
 * been shown this session - criterion 1, as the predicate the answer path
 * reads.
 *
 * Defined in terms of {@link renderedKind} rather than repeating the flag
 * lookup, so there is exactly one place the gate is decided.
 */
export function isFollowUpGated(
  sections: InsightSections,
  heroId: HeroId,
): boolean {
  return renderedKind(sections, heroId, ChipKind.FOLLOW_UP) === ChipKind.HERO;
}
