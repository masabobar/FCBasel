import { act } from "@testing-library/react";
import { vi } from "vitest";

import { REDUCED_MOTION_QUERY } from "../../../app/lib/motion";

/**
 * The motion test harness — a hand-driven `requestAnimationFrame` and a
 * settable `matchMedia`.
 *
 * Every animated component in Phase 2b keys off US-027's hooks, so every one of
 * their test files needs the same two things: frames it can advance one at a
 * time (a count-up asserted against real wall-clock frames is a flaky test) and
 * a reduced-motion preference it can turn on, and turn on MID-ANIMATION. They
 * live here so there is one harness rather than one per test file.
 *
 * Not a `*.test.ts` file, so vitest does not collect it.
 */

/** Captured before anything stubs it, so `restoreMotionStubs` can put it back. */
const originalMatchMedia = window.matchMedia;

export interface MediaStub {
  /** Flip the preference and notify every subscriber, as a browser does. */
  set: (matches: boolean) => void;
  /** How many listeners are attached right now — 0 after a clean unmount. */
  listenerCount: () => number;
}

/**
 * A `matchMedia` whose result can be changed and which reports its own
 * listeners, so "reacts to a change" and "detaches on unmount" are both
 * observable. `legacy` exercises the pre-`EventTarget` MediaQueryList API.
 */
export function stubMatchMedia(
  matches: boolean,
  { legacy = false }: { legacy?: boolean } = {},
): MediaStub {
  const listeners = new Set<() => void>();
  const query = {
    media: REDUCED_MOTION_QUERY,
    matches,
    addEventListener: legacy
      ? undefined
      : (type: string, listener: () => void) => {
          if (type === "change") listeners.add(listener);
        },
    removeEventListener: legacy
      ? undefined
      : (type: string, listener: () => void) => {
          if (type === "change") listeners.delete(listener);
        },
    addListener: legacy
      ? (listener: () => void) => listeners.add(listener)
      : undefined,
    removeListener: legacy
      ? (listener: () => void) => listeners.delete(listener)
      : undefined,
  };

  window.matchMedia = vi.fn(() => query as unknown as MediaQueryList);

  return {
    set(next: boolean) {
      query.matches = next;
      act(() => {
        for (const listener of [...listeners]) listener();
      });
    },
    listenerCount: () => listeners.size,
  };
}

export interface FrameStub {
  /** Run every frame currently pending, `ms` later on the clock. */
  advance: (ms?: number) => void;
  /** Frames requested and not yet run or cancelled. */
  pending: () => number;
  /** Ids passed to `cancelAnimationFrame`. */
  cancelled: number[];
  /** How many frames have been requested in total. */
  requested: () => number;
}

/** A hand-driven `requestAnimationFrame`, so every frame is deterministic. */
export function stubFrames(): FrameStub {
  const pending = new Map<number, FrameRequestCallback>();
  const cancelled: number[] = [];
  let now = 0;
  let nextId = 1;
  let requested = 0;

  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextId;
    nextId += 1;
    requested += 1;
    pending.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    cancelled.push(id);
    pending.delete(id);
  });

  return {
    advance(ms = 16) {
      now += ms;
      const due = [...pending.values()];
      pending.clear();
      act(() => {
        for (const callback of due) callback(now);
      });
    },
    pending: () => pending.size,
    cancelled,
    requested: () => requested,
  };
}

/**
 * Undo everything the two stubs above did. Globals first: a test may have
 * stubbed `window` itself away.
 */
export function restoreMotionStubs(): void {
  vi.unstubAllGlobals();
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
}
