import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { createElement } from "react";

import {
  Locale,
  translateList,
  translatorFor,
  type TranslationListKey,
  type Translator,
} from "../../../app/lib/i18n";
import { I18nProvider } from "../../../app/lib/i18n/context";

/**
 * Translation helpers for the unit suite (US-049).
 *
 * WHY EVERY SUITE NEEDS THIS. Nothing in the product carries display text any
 * more: a component renders `t(key)` and a fixture stores the key. So a test
 * that used to compare against an imported string now compares against the
 * same key resolved through the same dictionary — which is stronger, not
 * weaker, because it fails if the key is missing from EITHER language.
 *
 * {@link t} IS ENGLISH, AND THAT IS THE DEFAULT ON PURPOSE. A component
 * mounted without a provider renders English (see `app/lib/i18n/context.tsx`),
 * so the existing suites keep asserting exactly the copy they always asserted.
 * {@link de} and {@link renderIn} are for the suites that prove the German
 * pass renders at all.
 */

/** The English translator — what an unwrapped render produces. */
export const t: Translator = translatorFor(Locale.EN);

/** The German translator. */
export const de: Translator = translatorFor(Locale.DE);

/** A list key in English (the thinking panel's data sources). */
export function tList(key: TranslationListKey): readonly string[] {
  return translateList(Locale.EN, key);
}

/** Render inside a provider pinned to one locale. */
export function renderIn(locale: Locale, ui: ReactElement): RenderResult {
  return render(
    createElement(I18nProvider, { locale, setLocale: () => {}, children: ui }),
  );
}
