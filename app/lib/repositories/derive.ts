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

import { KitVariant } from "./enums";
import {
  type AttendanceSummary,
  type BadgeSponsorShare,
  type ComparisonSeries,
  type FixtureRevenue,
  type Hero1Period,
  type HomeMatch,
  type KitUnits,
  type MonthlyRevenue,
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

/* ------------------------------------------------ HERO 1 MERCHANDISING -- */

/** Retail price of a shirt, in CHF. Every kit revenue figure derives from it. */
export const SHIRT_PRICE_CHF = 99;

/** Total shirts sold across the three kits in a period. */
export function kitUnitsTotal(period: Hero1Period): number {
  return sum(period.kits.map((kit) => kit.units));
}

/** Gross revenue in CHF for a number of shirts. Never stored. */
export function kitRevenue(units: number): number {
  return units * SHIRT_PRICE_CHF;
}

/** One kit's units alongside the revenue they represent. */
export interface KitRevenueRow extends KitUnits {
  readonly revenue: number;
}

/** Per-kit revenue, in the same order the fixture lists the kits. */
export function kitRevenueRows(period: Hero1Period): KitRevenueRow[] {
  return period.kits.map((kit) => ({ ...kit, revenue: kitRevenue(kit.units) }));
}

/** Gross revenue in CHF across all three kits. */
export function kitRevenueTotal(period: Hero1Period): number {
  return kitRevenue(kitUnitsTotal(period));
}

/**
 * The Home kit's share of shirt units, 0 to 1. The tile shows it rounded, so
 * the exact 58.18% and the displayed 58% both come from this one number.
 */
export function homeKitShare(period: Hero1Period): number {
  const total = kitUnitsTotal(period);
  if (total === 0) {
    return 0;
  }
  const home = period.kits.find((kit) => kit.variant === KitVariant.HOME);
  return (home?.units ?? 0) / total;
}

/** Share of shirts carrying a sponsor badge, 0 to 1. */
export function badgeShare(period: Hero1Period): number {
  const total = kitUnitsTotal(period);
  if (total === 0) {
    return 0;
  }
  return period.badgeTotal / total;
}

/** One sponsor's slice of the badge total, in shirts. */
export interface BadgeSegment extends BadgeSponsorShare {
  readonly value: number;
}

/**
 * Splits a badge total across its sponsors by their fixed percentages.
 *
 * ROUNDING IS CORRECTED, DELIBERATELY. Rounding each percentage independently
 * loses or gains a shirt or two (3,080 at 44/24/20/12 rounds to 1,355 + 739 +
 * 616 + 370 = 3,080, but 7 rounds to 3 + 2 + 1 + 1 = 7 only by luck, and 1
 * rounds to 0 + 0 + 0 + 0). A donut whose segments do not sum to the number
 * printed in the middle of it is the kind of detail this audience checks, so
 * the remainder is added back to the FIRST segment - the largest share, where
 * a shirt either way is invisible.
 *
 * The split is a parameter rather than a constant here because `derive.ts`
 * describes the domain and must stay correct when the fixtures are replaced by
 * a database: the sponsors and their percentages are data.
 */
export function badgeSegments(
  total: number,
  split: readonly BadgeSponsorShare[],
): BadgeSegment[] {
  const segments = split.map((share) => ({
    ...share,
    value: Math.round((total * share.percent) / 100),
  }));
  const first = segments[0];
  if (first !== undefined) {
    first.value += total - sum(segments.map((segment) => segment.value));
  }
  return segments;
}

/* ---------------------------------------------------- HERO 2 TICKETING -- */

/** A row of anything compared across the two seasons. */
interface YearOnYearRow {
  readonly previous: number;
  readonly current: number;
}

/**
 * Turns year-on-year rows into the chart primitive the baseline band already
 * uses, so BOTH of Hero 2's charts and every total under them go through one
 * `seriesTotals` and therefore one rounding rule.
 */
function yearOnYear<T extends YearOnYearRow>(
  rows: readonly T[],
  label: (row: T) => string,
): ComparisonSeries {
  return {
    labels: rows.map(label),
    current: rows.map((row) => row.current),
    previous: rows.map((row) => row.previous),
  };
}

/** The fixture chart: one grouped bar per opponent. */
export function fixtureSeries(
  fixtures: readonly FixtureRevenue[],
): ComparisonSeries {
  return yearOnYear(fixtures, (fixture) => fixture.opponent);
}

/**
 * Ticket revenue across the shown fixtures, both seasons, and how it moved.
 * The tile's headline `-0.6%` is THIS value - never a stored `deltaPct`.
 */
export function fixtureTotals(
  fixtures: readonly FixtureRevenue[],
): SeriesTotals {
  return seriesTotals(fixtureSeries(fixtures));
}

/** The monthly chart: one point per month, July to June. */
export function monthlySeries(
  months: readonly MonthlyRevenue[],
): ComparisonSeries {
  return yearOnYear(months, (month) => month.label);
}

/**
 * Ticket revenue across every month of the two seasons.
 *
 * This total is LARGER than {@link fixtureTotals} by design: the monthly series
 * covers all home fixtures while the fixture chart shows only the eight
 * highest-grossing. Each series states that in its own `scopeLabel`.
 */
export function monthlyTotals(months: readonly MonthlyRevenue[]): SeriesTotals {
  return seriesTotals(monthlySeries(months));
}

/** One fixture's year-on-year loss, as a POSITIVE amount of CHF thousands. */
export interface FixtureDecline {
  readonly opponent: string;
  readonly drop: number;
}

/**
 * The fixtures that lost revenue year on year, biggest loss first.
 *
 * Derived rather than stored: the follow-up tile lists FCZ, Lugano, Luzern and
 * Sion because those four are the fixtures that fell, not because a second list
 * repeats them. Equal drops keep fixture order - `Array.prototype.sort` is
 * stable - so Luzern precedes Sion, as the Reference Guide shows them.
 */
export function fixtureDeclines(
  fixtures: readonly FixtureRevenue[],
): FixtureDecline[] {
  return fixtures
    .filter((fixture) => fixture.current < fixture.previous)
    .map((fixture) => ({
      opponent: fixture.opponent,
      drop: fixture.previous - fixture.current,
    }))
    .sort((left, right) => right.drop - left.drop);
}

/** Total revenue lost across the declining fixtures - the tile's badge. */
export function declineTotal(fixtures: readonly FixtureRevenue[]): number {
  return sum(fixtureDeclines(fixtures).map((decline) => decline.drop));
}
