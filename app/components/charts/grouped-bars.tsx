import { useState, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "../../lib/cn";
import {
  formatNumber,
  formatSignedNumber,
  TABULAR_NUMERALS_CLASS,
} from "../../lib/format";
import { useGrow, useUid } from "../../lib/hooks/use-motion";
import { Card, type CardProps } from "../tiles/card";
import { DeltaChip } from "../tiles/delta-chip";
import { nextHoverIndex, NO_HOVER, tooltipAnchor } from "./line-chart";
import { niceMax, V_BAR_SERIES, vBarHeight } from "./v-bars";

/**
 * Grouped bars — two seasons side by side per fixture, with the year-on-year
 * movement stated as a chip above each pair.
 *
 * ITS CONSUMER IS HERO 2 (US-036): "Matchday ticket revenue by fixture
 * (CHF 000)", EIGHT fixtures, so SIXTEEN bars and EIGHT chips share one tile.
 * That density is the whole design problem this component solves, and it is why
 * the layout below is arithmetic rather than padding guesses.
 *
 * THREE EXPORTS, so each seam is reachable:
 *
 *   `groupedBarGeometry`  every coordinate, pure — testable with no DOM
 *   `GroupedBars`         the chart: gutter scale, pairs, chips, hover tooltip
 *   `GroupedBarTile`      `Card` + `GroupedBars` — what a dashboard tile is
 *
 * ── THE OVERLAP FIX IS A REVIEW DECISION — DO NOT REVERT IT ──────────────────
 * The reported defect was OVERLAPPING NUMBERS: the y-axis scale was drawn
 * inside the plot and the delta chips sat on top of the bars, so the axis
 * figures and the chips collided, and at eight pairs neighbouring chips
 * collided with each other. Both halves of the fix are structural here, not
 * cosmetic, and each is provable from {@link groupedBarGeometry} alone:
 *
 *   1. A DEDICATED LEFT GUTTER. The scale lives in {@link AXIS_GUTTER} units of
 *      its own at the left edge; the plot — every bar, every chip — begins at
 *      `plotLeft`, to the RIGHT of it. Nothing is drawn over the figures,
 *      because there is nowhere for the two to meet.
 *   2. HEADROOM ABOVE THE BARS. {@link CHIP_BAND} units at the top of the plot
 *      are reserved for the chips and NO bar may enter them. That is not a
 *      hope about round numbers: the axis maximum is chosen from the geometry
 *      (`plotHeight / barZoneHeight`, see below), so the tallest bar's top is
 *      always at least `CHIP_BAND` below `plotTop`.
 *
 * The chips themselves are one flex strip across that band, one equal-width
 * cell per pair, inset by the gutter. Flex items cannot overlap one another,
 * and the strip starts at `plotLeft`, so "no chip over the axis, no chip over
 * its neighbour" holds by construction at eight pairs or eighty.
 *
 * ── WHY THERE ARE NO PER-BAR VALUE LABELS ────────────────────────────────────
 * Sixteen figures printed above sixteen bars is the collision the review was
 * about. The scale in the gutter carries the magnitudes, the chip carries the
 * movement, and the hover tooltip carries the exact readings — so every number
 * has exactly one place to be. THE ONE EXCEPTION IS A ZERO: a bar with no
 * height would otherwise be an invisible reading, so it is labelled at the
 * baseline (epic guardrail: "a zero renders as a labelled zero").
 *
 * ── BARS PERSIST ACROSS A DATA CHANGE ────────────────────────────────────────
 * PAIRS ARE KEYED BY FIXTURE, never by array index, so React reconciles `YB`
 * onto the same `<rect>` pair across a data change and the `y` / `height` CSS
 * transition runs from the geometry ON SCREEN to the new geometry. An index key
 * would remount the rects, `useGrow` would be `false` for the fresh instances,
 * and every bar would snap to the baseline on every change. The chip cells are
 * keyed the same way, for the same reason.
 *
 * ── REUSE, NOT A SECOND SET OF RULES ─────────────────────────────────────────
 * `niceMax` / `vBarHeight` / `V_BAR_SERIES` are US-018's, `tooltipAnchor` /
 * `nextHoverIndex` / `NO_HOVER` are US-025's, and the chip is US-017's
 * `DeltaChip` — arrow, explicit sign and a spoken direction, so colour is never
 * the sole signal. None of them is restated here.
 *
 * NO NUMBER IS FORMATTED HERE: every string comes from `app/lib/format.ts`
 * through the `format` / `formatDelta` props. NO HEX APPEARS HERE: colours are
 * token references. GRADIENT IDS COME FROM `useUid`, because Hero 2 shows two
 * charts at once and two `id="barFill"` do not draw two gradients.
 */

/* ------------------------------------------------------------ GEOMETRY -- */

/** The chart's own coordinate space, stretched to the tile by the `viewBox`. */
export const GROUPED_BAR_VIEW_WIDTH = 640;

/** Default view-box height. The fixture strip and legend sit below it. */
export const DEFAULT_GROUPED_BAR_HEIGHT = 240;

/**
 * THE LEFT GUTTER — review decision 1. The scale is drawn in here and the plot
 * starts after it, so an axis figure and a chip can never share a coordinate.
 */
export const AXIS_GUTTER = 44;

/**
 * THE HEADROOM — review decision 2. The top of the plot reserved for the delta
 * chips, which no bar is allowed to reach. Tall enough for a chip at the token
 * caption size plus air above the bar it belongs to.
 */
export const CHIP_BAND = 34;

/** Padding inside the view box, outside the gutter and the baseline. */
const PAD_LEFT = 4;
const PAD_RIGHT = 8;
const PAD_TOP = 6;
const PAD_BOTTOM = 6;

/** Gap between the gutter's figures and the plot they describe. */
const AXIS_LABEL_GAP = 8;

/** How much of a fixture's slot the PAIR occupies — the rest is the gap. */
const PAIR_SLOT_FRACTION = 0.72;

/** Gap between the two seasons of one fixture: paired, not touching. */
const BAR_GAP = 3;

/** Cap on bar width, so three fixtures in a wide tile do not become slabs. */
const MAX_BAR_WIDTH = 26;

/** Corner radius of a bar — the rounded caps. */
const BAR_RADIUS = 4;

/** Gridlines and gutter figures, as fractions of the axis maximum. */
const GRID_FRACTIONS = [0, 0.25, 0.5, 0.75, 1] as const;

/** Gap between the baseline and a labelled zero's baseline. */
const ZERO_LABEL_GAP = 5;

/** A bar with nothing to draw: a zero, a negative or a non-finite reading. */
const NO_HEIGHT = 0;

/** Coordinates rounded to this many decimals — attributes, not maths. */
const COORDINATE_PRECISION = 2;

function round(value: number): number {
  return Number(value.toFixed(COORDINATE_PRECISION));
}

/** The year-on-year movement of one fixture: current minus previous. */
export function groupedBarDelta(group: GroupedBarGroup): number {
  const previous = Number.isFinite(group.previous) ? group.previous : 0;
  const current = Number.isFinite(group.current) ? group.current : 0;
  return round(current - previous);
}

/** One season's rect inside a pair. */
export interface GroupedBarLayout {
  readonly value: number;
  readonly x: number;
  /** Top of the bar once grown. */
  readonly y: number;
  readonly height: number;
}

export interface GroupedBarPairLayout {
  /** The fixture — this pair's IDENTITY, and its React key. */
  readonly name: string;
  readonly previous: GroupedBarLayout;
  readonly current: GroupedBarLayout;
  /** The year-on-year movement the chip above the pair states. */
  readonly delta: number;
  /** Left edge of the fixture's slot, which is also its hover hit area. */
  readonly slotX: number;
  /** Centre of the slot — where the chip and the tooltip are pinned. */
  readonly centerX: number;
  /** The chip's reserved box: exactly its own slot, so neighbours cannot meet. */
  readonly chipLeft: number;
  readonly chipRight: number;
}

export interface GroupedBarAxisTick {
  readonly value: number;
  readonly y: number;
}

export interface GroupedBarGeometry {
  readonly width: number;
  readonly height: number;
  /** The axis maximum every bar is scaled against. */
  readonly max: number;
  /** Width of the dedicated scale gutter — review decision 1. */
  readonly axisGutter: number;
  /** Where the gutter's figures end, right-anchored. */
  readonly axisLabelX: number;
  /** Left edge of the plot: everything drawn is at or right of this. */
  readonly plotLeft: number;
  readonly plotRight: number;
  readonly plotWidth: number;
  /** Top of the plot — the axis maximum, and the top of the chip band. */
  readonly plotTop: number;
  readonly plotHeight: number;
  /** The band no bar may enter, reserved for the chips. */
  readonly chipBandTop: number;
  readonly chipBandHeight: number;
  /** The tallest a bar may be — `plotHeight` less the chip band. */
  readonly barZoneHeight: number;
  readonly baselineY: number;
  readonly slotWidth: number;
  readonly barWidth: number;
  readonly ticks: readonly GroupedBarAxisTick[];
  readonly pairs: readonly GroupedBarPairLayout[];
}

/**
 * The headroom factor the axis maximum must clear.
 *
 * THIS IS REVIEW DECISION 2, EXPRESSED AS ARITHMETIC. A bar of the maximum
 * value is `plotHeight * (value / max)` tall, so requiring `max` to be at least
 * `value * plotHeight / barZoneHeight` bounds every bar by `barZoneHeight` —
 * which leaves `CHIP_BAND` empty above the tallest of them, whatever the data.
 * `niceMax` only ever rounds UP, so the guarantee survives the rounding.
 */
function headroomFactor(plotHeight: number, barZoneHeight: number): number {
  if (barZoneHeight <= 0) return 1;
  return plotHeight / barZoneHeight;
}

/** One season's rect within an already-placed pair. */
function seasonLayout(
  value: number,
  x: number,
  max: number,
  plotHeight: number,
  baselineY: number,
): GroupedBarLayout {
  const height = vBarHeight(value, max, plotHeight);

  return { value, x: round(x), y: round(baselineY - height), height };
}

/**
 * Every coordinate the chart draws, or `null` when there is nothing to draw.
 *
 * Pure and exported, so the gutter clearance, the headroom and the chip slots
 * are all assertable without a DOM — which is how the two review decisions are
 * tested as geometry rather than as a class name.
 */
export function groupedBarGeometry(
  groups: readonly GroupedBarGroup[],
  height: number = DEFAULT_GROUPED_BAR_HEIGHT,
): GroupedBarGeometry | null {
  if (groups.length === 0 || !Number.isFinite(height) || height <= 0) {
    return null;
  }

  const width = GROUPED_BAR_VIEW_WIDTH;
  const plotLeft = PAD_LEFT + AXIS_GUTTER;
  const plotRight = width - PAD_RIGHT;
  const plotWidth = round(plotRight - plotLeft);
  const baselineY = round(height - PAD_BOTTOM);
  const plotHeight = round(baselineY - PAD_TOP);
  const barZoneHeight = round(plotHeight - CHIP_BAND);
  const max = niceMax(
    Math.max(
      ...groups.flatMap((group) =>
        [group.previous, group.current].map((value) =>
          Number.isFinite(value) ? value : 0,
        ),
      ),
    ),
    headroomFactor(plotHeight, barZoneHeight),
  );
  const slotWidth = round(plotWidth / groups.length);
  const pairWidth = Math.min(
    slotWidth * PAIR_SLOT_FRACTION,
    MAX_BAR_WIDTH * 2 + BAR_GAP,
  );
  const barWidth = round(Math.max((pairWidth - BAR_GAP) / 2, 1));

  return {
    width,
    height,
    max,
    axisGutter: AXIS_GUTTER,
    axisLabelX: round(plotLeft - AXIS_LABEL_GAP),
    plotLeft,
    plotRight,
    plotWidth,
    plotTop: PAD_TOP,
    plotHeight,
    chipBandTop: PAD_TOP,
    chipBandHeight: CHIP_BAND,
    barZoneHeight,
    baselineY,
    slotWidth,
    barWidth,
    ticks: GRID_FRACTIONS.map((fraction) => ({
      value: round(max * fraction),
      y: round(baselineY - fraction * plotHeight),
    })),
    pairs: groups.map((group, index) => {
      const slotX = round(plotLeft + index * slotWidth);
      const centerX = round(slotX + slotWidth / 2);

      return {
        name: group.name,
        previous: seasonLayout(
          group.previous,
          centerX - BAR_GAP / 2 - barWidth,
          max,
          plotHeight,
          baselineY,
        ),
        current: seasonLayout(
          group.current,
          centerX + BAR_GAP / 2,
          max,
          plotHeight,
          baselineY,
        ),
        delta: groupedBarDelta(group),
        slotX,
        centerX,
        chipLeft: slotX,
        chipRight: round(slotX + slotWidth),
      };
    }),
  };
}

/* -------------------------------------------------------------- COLOURS -- */

/**
 * The two seasons' colours, from US-018's series tokens rather than a second
 * table of the same three values: the PREVIOUS season is deep navy and the
 * CURRENT season is club red, which is Hero 2's own treatment.
 *
 * Token references, never hexes, so a token change moves this chart with
 * everything else — and a caller cannot smuggle a colour in, because there is
 * no colour prop to pass one to.
 */
export const GROUPED_BAR_SEASON = {
  previous: V_BAR_SERIES.navy,
  current: V_BAR_SERIES.red,
} as const;

export type GroupedBarSeason = keyof typeof GROUPED_BAR_SEASON;

/** The seasons in drawing order: last season first, this season beside it. */
const SEASON_ORDER: readonly GroupedBarSeason[] = ["previous", "current"];

/** Gradient stop opacities — a lift off the token colour, not a second colour. */
const GRADIENT_TOP_OPACITY = 1;
const GRADIENT_BOTTOM_OPACITY = 0.66;

/** The hover highlight: a filter, so nothing moves and no colour is swapped. */
const HOVER_HIGHLIGHT_CLASS = "brightness-110";

/* ----------------------------------------------------------------- DATA -- */

export interface GroupedBarGroup {
  /**
   * The fixture, and the pair's IDENTITY — {@link GroupedBars} keys on it,
   * never on the array index, so a data change transitions the same bars
   * instead of remounting them at zero.
   */
  readonly name: string;
  /** Last season's figure — the navy bar. A zero is a labelled zero. */
  readonly previous: number;
  /** This season's figure — the red bar. */
  readonly current: number;
}

/* ----------------------------------------------------------------- PAIR -- */

interface GroupedBarPairProps {
  geometry: GroupedBarGeometry;
  layout: GroupedBarPairLayout;
  /** `url(#…)` targets by season, from the chart's own `useUid`. */
  gradientId: (season: GroupedBarSeason) => string;
  format: (value: number) => string;
  grown: boolean;
  hovered: boolean;
  onHover: () => void;
}

/**
 * One fixture: an invisible full-slot hit area and the two season bars.
 *
 * The hit area is the WHOLE SLOT rather than the bars, so the shortest fixture
 * in the tile is as easy to hover as the tallest — and so the tooltip belongs
 * to the fixture, which is what criterion 3 asks for.
 */
function GroupedBarPair({
  geometry,
  layout,
  gradientId,
  format,
  grown,
  hovered,
  onHover,
}: GroupedBarPairProps) {
  return (
    <g
      data-slot="grouped-bar-pair"
      data-name={layout.name}
      data-hovered={hovered}
      onMouseEnter={onHover}
    >
      <rect
        data-slot="grouped-bar-hit"
        x={layout.slotX}
        y={geometry.plotTop}
        width={geometry.slotWidth}
        height={geometry.plotHeight}
        fill="transparent"
      />

      {SEASON_ORDER.map((season) => {
        const bar = layout[season];
        // Ungrown, a bar has no height and stands on the baseline; `useGrow` is
        // already `true` under reduced motion, so it is never left there.
        const top = grown ? bar.y : geometry.baselineY;

        return (
          <g key={season}>
            <rect
              data-slot="grouped-bar"
              data-season={season}
              x={bar.x}
              y={top}
              width={geometry.barWidth}
              height={grown ? bar.height : NO_HEIGHT}
              rx={BAR_RADIUS}
              fill={`url(#${gradientId(season)})`}
              className={cn(
                // The geometry transitions in CSS — no JavaScript per frame,
                // and the element persists across data changes, so this is the
                // update transition as well as the entrance.
                "transition-[y,height] duration-(--duration-grow) ease-enter",
                hovered && HOVER_HIGHLIGHT_CLASS,
              )}
            />

            {/* A bar with no height would be an invisible reading, so a zero
                (or a negative, or a hole) is labelled at the baseline. */}
            {bar.height === NO_HEIGHT && (
              <text
                data-slot="grouped-bar-zero"
                data-season={season}
                x={round(bar.x + geometry.barWidth / 2)}
                y={geometry.baselineY - ZERO_LABEL_GAP}
                textAnchor="middle"
                className={cn(
                  "fill-muted text-caption font-semibold",
                  TABULAR_NUMERALS_CLASS,
                )}
              >
                {format(bar.value)}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

/* ---------------------------------------------------------------- CHART -- */

export interface GroupedBarsProps {
  /** The fixtures, in display order. Keyed by `name`, not by position. */
  groups: readonly GroupedBarGroup[];
  /** What the navy bar is called in the legend and the tooltip: `25/26`. */
  previousLabel?: string;
  /** What the red bar is called in the legend and the tooltip: `26/27`. */
  currentLabel?: string;
  /**
   * How a figure becomes its label, for the gutter scale and the tooltip's two
   * seasons — a formatter from `app/lib/format.ts`.
   */
  format?: (value: number) => string;
  /**
   * How the MOVEMENT becomes its label, for the chip and the tooltip. Always a
   * SIGNED formatter from `app/lib/format.ts`.
   */
  formatDelta?: (value: number) => string;
  /**
   * OPTIONAL PER-FIXTURE TOOLTIP. Called with the hovered fixture's index and
   * rendered inside the hover box, replacing the default two-season-plus-delta
   * body. Without it a hover is still never silent.
   */
  tooltip?: (index: number) => ReactNode;
  /** View-box height of the plot. The fixture strip is added below it. */
  height?: number;
  /** Accessible name of the focusable plot group. */
  label?: string;
  className?: string;
}

/**
 * The chart: the scale in its gutter, one pair of gradient bars per fixture, a
 * delta chip band above them, wrapping fixture labels below, and a legend.
 *
 * HOVER IS ALSO KEYBOARD. The plot is focusable and the arrow keys move the
 * highlight through US-025's `nextHoverIndex`, which returns `null` for every
 * other key — so Tab, Enter and Space keep their meaning. The box carries
 * `role="status"`, so the reading is announced as the highlight moves, which is
 * the only way figures inside the (decorative) svg reach a screen reader.
 */
export function GroupedBars({
  groups,
  previousLabel = "Previous",
  currentLabel = "Current",
  format = formatNumber,
  formatDelta = formatSignedNumber,
  tooltip,
  height = DEFAULT_GROUPED_BAR_HEIGHT,
  label,
  className,
}: GroupedBarsProps) {
  // Document-global `url(#…)` ids: Hero 2 puts two charts on one screen.
  const uid = useUid("gbar");
  const grown = useGrow();
  const [hovered, setHovered] = useState(NO_HOVER);

  const geometry = groupedBarGeometry(groups, height);
  if (!geometry) return null;

  const gradientId = (season: GroupedBarSeason): string => `${uid}-${season}`;
  // View-box units to container percentages. The svg keeps its aspect ratio, so
  // the plot's own box IS the container's box — but a horizontal coordinate is a
  // fraction of the WIDTH and a vertical one a fraction of the HEIGHT, and
  // mixing the two is how an overlay drifts off the geometry it is pinned to.
  const acrossPercent = (value: number): string =>
    `${(value / geometry.width) * 100}%`;
  const downPercent = (value: number): string =>
    `${(value / geometry.height) * 100}%`;
  const hoveredPair = geometry.pairs[hovered];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const next = nextHoverIndex(event.key, hovered, groups.length);
    if (next === null) return;
    event.preventDefault();
    setHovered(next);
  };

  return (
    <div data-slot="grouped-bars" className={className}>
      <div
        data-slot="grouped-bars-plot"
        tabIndex={0}
        role="group"
        aria-label={label}
        className="relative"
        onMouseLeave={() => setHovered(NO_HOVER)}
        onBlur={() => setHovered(NO_HOVER)}
        onKeyDown={onKeyDown}
      >
        {/* The plot is decoration: the fixture labels below carry the
            fixtures, the chips carry the movements and the hover box carries
            the readings. */}
        <svg
          data-slot="grouped-bars-svg"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          width="100%"
          aria-hidden="true"
          focusable="false"
          className="block"
        >
          <defs>
            {SEASON_ORDER.map((season) => (
              <linearGradient
                key={season}
                data-slot="grouped-bar-gradient"
                id={gradientId(season)}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={GROUPED_BAR_SEASON[season]}
                  stopOpacity={GRADIENT_TOP_OPACITY}
                />
                <stop
                  offset="100%"
                  stopColor={GROUPED_BAR_SEASON[season]}
                  stopOpacity={GRADIENT_BOTTOM_OPACITY}
                />
              </linearGradient>
            ))}
          </defs>

          {geometry.ticks.map((tick) => (
            <g key={tick.value} data-slot="grouped-bar-tick">
              {/* THE SCALE LIVES IN THE GUTTER — right-anchored, so it ends
                  before the plot begins and no chip can ever sit on it. */}
              <text
                data-slot="grouped-bar-axis-label"
                x={geometry.axisLabelX}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                className={cn("chart-axis-label", TABULAR_NUMERALS_CLASS)}
              >
                {format(tick.value)}
              </text>

              <line
                data-slot="grouped-bar-grid"
                x1={geometry.plotLeft}
                y1={tick.y}
                x2={geometry.plotRight}
                y2={tick.y}
                strokeWidth="1"
                strokeDasharray="3 4"
                className="stroke-line"
              />
            </g>
          ))}

          <line
            data-slot="grouped-bar-axis"
            x1={geometry.plotLeft}
            y1={geometry.baselineY}
            x2={geometry.plotRight}
            y2={geometry.baselineY}
            strokeWidth="1"
            className="stroke-border"
          />

          {geometry.pairs.map((layout, index) => (
            // KEYED BY FIXTURE, NEVER BY INDEX — see the note at the top.
            <GroupedBarPair
              key={layout.name}
              geometry={geometry}
              layout={layout}
              gradientId={gradientId}
              format={format}
              grown={grown}
              hovered={hovered === index}
              onHover={() => setHovered(index)}
            />
          ))}
        </svg>

        {/* THE CHIP BAND — one equal-width cell per fixture, inset by the
            gutter and confined to the reserved headroom. Flex cells cannot
            overlap each other, and the strip starts at `plotLeft`, so neither
            collision from the review can recur. */}
        <div
          data-slot="grouped-bar-chips"
          className="pointer-events-none absolute flex items-center"
          style={{
            left: acrossPercent(geometry.plotLeft),
            right: acrossPercent(geometry.width - geometry.plotRight),
            top: downPercent(geometry.chipBandTop),
            height: downPercent(geometry.chipBandHeight),
          }}
        >
          {geometry.pairs.map((layout) => (
            <div
              // Keyed by fixture, like the bars it belongs to.
              key={layout.name}
              data-slot="grouped-bar-chip-cell"
              data-name={layout.name}
              className="flex min-w-0 flex-1 justify-center"
            >
              <DeltaChip value={layout.delta} format={formatDelta} />
            </div>
          ))}
        </div>

        {hoveredPair && (
          <div
            data-slot="grouped-bars-tooltip"
            role="status"
            style={{
              ...tooltipAnchor((hoveredPair.centerX / geometry.width) * 100),
              // Under the chip band, so the box never covers the movement it
              // is explaining.
              top: downPercent(geometry.chipBandTop + geometry.chipBandHeight),
            }}
            className="pointer-events-none absolute z-10 rounded-badge bg-navy px-2.5 py-1.5 text-caption whitespace-nowrap text-bg shadow-tooltip"
          >
            {tooltip ? (
              tooltip(hovered)
            ) : (
              <>
                <div
                  data-slot="grouped-bars-tooltip-heading"
                  className="mb-0.5 font-bold"
                >
                  {hoveredPair.name}
                </div>
                {SEASON_ORDER.map((season) => (
                  <div
                    key={season}
                    data-slot="grouped-bars-tooltip-season"
                    data-season={season}
                    className={TABULAR_NUMERALS_CLASS}
                  >
                    {`${season === "previous" ? previousLabel : currentLabel} ${format(hoveredPair[season].value)}`}
                  </div>
                ))}
                {/* The movement, in the same chip the band uses — on navy the
                    `light` variant drops the colour coding and leans on the
                    arrow and the sign. */}
                <DeltaChip
                  value={hoveredPair.delta}
                  format={formatDelta}
                  variant="light"
                  className="mt-1"
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* DOM text, not `<text>`: a long fixture ("St. Gallen") has to WRAP, and
          SVG text cannot. Inset by the gutter, so each label sits under its
          own pair. */}
      <div
        data-slot="grouped-bar-labels"
        className="mt-2 flex items-start"
        style={{
          paddingLeft: acrossPercent(geometry.plotLeft),
          paddingRight: acrossPercent(geometry.width - geometry.plotRight),
        }}
      >
        {geometry.pairs.map((layout) => (
          <span
            key={layout.name}
            data-slot="grouped-bar-label"
            className="min-w-0 flex-1 text-center text-caption font-semibold break-words text-muted"
          >
            {layout.name}
          </span>
        ))}
      </div>

      <div
        data-slot="grouped-bar-legend"
        className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1"
        style={{ paddingLeft: acrossPercent(geometry.plotLeft) }}
      >
        {SEASON_ORDER.map((season) => (
          <span
            key={season}
            data-slot="grouped-bar-legend-item"
            data-season={season}
            className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted"
          >
            <span
              data-slot="grouped-bar-legend-swatch"
              aria-hidden="true"
              // The swatch is the redundant carrier; the WORD beside it is the
              // one that survives a washed-out projector.
              style={{ backgroundColor: GROUPED_BAR_SEASON[season] }}
              className="inline-block size-2.5 shrink-0 rounded-badge"
            />
            {season === "previous" ? previousLabel : currentLabel}
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
 * `HBarTile`, `LineChartTile` and `VBarTile` do.
 */
type GroupedBarCardProps = Pick<
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

export interface GroupedBarTileProps
  extends GroupedBarCardProps, Omit<GroupedBarsProps, "className"> {
  /** The scope line in the card header: Hero 2's "eight highest-grossing …". */
  period?: ReactNode;
}

/**
 * `Card` + `GroupedBars`.
 *
 * The card slots pass straight through, `action` included — a tile that wants a
 * badge or a filter beside its title puts one there rather than asking for a
 * variant here.
 */
export function GroupedBarTile({
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
}: GroupedBarTileProps) {
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
      <GroupedBars {...chart} />
    </Card>
  );
}
