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

import { DepartmentType, KitVariant, VarianceJudgement } from "./enums";
import {
  type AttendanceSummary,
  type BadgeSponsorShare,
  type ComparisonSeries,
  type ConversionGap,
  type Department,
  type FixtureRevenue,
  type Hero1Period,
  type HomeMatch,
  type KitUnits,
  type MonthlyRevenue,
  type SpendDriver,
} from "./types";

/** How the club is written in a scoreline. */
export const CLUB_SHORT_NAME = "FCB";

/**
 * The app's ONE rounding rule for a displayed percentage: one decimal.
 *
 * Exported so `app/lib/format.ts` can apply the SAME rule on the way to the
 * screen instead of restating it. A percentage that is rounded one way here and
 * another way in a formatter is the drift this whole module exists to prevent.
 */
export function oneDecimal(value: number): number {
  return Number(value.toFixed(1));
}

/** Percentage change, rounded to one decimal as the hero band displays it. */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) {
    return 0;
  }
  return oneDecimal(((current - previous) / previous) * 100);
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

/**
 * The trailing `count` values of a series, oldest first - the points a tile's
 * sparkline glyph draws.
 *
 * A sparkline is a WINDOW onto a series the tile does not otherwise show, so
 * the window is taken here rather than a second, shorter series being stored
 * beside the long one: two arrays that are supposed to end on the same figure
 * are two arrays that can disagree.
 *
 * A series shorter than `count` comes back whole rather than padded - a
 * three-month-old year has three points to draw and inventing three more would
 * be inventing data. `KpiSparkline` renders a one-point series as a flat line,
 * so the glyph degrades and never disappears.
 */
export function trailingPoints(
  values: readonly number[],
  count: number,
): number[] {
  if (count <= 0) {
    return [];
  }
  return values.slice(Math.max(values.length - count, 0));
}

/**
 * The sparkline window for a headline figure: the trailing `count` points of
 * `series`, ENDING ON the point that figure covers.
 *
 * WHY THE END IS FOUND RATHER THAN ASSUMED. A tile's headline number and the
 * glyph under it must agree - that is the rule this whole module exists for -
 * and `series` is a longer, coarser series than the one the headline sums. A
 * plain {@link trailingPoints} would end the glyph on whatever the longer
 * series happens to end on, which is the same figure only by coincidence of the
 * date the fixture is read on. Locating `total` inside the series instead makes
 * "the line ends where the number is" true by construction. The dataset
 * guarantees the point exists (`app/lib/mock/baseline.ts`: the recent monthly
 * points ARE the sums of the weekly series it also stores).
 *
 * A figure that is genuinely absent from the series - a period the coarser
 * series does not reach yet - falls back to the trailing points, so the glyph
 * degrades rather than disappearing.
 */
export function trendEndingAt(
  series: readonly number[],
  total: number,
  count: number,
): number[] {
  const end = series.lastIndexOf(total);
  return trailingPoints(end === -1 ? series : series.slice(0, end + 1), count);
}

/**
 * Occupancy as a fraction of capacity, 0 to 1 - the ONE place that division
 * happens.
 *
 * It takes two plain numbers rather than a domain object because the two
 * callers below hold different objects (a period's {@link AttendanceSummary}
 * and a single {@link HomeMatch}) and must not round the same ratio two ways.
 */
export function capacityShare(attendance: number, capacity: number): number {
  if (capacity === 0) {
    return 0;
  }
  return attendance / capacity;
}

/** Average attendance as a fraction of capacity, for the ring geometry. */
export function attendanceShare(attendance: AttendanceSummary): number {
  return capacityShare(attendance.average, attendance.capacity);
}

/** One fixture's attendance as a fraction of capacity - `28'900 of ~38'000`. */
export function matchCapacityShare(match: HomeMatch): number {
  return capacityShare(match.attendance, match.capacity);
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
 * One kit's share of the period's shirt units, 0 to 1.
 *
 * Hero 1's bar tooltip quotes units, share and revenue together, and the share
 * it quotes has to be the SAME arithmetic the narrative's "58% of shirt sales"
 * comes from - so there is one division, here, rather than a second one written
 * inline in the tooltip. {@link homeKitShare} is this function pinned to the
 * Home kit.
 */
export function kitUnitsShare(
  period: Hero1Period,
  variant: KitVariant,
): number {
  const total = kitUnitsTotal(period);
  if (total === 0) {
    return 0;
  }
  const kit = period.kits.find((one) => one.variant === variant);
  return (kit?.units ?? 0) / total;
}

/**
 * The Home kit's share of shirt units, 0 to 1. The tile shows it rounded, so
 * the exact 58.18% and the displayed 58% both come from this one number.
 */
export function homeKitShare(period: Hero1Period): number {
  return kitUnitsShare(period, KitVariant.HOME);
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

/* ------------------------------------------ HERO 3 DEPARTMENTAL BUDGETS -- */

/** Target attainment at which a department is exactly on target. */
export const ON_TARGET_PERCENT = 100;

/** Actual minus budget, signed, CHF thousands. Never stored. */
export function departmentVariance(department: Department): number {
  return department.actual - department.budget;
}

/** That variance as a percentage of budget, signed, to one decimal. */
export function departmentVariancePercent(department: Department): number {
  return percentChange(department.actual, department.budget);
}

/**
 * Whether a variance is GOOD NEWS or BAD NEWS.
 *
 * THIS IS THE POINT OF THE REVENUE / COST TAG. The sign of a variance does not
 * carry its meaning: Sponsoring's +840 is money earned, and Marketing's +410 is
 * an OVERSPEND. A tile that paints "variance > 0" green would show the Marketing
 * cost centre as a success and then sit directly above a follow-up that calls it
 * the club's one problem department.
 *
 * So the decision is made here, once, from the department's
 * {@link DepartmentType}, and travels as data on {@link DepartmentPerformance}.
 * No consumer is asked to work it out from the number.
 */
export function varianceJudgement(department: Department): VarianceJudgement {
  const variance = departmentVariance(department);
  if (variance === 0) {
    return VarianceJudgement.NEUTRAL;
  }
  const favourable =
    department.type === DepartmentType.REVENUE ? variance > 0 : variance < 0;
  return favourable ? VarianceJudgement.FAVOURABLE : VarianceJudgement.ADVERSE;
}

/**
 * A department row with everything a tile needs to draw it.
 *
 * `overBudget` is the plain arithmetic - the actual exceeded the budgeted line -
 * and is TRUE for four of the six departments, three of them happily. What it
 * MEANS is `judgement`. The two fields are separate on purpose: one is a fact,
 * the other is the reading of it.
 */
export interface DepartmentPerformance extends Department {
  /** Actual minus budget, signed, CHF thousands. */
  readonly variance: number;
  /** The same movement as a percentage of budget, signed, one decimal. */
  readonly variancePercent: number;
  /** Good news or bad, with the Revenue / Cost tag taken into account. */
  readonly judgement: VarianceJudgement;
  /** The actual came in above the budgeted line. A fact, not a verdict. */
  readonly overBudget: boolean;
  /** Attainment of its own outcome target fell short of 100%. */
  readonly behindTarget: boolean;
  /** BOTH of the above - the case the Marketing follow-up interrogates. */
  readonly needsAttention: boolean;
}

/** One department's derived row. */
export function departmentPerformance(
  department: Department,
): DepartmentPerformance {
  const overBudget = departmentVariance(department) > 0;
  const behindTarget = department.targetPercent < ON_TARGET_PERCENT;
  return {
    ...department,
    variance: departmentVariance(department),
    variancePercent: departmentVariancePercent(department),
    judgement: varianceJudgement(department),
    overBudget,
    behindTarget,
    needsAttention: overBudget && behindTarget,
  };
}

/** Every department's derived row, in the order the table lists them. */
export function departmentPerformanceRows(
  departments: readonly Department[],
): DepartmentPerformance[] {
  return departments.map(departmentPerformance);
}

/** The club-wide budget position under the department table. */
export interface DepartmentTotals {
  /** Sum of the budgets, CHF thousands. */
  readonly budget: number;
  /** Sum of the actuals, CHF thousands. */
  readonly actual: number;
  /** Actual minus budget, signed. */
  readonly variance: number;
  /** The same movement as a percentage of budget, signed, one decimal. */
  readonly variancePercent: number;
}

/**
 * Totals for the department table. The ONLY way to obtain the 69,000 / 69,680 /
 * +680 headline - the Reference Guide stores `totalBudget` and `totalActual`,
 * and neither is ported, so the footer row cannot outlive an edit to the rows.
 *
 * These are ARITHMETIC ACROSS MIXED SIGNS: five revenue departments and one cost
 * centre. The club-level `variancePercent` is therefore a movement against the
 * total budgeted position, not a profit figure, and is never a judgement -
 * judgement lives per department, where the Revenue / Cost tag is.
 */
export function departmentTotals(
  departments: readonly Department[],
): DepartmentTotals {
  const budget = sum(departments.map((department) => department.budget));
  const actual = sum(departments.map((department) => department.actual));
  return {
    budget,
    actual,
    variance: actual - budget,
    variancePercent: percentChange(actual, budget),
  };
}

/**
 * The departments that are both over budget AND behind target, in table order.
 *
 * Derived rather than carried as a stored `flag`, so the follow-up's subject is
 * always whatever the figures say it is. On the seeded data that is exactly one
 * department: Marketing & Communications.
 */
export function departmentsNeedingAttention(
  departments: readonly Department[],
): DepartmentPerformance[] {
  return departmentPerformanceRows(departments).filter(
    (department) => department.needsAttention,
  );
}

/**
 * The departments that HIT OR BEAT their own outcome target, in table order.
 *
 * Hero 3's overall tile states an "above target" count, and it is the LENGTH of
 * this list rather than a figure of its own: the test is `!behindTarget`, the
 * same fact the table's rows read, so the count can never claim a department
 * the row above it shows as short. On the seeded data it is THREE of six -
 * Sponsoring 104, Ticketing 102 and Events 105. Hospitality's 95 and
 * Merchandising's 92 are behind target however close they look, which is the
 * distinction the table's gold near-target band draws in the other direction.
 */
export function departmentsOnTarget(
  departments: readonly Department[],
): DepartmentPerformance[] {
  return departmentPerformanceRows(departments).filter(
    (department) => !department.behindTarget,
  );
}

/** Total overspend across the named drivers - the follow-up's badge. */
export function driverTotal(drivers: readonly SpendDriver[]): number {
  return sum(drivers.map((driver) => driver.amount));
}

/** How far webshop conversion fell short of plan, three ways. */
export interface ConversionShortfall {
  /** Achieved as a percentage of plan, one decimal: 84.6 for 2.2 against 2.6. */
  readonly attainmentPercent: number;
  /** Achieved minus planned, in PERCENTAGE POINTS, one decimal: -0.4. */
  readonly gapPoints: number;
  /** The relative shortfall, one decimal: -15.4%. */
  readonly changePercent: number;
}

/**
 * The conversion gap behind Marketing's paid-social overspend.
 *
 * Percentage POINTS and percentage CHANGE are different numbers (-0.4 and
 * -15.4) and both get quoted about conversion figures, so they are named apart
 * here rather than left for a component to compute one and label it the other.
 */
export function conversionShortfall(gap: ConversionGap): ConversionShortfall {
  return {
    attainmentPercent:
      gap.planPercent === 0
        ? 0
        : oneDecimal((gap.actualPercent / gap.planPercent) * 100),
    gapPoints: oneDecimal(gap.actualPercent - gap.planPercent),
    changePercent: percentChange(gap.actualPercent, gap.planPercent),
  };
}
