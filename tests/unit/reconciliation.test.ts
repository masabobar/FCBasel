/**
 * US-011 - cross-hero reconciliation. The safety net under the seed data.
 *
 * The three heroes are read aloud in the same room, one after another, to people
 * who add up figures while they listen. This suite fails if any of them ever
 * drifts - so it asserts RELATIONSHIPS rather than restating constants: a total
 * equals the rows under it, a badge equals the segments it labels, a narrative
 * quotes only figures the data can produce, and the ONE place two heroes
 * legitimately disagree is asserted as an inequality with the scope labels that
 * explain it.
 *
 * WHY IT LIVES APART FROM THE PER-DATASET SUITES. `hero1-dataset.test.ts` and
 * its siblings each pin one dataset against the Reference Guide. Nothing there
 * can see across a hero boundary, and the failures this file is built to catch
 * are exactly the ones that only appear when two datasets are read together.
 *
 * IF THIS SUITE EVER FAILS, do not adjust a figure to make it pass. A
 * contradiction here is the finding, not the obstacle.
 */

import { describe, expect, it } from "vitest";

import {
  chfFromThousands,
  formatMoney,
  formatMoneyCompact,
  formatMoneyMillions,
  formatSharePercent,
  formatSignedMillions,
  formatSignedPercent,
} from "../../app/lib/format";
import {
  SHIRT_PRICE_CHF,
  badgeSegments,
  badgeShare,
  conversionShortfall,
  declineTotal,
  departmentPerformanceRows,
  departmentTotals,
  departmentVariance,
  departmentVariancePercent,
  departmentsNeedingAttention,
  driverTotal,
  fixtureDeclines,
  fixtureTotals,
  homeKitShare,
  kitRevenueRows,
  kitRevenueTotal,
  kitUnitsTotal,
  monthlyTotals,
} from "../../app/lib/repositories/derive";
import {
  DEPARTMENT_TYPE_LABEL,
  KIT_VARIANT_LABEL,
  MONTH_LABEL,
  PeriodKey,
  SEASON_LABEL,
} from "../../app/lib/repositories/enums";
import {
  hero1Repository,
  hero2Repository,
  hero3Repository,
} from "../../app/lib/repositories/index.server";
import type { Department, Hero1Period } from "../../app/lib/repositories/types";

const MARKETING = "Marketing & Communications";
const MERCHANDISING = "Merchandising (Fanshop)";
const TICKETING = "Ticketing";

/* --------------------------------------------------------------- HELPERS -- */

async function seasonToDate(): Promise<Hero1Period> {
  const period = await hero1Repository.period(PeriodKey.SEASON_TO_DATE);
  if (period === null) {
    throw new Error("Hero 1 must seed the season-to-date period");
  }
  return period;
}

async function department(name: string): Promise<Department> {
  const found = await hero3Repository.department(name);
  if (found === null) {
    throw new Error(`Hero 3 must seed the ${name} department`);
  }
  return found;
}

/** Every number a narrative quotes, commas stripped, sign dropped. */
function figuresQuotedIn(narrative: string): number[] {
  return [...narrative.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map((match) =>
    Number(match[0].replace(/,/g, "")),
  );
}

/** Numbers plus the roundings a narrative may legitimately quote them at. */
function reachable(values: readonly number[]): Set<number> {
  const set = new Set<number>();
  for (const value of values) {
    set.add(value);
    set.add(Math.abs(value));
    set.add(Math.round(Math.abs(value)));
  }
  return set;
}

/* ============================================== HERO 1 - MERCHANDISING === */

describe("Hero 1 reconciles with itself", () => {
  it("totals the three kits to the figure the tile headlines", async () => {
    const period = await seasonToDate();
    const [home, away, third] = period.kits;

    expect([home?.units, away?.units, third?.units]).toEqual([
      22_400, 10_300, 5_800,
    ]);
    expect(kitUnitsTotal(period)).toBe(
      (home?.units ?? 0) + (away?.units ?? 0) + (third?.units ?? 0),
    );
    expect(kitUnitsTotal(period)).toBe(38_500);
  });

  it("derives the Home share as 58.18%, shown as 58%", async () => {
    const period = await seasonToDate();
    const home = period.kits[0];

    expect(homeKitShare(period)).toBeCloseTo(
      (home?.units ?? 0) / kitUnitsTotal(period),
      12,
    );
    expect(homeKitShare(period) * 100).toBeCloseTo(58.18, 2);
    expect(formatSharePercent(homeKitShare(period))).toBe("58%");
  });

  it("puts the badge total at exactly 8.00% of shirts", async () => {
    const period = await seasonToDate();

    expect(period.badgeTotal).toBe(3_080);
    expect(badgeShare(period)).toBe(period.badgeTotal / kitUnitsTotal(period));
    expect(badgeShare(period)).toBe(0.08);
    expect(badgeShare(period) * 100).toBe(8);
    expect(formatSharePercent(badgeShare(period))).toBe("8%");
  });

  it("keeps every period's badge total near the 8% the copy claims", async () => {
    for (const period of await hero1Repository.periods()) {
      expect(badgeShare(period) * 100).toBeGreaterThan(7.5);
      expect(badgeShare(period) * 100).toBeLessThan(8.5);
    }
  });

  it("splits the badge total into segments that sum back to it, every period", async () => {
    const { primary } = await hero1Repository.hero();

    expect(primary.periods).toHaveLength(4);
    for (const period of primary.periods) {
      const segments = badgeSegments(period.badgeTotal, primary.badgeSplit);
      const summed = segments.reduce(
        (total, segment) => total + segment.value,
        0,
      );

      expect(summed).toBe(period.badgeTotal);
      expect(segments).toHaveLength(primary.badgeSplit.length);
    }
  });

  it("keeps the sponsor split at exactly 100%", async () => {
    const { primary } = await hero1Repository.hero();
    const summed = primary.badgeSplit.reduce(
      (total, share) => total + share.percent,
      0,
    );

    expect(summed).toBe(100);
  });

  it("prices 38,500 shirts at CHF 99 into CHF 3,811,500", async () => {
    const period = await seasonToDate();

    expect(SHIRT_PRICE_CHF).toBe(99);
    expect(kitRevenueTotal(period)).toBe(kitUnitsTotal(period) * 99);
    expect(kitRevenueTotal(period)).toBe(3_811_500);
    expect(formatMoney(kitRevenueTotal(period))).toBe("CHF 3’811’500");
    expect(formatMoneyMillions(kitRevenueTotal(period))).toBe("CHF 3.81M");
  });

  it("splits that revenue Home 2.218M / Away 1.020M / 3rd 0.574M", async () => {
    const period = await seasonToDate();
    const rows = kitRevenueRows(period);

    expect(rows.map((row) => row.revenue)).toEqual([
      2_217_600, 1_019_700, 574_200,
    ]);
    expect(rows.map((row) => (row.revenue / 1_000_000).toFixed(3))).toEqual([
      "2.218",
      "1.020",
      "0.574",
    ]);
    expect(rows.reduce((total, row) => total + row.revenue, 0)).toBe(
      kitRevenueTotal(period),
    );
  });
});

/* ================================================== HERO 2 - TICKETING === */

describe("Hero 2 reconciles with itself", () => {
  it("totals eight fixtures to 7,880 -> 7,830, a fall of 50", async () => {
    const fixtures = await hero2Repository.fixtures();
    const totals = fixtureTotals(fixtures);

    expect(fixtures).toHaveLength(8);
    expect(totals.previous).toBe(
      fixtures.reduce((sum, fixture) => sum + fixture.previous, 0),
    );
    expect(totals.current).toBe(
      fixtures.reduce((sum, fixture) => sum + fixture.current, 0),
    );
    expect(totals.previous).toBe(7_880);
    expect(totals.current).toBe(7_830);
    expect(totals.delta).toBe(-50);
    expect(totals.delta).toBe(totals.current - totals.previous);
  });

  it("turns that fall of 50 into the headline -0.6%", async () => {
    const totals = fixtureTotals(await hero2Repository.fixtures());

    expect(totals.deltaPercent).toBe(-0.6);
    expect((totals.delta / totals.previous) * 100).toBeCloseTo(-0.63, 2);
    expect(formatSignedPercent(totals.deltaPercent)).toBe("-0.6%");
  });

  it("adds the four declines to the -CHF 400k badge", async () => {
    const fixtures = await hero2Repository.fixtures();
    const declines = fixtureDeclines(fixtures);

    expect(declines).toEqual([
      { opponent: "FCZ", drop: 150 },
      { opponent: "Lugano", drop: 110 },
      { opponent: "Luzern", drop: 70 },
      { opponent: "Sion", drop: 70 },
    ]);
    expect(declineTotal(fixtures)).toBe(
      declines.reduce((sum, decline) => sum + decline.drop, 0),
    );
    expect(declineTotal(fixtures)).toBe(400);
    expect(formatMoneyCompact(chfFromThousands(-declineTotal(fixtures)))).toBe(
      "-CHF 400k",
    );
  });

  it("keeps every decline a real year-on-year fall in the chart", async () => {
    const fixtures = await hero2Repository.fixtures();

    for (const decline of fixtureDeclines(fixtures)) {
      const fixture = fixtures.find(
        (candidate) => candidate.opponent === decline.opponent,
      );

      expect(fixture).toBeDefined();
      expect(fixture!.current).toBeLessThan(fixture!.previous);
      expect(decline.drop).toBe(fixture!.previous - fixture!.current);
    }
  });

  it("leaves the gains and the falls adding back to the net movement", async () => {
    const fixtures = await hero2Repository.fixtures();
    const gains = fixtures
      .filter((fixture) => fixture.current > fixture.previous)
      .reduce((sum, fixture) => sum + (fixture.current - fixture.previous), 0);

    expect(gains).toBe(350);
    expect(gains - declineTotal(fixtures)).toBe(fixtureTotals(fixtures).delta);
  });

  /**
   * THE INTENDED SCOPE DIFFERENCE INSIDE HERO 2. The monthly chart covers every
   * home fixture; the fixture chart covers the eight highest-grossing. The
   * monthly total is therefore LARGER, and that is the answer to the first
   * person in the room who adds up the months.
   */
  it("keeps the monthly totals larger than the fixture totals, on purpose", async () => {
    const fixtures = fixtureTotals(await hero2Repository.fixtures());
    const monthly = monthlyTotals(await hero2Repository.monthly());

    expect(monthly.previous).toBe(9_880);
    expect(monthly.current).toBe(9_770);
    expect(monthly.previous).toBeGreaterThan(fixtures.previous);
    expect(monthly.current).toBeGreaterThan(fixtures.current);
    expect(monthly.delta).toBe(-110);
  });

  it("labels both scopes, which is what makes the two totals both correct", async () => {
    const { primary } = await hero2Repository.hero();

    expect(primary.fixtures.scopeLabel).toMatch(/eight highest-grossing/i);
    expect(primary.monthly.scopeLabel).toMatch(/all home fixtures/i);
    for (const label of [
      primary.fixtures.scopeLabel,
      primary.monthly.scopeLabel,
    ]) {
      expect(label).toMatch(/excluding the season-ticket base/);
    }
  });
});

/* =============================================== HERO 3 - DEPARTMENTS === */

describe("Hero 3 reconciles with itself", () => {
  it("totals six departments to 69,000 -> 69,680, a variance of +680", async () => {
    const departments = await hero3Repository.departments();
    const totals = departmentTotals(departments);

    expect(departments).toHaveLength(6);
    expect(totals.budget).toBe(
      departments.reduce((sum, entry) => sum + entry.budget, 0),
    );
    expect(totals.actual).toBe(
      departments.reduce((sum, entry) => sum + entry.actual, 0),
    );
    expect(totals.budget).toBe(69_000);
    expect(totals.actual).toBe(69_680);
    expect(totals.variance).toBe(680);
    expect(totals.variance).toBe(totals.actual - totals.budget);
  });

  it("turns that +680 into +1.0%, and renders it in millions", async () => {
    const totals = departmentTotals(await hero3Repository.departments());

    expect(totals.variancePercent).toBe(1);
    expect((totals.variance / totals.budget) * 100).toBeCloseTo(0.99, 2);
    expect(formatSignedPercent(totals.variancePercent)).toBe("+1%");
    expect(formatSignedMillions(chfFromThousands(totals.variance))).toBe(
      "+0.68",
    );
  });

  it("sums every row's variance back to the club-wide variance", async () => {
    const departments = await hero3Repository.departments();
    const rows = departmentPerformanceRows(departments);
    const summed = rows.reduce((total, row) => total + row.variance, 0);

    expect(summed).toBe(departmentTotals(departments).variance);
    for (const row of rows) {
      expect(row.variance).toBe(row.actual - row.budget);
    }
  });

  it("puts Merchandising 7.65% under budget, quoted as 7.7%", async () => {
    const merchandising = await department(MERCHANDISING);

    expect(departmentVariance(merchandising)).toBe(-750);
    expect(
      (departmentVariance(merchandising) / merchandising.budget) * 100,
    ).toBeCloseTo(-7.65, 2);
    expect(departmentVariancePercent(merchandising)).toBe(-7.7);
  });

  it("puts Marketing 12.06% over budget, quoted as 12%", async () => {
    const marketing = await department(MARKETING);

    expect(departmentVariance(marketing)).toBe(410);
    expect(
      (departmentVariance(marketing) / marketing.budget) * 100,
    ).toBeCloseTo(12.06, 2);
    expect(departmentVariancePercent(marketing)).toBe(12.1);
    expect(Math.round(departmentVariancePercent(marketing))).toBe(12);
  });

  it("finds Marketing to be the ONE department over budget and behind target", async () => {
    const departments = await hero3Repository.departments();
    const flagged = departmentsNeedingAttention(departments);

    expect(flagged.map((row) => row.name)).toEqual([MARKETING]);
    for (const row of departmentPerformanceRows(departments)) {
      expect(row.needsAttention).toBe(row.overBudget && row.behindTarget);
    }
  });

  it("adds the three spend drivers to exactly Marketing's variance", async () => {
    const { followUp } = await hero3Repository.hero();
    const marketing = await department(MARKETING);

    expect(followUp.drivers.map((driver) => driver.amount)).toEqual([
      240, 150, 20,
    ]);
    expect(driverTotal(followUp.drivers)).toBe(410);
    expect(driverTotal(followUp.drivers)).toBe(departmentVariance(marketing));
  });

  it("reconciles the conversion gap three ways from two measurements", async () => {
    const { followUp } = await hero3Repository.hero();
    const shortfall = conversionShortfall(followUp.conversion);

    expect(followUp.conversion).toEqual({
      actualPercent: 2.2,
      planPercent: 2.6,
    });
    expect(shortfall.gapPoints).toBe(-0.4);
    expect(shortfall.attainmentPercent).toBe(84.6);
    expect(shortfall.changePercent).toBe(-15.4);
  });

  /**
   * `blendedTargetPercent` is STORED, not derived, and that is verified rather
   * than assumed: no arithmetic over the six rows reproduces 96, so it is a
   * Finance-supplied measurement one level up - the same kind of fact as a row's
   * own `targetPercent`. This test exists so a future reader does not "fix" it.
   */
  it("keeps the blended target a stored measurement, not a drifted sum", async () => {
    const { primary } = await hero3Repository.hero();
    const departments = primary.departments;
    const totals = departmentTotals(departments);
    const mean =
      departments.reduce((sum, entry) => sum + entry.targetPercent, 0) /
      departments.length;
    const budgetWeighted =
      departments.reduce(
        (sum, entry) => sum + entry.targetPercent * entry.budget,
        0,
      ) / totals.budget;

    expect(primary.blendedTargetPercent).toBe(96);
    expect(mean).toBeCloseTo(97, 1);
    expect(budgetWeighted).toBeCloseTo(99.7, 1);
    expect(primary.blendedTargetPercent).not.toBe(Math.round(mean));
    expect(primary.blendedTargetPercent).not.toBe(Math.round(budgetWeighted));
  });
});

/* ==================================================== ACROSS THE HEROES === */

describe("the heroes reconcile with each other", () => {
  /**
   * THE ONE INTENDED INEQUALITY. Hero 3's Ticketing is a full-year departmental
   * total INCLUDING the season-ticket base; Hero 2's 7,830 is matchday revenue
   * across eight fixtures, excluding it. 24,360 legitimately exceeds 7,830 - and
   * both tiles say so, which is the only thing that keeps it from reading as an
   * arithmetic bug in the room.
   */
  it("lets Hero 3 Ticketing exceed Hero 2's fixture total, with both scopes labelled", async () => {
    const ticketing = await department(TICKETING);
    const fixtures = fixtureTotals(await hero2Repository.fixtures());
    const hero3 = await hero3Repository.hero();
    const hero2 = await hero2Repository.hero();

    expect(ticketing.actual).toBe(24_360);
    expect(fixtures.current).toBe(7_830);
    expect(ticketing.actual).toBeGreaterThan(fixtures.current);

    expect(hero3.primary.scopeLabel).toMatch(/season-ticket base/);
    expect(hero3.primary.scopeLabel).toMatch(/includes/);
    expect(hero2.primary.fixtures.scopeLabel).toMatch(
      /excluding the season-ticket base/,
    );
  });

  it("keeps the whole monthly season below Hero 3's Ticketing too", async () => {
    const ticketing = await department(TICKETING);
    const monthly = monthlyTotals(await hero2Repository.monthly());

    // Even every home fixture of the season (9,770) sits well under the
    // full-year departmental figure - the season-ticket base is the difference.
    expect(monthly.current).toBeLessThan(ticketing.actual);
  });

  /**
   * The same shape one hero down: Hero 1 is season-to-date SHIRT revenue, Hero 3
   * Merchandising is the full-year Fanshop. Shirts are a subset, so Hero 1 must
   * come in under Hero 3 - if it ever exceeds it, one of the two is wrong.
   */
  it("keeps Hero 1 shirt revenue inside Hero 3's Merchandising actual", async () => {
    const period = await seasonToDate();
    const merchandising = await department(MERCHANDISING);

    expect(kitRevenueTotal(period)).toBe(3_811_500);
    expect(kitRevenueTotal(period)).toBeLessThan(
      chfFromThousands(merchandising.actual),
    );
  });

  it("states a scope on every hero, in words rather than a repeated figure", async () => {
    const hero1 = await hero1Repository.hero();
    const hero2 = await hero2Repository.hero();
    const hero3 = await hero3Repository.hero();
    const labels = [
      hero1.primary.scopeLabel,
      hero2.primary.fixtures.scopeLabel,
      hero2.primary.monthly.scopeLabel,
      hero3.primary.scopeLabel,
    ];

    for (const label of labels) {
      expect(label.length).toBeGreaterThan(10);
      // A scope label that quoted a figure would be a second copy of it, free
      // to drift. They name the scope in words instead - "Hero 2" is a
      // reference to a tile, not a measurement.
      expect(label).not.toMatch(/CHF/);
      expect(label).not.toMatch(/\d{3}|\d[.,’]\d/);
    }
  });
});

/* ============================================ STORED ONCE, REFERENCED === */

describe("a figure that appears twice is stored once and referenced", () => {
  it("stores no total, delta or decline list on Hero 2", async () => {
    const { primary, followUp } = await hero2Repository.hero();

    for (const fixture of primary.fixtures.fixtures) {
      expect(Object.keys(fixture).sort()).toEqual([
        "current",
        "opponent",
        "previous",
      ]);
    }
    expect(Object.keys(primary).sort()).toEqual([
      "currentSeason",
      "fixtures",
      "monthly",
      "narrative",
      "previousSeason",
    ]);
    expect(Object.keys(followUp)).toEqual(["narrative"]);
  });

  it("stores no revenue, share or badge segment on Hero 1", async () => {
    const { primary } = await hero1Repository.hero();

    for (const period of primary.periods) {
      expect(Object.keys(period).sort()).toEqual([
        "badgeTotal",
        "key",
        "kits",
        "label",
        "printedNames",
      ]);
      for (const kit of period.kits) {
        expect(Object.keys(kit).sort()).toEqual(["label", "units", "variant"]);
      }
    }
    // The shirt price lives in `derive.ts` and nowhere else.
    expect(JSON.stringify(primary)).not.toContain('"price"');
  });

  it("stores no variance, total or flag on Hero 3", async () => {
    const { primary } = await hero3Repository.hero();

    for (const entry of primary.departments) {
      expect(Object.keys(entry).sort()).toEqual([
        "actual",
        "budget",
        "name",
        "targetPercent",
        "type",
        "typeLabel",
      ]);
    }
    expect(Object.keys(primary).sort()).toEqual([
      "blendedTargetPercent",
      "departments",
      "narrative",
      "scopeLabel",
    ]);
  });

  it("references the shared label maps instead of retyping a label", async () => {
    const hero1 = await hero1Repository.hero();
    const hero2 = await hero2Repository.hero();
    const hero3 = await hero3Repository.hero();

    for (const period of hero1.primary.periods) {
      for (const kit of period.kits) {
        expect(kit.label).toBe(KIT_VARIANT_LABEL[kit.variant]);
      }
    }
    expect(hero2.primary.previousSeason.label).toBe(
      SEASON_LABEL[hero2.primary.previousSeason.key],
    );
    expect(hero2.primary.currentSeason.label).toBe(
      SEASON_LABEL[hero2.primary.currentSeason.key],
    );
    for (const month of hero2.primary.monthly.months) {
      expect(month.label).toBe(MONTH_LABEL[month.month]);
    }
    for (const entry of hero3.primary.departments) {
      expect(entry.typeLabel).toBe(DEPARTMENT_TYPE_LABEL[entry.type]);
    }
  });

  it("keeps every stored money value a plain number, never a formatted string", async () => {
    const heroes = await Promise.all([
      hero1Repository.hero(),
      hero2Repository.hero(),
      hero3Repository.hero(),
    ]);

    for (const hero of heroes) {
      const narratives = JSON.stringify(hero).match(/"[^"]*"/g) ?? [];
      const copy = new Set(
        [
          hero.primary.narrative,
          hero.followUp.narrative,
          ...("scopeLabel" in hero.primary ? [hero.primary.scopeLabel] : []),
        ].map((value) => JSON.stringify(value)),
      );

      for (const value of narratives) {
        if (copy.has(value)) {
          continue;
        }
        expect(value).not.toMatch(/CHF/);
        expect(value).not.toMatch(/\d[,’]\d{3}/);
      }
    }
  });
});

/* ============================== NARRATIVES QUOTE ONLY REACHABLE FIGURES === */

describe("every figure a narrative quotes is reachable from the data", () => {
  it("Hero 1 primary: the 58% and the 8% both come from the kit units", async () => {
    const hero = await hero1Repository.hero();
    const period = await seasonToDate();

    expect(hero.primary.narrative).toContain(
      `${formatSharePercent(homeKitShare(period))} of shirt sales`,
    );
    expect(hero.primary.narrative).toContain(
      `about ${formatSharePercent(badgeShare(period))} of shirts`,
    );
    // The most-printed sponsor and the most-printed name are positions in the
    // data, not names typed into the copy a second time.
    expect(hero.primary.narrative).toContain(
      hero.primary.badgeSplit[0]!.sponsor,
    );
    expect(hero.primary.narrative).toContain(period.printedNames[0]!.name);
    expect(
      [...hero.primary.badgeSplit].sort((a, b) => b.percent - a.percent)[0]!
        .sponsor,
    ).toBe(hero.primary.badgeSplit[0]!.sponsor);
    expect(
      [...period.printedNames].sort((a, b) => b.units - a.units)[0]!.name,
    ).toBe(period.printedNames[0]!.name);
  });

  it("Hero 1 follow-up: the 38% is the fastest-growing sponsor's own figure", async () => {
    const { followUp, primary } = await hero1Repository.hero();
    const fastest = [...followUp.trend].sort(
      (left, right) => right.deltaPercent - left.deltaPercent,
    )[0]!;

    expect(followUp.narrative).toContain(`up ${fastest.deltaPercent}%`);
    expect(followUp.narrative).toContain(fastest.sponsor);
    // "Bitpanda already leads badge selection" - the largest split share.
    expect(followUp.narrative).toContain(
      `${primary.badgeSplit[0]!.sponsor} already leads`,
    );
    for (const entry of followUp.trend) {
      expect(primary.badgeSplit.map((share) => share.sponsor)).toContain(
        entry.sponsor,
      );
    }
  });

  it("Hero 2 primary: the -0.6% and the -CHF 150k are both derived", async () => {
    const hero = await hero2Repository.hero();
    const fixtures = await hero2Repository.fixtures();
    const totals = fixtureTotals(fixtures);
    const biggest = fixtureDeclines(fixtures)[0]!;

    expect(hero.primary.narrative).toContain(
      `(${formatSignedPercent(totals.deltaPercent)})`,
    );
    expect(hero.primary.narrative).toContain(
      `${biggest.opponent} match is the single biggest drop, ${formatMoneyCompact(
        chfFromThousands(-biggest.drop),
      )}`,
    );

    const gainers = fixtures
      .filter((fixture) => fixture.current > fixture.previous)
      .map((fixture) => fixture.opponent);
    const fallers = fixtureDeclines(fixtures).map(
      (decline) => decline.opponent,
    );

    for (const named of ["YB", "Servette", "St. Gallen"]) {
      expect(gainers).toContain(named);
      expect(hero.primary.narrative).toContain(named);
    }
    for (const named of ["FCZ", "Lugano", "Sion"]) {
      expect(fallers).toContain(named);
      expect(hero.primary.narrative).toContain(named);
    }
  });

  it("Hero 2 follow-up: names the four declines in derived order and amount", async () => {
    const hero = await hero2Repository.hero();
    const declines = fixtureDeclines(await hero2Repository.fixtures());

    expect(hero.followUp.narrative).toContain(
      `${declines[0]!.opponent} (${formatMoneyCompact(
        chfFromThousands(-declines[0]!.drop),
      )})`,
    );
    for (const decline of declines.slice(1)) {
      expect(hero.followUp.narrative).toContain(
        `${decline.opponent} (-${decline.drop}k)`,
      );
    }
    // The order the copy reads them in is the order the derivation produces.
    const positions = declines.map((decline) =>
      hero.followUp.narrative.indexOf(decline.opponent),
    );
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("Hero 3: the 7.7%, the 12% and the 84% all come from the table", async () => {
    const hero = await hero3Repository.hero();
    const merchandising = await department(MERCHANDISING);
    const marketing = await department(MARKETING);

    expect(hero.primary.narrative).toContain(
      `${Math.abs(departmentVariancePercent(merchandising))}% under`,
    );
    expect(hero.primary.narrative).toContain(
      `${Math.round(departmentVariancePercent(marketing))}% over`,
    );
    expect(hero.primary.narrative).toContain(
      `${marketing.targetPercent}% of its outcome target`,
    );
    expect(hero.followUp.narrative).toContain(
      `CHF ${hero.followUp.drivers[0]!.amount}k over plan`,
    );
    expect(hero.followUp.narrative).toContain(
      `CHF ${hero.followUp.drivers[1]!.amount}k`,
    );
    expect(hero.followUp.narrative).toContain(
      `${hero.followUp.conversion.actualPercent}% against a ${hero.followUp.conversion.planPercent}% plan`,
    );
  });

  /**
   * THE SWEEP. The assertions above check the figures we know are quoted; this
   * one checks that no OTHER figure has crept in. Every number in every
   * narrative must be reachable from the data - except the handful listed here,
   * which are story, not arithmetic, and are documented as such in the fixture
   * files they belong to.
   */
  const NARRATIVE_ONLY = new Map<string, readonly number[]>([
    // "the FCZ match sold about 3,200 fewer seats" - attendance, which Hero 2
    // does not carry. Noted in `app/lib/mock/hero2.ts`.
    ["hero2.followUp", [3_200]],
    // "paid-social spend rose 18%" - a spend movement, not a budget figure.
    // Noted in `app/lib/mock/hero3.ts`.
    ["hero3.followUp", [18]],
  ]);

  it("quotes no figure the data cannot produce", async () => {
    const hero1 = await hero1Repository.hero();
    const hero2 = await hero2Repository.hero();
    const hero3 = await hero3Repository.hero();

    const period = await seasonToDate();
    const fixtures = await hero2Repository.fixtures();
    const departments = await hero3Repository.departments();
    const fixtureSums = fixtureTotals(fixtures);
    const performance = departmentPerformanceRows(departments);
    const totals = departmentTotals(departments);
    const shortfall = conversionShortfall(hero3.followUp.conversion);

    const hero1Figures = reachable([
      ...period.kits.map((kit) => kit.units),
      ...period.printedNames.map((entry) => entry.units),
      ...hero1.primary.badgeSplit.map((share) => share.percent),
      ...hero1.followUp.trend.map((entry) => entry.deltaPercent),
      ...kitRevenueRows(period).map((row) => row.revenue),
      kitUnitsTotal(period),
      kitRevenueTotal(period),
      period.badgeTotal,
      homeKitShare(period) * 100,
      badgeShare(period) * 100,
      SHIRT_PRICE_CHF,
    ]);

    const hero2Figures = reachable([
      ...fixtures.flatMap((fixture) => [fixture.previous, fixture.current]),
      ...fixtureDeclines(fixtures).map((decline) => decline.drop),
      fixtureSums.previous,
      fixtureSums.current,
      fixtureSums.delta,
      fixtureSums.deltaPercent,
      declineTotal(fixtures),
    ]);

    const hero3Figures = reachable([
      ...departments.flatMap((entry) => [
        entry.budget,
        entry.actual,
        entry.targetPercent,
      ]),
      ...performance.flatMap((row) => [row.variance, row.variancePercent]),
      ...hero3.followUp.drivers.map((driver) => driver.amount),
      hero3.primary.blendedTargetPercent,
      hero3.followUp.conversion.actualPercent,
      hero3.followUp.conversion.planPercent,
      shortfall.attainmentPercent,
      shortfall.changePercent,
      shortfall.gapPoints,
      driverTotal(hero3.followUp.drivers),
      totals.budget,
      totals.actual,
      totals.variance,
      totals.variancePercent,
    ]);

    // The expected count keeps the sweep honest: a regex that stopped matching
    // would pass silently, so each narrative states how many figures it quotes.
    const cases: readonly [string, string, Set<number>, number][] = [
      ["hero1.primary", hero1.primary.narrative, hero1Figures, 2],
      ["hero1.followUp", hero1.followUp.narrative, hero1Figures, 1],
      ["hero2.primary", hero2.primary.narrative, hero2Figures, 2],
      ["hero2.followUp", hero2.followUp.narrative, hero2Figures, 5],
      ["hero3.primary", hero3.primary.narrative, hero3Figures, 3],
      ["hero3.followUp", hero3.followUp.narrative, hero3Figures, 5],
    ];

    for (const [name, narrative, figures, expected] of cases) {
      const allowed = NARRATIVE_ONLY.get(name) ?? [];
      const quotedFigures = figuresQuotedIn(narrative);

      expect(quotedFigures, `${name} quoted-figure count`).toHaveLength(
        expected,
      );
      for (const quoted of quotedFigures) {
        expect(
          figures.has(quoted) || allowed.includes(quoted),
          `${name} quotes ${quoted}, which the data cannot produce`,
        ).toBe(true);
      }
    }
  });
});
