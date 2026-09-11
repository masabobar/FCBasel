/**
 * Baseline dataset (US-007) - the four tiles that make the dashboard read as a
 * tool already in use: webshop revenue, home attendance, top products and
 * active partners.
 *
 * SOURCE OF TRUTH
 * Figures come from the Reference Implementation Guide's prototype
 * (`HERO_PERIODS`, `TP_PRODUCTS`, `TP_PERIODS`, `PARTNERS`), which
 * `.project-management/input/scope.md` §10 makes definitive for the intended
 * experience. The Build Specification pins four of them, and those four are
 * asserted in `tests/unit/baseline-dataset.test.ts`:
 *   webshop this month CHF 148,200 at +12% on last month;
 *   last home match FCB 2-1 Sion, 28,900 of ~38,000;
 *   this month's top-product units;
 *   6 active partners.
 *
 * HOUSE RULES OBSERVED HERE
 *   - Every figure is a plain number. Nothing is pre-formatted as "CHF 148,200"
 *     - formatting lands in US-011 and happens at render time.
 *   - A figure used twice is written once and referenced. Last month's current
 *     series IS this month's comparison series; the monthly year-to-date points
 *     for the last three months ARE the sums of the weekly series.
 *   - Totals and deltas are never stored. They come from `seriesTotals` in
 *     `../repositories/derive.ts`, computed off the same arrays the chart plots.
 *   - Static and local: no fetch, no database, no environment variable. The
 *     prototype runs with the network disconnected.
 *   - No salary and no named-individual performance data appears in this file.
 */

import { type TranslationKey } from "../i18n";
import {
  type Clock,
  monthsElapsedThisYear,
  recentMonthKeys,
  systemClock,
} from "../calendar";
import {
  MONTH_LABEL_KEY,
  PARTNER_ROLE_LABEL_KEY,
  PERIOD_LABEL_KEY,
  PartnerRole,
  PeriodKey,
  ProductKey,
  WEEK_KEYS,
  WEEK_LABEL_KEY,
} from "../repositories/enums";
import {
  type BaselinePeriod,
  type BaselineRepository,
  type HomeMatch,
  type Partner,
  type TopProductsPeriod,
} from "../repositories/types";

/* ------------------------------------------------ WEBSHOP AND ATTENDANCE -- */

/**
 * The periods this dataset covers, in display order. `PeriodKey` is the shared
 * enum across every tile and carries keys other datasets need (Hero 1 adds
 * `SEASON_TO_DATE`); the baseline band offers these four, so it names them
 * rather than iterating the whole enum and inventing figures for the rest.
 */
const BASELINE_PERIOD_KEYS = [
  PeriodKey.THIS_MONTH,
  PeriodKey.LAST_MONTH,
  PeriodKey.LAST_3_MONTHS,
  PeriodKey.YEAR_TO_DATE,
] as const;

type BaselinePeriodKey = (typeof BASELINE_PERIOD_KEYS)[number];

/** St. Jakob-Park usable capacity, quoted in the UI as "~38,000". */
const HOME_CAPACITY = 38_000;

/** Weekly x-axis for the two single-month periods, as translation keys. */
const WEEK_LABEL_KEYS: readonly TranslationKey[] = WEEK_KEYS.map(
  (week) => WEEK_LABEL_KEY[week],
);

/** The rolling month axis, as translation keys - see `../calendar.ts`. */
function recentMonthLabelKeys(now: Date, count: number): TranslationKey[] {
  return recentMonthKeys(now, count).map((month) => MONTH_LABEL_KEY[month]);
}

/** Webshop revenue in CHF, by week. Written once, referenced twice. */
const THIS_MONTH_WEEKLY = [38_200, 41_600, 33_900, 34_500];
const LAST_MONTH_WEEKLY = [34_100, 37_800, 30_200, 30_300];
const MONTH_BEFORE_LAST_WEEKLY = [33_200, 35_100, 29_800, 30_800];

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * Webshop revenue in CHF by calendar month, January first, for the current and
 * prior season. The three most recent entries are the SUMS of the weekly series
 * above rather than repeated literals, so a weekly figure can never be edited
 * into disagreement with the monthly chart that contains it.
 */
const MONTHLY_CURRENT = [
  112_000,
  116_500,
  121_000,
  118_000,
  120_500,
  124_000,
  sum(MONTH_BEFORE_LAST_WEEKLY),
  sum(LAST_MONTH_WEEKLY),
  sum(THIS_MONTH_WEEKLY),
  141_000,
  137_000,
  150_000,
];
const MONTHLY_PREVIOUS = [
  104_000, 108_500, 112_000, 110_500, 112_000, 116_500, 119_000, 121_500,
  126_800, 129_000, 125_000, 138_000,
];

/** The window "Last 3 months" covers within the seeded twelve-month series. */
const QUARTER_START_MONTH = 6;
const QUARTER_END_MONTH = 9;

/**
 * Average home attendance. `THIS_MONTH`'s comparison figure is `LAST_MONTH`'s
 * average by construction, the same chaining the revenue series uses.
 */
const ATTENDANCE_THIS_MONTH = 28_900;
const ATTENDANCE_LAST_MONTH = 27_500;
const ATTENDANCE_MONTH_BEFORE_LAST = 26_800;

/**
 * Periods are built per call rather than frozen at module load: two of them
 * take their x-axis labels from the current date, and a long-running server
 * process would otherwise still be labelling months from whenever it booted.
 */
function buildPeriods(now: Date): BaselinePeriod[] {
  const monthsSoFar = monthsElapsedThisYear(now);

  return [
    {
      key: PeriodKey.THIS_MONTH,
      labelKey: PERIOD_LABEL_KEY[PeriodKey.THIS_MONTH],
      webshop: {
        labelKeys: WEEK_LABEL_KEYS,
        current: THIS_MONTH_WEEKLY,
        previous: LAST_MONTH_WEEKLY,
      },
      attendance: {
        average: ATTENDANCE_THIS_MONTH,
        previousAverage: ATTENDANCE_LAST_MONTH,
        capacity: HOME_CAPACITY,
        matches: 2,
      },
    },
    {
      key: PeriodKey.LAST_MONTH,
      labelKey: PERIOD_LABEL_KEY[PeriodKey.LAST_MONTH],
      webshop: {
        labelKeys: WEEK_LABEL_KEYS,
        current: LAST_MONTH_WEEKLY,
        previous: MONTH_BEFORE_LAST_WEEKLY,
      },
      attendance: {
        average: ATTENDANCE_LAST_MONTH,
        previousAverage: ATTENDANCE_MONTH_BEFORE_LAST,
        capacity: HOME_CAPACITY,
        matches: 2,
      },
    },
    {
      key: PeriodKey.LAST_3_MONTHS,
      labelKey: PERIOD_LABEL_KEY[PeriodKey.LAST_3_MONTHS],
      webshop: {
        labelKeys: recentMonthLabelKeys(
          now,
          QUARTER_END_MONTH - QUARTER_START_MONTH,
        ),
        current: MONTHLY_CURRENT.slice(QUARTER_START_MONTH, QUARTER_END_MONTH),
        previous: MONTHLY_PREVIOUS.slice(
          QUARTER_START_MONTH,
          QUARTER_END_MONTH,
        ),
      },
      attendance: {
        average: 26_900,
        previousAverage: 25_900,
        capacity: HOME_CAPACITY,
        matches: 6,
      },
    },
    {
      key: PeriodKey.YEAR_TO_DATE,
      labelKey: PERIOD_LABEL_KEY[PeriodKey.YEAR_TO_DATE],
      webshop: {
        labelKeys: recentMonthLabelKeys(now, monthsSoFar),
        current: MONTHLY_CURRENT.slice(0, monthsSoFar),
        previous: MONTHLY_PREVIOUS.slice(0, monthsSoFar),
      },
      attendance: {
        average: 26_400,
        previousAverage: 25_600,
        capacity: HOME_CAPACITY,
        matches: 12,
      },
    },
  ];
}

/**
 * The latest home fixture. Its attendance and capacity are the same constants
 * the attendance ring reads, so the tile's caption cannot contradict the ring.
 */
const LAST_HOME_MATCH: HomeMatch = {
  opponent: "Sion",
  goalsFor: 2,
  goalsAgainst: 1,
  attendance: ATTENDANCE_THIS_MONTH,
  capacity: HOME_CAPACITY,
};

/* --------------------------------------------------------- TOP PRODUCTS -- */

/**
 * Units sold per product per period, ordered best-selling first as the table
 * renders them. Keying units by period rather than by array position keeps a
 * product and its numbers on one line - and makes a misaligned column
 * impossible.
 */
const PRODUCT_SALES: readonly {
  product: ProductKey;
  units: Record<BaselinePeriodKey, number>;
}[] = [
  {
    product: ProductKey.HOME_SHIRT,
    units: {
      THIS_MONTH: 1_840,
      LAST_MONTH: 1_620,
      LAST_3_MONTHS: 5_210,
      YEAR_TO_DATE: 18_400,
    },
  },
  {
    product: ProductKey.HOME_SCARF,
    units: {
      THIS_MONTH: 1_210,
      LAST_MONTH: 1_450,
      LAST_3_MONTHS: 3_680,
      YEAR_TO_DATE: 9_200,
    },
  },
  {
    product: ProductKey.AWAY_SHIRT,
    units: {
      THIS_MONTH: 940,
      LAST_MONTH: 880,
      LAST_3_MONTHS: 2_740,
      YEAR_TO_DATE: 8_600,
    },
  },
  {
    product: ProductKey.CAP_ROTBLAU,
    units: {
      THIS_MONTH: 720,
      LAST_MONTH: 690,
      LAST_3_MONTHS: 2_130,
      YEAR_TO_DATE: 6_400,
    },
  },
  {
    product: ProductKey.THIRD_SHIRT,
    units: {
      THIS_MONTH: 510,
      LAST_MONTH: 470,
      LAST_3_MONTHS: 1_520,
      YEAR_TO_DATE: 4_900,
    },
  },
];

const TOP_PRODUCT_PERIODS: readonly TopProductsPeriod[] =
  BASELINE_PERIOD_KEYS.map((key) => ({
    key,
    labelKey: PERIOD_LABEL_KEY[key],
    rows: PRODUCT_SALES.map((sales) => ({
      product: sales.product,
      units: sales.units[key],
    })),
  }));

/* ------------------------------------------------------------- PARTNERS -- */

/**
 * PARTNER BRAND COLOURS ARE NOT DESIGN TOKENS. DO NOT "FIX" THEM.
 *
 * Each hex below is the partner's own corporate colour - Bitpanda's teal and
 * Sunrise's red sit deliberately outside the FCB palette in
 * `app/lib/tokens.ts`. A partner logo tile that renders in club red instead of
 * the partner's brand colour is wrong to a sponsor in the room, which is the
 * audience for this prototype.
 *
 * They are therefore typed as plain strings, never as `ColorToken`, and must
 * not be added to the token set. The token rule "a colour outside this set is
 * not permitted" governs the PRODUCT's colours; third-party brand marks are
 * content, not chrome. That some of them (Macron, Allianz) happen to coincide
 * with club red and blue is a coincidence of those brands, not a token
 * reference.
 */
const PARTNERS: readonly Partner[] = [
  {
    name: "Bitpanda",
    role: PartnerRole.MAIN_SHIRT_SPONSOR,
    roleLabelKey: PARTNER_ROLE_LABEL_KEY[PartnerRole.MAIN_SHIRT_SPONSOR],
    brandColor: "#0A9D8E",
  },
  {
    name: "Macron",
    role: PartnerRole.KIT_MANUFACTURER,
    roleLabelKey: PARTNER_ROLE_LABEL_KEY[PartnerRole.KIT_MANUFACTURER],
    brandColor: "#D3010C",
  },
  {
    name: "Allianz",
    role: PartnerRole.OFFICIAL_PARTNER,
    roleLabelKey: PARTNER_ROLE_LABEL_KEY[PartnerRole.OFFICIAL_PARTNER],
    brandColor: "#004093",
  },
  {
    name: "Sunrise",
    role: PartnerRole.TELECOM_PARTNER,
    roleLabelKey: PARTNER_ROLE_LABEL_KEY[PartnerRole.TELECOM_PARTNER],
    brandColor: "#E4002B",
  },
  {
    name: "Feldschlösschen",
    role: PartnerRole.BEVERAGE_PARTNER,
    roleLabelKey: PARTNER_ROLE_LABEL_KEY[PartnerRole.BEVERAGE_PARTNER],
    brandColor: "#B8960B",
  },
  {
    // The Specification's full company name is Hoffmann Automobile; the
    // Reference Guide shortens it to "Hoffmann" so the tile does not truncate.
    name: "Hoffmann",
    role: PartnerRole.MOBILITY_PARTNER,
    roleLabelKey: PARTNER_ROLE_LABEL_KEY[PartnerRole.MOBILITY_PARTNER],
    brandColor: "#0E2356",
  },
];

/* ----------------------------------------------------------- REPOSITORY -- */

/**
 * In-memory implementation of {@link BaselineRepository}.
 *
 * The clock is a constructor parameter, not a method parameter: date-derived
 * labels are an implementation detail of this fixture, so the interface stays
 * free of them and a database implementation never has to accept one. Tests
 * pass a fixed clock; `index.server.ts` takes the default.
 */
export function createMockBaselineRepository(
  clock: Clock = systemClock,
): BaselineRepository {
  return {
    periods: () => Promise.resolve(buildPeriods(clock())),
    period: (key) =>
      Promise.resolve(
        buildPeriods(clock()).find((period) => period.key === key) ?? null,
      ),
    lastHomeMatch: () => Promise.resolve(LAST_HOME_MATCH),
    topProducts: () => Promise.resolve([...TOP_PRODUCT_PERIODS]),
    topProductsFor: (key) =>
      Promise.resolve(
        TOP_PRODUCT_PERIODS.find((period) => period.key === key) ?? null,
      ),
    partners: () => Promise.resolve([...PARTNERS]),
  };
}
