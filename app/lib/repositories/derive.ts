/**
 * Derived figures - the values a tile shows that are NOT stored anywhere.
 *
 * The Reference Implementation Guide is explicit that the headline webshop
 * number must always agree with the chart beneath it. The only way to
 * guarantee that is to never store the number: the total and its delta are
 * computed from the same series the chart plots, here, once.
 *
 * These are pure functions over domain types, safe to import from a component
 * as well as from a loader. They deliberately live beside the repository
 * interfaces rather than in `app/lib/mock/`, because they describe the DOMAIN
 * and stay correct when the fixtures are replaced by a database.
 */

import {
  type AttendanceSummary,
  type ComparisonSeries,
  type HomeMatch,
} from "./types";

/** How the club is written in a scoreline. */
export const CLUB_SHORT_NAME = "FCB";

/** Percentage change, rounded to one decimal as the hero band displays it. */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** The headline number under a comparison chart, and how it moved. */
export interface SeriesTotals {
  /** Sum of the current series - the figure shown as the headline KPI. */
  readonly current: number;
  /** Sum of the comparison series. */
  readonly previous: number;
  /** Absolute movement, signed. */
  readonly delta: number;
  /** Movement as a percentage, signed, to one decimal. */
  readonly deltaPercent: number;
}

/**
 * Totals for a comparison series. This is the ONLY way a tile may obtain the
 * webshop headline figure - reading a stored total would let the number and
 * its own chart disagree.
 */
export function seriesTotals(series: ComparisonSeries): SeriesTotals {
  const current = sum(series.current);
  const previous = sum(series.previous);
  return {
    current,
    previous,
    delta: current - previous,
    deltaPercent: percentChange(current, previous),
  };
}

/** Attendance as a fraction of capacity, 0 to 1, for the ring geometry. */
export function attendanceShare(attendance: AttendanceSummary): number {
  if (attendance.capacity === 0) {
    return 0;
  }
  return attendance.average / attendance.capacity;
}

/** Movement in average attendance against the comparison period. */
export function attendanceChangePercent(attendance: AttendanceSummary): number {
  return percentChange(attendance.average, attendance.previousAverage);
}

/**
 * `FCB 2-1 Sion`. House style is a plain hyphen: no en dash, no spaces around
 * it. Rendered here so no component ever assembles a scoreline by hand.
 */
export function scoreline(match: HomeMatch): string {
  return `${CLUB_SHORT_NAME} ${match.goalsFor}-${match.goalsAgainst} ${match.opponent}`;
}
