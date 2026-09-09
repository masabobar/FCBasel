/**
 * Calendar helpers for date-derived chart labels.
 *
 * Two of the baseline periods ("Last 3 months" and "Year to date") take their
 * x-axis labels from the CURRENT DATE rather than from a hardcoded list, so a
 * demo given in November does not still say "Jul Aug Sep". The Reference
 * Implementation Guide does this with `new Date()` read inline; here the date
 * arrives through an injectable {@link Clock} instead, so tests pin a fixed
 * "now" and never depend on the wall clock.
 *
 * Nothing here touches the network or a timezone database beyond the platform
 * `Intl` data: the prototype must run with the network disconnected.
 */

/** A source of the current time. Injected so date-derived output is testable. */
export type Clock = () => Date;

/** The default clock. Production code uses this; tests pass their own. */
export const systemClock: Clock = () => new Date();

/**
 * Labels are English-only by project decision (no i18n in this prototype), so
 * the locale is pinned rather than read from the environment - otherwise the
 * same build would render "Sep" for one viewer and "Sept." for another.
 */
const LABEL_LOCALE = "en";

/** Short month name `monthsBack` months before `now`, e.g. `"Sep"`. */
export function monthLabel(now: Date, monthsBack: number): string {
  const month = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  return month.toLocaleString(LABEL_LOCALE, { month: "short" });
}

/**
 * The last `count` short month names, oldest first, ending with the month of
 * `now`. `recentMonthLabels(new Date(2026, 8, 9), 3)` is `["Jul", "Aug", "Sep"]`.
 */
export function recentMonthLabels(now: Date, count: number): string[] {
  return Array.from({ length: Math.max(count, 0) }, (_unused, index) =>
    monthLabel(now, count - 1 - index),
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
