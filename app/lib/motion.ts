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
 *   3. the view-transition wrapper that makes the grid reflow smoothly.
 *
 * The `useReducedMotion` / `useGrow` / `useCountUp` hooks that drive chart
 * geometry are US-027's; they build on `REDUCED_MOTION_QUERY` and
 * `prefersReducedMotion` below rather than restating the query.
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
 * Whether the visitor has asked for reduced motion, read once.
 *
 * Returns `false` during server rendering and wherever `matchMedia` is absent:
 * the CSS honours the preference on its own, so a miss here degrades to "let
 * the stylesheet decide" rather than to a broken screen. React components
 * should subscribe via US-027's `useReducedMotion` so a change of preference
 * mid-session is picked up; this direct read is for one-shot callers such as
 * `animateReflow`.
 */
export function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/* --------------------------------------------------------- GRID REFLOW -- */

/** `startViewTransition` is not in every browser's lib.dom yet. */
type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

/**
 * A stable `view-transition-name` for a tile, so the browser can match the
 * same tile before and after an insertion and tween it to its new position.
 *
 * Names must be CSS identifiers and must be unique on the page, so a tile's
 * own id is sanitised rather than trusted: anything outside `[A-Za-z0-9_-]`
 * becomes a hyphen, and the constant prefix keeps a name that starts with a
 * digit legal.
 */
export function viewTransitionName(key: string): string {
  return `fcb-tile-${key.replace(/[^A-Za-z0-9_-]+/g, "-")}`;
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
