import type { ReactNode } from "react";

import { formatNumber } from "../../lib/format";
import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";
import type { VarianceJudgement } from "../../lib/repositories/enums";
import {
  HBarTile,
  hBarDisplayedValue,
  type HBarDatum,
  type HBarTileProps,
} from "../charts/h-bars";
import { DeltaChip } from "./delta-chip";

/**
 * The driver / breakdown tile — the small contribution list that answers
 * "what is driving this?" under each of the three causal follow-ups.
 *
 * THIS FILE DRAWS NO BARS. Every row on screen is US-021's `HBarRow`, reached
 * through `HBarTile`, and this module deliberately contains no track, no fill,
 * no width percentage, no label column, no value column and no count-up — a
 * source scan in `tests/unit/driver-tile.test.tsx` fails if any of them
 * reappears here. The horizontal bar row has five consumers already; a sixth
 * copy of it is the defect this story exists to avoid.
 *
 * WHAT THE TILE ADDS OVER A PLAIN `HBarTile`, and nothing else:
 *
 *   1. RANKING — {@link rankDrivers}. A breakdown is read top-down as "the
 *      biggest cause first", so the order is the tile's job rather than each
 *      caller's. Stable for ties, so Luzern precedes Sion exactly as
 *      `fixtureDeclines` in `app/lib/repositories/derive.ts` derives them.
 *   2. A DERIVED TOTAL — {@link driverTotal}, shown by
 *      {@link DriverTotalBadge}. The `-CHF 400k total` badge is computed from
 *      the rows on screen, so it cannot disagree with the bars above it; no
 *      caller may hand in a literal `400`.
 *   3. A NOTE LINE under the bars — Hero 2's one-line attendance note. It uses
 *      the `children` slot US-021's tile publishes, not a second card.
 *
 * Everything else is DELEGATED: the card chrome, the `action` slot, the
 * formatter, `negative` mode, the series colour, the scaling, the stagger and
 * the reduced-motion behaviour all belong to `HBarTile` / `HBars` / `HBarRow`
 * and are passed straight through. The badge is `DeltaChip`, not a chip of its
 * own. This tile is thin on purpose.
 *
 * THE THREE CONSUMERS, and how each one shapes it:
 *
 *   US-035 badge trend      percentages, MIXED SIGN — `formatSignedPercent`,
 *                           `rank="none"` to keep the authored order
 *                           (Bitpanda leads the list because it leads badge
 *                           selection, not because +2 is the largest figure)
 *   US-037 declining fixtures  `negative` money — `formatMoneyCompact`,
 *                           ranked, `showTotal` for `-CHF 400k total`, plus
 *                           the attendance `note`
 *   US-039 Marketing drivers   positive money — `formatMoneyCompact` for the
 *                           rows, ranked, `showTotal` with `totalJudgement`
 *                           ADVERSE because an overspend going UP is bad news
 *                           (US-022's trap), and `totalFormat` signed — see
 *                           {@link DriverTileProps.totalFormat}
 *
 * NO NUMBER IS FORMATTED HERE either: the total is a number and the string is
 * whatever `format` the rows already use, which is why the badge and the bars
 * always spell the currency the same way.
 */

/* ----------------------------------------------------------------- RANK -- */

/**
 * How the rows are ordered.
 *
 * `magnitude` is the breakdown default — biggest contribution first, by SIZE,
 * so a decline of 150 outranks a decline of 70 and a mixed-sign list ranks by
 * how much a row moved rather than which way. `none` keeps the caller's order
 * for a list whose sequence already means something.
 */
export type DriverRank = "magnitude" | "none";

const DEFAULT_RANK: DriverRank = "magnitude";

/**
 * The rows in the order the tile shows them, biggest contribution first.
 *
 * STABLE FOR TIES, and that is load-bearing rather than incidental: Luzern and
 * Sion both dropped CHF 70k, and the Reference Guide lists Luzern first because
 * `fixtureDeclines` derives them in fixture order. `Array.prototype.sort` is
 * stable (ES2019), so equal magnitudes keep the order they arrived in and the
 * tile agrees with the dataset instead of reshuffling it.
 *
 * Pure, and returns a NEW array — the caller's `readonly` rows are never
 * sorted in place, because they come straight off a dataset other tiles read.
 */
export function rankDrivers(
  rows: readonly HBarDatum[],
  rank: DriverRank = DEFAULT_RANK,
): readonly HBarDatum[] {
  if (rank === "none") {
    return rows;
  }
  return [...rows].sort(
    (left, right) => Math.abs(right.value) - Math.abs(left.value),
  );
}

/* ---------------------------------------------------------------- TOTAL -- */

/**
 * The sum of the figures the ROWS DISPLAY — the badge's number.
 *
 * Derived, never passed in. The declining-fixtures tile reads `-CHF 400k
 * total` because its four bars read -150, -110, -70 and -70; a literal in the
 * caller would let the badge survive a change to the fixtures and start lying
 * on the projector.
 *
 * `negative` mode is respected through {@link hBarDisplayedValue}, the same
 * function `HBarRow` puts through the formatter, so a list of magnitudes shown
 * as declines totals a decline. Ranking cannot change the result — addition
 * commutes — so the order of the rows is irrelevant here.
 */
export function driverTotal(
  rows: readonly HBarDatum[],
  negative = false,
): number {
  return rows.reduce(
    (total, row) => total + hBarDisplayedValue(row.value, negative),
    0,
  );
}

/** The word after the figure in the badge: `-CHF 400k total`. */
export const DRIVER_TOTAL_LABEL_KEY: TranslationKey = "tiles.driverTotal";

export interface DriverTotalBadgeProps {
  /** The total itself, from {@link driverTotal}. Signed. */
  total: number;
  /**
   * How the total becomes text. THE SAME formatter the rows use — passed by
   * {@link DriverTile} — so the badge and the bars cannot spell the unit
   * differently. Defaults to `formatNumber`, as `HBarRow` does.
   */
  format?: (value: number) => string;
  /**
   * Whether the total is good news, where its sign does not say. Marketing's
   * drivers total a POSITIVE CHF 410k that is an overspend, so US-039 passes
   * ADVERSE; the declining fixtures need nothing, their sign is the meaning.
   */
  judgement?: VarianceJudgement;
  /** The trailing word. Defaults to {@link DRIVER_TOTAL_LABEL_KEY}. */
  label?: ReactNode;
  className?: string;
}

/**
 * The summary chip for the card's `action` slot: `-CHF 400k total`.
 *
 * It is `DeltaChip` with a word after the figure — not a chip of its own —
 * which is what gives it the arrow, the explicit sign and the `sr-only`
 * direction for free. Colour is therefore never the only carrier here either.
 *
 * Exported so a follow-up can put the same badge somewhere else, but a tile
 * should normally pass `showTotal` and let {@link DriverTile} derive it.
 */
export function DriverTotalBadge({
  total,
  format = formatNumber,
  judgement,
  label,
  className,
}: DriverTotalBadgeProps) {
  const t = useT();

  return (
    <DeltaChip
      value={total}
      format={format}
      judgement={judgement}
      suffix={label ?? t(DRIVER_TOTAL_LABEL_KEY)}
      className={className}
    />
  );
}

/* ----------------------------------------------------------------- TILE -- */

export interface DriverTileProps extends Omit<HBarTileProps, "children"> {
  /** Row order. Defaults to `magnitude` — see {@link DriverRank}. */
  rank?: DriverRank;
  /**
   * Show the derived total as a badge in the card's `action` slot.
   *
   * Off by default: a percentage breakdown has no meaningful total, so US-035
   * leaves it alone. An explicit `action` WINS over it — a caller that puts a
   * period filter in that slot is being deliberate — so the two are not
   * combined behind its back.
   */
  showTotal?: boolean;
  /**
   * How the BADGE's total becomes text, where that differs from the rows'.
   *
   * WHY THE ROWS' FORMATTER IS NOT ALWAYS THE BADGE'S (US-044). The rows are
   * bar labels and read as MAGNITUDES — `CHF 240k` of Marketing's overspend
   * went on paid social. The badge is a `DeltaChip`, and a `DeltaChip` is a
   * VARIANCE: `app/lib/format.ts` is explicit that variance is never carried by
   * colour alone, so the sign is written even when it is a plus. Where the rows
   * are already signed (US-035's badge trend) or negative (US-037's declines,
   * whose minus arrives with the amount) the rows' formatter is right for both
   * and this is left alone; where the rows are positive magnitudes of an
   * ADVERSE movement it is not, and US-039's `CHF 410k total` measured as the
   * one variance chip on the whole canvas with no sign in front of it.
   *
   * Defaults to `format`, so the badge and the bars still spell the currency
   * identically unless a caller deliberately signs one of them.
   */
  totalFormat?: (value: number) => string;
  /** The badge's trailing word. Defaults to {@link DRIVER_TOTAL_LABEL_KEY}. */
  totalLabel?: ReactNode;
  /** The badge's judgement, where the total's sign is not its meaning. */
  totalJudgement?: VarianceJudgement;
  /**
   * One muted line under the bars — Hero 2's attendance note.
   *
   * Not the card's `caption`, which is US-024's narrative strip behind the AI
   * glyph: this is a footnote on the data, and it wraps rather than truncating.
   */
  note?: ReactNode;
}

export function DriverTile({
  rows,
  rank,
  format,
  negative,
  showTotal = false,
  totalFormat,
  totalLabel,
  totalJudgement,
  note,
  action,
  ...tile
}: DriverTileProps) {
  const ranked = rankDrivers(rows, rank);

  // Derived from the RANKED rows — the same list the bars render — so the two
  // are read off one array and no re-derivation can drift between them.
  const badge = showTotal ? (
    <DriverTotalBadge
      total={driverTotal(ranked, negative)}
      format={totalFormat ?? format}
      judgement={totalJudgement}
      label={totalLabel}
    />
  ) : undefined;

  return (
    <HBarTile
      {...tile}
      rows={ranked}
      format={format}
      negative={negative}
      action={action ?? badge}
    >
      {note && (
        <p data-slot="driver-note" className="mt-4 text-caption text-muted">
          {note}
        </p>
      )}
    </HBarTile>
  );
}
