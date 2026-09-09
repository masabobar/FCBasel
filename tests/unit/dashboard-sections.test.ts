import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  findSection,
  hasSection,
  InsightPhase,
  type InsightSections,
  NO_SECTIONS,
  sectionKey,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import { HeroId } from "../../app/lib/repositories/enums";

const { HERO_1, HERO_2, HERO_3 } = HeroId;

/** The list after the given heroes have been asked, in that order. */
function asked(...heroIds: HeroId[]): InsightSections {
  return heroIds.reduce<InsightSections>(
    (sections, heroId) => withHeroShown(sections, heroId),
    NO_SECTIONS,
  );
}

function heroOrder(sections: InsightSections): HeroId[] {
  return sections.map((section) => section.heroId);
}

/* ------------------------------------------------------------ APPENDING -- */

describe("showing a hero", () => {
  it("starts from an empty session", () => {
    expect(NO_SECTIONS).toHaveLength(0);
  });

  it("appends a section for a hero that has not been asked", () => {
    const sections = withHeroShown(NO_SECTIONS, HERO_2);

    expect(sections).toEqual([
      { heroId: HERO_2, phase: InsightPhase.PRIMARY, revision: 0 },
    ]);
  });

  it("keeps the sections in the order the questions were asked", () => {
    expect(heroOrder(asked(HERO_3, HERO_1, HERO_2))).toEqual([
      HERO_3,
      HERO_1,
      HERO_2,
    ]);
  });

  it("grows the dashboard rather than replacing what is on it", () => {
    const sections = asked(HERO_1, HERO_2, HERO_3);

    // Criterion 6: earlier answers remain, whatever arrives later.
    expect(sections).toHaveLength(3);
    expect(hasSection(sections, HERO_1)).toBe(true);
  });

  it("never mutates the list it was given", () => {
    const before = asked(HERO_1);

    withHeroShown(before, HERO_2);

    expect(before).toHaveLength(1);
  });
});

/* --------------------------------------------------------------- DEDUPE -- */

describe("re-asking the same hero", () => {
  it("yields ONE section, not two", () => {
    // The highest-value rule in this story: a presenter who taps a chip twice
    // must not end up with two copies of the same answer.
    const sections = asked(HERO_1, HERO_1);

    expect(sections).toHaveLength(1);
    expect(heroOrder(sections)).toEqual([HERO_1]);
  });

  it("still yields one section after many re-asks", () => {
    const sections = asked(HERO_1, HERO_1, HERO_1, HERO_1, HERO_1);

    expect(sections).toHaveLength(1);
  });

  it("refreshes in place, keeping the position it was asked in", () => {
    const sections = asked(HERO_1, HERO_2, HERO_3, HERO_1);

    expect(heroOrder(sections)).toEqual([HERO_1, HERO_2, HERO_3]);
  });

  it("counts the refresh, so the re-insert is observable", () => {
    const once = asked(HERO_1);
    const twice = withHeroShown(once, HERO_1);

    expect(findSection(once, HERO_1)?.revision).toBe(0);
    expect(findSection(twice, HERO_1)?.revision).toBe(1);
    expect(sectionKey(findSection(twice, HERO_1)!)).not.toBe(
      sectionKey(findSection(once, HERO_1)!),
    );
  });

  it("leaves the other sections' identity untouched", () => {
    const before = asked(HERO_1, HERO_2);
    const after = withHeroShown(before, HERO_1);

    expect(after[1]).toBe(before[1]);
  });

  it("does not regress a section that already shows its follow-up", () => {
    // The dashboard grows and sharpens; it never takes an answer away.
    const sharpened = withFollowUpShown(asked(HERO_1), HERO_1);
    const reAsked = withHeroShown(sharpened, HERO_1);

    expect(findSection(reAsked, HERO_1)).toMatchObject({
      phase: InsightPhase.WITH_FOLLOW_UP,
      revision: 1,
    });
  });
});

/* ------------------------------------------------------------ FOLLOW-UPS -- */

describe("showing a follow-up", () => {
  it("flips the existing section's phase instead of appending", () => {
    const sections = withFollowUpShown(asked(HERO_1, HERO_2), HERO_2);

    expect(sections).toHaveLength(2);
    expect(heroOrder(sections)).toEqual([HERO_1, HERO_2]);
    expect(findSection(sections, HERO_2)?.phase).toBe(
      InsightPhase.WITH_FOLLOW_UP,
    );
  });

  it("touches only its own hero's section", () => {
    const sections = withFollowUpShown(asked(HERO_1, HERO_2), HERO_2);

    expect(findSection(sections, HERO_1)?.phase).toBe(InsightPhase.PRIMARY);
  });

  it("keeps the section in place — the follow-up is not a new answer", () => {
    const sections = withFollowUpShown(asked(HERO_1, HERO_2, HERO_3), HERO_1);

    expect(heroOrder(sections)).toEqual([HERO_1, HERO_2, HERO_3]);
  });

  it("is idempotent — flipping twice changes nothing further", () => {
    const once = withFollowUpShown(asked(HERO_1), HERO_1);
    const twice = withFollowUpShown(once, HERO_1);

    expect(twice).toEqual(once);
  });

  it("appends nothing for a hero that has not been shown", () => {
    // Gating that case is US-033's; this list simply refuses to invent a
    // section for an answer whose parent question was never asked.
    expect(withFollowUpShown(NO_SECTIONS, HERO_1)).toHaveLength(0);
    expect(withFollowUpShown(asked(HERO_2), HERO_1)).toEqual(asked(HERO_2));
  });
});

/* ------------------------------------------------------------- LOOKUPS -- */

describe("lookups", () => {
  it("finds a section by hero id", () => {
    expect(findSection(asked(HERO_1, HERO_2), HERO_2)?.heroId).toBe(HERO_2);
  });

  it("reports an unasked hero as absent", () => {
    expect(findSection(asked(HERO_1), HERO_3)).toBeUndefined();
    expect(hasSection(asked(HERO_1), HERO_3)).toBe(false);
  });

  it("keys a section by hero and revision", () => {
    expect(sectionKey({ heroId: HERO_1, phase: "primary", revision: 2 })).toBe(
      `${HERO_1}#2`,
    );
  });
});

/* ------------------------------------------------------- NO PERSISTENCE -- */

describe("no persistence — state dies on reload, by specification", () => {
  const APP_DIR = resolve(process.cwd(), "app");

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx|css)$/.test(entry) ? [path] : [];
    });
  }

  /**
   * Comments are stripped before the scan: several modules NAME these APIs in
   * order to forbid them, and a scan that counted those would make documenting
   * the rule impossible. Only code is checked.
   */
  function code(text: string): string {
    return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  }

  const SOURCES = sourceFiles(APP_DIR).map((path) => ({
    path,
    text: code(readFileSync(path, "utf8")),
  }));

  it("scans the whole application source", () => {
    expect(SOURCES.length).toBeGreaterThan(10);
  });

  it.each([
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
    "IDBDatabase",
  ])("uses no %s anywhere in app/", (api) => {
    const offenders = SOURCES.filter(({ text }) => text.includes(api)).map(
      ({ path }) => path,
    );

    expect(offenders, `${api} must not be used`).toEqual([]);
  });
});
