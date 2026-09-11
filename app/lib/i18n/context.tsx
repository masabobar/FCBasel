import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  type Locale,
  translateList,
  translatorFor,
  type TranslationListKey,
  type Translator,
} from "./index";

/**
 * The selected language, as React context — the one thing every component
 * reads to render copy.
 *
 * THE DEFAULT VALUE IS A WORKING ENGLISH TRANSLATOR, NOT `null`. A component
 * mounted outside the provider therefore renders correct English rather than
 * throwing, which is what lets ~40 unit suites mount a tile directly and keeps
 * the language a property of the SHELL rather than a prop threaded through
 * every tile. The provider is mounted once, in `app/root.tsx`.
 *
 * THE LOCALE IS MEMORY-ONLY. See the note in `./index.ts`: `constraints.md` §2
 * forbids persistence across sessions, so there is no cookie and no storage
 * key here — `tests/e2e/dead-end-path-sweep.spec.ts` asserts zero storage keys
 * after the whole demo, and `tests/unit/language-toggle.test.tsx` asserts the
 * switch itself writes neither a key nor a cookie.
 */

export interface I18nValue {
  /** The language on screen. */
  readonly locale: Locale;
  /** Switch language. A no-op outside the provider. */
  readonly setLocale: (locale: Locale) => void;
  /** Translate one key. */
  readonly t: Translator;
  /** Translate one list key — the thinking panel's data sources. */
  readonly tList: (key: TranslationListKey) => readonly string[];
}

function valueFor(
  locale: Locale,
  setLocale: (locale: Locale) => void,
): I18nValue {
  return {
    locale,
    setLocale,
    t: translatorFor(locale),
    tList: (key) => translateList(locale, key),
  };
}

const NO_SWITCH = () => {};

const I18nContext = createContext<I18nValue>(
  valueFor(DEFAULT_LOCALE, NO_SWITCH),
);

export interface I18nProviderProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  children: ReactNode;
}

export function I18nProvider({
  locale,
  setLocale,
  children,
}: I18nProviderProps) {
  const value = useMemo(() => valueFor(locale, setLocale), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** The whole context — locale, switcher and both translators. */
export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

/** The translator alone. What almost every component wants. */
export function useT(): Translator {
  return useI18n().t;
}

/**
 * The session's language, as state the shell owns.
 *
 * IT ALSO KEEPS `<html lang>` HONEST. The document is server-rendered in
 * English (`app/root.tsx` cannot know a preference nobody has expressed yet),
 * so switching has to correct the attribute in place — a screen reader picks
 * its voice from it, and announcing German copy with an English voice is worse
 * than either language alone. Written from an effect rather than during render
 * because it touches the document, and skipped entirely on the server.
 */
export function useLocaleState(
  initial: Locale = DEFAULT_LOCALE,
): [Locale, (locale: Locale) => void] {
  const [locale, setLocale] = useState<Locale>(initial);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return [locale, setLocale];
}
