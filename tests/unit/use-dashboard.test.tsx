import { act, renderHook } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InsightPhase } from "../../app/lib/dashboard/sections";
import { useDashboard } from "../../app/lib/dashboard/use-dashboard";
import { HeroId } from "../../app/lib/repositories/enums";

const { HERO_1, HERO_2, HERO_3 } = HeroId;

const HOOK_SOURCE = readFileSync(
  resolve(process.cwd(), "app/lib/dashboard/use-dashboard.ts"),
  "utf8",
);

/* ------------------------------------------------------------- HARNESS -- */

const originalMatchMedia = window.matchMedia;

function stubReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn(
    (query: string) => ({ matches, media: query }) as MediaQueryList,
  );
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
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
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
