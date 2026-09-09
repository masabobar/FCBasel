/**
 * Display formatters - the ONE place a number becomes a string.
 *
 * Every tile in Phase 2b and every hero in Phase 3b renders its figures through
 * this module. The datasets store plain numbers on purpose (see
 * `./repositories/types.ts`), so nothing downstream is allowed to assemble
 * "CHF 148'200" by hand: a second spelling of the currency, the separator or the
 * sign is exactly how two tiles end up disagreeing in front of the room.
 *
 * These functions are PURE and STATELESS. No clock, no locale negotiation at
 * call time, no configuration.
 *
 * THE LOCALE DECISION - read before changing `GROUP_SEPARATOR`.
 * The Reference Implementation Guide formats with `Intl.NumberFormat("en-CH")`,
 * and that is matched here. On a full-ICU runtime `en-CH` groups thousands with
 * U+2019 RIGHT SINGLE QUOTATION MARK - `CHF 3'811'500` - which is the Swiss
 * convention and what the approved prototype puts on screen for a Basel
 * audience. It is deliberately kept, and pinned as a constant, for two reasons:
 *   1. the approved prototype renders it, and `.project-management/input/scope.md`
 *      makes that prototype definitive for the intended experience;
 *   2. it is the correct separator for the club's own market.
 * The one place the product still shows a comma is inside the VERBATIM
 * narrative copy ("about 3,200 fewer seats"), which is hand-authored prose and
 * must not be edited. That tension is known and accepted: prose reads in
 * sentences, tiles read in columns.
 *
 * DETERMINISM. ICU data differs between Node builds (a small-ICU runtime falls
 * back to `en-US` and would group with a comma), so no output here is left to
 * whatever ICU happens to ship: the separator ICU produced is detected once and
 * rewritten to {@link GROUP_SEPARATOR}, and the sign is always our own ASCII
 * hyphen rather than ICU's minus glyph. The formatted string is therefore the
 * same on a laptop, in CI and on the projector.
 *
 * ROUNDING. There is ONE rounding rule for a displayed percentage and it lives
 * in `./repositories/derive.ts` as `oneDecimal`. It is imported here rather than
 * restated. Money rounds to whole CHF for display, which is a scale decision
 * rather than a competing rule.
 */

import { oneDecimal } from "./repositories/derive";
import { VarianceDirection } from "./repositories/enums";

/* ------------------------------------------------------------ CONSTANTS -- */

/** The locale every figure is formatted in. Matches the Reference Guide. */
export const NUMBER_LOCALE = "en-CH";

/** The currency unit, written before the amount. Never omitted from money. */
export const CURRENCY_PREFIX = "CHF";

/**
 * Thousands separator: U+2019, the Swiss group mark. Pinned so a runtime with
 * different ICU data cannot silently change what the tiles show.
 */
export const GROUP_SEPARATOR = "’";

/** Decimal separator. `en-CH` uses a full stop; pinned for the same reason. */
export const DECIMAL_SEPARATOR = ".";

/** Negative sign. A plain ASCII hyphen, never U+2212. */
export const MINUS_SIGN = "-";

/** Positive sign. Written explicitly on every variance. */
export const PLUS_SIGN = "+";

/** Suffix for an amount quoted in thousands: `CHF 150k`. */
export const THOUSANDS_SUFFIX = "k";

/** Suffix for an amount quoted in millions: `CHF 3.81M`. */
export const MILLIONS_SUFFIX = "M";

/** Suffix for a share or a percentage change. */
export const PERCENT_SUFFIX = "%";

/** Hero 2 and Hero 3 store money in CHF thousands. ONE conversion, here. */
export const CHF_PER_THOUSAND = 1000;

/** Millions scale, for the department table and the hero KPI numbers. */
export const CHF_PER_MILLION = 1_000_000;

/** A fraction (0 to 1) becomes a percentage by this factor. */
export const PERCENT_SCALE = 100;

/**
 * TABULAR NUMERALS - how a component opts in.
 *
 * The affordance itself belongs to the US-003 token layer and is NOT restated
 * here: `app/app.css` sets `font-variant-numeric: tabular-nums` on
 * `.kpi-number`, so a headline KPI needs nothing extra. Anywhere else - table
 * cells, chart tooltips, legend values, the count-up in a donut centre - the
 * element carries this Tailwind utility, whose name is the same CSS value the
 * token layer declares. `tests/unit/format.test.ts` reads that declaration back
 * out of the stylesheet so this constant cannot drift away from it.
 *
 * It matters because every one of these numbers animates. Proportional digits
 * change width as a count-up runs and the figure jitters; tabular digits do not.
 */
export const TABULAR_NUMERALS_CLASS = "tabular-nums";

/* --------------------------------------------------------- ICU PLUMBING -- */

const groupedFormat = new Intl.NumberFormat(NUMBER_LOCALE, {
  maximumFractionDigits: 0,
});

const upToTwoDecimalsFormat = new Intl.NumberFormat(NUMBER_LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const twoDecimalsFormat = new Intl.NumberFormat(NUMBER_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const upToOneDecimalFormat = new Intl.NumberFormat(NUMBER_LOCALE, {
  maximumFractionDigits: 1,
});

/**
 * The separator this runtime's ICU actually produced, read once from a probe
 * value that exercises both a group and a decimal.
 */
function icuSeparator(
  type: "group" | "decimal",
  pinned: string,
): string | undefined {
  const produced = twoDecimalsFormat
    .formatToParts(1_234.5)
    .find((part) => part.type === type)?.value;
  return produced === pinned ? undefined : produced;
}

const ICU_GROUP_SEPARATOR = icuSeparator("group", GROUP_SEPARATOR);
const ICU_DECIMAL_SEPARATOR = icuSeparator("decimal", DECIMAL_SEPARATOR);

/**
 * Rewrites whatever separators ICU used to the pinned ones. Always applied to
 * a MAGNITUDE - the sign is added by the caller - so no minus glyph survives.
 * `undefined` means ICU already agreed with us and nothing has to be rewritten.
 */
function pinSeparators(formatted: string): string {
  const grouped =
    ICU_GROUP_SEPARATOR === undefined
      ? formatted
      : formatted.split(ICU_GROUP_SEPARATOR).join(GROUP_SEPARATOR);
  return ICU_DECIMAL_SEPARATOR === undefined
    ? grouped
    : grouped.split(ICU_DECIMAL_SEPARATOR).join(DECIMAL_SEPARATOR);
}

/** `-` for a negative value, `+` for zero and above - as the Guide signs it. */
function signOf(value: number): string {
  return value < 0 ? MINUS_SIGN : PLUS_SIGN;
}

/** `-` for a negative value and nothing at all otherwise. */
function negativePrefix(value: number): string {
  return value < 0 ? MINUS_SIGN : "";
}

/* ------------------------------------------------------------- SCALING -- */

/**
 * CHF thousands to CHF. Hero 2's fixtures and Hero 3's departments are stored
 * in thousands; every formatter below takes plain CHF, so this is the single
 * conversion between the two and the only place a factor of 1000 appears.
 */
export function chfFromThousands(thousands: number): number {
  return thousands * CHF_PER_THOUSAND;
}

/* ------------------------------------------------------------- INTEGERS -- */

/** A plain count, grouped: `38'500` shirts. */
export function formatNumber(value: number): string {
  return (
    negativePrefix(value) + pinSeparators(groupedFormat.format(Math.abs(value)))
  );
}

/** A signed count, sign always written: `+680`, `-50`. */
export function formatSignedNumber(value: number): string {
  return signOf(value) + pinSeparators(groupedFormat.format(Math.abs(value)));
}

/* ---------------------------------------------------------------- MONEY -- */

/**
 * Money in full, always with its unit: `CHF 3'811'500`.
 *
 * The unit is not optional. "Currency shown without unit" is called out in the
 * Build Specification as an edge case to prevent, which is why there is no
 * bare-amount variant of this function to reach for by mistake.
 */
export function formatMoney(chf: number): string {
  return `${negativePrefix(chf)}${CURRENCY_PREFIX} ${pinSeparators(
    groupedFormat.format(Math.abs(chf)),
  )}`;
}

/** The `150k` half of a compact amount, unsigned. */
function compactMagnitude(chf: number): string {
  const thousands = Math.round(Math.abs(chf) / CHF_PER_THOUSAND);
  return `${CURRENCY_PREFIX} ${pinSeparators(
    groupedFormat.format(thousands),
  )}${THOUSANDS_SUFFIX}`;
}

/**
 * Compact money for a bar label or a badge: `CHF 150k`, and `-CHF 150k` when
 * the amount is negative.
 *
 * THE SIGN GOES BEFORE THE UNIT. The declining-fixtures tile reads
 * `-CHF 400k total`, not `CHF -400k`: the minus belongs to the whole amount.
 */
export function formatMoneyCompact(chf: number): string {
  return negativePrefix(chf) + compactMagnitude(chf);
}

/** Compact money with the sign always written: `+CHF 130k`, `-CHF 150k`. */
export function formatSignedMoneyCompact(chf: number): string {
  return signOf(chf) + compactMagnitude(chf);
}

/* -------------------------------------------------------------- MILLIONS -- */

/**
 * A bare figure in millions, two decimals: `69.68` for CHF 69,680 thousand.
 *
 * NO UNIT, deliberately. This is the department table, whose subtitle reads
 * "figures in CHF millions" once for the whole table - repeating "CHF" in
 * thirty cells is noise, and the old "000" note the Build Specification warns
 * about is not reintroduced anywhere. Fixed at two decimals so the column
 * aligns under tabular numerals.
 */
export function formatMillions(chf: number): string {
  return (
    negativePrefix(chf) +
    pinSeparators(twoDecimalsFormat.format(Math.abs(chf) / CHF_PER_MILLION))
  );
}

/** A variance in millions, sign always written: `+0.68`, `-0.75`. */
export function formatSignedMillions(chf: number): string {
  return (
    signOf(chf) +
    pinSeparators(twoDecimalsFormat.format(Math.abs(chf) / CHF_PER_MILLION))
  );
}

/**
 * Money in millions with its unit, for a headline KPI: `CHF 3.81M`.
 *
 * Trailing zeros are dropped (`CHF 3M`, not `CHF 3.00M`) because this is one
 * large number reading as a sentence, not a column to align.
 */
export function formatMoneyMillions(chf: number): string {
  return `${negativePrefix(chf)}${CURRENCY_PREFIX} ${pinSeparators(
    upToTwoDecimalsFormat.format(Math.abs(chf) / CHF_PER_MILLION),
  )}${MILLIONS_SUFFIX}`;
}

/* ------------------------------------------------------------ PERCENTAGES -- */

/**
 * A percentage, to the app's one decimal: `8%`, `12.1%`, `-0.6%`.
 *
 * The value is rounded by `oneDecimal` - the SAME rule the derived figures use,
 * imported rather than restated - so a percentage cannot be rounded one way in
 * `derive.ts` and another way on its way to the screen. A whole number renders
 * without a redundant `.0`.
 */
export function formatPercent(percentValue: number): string {
  const rounded = oneDecimal(percentValue);
  return (
    negativePrefix(rounded) +
    pinSeparators(upToOneDecimalFormat.format(Math.abs(rounded))) +
    PERCENT_SUFFIX
  );
}

/**
 * A percentage variance with the sign always written: `+1%`, `-0.6%`.
 *
 * VARIANCE IS NEVER CARRIED BY COLOUR ALONE. A projector shifts green and red,
 * so the sign here and the arrow from {@link varianceDirection} are both
 * required alongside the `variancePositive` / `varianceNegative` token. This
 * module supplies the sign and the direction; the colour belongs to the
 * component, which is the only layer that knows whether the movement is good
 * news (see `varianceJudgement` in `./repositories/derive.ts`).
 */
export function formatSignedPercent(percentValue: number): string {
  const rounded = oneDecimal(percentValue);
  return (
    signOf(rounded) +
    pinSeparators(upToOneDecimalFormat.format(Math.abs(rounded))) +
    PERCENT_SUFFIX
  );
}

/**
 * A share of a whole, given as a fraction, shown as a WHOLE percent: `0.581818`
 * becomes `58%` and `0.08` becomes `8%`.
 *
 * Shares are read at a glance ("the Home kit drives 58% of shirt sales") and the
 * Reference Guide shows them without decimals. The exact fraction stays
 * available from `homeKitShare` / `badgeShare` for anything that needs it - the
 * rounding happens here, at the edge, and nowhere else.
 */
export function formatSharePercent(fraction: number): string {
  return formatPercent(Math.round(fraction * PERCENT_SCALE));
}

/* -------------------------------------------------------------- VARIANCE -- */

/**
 * Which way a movement went, for the arrow beside the sign.
 *
 * Returns a direction rather than a glyph on purpose: the tiles draw Lucide
 * icons, the charts draw SVG, and a hard-coded arrow character here would be a
 * third spelling neither of them uses.
 */
export function varianceDirection(value: number): VarianceDirection {
  if (value > 0) {
    return VarianceDirection.UP;
  }
  return value < 0 ? VarianceDirection.DOWN : VarianceDirection.FLAT;
}
