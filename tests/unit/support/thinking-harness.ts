import { waitFor } from "@testing-library/react";

import { THINKING_DELAY_MS } from "../../../app/lib/dashboard/thinking";

/**
 * The thinking-beat test harness — for suites that are about WHAT lands, not
 * about the beat itself.
 *
 * US-031 put a fixed pause between a question and its answer, so every test
 * that asks a question on the real `App` now has to let the beat land before it
 * can assert on the section. Suites that own the beat (`thinking-beat.test.tsx`)
 * drive it with fake timers, because the delay and the ordering ARE the
 * subject. Every other suite just needs the answer, and uses this: it waits for
 * the panel to leave the screen, which is the same commit the section arrives
 * in.
 *
 * Not a `*.test.ts` file, so vitest does not collect it.
 */

/** The thinking panel on screen right now, or `null` if no beat is in flight. */
export function thinkingPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="thinking-panel"]');
}

/**
 * How long to let the beat land before calling it hung.
 *
 * A LIVENESS BOUND, NOT AN ASSERTION. Nothing here checks that the beat is
 * quick — `thinking-beat.test.tsx` owns the duration, on fake timers, and
 * pins it exactly. All this number decides is how long a wait is allowed to
 * run before it is reported as a hang, so the only thing a tight value buys
 * is false failures on a busy machine.
 *
 * IT USED TO BE `+ 500`, AND THAT WAS TOO TIGHT. 500ms of slack over a 1150ms
 * product timer is 43%: a laptop under memory pressure, a CI box sharing a
 * core, or a browser opening in the background all overshoot it easily, and
 * the whole file then fails on a product that is working. The failure is
 * indistinguishable from a real one ("the thinking beat is still in flight"),
 * which makes it expensive to diagnose every time.
 *
 * 4x THE BEAT, NOT MORE. The suites that call this ask up to six questions in
 * one test on a 30s budget (`hero3-follow-up.test.tsx`), so the bound has to
 * leave a genuinely hung beat somewhere to fail: 6 x 4600ms is 27.6s, still
 * inside that budget. A beat that never lands is therefore still caught, and
 * still caught by this helper's own error rather than by a bare test timeout.
 */
const SETTLE_TIMEOUT_MS = THINKING_DELAY_MS * 4;

/**
 * Let the beat in flight land its answer.
 *
 * Real timers and a real wait, deliberately: these suites also use
 * `userEvent`'s real-timer defaults, and mixing the two clocks in a suite that
 * is not about timing is how flakiness gets in. A call with no beat in flight
 * returns at once, so it is safe after any interaction.
 *
 * The wait resolves the moment the panel goes, so the bound above costs
 * nothing on a healthy machine — a settled beat still returns in ~1.2s.
 */
export async function settleThinkingBeat(): Promise<void> {
  await waitFor(
    () => {
      if (thinkingPanel() !== null) {
        throw new Error("the thinking beat is still in flight");
      }
    },
    { timeout: SETTLE_TIMEOUT_MS },
  );
}
