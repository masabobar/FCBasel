import { useCallback, useMemo, useState } from "react";

import { useReducedMotion } from "../hooks/use-motion";
import { type HeroId } from "../repositories/enums";
import { ChipKind, type ChipActions } from "./chips";
import { renderedKind } from "./follow-up-gate";
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
  const { sections, focus, generation, schedule, showHero, showFollowUp } =
    dashboard;
  const reducedMotion = useReducedMotion();

  /**
   * How many reveals have landed. `useDashboard` bumps it on EVERY reveal —
   * unconditionally, including a hero re-asked and a follow-up shown twice — so
   * it is a reliable "the answer is now on screen" signal. See below.
   */
  const tick = focus?.tick ?? 0;

  const [beat, setBeat] = useState<ThinkingBeat | null>(null);

  /**
   * The reveal count the panel went up over, or `null` when no panel is up.
   * The answer landing moves {@link tick} past it, which is how the panel knows
   * it is done — see the note below.
   */
  const [awaitedTick, setAwaitedTick] = useState<number | null>(null);

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
    setAwaitedTick(null);
  }

  /**
   * THE ANSWER TAKES THE PANEL DOWN — US-043, and it is a fix, not a
   * refactoring.
   *
   * WHAT WENT WRONG. The scheduled callback used to do `setBeat(null)` and then
   * land the answer, on the reasonable-looking assumption that the two were one
   * commit. They are not, and the reason is subtle: landing an answer runs
   * through `animateReflow`, and `document.startViewTransition` calls its update
   * callback ASYNCHRONOUSLY, after the browser has captured the outgoing frame.
   * So React was left with `setBeat(null)` alone at the end of the task, and
   * PAINTED IT: for two frames the canvas had no panel and no answer, which
   * `useCanvasPanel` correctly reads as "nothing has been asked yet" — and the
   * EMPTY STATE flashed back into the exact spot the panel had just left, then
   * got baked into the view transition's outgoing snapshot and ghosted across
   * the whole 400ms reflow. Measured in Chrome against the built bundle: a
   * ~51ms hole in the frame sample with neither panel nor section, and "Your
   * dashboard is ready" legible over the incoming answer in the screenshots.
   *
   * THE FIX IS TO STOP GUESSING WHEN THE ANSWER LANDS AND READ IT. `focus.tick`
   * advances as part of the reveal's own committed snapshot, so comparing it
   * against the value at the time the panel went up says exactly one thing:
   * the answer this beat was standing in for is now on screen. Dropping the
   * panel during THAT render puts both changes in one commit — no frame with
   * both, and no frame with neither.
   *
   * The React pattern for "adjust state when an input changes", the same one
   * the Reset wiring above uses. An effect would be a frame too late, which is
   * the entire bug.
   */
  if (awaitedTick !== null && tick !== awaitedTick) {
    setAwaitedTick(null);
    setBeat(null);
  }

  /**
   * Put the panel up, then ask for the answer once the delay has elapsed.
   *
   * The scheduled callback now does ONE thing. Taking the panel down is not its
   * job — see the note above; it belongs to the render in which the answer
   * arrives, and nothing here may pre-empt it.
   */
  const run = useCallback(
    (heroId: HeroId, kind: ChipKind, land: () => void) => {
      setBeat(thinkingBeatFor(heroId, kind));
      // The reveal count the panel went up over. A chip tapped while a beat is
      // already in flight replaces it and re-reads the same value, because no
      // reveal has happened in between.
      setAwaitedTick(tick);

      schedule(land, thinkingDelayMs(reducedMotion));
    },
    [schedule, reducedMotion, tick],
  );

  const actions = useMemo<ChipActions>(
    () => ({
      showHero: (heroId) => run(heroId, ChipKind.HERO, () => showHero(heroId)),

      /**
       * A follow-up asked before its hero has been answered renders the PARENT
       * (US-033's gate, in `./follow-up-gate.ts`), so the BEAT IS THE PARENT'S
       * TOO: `renderedKind` is asked what is about to appear, and the message
       * and sources follow that answer rather than the question. The panel can
       * therefore never say "Analysing badge selection trends" and then produce
       * the hero's headline figures.
       *
       * The gate is not re-decided here. This hook and `useDashboard` call the
       * same function over the same section list, which is why the panel and
       * the answer cannot disagree.
       */
      showFollowUp: (heroId) =>
        run(heroId, renderedKind(sections, heroId, ChipKind.FOLLOW_UP), () =>
          showFollowUp(heroId),
        ),
    }),
    [run, sections, showHero, showFollowUp],
  );

  return { beat, busy: beat !== null, actions };
}
