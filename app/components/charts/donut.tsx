import { useState, type ReactNode } from "react";

import { cn } from "../../lib/cn";
import {
  formatNumber,
  formatSharePercent,
  TABULAR_NUMERALS_CLASS,
} from "../../lib/format";
import { useCountUp, useGrow, useUid } from "../../lib/hooks/use-motion";
import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";
import { badgeSegments } from "../../lib/repositories/derive";
import { type BadgeSponsorShare } from "../../lib/repositories/types";
import { cssVariable } from "../../lib/tokens";
import { Card, type CardProps } from "../tiles/card";
import { NO_HOVER } from "./line-chart";

/**
 * The segmented donut — the reference build's sponsor-badge ring.
 *
 * ITS CONSUMER IS HERO 1 (US-034): "Sponsor badges printed", 3'080 shirts in
 * the middle and four sponsor segments around it (Bitpanda 44%, Sunrise 24%,
 * Allianz 20%, IWB 12%). That hero has a SECTION-LEVEL period filter driving
 * all three of its tiles, so the total changes per period (3'080 / 1'136 / 430
 * / 334) and the segments have to MORPH to the new proportions.
 *
 * ── IT IS NOT THE ATTENDANCE RING ────────────────────────────────────────────
 * `app/components/charts/attendance-ring.tsx` (US-016) is a SINGLE-ARC GAUGE:
 * one reading against a capacity, on the navy band, in gold. This is a
 * MULTI-SEGMENT donut: a total divided between named series, on a white card,
 * with a legend. They share a technique (a `stroke-dasharray` sweep) and
 * nothing else — one component doing both would need a mode switch through
 * every line of it. The technique is borrowed; the component is separate.
 *
 * THREE EXPORTS, so each seam is reachable:
 *
 *   `donutGeometry`  every dash length and offset, pure — no DOM needed
 *   `Donut`          the ring, its centre reading and its legend
 *   `DonutTile`      `Card` + `Donut` — what a dashboard tile actually is
 *
 * ── ONE HOVERED SEGMENT, TWO SURFACES ────────────────────────────────────────
 * Hovering an ARC and hovering its LEGEND ROW must do the same two things:
 * thicken that segment and swap the centre to its figure. That is one piece of
 * state ({@link Donut}'s `hovered`) written by both surfaces, never two — a
 * second copy is how the arc and the legend end up disagreeing about what is
 * highlighted. The legend rows are real `<button>`s, so the second reading is
 * reachable by Tab as well as by mouse: focus does exactly what hover does.
 * Nothing beyond focus and hover is captured, so the tab order is untouched.
 *
 * ── THE SEGMENTS MORPH, THEY DO NOT RE-ENTER ─────────────────────────────────
 * ARCS ARE KEYED BY SPONSOR NAME, never by array index, so a period press
 * reconciles `Bitpanda` onto the same `<circle>`. The element survives, so its
 * `stroke-dasharray` / `stroke-dashoffset` CSS transition runs from the arc ON
 * SCREEN to the new one. An index key would remount the circle, `useGrow` would
 * be `false` again for that fresh instance, and every segment would collapse to
 * nothing and sweep back in on every press — which is US-018's and US-019's
 * defect, in a ring. No JavaScript runs per frame: the two dash numbers are
 * transitioned by CSS.
 *
 * ── THE ARITHMETIC IS NOT DONE HERE ──────────────────────────────────────────
 * Segment values come from `badgeSegments` in `app/lib/repositories/derive.ts`
 * (US-008), which splits a total by the fixed percentages and CORRECTS THE
 * ROUNDING so the parts sum EXACTLY to the total — a donut whose segments do
 * not add up to the number printed in the middle of it is the kind of detail
 * this audience checks. That correction is already proven by an exhaustive
 * sweep; restating it here would be a second, unproven copy.
 *
 * NO NUMBER IS FORMATTED HERE — every string comes from `app/lib/format.ts`.
 * NO HEX APPEARS HERE — segment colours are token names resolved to
 * `var(--color-…)` through `app/lib/tokens.ts`. GRADIENT IDS COME FROM `useUid`,
 * because Hero 1 has three charts on screen at once and two `id="donutFill"`
 * do not draw two gradients.
 *
 * REDUCED MOTION IS FINAL STATE, NEVER ZERO. `useGrow` is already `true` in the
 * first render under the preference and `useCountUp` returns the target, so the
 * arcs are at their lengths and the centre at its figure with no transition
 * needed.
 */

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * The donut's box, in screen pixels. Wide enough that a HOVER-THICKENED arc
 * still fits: the outer edge of a hovered segment sits at
 * {@link DONUT_RADIUS} + {@link DONUT_HOVER_STROKE_WIDTH} / 2.
 */
export const DONUT_SIZE = 168;

/** Radius of the ring's centre line, leaving room for the thickest stroke. */
export const DONUT_RADIUS = 70;

/** Resting weight of a segment. */
export const DONUT_STROKE_WIDTH = 16;

/** Weight of the HOVERED segment — the thickening, in one value. */
export const DONUT_HOVER_STROKE_WIDTH = 24;

/**
 * The gap between two segments, in path units.
 *
 * It is arc REMOVED FROM EACH SEGMENT, not a stroke painted in the background
 * colour: a fake gap drawn in white breaks the moment the tile sits on the
 * navy band or a segment is thickened over its neighbour, and it cannot
 * transition. Half is taken from each end, so a segment stays centred in its
 * slot and the gaps read evenly all the way round.
 */
export const DONUT_GAP = 5;

/** Centre of the box — half of {@link DONUT_SIZE}. */
const DONUT_CENTRE = DONUT_SIZE / 2;

/** Dash lengths rounded to this many decimals — attributes, not maths. */
const DASH_PRECISION = 2;

/** An arc with nothing to draw: a zero segment, or a slot narrower than a gap. */
const NO_ARC = 0;

/** A total with nothing to divide. */
const NO_TOTAL = 0;

function round(value: number): number {
  return Number(value.toFixed(DASH_PRECISION));
}

/** A reading that can be drawn: finite and not negative. */
function safeValue(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : NO_ARC;
}

export interface DonutDatum {
  /**
   * The series name, and the segment's IDENTITY — {@link Donut} keys on it,
   * never on the array index, so a data change transitions the same arc instead
   * of remounting it at zero length.
   */
  readonly name: string;
  /** The segment's figure, in the same unit as the centre total. */
  readonly value: number;
}

export interface DonutArc extends DonutDatum {
  /** The segment's share of the total, `0` to `1` — for its legend percentage. */
  readonly share: number;
  /** The PAINTED length of the arc: its slot, less the gap. */
  readonly length: number;
  /** `stroke-dasharray` for that arc: one dash, one gap round the rest. */
  readonly dashArray: string;
  /**
   * `stroke-dashoffset` for the arc's start. Negative, because a negative
   * offset shifts the dash pattern FORWARD along the path — which is how four
   * circles of identical geometry end up drawn at four different places.
   */
  readonly dashOffset: number;
}

export interface DonutGeometry {
  /** The full circle, in path units — every slot is a fraction of it. */
  readonly circumference: number;
  /** The sum of the drawable segment values — what the centre shows at rest. */
  readonly total: number;
  /** `stroke-dasharray` for a segment that has not grown yet. */
  readonly emptyDashArray: string;
  readonly arcs: readonly DonutArc[];
}

/**
 * Every dash length and offset the ring draws, or `null` when there is nothing
 * to draw at all.
 *
 * Pure and exported, so the sweep, the gaps and the zero handling are testable
 * without a DOM. THE TOTAL IS THE SUM OF THE SEGMENTS, not a separate input:
 * the centre figure and the arcs around it therefore cannot disagree, which is
 * the whole reason `badgeSegments` corrects its rounding.
 *
 * A zero, negative or non-finite segment contributes nothing and draws nothing
 * — its legend row still shows a labelled zero. A slot narrower than
 * {@link DONUT_GAP} draws nothing rather than a negative dash, which renders as
 * a full circle.
 */
export function donutGeometry(
  segments: readonly DonutDatum[],
): DonutGeometry | null {
  if (segments.length === 0) return null;

  const circumference = round(2 * Math.PI * DONUT_RADIUS);
  const total = segments.reduce((sum, part) => sum + safeValue(part.value), 0);

  let start = NO_ARC;
  const arcs = segments.map((segment) => {
    const value = safeValue(segment.value);
    const share = total > NO_TOTAL ? value / total : NO_ARC;
    const slot = share * circumference;
    const length = round(Math.max(slot - DONUT_GAP, NO_ARC));
    // Half a gap in from the slot's own start, so the segment sits centred in
    // it and both of its gaps are the same width.
    const offset = round(start + DONUT_GAP / 2);
    start += slot;

    return {
      name: segment.name,
      value: segment.value,
      share,
      length,
      dashArray: `${length} ${round(circumference - length)}`,
      dashOffset: -offset,
    };
  });

  return {
    circumference,
    total,
    emptyDashArray: `${NO_ARC} ${circumference}`,
    arcs,
  };
}

/* -------------------------------------------------------------- COLOURS -- */

/**
 * Segment colours, restricted to token names on purpose — the token set is
 * closed (`app/lib/tokens.ts`, colour discipline rule 5), so no hex can be
 * smuggled in. The values are `var(--color-…)` references rather than baked
 * hexes, so a token change moves the ring with everything else.
 *
 * GOLD IS ABSENT, and that is the decision: a segment here says "this is
 * Sunrise's share", which is SERIES IDENTITY, and gold is an accent only
 * (rule 4). The single-arc attendance gauge is gold because the Reference Guide
 * lists that one ring among gold's allowed uses; this ring is not that ring.
 */
export const DONUT_SERIES = {
  /** Club red — the leading sponsor. */
  red: cssVariable("color", "seriesPrimary"),
  /** Club blue — the second. */
  blue: cssVariable("color", "seriesSecondary"),
  /** Deep navy — the third. */
  navy: cssVariable("color", "seriesTertiary"),
  /** Neutral slate — a fourth, non-brand series (`app/lib/tokens.ts`). */
  slate: cssVariable("color", "slate"),
} as const;

export type DonutSeries = keyof typeof DONUT_SERIES;

/**
 * Colour by POSITION, which is exactly the reference's sponsor order —
 * Bitpanda red, Sunrise blue, Allianz navy, IWB slate — so Hero 1's tile does
 * not have to spell the colours out. Wraps, so a fifth sponsor is drawn rather
 * than left colourless.
 */
const SERIES_CYCLE: readonly DonutSeries[] = ["red", "blue", "navy", "slate"];

/** The colour token a segment ends up with, by position. */
export function donutSeries(index: number): DonutSeries {
  const safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  return SERIES_CYCLE[safeIndex % SERIES_CYCLE.length] ?? "red";
}

/** Gradient stop opacities — a lift off the token colour, not a second colour. */
const GRADIENT_START_OPACITY = 1;
const GRADIENT_END_OPACITY = 0.72;

/* ---------------------------------------------------------------- COPY -- */

/** What the centre figure means while nothing is hovered. */
const DEFAULT_CENTRE_LABEL_KEY: TranslationKey = "tiles.donutCentre";

/** The ring group's accessible name, when the caller gives none. */
const DEFAULT_LABEL_KEY: TranslationKey = "tiles.donutLabel";

/* ---------------------------------------------------------------- RING -- */

export interface DonutProps {
  /**
   * The centre total — Hero 1's badged shirts for the selected period. Split
   * across `split` by `badgeSegments`, so the parts sum EXACTLY to it.
   */
  total: number;
  /**
   * The fixed percentage split, in display order. A SPLIT rather than absolute
   * segment values, because the rounding correction that makes the parts add up
   * lives in `badgeSegments` and must not be done twice.
   */
  split: readonly BadgeSponsorShare[];
  /**
   * How a figure becomes text — a formatter from `app/lib/format.ts`.
   * `formatNumber` (the default) for shirts. It is called with mid-animation
   * values, which is why every formatter there rounds.
   */
  format?: (value: number) => string;
  /** What the resting centre figure is: `shirts`, `total`. */
  centreLabel?: string;
  /** Accessible name of the ring and its legend. */
  label?: string;
  className?: string;
}

/**
 * The ring, its centre reading and its legend.
 *
 * THE CENTRE MOVES BETWEEN READINGS. It is one `useCountUp` fed either the
 * total or the hovered segment's figure, and US-027's hook continues from the
 * figure ON SCREEN — so a hover counts 3'080 → 1'355 and back rather than
 * snapping, and a period change counts 3'080 → 1'136 rather than dropping to
 * zero. One hook, not one per reading: two would each start from their own
 * stale value.
 */
export function Donut({
  total,
  split,
  format = formatNumber,
  centreLabel,
  label,
  className,
}: DonutProps) {
  const t = useT();
  // Document-global `url(#…)` ids: Hero 1 puts three charts on one screen.
  const uid = useUid("donut");
  const grown = useGrow();
  // The ONE hovered segment. Both surfaces below write to it, and the PERIOD is
  // the caller's, because one press has to move every tile in the section.
  const [hovered, setHovered] = useState(NO_HOVER);

  // THE ARITHMETIC IS `derive.ts`'s, rounding correction included.
  const geometry = donutGeometry(
    badgeSegments(total, split).map((segment) => ({
      name: segment.sponsor,
      value: segment.value,
    })),
  );

  const hoveredArc = geometry?.arcs[hovered];
  // Hovered, the centre reads that segment; at rest, the sum of them all.
  const counted = useCountUp(hoveredArc?.value ?? geometry?.total ?? NO_TOTAL);

  if (!geometry) return null;

  const gradientId = (token: DonutSeries): string => `${uid}-${token}`;
  const series = geometry.arcs.map((_, index) => donutSeries(index));

  return (
    <div
      data-slot="donut"
      role="group"
      aria-label={label ?? t(DEFAULT_LABEL_KEY)}
      className={cn("flex flex-wrap items-center gap-5", className)}
      // Leaving the whole component — or taking focus out of it — drops the
      // highlight. On the wrapper rather than per surface, so sliding from an
      // arc to its legend row does not flicker through the resting state.
      onMouseLeave={() => setHovered(NO_HOVER)}
      onBlur={() => setHovered(NO_HOVER)}
    >
      <div
        data-slot="donut-ring"
        className="relative shrink-0"
        style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
      >
        {/* Decoration: the readings are the DOM text in the middle and in the
            legend, so the ring itself is hidden from the accessibility tree. */}
        <svg
          data-slot="donut-svg"
          viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
          width={DONUT_SIZE}
          height={DONUT_SIZE}
          aria-hidden="true"
          focusable="false"
          // Starts the first segment at twelve o'clock rather than at three.
          className="-rotate-90"
        >
          <defs>
            {/* One gradient per DISTINCT colour, named by its token rather than
                by position, so a reordered split does not repaint a segment. */}
            {[...new Set(series)].map((token) => (
              <linearGradient
                key={token}
                data-slot="donut-gradient"
                id={gradientId(token)}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={DONUT_SERIES[token]}
                  stopOpacity={GRADIENT_START_OPACITY}
                />
                <stop
                  offset="100%"
                  stopColor={DONUT_SERIES[token]}
                  stopOpacity={GRADIENT_END_OPACITY}
                />
              </linearGradient>
            ))}
          </defs>

          {/* The track behind the segments, so the gaps read as gaps in a ring
              rather than as four floating arcs. */}
          <circle
            data-slot="donut-track"
            cx={DONUT_CENTRE}
            cy={DONUT_CENTRE}
            r={DONUT_RADIUS}
            fill="none"
            strokeWidth={DONUT_STROKE_WIDTH}
            className="stroke-surface"
          />

          {geometry.arcs.map((arc, index) => (
            // KEYED BY SPONSOR, NEVER BY INDEX — the whole story of this
            // component; see the note at the top of the file.
            <circle
              key={arc.name}
              data-slot="donut-arc"
              data-name={arc.name}
              data-hovered={hovered === index}
              cx={DONUT_CENTRE}
              cy={DONUT_CENTRE}
              r={DONUT_RADIUS}
              fill="none"
              strokeLinecap="butt"
              stroke={`url(#${gradientId(series[index] ?? "red")})`}
              // THE THICKENING. A stroke weight, so the arc keeps its radius
              // and its neighbours keep their places — nothing is re-laid out.
              strokeWidth={
                hovered === index
                  ? DONUT_HOVER_STROKE_WIDTH
                  : DONUT_STROKE_WIDTH
              }
              // THE MORPH. Two dash numbers transitioning in CSS — from an
              // empty ring on the first paint, and between splits on every data
              // change after it, because the element persists. `useGrow` is
              // `true` immediately under reduced motion, so no arc is ever left
              // stranded at `emptyDashArray`.
              strokeDasharray={grown ? arc.dashArray : geometry.emptyDashArray}
              strokeDashoffset={arc.dashOffset}
              className="transition-[stroke-dasharray,stroke-dashoffset,stroke-width] duration-(--duration-grow) ease-enter"
              onMouseEnter={() => setHovered(index)}
            />
          ))}
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          <div className="pointer-events-none text-center">
            {/* The product's headline-number role class, not a size of its
                own. `role="status"`, so the swap is announced as it happens —
                the arcs themselves are decorative. */}
            <span
              data-slot="donut-centre-value"
              role="status"
              className="kpi-number block"
            >
              {format(counted)}
            </span>
            <span
              data-slot="donut-centre-label"
              className="mt-1 block text-caption text-muted"
            >
              {hoveredArc
                ? hoveredArc.name
                : (centreLabel ?? t(DEFAULT_CENTRE_LABEL_KEY))}
            </span>
          </div>
        </div>
      </div>

      {/* THE SECOND HOVER SURFACE. Buttons, so every row is reachable by Tab
          and focus does what hover does — a ring that only answers a mouse
          hides three of its four readings from a keyboard. */}
      <ul data-slot="donut-legend" className="min-w-0 flex-1 space-y-1.5">
        {geometry.arcs.map((arc, index) => (
          <li key={arc.name}>
            <button
              type="button"
              data-slot="donut-legend-row"
              data-name={arc.name}
              data-hovered={hovered === index}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-badge px-2 py-1 text-left text-body transition-colors duration-(--duration-fast)",
                hovered === index && "bg-surface",
              )}
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
            >
              <span
                data-slot="donut-swatch"
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-badge"
                style={{
                  backgroundColor: DONUT_SERIES[series[index] ?? "red"],
                }}
              />
              {/* NO TRUNCATION — a long sponsor name wraps (epic guardrail). */}
              <span
                data-slot="donut-legend-name"
                className="min-w-0 flex-1 font-medium break-words"
              >
                {arc.name}
              </span>
              <span
                data-slot="donut-legend-value"
                className={cn(
                  "shrink-0 font-bold whitespace-nowrap",
                  TABULAR_NUMERALS_CLASS,
                )}
              >
                {format(arc.value)}
              </span>
              {/* The share is derived from the DRAWN values, so it can never
                  disagree with the arc beside it. */}
              <span
                data-slot="donut-legend-share"
                className={cn(
                  "w-9 shrink-0 text-right text-caption whitespace-nowrap text-muted",
                  TABULAR_NUMERALS_CLASS,
                )}
              >
                {formatSharePercent(arc.share)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------- TILE -- */

/**
 * The card chrome the tile forwards to `Card`, listed rather than spread so the
 * tile's API is readable in one place — and so `subtitle` can stay the card's
 * own scope line under a different name (`period`), exactly as `KpiTile`,
 * `HBarTile`, `VBarTile` and `LineChartTile` do.
 */
type DonutCardProps = Pick<
  CardProps,
  | "title"
  | "headingLevel"
  | "icon"
  | "action"
  | "accent"
  | "caption"
  | "isNew"
  | "delayMs"
  | "className"
>;

export interface DonutTileProps
  extends DonutCardProps, Omit<DonutProps, "className"> {
  /** The scope line in the card header: Hero 1's `3'080 shirts · ~8% of units`. */
  period?: ReactNode;
}

/**
 * `Card` + `Donut`.
 *
 * The card slots pass straight through, `action` included — a tile that wants
 * its own period filter beside the title puts a `Segmented` there rather than
 * asking for a variant here.
 */
export function DonutTile({
  title,
  period,
  headingLevel,
  icon,
  action,
  accent,
  caption,
  isNew,
  delayMs,
  className,
  ...ring
}: DonutTileProps) {
  return (
    <Card
      title={title}
      subtitle={period}
      headingLevel={headingLevel}
      icon={icon}
      action={action}
      accent={accent}
      caption={caption}
      isNew={isNew}
      delayMs={delayMs}
      className={className}
    >
      <Donut {...ring} />
    </Card>
  );
}
