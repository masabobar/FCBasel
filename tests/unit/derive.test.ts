import { describe, expect, it } from "vitest";

import {
  CLUB_SHORT_NAME,
  SHIRT_PRICE_CHF,
  attendanceChangePercent,
  attendanceShare,
  badgeSegments,
  capacityShare,
  kitRevenue,
  matchCapacityShare,
  percentChange,
  scoreline,
  seriesTotals,
  trailingPoints,
  trendEndingAt,
} from "../../app/lib/repositories/derive";
import { type BadgeSponsorShare } from "../../app/lib/repositories/types";

describe("percentChange", () => {
  it("reports a rise and a fall with the correct sign", () => {
    expect(percentChange(110, 100)).toBe(10);
    expect(percentChange(90, 100)).toBe(-10);
  });

  it("rounds to one decimal, the precision the hero band displays", () => {
    expect(percentChange(148_200, 132_400)).toBe(11.9);
  });

  it("returns zero rather than Infinity when there is no baseline", () => {
    expect(percentChange(500, 0)).toBe(0);
  });
});

describe("seriesTotals", () => {
  const series = {
    labels: ["W1", "W2"],
    current: [100, 150],
    previous: [80, 120],
  };

  it("sums both series and derives the movement", () => {
    expect(seriesTotals(series)).toEqual({
      current: 250,
      previous: 200,
      delta: 50,
      deltaPercent: 25,
    });
  });

  it("handles an empty series without dividing by zero", () => {
    expect(seriesTotals({ labels: [], current: [], previous: [] })).toEqual({
      current: 0,
      previous: 0,
      delta: 0,
      deltaPercent: 0,
    });
  });
});

describe("attendance derivations", () => {
  const attendance = {
    average: 28_900,
    previousAverage: 27_500,
    capacity: 38_000,
    matches: 2,
  };

  it("expresses attendance as a fraction of capacity", () => {
    expect(attendanceShare(attendance)).toBeCloseTo(0.7605, 4);
    expect(Math.round(attendanceShare(attendance) * 100)).toBe(76);
  });

  it("returns zero share when capacity is unknown", () => {
    expect(attendanceShare({ ...attendance, capacity: 0 })).toBe(0);
  });

  it("compares the average against the previous period", () => {
    expect(attendanceChangePercent(attendance)).toBe(5.1);
  });

  it("shares one capacity division with a single fixture", () => {
    // The period ring and the "Last home match" tile quote the same 76%. They
    // hold different objects, so both go through `capacityShare`.
    const match = {
      opponent: "Sion",
      goalsFor: 2,
      goalsAgainst: 1,
      attendance: attendance.average,
      capacity: attendance.capacity,
    };

    expect(matchCapacityShare(match)).toBe(attendanceShare(attendance));
    expect(capacityShare(attendance.average, attendance.capacity)).toBe(
      matchCapacityShare(match),
    );
  });

  it("returns zero share for a fixture with no known capacity", () => {
    expect(
      matchCapacityShare({
        opponent: "Sion",
        goalsFor: 2,
        goalsAgainst: 1,
        attendance: 28_900,
        capacity: 0,
      }),
    ).toBe(0);
  });
});

describe("trailingPoints", () => {
  const series = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  it("takes the last N points, oldest first", () => {
    expect(trailingPoints(series, 6)).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it("ends on the same figure the series ends on", () => {
    expect(trailingPoints(series, 6).at(-1)).toBe(series.at(-1));
  });

  it("returns a short series whole rather than padding it", () => {
    expect(trailingPoints([10, 20], 6)).toEqual([10, 20]);
    expect(trailingPoints([10], 6)).toEqual([10]);
  });

  it("draws nothing for an empty series or a non-positive window", () => {
    expect(trailingPoints([], 6)).toEqual([]);
    expect(trailingPoints(series, 0)).toEqual([]);
    expect(trailingPoints(series, -3)).toEqual([]);
  });

  it("copies rather than aliasing the series it windows", () => {
    const source = [1, 2, 3];
    const window = trailingPoints(source, 3);
    window[0] = 99;

    expect(source[0]).toBe(1);
  });
});

describe("trendEndingAt", () => {
  const monthly = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];

  it("ends the window on the point the headline figure covers", () => {
    expect(trendEndingAt(monthly, 90, 6)).toEqual([40, 50, 60, 70, 80, 90]);
  });

  it("ignores points after that one, however far the series runs on", () => {
    // The whole reason this exists: a plain tail would end on 110.
    expect(trendEndingAt(monthly, 90, 6).at(-1)).toBe(90);
    expect(trailingPoints(monthly, 6).at(-1)).toBe(110);
  });

  it("takes the last occurrence when a figure repeats", () => {
    expect(trendEndingAt([5, 7, 5, 9], 5, 2)).toEqual([7, 5]);
  });

  it("falls back to the tail when the figure is not in the series", () => {
    expect(trendEndingAt(monthly, 95, 3)).toEqual([90, 100, 110]);
  });

  it("returns what exists when the window is longer than the series", () => {
    expect(trendEndingAt([10, 20, 30], 30, 6)).toEqual([10, 20, 30]);
  });

  it("draws nothing for an empty series", () => {
    expect(trendEndingAt([], 30, 6)).toEqual([]);
  });
});

describe("scoreline", () => {
  const match = {
    opponent: "Sion",
    goalsFor: 2,
    goalsAgainst: 1,
    attendance: 28_900,
    capacity: 38_000,
  };

  it("renders the club, the score and the opponent", () => {
    expect(scoreline(match)).toBe("FCB 2-1 Sion");
    expect(CLUB_SHORT_NAME).toBe("FCB");
  });

  it("uses a plain hyphen, never an en or em dash", () => {
    expect(scoreline(match)).not.toMatch(/[–—]/);
  });
});

describe("kitRevenue", () => {
  it("prices shirts at CHF 99", () => {
    expect(SHIRT_PRICE_CHF).toBe(99);
    expect(kitRevenue(22_400)).toBe(2_217_600);
    expect(kitRevenue(0)).toBe(0);
  });
});

describe("badgeSegments", () => {
  /** The Hero 1 sponsor split: 44 + 24 + 20 + 12 = 100. */
  const SPLIT: readonly BadgeSponsorShare[] = [
    { sponsor: "Bitpanda", percent: 44 },
    { sponsor: "Sunrise", percent: 24 },
    { sponsor: "Allianz", percent: 20 },
    { sponsor: "IWB", percent: 12 },
  ];

  function values(total: number): number[] {
    return badgeSegments(total, SPLIT).map((segment) => segment.value);
  }

  function segmentSum(total: number): number {
    return values(total).reduce((sum, value) => sum + value, 0);
  }

  it("splits the season-to-date badge total by the sponsor percentages", () => {
    expect(badgeSegments(3_080, SPLIT)).toEqual([
      { sponsor: "Bitpanda", percent: 44, value: 1_355 },
      { sponsor: "Sunrise", percent: 24, value: 739 },
      { sponsor: "Allianz", percent: 20, value: 616 },
      { sponsor: "IWB", percent: 12, value: 370 },
    ]);
  });

  it("sums exactly to the total for every Hero 1 period total", () => {
    for (const total of [3_080, 1_136, 430, 334]) {
      expect(segmentSum(total)).toBe(total);
    }
  });

  /**
   * The single most bug-prone line in the dataset. Rounding four percentages
   * independently drops or gains shirts at small and awkward totals, and a
   * donut whose slices do not add up to the number printed inside it is exactly
   * what this audience notices.
   */
  it("sums exactly to the total at adversarial totals", () => {
    const adversarial = [
      0, 1, 2, 3, 7, 11, 13, 17, 19, 23, 97, 101, 997, 9_973,
    ];

    for (const total of adversarial) {
      expect(segmentSum(total)).toBe(total);
    }
  });

  it("sums exactly to the total across an exhaustive sweep", () => {
    for (let total = 0; total <= 2_000; total += 1) {
      expect(segmentSum(total)).toBe(total);
    }
  });

  it("adds the rounding remainder to the first segment", () => {
    // 1 splits to 0 + 0 + 0 + 0 before correction; the whole shirt lands on
    // Bitpanda, the largest share.
    expect(values(1)).toEqual([1, 0, 0, 0]);
    // 7 rounds to 3 + 2 + 1 + 1 = 7 with no remainder to move.
    expect(values(7)).toEqual([3, 2, 1, 1]);
  });

  it("returns a zero segment per sponsor when there are no badges", () => {
    expect(values(0)).toEqual([0, 0, 0, 0]);
  });

  it("keeps the sponsor and its percentage untouched", () => {
    expect(
      badgeSegments(500, SPLIT).map((segment) => [
        segment.sponsor,
        segment.percent,
      ]),
    ).toEqual([
      ["Bitpanda", 44],
      ["Sunrise", 24],
      ["Allianz", 20],
      ["IWB", 12],
    ]);
  });

  it("does not mutate the split it is given", () => {
    const before = JSON.stringify(SPLIT);
    badgeSegments(3_080, SPLIT);

    expect(JSON.stringify(SPLIT)).toBe(before);
  });

  it("returns nothing when there are no sponsors", () => {
    expect(badgeSegments(3_080, [])).toEqual([]);
  });
});
