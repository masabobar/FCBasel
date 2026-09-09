import { describe, expect, it } from "vitest";

import {
  monthLabel,
  monthsElapsedThisYear,
  recentMonthLabels,
  systemClock,
} from "../../app/lib/calendar";

/**
 * Every assertion here injects a fixed date. Nothing in this file may depend on
 * when the suite happens to run: a label helper that only passes in September
 * is a label helper that ships stale months in October.
 */
const SEPTEMBER_2026 = new Date(2026, 8, 9);
const JANUARY_2026 = new Date(2026, 0, 14);
const DECEMBER_2026 = new Date(2026, 11, 31);

describe("monthLabel", () => {
  it("names the current month when nothing is subtracted", () => {
    expect(monthLabel(SEPTEMBER_2026, 0)).toBe("Sep");
  });

  it("walks backwards month by month", () => {
    expect(monthLabel(SEPTEMBER_2026, 1)).toBe("Aug");
    expect(monthLabel(SEPTEMBER_2026, 2)).toBe("Jul");
  });

  it("crosses the year boundary backwards", () => {
    expect(monthLabel(JANUARY_2026, 1)).toBe("Dec");
    expect(monthLabel(JANUARY_2026, 2)).toBe("Nov");
  });

  it("does not roll over on a day-of-month a shorter month lacks", () => {
    // Built from the 1st of the target month, so a 31st never spills into the
    // next month the way `setMonth` on a 31-day date would.
    expect(monthLabel(new Date(2026, 2, 31), 1)).toBe("Feb");
  });
});

describe("recentMonthLabels", () => {
  it("returns the window oldest first, ending with the current month", () => {
    expect(recentMonthLabels(SEPTEMBER_2026, 3)).toEqual(["Jul", "Aug", "Sep"]);
  });

  it("returns exactly the requested number of labels", () => {
    expect(recentMonthLabels(SEPTEMBER_2026, 9)).toHaveLength(9);
    expect(recentMonthLabels(DECEMBER_2026, 12)).toHaveLength(12);
  });

  it("spans a full year without repeating a month", () => {
    const labels = recentMonthLabels(DECEMBER_2026, 12);
    expect(labels).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]);
    expect(new Set(labels).size).toBe(12);
  });

  it("returns nothing for a non-positive count", () => {
    expect(recentMonthLabels(SEPTEMBER_2026, 0)).toEqual([]);
    expect(recentMonthLabels(SEPTEMBER_2026, -3)).toEqual([]);
  });
});

describe("monthsElapsedThisYear", () => {
  it("counts January as one and December as twelve", () => {
    expect(monthsElapsedThisYear(JANUARY_2026)).toBe(1);
    expect(monthsElapsedThisYear(SEPTEMBER_2026)).toBe(9);
    expect(monthsElapsedThisYear(DECEMBER_2026)).toBe(12);
  });
});

describe("systemClock", () => {
  it("reads the current date", () => {
    const before = Date.now();
    const now = systemClock();
    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
  });
});
