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

import { type Clock, systemClock } from "../calendar";
import { personaGreeting } from "../persona";
import { PERIOD_LABEL, PeriodKey } from "../repositories/enums";
import { seriesTotals, trendEndingAt } from "../repositories/derive";
import {
  type BaselinePeriod,
  type BaselineRepository,
  type HomeMatch,
  type Partner,
  type TopProductsPeriod,
} from "../repositories/types";

/* ------------------------------------------------------------- PERIODS -- */

/**
 * The period every period-aware widget on the baseline dashboard STARTS on —
 * the hero band, and Top Products' own filter.
 *
 * It is the initial selection, not a fixed scope: US-016 mounted US-026's
 * segmented control in both places, so the band's chart and ring move together
 * off this key and Top Products moves independently off its own copy of it. The
 * month itself is the one the Build Specification pins its four figures to, so
 * the FIRST paint still shows exactly the Specification's dashboard.
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

/* ----------------------------------------------------------- HERO BAND -- */

/**
 * What the navy hero band renders (US-016).
 *
 * IT CARRIES THE PERIODS, NOT A SELECTED ONE. The band's segmented filter is
 * client state and drives BOTH the webshop chart and the attendance ring, so
 * every period has to be on the client already — a loader that resolved one
 * period would turn a filter press into a round trip, and the prototype makes
 * no request after load.
 *
 * NO TOTAL AND NO DELTA IS CARRIED EITHER. Both are `seriesTotals` off the very
 * array the chart plots, computed in the band at render time — which is the
 * acceptance criterion, and the reason there is no `total` field here to read
 * one from.
 */
export interface HeroBandData {
  /**
   * `Good morning, Sales & Marketing` — resolved from the loader's clock, so
   * the server and the browser cannot disagree about the hour.
   */
  readonly greeting: string;
  /** The selectable periods, in display order. Four in the seeded dataset. */
  readonly periods: readonly BaselinePeriod[];
}

/* --------------------------------------------------------------- MODEL -- */

/**
 * Everything the baseline dashboard renders — the hero band above, then the
 * four tiles, in the order they render.
 *
 * It crosses the loader-to-component boundary, so it holds plain numbers and
 * strings only — no functions, no `Date`, nothing React Router cannot
 * serialise.
 */
export interface BaselineData {
  /** The hero band above the row — the same periods, as a chart and a ring. */
  readonly band: HeroBandData;
  /** Tile 1 — Webshop revenue. */
  readonly webshop: WebshopHeadline;
  /** Tile 2 — Last home match. */
  readonly match: HomeMatch;
  /**
   * Tile 3 — Top products, EVERY period, in display order and each already
   * ordered best-selling first.
   *
   * All of them, for the same reason the band carries all of its: the tile's
   * `action` slot now holds a period filter (US-026), and recalculating its
   * five figures must not become a request.
   */
  readonly topProducts: readonly TopProductsPeriod[];
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
 * Every call is issued at once: the tiles are independent and the repository is
 * asynchronous, so awaiting them in sequence would serialise a fetch that has
 * no ordering requirement.
 *
 * The PERIOD LIST is read once and the two periods the webshop KPI needs are
 * found inside it, rather than fetched again beside it: the band and that tile
 * must be describing the same arrays, and one read makes that structural.
 *
 * The clock is a parameter for the same reason the fixtures take one — the
 * greeting is time-derived, and a test pins it rather than depending on the
 * hour the suite happens to run at.
 */
export async function loadBaseline(
  repository: BaselineRepository,
  clock: Clock = systemClock,
): Promise<BaselineData> {
  const [periods, match, topProducts, partners] = await Promise.all([
    repository.periods(),
    repository.lastHomeMatch(),
    repository.topProducts(),
    repository.partners(),
  ]);

  const period = (key: PeriodKey): BaselinePeriod =>
    required(periods.find((one) => one.key === key) ?? null, `period ${key}`);

  const baselinePeriod = period(BASELINE_PERIOD);
  const totals = seriesTotals(baselinePeriod.webshop);

  return {
    band: { greeting: personaGreeting(clock()), periods },
    webshop: {
      periodLabel: baselinePeriod.label,
      comparisonLabel: PERIOD_LABEL[BASELINE_COMPARISON_PERIOD],
      total: totals.current,
      deltaPercent: totals.deltaPercent,
      // Ends on the headline figure above, not on whatever the year-to-date
      // series happens to end on: the number and its own glyph cannot disagree.
      trend: trendEndingAt(
        period(BASELINE_TREND_PERIOD).webshop.current,
        totals.current,
        SPARKLINE_POINTS,
      ),
    },
    match,
    topProducts,
    partners,
  };
}
