import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  cssIdentifier,
  prefersReducedMotion,
  reducedMotionQuery,
} from "../motion";
import { durationMs } from "../tokens";

/**
 * Motion hooks — the JavaScript half of the animation system, for the things
 * CSS cannot do on its own.
 *
 * `app/lib/motion.ts` + `app/app.css` (US-006) animate the DOM: a tile fades
 * and rises, the grid reflows, the scan line sweeps. What they cannot do is
 * interpolate a NUMBER, decide when geometry is allowed to leave its zero
 * state, or invent an id — so the hand-built SVG charts of E6 need these four,
 * and nothing else.
 *
 * ┌──────────────────────────────── THE CONSUMER API ─────────────────────────┐
 * │ const reduced = useReducedMotion();      → boolean, tracks the preference │
 * │ const grown   = useGrow();               → false, then true after a frame │
 * │ const shown   = useCountUp(value);       → counts from the figure on      │
 * │                                            screen to `value` (~900ms)     │
 * │ const uid     = useUid("bars");          → "bars-r3", stable per instance │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * HOW A CHART USES THEM (the shape US-017 to US-026 should all take):
 *
 * ```tsx
 * const grown = useGrow();
 * const shown = useCountUp(row.value);
 * const uid = useUid("hbar");
 *
 * return (
 *   <svg>
 *     <defs>
 *       <linearGradient id={`${uid}-fill`}>…</linearGradient>
 *     </defs>
 *     <rect
 *       fill={`url(#${uid}-fill)`}
 *       width={grown ? scale(row.value) : 0}
 *       className="transition-[width] duration-grow ease-enter"
 *     />
 *     <text>{formatMoney(shown)}</text>
 *   </svg>
 * );
 * ```
 *
 * Four rules that hold for all four hooks, and are the reason they exist:
 *
 *   1. **ONE reduced-motion source.** `useGrow` and `useCountUp` read
 *      {@link useReducedMotion}, which reads `app/lib/motion.ts`'s
 *      `REDUCED_MOTION_QUERY` — the same string `app/app.css` matches on. No
 *      component may call `matchMedia` itself.
 *   2. **Reduced motion means FINAL STATE, never zero.** `useGrow` returns
 *      `true` and `useCountUp` returns the target in the very render the
 *      preference is read — not one effect later — so geometry keyed off them
 *      can never be left waiting for a transition that will not run. This is
 *      US-006's CSS principle ("collapse to the last frame, do not switch the
 *      animation off") restated in JavaScript.
 *   3. **SSR-safe.** Nothing here touches `window`, `document` or `matchMedia`
 *      during render, and the first client render matches the server's, so
 *      hydration is quiet. Growth and counting begin after mount, in an effect.
 *   4. **Nothing outlives the component.** Every frame requested is cancelled
 *      and every listener removed on unmount. Ten charts animating at once is
 *      the normal case on the demo machine; a leaked `requestAnimationFrame`
 *      loop per chart is a real performance problem, not a theoretical one.
 *
 * Timings come from the token set (`../tokens`), so the whole system can still
 * be retimed from one file.
 */

/* ------------------------------------------------------ REDUCED MOTION -- */

/** Nothing to unsubscribe from — the server, or a browser without `matchMedia`. */
const NOTHING_TO_UNSUBSCRIBE = (): void => {};

/**
 * Subscribe to preference CHANGES, not just its value at mount.
 *
 * A presenter who turns "reduce motion" on mid-demo must be obeyed by the
 * charts already on screen; the stylesheet reacts on its own, and this is how
 * the JavaScript half keeps up. Both the modern `change` listener and the
 * legacy `addListener` are handled, and either way the unsubscribe is returned
 * — React calls it on unmount, so nothing is left attached to the query list.
 */
function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  const query = reducedMotionQuery();
  if (!query) return NOTHING_TO_UNSUBSCRIBE;

  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onStoreChange);
    return () => query.removeEventListener("change", onStoreChange);
  }

  // Safari < 14 and jsdom stubs: the pre-`EventTarget` MediaQueryList API.
  if (typeof query.addListener === "function") {
    query.addListener(onStoreChange);
    return () => query.removeListener(onStoreChange);
  }

  return NOTHING_TO_UNSUBSCRIBE;
}

/**
 * The server has no preference to read, so it reports "no preference" — the
 * same answer the first client render gives, which is what keeps hydration
 * quiet. The real value arrives immediately afterwards, and the stylesheet has
 * been honouring the preference all along regardless.
 */
function reducedMotionOnServer(): boolean {
  return false;
}

/**
 * Whether the visitor has asked for reduced motion, kept up to date.
 *
 * `useSyncExternalStore` rather than `useState` + an effect: it is the one
 * subscription primitive that takes an explicit server snapshot, so the hook is
 * SSR-safe by construction instead of by convention, and React owns the
 * unsubscribe.
 *
 * Prefer this to `prefersReducedMotion()` inside a component — the direct read
 * cannot react to a change. They share the same snapshot function, so the two
 * can never disagree about what the preference is.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    reducedMotionOnServer,
  );
}

/* ---------------------------------------------------------------- GROW -- */

/**
 * `false` on the first paint, `true` from the next frame — the switch chart
 * geometry keys its "grown" state off, so bars, rings and areas transition up
 * from zero instead of appearing at full size.
 *
 * TWO FRAMES, not one. A CSS transition needs the browser to have taken the
 * "from" style before the "to" style lands; flipping the flag in the same frame
 * the element first rendered would produce no transition at all, only a snap.
 * Waiting a frame after the frame the geometry was painted in is what makes the
 * growth actually animate.
 *
 * UNDER REDUCED MOTION IT IS `true` IMMEDIATELY — in the same render, not after
 * an effect. That is the whole point of the hook rather than a `setTimeout` in
 * each chart: a `width={grown ? w : 0}` with a transition that will never run
 * would otherwise strand every bar, ring and area at zero, which is a blank
 * chart, not a calm one. The same applies where `requestAnimationFrame` does
 * not exist at all.
 */
export function useGrow(): boolean {
  const reduced = useReducedMotion();
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    // Under reduced motion the returned value is already `true`; there is
    // nothing to schedule and nothing to clean up.
    if (reduced) return;

    return afterTwoFrames(() => setGrown(true));
  }, [reduced]);

  return grown || reduced;
}

/**
 * Run something two frames from now, and hand back the cancellation.
 *
 * Where `requestAnimationFrame` does not exist — a DOM-less renderer, an
 * environment that stubs it away — it degrades to a `setTimeout`, so the growth
 * still happens and geometry is still never stranded at zero. Either way the
 * returned function cancels whatever is outstanding, which is what an unmount
 * calls.
 */
function afterTwoFrames(run: () => void): () => void {
  if (typeof requestAnimationFrame !== "function") {
    const timer = setTimeout(run, 0);
    return () => clearTimeout(timer);
  }

  let second = 0;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(run);
  });

  return () => {
    cancelAnimationFrame(first);
    cancelAnimationFrame(second);
  };
}

/* -------------------------------------------------------------- COUNT UP -- */

/** Where a number counts from the first time — the entrance count-up. */
const COUNT_UP_ORIGIN = 0;

/** ~900ms, from the token set. Exported so a caller can reason about it. */
export const COUNT_UP_DURATION_MS = durationMs("countUp");

/** `1 - (1 - t)³` — quick off the mark, gliding into the final digit. */
function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/**
 * A number animating to `target` — **from whatever figure is on screen right
 * now**, not from zero.
 *
 * THIS IS THE POINT OF THE HOOK. The displayed value is mirrored in a ref as
 * every frame commits it, so when the target changes mid-flight — a period
 * filter switched while the entrance count-up is still running — the next
 * animation starts from the value the presenter can see. A naive
 * `0 -> target` on every change would make every filter press flash back to
 * zero and re-count, in all ten components that use this. On mount there is
 * nothing on screen yet, so the first run counts up from
 * {@link COUNT_UP_ORIGIN} — the entrance count-up of the reveal.
 *
 * It lands EXACTLY on the target: the final frame assigns `target` itself
 * rather than an eased approximation of it, so no tile can settle on a figure
 * that disagrees with the chart beside it.
 *
 * Under reduced motion it returns the target outright, in the same render the
 * preference is read. Mid-flight values are plain floats — render them through
 * `app/lib/format.ts`, whose formatters round.
 */
export function useCountUp(
  target: number,
  animationMs: number = COUNT_UP_DURATION_MS,
): number {
  const reduced = useReducedMotion();
  const [displayed, setDisplayed] = useState<number>(COUNT_UP_ORIGIN);

  /**
   * The value on screen, mirrored as each frame commits it. A ref and not
   * state, and not a dependency of the effect below: reading it there is what
   * lets a new target continue from the current figure, whereas depending on it
   * would restart the animation on every frame it wrote.
   */
  const onScreen = useRef<number>(COUNT_UP_ORIGIN);

  useEffect(() => {
    const from = onScreen.current;

    // Nothing to animate — the preference asks for none, the figure is already
    // there, or there is no clock to animate against (a DOM-less renderer). In
    // every case the target is shown outright; a count-up must never be the
    // reason a number is missing.
    if (
      reduced ||
      from === target ||
      animationMs <= 0 ||
      !Number.isFinite(target) ||
      typeof requestAnimationFrame !== "function"
    ) {
      onScreen.current = target;
      setDisplayed(target);
      return;
    }

    // The first frame's own timestamp is the start, so the count is not
    // charged for the gap between committing and being painted.
    let started: number | null = null;
    let frame = 0;

    const step = (timestamp: number): void => {
      started ??= timestamp;
      const progress = Math.min((timestamp - started) / animationMs, 1);
      const value =
        progress === 1
          ? target
          : from + (target - from) * easeOutCubic(progress);

      onScreen.current = value;
      setDisplayed(value);

      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    // Cancels the pending frame both on unmount and on a target change — the
    // latter is what stops two animations from fighting over the same number.
    return () => cancelAnimationFrame(frame);
  }, [target, animationMs, reduced]);

  return reduced ? target : displayed;
}

/* ------------------------------------------------------------------- UID -- */

/** Default namespace for a generated id. */
const UID_PREFIX = "fcb";

/**
 * A stable, unique, CSS-legal id for this component instance — for SVG
 * `<linearGradient>`, `<clipPath>` and `<filter>` ids, which are referenced by
 * `url(#…)` and are therefore document-global.
 *
 * Two bar charts on screen with a hard-coded `id="barFill"` do not draw two
 * gradients; the second silently repaints the first, and which one wins depends
 * on render order. Since a hero can show three charts of the same kind at once,
 * every id has to come from here.
 *
 * ONE id per instance, suffixed per definition — `${uid}-fill`, `${uid}-stroke`
 * — rather than one hook call per gradient. Stable across re-renders (React's
 * `useId`, so it is also identical on server and client) and laundered through
 * `cssIdentifier`, because `useId()` output is not a legal CSS identifier in
 * every React version.
 */
export function useUid(prefix: string = UID_PREFIX): string {
  const reactId = useId();

  return useMemo(
    () => `${cssIdentifier(prefix) || UID_PREFIX}-${cssIdentifier(reactId)}`,
    [prefix, reactId],
  );
}
