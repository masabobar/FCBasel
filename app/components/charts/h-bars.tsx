import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import {
  formatNumber,
  TABULAR_NUMERALS_CLASS,
  varianceDirection,
} from "../../lib/format";
import { useCountUp, useGrow } from "../../lib/hooks/use-motion";
import { VarianceDirection } from "../../lib/repositories/enums";
import { Card, type CardProps } from "../tiles/card";

/**
 * Horizontal bars — the reference build's `HBarsGradient` / `HBarRow`, and the
 * MOST REUSED chart in the product.
 *
 * FIVE CONSUMERS, ONE ROW. Nothing here may be forked, because five different
 * tiles are this same row with a different formatter:
 *
 *   Top Products (US-013)        units, 5 rows, club blue
 *   Top printed names (US-034)   units, 5 rows, club red
 *   Badge trend (US-035)         percentages, MIXED SIGN (+38%, +6%, -3%)
 *   Declining fixtures (US-037)  negative money, `-CHF 150k`, plus a
 *                                `-CHF 400k total` badge in the card's `action`
 *   Marketing drivers (US-039)   money, `CHF 240k`
 *
 * and the driver tile (US-023) is required to compose {@link HBars} rather than
 * write a second row. Three exports, so every one of them has the right seam:
 *
 *   `HBarRow`   one label / track / value line — the unit of reuse
 *   `HBars`     the ranked list, scaled to its own largest magnitude
 *   `HBarTile`  `Card` + `HBars` — what a dashboard tile actually is
 *
 * TWO REVIEW DECISIONS THAT MUST NOT BE REVERTED (Reference Guide; a reported
 * defect in each case):
 *
 *   1. The LABEL column is a fixed {@link H_BAR_LABEL_WIDTH_PX}px at weight 500
 *      with **no truncation** — `Cap "Rotblau"` and `Home shirt 26/27` show in
 *      full. A long label WRAPS inside that column; it never gains an ellipsis
 *      and never overflows the tile.
 *   2. The VALUE column is {@link H_BAR_VALUE_WIDTH_PX}px wide and
 *      `white-space: nowrap`, so `-CHF 150k` and `-CHF 110k` stay on one line.
 *      Because the row is shared, this holds in all five places above.
 *
 * Both widths and the nowrap are written as inline geometry rather than
 * utilities, so the decision is a value in one place — and a test reads it back
 * off the rendered element.
 *
 * NO NUMBER IS FORMATTED HERE. Every string comes from `app/lib/format.ts`
 * through the `format` prop (`formatNumber` by default, `formatMoneyCompact` for
 * `CHF 150k`, `formatSignedPercent` for `+38%`). No motion is invented here
 * either: the value is US-027's `useCountUp`, which continues from the figure ON
 * SCREEN, and the width is a CSS transition keyed off `useGrow`. There is no
 * local `useState` and no timer in this file — a test asserts that.
 */

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * Label column width, in pixels. Fixed so every row's bar starts on the same
 * vertical line, and wide enough for the longest product name in the data.
 */
export const H_BAR_LABEL_WIDTH_PX = 150;

/**
 * Value column width, in pixels. 96 rather than the original 72: `-CHF 150k`
 * needs the room, and a value that wraps to a second line pushes the row out of
 * alignment with the rest of the list.
 */
export const H_BAR_VALUE_WIDTH_PX = 96;

/** Track height. Tall enough to read the gradient at 1080p on a projector. */
const TRACK_HEIGHT_CLASS = "h-7";

/** Per-row stagger of the width transition, so a list grows in as a sweep. */
const ROW_STAGGER_MS = 50;

/** Percentages are a `width` string, not maths — two decimals is plenty. */
const PERCENT_PRECISION = 2;

/** Nothing to draw: no data, or a list whose largest magnitude is zero. */
const NO_WIDTH = 0;

/* -------------------------------------------------------------- COLOURS -- */

/**
 * Bar fills, restricted to token names on purpose — the token set is closed
 * (`app/lib/tokens.ts`, colour discipline rule 5), so a caller names a series
 * rather than passing a colour string and no hex can be smuggled in.
 *
 * The caller names the club colour it wants; the class uses the
 * SERIES-IDENTITY alias of that colour, because a bar's colour says "this is
 * the printed-names list", never "this is good news". Judgement is expressed
 * only by the variance token below, and only on a value that is actually
 * negative.
 */
export const H_BAR_SERIES = {
  /** Club red — top printed names, the Marketing drivers. */
  red: "from-series-primary to-series-primary/70",
  /** Club blue — Top Products, the badge trend. */
  blue: "from-series-secondary to-series-secondary/70",
  /** Deep navy — a third list on screen beside the other two. */
  navy: "from-series-tertiary to-series-tertiary/70",
} as const;

export type HBarSeries = keyof typeof H_BAR_SERIES;

/** The reference build's default: the club's own red. */
const DEFAULT_SERIES: HBarSeries = "red";

/**
 * A declining row's fill. The variance token, never the club red — they share a
 * hex today and are separate tokens precisely so that can change.
 */
const NEGATIVE_FILL_CLASS = "from-variance-negative to-variance-negative/70";

/* ----------------------------------------------------------------- DATA -- */

export interface HBarDatum {
  /**
   * Row label, and the row's IDENTITY — `HBars` keys on it, never on the array
   * index, so a filter change transitions the same bar's width instead of
   * unmounting it and starting again from zero.
   */
  readonly name: string;
  /**
   * The figure. Its MAGNITUDE sets the bar's length and its SIGN sets the row's
   * direction, so a mixed-sign list (the badge trend: +38%, +6%, -3%) renders
   * both directions from one dataset.
   */
  readonly value: number;
}

/**
 * The largest magnitude in a list — what every bar in it is scaled against, so
 * the longest bar fills the track and the rest read as a proportion of it.
 *
 * Pure and exported so the scaling can be tested without a DOM.
 */
export function hBarMax(rows: readonly HBarDatum[]): number {
  return rows.reduce((max, row) => Math.max(max, Math.abs(row.value)), 0);
}

/**
 * A row's bar length as a percentage of the track, `0` to `100`.
 *
 * Guarded rather than left to produce `NaN` in a `width`, which renders as a
 * silently absent bar: an all-zero list (`max === 0`) and any non-finite input
 * both come back as zero width. A ZERO ROW IS STILL A ROW — its track and its
 * labelled `0` render; only the fill has nothing to show.
 */
export function hBarPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return NO_WIDTH;
  }

  const percent = (Math.abs(value) / max) * 100;
  return Number(Math.min(percent, 100).toFixed(PERCENT_PRECISION));
}

/**
 * What the row DISPLAYS, given the raw figure and the mode.
 *
 * In `negative` mode the row is a decline and the dataset stores the SIZE of
 * that decline (Hero 2's `{ opp: "FCZ", drop: 150 }`), so the displayed figure
 * is the negated magnitude — `formatMoneyCompact` then produces `-CHF 150k`
 * with the minus before the unit, which is the whole reason the sign is applied
 * to the number instead of being pasted in front of the string. Applying it to
 * the magnitude also makes it idempotent: a caller that already stores `-150`
 * gets `-CHF 150k` too, never `+CHF 150k` back.
 */
function displayedValue(value: number, negative: boolean): number {
  return negative ? -Math.abs(value) : value;
}

/* ------------------------------------------------------------------ ROW -- */

export interface HBarRowProps extends HBarDatum {
  /**
   * The largest magnitude in the list this row belongs to. Passed in rather
   * than derived, because a row is only meaningful beside the others — see
   * {@link hBarMax}.
   */
  max: number;
  /** Bar colour, by series name. Defaults to the club red. */
  series?: HBarSeries;
  /**
   * Every row in this list is a DECLINE: the figure is a magnitude and the row
   * shows it as negative, in the variance-negative token, growing leftwards.
   * A mixed-sign list does not need it — a negative value gets that treatment
   * on its own.
   */
  negative?: boolean;
  /**
   * How the figure becomes text — a formatter from `app/lib/format.ts`.
   * `formatNumber` (the default) for units, `formatMoneyCompact` for
   * `CHF 150k`, `formatSignedPercent` for `+38%`. It is called with
   * mid-animation values, which is why every formatter there rounds.
   */
  format?: (value: number) => string;
  /** Stagger of the width transition, in milliseconds. */
  delayMs?: number;
  className?: string;
}

/**
 * One row: a fixed label column, a track with a gradient fill, and a fixed
 * value column.
 *
 * DIRECTION IS THE SIGN OF THE DISPLAYED FIGURE, and it is carried three ways —
 * the side the bar grows from, the variance token, and the explicit `-` in the
 * text — because colour is never the sole signal (`app/lib/tokens.ts`, rule 2).
 * The direction is also published as `data-direction`, so a test and the
 * eventual e2e pass can assert it without reading a colour off a pixel.
 *
 * The WIDTH is driven by the target value and the VALUE TEXT by the count-up:
 * on a filter change the bar transitions to its new width in CSS while the
 * figure counts from the one on screen. Neither ever passes through zero.
 */
export function HBarRow({
  name,
  value,
  max,
  series = DEFAULT_SERIES,
  negative = false,
  format = formatNumber,
  delayMs = 0,
  className,
}: HBarRowProps) {
  const grown = useGrow();
  const counted = useCountUp(value);

  // Read off the TARGET, not the counted value, so the tone and the anchor do
  // not flip mid-count while the figure crosses zero.
  const direction = varianceDirection(displayedValue(value, negative));
  const declining = direction === VarianceDirection.DOWN;
  const percent = hBarPercent(value, max);

  return (
    <div
      data-slot="h-bar-row"
      data-direction={direction}
      className={cn("flex items-center gap-3", className)}
    >
      {/* NO TRUNCATION — a long name wraps inside its fixed column. There is
          deliberately no `truncate`, no `text-ellipsis` and no `line-clamp`
          here; adding one back is the defect this column was fixed for. */}
      <div
        data-slot="h-bar-label"
        style={{ width: H_BAR_LABEL_WIDTH_PX }}
        className="shrink-0 text-body font-medium break-words"
      >
        {name}
      </div>

      {/* The track is the same shape for every row, so it is decoration: the
          figure beside it is what carries the value into the a11y tree. */}
      <div
        data-slot="h-bar-track"
        aria-hidden="true"
        className={cn(
          "relative flex-1 overflow-hidden rounded-badge bg-surface",
          TRACK_HEIGHT_CLASS,
        )}
      >
        <div
          data-slot="h-bar-fill"
          className={cn(
            "absolute inset-y-0 rounded-badge transition-[width] duration-(--duration-grow) ease-enter",
            // A decline grows leftwards from the far edge; everything else
            // grows rightwards from the start of the track.
            declining ? "right-0 bg-linear-to-l" : "left-0 bg-linear-to-r",
            declining ? NEGATIVE_FILL_CLASS : H_BAR_SERIES[series],
          )}
          style={{
            width: `${grown ? percent : NO_WIDTH}%`,
            transitionDelay: delayMs ? `${delayMs}ms` : undefined,
          }}
        />
      </div>

      {/* 96px and `nowrap`: `-CHF 150k` stays on one line. Tabular figures keep
          the column aligned while every row counts up at once. */}
      <div
        data-slot="h-bar-value"
        style={{ width: H_BAR_VALUE_WIDTH_PX, whiteSpace: "nowrap" }}
        className={cn(
          "shrink-0 text-right text-body font-bold",
          TABULAR_NUMERALS_CLASS,
          declining ? "text-variance-negative" : "text-text",
        )}
      >
        {format(displayedValue(counted, negative))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- LIST -- */

/** What a row inherits from the list it sits in. */
type HBarSeriesProps = Pick<HBarRowProps, "series" | "negative" | "format">;

export interface HBarsProps extends HBarSeriesProps {
  /** The ranked rows, largest first. Scaled against their own largest. */
  rows: readonly HBarDatum[];
  className?: string;
}

/**
 * The ranked list. Rows are KEYED BY NAME so a filter change re-renders the
 * same elements — the bars transition rather than remounting at zero width —
 * and each row's transition is staggered by its position.
 */
export function HBars({
  rows,
  series,
  negative,
  format,
  className,
}: HBarsProps) {
  if (rows.length === 0) return null;

  const max = hBarMax(rows);

  return (
    <div data-slot="h-bars" className={cn("space-y-3", className)}>
      {rows.map((row, index) => (
        <HBarRow
          key={row.name}
          name={row.name}
          value={row.value}
          max={max}
          series={series}
          negative={negative}
          format={format}
          delayMs={index * ROW_STAGGER_MS}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- TILE -- */

/**
 * The card chrome the tile forwards to `Card`, listed rather than spread so the
 * tile's API is readable in one place — and so `subtitle` can stay the card's
 * own scope line under a different name (`period`), exactly as `KpiTile` does.
 */
type HBarCardProps = Pick<
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

export interface HBarTileProps
  extends HBarCardProps, Omit<HBarsProps, "className"> {
  /** The scope line in the card header: `Units sold`, `8 fixtures shown`. */
  period?: ReactNode;
}

/**
 * `Card` + `HBars`.
 *
 * The card slots pass straight through, `action` included — that is where
 * Hero 2's `-CHF 400k total` badge and Top Products' own period filter go, so
 * neither needs a tile of its own.
 */
export function HBarTile({
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
  ...bars
}: HBarTileProps) {
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
      <HBars {...bars} />
    </Card>
  );
}
