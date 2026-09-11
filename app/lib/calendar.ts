/**
 * Calendar helpers for date-derived chart axes.
 *
 * Two of the baseline periods ("Last 3 months" and "Year to date") take their
 * x-axis from the CURRENT DATE rather than from a hardcoded list, so a demo
 * given in November does not still say "Jul Aug Sep". The Reference
 * Implementation Guide does this with `new Date()` read inline; here the date
 * arrives through an injectable {@link Clock} instead, so tests pin a fixed
 * "now" and never depend on the wall clock.
 *
 * IT RETURNS KEYS, NOT MONTH NAMES (US-049). This module used to call
 * `toLocaleString` with the locale pinned to `"en"`, which was correct while
 * the product was English-only and became wrong the moment it was not: the
 * axis is built in the route's LOADER, on the server, and the language is
 * client state the server cannot know. So the rolling window is returned as
 * {@link MonthKey} values and the band resolves them with its own `t` -
 * `MONTH_LABEL_KEY` in `./repositories/enums.ts` is the one place a month is
 * named, for the seeded season axis and this rolling one alike.
 *
 * Nothing here touches the network, the platform `Intl` data or a timezone
 * database: the prototype must run with the network disconnected.
 */

import { MONTH_KEYS, type MonthKey } from "./repositories/enums";

/** A source of the current time. Injected so date-derived output is testable. */
export type Clock = () => Date;

/** The default clock. Production code uses this; tests pass their own. */
export const systemClock: Clock = () => new Date();

/** The month `monthsBack` months before `now`, as a key. */
export function monthKeyAt(now: Date, monthsBack: number): MonthKey {
  const month = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  // `MONTH_KEYS` is in calendar order, so `getMonth()` indexes it directly.
  // The index is always 0-11, so the non-null assertion cannot fire.
  return MONTH_KEYS[month.getMonth()]!;
}

/**
 * The last `count` months, oldest first, ending with the month of `now`.
 * `recentMonthKeys(new Date(2026, 8, 9), 3)` is `[JULY, AUGUST, SEPTEMBER]`.
 */
export function recentMonthKeys(now: Date, count: number): MonthKey[] {
  return Array.from({ length: Math.max(count, 0) }, (_unused, index) =>
    monthKeyAt(now, count - 1 - index),
  );
}

/**
 * How many months of the current calendar year have started, 1 in January
 * through 12 in December. Year-to-date series are sliced to this length so the
 * chart never shows months that have not happened yet.
 */
export function monthsElapsedThisYear(now: Date): number {
  return now.getMonth() + 1;
}
