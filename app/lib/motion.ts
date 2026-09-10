/**
 * Motion primitives — the JavaScript half of the reveal system.
 *
 * The animations themselves live in `app/app.css` (keyframes `fcbUp`,
 * `fcbGlow`, `fcbScan`, `fcbSrc` and the reduced-motion block). This module
 * carries only what CSS cannot express on its own:
 *
 *   1. the class names, so a component never types `"fcb-enter"` by hand and
 *      a rename stays a one-line change;
 *   2. the reduced-motion query, shared by CSS and by the hooks that read it;
 *   3. the view-transition wrapper that makes the grid reflow smoothly;
 *   4. the two scrolls — bringing a just-revealed section into view, and
 *      returning to the top on Reset — which are motion too and so read the
 *      same preference;
 *   5. the one scroll this product does NOT want: the browser's own restoration
 *      on reload, switched off in `disableScrollRestoration` (KL-3).
 *
 * CONSUMERS: THE FOUR HOOKS LIVE NEXT DOOR (US-027)
 * Anything that animates from React — chart geometry, a KPI number, an SVG
 * gradient id — imports from `app/lib/hooks/use-motion.ts`, which builds on
 * `reducedMotionQuery` / `prefersReducedMotion` below rather than restating the
 * query:
 *
 *   const reduced = useReducedMotion();          // boolean, reacts to changes
 *   const grown   = useGrow();                   // false -> true after a frame;
 *                                                // true AT ONCE under reduced motion
 *   const shown   = useCountUp(value);           // counts from the figure on
 *                                                // screen to `value` (~900ms)
 *   const uid     = useUid("bars");              // stable id for `url(#…)`
 *
 * This module stays the CSS-side half: class names, the query itself, the view
 * transition and the two scrolls. Do not add a second reduced-motion read.
 */

/* --------------------------------------------------------- CLASS NAMES -- */

/**
 * The four motion classes, one per keyframe in `app/app.css`.
 *
 * `glow` is an AMBIENT brand pulse — the sidebar status dot and the AI orbs.
 * It is deliberately not part of the tile-insertion path: a new tile fades and
 * rises and does nothing else (the Reference Guide removed the Build
 * Specification's gold highlight ring — `scope.md` §10). Do not reach for it
 * to decorate an inserted tile.
 */
export const MOTION_CLASS = {
  /** Entrance: fade in and rise. Carried by a newly inserted tile or section. */
  enter: "fcb-enter",
  /** Ambient gold pulse on a brand element. Never an insertion effect. */
  glow: "fcb-glow",
  /** Gold sweep across the top of the thinking panel. */
  scan: "fcb-scan",
  /** Data-source chip lighting up; the caller staggers `animation-delay`. */
  sourceChip: "fcb-src",
} as const;

export type MotionClass = (typeof MOTION_CLASS)[keyof typeof MOTION_CLASS];

/* ------------------------------------------------------ REDUCED MOTION -- */

/** The single spelling of the preference, shared with `app/app.css`. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The live {@link MediaQueryList} for the preference, or `null` where there is
 * no `matchMedia` to ask — the server, and any DOM-less renderer.
 *
 * The list, not just its boolean: `useReducedMotion` subscribes to its `change`
 * event so a preference flipped mid-session is honoured, and it must subscribe
 * to the same query the stylesheet uses. Handing out the list is what keeps
 * that a single spelling instead of two.
 */
export function reducedMotionQuery(): MediaQueryList | null {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

/**
 * Whether the visitor has asked for reduced motion, read once.
 *
 * Returns `false` during server rendering and wherever `matchMedia` is absent:
 * the CSS honours the preference on its own, so a miss here degrades to "let
 * the stylesheet decide" rather than to a broken screen. React components
 * should subscribe via US-027's `useReducedMotion` so a change of preference
 * mid-session is picked up; this direct read is for one-shot callers such as
 * `animateReflow` — and it is the snapshot that hook reads, so the two can
 * never disagree.
 */
export function prefersReducedMotion(): boolean {
  return reducedMotionQuery()?.matches ?? false;
}

/* --------------------------------------------------------- GRID REFLOW -- */

/** The one member of the transition object this module reads. */
interface ViewTransitionHandle {
  /** Resolves when the tween has finished and the pseudo-elements are gone. */
  readonly finished?: Promise<unknown>;
}

/** `startViewTransition` is not in every browser's lib.dom yet. */
type ViewTransitionDocument = Document & {
  startViewTransition?: (
    update: () => void,
  ) => ViewTransitionHandle | undefined;
};

/**
 * The reflow tween on screen right now, or `null` when the canvas is at rest.
 *
 * MODULE STATE, AND IT HAS TO BE. A view transition paints on
 * `::view-transition-*` pseudo-elements in a snapshot containing block that is
 * pinned to the viewport, so anything that SCROLLS while one is running slides
 * the live content out from under a static snapshot of the old one. This is the
 * one fact the two scrolls below need and cannot derive: `getAnimations()` has
 * nothing to report yet at the moment the section's mount effect runs, because
 * the pseudo-elements do not exist until the update callback has returned.
 */
let reflowInFlight: Promise<unknown> | null = null;

/**
 * A string reduced to something safe to use as a CSS identifier: anything
 * outside `[A-Za-z0-9_-]` collapses to a single hyphen, and leading/trailing
 * hyphens are dropped so the result composes cleanly behind a prefix.
 *
 * Two callers, which is why it is a function and not two regexes: the
 * `view-transition-name` below, and `useUid`, which has to launder React's
 * `useId()` (`«r0»` in some versions) into something legal inside `url(#…)`
 * and in a `querySelector`.
 */
export function cssIdentifier(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * A stable `view-transition-name` for a tile, so the browser can match the
 * same tile before and after an insertion and tween it to its new position.
 *
 * Names must be CSS identifiers and must be unique on the page, so a tile's
 * own id is sanitised rather than trusted, and the constant prefix keeps a name
 * that starts with a digit legal.
 */
export function viewTransitionName(key: string): string {
  return `fcb-tile-${cssIdentifier(key)}`;
}

/**
 * Run a state update that changes the dashboard grid, animating the tiles
 * already on screen to their new positions.
 *
 * CSS cannot transition a grid position, so a tile pushed down a row by an
 * insertion would otherwise jump. Wrapping the update in a view transition
 * lets the browser tween every named box between its old and new geometry;
 * `::view-transition-group(*)` in `app/app.css` times that to match the
 * insertion animation.
 *
 * The update always runs — under reduced motion, without browser support, or
 * on the server it simply runs unwrapped, so no caller has to branch and no
 * state change can be lost to a missing API.
 */
export function animateReflow(update: () => void): void {
  const doc =
    typeof document === "undefined"
      ? undefined
      : (document as ViewTransitionDocument);

  if (!doc?.startViewTransition || prefersReducedMotion()) {
    // Nothing will be tweening, so nothing has to wait for it.
    reflowInFlight = null;
    update();
    return;
  }

  const finished = doc.startViewTransition(update)?.finished ?? null;
  reflowInFlight = finished;

  // Released when this tween ends, and only if it is still the current one —
  // a second insertion replaces it rather than clearing the newer one. Both
  // outcomes settle: a transition that is SKIPPED rejects, and a skipped tween
  // is exactly as finished as a completed one for the purposes below.
  const settle = () => {
    if (reflowInFlight === finished) reflowInFlight = null;
  };
  void finished?.then(settle, settle);
}

/**
 * Run something once the reflow tween has finished — or straight away when
 * none is running.
 *
 * WHY THE SCROLLS WAIT (US-043, measured). Both scrolls below used to run in
 * the same commit as the insertion, which put a ~700px smooth scroll on top of
 * a 400ms view transition. The result, in Chrome against the built bundle: the
 * outgoing snapshot stayed pinned to the viewport while the live page glided
 * under it, so the reveal showed a doubled canvas and a white band up to ~80px
 * across the top of the screen for the length of the tween. Nothing was
 * dropping frames — it is a compositing artifact of moving the viewport while
 * the browser is cross-fading a snapshot of it.
 *
 * Waiting also puts the reveal in the ORDER THE CRITERION STATES: panel,
 * section, cards, numbers, geometry, and the auto-scroll LAST. The tiles
 * stagger in while the tween runs, so the wait is not dead time.
 *
 * It is not a timer (`.claude/rules` — the beat's is the only one in the
 * application): it is the transition's own `finished` promise, so the wait is
 * exactly as long as the tween and no longer.
 */
export function afterReflow(run: () => void): void {
  const tween = reflowInFlight;
  if (!tween) {
    run();
    return;
  }

  void tween.then(run, run);
}

/* ----------------------------------------------------------- AUTO-SCROLL -- */

/**
 * Bring a just-revealed section into view.
 *
 * The dashboard grows downwards, so an answer inserted below the fold would
 * otherwise land unseen. This is the third piece of the reveal system that
 * has to read the motion preference: a smooth scroll is motion, so under
 * reduced motion the view jumps to the same place instead of gliding to it.
 *
 * It deliberately does NOT focus the target. Moving focus mid-answer would
 * yank a keyboard user out of the prompt bar they are still typing in; the
 * section carries a real heading instead, so it can be reached on its own
 * terms.
 *
 * A missing node and an environment without `scrollIntoView` (jsdom, the
 * server) are both no-ops rather than throws: the reveal must not fail
 * because the view could not be scrolled.
 */
export function scrollRevealedIntoView(target: Element | null): void {
  if (typeof target?.scrollIntoView !== "function") return;

  // After the reflow tween, never during it — see {@link afterReflow}.
  afterReflow(() => {
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  });
}

/**
 * Take the browser's scroll restoration out of the demo's hands — KL-3, closed
 * here by US-043.
 *
 * WHAT WENT WRONG (measured by US-042, at the bottom of a full canvas, then
 * reloaded): session state is memory-only by specification, so a reload starts a
 * fresh session at the baseline — but the SCROLL OFFSET survived it. Clamped to
 * the much shorter baseline page, the restored offset landed the presenter at
 * its foot with the app bar — crest and Reset — scrolled out of view.
 * `scrollY 185` at 1920x1080, `scrollY 340` at 1440x900.
 *
 * WHY IT IS ONE LINE AND WHY THE LINE HAS TO BE HERE. Two mechanisms restore
 * that offset and BOTH have to go, which is what US-042 measured and why it
 * deferred the fix rather than guessing at it:
 *
 *   1. `<ScrollRestoration />` wrote `react-router-scroll-positions` into
 *      `sessionStorage` and replayed it on the next load. It is gone from
 *      `app/root.tsx` — with one route, no revalidation and no derived scroll
 *      state, it had nothing left to restore that the presenter wants restored.
 *   2. Chrome's OWN restoration then produced the identical offset, which is
 *      why removing the component alone was tried and rejected. `manual` is
 *      what switches that off, and it is also why the component had to go
 *      first: its `pagehide` handler sets the mode back to `auto` as the
 *      document unloads, so the two fixes cannot be applied in either order —
 *      only together.
 *
 * IT BELONGS IN THIS MODULE because a reload landing mid-page is a layout jump,
 * which is the same thing {@link scrollToTop} and {@link scrollRevealedIntoView}
 * exist to prevent — the three of them are now the whole of where this product
 * decides where the viewport points.
 *
 * Reports whether the mode was actually taken, so a test can assert the fix
 * rather than assert the call. An environment without `history` — the server,
 * jsdom without navigation — is a no-op and returns `false`: the preference
 * cannot be set, and nothing depends on it having been.
 */
export function disableScrollRestoration(): boolean {
  if (typeof window === "undefined" || !window.history) return false;

  // Not every engine implements the property; assigning to a missing one is
  // silently ignored, so the result is read back rather than assumed.
  window.history.scrollRestoration = "manual";
  return window.history.scrollRestoration === "manual";
}

/**
 * Return the view to the top of the dashboard — Reset's half of the scrolling
 * (US-015), the mirror image of {@link scrollRevealedIntoView}.
 *
 * The dashboard grows downwards and the presenter is usually far down it by the
 * end of a run, so a Reset that cleared the sections but left the viewport
 * scrolled would show a blank stretch of canvas rather than the baseline. It
 * is the PAGE that scrolls, not the canvas (the shell's `main` clips only
 * horizontally), so this scrolls the window.
 *
 * It reads the motion preference for the same reason the reveal does — a smooth
 * scroll is motion — and it moves focus nowhere. Repeated calls are safe: a
 * browser replaces an in-flight smooth scroll rather than stacking a second
 * one, which is what keeps Reset pressed repeatedly free of overlapping
 * animation. An environment without `scrollTo` (the server) is a no-op.
 */
export function scrollToTop(): void {
  if (typeof window === "undefined" || typeof window.scrollTo !== "function") {
    return;
  }

  // After the reflow tween, for the same reason the reveal's scroll waits —
  // Reset clears sections, which is a reflow like any other.
  afterReflow(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  });
}
