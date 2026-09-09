import { describe, expect, it } from "vitest";

import {
  CLUB_SHORT_NAME,
  attendanceChangePercent,
  attendanceShare,
  percentChange,
  scoreline,
  seriesTotals,
} from "../../app/lib/repositories/derive";

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
