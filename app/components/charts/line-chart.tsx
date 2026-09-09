import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "../../lib/cn";
import { formatNumber, TABULAR_NUMERALS_CLASS } from "../../lib/format";
import { useGrow, useUid } from "../../lib/hooks/use-motion";
import { cssVariable } from "../../lib/tokens";
import { Card, type CardProps } from "../tiles/card";

/**
 * The multi-series line chart — the reference build's `LineChart`, and the only
 * line chart in the product.
 *
 * TWO CONSUMERS, ONE CHART. Everything variable about them is a prop, so
 * neither needs a copy:
 *
 *   Hero band (US-016), `dark`   the selected period against the previous one:
 *                                a GOLD AREA line over a DASHED WHITE line on
 *                                the navy band, keyed by period so a filter
 *                                press REDRAWS it.
 *   Hero 2 (US-036), light       twelve months, both seasons, the current one
 *                                filled — full width under the fixture bars.
 *
 * So the series count is variable, per-series style is a prop (`area` /
 * `dash`), and the entrance replays whenever the caller re-keys the element.
 *
 * FOUR EXPORTS, so each consumer has the seam it needs:
 *
 *   `lineChartGeometry`  the paths and coordinates, pure — testable with no DOM
 *   `LineChartLegend`    the legend on its own: the hero band puts it in its
 *                        own header row beside the KPI, not under the chart
 *   `LineChart`          the chart — svg, hover guide, tooltip, axis, legend
 *   `LineChartTile`      `Card` + `LineChart`, what a dashboard tile is
 *
 * THE ENTRANCE IS A STROKE DRAW, and it must survive reduced motion.
 * A solid line normalises its own length (`pathLength={1}`), so a dash of 1
 * covers it exactly and the offset transitions 1 -> 0 with no path measurement
 * and no JavaScript per frame. `useGrow` is `true` in the FIRST render under
 * reduced motion, so the offset is `0` immediately — the path is fully drawn,
 * never stranded at offset 1 waiting for a transition that will not run
 * (US-006 / US-027; the trap US-013 verified end to end).
 *
 * A DASHED line cannot be drawn that way: its `stroke-dasharray` is already
 * carrying the dash pattern, and normalising `pathLength` would collapse the
 * pattern to one dash. It fades in instead, exactly as the reference build
 * does — and under reduced motion it is at full opacity in the first render for
 * the same reason.
 *
 * GRADIENT IDS COME FROM `useUid`. The hero band and Hero 2 can be on screen
 * together, and two `id="areaFill"` do not draw two gradients — the second
 * silently repaints the first, and which one wins depends on render order.
 *
 * NO NUMBER IS FORMATTED HERE. The tooltip renders through the `format` prop
 * from `app/lib/format.ts` (`formatMoney` for the band, compact money over
 * `chfFromThousands` for the months). NO HEX APPEARS HERE either: series
 * colours are token names resolved to `var(--color-…)` through
 * `app/lib/tokens.ts`, and everything else is a token utility class.
 */

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * The chart's own coordinate space. It is never rendered at this size: the
 * `viewBox` plus `width: 100%` stretch it to whatever the container is, which
 * is how one component serves an 8-column hero band and a full-width section.
 */
export const LINE_CHART_VIEW_WIDTH = 620;

/** Default view-box height. The band passes 168, Hero 2 passes 210. */
export const DEFAULT_LINE_CHART_HEIGHT = 158;

/** Padding inside the view box. The bottom strip holds the axis labels. */
const PAD_LEFT = 6;
const PAD_RIGHT = 6;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

/**
 * Head- and footroom added to the value range, as a fraction of it, so a peak
 * is not clipped by the top edge and a trough does not sit on the axis. More
 * below than above because the area fill needs somewhere to land.
 */
const HEADROOM_BELOW = 0.18;
const HEADROOM_ABOVE = 0.12;

/** The range of a flat series, which has none of its own to scale against. */
const FLAT_SPAN = 1;

/** Gridlines, as fractions of the plot height: the midline and the baseline. */
const GRID_FRACTIONS = [0.5, 1] as const;

/** Coordinates rounded to this many decimals — a `d` attribute, not maths. */
const COORDINATE_PRECISION = 2;

/** A missing or non-finite point. A ZERO, drawn and labelled as a zero. */
const MISSING_VALUE = 0;

/** No point is hovered. */
export const NO_HOVER = -1;

/** An `[x, y]` pair in view-box units. */
export type LinePoint = readonly [x: number, y: number];

function round(value: number): number {
  return Number(value.toFixed(COORDINATE_PRECISION));
}

/**
 * The value of a series at an index — `0` where there is none.
 *
 * A short series, a hole in one, or a `NaN` would otherwise put `NaN` into a
 * `d` attribute, which renders as a silently absent line. A zero is a real
 * reading here: the point sits on the axis and the tooltip labels it through
 * the caller's formatter, so the chart says "nothing sold that month" rather
 * than breaking its own scale.
 */
export function valueAt(values: readonly number[], index: number): number {
  const value = values[index];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : MISSING_VALUE;
}

export interface LineChartBounds {
  readonly min: number;
  readonly max: number;
}

/**
 * The value range every series is plotted against, padded.
 *
 * Shared across the series on purpose — two seasons on one pair of axes is the
 * whole point of the chart, and a per-series scale would make the comparison a
 * lie. `max` is always strictly greater than `min`, so no caller can divide by
 * a zero range.
 */
export function lineChartBounds(
  count: number,
  values: readonly (readonly number[])[],
): LineChartBounds {
  const all: number[] = [];
  for (const series of values) {
    for (let index = 0; index < count; index += 1) {
      all.push(valueAt(series, index));
    }
  }

  if (all.length === 0) return { min: 0, max: FLAT_SPAN };

  const low = Math.min(...all);
  const high = Math.max(...all);
  const span = high - low || FLAT_SPAN;

  return {
    min: low - span * HEADROOM_BELOW,
    max: high + span * HEADROOM_ABOVE,
  };
}

/**
 * The smoothing the reference build uses: each segment becomes a quadratic
 * through the previous point to the MIDPOINT of the segment, which rounds every
 * corner without letting the curve overshoot a peak the way a cubic spline
 * does. Deterministic — the same points always produce the same `d`, so the
 * shape is testable as a string.
 */
export function smoothPath(points: readonly LinePoint[]): string {
  let previous = points[0];
  if (!previous || points.length < 2) return "";

  let path = `M ${round(previous[0])},${round(previous[1])}`;

  for (const point of points.slice(1)) {
    const midX = round((previous[0] + point[0]) / 2);
    const midY = round((previous[1] + point[1]) / 2);
    path += ` Q ${round(previous[0])},${round(previous[1])} ${midX},${midY}`;
    previous = point;
  }

  return `${path} L ${round(previous[0])},${round(previous[1])}`;
}

/**
 * A single-point series, spread across the plot as a flat line.
 *
 * One point is a zero-length path, whose appearance is up to the browser. Two
 * copies of it read as "flat", which is what one reading actually means.
 */
function flatAcross(only: LinePoint, innerWidth: number): readonly LinePoint[] {
  return [
    [PAD_LEFT, only[1]],
    [round(PAD_LEFT + innerWidth), only[1]],
  ];
}

export interface LineChartSeriesGeometry {
  /** The smoothed line itself. */
  readonly line: string;
  /** The same line closed to the baseline, for the fill underneath it. */
  readonly area: string;
  /** One point per x index — where the hover dots sit. */
  readonly points: readonly LinePoint[];
}

export interface LineChartGeometry {
  readonly width: number;
  readonly height: number;
  /** Top of the plot area — where the hover guide starts. */
  readonly topY: number;
  /** Bottom of the plot area — where the guide ends and the area closes. */
  readonly baselineY: number;
  readonly gridYs: readonly number[];
  /** X coordinate per index, for the guide, the axis labels and the tooltip. */
  readonly xs: readonly number[];
  readonly series: readonly LineChartSeriesGeometry[];
}

/**
 * Every coordinate and path the chart draws, or `null` when there is nothing
 * to draw.
 *
 * Pure and exported so the shape of the chart can be asserted without a DOM —
 * which is the only way the smoothing, the shared scale and the zero handling
 * are testable at all.
 */
export function lineChartGeometry(
  count: number,
  values: readonly (readonly number[])[],
  height: number = DEFAULT_LINE_CHART_HEIGHT,
): LineChartGeometry | null {
  if (!Number.isFinite(count) || count < 1 || values.length === 0) return null;

  const width = LINE_CHART_VIEW_WIDTH;
  const innerWidth = width - PAD_LEFT - PAD_RIGHT;
  const innerHeight = height - PAD_TOP - PAD_BOTTOM;
  const baselineY = round(height - PAD_BOTTOM);
  const { min, max } = lineChartBounds(count, values);

  const xAt = (index: number): number =>
    round(
      count > 1
        ? PAD_LEFT + (index / (count - 1)) * innerWidth
        : PAD_LEFT + innerWidth / 2,
    );
  const yAt = (value: number): number =>
    round(PAD_TOP + (1 - (value - min) / (max - min)) * innerHeight);

  const indices = Array.from({ length: count }, (_unused, index) => index);
  const closeX = round(PAD_LEFT + innerWidth);

  return {
    width,
    height,
    topY: PAD_TOP,
    baselineY,
    gridYs: GRID_FRACTIONS.map((fraction) =>
      round(PAD_TOP + fraction * innerHeight),
    ),
    xs: indices.map(xAt),
    series: values.map((seriesValues) => {
      const points: readonly LinePoint[] = indices.map((index) => [
        xAt(index),
        yAt(valueAt(seriesValues, index)),
      ]);
      const first = points[0];
      const drawn =
        points.length > 1 || !first ? points : flatAcross(first, innerWidth);
      const line = smoothPath(drawn);

      return {
        line,
        area:
          line === ""
            ? ""
            : `${line} L ${closeX},${baselineY} L ${PAD_LEFT},${baselineY} Z`,
        points,
      };
    }),
  };
}

/* ---------------------------------------------------------------- AXIS -- */

/** Up to this many labels all fit; beyond it they are thinned. */
const UNTHINNED_LABEL_LIMIT = 12;

/** Roughly how many labels a thinned axis keeps. */
const THINNED_LABEL_TARGET = 8;

/** How far above the bottom edge an axis label's baseline sits. */
const AXIS_BASELINE_OFFSET = 6;

/**
 * Whether the label at `index` is drawn.
 *
 * Twelve months all fit at 1080p, so nothing is dropped in the common case
 * (E8 legibility). A longer axis — daily points across a quarter — keeps every
 * nth label plus the last one, so the axis still ends where the data does
 * instead of trailing off unlabelled.
 */
export function axisLabelShown(index: number, count: number): boolean {
  if (count <= UNTHINNED_LABEL_LIMIT) return true;

  const every = Math.ceil(count / THINNED_LABEL_TARGET);
  return index % every === 0 || index === count - 1;
}

/* --------------------------------------------------------------- HOVER -- */

/**
 * The data index nearest a pointer, given the wrapper's box.
 *
 * The pointer is read against the WRAPPER rather than the svg's own coordinate
 * space, because the svg is stretched by the `viewBox` and its internal units
 * are not screen pixels. The fraction is clamped, so a pointer that leaves the
 * box sideways snaps to the nearest end instead of indexing past the data.
 *
 * A zero-width box (a chart that has not been laid out yet, and jsdom's default)
 * would divide by zero, so it resolves to the first point.
 */
export function hoverIndex(
  clientX: number,
  rect: { left: number; width: number },
  count: number,
): number {
  if (count < 1) return NO_HOVER;
  if (!Number.isFinite(rect.width) || rect.width <= 0) return 0;

  const fraction = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  return Math.round(fraction * (count - 1));
}

/**
 * Where the arrow keys move the hovered point, or `null` for a key this chart
 * does not handle — so every other key keeps its default behaviour and the tab
 * order is untouched.
 *
 * The chart is focusable and reads the guide out through the tooltip's status
 * role, which is the cheap half of keyboard access; it deliberately does not
 * capture Tab, Enter or Space.
 */
export function nextHoverIndex(
  key: string,
  current: number,
  count: number,
): number | null {
  if (count < 1) return null;
  const last = count - 1;

  switch (key) {
    case "ArrowRight":
      return Math.min(current < 0 ? 0 : current + 1, last);
    case "ArrowLeft":
      return current < 0 ? last : Math.max(current - 1, 0);
    case "Home":
      return 0;
    case "End":
      return last;
    case "Escape":
      return NO_HOVER;
    default:
      return null;
  }
}

/** Within this many percent of an edge, the tooltip stops being centred. */
const TOOLTIP_EDGE_PERCENT = 12;

export interface TooltipAnchor {
  readonly left: string;
  readonly transform: string;
}

/**
 * How the tooltip is pinned to the guide line.
 *
 * Centred over the guide in the middle of the chart, but flipped to sit inside
 * the plot near either edge — a tooltip centred on the first point hangs half
 * outside the tile, which at 1080p on a projector is a clipped tooltip (E8).
 */
export function tooltipAnchor(percent: number): TooltipAnchor {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const transform =
    clamped < TOOLTIP_EDGE_PERCENT
      ? "translateX(0)"
      : clamped > 100 - TOOLTIP_EDGE_PERCENT
        ? "translateX(-100%)"
        : "translateX(-50%)";

  return { left: `${clamped}%`, transform };
}

/* -------------------------------------------------------------- COLOURS -- */

/**
 * Series colours, restricted to token names on purpose — the token set is
 * closed (`app/lib/tokens.ts`, colour discipline rule 5), so a caller names a
 * series colour rather than passing a colour string and no hex can be
 * smuggled in. The values are `var(--color-…)` rather than baked hexes, so a
 * token change moves the chart with everything else.
 *
 * `gold` is here, and it is the one place gold is a SERIES colour rather than
 * an accent: on the navy band the current period is gold over a white previous
 * period, which is the Reference Guide's own treatment. On white it stays an
 * accent — the light cycle below never reaches for it.
 */
export const LINE_SERIES_COLORS = {
  /** Club red — the current season on white. */
  red: cssVariable("color", "seriesPrimary"),
  /** Club blue — a third series. */
  blue: cssVariable("color", "seriesSecondary"),
  /** Deep navy — the previous season on white. */
  navy: cssVariable("color", "seriesTertiary"),
  /** Accent gold — the current period on the navy band, and only there. */
  gold: cssVariable("color", "accentTargetHit"),
  /** The page white — the previous period on the navy band. */
  white: cssVariable("color", "bg"),
} as const;

export type LineSeriesColor = keyof typeof LINE_SERIES_COLORS;

/**
 * What an unnamed series gets, by position. It depends on the surface because
 * the alternative is an illegible default: club red on navy cannot be read, so
 * the dark band starts from gold and white instead.
 */
const LIGHT_SERIES_CYCLE: readonly LineSeriesColor[] = ["red", "blue", "navy"];
const DARK_SERIES_CYCLE: readonly LineSeriesColor[] = ["gold", "white", "blue"];

/** The colour token a series ends up with, named or by position. */
export function lineSeriesColorToken(
  color: LineSeriesColor | undefined,
  index: number,
  dark: boolean,
): LineSeriesColor {
  if (color) return color;

  const cycle = dark ? DARK_SERIES_CYCLE : LIGHT_SERIES_CYCLE;
  return cycle[index % cycle.length] ?? "red";
}

/* ----------------------------------------------------------------- DATA -- */

export interface LineSeries {
  /** The series name, shown in the legend and in the tooltip. */
  readonly name: string;
  /** Its readings, in x order. Shorter than the axis reads as zeroes. */
  readonly values: readonly number[];
  /** Colour, by token name. Defaults by position — see the cycles above. */
  readonly color?: LineSeriesColor;
  /** Fill the space under the line with a fade of its own colour. */
  readonly area?: boolean;
  /** Draw it dashed — the "previous period" treatment. */
  readonly dash?: boolean;
}

/** A series with every option resolved, so nothing downstream re-decides. */
interface ResolvedSeries {
  readonly name: string;
  readonly values: readonly number[];
  readonly color: string;
  readonly area: boolean;
  readonly dash: boolean;
}

/**
 * Resolves the per-series options once, so the svg, the legend and the tooltip
 * cannot disagree about a series' colour or its dash.
 */
function resolveSeries(
  series: readonly LineSeries[],
  dark: boolean,
): readonly ResolvedSeries[] {
  return series.map((one, index) => ({
    name: one.name,
    values: one.values,
    color: LINE_SERIES_COLORS[lineSeriesColorToken(one.color, index, dark)],
    area: one.area ?? false,
    dash: one.dash ?? false,
  }));
}

/* --------------------------------------------------------------- LEGEND -- */

/** Legend swatch geometry, in screen pixels. */
const LEGEND_SWATCH_WIDTH = 14;
const LEGEND_SWATCH_HEIGHT = 3;
const LEGEND_SWATCH_RADIUS = 2;

/** The tooltip's own swatch — a small square rather than a rule. */
const TOOLTIP_SWATCH_SIZE = 7;

/**
 * A series' colour reaches the two DOM swatches (the legend's and the
 * tooltip's) as a CUSTOM PROPERTY rather than as a `background` or a
 * `border-color`, and the class then reads it back.
 *
 * The colour is a `var(--color-…)` reference, and a shorthand or a colour
 * longhand carrying another `var()` is the one place a CSS parser is entitled
 * to drop it. Setting a custom property is unambiguous everywhere, and it keeps
 * the value a token reference rather than a resolved string — which is the
 * point of `app/lib/tokens.ts`. The svg keeps using presentation attributes,
 * which take the same reference directly.
 */
type SeriesStyle = CSSProperties & { "--line-series": string };

function seriesStyle(color: string, shape: CSSProperties): SeriesStyle {
  return { ...shape, "--line-series": color };
}

export interface LineChartLegendProps {
  /** The same series array the chart is given. */
  series: readonly LineSeries[];
  /** Set on the navy band, so the labels are legible. */
  dark?: boolean;
  className?: string;
}

/**
 * The legend: one row per series, its swatch drawn the way its line is drawn —
 * a solid bar for a solid line, a dashed rule for a dashed one — so the legend
 * is readable without relying on the colour alone.
 *
 * Exported on its own because the hero band does not put its legend under the
 * chart: it sits in the band's header row, opposite the KPI. `LineChart`
 * renders one by default; the band passes `legend={false}` and places this
 * itself.
 */
export function LineChartLegend({
  series,
  dark = false,
  className,
}: LineChartLegendProps) {
  if (series.length === 0) return null;

  return (
    <div
      data-slot="line-chart-legend"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5",
        className,
      )}
    >
      {resolveSeries(series, dark).map((one) => (
        <span
          key={one.name}
          data-slot="line-chart-legend-item"
          className={cn(
            "inline-flex items-center gap-1.5 text-caption",
            dark ? "text-bg/80" : "text-text",
          )}
        >
          {/* A dashed line gets a DASHED swatch: the legend has to be
              readable without relying on the colour alone. */}
          <span
            data-slot="line-chart-legend-swatch"
            data-style={one.dash ? "dash" : "solid"}
            aria-hidden="true"
            className={cn(
              "shrink-0",
              one.dash
                ? "border-t-2 border-dashed border-[var(--line-series)]"
                : "bg-[var(--line-series)]",
            )}
            style={seriesStyle(
              one.color,
              one.dash
                ? { width: LEGEND_SWATCH_WIDTH }
                : {
                    width: LEGEND_SWATCH_WIDTH,
                    height: LEGEND_SWATCH_HEIGHT,
                    borderRadius: LEGEND_SWATCH_RADIUS,
                  },
            )}
          />
          {one.name}
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- CHART -- */

/** Stroke weights: a dashed "previous" line sits behind a solid current one. */
const SOLID_STROKE_WIDTH = 2.6;
const DASHED_STROKE_WIDTH = 1.8;

/** The dash pattern of a dashed series, in view-box units. */
const DASH_PATTERN = "5 5";

/**
 * `pathLength` the solid lines are normalised to, so one dash of the same
 * length covers the whole path however long it actually is. This is what makes
 * the stroke draw a two-attribute CSS transition instead of a measurement.
 */
const DRAW_LENGTH = 1;

/** Area fill opacity at the line, fading to nothing at the baseline. */
const AREA_OPACITY_LIGHT = 0.18;
const AREA_OPACITY_DARK = 0.32;

/** Hover dot geometry, in view-box units. */
const DOT_RADIUS = 4;
const DOT_STROKE_WIDTH = 2.5;

export interface LineChartProps {
  /** X-axis labels — week numbers, short month names. One per data point. */
  xs: readonly string[];
  /** One or more series, plotted against a single shared scale. */
  series: readonly LineSeries[];
  /**
   * How a value becomes tooltip text — a formatter from `app/lib/format.ts`.
   * `formatMoney` for the band's CHF figures, `formatNumber` (the default) for
   * a plain count. Values stored in CHF thousands are the caller's own
   * `chfFromThousands` composition, not a mode here.
   */
  format?: (value: number) => string;
  /** Set on the navy hero band: dark gridlines, axis, dots and tooltip. */
  dark?: boolean;
  /** View-box height. The band uses 168, Hero 2 uses 210. */
  height?: number;
  /** Render the legend under the chart. Off when the caller places its own. */
  legend?: boolean;
  /** Accessible name of the chart, for the focusable plot group. */
  label?: string;
  className?: string;
}

/**
 * The chart.
 *
 * IT REPLAYS BY BEING RE-KEYED. There is no "replay" prop and no effect
 * watching the data: the entrance is `useGrow`, which is `false` on an
 * instance's first paint, so `<LineChart key={period} …>` remounts on a filter
 * change and draws itself again from nothing — which is exactly what the hero
 * band wants when the presenter switches period. Changing the DATA without
 * changing the key updates the paths in place instead, with no flash.
 *
 * Hover is the wrapper's, not the svg's: the pointer is mapped over the
 * wrapper's box to the nearest data index (see {@link hoverIndex}), a vertical
 * guide and one dot per series are drawn at that index, and the tooltip lists
 * EVERY series' value there — the comparison is the reason the chart exists, so
 * a tooltip showing only the series nearest the pointer would be useless.
 */
export function LineChart({
  xs,
  series,
  format = formatNumber,
  dark = false,
  height = DEFAULT_LINE_CHART_HEIGHT,
  legend = true,
  label,
  className,
}: LineChartProps) {
  const grown = useGrow();
  // Document-global `url(#…)` ids — the hero band and Hero 2 can both be on
  // screen, and two `id="area0"` would silently paint one gradient twice.
  const uid = useUid("line");
  const [hovered, setHovered] = useState(NO_HOVER);
  const wrapper = useRef<HTMLDivElement>(null);

  const resolved = resolveSeries(series, dark);
  const geometry = lineChartGeometry(
    xs.length,
    resolved.map((one) => one.values),
    height,
  );

  if (!geometry) return null;

  const hoveredX = geometry.xs[hovered];
  const showGuide = hoveredX !== undefined;

  const onMouseMove = (event: MouseEvent<HTMLDivElement>): void => {
    const rect = wrapper.current?.getBoundingClientRect();
    if (!rect) return;
    setHovered(hoverIndex(event.clientX, rect, xs.length));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const next = nextHoverIndex(event.key, hovered, xs.length);
    if (next === null) return;
    event.preventDefault();
    setHovered(next);
  };

  return (
    <div data-slot="line-chart" className={className}>
      <div
        ref={wrapper}
        data-slot="line-chart-plot"
        // Focusable and arrow-key driven, but nothing is captured beyond the
        // keys above — Tab still leaves, so the tab order is unchanged.
        tabIndex={0}
        role="group"
        aria-label={label}
        className="relative"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHovered(NO_HOVER)}
        onBlur={() => setHovered(NO_HOVER)}
        onKeyDown={onKeyDown}
      >
        {/* The svg is decoration: the axis labels and the tooltip carry the
            readings, and the plot group above owns the accessible name. */}
        <svg
          data-slot="line-chart-svg"
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          width="100%"
          aria-hidden="true"
          focusable="false"
          className="block"
        >
          <defs>
            {resolved.map((one, index) =>
              one.area ? (
                <linearGradient
                  key={one.name}
                  data-slot="line-chart-area-gradient"
                  id={`${uid}-area-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={one.color}
                    stopOpacity={dark ? AREA_OPACITY_DARK : AREA_OPACITY_LIGHT}
                  />
                  <stop offset="100%" stopColor={one.color} stopOpacity={0} />
                </linearGradient>
              ) : null,
            )}
          </defs>

          {geometry.gridYs.map((y) => (
            <line
              key={y}
              data-slot="line-chart-grid"
              x1={PAD_LEFT}
              y1={y}
              x2={geometry.width - PAD_RIGHT}
              y2={y}
              strokeWidth="1"
              strokeDasharray="3 4"
              className={dark ? "stroke-bg/10" : "stroke-line"}
            />
          ))}

          {resolved.map((one, index) =>
            one.area ? (
              <path
                key={one.name}
                data-slot="line-chart-area"
                d={geometry.series[index]?.area}
                fill={`url(#${uid}-area-${index})`}
                className={cn(
                  "transition-opacity duration-(--duration-grow) ease-enter",
                  grown ? "opacity-100" : "opacity-0",
                )}
              />
            ) : null,
          )}

          {resolved.map((one, index) => (
            <path
              key={one.name}
              data-slot="line-chart-line"
              data-series={one.name}
              data-style={one.dash ? "dash" : "solid"}
              d={geometry.series[index]?.line}
              fill="none"
              stroke={one.color}
              strokeWidth={one.dash ? DASHED_STROKE_WIDTH : SOLID_STROKE_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              // A dashed line's dasharray is its pattern, so it cannot also be
              // its draw; it fades in instead. Either way `useGrow` is already
              // `true` under reduced motion, so neither is left hidden.
              pathLength={one.dash ? undefined : DRAW_LENGTH}
              strokeDasharray={one.dash ? DASH_PATTERN : DRAW_LENGTH}
              strokeDashoffset={one.dash || grown ? 0 : DRAW_LENGTH}
              className={
                one.dash
                  ? cn(
                      "transition-opacity duration-(--duration-grow) ease-enter",
                      grown ? "opacity-90" : "opacity-0",
                    )
                  : "transition-[stroke-dashoffset] duration-(--duration-grow) ease-enter"
              }
            />
          ))}

          {showGuide && (
            <g data-slot="line-chart-guide">
              <line
                x1={hoveredX}
                y1={geometry.topY}
                x2={hoveredX}
                y2={geometry.baselineY}
                strokeWidth="1"
                className={dark ? "stroke-bg/40" : "stroke-border"}
              />
              {resolved.map((one, index) => (
                <circle
                  key={one.name}
                  data-slot="line-chart-dot"
                  cx={hoveredX}
                  cy={geometry.series[index]?.points[hovered]?.[1]}
                  r={DOT_RADIUS}
                  stroke={one.color}
                  strokeWidth={DOT_STROKE_WIDTH}
                  className={dark ? "fill-navy" : "fill-bg"}
                />
              ))}
            </g>
          )}

          {xs.map((tick, index) =>
            axisLabelShown(index, xs.length) ? (
              <text
                key={`${tick}-${index}`}
                data-slot="line-chart-axis-label"
                x={geometry.xs[index]}
                y={geometry.height - AXIS_BASELINE_OFFSET}
                textAnchor="middle"
                // 12px from the token set, not the reference's 10px: the axis
                // has to be readable at 1080p from the back of a room (E8).
                className={cn("chart-axis-label", dark && "fill-bg/60")}
              >
                {tick}
              </text>
            ) : null,
          )}
        </svg>

        {showGuide && (
          <LineChartTooltip
            heading={xs[hovered]}
            series={resolved}
            index={hovered}
            format={format}
            dark={dark}
            anchor={tooltipAnchor((hoveredX / geometry.width) * 100)}
          />
        )}
      </div>

      {legend && (
        <LineChartLegend series={series} dark={dark} className="mt-2" />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- TOOLTIP -- */

interface LineChartTooltipProps {
  heading: ReactNode;
  series: readonly ResolvedSeries[];
  index: number;
  format: (value: number) => string;
  dark: boolean;
  anchor: TooltipAnchor;
}

/**
 * The hover tooltip: the x label, then EVERY series' reading at that index.
 *
 * A DOM element rather than svg text, so the figures get real tabular numerals
 * and wrap the way text does. `role="status"` is what makes the arrow-key
 * navigation above worth having — the reading is announced as the guide moves —
 * and it is polite, so it never interrupts.
 */
function LineChartTooltip({
  heading,
  series,
  index,
  format,
  dark,
  anchor,
}: LineChartTooltipProps) {
  return (
    <div
      data-slot="line-chart-tooltip"
      role="status"
      style={{ left: anchor.left, transform: anchor.transform }}
      className={cn(
        "pointer-events-none absolute top-0 z-10 rounded-badge px-2.5 py-1.5 text-caption whitespace-nowrap shadow-tooltip",
        dark ? "bg-bg text-navy" : "bg-navy text-bg",
      )}
    >
      <div data-slot="line-chart-tooltip-heading" className="mb-0.5 font-bold">
        {heading}
      </div>
      {series.map((one) => (
        <div
          key={one.name}
          data-slot="line-chart-tooltip-row"
          className={cn("flex items-center gap-1.5", TABULAR_NUMERALS_CLASS)}
        >
          <span
            data-slot="line-chart-tooltip-swatch"
            aria-hidden="true"
            className="shrink-0 bg-[var(--line-series)]"
            style={seriesStyle(one.color, {
              width: TOOLTIP_SWATCH_SIZE,
              height: TOOLTIP_SWATCH_SIZE,
              borderRadius: LEGEND_SWATCH_RADIUS,
            })}
          />
          <span className="opacity-70">{one.name}</span>
          <span className="ml-auto pl-2 font-semibold">
            {format(valueAt(one.values, index))}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- TILE -- */

/**
 * The card chrome the tile forwards to `Card`, listed rather than spread so
 * the tile's API is readable in one place — and so `subtitle` can stay the
 * card's own scope line under a different name (`period`), exactly as
 * `KpiTile` and `HBarTile` do.
 */
type LineChartCardProps = Pick<
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

export interface LineChartTileProps
  extends LineChartCardProps, Omit<LineChartProps, "className" | "dark"> {
  /** The scope line in the card header. */
  period?: ReactNode;
}

/**
 * `Card` + `LineChart`.
 *
 * `dark` is deliberately NOT part of the tile's API: a `Card` is always the
 * white tile surface, so a dark chart is `LineChart dark` on the caller's own
 * navy band (US-016). The two cannot be confused into a half-dark tile.
 */
export function LineChartTile({
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
}: LineChartTileProps) {
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
      <LineChart {...chart} />
    </Card>
  );
}
