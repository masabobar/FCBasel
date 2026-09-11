/**
 * Hero 3 dataset (US-010) - full-year departmental performance: budget against
 * actual for the six departments, plus the causal follow-up that explains
 * Marketing.
 *
 * SOURCE OF TRUTH
 * Figures come from the Reference Implementation Guide's prototype
 * (`DATA.hero3`), which `.project-management/input/scope.md` §10 makes
 * definitive for the intended experience. Every one of them is asserted in
 * `tests/unit/hero3-dataset.test.ts`:
 *   Sponsoring & Partnerships  Revenue  21,000 -> 21,840  at 104% of target
 *   Ticketing                  Revenue  24,000 -> 24,360  at 102%
 *   Hospitality                Revenue   7,200 ->  6,840  at  95%
 *   Merchandising (Fanshop)    Revenue   9,800 ->  9,050  at  92%
 *   Events                     Revenue   3,600 ->  3,780  at 105%
 *   Marketing & Communications COST      3,400 ->  3,810  at  84%
 * totalling 69,000 -> 69,680, a variance of +680 (+1.0%).
 *
 * REVENUE VERSUS COST IS LOAD-BEARING
 * Five departments earn; Marketing spends. Above budget is money earned for the
 * first five and an OVERSPEND for the sixth, so the sign of a variance does not
 * carry its meaning. The good/bad reading is decided once, by
 * `varianceJudgement` in `../repositories/derive.ts`, from the department's
 * `type` - Marketing's +410 comes back ADVERSE while Sponsoring's +840 comes
 * back FAVOURABLE. Nothing here asks a tile to work that out from the number.
 *
 * MARKETING IS DERIVED, NOT FLAGGED
 * The Reference Guide carries `flag: true` on the Marketing row. It is not
 * ported. Marketing is the one department both over budget and behind target,
 * and `departmentsNeedingAttention` finds it from the figures - so the
 * follow-up can never interrogate a department the table has stopped flagging.
 *
 * SCOPE, STATED ON THE TILE
 * These are FULL-YEAR departmental totals and the Ticketing figure INCLUDES the
 * season-ticket base, so 24,360 legitimately exceeds the 7,830 of Hero 2's
 * eight shown matchday fixtures. Intended, not inconsistent - which is why
 * `scopeLabel` is data here exactly as it is on Hero 2's two series.
 *
 * HOUSE RULES OBSERVED HERE
 *   - Nothing derivable is stored. The Reference Guide stores `totalBudget`,
 *     `totalActual` and the Marketing `flag`; none of them are ported. Totals,
 *     every variance, the +1.0%, the good/bad judgement and the flagged
 *     department all come from `../repositories/derive.ts`.
 *     `blendedTargetPercent` IS stored, and is the one figure that has to be:
 *     it is a measured club-level attainment that no arithmetic over the six
 *     rows reproduces (their plain mean is 97.0, budget-weighted 99.7). It is
 *     the same kind of fact as a row's `targetPercent`, one level up - see the
 *     note on `Hero3Primary` in `../repositories/types.ts`.
 *   - Both narratives are VERBATIM. They are hand-authored persuasion copy read
 *     aloud to the owner: do not paraphrase, do not "fix" the wording, do not
 *     change the punctuation. Hyphens only, never an em or en dash.
 *   - Money is a plain number in CHF THOUSANDS. Formatting lands in US-011.
 *   - Static and local: no fetch, no database, no environment variable.
 *   - DEPARTMENTS, NEVER PEOPLE. This is the dataset closest to the
 *     named-individual guardrail: it is departmental and budgetary and stays
 *     aggregate. No salary, no headcount attributed to a person, no individual
 *     target attainment.
 */

import {
  DEPARTMENT_LABEL_KEY,
  DEPARTMENT_TYPE_LABEL_KEY,
  DepartmentKey,
  DepartmentType,
  SPEND_DRIVER_LABEL_KEY,
  SpendDriverKey,
} from "../repositories/enums";
import {
  type ConversionGap,
  type Department,
  type Hero3,
  type Hero3Repository,
  type SpendDriver,
} from "../repositories/types";

/* ---------------------------------------------------------- DEPARTMENTS -- */

/**
 * The six departments in the order the table lists them: the five revenue
 * departments largest budget first, then the cost centre.
 *
 * `targetPercent` is attainment of the department's OWN outcome target and is
 * not `actual / budget`. For the revenue departments the two happen to track
 * each other closely; for Marketing they diverge sharply, which is the whole
 * story - it spends 12% above budget while delivering 84% of the outcome that
 * spend was meant to buy.
 */
const DEPARTMENTS: readonly {
  key: DepartmentKey;
  type: DepartmentType;
  budget: number;
  actual: number;
  targetPercent: number;
}[] = [
  {
    key: DepartmentKey.SPONSORING_PARTNERSHIPS,
    type: DepartmentType.REVENUE,
    budget: 21_000,
    actual: 21_840,
    targetPercent: 104,
  },
  {
    key: DepartmentKey.TICKETING,
    type: DepartmentType.REVENUE,
    budget: 24_000,
    actual: 24_360,
    targetPercent: 102,
  },
  {
    key: DepartmentKey.HOSPITALITY,
    type: DepartmentType.REVENUE,
    budget: 7_200,
    actual: 6_840,
    targetPercent: 95,
  },
  {
    key: DepartmentKey.MERCHANDISING,
    type: DepartmentType.REVENUE,
    budget: 9_800,
    actual: 9_050,
    targetPercent: 92,
  },
  {
    key: DepartmentKey.EVENTS,
    type: DepartmentType.REVENUE,
    budget: 3_600,
    actual: 3_780,
    targetPercent: 105,
  },
  {
    key: DepartmentKey.MARKETING_COMMUNICATIONS,
    type: DepartmentType.COST,
    budget: 3_400,
    actual: 3_810,
    targetPercent: 84,
  },
];

/** The rows as the domain sees them, each carrying its own label keys. */
const DEPARTMENT_ROWS: readonly Department[] = DEPARTMENTS.map((entry) => ({
  ...entry,
  labelKey: DEPARTMENT_LABEL_KEY[entry.key],
  typeLabelKey: DEPARTMENT_TYPE_LABEL_KEY[entry.type],
}));

/**
 * Club-wide blended attainment of the departmental outcome targets, in percent.
 * A measurement, not a sum of the rows - see this file's header.
 */
const BLENDED_TARGET_PERCENT = 96;

/* ---------------------------------------------------------- SCOPE LABEL -- */

/**
 * What the tile covers, stated on the tile. It names the season-ticket
 * inclusion because that is precisely what makes 24,360 here and 7,830 in
 * Hero 2 both correct. The sentence itself, in both languages, is in
 * `app/lib/i18n/locales/*.json`.
 */
const SCOPE_LABEL_KEY = "hero3.scopeLabel" as const;

/* --------------------------------------------------------- FOLLOW-UP DATA -- */

/**
 * Where Marketing's overspend went, CHF thousands over plan.
 *
 * The three amounts sum to 410 - exactly the variance derived from the
 * Marketing row - so the breakdown reconciles with the table above it. The
 * agency retainer is a Reference Guide addition the Build Specification does not
 * mention; it is included per the approved full-JSX scope decision, and without
 * it the drivers would not add up to the overspend they explain.
 */
const SPEND_DRIVERS: readonly SpendDriver[] = [
  {
    key: SpendDriverKey.MATCH_ACTIVATIONS,
    labelKey: SPEND_DRIVER_LABEL_KEY[SpendDriverKey.MATCH_ACTIVATIONS],
    amount: 240,
  },
  {
    key: SpendDriverKey.PAID_SOCIAL,
    labelKey: SPEND_DRIVER_LABEL_KEY[SpendDriverKey.PAID_SOCIAL],
    amount: 150,
  },
  {
    key: SpendDriverKey.AGENCY_RETAINER,
    labelKey: SPEND_DRIVER_LABEL_KEY[SpendDriverKey.AGENCY_RETAINER],
    amount: 20,
  },
];

/**
 * The webshop conversion the paid-social spend was chasing: 2.2% achieved
 * against a 2.6% plan. Percent, not CHF, and the only non-money figures in the
 * dataset.
 */
const CONVERSION: ConversionGap = {
  actualPercent: 2.2,
  planPercent: 2.6,
};

/* ----------------------------------------------------------- NARRATIVES -- */

/**
 * THE COPY LIVES IN `app/lib/i18n/locales/*.json` (US-049); the dataset stores
 * the key. The English is VERBATIM from the Reference Guide and the German is
 * a translation of that same approved copy.
 *
 * The primary's 7.7% and 12% are `departmentVariancePercent` of the
 * Merchandising and Marketing rows, its 84% is Marketing's `targetPercent`,
 * and "the only department both over budget and behind target" is
 * `departmentsNeedingAttention` - the tests check all four. The follow-up's
 * CHF 240k, 2.2% and 2.6% are the driver and conversion figures above; its 18%
 * rise and its recommendation are the part of the story no figure carries.
 */
const PRIMARY_NARRATIVE_KEY = "hero3.narrative.primary" as const;

const FOLLOW_UP_NARRATIVE_KEY = "hero3.narrative.followUp" as const;

/**
 * Hero 3 as one object: the tile and the escalation it opens. Held together so
 * the follow-up's CHF 240k and the primary's "12% over its spend budget" cannot
 * be edited apart from the departments they describe.
 */
const HERO_3: Hero3 = {
  primary: {
    scopeLabelKey: SCOPE_LABEL_KEY,
    departments: DEPARTMENT_ROWS,
    blendedTargetPercent: BLENDED_TARGET_PERCENT,
    narrativeKey: PRIMARY_NARRATIVE_KEY,
  },
  followUp: {
    drivers: SPEND_DRIVERS,
    conversion: CONVERSION,
    narrativeKey: FOLLOW_UP_NARRATIVE_KEY,
  },
};

/* ----------------------------------------------------------- REPOSITORY -- */

/**
 * In-memory implementation of {@link Hero3Repository}.
 *
 * Like Hero 1 and Hero 2 and unlike the baseline band, nothing here depends on
 * the current date - a full-year budget is a closed period, not a rolling
 * window - so the factory takes no clock.
 */
export function createMockHero3Repository(): Hero3Repository {
  return {
    hero: () => Promise.resolve(HERO_3),
    departments: () => Promise.resolve([...DEPARTMENT_ROWS]),
    department: (key) =>
      Promise.resolve(
        DEPARTMENT_ROWS.find((department) => department.key === key) ?? null,
      ),
  };
}
