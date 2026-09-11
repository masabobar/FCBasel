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
 *
 * LABELS ARE TRANSLATION KEYS, NOT TEXT. Every `*_LABEL_KEY` map below points
 * at `app/lib/i18n/locales/*.json`, where both languages live side by side
 * (US-049). The maps are what stops a display string being typed into a
 * fixture: a key resolves through `t()` at render time, so the same dataset
 * renders "Last 3 months" or "Letzte 3 Monate" without a second dataset.
 */

import { type TranslationKey } from "../i18n";

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
export const PERIOD_LABEL_KEY: Record<PeriodKey, TranslationKey> = {
  [PeriodKey.THIS_MONTH]: "enum.period.THIS_MONTH",
  [PeriodKey.LAST_MONTH]: "enum.period.LAST_MONTH",
  [PeriodKey.LAST_3_MONTHS]: "enum.period.LAST_3_MONTHS",
  [PeriodKey.YEAR_TO_DATE]: "enum.period.YEAR_TO_DATE",
  [PeriodKey.SEASON_TO_DATE]: "enum.period.SEASON_TO_DATE",
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
export const KIT_VARIANT_LABEL_KEY: Record<KitVariant, TranslationKey> = {
  [KitVariant.HOME]: "enum.kit.HOME",
  [KitVariant.AWAY]: "enum.kit.AWAY",
  [KitVariant.THIRD]: "enum.kit.THIRD",
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
export const SEASON_LABEL_KEY: Record<SeasonKey, TranslationKey> = {
  [SeasonKey.SEASON_25_26]: "enum.season.SEASON_25_26",
  [SeasonKey.SEASON_26_27]: "enum.season.SEASON_26_27",
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
export const MONTH_LABEL_KEY: Record<MonthKey, TranslationKey> = {
  [MonthKey.JANUARY]: "enum.month.JANUARY",
  [MonthKey.FEBRUARY]: "enum.month.FEBRUARY",
  [MonthKey.MARCH]: "enum.month.MARCH",
  [MonthKey.APRIL]: "enum.month.APRIL",
  [MonthKey.MAY]: "enum.month.MAY",
  [MonthKey.JUNE]: "enum.month.JUNE",
  [MonthKey.JULY]: "enum.month.JULY",
  [MonthKey.AUGUST]: "enum.month.AUGUST",
  [MonthKey.SEPTEMBER]: "enum.month.SEPTEMBER",
  [MonthKey.OCTOBER]: "enum.month.OCTOBER",
  [MonthKey.NOVEMBER]: "enum.month.NOVEMBER",
  [MonthKey.DECEMBER]: "enum.month.DECEMBER",
};

/**
 * The months in CALENDAR order, January first, so a date's `getMonth()` indexes
 * straight into it. `app/lib/calendar.ts` derives the baseline band's rolling
 * axis this way rather than calling `toLocaleString`, which would have to be
 * told a locale the SERVER cannot know (the language is client state).
 */
export const MONTH_KEYS: readonly MonthKey[] = [
  MonthKey.JANUARY,
  MonthKey.FEBRUARY,
  MonthKey.MARCH,
  MonthKey.APRIL,
  MonthKey.MAY,
  MonthKey.JUNE,
  MonthKey.JULY,
  MonthKey.AUGUST,
  MonthKey.SEPTEMBER,
  MonthKey.OCTOBER,
  MonthKey.NOVEMBER,
  MonthKey.DECEMBER,
];

/* ---------------------------------------------------------------- WEEKS -- */

/**
 * The four weeks of a single-month axis. A label like `W1` is the same word in
 * both languages, but it is still a RENDERED string, so it lives in the
 * dictionary with everything else rather than as a literal in a fixture.
 */
export const WeekKey = {
  W1: "W1",
  W2: "W2",
  W3: "W3",
  W4: "W4",
} as const;

export type WeekKey = (typeof WeekKey)[keyof typeof WeekKey];

/** The four weeks, in axis order. */
export const WEEK_KEYS: readonly WeekKey[] = [
  WeekKey.W1,
  WeekKey.W2,
  WeekKey.W3,
  WeekKey.W4,
];

export const WEEK_LABEL_KEY: Record<WeekKey, TranslationKey> = {
  [WeekKey.W1]: "enum.week.W1",
  [WeekKey.W2]: "enum.week.W2",
  [WeekKey.W3]: "enum.week.W3",
  [WeekKey.W4]: "enum.week.W4",
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
export const DEPARTMENT_TYPE_LABEL_KEY: Record<DepartmentType, TranslationKey> =
  {
    [DepartmentType.REVENUE]: "enum.departmentType.REVENUE",
    [DepartmentType.COST]: "enum.departmentType.COST",
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
export const VARIANCE_JUDGEMENT_LABEL_KEY: Record<
  VarianceJudgement,
  TranslationKey
> = {
  [VarianceJudgement.FAVOURABLE]: "enum.varianceJudgement.FAVOURABLE",
  [VarianceJudgement.ADVERSE]: "enum.varianceJudgement.ADVERSE",
  [VarianceJudgement.NEUTRAL]: "enum.varianceJudgement.NEUTRAL",
};

/* --------------------------------------------------- VARIANCE DIRECTION -- */

/**
 * Which way a movement went - the ARROW half of a variance.
 *
 * Separate from {@link VarianceJudgement} because they answer different
 * questions: direction is arithmetic (did the number go up or down), judgement
 * is meaning (is that good news). Marketing's overspend is UP and ADVERSE at the
 * same time, and a tile needs both.
 *
 * It exists so that variance is never carried by colour alone: a projector can
 * shift green and red, so the sign, the arrow and the colour token must all say
 * the same thing. `varianceDirection` in `../format.ts` produces it.
 */
export const VarianceDirection = {
  UP: "UP",
  DOWN: "DOWN",
  /** Exactly unchanged - no arrow. */
  FLAT: "FLAT",
} as const;

export type VarianceDirection =
  (typeof VarianceDirection)[keyof typeof VarianceDirection];

/** Accessible wording for the arrow, so the direction is not visual only. */
export const VARIANCE_DIRECTION_LABEL_KEY: Record<
  VarianceDirection,
  TranslationKey
> = {
  [VarianceDirection.UP]: "enum.varianceDirection.UP",
  [VarianceDirection.DOWN]: "enum.varianceDirection.DOWN",
  [VarianceDirection.FLAT]: "enum.varianceDirection.FLAT",
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
export const PARTNER_ROLE_LABEL_KEY: Record<PartnerRole, TranslationKey> = {
  [PartnerRole.MAIN_SHIRT_SPONSOR]: "enum.partnerRole.MAIN_SHIRT_SPONSOR",
  [PartnerRole.KIT_MANUFACTURER]: "enum.partnerRole.KIT_MANUFACTURER",
  [PartnerRole.OFFICIAL_PARTNER]: "enum.partnerRole.OFFICIAL_PARTNER",
  [PartnerRole.TELECOM_PARTNER]: "enum.partnerRole.TELECOM_PARTNER",
  [PartnerRole.BEVERAGE_PARTNER]: "enum.partnerRole.BEVERAGE_PARTNER",
  [PartnerRole.MOBILITY_PARTNER]: "enum.partnerRole.MOBILITY_PARTNER",
};

/* ------------------------------------------------------------- PRODUCTS -- */

/**
 * The merchandise lines the Top Products tile ranks.
 *
 * They became an enum with US-049: a product NAME is display text, and display
 * text in two languages cannot live on a fixture row. The identifier is what
 * the fixture stores and what the table keys its rows by; the name comes from
 * the dictionary.
 */
export const ProductKey = {
  HOME_SHIRT: "HOME_SHIRT",
  HOME_SCARF: "HOME_SCARF",
  AWAY_SHIRT: "AWAY_SHIRT",
  CAP_ROTBLAU: "CAP_ROTBLAU",
  THIRD_SHIRT: "THIRD_SHIRT",
} as const;

export type ProductKey = (typeof ProductKey)[keyof typeof ProductKey];

/** Product names. `Cap "Rotblau"` keeps its inner quotes in both languages. */
export const PRODUCT_LABEL_KEY: Record<ProductKey, TranslationKey> = {
  [ProductKey.HOME_SHIRT]: "enum.product.HOME_SHIRT",
  [ProductKey.HOME_SCARF]: "enum.product.HOME_SCARF",
  [ProductKey.AWAY_SHIRT]: "enum.product.AWAY_SHIRT",
  [ProductKey.CAP_ROTBLAU]: "enum.product.CAP_ROTBLAU",
  [ProductKey.THIRD_SHIRT]: "enum.product.THIRD_SHIRT",
};

/* ---------------------------------------------------------- DEPARTMENTS -- */

/**
 * The six departments of the Hero 3 table.
 *
 * The identifier is also the LOOKUP KEY of `Hero3Repository.department()`:
 * looking a row up by its display name would have meant looking it up by a
 * string that changes with the language.
 */
export const DepartmentKey = {
  SPONSORING_PARTNERSHIPS: "SPONSORING_PARTNERSHIPS",
  TICKETING: "TICKETING",
  HOSPITALITY: "HOSPITALITY",
  MERCHANDISING: "MERCHANDISING",
  EVENTS: "EVENTS",
  MARKETING_COMMUNICATIONS: "MARKETING_COMMUNICATIONS",
} as const;

export type DepartmentKey = (typeof DepartmentKey)[keyof typeof DepartmentKey];

/** Department names, as Finance names them. */
export const DEPARTMENT_LABEL_KEY: Record<DepartmentKey, TranslationKey> = {
  [DepartmentKey.SPONSORING_PARTNERSHIPS]:
    "enum.department.SPONSORING_PARTNERSHIPS",
  [DepartmentKey.TICKETING]: "enum.department.TICKETING",
  [DepartmentKey.HOSPITALITY]: "enum.department.HOSPITALITY",
  [DepartmentKey.MERCHANDISING]: "enum.department.MERCHANDISING",
  [DepartmentKey.EVENTS]: "enum.department.EVENTS",
  [DepartmentKey.MARKETING_COMMUNICATIONS]:
    "enum.department.MARKETING_COMMUNICATIONS",
};

/* -------------------------------------------------------- SPEND DRIVERS -- */

/** Where Marketing's overspend went - the three bars of the follow-up tile. */
export const SpendDriverKey = {
  MATCH_ACTIVATIONS: "MATCH_ACTIVATIONS",
  PAID_SOCIAL: "PAID_SOCIAL",
  AGENCY_RETAINER: "AGENCY_RETAINER",
} as const;

export type SpendDriverKey =
  (typeof SpendDriverKey)[keyof typeof SpendDriverKey];

export const SPEND_DRIVER_LABEL_KEY: Record<SpendDriverKey, TranslationKey> = {
  [SpendDriverKey.MATCH_ACTIVATIONS]: "enum.spendDriver.MATCH_ACTIVATIONS",
  [SpendDriverKey.PAID_SOCIAL]: "enum.spendDriver.PAID_SOCIAL",
  [SpendDriverKey.AGENCY_RETAINER]: "enum.spendDriver.AGENCY_RETAINER",
};

/* -------------------------------------------------------------- HEROES -- */

/**
 * The three scripted demonstrations. This is the identity a question resolves
 * to and the key the dashboard dedupes an inserted section by, so it lives
 * here with the other cross-boundary keys rather than as three loose strings.
 *
 * The number matches the dataset the hero renders (`../mock/hero1.ts` ->
 * `HERO_1`) and the backlog's own numbering (US-034/035 are Hero 1, US-036/037
 * Hero 2, US-038/039 Hero 3), so there is one vocabulary from fixture to
 * screen. It is an identifier and is never rendered: a hero's title and
 * narrative are part of its content (Phase 3b), not of its id.
 */
export const HeroId = {
  /** Merchandising - shirt sales, sponsor badges, printed names. */
  HERO_1: "HERO_1",
  /** Ticketing - ticket revenue year on year. */
  HERO_2: "HERO_2",
  /** Departments - budget versus actual versus target. */
  HERO_3: "HERO_3",
} as const;

export type HeroId = (typeof HeroId)[keyof typeof HeroId];

/**
 * The heroes in the order their suggestion chips are offered (US-029).
 *
 * NOT the order sections appear in: that is the order the questions were asked
 * and is a property of the session, not of this list.
 */
export const HERO_IDS: readonly HeroId[] = [
  HeroId.HERO_1,
  HeroId.HERO_2,
  HeroId.HERO_3,
];
