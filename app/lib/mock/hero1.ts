/**
 * Hero 1 dataset (US-008) - season-to-date merchandising: kit sales, sponsor
 * badge printing and printed names, plus the badge-trend follow-up.
 *
 * SOURCE OF TRUTH
 * Figures come from the Reference Implementation Guide's prototype (`KIT_NAMES`,
 * `H1_NAMES`, `H1_BADGE_SPLIT`, `H1_PERIODS`, `DATA.hero1`), which
 * `.project-management/input/scope.md` §10 makes definitive for the intended
 * experience. The Build Specification pins the season-to-date figures, and they
 * are asserted in `tests/unit/hero1-dataset.test.ts`:
 *   Home 22,400 / Away 10,300 / 3rd 5,800 = 38,500 shirts at CHF 99;
 *   3,080 badged shirts, exactly 8% of units, split 44/24/20/12;
 *   Shaqiri 3,180, Sow 1,240, Metinho 1,080, Custom 920, Daniliuc 760.
 *
 * SCOPE
 * All four periods are seeded, not only the season-to-date one the written
 * acceptance criteria describe - the tile has a period switch and every
 * position on it must have data behind it.
 *
 * HOUSE RULES OBSERVED HERE
 *   - Nothing derivable is stored. Kit revenue (units x CHF 99), the total,
 *     the Home share (58.18% -> 58%), the badge share (exactly 8%) and the four
 *     badge segments all come from `../repositories/derive.ts`. The Reference
 *     Guide stores `homeShare: 58`; we do not, because a stored 58 can outlive
 *     an edit to the units beneath it.
 *   - Both narratives are VERBATIM. They are hand-authored persuasion copy read
 *     aloud in a sponsor meeting: do not paraphrase, do not "fix" the wording,
 *     do not change the punctuation. Hyphens only, never an em or en dash.
 *   - Money is a plain number. Formatting lands in US-011, at render time.
 *   - Static and local: no fetch, no database, no environment variable.
 *   - MERCHANDISING DATA ONLY. Squad names appear as shirt-print counts and
 *     nothing else - no performance figure, no rating, no salary.
 */

import {
  KIT_VARIANT_LABEL,
  KitVariant,
  PERIOD_LABEL,
  PeriodKey,
} from "../repositories/enums";
import {
  type BadgeSponsorShare,
  type Hero1,
  type Hero1Period,
  type Hero1Repository,
  type KitUnits,
  type PrintedNameUnits,
} from "../repositories/types";

/* ------------------------------------------------------------- PERIODS -- */

/**
 * The periods this tile offers, in display order. Season to date leads because
 * it is the tile's stated scope; the rest narrow from there.
 */
const HERO_1_PERIOD_KEYS = [
  PeriodKey.SEASON_TO_DATE,
  PeriodKey.LAST_3_MONTHS,
  PeriodKey.LAST_MONTH,
  PeriodKey.THIS_MONTH,
] as const;

type Hero1PeriodKey = (typeof HERO_1_PERIOD_KEYS)[number];

/**
 * Wording that differs from the default. The current month is "Current month"
 * here where the baseline band says "This month", which is exactly why `label`
 * is a field on the period rather than a render-time lookup.
 */
const PERIOD_LABEL_OVERRIDE: Partial<Record<Hero1PeriodKey, string>> = {
  [PeriodKey.THIS_MONTH]: "Current month",
};

/* ------------------------------------------------------------ KIT SALES -- */

/** Kit units per period, keyed by variant so a column can never misalign. */
const KIT_UNITS: readonly {
  variant: KitVariant;
  units: Record<Hero1PeriodKey, number>;
}[] = [
  {
    variant: KitVariant.HOME,
    units: {
      SEASON_TO_DATE: 22_400,
      LAST_3_MONTHS: 8_200,
      LAST_MONTH: 3_100,
      THIS_MONTH: 2_400,
    },
  },
  {
    variant: KitVariant.AWAY,
    units: {
      SEASON_TO_DATE: 10_300,
      LAST_3_MONTHS: 3_900,
      LAST_MONTH: 1_500,
      THIS_MONTH: 1_150,
    },
  },
  {
    variant: KitVariant.THIRD,
    units: {
      SEASON_TO_DATE: 5_800,
      LAST_3_MONTHS: 2_100,
      LAST_MONTH: 780,
      THIS_MONTH: 620,
    },
  },
];

/* --------------------------------------------------------- BADGE SPLIT -- */

/**
 * How badged shirts divide between the sponsors who buy badge space. Fixed
 * across periods, and the percentages must sum to 100 - a test enforces it.
 * Absolute segment counts are NOT stored: `badgeSegments` derives them from a
 * period's `badgeTotal` and corrects the rounding remainder.
 */
const BADGE_SPLIT: readonly BadgeSponsorShare[] = [
  { sponsor: "Bitpanda", percent: 44 },
  { sponsor: "Sunrise", percent: 24 },
  { sponsor: "Allianz", percent: 20 },
  { sponsor: "IWB", percent: 12 },
];

/** Badged shirts per period. About 8% of units - exactly 8% season to date. */
const BADGE_TOTAL: Record<Hero1PeriodKey, number> = {
  SEASON_TO_DATE: 3_080,
  LAST_3_MONTHS: 1_136,
  LAST_MONTH: 430,
  THIS_MONTH: 334,
};

/* -------------------------------------------------------- PRINTED NAMES -- */

/**
 * Shirts sold with each name printed on the back, most-printed first.
 *
 * These are PRINT COUNTS - what fans bought - and are the only place squad
 * names appear in any dataset. "Custom" is a fan's own name and outsells two of
 * the squad, which is itself part of the story the tile tells.
 */
const PRINTED_NAMES: readonly {
  name: string;
  units: Record<Hero1PeriodKey, number>;
}[] = [
  {
    name: "Shaqiri",
    units: {
      SEASON_TO_DATE: 3_180,
      LAST_3_MONTHS: 980,
      LAST_MONTH: 360,
      THIS_MONTH: 290,
    },
  },
  {
    name: "Sow",
    units: {
      SEASON_TO_DATE: 1_240,
      LAST_3_MONTHS: 380,
      LAST_MONTH: 150,
      THIS_MONTH: 120,
    },
  },
  {
    name: "Metinho",
    units: {
      SEASON_TO_DATE: 1_080,
      LAST_3_MONTHS: 320,
      LAST_MONTH: 120,
      THIS_MONTH: 95,
    },
  },
  {
    name: "Custom",
    units: {
      SEASON_TO_DATE: 920,
      LAST_3_MONTHS: 290,
      LAST_MONTH: 110,
      THIS_MONTH: 88,
    },
  },
  {
    name: "Daniliuc",
    units: {
      SEASON_TO_DATE: 760,
      LAST_3_MONTHS: 210,
      LAST_MONTH: 80,
      THIS_MONTH: 64,
    },
  },
];

/* ---------------------------------------------------- PERIOD ASSEMBLY -- */

function kitsFor(key: Hero1PeriodKey): KitUnits[] {
  return KIT_UNITS.map((kit) => ({
    variant: kit.variant,
    label: KIT_VARIANT_LABEL[kit.variant],
    units: kit.units[key],
  }));
}

function printedNamesFor(key: Hero1PeriodKey): PrintedNameUnits[] {
  return PRINTED_NAMES.map((entry) => ({
    name: entry.name,
    units: entry.units[key],
  }));
}

const HERO_1_PERIODS: readonly Hero1Period[] = HERO_1_PERIOD_KEYS.map(
  (key) => ({
    key,
    label: PERIOD_LABEL_OVERRIDE[key] ?? PERIOD_LABEL[key],
    kits: kitsFor(key),
    badgeTotal: BADGE_TOTAL[key],
    printedNames: printedNamesFor(key),
  }),
);

/* ----------------------------------------------------------- NARRATIVES -- */

/**
 * VERBATIM from the Reference Guide. Read aloud in the room, quoting figures
 * that live directly above it. Any edit here must be an edit to the data too.
 */
const PRIMARY_NARRATIVE =
  "Pulled from Merchandising, Webshop and flock-printing. The Home kit drives 58% of shirt sales; about 8% of shirts carry a sponsor badge, with Bitpanda the most printed; Shaqiri is comfortably the most printed name.";

/**
 * VERBATIM from the Reference Guide. Bitpanda's +2 is the "flat-to-slightly-up"
 * the copy describes; Sunrise's +38 is the recommendation it turns on.
 */
const FOLLOW_UP_NARRATIVE =
  "Bitpanda already leads badge selection, but Sunrise is growing fastest - up 38% over the last three drops off a smaller base. Recommendation: feature Sunrise in the next drop to convert its momentum, while keeping Bitpanda as the default option.";

/** Badge selection over the last three drops, in percent, signed. */
const BADGE_TREND = [
  { sponsor: "Bitpanda", deltaPercent: 2 },
  { sponsor: "Sunrise", deltaPercent: 38 },
  { sponsor: "Allianz", deltaPercent: 6 },
  { sponsor: "IWB", deltaPercent: -3 },
] as const;

/**
 * Hero 1 as one object: the tile and the escalation it opens. Held together so
 * the follow-up's "+38%" and the primary's "Bitpanda the most printed" cannot
 * be edited apart from the figures they describe.
 */
const HERO_1: Hero1 = {
  primary: {
    scopeLabel: "Season-to-date merchandising",
    periods: HERO_1_PERIODS,
    badgeSplit: BADGE_SPLIT,
    narrative: PRIMARY_NARRATIVE,
  },
  followUp: {
    trend: BADGE_TREND,
    narrative: FOLLOW_UP_NARRATIVE,
  },
};

/* ----------------------------------------------------------- REPOSITORY -- */

/**
 * In-memory implementation of {@link Hero1Repository}.
 *
 * Nothing here depends on the current date, so unlike the baseline fixture this
 * factory takes no clock - the season-to-date framing is the dataset's own, not
 * the wall clock's.
 */
export function createMockHero1Repository(): Hero1Repository {
  return {
    hero: () => Promise.resolve(HERO_1),
    periods: () => Promise.resolve([...HERO_1_PERIODS]),
    period: (key) =>
      Promise.resolve(
        HERO_1_PERIODS.find((period) => period.key === key) ?? null,
      ),
  };
}
