/**
 * FCB design tokens — the single source of truth for every colour, type step,
 * spacing value, radius, shadow and motion value in the product.
 *
 * WHY THIS FILE EXISTS ALONGSIDE `app/app.css`
 * Tailwind v4 is CSS-first, so the tokens must exist as CSS custom properties
 * in `app/app.css` for utilities to be generated from them. The Phase 2b charts
 * are hand-built SVG and need the same values in JavaScript (stroke, fill and
 * gradient stops cannot use a Tailwind class). This module carries the values
 * for JavaScript; `app/app.css` carries them for CSS. The two are kept honest
 * by `tests/unit/tokens.test.ts`, which parses the stylesheet and fails on any
 * drift — never edit one without the other.
 *
 * Values follow the Reference Implementation Guide, which wins over the Build
 * Specification wherever the two disagree on a hex value (see
 * `.project-management/input/scope.md` §10).
 */

/* -------------------------------------------------------------- COLOURS -- */

/**
 * COLOUR DISCIPLINE — read before adding or reusing a colour.
 *
 * 1. `red` and `blue` carry SERIES IDENTITY (which kit, which season). They say
 *    "this line is the Home kit" or "this bar is season 26/27" — nothing else.
 * 2. Variance is expressed with `variancePositive` / `varianceNegative` ONLY,
 *    and always alongside an explicit sign and arrow. Colour is never the sole
 *    carrier of the up/down meaning.
 * 3. `red` NEVER means "bad". It is the club's hero colour. `varianceNegative`
 *    happens to share its hex — that is deliberate, and precisely why the two
 *    are separate tokens: a future change to one must not silently move the
 *    other.
 * 4. `gold` is an ACCENT ONLY: target-hit marks (`accentTargetHit`) and the
 *    follow-up treatment (`accentFollowUp`). There is NO gold ring on newly
 *    inserted tiles — the Reference Guide removed it, and the Build
 *    Specification's ring text is superseded. Do not reintroduce it.
 * 5. A design needing a colour outside this set is not permitted. Pick the
 *    nearest token; do not add a hex here to satisfy a single component.
 */
const palette = {
  /** Club red — hero colour and primary series identity. */
  red: "#D3010C",
  /** Brighter red, used only for gradients that lift off `red`. */
  redVivid: "#FF1433",
  /** Club blue — secondary series identity. */
  blue: "#004093",
  /** Deep navy — shell chrome and tertiary series identity. */
  navy: "#0E2356",
  /** Lighter navy, the far end of navy gradients. */
  navyLight: "#16307A",
  /** Accent gold. Accent only — see the discipline note above. */
  gold: "#FBD500",
  /** Darker gold, for gold text and icons that need contrast on white. */
  goldDeep: "#B8960B",
  /** Page background. */
  bg: "#FFFFFF",
  /** Inset surface (chips, tracks, scrollbars). Guide value. */
  surface: "#F1F4F9",
  /** Stronger inset surface, for a track that sits on `surface`. */
  surfaceStrong: "#E9EDF5",
  /** Card and control borders. */
  border: "#E4E7EC",
  /** Hairlines and chart grid lines. */
  line: "#EEF1F6",
  /** Primary text. Guide value. */
  text: "#161A20",
  /** Secondary text — subtitles, captions, axis labels. */
  muted: "#697386",
  /** Tertiary text — uppercase micro-labels. */
  faint: "#9AA3B2",
  /** Neutral series colour, for a fourth non-brand slice. */
  slate: "#94A3B8",
  /** Positive variance green. Guide value. */
  pos: "#0E9F6E",
  /** Negative variance. Shares the club red hex by design. */
  neg: "#D3010C",
} as const;

export const color = {
  ...palette,

  /* Series identity — which kit, which season. Never a judgement. */
  seriesPrimary: palette.red,
  seriesSecondary: palette.blue,
  seriesTertiary: palette.navy,
  /** Current season / current period in a two-series comparison. */
  seriesCurrent: palette.red,
  /** Prior season / prior period in a two-series comparison. */
  seriesPrevious: palette.navy,

  /* Variance — the only tokens permitted to encode good/bad. */
  variancePositive: palette.pos,
  varianceNegative: palette.neg,

  /* Accents — gold, and only here. */
  accentTargetHit: palette.gold,
  accentFollowUp: palette.goldDeep,
} as const;

/* ----------------------------------------------------------- TYPOGRAPHY -- */

export const fontFamily = {
  sans: `'Helvetica Neue', Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
} as const;

/** Type scale. Big numbers must also carry `tabular-nums` so digits do not
 *  jitter while a count-up animation runs. */
export const fontSize = {
  /** Uppercase tile title. */
  tileTitle: "13px",
  /** Headline KPI number — pair with `fontWeight.bold` and `tabular-nums`. */
  kpi: "30px",
  /** SVG chart axis labels. */
  chartAxis: "12px",
  /** Body copy. */
  body: "14px",
  /** Narrative caption strip under a tile. */
  caption: "13px",
} as const;

export const fontWeight = {
  body: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const letterSpacing = {
  /** Uppercase headings and tile titles. */
  heading: "0.04em",
  /** Large numerals, which need tightening at display size. */
  kpi: "-0.02em",
} as const;

export const lineHeight = {
  none: "1",
  tight: "1.15",
  body: "1.55",
} as const;

/* ------------------------------------------------- SPACING / RADII / etc -- */

export const spacing = {
  /** Internal padding of a tile card. */
  tile: "20px",
  /** Gap between tiles in the dashboard grid. */
  gridGap: "16px",
  /** Distance a newly inserted tile rises as it fades in. */
  enterRise: "12px",
} as const;

export const radius = {
  badge: "8px",
  chip: "11px",
  tile: "12px",
  panel: "16px",
  pill: "9999px",
} as const;

export const shadow = {
  /** Subtle layered shadow carried by every tile card. */
  tile: "0 1px 2px rgba(16, 24, 64, 0.04), 0 6px 20px -12px rgba(16, 24, 64, 0.14)",
  /** Lifted panel — thinking strip, fallback card. */
  raised: "0 6px 20px -12px rgba(16, 24, 64, 0.18)",
  /** Dark chart tooltip. */
  tooltip: "0 8px 20px -6px rgba(0, 0, 0, 0.4)",
  /** Focus ring on inputs, in club blue. */
  focus: "0 0 0 3px rgba(0, 64, 147, 0.1)",
} as const;

/* ------------------------------------------------------------- MOTION --- */

export const duration = {
  /** Hover and colour transitions. */
  fast: "150ms",
  /** Tile insertion — fade and rise. */
  enter: "400ms",
  /** Bars, rings and count-ups growing to their value. */
  grow: "700ms",
  /** Thinking scan line sweep. */
  scan: "1400ms",
  /** Slow accent glow pulse. */
  glow: "2400ms",
} as const;

export const easing = {
  /** Gentle overshoot-free ease used by the insertion animation. */
  enter: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  standard: "ease",
} as const;

/* --------------------------------------------------- CSS VARIABLE NAMES -- */

/**
 * Tailwind v4 theme namespace each token group is published under in
 * `app/app.css`. The drift test derives the expected custom-property name from
 * these, so a token added to one side without the other fails the suite.
 */
export const CSS_VARIABLE_PREFIX = {
  color: "--color",
  fontFamily: "--font",
  fontSize: "--text",
  fontWeight: "--font-weight",
  letterSpacing: "--tracking",
  lineHeight: "--leading",
  spacing: "--spacing",
  radius: "--radius",
  shadow: "--shadow",
  duration: "--duration",
  easing: "--ease",
} as const;

export const tokens = {
  color,
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
  spacing,
  radius,
  shadow,
  duration,
  easing,
} as const;

export type TokenGroup = keyof typeof tokens;
export type ColorToken = keyof typeof color;
export type FontSizeToken = keyof typeof fontSize;

/** `redVivid` -> `red-vivid`, so `color.redVivid` maps to `--color-red-vivid`. */
function kebabCase(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** The CSS custom property a token is published under in `app/app.css`. */
export function cssVariableName(group: TokenGroup, key: string): string {
  return `${CSS_VARIABLE_PREFIX[group]}-${kebabCase(key)}`;
}

/** `var(--color-red)` — for inline styles and SVG attributes that want the
 *  live custom property rather than a baked hex. */
export function cssVariable(group: TokenGroup, key: string): string {
  return `var(${cssVariableName(group, key)})`;
}
