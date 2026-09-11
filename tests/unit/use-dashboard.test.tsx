import { act, renderHook } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BASELINE_SECTIONS,
  InsightPhase,
} from "../../app/lib/dashboard/sections";
import { useDashboard } from "../../app/lib/dashboard/use-dashboard";
import { HeroId } from "../../app/lib/repositories/enums";

const { HERO_1, HERO_2, HERO_3 } = HeroId;

const HOOK_SOURCE = readFileSync(
  resolve(process.cwd(), "app/lib/dashboard/use-dashboard.ts"),
  "utf8",
);

/* ------------------------------------------------------------- HARNESS -- */

const originalMatchMedia = window.matchMedia;
const originalScrollTo = window.scrollTo;

function stubReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn(
    (query: string) => ({ matches, media: query }) as MediaQueryList,
  );
}

/** jsdom implements no scrolling, so `reset`'s scroll is watched by a spy. */
function stubScrollTo(): ReturnType<typeof vi.fn> {
  const scrollTo = vi.fn();
  Object.assign(window, { scrollTo });
  return scrollTo;
}

/** A `startViewTransition` that applies the update, as the browser's does. */
function stubViewTransitions(): ReturnType<typeof vi.fn> {
  const start = vi.fn((update: () => void) => {
    update();
    return { finished: Promise.resolve() };
  });
  Object.assign(document, { startViewTransition: start });
  return start;
}

beforeEach(() => {
  stubReducedMotion(false);
  stubScrollTo();
});

afterEach(() => {
  vi.useRealTimers();
  window.matchMedia = originalMatchMedia;
  window.scrollTo = originalScrollTo;
  delete (document as Partial<Record<"startViewTransition", unknown>>)
    .startViewTransition;
  vi.restoreAllMocks();
});

function heroOrder(sections: readonly { heroId: HeroId }[]): HeroId[] {
  return sections.map((section) => section.heroId);
}

/* ------------------------------------------------------------- STATE -- */

describe("useDashboard — the session starts empty", () => {
  it("holds no sections and nothing to scroll to", () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.sections).toHaveLength(0);
    expect(result.current.focus).toBeNull();
  });
});

describe("useDashboard — answering questions", () => {
  it("appends a section per hero, in the order asked", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_2));
    act(() => result.current.showHero(HERO_1));

    expect(heroOrder(result.current.sections)).toEqual([HERO_2, HERO_1]);
  });

  it("keeps every earlier section as more arrive", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showHero(HERO_2));
    act(() => result.current.showHero(HERO_3));

    expect(result.current.sections).toHaveLength(3);
    expect(heroOrder(result.current.sections)).toEqual([
      HERO_1,
      HERO_2,
      HERO_3,
    ]);
  });

  it("refreshes rather than duplicating when a hero is re-asked", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showHero(HERO_2));
    act(() => result.current.showHero(HERO_1));

    expect(result.current.sections).toHaveLength(2);
    expect(heroOrder(result.current.sections)).toEqual([HERO_1, HERO_2]);
    expect(result.current.sections[0]?.revision).toBe(1);
  });

  it("flips the phase of an existing section for a follow-up", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showFollowUp(HERO_1));

    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0]?.phase).toBe(InsightPhase.WITH_FOLLOW_UP);
  });

  it("shows the parent hero first when a follow-up arrives on its own", () => {
    // Never an error and never nothing (US-033 then offers the chip).
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showFollowUp(HERO_3));

    expect(heroOrder(result.current.sections)).toEqual([HERO_3]);
    expect(result.current.sections[0]?.phase).toBe(InsightPhase.PRIMARY);
  });
});

/* -------------------------------------------------------------- FOCUS -- */

describe("useDashboard — the focus signal the auto-scroll follows", () => {
  it("names the section that was just inserted", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_2));

    expect(result.current.focus).toEqual({ heroId: HERO_2, tick: 1 });
  });

  it("advances the counter on every reveal, including a repeat", () => {
    // Without a counter, re-asking the same hero would produce an unchanged
    // focus value and the view would never scroll back to it.
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showHero(HERO_1));

    expect(result.current.focus).toEqual({ heroId: HERO_1, tick: 2 });
  });

  it("moves to the sharpened section when a follow-up is shown", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showHero(HERO_2));
    act(() => result.current.showFollowUp(HERO_1));

    expect(result.current.focus).toEqual({ heroId: HERO_1, tick: 3 });
  });
});

/* ------------------------------------------------------------- REFLOW -- */

describe("useDashboard — reflow, never jump", () => {
  it("runs every insertion inside a view transition", () => {
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showHero(HERO_2));
    act(() => result.current.showFollowUp(HERO_2));

    expect(start).toHaveBeenCalledTimes(3);
    expect(result.current.sections).toHaveLength(2);
  });

  it("flushes the update inside that transition so the tween has an end state", () => {
    // A batched update would leave the browser capturing the OLD layout twice
    // and nothing would move. `flushSync` is what makes the reflow real.
    expect(HOOK_SOURCE).toContain("flushSync");
  });

  it("renders the final layout with the tween off under reduced motion", () => {
    stubReducedMotion(true);
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showFollowUp(HERO_1));

    expect(start).not.toHaveBeenCalled();
    expect(heroOrder(result.current.sections)).toEqual([HERO_1]);
    expect(result.current.sections[0]?.phase).toBe(InsightPhase.WITH_FOLLOW_UP);
    expect(result.current.focus).toEqual({ heroId: HERO_1, tick: 2 });
  });

  it("applies the update where view transitions are unsupported", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));

    expect(heroOrder(result.current.sections)).toEqual([HERO_1]);
  });
});

/* --------------------------------------------------------------- RESET -- */

describe("useDashboard — reset returns the dashboard to its baseline", () => {
  it("clears every hero section", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showHero(HERO_2));
    act(() => result.current.showFollowUp(HERO_3));
    act(() => result.current.reset());

    expect(result.current.sections).toEqual(BASELINE_SECTIONS);
  });

  it("restores exactly the baseline a fresh session starts from", () => {
    // Reset is specified as "back to the initial state", so the two are
    // compared against each other rather than both against "empty" — the day
    // US-013's four tiles join the baseline, this test still states the rule.
    const fresh = renderHook(() => useDashboard());
    const used = renderHook(() => useDashboard());

    act(() => used.result.current.showHero(HERO_2));
    act(() => used.result.current.reset());

    expect(used.result.current.sections).toEqual(fresh.result.current.sections);
  });

  it("leaves nothing pointing at a section that no longer exists", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.reset());

    expect(result.current.focus).toBeNull();
  });

  it("scrolls back to the top", () => {
    const scrollTo = stubScrollTo();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.reset());

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  });

  it("animates the sections away through a view transition", () => {
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.reset());

    expect(start).toHaveBeenCalledTimes(2);
    expect(result.current.sections).toHaveLength(0);
  });

  it("leaves the dashboard usable — the next question still lands", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.reset());
    act(() => result.current.showHero(HERO_2));

    expect(heroOrder(result.current.sections)).toEqual([HERO_2]);
    expect(result.current.sections[0]?.revision).toBe(0);
    expect(result.current.focus).toEqual({ heroId: HERO_2, tick: 1 });
  });

  it("advances the generation on every press, for state it cannot derive", () => {
    // The extension point US-028's prompt input and US-029's chips key off if
    // they hold anything that is not derived from `sections`.
    const { result } = renderHook(() => useDashboard());

    expect(result.current.generation).toBe(0);

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.reset());
    act(() => result.current.reset());

    expect(result.current.generation).toBe(2);
  });

  it("renders the cleared layout with the tween off under reduced motion", () => {
    stubReducedMotion(true);
    const scrollTo = stubScrollTo();
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showHero(HERO_2));
    act(() => result.current.reset());

    expect(start).not.toHaveBeenCalled();
    expect(result.current.sections).toHaveLength(0);
    expect(result.current.focus).toBeNull();
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });
});

/* ---------------------------------------------------- RESET UNDER ABUSE -- */

describe("useDashboard — reset pressed with nothing to reset", () => {
  it("is a safe no-op that starts no animation", () => {
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());
    const before = result.current.sections;

    act(() => result.current.reset());

    expect(start).not.toHaveBeenCalled();
    expect(result.current.sections).toBe(before);
    expect(result.current.focus).toBeNull();
  });

  it("still returns the view to the top", () => {
    // The presenter may have scrolled the baseline dashboard without asking
    // anything; Reset is still expected to take them back up.
    const scrollTo = stubScrollTo();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.reset());

    // Two requests per press since US-045: the stop that aborts any stale
    // smooth scroll, then the glide to the top (`app/lib/motion.ts`).
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ top: 0 }),
    );
  });

  it("is a no-op again immediately after a real reset", () => {
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.reset());
    start.mockClear();

    act(() => result.current.reset());

    expect(start).not.toHaveBeenCalled();
    expect(result.current.sections).toHaveLength(0);
  });
});

describe("useDashboard — reset pressed repeatedly and rapidly", () => {
  it("runs exactly one transition for two presses in the same frame", () => {
    // The abuse case E8 names: no duplicate state, no overlapping animations.
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    start.mockClear();

    act(() => {
      result.current.reset();
      result.current.reset();
    });

    expect(start).toHaveBeenCalledTimes(1);
    expect(result.current.sections).toHaveLength(0);
  });

  it("stays stable across a burst of presses", () => {
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() => result.current.showHero(HERO_2));
    start.mockClear();

    act(() => {
      for (let press = 0; press < 10; press += 1) result.current.reset();
    });

    expect(start).toHaveBeenCalledTimes(1);
    expect(result.current.sections).toEqual(BASELINE_SECTIONS);
    expect(result.current.focus).toBeNull();
    expect(result.current.generation).toBe(10);
  });

  it("duplicates nothing when questions and resets are interleaved fast", () => {
    const { result } = renderHook(() => useDashboard());

    act(() => {
      result.current.showHero(HERO_1);
      result.current.reset();
      result.current.showHero(HERO_1);
      result.current.showHero(HERO_1);
      result.current.reset();
      result.current.showHero(HERO_2);
    });

    expect(heroOrder(result.current.sections)).toEqual([HERO_2]);
  });
});

/* ------------------------------------------- RESET MID-FLOW: THE TIMER -- */

describe("useDashboard — the pending beat reset has to cancel", () => {
  it("inserts the answer when the beat is left to run", () => {
    // The control for the test below: without a reset, the scheduled answer
    // really does land — so the next test proves cancellation, not a no-op.
    vi.useFakeTimers();
    const { result } = renderHook(() => useDashboard());

    act(() =>
      result.current.schedule(() => result.current.showHero(HERO_1), 900),
    );
    act(() => void vi.advanceTimersByTime(900));

    expect(heroOrder(result.current.sections)).toEqual([HERO_1]);
  });

  it("does NOT insert a section after a reset — the beat is cancelled", () => {
    // THE bug this story exists to prevent: a thinking beat (US-031) that
    // fires after Reset would drop an answer into a freshly cleared
    // dashboard, in front of the room.
    vi.useFakeTimers();
    const { result } = renderHook(() => useDashboard());

    act(() => result.current.showHero(HERO_1));
    act(() =>
      result.current.schedule(() => result.current.showHero(HERO_2), 900),
    );
    act(() => result.current.reset());
    act(() => void vi.advanceTimersByTime(10_000));

    expect(result.current.sections).toEqual(BASELINE_SECTIONS);
    expect(result.current.focus).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels the beat before it touches state, not after", () => {
    // Ordering matters: a clear that ran first would leave a live timer for
    // the few milliseconds until the cancel, and a timer that fires in that
    // window is exactly the orphaned insertion.
    vi.useFakeTimers();
    const { result } = renderHook(() => useDashboard());
    const beat = vi.fn();

    act(() => result.current.schedule(beat, 900));
    act(() => result.current.reset());

    expect(vi.getTimerCount()).toBe(0);

    act(() => void vi.advanceTimersByTime(10_000));

    expect(beat).not.toHaveBeenCalled();
  });

  it("keeps only one beat pending — a second replaces the first", () => {
    // Two beats racing would insert two answers for one question.
    vi.useFakeTimers();
    const { result } = renderHook(() => useDashboard());
    const first = vi.fn();
    const second = vi.fn();

    act(() => result.current.schedule(first, 900));
    act(() => result.current.schedule(second, 900));

    expect(vi.getTimerCount()).toBe(1);

    act(() => void vi.advanceTimersByTime(900));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("forgets a beat that has already fired, so reset stays a no-op", () => {
    vi.useFakeTimers();
    const start = stubViewTransitions();
    const { result } = renderHook(() => useDashboard());
    const beat = vi.fn();

    act(() => result.current.schedule(beat, 900));
    act(() => void vi.advanceTimersByTime(900));
    act(() => result.current.reset());

    expect(beat).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
  });

  it("cancels a pending beat on unmount — a reset the user did not press", () => {
    vi.useFakeTimers();
    const beat = vi.fn();
    const { result, unmount } = renderHook(() => useDashboard());

    act(() => result.current.schedule(beat, 900));
    unmount();
    act(() => void vi.advanceTimersByTime(10_000));

    expect(beat).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

/* ------------------------------------------------------- NO PERSISTENCE -- */

describe("useDashboard — memory only", () => {
  it("starts empty again on a fresh mount, as a reload would", () => {
    const first = renderHook(() => useDashboard());
    act(() => first.result.current.showHero(HERO_1));
    expect(first.result.current.sections).toHaveLength(1);
    first.unmount();

    const second = renderHook(() => useDashboard());

    expect(second.result.current.sections).toHaveLength(0);
    expect(second.result.current.focus).toBeNull();
  });

  it("writes to no storage API", () => {
    expect(HOOK_SOURCE).not.toMatch(/localStorage|sessionStorage|cookie/);
  });
});
