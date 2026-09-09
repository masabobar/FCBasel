import { useRef, type KeyboardEvent } from "react";

import { cn } from "../../lib/cn";
import { type PeriodKey } from "../../lib/repositories/enums";

/**
 * The segmented period filter — the reference build's `Segmented`, and the ONE
 * period control in the product.
 *
 * THREE CONSUMERS, ONE CONTROL. Everything that differs between them is a
 * prop, so none of them needs a copy:
 *
 *   Hero band (US-016), `dark`      This month / Last month / Last 3 months /
 *                                   Year to date, in the band header. ONE
 *                                   control drives both the webshop chart and
 *                                   the attendance ring, because both read the
 *                                   same period entry.
 *   Top Products (US-013), `light`  the same four periods, in the card's
 *                                   `action` slot.
 *   Hero 1 (US-034), `light`        Season to date / Last 3 months / Last
 *                                   month / Current month, in the SECTION
 *                                   header, driving three tiles at once.
 *
 * NOT WIRED HERE. This story builds the control only. US-013's card ships with
 * its `action` slot deliberately empty and US-016 / US-034 do not exist yet —
 * mounting it into them is their work, not this file's.
 *
 * IT IS CONTROLLED, WITH NO OPINION OF ITS OWN.
 * `value` is the caller's state and `onChange` is the only way it moves. There
 * is no internal selection, no defaulting to the first option and no "optimistic"
 * highlight: a press that the caller ignores changes nothing on screen. That is
 * what lets ONE control drive two tiles (the band) or three (Hero 1) without the
 * button row and the tiles ever disagreeing about which period is showing.
 *
 * THE LABEL IS DATA ON THE ENTRY, NOT A LOOKUP FROM THE KEY.
 * Hero 1 says "Current month" where the band says "This month" for the very
 * same `THIS_MONTH` key, so the wording travels with the option. `PERIOD_LABEL`
 * in `app/lib/repositories/enums.ts` is the DEFAULT wording, applied by the
 * fixture that builds the entries — never re-derived here.
 *
 * THE KEYS ARE `PeriodKey`, REUSED — NOT A LOCAL UNION.
 * `PeriodKey` already exists as the single source of truth for these five
 * values (`.claude/rules/enums-and-constants.md` §8). A competing string union
 * here would typecheck against nothing and drift the first time a period is
 * added, so `SegmentedOption` is deliberately typed to the shared enum. It is
 * also exactly the head of `BaselinePeriod`, `TopProductsPeriod` and
 * `Hero1Period`, so a consumer passes its period array straight in.
 *
 * NO HEX APPEARS HERE. Every colour is a token utility class, the radius comes
 * from `--radius-chip`, and a test enforces both.
 */

/* -------------------------------------------------------- CHIP SURFACE -- */

/**
 * The shared chip surface: an 11px radius, a lift-and-tint hover, and the
 * transition that carries both. Defined in `app/app.css` so the value is
 * written once.
 *
 * ELEVEN PIXELS IS A REVIEWED DECISION, NOT A ROUNDING. The reference notes
 * record "not fully rounded" as feedback: this control and the suggestion chips
 * are 11px, deliberately NOT a full pill. `rounded-full` must never appear on
 * either, and a test rejects it.
 *
 * Exported because US-029's suggestion chips wear the same treatment; when they
 * arrive, they import this rather than retyping the class name. The TINT is not
 * in here — it differs per surface (grey on white, translucent white on navy),
 * so it lives with the variant table below, which is the only half a
 * light/dark pair actually has to change.
 */
export const CHIP_SURFACE_CLASS = "fcb-chip";

/* ------------------------------------------------------------ VARIANTS -- */

/** Which surface the control is sitting on. */
export type SegmentedVariant = "light" | "dark";

/**
 * The variant is named for the SURFACE UNDER THE CONTROL, not for the ink on
 * it: `dark` is the navy hero band, `light` is a white card or section header.
 * (`DeltaChip` inherited the opposite convention from the reference build —
 * its `light` variant is the one FOR a dark band. The two are not the same
 * word, which is why this note exists.)
 *
 * A closed table rather than computed strings, so every combination that can
 * render is visible in one place and no caller can pass a colour in.
 */
export const SEGMENTED_VARIANT_CLASS: Record<
  SegmentedVariant,
  { readonly group: string; readonly option: string; readonly selected: string }
> = {
  light: {
    group: "border-border bg-surface",
    option: "text-muted hover:bg-surface-strong hover:text-navy",
    selected: "bg-navy text-bg shadow-raised",
  },
  dark: {
    // Translucent white rather than a token colour: the band's navy shows
    // through, which is what makes one control read as part of it.
    group: "border-bg/15 bg-bg/10",
    option: "text-bg/70 hover:bg-bg/15 hover:text-bg",
    // Gold on navy, as the reference build does — the club's accent against
    // the band, and the only pairing that clears contrast at this size.
    selected: "bg-gold text-navy shadow-raised",
  },
};

/**
 * Weight, not just colour, separates the selected option from the rest.
 *
 * The projector-shift rule (`app/lib/tokens.ts`, colour discipline 2) applies
 * to a control as much as to a variance chip: on a washed-out projector the
 * navy fill can drift towards grey, so selection is carried FOUR ways — the
 * filled shape, the raised shadow, the heavier weight, and `aria-checked` in
 * the accessibility tree. Remove the colour entirely and the control still
 * says which period is showing.
 */
const SELECTED_WEIGHT_CLASS = "font-bold";
const UNSELECTED_WEIGHT_CLASS = "font-semibold";

/**
 * The type step. The reference build draws these labels at 12px, and the only
 * 12px token in the set is `--text-chart-axis`, which is the SVG-axis role and
 * would read as a lie on a button. The nearest UI text role is the 13px
 * caption, so that is what a segment wears (`tokens.ts`, discipline 5: pick the
 * nearest token, never add a value for one component).
 */
const SEGMENT_TEXT_CLASS = "text-caption";

/* ------------------------------------------------------------ KEYBOARD -- */

/** No option matches `value` — the control is unset. */
export const NO_SELECTION = -1;

/**
 * Where an arrow key moves the selection, or `null` for a key this control does
 * not handle — so Tab, Enter, Space and everything else keep their default
 * behaviour and the tab order is untouched.
 *
 * A radiogroup's arrows WRAP and they SELECT as they move (WAI-ARIA APG), which
 * is what a period filter wants: every stop is a valid choice, so there is no
 * "committing" step to leave a user stranded in.
 *
 * Both axes are handled because the control is a row here and could be stacked
 * by a narrow section header later; an unset control enters at the first option
 * going forwards and the last going back.
 */
export function nextOptionIndex(
  key: string,
  current: number,
  count: number,
): number | null {
  if (count < 1) return null;
  const last = count - 1;
  const unset = current < 0 || current > last;

  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return unset ? 0 : (current + 1) % count;
    case "ArrowLeft":
    case "ArrowUp":
      return unset ? last : (current + last) % count;
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return null;
  }
}

/* ------------------------------------------------------------- CONTROL -- */

/**
 * One selectable period: the shared key, plus the wording THIS consumer uses
 * for it.
 *
 * Structurally the head of `BaselinePeriod`, `TopProductsPeriod` and
 * `Hero1Period` (`app/lib/repositories/types.ts`), so a consumer hands its
 * period array over as it stands rather than mapping it into a second shape.
 */
export interface SegmentedOption {
  readonly key: PeriodKey;
  readonly label: string;
}

export interface SegmentedProps {
  /** The periods, in display order. Empty renders nothing. */
  options: readonly SegmentedOption[];
  /** The selected period. The CALLER's state — see the note on control above. */
  value: PeriodKey;
  /** Called with the pressed period's key. The only thing that moves `value`. */
  onChange: (key: PeriodKey) => void;
  /** `dark` for the navy hero band, `light` for a card or section header. */
  variant?: SegmentedVariant;
  /**
   * The group's accessible name. A dashboard can show three of these at once —
   * the band's, Top Products' and Hero 1's — so name them for what they drive
   * ("Period for top products") wherever more than one is on screen.
   */
  label?: string;
  className?: string;
}

const DEFAULT_LABEL = "Period";

/** Addresses one option button inside the group, for arrow-key focus moves. */
const OPTION_SELECTOR = '[data-slot="segmented-option"]';

export function Segmented({
  options,
  value,
  onChange,
  variant = "light",
  label = DEFAULT_LABEL,
  className,
}: SegmentedProps) {
  const group = useRef<HTMLDivElement>(null);
  const tone = SEGMENTED_VARIANT_CLASS[variant];

  if (options.length === 0) return null;

  const selectedIndex = options.findIndex((one) => one.key === value);
  /**
   * ONE TAB STOP FOR THE WHOLE GROUP (roving tabindex): the selected option is
   * the only focusable button, and the arrows move between the rest. An UNSET
   * control still has to be reachable, so the first option holds the stop —
   * otherwise the group would be a keyboard dead end.
   */
  const tabStopIndex = selectedIndex === NO_SELECTION ? 0 : selectedIndex;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextOptionIndex(event.key, selectedIndex, options.length);
    if (next === null) return;

    const option = options[next];
    if (!option) return;

    // Arrows drive the control, not the page: an ArrowDown must not scroll.
    event.preventDefault();
    onChange(option.key);
    // Focus follows selection, as a radiogroup requires. The button is keyed by
    // its period so the node survives the caller's re-render.
    group.current
      ?.querySelectorAll<HTMLButtonElement>(OPTION_SELECTOR)
      [next]?.focus();
  }

  return (
    <div
      ref={group}
      data-slot="segmented"
      data-variant={variant}
      // A single-choice control, so radiogroup rather than a set of toggles:
      // it is announced as "1 of 4" and the arrows behave as expected.
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex rounded-chip border p-0.5",
        tone.group,
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = index === selectedIndex;

        return (
          <button
            key={option.key}
            type="button"
            data-slot="segmented-option"
            data-selected={selected}
            role="radio"
            aria-checked={selected}
            tabIndex={index === tabStopIndex ? 0 : -1}
            onClick={() => onChange(option.key)}
            className={cn(
              CHIP_SURFACE_CLASS,
              "px-2.5 py-1.5 whitespace-nowrap",
              SEGMENT_TEXT_CLASS,
              selected ? SELECTED_WEIGHT_CLASS : UNSELECTED_WEIGHT_CLASS,
              selected ? tone.selected : tone.option,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
