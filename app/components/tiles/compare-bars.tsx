import { cn } from "../../lib/cn";
import { formatNumber, TABULAR_NUMERALS_CLASS } from "../../lib/format";
import { useCountUp, useGrow } from "../../lib/hooks/use-motion";
import {
  H_BAR_SERIES,
  hBarMax,
  hBarPercent,
  type HBarSeries,
} from "../charts/h-bars";

/**
 * Compare bars — two figures of the SAME measure, on one shared scale, each
 * with its own label and its own value.
 *
 * WHAT IT IS FOR, AND WHY IT IS NOT `HBars`
 * Hero 2's totals tile states last season against this season, and Hero 3's
 * overall tile (US-038) states budget against actual. Both sit INSIDE a KPI
 * tile, under the headline number, in the narrow (4 of 12) column beside a
 * wide chart — and US-021's `HBars` cannot go there: its row is a fixed
 * {@link H_BAR_LABEL_WIDTH_PX}px label column plus a fixed
 * {@link H_BAR_VALUE_WIDTH_PX}px value column, which are REVIEW DECISIONS for a
 * ranked list of long product names and would leave roughly 70px of track in
 * this column. Widening them there would break the five tiles that depend on
 * them; forking the row would be two spellings of the same bar.
 *
 * So this is the layout that fits: the label and the figure share one line
 * ABOVE a full-width track, which is the reference build's `CompareBar`.
 *
 * IT STILL BORROWS EVERYTHING IT CAN. The scale ({@link hBarMax}), the width
 * arithmetic ({@link hBarPercent}, guarded against a zero maximum) and the bar
 * fills ({@link H_BAR_SERIES}) are `h-bars.tsx`'s own exports, so there is no
 * second scaling rule and no second colour table — and, as there, a caller
 * names a series rather than passing a colour, so no hex can be smuggled in.
 *
 * TWO BARS ARE ONE COMPARISON, so they grow together rather than in sequence:
 * a per-row stagger would make the pair read as a ranking, which is exactly
 * what it is not. The FIGURES count up (US-027's `useCountUp`, continuing from
 * whatever is on screen) and the WIDTHS transition in CSS off `useGrow`, which
 * is already `true` under reduced motion — so nothing is left at zero width.
 *
 * NO NUMBER IS FORMATTED HERE: every string comes from `app/lib/format.ts`
 * through the `format` prop.
 */

/** Track height. Slimmer than a chart row: this is a support, not the chart. */
const TRACK_HEIGHT_CLASS = "h-2.5";

/** An ungrown bar, and the width of a bar with nothing to show. */
const NO_WIDTH = 0;

export interface CompareRow {
  /**
   * What the bar is: `Season 25/26`, `Budget`. Also the row's IDENTITY — the
   * list keys on it, never on the array index, so a data change transitions the
   * same bar instead of remounting it at zero width.
   */
  readonly name: string;
  /** The figure, in the caller's own units. */
  readonly value: number;
  /** Bar colour, by series name. Defaults to the deep navy. */
  readonly series?: HBarSeries;
}

export interface CompareBarProps extends CompareRow {
  /**
   * The larger of the figures being compared. Passed in rather than derived,
   * because a compare bar is only meaningful beside the other one — the two
   * MUST share a scale or the comparison is a lie.
   */
  max: number;
  /**
   * How the figure becomes text — a formatter from `app/lib/format.ts`. It is
   * called with mid-animation values, which is why every formatter there
   * rounds.
   */
  format?: (value: number) => string;
  className?: string;
}

/** The default fill: the deep navy, which is the comparison year's colour. */
const DEFAULT_SERIES: HBarSeries = "navy";

/** One labelled bar: its name and its figure on a line, then the track. */
export function CompareBar({
  name,
  value,
  max,
  series = DEFAULT_SERIES,
  format = formatNumber,
  className,
}: CompareBarProps) {
  const grown = useGrow();
  const counted = useCountUp(value);

  return (
    <div
      data-slot="compare-bar"
      data-name={name}
      className={cn("min-w-0", className)}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span data-slot="compare-bar-label" className="text-caption text-muted">
          {name}
        </span>
        {/* The figure carries the value into the accessibility tree; the track
            below is the same shape for every row, so it is decoration. */}
        <span
          data-slot="compare-bar-value"
          className={cn("text-body font-bold", TABULAR_NUMERALS_CLASS)}
        >
          {format(counted)}
        </span>
      </div>

      <div
        data-slot="compare-bar-track"
        aria-hidden="true"
        className={cn(
          "overflow-hidden rounded-badge bg-surface",
          TRACK_HEIGHT_CLASS,
        )}
      >
        <div
          data-slot="compare-bar-fill"
          data-series={series}
          className={cn(
            "h-full rounded-badge bg-linear-to-r transition-[width] duration-(--duration-grow) ease-enter",
            H_BAR_SERIES[series],
          )}
          style={{ width: `${grown ? hBarPercent(value, max) : NO_WIDTH}%` }}
        />
      </div>
    </div>
  );
}

export interface CompareBarsProps {
  /** The figures being compared, in reading order. Two, in both consumers. */
  rows: readonly CompareRow[];
  /** How every figure becomes text. One formatter for the whole comparison. */
  format?: (value: number) => string;
  className?: string;
}

/**
 * The comparison: every bar scaled against the LARGEST of them, so the longer
 * bar fills the track and the other reads as a proportion of it.
 */
export function CompareBars({ rows, format, className }: CompareBarsProps) {
  if (rows.length === 0) return null;

  const max = hBarMax(rows);

  return (
    <div data-slot="compare-bars" className={cn("space-y-3", className)}>
      {rows.map((row) => (
        <CompareBar
          key={row.name}
          name={row.name}
          value={row.value}
          series={row.series}
          max={max}
          format={format}
        />
      ))}
    </div>
  );
}
