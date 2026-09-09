import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { cssVariableName, fontSize } from "./tokens";

/**
 * THE FONT-SIZE TRAP THIS FILE EXISTS TO CLOSE.
 *
 * Our type scale is named, not numbered — `text-caption`, `text-kpi`,
 * `text-body` — because the sizes belong to roles. `tailwind-merge` cannot know
 * that: out of the box it recognises `text-sm` as a size and everything else
 * after `text-` as a COLOUR, so `text-caption text-muted` looks to it like two
 * colours on one element and it drops the first. The size vanishes with no
 * error, and a 13px caption silently renders at whatever it inherits — found
 * the hard way in US-012.
 *
 * The fix is to declare the scale, once, here: every `fontSize` token becomes
 * a known member of the `font-size` group, so a size and a colour can share an
 * element (a KPI subtitle, a delta chip, a table cell) while two sizes still
 * correctly collapse to the last one.
 *
 * The list is DERIVED from the token set rather than retyped — a token added to
 * `./tokens.ts` is understood here immediately, and the utility name comes from
 * the same `cssVariableName` mapping Tailwind generates the utility from, so
 * the two cannot drift.
 */
const TOKEN_FONT_SIZE_UTILITIES = Object.keys(fontSize).map((token) =>
  // `--text-tile-title` is published as the `text-tile-title` utility.
  cssVariableName("fontSize", token).replace(/^--/, ""),
);

const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": TOKEN_FONT_SIZE_UTILITIES } },
});

/**
 * Joins conditional class names and resolves Tailwind conflicts, so a shared
 * component can carry its own base classes while still letting a caller
 * override one of them through `className` (`h-full`, a grid span, and so on).
 *
 * Custom token utilities outside the type scale (`p-tile`, `rounded-tile`) are
 * still outside `tailwind-merge`'s conflict groups; it passes them through
 * untouched, which is the safe direction — nothing is silently dropped.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
