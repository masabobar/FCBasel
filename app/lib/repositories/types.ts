/**
 * Domain types and repository interfaces - the contract between the app and
 * wherever its data physically lives. See `./README.md` for the seam these
 * types exist to protect.
 *
 * Rules that shape everything below:
 *   - domain types, never storage shapes (the Reference Guide's parallel
 *     `["Home shirt", ...] / [1840, ...]` arrays become rows with names);
 *   - every repository method returns a `Promise`, so swapping the in-memory
 *     implementation for a database one is not a signature change;
 *   - numbers are numbers. No pre-formatted "CHF 148,200" strings live in the
 *     data - formatting is US-011's job and happens at render time.
 */

import { type PartnerRole, type PeriodKey } from "./enums";

/* ---------------------------------------------------------- PRIMITIVES -- */

/**
 * A current-versus-previous comparison over the same x-axis.
 *
 * INVARIANT: `labels`, `current` and `previous` always have equal length. A
 * chart reads all three in step, so a mismatch silently mis-plots the series
 * rather than failing. `tests/unit/baseline-dataset.test.ts` asserts it for
 * every period, including the date-derived ones.
 */
export interface ComparisonSeries {
  /** X-axis labels: week numbers, or short month names derived from today. */
  readonly labels: readonly string[];
  /** The period being shown. */
  readonly current: readonly number[];
  /** The equivalent earlier period, drawn dashed behind it. */
  readonly previous: readonly number[];
}

/** Home attendance for a period, against the stadium's usable capacity. */
export interface AttendanceSummary {
  readonly average: number;
  readonly previousAverage: number;
  /** Usable capacity, quoted in the UI as an approximation ("of ~38,000"). */
  readonly capacity: number;
  readonly matches: number;
}

/* -------------------------------------------------------- BASELINE DATA -- */

/**
 * One selectable period of the hero band: webshop revenue over time plus the
 * home-attendance summary for the same window. They travel together because
 * one segmented control drives both - splitting them lets the two drift.
 */
export interface BaselinePeriod {
  readonly key: PeriodKey;
  readonly label: string;
  /** Webshop revenue in CHF. Totals and deltas are DERIVED, never stored. */
  readonly webshop: ComparisonSeries;
  readonly attendance: AttendanceSummary;
}

/**
 * The most recent home fixture. Goals are stored separately from any display
 * string so the scoreline is rendered in exactly one place, in house style
 * (`FCB 2-1 Sion`, a plain hyphen).
 */
export interface HomeMatch {
  readonly opponent: string;
  readonly goalsFor: number;
  readonly goalsAgainst: number;
  readonly attendance: number;
  readonly capacity: number;
}

/** Units sold of one product in one period. */
export interface ProductUnits {
  readonly product: string;
  readonly units: number;
}

/** The top-products table for one period, already ordered best-selling first. */
export interface TopProductsPeriod {
  readonly key: PeriodKey;
  readonly label: string;
  readonly rows: readonly ProductUnits[];
}

/**
 * A commercial partner.
 *
 * `brandColor` is the PARTNER'S OWN BRAND COLOUR and is deliberately outside
 * the FCB token palette - see the note in `app/lib/mock/baseline.ts`. It is
 * typed as a plain hex string, not a `ColorToken`, precisely so it cannot be
 * mistaken for a design token.
 */
export interface Partner {
  readonly name: string;
  readonly role: PartnerRole;
  readonly roleLabel: string;
  readonly brandColor: string;
}

/* -------------------------------------------------------- REPOSITORIES -- */

/**
 * The four pre-existing dashboard tiles: webshop revenue, home attendance,
 * top products and active partners.
 */
export interface BaselineRepository {
  /** Every selectable period, in display order. */
  periods(): Promise<BaselinePeriod[]>;
  /** One period, or `null` when the key is unknown. */
  period(key: PeriodKey): Promise<BaselinePeriod | null>;
  /** The latest home fixture behind the attendance ring. */
  lastHomeMatch(): Promise<HomeMatch>;
  /** Top products for every period, in display order. */
  topProducts(): Promise<TopProductsPeriod[]>;
  /** Top products for one period, or `null` when the key is unknown. */
  topProductsFor(key: PeriodKey): Promise<TopProductsPeriod | null>;
  /** Active commercial partners. */
  partners(): Promise<Partner[]>;
}
