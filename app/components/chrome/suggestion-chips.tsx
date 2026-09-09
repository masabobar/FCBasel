import { TrendingUp } from "lucide-react";

import { cn } from "../../lib/cn";
import {
  ChipKind,
  chipKey,
  type SuggestionChip,
  type SuggestionChips as SuggestionChipList,
} from "../../lib/dashboard/chips";
import { CHIP_SURFACE_CLASS } from "../controls/segmented";

/**
 * The suggestion-chip row — the prepared questions, made tappable.
 *
 * It renders into US-028's `children` slot on the prompt bar, in the row ABOVE
 * the field, and it is deliberately stateless: the chips it draws are derived
 * from the session by `app/lib/dashboard/chips.ts` and handed in as a prop, so
 * this file has no opinion at all about which chips exist or when one goes
 * away. Reset works on the row because there is nothing here for Reset to
 * reach into (US-015 criterion 2).
 *
 * IT REUSES THE CHIP SURFACE; IT DOES NOT RESTATE IT.
 * The 11px corner and the lift-and-tint hover are the shared `.fcb-chip` rule
 * in `app/app.css`, imported here as {@link CHIP_SURFACE_CLASS} from the
 * segmented control that left it exported for exactly this. The radius appears
 * nowhere in this file, the lift appears nowhere in this file, and
 * `rounded-full` / `rounded-pill` must never appear on a chip — "11px, not
 * fully rounded" is a reviewed decision, and a test rejects the pill.
 *
 * WHAT THE VARIANT TABLE ADDS is the TINT, which is the one half that differs
 * per kind (`segmented.tsx` says the same about its light/dark pair):
 *
 *   hero      White chip, hairline border, blue tint on hover — the neutral
 *             prompt, and the row's default.
 *   followUp  The GOLD-TINTED variant (criterion 5). Rule 4 of the colour
 *             discipline allows gold as an ACCENT, and this is one of its three
 *             sanctioned uses beside target-hit marks and the recommendation
 *             panel. It is a tint and a border, never a fill, and there is
 *             still no gold ring on an inserted tile.
 *
 * KIND IS NOT CARRIED BY COLOUR ALONE. A follow-up chip also wears the trend
 * glyph the reference build gives it, and — because a glyph is decoration to a
 * screen reader — a visually hidden {@link FOLLOW_UP_CHIP_HINT} that puts
 * "Follow-up" into its accessible name. The visible label itself stays exactly
 * as authored: rendered verbatim, never truncated, never re-cased.
 *
 * LABELS WRAP RATHER THAN OVERFLOW. The row wraps between chips, and a chip
 * long enough to exceed a narrow viewport ("Why is Marketing over budget &
 * behind target?" at 390px) wraps INSIDE the chip. `whitespace-nowrap` would
 * make one chip wider than the screen, and the shell clips sideways overflow,
 * so the end of the label would be unreachable — which is the truncation
 * criterion 5's sibling forbids.
 *
 * KEYBOARD: PLAIN BUTTONS, ONE STOP EACH, NO TRAP. Unlike the segmented
 * control, this row is NOT a radiogroup and takes no roving tabindex: nothing
 * here is "selected", every chip is an independent action, so Tab walks the row
 * in DOM order and continues into the prompt field. Enter and Space activate a
 * chip because it is a real `<button>`, not because this file handles a key.
 */

/* ------------------------------------------------------------- STRINGS -- */

/** The row's accessible name, so the chips are reachable as a group. */
export const CHIP_ROW_LABEL = "Suggested questions";

/**
 * Prefixed into a follow-up chip's accessible name, visually hidden. It is what
 * the gold tint and the trend glyph say to everyone else.
 */
export const FOLLOW_UP_CHIP_HINT = "Follow-up:";

/* ------------------------------------------------------------ VARIANTS -- */

/**
 * The tint per kind. A closed table keyed by {@link ChipKind}, so every
 * combination that can render is visible in one place and no caller can pass a
 * colour in.
 *
 * `--color-accent-follow-up` is the deep gold that reads on white; the flat
 * gold is used only as a low-opacity wash, exactly as the recommendation panel
 * does (`app/components/tiles/recommendation-panel.tsx`).
 */
export const CHIP_KIND_CLASS: Record<ChipKind, string> = {
  [ChipKind.HERO]:
    "border-border bg-bg text-text hover:border-blue hover:bg-blue/5 hover:text-blue hover:shadow-raised",
  [ChipKind.FOLLOW_UP]:
    "border-accent-follow-up/45 bg-gold/10 text-accent-follow-up hover:border-accent-follow-up hover:bg-gold/20 hover:shadow-raised",
};

/** The trend glyph on a follow-up chip. One step below the chip's 13px text. */
const FOLLOW_UP_GLYPH_SIZE = 12;

/* ------------------------------------------------------------ COMPONENT -- */

export interface SuggestionChipsProps {
  /**
   * The chips to offer, in display order. DERIVED — pass
   * `suggestionChips(sections)`; never a list this component or its caller
   * keeps in state of its own.
   */
  chips: SuggestionChipList;
  /**
   * A chip was tapped. Called with the CHIP, not with its label: the chip
   * carries the hero it means, which is how a tap bypasses US-030's scoring
   * (`selectChip` in `app/lib/dashboard/chips.ts`).
   */
  onSelect: (chip: SuggestionChip) => void;
  className?: string;
}

export function SuggestionChips({
  chips,
  onSelect,
  className,
}: SuggestionChipsProps) {
  // No chips is not a state this product reaches — the three hero chips are
  // always derived — but an empty row must not leave an empty group in the
  // accessibility tree if it ever is.
  if (chips.length === 0) return null;

  return (
    <div
      data-slot="suggestion-chips"
      role="group"
      aria-label={CHIP_ROW_LABEL}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {chips.map((chip) => (
        <button
          key={chipKey(chip)}
          type="button"
          data-slot="suggestion-chip"
          data-kind={chip.kind}
          onClick={() => onSelect(chip)}
          className={cn(
            CHIP_SURFACE_CLASS,
            "inline-flex items-center gap-1.5 border px-3 py-1.5 text-left text-caption font-medium",
            CHIP_KIND_CLASS[chip.kind],
          )}
        >
          {chip.kind === ChipKind.FOLLOW_UP && (
            <>
              <TrendingUp
                size={FOLLOW_UP_GLYPH_SIZE}
                aria-hidden="true"
                className="shrink-0"
              />
              <span className="sr-only">{FOLLOW_UP_CHIP_HINT}</span>
            </>
          )}
          {chip.label}
        </button>
      ))}
    </div>
  );
}
