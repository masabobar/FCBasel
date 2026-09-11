/**
 * US-016 — the attendance ring, the band's one genuinely new visual.
 *
 * Two of the story's acceptance criteria live here and are asserted end to end
 * on the REAL dataset rather than on a fixture of it:
 *
 *   ④ on hover the centre swaps from average attendance to "% of capacity"
 *      and the arc gains a soft glow;
 *   ⑤ the arc sweeps to its value (and, in `hero-band.test.tsx`, to the NEXT
 *      period's value) instead of appearing at it.
 *
 * Plus the rule every animated component in this build has to satisfy: under
 * reduced motion the arc is at its share and the figure at its value in the
 * FIRST render — nothing stranded at zero.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  AttendanceRing,
  RING_GLOW_CLASS,
  RING_LABEL_KEY,
  RING_RADIUS,
  RING_SIZE,
  RING_STROKE_WIDTH,
  ringGeometry,
} from "../../app/components/charts/attendance-ring";
import { type Clock } from "../../app/lib/calendar";
import { formatNumber, formatSharePercent } from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { createMockBaselineRepository } from "../../app/lib/mock/baseline";
import { attendanceShare } from "../../app/lib/repositories/derive";
import { BASELINE_PERIOD } from "../../app/lib/dashboard/baseline";
import { type AttendanceSummary } from "../../app/lib/repositories/types";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";
import { t } from "./support/i18n";

const RING_CODE = readFileSync(
  resolve(process.cwd(), "app/components/charts/attendance-ring.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/* -------------------------------------------------------------- FIXTURE -- */

const SEPTEMBER: Clock = () => new Date(2026, 8, 9);

/** The real periods, so the ring is tested on the figures it will draw. */
const PERIODS = await createMockBaselineRepository(SEPTEMBER).periods();

const ATTENDANCE: AttendanceSummary = PERIODS.find(
  (period) => period.key === BASELINE_PERIOD,
)!.attendance;

const SHARE = attendanceShare(ATTENDANCE);

function slot(name: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
}

/**
 * An element's classes as a string. `className` on an SVG element is an
 * `SVGAnimatedString`, not a string, so the arc and the svg are read through
 * the attribute — otherwise every assertion below would silently pass.
 */
function classes(name: string): string {
  return slot(name).getAttribute("class") ?? "";
}

function renderSettled(ui: ReactElement) {
  const frames = stubFrames();
  const result = render(ui);
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
  return { ...result, frames };
}

function renderRing(attendance: AttendanceSummary = ATTENDANCE) {
  return renderSettled(<AttendanceRing attendance={attendance} />);
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ------------------------------------------------------------- GEOMETRY -- */

describe("ringGeometry — the arc, as arithmetic", () => {
  it("splits the circumference into the drawn arc and its gap", () => {
    const geometry = ringGeometry(0.5);
    const [dash, gap] = geometry.dashArray.split(" ").map(Number);

    expect(dash! + gap!).toBeCloseTo(geometry.circumference, 1);
    expect(dash).toBeCloseTo(geometry.circumference / 2, 1);
  });

  it("draws nothing at zero and the whole circle at one", () => {
    expect(ringGeometry(0).length).toBe(0);
    expect(ringGeometry(1).length).toBe(ringGeometry(1).circumference);
  });

  it("clamps a share outside 0–1 rather than wrapping the arc over itself", () => {
    // A sell-out plus standing room is a real future reading; an arc longer
    // than its own circumference reads as a SHORTER one.
    expect(ringGeometry(1.4).dashArray).toBe(ringGeometry(1).dashArray);
    expect(ringGeometry(-0.2).dashArray).toBe(ringGeometry(0).dashArray);
  });

  it("treats a non-finite share as nothing drawn, never as NaN in an attribute", () => {
    expect(ringGeometry(Number.NaN).dashArray).not.toContain("NaN");
    expect(ringGeometry(Number.NaN).length).toBe(0);
  });

  it("keeps the empty state a real dash pair, so the sweep has a from-state", () => {
    const geometry = ringGeometry(SHARE);

    expect(geometry.emptyDashArray).toBe(`0 ${geometry.circumference}`);
    expect(geometry.emptyDashArray).not.toBe(geometry.dashArray);
  });

  it("derives the circumference from the exported radius", () => {
    expect(ringGeometry(1).circumference).toBeCloseTo(
      2 * Math.PI * RING_RADIUS,
      1,
    );
    // The arc has to fit inside the box with its own stroke weight.
    expect(RING_RADIUS * 2 + RING_STROKE_WIDTH).toBeLessThanOrEqual(RING_SIZE);
  });
});

/* ----------------------------------------------------- ⑤ IT SWEEPS ------- */

describe("AttendanceRing — the arc sweeps to its value", () => {
  it("starts empty and grows to the share, as a CSS transition", () => {
    const frames = stubFrames();
    render(<AttendanceRing attendance={ATTENDANCE} />);

    const arc = slot("attendance-ring-arc");
    expect(arc).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(SHARE).emptyDashArray,
    );

    frames.advance();
    frames.advance();

    expect(arc).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(SHARE).dashArray,
    );
    expect(classes("attendance-ring-arc")).toContain(
      "transition-[stroke-dasharray]",
    );
    expect(classes("attendance-ring-arc")).toContain(
      "duration-(--duration-grow)",
    );
  });

  it("sweeps between two periods' values on the same element", () => {
    const other = PERIODS.find((period) => period.key !== BASELINE_PERIOD)!;
    const { rerender } = renderRing();
    const arc = slot("attendance-ring-arc");

    rerender(<AttendanceRing attendance={other.attendance} />);

    // The same node, a new dash pair — so the browser tweens between them.
    expect(slot("attendance-ring-arc")).toBe(arc);
    expect(arc).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(attendanceShare(other.attendance)).dashArray,
    );
  });

  it("paints the arc in the accent token and the track in the page white", () => {
    renderRing();

    expect(classes("attendance-ring-arc")).toContain(
      "stroke-accent-target-hit",
    );
    expect(classes("attendance-ring-track")).toContain("stroke-bg/15");
  });

  it("starts the arc at twelve o'clock", () => {
    renderRing();

    expect(classes("attendance-ring-svg")).toContain("-rotate-90");
  });
});

/* ------------------------------------------------ ⑤ THE FIGURE COUNTS ---- */

describe("AttendanceRing — the centre figure", () => {
  it("counts up to the average through the shared number formatter", () => {
    renderRing();

    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatNumber(ATTENDANCE.average),
    );
    expect(slot("attendance-ring-caption")).toHaveTextContent(
      t(RING_LABEL_KEY.average),
    );
  });

  it("counts from the figure on screen when the period changes", () => {
    const other = PERIODS.find((period) => period.key !== BASELINE_PERIOD)!;
    const { rerender, frames } = renderRing();

    rerender(<AttendanceRing attendance={other.attendance} />);
    // The first frame only records the start timestamp; the second is the one
    // that carries the count a quarter of the way.
    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS / 4);

    const shown = Number(
      slot("attendance-ring-value").textContent!.replace(/\D/g, ""),
    );
    const from = ATTENDANCE.average;
    const to = other.attendance.average;

    // Strictly between the two — it neither snapped nor restarted from zero.
    expect(shown).toBeLessThan(Math.max(from, to));
    expect(shown).toBeGreaterThan(Math.min(from, to));
  });

  it("wears the product's own headline-number role, lightened for navy", () => {
    renderRing();

    // Not a font size of its own: `.kpi-number` is the one big-number role and
    // it already carries the tabular figures a count-up needs.
    expect(slot("attendance-ring-value").className).toContain("kpi-number");
    expect(slot("attendance-ring-value").className).toContain("text-bg");
  });
});

/* ------------------------------- ④ HOVER SWAPS THE CENTRE AND GLOWS ----- */

describe("AttendanceRing — hover swaps the centre and lights the arc", () => {
  it("shows the share of capacity while hovered, and the average after", () => {
    renderRing();
    const ring = slot("attendance-ring");

    fireEvent.mouseEnter(ring);

    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatSharePercent(SHARE),
    );
    expect(slot("attendance-ring-caption")).toHaveTextContent(
      t(RING_LABEL_KEY.capacity),
    );

    fireEvent.mouseLeave(ring);

    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatNumber(ATTENDANCE.average),
    );
    expect(slot("attendance-ring-caption")).toHaveTextContent(
      t(RING_LABEL_KEY.average),
    );
  });

  it("gains the soft glow on hover, and loses it again", () => {
    renderRing();
    const ring = slot("attendance-ring");
    const arc = slot("attendance-ring-arc");

    expect(arc.getAttribute("class")).not.toContain(RING_GLOW_CLASS);

    fireEvent.mouseEnter(ring);
    expect(classes("attendance-ring-arc")).toContain(RING_GLOW_CLASS);
    expect(ring).toHaveAttribute("data-revealed", "true");

    fireEvent.mouseLeave(ring);
    expect(classes("attendance-ring-arc")).not.toContain(RING_GLOW_CLASS);
    expect(ring).toHaveAttribute("data-revealed", "false");
  });

  it("declares that glow as a token mix, with no hex and no fill", () => {
    const rule = APP_CSS.match(
      new RegExp(`\\.${RING_GLOW_CLASS}\\s*\\{([^{}]*)\\}`),
    )?.[1];

    expect(rule).toContain("--color-accent-target-hit");
    expect(rule).toContain("drop-shadow");
    expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    // Gold is an ACCENT here, never a fill.
    expect(rule).not.toMatch(/\bfill\b|background/);
  });

  it("answers focus exactly as it answers hover", () => {
    // A ring that only responds to a mouse hides its second reading from
    // anyone using a keyboard.
    renderRing();
    const ring = slot("attendance-ring");

    expect(ring).toHaveAttribute("tabindex", "0");

    fireEvent.focus(ring);
    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatSharePercent(SHARE),
    );
    expect(classes("attendance-ring-arc")).toContain(RING_GLOW_CLASS);

    fireEvent.blur(ring);
    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatNumber(ATTENDANCE.average),
    );
  });

  it("names itself for both readings, and hides the arc from the a11y tree", () => {
    renderRing();

    expect(screen.getByRole("group")).toBe(slot("attendance-ring"));
    expect(screen.getByRole("group").getAttribute("aria-label")).toMatch(
      /attendance/i,
    );
    expect(slot("attendance-ring-svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("takes a caller's accessible name", () => {
    renderSettled(
      <AttendanceRing attendance={ATTENDANCE} label="Ring for last month" />,
    );

    expect(
      screen.getByRole("group", { name: "Ring for last month" }),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------------- DEGENERATE DATA -- */

describe("AttendanceRing — readings at the edges", () => {
  it("renders a real ring for a period with no attendance at all", () => {
    renderRing({
      average: 0,
      previousAverage: 0,
      capacity: 38_000,
      matches: 0,
    });

    expect(slot("attendance-ring-arc")).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(0).dashArray,
    );
    expect(slot("attendance-ring-value")).toHaveTextContent(formatNumber(0));
  });

  it("survives a capacity of zero rather than dividing by it", () => {
    renderRing({
      average: 28_900,
      previousAverage: 27_500,
      capacity: 0,
      matches: 2,
    });

    // `capacityShare` returns 0 rather than Infinity, so the arc is empty and
    // the hover reading is 0% — never `NaN%` on the projector.
    fireEvent.mouseEnter(slot("attendance-ring"));
    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatSharePercent(0),
    );
  });
});

/* -------------------------------------------------------- REDUCED MOTION -- */

describe("AttendanceRing — reduced motion renders the final state", () => {
  it("is at its share and its figure in the first render, with no frames run", () => {
    stubMatchMedia(true);
    render(<AttendanceRing attendance={ATTENDANCE} />);

    expect(slot("attendance-ring-arc")).toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(SHARE).dashArray,
    );
    expect(slot("attendance-ring-arc")).not.toHaveAttribute(
      "stroke-dasharray",
      ringGeometry(SHARE).emptyDashArray,
    );
    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatNumber(ATTENDANCE.average),
    );
  });

  it("still swaps its centre on hover — the preference is about motion", () => {
    stubMatchMedia(true);
    render(<AttendanceRing attendance={ATTENDANCE} />);

    fireEvent.mouseEnter(slot("attendance-ring"));

    expect(slot("attendance-ring-value")).toHaveTextContent(
      formatSharePercent(SHARE),
    );
    expect(classes("attendance-ring-arc")).toContain(RING_GLOW_CLASS);
  });
});

/* ------------------------------------------------------ TOKEN DISCIPLINE -- */

describe("AttendanceRing — token and formatter discipline", () => {
  it("contains no hex colour anywhere in its code", () => {
    expect(RING_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(RING_CODE).not.toMatch(/rgba?\(/);
  });

  it("formats no number itself — every string goes through format.ts", () => {
    expect(RING_CODE).not.toContain("toLocaleString");
    expect(RING_CODE).not.toContain("Intl.NumberFormat");
    expect(RING_CODE).toContain("formatNumber");
    expect(RING_CODE).toContain("formatSharePercent");
  });

  it("divides nothing itself — the share comes from derive.ts", () => {
    // `attendanceShare` is the one place attendance is divided by capacity, and
    // the stats beside the ring read the same function.
    expect(RING_CODE).toContain("attendanceShare");
    expect(RING_CODE).not.toMatch(/\.average\s*\/\s*/);
  });

  it("invents no motion and no timer of its own", () => {
    expect(RING_CODE).toContain("useGrow");
    expect(RING_CODE).toContain("useCountUp");
    expect(RING_CODE).not.toContain("setTimeout");
    expect(RING_CODE).not.toContain("setInterval");
    expect(RING_CODE).not.toContain("requestAnimationFrame");
    expect(RING_CODE).not.toContain("matchMedia");
  });

  it("owns exactly one piece of state — the hover, never the period", () => {
    // The period belongs to the band: one control has to move the chart too.
    expect(RING_CODE.match(/useState[<(]/g)).toHaveLength(1);
  });
});
