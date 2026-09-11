/**
 * US-049 — **the two dictionaries, as a contract.**
 *
 * The product carries no display text any more: a component renders `t(key)`
 * and a fixture stores the key, so the dictionaries in
 * `app/lib/i18n/locales/` are now the whole of the copy. This suite is what
 * makes that safe.
 *
 * WHAT THE TYPES ALREADY GUARANTEE, so this file does not re-assert it:
 * `DICTIONARIES` is typed `Record<Locale, typeof en>` (`app/lib/i18n/index.ts`),
 * so an English key missing from German fails `pnpm typecheck`. What the types
 * canNOT see is the other direction (a German key with no English parent), a
 * value left in English by accident, or a house-style rule — and each of those
 * is a defect a presenter meets on a projector rather than in CI, so each is a
 * test below.
 *
 * THE HOUSE RULES APPLY TO BOTH LANGUAGES. US-044 sweeps every rendered text
 * node for an em or en dash and fails on one; the German pass is rendered text
 * like any other, so it is swept here at the source. Swiss German is also a
 * rule rather than a preference — the club is in Basel and `ß` does not exist
 * in Swiss orthography, so a `ß` anywhere in the German file is a defect.
 */

import { describe, expect, it } from "vitest";

import de from "../../app/lib/i18n/locales/de.json";
import en from "../../app/lib/i18n/locales/en.json";
import {
  DEFAULT_LOCALE,
  LOCALES,
  Locale,
  translate,
  translateList,
  translatorFor,
  type TranslationKey,
} from "../../app/lib/i18n";

type Node = Record<string, unknown>;

/** Every dotted path in a dictionary, with the value at the end of it. */
function flatten(node: Node, prefix = ""): Map<string, unknown> {
  const flat = new Map<string, unknown>();

  for (const [key, value] of Object.entries(node)) {
    const path = prefix === "" ? key : `${prefix}.${key}`;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      for (const [inner, leaf] of flatten(value as Node, path)) {
        flat.set(inner, leaf);
      }
      continue;
    }

    flat.set(path, value);
  }

  return flat;
}

const ENGLISH = flatten(en as unknown as Node);
const GERMAN = flatten(de as unknown as Node);

/** Keys whose two languages are legitimately identical. */
const SAME_IN_BOTH = new Set<string>([
  // Proper nouns and the product's own name.
  "app.documentTitle",
  "crest.label",
  "login.title",
  "nav.dashboard",
  "topBar.languageEn",
  "topBar.languageDe",
  // Words Swiss business German uses as they stand.
  "hero3.budget",
  "tiles.column.budget",
  "tiles.total",
  "enum.department.TICKETING",
  "enum.department.HOSPITALITY",
  "enum.department.EVENTS",
  "enum.department.MERCHANDISING",
  "enum.product.CAP_ROTBLAU",
  // A composition of two translated halves, in the same order in both.
  "persona.greetingLine",
  // Week and month abbreviations that coincide.
  "enum.week.W1",
  "enum.week.W2",
  "enum.week.W3",
  "enum.week.W4",
  "enum.month.JANUARY",
  "enum.month.FEBRUARY",
  "enum.month.APRIL",
  "enum.month.JUNE",
  "enum.month.JULY",
  "enum.month.AUGUST",
  "enum.month.SEPTEMBER",
  "enum.month.NOVEMBER",
]);

/* ------------------------------------------------------------- PARITY -- */

describe("the two dictionaries describe the same product", () => {
  it("holds exactly the same keys in both languages", () => {
    expect([...GERMAN.keys()].sort()).toEqual([...ENGLISH.keys()].sort());
  });

  it("holds the same SHAPE at every key — a list stays a list", () => {
    for (const [key, value] of ENGLISH) {
      const german = GERMAN.get(key);

      if (Array.isArray(value)) {
        expect(Array.isArray(german)).toBe(true);
        expect((german as unknown[]).length).toBe(value.length);
        continue;
      }

      expect(typeof german).toBe("string");
    }
  });

  it("leaves nothing but proper nouns untranslated", () => {
    const identical = [...ENGLISH]
      .filter(
        ([key, value]) =>
          JSON.stringify(GERMAN.get(key)) === JSON.stringify(value),
      )
      .map(([key]) => key);

    expect(identical.sort()).toEqual([...SAME_IN_BOTH].sort());
  });

  it("writes no empty value in either language", () => {
    for (const [key, value] of [...ENGLISH, ...GERMAN]) {
      const text = Array.isArray(value) ? value.join("") : String(value);
      expect(text.trim(), key).not.toBe("");
    }
  });

  it("interpolates the same placeholders in both languages", () => {
    const placeholders = (value: unknown): string[] =>
      [...String(value).matchAll(/\{(\w+)\}/g)]
        .map((match) => match[1]!)
        .sort();

    for (const [key, value] of ENGLISH) {
      expect(placeholders(GERMAN.get(key)), key).toEqual(placeholders(value));
    }
  });
});

/* --------------------------------------------------------- HOUSE STYLE -- */

describe("the German pass follows the same house rules as the English", () => {
  it("uses no em or en dash anywhere — US-044 fails a rendered one", () => {
    for (const [key, value] of GERMAN) {
      expect(JSON.stringify(value), key).not.toMatch(/[–—]/);
    }
  });

  it("uses no typographic quote or apostrophe", () => {
    for (const [key, value] of GERMAN) {
      expect(JSON.stringify(value), key).not.toMatch(/[‘’“”]/u);
    }
  });

  it("is SWISS German — no eszett anywhere", () => {
    for (const [key, value] of GERMAN) {
      expect(JSON.stringify(value), key).not.toMatch(/ß/);
    }
  });

  it("groups a figure the Swiss way when the copy quotes one", () => {
    // The prose quotes figures the dataset also holds; `app/lib/format.ts`
    // groups with an apostrophe, so the narratives must not use a comma.
    for (const key of [
      "hero2.narrative.followUp",
      "hero3.narrative.followUp",
    ] as const) {
      expect(String(GERMAN.get(key))).not.toMatch(/\d,\d{3}/);
    }
    expect(String(GERMAN.get("hero2.narrative.followUp"))).toContain("3'200");
  });
});

/* ---------------------------------------------------------- TRANSLATE -- */

describe("translate", () => {
  it("resolves a key in the language asked for", () => {
    expect(translate(Locale.EN, "topBar.reset")).toBe("Reset");
    expect(translate(Locale.DE, "topBar.reset")).toBe("Zurücksetzen");
  });

  it("substitutes placeholders, and leaves an unsupplied one alone", () => {
    expect(translate(Locale.DE, "topBar.connectionStatus", { count: 11 })).toBe(
      "Verbunden · 11 Systeme",
    );
    expect(translate(Locale.EN, "topBar.connectionStatus")).toBe(
      "Connected · {count} systems",
    );
  });

  it("falls back to English, then to the key itself", () => {
    const missing = "nope.not.a.key" as TranslationKey;

    expect(translate(Locale.DE, missing)).toBe(missing);
    // A key that exists in English resolves there even when asked in German,
    // which is the unreachable-by-types safety net for a mid-demo cast.
    expect(translate(Locale.DE, "crest.label")).toBe("FC Basel 1893");
  });

  it("returns lists, and an empty list for a missing one", () => {
    expect(translateList(Locale.DE, "thinking.hero.HERO_1.sources")).toEqual([
      "Merchandising",
      "Webshop",
      "Flock-Druck",
    ]);
    expect(translateList(Locale.EN, "nope.not.a.list" as never)).toEqual([]);
  });

  it("binds a translator to one locale", () => {
    expect(translatorFor(Locale.DE)("nav.reports")).toBe("Berichte");
    expect(translatorFor(Locale.EN)("nav.reports")).toBe("Reports");
  });
});

/* -------------------------------------------------------------- LOCALE -- */

describe("the locale value itself", () => {
  it("is a BCP 47 tag, lowercase, unlike every other enum in the codebase", () => {
    expect(LOCALES).toEqual(["en", "de"]);
    expect(DEFAULT_LOCALE).toBe(Locale.EN);
  });
});
