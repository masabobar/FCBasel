/**
 * Domain enums - the single source of truth for every enum-like key that
 * crosses the data-to-UI boundary, per `.claude/rules/enums-and-constants.md`.
 *
 * Wire values are `SCREAMING_SNAKE_CASE` so they survive the eventual move from
 * these in-memory fixtures to a database column without a single value shifting.
 * They are machine identifiers and are NEVER rendered: every enum here has a
 * companion label map, which is where display text lives.
 *
 * A later dataset story that needs a new period or partner role extends the
 * object HERE. Do not declare a competing key set inside a fixture file.
 */

/* ------------------------------------------------------------- PERIODS -- */

/**
 * The period a figure covers. Every period-switchable tile uses these keys, so
 * the webshop chart, the attendance ring and the top-products table can share
 * one segmented control without translating between key sets.
 */
export const PeriodKey = {
  THIS_MONTH: "THIS_MONTH",
  LAST_MONTH: "LAST_MONTH",
  LAST_3_MONTHS: "LAST_3_MONTHS",
  YEAR_TO_DATE: "YEAR_TO_DATE",
  SEASON_TO_DATE: "SEASON_TO_DATE",
} as const;

export type PeriodKey = (typeof PeriodKey)[keyof typeof PeriodKey];

/**
 * Default display label per period. A dataset may override the wording on its
 * own entry (Hero 1 says "Current month" where the baseline band says "This
 * month"), which is exactly why `label` is a field on the period object rather
 * than being looked up at render time.
 */
export const PERIOD_LABEL: Record<PeriodKey, string> = {
  [PeriodKey.THIS_MONTH]: "This month",
  [PeriodKey.LAST_MONTH]: "Last month",
  [PeriodKey.LAST_3_MONTHS]: "Last 3 months",
  [PeriodKey.YEAR_TO_DATE]: "Year to date",
  [PeriodKey.SEASON_TO_DATE]: "Season to date",
};

/* ------------------------------------------------------------ KIT VARIANTS -- */

/**
 * The three shirts in a season's kit range. Enum-like and it crosses the
 * data-to-UI boundary, so it gets a wire value here rather than a bare display
 * string on the fixture: "3rd" is a label, `THIRD` is the identifier.
 */
export const KitVariant = {
  HOME: "HOME",
  AWAY: "AWAY",
  THIRD: "THIRD",
} as const;

export type KitVariant = (typeof KitVariant)[keyof typeof KitVariant];

/** How each kit is named on a chart axis or in a table row. */
export const KIT_VARIANT_LABEL: Record<KitVariant, string> = {
  [KitVariant.HOME]: "Home",
  [KitVariant.AWAY]: "Away",
  [KitVariant.THIRD]: "3rd",
};

/* -------------------------------------------------------------- SEASONS -- */

/**
 * The two seasons every year-on-year comparison is drawn against: the season
 * running now and the one before it.
 *
 * The wire value carries the years so it survives the move to a database
 * column, while WHICH of the two is "current" stays a property of the dataset
 * that uses them - a fixture row says `previous`/`current` and names the season
 * once, at the top of the hero.
 */
export const SeasonKey = {
  SEASON_25_26: "SEASON_25_26",
  SEASON_26_27: "SEASON_26_27",
} as const;

export type SeasonKey = (typeof SeasonKey)[keyof typeof SeasonKey];

/** How a season is named in a chart legend. */
export const SEASON_LABEL: Record<SeasonKey, string> = {
  [SeasonKey.SEASON_25_26]: "Season 25/26",
  [SeasonKey.SEASON_26_27]: "Season 26/27",
};

/* --------------------------------------------------------------- MONTHS -- */

/**
 * Calendar months, as the key of a point on a month-by-month axis.
 *
 * A football season runs July to June, so a season's axis is neither the
 * calendar year's order nor derivable from today's date - it is a fixed axis
 * and its keys belong here rather than as bare strings on a fixture. Contrast
 * `app/lib/calendar.ts`, which derives labels from the CURRENT DATE for the
 * baseline band's date-relative periods; `tests/unit/hero2-dataset.test.ts`
 * pins the two spellings of a month name to each other.
 */
export const MonthKey = {
  JANUARY: "JANUARY",
  FEBRUARY: "FEBRUARY",
  MARCH: "MARCH",
  APRIL: "APRIL",
  MAY: "MAY",
  JUNE: "JUNE",
  JULY: "JULY",
  AUGUST: "AUGUST",
  SEPTEMBER: "SEPTEMBER",
  OCTOBER: "OCTOBER",
  NOVEMBER: "NOVEMBER",
  DECEMBER: "DECEMBER",
} as const;

export type MonthKey = (typeof MonthKey)[keyof typeof MonthKey];

/** Short month name for a chart axis, matching the baseline band's `"Sep"`. */
export const MONTH_LABEL: Record<MonthKey, string> = {
  [MonthKey.JANUARY]: "Jan",
  [MonthKey.FEBRUARY]: "Feb",
  [MonthKey.MARCH]: "Mar",
  [MonthKey.APRIL]: "Apr",
  [MonthKey.MAY]: "May",
  [MonthKey.JUNE]: "Jun",
  [MonthKey.JULY]: "Jul",
  [MonthKey.AUGUST]: "Aug",
  [MonthKey.SEPTEMBER]: "Sep",
  [MonthKey.OCTOBER]: "Oct",
  [MonthKey.NOVEMBER]: "Nov",
  [MonthKey.DECEMBER]: "Dec",
};

/* ----------------------------------------------------- DEPARTMENT TYPE -- */

/**
 * Whether a department EARNS money or SPENDS it.
 *
 * LOAD-BEARING, NOT DECORATION. It is the only thing that says what a variance
 * MEANS: for a revenue department an actual above budget is money earned, while
 * for the Marketing cost centre the same arithmetic is an overspend. A tile that
 * colours "variance > 0" green without reading this renders Marketing's +410 as
 * a success in front of the owner, which is why no consumer is asked to make
 * that inference itself - see {@link VarianceJudgement} and
 * `varianceJudgement` in `./derive.ts`.
 */
export const DepartmentType = {
  REVENUE: "REVENUE",
  COST: "COST",
} as const;

export type DepartmentType =
  (typeof DepartmentType)[keyof typeof DepartmentType];

/** The tag shown against a department name in the Hero 3 table. */
export const DEPARTMENT_TYPE_LABEL: Record<DepartmentType, string> = {
  [DepartmentType.REVENUE]: "Revenue",
  [DepartmentType.COST]: "Cost",
};

/* --------------------------------------------------- VARIANCE JUDGEMENT -- */

/**
 * Whether a variance is GOOD or BAD news, once the department's
 * {@link DepartmentType} has been taken into account.
 *
 * This exists so the good/bad decision is made ONCE, in `./derive.ts`, and is
 * then carried as data. A component reads this key and picks a colour; it never
 * re-derives the judgement from the sign of the number, because the sign alone
 * does not carry the answer.
 */
export const VarianceJudgement = {
  /** Ahead: revenue above budget, or spend below it. */
  FAVOURABLE: "FAVOURABLE",
  /** Behind: revenue below budget, or spend above it (an overspend). */
  ADVERSE: "ADVERSE",
  /** Exactly on budget - neither. */
  NEUTRAL: "NEUTRAL",
} as const;

export type VarianceJudgement =
  (typeof VarianceJudgement)[keyof typeof VarianceJudgement];

/** How a judgement is worded when a tile spells it out rather than colouring it. */
export const VARIANCE_JUDGEMENT_LABEL: Record<VarianceJudgement, string> = {
  [VarianceJudgement.FAVOURABLE]: "Favourable",
  [VarianceJudgement.ADVERSE]: "Adverse",
  [VarianceJudgement.NEUTRAL]: "On budget",
};

/* ------------------------------------------------------- PARTNER ROLES -- */

/** What a commercial partner is to the club. */
export const PartnerRole = {
  MAIN_SHIRT_SPONSOR: "MAIN_SHIRT_SPONSOR",
  KIT_MANUFACTURER: "KIT_MANUFACTURER",
  OFFICIAL_PARTNER: "OFFICIAL_PARTNER",
  TELECOM_PARTNER: "TELECOM_PARTNER",
  BEVERAGE_PARTNER: "BEVERAGE_PARTNER",
  MOBILITY_PARTNER: "MOBILITY_PARTNER",
} as const;

export type PartnerRole = (typeof PartnerRole)[keyof typeof PartnerRole];

/** The tag shown under a partner name on the "Active partners" tile. */
export const PARTNER_ROLE_LABEL: Record<PartnerRole, string> = {
  [PartnerRole.MAIN_SHIRT_SPONSOR]: "Main shirt sponsor",
  [PartnerRole.KIT_MANUFACTURER]: "Kit manufacturer",
  [PartnerRole.OFFICIAL_PARTNER]: "Official partner",
  [PartnerRole.TELECOM_PARTNER]: "Telecom partner",
  [PartnerRole.BEVERAGE_PARTNER]: "Beverage partner",
  [PartnerRole.MOBILITY_PARTNER]: "Mobility partner",
};
