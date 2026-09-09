import { useCallback, useState } from "react";
import { flushSync } from "react-dom";

import { animateReflow } from "../motion";
import { type HeroId } from "../repositories/enums";
import {
  hasSection,
  type InsightSections,
  NO_SECTIONS,
  withFollowUpShown,
  withHeroShown,
} from "./sections";

/**
 * The dashboard's session state — owned by `app/root.tsx`, which is the one
 * component above both the canvas the sections render into and the app-bar
 * control that will clear them (`technical-spec.md` §4.3: "`App` owns
 * `groups`").
 *
 * This hook is the seam every question arrives through. Phase 3a's prompt bar,
 * suggestion chips and intent matcher (US-028 to US-033) do not grow their own
 * state: they resolve a question to a {@link HeroId} and call
 * {@link DashboardState.showHero} or {@link DashboardState.showFollowUp}. The
 * list transitions themselves are pure and live in `./sections.ts`.
 *
 * TWO THINGS THIS HOOK ADDS on top of those pure transitions, both of which
 * are the reason it exists at all:
 *
 *   1. **Reflow, never jump.** Every mutation runs inside US-006's
 *      {@link animateReflow}, so the tiles already on screen glide to their new
 *      grid positions instead of snapping. Under reduced motion (or without
 *      browser support) the wrapper applies the update unwrapped — the final
 *      layout still renders, with no tween.
 *   2. **A focus signal for the auto-scroll.** {@link DashboardState.focus}
 *      names the section that just changed and carries a counter, so re-asking
 *      the same hero scrolls to it again rather than being swallowed as "no
 *      change". The scrolling itself belongs to the section component, which
 *      owns the DOM node.
 *
 * NOT HERE, ON PURPOSE: `reset`. US-015 adds it — it clears the sections back
 * to {@link NO_SECTIONS}, scrolls to the top and cancels any pending thinking
 * beat — and wires it to the app bar's Reset through `AppShell`'s `onReset`.
 * That is the single place it needs to be added.
 *
 * NO PERSISTENCE, by specification: state lives in React and nowhere else, so
 * a reload starts a fresh session. See `./sections.ts`.
 */

/** Which section just changed, and how many changes have happened. */
export interface RevealFocus {
  /** The section to bring into view. */
  readonly heroId: HeroId;
  /**
   * Monotonic count of reveals this session. Re-asking the same hero produces
   * the same `heroId` with a higher `tick`, which is what lets the auto-scroll
   * fire again instead of seeing an unchanged value.
   */
  readonly tick: number;
}

export interface DashboardState {
  /** The answered questions, in the order they were asked. */
  readonly sections: InsightSections;
  /** The most recently inserted, refreshed or sharpened section. */
  readonly focus: RevealFocus | null;
  /** Answer a hero's primary question — appends, or refreshes in place. */
  showHero: (heroId: HeroId) => void;
  /** Sharpen a hero's section with its follow-up — flips its phase. */
  showFollowUp: (heroId: HeroId) => void;
}

export function useDashboard(): DashboardState {
  const [sections, setSections] = useState<InsightSections>(NO_SECTIONS);
  const [focus, setFocus] = useState<RevealFocus | null>(null);

  /**
   * Apply one list transition as a single animated reflow.
   *
   * `flushSync` is not decoration: a view transition captures the "after"
   * geometry once the update callback has run, and React would otherwise still
   * be holding the state change in a batch at that moment — the browser would
   * capture the OLD layout twice and nothing would move. Flushing inside the
   * callback puts the new DOM in place while the transition is still watching.
   */
  const reveal = useCallback(
    (heroId: HeroId, next: (current: InsightSections) => InsightSections) => {
      animateReflow(() => {
        flushSync(() => {
          setSections(next);
          setFocus((current) => ({ heroId, tick: (current?.tick ?? 0) + 1 }));
        });
      });
    },
    [],
  );

  const showHero = useCallback(
    (heroId: HeroId) => {
      reveal(heroId, (current) => withHeroShown(current, heroId));
    },
    [reveal],
  );

  const showFollowUp = useCallback(
    (heroId: HeroId) => {
      // A follow-up for a hero that has not been shown yet renders the parent
      // first — never an error and never nothing. Offering the follow-up chip
      // afterwards is US-033's half of that behaviour.
      reveal(heroId, (current) =>
        hasSection(current, heroId)
          ? withFollowUpShown(current, heroId)
          : withHeroShown(current, heroId),
      );
    },
    [reveal],
  );

  return { sections, focus, showHero, showFollowUp };
}
