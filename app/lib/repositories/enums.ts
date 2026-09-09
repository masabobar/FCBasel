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
