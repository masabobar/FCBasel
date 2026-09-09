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
 *      same preference.
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

/** `startViewTransition` is not in every browser's lib.dom yet. */
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

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
    update();
    return;
  }

  doc.startViewTransition(update);
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

  target.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
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

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}
