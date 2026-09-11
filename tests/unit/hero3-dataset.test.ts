import { describe, expect, it } from "vitest";

import { createMockHero3Repository } from "../../app/lib/mock/hero3";
import {
  ON_TARGET_PERCENT,
  conversionShortfall,
  departmentPerformance,
  departmentPerformanceRows,
  departmentTotals,
  departmentVariance,
  departmentVariancePercent,
  departmentsNeedingAttention,
  departmentsOnTarget,
  driverTotal,
  percentChange,
  varianceJudgement,
} from "../../app/lib/repositories/derive";
import {
  DEPARTMENT_LABEL_KEY,
  DEPARTMENT_TYPE_LABEL_KEY,
  DepartmentKey,
  DepartmentType,
  VARIANCE_JUDGEMENT_LABEL_KEY,
  VarianceJudgement,
} from "../../app/lib/repositories/enums";
import { hero3Repository } from "../../app/lib/repositories/index.server";
import {
  type Department,
  type Hero3Repository,
} from "../../app/lib/repositories/types";
import { t } from "./support/i18n";

const repository: Hero3Repository = createMockHero3Repository();

/**
 * Departments are addressed by KEY since US-049: the identifier is stable
 * across languages, and the NAME is a dictionary entry the tile resolves.
 */
const MARKETING = DepartmentKey.MARKETING_COMMUNICATIONS;
const MERCHANDISING = DepartmentKey.MERCHANDISING;
const SPONSORING = DepartmentKey.SPONSORING_PARTNERSHIPS;

function departmentName(key: DepartmentKey): string {
  return t(DEPARTMENT_LABEL_KEY[key]);
}

/** A department row, as a fixture builds one. */
function department(
  key: DepartmentKey,
  type: DepartmentType,
  budget: number,
  actual: number,
  targetPercent: number,
): Department {
  return {
    key,
    labelKey: DEPARTMENT_LABEL_KEY[key],
    type,
    typeLabelKey: DEPARTMENT_TYPE_LABEL_KEY[type],
    budget,
    actual,
    targetPercent,
  };
}

async function byKey(key: DepartmentKey): Promise<Department> {
  const found = await repository.department(key);
  expect(found).not.toBeNull();
  return found!;
}

/* ------------------------------------------------------------------------ */

describe("Build Specification Hero 3 departments", () => {
  it("lists the six departments, each tagged Revenue or Cost", async () => {
    expect(await repository.departments()).toEqual([
      department(SPONSORING, DepartmentType.REVENUE, 21_000, 21_840, 104),
      department(
        DepartmentKey.TICKETING,
        DepartmentType.REVENUE,
        24_000,
        24_360,
        102,
      ),
      department(
        DepartmentKey.HOSPITALITY,
        DepartmentType.REVENUE,
        7_200,
        6_840,
        95,
      ),
      department(MERCHANDISING, DepartmentType.REVENUE, 9_800, 9_050, 92),
      department(
        DepartmentKey.EVENTS,
        DepartmentType.REVENUE,
        3_600,
        3_780,
        105,
      ),
      department(MARKETING, DepartmentType.COST, 3_400, 3_810, 84),
    ]);
  });

  it("has exactly one cost centre, and it is Marketing", async () => {
    const departments = await repository.departments();
    const costCentres = departments.filter(
      (department) => department.type === DepartmentType.COST,
    );

    expect(departments).toHaveLength(6);
    expect(costCentres).toHaveLength(1);
    expect(costCentres[0]?.key).toBe(MARKETING);
  });

  it("labels every type from the shared enum", async () => {
    for (const department of await repository.departments()) {
      expect(t(department.typeLabelKey)).toBe(
        t(DEPARTMENT_TYPE_LABEL_KEY[department.type]),
      );
    }
    expect({
      REVENUE: t(DEPARTMENT_TYPE_LABEL_KEY[DepartmentType.REVENUE]),
      COST: t(DEPARTMENT_TYPE_LABEL_KEY[DepartmentType.COST]),
    }).toEqual({ REVENUE: "Revenue", COST: "Cost" });
  });

  it("returns one department by key, and null for one it does not show", async () => {
    expect(await byKey(DepartmentKey.TICKETING)).toMatchObject({
      budget: 24_000,
      actual: 24_360,
      targetPercent: 102,
    });
    // @ts-expect-error — "Academy" is not a DepartmentKey, which is exactly
    // the protection keying the lookup buys.
    expect(await repository.department("Academy")).toBeNull();
  });

  it("states the club-wide blended target of 96%", async () => {
    const hero = await repository.hero();

    expect(hero.primary.blendedTargetPercent).toBe(96);
  });

  it("keeps the blended target a measurement, not a mean of the rows", async () => {
    const departments = await repository.departments();
    const targets = departments.map((department) => department.targetPercent);
    const plainMean =
      targets.reduce((total, value) => total + value, 0) / targets.length;
    const weightedMean =
      departments.reduce(
        (total, department) =>
          total + department.budget * department.targetPercent,
        0,
      ) / departments.reduce((total, d) => total + d.budget, 0);

    // 97.0 and 99.7 - neither is 96, which is why the 96 is stored rather than
    // computed. Pinned so nobody later "fixes" it into one of these.
    expect(Number(plainMean.toFixed(1))).toBe(97);
    expect(Number(weightedMean.toFixed(1))).toBe(99.7);
    expect((await repository.hero()).primary.blendedTargetPercent).not.toBe(97);
  });
});

/* ------------------------------------------------------------------------ */

describe("derived totals and the headline variance", () => {
  it("totals the departments at 69,000 -> 69,680, a variance of +680", async () => {
    const totals = departmentTotals(await repository.departments());

    expect(totals.budget).toBe(69_000);
    expect(totals.actual).toBe(69_680);
    expect(totals.variance).toBe(680);
  });

  it("derives +0.99%, displayed as +1.0%", async () => {
    const totals = departmentTotals(await repository.departments());

    expect(totals.variancePercent).toBe(1);
    expect(((totals.variance / totals.budget) * 100).toFixed(2)).toBe("0.99");
    // One rounding rule for the whole app: the same helper the baseline uses.
    expect(totals.variancePercent).toBe(percentChange(69_680, 69_000));
  });

  it("keeps the footer row equal to the sum of the rows above it", async () => {
    const departments = await repository.departments();
    const totals = departmentTotals(departments);
    const rows = departmentPerformanceRows(departments);

    expect(rows).toHaveLength(departments.length);
    expect(rows.reduce((total, row) => total + row.budget, 0)).toBe(
      totals.budget,
    );
    expect(rows.reduce((total, row) => total + row.actual, 0)).toBe(
      totals.actual,
    );
    expect(rows.reduce((total, row) => total + row.variance, 0)).toBe(
      totals.variance,
    );
  });

  it("never stores a total, a variance or a flag it could derive", async () => {
    const { primary } = await repository.hero();

    function keys(value: unknown, found: string[]): string[] {
      if (Array.isArray(value)) {
        for (const item of value) {
          keys(item, found);
        }
      } else if (value !== null && typeof value === "object") {
        for (const [key, item] of Object.entries(value)) {
          found.push(key);
          keys(item, found);
        }
      }
      return found;
    }

    // The Reference Guide stores totalBudget / totalActual and a Marketing
    // `flag`; none of them are ported.
    for (const key of keys(primary, [])) {
      expect(key).not.toMatch(/^(total|variance|delta|flag)/i);
    }
    expect(JSON.stringify(primary.departments)).not.toMatch(/69000|69680/);
  });

  it("derives each department's own variance from its two figures", async () => {
    for (const row of departmentPerformanceRows(
      await repository.departments(),
    )) {
      expect(row.variance).toBe(row.actual - row.budget);
      expect(row.variancePercent).toBe(percentChange(row.actual, row.budget));
    }
  });

  it("pins the two variances the narrative quotes", async () => {
    const merchandising = await byKey(MERCHANDISING);
    const marketing = await byKey(MARKETING);

    // -7.65% -> -7.7, quoted as "7.7% under"; +12.06% -> +12.1, quoted as "12% over".
    expect(departmentVariance(merchandising)).toBe(-750);
    expect(departmentVariancePercent(merchandising)).toBe(-7.7);
    expect(departmentVariance(marketing)).toBe(410);
    expect(departmentVariancePercent(marketing)).toBe(12.1);
  });

  it("pins the remaining four variances", async () => {
    const variances = new Map(
      (await repository.departments()).map((department) => [
        department.key,
        departmentVariance(department),
      ]),
    );

    expect(variances.get(SPONSORING)).toBe(840);
    expect(variances.get(DepartmentKey.TICKETING)).toBe(360);
    expect(variances.get(DepartmentKey.HOSPITALITY)).toBe(-360);
    expect(variances.get(DepartmentKey.EVENTS)).toBe(180);
  });
});

/* ------------------------------------------------------------------------ */

describe("Revenue versus Cost decides what a variance MEANS", () => {
  const revenue: Department = department(
    DepartmentKey.EVENTS,
    DepartmentType.REVENUE,
    1_000,
    1_000,
    100,
  );
  const cost: Department = { ...revenue, type: DepartmentType.COST };

  it("judges a revenue department above budget FAVOURABLE", () => {
    expect(varianceJudgement({ ...revenue, actual: 1_100 })).toBe(
      VarianceJudgement.FAVOURABLE,
    );
  });

  it("judges a revenue department below budget ADVERSE", () => {
    expect(varianceJudgement({ ...revenue, actual: 900 })).toBe(
      VarianceJudgement.ADVERSE,
    );
  });

  it("judges a cost centre above budget ADVERSE - it is an overspend", () => {
    expect(varianceJudgement({ ...cost, actual: 1_100 })).toBe(
      VarianceJudgement.ADVERSE,
    );
  });

  it("judges a cost centre below budget FAVOURABLE - it underspent", () => {
    expect(varianceJudgement({ ...cost, actual: 900 })).toBe(
      VarianceJudgement.FAVOURABLE,
    );
  });

  it("judges exactly on budget NEUTRAL, whichever the type", () => {
    expect(varianceJudgement(revenue)).toBe(VarianceJudgement.NEUTRAL);
    expect(varianceJudgement(cost)).toBe(VarianceJudgement.NEUTRAL);
  });

  it("judges Marketing's +410 ADVERSE even though the number is positive", async () => {
    const marketing = departmentPerformance(await byKey(MARKETING));

    expect(marketing.variance).toBeGreaterThan(0);
    expect(marketing.overBudget).toBe(true);
    expect(marketing.judgement).toBe(VarianceJudgement.ADVERSE);
    expect(t(VARIANCE_JUDGEMENT_LABEL_KEY[marketing.judgement])).toBe(
      "Adverse",
    );
  });

  it("judges Sponsoring's +840 FAVOURABLE - the same sign, the other reading", async () => {
    const sponsoring = departmentPerformance(await byKey(SPONSORING));

    expect(sponsoring.variance).toBeGreaterThan(0);
    expect(sponsoring.judgement).toBe(VarianceJudgement.FAVOURABLE);
  });

  it("would be got WRONG by a naive variance > 0 rule, for Marketing alone", async () => {
    const rows = departmentPerformanceRows(await repository.departments());
    const misread = rows.filter(
      (row) =>
        row.variance > 0 !== (row.judgement === VarianceJudgement.FAVOURABLE),
    );

    // This is the trap the tag exists to close: colouring by sign alone paints
    // the club's one problem department as a success.
    expect(misread.map((row) => row.key)).toEqual([MARKETING]);
  });

  it("gives every row a judgement, so no consumer has to infer one", async () => {
    const rows = departmentPerformanceRows(await repository.departments());

    for (const row of rows) {
      expect(Object.values(VarianceJudgement)).toContain(row.judgement);
      expect(row.judgement).toBe(varianceJudgement(row));
    }
    expect(
      rows
        .filter((row) => row.judgement === VarianceJudgement.FAVOURABLE)
        .map((row) => row.key),
    ).toEqual([SPONSORING, DepartmentKey.TICKETING, DepartmentKey.EVENTS]);
    expect(
      rows
        .filter((row) => row.judgement === VarianceJudgement.ADVERSE)
        .map((row) => row.key),
    ).toEqual([DepartmentKey.HOSPITALITY, MERCHANDISING, MARKETING]);
  });
});

/* ------------------------------------------------------------------------ */

describe("the one department both over budget and behind target", () => {
  it("finds exactly one, and it is Marketing", async () => {
    const flagged = departmentsNeedingAttention(await repository.departments());

    expect(flagged).toHaveLength(1);
    expect(flagged[0]?.key).toBe(MARKETING);
    expect(flagged[0]?.overBudget).toBe(true);
    expect(flagged[0]?.behindTarget).toBe(true);
  });

  it("derives the flag rather than reading a stored one", async () => {
    for (const row of departmentPerformanceRows(
      await repository.departments(),
    )) {
      expect(row.overBudget).toBe(row.actual > row.budget);
      expect(row.behindTarget).toBe(row.targetPercent < ON_TARGET_PERCENT);
      expect(row.needsAttention).toBe(row.overBudget && row.behindTarget);
    }
    expect(ON_TARGET_PERCENT).toBe(100);
  });

  it("has other departments over budget, and others behind target", async () => {
    const rows = departmentPerformanceRows(await repository.departments());

    // Neither half of the conjunction is rare on its own - which is why the
    // narrative's claim is about the two together.
    expect(rows.filter((row) => row.overBudget).map((row) => row.key)).toEqual([
      SPONSORING,
      DepartmentKey.TICKETING,
      DepartmentKey.EVENTS,
      MARKETING,
    ]);
    expect(
      rows.filter((row) => row.behindTarget).map((row) => row.key),
    ).toEqual([DepartmentKey.HOSPITALITY, MERCHANDISING, MARKETING]);
  });

  it("flags nothing when every department is on plan", () => {
    expect(
      departmentsNeedingAttention([
        department(DepartmentKey.EVENTS, DepartmentType.REVENUE, 100, 120, 105),
      ]),
    ).toEqual([]);
    expect(departmentTotals([])).toEqual({
      budget: 0,
      actual: 0,
      variance: 0,
      variancePercent: 0,
    });
  });
});

/* ------------------------------------------------------------------------ */

describe("the departments that hit their own outcome target", () => {
  it("finds three of six, and they are the ones at or above 100%", async () => {
    // The overall tile's "above target" count is the LENGTH of this list
    // (US-038), so it can never claim a department the table shows as short.
    const onTarget = departmentsOnTarget(await repository.departments());

    expect(onTarget.map((row) => row.key)).toEqual([
      SPONSORING,
      DepartmentKey.TICKETING,
      DepartmentKey.EVENTS,
    ]);
    for (const row of onTarget) {
      expect(row.targetPercent).toBeGreaterThanOrEqual(ON_TARGET_PERCENT);
      expect(row.behindTarget).toBe(false);
    }
  });

  it("excludes a near miss - 95% is still behind target", async () => {
    // The gold NEAR band is a presentation threshold in the table (US-022);
    // being behind target is a fact, and Hospitality is behind it.
    const onTarget = departmentsOnTarget(await repository.departments());

    expect(onTarget.map((row) => row.key)).not.toContain(
      DepartmentKey.HOSPITALITY,
    );
    expect(onTarget.map((row) => row.key)).not.toContain(MERCHANDISING);
    expect(onTarget.map((row) => row.key)).not.toContain(MARKETING);
  });

  it("is the exact complement of the departments behind target", async () => {
    const departments = await repository.departments();
    const rows = departmentPerformanceRows(departments);

    expect(departmentsOnTarget(departments)).toHaveLength(
      rows.filter((row) => !row.behindTarget).length,
    );
    expect(departmentsOnTarget([])).toEqual([]);
  });
});

/* ------------------------------------------------------------------------ */

describe("the Marketing follow-up", () => {
  it("names the three spend drivers, in CHF thousands over plan", async () => {
    const hero = await repository.hero();

    expect(
      hero.followUp.drivers.map((driver) => ({
        name: t(driver.labelKey),
        amount: driver.amount,
      })),
    ).toEqual([
      { name: "Match activations", amount: 240 },
      { name: "Paid social", amount: 150 },
      { name: "Agency retainer", amount: 20 },
    ]);
  });

  it("reconciles the drivers with Marketing's derived overspend", async () => {
    const hero = await repository.hero();
    const marketing = await byKey(MARKETING);

    expect(driverTotal(hero.followUp.drivers)).toBe(240 + 150 + 20);
    expect(driverTotal(hero.followUp.drivers)).toBe(
      departmentVariance(marketing),
    );
  });

  it("carries the webshop conversion gap: 2.2% against a 2.6% plan", async () => {
    const hero = await repository.hero();

    expect(hero.followUp.conversion).toEqual({
      actualPercent: 2.2,
      planPercent: 2.6,
    });
  });

  it("derives the shortfall as points, attainment and relative change", async () => {
    const hero = await repository.hero();
    const shortfall = conversionShortfall(hero.followUp.conversion);

    // 84.6% of plan - the "~85% of target" the acceptance criteria quote.
    expect(shortfall.attainmentPercent).toBe(84.6);
    expect(Math.round(shortfall.attainmentPercent)).toBe(85);
    // 0.4 percentage POINTS short, a 15.4% relative shortfall. Different numbers.
    expect(shortfall.gapPoints).toBe(-0.4);
    expect(shortfall.changePercent).toBe(-15.4);
  });

  it("returns zero attainment rather than Infinity when there is no plan", () => {
    expect(conversionShortfall({ actualPercent: 2.2, planPercent: 0 })).toEqual(
      { attainmentPercent: 0, gapPoints: 2.2, changePercent: 0 },
    );
    expect(driverTotal([])).toBe(0);
  });

  it("keeps the follow-up's subject derived, not stored", async () => {
    const hero = await repository.hero();

    // The follow-up carries drivers, a conversion gap and copy - not a second
    // copy of "Marketing", which is whatever the table flags.
    expect(Object.keys(hero.followUp).sort()).toEqual([
      "conversion",
      "drivers",
      "narrativeKey",
    ]);
    expect(JSON.stringify(hero.followUp.drivers)).not.toContain("Marketing");
  });
});

/* ------------------------------------------------------------------------ */

describe("the scope is labelled, not left to be inferred", () => {
  it("states the full-year departmental scope on the tile", async () => {
    const { primary } = await repository.hero();

    expect(t(primary.scopeLabelKey)).toBe(
      "Full-year departmental totals, budget against actual; Ticketing includes the season-ticket base, so it exceeds the sum of Hero 2's shown fixtures",
    );
  });

  it("names the season-ticket inclusion, which is what reconciles the heroes", async () => {
    const { primary } = await repository.hero();

    expect(t(primary.scopeLabelKey)).toMatch(/season-ticket base/);
    expect(t(primary.scopeLabelKey)).toMatch(/full-year/i);
    expect(t(primary.scopeLabelKey)).toMatch(/includes/);
  });

  it("explains why Ticketing here exceeds Hero 2's eight fixtures", async () => {
    const ticketing = await byKey(DepartmentKey.TICKETING);

    // 24,360 against Hero 2's 7,830. Intentional: this figure includes the
    // season-ticket base that Hero 2 excludes, and the label above is the only
    // thing that makes it read as such rather than as an arithmetic bug.
    expect(ticketing.actual).toBe(24_360);
    expect(ticketing.actual).toBeGreaterThan(7_830);
  });
});

/* ------------------------------------------------------------------------ */

describe("verbatim narratives", () => {
  const PRIMARY =
    "Most departments are on or ahead of plan. Two need attention: Merchandising is 7.7% under its revenue target, and Marketing & Communications is 12% over its spend budget while sitting at 84% of its outcome target - the only department both over budget and behind target.";
  const FOLLOW_UP =
    "Marketing's overspend is concentrated in two areas: the derby and YB match activations ran about CHF 240k over plan combined, and paid-social spend rose 18% chasing a webshop conversion target that underdelivered - conversion landed at 2.2% against a 2.6% plan. Recommendation: pause the incremental paid-social spend and reallocate about CHF 150k to the matchday activations that did convert, and revisit the conversion target with Webshop before the winter campaign.";

  it("carries the primary narrative character for character", async () => {
    const hero = await repository.hero();

    expect(t(hero.primary.narrativeKey)).toBe(PRIMARY);
    expect(t(hero.primary.narrativeKey)).toHaveLength(270);
  });

  it("carries the follow-up narrative character for character", async () => {
    const hero = await repository.hero();

    expect(t(hero.followUp.narrativeKey)).toBe(FOLLOW_UP);
    expect(t(hero.followUp.narrativeKey)).toHaveLength(468);
  });

  it("quotes figures the data actually holds", async () => {
    const hero = await repository.hero();
    const merchandising = await byKey(MERCHANDISING);
    const marketing = await byKey(MARKETING);
    const flagged = departmentsNeedingAttention(hero.primary.departments);

    expect(t(hero.primary.narrativeKey)).toContain(
      `${Math.abs(departmentVariancePercent(merchandising))}% under`,
    );
    expect(t(hero.primary.narrativeKey)).toContain(
      `${Math.round(departmentVariancePercent(marketing))}% over`,
    );
    expect(t(hero.primary.narrativeKey)).toContain(
      `${marketing.targetPercent}% of its outcome target`,
    );
    expect(t(hero.primary.narrativeKey)).toContain(
      "the only department both over budget and behind target",
    );
    expect(flagged).toHaveLength(1);
    expect(t(hero.primary.narrativeKey)).toContain(
      departmentName(flagged[0]!.key),
    );

    const [activations, paidSocial] = hero.followUp.drivers;
    expect(t(hero.followUp.narrativeKey)).toContain(
      `CHF ${activations?.amount}k over plan`,
    );
    expect(t(hero.followUp.narrativeKey)).toContain(
      `CHF ${paidSocial?.amount}k`,
    );
    expect(t(hero.followUp.narrativeKey)).toContain(
      `${hero.followUp.conversion.actualPercent}% against a ${hero.followUp.conversion.planPercent}% plan`,
    );
  });

  it("stays ASCII: hyphens only, no typographic dashes or quotes", async () => {
    const hero = await repository.hero();

    for (const narrative of [
      t(hero.primary.narrativeKey),
      t(hero.followUp.narrativeKey),
    ]) {
      expect(narrative).not.toMatch(/[–—]/);
      expect(narrative).toMatch(/^[\x20-\x7E]*$/);
    }
  });
});

/* ------------------------------------------------------------------------ */

describe("dataset hygiene", () => {
  function collectStrings(value: unknown, found: string[]): string[] {
    if (typeof value === "string") {
      found.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        collectStrings(item, found);
      }
    } else if (value !== null && typeof value === "object") {
      for (const item of Object.values(value)) {
        collectStrings(item, found);
      }
    }
    return found;
  }

  async function everyString(): Promise<string[]> {
    return collectStrings(await repository.hero(), []);
  }

  /**
   * Every string EXCEPT the two narratives. The narratives are verbatim copy
   * and do say "CHF 240k" out loud; the data around them must not.
   */
  async function everyDataString(): Promise<string[]> {
    const hero = await repository.hero();
    const narratives = [
      t(hero.primary.narrativeKey),
      t(hero.followUp.narrativeKey),
    ];
    return (await everyString()).filter((value) => !narratives.includes(value));
  }

  it("uses hyphens only - no em or en dashes anywhere", async () => {
    for (const value of await everyString()) {
      expect(value).not.toMatch(/[–—]/);
    }
  });

  it("keeps every string ASCII", async () => {
    for (const value of await everyString()) {
      expect(value).toMatch(/^[\x20-\x7E]*$/);
    }
  });

  it("stores clean numbers, never pre-formatted money", async () => {
    for (const value of await everyDataString()) {
      expect(value).not.toMatch(/CHF/);
      expect(value).not.toMatch(/\d,\d{3}/);
    }
    for (const department of await repository.departments()) {
      expect(typeof department.budget).toBe("number");
      expect(typeof department.actual).toBe("number");
      expect(typeof department.targetPercent).toBe("number");
    }
    for (const driver of (await repository.hero()).followUp.drivers) {
      expect(typeof driver.amount).toBe("number");
    }
  });

  it("holds departments only: no salary, headcount or named individual", async () => {
    const serialised = JSON.stringify(await repository.hero()).toLowerCase();

    expect(serialised).not.toMatch(
      /salary|salaries|wage|bonus|headcount|fte|employee|payroll/,
    );
    // No named individual, and no per-person attainment. Squad names live in
    // Hero 1's printed-name counts and nowhere else.
    for (const name of ["Shaqiri", "Sow", "Metinho", "Daniliuc"]) {
      expect(serialised).not.toContain(name.toLowerCase());
    }
  });
});

/* ------------------------------------------------------------------------ */

describe("server-side repository selection", () => {
  it("exposes the mock implementation through index.server", async () => {
    const departments = await hero3Repository.departments();
    const totals = departmentTotals(departments);

    expect(departments).toHaveLength(6);
    expect(totals.actual).toBe(69_680);
    expect(totals.variancePercent).toBe(1);
    expect(
      departmentsNeedingAttention(departments).map(
        (department) => department.key,
      ),
    ).toEqual([MARKETING]);
    expect(await hero3Repository.department(MARKETING)).not.toBeNull();
  });
});
