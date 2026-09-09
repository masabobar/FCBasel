import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Card, TILE_ENTER_CLASS } from "../../app/components/tiles/card";
import {
  animateReflow,
  MOTION_CLASS,
  prefersReducedMotion,
  REDUCED_MOTION_QUERY,
  scrollRevealedIntoView,
  scrollToTop,
  viewTransitionName,
} from "../../app/lib/motion";
import { duration, easing, spacing } from "../../app/lib/tokens";

// Read from disk: Vitest stubs CSS imports out, so this must see the bytes
// that actually ship.
const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

const CARD_SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/tiles/card.tsx"),
  "utf8",
);

/** The four keyframes the acceptance criteria name. */
const KEYFRAMES = {
  entrance: "fcbUp",
  accentGlow: "fcbGlow",
  thinkingScan: "fcbScan",
  sourceChip: "fcbSrc",
} as const;

/**
 * The body of the first block introduced by `marker`, brace-balanced so
 * `@keyframes` and `@media` (which nest) come back whole.
 */
function blockAfter(css: string, marker: string): string {
  const start = css.indexOf(marker);
  expect(start, `app/app.css is missing ${marker}`).toBeGreaterThan(-1);

  const open = css.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    else if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }
  throw new Error(`Unbalanced braces after ${marker} in app/app.css`);
}

/** The declarations of a top-level class rule, e.g. `.fcb-enter { … }`. */
function classRule(css: string, className: string): string {
  const match = new RegExp(`\\.${className}\\s*\\{([^{}]*)\\}`).exec(css);
  expect(match, `app/app.css is missing a .${className} rule`).not.toBeNull();
  return match?.[1] ?? "";
}

/** Every `.fcb-*` class whose declarations reference the named keyframes. */
function classesDrivenBy(keyframeName: string): string[] {
  const classes: string[] = [];
  for (const [, className = "", body = ""] of APP_CSS.matchAll(
    /\.(fcb-[a-z-]+)\s*\{([^{}]*)\}/g,
  )) {
    if (body.includes(keyframeName)) classes.push(className);
  }
  return classes;
}

const REDUCED_MOTION_BLOCK = blockAfter(
  APP_CSS,
  "@media (prefers-reduced-motion: reduce)",
);

/** The declarations the reduced-motion block applies to one class, if any. */
function reducedMotionRuleFor(className: string): string | undefined {
  const block = REDUCED_MOTION_BLOCK.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, group = "", body] of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = group.split(",").map((selector) => selector.trim());
    if (selectors.includes(`.${className}`)) return body;
  }
  return undefined;
}

/* ------------------------------------------------------------ KEYFRAMES -- */

describe("motion keyframes", () => {
  it.each(Object.entries(KEYFRAMES))(
    "defines the %s keyframes as %s",
    (_role, name) => {
      expect(APP_CSS).toContain(`@keyframes ${name}`);
    },
  );

  it("defines each keyframes block exactly once", () => {
    for (const name of Object.values(KEYFRAMES)) {
      const occurrences = APP_CSS.split(`@keyframes ${name}`).length - 1;
      expect(occurrences, `${name} is declared more than once`).toBe(1);
    }
  });

  it("exposes one class per keyframes block, and no more", () => {
    expect(Object.values(MOTION_CLASS).length).toBe(
      Object.values(KEYFRAMES).length,
    );
    for (const className of Object.values(MOTION_CLASS)) {
      expect(APP_CSS).toContain(`.${className}`);
    }
  });
});

describe("entrance — fade in and rise", () => {
  const entrance = blockAfter(APP_CSS, `@keyframes ${KEYFRAMES.entrance}`);
  const rule = classRule(APP_CSS, MOTION_CLASS.enter);

  it("rises by the 12px insertion distance from the token set", () => {
    expect(spacing.enterRise).toBe("12px");
    expect(entrance).toMatch(/translateY\(var\(--spacing-enter-rise\)\)/);
  });

  it("fades from invisible to fully opaque, ending at rest", () => {
    expect(entrance).toMatch(/opacity:\s*0/);
    expect(entrance).toMatch(/opacity:\s*1/);
    expect(entrance).toMatch(/translateY\(0\)/);
  });

  it("runs for ~400ms on the gentle insertion ease", () => {
    expect(duration.enter).toBe("400ms");
    expect(easing.enter).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)");
    expect(rule).toContain("var(--duration-enter)");
    expect(rule).toContain("var(--ease-enter)");
  });

  it("fills both ways so a staggered tile waits out its delay unseen", () => {
    // Without `both` a tile with animationDelay flashes at full opacity, then
    // restarts — the stagger would read as a stutter.
    expect(rule).toMatch(/\bboth\b/);
  });

  it("is the class the Card actually puts on a new tile", () => {
    expect(TILE_ENTER_CLASS).toBe(MOTION_CLASS.enter);

    const { container } = render(<Card isNew>body</Card>);

    expect(container.firstElementChild).toHaveClass(MOTION_CLASS.enter);
  });
});

describe("the other three primitives", () => {
  it("pulses the accent glow slowly and forever", () => {
    const rule = classRule(APP_CSS, MOTION_CLASS.glow);

    expect(rule).toContain("var(--duration-glow)");
    expect(rule).toContain("infinite");
  });

  it("sweeps the thinking scan line across the panel", () => {
    const scan = blockAfter(APP_CSS, `@keyframes ${KEYFRAMES.thinkingScan}`);
    const rule = classRule(APP_CSS, MOTION_CLASS.scan);

    expect(scan).toMatch(/translateX\(-100%\)/);
    expect(rule).toContain("var(--duration-scan)");
    expect(rule).toContain("infinite");
  });

  it("reveals a source chip with the same fade-and-rise shape", () => {
    const chip = blockAfter(APP_CSS, `@keyframes ${KEYFRAMES.sourceChip}`);
    const rule = classRule(APP_CSS, MOTION_CLASS.sourceChip);

    expect(chip).toMatch(/opacity:\s*0/);
    expect(chip).toMatch(/opacity:\s*1/);
    // `both` again: chips are staggered one by one behind the scan line.
    expect(rule).toMatch(/\bboth\b/);
  });
});

/* -------------------------------------------------------- REDUCED MOTION -- */

describe("prefers-reduced-motion — final state, immediately", () => {
  it("declares a reduced-motion block", () => {
    expect(REDUCED_MOTION_BLOCK.length).toBeGreaterThan(0);
  });

  it("collapses animations to their last frame instead of removing them", () => {
    // The distinction this story turns on: `animation: none` on an element
    // whose opening frame is invisible strands it invisible. A ~1ms filled
    // animation lands on its closing frame at once.
    expect(REDUCED_MOTION_BLOCK).toMatch(
      /animation-duration:\s*1ms\s*!important/,
    );
    expect(REDUCED_MOTION_BLOCK).toMatch(
      /animation-iteration-count:\s*1\s*!important/,
    );
    expect(REDUCED_MOTION_BLOCK).toMatch(/animation-delay:\s*0ms\s*!important/);
  });

  it("lands transitions on their target too, so nothing stays at zero", () => {
    // Chart geometry (US-027) grows via CSS transitions from a zero base.
    expect(REDUCED_MOTION_BLOCK).toMatch(
      /transition-duration:\s*1ms\s*!important/,
    );
    expect(REDUCED_MOTION_BLOCK).toMatch(
      /transition-delay:\s*0ms\s*!important/,
    );
  });

  it("applies that collapse to every element, not a list of known classes", () => {
    // A rule listing today's classes silently fails to protect tomorrow's.
    expect(REDUCED_MOTION_BLOCK).toMatch(/\*,\s*\n?\s*\*::before/);
  });

  // Criterion 5, stated structurally: anything that animates in from an
  // invisible opening frame must be given its visible end state outright.
  it.each([KEYFRAMES.entrance, KEYFRAMES.sourceChip])(
    "restores the final state of every class driven by %s",
    (keyframeName) => {
      const classes = classesDrivenBy(keyframeName);
      expect(classes.length).toBeGreaterThan(0);

      for (const className of classes) {
        const rule = reducedMotionRuleFor(className);
        expect(
          rule,
          `.${className} animates from opacity 0 but reduced motion never restores it`,
        ).toBeDefined();
        expect(rule).toMatch(/opacity:\s*1\s*!important/);
        expect(rule).toMatch(/transform:\s*none\s*!important/);
      }
    },
  );

  it("never switches an entrance animation off and leaves it there", () => {
    const rule = reducedMotionRuleFor(MOTION_CLASS.enter) ?? "";

    if (/animation:\s*none/.test(rule)) {
      expect(rule).toMatch(/opacity:\s*1/);
    }
    expect(rule).toMatch(/opacity:\s*1\s*!important/);
  });

  it("hides the scan line, the one element with no meaningful end state", () => {
    // A finished sweep is a gold bar parked mid-panel; it is pure decoration.
    expect(reducedMotionRuleFor(MOTION_CLASS.scan)).toMatch(
      /display:\s*none\s*!important/,
    );
  });

  it("clears the ambient glow rather than freezing it mid-pulse", () => {
    expect(reducedMotionRuleFor(MOTION_CLASS.glow)).toMatch(
      /box-shadow:\s*none\s*!important/,
    );
  });

  it("stops the grid reflow tweening", () => {
    expect(REDUCED_MOTION_BLOCK).toContain("::view-transition-group(*)");
  });

  it("sits outside every cascade layer so nothing can override it", () => {
    const blockStart = APP_CSS.indexOf(
      "@media (prefers-reduced-motion: reduce)",
    );

    for (const match of APP_CSS.matchAll(/@layer [\w\s]*\{/g)) {
      const layerBody = blockAfter(APP_CSS.slice(match.index), "@layer");
      expect(
        layerBody.includes("prefers-reduced-motion"),
        "the reduced-motion block must not be nested in a cascade layer",
      ).toBe(false);
    }
    expect(blockStart).toBeGreaterThan(-1);
  });
});

/* ------------------------------------------------- NO GOLD RING (SCOPE) -- */

describe("no gold ring on an inserted tile", () => {
  // The Build Specification asks for a ~1.5s gold highlight ring on insertion.
  // The Reference Guide removed it and the Guide governs the experience
  // (scope.md §10): new tiles fade and rise, nothing else. These guard it.
  it("gives the entrance keyframes no ring, glow or shadow at all", () => {
    const entrance = blockAfter(APP_CSS, `@keyframes ${KEYFRAMES.entrance}`);

    expect(entrance).not.toMatch(/box-shadow|outline|border-color/);
  });

  it("gives the entrance class nothing but the animation", () => {
    const rule = classRule(APP_CSS, MOTION_CLASS.enter);

    expect(rule).not.toMatch(/box-shadow|outline|ring/);
    expect(rule.trim().split(";").filter(Boolean).length).toBe(1);
  });

  it("keeps the glow off the tile shell entirely", () => {
    expect(CARD_SOURCE).not.toContain(MOTION_CLASS.glow);

    const { container } = render(
      <Card isNew delayMs={90} accent="gold">
        body
      </Card>,
    );

    expect(container.firstElementChild!.className).not.toMatch(/ring|glow/);
  });

  it("leaves gold used only by the ambient glow and the scan line", () => {
    const glow = blockAfter(APP_CSS, `@keyframes ${KEYFRAMES.accentGlow}`);
    const scan = classRule(APP_CSS, MOTION_CLASS.scan);

    expect(glow).toContain("--color-accent-target-hit");
    expect(scan).toContain("--color-accent-target-hit");

    // Exactly two consumers below the token definitions. A third means a gold
    // treatment has been added somewhere — most likely the removed ring.
    const rules = APP_CSS.slice(APP_CSS.indexOf("@layer base"));
    const consumers = rules.match(/--color-accent-target-hit/g) ?? [];
    expect(consumers.length).toBe(2);
  });
});

/* ------------------------------------------------------- GRID REFLOW ----- */

describe("grid reflow", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    delete (document as Partial<Record<"startViewTransition", unknown>>)
      .startViewTransition;
    vi.restoreAllMocks();
  });

  function stubReducedMotion(matches: boolean): void {
    window.matchMedia = vi.fn(
      (query: string) => ({ matches, media: query }) as MediaQueryList,
    );
  }

  function stubViewTransitions(): ReturnType<typeof vi.fn> {
    const start = vi.fn((update: () => void) => {
      update();
      return { finished: Promise.resolve() };
    });
    Object.assign(document, { startViewTransition: start });
    return start;
  }

  it("times the tween to match the insertion animation", () => {
    const rule = /::view-transition-group\(\*\)\s*\{([^{}]*)\}/.exec(
      APP_CSS,
    )?.[1];

    expect(rule).toContain("var(--duration-enter)");
    expect(rule).toContain("var(--ease-enter)");
  });

  it("wraps the update in a view transition so tiles glide, never jump", () => {
    stubReducedMotion(false);
    const start = stubViewTransitions();
    const update = vi.fn();

    animateReflow(update);

    expect(start).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("still applies the update where view transitions are unsupported", () => {
    stubReducedMotion(false);
    const update = vi.fn();

    animateReflow(update);

    expect(update).toHaveBeenCalledTimes(1);
  });

  it("skips the tween under reduced motion but never the update", () => {
    stubReducedMotion(true);
    const start = stubViewTransitions();
    const update = vi.fn();

    animateReflow(update);

    expect(start).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("names a tile with a stable, legal CSS identifier", () => {
    expect(viewTransitionName("shirt-sales")).toBe("fcb-tile-shirt-sales");
    // Ids that would be illegal idents on their own must still work.
    expect(viewTransitionName("2026 kit / away")).toBe(
      "fcb-tile-2026-kit-away",
    );
    expect(viewTransitionName("a")).not.toBe(viewTransitionName("b"));
  });
});

/* ------------------------------------------------------------ AUTO-SCROLL -- */

describe("scrollRevealedIntoView", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  function stubReducedMotion(matches: boolean): void {
    window.matchMedia = vi.fn(
      (query: string) => ({ matches, media: query }) as MediaQueryList,
    );
  }

  /** jsdom implements no scrolling, so the method is installed as a spy. */
  function nodeWithSpy(): {
    node: HTMLElement;
    scrollIntoView: ReturnType<typeof vi.fn>;
  } {
    const node = document.createElement("div");
    const scrollIntoView = vi.fn();
    Object.assign(node, { scrollIntoView });
    return { node, scrollIntoView };
  }

  it("glides to the top of the revealed section", () => {
    stubReducedMotion(false);
    const { node, scrollIntoView } = nodeWithSpy();

    scrollRevealedIntoView(node);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("jumps to the same place under reduced motion", () => {
    // A smooth scroll IS motion, so the preference has to reach it too.
    stubReducedMotion(true);
    const { node, scrollIntoView } = nodeWithSpy();

    scrollRevealedIntoView(node);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("moves focus nowhere", () => {
    // Yanking focus out of the prompt bar mid-answer would be worse than not
    // scrolling at all.
    stubReducedMotion(false);
    const { node } = nodeWithSpy();
    document.body.append(node);

    scrollRevealedIntoView(node);

    expect(document.activeElement).toBe(document.body);
    node.remove();
  });

  it("does nothing when there is no node to scroll to", () => {
    stubReducedMotion(false);

    expect(() => scrollRevealedIntoView(null)).not.toThrow();
  });

  it("does nothing where scrollIntoView is unavailable", () => {
    // The server and jsdom have no scrolling; a reveal must not fail for it.
    stubReducedMotion(false);

    expect(() =>
      scrollRevealedIntoView(document.createElement("div")),
    ).not.toThrow();
  });
});

describe("scrollToTop — Reset's half of the scrolling", () => {
  const originalMatchMedia = window.matchMedia;
  const originalScrollTo = window.scrollTo;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    window.scrollTo = originalScrollTo;
    vi.restoreAllMocks();
  });

  function stubReducedMotion(matches: boolean): void {
    window.matchMedia = vi.fn(
      (query: string) => ({ matches, media: query }) as MediaQueryList,
    );
  }

  /** jsdom implements no scrolling, so the method is installed as a spy. */
  function scrollSpy(): ReturnType<typeof vi.fn> {
    const scrollTo = vi.fn();
    Object.assign(window, { scrollTo });
    return scrollTo;
  }

  it("glides back to the top of the page", () => {
    stubReducedMotion(false);
    const scrollTo = scrollSpy();

    scrollToTop();

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  });

  it("jumps there under reduced motion", () => {
    stubReducedMotion(true);
    const scrollTo = scrollSpy();

    scrollToTop();

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });

  it("moves focus nowhere", () => {
    // Same reason the reveal does not: Reset must not steal the caret.
    stubReducedMotion(false);
    scrollSpy();
    const button = document.createElement("button");
    document.body.append(button);
    button.focus();

    scrollToTop();

    expect(document.activeElement).toBe(button);
    button.remove();
  });

  it("asks the browser to scroll once per call, never stacking two", () => {
    // A browser replaces an in-flight smooth scroll, so repeated Resets do not
    // overlap animations — but each press must still be one request, not none.
    stubReducedMotion(false);
    const scrollTo = scrollSpy();

    scrollToTop();
    scrollToTop();
    scrollToTop();

    expect(scrollTo).toHaveBeenCalledTimes(3);
  });

  it("does nothing where scrollTo is unavailable", () => {
    // The server has no window scrolling; a Reset must not fail for it.
    stubReducedMotion(false);
    Object.assign(window, { scrollTo: undefined });

    expect(() => scrollToTop()).not.toThrow();
  });
});

describe("prefersReducedMotion", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("asks for exactly the query the stylesheet uses", () => {
    const matchMedia = vi.fn(
      (query: string) => ({ matches: true, media: query }) as MediaQueryList,
    );
    window.matchMedia = matchMedia;

    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
    expect(APP_CSS).toContain(`@media ${REDUCED_MOTION_QUERY}`);
  });

  it("reports no preference when the query does not match", () => {
    window.matchMedia = vi.fn(
      (query: string) => ({ matches: false, media: query }) as MediaQueryList,
    );

    expect(prefersReducedMotion()).toBe(false);
  });

  it("falls back to letting the stylesheet decide when matchMedia is absent", () => {
    // Server rendering: the CSS honours the preference on its own, so a miss
    // here must degrade quietly rather than throw.
    Object.assign(window, { matchMedia: undefined });

    expect(prefersReducedMotion()).toBe(false);
  });
});
