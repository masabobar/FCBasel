import { describe, expect, it } from "vitest";

import { monthKeyAt } from "../../app/lib/calendar";
import { createMockHero2Repository } from "../../app/lib/mock/hero2";
import {
  declineTotal,
  fixtureDeclines,
  fixtureSeries,
  fixtureTotals,
  monthlySeries,
  monthlyTotals,
  percentChange,
} from "../../app/lib/repositories/derive";
import {
  MONTH_LABEL_KEY,
  MonthKey,
  SEASON_LABEL_KEY,
  SeasonKey,
} from "../../app/lib/repositories/enums";
import { hero2Repository } from "../../app/lib/repositories/index.server";
import { type Hero2Repository } from "../../app/lib/repositories/types";
import { t } from "./support/i18n";

const repository: Hero2Repository = createMockHero2Repository();

/* ------------------------------------------------------------------------ */

describe("Build Specification Hero 2 fixtures", () => {
  it("lists the eight highest-grossing home fixtures, 25/26 against 26/27", async () => {
    expect(await repository.fixtures()).toEqual([
      { opponent: "YB", previous: 1_480, current: 1_610 },
      { opponent: "FCZ", previous: 1_390, current: 1_240 },
      { opponent: "Servette", previous: 980, current: 1_050 },
      { opponent: "St. Gallen", previous: 1_020, current: 1_090 },
      { opponent: "Luzern", previous: 890, current: 820 },
      { opponent: "Sion", previous: 760, current: 690 },
      { opponent: "GC", previous: 640, current: 720 },
      { opponent: "Lugano", previous: 720, current: 610 },
    ]);
  });

  it("names the two seasons once, from the shared enum", async () => {
    const hero = await repository.hero();

    expect(hero.primary.previousSeason).toEqual({
      key: SeasonKey.SEASON_25_26,
      labelKey: SEASON_LABEL_KEY[SeasonKey.SEASON_25_26],
    });
    expect(hero.primary.currentSeason).toEqual({
      key: SeasonKey.SEASON_26_27,
      labelKey: SEASON_LABEL_KEY[SeasonKey.SEASON_26_27],
    });
    expect(t(hero.primary.previousSeason.labelKey)).toBe(
      t(SEASON_LABEL_KEY[SeasonKey.SEASON_25_26]),
    );
    expect(t(hero.primary.currentSeason.labelKey)).toBe(
      t(SEASON_LABEL_KEY[SeasonKey.SEASON_26_27]),
    );
  });

  it("has YB, Servette, St. Gallen and GC up; FCZ, Lugano, Sion, Luzern down", async () => {
    const movement = new Map(
      (await repository.fixtures()).map((fixture) => [
        fixture.opponent,
        fixture.current - fixture.previous,
      ]),
    );

    for (const opponent of ["YB", "Servette", "St. Gallen", "GC"]) {
      expect(movement.get(opponent)).toBeGreaterThan(0);
    }
    for (const opponent of ["FCZ", "Lugano", "Sion", "Luzern"]) {
      expect(movement.get(opponent)).toBeLessThan(0);
    }
  });

  it("returns one fixture by opponent, and null for one it does not show", async () => {
    expect(await repository.fixture("FCZ")).toEqual({
      opponent: "FCZ",
      previous: 1_390,
      current: 1_240,
    });
    expect(await repository.fixture("Winterthur")).toBeNull();
  });
});

/* ------------------------------------------------------------------------ */

describe("derived totals and the headline delta", () => {
  it("totals the fixtures at 7,880 -> 7,830, a fall of 50", async () => {
    const totals = fixtureTotals(await repository.fixtures());

    expect(totals.previous).toBe(7_880);
    expect(totals.current).toBe(7_830);
    expect(totals.delta).toBe(-50);
  });

  it("derives -0.63%, displayed as -0.6%", async () => {
    const totals = fixtureTotals(await repository.fixtures());

    expect(totals.deltaPercent).toBe(-0.6);
    expect(((totals.delta / totals.previous) * 100).toFixed(2)).toBe("-0.63");
    // One rounding rule for the whole app: the same helper the baseline uses.
    expect(totals.deltaPercent).toBe(percentChange(7_830, 7_880));
  });

  it("never stores a total or a delta it could derive", async () => {
    const serialised = JSON.stringify((await repository.hero()).primary);

    // The Reference Guide stores totalPrev / totalCurr / deltaPct; we do not.
    expect(serialised).not.toMatch(/total/i);
    expect(serialised).not.toMatch(/delta/i);
    expect(serialised).not.toMatch(/7880|7830/);
  });

  it("keeps the headline equal to the sum of the bars it sits over", async () => {
    const fixtures = await repository.fixtures();
    const series = fixtureSeries(fixtures);
    const totals = fixtureTotals(fixtures);

    expect(series.labels).toHaveLength(fixtures.length);
    expect(series.current).toHaveLength(fixtures.length);
    expect(series.previous).toHaveLength(fixtures.length);
    expect(series.current.reduce((sum, value) => sum + value, 0)).toBe(
      totals.current,
    );
    expect(series.previous.reduce((sum, value) => sum + value, 0)).toBe(
      totals.previous,
    );
    expect(series.labels).toEqual(fixtures.map((fixture) => fixture.opponent));
  });
});

/* ------------------------------------------------------------------------ */

describe("derived declining fixtures", () => {
  it("finds FCZ -150, Lugano -110, Luzern -70, Sion -70, biggest first", async () => {
    expect(fixtureDeclines(await repository.fixtures())).toEqual([
      { opponent: "FCZ", drop: 150 },
      { opponent: "Lugano", drop: 110 },
      { opponent: "Luzern", drop: 70 },
      { opponent: "Sion", drop: 70 },
    ]);
  });

  it("derives every decline from its fixture pair", async () => {
    const fixtures = await repository.fixtures();
    const byOpponent = new Map(
      fixtures.map((fixture) => [fixture.opponent, fixture]),
    );

    for (const decline of fixtureDeclines(fixtures)) {
      const fixture = byOpponent.get(decline.opponent);
      expect(fixture).toBeDefined();
      expect(decline.drop).toBe(fixture!.previous - fixture!.current);
      expect(decline.drop).toBeGreaterThan(0);
    }
  });

  it("totals the declines at exactly 400 - the tile's badge", async () => {
    const fixtures = await repository.fixtures();

    expect(declineTotal(fixtures)).toBe(400);
    expect(declineTotal(fixtures)).toBe(150 + 110 + 70 + 70);
  });

  it("makes FCZ the single biggest drop", async () => {
    const declines = fixtureDeclines(await repository.fixtures());
    const drops = declines.map((decline) => decline.drop);

    expect(declines[0]?.opponent).toBe("FCZ");
    expect(drops.filter((drop) => drop === Math.max(...drops))).toHaveLength(1);
  });

  it("shows no decline when every fixture grew", () => {
    expect(
      fixtureDeclines([{ opponent: "YB", previous: 100, current: 120 }]),
    ).toEqual([]);
    expect(declineTotal([])).toBe(0);
  });
});

/* ------------------------------------------------------------------------ */

describe("month-by-month series", () => {
  it("runs twelve months, July to June", async () => {
    const months = await repository.monthly();

    expect(months).toHaveLength(12);
    expect(months.map((month) => month.month)).toEqual([
      MonthKey.JULY,
      MonthKey.AUGUST,
      MonthKey.SEPTEMBER,
      MonthKey.OCTOBER,
      MonthKey.NOVEMBER,
      MonthKey.DECEMBER,
      MonthKey.JANUARY,
      MonthKey.FEBRUARY,
      MonthKey.MARCH,
      MonthKey.APRIL,
      MonthKey.MAY,
      MonthKey.JUNE,
    ]);
    expect(new Set(months.map((month) => month.month)).size).toBe(12);
  });

  it("carries one value per season for every month", async () => {
    const months = await repository.monthly();

    expect(months.map((month) => month.previous)).toEqual([
      180, 920, 1_180, 1_040, 860, 640, 720, 980, 1_120, 1_060, 980, 200,
    ]);
    expect(months.map((month) => month.current)).toEqual([
      210, 980, 1_240, 990, 820, 610, 690, 1_010, 1_080, 1_020, 940, 180,
    ]);
    for (const month of months) {
      expect(Number.isFinite(month.previous)).toBe(true);
      expect(Number.isFinite(month.current)).toBe(true);
    }
  });

  it("labels every month from the shared enum", async () => {
    for (const month of await repository.monthly()) {
      expect(t(month.labelKey)).toBe(t(MONTH_LABEL_KEY[month.month]));
    }
  });

  it("spells month names the way the baseline band's calendar does", async () => {
    const monthNumber: Record<MonthKey, number> = {
      JANUARY: 0,
      FEBRUARY: 1,
      MARCH: 2,
      APRIL: 3,
      MAY: 4,
      JUNE: 5,
      JULY: 6,
      AUGUST: 7,
      SEPTEMBER: 8,
      OCTOBER: 9,
      NOVEMBER: 10,
      DECEMBER: 11,
    };

    for (const month of await repository.monthly()) {
      // The season axis and the baseline band's rolling axis name a month
      // through the SAME key map, so the two spellings cannot drift.
      expect(month.labelKey).toBe(
        MONTH_LABEL_KEY[
          monthKeyAt(new Date(2026, monthNumber[month.month], 1), 0)
        ],
      );
    }
  });

  it("keeps the plotted series aligned with the axis", async () => {
    const months = await repository.monthly();
    const series = monthlySeries(months, t);

    expect(series.labels).toEqual(months.map((month) => t(month.labelKey)));
    expect(series.current).toHaveLength(series.labels.length);
    expect(series.previous).toHaveLength(series.labels.length);
  });
});

/* ------------------------------------------------------------------------ */

describe("the two scopes are labelled, not left to be inferred", () => {
  it("states a scope on each of the two series", async () => {
    const { fixtures, monthly } = (await repository.hero()).primary;

    expect(t(fixtures.scopeLabelKey)).toBe(
      "Eight highest-grossing home fixtures, matchday ticket revenue excluding the season-ticket base",
    );
    expect(t(monthly.scopeLabelKey)).toBe(
      "All home fixtures per month, matchday ticket revenue excluding the season-ticket base",
    );
  });

  it("gives the two charts DIFFERENT scope labels", async () => {
    const { fixtures, monthly } = (await repository.hero()).primary;

    expect(t(fixtures.scopeLabelKey)).not.toBe(t(monthly.scopeLabelKey));
    expect(t(fixtures.scopeLabelKey)).toMatch(/eight/i);
    expect(t(monthly.scopeLabelKey)).toMatch(/all home fixtures/i);
    for (const label of [t(fixtures.scopeLabelKey), t(monthly.scopeLabelKey)]) {
      expect(label).toMatch(/season-ticket base/);
    }
  });

  it("explains why the monthly total is the larger of the two", async () => {
    const hero = await repository.hero();
    const fixtures = fixtureTotals(hero.primary.fixtures.fixtures);
    const months = monthlyTotals(hero.primary.monthly.months);

    // 9,880 -> 9,770 against 7,880 -> 7,830. Intentional: a wider scope, and
    // the labels above are the only thing that makes it read as such.
    expect(months.previous).toBe(9_880);
    expect(months.current).toBe(9_770);
    expect(months.previous).toBeGreaterThan(fixtures.previous);
    expect(months.current).toBeGreaterThan(fixtures.current);
  });

  it("has both scopes falling year on year", async () => {
    const hero = await repository.hero();

    expect(fixtureTotals(hero.primary.fixtures.fixtures).delta).toBeLessThan(0);
    expect(monthlyTotals(hero.primary.monthly.months).delta).toBeLessThan(0);
  });
});

/* ------------------------------------------------------------------------ */

describe("verbatim narratives", () => {
  const PRIMARY =
    "Overall matchday ticket revenue is roughly flat year on year (-0.6%), but it varies sharply by fixture: YB, Servette and St. Gallen are up, while FCZ, Lugano and Sion are down. The FCZ match is the single biggest drop, -CHF 150k.";
  const FOLLOW_UP =
    "Four fixtures account for the decline: FCZ (-CHF 150k), Lugano (-110k), Luzern (-70k) and Sion (-70k). In each, the fall is driven by lower attendance rather than pricing - the FCZ match sold about 3,200 fewer seats year on year, partly a Friday-night kick-off and partly a reduced away allocation. YB, by contrast, sold out both seasons.";

  it("carries the primary narrative character for character", async () => {
    const hero = await repository.hero();

    expect(t(hero.primary.narrativeKey)).toBe(PRIMARY);
    expect(t(hero.primary.narrativeKey)).toHaveLength(229);
  });

  it("carries the follow-up narrative character for character", async () => {
    const hero = await repository.hero();

    expect(t(hero.followUp.narrativeKey)).toBe(FOLLOW_UP);
    expect(t(hero.followUp.narrativeKey)).toHaveLength(338);
  });

  it("quotes figures the data actually holds", async () => {
    const hero = await repository.hero();
    const fixtures = hero.primary.fixtures.fixtures;
    const totals = fixtureTotals(fixtures);
    const declines = fixtureDeclines(fixtures);

    expect(t(hero.primary.narrativeKey)).toContain(`(${totals.deltaPercent}%)`);
    expect(t(hero.primary.narrativeKey)).toContain(
      `single biggest drop, -CHF ${declines[0]?.drop}k`,
    );
    for (const decline of declines.slice(1)) {
      expect(t(hero.followUp.narrativeKey)).toContain(`(-${decline.drop}k)`);
    }
    expect(t(hero.followUp.narrativeKey)).toContain(
      `FCZ (-CHF ${declines[0]?.drop}k)`,
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
   * and do say "CHF 150k" and "3,200" out loud; the data around them must not.
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
    for (const fixture of await repository.fixtures()) {
      expect(typeof fixture.previous).toBe("number");
      expect(typeof fixture.current).toBe("number");
    }
  });

  it("holds club fixtures only: no player, salary or performance data", async () => {
    const serialised = JSON.stringify(await repository.hero()).toLowerCase();

    expect(serialised).not.toMatch(
      /salary|wage|goals|assists|appearances|minutes|rating/,
    );
    // Squad names live in Hero 1's printed-name counts and nowhere else.
    for (const name of ["Shaqiri", "Sow", "Metinho", "Daniliuc"]) {
      expect(serialised).not.toContain(name.toLowerCase());
    }
  });
});

/* ------------------------------------------------------------------------ */

describe("server-side repository selection", () => {
  it("exposes the mock implementation through index.server", async () => {
    const hero = await hero2Repository.hero();

    expect(await hero2Repository.fixtures()).toHaveLength(8);
    expect(await hero2Repository.monthly()).toHaveLength(12);
    expect(fixtureTotals(hero.primary.fixtures.fixtures).deltaPercent).toBe(
      -0.6,
    );
  });
});
