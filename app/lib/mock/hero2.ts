/**
 * Hero 2 dataset (US-009) - matchday ticket revenue year on year: the eight
 * highest-grossing home fixtures, the month-by-month view of the whole season,
 * and the declining-fixtures follow-up.
 *
 * SOURCE OF TRUTH
 * Figures come from the Reference Implementation Guide's prototype
 * (`DATA.hero2`), which `.project-management/input/scope.md` §10 makes
 * definitive for the intended experience. The Build Specification pins the
 * fixtures and the totals, and they are asserted in
 * `tests/unit/hero2-dataset.test.ts`:
 *   YB 1,480 -> 1,610; FCZ 1,390 -> 1,240; Servette 980 -> 1,050;
 *   St. Gallen 1,020 -> 1,090; Luzern 890 -> 820; Sion 760 -> 690;
 *   GC 640 -> 720; Lugano 720 -> 610;
 *   totalling 7,880 -> 7,830, a fall of 50 (-0.6%).
 *
 * SCOPE
 * The month-by-month series is seeded too, though the written acceptance
 * criteria describe only the fixtures - the tile draws a second chart and every
 * point on it must have data behind it.
 *
 * TWO SCOPES, ON PURPOSE
 * The fixture chart covers EIGHT fixtures; the monthly chart covers EVERY home
 * fixture. Summing the monthly series therefore gives a bigger number
 * (9,880 -> 9,770) than the fixture total, and neither figure is wrong. That is
 * why `scopeLabel` is stored ON EACH SERIES rather than written into a
 * component: an unlabelled pair of charts reads as an arithmetic bug to the
 * first person in the room who adds up the months.
 *
 * HOUSE RULES OBSERVED HERE
 *   - Nothing derivable is stored. The Reference Guide stores `totalPrev`,
 *     `totalCurr`, `deltaPct` and a second list of `declines`; none of them are
 *     ported. Totals, the -0.6%, the four declining fixtures and their
 *     -CHF 400k badge all come from `../repositories/derive.ts`, so a stored
 *     number can never outlive an edit to the fixtures beneath it.
 *   - Both narratives are VERBATIM. They are hand-authored persuasion copy read
 *     aloud in a sponsor meeting: do not paraphrase, do not "fix" the wording,
 *     do not change the punctuation. Hyphens only, never an em or en dash.
 *   - Money is a plain number in CHF THOUSANDS. Formatting lands in US-011.
 *   - Static and local: no fetch, no database, no environment variable.
 *   - CLUBS, NOT PEOPLE. A fixture is named by the opposing club; no
 *     named-individual figure appears anywhere in this dataset.
 */

import {
  MONTH_LABEL_KEY,
  MonthKey,
  SEASON_LABEL_KEY,
  SeasonKey,
} from "../repositories/enums";
import {
  type FixtureRevenue,
  type Hero2,
  type Hero2Repository,
  type MonthlyRevenue,
  type SeasonRef,
} from "../repositories/types";

/* -------------------------------------------------------------- SEASONS -- */

/** 25/26 is the comparison year, 26/27 the year the headline describes. */
const PREVIOUS_SEASON: SeasonRef = {
  key: SeasonKey.SEASON_25_26,
  labelKey: SEASON_LABEL_KEY[SeasonKey.SEASON_25_26],
};

const CURRENT_SEASON: SeasonRef = {
  key: SeasonKey.SEASON_26_27,
  labelKey: SEASON_LABEL_KEY[SeasonKey.SEASON_26_27],
};

/* ------------------------------------------------------------- FIXTURES -- */

/**
 * The eight highest-grossing home fixtures IN BOTH SEASONS, in the order the
 * grouped bar chart draws them. CHF thousands, matchday tickets only.
 *
 * Four fixtures gained (YB, Servette, St. Gallen, GC - the narrative names the
 * first three) and four fell. Those four are what the follow-up breaks down,
 * derived from these pairs rather than listed a second time.
 */
const FIXTURES: readonly FixtureRevenue[] = [
  { opponent: "YB", previous: 1_480, current: 1_610 },
  { opponent: "FCZ", previous: 1_390, current: 1_240 },
  { opponent: "Servette", previous: 980, current: 1_050 },
  { opponent: "St. Gallen", previous: 1_020, current: 1_090 },
  { opponent: "Luzern", previous: 890, current: 820 },
  { opponent: "Sion", previous: 760, current: 690 },
  { opponent: "GC", previous: 640, current: 720 },
  { opponent: "Lugano", previous: 720, current: 610 },
];

/* -------------------------------------------------------------- MONTHLY -- */

/**
 * Ticket revenue month by month across a football season, July to June - the
 * array order IS the axis order, which is why the season does not start in
 * January. July and June are short because the season is only part-played in
 * them.
 *
 * ALL home fixtures, not only the eight above: see the scope note in this
 * file's header.
 */
const MONTHLY: readonly {
  month: MonthKey;
  previous: number;
  current: number;
}[] = [
  { month: MonthKey.JULY, previous: 180, current: 210 },
  { month: MonthKey.AUGUST, previous: 920, current: 980 },
  { month: MonthKey.SEPTEMBER, previous: 1_180, current: 1_240 },
  { month: MonthKey.OCTOBER, previous: 1_040, current: 990 },
  { month: MonthKey.NOVEMBER, previous: 860, current: 820 },
  { month: MonthKey.DECEMBER, previous: 640, current: 610 },
  { month: MonthKey.JANUARY, previous: 720, current: 690 },
  { month: MonthKey.FEBRUARY, previous: 980, current: 1_010 },
  { month: MonthKey.MARCH, previous: 1_120, current: 1_080 },
  { month: MonthKey.APRIL, previous: 1_060, current: 1_020 },
  { month: MonthKey.MAY, previous: 980, current: 940 },
  { month: MonthKey.JUNE, previous: 200, current: 180 },
];

const MONTHLY_REVENUE: readonly MonthlyRevenue[] = MONTHLY.map((entry) => ({
  ...entry,
  labelKey: MONTH_LABEL_KEY[entry.month],
}));

/* --------------------------------------------------------- SCOPE LABELS -- */

/**
 * What each chart covers, stated on the chart. These two DIFFER because the
 * charts do, and the difference is the whole reason the labels are data. The
 * wording of each, in both languages, is in `app/lib/i18n/locales/*.json`.
 */
const FIXTURE_SCOPE_LABEL_KEY = "hero2.scopeLabel.fixtures" as const;

const MONTHLY_SCOPE_LABEL_KEY = "hero2.scopeLabel.monthly" as const;

/* ----------------------------------------------------------- NARRATIVES -- */

/**
 * THE COPY LIVES IN `app/lib/i18n/locales/*.json` (US-049); the dataset stores
 * the key.
 *
 * The English is VERBATIM from the Reference Guide and the German is a
 * translation of that same approved copy. Every figure the primary quotes -
 * the -0.6%, the fixtures up and down, the -CHF 150k - is derivable from the
 * fixtures above, and the tests check exactly that in both languages. The
 * follow-up's four fixtures are the derived declines; its attendance
 * explanation is the part of the story no figure in this dataset carries.
 */
const PRIMARY_NARRATIVE_KEY = "hero2.narrative.primary" as const;

const FOLLOW_UP_NARRATIVE_KEY = "hero2.narrative.followUp" as const;

/**
 * Hero 2 as one object: the tile and the escalation it opens. Held together so
 * the follow-up's "-CHF 150k" and the primary's "single biggest drop" cannot be
 * edited apart from the fixtures they describe.
 */
const HERO_2: Hero2 = {
  primary: {
    previousSeason: PREVIOUS_SEASON,
    currentSeason: CURRENT_SEASON,
    fixtures: {
      scopeLabelKey: FIXTURE_SCOPE_LABEL_KEY,
      fixtures: FIXTURES,
    },
    monthly: {
      scopeLabelKey: MONTHLY_SCOPE_LABEL_KEY,
      months: MONTHLY_REVENUE,
    },
    narrativeKey: PRIMARY_NARRATIVE_KEY,
  },
  followUp: {
    narrativeKey: FOLLOW_UP_NARRATIVE_KEY,
  },
};

/* ----------------------------------------------------------- REPOSITORY -- */

/**
 * In-memory implementation of {@link Hero2Repository}.
 *
 * Like Hero 1 and unlike the baseline band, nothing here depends on the current
 * date: the season axis is the football season's own, not the wall clock's, so
 * the factory takes no clock.
 */
export function createMockHero2Repository(): Hero2Repository {
  return {
    hero: () => Promise.resolve(HERO_2),
    fixtures: () => Promise.resolve([...FIXTURES]),
    fixture: (opponent) =>
      Promise.resolve(
        FIXTURES.find((fixture) => fixture.opponent === opponent) ?? null,
      ),
    monthly: () => Promise.resolve([...MONTHLY_REVENUE]),
  };
}
