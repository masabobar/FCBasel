import { beforeEach, describe, expect, it } from "vitest";

import { createMockBaselineRepository } from "../../app/lib/mock/baseline";
import {
  attendanceShare,
  scoreline,
  seriesTotals,
} from "../../app/lib/repositories/derive";
import {
  PARTNER_ROLE_LABEL,
  PERIOD_LABEL,
  PartnerRole,
  PeriodKey,
} from "../../app/lib/repositories/enums";
import { baselineRepository } from "../../app/lib/repositories/index.server";
import {
  type BaselinePeriod,
  type BaselineRepository,
} from "../../app/lib/repositories/types";
import { color } from "../../app/lib/tokens";

/**
 * A fixed "now" so the date-derived x-axis labels are assertable. September is
 * deliberate: it is the ninth month, so a year-to-date slice of 9 proves the
 * slice is driven by the date rather than by a hardcoded length.
 */
const SEPTEMBER_2026 = new Date(2026, 8, 9);

let repository: BaselineRepository;

beforeEach(() => {
  repository = createMockBaselineRepository(() => SEPTEMBER_2026);
});

async function periodFor(key: PeriodKey): Promise<BaselinePeriod> {
  const period = await repository.period(key);
  if (period === null) {
    throw new Error(`missing baseline period ${key}`);
  }
  return period;
}

/* ------------------------------------------------------------------------ */

describe("Build Specification baseline figures", () => {
  it("puts webshop revenue this month at CHF 148,200, up 12% on last month", async () => {
    const thisMonth = await periodFor(PeriodKey.THIS_MONTH);
    const totals = seriesTotals(thisMonth.webshop);

    expect(totals.current).toBe(148_200);
    expect(totals.previous).toBe(132_400);
    expect(totals.delta).toBe(15_800);
    // The Specification quotes +12%; the exact figure is +11.9% and the tile
    // shows one decimal. Both are asserted so neither can drift from the other.
    expect(totals.deltaPercent).toBe(11.9);
    expect(Math.round(totals.deltaPercent)).toBe(12);
  });

  it("puts the last home match at FCB 2-1 Sion, 28,900 of ~38,000", async () => {
    const match = await repository.lastHomeMatch();

    expect(scoreline(match)).toBe("FCB 2-1 Sion");
    expect(match.attendance).toBe(28_900);
    expect(match.capacity).toBe(38_000);
  });

  it("lists this month's top products with the specified units", async () => {
    const topProducts = await repository.topProductsFor(PeriodKey.THIS_MONTH);

    expect(topProducts?.rows).toEqual([
      { product: "Home shirt 26/27", units: 1_840 },
      { product: "Home scarf", units: 1_210 },
      { product: "Away shirt 26/27", units: 940 },
      { product: 'Cap "Rotblau"', units: 720 },
      { product: "3rd shirt 26/27", units: 510 },
    ]);
  });

  it("has six active partners", async () => {
    const partners = await repository.partners();

    expect(partners).toHaveLength(6);
    expect(partners.map((partner) => partner.name)).toEqual([
      "Bitpanda",
      "Macron",
      "Allianz",
      "Sunrise",
      "Feldschlösschen",
      "Hoffmann",
    ]);
  });
});

/* ------------------------------------------------------------------------ */

describe("webshop and attendance periods", () => {
  it("offers the four periods in display order", async () => {
    const periods = await repository.periods();

    expect(periods.map((period) => period.key)).toEqual([
      PeriodKey.THIS_MONTH,
      PeriodKey.LAST_MONTH,
      PeriodKey.LAST_3_MONTHS,
      PeriodKey.YEAR_TO_DATE,
    ]);
    expect(periods.map((period) => period.label)).toEqual([
      "This month",
      "Last month",
      "Last 3 months",
      "Year to date",
    ]);
  });

  it("keeps labels, current and previous the same length in every period", async () => {
    const periods = await repository.periods();

    expect(periods).toHaveLength(4);
    for (const period of periods) {
      expect(period.webshop.current).toHaveLength(period.webshop.labels.length);
      expect(period.webshop.previous).toHaveLength(
        period.webshop.labels.length,
      );
      expect(period.webshop.labels.length).toBeGreaterThan(0);
    }
  });

  it("derives the total from the series in every period", async () => {
    const periods = await repository.periods();

    for (const period of periods) {
      const totals = seriesTotals(period.webshop);
      expect(totals.current).toBe(
        period.webshop.current.reduce((sum, value) => sum + value, 0),
      );
      expect(totals.delta).toBe(totals.current - totals.previous);
    }
  });

  it("stores each revenue series once: last month's is this month's comparison", async () => {
    const thisMonth = await periodFor(PeriodKey.THIS_MONTH);
    const lastMonth = await periodFor(PeriodKey.LAST_MONTH);

    expect(thisMonth.webshop.previous).toEqual(lastMonth.webshop.current);
    expect(thisMonth.attendance.previousAverage).toBe(
      lastMonth.attendance.average,
    );
  });

  it("reconciles the monthly series with the weekly series it contains", async () => {
    const thisMonth = await periodFor(PeriodKey.THIS_MONTH);
    const quarter = await periodFor(PeriodKey.LAST_3_MONTHS);
    const yearToDate = await periodFor(PeriodKey.YEAR_TO_DATE);

    const monthTotal = seriesTotals(thisMonth.webshop).current;
    expect(quarter.webshop.current.at(-1)).toBe(monthTotal);
    expect(yearToDate.webshop.current.at(-1)).toBe(monthTotal);
  });

  it("quotes one capacity for every period", async () => {
    const periods = await repository.periods();

    for (const period of periods) {
      expect(period.attendance.capacity).toBe(38_000);
      expect(period.attendance.average).toBeLessThan(
        period.attendance.capacity,
      );
      expect(attendanceShare(period.attendance)).toBeGreaterThan(0.6);
    }
  });

  it("returns null for an unknown period key", async () => {
    expect(await repository.period("NEXT_SEASON" as PeriodKey)).toBeNull();
  });
});

/* ------------------------------------------------------------------------ */

describe("date-derived x-axis labels", () => {
  it("labels the last three months from the injected date", async () => {
    const quarter = await periodFor(PeriodKey.LAST_3_MONTHS);

    expect(quarter.webshop.labels).toEqual(["Jul", "Aug", "Sep"]);
  });

  it("slices year to date to the months that have started", async () => {
    const yearToDate = await periodFor(PeriodKey.YEAR_TO_DATE);

    expect(yearToDate.webshop.labels).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
    ]);
    expect(yearToDate.webshop.current).toHaveLength(9);
    expect(yearToDate.webshop.previous).toHaveLength(9);
  });

  it("follows the clock into a different month", async () => {
    const inJanuary = createMockBaselineRepository(() => new Date(2026, 0, 20));

    const [, , quarter, yearToDate] = await inJanuary.periods();

    expect(quarter?.webshop.labels).toEqual(["Nov", "Dec", "Jan"]);
    expect(yearToDate?.webshop.labels).toEqual(["Jan"]);
    expect(yearToDate?.webshop.current).toHaveLength(1);
    expect(yearToDate?.webshop.previous).toHaveLength(1);
  });

  it("fills the year in December", async () => {
    const inDecember = createMockBaselineRepository(
      () => new Date(2026, 11, 3),
    );

    const yearToDate = await inDecember.period(PeriodKey.YEAR_TO_DATE);

    expect(yearToDate?.webshop.labels).toHaveLength(12);
    expect(yearToDate?.webshop.current).toHaveLength(12);
  });

  it("re-reads the clock instead of freezing labels at module load", async () => {
    let now = new Date(2026, 2, 5);
    const moving = createMockBaselineRepository(() => now);

    const inMarch = await moving.period(PeriodKey.YEAR_TO_DATE);
    now = new Date(2026, 6, 5);
    const inJuly = await moving.period(PeriodKey.YEAR_TO_DATE);

    expect(inMarch?.webshop.labels).toHaveLength(3);
    expect(inJuly?.webshop.labels).toHaveLength(7);
  });
});

/* ------------------------------------------------------------------------ */

describe("top products", () => {
  it("covers every period with the same five products in the same order", async () => {
    const periods = await repository.topProducts();

    expect(periods.map((period) => period.key)).toEqual(
      Object.values(PeriodKey),
    );
    for (const period of periods) {
      expect(period.label).toBe(PERIOD_LABEL[period.key]);
      expect(period.rows.map((row) => row.product)).toEqual([
        "Home shirt 26/27",
        "Home scarf",
        "Away shirt 26/27",
        'Cap "Rotblau"',
        "3rd shirt 26/27",
      ]);
    }
  });

  it('keeps the inner quotes in Cap "Rotblau"', async () => {
    const yearToDate = await repository.topProductsFor(PeriodKey.YEAR_TO_DATE);
    const cap = yearToDate?.rows.find((row) => row.product.startsWith("Cap"));

    expect(cap?.product).toBe('Cap "Rotblau"');
    expect(cap?.product).toContain('"Rotblau"');
    expect(cap?.units).toBe(6_400);
  });

  it("orders every period best-selling first", async () => {
    const periods = await repository.topProducts();

    for (const period of periods) {
      const units = period.rows.map((row) => row.units);
      expect([...units].sort((a, b) => b - a)).toEqual(units);
    }
  });

  it("returns null for an unknown period key", async () => {
    expect(
      await repository.topProductsFor("NEXT_SEASON" as PeriodKey),
    ).toBeNull();
  });
});

/* ------------------------------------------------------------------------ */

describe("partners", () => {
  it("gives every partner a distinct role with its display label", async () => {
    const partners = await repository.partners();

    expect(partners.map((partner) => partner.role)).toEqual([
      PartnerRole.MAIN_SHIRT_SPONSOR,
      PartnerRole.KIT_MANUFACTURER,
      PartnerRole.OFFICIAL_PARTNER,
      PartnerRole.TELECOM_PARTNER,
      PartnerRole.BEVERAGE_PARTNER,
      PartnerRole.MOBILITY_PARTNER,
    ]);
    for (const partner of partners) {
      expect(partner.roleLabel).toBe(PARTNER_ROLE_LABEL[partner.role]);
    }
  });

  it("keeps partner brand colours as brand colours, NOT design tokens", async () => {
    const partners = await repository.partners();
    const brandColors = new Map(
      partners.map((partner) => [partner.name, partner.brandColor]),
    );

    expect(brandColors.get("Bitpanda")).toBe("#0A9D8E");
    expect(brandColors.get("Sunrise")).toBe("#E4002B");

    // These two sit deliberately outside the FCB palette. If a later change
    // "fixes" them into token values this fails - which is the point.
    const tokenHexes = new Set<string>(Object.values(color));
    expect(tokenHexes.has("#0A9D8E")).toBe(false);
    expect(tokenHexes.has("#E4002B")).toBe(false);
  });

  it("gives every partner a six-digit hex brand colour", async () => {
    const partners = await repository.partners();

    for (const partner of partners) {
      expect(partner.brandColor).toMatch(/^#[0-9A-F]{6}$/);
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
    const dataset = await Promise.all([
      repository.periods(),
      repository.topProducts(),
      repository.partners(),
      repository.lastHomeMatch(),
    ]);
    return collectStrings(dataset, []);
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

  it("holds no salary or individual performance data", async () => {
    const serialised = JSON.stringify(await repository.periods()).toLowerCase();

    expect(serialised).not.toMatch(/salary|wage|goals scored|appearances/);
  });
});

/* ------------------------------------------------------------------------ */

describe("server-side repository selection", () => {
  it("exposes the mock implementation through index.server", async () => {
    const periods = await baselineRepository.periods();
    const partners = await baselineRepository.partners();

    expect(periods).toHaveLength(4);
    expect(partners).toHaveLength(6);
    expect(seriesTotals(periods[0]!.webshop).current).toBe(148_200);
  });
});
