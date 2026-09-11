import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RING_GLOW_CLASS } from "../../app/components/charts/attendance-ring";
import { Card, TILE_ENTER_CLASS } from "../../app/components/tiles/card";
import {
  afterReflow,
  animateReflow,
  cssIdentifier,
  disableScrollRestoration,
  MOTION_CLASS,
  prefersReducedMotion,
  REDUCED_MOTION_QUERY,
  reducedMotionQuery,
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

  it("leaves gold to the ambient glow, the scan line and the attendance ring", () => {
    const glow = blockAfter(APP_CSS, `@keyframes ${KEYFRAMES.accentGlow}`);
    const scan = classRule(APP_CSS, MOTION_CLASS.scan);
    const ring = classRule(APP_CSS, RING_GLOW_CLASS);

    expect(glow).toContain("--color-accent-target-hit");
    expect(scan).toContain("--color-accent-target-hit");
    // The third consumer, added by US-016 and the ONLY one the Reference Guide
    // permits beyond the two above: the attendance ring's hover glow. It is an
    // accent on a 12px arc, not a fill, and not on a tile.
    expect(ring).toContain("--color-accent-target-hit");
    expect(ring).toContain("drop-shadow");

    // Exactly three consumers below the token definitions. A fourth means a
    // gold treatment has been added somewhere — most likely the removed ring.
    const rules = APP_CSS.slice(APP_CSS.indexOf("@layer base"));
    const consumers = rules.match(/--color-accent-target-hit/g) ?? [];
    expect(consumers.length).toBe(3);
  });

  it("keeps that ring off the tile entrance — it is the ring's, not a tile's", () => {
    // The distinction the Guide drew: an attendance ARC may be gold; a newly
    // inserted tile may not carry a gold ring or glow of any kind.
    const entrance = classRule(APP_CSS, MOTION_CLASS.enter);

    expect(entrance).not.toContain("--color-accent-target-hit");
    expect(CARD_SOURCE).not.toContain(RING_GLOW_CLASS);
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

/* --------------------------------------------------------- CSS IDENTIFIER -- */

describe("cssIdentifier", () => {
  // Shared by `viewTransitionName` above and by US-027's `useUid`, which has to
  // launder React's `useId()` into something legal inside `url(#…)`.
  it("keeps a string that is already a legal identifier", () => {
    expect(cssIdentifier("bars-fill_2")).toBe("bars-fill_2");
  });

  it("collapses each run of illegal characters to a single hyphen", () => {
    expect(cssIdentifier("2026 kit / away")).toBe("2026-kit-away");
  });

  it("drops leading and trailing hyphens so it composes behind a prefix", () => {
    expect(cssIdentifier("«r0»")).toBe("r0");
  });

  it("can reduce a string of nothing but illegal characters to empty", () => {
    // The caller decides what to do with that — `useUid` falls back to its
    // house prefix rather than emitting a bare hyphen.
    expect(cssIdentifier("«»")).toBe("");
  });
});

/* ------------------------------------------------- REDUCED MOTION QUERY -- */

describe("reducedMotionQuery", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it("hands out the live query list for the one shared query", () => {
    // The list, not just its boolean: US-027's `useReducedMotion` subscribes to
    // its `change` event, and must subscribe to the same query the stylesheet
    // matches on.
    const matchMedia = vi.fn(
      (query: string) => ({ matches: true, media: query }) as MediaQueryList,
    );
    window.matchMedia = matchMedia;

    expect(reducedMotionQuery()?.media).toBe(REDUCED_MOTION_QUERY);
    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
  });

  it("is null where there is no matchMedia to ask", () => {
    Object.assign(window, { matchMedia: undefined });

    expect(reducedMotionQuery()).toBeNull();
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

  it("stops the page where it is before it asks for anything else", () => {
    // US-045. Reset's glide to the top waits out the 400ms reflow tween, and a
    // smooth scroll started by the REVEAL is owned by the scrolling box rather
    // than by the code that began it — so those 400ms were a window in which a
    // stale scroll dragged the freshly cleared baseline down to its own foot
    // (measured in Chrome: scrollY 0 -> 233, back at the top only at ~710ms).
    // A non-smooth scroll aborts a smooth one on the same box, so scrolling to
    // where the page already is IS "stop", and moves nothing by itself.
    stubReducedMotion(false);
    const scrollTo = scrollSpy();
    Object.assign(window, { scrollY: 412, scrollX: 0 });

    scrollToTop();

    expect(scrollTo.mock.calls[0]?.[0]).toEqual({
      top: 412,
      left: 0,
      behavior: "instant",
    });
  });

  it("asks the browser to stop and then to glide, once per call", () => {
    // A browser replaces an in-flight smooth scroll, so repeated Resets do not
    // overlap animations — but each press must still be one stop and one glide,
    // not none and not a growing queue.
    stubReducedMotion(false);
    const scrollTo = scrollSpy();

    scrollToTop();
    scrollToTop();
    scrollToTop();

    expect(scrollTo).toHaveBeenCalledTimes(6);
    expect(
      scrollTo.mock.calls.filter(
        (call) => (call[0] as ScrollToOptions).behavior === "smooth",
      ),
    ).toHaveLength(3);
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

/* ==================================== KL-3, CLOSED BY US-043 ============ */

/**
 * THE SCROLL THIS PRODUCT DOES NOT WANT — the browser's own restoration.
 *
 * KL-3, measured by US-042: state is memory-only, so a reload starts a fresh
 * session at the baseline, but the SCROLL OFFSET survived it and — clamped to
 * the much shorter baseline page — landed the presenter at its foot with the
 * crest and Reset off screen (`scrollY 185` at 1920x1080, `340` at 1440x900).
 *
 * The end-to-end proof is `tests/e2e/transition-timing.spec.ts`, which really
 * scrolls a full canvas and really reloads it. This is the unit half: the mode
 * is set, it is set to `manual`, and it survives the absence of the API.
 */
describe("disableScrollRestoration — KL-3", () => {
  const original = window.history.scrollRestoration;

  afterEach(() => {
    window.history.scrollRestoration = original;
  });

  it("takes scroll restoration off the browser", () => {
    window.history.scrollRestoration = "auto";

    expect(disableScrollRestoration()).toBe(true);
    expect(window.history.scrollRestoration).toBe("manual");
  });

  it("is idempotent — a second call leaves it manual", () => {
    disableScrollRestoration();
    disableScrollRestoration();

    expect(window.history.scrollRestoration).toBe("manual");
  });

  it("reports failure rather than throwing where the mode does not stick", () => {
    // Not every engine honours the property, and an ignored assignment is
    // silent — so the result is read back rather than assumed.
    const history = {
      get scrollRestoration() {
        return "auto";
      },
      set scrollRestoration(_value: string) {
        // An engine that accepts the assignment and does nothing with it.
      },
    } as unknown as History;
    const descriptor = Object.getOwnPropertyDescriptor(window, "history");
    Object.defineProperty(window, "history", {
      value: history,
      configurable: true,
    });

    try {
      expect(disableScrollRestoration()).toBe(false);
    } finally {
      if (descriptor) Object.defineProperty(window, "history", descriptor);
    }
  });

  it("is a no-op with no window at all — the server", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "history");
    Object.defineProperty(window, "history", {
      value: undefined,
      configurable: true,
    });

    try {
      expect(disableScrollRestoration()).toBe(false);
    } finally {
      if (descriptor) Object.defineProperty(window, "history", descriptor);
    }
  });
});

/* ============================ THE SCROLLS WAIT FOR THE TWEEN (US-043) === */

/**
 * WHY THE TWO SCROLLS NOW WAIT — measured, in Chrome, against the built bundle.
 *
 * A view transition paints on pseudo-elements in a snapshot containing block
 * pinned to the VIEWPORT. Scrolling while one runs therefore slides the live
 * page out from under a static snapshot of the old one: the reveal showed a
 * doubled canvas and a white band up to ~80px across the top of the screen for
 * the length of the tween. No frames were dropped — it is a compositing
 * artifact of moving the viewport mid-cross-fade, and the screenshots in
 * US-043's report show it before and after.
 *
 * Waiting also puts the reveal in the order criterion 3 states, with the
 * auto-scroll LAST. It is the transition's own `finished` promise and not a
 * timer, so the wait is exactly the length of the tween.
 */
describe("afterReflow — the scrolls wait for the tween", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Reflect.deleteProperty(document, "startViewTransition");
    vi.restoreAllMocks();
  });

  function stubNoPreference(): void {
    window.matchMedia = vi.fn(
      (query: string) => ({ matches: false, media: query }) as MediaQueryList,
    );
  }

  /** A view transition whose tween the test decides the end of. */
  function stubPendingTransition(): { finish: () => void } {
    let finish = (): void => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    Object.assign(document, {
      startViewTransition: (update: () => void) => {
        update();
        return { finished };
      },
    });
    return { finish };
  }

  it("runs at once when no tween is on screen", () => {
    const run = vi.fn();

    afterReflow(run);

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("holds a scroll until the tween has finished", async () => {
    stubNoPreference();
    const { finish } = stubPendingTransition();
    const scrollIntoView = vi.fn();

    animateReflow(() => {});
    scrollRevealedIntoView({ scrollIntoView } as unknown as Element);

    // The section has mounted and the tween is mid-flight: nothing may move
    // the viewport yet.
    expect(scrollIntoView).not.toHaveBeenCalled();

    finish();
    await Promise.resolve();
    await Promise.resolve();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.calls[0]?.[0]).toMatchObject({
      block: "start",
      behavior: "smooth",
    });
  });

  it("holds Reset's scroll to the top for the same reason", async () => {
    stubNoPreference();
    const { finish } = stubPendingTransition();
    const scrollTo = vi.fn();
    Object.assign(window, { scrollTo });

    animateReflow(() => {});
    scrollToTop();

    // The only thing that may happen now is the STOP (US-045) — a scroll to
    // where the page already is, which aborts a stale smooth scroll without
    // moving anything. The glide to the top still waits for the tween.
    expect(
      scrollTo.mock.calls.filter(
        (call) => (call[0] as ScrollToOptions).behavior === "smooth",
      ),
    ).toHaveLength(0);

    finish();
    await Promise.resolve();
    await Promise.resolve();

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  });

  it("abandons a scroll whose reflow was superseded", async () => {
    // US-045, and the other half of the same defect. A SKIPPED transition
    // rejects `finished`, and a transition is skipped whenever a second one
    // starts — which is what Reset pressed while an answer is landing does. The
    // reveal's queued `scrollIntoView` was therefore run anyway, at a section
    // the same press was in the act of removing, and the two scrolls fought.
    // Whoever superseded this reflow has queued the scroll the presenter asked
    // for; this one belongs to a screen that no longer exists.
    stubNoPreference();
    const first = stubPendingTransition();
    const scrollIntoView = vi.fn();

    animateReflow(() => {});
    scrollRevealedIntoView({ scrollIntoView } as unknown as Element);

    // A second reflow begins before the first has finished, and only THEN does
    // the first one settle — the order a skipped transition settles in.
    const second = stubPendingTransition();
    animateReflow(() => {});
    first.finish();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(scrollIntoView).not.toHaveBeenCalled();

    // And the newer reflow's own scroll is unaffected: it still runs.
    const later = vi.fn();
    scrollRevealedIntoView({ scrollIntoView: later } as unknown as Element);
    second.finish();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(later).toHaveBeenCalledTimes(1);
  });

  it("does not hold anything back under reduced motion", () => {
    // No tween runs at all, so there is nothing to wait for — and a scroll
    // that waited on a promise that never resolves would never happen.
    window.matchMedia = vi.fn(
      (query: string) => ({ matches: true, media: query }) as MediaQueryList,
    );
    stubPendingTransition();
    const scrollIntoView = vi.fn();

    animateReflow(() => {});
    scrollRevealedIntoView({ scrollIntoView } as unknown as Element);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("releases the wait even when the tween is SKIPPED", async () => {
    // A second insertion skips the first transition, which REJECTS `finished`.
    // A rejection is as finished as a completion here; a scroll that waited on
    // the settled state only would be lost.
    stubNoPreference();
    const finished = Promise.reject(new Error("skipped"));
    Object.assign(document, {
      startViewTransition: (update: () => void) => {
        update();
        return { finished };
      },
    });
    const scrollIntoView = vi.fn();

    animateReflow(() => {});
    scrollRevealedIntoView({ scrollIntoView } as unknown as Element);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
