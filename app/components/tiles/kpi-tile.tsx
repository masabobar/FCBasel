import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import { formatNumber } from "../../lib/format";
import { useGrow, useCountUp, useUid } from "../../lib/hooks/use-motion";
import { Card, type CardProps } from "./card";
import { DeltaChip, type DeltaChipProps } from "./delta-chip";

/**
 * The KPI tile — a labelled big number, a variance chip, and two optional
 * supports: a one-line subtitle and a six-point sparkline.
 *
 * THREE PARTS, ON PURPOSE, so that nothing has to be forked later:
 *
 *   `DeltaChip`   the variance chip, in its own module — the grouped bars and
 *                 the department table want it without a tile around it.
 *   `KpiFigure`   the number block WITHOUT a card: the navy hero band (US-016)
 *                 puts this straight onto its own surface with `onDark`.
 *   `KpiTile`     `Card` + `KpiFigure` — what a dashboard tile actually is.
 *
 * WHAT CARRIES THE HEROES WITHOUT A VARIANT PER HERO
 * Hero 2's "Total (8 fixtures shown)" and Hero 3's "Overall" are this tile with
 * extra content underneath (compare bars, a two-up footer). That content
 * arrives as `children`, below the number and its supports — so a hero composes
 * rather than copying, which is the acceptance criterion for the whole epic.
 *
 * NO NUMBER IS FORMATTED HERE and no motion is invented here. Strings come from
 * `app/lib/format.ts` through the `format` prop; the count-up is US-027's
 * `useCountUp`, which continues from the figure ON SCREEN so a filter change
 * counts from the old number instead of snapping back to zero. There is
 * deliberately no local `useState` in this file — a test asserts that.
 */

/* ----------------------------------------------------------- SPARKLINE -- */

/** The sparkline's own coordinate space. It is stretched to fit its box. */
const SPARK_WIDTH = 100;
const SPARK_HEIGHT = 32;

/** Stroke width in screen pixels, kept constant by `non-scaling-stroke`. */
const SPARK_STROKE_WIDTH = 2;

/**
 * Vertical breathing room, in view-box units, so the peak and the trough are
 * not clipped in half by the edge of the box.
 */
const SPARK_INSET = 3;

/** Opacity of the area fill directly under the line; it fades to nothing. */
const SPARK_FILL_OPACITY = 0.18;

/** Coordinates rounded to this many decimals — a `d` attribute, not maths. */
const SPARK_PRECISION = 2;

export interface SparklineGeometry {
  /** The trend line itself. */
  readonly line: string;
  /** The same line closed to the baseline, for the fade underneath it. */
  readonly area: string;
}

function round(value: number): number {
  return Number(value.toFixed(SPARK_PRECISION));
}

/**
 * The two paths of a sparkline, or `null` when there is nothing to draw.
 *
 * Pure and exported so the geometry can be tested without a DOM. Two
 * degenerate inputs are handled rather than left to produce `NaN` in a `d`
 * attribute — which renders as an invisible, silent nothing:
 *
 *   - a FLAT series (every point equal, and the single-point case it reduces
 *     to) has no range to scale against, so it draws through the middle;
 *   - a single point is duplicated, so it reads as a flat line rather than a
 *     zero-length path whose appearance is up to the browser.
 */
export function sparklineGeometry(
  points: readonly number[],
): SparklineGeometry | null {
  // Reading the first point is also the emptiness check the compiler accepts.
  const first = points[0];
  if (first === undefined) return null;

  const series: readonly number[] =
    points.length === 1 ? [first, first] : points;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min;
  const usableHeight = SPARK_HEIGHT - SPARK_INSET * 2;

  const x = (index: number): number =>
    round((index / (series.length - 1)) * SPARK_WIDTH);
  const y = (value: number): number =>
    round(
      range === 0
        ? SPARK_HEIGHT / 2
        : SPARK_INSET + (1 - (value - min) / range) * usableHeight,
    );

  const line = series
    .map((value, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(value)}`)
    .join(" ");

  return {
    line,
    area: `${line} L ${SPARK_WIDTH} ${SPARK_HEIGHT} L 0 ${SPARK_HEIGHT} Z`,
  };
}

export interface KpiSparklineProps {
  /** The trend, oldest first. Six points in the baseline tile. */
  points: readonly number[];
  /**
   * What the shape says, for a screen reader. Omit it and the sparkline is
   * hidden from the accessibility tree — which is the right default, because
   * the trend it draws is already stated by the number and the variance chip
   * beside it, and a second announcement of the same fact is noise.
   */
  label?: string;
  className?: string;
}

/**
 * A six-point trend line, hand-built.
 *
 * NOT the line chart (US-025). That one has axes, a legend, multiple series
 * and a hover guide; this is a 100x32 glyph that belongs to the tile it sits
 * in, and keeping them apart is what stops either from growing props for the
 * other's job.
 *
 * It PAINTS WITH `currentColor`, so there is no colour prop to smuggle a hex
 * through: the tile sets the colour with a token class (club red on white, the
 * page white on navy) and the line and its fade both follow.
 *
 * The entrance is a stroke draw: `pathLength="1"` normalises the path so a
 * dash of 1 covers it exactly, and the offset transitions from 1 to 0. No path
 * measurement, no JavaScript per frame. Under reduced motion `useGrow` is
 * already `true` on the first render, so the line is simply drawn.
 */
export function KpiSparkline({ points, label, className }: KpiSparklineProps) {
  const grown = useGrow();
  // Document-global `url(#…)` id — the baseline dashboard shows two of these
  // at once, and two `id="spark"` would silently paint one gradient twice.
  const uid = useUid("spark");
  const geometry = sparklineGeometry(points);

  if (!geometry) return null;

  const fillId = `${uid}-fill`;

  return (
    <svg
      data-slot="kpi-sparkline"
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      // Stretched to the tile's width; the stroke below opts out of the
      // stretch so the line keeps an even weight.
      preserveAspectRatio="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn("h-10 w-full", className)}
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor="currentColor"
            stopOpacity={SPARK_FILL_OPACITY}
          />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        data-slot="kpi-sparkline-area"
        d={geometry.area}
        fill={`url(#${fillId})`}
        className={cn(
          "transition-opacity duration-(--duration-grow) ease-enter",
          grown ? "opacity-100" : "opacity-0",
        )}
      />
      <path
        data-slot="kpi-sparkline-line"
        d={geometry.line}
        fill="none"
        stroke="currentColor"
        strokeWidth={SPARK_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={grown ? 0 : 1}
        className="transition-[stroke-dashoffset] duration-(--duration-grow) ease-enter"
      />
    </svg>
  );
}

/* -------------------------------------------------------------- FIGURE -- */

/** The chip a KPI figure carries; its surface decides the chip's variant. */
export type KpiDelta = Omit<DeltaChipProps, "variant">;

export interface KpiFigureProps {
  /**
   * The headline figure, as a plain number. It counts up from whatever is
   * currently on screen, so a period change continues from the old figure.
   */
  value: number;
  /**
   * How that number becomes text — a formatter from `app/lib/format.ts`:
   * `formatMoney` for `CHF 148’200`, `formatMoneyMillions` for `CHF 7.83M`,
   * `formatNumber` (the default) for a plain count. It is called with
   * mid-animation values, which is why every formatter there rounds.
   */
  format?: (value: number) => string;
  /** The variance chip beside the number. */
  delta?: KpiDelta;
  /** One supporting line under the number: `vs last month`, `of ~38’000`. */
  subtitle?: ReactNode;
  /** Six-point trend under the number. Omitted when empty. */
  sparkline?: readonly number[];
  /** Accessible description of that trend; see {@link KpiSparklineProps}. */
  sparklineLabel?: string;
  /**
   * Set on a DARK surface — the navy hero band. It lightens the number and the
   * subtitle and puts the delta chip into its `light` variant, so a caller
   * cannot forget the chip and leave an illegible red figure on navy.
   */
  onDark?: boolean;
  className?: string;
  /** Extra body content under the supports — Hero 2 and Hero 3's compare bars. */
  children?: ReactNode;
}

/**
 * The number block on its own, with no card around it.
 *
 * The 30px/700/tight/tabular treatment is the `.kpi-number` role class from
 * `app/app.css`, not four utilities restated here — every big number in the
 * product is that one declaration, and the token test pins its values.
 */
export function KpiFigure({
  value,
  format = formatNumber,
  delta,
  subtitle,
  sparkline,
  sparklineLabel,
  onDark = false,
  className,
  children,
}: KpiFigureProps) {
  const shown = useCountUp(value);
  const hasSparkline = sparkline !== undefined && sparkline.length > 0;

  return (
    <div data-slot="kpi-figure" className={className}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {/* No `aria-live`: the count-up is decoration on a figure that is
            already in the accessibility tree, and announcing every frame of it
            would be worse than announcing none. */}
        <span
          data-slot="kpi-value"
          className={cn("kpi-number", onDark && "text-bg")}
        >
          {format(shown)}
        </span>
        {delta && (
          <DeltaChip {...delta} variant={onDark ? "light" : "default"} />
        )}
      </div>

      {subtitle && (
        <div
          data-slot="kpi-subtitle"
          className={cn(
            "mt-1.5 text-caption",
            onDark ? "text-bg/70" : "text-muted",
          )}
        >
          {subtitle}
        </div>
      )}

      {hasSparkline && (
        <KpiSparkline
          points={sparkline}
          label={sparklineLabel}
          className={cn("mt-3", onDark ? "text-bg" : "text-red")}
        />
      )}

      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- TILE -- */

/**
 * The card chrome a KPI tile forwards to `Card`. Listed rather than spread so
 * the tile's API is readable in one place, and so `subtitle` can mean the line
 * under the NUMBER here while the card's own header line is `period`.
 */
type KpiCardProps = Pick<
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

/**
 * `onDark` is deliberately NOT part of the tile's API: a `Card` is always the
 * white tile surface, so a dark KPI is `KpiFigure` on the caller's own dark
 * surface (US-016's navy band). The two cannot be confused into a half-dark
 * tile. `className` belongs to the card here, so the figure's is dropped.
 */
export interface KpiTileProps
  extends KpiCardProps, Omit<KpiFigureProps, "className" | "onDark"> {
  /** The scope line in the card header: `This month`, `8 fixtures shown`. */
  period?: ReactNode;
}

export function KpiTile({
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
  ...figure
}: KpiTileProps) {
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
      <KpiFigure {...figure} />
    </Card>
  );
}
