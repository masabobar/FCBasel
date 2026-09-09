import { useCallback, useMemo, useState } from "react";

import { useReducedMotion } from "../hooks/use-motion";
import { type HeroId } from "../repositories/enums";
import { ChipKind, type ChipActions } from "./chips";
import { hasSection } from "./sections";
import {
  type ThinkingBeat,
  thinkingBeatFor,
  thinkingDelayMs,
} from "./thinking";
import { type DashboardState } from "./use-dashboard";

/**
 * The thinking beat, as a state machine — US-031.
 *
 * It wraps `useDashboard`'s two actions in a pause: instead of a question
 * landing its answer immediately, the panel goes up, a fixed delay elapses, and
 * THEN the section renders. Nothing else about either question path changes,
 * which is the point of the shape below.
 *
 * ┌──────────────────────────── HOW IT COMPOSES ──────────────────────────────┐
 * │ const dashboard = useDashboard();                                        │
 * │ const { beat, busy, actions } = useThinking(dashboard);                   │
 * │                                                                          │
 * │ askQuestion(question, actions);   // typed  — US-030's matcher            │
 * │ selectChip(chip, actions);        // tapped — US-029's chips              │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * {@link ThinkingState.actions} SATISFIES `ChipActions`, which is the interface
 * both `askQuestion` and `selectChip` already take. So both paths run through
 * the beat — the reference build's `runHero` / `runFollow` for a tap and for a
 * typed question alike — and NEITHER module changed by a line. In particular
 * the chip path still bypasses US-030's scoring entirely (a chip carries a
 * {@link HeroId}, never a string) and the typed path still resolves through it:
 * this hook sits BELOW the fork, not across it.
 *
 * A NO-MATCH SHOWS NO BEAT. `askQuestion` returns `null` without calling either
 * action, so an off-script question never reaches this hook and the panel never
 * appears for it. That is deliberate — a beat implies an answer is coming, and
 * US-032's fallback panel is a different promise.
 *
 * ONE TIMER IN THE WHOLE APPLICATION (US-015). The delay is scheduled through
 * {@link DashboardState.schedule}, the single pending timer `useDashboard`
 * owns, and there is NO `setTimeout` in this file. That is what closes US-015
 * criterion 4 — "pressed mid-flow (during a thinking beat) leaves no broken
 * state and no orphaned animation":
 *
 *   - Reset cancels the pending beat FIRST, before it touches state, so the
 *     scheduled callback never runs and no answer can insert itself into a
 *     dashboard that was just cleared.
 *   - Reset advances {@link DashboardState.generation}, and this hook drops the
 *     panel when it does — see below. So the animation on screen goes with the
 *     timer behind it, and neither outlives the press.
 *
 * A SECOND QUESTION CANNOT OVERLAP THE FIRST, two ways over. The typed path is
 * closed while a beat is in flight ({@link ThinkingState.busy} disables the
 * field and the send button, US-028), and a chip tap — which stays available,
 * as it does in the reference — REPLACES the beat rather than racing it,
 * because `schedule` only ever holds one timer. Either way exactly one answer
 * lands.
 *
 * THE PANEL IS NOT STATE THE DASHBOARD OWNS, and that is `useDashboard`'s own
 * design: its `generation` counter is documented as the extension point for
 * "state that genuinely cannot be derived", which the beat is — it exists only
 * between a question and its answer, and no session value implies it. Keying on
 * `generation` (below) is the wiring that hook named, and it means Reset needs
 * no knowledge of the beat at all.
 */

/** What `app/root.tsx` needs to run and render the beat. */
export interface ThinkingState {
  /**
   * The beat to put on screen, or `null` when nothing is in flight. Hand it to
   * `ThinkingPanel`; it is the reason the section has not rendered yet.
   */
  readonly beat: ThinkingBeat | null;
  /**
   * A beat is in flight. Passed to the prompt bar's `busy`, which disables the
   * field and the send button so a second question cannot start one.
   */
  readonly busy: boolean;
  /**
   * The two dashboard actions, each wrapped in the beat. Structurally a
   * {@link ChipActions}, so `askQuestion` and `selectChip` take it as it
   * stands.
   */
  readonly actions: ChipActions;
}

export function useThinking(dashboard: DashboardState): ThinkingState {
  const { sections, generation, schedule, showHero, showFollowUp } = dashboard;
  const reducedMotion = useReducedMotion();

  const [beat, setBeat] = useState<ThinkingBeat | null>(null);

  /**
   * RESET DROPS THE PANEL. `generation` advances on every press, so a beat in
   * flight is discarded the moment the dashboard is cleared — in the same
   * render as the clear, not an effect later, so there is no frame in which a
   * cleared canvas still claims to be thinking.
   *
   * The React pattern for "adjust state when an input changes": compare against
   * the value the current state was computed for and set both during render.
   * An effect would leave that intermediate frame on screen, and reaching into
   * this hook from `reset` would give the beat a second owner.
   */
  const [clearedFor, setClearedFor] = useState(generation);
  if (clearedFor !== generation) {
    setClearedFor(generation);
    setBeat(null);
  }

  /**
   * Put the panel up, then land the answer once the delay has elapsed.
   *
   * The two writes in the scheduled callback are one update as far as the
   * screen is concerned: the panel comes down and the section goes up in the
   * same commit (`useDashboard` commits inside `flushSync`), so the beat is
   * never on screen beside the answer it was standing in for.
   */
  const run = useCallback(
    (heroId: HeroId, kind: ChipKind, land: () => void) => {
      setBeat(thinkingBeatFor(heroId, kind));

      schedule(() => {
        setBeat(null);
        land();
      }, thinkingDelayMs(reducedMotion));
    },
    [schedule, reducedMotion],
  );

  const actions = useMemo<ChipActions>(
    () => ({
      showHero: (heroId) => run(heroId, ChipKind.HERO, () => showHero(heroId)),

      /**
       * A follow-up asked before its hero has been answered renders the PARENT
       * — `useDashboard.showFollowUp` has always done that, and US-033 owns the
       * other half (offering the follow-up chip afterwards). The beat simply
       * agrees with it: the message and sources are the ones for the answer
       * that is actually about to appear, so the panel can never say
       * "Analysing badge selection trends" and then produce the hero's
       * headline figures.
       */
      showFollowUp: (heroId) =>
        run(
          heroId,
          hasSection(sections, heroId) ? ChipKind.FOLLOW_UP : ChipKind.HERO,
          () => showFollowUp(heroId),
        ),
    }),
    [run, sections, showHero, showFollowUp],
  );

  return { beat, busy: beat !== null, actions };
}
