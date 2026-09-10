import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

/**
 * The branded application shell — the frame every state of the single screen
 * lives in (`screen-map.md` SCREEN-001).
 *
 * Layout: the navy sidebar on the left, the app bar across the top of the
 * remaining space, and below it the main canvas holding the tile grid.
 *
 * WHAT THIS FILE DOES NOT DO
 * It owns no dashboard content. The canvas grid is deliberately left empty for
 * US-013 (the four baseline tiles) and US-014 (hero sections inserted into
 * this same grid — the dashboard grows, it never clears). Tiles are passed in
 * as `children` and become grid items, so insertion is a change of children
 * and never a change of frame. The prompt bar (US-028) arrives the same way,
 * through `promptBar`: the shell places it below the canvas and reserves the
 * strip it covers, and knows nothing else about it.
 *
 * NO HORIZONTAL SCROLL AT 1920×1080 (`constraints.md` §3) is a structural
 * property here rather than a media query: the sidebar is the only fixed-width
 * box, everything beside it is `min-w-0 flex-1` so a wide child shrinks rather
 * than pushing the page out, and the shell clips any overflow that survives
 * that. Below `lg` the sidebar leaves entirely and the canvas takes the full
 * viewport width.
 */

/**
 * The canvas grid: 12 columns at `lg` and above, stepping down to 8 and then 4
 * on narrower viewports. Column counts are multiples of 12's factors so a tile
 * spanning 3, 4 or 6 columns still lands on a clean fraction at every step.
 *
 * Exported because US-013 and US-014 assert the tiles they insert sit in this
 * container, and a test pins the 12-column class.
 */
export const CANVAS_GRID_CLASS =
  "grid grid-cols-4 gap-grid-gap sm:grid-cols-8 lg:grid-cols-12";

/**
 * The strip the canvas leaves free at its foot for the pinned prompt bar
 * (US-028), applied ONLY when a bar is supplied.
 *
 * The bar is `fixed` — see `PROMPT_BAR_POSITION_CLASS` for why sticky cannot
 * work inside a shell that clips overflow — so it takes no space in the flow
 * and the canvas has to reserve it, or the last row of tiles would sit under
 * the bar with no way to scroll clear of it. It has to be comfortably taller
 * than the bar itself (field plus US-029's chip row); if the bar ever grows
 * past this, this number grows with it.
 *
 * 176px, RAISED FROM 128px BY US-043, and the measurement is the reason.
 * US-029's chip row GROWS as follow-ups are offered — the three hero chips plus
 * up to three follow-up chips — and past four chips it wraps to a second row.
 * Measured in Chrome against the built bundle at 1440x900, with the viewport at
 * rest: the bar is **117px** with a single chip row and **159px** with two, so
 * the old 128px reserve was 31px SHORT of the bar it was reserving. What that
 * cost was visible and specific — from the third question on, the last 14.2px of
 * the thinking panel, its data-source chips, sat UNDER the bar, and the chips
 * are information rather than decoration (`thinking-panel.tsx`: "which systems
 * is it looking at" is announced). US-040's `+10.5px` clearance is the same
 * arithmetic on the one-row bar: `128 - 117`. At 176px both cases clear —
 * `176 - 159 = +17px` at the tightest — and
 * `tests/e2e/presentation-sizing.spec.ts` re-measures it at eleven viewports
 * every run, so this number cannot fall behind the bar again in silence.
 */
export const PROMPT_BAR_CLEARANCE_CLASS = "pb-44";

export interface AppShellProps {
  /**
   * Reset handler, forwarded to the app-bar control. The shell renders the
   * affordance and nothing more; `app/root.tsx` passes `useDashboard`'s
   * `reset` (US-015), which is the only implementation there should ever be.
   */
  onReset?: () => void;
  /**
   * The persistent prompt bar (US-028), rendered after the canvas so it comes
   * last in the tab order and is the final thing on the page. It positions
   * itself; the shell's only job is to place it in the tree and to reserve the
   * strip it covers (see {@link PROMPT_BAR_CLEARANCE_CLASS}). Absent, the
   * canvas keeps its plain padding — nothing about the shell depends on there
   * being a bar.
   */
  promptBar?: ReactNode;
  /** Grid items for the main canvas — baseline tiles and hero sections. */
  children?: ReactNode;
  className?: string;
}

export function AppShell({
  onReset,
  promptBar,
  children,
  className,
}: AppShellProps) {
  return (
    <div
      data-slot="app-shell"
      className={cn(
        "flex min-h-screen w-full overflow-x-hidden bg-surface",
        className,
      )}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onReset={onReset} />

        <main
          data-slot="canvas"
          className={cn(
            "min-w-0 flex-1 overflow-x-hidden p-grid-gap",
            promptBar && PROMPT_BAR_CLEARANCE_CLASS,
          )}
        >
          <div data-slot="canvas-grid" className={CANVAS_GRID_CLASS}>
            {children}
          </div>
        </main>

        {promptBar}
      </div>
    </div>
  );
}
