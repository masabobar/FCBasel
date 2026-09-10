import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "../../lib/cn";
import {
  InsightPhase,
  type InsightSection,
} from "../../lib/dashboard/sections";
import { scrollRevealedIntoView, viewTransitionName } from "../../lib/motion";
import { type HeroId } from "../../lib/repositories/enums";
import {
  Card,
  CARD_ACCENTS,
  CardCaption,
  TILE_ENTER_CLASS,
} from "../tiles/card";

/**
 * One answered question, as a self-contained insight section on the canvas.
 *
 * WHAT IS BUILT HERE AND WHAT IS NOT
 * This is the INSERTION MACHINERY (US-014): the section frame, its place in
 * the canvas grid, the entrance stagger, and the auto-scroll that brings it
 * into view. WHAT goes inside is per hero and arrives as `children`, chosen by
 * `./insight-sections.tsx` — Hero 1's real content is `./hero-1.tsx` (US-034)
 * and Heroes 2 and 3 are still the **clearly-marked placeholder** below
 * ({@link PlaceholderBody}), which invents no narrative and no number until
 * US-036 and US-038 replace it.
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
 *
 * THE CONTENT IS PASSED IN RATHER THAN SELECTED HERE, so the frame does not
 * import the heroes and the heroes can import the frame's own head and stagger.
 * The section's heading id is therefore derived from the hero id by
 * {@link sectionLabelId}, which both halves call — the `aria-labelledby` here
 * and the `id` on the head inside cannot drift apart.
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

/* -------------------------------------------------------------- IDENTITY -- */

/**
 * The id of a section's own heading, derived from the hero it answers.
 *
 * Both the `aria-labelledby` on the `<section>` and the `id` on the head inside
 * it come from here, so a section built out of two modules is still labelled by
 * its own heading. Hero ids are unique on the canvas (sections are deduped by
 * them), so these ids are unique too.
 */
export function sectionLabelId(heroId: HeroId): string {
  return `insight-${heroId}-label`;
}

/* -------------------------------------------------- FOLLOW-UP DIVIDER -- */

/**
 * The word on the divider that opens a follow-up beat. An affordance — "a
 * second question was asked and this is its answer" — not narrative copy, so
 * it belongs to the frame rather than to any hero's dataset.
 */
export const FOLLOW_UP_DIVIDER_LABEL = "Follow-up";

/**
 * The rule's thickness. The tile accent is 3px across the top of a card and the
 * recommendation panel's is 3px down its side; this one is a hairline BELOW
 * both, because it is a seam in the page rather than an edge of a component.
 */
const DIVIDER_RULE_CLASS = "h-[2px]";

/**
 * The gold "Follow-up" divider — the seam between a section's primary answer
 * and the beat that interprets it.
 *
 * IT LIVES HERE, IN THE FRAME, AND NOT IN A HERO. All three follow-ups open the
 * same way (US-035 Hero 1, US-037 Hero 2, US-039 Hero 3), so the divider is one
 * component the heroes import — the alternative is three near-identical gold
 * rules that drift in thickness, wording and spacing across the three peak
 * moments of the prototype.
 *
 * GOLD IS SPENT ONCE PER BEAT. Colour discipline rule 4 (`app/lib/tokens.ts`)
 * allows gold in exactly two places, and the follow-up treatment is one of
 * them. This divider and the beat's `RecommendationPanel` are that treatment
 * together: the divider says WHERE the beat starts and the panel says WHICH
 * part of it is advice. A hero must therefore NOT also accent its follow-up
 * tiles gold — a chart inside the beat is still a chart, and a third gold mark
 * in one section spends the accent until it means nothing.
 *
 * It is a full-width grid item, so it separates rows of the canvas grid rather
 * than sitting inside a card; and it takes `delayMs` like a tile, so it enters
 * as the first step of the beat's cascade instead of appearing before it.
 */
export function FollowUpDivider({
  isNew = false,
  delayMs = 0,
  className,
}: {
  /** Marks a newly inserted divider, so US-006's entrance animation applies. */
  isNew?: boolean;
  /** Stagger, in milliseconds, applied to that entrance animation. */
  delayMs?: number;
  className?: string;
}) {
  return (
    <div
      data-slot="follow-up-divider"
      className={cn(
        "col-span-full mt-2 flex items-center gap-3",
        isNew && TILE_ENTER_CLASS,
        className,
      )}
      // Only the stagger is set here; `app/app.css` states the final state
      // outright under reduced motion, so nothing is left mid-fade.
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <span
        data-slot="follow-up-divider-label"
        className="tile-title shrink-0 text-accent-follow-up"
      >
        {FOLLOW_UP_DIVIDER_LABEL}
      </span>
      {/* Decorative: the word beside it already announces the beat. */}
      <span
        data-slot="follow-up-divider-rule"
        aria-hidden="true"
        className={cn(
          "flex-1 rounded-full",
          DIVIDER_RULE_CLASS,
          CARD_ACCENTS.gold,
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------ PLACEHOLDER -- */

/** Marks the stand-in content, so it can never be mistaken for the real thing. */
export const PLACEHOLDER_MARKER = "Placeholder";

/** Where the hero's verbatim narrative goes — never paraphrased here. */
export const PLACEHOLDER_NARRATIVE =
  "Placeholder — the narrative for this answer is stated here first, verbatim from its dataset (US-036 and US-038).";

/** Where the hero's tiles go. */
export const PLACEHOLDER_TILE_BODY =
  "Placeholder — this hero's tiles are inserted here in their defined order (Phase 2b tile components, Phase 3b content).";

/** Where the follow-up's recommendation panel goes. */
export const PLACEHOLDER_FOLLOW_UP_BODY =
  "Placeholder — the follow-up sharpens this same section from what happened to why, and what to do.";

/**
 * The follow-up beat's stand-in: one gold-accented tile added to the section
 * that is already on screen, so the flip is visibly a section GROWING rather
 * than a new section appearing.
 *
 * Still shared by all three heroes, Hero 1 included: US-035, US-037 and US-039
 * replace it one hero at a time. It takes `delayMs` rather than an index
 * because it follows however many tiles its hero rendered — three for Hero 1,
 * one for a hero still on the placeholder.
 */
export function PlaceholderFollowUp({
  heroId,
  delayMs,
}: {
  heroId: HeroId;
  delayMs: number;
}) {
  return (
    <Card
      title={`${PLACEHOLDER_MARKER} follow-up · ${heroId}`}
      accent="gold"
      isNew
      delayMs={delayMs}
      className={PLACEHOLDER_TILE_CLASS}
    >
      <p data-slot="placeholder-follow-up-body">{PLACEHOLDER_FOLLOW_UP_BODY}</p>
    </Card>
  );
}

/**
 * A whole section's stand-in body — head and one tile — for a hero whose real
 * content has not been built yet.
 *
 * THE SEAM: US-036 and US-038 replace this for their hero exactly as US-034 did
 * for Hero 1, by adding a branch to `./insight-sections.tsx` and a module
 * beside `./hero-1.tsx`. Nothing in this file changes, and the hero id stops
 * being rendered at that point — it is an identifier, not a label.
 */
export function PlaceholderBody({
  heroId,
  phase,
}: {
  heroId: HeroId;
  phase: InsightPhase;
}) {
  return (
    <>
      <SectionHead
        id={sectionLabelId(heroId)}
        label={`${PLACEHOLDER_MARKER} insight · ${heroId}`}
        narrative={PLACEHOLDER_NARRATIVE}
      />

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
        <PlaceholderFollowUp heroId={heroId} delayMs={tileDelayMs(1)} />
      )}
    </>
  );
}

/* ---------------------------------------------------------- SECTION HEAD -- */

/**
 * The head of a section: its label, then its narrative.
 *
 * NARRATIVE FIRST is a product rule, not a layout preference — the answer is
 * stated in words before any chart is offered as evidence (US-024, criterion
 * 3; Reference Guide §11.6). The head is the FIRST child of the section and
 * the tiles follow it, so DOM order and reading order are the same order; a
 * test in `tests/unit/recommendation-panel.test.tsx` asserts the narrative
 * precedes every chart and every card inside a section.
 *
 * The label is a real `h2` so a dashboard that grows section by section stays
 * walkable by heading; the tiles inside each carry an `h3` (`Card`'s default).
 *
 * THE NARRATIVE LINE IS US-005'S CAPTION STRIP, widened by its `section`
 * variant — the AI glyph, the escaping and the accessibility treatment are
 * defined once in `card.tsx` rather than twice. It wraps and is never
 * truncated: Phase 3b's narratives are verbatim, several-sentence strings.
 *
 * THE `control` SLOT IS WHERE A SECTION-LEVEL FILTER GOES, and it is a slot on
 * the HEAD rather than on a tile for a reason: Hero 1's period drives all three
 * of its tiles at once (US-034 criterion 5), so the one control that moves them
 * cannot sit inside any one of them. `scope` is the line beneath the label that
 * says what the figures cover.
 *
 * No font-size utility on the narrative on purpose: `body` already sets
 * `--text-body`, and a `text-body` class would sit in the same `tailwind-merge`
 * conflict group as `text-muted`, which silently drops one of the two.
 */
export function SectionHead({
  id,
  label,
  narrative,
  scope,
  control,
}: {
  id: string;
  label: string;
  narrative: string;
  /** What the figures cover — the dataset's own scope label. */
  scope?: ReactNode;
  /** A section-level control, opposite the label. Hero 1's period filter. */
  control?: ReactNode;
}) {
  return (
    <div data-slot="section-head" className="col-span-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="tile-title">
            {label}
          </h2>
          {scope && (
            <div
              data-slot="section-scope"
              className="mt-0.5 text-caption text-muted"
            >
              {scope}
            </div>
          )}
        </div>
        {control && (
          <div data-slot="section-control" className="shrink-0">
            {control}
          </div>
        )}
      </div>
      <CardCaption variant="section" className="mt-1.5">
        {narrative}
      </CardCaption>
    </div>
  );
}

/* ---------------------------------------------------------------- SECTION -- */

export interface HeroSectionProps {
  /** The descriptor to render: which hero answered, and how far. */
  section: InsightSection;
  /**
   * The section's content — head and tiles — chosen per hero by
   * `./insight-sections.tsx`. Its head must carry {@link sectionLabelId}'s id.
   */
  children: ReactNode;
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
  children,
  focusTick = null,
  className,
}: HeroSectionProps) {
  const { heroId, phase } = section;
  const element = useRef<HTMLElement>(null);

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
      aria-labelledby={sectionLabelId(heroId)}
      className={cn(SECTION_GRID_CLASS, className)}
      // Pairs this section with itself across an insertion so it glides to its
      // new row. Unique on the page because sections are deduped by hero id.
      style={{ viewTransitionName: viewTransitionName(heroId) }}
    >
      {children}
    </section>
  );
}
