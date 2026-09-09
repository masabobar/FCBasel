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

import { type KitVariant, type PartnerRole, type PeriodKey } from "./enums";

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

/* ---------------------------------------------------------- HERO 1 DATA -- */

/**
 * Units sold of one kit variant in one period.
 *
 * Revenue is NOT here. It is units x the shirt price and is computed by
 * `kitRevenue` in `./derive.ts`, so a units figure and its revenue figure
 * cannot be edited into disagreement.
 */
export interface KitUnits {
  readonly variant: KitVariant;
  readonly label: string;
  readonly units: number;
}

/**
 * Shirts sold carrying one printed name.
 *
 * MERCHANDISING DATA, NOT PERFORMANCE DATA. These are print counts for public
 * figures - how many fans bought a shirt with that name on the back. No
 * appearance, goal, rating or salary figure belongs on this type, and adding
 * one would engage the named-individual guardrail that print counts do not.
 * "Custom" is a fan's own name and is a row like any other.
 */
export interface PrintedNameUnits {
  readonly name: string;
  readonly units: number;
}

/** One sponsor's fixed share of badge printing, in percent. */
export interface BadgeSponsorShare {
  readonly sponsor: string;
  readonly percent: number;
}

/**
 * One selectable period of the Hero 1 merchandising tile: kit units, the number
 * of shirts carrying a sponsor badge, and the top printed names.
 *
 * Everything a tile shows on top of these - total units, kit revenue, the home
 * share, the badge share, the per-sponsor badge segments - is DERIVED in
 * `./derive.ts`.
 */
export interface Hero1Period {
  readonly key: PeriodKey;
  readonly label: string;
  /** Kit units, in display order: Home, Away, 3rd. */
  readonly kits: readonly KitUnits[];
  /** Shirts carrying a sponsor badge. Split by `badgeSegments`. */
  readonly badgeTotal: number;
  /** Top printed names, ordered most-printed first. */
  readonly printedNames: readonly PrintedNameUnits[];
}

/** Movement in one sponsor's badge selection over the last three drops. */
export interface BadgeTrendEntry {
  readonly sponsor: string;
  /** Signed percentage movement. */
  readonly deltaPercent: number;
}

/** The Hero 1 tile as first shown. */
export interface Hero1Primary {
  /**
   * What the figures cover, stated on the tile. Hero scopes differ on purpose
   * (Hero 2 is per-fixture matchday revenue, Hero 3 is full-year departmental
   * totals) and an unlabelled tile reads as an arithmetic bug in the room.
   */
  readonly scopeLabel: string;
  readonly periods: readonly Hero1Period[];
  /** The fixed sponsor split behind `badgeTotal`. Percentages sum to 100. */
  readonly badgeSplit: readonly BadgeSponsorShare[];
  /** Hand-authored copy. Verbatim from the Reference Guide - never paraphrased. */
  readonly narrative: string;
}

/** The escalation shown when the user asks Hero 1 the follow-up question. */
export interface Hero1FollowUp {
  readonly trend: readonly BadgeTrendEntry[];
  readonly narrative: string;
}

/**
 * Hero 1 as ONE object. The primary view and its follow-up travel together
 * because the follow-up's narrative quotes the primary's figures - splitting
 * them lets the two drift apart.
 */
export interface Hero1 {
  readonly primary: Hero1Primary;
  readonly followUp: Hero1FollowUp;
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

/** Hero 1: season-to-date merchandising, plus its badge-trend follow-up. */
export interface Hero1Repository {
  /** The whole hero - primary and follow-up in one object. */
  hero(): Promise<Hero1>;
  /** Every selectable period, in display order. */
  periods(): Promise<Hero1Period[]>;
  /** One period, or `null` when the key is unknown. */
  period(key: PeriodKey): Promise<Hero1Period | null>;
}
