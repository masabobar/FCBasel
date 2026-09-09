import { useCallback, useState } from "react";

import { type IntentMatch } from "./intents";
import { type InsightSections, isBaseline } from "./sections";

/**
 * WHICH TRANSIENT PANEL IS ON THE CANVAS — US-032's state, and the one place
 * the three are made mutually exclusive.
 *
 * The canvas can be showing the thinking beat (US-031), the graceful fallback
 * (`app/components/heroes/fallback-panel.tsx`), the empty state
 * (`app/components/heroes/empty-state-panel.tsx`) — or none of them, once an
 * answer is on screen. {@link canvasPanelFor} returns ONE of those four, a
 * single value rather than three booleans, so "never two panels at once" is
 * true by construction instead of by three conditions that have to agree.
 *
 * ┌──────────────────────────── HOW IT COMPOSES ──────────────────────────────┐
 * │ const { beat, busy, actions } = useThinking(dashboard);                   │
 * │ const canvas = useCanvasPanel(dashboard, beat !== null);                  │
 * │                                                                          │
 * │ canvas.record(askQuestion(question, actions));   // the typed path        │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * THE ONE PIECE OF STATE HERE IS THE MISS, AND IT IS HELD AS THE SESSION IT
 * BELONGS TO. `askQuestion` returning `null` is not a fact about the
 * application, it is a fact about one question asked against one canvas — so
 * this hook remembers the section list the miss happened against, and the
 * fallback stands only while that list is still the one on screen
 * ({@link useCanvasPanel}). Everything else follows from that without a line
 * of clearing logic:
 *
 *   - a chip tapped from inside the fallback panel lands an answer, which is a
 *     NEW section list, so the fallback is no longer derived and goes;
 *   - re-asking a hero also produces a new list, so it goes then too;
 *   - a second off-script question records the miss again against the same
 *     list, so the panel simply stays.
 *
 * The one thing that cannot be derived from the list is Reset pressed with
 * nothing to clear: `withBaselineRestored` hands back the very list it was
 * given, on purpose (`./sections.ts`), so the list alone cannot tell that
 * press apart from no press at all. `generation` can, and does — the same
 * counter US-031's beat keys off, and the reason `useDashboard` advances it on
 * EVERY press. That is criterion "Reset returns to the empty state".
 *
 * NO TIMER, NO REQUEST, NO PERSISTENCE. The fallback is immediate and has no
 * lifetime of its own: it appears in the same commit as the question that
 * missed and leaves when the canvas changes. There is no `setTimeout` here —
 * the beat's is still the only timer in the application (US-015).
 */

/* --------------------------------------------------------------- PANELS -- */

/**
 * The four states of the canvas's transient row, in precedence order.
 *
 * `camelCase` rather than `SCREAMING_SNAKE_CASE`, for the same reason
 * `InsightPhase` and `ChipKind` are (`.claude/rules/enums-and-constants.md`
 * §1): the value never crosses a layer boundary — there is no wire, no
 * database and no API in this prototype.
 */
export const CanvasPanel = {
  /** A beat is in flight, so an answer is coming (US-031). */
  THINKING: "thinking",
  /** The last typed question matched nothing (criteria 1 to 3). */
  FALLBACK: "fallback",
  /** Nothing has been asked yet — the invitation (criterion 4). */
  EMPTY: "empty",
  /** An answer is on the canvas and nothing transient is over it. */
  NONE: "none",
} as const;

export type CanvasPanel = (typeof CanvasPanel)[keyof typeof CanvasPanel];

/**
 * Resolve the four inputs to ONE panel — the whole of "mutually exclusive".
 *
 * The order of the tests is the precedence, and each step is a decision worth
 * stating:
 *
 *   1. **THINKING WINS.** A beat means an answer is arriving, and the panel
 *      that names what is being looked at is the honest thing to show. A miss
 *      recorded a moment earlier must not sit beside it.
 *   2. **A MISS BEATS THE EMPTY STATE.** A question WAS asked, so "nothing has
 *      been asked yet" would be untrue — and the fallback carries the same
 *      three questions the empty state would have pointed at anyway.
 *   3. **THE EMPTY STATE IS THE BASELINE**, read through `isBaseline` rather
 *      than a length check, so it stays correct if the baseline ever carries
 *      descriptors of its own.
 *
 * A pure function, exported for its own sake: the exclusivity is asserted over
 * every combination of inputs without rendering anything.
 */
export function canvasPanelFor(
  thinking: boolean,
  missed: boolean,
  sections: InsightSections,
): CanvasPanel {
  if (thinking) return CanvasPanel.THINKING;
  if (missed) return CanvasPanel.FALLBACK;
  if (isBaseline(sections)) return CanvasPanel.EMPTY;
  return CanvasPanel.NONE;
}

/* ----------------------------------------------------------------- HOOK -- */

/** The session values this hook reads. `DashboardState` satisfies it. */
export interface CanvasPanelSession {
  /** The answered questions. A new list every time one lands. */
  readonly sections: InsightSections;
  /** How many times Reset has been pressed — see the note above. */
  readonly generation: number;
}

export interface CanvasPanelState {
  /** The single panel to render. */
  readonly panel: CanvasPanel;
  /**
   * Record what a TYPED question resolved to — `askQuestion`'s return value,
   * handed straight over. `null` raises the fallback; a match clears it,
   * because the same submit is about to put an answer on screen.
   */
  readonly record: (match: IntentMatch | null) => void;
}

export function useCanvasPanel(
  session: CanvasPanelSession,
  thinking: boolean,
): CanvasPanelState {
  const { sections, generation } = session;

  /**
   * The section list an unmatched question was asked against, or `null` if the
   * last typed question resolved. Holding the LIST rather than a boolean is
   * what makes the fallback fall away on its own once the canvas moves on.
   */
  const [missedFor, setMissedFor] = useState<InsightSections | null>(null);

  /**
   * RESET DROPS THE FALLBACK. `generation` advances on every press, so the
   * miss is discarded in the same render as the clear — no effect, no
   * intermediate frame in which a freshly reset dashboard still shows the
   * panel. The React pattern for "adjust state when an input changes", and the
   * same wiring `useThinking` uses for the beat.
   */
  const [clearedFor, setClearedFor] = useState(generation);
  if (clearedFor !== generation) {
    setClearedFor(generation);
    setMissedFor(null);
  }

  const record = useCallback(
    (match: IntentMatch | null) => {
      setMissedFor(match === null ? sections : null);
    },
    [sections],
  );

  return {
    panel: canvasPanelFor(thinking, missedFor === sections, sections),
    record,
  };
}
