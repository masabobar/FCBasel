/**
 * The translation layer — every word on screen, in English and German, keyed.
 *
 * WHY THERE IS NO i18n LIBRARY HERE. `technologies.md` lists every i18next
 * package as "not used"; this prototype makes no network call after load, ships
 * two languages and needs neither plural rules, nor namespaces loaded on
 * demand, nor locale detection. What it needs is a dictionary, a lookup and a
 * React context — about eighty lines — so adding a dependency (and its SSR
 * wiring in `app/root.tsx`) would buy nothing and cost the offline guarantee a
 * runtime fetch could break.
 *
 * THE TWO DICTIONARIES ARE TYPE-LOCKED TO EACH OTHER. {@link DICTIONARIES} is
 * declared as `Record<Locale, Dictionary>` where `Dictionary` is the SHAPE OF
 * `en.json`, so a key added to the English file and forgotten in the German one
 * fails `pnpm typecheck` rather than rendering a raw key at the projector.
 * `tests/unit/i18n-dictionary.test.ts` closes the other direction (a German key
 * with no English counterpart) and checks no value was left in English by
 * accident.
 *
 * KEYS ARE DOTTED PATHS AND ARE TYPED. {@link TranslationKey} is derived from
 * the English dictionary, so `t("hero1.kitsTitle")` is checked at compile time
 * and a typo cannot reach a render. {@link TranslationListKey} is the same for
 * the handful of values that are ARRAYS (the thinking panel's data sources).
 *
 * NOTHING IS PERSISTED. `constraints.md` §2 forbids persistence across
 * sessions, so the selected locale is React state in `app/root.tsx` and there
 * is no cookie, no `localStorage` and no `Accept-Language` sniffing anywhere in
 * this module. A reload returns to {@link DEFAULT_LOCALE}, exactly as a reload
 * returns to the baseline dashboard.
 */

import de from "./locales/de.json";
import en from "./locales/en.json";

/* --------------------------------------------------------------- LOCALE -- */

/**
 * The two languages the demo is given in.
 *
 * LOWERCASE, UNLIKE EVERY OTHER ENUM IN THIS CODEBASE. The wire format rule
 * (`.claude/rules/enums-and-constants.md`) mandates `SCREAMING_SNAKE_CASE` for
 * values crossing a layer boundary; a language tag is the documented exception,
 * because this value is written straight into `<html lang>` where BCP 47
 * defines the spelling. Using `EN` there would be a bug in the markup, not a
 * style choice.
 */
export const Locale = {
  EN: "en",
  DE: "de",
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

/** Both locales, in the order the language toggle offers them. */
export const LOCALES: readonly Locale[] = [Locale.EN, Locale.DE];

/**
 * The language a fresh session starts in.
 *
 * English, by the same decision that keeps the fixtures' figures fixed: the
 * demo is rehearsed in English and the German pass is the alternative reading,
 * not a replacement. The presenter switches in one press (`LanguageToggle`).
 */
export const DEFAULT_LOCALE: Locale = Locale.EN;

/* ------------------------------------------------------------------ KEYS -- */

/** The English dictionary IS the contract; German must match its shape. */
type Dictionary = typeof en;

/** Dotted paths to every STRING leaf, e.g. `"hero1.narrative.primary"`. */
type StringPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends readonly string[]
      ? never
      : `${K}.${StringPaths<T[K]>}`;
}[keyof T & string];

/** Dotted paths to every ARRAY leaf, e.g. `"thinking.hero.HERO_1.sources"`. */
type ListPaths<T> = {
  [K in keyof T & string]: T[K] extends readonly string[]
    ? K
    : T[K] extends string
      ? never
      : `${K}.${ListPaths<T[K]>}`;
}[keyof T & string];

/** Every translatable string, as a compile-time-checked dotted path. */
export type TranslationKey = StringPaths<Dictionary>;

/** Every translatable list of strings. */
export type TranslationListKey = ListPaths<Dictionary>;

/**
 * Values substituted into a `{placeholder}` in a translated string.
 *
 * Numbers are allowed and are stringified by the caller's own formatter BEFORE
 * they arrive here — `app/lib/format.ts` owns Swiss grouping, and a translation
 * must never become a second place where a figure is formatted.
 */
export type TranslationParams = Readonly<Record<string, string | number>>;

/**
 * The one function every component renders copy through.
 *
 * Passed as a VALUE rather than imported, so a pure module that needs a label
 * (`../repositories/derive.ts`) takes it as a parameter and stays independent
 * of React and of the selected locale — Dependency Inversion, per
 * `.claude/rules/code-quality.md`.
 */
export type Translator = (
  key: TranslationKey,
  params?: TranslationParams,
) => string;

/* ----------------------------------------------------------- DICTIONARIES -- */

/**
 * The dictionaries, keyed by locale.
 *
 * THE TYPE ANNOTATION IS THE PARITY CHECK — see the file header. Do not widen
 * it to `Record<Locale, unknown>` or the German file could silently lose a key.
 */
const DICTIONARIES: Record<Locale, Dictionary> = {
  [Locale.EN]: en,
  [Locale.DE]: de,
};

/** Walk a dotted path into a dictionary. `undefined` when the path is absent. */
function lookup(locale: Locale, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, segment) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      DICTIONARIES[locale],
    );
}

/** `{placeholder}` substitution. Absent params are left untouched. */
const PLACEHOLDER = /\{(\w+)\}/g;

function interpolate(template: string, params?: TranslationParams): string {
  if (params === undefined) return template;

  return template.replace(PLACEHOLDER, (whole, name: string) => {
    const value = params[name];
    return value === undefined ? whole : String(value);
  });
}

/* ------------------------------------------------------------- TRANSLATE -- */

/**
 * One translated string.
 *
 * FALLS BACK RATHER THAN THROWING. A missing German value resolves to the
 * English one, and a key missing from both resolves to the key itself — a
 * presenter mid-demo gets a word they can read, never a blank tile or a crash.
 * Both fallbacks are unreachable while the types hold; they exist for the
 * moment the types are bypassed (a cast, a hand-written key) on stage.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const value = lookup(locale, key);
  if (typeof value === "string") return interpolate(value, params);

  const english = lookup(DEFAULT_LOCALE, key);
  if (typeof english === "string") return interpolate(english, params);

  return key;
}

/** One translated list — the thinking panel's data-source chips. */
export function translateList(
  locale: Locale,
  key: TranslationListKey,
): readonly string[] {
  const value = lookup(locale, key);
  if (Array.isArray(value)) return value as readonly string[];

  const english = lookup(DEFAULT_LOCALE, key);
  return Array.isArray(english) ? (english as readonly string[]) : [];
}

/** A {@link Translator} bound to one locale. */
export function translatorFor(locale: Locale): Translator {
  return (key, params) => translate(locale, key, params);
}
