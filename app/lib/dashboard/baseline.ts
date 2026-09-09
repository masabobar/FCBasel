/**
 * The baseline dashboard's view model — what the four pre-existing tiles need,
 * read out of the US-007 repository and derived, once, here.
 *
 * WHY THIS MODULE EXISTS AT ALL
 * The persona "sees a dashboard that already looks lived-in — NOT an empty
 * canvas", so the four tiles are on screen before a single question is asked.
 * Their figures therefore have to be fetched, and the repository is
 * asynchronous by design (`../repositories/types.ts`: every method returns a
 * `Promise`, so the fixtures can be swapped for a database without a signature
 * change). That fetch belongs in the route's loader, which means the loader
 * needs exactly one function to call — this one.
 *
 * THE RULE THIS MODULE ENFORCES, AND THE ONE ACCEPTANCE CRITERION IT IS FOR:
 * **no figure is ever re-typed in a component.** Every number the baseline row
 * renders arrives in {@link BaselineData}, and every number in
 * {@link BaselineData} comes from the repository or from a pure function in
 * `../repositories/derive.ts`. `tests/unit/baseline-row.test.tsx` scans the
 * component sources and fails if any dataset figure appears as a literal in
 * them — including in this file.
 *
 * The webshop total and its delta are the clearest case: `seriesTotals`
 * computes both off the SAME array the sparkline draws, so the headline number
 * and the trend under it cannot disagree. Nothing stores them.
 *
 * It takes the repository as a PARAMETER rather than importing the selected
 * one: `../repositories/index.server.ts` is server-only, and a test needs to
 * pass a repository built on a fixed clock (two of the baseline periods label
 * their x-axis from today's date).
 */

import { PERIOD_LABEL, PeriodKey } from "../repositories/enums";
import { seriesTotals, trendEndingAt } from "../repositories/derive";
import {
  type BaselineRepository,
  type HomeMatch,
  type Partner,
  type TopProductsPeriod,
} from "../repositories/types";

/* ------------------------------------------------------------- PERIODS -- */

/**
 * The period the baseline row is fixed to.
 *
 * FIXED, not selectable. Top Products' own period filter is US-026's segmented
 * control arriving with US-016's hero band, which is what will drive this key;
 * until then the row shows the month the Build Specification pins its four
 * figures to, and the tile's `action` slot is deliberately left empty.
 */
export const BASELINE_PERIOD: PeriodKey = PeriodKey.THIS_MONTH;

/**
 * What "this month" is measured against.
 *
 * Named here so the webshop tile's `vs last month` line is derived rather than
 * written: `THIS_MONTH`'s comparison series IS `LAST_MONTH`'s current series by
 * construction in `../mock/baseline.ts`, so this constant and the `+11.9%` the
 * chip shows describe the same two arrays.
 */
export const BASELINE_COMPARISON_PERIOD: PeriodKey = PeriodKey.LAST_MONTH;

/**
 * The period the sparkline's window is taken from — the longest monthly series
 * the repository offers, so the glyph shows months rather than the four weeks
 * the headline figure covers.
 *
 * `trendEndingAt` then windows it so the line ENDS on the baseline month rather
 * than on wherever the year-to-date series happens to stop, which is a moving
 * target: it is sliced to the number of months elapsed in the calendar year.
 */
export const BASELINE_TREND_PERIOD: PeriodKey = PeriodKey.YEAR_TO_DATE;

/**
 * How many points the webshop sparkline draws. Six, per the Build
 * Specification. It is a GLYPH SIZE, not a figure: early in a calendar year
 * the year-to-date series is shorter than this and `trailingPoints` returns
 * what exists rather than inventing months (see `KpiSparkline`, which draws a
 * one-point series as a flat line).
 */
export const SPARKLINE_POINTS = 6;

/* ---------------------------------------------------------- WEBSHOP KPI -- */

/** The webshop tile's figures. Nothing here is stored; all of it is derived. */
export interface WebshopHeadline {
  /** `This month` — the period label from the dataset, never a literal. */
  readonly periodLabel: string;
  /** `Last month` — what the delta compares against. */
  readonly comparisonLabel: string;
  /** Revenue in CHF, the SUM of the period's current series. */
  readonly total: number;
  /** Movement on the comparison series, signed, to one decimal. */
  readonly deltaPercent: number;
  /** The trailing monthly points the sparkline draws, oldest first. */
  readonly trend: readonly number[];
}

/* --------------------------------------------------------------- MODEL -- */

/**
 * Everything the four baseline tiles render, in the order they render.
 *
 * It crosses the loader-to-component boundary, so it holds plain numbers and
 * strings only — no functions, no `Date`, nothing React Router cannot
 * serialise.
 */
export interface BaselineData {
  /** Tile 1 — Webshop revenue. */
  readonly webshop: WebshopHeadline;
  /** Tile 2 — Last home match. */
  readonly match: HomeMatch;
  /** Tile 3 — Top products, already ordered best-selling first. */
  readonly topProducts: TopProductsPeriod;
  /** Tile 4 — Active partners, in the order the dataset lists them. */
  readonly partners: readonly Partner[];
}

/**
 * Fails loudly rather than rendering a tile with a hole in it.
 *
 * A missing period means the dataset and {@link BASELINE_PERIOD} have drifted
 * apart, which `tests/unit/baseline-dataset.test.ts` would already have caught.
 * Defaulting to zero here would put a confident `CHF 0` on the projector
 * instead, which is the worse failure of the two.
 */
function required<T>(value: T | null, what: string): T {
  if (value === null) {
    throw new Error(`Baseline dataset is missing ${what}`);
  }
  return value;
}

/**
 * Read the baseline dashboard out of a repository.
 *
 * Every call is issued at once: the four tiles are independent and the
 * repository is asynchronous, so awaiting them in sequence would serialise a
 * fetch that has no ordering requirement.
 */
export async function loadBaseline(
  repository: BaselineRepository,
): Promise<BaselineData> {
  const [period, trendPeriod, match, topProducts, partners] = await Promise.all(
    [
      repository.period(BASELINE_PERIOD),
      repository.period(BASELINE_TREND_PERIOD),
      repository.lastHomeMatch(),
      repository.topProductsFor(BASELINE_PERIOD),
      repository.partners(),
    ],
  );

  const baselinePeriod = required(period, `period ${BASELINE_PERIOD}`);
  const totals = seriesTotals(baselinePeriod.webshop);

  return {
    webshop: {
      periodLabel: baselinePeriod.label,
      comparisonLabel: PERIOD_LABEL[BASELINE_COMPARISON_PERIOD],
      total: totals.current,
      deltaPercent: totals.deltaPercent,
      // Ends on the headline figure above, not on whatever the year-to-date
      // series happens to end on: the number and its own glyph cannot disagree.
      trend: trendEndingAt(
        required(trendPeriod, `period ${BASELINE_TREND_PERIOD}`).webshop
          .current,
        totals.current,
        SPARKLINE_POINTS,
      ),
    },
    match,
    topProducts: required(topProducts, `top products for ${BASELINE_PERIOD}`),
    partners,
  };
}
