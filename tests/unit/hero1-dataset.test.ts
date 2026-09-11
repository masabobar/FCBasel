import { describe, expect, it } from "vitest";

import { createMockHero1Repository } from "../../app/lib/mock/hero1";
import {
  SHIRT_PRICE_CHF,
  badgeSegments,
  badgeShare,
  homeKitShare,
  kitRevenueRows,
  kitRevenueTotal,
  kitUnitsTotal,
} from "../../app/lib/repositories/derive";
import {
  KIT_VARIANT_LABEL_KEY,
  KitVariant,
  PERIOD_LABEL_KEY,
  PeriodKey,
} from "../../app/lib/repositories/enums";
import { hero1Repository } from "../../app/lib/repositories/index.server";
import {
  type Hero1Period,
  type Hero1Repository,
} from "../../app/lib/repositories/types";
import { t } from "./support/i18n";

const repository: Hero1Repository = createMockHero1Repository();

async function periodFor(key: PeriodKey): Promise<Hero1Period> {
  const period = await repository.period(key);
  if (period === null) {
    throw new Error(`missing hero 1 period ${key}`);
  }
  return period;
}

function unitsByVariant(period: Hero1Period): Record<string, number> {
  return Object.fromEntries(period.kits.map((kit) => [kit.variant, kit.units]));
}

/* ------------------------------------------------------------------------ */

describe("Build Specification Hero 1 figures", () => {
  it("splits season-to-date kit sales 22,400 / 10,300 / 5,800", async () => {
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);

    expect(unitsByVariant(season)).toEqual({
      HOME: 22_400,
      AWAY: 10_300,
      THIRD: 5_800,
    });
    expect(kitUnitsTotal(season)).toBe(38_500);
  });

  it("puts 3,080 shirts on a sponsor badge, exactly 8% of units", async () => {
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);

    expect(season.badgeTotal).toBe(3_080);
    expect(badgeShare(season)).toBe(0.08);
  });

  it("splits badges Bitpanda 44, Sunrise 24, Allianz 20, IWB 12", async () => {
    const hero = await repository.hero();

    expect(hero.primary.badgeSplit).toEqual([
      { sponsor: "Bitpanda", percent: 44 },
      { sponsor: "Sunrise", percent: 24 },
      { sponsor: "Allianz", percent: 20 },
      { sponsor: "IWB", percent: 12 },
    ]);
    const percentTotal = hero.primary.badgeSplit.reduce(
      (total, share) => total + share.percent,
      0,
    );
    expect(percentTotal).toBe(100);
  });

  it("lists the five most printed names season to date", async () => {
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);

    expect(season.printedNames).toEqual([
      { name: "Shaqiri", units: 3_180 },
      { name: "Sow", units: 1_240 },
      { name: "Metinho", units: 1_080 },
      { name: "Custom", units: 920 },
      { name: "Daniliuc", units: 760 },
    ]);
  });

  it("records the badge trend over the last three drops", async () => {
    const hero = await repository.hero();

    expect(hero.followUp.trend).toEqual([
      // Flat-to-slightly-up, as the follow-up narrative puts it.
      { sponsor: "Bitpanda", deltaPercent: 2 },
      { sponsor: "Sunrise", deltaPercent: 38 },
      { sponsor: "Allianz", deltaPercent: 6 },
      { sponsor: "IWB", deltaPercent: -3 },
    ]);
  });

  it("states the scope the figures cover", async () => {
    const hero = await repository.hero();

    expect(t(hero.primary.scopeLabelKey)).toBe("Season-to-date merchandising");
  });
});

/* ------------------------------------------------------------------------ */

describe("derived kit revenue and shares", () => {
  it("prices every shirt at CHF 99", () => {
    expect(SHIRT_PRICE_CHF).toBe(99);
  });

  it("derives season-to-date revenue at 2.218M / 1.020M / 0.574M", async () => {
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);

    expect(kitRevenueRows(season)).toEqual([
      {
        variant: KitVariant.HOME,
        labelKey: KIT_VARIANT_LABEL_KEY[KitVariant.HOME],
        units: 22_400,
        revenue: 2_217_600,
      },
      {
        variant: KitVariant.AWAY,
        labelKey: KIT_VARIANT_LABEL_KEY[KitVariant.AWAY],
        units: 10_300,
        revenue: 1_019_700,
      },
      {
        variant: KitVariant.THIRD,
        labelKey: KIT_VARIANT_LABEL_KEY[KitVariant.THIRD],
        units: 5_800,
        revenue: 574_200,
      },
    ]);
  });

  it("totals season-to-date revenue at CHF 3,811,500 (~3.81M)", async () => {
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);

    expect(kitRevenueTotal(season)).toBe(3_811_500);
    expect(Number((kitRevenueTotal(season) / 1_000_000).toFixed(2))).toBe(3.81);
  });

  it("keeps the total equal to the sum of its rows in every period", async () => {
    for (const period of await repository.periods()) {
      const rowSum = kitRevenueRows(period).reduce(
        (total, row) => total + row.revenue,
        0,
      );
      expect(kitRevenueTotal(period)).toBe(rowSum);
      expect(kitUnitsTotal(period)).toBe(
        period.kits.reduce((total, kit) => total + kit.units, 0),
      );
    }
  });

  it("derives the Home share as 58.18%, displayed as 58%", async () => {
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);

    expect(homeKitShare(season)).toBeCloseTo(0.5818, 4);
    expect(Math.round(homeKitShare(season) * 100)).toBe(58);
  });

  it("never stores a share or a revenue figure it could derive", async () => {
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);
    const serialised = JSON.stringify(season);

    // The Reference Guide stores `homeShare: 58`; this dataset must not.
    expect(serialised).not.toMatch(/share/i);
    expect(serialised).not.toMatch(/revenue/i);
    expect(serialised).not.toMatch(/total.*3811500/i);
  });

  it("keeps the Home kit the best seller in every period", async () => {
    for (const period of await repository.periods()) {
      expect(homeKitShare(period)).toBeGreaterThan(0.5);
      const units = period.kits.map((kit) => kit.units);
      expect([...units].sort((a, b) => b - a)).toEqual(units);
    }
  });

  it("returns a zero share rather than dividing by zero", () => {
    const empty: Hero1Period = {
      key: PeriodKey.SEASON_TO_DATE,
      labelKey: PERIOD_LABEL_KEY[PeriodKey.SEASON_TO_DATE],
      kits: [],
      badgeTotal: 0,
      printedNames: [],
    };

    expect(homeKitShare(empty)).toBe(0);
    expect(badgeShare(empty)).toBe(0);
    expect(kitRevenueTotal(empty)).toBe(0);
  });

  it("returns a zero Home share when no Home kit is listed", () => {
    const awayOnly: Hero1Period = {
      key: PeriodKey.SEASON_TO_DATE,
      labelKey: PERIOD_LABEL_KEY[PeriodKey.SEASON_TO_DATE],
      kits: [
        {
          variant: KitVariant.AWAY,
          labelKey: KIT_VARIANT_LABEL_KEY[KitVariant.AWAY],
          units: 100,
        },
      ],
      badgeTotal: 0,
      printedNames: [],
    };

    expect(homeKitShare(awayOnly)).toBe(0);
  });
});

/* ------------------------------------------------------------------------ */

describe("badge segments reconcile with the badge total", () => {
  it("splits the season-to-date total 1,355 / 739 / 616 / 370", async () => {
    const hero = await repository.hero();
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);

    expect(badgeSegments(season.badgeTotal, hero.primary.badgeSplit)).toEqual([
      { sponsor: "Bitpanda", percent: 44, value: 1_355 },
      { sponsor: "Sunrise", percent: 24, value: 739 },
      { sponsor: "Allianz", percent: 20, value: 616 },
      { sponsor: "IWB", percent: 12, value: 370 },
    ]);
  });

  it("sums exactly to the total in all four periods", async () => {
    const hero = await repository.hero();

    for (const period of hero.primary.periods) {
      const segments = badgeSegments(
        period.badgeTotal,
        hero.primary.badgeSplit,
      );
      const segmentSum = segments.reduce(
        (total, segment) => total + segment.value,
        0,
      );

      expect(segmentSum).toBe(period.badgeTotal);
      expect(segments).toHaveLength(4);
    }
  });

  it("keeps Bitpanda the largest segment in every period", async () => {
    const hero = await repository.hero();

    for (const period of hero.primary.periods) {
      const segments = badgeSegments(
        period.badgeTotal,
        hero.primary.badgeSplit,
      );
      const values = segments.map((segment) => segment.value);

      expect(segments[0]?.sponsor).toBe("Bitpanda");
      expect(Math.max(...values)).toBe(values[0]);
    }
  });
});

/* ------------------------------------------------------------------------ */

describe("Hero 1 periods", () => {
  it("offers four periods, season to date first", async () => {
    const periods = await repository.periods();

    expect(periods.map((period) => period.key)).toEqual([
      PeriodKey.SEASON_TO_DATE,
      PeriodKey.LAST_3_MONTHS,
      PeriodKey.LAST_MONTH,
      PeriodKey.THIS_MONTH,
    ]);
    expect(periods.map((period) => t(period.labelKey))).toEqual([
      "Season to date",
      "Last 3 months",
      "Last month",
      "Current month",
    ]);
  });

  it('says "Current month" where the baseline band says "This month"', async () => {
    const currentMonth = await periodFor(PeriodKey.THIS_MONTH);

    expect(t(currentMonth.labelKey)).toBe("Current month");
    expect(t(PERIOD_LABEL_KEY[PeriodKey.THIS_MONTH])).toBe("This month");
  });

  it("takes every other label from the shared enum", async () => {
    const periods = await repository.periods();

    for (const period of periods) {
      if (period.key !== PeriodKey.THIS_MONTH) {
        expect(t(period.labelKey)).toBe(t(PERIOD_LABEL_KEY[period.key]));
      }
    }
  });

  it("gives every period the same three kits and five names", async () => {
    const periods = await repository.periods();

    expect(periods).toHaveLength(4);
    for (const period of periods) {
      expect(period.kits.map((kit) => kit.variant)).toEqual([
        KitVariant.HOME,
        KitVariant.AWAY,
        KitVariant.THIRD,
      ]);
      for (const kit of period.kits) {
        expect(t(kit.labelKey)).toBe(t(KIT_VARIANT_LABEL_KEY[kit.variant]));
      }
      expect(period.printedNames.map((entry) => entry.name)).toEqual([
        "Shaqiri",
        "Sow",
        "Metinho",
        "Custom",
        "Daniliuc",
      ]);
    }
  });

  it("orders printed names most-printed first in every period", async () => {
    for (const period of await repository.periods()) {
      const units = period.printedNames.map((entry) => entry.units);
      expect([...units].sort((a, b) => b - a)).toEqual(units);
    }
  });

  it("keeps the badge share near 8% in every period", async () => {
    for (const period of await repository.periods()) {
      expect(badgeShare(period)).toBeGreaterThan(0.07);
      expect(badgeShare(period)).toBeLessThan(0.09);
    }
  });

  it("narrows monotonically from season to date down to the current month", async () => {
    const [season, quarter, lastMonth, currentMonth] =
      await repository.periods();

    const totals = [season, quarter, lastMonth, currentMonth].map((period) =>
      kitUnitsTotal(period!),
    );
    expect([...totals].sort((a, b) => b - a)).toEqual(totals);
  });

  it("returns null for an unknown period key", async () => {
    expect(await repository.period("NEXT_SEASON" as PeriodKey)).toBeNull();
  });
});

/* ------------------------------------------------------------------------ */

describe("verbatim narratives", () => {
  const PRIMARY =
    "Pulled from Merchandising, Webshop and flock-printing. The Home kit drives 58% of shirt sales; about 8% of shirts carry a sponsor badge, with Bitpanda the most printed; Shaqiri is comfortably the most printed name.";
  const FOLLOW_UP =
    "Bitpanda already leads badge selection, but Sunrise is growing fastest - up 38% over the last three drops off a smaller base. Recommendation: feature Sunrise in the next drop to convert its momentum, while keeping Bitpanda as the default option.";

  it("carries the primary narrative character for character", async () => {
    const hero = await repository.hero();

    expect(t(hero.primary.narrativeKey)).toBe(PRIMARY);
    expect(t(hero.primary.narrativeKey)).toHaveLength(214);
  });

  it("carries the follow-up narrative character for character", async () => {
    const hero = await repository.hero();

    expect(t(hero.followUp.narrativeKey)).toBe(FOLLOW_UP);
    expect(t(hero.followUp.narrativeKey)).toHaveLength(245);
  });

  it("quotes figures the data actually holds", async () => {
    const hero = await repository.hero();
    const season = await periodFor(PeriodKey.SEASON_TO_DATE);
    const trend = new Map(
      hero.followUp.trend.map((entry) => [entry.sponsor, entry.deltaPercent]),
    );

    // Every number spoken in the copy is derived from the dataset beneath it.
    expect(t(hero.primary.narrativeKey)).toContain(
      `${Math.round(homeKitShare(season) * 100)}% of shirt sales`,
    );
    expect(t(hero.primary.narrativeKey)).toContain(
      `about ${Math.round(badgeShare(season) * 100)}% of shirts`,
    );
    expect(t(hero.followUp.narrativeKey)).toContain(
      `up ${trend.get("Sunrise")}% over the last three drops`,
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

  it("uses hyphens only - no em or en dashes anywhere", async () => {
    for (const value of await everyString()) {
      expect(value).not.toMatch(/[–—]/);
    }
  });

  it("stores clean numbers, never pre-formatted money", async () => {
    for (const value of await everyString()) {
      expect(value).not.toMatch(/CHF/);
      expect(value).not.toMatch(/\d,\d{3}/);
    }
  });

  it("holds print counts only: no salary or performance data", async () => {
    const serialised = JSON.stringify(await repository.periods()).toLowerCase();

    expect(serialised).not.toMatch(
      /salary|wage|goals|assists|appearances|minutes|rating/,
    );
  });

  it("names squad members only as printed-name rows", async () => {
    const squad = ["Shaqiri", "Sow", "Metinho", "Daniliuc"];
    const hero = await repository.hero();

    for (const period of hero.primary.periods) {
      const printed = period.printedNames.map((entry) => entry.name);
      for (const name of squad) {
        expect(printed).toContain(name);
        expect(period.kits.map((kit) => t(kit.labelKey))).not.toContain(name);
      }
    }
    for (const name of squad) {
      expect(hero.followUp.trend.map((entry) => entry.sponsor)).not.toContain(
        name,
      );
    }
  });
});

/* ------------------------------------------------------------------------ */

describe("server-side repository selection", () => {
  it("exposes the mock implementation through index.server", async () => {
    const hero = await hero1Repository.hero();
    const periods = await hero1Repository.periods();

    expect(periods).toHaveLength(4);
    expect(hero.primary.periods).toHaveLength(4);
    expect(kitUnitsTotal(hero.primary.periods[0]!)).toBe(38_500);
  });
});
