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

import {
  type DepartmentType,
  type KitVariant,
  type MonthKey,
  type PartnerRole,
  type PeriodKey,
  type SeasonKey,
} from "./enums";

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

/* ---------------------------------------------------------- HERO 2 DATA -- */

/**
 * A season, named once so a legend, an axis and a narrative cannot disagree
 * about which year is which.
 */
export interface SeasonRef {
  readonly key: SeasonKey;
  readonly label: string;
}

/**
 * Matchday ticket revenue for one home fixture across the two seasons, in CHF
 * THOUSANDS (1,610 is CHF 1.61M). Formatting is US-011's job.
 *
 * The opponent is a CLUB, never a person - the same field the baseline's
 * `HomeMatch` uses. Neither the year-on-year change nor any total is stored:
 * both come from `./derive.ts`, so a fixture edit moves the headline with it.
 */
export interface FixtureRevenue {
  readonly opponent: string;
  /** Season 25/26, drawn as the comparison bar. */
  readonly previous: number;
  /** Season 26/27, drawn as the current bar. */
  readonly current: number;
}

/** Ticket revenue for one month of the season, in CHF thousands. */
export interface MonthlyRevenue {
  readonly month: MonthKey;
  /** Short axis label, e.g. `"Jul"`. */
  readonly label: string;
  readonly previous: number;
  readonly current: number;
}

/**
 * The eight highest-grossing home fixtures, with the scope they cover.
 *
 * `scopeLabel` is DATA, not decoration. Hero 2's two charts are deliberately at
 * DIFFERENT scopes - this one is eight fixtures, the monthly one is every home
 * fixture - so summing the monthly series and comparing it to this total gives
 * a larger number ON PURPOSE. Unlabelled, that reads as an arithmetic bug to
 * anyone checking the figures in the room.
 */
export interface FixtureRevenueSeries {
  readonly scopeLabel: string;
  readonly fixtures: readonly FixtureRevenue[];
}

/** The twelve-month view, July to June, and the scope it covers. */
export interface MonthlyRevenueSeries {
  readonly scopeLabel: string;
  readonly months: readonly MonthlyRevenue[];
}

/** The Hero 2 tile as first shown: ticket revenue, this season against last. */
export interface Hero2Primary {
  /** Season 25/26 - the comparison year. */
  readonly previousSeason: SeasonRef;
  /** Season 26/27 - the year the headline figure describes. */
  readonly currentSeason: SeasonRef;
  readonly fixtures: FixtureRevenueSeries;
  readonly monthly: MonthlyRevenueSeries;
  /** Hand-authored copy. Verbatim from the Reference Guide - never paraphrased. */
  readonly narrative: string;
}

/**
 * The escalation shown when the user asks Hero 2 which fixtures drive the drop.
 *
 * It carries a narrative and NOTHING ELSE: the four declining fixtures and the
 * `-CHF 400k total` badge above them are derived from the primary's fixtures by
 * `fixtureDeclines` / `declineTotal`, so a fixture edit can never leave the
 * follow-up quoting a decline the chart no longer shows.
 */
export interface Hero2FollowUp {
  readonly narrative: string;
}

/** Hero 2 as ONE object - see {@link Hero1} for why the two travel together. */
export interface Hero2 {
  readonly primary: Hero2Primary;
  readonly followUp: Hero2FollowUp;
}

/* ---------------------------------------------------------- HERO 3 DATA -- */

/**
 * One department's full-year budget position, in CHF THOUSANDS (21,000 is
 * CHF 21M). Formatting is US-011's job.
 *
 * A DEPARTMENT, NEVER A PERSON. This is the dataset closest to the
 * named-individual guardrail and it stays firmly on the aggregate side of it:
 * no salary, no headcount attributed to anyone, no individual target
 * attainment. Adding any of those would cross the line these rows do not.
 *
 * WHAT IS STORED HERE AND WHAT IS NOT:
 *   - `budget`, `actual` and `targetPercent` are MEASUREMENTS - each carries
 *     information nothing else holds. `targetPercent` in particular is not
 *     `actual / budget`: Marketing sits at 84% of an OUTCOME target while
 *     spending 12% above its budget, so the two are independent facts.
 *   - the variance, its percentage and whether it is good or bad news are
 *     DERIVED in `./derive.ts` (`departmentPerformance`) and never stored.
 */
export interface Department {
  readonly name: string;
  /** Earns money or spends it - see {@link DepartmentType}. */
  readonly type: DepartmentType;
  readonly typeLabel: string;
  /** Full-year budget, CHF thousands. */
  readonly budget: number;
  /** Full-year actual, CHF thousands. */
  readonly actual: number;
  /**
   * Attainment of the department's own outcome target, in percent. 100 is on
   * target; below 100 is behind. INDEPENDENT of the budget figures above.
   */
  readonly targetPercent: number;
}

/** One component of Marketing's overspend, CHF thousands. */
export interface SpendDriver {
  readonly name: string;
  /** Amount above plan, CHF thousands. */
  readonly amount: number;
}

/**
 * Webshop conversion, achieved against planned, in percent.
 *
 * The percentages are the measurements; the shortfall between them and the
 * attainment they represent are derived (`conversionShortfall`).
 */
export interface ConversionGap {
  readonly actualPercent: number;
  readonly planPercent: number;
}

/** The Hero 3 tile as first shown: every department, budget against actual. */
export interface Hero3Primary {
  /**
   * What the figures cover, stated on the tile. THIS ONE MATTERS: Hero 3 is
   * full-year departmental totals and its Ticketing figure INCLUDES the
   * season-ticket base, so it legitimately exceeds the sum of Hero 2's eight
   * shown fixtures. Intended, not inconsistent - but only if the tile says so.
   */
  readonly scopeLabel: string;
  /** The six departments, in the order the table lists them. */
  readonly departments: readonly Department[];
  /**
   * The club-wide blended attainment of the departmental outcome targets, in
   * percent.
   *
   * STORED BECAUSE IT IS A MEASUREMENT, NOT A SUM. Unlike the budget and actual
   * totals - which are derived and must always equal the rows above them - this
   * is a Finance-supplied club-level figure that no arithmetic over the six
   * rows reproduces (their plain mean is 97.0, their budget-weighted mean 99.7).
   * It sits beside `targetPercent` as the same kind of fact, one level up.
   */
  readonly blendedTargetPercent: number;
  /** Hand-authored copy. Verbatim from the Reference Guide - never paraphrased. */
  readonly narrative: string;
}

/**
 * The escalation shown when the user asks why Marketing is over budget AND
 * behind target.
 *
 * WHICH department that is stays derived (`departmentsNeedingAttention`), so
 * the follow-up cannot end up interrogating a department the table no longer
 * flags.
 */
export interface Hero3FollowUp {
  /** Where the overspend went. Sums to Marketing's variance. */
  readonly drivers: readonly SpendDriver[];
  /** The webshop conversion the paid-social spend was chasing. */
  readonly conversion: ConversionGap;
  readonly narrative: string;
}

/** Hero 3 as ONE object - see {@link Hero1} for why the two travel together. */
export interface Hero3 {
  readonly primary: Hero3Primary;
  readonly followUp: Hero3FollowUp;
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

/** Hero 2: matchday ticket revenue year on year, plus the decline follow-up. */
export interface Hero2Repository {
  /** The whole hero - primary and follow-up in one object. */
  hero(): Promise<Hero2>;
  /** The eight fixtures, in the order the grouped bar chart draws them. */
  fixtures(): Promise<FixtureRevenue[]>;
  /** One fixture by opponent, or `null` when the opponent is not shown. */
  fixture(opponent: string): Promise<FixtureRevenue | null>;
  /** The twelve months of the season, July first. */
  monthly(): Promise<MonthlyRevenue[]>;
}

/**
 * Hero 3: full-year departmental performance, plus the Marketing follow-up.
 *
 * The interface returns MEASUREMENTS only. Variances, totals, the good/bad
 * judgement and which department needs attention all come from `./derive.ts` -
 * there is deliberately no `totals()` method to read a stored figure from.
 */
export interface Hero3Repository {
  /** The whole hero - primary and follow-up in one object. */
  hero(): Promise<Hero3>;
  /** The six departments, in the order the table lists them. */
  departments(): Promise<Department[]>;
  /** One department by name, or `null` when the name is not shown. */
  department(name: string): Promise<Department | null>;
}
