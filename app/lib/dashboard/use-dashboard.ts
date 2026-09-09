import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { animateReflow, scrollToTop } from "../motion";
import { type HeroId } from "../repositories/enums";
import { isFollowUpGated } from "./follow-up-gate";
import {
  BASELINE_SECTIONS,
  type InsightSections,
  withBaselineRestored,
  withFollowUpShown,
  withHeroShown,
} from "./sections";

/**
 * The dashboard's session state — owned by `app/root.tsx`, which is the one
 * component above both the canvas the sections render into and the app-bar
 * Reset control that clears them (`technical-spec.md` §4.3: "`App` owns
 * `groups`").
 *
 * This hook is the seam every question arrives through. Phase 3a's prompt bar,
 * suggestion chips and intent matcher (US-028 to US-033) do not grow their own
 * state: they resolve a question to a {@link HeroId} and call
 * {@link DashboardState.showHero} or {@link DashboardState.showFollowUp}. The
 * list transitions themselves are pure and live in `./sections.ts`.
 *
 * FOUR THINGS THIS HOOK ADDS on top of those pure transitions, all of which are
 * the reason it exists at all:
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
 *   3. **One committed snapshot.** Sections, focus and the reset counter are a
 *      single immutable {@link Session} value, mirrored into a ref as it is
 *      committed. Two presses in the same frame therefore see each other:
 *      the second reads what the first wrote, instead of both computing from a
 *      stale render (see {@link DashboardState.reset}).
 *   4. **Reset, and the timer it has to cancel** — US-015. See below.
 *
 * RESET IS A TRANSITION, NOT A MODE. It restores `./sections.ts`'s named
 * `BASELINE_SECTIONS` through the same commit path as an insertion, so there is
 * no second code path to keep in step and nothing anywhere says "empty".
 *
 * THE EXTENSION POINTS RESET LEAVES OPEN — three, deliberately, because the
 * things criteria 2 and 4 talk about are not built yet:
 *
 *   - {@link DashboardState.schedule} is where US-031's thinking beat belongs.
 *     Reset cancels the pending timer FIRST, before it touches state, so a beat
 *     in flight can never land an answer in a dashboard that was just cleared.
 *     US-031 gets that behaviour by scheduling here rather than calling
 *     `setTimeout` itself — it needs no retrofit and no reset logic of its own.
 *   - {@link DashboardState.sections} is where US-029's chips should read from.
 *     A chip row derived from the session list (initial chips at the baseline,
 *     follow-up chips from the sections on screen) is restored by reset for
 *     free — the cheapest correct wiring, and the intended one.
 *   - {@link DashboardState.generation} is for state that genuinely cannot be
 *     derived — a half-typed prompt in US-028's input, say. It advances on every
 *     press, so such a component can key off it and clear WITH the dashboard
 *     instead of reset reaching into it.
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

/**
 * One committed snapshot of the session.
 *
 * A single value rather than three pieces of state so that reset is a whole new
 * snapshot built from the baseline, not three separate clears — "no residual
 * state" then holds because there is nowhere for a residue to hide.
 */
interface Session {
  readonly sections: InsightSections;
  readonly focus: RevealFocus | null;
  readonly generation: number;
}

/** The session on load. The same baseline {@link DashboardState.reset} restores. */
const INITIAL_SESSION: Session = {
  sections: BASELINE_SECTIONS,
  focus: null,
  generation: 0,
};

export interface DashboardState {
  /** The answered questions, in the order they were asked. */
  readonly sections: InsightSections;
  /** The most recently inserted, refreshed or sharpened section. */
  readonly focus: RevealFocus | null;
  /**
   * How many times Reset has been pressed this session. An extension point:
   * state that lives outside this hook and cannot be derived from
   * {@link DashboardState.sections} can key on this to clear with the dashboard.
   */
  readonly generation: number;
  /** Answer a hero's primary question — appends, or refreshes in place. */
  showHero: (heroId: HeroId) => void;
  /** Sharpen a hero's section with its follow-up — flips its phase. */
  showFollowUp: (heroId: HeroId) => void;
  /**
   * Return the dashboard to its baseline: clear the answers, drop the focus,
   * cancel any pending {@link DashboardState.schedule} beat, and scroll to the
   * top. Safe to press mid-flow, twice in a frame, or with nothing to reset.
   */
  reset: () => void;
  /**
   * Run something after a delay, owned by the dashboard so Reset can cancel it.
   *
   * ONE pending timer at a time: scheduling replaces whatever was pending, so
   * two questions in quick succession cannot leave two beats racing. Returns
   * nothing on purpose — the caller must not hold a handle it might clear out
   * of band. US-031's thinking beat is the intended (and only) caller.
   */
  schedule: (run: () => void, delayMs: number) => void;
}

export function useDashboard(): DashboardState {
  const [session, setSession] = useState<Session>(INITIAL_SESSION);

  /**
   * The last COMMITTED snapshot, readable synchronously from an event handler.
   *
   * React state is read from the render that created the handler, so a second
   * press in the same frame would compute from a stale session — the exact
   * shape of "reset pressed twice rapidly". This ref is written as part of
   * committing, so the second press reads the first press's result.
   */
  const committed = useRef<Session>(INITIAL_SESSION);

  /** The single pending timer, or `null`. Reset's most important job. */
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPending = useCallback(() => {
    if (pending.current === null) return;
    clearTimeout(pending.current);
    pending.current = null;
  }, []);

  // An unmount is a reset the user did not press: a timer that outlived the
  // component would fire into a dead tree.
  useEffect(() => cancelPending, [cancelPending]);

  const schedule = useCallback(
    (run: () => void, delayMs: number) => {
      cancelPending();
      pending.current = setTimeout(() => {
        pending.current = null;
        run();
      }, delayMs);
    },
    [cancelPending],
  );

  /**
   * Commit one snapshot: the ref first, then React, inside a `flushSync`.
   *
   * `flushSync` is not decoration: a view transition captures the "after"
   * geometry once the update callback has run, and React would otherwise still
   * be holding the state change in a batch at that moment — the browser would
   * capture the OLD layout twice and nothing would move. Flushing puts the new
   * DOM in place while the transition is still watching.
   */
  const commit = useCallback((next: Session) => {
    committed.current = next;
    flushSync(() => setSession(next));
  }, []);

  const reveal = useCallback(
    (heroId: HeroId, next: (current: InsightSections) => InsightSections) => {
      const current = committed.current;
      const snapshot: Session = {
        sections: next(current.sections),
        focus: { heroId, tick: (current.focus?.tick ?? 0) + 1 },
        generation: current.generation,
      };

      animateReflow(() => commit(snapshot));
    },
    [commit],
  );

  const showHero = useCallback(
    (heroId: HeroId) => {
      reveal(heroId, (current) => withHeroShown(current, heroId));
    },
    [reveal],
  );

  const showFollowUp = useCallback(
    (heroId: HeroId) => {
      // THE GATE (US-033), decided in `./follow-up-gate.ts` and nowhere else.
      // A follow-up for a hero that has not been shown yet renders the PARENT
      // first: never an error and never nothing. The parent lands at `primary`,
      // which is exactly the state US-029's chip row derives a follow-up chip
      // from, so the follow-up is then offered for the presenter to tap.
      //
      // Read from `committed.current`, the same list the chip row was derived
      // from, so the gate and the chip can never disagree about this hero.
      reveal(heroId, (current) =>
        isFollowUpGated(current, heroId)
          ? withHeroShown(current, heroId)
          : withFollowUpShown(current, heroId),
      );
    },
    [reveal],
  );

  const reset = useCallback(() => {
    // FIRST, before anything else. An orphaned beat firing after the clear
    // would insert an answer into a dashboard the presenter just reset — the
    // one bug in this story that a user would actually see.
    cancelPending();

    const current = committed.current;
    const snapshot: Session = {
      sections: withBaselineRestored(current.sections),
      focus: null,
      generation: current.generation + 1,
    };

    // Identity, not deep equality: `withBaselineRestored` hands back the very
    // list it was given when there is nothing to clear. So a press with an
    // empty canvas — or a second press in the same frame, which reads the
    // first press's committed snapshot — animates nothing, and two resets can
    // never overlap. The snapshot is still committed, so `generation` advances
    // on every press for the extension point above.
    const clearing =
      snapshot.sections !== current.sections || current.focus !== null;

    if (clearing) {
      animateReflow(() => commit(snapshot));
    } else {
      commit(snapshot);
    }

    scrollToTop();
  }, [cancelPending, commit]);

  return {
    sections: session.sections,
    focus: session.focus,
    generation: session.generation,
    showHero,
    showFollowUp,
    reset,
    schedule,
  };
}
