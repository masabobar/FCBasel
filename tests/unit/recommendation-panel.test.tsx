import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { VBarTile } from "../../app/components/charts/v-bars";
import { SectionHead } from "../../app/components/heroes/hero-section";
import { InsightSections } from "../../app/components/heroes/insight-sections";
import { HEROES } from "./support/hero-data";
import {
  CARD_ACCENTS,
  CARD_CAPTION_VARIANTS,
  Card,
  CardCaption,
  TILE_ENTER_CLASS,
} from "../../app/components/tiles/card";
import {
  NARRATIVE_LABEL_KEY,
  RECOMMENDATION_LABEL_KEY,
  RECOMMENDATION_VARIANTS,
  RecommendationPanel,
} from "../../app/components/tiles/recommendation-panel";
import { withHeroShown } from "../../app/lib/dashboard/sections";
import { HeroId } from "../../app/lib/repositories/enums";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";
import { t } from "./support/i18n";

const PANEL_SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/tiles/recommendation-panel.tsx"),
  "utf8",
);

const SECTION_SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/heroes/hero-section.tsx"),
  "utf8",
);

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/** Source with comments stripped, for "this class never appears" scans. */
const PANEL_CODE = PANEL_SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /\/\/.*$/gm,
  "",
);

function slot(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`),
  );
}

function panel(): HTMLElement {
  return slot("recommendation-panel")!;
}

/** True when `first` really does come before `second` in the document. */
function precedes(first: Element, second: Element): boolean {
  return Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

/**
 * THE VERBATIM STRING, in the exact shape Phase 3b hands over: US-039's
 * recommendation, the causal peak. Every hazard a text pipeline could
 * "improve" is in it on purpose — a straight apostrophe, ASCII hyphens
 * (" - " and "paid-social"), percentages at one decimal place, CHF figures in
 * `k` shorthand, a colon and a long multi-clause sentence.
 *
 * The client signed this copy off. If any character of it changes on the way
 * to the screen, the prototype is showing something the client did not
 * approve, which is why byte-identical output is asserted rather than
 * "contains".
 */
const VERBATIM =
  "Marketing's overspend is concentrated in two areas: the derby and YB match " +
  "activations ran about CHF 240k over plan combined, and paid-social spend rose " +
  "18% chasing a webshop conversion target that underdelivered - conversion " +
  "landed at 2.2% against a 2.6% plan. Recommendation: pause the incremental " +
  "paid-social spend and reallocate about CHF 150k to the matchday activations " +
  'that did convert, and revisit the conversion target with Webshop before the "winter" campaign.';

beforeEach(() => {
  stubMatchMedia(false);
  stubFrames();
});

afterEach(() => {
  restoreMotionStubs();
});

/* ------------------------------------------------ ADVICE, NOT A METRIC -- */

describe("RecommendationPanel — visually distinct from a data tile", () => {
  it("is an aside, announced as its own region rather than a bare div", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(panel().tagName).toBe("ASIDE");
    expect(
      screen.getByRole("complementary", { name: t(RECOMMENDATION_LABEL_KEY) }),
    ).toBe(panel());
  });

  it("carries its own data-slot — never the card's", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(slot("recommendation-panel")).not.toBeNull();
    expect(slot("card")).toBeNull();
  });

  it("borrows none of the card's metric chrome", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    // No icon badge, no uppercase tile heading, no KPI number, no subtitle,
    // no action slot: nothing that says "here is a measurement".
    for (const name of [
      "card",
      "card-header",
      "card-icon",
      "card-subtitle",
      "card-action",
      "card-accent",
      "kpi-value",
    ]) {
      expect(slot(name)).toBeNull();
    }
    expect(panel().querySelector(".kpi-number")).toBeNull();
    expect(panel().querySelector("svg + svg")).toBeNull();
  });

  it("reads as a different surface: panel radius, no tile shadow", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(panel()).toHaveClass("rounded-panel", "border");
    expect(panel().className).not.toMatch(/rounded-tile|shadow-tile|bg-bg\b/);
    // The 16px panel radius is a token, and a different one from the tile's.
    expect(APP_CSS).toMatch(/--radius-panel:\s*16px/);
    expect(APP_CSS).toMatch(/--radius-tile:\s*12px/);
  });

  it("runs its accent DOWN THE SIDE, where a tile runs one across the top", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);
    const accent = slot("recommendation-accent")!;

    expect(accent).toHaveClass("w-[3px]");
    expect(accent.className).not.toContain("h-[3px]");
    expect(accent).toHaveAttribute("aria-hidden", "true");
  });

  it("states what it is: an explicit Recommendation affordance", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(slot("recommendation-label")).toHaveTextContent(
      t(RECOMMENDATION_LABEL_KEY),
    );
    // The eyebrow names the region, so the label is not decorative text.
    expect(panel().getAttribute("aria-labelledby")).toBe(
      slot("recommendation-label")!.id,
    );
  });

  it("is told apart from a card standing right beside it", () => {
    render(
      <>
        <Card title="Departmental performance">metric</Card>
        <RecommendationPanel>{VERBATIM}</RecommendationPanel>
      </>,
    );

    const card = slot("card")!;
    expect(card.tagName).toBe("DIV");
    expect(panel().tagName).toBe("ASIDE");
    expect(card.contains(panel())).toBe(false);
    expect(card.className).not.toBe(panel().className);
    // One region, one heading: the panel adds no heading to the outline.
    expect(screen.getAllByRole("complementary")).toHaveLength(1);
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  it("takes a grid span from the caller like any other canvas child", () => {
    render(
      <RecommendationPanel className="lg:col-span-6">
        {VERBATIM}
      </RecommendationPanel>,
    );

    expect(panel()).toHaveClass("lg:col-span-6", "rounded-panel");
  });
});

/* ------------------------------------------------------------ THE GOLD -- */

describe("RecommendationPanel — the gold accent, and only here", () => {
  it("paints the accent bar with the gold token from the card's accent set", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(slot("recommendation-accent")).toHaveClass(CARD_ACCENTS.gold);
    expect(RECOMMENDATION_VARIANTS.recommendation.accent).toBe("gold");
  });

  it("tints the surface and the glyph gold rather than only the border", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(panel().className).toContain("bg-gold/10");
    expect(slot("recommendation-glyph")).toHaveClass(
      "text-accent-follow-up",
      // `--color-accent-follow-up` is the deep gold that reads on white.
    );
    expect(APP_CSS).toMatch(
      /--color-accent-follow-up:\s*var\(--color-gold-deep\)/,
    );
  });

  it("spells gold nowhere but the accent, the surface and the glyph", () => {
    // Gold is an accent ONLY (colour discipline rule 4). The body copy, the
    // caption and the panel's layout carry no gold class at all.
    render(
      <RecommendationPanel caption="Follow-up">{VERBATIM}</RecommendationPanel>,
    );

    expect(slot("recommendation-body")!.className).not.toMatch(/gold/);
    expect(slot("card-caption")!.className).not.toMatch(/gold/);
    // Three mentions in the whole module: the accent name, the surface tint
    // and its border. The glyph reaches gold through `accent-follow-up`.
    const goldClasses = PANEL_CODE.match(/gold[\w/-]*/g) ?? [];
    expect(new Set(goldClasses)).toEqual(
      new Set(["gold", "gold/45", "gold/10"]),
    );
    expect(goldClasses).toHaveLength(3);
  });

  it("adds no gold ring to a newly inserted panel", () => {
    // The Reference Guide removed the Specification's gold ring. This story is
    // the one place gold lives, so it is also the likeliest place for the ring
    // to creep back in.
    render(<RecommendationPanel isNew>{VERBATIM}</RecommendationPanel>);

    expect(panel().className).not.toMatch(/ring|glow|shadow/);
    expect(PANEL_CODE).not.toMatch(/ring-|fcb-glow|MOTION_CLASS\.glow/);
  });

  it("keeps the interpretation variant in navy, so gold stays advice", () => {
    render(
      <RecommendationPanel variant="narrative">{VERBATIM}</RecommendationPanel>,
    );

    expect(panel()).toHaveAttribute("data-variant", "narrative");
    expect(slot("recommendation-accent")).toHaveClass(CARD_ACCENTS.navy);
    expect(slot("recommendation-accent")!.className).not.toMatch(/gold/);
    expect(panel().className).not.toMatch(/gold/);
    expect(slot("recommendation-label")).toHaveTextContent(
      t(NARRATIVE_LABEL_KEY),
    );
  });

  it("uses no literal colour value anywhere", () => {
    expect(PANEL_SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(PANEL_SOURCE).not.toMatch(/\brgba?\(/);
  });
});

/* ---------------------------------------------- VERBATIM PASS-THROUGH -- */

describe("RecommendationPanel — renders the text it is given, byte for byte", () => {
  it("renders the recommendation exactly as authored", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(slot("recommendation-body")!.textContent).toBe(VERBATIM);
  });

  it("substitutes no punctuation on the way to the screen", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);
    const rendered = slot("recommendation-body")!.textContent!;

    // Straight apostrophe and straight quotes survive; no smart quotes.
    expect(rendered).toContain("Marketing's");
    expect(rendered).toContain('"winter"');
    expect(rendered).not.toMatch(/[‘’“”]/);
    // ASCII hyphens survive; no em or en dash is introduced.
    expect(rendered).toContain("underdelivered - conversion");
    expect(rendered).toContain("paid-social");
    expect(rendered).not.toMatch(/[–—]/);
    // Figures survive to the digit.
    expect(rendered).toContain("CHF 240k");
    expect(rendered).toContain("CHF 150k");
    expect(rendered).toContain("2.2% against a 2.6% plan");
  });

  it("neither truncates nor clamps the body — the whole answer is on screen", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(slot("recommendation-body")!.className).not.toMatch(
      /truncate|line-clamp|overflow-hidden|text-ellipsis/,
    );
    expect(slot("recommendation-body")!.textContent).toHaveLength(
      VERBATIM.length,
    );
  });

  it("transforms no casing", () => {
    // `.tile-title` uppercases, and it is on the EYEBROW only. The body must
    // never inherit a text-transform, or "CHF 150k" becomes "chf 150k" the
    // day someone restyles the panel.
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(slot("recommendation-body")!.className).not.toMatch(
      /uppercase|lowercase|capitalize/,
    );
    expect(PANEL_CODE).not.toMatch(
      /toUpperCase|toLowerCase|\.slice\(|\.replace\(|substring/,
    );
  });

  it("escapes caller text rather than interpreting it as markup", () => {
    render(
      <RecommendationPanel>
        {'<img src=x onerror="alert(1)">'}
      </RecommendationPanel>,
    );

    expect(panel().querySelector("img")).toBeNull();
    expect(
      screen.getByText('<img src=x onerror="alert(1)">'),
    ).toBeInTheDocument();
    expect(PANEL_SOURCE).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it("passes the same string through the section narrative untouched", () => {
    render(<CardCaption variant="section">{VERBATIM}</CardCaption>);

    expect(slot("section-narrative")!.textContent).toBe(VERBATIM);
  });
});

/* --------------------------------------------- THE CAPTION STRIP, REUSED -- */

describe("narrative caption strip — one element, two placements", () => {
  it("is reused from US-005 rather than reimplemented in the panel", () => {
    // The AI glyph, the escaping and the accessibility treatment exist once.
    expect(PANEL_CODE).toMatch(
      /import\s*\{[^}]*CardCaption[^}]*\}\s*from\s*"\.\/card"/,
    );
    expect(PANEL_CODE).not.toMatch(/Sparkles|lucide-react".*Sparkles/s);
    expect(PANEL_CODE).not.toContain("narrative-caption");
  });

  it("is reused by the section head too, not restated there", () => {
    expect(SECTION_SOURCE).toMatch(
      /import\s*\{[^}]*CardCaption[^}]*\}\s*from\s*"\.\.\/tiles\/card"/,
    );
    expect(SECTION_SOURCE).toMatch(/<CardCaption variant="section"/);
    expect(SECTION_SOURCE).not.toContain("Sparkles");
  });

  it("closes the panel when the panel carries one", () => {
    render(
      <RecommendationPanel caption="Based on the last three drops.">
        {VERBATIM}
      </RecommendationPanel>,
    );

    const caption = slot("card-caption")!;
    expect(caption).toHaveTextContent("Based on the last three drops.");
    expect(panel().contains(caption)).toBe(true);
    // The strip closes the panel: it comes after the advice.
    expect(precedes(slot("recommendation-body")!, caption)).toBe(true);
  });

  it("keeps the tile placement one truncated muted line", () => {
    render(<CardCaption>Home kit leads by 4,100 units.</CardCaption>);

    expect(slot("card-caption")).toHaveClass(
      "narrative-caption",
      "border-t",
      "border-line",
      "px-tile",
    );
    expect(screen.getByText("Home kit leads by 4,100 units.")).toHaveClass(
      "truncate",
    );
  });

  it("widens the section placement instead of forking a second element", () => {
    render(<CardCaption variant="section">{VERBATIM}</CardCaption>);
    const line = slot("section-narrative")!;

    // Prominent: no hairline, no tile padding, and above all NO truncation.
    expect(line.className).not.toMatch(/border-t|px-tile|narrative-caption/);
    expect(line.querySelector("span:last-of-type")!.className).toBe("");
    expect(CARD_CAPTION_VARIANTS.section.text).toBe("");
    // Body size, not the 13px caption step.
    expect(line.className).not.toContain("text-caption");
    expect(line).toHaveClass("text-muted");
  });

  it("carries the AI glyph in both placements", () => {
    render(
      <>
        <CardCaption>tile line</CardCaption>
        <CardCaption variant="section">section line</CardCaption>
      </>,
    );

    for (const name of ["card-caption", "section-narrative"]) {
      const glyph = slot(name)!.querySelector("[aria-hidden='true']")!;
      expect(glyph.querySelector("svg")).not.toBeNull();
    }
  });
});

/* ---------------------------------------------- THE GLYPHS ARE DECORATIVE -- */

describe("US-024 — the AI glyph is never announced as content", () => {
  it("hides the caption glyph from assistive technology", () => {
    render(<CardCaption variant="section">Season to date.</CardCaption>);
    const glyph = slot("section-narrative")!.querySelector("[aria-hidden]")!;

    expect(glyph).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("graphics-symbol")).not.toBeInTheDocument();
    // The narrative is the accessible content, and all of it.
    expect(slot("section-narrative")).toHaveTextContent("Season to date.");
  });

  it("hides the panel glyph too, and keeps the region's name the eyebrow", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);
    const glyph = slot("recommendation-glyph")!;

    expect(glyph).toHaveAttribute("aria-hidden", "true");
    expect(glyph.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("complementary")).toHaveAccessibleName(
      t(RECOMMENDATION_LABEL_KEY),
    );
  });
});

/* --------------------------------------------- NARRATIVE BEFORE THE CHARTS -- */

describe("US-024 criterion 3 — the narrative is stated before the charts", () => {
  /** A section shaped the way Phase 3b will build one. */
  function renderBeat() {
    return render(
      <section>
        <SectionHead id="beat-label" label="Marketing" narrative={VERBATIM} />
        <VBarTile
          title="Shirt sales by kit"
          bars={[
            { name: "Home", value: 22300 },
            { name: "Away", value: 16200 },
          ]}
        />
        <RecommendationPanel>{VERBATIM}</RecommendationPanel>
      </section>,
    );
  }

  it("puts the narrative line ahead of every chart in the section", () => {
    renderBeat();
    const narrative = slot("section-narrative")!;

    for (const chart of document.querySelectorAll("svg")) {
      expect(precedes(narrative, chart)).toBe(true);
    }
    expect(document.querySelectorAll("svg").length).toBeGreaterThan(0);
  });

  it("puts it ahead of every tile and of the recommendation itself", () => {
    renderBeat();
    const narrative = slot("section-narrative")!;

    expect(precedes(narrative, slot("card")!)).toBe(true);
    expect(precedes(narrative, panel())).toBe(true);
    // Advice comes last: the evidence is shown, then the action.
    expect(precedes(slot("card")!, panel())).toBe(true);
  });

  it("sits directly under the section header, not above it", () => {
    renderBeat();
    const head = slot("section-head")!;
    const heading = screen.getByRole("heading", { name: "Marketing" });

    expect(precedes(heading, slot("section-narrative")!)).toBe(true);
    // The heading leads the head; US-034 put a section-level period filter
    // opposite it, so it is no longer necessarily the head's first ELEMENT.
    expect(head).toContainElement(heading);
    expect(head.lastElementChild).toBe(slot("section-narrative"));
  });

  it("holds that order in a live insight section", () => {
    render(
      <InsightSections
        sections={withHeroShown([], HeroId.HERO_1)}
        heroes={HEROES}
        focus={null}
      />,
    );

    const section = slot("insight-section")!;
    const narrative = section.querySelector('[data-slot="section-narrative"]')!;
    expect(section.firstElementChild).toBe(slot("section-head"));
    for (const card of section.querySelectorAll('[data-slot="card"]')) {
      expect(precedes(narrative, card)).toBe(true);
    }
  });
});

/* ------------------------------------------------------ MOTION, REDUCED -- */

describe("RecommendationPanel — entrance and reduced motion", () => {
  it("fades and rises with the tiles when it is newly inserted", () => {
    render(
      <RecommendationPanel isNew delayMs={180}>
        {VERBATIM}
      </RecommendationPanel>,
    );

    expect(panel()).toHaveClass(TILE_ENTER_CLASS);
    expect(panel()).toHaveStyle({ animationDelay: "180ms" });
  });

  it("leaves a panel already on screen unanimated", () => {
    render(<RecommendationPanel>{VERBATIM}</RecommendationPanel>);

    expect(panel()).not.toHaveClass(TILE_ENTER_CLASS);
    expect(panel().getAttribute("style")).toBeNull();
  });

  it("lands on its final state under prefers-reduced-motion", () => {
    stubMatchMedia(true);
    render(
      <RecommendationPanel isNew delayMs={180} caption="Follow-up">
        {VERBATIM}
      </RecommendationPanel>,
    );

    // The panel renders complete: the advice, the eyebrow, the accent and the
    // caption are all present with the animation neutralised.
    expect(slot("recommendation-body")!.textContent).toBe(VERBATIM);
    expect(slot("recommendation-label")).toHaveTextContent(
      t(RECOMMENDATION_LABEL_KEY),
    );
    expect(slot("recommendation-accent")).not.toBeNull();
    expect(slots("card-caption")).toHaveLength(1);
    // Stated outright in the stylesheet, not left as "no animation on an
    // invisible box".
    const reduced = APP_CSS.slice(
      APP_CSS.indexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reduced).toMatch(/\.fcb-enter[\s\S]*opacity:\s*1\s*!important/);
    expect(reduced).toMatch(/\.fcb-enter[\s\S]*transform:\s*none\s*!important/);
    // No frame is requested by the panel itself; it animates in CSS only.
    expect(PANEL_CODE).not.toMatch(/requestAnimationFrame|useGrow|useCountUp/);
  });
});
