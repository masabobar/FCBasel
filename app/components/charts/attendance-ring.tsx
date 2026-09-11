import { useState } from "react";

import { cn } from "../../lib/cn";
import { formatNumber, formatSharePercent } from "../../lib/format";
import { useCountUp, useGrow } from "../../lib/hooks/use-motion";
import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";
import { attendanceShare } from "../../lib/repositories/derive";
import { type AttendanceSummary } from "../../lib/repositories/types";

/**
 * The attendance ring — the hero band's one genuinely new visual, and the only
 * hand-built ring in the product.
 *
 * WHAT IT IS: average home attendance for the selected period, drawn as a gold
 * arc of the stadium's usable capacity, with the figure in the middle. It is
 * the second half of US-016's shared period filter — the chart plots the
 * webshop series for a period and this draws the same period's attendance, so
 * one control moves both.
 *
 * THREE BEHAVIOURS, AND ALL THREE ARE ACCEPTANCE CRITERIA:
 *
 *   1. IT SWEEPS. The arc is a `stroke-dasharray` CSS transition keyed off
 *      US-027's `useGrow`, so it grows from nothing on mount and sweeps between
 *      values on a filter change. No JavaScript runs per frame.
 *   2. THE CENTRE SWAPS ON HOVER. Resting, it shows the average attendance;
 *      hovered (or focused — see below), it shows the same reading as a share
 *      of capacity, and the arc gains a soft glow.
 *   3. THE FIGURE COUNTS FROM WHAT IS ON SCREEN. `useCountUp` continues from
 *      the displayed value, so switching period counts 28’900 → 27’500 rather
 *      than dropping to zero and re-counting.
 *
 * HOVER IS ALSO FOCUS. A ring that only answers a mouse hides its second
 * reading from anyone using a keyboard, so the group is focusable and focus
 * does exactly what hover does. Nothing else is captured — Tab still leaves.
 *
 * REDUCED MOTION IS FINAL STATE, NEVER ZERO. `useGrow` is already `true` in the
 * first render under the preference and `useCountUp` returns the target, so the
 * arc is at its share and the figure at its value with no transition needed.
 * The trap is the other way round: `strokeDasharray` keyed off a flag that
 * never flips would leave a permanently empty ring.
 *
 * GOLD IS LEGITIMATE HERE. The Reference Guide lists the attendance ring among
 * gold's allowed accent uses (`app/lib/tokens.ts`, colour discipline rule 4) —
 * as an ACCENT on the arc, never as a fill. No hex appears in this file: the
 * arc is a token utility class and the hover glow is `.fcb-ring-glow` in
 * `app/app.css`, which mixes the accent token rather than restating it.
 *
 * NO NUMBER IS FORMATTED HERE and no ratio is divided here: the share comes
 * from `attendanceShare` in `app/lib/repositories/derive.ts` (the one place
 * attendance is divided by capacity, shared with the match tile) and both
 * strings come from `app/lib/format.ts`.
 */

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * The ring's box, in screen pixels.
 *
 * 156 rather than the reference build's 132: the centre figure wears the
 * product's own `.kpi-number` role class (30px) instead of the reference's
 * one-off 20px, and 132 would leave a six-digit attendance figure touching the
 * arc on both sides. Bigger box, same token set — the same trade the chart axis
 * made at 12px (E8: legible at 1080p from the back of a room).
 */
export const RING_SIZE = 156;

/** Radius of the track's centre line, leaving room for the stroke. */
export const RING_RADIUS = 66;

/** Track and arc weight. Both are drawn at the same width. */
export const RING_STROKE_WIDTH = 12;

/** Centre of the box — half of {@link RING_SIZE}. */
const RING_CENTRE = RING_SIZE / 2;

/** Dash lengths rounded to this many decimals — an attribute, not maths. */
const DASH_PRECISION = 2;

/** The arc's length before it has grown: nothing drawn, everything gapped. */
const NO_ARC = 0;

export interface RingGeometry {
  /** The full circle, in user units — the arc plus its gap always sum to it. */
  readonly circumference: number;
  /** The drawn part, for the given share. */
  readonly length: number;
  /** `stroke-dasharray` for that share: one dash, one gap. */
  readonly dashArray: string;
  /** `stroke-dasharray` for a ring that has not grown yet. */
  readonly emptyDashArray: string;
}

function round(value: number): number {
  return Number(value.toFixed(DASH_PRECISION));
}

/**
 * The ring's dash geometry for a share of capacity.
 *
 * Pure and exported so the sweep can be asserted without a DOM. The share is
 * CLAMPED to 0–1 and a non-finite share reads as zero: a sell-out plus standing
 * room is a real possibility in this dataset's future, and an arc longer than
 * its own circumference wraps back over itself and reads as a shorter one.
 */
export function ringGeometry(share: number): RingGeometry {
  const circumference = round(2 * Math.PI * RING_RADIUS);
  const safeShare = Number.isFinite(share)
    ? Math.min(Math.max(share, 0), 1)
    : 0;
  const length = round(circumference * safeShare);

  return {
    circumference,
    length,
    dashArray: `${length} ${round(circumference - length)}`,
    emptyDashArray: `${NO_ARC} ${circumference}`,
  };
}

/**
 * The hover glow, declared in `app/app.css` beside the band's own surface and
 * named here so this file never types the class by hand — the same arrangement
 * `CHIP_SURFACE_CLASS` uses. The rule mixes the accent token; no hex is
 * involved, and it is a `filter`, so the arc keeps its 12px weight.
 */
export const RING_GLOW_CLASS = "fcb-ring-glow";

/* ---------------------------------------------------------------- COPY -- */

/** The two centre labels — what the figure above each of them means. */
export const RING_LABEL_KEY = {
  /** Resting: the figure is an average of the period's home fixtures. */
  average: "tiles.ringAverage",
  /** Hovered: the same reading, as a share of the stadium's capacity. */
  capacity: "tiles.ringCapacity",
} as const satisfies Record<string, TranslationKey>;

/** The group's accessible name. It states both readings, since it shows both. */
const DEFAULT_LABEL_KEY: TranslationKey = "tiles.attendanceRingLabel";

/* ---------------------------------------------------------------- RING -- */

export interface AttendanceRingProps {
  /**
   * The selected period's attendance summary. The whole object rather than a
   * ratio: the share is derived here through `attendanceShare`, so the ring and
   * the stats beside it cannot round the same division two ways.
   */
  attendance: AttendanceSummary;
  /** The group's accessible name. */
  label?: string;
  className?: string;
}

export function AttendanceRing({
  attendance,
  label,
  className,
}: AttendanceRingProps) {
  const t = useT();
  const grown = useGrow();
  const counted = useCountUp(attendance.average);
  // The one piece of state the ring owns. The PERIOD is the caller's, because
  // the same press has to move the chart as well (US-016 criterion ①).
  const [revealed, setRevealed] = useState(false);

  const share = attendanceShare(attendance);
  const geometry = ringGeometry(share);

  return (
    <div
      data-slot="attendance-ring"
      data-revealed={revealed}
      // Focusable so the second reading is reachable without a mouse; the
      // handlers below are the only keys and events it takes part in.
      tabIndex={0}
      role="group"
      aria-label={label ?? t(DEFAULT_LABEL_KEY)}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onFocus={() => setRevealed(true)}
      onBlur={() => setRevealed(false)}
      className={cn("relative shrink-0", className)}
      style={{ width: RING_SIZE, height: RING_SIZE }}
    >
      {/* Decoration: the reading is the DOM text in the middle, so the arc
          itself is hidden from the accessibility tree. */}
      <svg
        data-slot="attendance-ring-svg"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        width={RING_SIZE}
        height={RING_SIZE}
        aria-hidden="true"
        focusable="false"
        // Starts the arc at twelve o'clock rather than at three.
        className="-rotate-90"
      >
        <circle
          data-slot="attendance-ring-track"
          cx={RING_CENTRE}
          cy={RING_CENTRE}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_STROKE_WIDTH}
          className="stroke-bg/15"
        />
        <circle
          data-slot="attendance-ring-arc"
          cx={RING_CENTRE}
          cy={RING_CENTRE}
          r={RING_RADIUS}
          fill="none"
          strokeWidth={RING_STROKE_WIDTH}
          strokeLinecap="round"
          // THE SWEEP. Two numbers transitioning in CSS — from an empty ring on
          // the first paint, and between shares on every filter change after
          // it. `useGrow` is `true` immediately under reduced motion, so the
          // arc is never stranded at `emptyDashArray`.
          strokeDasharray={grown ? geometry.dashArray : geometry.emptyDashArray}
          className={cn(
            "stroke-accent-target-hit transition-[stroke-dasharray] duration-(--duration-grow) ease-enter",
            // The soft glow, from the token-mixing rule in `app/app.css`.
            revealed && RING_GLOW_CLASS,
          )}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          {/* The product's headline-number role class, not a size of its own —
              and `text-bg` because this sits on the navy band. */}
          <span
            data-slot="attendance-ring-value"
            className="kpi-number block text-bg"
          >
            {revealed ? formatSharePercent(share) : formatNumber(counted)}
          </span>
          <span
            data-slot="attendance-ring-caption"
            className="mt-1 block text-caption text-bg/60"
          >
            {t(revealed ? RING_LABEL_KEY.capacity : RING_LABEL_KEY.average)}
          </span>
        </div>
      </div>
    </div>
  );
}
