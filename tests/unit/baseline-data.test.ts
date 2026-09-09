/**
 * US-013 — the baseline view model.
 *
 * This suite guards the ONE acceptance criterion the tiles cannot guard for
 * themselves: every figure the baseline row shows must come from the US-007
 * dataset. So it asserts RELATIONSHIPS between `loadBaseline`'s output and the
 * repository it read, not a second copy of the figures — the only literals
 * below are the four the Build Specification pins by name, which
 * `baseline-dataset.test.ts` already pins against the Reference Guide.
 *
 * The repository is built on a FIXED CLOCK. Two of the baseline periods label
 * their x-axis from today's date, and the sparkline's window is taken from the
 * year-to-date series, whose LENGTH is the number of months elapsed — so a
 * suite reading the wall clock would pass in September and fail in February.
 */

import { describe, expect, it } from "vitest";

import {
  BASELINE_COMPARISON_PERIOD,
  BASELINE_PERIOD,
  BASELINE_TREND_PERIOD,
  loadBaseline,
  SPARKLINE_POINTS,
} from "../../app/lib/dashboard/baseline";
import { type Clock } from "../../app/lib/calendar";
import { createMockBaselineRepository } from "../../app/lib/mock/baseline";
import { seriesTotals, trendEndingAt } from "../../app/lib/repositories/derive";
import { PERIOD_LABEL, PeriodKey } from "../../app/lib/repositories/enums";
import { type BaselineRepository } from "../../app/lib/repositories/types";

/** September 2026 — nine months elapsed, so the trend window is full. */
const SEPTEMBER: Clock = () => new Date(2026, 8, 9);

/** February 2026 — only two months elapsed. The degradation case. */
const FEBRUARY: Clock = () => new Date(2026, 1, 3);

/** December 2026 — the year-to-date series runs PAST the baseline month. */
const DECEMBER: Clock = () => new Date(2026, 11, 15);

function repository(clock: Clock = SEPTEMBER): BaselineRepository {
  return createMockBaselineRepository(clock);
}

describe("loadBaseline — periods", () => {
  it("is fixed to this month, compared against last month", () => {
    // The row has no period filter yet: US-026's control arrives with US-016.
    expect(BASELINE_PERIOD).toBe(PeriodKey.THIS_MONTH);
    expect(BASELINE_COMPARISON_PERIOD).toBe(PeriodKey.LAST_MONTH);
  });

  it("labels the period and the comparison from the enum, not from copy", async () => {
    const data = await loadBaseline(repository());

    expect(data.webshop.periodLabel).toBe(PERIOD_LABEL[BASELINE_PERIOD]);
    expect(data.webshop.comparisonLabel).toBe(
      PERIOD_LABEL[BASELINE_COMPARISON_PERIOD],
    );
  });
});

describe("loadBaseline — webshop revenue", () => {
  it("takes the headline figure from the series, never from a stored total", async () => {
    const repo = repository();
    const [data, period] = await Promise.all([
      loadBaseline(repo),
      repo.period(BASELINE_PERIOD),
    ]);

    expect(data.webshop.total).toBe(seriesTotals(period!.webshop).current);
    expect(data.webshop.deltaPercent).toBe(
      seriesTotals(period!.webshop).deltaPercent,
    );
  });

  it("puts this month at CHF 148,200, up 12% on last month", async () => {
    const data = await loadBaseline(repository());

    // The two figures the Build Specification pins. The exact delta is +11.9%
    // and the tile shows that — the Specification's "+12%" is its rounding.
    expect(data.webshop.total).toBe(148_200);
    expect(Math.round(data.webshop.deltaPercent)).toBe(12);
    expect(data.webshop.deltaPercent).toBeGreaterThan(0);
  });

  it("draws six sparkline points, windowed out of the monthly trend series", async () => {
    const repo = repository();
    const [data, trend] = await Promise.all([
      loadBaseline(repo),
      repo.period(BASELINE_TREND_PERIOD),
    ]);

    expect(SPARKLINE_POINTS).toBe(6);
    expect(data.webshop.trend).toHaveLength(SPARKLINE_POINTS);
    expect(data.webshop.trend).toEqual(
      trendEndingAt(
        trend!.webshop.current,
        data.webshop.total,
        SPARKLINE_POINTS,
      ),
    );
  });

  it("ends the sparkline on the headline figure, so the two cannot disagree", async () => {
    const data = await loadBaseline(repository());

    expect(data.webshop.trend.at(-1)).toBe(data.webshop.total);
  });

  it("still ends on the headline figure once the year has run on", async () => {
    // The year-to-date series is sliced to the months elapsed, so by December
    // it runs PAST the baseline month. The glyph must still stop where the
    // number is - this is what `trendEndingAt` buys over a plain tail.
    const data = await loadBaseline(repository(DECEMBER));

    expect(data.webshop.trend).toHaveLength(SPARKLINE_POINTS);
    expect(data.webshop.trend.at(-1)).toBe(data.webshop.total);
  });

  it("trends up across the window", async () => {
    const data = await loadBaseline(repository());
    const rising = data.webshop.trend.every(
      (point, index) => index === 0 || point > data.webshop.trend[index - 1]!,
    );

    expect(rising).toBe(true);
  });

  it("shortens the glyph rather than inventing months early in a year", async () => {
    // February has two months of year-to-date data. The window is what exists;
    // the headline figure and the delta are unaffected.
    const data = await loadBaseline(repository(FEBRUARY));

    expect(data.webshop.trend.length).toBeLessThan(SPARKLINE_POINTS);
    expect(data.webshop.trend.length).toBeGreaterThan(0);
    expect(data.webshop.total).toBe(148_200);
  });
});

describe("loadBaseline — last home match", () => {
  it("returns the fixture as the repository states it", async () => {
    const repo = repository();
    const [data, match] = await Promise.all([
      loadBaseline(repo),
      repo.lastHomeMatch(),
    ]);

    expect(data.match).toEqual(match);
  });

  it("is FCB 2-1 Sion, 28,900 of ~38,000", async () => {
    const data = await loadBaseline(repository());

    expect(data.match.goalsFor).toBe(2);
    expect(data.match.goalsAgainst).toBe(1);
    expect(data.match.opponent).toBe("Sion");
    expect(data.match.attendance).toBe(28_900);
    expect(data.match.capacity).toBe(38_000);
  });
});

describe("loadBaseline — top products", () => {
  it("returns the baseline period's rows, best-selling first", async () => {
    const repo = repository();
    const [data, period] = await Promise.all([
      loadBaseline(repo),
      repo.topProductsFor(BASELINE_PERIOD),
    ]);

    expect(data.topProducts).toEqual(period);
    expect(data.topProducts.key).toBe(BASELINE_PERIOD);

    const units = data.topProducts.rows.map((row) => row.units);
    expect([...units].sort((left, right) => right - left)).toEqual(units);
  });

  it("keeps the two long product names whole in the data", async () => {
    const data = await loadBaseline(repository());
    const names = data.topProducts.rows.map((row) => row.product);

    expect(names).toContain("Home shirt 26/27");
    expect(names).toContain('Cap "Rotblau"');
  });
});

describe("loadBaseline — partners", () => {
  it("returns all six, in dataset order, with a role label each", async () => {
    const repo = repository();
    const [data, partners] = await Promise.all([
      loadBaseline(repo),
      repo.partners(),
    ]);

    expect(data.partners).toEqual(partners);
    expect(data.partners).toHaveLength(6);
    for (const partner of data.partners) {
      expect(partner.roleLabel).not.toBe("");
      expect(partner.brandColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("loadBaseline — a dataset with a hole in it", () => {
  /** Everything present except the one thing each case removes. */
  function brokenRepository(
    overrides: Partial<BaselineRepository>,
  ): BaselineRepository {
    return { ...repository(), ...overrides };
  }

  it("throws rather than rendering CHF 0 when the period is missing", async () => {
    await expect(
      loadBaseline(brokenRepository({ period: () => Promise.resolve(null) })),
    ).rejects.toThrow(/missing period/);
  });

  it("throws when the top-products period is missing", async () => {
    await expect(
      loadBaseline(
        brokenRepository({ topProductsFor: () => Promise.resolve(null) }),
      ),
    ).rejects.toThrow(/missing top products/);
  });
});
