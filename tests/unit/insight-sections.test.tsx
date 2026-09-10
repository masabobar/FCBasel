import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CANVAS_GRID_CLASS } from "../../app/components/chrome/app-shell";
import {
  PLACEHOLDER_FOLLOW_UP_BODY,
  PLACEHOLDER_MARKER,
  SECTION_GRID_CLASS,
  TILE_STAGGER_MS,
  tileDelayMs,
} from "../../app/components/heroes/hero-section";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import { HEROES } from "./support/hero-data";
import {
  InsightPhase,
  type InsightSection,
  type InsightSections as SectionList,
  sectionKey,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import { type RevealFocus } from "../../app/lib/dashboard/use-dashboard";
import { TILE_ENTER_CLASS } from "../../app/components/tiles/card";
import { HeroId } from "../../app/lib/repositories/enums";

const { HERO_1, HERO_2, HERO_3 } = HeroId;

const SECTION_SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/heroes/hero-section.tsx"),
  "utf8",
);

const LIST_SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/heroes/insight-sections.tsx"),
  "utf8",
);

/* ------------------------------------------------------------- HARNESS -- */

/**
 * jsdom implements no scrolling at all, so `scrollIntoView` is installed as a
 * spy: what the test can assert is that the newest section is asked to come
 * into view, and with which behaviour. The real scroll is verified in Chrome.
 */
let scrollIntoView: ReturnType<typeof vi.fn>;
const originalMatchMedia = window.matchMedia;

function stubReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn(
    (query: string) => ({ matches, media: query }) as MediaQueryList,
  );
}

beforeEach(() => {
  scrollIntoView = vi.fn();
  Object.assign(Element.prototype, { scrollIntoView });
  stubReducedMotion(false);
});

afterEach(() => {
  delete (Element.prototype as Partial<Record<"scrollIntoView", unknown>>)
    .scrollIntoView;
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

/** The list after the given heroes have been asked, in that order. */
function asked(...heroIds: HeroId[]): SectionList {
  return heroIds.reduce<SectionList>(
    (sections, heroId) => withHeroShown(sections, heroId),
    [],
  );
}

function renderSections(
  sections: SectionList,
  focus: RevealFocus | null = null,
) {
  return render(
    <InsightSections sections={sections} heroes={HEROES} focus={focus} />,
  );
}

function sectionNodes(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="insight-section"]'),
  );
}

function heroOrder(): (string | null)[] {
  return sectionNodes().map((node) => node.getAttribute("data-hero-id"));
}

/* ------------------------------------------------------------ INSERTION -- */

describe("insight sections — insertion", () => {
  it("renders nothing at all for an empty session", () => {
    const { container } = renderSections([]);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders one labelled section per answered question", () => {
    renderSections(asked(HERO_1));

    const section = sectionNodes()[0]!;
    expect(section.tagName).toBe("SECTION");
    // Labelled by its own heading, so a growing dashboard stays walkable.
    expect(section).toHaveAccessibleName(
      screen.getByRole("heading", { level: 2 }).textContent!,
    );
  });

  it("states the narrative first, before any tile", () => {
    // Every hero is real content as of US-038, so the order is asserted on the
    // verbatim narrative itself. The three hero suites assert the same thing
    // per section; this is the MECHANIC.
    renderSections(asked(HERO_3));

    const section = sectionNodes()[0]!;
    const narrative = section.querySelector('[data-slot="section-narrative"]')!;
    const firstTile = section.querySelector('[data-slot="card"]')!;

    expect(narrative).toHaveTextContent(HEROES.hero3.primary.narrative);
    expect(
      narrative.compareDocumentPosition(firstTile) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders the sections in the order the questions were asked", () => {
    renderSections(asked(HERO_3, HERO_1, HERO_2));

    expect(heroOrder()).toEqual([HERO_3, HERO_1, HERO_2]);
  });

  it("keeps every earlier section present as the session grows", () => {
    const { rerender } = renderSections(asked(HERO_1));
    rerender(
      <InsightSections
        sections={asked(HERO_1, HERO_2, HERO_3)}
        heroes={HEROES}
        focus={null}
      />,
    );

    expect(sectionNodes()).toHaveLength(3);
    expect(heroOrder()).toEqual([HERO_1, HERO_2, HERO_3]);
  });

  it("renders ONE section when the same hero is asked twice", () => {
    renderSections(asked(HERO_2, HERO_2, HERO_2));

    expect(sectionNodes()).toHaveLength(1);
    expect(heroOrder()).toEqual([HERO_2]);
  });
});

/* ------------------------------------------------------------ FOLLOW-UP -- */

describe("insight sections — the follow-up sharpens the section", () => {
  // The sharpened hero is HERO_3, whose BEAT is the one still on the shared
  // placeholder (US-039), so this suite stays about the MECHANIC. The real
  // content of each section is asserted in its own hero suite.
  const sharpened = withFollowUpShown(asked(HERO_3, HERO_2), HERO_3);

  it("adds the follow-up panel to the existing section", () => {
    renderSections(sharpened);

    const section = sectionNodes()[0]!;
    expect(section).toHaveAttribute("data-phase", InsightPhase.WITH_FOLLOW_UP);
    // Hero 3's two primary tiles, plus the beat's stand-in.
    expect(section.querySelectorAll('[data-slot="card"]')).toHaveLength(3);
    expect(section).toHaveTextContent(PLACEHOLDER_FOLLOW_UP_BODY);
  });

  it("appends no section of its own", () => {
    renderSections(sharpened);

    expect(sectionNodes()).toHaveLength(2);
    expect(heroOrder()).toEqual([HERO_3, HERO_2]);
  });

  it("leaves the other section on its primary answer", () => {
    renderSections(sharpened);

    // Hero 2 is real content, so the claim is about its PHASE rather than
    // about a placeholder string: it keeps its own tiles and gains no beat.
    const other = sectionNodes()[1]!;
    expect(other).toHaveAttribute("data-phase", InsightPhase.PRIMARY);
    expect(other).not.toHaveTextContent(PLACEHOLDER_FOLLOW_UP_BODY);
    expect(other.textContent).not.toContain(PLACEHOLDER_MARKER);
  });
});

/* ----------------------------------------------------------- ONE GRID -- */

describe("insight sections — one grid, not two", () => {
  it("adds no wrapper around the sections", () => {
    // Each section must be a direct child of the canvas grid, or the
    // dashboard stops being one grid that grows.
    const { container } = renderSections(asked(HERO_1, HERO_2));

    expect(container.childElementCount).toBe(2);
    expect(Array.from(container.children)).toEqual(sectionNodes());
  });

  it("spans the canvas grid and re-uses its column tracks", () => {
    renderSections(asked(HERO_1));

    expect(sectionNodes()[0]!).toHaveClass(
      "col-span-full",
      "grid-cols-subgrid",
    );
    expect(SECTION_GRID_CLASS).toContain("gap-grid-gap");
  });

  it("declares no column count of its own", () => {
    // `grid-cols-subgrid` is the whole point: a tile asking for 4 of 12
    // columns lands on the SAME tracks as a baseline tile.
    expect(CANVAS_GRID_CLASS).toContain("lg:grid-cols-12");
    expect(SECTION_GRID_CLASS).not.toMatch(/grid-cols-\d/);
  });
});

/* -------------------------------------------------------------- MOTION -- */

describe("insight sections — entrance and stagger", () => {
  it("marks every inserted tile as new", () => {
    renderSections(withFollowUpShown(asked(HERO_3), HERO_3));

    const cards = sectionNodes()[0]!.querySelectorAll('[data-slot="card"]');
    expect(cards).toHaveLength(3);
    for (const card of cards) expect(card).toHaveClass(TILE_ENTER_CLASS);
  });

  it("staggers the tiles so the cascade reads as one sequence", () => {
    renderSections(withFollowUpShown(asked(HERO_3), HERO_3));

    const [first, second, third] = Array.from(
      sectionNodes()[0]!.querySelectorAll<HTMLElement>('[data-slot="card"]'),
    );
    // The first tile leads; each one after it waits a further step, and the
    // beat joins the SAME cascade rather than starting a new one.
    expect(first!.style.animationDelay).toBe("");
    expect(second!.style.animationDelay).toBe(`${TILE_STAGGER_MS}ms`);
    expect(third!.style.animationDelay).toBe(`${2 * TILE_STAGGER_MS}ms`);
  });

  it("computes the stagger from one shared step", () => {
    expect(tileDelayMs(0)).toBe(0);
    expect(tileDelayMs(3)).toBe(3 * TILE_STAGGER_MS);
  });

  it("names each section for the reflow tween", () => {
    renderSections(asked(HERO_1, HERO_2));

    const names = sectionNodes().map((node) => node.style.viewTransitionName);
    expect(names).toEqual([`fcb-tile-${HERO_1}`, `fcb-tile-${HERO_2}`]);
    // Unique, or the browser refuses the transition.
    expect(new Set(names).size).toBe(names.length);
  });

  it("re-mounts a refreshed section so its entrance replays in place", () => {
    const once = asked(HERO_1, HERO_2);
    const twice = withHeroShown(once, HERO_1);

    expect(sectionKey(once[0]!)).not.toBe(sectionKey(twice[0]!));
    // The key is what forces the re-mount; without the revision in it, a
    // re-asked question would produce no visible change at all.
    expect(LIST_SOURCE).toContain("sectionKey(section)");
  });
});

/* ---------------------------------------------------------- AUTO-SCROLL -- */

describe("insight sections — auto-scroll to the newest section", () => {
  function focusOn(heroId: HeroId, tick = 1): RevealFocus {
    return { heroId, tick };
  }

  it("brings the section that was just inserted into view", () => {
    renderSections(asked(HERO_1, HERO_2), focusOn(HERO_2, 2));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(sectionNodes()[1]);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("scrolls to an earlier section when its follow-up sharpens it", () => {
    renderSections(
      withFollowUpShown(asked(HERO_1, HERO_2), HERO_1),
      focusOn(HERO_1, 3),
    );

    expect(scrollIntoView.mock.contexts[0]).toBe(sectionNodes()[0]);
  });

  it("scrolls again when the same hero is re-asked", () => {
    const sections = asked(HERO_1);
    const { rerender } = renderSections(sections, focusOn(HERO_1, 1));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerender(
      <InsightSections
        sections={withHeroShown(sections, HERO_1)}
        heroes={HEROES}
        focus={focusOn(HERO_1, 2)}
      />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("scrolls once, not once per section on screen", () => {
    renderSections(asked(HERO_1, HERO_2, HERO_3), focusOn(HERO_3, 3));

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("does not scroll when nothing has been revealed", () => {
    renderSections(asked(HERO_1), null);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("jumps instead of gliding under reduced motion", () => {
    stubReducedMotion(true);

    renderSections(asked(HERO_1), focusOn(HERO_1));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("never moves focus — the prompt bar keeps the caret", () => {
    renderSections(asked(HERO_1), focusOn(HERO_1));

    expect(document.activeElement).toBe(document.body);
    expect(SECTION_SOURCE).not.toMatch(/\.focus\(\)/);
  });
});

/* -------------------------------------------- REDUCED MOTION: FINAL LAYOUT -- */

describe("insight sections — reduced motion still renders the layout", () => {
  it("renders the same sections, tiles and placement with the tween off", () => {
    stubReducedMotion(true);
    const sections: SectionList = withFollowUpShown(
      asked(HERO_1, HERO_3),
      HERO_3,
    );

    renderSections(sections, { heroId: HERO_3, tick: 2 });

    expect(heroOrder()).toEqual([HERO_1, HERO_3]);
    // Hero 1's three tiles, Hero 3's two, and the beat's stand-in.
    expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(6);
    for (const node of sectionNodes()) {
      expect(node).toHaveClass("col-span-full", "grid-cols-subgrid");
    }
  });
});

/* ----------------------------------------------------- PLACEHOLDER SEAM -- */

describe("insight sections — the last placeholder is clearly a placeholder", () => {
  const section: InsightSection = {
    heroId: HERO_3,
    phase: InsightPhase.WITH_FOLLOW_UP,
    revision: 0,
  };

  /** The stand-in card: the one card in the section that is marked as such. */
  function placeholderCard(): HTMLElement {
    const found = Array.from(
      sectionNodes()[0]!.querySelectorAll<HTMLElement>('[data-slot="card"]'),
    ).filter((card) => card.textContent!.includes(PLACEHOLDER_MARKER));
    expect(found).toHaveLength(1);
    return found[0]!;
  }

  it("is the FOLLOW-UP beat only — every primary answer is real now", () => {
    renderSections([section]);

    // US-038 made Hero 3's primary real, so exactly one stand-in is left in
    // the whole product: US-039's causal peak.
    expect(placeholderCard()).toHaveTextContent(PLACEHOLDER_FOLLOW_UP_BODY);
    expect(sectionNodes()[0]!).toHaveTextContent(
      HEROES.hero3.primary.narrative,
    );
  });

  it("marks its title and its body as a placeholder", () => {
    renderSections([section]);

    expect(
      placeholderCard().textContent!.match(new RegExp(PLACEHOLDER_MARKER, "g"))
        ?.length,
    ).toBe(2);
  });

  it("invents no figure and no narrative copy of the beat", () => {
    // The causal peak's narrative is verbatim and its figures are US-010's;
    // this stand-in must not pre-empt either. No digit may reach the screen
    // from inside it.
    renderSections([section]);

    const text = placeholderCard().textContent!.replace(/HERO_\d/g, "");
    expect(text).not.toMatch(/\d/);
  });

  it("uses no literal colour value", () => {
    expect(SECTION_SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(SECTION_SOURCE).not.toMatch(/\brgba?\(/);
  });

  it("never injects raw HTML", () => {
    expect(SECTION_SOURCE).not.toMatch(/dangerouslySetInnerHTML/);
    expect(LIST_SOURCE).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
