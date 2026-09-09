import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DONUT_GAP,
  DONUT_HOVER_STROKE_WIDTH,
  DONUT_RADIUS,
  DONUT_SERIES,
  DONUT_SIZE,
  DONUT_STROKE_WIDTH,
  Donut,
  DonutTile,
  donutGeometry,
  donutSeries,
  type DonutDatum,
} from "../../app/components/charts/donut";
import { formatNumber, formatSharePercent } from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { badgeSegments } from "../../app/lib/repositories/derive";
import { type BadgeSponsorShare } from "../../app/lib/repositories/types";
import { cssVariable } from "../../app/lib/tokens";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

/**
 * The donut's tests. Four criteria, and each one has a test that fails if the
 * behaviour is removed:
 *
 *   ① segments with small gaps, centre shows the total and counts up
 *   ② hovering an ARC **or its LEGEND ROW** thickens that segment and swaps
 *     the centre — TWO SURFACES, ONE STATE, which is the cross-surface test
 *   ③ a data change MORPHS the arcs: the same `<circle>` per sponsor, with new
 *     `stroke-dasharray` / `stroke-dashoffset` (the index-key proof is a
 *     RE-RANK, exactly as US-018's is)
 *   ④ the segments sum EXACTLY to the centre total, `badgeSegments`' rounding
 *     correction included — asserted on all four of Hero 1's period totals and
 *     on adversarial ones
 */

const DONUT_CODE = readFileSync(
  resolve(process.cwd(), "app/components/charts/donut.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

/**
 * Hero 1's sponsor split — verbatim from `app/lib/mock/hero1.ts`: Bitpanda 44%,
 * Sunrise 24%, Allianz 20%, IWB 12%.
 */
const SPLIT: readonly BadgeSponsorShare[] = [
  { sponsor: "Bitpanda", percent: 44 },
  { sponsor: "Sunrise", percent: 24 },
  { sponsor: "Allianz", percent: 20 },
  { sponsor: "IWB", percent: 12 },
];

/** The same sponsors in a different order — the index-key proof (criterion 3). */
const SPLIT_RERANKED: readonly BadgeSponsorShare[] = [
  { sponsor: "Sunrise", percent: 24 },
  { sponsor: "IWB", percent: 12 },
  { sponsor: "Bitpanda", percent: 44 },
  { sponsor: "Allianz", percent: 20 },
];

/** Badged shirts per period, from the same dataset. The filter changes this. */
const SEASON_TO_DATE = 3_080;
const LAST_3_MONTHS = 1_136;
const LAST_MONTH = 430;
const THIS_MONTH = 334;

/** Every total the section filter can produce, plus adversarial ones. */
const AWKWARD_TOTALS = [
  SEASON_TO_DATE,
  LAST_3_MONTHS,
  LAST_MONTH,
  THIS_MONTH,
  0,
  1,
  2,
  7,
  13,
  97,
  101,
  999,
  1_009,
  99_991,
];

const CIRCUMFERENCE = Number((2 * Math.PI * DONUT_RADIUS).toFixed(2));

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

/** The arc for a sponsor, as the presenter would point at it. */
function arc(name: string): HTMLElement {
  const found = slots("donut-arc").find(
    (candidate) => candidate.dataset.name === name,
  );
  if (!found) throw new Error(`no arc for "${name}"`);
  return found;
}

/** The legend row for a sponsor — the SECOND hover surface. */
function legendRow(name: string): HTMLElement {
  const found = slots("donut-legend-row").find(
    (candidate) => candidate.dataset.name === name,
  );
  if (!found) throw new Error(`no legend row for "${name}"`);
  return found;
}

function centreValue(): string {
  return slot("donut-centre-value")!.textContent!;
}

function centreLabel(): string {
  return slot("donut-centre-label")!.textContent!;
}

function dash(name: string) {
  const circle = arc(name);
  return {
    array: circle.getAttribute("stroke-dasharray"),
    offset: circle.getAttribute("stroke-dashoffset"),
    width: circle.getAttribute("stroke-width"),
  };
}

/** The painted length of an arc, read back off the rendered attribute. */
function paintedLength(name: string): number {
  return Number(dash(name).array!.split(" ")[0]);
}

function hoveredArcNames(): string[] {
  return slots("donut-arc")
    .filter((circle) => circle.dataset.hovered === "true")
    .map((circle) => circle.dataset.name!);
}

function hoveredLegendNames(): string[] {
  return slots("donut-legend-row")
    .filter((row) => row.dataset.hovered === "true")
    .map((row) => row.dataset.name!);
}

/** The legend's figures, as numbers, in row order. */
function legendValues(): number[] {
  return slots("donut-legend-value").map((cell) =>
    Number(cell.textContent!.replace(/[^\d-]/g, "")),
  );
}

/** A formatter that shows the raw counted number, for the count-up tests. */
function raw(value: number): string {
  return value.toFixed(4);
}

/** The segments the geometry is built from, for a total. */
function segmentsFor(
  total: number,
  split: readonly BadgeSponsorShare[] = SPLIT,
): DonutDatum[] {
  return badgeSegments(total, split).map((segment) => ({
    name: segment.sponsor,
    value: segment.value,
  }));
}

/**
 * Renders and runs the animations to completion, so an arc assertion sees the
 * grown ring while still exercising the real (non-reduced) path. Two advances:
 * the first frame only marks the start, the second lands.
 */
function renderSettled(ui: ReactElement) {
  const frames = stubFrames();
  const result = render(ui);
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
  return { ...result, frames };
}

function renderDonut(total: number = SEASON_TO_DATE) {
  return renderSettled(<Donut total={total} split={SPLIT} />);
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* -------------------------------------------------------------- GEOMETRY -- */

describe("donutGeometry — the dash maths, without a DOM", () => {
  it("gives every segment its share of one circumference", () => {
    const geometry = donutGeometry(segmentsFor(SEASON_TO_DATE))!;

    expect(geometry.circumference).toBe(CIRCUMFERENCE);
    expect(geometry.total).toBe(SEASON_TO_DATE);
    expect(geometry.arcs.map((part) => part.name)).toEqual([
      "Bitpanda",
      "Sunrise",
      "Allianz",
      "IWB",
    ]);
    expect(geometry.arcs.map((part) => Math.round(part.share * 100))).toEqual([
      44, 24, 20, 12,
    ]);
  });

  it("leaves exactly one DONUT_GAP between consecutive painted arcs", () => {
    const { arcs } = donutGeometry(segmentsFor(SEASON_TO_DATE))!;

    // There IS a gap: every arc is painted shorter than its own slot, so no two
    // segments meet. A zero gap would satisfy the arithmetic below and still be
    // the wrong picture.
    expect(DONUT_GAP).toBeGreaterThan(0);
    for (const part of arcs) {
      expect(part.length).toBeLessThan(part.share * CIRCUMFERENCE);
    }

    for (let index = 0; index < arcs.length - 1; index += 1) {
      const start = -arcs[index]!.dashOffset;
      const nextStart = -arcs[index + 1]!.dashOffset;
      // The painted arc ends a full gap before the next one begins.
      expect(nextStart - (start + arcs[index]!.length)).toBeCloseTo(
        DONUT_GAP,
        1,
      );
    }

    // And the wrap-around gap, between the last arc and the first, is the same
    // width — the ring has four even gaps, not three and a seam.
    const last = arcs[arcs.length - 1]!;
    const wrap =
      CIRCUMFERENCE - (-last.dashOffset + last.length) + -arcs[0]!.dashOffset;
    expect(wrap).toBeCloseTo(DONUT_GAP, 1);
  });

  it("spends the whole circumference on arcs plus one gap each", () => {
    const { arcs } = donutGeometry(segmentsFor(SEASON_TO_DATE))!;
    const painted = arcs.reduce((sum, part) => sum + part.length, 0);

    expect(painted + arcs.length * DONUT_GAP).toBeCloseTo(CIRCUMFERENCE, 1);
    // Every arc has a real gap round the rest of the circle in its dasharray.
    for (const part of arcs) {
      expect(part.dashArray).toBe(
        `${part.length} ${Number((CIRCUMFERENCE - part.length).toFixed(2))}`,
      );
    }
  });

  it("starts the first arc half a gap in, and offsets are negative", () => {
    const { arcs } = donutGeometry(segmentsFor(SEASON_TO_DATE))!;

    expect(arcs[0]!.dashOffset).toBeCloseTo(-DONUT_GAP / 2, 1);
    // Negative offsets shift the pattern FORWARD, so four identical circles
    // draw at four different places, each further round than the last.
    for (let index = 1; index < arcs.length; index += 1) {
      expect(arcs[index]!.dashOffset).toBeLessThan(arcs[index - 1]!.dashOffset);
    }
  });

  it("returns null for an empty split — there is nothing to draw", () => {
    expect(donutGeometry([])).toBeNull();
  });

  it("draws nothing, and divides nothing, for an all-zero total", () => {
    const geometry = donutGeometry(segmentsFor(0))!;

    expect(geometry.total).toBe(0);
    for (const part of geometry.arcs) {
      expect(part.length).toBe(0);
      expect(part.share).toBe(0);
      expect(part.dashArray).toBe(geometry.emptyDashArray);
    }
  });

  it("treats a negative or non-finite segment as nothing, never as a dash", () => {
    const geometry = donutGeometry([
      { name: "Bitpanda", value: 100 },
      { name: "Sunrise", value: -40 },
      { name: "Allianz", value: Number.NaN },
      { name: "IWB", value: Number.POSITIVE_INFINITY },
    ])!;

    expect(geometry.total).toBe(100);
    expect(geometry.arcs[1]!.length).toBe(0);
    expect(geometry.arcs[2]!.length).toBe(0);
    expect(geometry.arcs[3]!.length).toBe(0);
    for (const part of geometry.arcs) {
      expect(part.dashArray).not.toMatch(/NaN|-/);
    }
  });

  it("never yields a negative dash for a slot narrower than the gap", () => {
    // One shirt in a 12'000-shirt ring: its slot is a fraction of a path unit,
    // far less than the gap. A naive `slot - gap` would be negative, and a
    // negative dash renders as a FULL circle over the others.
    const geometry = donutGeometry([
      { name: "Bitpanda", value: 12_000 },
      { name: "IWB", value: 1 },
    ])!;

    expect(geometry.arcs[1]!.length).toBe(0);
    expect(geometry.arcs[1]!.dashArray).toBe(geometry.emptyDashArray);
  });
});

describe("donutSeries — colour by position, and no gold", () => {
  it("follows the reference order: red, blue, navy, slate", () => {
    expect([0, 1, 2, 3].map(donutSeries)).toEqual([
      "red",
      "blue",
      "navy",
      "slate",
    ]);
  });

  it("wraps rather than leaving a fifth segment colourless", () => {
    expect(donutSeries(4)).toBe("red");
    expect(donutSeries(-1)).toBe("red");
  });

  it("is series identity only — gold is not a segment colour here", () => {
    const values = Object.values(DONUT_SERIES);

    expect(values).toContain(cssVariable("color", "seriesPrimary"));
    expect(values).toContain(cssVariable("color", "slate"));
    expect(values).not.toContain(cssVariable("color", "accentTargetHit"));
    expect(DONUT_CODE).not.toMatch(/accentTargetHit|accentFollowUp|gold/);
  });
});

/* ----------------------------------------- ① SEGMENTS, GAPS AND THE CENTRE -- */

describe("Donut — four segments with gaps, and a counting centre (criterion 1)", () => {
  it("draws one arc per sponsor, each with a gap in its dasharray", () => {
    renderDonut();

    const arcs = slots("donut-arc");
    expect(arcs).toHaveLength(4);
    expect(arcs.map((circle) => circle.dataset.name)).toEqual([
      "Bitpanda",
      "Sunrise",
      "Allianz",
      "IWB",
    ]);

    const expected = donutGeometry(segmentsFor(SEASON_TO_DATE))!;
    for (const part of expected.arcs) {
      expect(dash(part.name).array).toBe(part.dashArray);
      expect(dash(part.name).offset).toBe(String(part.dashOffset));
      expect(paintedLength(part.name)).toBeGreaterThan(0);
    }

    // The gaps are ARC REMOVED, not a stroke in the background colour: the
    // painted lengths plus four gaps are the whole circle.
    const painted = expected.arcs.reduce(
      (sum, part) => sum + paintedLength(part.name),
      0,
    );
    expect(painted + 4 * DONUT_GAP).toBeCloseTo(CIRCUMFERENCE, 1);
    expect(DONUT_CODE).not.toMatch(/stroke-bg\b|stroke-white/);
  });

  it("renders nothing at all for an empty split", () => {
    // No sponsors is not an empty ring with a zero in it — there is nothing to
    // divide, so the tile's body is empty rather than misleading.
    const { container } = renderSettled(
      <Donut total={SEASON_TO_DATE} split={[]} />,
    );

    expect(slot("donut")).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the total in the centre, counting up from zero", () => {
    const frames = stubFrames();
    render(<Donut total={SEASON_TO_DATE} split={SPLIT} format={raw} />);

    // The entrance count-up: on screen, but not yet at the total.
    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS / 4);
    const midway = Number(centreValue());
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(SEASON_TO_DATE);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(centreValue())).toBe(SEASON_TO_DATE);
  });

  it("labels the resting centre, and formats through format.ts", () => {
    renderSettled(
      <Donut total={SEASON_TO_DATE} split={SPLIT} centreLabel="shirts" />,
    );

    expect(centreValue()).toBe(formatNumber(SEASON_TO_DATE));
    expect(centreLabel()).toBe("shirts");
  });

  it("grows from an empty ring rather than appearing at full length", () => {
    stubFrames();
    render(<Donut total={SEASON_TO_DATE} split={SPLIT} />);

    // Before the growth flag flips, every arc is at the empty dasharray — and
    // the CSS transition is what carries it to its length.
    const empty = donutGeometry(segmentsFor(SEASON_TO_DATE))!.emptyDashArray;
    for (const name of ["Bitpanda", "Sunrise", "Allianz", "IWB"]) {
      expect(dash(name).array).toBe(empty);
      expect(arc(name).getAttribute("class")).toContain(
        "transition-[stroke-dasharray,stroke-dashoffset,stroke-width]",
      );
    }
  });

  it("renders the legend with each sponsor's figure and share", () => {
    renderDonut();

    const expected = badgeSegments(SEASON_TO_DATE, SPLIT);
    expect(slots("donut-legend-row")).toHaveLength(4);
    for (const segment of expected) {
      const row = legendRow(segment.sponsor);
      expect(slot("donut-legend-value", row)).toHaveTextContent(
        formatNumber(segment.value),
      );
      expect(slot("donut-legend-share", row)).toHaveTextContent(
        formatSharePercent(segment.value / SEASON_TO_DATE),
      );
    }
  });

  it("keeps a zero sponsor as a labelled zero row with no arc", () => {
    renderSettled(
      <Donut
        total={100}
        split={[
          { sponsor: "Bitpanda", percent: 100 },
          { sponsor: "IWB", percent: 0 },
        ]}
      />,
    );

    expect(slot("donut-legend-value", legendRow("IWB"))).toHaveTextContent(
      formatNumber(0),
    );
    expect(paintedLength("IWB")).toBe(0);
  });
});

/* ------------------------------------------ ② TWO HOVER SURFACES, ONE STATE -- */

describe("Donut — hovering the ARC thickens it and swaps the centre (criterion 2)", () => {
  it("thickens only that segment", () => {
    renderDonut();

    expect(dash("Sunrise").width).toBe(String(DONUT_STROKE_WIDTH));

    fireEvent.mouseEnter(arc("Sunrise"));

    expect(dash("Sunrise").width).toBe(String(DONUT_HOVER_STROKE_WIDTH));
    expect(dash("Bitpanda").width).toBe(String(DONUT_STROKE_WIDTH));
    expect(hoveredArcNames()).toEqual(["Sunrise"]);
  });

  it("swaps the centre to that segment's figure and name", () => {
    const { frames } = renderDonut();
    expect(centreValue()).toBe(formatNumber(SEASON_TO_DATE));

    fireEvent.mouseEnter(arc("Sunrise"));
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);

    const sunrise = badgeSegments(SEASON_TO_DATE, SPLIT)[1]!;
    expect(centreValue()).toBe(formatNumber(sunrise.value));
    expect(centreLabel()).toBe("Sunrise");
  });

  it("returns to the total when the pointer leaves the component", () => {
    const { frames } = renderDonut();

    fireEvent.mouseEnter(arc("IWB"));
    fireEvent.mouseLeave(slot("donut")!);
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);

    expect(hoveredArcNames()).toEqual([]);
    expect(centreValue()).toBe(formatNumber(SEASON_TO_DATE));
    expect(dash("IWB").width).toBe(String(DONUT_STROKE_WIDTH));
  });
});

describe("Donut — hovering the LEGEND ROW does exactly the same (criterion 2)", () => {
  it("thickens the arc and swaps the centre from the legend side", () => {
    const { frames } = renderDonut();

    fireEvent.mouseEnter(legendRow("Allianz"));
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);

    const allianz = badgeSegments(SEASON_TO_DATE, SPLIT)[2]!;
    expect(dash("Allianz").width).toBe(String(DONUT_HOVER_STROKE_WIDTH));
    expect(centreValue()).toBe(formatNumber(allianz.value));
    expect(centreLabel()).toBe("Allianz");
  });

  it("is reachable by keyboard — focus does what hover does", () => {
    const { frames } = renderDonut();

    // The rows are real buttons, so Tab lands on them and the second reading
    // is not mouse-only. Nothing beyond focus is captured.
    expect(legendRow("Bitpanda").tagName).toBe("BUTTON");
    fireEvent.focus(legendRow("IWB"));
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);

    const iwb = badgeSegments(SEASON_TO_DATE, SPLIT)[3]!;
    expect(hoveredArcNames()).toEqual(["IWB"]);
    expect(centreValue()).toBe(formatNumber(iwb.value));

    fireEvent.blur(legendRow("IWB"));
    expect(hoveredArcNames()).toEqual([]);
  });
});

describe("Donut — the two surfaces are ONE piece of state (criterion 2)", () => {
  it("shows the arc as hovered when the legend row is hovered, and back", () => {
    renderDonut();

    // Legend row in, arc lights up.
    fireEvent.mouseEnter(legendRow("Sunrise"));
    expect(hoveredArcNames()).toEqual(["Sunrise"]);
    expect(hoveredLegendNames()).toEqual(["Sunrise"]);

    // Arc in, the legend row lights up — the same state, written from the
    // other side. Two copies of it would leave "Sunrise" highlighted here.
    fireEvent.mouseEnter(arc("Allianz"));
    expect(hoveredArcNames()).toEqual(["Allianz"]);
    expect(hoveredLegendNames()).toEqual(["Allianz"]);
  });

  it("never highlights two segments at once, whichever surface is used", () => {
    renderDonut();

    fireEvent.mouseEnter(arc("Bitpanda"));
    fireEvent.mouseEnter(legendRow("IWB"));

    expect(hoveredArcNames()).toEqual(["IWB"]);
    expect(hoveredLegendNames()).toEqual(["IWB"]);
  });

  it("counts smoothly between the total and the segment figure, never via zero", () => {
    const frames = stubFrames();
    render(<Donut total={SEASON_TO_DATE} split={SPLIT} format={raw} />);
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(centreValue())).toBe(SEASON_TO_DATE);

    const bitpanda = badgeSegments(SEASON_TO_DATE, SPLIT)[0]!.value;
    fireEvent.mouseEnter(arc("Bitpanda"));
    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS / 4);

    // Mid-swap: on its way DOWN from the total to the segment, not restarted
    // from zero and not snapped.
    const midway = Number(centreValue());
    expect(midway).toBeLessThan(SEASON_TO_DATE);
    expect(midway).toBeGreaterThan(bitpanda);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(centreValue())).toBe(bitpanda);
  });
});

/* ---------------------------------------------- ③ THE SEGMENTS MORPH -- */

describe("Donut — a data change morphs the arcs (criterion 3)", () => {
  it("keeps the SAME circle per sponsor and transitions its dash numbers", () => {
    const { rerender } = renderDonut(SEASON_TO_DATE);

    const before = {
      Bitpanda: arc("Bitpanda"),
      Sunrise: arc("Sunrise"),
      Allianz: arc("Allianz"),
      IWB: arc("IWB"),
    };
    const wasBitpanda = dash("Bitpanda");
    const wasIwb = dash("IWB");
    expect(paintedLength("Bitpanda")).toBeGreaterThan(0);

    // The section filter press: a smaller total, the same sponsors.
    rerender(<Donut total={THIS_MONTH} split={SPLIT} />);

    for (const [name, node] of Object.entries(before)) {
      // Element identity: the very same DOM node, not a fresh one. An index
      // key would remount it and the ring would sweep in from nothing.
      expect(arc(name)).toBe(node);
    }

    // The proportions of THIS_MONTH differ from the exact split (147/80/67/40
    // of 334), so both dash numbers move — this is the morph.
    const after = donutGeometry(segmentsFor(THIS_MONTH))!;
    expect(dash("Bitpanda").array).toBe(after.arcs[0]!.dashArray);
    expect(dash("Bitpanda").array).not.toBe(wasBitpanda.array);
    expect(dash("IWB").offset).toBe(String(after.arcs[3]!.dashOffset));
    expect(dash("IWB").offset).not.toBe(wasIwb.offset);
    // And never through the empty state.
    expect(paintedLength("Bitpanda")).toBeGreaterThan(0);
  });

  it("keeps its circle when the sponsors RE-RANK — the index-key proof", () => {
    // With an index key this fails: `Bitpanda` would be handed the element of
    // whatever now sits in the first slot, so nothing would transition.
    const { rerender } = renderDonut(SEASON_TO_DATE);

    const before = {
      Bitpanda: arc("Bitpanda"),
      Sunrise: arc("Sunrise"),
      Allianz: arc("Allianz"),
      IWB: arc("IWB"),
    };
    // The legend rows are keyed by sponsor for the same reason: a re-ranked
    // split must not hand Bitpanda's row to Sunrise.
    const rowsBefore = {
      Bitpanda: legendRow("Bitpanda"),
      Sunrise: legendRow("Sunrise"),
      Allianz: legendRow("Allianz"),
      IWB: legendRow("IWB"),
    };
    const wasAt = dash("Bitpanda").offset;

    rerender(<Donut total={SEASON_TO_DATE} split={SPLIT_RERANKED} />);

    for (const [name, node] of Object.entries(before)) {
      expect(arc(name)).toBe(node);
    }
    for (const [name, node] of Object.entries(rowsBefore)) {
      expect(legendRow(name)).toBe(node);
    }

    // The same circle now starts further round the ring: its offset moved.
    const reranked = donutGeometry(
      segmentsFor(SEASON_TO_DATE, SPLIT_RERANKED),
    )!;
    expect(dash("Bitpanda").offset).toBe(String(reranked.arcs[2]!.dashOffset));
    expect(dash("Bitpanda").offset).not.toBe(wasAt);
  });

  it("keeps the centre counting from the figure on screen across the change", () => {
    const frames = stubFrames();
    const { rerender } = render(
      <Donut total={SEASON_TO_DATE} split={SPLIT} format={raw} />,
    );
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);

    rerender(<Donut total={LAST_3_MONTHS} split={SPLIT} format={raw} />);
    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS / 4);

    const midway = Number(centreValue());
    expect(midway).toBeLessThan(SEASON_TO_DATE);
    expect(midway).toBeGreaterThan(LAST_3_MONTHS);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(centreValue())).toBe(LAST_3_MONTHS);
  });

  it("keeps the hovered segment hovered across a data change", () => {
    const { rerender } = renderDonut(SEASON_TO_DATE);

    fireEvent.mouseEnter(arc("Sunrise"));
    rerender(<Donut total={LAST_MONTH} split={SPLIT} />);

    expect(hoveredArcNames()).toEqual(["Sunrise"]);
    expect(dash("Sunrise").width).toBe(String(DONUT_HOVER_STROKE_WIDTH));
  });
});

/* -------------------------------------- ④ THE PARTS SUM TO THE TOTAL -- */

describe("Donut — the segments sum EXACTLY to the total (criterion 4)", () => {
  it.each(AWKWARD_TOTALS)(
    "sums to %i, rounding correction included",
    (total) => {
      const segments = badgeSegments(total, SPLIT);
      const summed = segments.reduce((sum, part) => sum + part.value, 0);

      expect(summed).toBe(total);
      expect(donutGeometry(segmentsFor(total))!.total).toBe(total);
    },
  );

  it("prints legend figures that add up to the centre total on screen", () => {
    // The reading a presenter actually checks: four rows and the number in the
    // middle of the ring. 7 is the adversarial case — 3 + 2 + 1 + 1, where
    // independent rounding gives 3 + 2 + 1 + 1 only by luck.
    for (const total of [SEASON_TO_DATE, THIS_MONTH, 7]) {
      const { unmount } = renderSettled(<Donut total={total} split={SPLIT} />);

      expect(legendValues().reduce((sum, value) => sum + value, 0)).toBe(total);
      expect(centreValue()).toBe(formatNumber(total));
      unmount();
    }
  });

  it("reuses derive.ts rather than restating the rounding rule", () => {
    // DRY, and safer: `badgeSegments` is the version proven by an exhaustive
    // sweep. A second copy here would be a second, unproven rounding rule.
    expect(DONUT_CODE).toMatch(/import \{ badgeSegments \} from/);
    expect(DONUT_CODE).toMatch(/badgeSegments\(total, split\)/);
    expect(DONUT_CODE).not.toMatch(/Math\.round/);
    expect(DONUT_CODE).not.toMatch(/percent \/ 100|percent\) \/ 100/);
  });
});

/* -------------------------------------------------------- REDUCED MOTION -- */

describe("Donut — reduced motion renders the final state", () => {
  it("is at its arc lengths and its total in the first render, no frames run", () => {
    stubMatchMedia(true);
    const frames = stubFrames();
    render(<Donut total={SEASON_TO_DATE} split={SPLIT} />);

    const expected = donutGeometry(segmentsFor(SEASON_TO_DATE))!;
    for (const part of expected.arcs) {
      expect(dash(part.name).array).toBe(part.dashArray);
      expect(dash(part.name).array).not.toBe(expected.emptyDashArray);
    }
    expect(centreValue()).toBe(formatNumber(SEASON_TO_DATE));
    // Nothing is animating: no frame was even requested.
    expect(frames.requested()).toBe(0);
  });

  it("still swaps the centre on hover — the preference is about motion", () => {
    stubMatchMedia(true);
    render(<Donut total={SEASON_TO_DATE} split={SPLIT} />);

    fireEvent.mouseEnter(legendRow("Sunrise"));

    const sunrise = badgeSegments(SEASON_TO_DATE, SPLIT)[1]!;
    expect(centreValue()).toBe(formatNumber(sunrise.value));
    expect(dash("Sunrise").width).toBe(String(DONUT_HOVER_STROKE_WIDTH));
  });

  it("lands on the new arcs immediately after a data change", () => {
    stubMatchMedia(true);
    const { rerender } = render(<Donut total={SEASON_TO_DATE} split={SPLIT} />);
    const before = arc("Bitpanda");

    rerender(<Donut total={LAST_MONTH} split={SPLIT} />);

    expect(arc("Bitpanda")).toBe(before);
    expect(dash("Bitpanda").array).toBe(
      donutGeometry(segmentsFor(LAST_MONTH))!.arcs[0]!.dashArray,
    );
    expect(centreValue()).toBe(formatNumber(LAST_MONTH));
  });
});

/* ------------------------------------------------------------------ IDS -- */

describe("Donut — gradient ids are per instance", () => {
  it("gives two rings on one screen distinct gradient ids", () => {
    renderSettled(
      <>
        <Donut total={SEASON_TO_DATE} split={SPLIT} label="first" />
        <Donut total={LAST_MONTH} split={SPLIT} label="second" />
      </>,
    );

    const ids = slots("donut-gradient").map((node) => node.id);
    expect(ids).toHaveLength(8);
    expect(new Set(ids).size).toBe(8);
    for (const id of ids) expect(id).toMatch(/^donut-/);

    // And every arc points at an id that exists in its own instance.
    for (const circle of slots("donut-arc")) {
      const reference = circle.getAttribute("stroke")!;
      expect(ids.some((id) => reference === `url(#${id})`)).toBe(true);
    }
  });
});

/* ------------------------------------------------- TOKEN / A11Y DISCIPLINE -- */

describe("Donut — token, formatter and accessibility discipline", () => {
  it("contains no hex colour anywhere in its code", () => {
    expect(DONUT_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(DONUT_CODE).not.toMatch(/rgba?\(/);
  });

  it("formats no number itself — every string goes through format.ts", () => {
    expect(DONUT_CODE).not.toMatch(/toLocaleString|Intl\.NumberFormat/);
    expect(DONUT_CODE).not.toMatch(/%`|'%'|"%"/);
  });

  it("hides the decorative ring and names the group", () => {
    renderDonut();

    expect(slot("donut-svg")).toHaveAttribute("aria-hidden", "true");
    expect(slot("donut")).toHaveAttribute("role", "group");
    expect(slot("donut-centre-value")).toHaveAttribute("role", "status");
    expect(slot("donut-swatch")).toHaveAttribute("aria-hidden", "true");
    // The readings reach a screen reader as DOM text, not as svg internals.
    expect(screen.getByText("Bitpanda")).toBeInTheDocument();
  });

  it("sizes its box so a thickened arc still fits inside it", () => {
    renderDonut();

    expect(slot("donut-ring")).toHaveStyle({
      width: `${DONUT_SIZE}px`,
      height: `${DONUT_SIZE}px`,
    });
    expect(DONUT_RADIUS + DONUT_HOVER_STROKE_WIDTH / 2).toBeLessThanOrEqual(
      DONUT_SIZE / 2,
    );
  });
});

/* ----------------------------------------------------------------- TILE -- */

describe("DonutTile — Card + Donut", () => {
  it("passes the card chrome straight through", () => {
    renderSettled(
      <DonutTile
        title="Sponsor badges printed"
        period="3’080 shirts"
        caption="About 8% of shirts carry a badge."
        action={<button type="button">Season</button>}
        accent="red"
        total={SEASON_TO_DATE}
        split={SPLIT}
      />,
    );

    expect(slot("card")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sponsor badges printed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3’080 shirts")).toBeInTheDocument();
    expect(
      screen.getByText("About 8% of shirts carry a badge."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Season" })).toBeInTheDocument();
    expect(slot("card-accent")).toBeInTheDocument();
  });

  it("renders the ring inside the card, with its centre total", () => {
    renderSettled(
      <DonutTile title="Sponsor badges" total={LAST_3_MONTHS} split={SPLIT} />,
    );

    expect(slot("donut", slot("card")!)).toBeInTheDocument();
    expect(centreValue()).toBe(formatNumber(LAST_3_MONTHS));
    expect(slots("donut-arc")).toHaveLength(4);
  });
});
