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
 * Let the beat in flight land its answer.
 *
 * Real timers and a real wait, deliberately: these suites also use
 * `userEvent`'s real-timer defaults, and mixing the two clocks in a suite that
 * is not about timing is how flakiness gets in. A call with no beat in flight
 * returns at once, so it is safe after any interaction.
 */
export async function settleThinkingBeat(): Promise<void> {
  await waitFor(
    () => {
      if (thinkingPanel() !== null) {
        throw new Error("the thinking beat is still in flight");
      }
    },
    { timeout: THINKING_DELAY_MS + 500 },
  );
}
