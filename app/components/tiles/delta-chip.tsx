import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import {
  formatSignedPercent,
  TABULAR_NUMERALS_CLASS,
  varianceDirection,
} from "../../lib/format";
import { useT } from "../../lib/i18n/context";
import {
  VARIANCE_DIRECTION_LABEL_KEY,
  VarianceDirection,
  VarianceJudgement,
} from "../../lib/repositories/enums";

/**
 * The variance chip — an arrow, a signed figure, and a colour token, in that
 * order of importance.
 *
 * WHY THE ARROW AND THE SIGN COME FIRST
 * Colour is never the sole signal (`app/lib/tokens.ts`, colour discipline rule
 * 2). This chip is read off a projector that can wash green towards grey and
 * red towards orange, so the DIRECTION is carried three independent ways —
 * the glyph, the explicit `+`/`-` in the text, and a word in the accessibility
 * tree — and the colour token is the fourth, redundant, carrier. Remove the
 * colour entirely and the chip still says what happened; that is the test the
 * `light` variant below actually performs in production, on the navy band.
 *
 * ALSO: red never means "bad". Variance is expressed with the dedicated
 * `variancePositive` / `varianceNegative` tokens only, never with the club's
 * `red`, even though the negative token happens to share its hex.
 *
 * DIRECTION IS NOT JUDGEMENT. The arrow follows the arithmetic; the colour
 * follows the meaning. Marketing overspending its budget is UP and ADVERSE at
 * the same time, so a caller that knows the difference (the Hero 3 table, via
 * `varianceJudgement` in `app/lib/repositories/derive.ts`) passes `judgement`
 * and gets an up arrow in the negative token. Callers where the sign IS the
 * meaning — revenue against last month — pass nothing and the sign decides.
 * The chip never re-derives that judgement itself.
 *
 * This is the reference build's `Delta`, and it is deliberately its own module:
 * the grouped bars (US-019), the department table (US-022) and the hero band
 * (US-016) all want the chip without the KPI tile around it.
 */

/* --------------------------------------------------------------- TONES -- */

/**
 * Which background the chip is sitting on.
 *
 * `light` is for a DARK surface — the navy hero band. On navy the negative
 * token (#D3010C) falls to roughly 2:1 against the ground, which is not
 * legible at 13px, so the light variant drops colour coding altogether and
 * leans on the arrow and the sign. That is not a compromise: it is the
 * principle above, made load-bearing.
 */
export type DeltaVariant = "default" | "light";

/**
 * Chip colours, by variant and judgement. A closed table rather than a
 * computed string, so every combination that can render is visible here and
 * no caller can pass a colour in.
 */
export const DELTA_VARIANT_CLASS: Record<
  DeltaVariant,
  Record<VarianceJudgement, string>
> = {
  default: {
    [VarianceJudgement.FAVOURABLE]:
      "bg-variance-positive/10 text-variance-positive",
    [VarianceJudgement.ADVERSE]:
      "bg-variance-negative/10 text-variance-negative",
    // Neither good nor bad news: a zero is not a variance token's business.
    [VarianceJudgement.NEUTRAL]: "bg-surface text-muted",
  },
  light: {
    [VarianceJudgement.FAVOURABLE]: "bg-bg/15 text-bg",
    [VarianceJudgement.ADVERSE]: "bg-bg/15 text-bg",
    [VarianceJudgement.NEUTRAL]: "bg-bg/15 text-bg",
  },
};

/* --------------------------------------------------------------- ARROW -- */

/** The glyph per direction. A flat variance gets a dash, not an arrow. */
const DIRECTION_ICON = {
  [VarianceDirection.UP]: ArrowUp,
  [VarianceDirection.DOWN]: ArrowDown,
  [VarianceDirection.FLAT]: Minus,
} as const;

/** Sized and weighted to stay unambiguous at 1080p on a projector. */
const ARROW_SIZE = 14;
const ARROW_STROKE_WIDTH = 2.75;

/* ----------------------------------------------------------- JUDGEMENT -- */

/**
 * The fallback judgement: the sign of the movement.
 *
 * Correct wherever up is good news, which is every consumer except a cost
 * centre — and a cost centre passes `judgement` explicitly rather than relying
 * on this. Kept private so nothing outside can mistake it for the real
 * revenue/cost-aware rule in `derive.ts`.
 */
function judgementFromSign(value: number): VarianceJudgement {
  if (value > 0) {
    return VarianceJudgement.FAVOURABLE;
  }
  return value < 0 ? VarianceJudgement.ADVERSE : VarianceJudgement.NEUTRAL;
}

/* ---------------------------------------------------------------- CHIP -- */

export interface DeltaChipProps {
  /**
   * The variance itself. Its SIGN drives the arrow, so pass the movement, not
   * its magnitude: `-0.6`, not `0.6`.
   */
  value: number;
  /**
   * How the figure becomes text. Always a SIGNED formatter from
   * `app/lib/format.ts` — `formatSignedPercent` (the default),
   * `formatSignedMoneyCompact` for `+CHF 130k`, `formatSignedMillions` for a
   * department row. Never build the string in the caller.
   */
  format?: (value: number) => string;
  /**
   * Whether this movement is good news, when the sign does not say — a cost
   * centre's overspend is UP and ADVERSE. Defaults to the sign.
   */
  judgement?: VarianceJudgement;
  /** `light` for a dark surface (the navy hero band). */
  variant?: DeltaVariant;
  /**
   * A word after the figure, INSIDE the chip — US-023's driver tile reads
   * `-CHF 400k total`, one chip rather than a chip beside a stray label.
   *
   * A node, not a formatted string: the figure still comes from `format`, so
   * this cannot become a second place a number is assembled.
   */
  suffix?: ReactNode;
  className?: string;
}

export function DeltaChip({
  value,
  format = formatSignedPercent,
  judgement = judgementFromSign(value),
  variant = "default",
  suffix,
  className,
}: DeltaChipProps) {
  const t = useT();
  const direction = varianceDirection(value);
  const Arrow = DIRECTION_ICON[direction];

  return (
    <span
      data-slot="delta-chip"
      // Machine-readable direction and meaning, so a test — and the eventual
      // e2e pass — can assert them without reading a colour off a pixel.
      data-direction={direction}
      data-judgement={judgement}
      className={cn(
        "inline-flex items-center gap-1 rounded-badge px-1.5 py-0.5 text-caption font-semibold whitespace-nowrap",
        DELTA_VARIANT_CLASS[variant][judgement],
        className,
      )}
    >
      <Arrow
        data-slot="delta-arrow"
        aria-hidden="true"
        size={ARROW_SIZE}
        strokeWidth={ARROW_STROKE_WIDTH}
        className="shrink-0"
      />
      {/* The figure animates nowhere, but it sits in a column of chips in the
          department table — tabular digits keep those aligned. */}
      <span className={TABULAR_NUMERALS_CLASS}>{format(value)}</span>
      {suffix && <span data-slot="delta-suffix">{suffix}</span>}
      {/* The arrow is decorative, so the direction is stated in words here.
          Colour reaches no screen reader at all; this is the one carrier that
          is never lost. */}
      <span className="sr-only">
        {t(VARIANCE_DIRECTION_LABEL_KEY[direction])}
      </span>
    </span>
  );
}
