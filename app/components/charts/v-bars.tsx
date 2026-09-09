import { useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "../../lib/cn";
import { formatNumber, TABULAR_NUMERALS_CLASS } from "../../lib/format";
import { useCountUp, useGrow, useUid } from "../../lib/hooks/use-motion";
import { cssVariable } from "../../lib/tokens";
import { Card, type CardProps } from "../tiles/card";
import { nextHoverIndex, NO_HOVER, tooltipAnchor } from "./line-chart";

/**
 * Vertical bars — the reference build's `BarsGradient` / `BarCol`, and the only
 * vertical bar chart in the product.
 *
 * ITS CONSUMER IS HERO 1 (US-034): "Shirt sales by kit (season to date)", three
 * gradient columns (Home red, Away blue, 3rd navy) under a section-level period
 * filter that drives all three of that hero's tiles at once. The per-bar tooltip
 * is that hero's `kitTip` — units, share and revenue in one box.
 *
 * THREE EXPORTS, so each seam is reachable:
 *
 *   `vBarGeometry`  every coordinate, pure — testable with no DOM
 *   `VBars`         the chart: gridlines, columns, value labels, hover tooltip
 *   `VBarTile`      `Card` + `VBars` — what a dashboard tile actually is
 *
 * ── THE STORY IS BAR PERSISTENCE ─────────────────────────────────────────────
 * A filter press replaces the data, and the bars must TRANSITION to their new
 * height and position rather than re-enter from zero. Two halves make that
 * true, and both are load-bearing:
 *
 *   1. COLUMNS ARE KEYED BY CATEGORY NAME, never by array index, so React
 *      reconciles `Home` onto the same `<rect>` across a data change. The
 *      element survives, so the `y` / `height` CSS transition runs from the
 *      geometry ON SCREEN to the new geometry. An index key would remount the
 *      rect, `useGrow` would be `false` again for that fresh instance, and
 *      every bar would snap to the baseline on every press.
 *   2. THE LABEL IS US-027's `useCountUp`, which continues from the figure on
 *      screen. Because the column instance survives (1), so does its count-up
 *      state — the figure counts 22'400 → 18'900 instead of dropping to zero.
 *
 * Nothing in this file animates in JavaScript: the bar is a CSS transition on
 * the rect's geometry properties (`x`, `y`, `height` — the reference build's own
 * approach) and the label's position is a CSS `transform` transition on its
 * anchor group. `useGrow` is already `true` in the first render under reduced
 * motion, so no bar is ever left stranded at zero height (US-027 rule 2).
 *
 * ── WHAT IS DELIBERATELY NOT SVG ─────────────────────────────────────────────
 * CATEGORY LABELS ARE DOM TEXT under the plot, not `<text>` inside it, because
 * SVG text cannot wrap and "long labels wrap rather than overflow" is an epic
 * guardrail. The strip is padded to the plot's own horizontal padding, so each
 * label sits under its own bar.
 *
 * ── REUSE, NOT A SECOND SET OF RULES ─────────────────────────────────────────
 * The hover box's edge flip (`tooltipAnchor`) and the arrow-key mapping
 * (`nextHoverIndex`, `NO_HOVER`) are US-025's pure helpers, imported rather than
 * restated: a tooltip that clips at the tile edge and a key that gets captured
 * are the same defects here as there, and they must not be fixed twice.
 *
 * NO NUMBER IS FORMATTED HERE. Every string comes from `app/lib/format.ts`
 * through the `format` prop (`formatNumber` by default). NO HEX APPEARS HERE:
 * bar colours are token names resolved to `var(--color-…)` through
 * `app/lib/tokens.ts`, and everything else is a token utility class. GRADIENT
 * IDS COME FROM `useUid` — Hero 1 has three charts on screen at once, and two
 * `id="barFill"` do not draw two gradients.
 */

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * The chart's own coordinate space. It is never rendered at this size: the
 * `viewBox` plus `width: 100%` stretch it to whatever the tile column is.
 */
export const V_BAR_VIEW_WIDTH = 360;

/** Default view-box height of the PLOT — the category strip sits below it. */
export const DEFAULT_V_BAR_HEIGHT = 190;

/** Padding inside the view box. The top strip holds the value labels. */
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 26;
const PAD_BOTTOM = 6;

/** A bar takes half its slot, so the gaps read as wide as the bars (E8). */
const BAR_SLOT_FRACTION = 0.5;

/** Cap on bar width, so three bars in a wide tile do not become slabs. */
const MAX_BAR_WIDTH = 64;

/** Corner radius of a bar — the rounded caps. */
const BAR_RADIUS = 5;

/** Gap between the top of a bar and the baseline of its value label. */
const VALUE_LABEL_GAP = 9;

/** Gridlines, as fractions of the axis maximum. The 1.0 line is the top. */
const GRID_FRACTIONS = [0.25, 0.5, 0.75, 1] as const;

/** Headroom the axis maximum is rounded up by, so the tallest bar breathes. */
const NICE_MAX_HEADROOM = 1.1;

/** The axis maximum of a chart with nothing positive to scale against. */
const FLAT_MAX = 1;

/** A bar with nothing to draw: a zero, a negative, or a non-finite reading. */
const NO_HEIGHT = 0;

/** Coordinates rounded to this many decimals — attributes, not maths. */
const COORDINATE_PRECISION = 2;

function round(value: number): number {
  return Number(value.toFixed(COORDINATE_PRECISION));
}

/**
 * A round number just above `value`, for the top of the axis — the reference
 * build's `niceMax`: snap up to the next half-magnitude with 10% headroom, so
 * 22'400 gives 25'000 and the gridlines land on figures a presenter can read.
 *
 * Pure and exported so the scale can be asserted without a DOM. A zero, a
 * negative or a non-finite maximum returns {@link FLAT_MAX} rather than the
 * `-Infinity` that `log10(0)` would put into every bar's height.
 */
export function niceMax(
  value: number,
  headroom: number = NICE_MAX_HEADROOM,
): number {
  if (!Number.isFinite(value) || value <= 0) return FLAT_MAX;

  const step = 10 ** Math.floor(Math.log10(value)) / 2;
  return round(Math.ceil((value * headroom) / step) * step);
}

/**
 * A bar's height in view-box units, `0` when there is nothing to draw.
 *
 * Guarded rather than left to produce `NaN` in a `height`, which renders as a
 * silently absent bar. THIS CHART PLOTS MAGNITUDES (units sold), so a negative
 * or non-finite reading draws no bar — its figure is still labelled above the
 * axis, exactly as a zero is.
 */
export function vBarHeight(
  value: number,
  max: number,
  plotHeight: number,
): number {
  if (!Number.isFinite(value) || value <= 0 || max <= 0) return NO_HEIGHT;

  return round(Math.min(value / max, 1) * plotHeight);
}

export interface VBarLayout {
  /** The category — this bar's IDENTITY, and its React key. */
  readonly name: string;
  /** The raw figure, for the label and the tooltip. */
  readonly value: number;
  /** Left edge of the bar. */
  readonly x: number;
  /** Left edge of the bar's hover slot, which is the full column width. */
  readonly slotX: number;
  /** Centre of the slot — where the value label and the tooltip are pinned. */
  readonly centerX: number;
  /** Top of the bar once grown. */
  readonly y: number;
  /** Height of the bar once grown. */
  readonly height: number;
}

export interface VBarGeometry {
  readonly width: number;
  readonly height: number;
  /** The axis maximum every bar is scaled against — see {@link niceMax}. */
  readonly max: number;
  /** Top of the plot area. */
  readonly plotTop: number;
  readonly plotHeight: number;
  /** The axis line the bars stand on, and where an ungrown bar sits. */
  readonly baselineY: number;
  readonly slotWidth: number;
  readonly barWidth: number;
  readonly gridYs: readonly number[];
  readonly bars: readonly VBarLayout[];
}

/**
 * Every coordinate the chart draws, or `null` when there is nothing to draw.
 *
 * Pure and exported, so the scale, the slotting and the zero handling are
 * testable without a DOM.
 */
export function vBarGeometry(
  bars: readonly VBarDatum[],
  height: number = DEFAULT_V_BAR_HEIGHT,
): VBarGeometry | null {
  if (bars.length === 0 || !Number.isFinite(height) || height <= 0) return null;

  const width = V_BAR_VIEW_WIDTH;
  const plotWidth = width - PAD_LEFT - PAD_RIGHT;
  const plotHeight = round(height - PAD_TOP - PAD_BOTTOM);
  const baselineY = round(height - PAD_BOTTOM);
  const max = niceMax(
    Math.max(
      ...bars.map((bar) => (Number.isFinite(bar.value) ? bar.value : 0)),
    ),
  );
  const slotWidth = round(plotWidth / bars.length);
  const barWidth = round(
    Math.min(slotWidth * BAR_SLOT_FRACTION, MAX_BAR_WIDTH),
  );

  return {
    width,
    height,
    max,
    plotTop: PAD_TOP,
    plotHeight,
    baselineY,
    slotWidth,
    barWidth,
    gridYs: GRID_FRACTIONS.map((fraction) =>
      round(baselineY - fraction * plotHeight),
    ),
    bars: bars.map((bar, index) => {
      const slotX = round(PAD_LEFT + index * slotWidth);
      const centerX = round(slotX + slotWidth / 2);
      const barHeight = vBarHeight(bar.value, max, plotHeight);

      return {
        name: bar.name,
        value: bar.value,
        slotX,
        centerX,
        x: round(centerX - barWidth / 2),
        y: round(baselineY - barHeight),
        height: barHeight,
      };
    }),
  };
}

/* -------------------------------------------------------------- COLOURS -- */

/**
 * Bar colours, restricted to token names on purpose — the token set is closed
 * (`app/lib/tokens.ts`, colour discipline rule 5), so a caller names a series
 * rather than passing a colour string and no hex can be smuggled in. The values
 * are `var(--color-…)` references rather than baked hexes, so a token change
 * moves the chart with everything else.
 *
 * GOLD IS ABSENT, and that is the decision: a bar here says "this is the Away
 * kit", which is series identity, and gold is an accent only (rule 4).
 */
export const V_BAR_SERIES = {
  /** Club red — the Home kit. */
  red: cssVariable("color", "seriesPrimary"),
  /** Club blue — the Away kit. */
  blue: cssVariable("color", "seriesSecondary"),
  /** Deep navy — the third kit. */
  navy: cssVariable("color", "seriesTertiary"),
} as const;

export type VBarSeries = keyof typeof V_BAR_SERIES;

/**
 * What an unnamed bar gets, by position — which is exactly Hero 1's kit order
 * (Home red, Away blue, 3rd navy), so its tile does not have to spell the
 * colours out.
 */
const SERIES_CYCLE: readonly VBarSeries[] = ["red", "blue", "navy"];

/** The colour token a bar ends up with, named or by position. */
export function vBarSeries(
  series: VBarSeries | undefined,
  index: number,
): VBarSeries {
  return series ?? SERIES_CYCLE[index % SERIES_CYCLE.length] ?? "red";
}

/** Gradient stop opacities — a lift off the token colour, not a second colour. */
const GRADIENT_TOP_OPACITY = 1;
const GRADIENT_BOTTOM_OPACITY = 0.66;

/**
 * The hover highlight. A filter, so the bar keeps its gradient and its geometry
 * — nothing moves and no colour is swapped in, which is what lets the highlight
 * be pure decoration on top of the series identity.
 */
const HOVER_HIGHLIGHT_CLASS = "brightness-110";

/* ----------------------------------------------------------------- DATA -- */

export interface VBarDatum {
  /**
   * The category, and the bar's IDENTITY — {@link VBars} keys on it, never on
   * the array index, so a filter change transitions the same bar's height and
   * position instead of remounting it at zero.
   */
  readonly name: string;
  /** The figure. Plotted as a magnitude; a zero is a labelled zero. */
  readonly value: number;
  /** Bar colour, by token name. Defaults by position — see {@link vBarSeries}. */
  readonly series?: VBarSeries;
}

/* --------------------------------------------------------------- COLUMN -- */

interface VBarColumnProps {
  geometry: VBarGeometry;
  layout: VBarLayout;
  /** `url(#…)` target for this bar's fill, from the chart's own `useUid`. */
  gradientId: string;
  format: (value: number) => string;
  hovered: boolean;
  onHover: () => void;
}

/**
 * One column: the invisible hover slot, the bar, and the counting value label
 * above it.
 *
 * A COMPONENT RATHER THAN INLINE MARKUP because `useCountUp` is per bar and
 * hooks cannot be called in a loop body — and because this instance surviving a
 * data change is precisely what makes the transition a transition. The parent
 * keys it by category name; see the persistence note at the top of this file.
 *
 * The hover slot is the FULL column, not the bar, so a short bar is as easy to
 * hover as a tall one.
 */
function VBarColumn({
  geometry,
  layout,
  gradientId,
  format,
  hovered,
  onHover,
}: VBarColumnProps) {
  const grown = useGrow();
  const counted = useCountUp(layout.value);

  // Ungrown, a bar has no height and stands on the baseline; `useGrow` is
  // already `true` under reduced motion, so it is never left there.
  const top = grown ? layout.y : geometry.baselineY;
  const barHeight = grown ? layout.height : NO_HEIGHT;

  return (
    <g
      data-slot="v-bar-column"
      data-name={layout.name}
      data-hovered={hovered}
      onMouseEnter={onHover}
    >
      <rect
        data-slot="v-bar-hit"
        x={layout.slotX}
        y={geometry.plotTop}
        width={geometry.slotWidth}
        height={geometry.plotHeight}
        fill="transparent"
      />

      <rect
        data-slot="v-bar"
        x={layout.x}
        y={top}
        width={geometry.barWidth}
        height={barHeight}
        rx={BAR_RADIUS}
        fill={`url(#${gradientId})`}
        className={cn(
          // The geometry properties transition in CSS — no JavaScript runs per
          // frame, and the element persists across data changes, so this is the
          // filter-change transition as well as the entrance.
          "transition-[x,y,height] duration-(--duration-grow) ease-enter",
          hovered && HOVER_HIGHLIGHT_CLASS,
        )}
      />

      {/* The label rides on an anchor group, because a `<text>` element's `y`
          is not reliably a CSS-transitionable property while a group's
          `transform` is. It is always rendered — a zero is a labelled zero. */}
      <g
        data-slot="v-bar-value-anchor"
        style={{ transform: `translateY(${top}px)` }}
        className="transition-transform duration-(--duration-grow) ease-enter"
      >
        <text
          data-slot="v-bar-value"
          x={layout.centerX}
          y={-VALUE_LABEL_GAP}
          textAnchor="middle"
          // 14px bold from the token set, not the reference's 12.5px: this is
          // the figure the room reads (E8). Tabular, so the count-up does not
          // jitter the digits.
          className={cn(
            "fill-text text-body font-bold",
            TABULAR_NUMERALS_CLASS,
          )}
        >
          {format(counted)}
        </text>
      </g>
    </g>
  );
}

/* ---------------------------------------------------------------- CHART -- */

export interface VBarsProps {
  /** The categories, in display order. Keyed by `name`, not by position. */
  bars: readonly VBarDatum[];
  /**
   * How a figure becomes its label — a formatter from `app/lib/format.ts`.
   * `formatNumber` (the default) for units. It is called with mid-animation
   * values, which is why every formatter there rounds.
   */
  format?: (value: number) => string;
  /**
   * OPTIONAL PER-BAR TOOLTIP. Called with the hovered bar's index and rendered
   * inside the hover box, which is how Hero 1 shows units, share and revenue
   * together. Without it the box shows the category and its formatted figure,
   * so a hover is never silent.
   */
  tooltip?: (index: number) => ReactNode;
  /** View-box height of the plot. The category strip is added below it. */
  height?: number;
  /** Accessible name of the focusable plot group. */
  label?: string;
  className?: string;
}

/**
 * The chart: gridlines behind, gradient columns with rounded caps, counting
 * value labels above them, wrapping category labels below, and one hover box.
 *
 * HOVER IS ALSO KEYBOARD. The plot is focusable and the arrow keys move the
 * highlight through US-025's `nextHoverIndex`, which returns `null` for every
 * other key — so Tab, Enter and Space keep their meaning and the tab order is
 * untouched. The box carries `role="status"`, so the reading is announced as the
 * highlight moves, which is the only way the figures inside the (decorative)
 * svg reach a screen reader.
 */
export function VBars({
  bars,
  format = formatNumber,
  tooltip,
  height = DEFAULT_V_BAR_HEIGHT,
  label,
  className,
}: VBarsProps) {
  // Document-global `url(#…)` ids: Hero 1 puts three charts on one screen.
  const uid = useUid("vbar");
  // The only state the chart owns. The PERIOD belongs to the caller, because
  // one press has to move every tile in the section (US-034).
  const [hovered, setHovered] = useState(NO_HOVER);

  const geometry = vBarGeometry(bars, height);
  if (!geometry) return null;

  const series = bars.map((bar, index) => vBarSeries(bar.series, index));
  const gradientId = (token: VBarSeries): string => `${uid}-${token}`;
  const hoveredBar = geometry.bars[hovered];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const next = nextHoverIndex(event.key, hovered, bars.length);
    if (next === null) return;
    event.preventDefault();
    setHovered(next);
  };

  return (
    <div data-slot="v-bars" className={className}>
      <div
        data-slot="v-bars-plot"
        // Focusable and arrow-key driven; nothing beyond those keys is
        // captured, so Tab still leaves.
        tabIndex={0}
        role="group"
        aria-label={label}
        className="relative"
        onMouseLeave={() => setHovered(NO_HOVER)}
        onBlur={() => setHovered(NO_HOVER)}
        onKeyDown={onKeyDown}
      >
        {/* The plot is decoration: the category labels below carry the
            categories and the hover box carries the readings. */}
        <svg
          data-slot="v-bars-svg"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          width="100%"
          aria-hidden="true"
          focusable="false"
          className="block"
        >
          <defs>
            {/* One gradient per DISTINCT colour, named by its token rather than
                by position, so a reordered dataset does not repaint a bar. */}
            {[...new Set(series)].map((token) => (
              <linearGradient
                key={token}
                data-slot="v-bar-gradient"
                id={gradientId(token)}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={V_BAR_SERIES[token]}
                  stopOpacity={GRADIENT_TOP_OPACITY}
                />
                <stop
                  offset="100%"
                  stopColor={V_BAR_SERIES[token]}
                  stopOpacity={GRADIENT_BOTTOM_OPACITY}
                />
              </linearGradient>
            ))}
          </defs>

          {geometry.gridYs.map((y) => (
            <line
              key={y}
              data-slot="v-bar-grid"
              x1={PAD_LEFT}
              y1={y}
              x2={geometry.width - PAD_RIGHT}
              y2={y}
              strokeWidth="1"
              strokeDasharray="3 4"
              className="stroke-line"
            />
          ))}

          <line
            data-slot="v-bar-axis"
            x1={PAD_LEFT}
            y1={geometry.baselineY}
            x2={geometry.width - PAD_RIGHT}
            y2={geometry.baselineY}
            strokeWidth="1"
            className="stroke-border"
          />

          {geometry.bars.map((layout, index) => (
            // KEYED BY CATEGORY, NEVER BY INDEX — the whole story of this
            // component; see the note at the top of the file.
            <VBarColumn
              key={layout.name}
              geometry={geometry}
              layout={layout}
              gradientId={gradientId(series[index] ?? "red")}
              format={format}
              hovered={hovered === index}
              onHover={() => setHovered(index)}
            />
          ))}
        </svg>

        {hoveredBar && (
          <div
            data-slot="v-bars-tooltip"
            role="status"
            style={tooltipAnchor((hoveredBar.centerX / geometry.width) * 100)}
            className="pointer-events-none absolute top-0 z-10 rounded-badge bg-navy px-2.5 py-1.5 text-caption whitespace-nowrap text-bg shadow-tooltip"
          >
            {tooltip ? (
              tooltip(hovered)
            ) : (
              <>
                <div
                  data-slot="v-bars-tooltip-heading"
                  className="mb-0.5 font-bold"
                >
                  {hoveredBar.name}
                </div>
                <div className={TABULAR_NUMERALS_CLASS}>
                  {format(hoveredBar.value)}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* DOM text, not `<text>`: a long category has to WRAP, and SVG text
          cannot. Padded to the plot's own padding so each label sits under its
          own bar. */}
      <div
        data-slot="v-bar-labels"
        className="mt-2 flex items-start"
        style={{
          paddingLeft: `${(PAD_LEFT / geometry.width) * 100}%`,
          paddingRight: `${(PAD_RIGHT / geometry.width) * 100}%`,
        }}
      >
        {geometry.bars.map((layout) => (
          <span
            key={layout.name}
            data-slot="v-bar-label"
            className="min-w-0 flex-1 text-center text-caption font-semibold break-words text-muted"
          >
            {layout.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- TILE -- */

/**
 * The card chrome the tile forwards to `Card`, listed rather than spread so the
 * tile's API is readable in one place — and so `subtitle` can stay the card's
 * own scope line under a different name (`period`), exactly as `KpiTile`,
 * `HBarTile` and `LineChartTile` do.
 */
type VBarCardProps = Pick<
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

export interface VBarTileProps
  extends VBarCardProps, Omit<VBarsProps, "className"> {
  /** The scope line in the card header: Hero 1's `… · 38'500 shirts · CHF 3.81M`. */
  period?: ReactNode;
}

/**
 * `Card` + `VBars`.
 *
 * The card slots pass straight through, `action` included — a tile that wants
 * its own period filter beside the title puts a `Segmented` there rather than
 * asking for a variant here.
 */
export function VBarTile({
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
  ...chart
}: VBarTileProps) {
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
      <VBars {...chart} />
    </Card>
  );
}
