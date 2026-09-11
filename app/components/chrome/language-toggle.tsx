import { cn } from "../../lib/cn";
import { LOCALES, Locale, type TranslationKey } from "../../lib/i18n";
import { useI18n } from "../../lib/i18n/context";
import {
  CHIP_SURFACE_CLASS,
  SEGMENTED_VARIANT_CLASS,
} from "../controls/segmented";

/**
 * EN / DE — the language switch, in the app bar (US-049).
 *
 * WHY IT IS ITS OWN CONTROL AND NOT `Segmented`. The segmented control is
 * typed to `PeriodKey` end to end (`../controls/segmented.tsx`) because that
 * is what makes a period filter impossible to mis-wire; genericising it over
 * an arbitrary key to gain two buttons would weaken the control that drives
 * five tiles to serve the one that drives none. It BORROWS the styling
 * instead — the same chip surface and the same light-variant tokens — so the
 * two read as one family without sharing a type.
 *
 * IT IS THE ONLY PLACE THE LANGUAGE CHANGES. The locale is memory-only state
 * owned by `app/root.tsx` (`constraints.md` §2 forbids persistence), reaches
 * this button through context, and goes nowhere else: no cookie is written, no
 * request is made, and a reload legitimately returns to English.
 *
 * A RADIOGROUP, LIKE THE PERIOD FILTER. Two mutually exclusive options with
 * one always chosen is a radio group, not a pair of toggles, so it is
 * announced as "1 of 2" and `aria-checked` carries the state to a screen
 * reader rather than the fill colour carrying it alone.
 */

/** The group's accessible name. */
export const LANGUAGE_TOGGLE_LABEL_KEY: TranslationKey = "topBar.languageLabel";

/** The two-letter label per locale. `EN` / `DE` in both dictionaries. */
export const LOCALE_LABEL_KEY: Record<Locale, TranslationKey> = {
  [Locale.EN]: "topBar.languageEn",
  [Locale.DE]: "topBar.languageDe",
};

/** The same tokens the light segmented control wears. */
const TONE = SEGMENTED_VARIANT_CLASS.light;

export interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      data-slot="language-toggle"
      role="radiogroup"
      aria-label={t(LANGUAGE_TOGGLE_LABEL_KEY)}
      className={cn(
        "inline-flex shrink-0 rounded-chip border p-0.5",
        TONE.group,
        className,
      )}
    >
      {LOCALES.map((one) => {
        const selected = one === locale;

        return (
          <button
            key={one}
            type="button"
            data-slot="language-option"
            data-locale={one}
            data-selected={selected}
            role="radio"
            aria-checked={selected}
            onClick={() => setLocale(one)}
            className={cn(
              CHIP_SURFACE_CLASS,
              "px-2 py-1 text-caption",
              selected ? "font-bold" : "font-semibold",
              selected ? TONE.selected : TONE.option,
            )}
          >
            {t(LOCALE_LABEL_KEY[one])}
          </button>
        );
      })}
    </div>
  );
}
