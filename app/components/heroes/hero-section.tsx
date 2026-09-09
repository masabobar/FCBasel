import { useEffect, useRef } from "react";

import { cn } from "../../lib/cn";
import {
  InsightPhase,
  type InsightSection,
} from "../../lib/dashboard/sections";
import { scrollRevealedIntoView, viewTransitionName } from "../../lib/motion";
import { type HeroId } from "../../lib/repositories/enums";
import { Card } from "../tiles/card";

/**
 * One answered question, as a self-contained insight section on the canvas.
 *
 * WHAT IS BUILT HERE AND WHAT IS NOT
 * This is the INSERTION MACHINERY (US-014): the section frame, its place in
 * the canvas grid, the entrance stagger, and the auto-scroll that brings it
 * into view. The three heroes' actual tiles are Phase 2b components and their
 * narratives and figures are Phase 3b (US-034 to US-039), so the body below is
 * a **clearly-marked placeholder** — it invents no narrative and no number.
 * {@link HeroSectionBody} is the single seam those stories replace.
 *
 * ONE GRID, NOT TWO. A section is not a box that owns its own layout: it spans
 * the canvas grid's full width and re-uses the parent's column tracks through
 * `grid-cols-subgrid`, so a tile that asks for 4 of 12 columns lands on the
 * SAME tracks as a baseline tile. That is what keeps the dashboard reading as
 * one growing grid rather than a stack of independently-laid-out panels.
 *
 * REFLOW, NEVER JUMP. The section carries a stable `view-transition-name`, so
 * when a later answer pushes it down the browser can pair it with itself
 * across the update and tween it to its new position (US-006's `animateReflow`
 * runs the update; `::view-transition-group(*)` in `app/app.css` times it).
 */

/* ---------------------------------------------------------- GRID PLACEMENT -- */

/**
 * The section's own placement: the full width of the canvas grid, with its
 * children re-using that grid's columns rather than starting a new grid.
 */
export const SECTION_GRID_CLASS =
  "col-span-full grid grid-cols-subgrid gap-grid-gap";

/** A placeholder tile: full width on narrow viewports, half the grid at `lg`. */
const PLACEHOLDER_TILE_CLASS = "col-span-full lg:col-span-6";

/* ----------------------------------------------------------------- STAGGER -- */

/** Gap between one tile's entrance and the next, so the cascade reads as one. */
export const TILE_STAGGER_MS = 90;

/**
 * The entrance delay for the tile at `index` within a section.
 *
 * Exported because the Phase 3b heroes compose their own tiles: they stagger
 * through this function and hand the result to `Card`'s `delayMs`, so every
 * section's cascade is timed identically instead of each hero inventing a
 * rhythm.
 */
export function tileDelayMs(index: number): number {
  return index * TILE_STAGGER_MS;
}

/* ------------------------------------------------------------ PLACEHOLDER -- */

/** Marks the stand-in content, so it can never be mistaken for the real thing. */
export const PLACEHOLDER_MARKER = "Placeholder";

/** Where the hero's verbatim narrative goes — never paraphrased here. */
export const PLACEHOLDER_NARRATIVE =
  "Placeholder — the narrative for this answer is stated here first, verbatim from its dataset (US-034 to US-039).";

/** Where the hero's tiles go. */
export const PLACEHOLDER_TILE_BODY =
  "Placeholder — this hero's tiles are inserted here in their defined order (Phase 2b tile components, Phase 3b content).";

/** Where the follow-up's recommendation panel goes. */
export const PLACEHOLDER_FOLLOW_UP_BODY =
  "Placeholder — the follow-up sharpens this same section from what happened to why, and what to do.";

/**
 * The stand-in body of a section: one tile at `primary`, and a second, gold-
 * accented one once the phase has flipped to `withFollowUp` — so the flip is
 * visibly a section growing rather than a new section appearing.
 *
 * THE SEAM: US-034 to US-039 replace this component with per-hero content
 * selected by `heroId`, keeping the same two inputs and the same stagger
 * (`tileDelayMs`). Nothing outside this function needs to change, and the hero
 * id stops being rendered at that point — it is an identifier, not a label.
 */
function HeroSectionBody({
  heroId,
  phase,
}: {
  heroId: HeroId;
  phase: InsightPhase;
}) {
  return (
    <>
      <Card
        title={`${PLACEHOLDER_MARKER} tile · ${heroId}`}
        subtitle="Tiles are Phase 2b · content is Phase 3b"
        isNew
        delayMs={tileDelayMs(0)}
        className={PLACEHOLDER_TILE_CLASS}
      >
        <p data-slot="placeholder-tile-body">{PLACEHOLDER_TILE_BODY}</p>
      </Card>

      {phase === InsightPhase.WITH_FOLLOW_UP && (
        <Card
          title={`${PLACEHOLDER_MARKER} follow-up · ${heroId}`}
          accent="gold"
          isNew
          delayMs={tileDelayMs(1)}
          className={PLACEHOLDER_TILE_CLASS}
        >
          <p data-slot="placeholder-follow-up-body">
            {PLACEHOLDER_FOLLOW_UP_BODY}
          </p>
        </Card>
      )}
    </>
  );
}

/* ---------------------------------------------------------- SECTION HEAD -- */

/**
 * The head of a section: its label, then its narrative.
 *
 * NARRATIVE FIRST is a product rule, not a layout preference — the answer is
 * stated in words before any chart is offered as evidence. The label is a real
 * `h2` so a dashboard that grows section by section stays walkable by heading;
 * the tiles inside each carry an `h3` (`Card`'s default).
 *
 * No font-size utility on the narrative on purpose: `body` already sets
 * `--text-body`, and a `text-body` class would sit in the same `tailwind-merge`
 * conflict group as `text-muted`, which silently drops one of the two.
 */
export function SectionHead({
  id,
  label,
  narrative,
}: {
  id: string;
  label: string;
  narrative: string;
}) {
  return (
    <div data-slot="section-head" className="col-span-full">
      <h2 id={id} className="tile-title">
        {label}
      </h2>
      <p data-slot="section-narrative" className="mt-1.5 text-muted">
        {narrative}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- SECTION -- */

export interface HeroSectionProps {
  /** The descriptor to render: which hero answered, and how far. */
  section: InsightSection;
  /**
   * Set when this is the section that just changed — the reveal counter from
   * `useDashboard`'s focus. A changed value scrolls the section into view; a
   * `null` means another section was the one that changed.
   */
  focusTick?: number | null;
  className?: string;
}

export function HeroSection({
  section,
  focusTick = null,
  className,
}: HeroSectionProps) {
  const { heroId, phase } = section;
  const element = useRef<HTMLElement>(null);
  const labelId = `insight-${heroId}-label`;

  // Auto-scroll lives with the node it scrolls. Keyed on the reveal counter,
  // so re-asking the same hero brings it back into view instead of the effect
  // seeing an unchanged value and skipping.
  useEffect(() => {
    if (focusTick === null) return;
    scrollRevealedIntoView(element.current);
  }, [focusTick]);

  return (
    <section
      ref={element}
      data-slot="insight-section"
      data-hero-id={heroId}
      data-phase={phase}
      aria-labelledby={labelId}
      className={cn(SECTION_GRID_CLASS, className)}
      // Pairs this section with itself across an insertion so it glides to its
      // new row. Unique on the page because sections are deduped by hero id.
      style={{ viewTransitionName: viewTransitionName(heroId) }}
    >
      <SectionHead
        id={labelId}
        label={`${PLACEHOLDER_MARKER} insight · ${heroId}`}
        narrative={PLACEHOLDER_NARRATIVE}
      />
      <HeroSectionBody heroId={heroId} phase={phase} />
    </section>
  );
}
