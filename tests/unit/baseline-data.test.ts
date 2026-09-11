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
import {
  GREETING_KEY,
  personaGreeting,
  WORKSPACE_LABEL_KEY,
} from "../../app/lib/persona";
import { seriesTotals, trendEndingAt } from "../../app/lib/repositories/derive";
import {
  PERIOD_INLINE_LABEL_KEY,
  PERIOD_LABEL_KEY,
  PRODUCT_LABEL_KEY,
  PeriodKey,
} from "../../app/lib/repositories/enums";
import { type BaselineRepository } from "../../app/lib/repositories/types";
import { de, t } from "./support/i18n";

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
  it("starts on this month, compared against last month", () => {
    // The initial selection of both period filters (the band's and Top
    // Products'), which US-016 wired to US-026's control.
    expect(BASELINE_PERIOD).toBe(PeriodKey.THIS_MONTH);
    expect(BASELINE_COMPARISON_PERIOD).toBe(PeriodKey.LAST_MONTH);
  });

  it("labels the period and the comparison from the enum, not from copy", async () => {
    const data = await loadBaseline(repository());

    expect(t(data.webshop.periodLabelKey)).toBe(
      t(PERIOD_LABEL_KEY[BASELINE_PERIOD]),
    );
    // The comparison is read MID-SENTENCE (`vs last month`), so it carries
    // the inline wording — which English lowercases and German does not.
    expect(t(data.webshop.comparisonLabelKey)).toBe(
      t(PERIOD_INLINE_LABEL_KEY[BASELINE_COMPARISON_PERIOD]),
    );
    expect(de(data.webshop.comparisonLabelKey)).toBe("letzter Monat");
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
  it("returns EVERY period, so the tile's filter needs no request", async () => {
    // US-016 mounted a period filter in the tile's `action` slot; the prototype
    // makes no network call after load, so all four periods travel at once.
    const repo = repository();
    const [data, periods] = await Promise.all([
      loadBaseline(repo),
      repo.topProducts(),
    ]);

    expect(data.topProducts).toEqual(periods);
    expect(data.topProducts).toHaveLength(4);
    expect(data.topProducts.map((period) => period.key)).toContain(
      BASELINE_PERIOD,
    );
  });

  it("orders every period's rows best-selling first", async () => {
    const data = await loadBaseline(repository());

    for (const period of data.topProducts) {
      const units = period.rows.map((row) => row.units);
      expect([...units].sort((left, right) => right - left)).toEqual(units);
    }
  });

  it("keeps the two long product names whole in the data", async () => {
    const data = await loadBaseline(repository());
    const baseline = data.topProducts.find(
      (period) => period.key === BASELINE_PERIOD,
    );
    const names = baseline!.rows.map((row) =>
      t(PRODUCT_LABEL_KEY[row.product]),
    );

    expect(names).toContain("Home shirt 26/27");
    expect(names).toContain('Cap "Rotblau"');
  });
});

describe("loadBaseline — the hero band (US-016)", () => {
  it("carries every period the shared filter offers, in display order", async () => {
    const repo = repository();
    const [data, periods] = await Promise.all([
      loadBaseline(repo),
      repo.periods(),
    ]);

    expect(data.band.periods).toEqual(periods);
    expect(data.band.periods).toHaveLength(4);
  });

  it("carries NO total and NO delta — both are computed in the band", async () => {
    // The acceptance criterion, as a shape: there is no field here to read a
    // stored total from, so the band cannot accidentally show one.
    const data = await loadBaseline(repository());

    expect(Object.keys(data.band).sort()).toEqual(["greeting", "periods"]);
    for (const period of data.band.periods) {
      expect(Object.keys(period).sort()).toEqual([
        "attendance",
        "key",
        "labelKey",
        "webshop",
      ]);
    }
  });

  it("greets the persona from the loader's clock, not the wall clock", async () => {
    const morning = await loadBaseline(
      repository(),
      () => new Date(2026, 8, 9, 9),
    );
    const afternoon = await loadBaseline(
      repository(),
      () => new Date(2026, 8, 9, 14),
    );
    const evening = await loadBaseline(
      repository(),
      () => new Date(2026, 8, 9, 20),
    );

    // The loader carries the KEY, not the sentence (US-049) — the hour is a
    // server fact, the language is not.
    expect(morning.band.greeting).toBe(GREETING_KEY.MORNING);
    expect(afternoon.band.greeting).toBe(GREETING_KEY.AFTERNOON);
    expect(evening.band.greeting).toBe(GREETING_KEY.EVENING);
    expect(personaGreeting(t, morning.band.greeting)).toBe(
      "Good morning, Sales & Marketing",
    );
    expect(personaGreeting(de, evening.band.greeting)).toBe(
      "Guten Abend, Vertrieb & Marketing",
    );
  });

  it("names the workspace, never an individual", async () => {
    const data = await loadBaseline(repository());

    expect(personaGreeting(t, data.band.greeting)).toContain(
      t(WORKSPACE_LABEL_KEY),
    );
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
      expect(t(partner.roleLabelKey)).not.toBe("");
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
      loadBaseline(brokenRepository({ periods: () => Promise.resolve([]) })),
    ).rejects.toThrow(/missing period/);
  });

  it("names the period that is missing, so the drift is findable", async () => {
    const periods = await repository().periods();
    const withoutTrend = periods.filter(
      (period) => period.key !== BASELINE_TREND_PERIOD,
    );

    await expect(
      loadBaseline(
        brokenRepository({ periods: () => Promise.resolve(withoutTrend) }),
      ),
    ).rejects.toThrow(BASELINE_TREND_PERIOD);
  });
});
