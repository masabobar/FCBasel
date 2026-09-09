/**
 * US-031 — **the thinking beat**, and with it US-015's last open criterion.
 *
 * Four acceptance criteria, and every one of them is a claim about TIME, so
 * this suite drives a fake clock rather than waiting on a real one:
 *
 *   ① EVERY SUCCESSFUL MATCH PAUSES BEFORE THE TILES. The ordering is asserted
 *     and not assumed: the panel is on screen and the section is NOT, one
 *     millisecond before the delay elapses — then the section is there and the
 *     panel is gone.
 *   ② THE PANEL IS THE PER-FLOW ONE, verbatim, for all six flows, with the
 *     sweeping scan line and the source chips staggered one by one.
 *   ③ REDUCED MOTION SHORTENS THE BEAT to ~260ms and renders the animations at
 *     their final state — the source chips VISIBLE, never stranded at
 *     `opacity: 0`.
 *   ④ IT IS STAGECRAFT, NOT A QUERY. No request is made, by scan and by design.
 *
 * ⑤ **US-015 CRITERION 4 — "pressed mid-flow (during a thinking beat) leaves no
 *   broken state and no orphaned animation."** US-015 built the mechanism (one
 *   pending timer, cancelled first) and recorded the criterion as PARTLY met
 *   because there was no beat yet to press through. There is now, so it is
 *   closed here: Reset during a beat leaves no panel, no section, and NO TIMER
 *   — asserted on `vi.getTimerCount()`, which counts what the whole process
 *   still has pending.
 *
 * AND ONE TIMER IN THE WHOLE APPLICATION. The beat schedules through
 * `useDashboard`'s `schedule`; a scan of every file under `app/` pins the two
 * places a timer may be created at all, so a second clock cannot appear without
 * this suite failing.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PROMPT_INPUT_LABEL,
  SEND_BUTTON_LABEL,
} from "../../app/components/chrome/prompt-bar";
import { FOLLOW_UP_CHIP_HINT } from "../../app/components/chrome/suggestion-chips";
import {
  THINKING_PANEL_CLASS,
  ThinkingPanel,
} from "../../app/components/heroes/thinking-panel";
import {
  ChipKind,
  FOLLOW_UP_CHIP_LABEL,
  HERO_CHIP_LABEL,
} from "../../app/lib/dashboard/chips";
import { InsightPhase } from "../../app/lib/dashboard/sections";
import {
  REDUCED_THINKING_DELAY_MS,
  SOURCE_CHIP_LEAD_MS,
  SOURCE_CHIP_STAGGER_MS,
  THINKING_BEATS,
  THINKING_DELAY_MS,
  thinkingBeatFor,
  thinkingDelayMs,
  sourceChipDelayMs,
} from "../../app/lib/dashboard/thinking";
import { MOTION_CLASS } from "../../app/lib/motion";
import { HERO_IDS, HeroId } from "../../app/lib/repositories/enums";
import App from "../../app/root";
import { restoreMotionStubs, stubMatchMedia } from "./support/motion-harness";

/* ------------------------------------------------------------- SOURCES -- */

/** A module's source with comments stripped — the scans below are about code. */
function code(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8").replace(
    /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    "",
  );
}

const CONFIG_CODE = code("app/lib/dashboard/thinking.ts");
const HOOK_CODE = code("app/lib/dashboard/use-thinking.ts");
const PANEL_CODE = code("app/components/heroes/thinking-panel.tsx");
const ROOT_CODE = code("app/root.tsx");
const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/** Every `.ts`/`.tsx` file under `app/`, as repo-relative paths. */
function appSources(directory = "app"): string[] {
  return readdirSync(resolve(process.cwd(), directory), {
    withFileTypes: true,
  }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return appSources(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/* -------------------------------------------------------------- QUERIES -- */

function panel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="thinking-panel"]');
}

function panels(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>('[data-slot="thinking-panel"]'),
  ];
}

function sections(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>('[data-slot="insight-section"]'),
  ];
}

function sourceChips(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>('[data-slot="thinking-source"]'),
  ];
}

function message(): string | null {
  return (
    document.querySelector('[data-slot="thinking-message"]')?.textContent ??
    null
  );
}

function promptInput(): HTMLInputElement {
  return screen.getByRole("textbox", {
    name: PROMPT_INPUT_LABEL,
  }) as HTMLInputElement;
}

/* -------------------------------------------------------------- HARNESS -- */

/**
 * `App` on a fake clock.
 *
 * `fireEvent` rather than `userEvent` throughout this suite, deliberately:
 * `userEvent` schedules its own waits, and this suite asserts on
 * `vi.getTimerCount()`, so a second source of timers would make the very claim
 * under test unmeasurable. Every interaction here is synchronous, and the ONLY
 * pending timer at any point is the application's own.
 */
function renderApp({ reducedMotion = false } = {}): void {
  stubMatchMedia(reducedMotion);
  Object.assign(window, { scrollTo: vi.fn() });
  vi.useFakeTimers();

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<p>child route</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/** Run the fake clock forward, committing whatever the beat lands. */
function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** The whole beat, at the delay in force. */
function landBeat(reducedMotion = false): void {
  advance(thinkingDelayMs(reducedMotion));
}

/** Press a chip, or the app bar's Reset. */
function tap(name: string | RegExp): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

/** Type into the field, exactly as a keystroke would. */
function typeQuestion(question: string): void {
  fireEvent.change(promptInput(), { target: { value: question } });
}

/** Submit the form — the one path Enter and the send button both take. */
function submitForm(): void {
  fireEvent.submit(document.querySelector('[data-slot="prompt-form"]')!);
}

/** Type a question and submit it. */
function ask(question: string): void {
  typeQuestion(question);
  submitForm();
}

function followUpChipName(heroId: HeroId): string {
  return `${FOLLOW_UP_CHIP_HINT} ${FOLLOW_UP_CHIP_LABEL[heroId]}`;
}

afterEach(() => {
  vi.useRealTimers();
  restoreMotionStubs();
});

/* ========================================================== THE CONFIG == */

describe("the per-flow copy (US-031 criterion 2)", () => {
  const EXPECTED: Record<ChipKind, Record<HeroId, [string, string[]]>> = {
    [ChipKind.HERO]: {
      [HeroId.HERO_1]: [
        "Querying Merchandising, Webshop and flock-printing",
        ["Merchandising", "Webshop", "Flock-printing"],
      ],
      [HeroId.HERO_2]: [
        "Querying Ticketing and matchday records",
        ["Ticketing", "Matchday records"],
      ],
      [HeroId.HERO_3]: [
        "Querying Finance and departmental budgets",
        ["Finance", "Departmental budgets"],
      ],
    },
    [ChipKind.FOLLOW_UP]: {
      [HeroId.HERO_1]: [
        "Analysing badge selection trends",
        ["Badge selection history"],
      ],
      [HeroId.HERO_2]: [
        "Breaking down fixture performance",
        ["Fixture attendance"],
      ],
      [HeroId.HERO_3]: [
        "Tracing Marketing spend and outcomes",
        ["Marketing spend", "Webshop conversion"],
      ],
    },
  };

  const FLOWS = Object.values(ChipKind).flatMap((kind) =>
    HERO_IDS.map((heroId) => [kind, heroId] as const),
  );

  it("covers every flow the prototype can answer, and only those", () => {
    expect(FLOWS).toHaveLength(6);
    expect(Object.keys(THINKING_BEATS).sort()).toEqual(
      Object.values(ChipKind).sort(),
    );
    for (const kind of Object.values(ChipKind)) {
      expect(Object.keys(THINKING_BEATS[kind]).sort()).toEqual(
        [...HERO_IDS].sort(),
      );
    }
  });

  it.each(FLOWS)("states the %s message for %s verbatim", (kind, heroId) => {
    expect(thinkingBeatFor(heroId, kind).message).toBe(
      EXPECTED[kind][heroId][0],
    );
  });

  it.each(FLOWS)("names the %s sources for %s, in order", (kind, heroId) => {
    expect([...thinkingBeatFor(heroId, kind).sources]).toEqual(
      EXPECTED[kind][heroId][1],
    );
  });

  it.each(FLOWS)(
    "gives %s / %s at least one source to light up",
    (kind, id) => {
      expect(thinkingBeatFor(id, kind).sources.length).toBeGreaterThan(0);
    },
  );

  it.each(FLOWS)("keeps %s / %s's sources unique", (kind, heroId) => {
    // The source string is the React key of its chip.
    const { sources } = thinkingBeatFor(heroId, kind);
    expect(new Set(sources).size).toBe(sources.length);
  });

  it("says 'Querying' on a hero and analyses on a follow-up", () => {
    // Deliberate stagecraft copy, and the split is deliberate too: a hero names
    // the systems, a follow-up names the analysis over what they returned.
    for (const heroId of HERO_IDS) {
      expect(thinkingBeatFor(heroId, ChipKind.HERO).message).toMatch(
        /^Querying /,
      );
      expect(thinkingBeatFor(heroId, ChipKind.FOLLOW_UP).message).not.toMatch(
        /^Querying /,
      );
    }
  });
});

describe("the two delays (criteria 1 and 3)", () => {
  it("uses the reference's ~1150ms", () => {
    expect(THINKING_DELAY_MS).toBe(1150);
  });

  it("sits inside the criterion's 600-1200ms band", () => {
    expect(THINKING_DELAY_MS).toBeGreaterThanOrEqual(600);
    expect(THINKING_DELAY_MS).toBeLessThanOrEqual(1200);
  });

  it("shortens to ~260ms under reduced motion", () => {
    expect(REDUCED_THINKING_DELAY_MS).toBe(260);
    expect(thinkingDelayMs(true)).toBe(REDUCED_THINKING_DELAY_MS);
    expect(thinkingDelayMs(false)).toBe(THINKING_DELAY_MS);
  });

  it("shortens the beat rather than removing it", () => {
    // Reduced motion asks for less MOTION; the pause is not motion, and a beat
    // of zero would make the answer look pre-baked to everyone who asked.
    expect(REDUCED_THINKING_DELAY_MS).toBeGreaterThan(0);
    expect(REDUCED_THINKING_DELAY_MS).toBeLessThan(THINKING_DELAY_MS);
  });
});

describe("the source-chip stagger (criterion 2)", () => {
  it("leads with the reference's 150ms, then 220ms apart", () => {
    expect(SOURCE_CHIP_LEAD_MS).toBe(150);
    expect(SOURCE_CHIP_STAGGER_MS).toBe(220);
    expect(sourceChipDelayMs(0)).toBe(150);
    expect(sourceChipDelayMs(1)).toBe(370);
    expect(sourceChipDelayMs(2)).toBe(590);
  });

  it("is strictly increasing, so the chips arrive one by one", () => {
    const delays = [0, 1, 2, 3, 4].map(sourceChipDelayMs);
    for (const [index, delay] of delays.entries()) {
      if (index === 0) continue;
      expect(delay).toBeGreaterThan(delays[index - 1]!);
    }
  });

  it("finishes every flow's chips before the beat ends", () => {
    // A chip still animating when the section arrives would read as a glitch.
    for (const kind of Object.values(ChipKind)) {
      for (const heroId of HERO_IDS) {
        const { sources } = thinkingBeatFor(heroId, kind);
        expect(sourceChipDelayMs(sources.length - 1)).toBeLessThan(
          THINKING_DELAY_MS,
        );
      }
    }
  });
});

/* =========================================================== THE PANEL == */

describe("the thinking panel", () => {
  const BEAT = thinkingBeatFor(HeroId.HERO_1, ChipKind.HERO);

  function renderPanel() {
    return render(<ThinkingPanel beat={BEAT} />);
  }

  it("states the message verbatim", () => {
    renderPanel();

    expect(message()).toBe(BEAT.message);
  });

  it("renders one chip per source, in order and verbatim", () => {
    renderPanel();

    expect(sourceChips().map((chip) => chip.textContent)).toEqual([
      ...BEAT.sources,
    ]);
  });

  it("staggers those chips one by one", () => {
    renderPanel();

    expect(sourceChips().map((chip) => chip.style.animationDelay)).toEqual([
      "150ms",
      "370ms",
      "590ms",
    ]);
  });

  it("animates each chip with US-006's source-chip keyframe", () => {
    renderPanel();

    for (const chip of sourceChips()) {
      expect(chip).toHaveClass(MOTION_CLASS.sourceChip);
    }
  });

  it("carries the sweeping scan line", () => {
    renderPanel();

    const scan = document.querySelector('[data-slot="thinking-scan"]')!;
    expect(scan).toHaveClass(MOTION_CLASS.scan);
    expect(panel()).toContainElement(scan as HTMLElement);
  });

  it("keeps the sweep and the glyph decorative", () => {
    renderPanel();

    expect(
      document.querySelector('[data-slot="thinking-scan"]'),
    ).toHaveAttribute("aria-hidden", "true");
    expect(
      document.querySelector('[data-slot="thinking-glyph"]'),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("gives the sweep a box to resolve against and be clipped by", () => {
    // `.fcb-scan` is absolutely positioned and travels to translateX(500%).
    expect(THINKING_PANEL_CLASS).toContain("relative");
    expect(THINKING_PANEL_CLASS).toContain("overflow-hidden");
  });

  it("pulses the AI glyph with the ambient glow, not the entrance", () => {
    renderPanel();

    const glyph = document.querySelector('[data-slot="thinking-glyph"]')!;
    expect(glyph).toHaveClass(MOTION_CLASS.glow);
    expect(glyph).not.toHaveClass(MOTION_CLASS.enter);
  });

  it("enters like an inserted tile", () => {
    renderPanel();

    expect(panel()).toHaveClass(MOTION_CLASS.enter);
  });

  it("announces the beat politely", () => {
    // A screen-reader user is told what is being looked at; politely, because
    // this is progress and must not interrupt what is being read.
    renderPanel();

    expect(panel()).toHaveAttribute("role", "status");
    expect(panel()).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveTextContent(BEAT.message);
  });

  it("keeps the source names inside the announcement", () => {
    // Which systems are being looked at is information, not decoration.
    renderPanel();

    for (const source of BEAT.sources) {
      expect(screen.getByRole("status")).toHaveTextContent(source);
    }
  });

  it("spans the canvas grid rather than starting a layout of its own", () => {
    expect(THINKING_PANEL_CLASS).toContain("col-span-full");
  });

  it("brings itself into view as it mounts", () => {
    // The canvas grows downwards: by the third question the panel is below the
    // fold, and a presenter would watch nothing happen.
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    renderPanel();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("defines no keyframe of its own and adds none to the stylesheet", () => {
    expect(PANEL_CODE).not.toMatch(/@keyframes|animation:/);
    expect(APP_CSS.match(/@keyframes/g)).toHaveLength(4);
  });

  it("uses tokens, never a hex or an arbitrary value", () => {
    expect(PANEL_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(PANEL_CODE).not.toMatch(
      /(?:text|bg|rounded|shadow|border|from|to)-\[/,
    );
  });
});

/* ================================================== REDUCED MOTION ===== */

describe("reduced motion renders the panel at its final state (criterion 3)", () => {
  /** The declarations the reduced-motion block applies to one class. */
  function reducedRuleFor(className: string): string {
    const block = APP_CSS.slice(
      APP_CSS.indexOf("@media (prefers-reduced-motion: reduce)"),
    ).replace(/\/\*[\s\S]*?\*\//g, "");

    for (const [, group = "", body = ""] of block.matchAll(
      /([^{}]+)\{([^{}]*)\}/g,
    )) {
      const selectors = group.split(",").map((selector) => selector.trim());
      if (selectors.includes(`.${className}`)) return body;
    }
    return "";
  }

  it("shows the source chips VISIBLE, not stranded at opacity 0", () => {
    // The trap US-006's stylesheet exists to avoid, restated for this panel:
    // `fcbSrc` animates in FROM `opacity: 0`, so the preference must land it on
    // its closing frame rather than remove the animation.
    const rule = reducedRuleFor(MOTION_CLASS.sourceChip);
    expect(rule).toMatch(/opacity:\s*1\s*!important/);
    expect(rule).toMatch(/transform:\s*none\s*!important/);
  });

  it("zeroes the stagger, so the chips are all there at once", () => {
    expect(reducedRuleFor(MOTION_CLASS.enter)).toMatch(
      /opacity:\s*1\s*!important/,
    );
    expect(
      APP_CSS.slice(APP_CSS.indexOf("@media (prefers-reduced-motion: reduce)")),
    ).toMatch(/animation-delay:\s*0ms\s*!important/);
  });

  it("sets nothing inline that could override that final state", () => {
    // The only inline style on a chip is its stagger, which the block above
    // zeroes; an inline `opacity` would beat the stylesheet's `!important`.
    render(
      <ThinkingPanel beat={thinkingBeatFor(HeroId.HERO_3, ChipKind.HERO)} />,
    );

    for (const chip of sourceChips()) {
      expect(chip.style.opacity).toBe("");
      expect(chip.style.transform).toBe("");
      expect(chip.getAttribute("style")).toMatch(/^animation-delay:/);
    }
  });

  it("hides the sweep, the one element with no meaningful end state", () => {
    expect(reducedRuleFor(MOTION_CLASS.scan)).toMatch(
      /display:\s*none\s*!important/,
    );
  });

  it("still runs the beat, at ~260ms", () => {
    renderApp({ reducedMotion: true });

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    expect(panel()).not.toBeNull();

    advance(REDUCED_THINKING_DELAY_MS - 1);
    expect(sections()).toHaveLength(0);
    expect(panel()).not.toBeNull();

    advance(1);
    expect(sections()).toHaveLength(1);
    expect(panel()).toBeNull();
  });

  it("is genuinely shorter than the full beat", () => {
    // The same clock reading that lands the answer above leaves the full beat
    // still running, so the shortening is real and not a coincidence of setup.
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    advance(REDUCED_THINKING_DELAY_MS);

    expect(sections()).toHaveLength(0);
    expect(panel()).not.toBeNull();
  });
});

/* ================================================== THE BEAT ON SCREEN == */

describe("the beat comes BEFORE the tiles (criterion 1)", () => {
  it("holds the section back until the delay has elapsed", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);

    // The whole criterion, in three readings of the same clock.
    expect(panel()).not.toBeNull();
    expect(sections()).toHaveLength(0);

    advance(THINKING_DELAY_MS - 1);
    expect(panel()).not.toBeNull();
    expect(sections()).toHaveLength(0);

    advance(1);
    expect(panel()).toBeNull();
    expect(sections()).toHaveLength(1);
  });

  it("never shows the panel beside the answer it stood in for", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_2]);
    landBeat();

    expect(panels()).toHaveLength(0);
    expect(sections()).toHaveLength(1);
  });

  it("pauses a TYPED question the same way", () => {
    renderApp();

    ask("how are shirts selling");

    expect(message()).toBe(
      thinkingBeatFor(HeroId.HERO_1, ChipKind.HERO).message,
    );
    expect(sections()).toHaveLength(0);

    landBeat();
    expect(sections()[0]).toHaveAttribute("data-hero-id", HeroId.HERO_1);
  });

  it("pauses a re-asked hero too — every successful match beats", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    landBeat();
    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);

    expect(panel()).not.toBeNull();
    landBeat();
    expect(sections()).toHaveLength(1);
  });

  it("puts the panel last on the canvas, where the answer will appear", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);

    const grid = document.querySelector('[data-slot="canvas-grid"]')!;
    expect(grid.lastElementChild).toBe(panel());
  });

  it("shows NO beat for an off-script question (US-032's input)", () => {
    // A beat promises an answer. Nothing is coming, so nothing is promised.
    renderApp();

    ask("show me player injuries");

    expect(panel()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);

    advance(THINKING_DELAY_MS * 2);
    expect(sections()).toHaveLength(0);
    expect(panel()).toBeNull();
  });

  it("shows no beat for an empty submit either", () => {
    renderApp();

    tap(SEND_BUTTON_LABEL);

    expect(panel()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("the panel a presenter sees, per flow", () => {
  it.each(HERO_IDS)("names %s's systems while its hero runs", (heroId) => {
    renderApp();

    tap(HERO_CHIP_LABEL[heroId]);

    const beat = thinkingBeatFor(heroId, ChipKind.HERO);
    expect(message()).toBe(beat.message);
    expect(sourceChips().map((chip) => chip.textContent)).toEqual([
      ...beat.sources,
    ]);
  });

  it.each(HERO_IDS)(
    "names %s's analysis while its follow-up runs",
    (heroId) => {
      renderApp();

      tap(HERO_CHIP_LABEL[heroId]);
      landBeat();
      tap(followUpChipName(heroId));

      const beat = thinkingBeatFor(heroId, ChipKind.FOLLOW_UP);
      expect(message()).toBe(beat.message);
      expect(sourceChips().map((chip) => chip.textContent)).toEqual([
        ...beat.sources,
      ]);

      landBeat();
      expect(sections()[0]).toHaveAttribute(
        "data-phase",
        InsightPhase.WITH_FOLLOW_UP,
      );
    },
  );

  it("shows the HERO's beat when a follow-up has no parent yet", () => {
    // `showFollowUp` renders the parent first (US-014/US-033), so the panel
    // says what is actually about to appear rather than promising the deep-dive.
    renderApp();

    ask("why is marketing high?");

    expect(message()).toBe(
      thinkingBeatFor(HeroId.HERO_3, ChipKind.HERO).message,
    );

    landBeat();
    expect(sections()[0]).toHaveAttribute("data-phase", InsightPhase.PRIMARY);
  });

  it("keeps a chip tap out of the matcher, beat or no beat", () => {
    // US-029 criterion 2 still holds through US-031: the beat wraps the two
    // dashboard actions, it does not join the two paths into one.
    expect(ROOT_CODE).toMatch(/selectChip\(chip, actions\)/);
    expect(ROOT_CODE).toMatch(/askQuestion\(question, actions\)/);
    expect(HOOK_CODE).not.toMatch(/matchIntent|normaliseQuestion|scoreIntent/);
  });
});

/* ============================================== BUSY, AND NO OVERLAP ==== */

describe("the prompt bar is busy for the length of the beat", () => {
  it("closes the field and the send button, then reopens them", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);

    expect(promptInput()).toBeDisabled();
    expect(
      screen.getByRole("button", { name: SEND_BUTTON_LABEL }),
    ).toBeDisabled();
    expect(document.querySelector('[data-slot="prompt-form"]')).toHaveAttribute(
      "aria-busy",
      "true",
    );

    landBeat();

    expect(promptInput()).toBeEnabled();
    expect(
      screen.getByRole("button", { name: SEND_BUTTON_LABEL }),
    ).toBeEnabled();
    expect(document.querySelector('[data-slot="prompt-form"]')).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });

  it("makes a second submit during the beat a no-op", () => {
    renderApp();

    ask("ticket revenue");
    expect(panel()).not.toBeNull();

    // The field is disabled, so this is the only way a second submit can even
    // be attempted — and US-028's `busy` guard drops it.
    ask("department budgets");
    tap(SEND_BUTTON_LABEL);
    landBeat();

    expect(sections()).toHaveLength(1);
    expect(sections()[0]).toHaveAttribute("data-hero-id", HeroId.HERO_2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("lets a chip tap REPLACE a beat rather than race it", () => {
    // Chips stay live during a beat, as they do in the reference. One timer
    // means the second tap cannot overlap the first: it supersedes it.
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    advance(400);
    tap(HERO_CHIP_LABEL[HeroId.HERO_2]);

    expect(panels()).toHaveLength(1);
    expect(message()).toBe(
      thinkingBeatFor(HeroId.HERO_2, ChipKind.HERO).message,
    );
    expect(vi.getTimerCount()).toBe(1);

    landBeat();

    expect(sections()).toHaveLength(1);
    expect(sections()[0]).toHaveAttribute("data-hero-id", HeroId.HERO_2);
  });

  it("shows exactly one thinking indicator at a time", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    tap(HERO_CHIP_LABEL[HeroId.HERO_3]);
    tap(HERO_CHIP_LABEL[HeroId.HERO_2]);

    expect(panels()).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);
  });
});

/* ====================================== US-015 CRITERION 4, CLOSED ===== */

describe("Reset pressed mid-beat (US-015 criterion 4)", () => {
  function askThenReset() {
    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    expect(panel()).not.toBeNull();
    expect(vi.getTimerCount()).toBe(1);

    tap("Reset");
  }

  it("leaves no panel and no timer behind", () => {
    renderApp();

    askThenReset();

    // The two halves of "no orphaned animation": the animation is off the
    // screen, and the clock behind it is gone from the process.
    expect(panel()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never lets the cancelled answer arrive", () => {
    renderApp();

    askThenReset();
    advance(THINKING_DELAY_MS * 3);

    expect(sections()).toHaveLength(0);
    expect(panel()).toBeNull();
  });

  it("leaves the dashboard at its baseline, not in a broken state", () => {
    renderApp();

    askThenReset();

    expect(screen.getByText("child route")).toBeInTheDocument();
    expect(promptInput()).toBeEnabled();
    expect(promptInput()).toHaveValue("");
    expect(
      screen.getAllByRole("button", { name: /Shirt sales by kit/ }),
    ).toHaveLength(1);
  });

  it("leaves the screen able to ask the next question immediately", () => {
    renderApp();

    askThenReset();
    tap(HERO_CHIP_LABEL[HeroId.HERO_2]);

    expect(panel()).not.toBeNull();
    landBeat();

    expect(sections()).toHaveLength(1);
    expect(sections()[0]).toHaveAttribute("data-hero-id", HeroId.HERO_2);
  });

  it("cancels a beat that would have SHARPENED a section, too", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_3]);
    landBeat();
    tap(followUpChipName(HeroId.HERO_3));
    tap("Reset");
    advance(THINKING_DELAY_MS * 3);

    // Neither the follow-up nor the section it would have flipped survives.
    expect(sections()).toHaveLength(0);
    expect(panel()).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("is stable pressed twice mid-beat", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    tap("Reset");
    tap("Reset");
    advance(THINKING_DELAY_MS * 2);

    expect(sections()).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels the timer BEFORE it touches state, in the hook itself", () => {
    // The mechanism US-015 proved by mutation testing, restated: the cancel is
    // the first statement of `reset`, so no ordering of commits can let a
    // pending beat slip past it.
    const RESET = code("app/lib/dashboard/use-dashboard.ts").slice(
      code("app/lib/dashboard/use-dashboard.ts").indexOf(
        "const reset = useCallback",
      ),
    );
    expect(RESET.indexOf("cancelPending()")).toBeLessThan(
      RESET.indexOf("committed.current"),
    );
  });
});

/* ================================================= ONE TIMER, NO QUERY == */

describe("one timer in the whole application", () => {
  it("schedules the beat through the dashboard's pending timer", () => {
    expect(HOOK_CODE).toMatch(/schedule\(\s*\(\) => \{/);
  });

  it("creates no timer of its own anywhere in the beat", () => {
    for (const source of [CONFIG_CODE, HOOK_CODE, PANEL_CODE, ROOT_CODE]) {
      expect(source).not.toMatch(/setTimeout|setInterval|clearTimeout/);
    }
  });

  it("pins the only two places in app/ that may create a timer", () => {
    // A second clock is the bug class US-015's single pending timer exists to
    // rule out, so this is asserted over the tree rather than over the diff.
    const timerFiles = appSources().filter((path) =>
      /\bsetTimeout\s*\(|\bsetInterval\s*\(/.test(code(path)),
    );

    expect(timerFiles.sort()).toEqual([
      // The ONE pending timer — the beat's, and Reset cancels it.
      "app/lib/dashboard/use-dashboard.ts",
      // US-027's `requestAnimationFrame` fallback for DOM-less renderers.
      "app/lib/hooks/use-motion.ts",
    ]);
  });

  it("reads the motion preference through the one shared hook", () => {
    expect(HOOK_CODE).toMatch(/useReducedMotion\(\)/);
    expect(HOOK_CODE).not.toMatch(/matchMedia/);
    expect(PANEL_CODE).not.toMatch(/matchMedia|useReducedMotion/);
  });
});

describe("stagecraft, not a query (criterion 4)", () => {
  const NETWORK =
    /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|axios|\bimport\s*\(/;

  it.each([
    ["app/lib/dashboard/thinking.ts", CONFIG_CODE],
    ["app/lib/dashboard/use-thinking.ts", HOOK_CODE],
    ["app/components/heroes/thinking-panel.tsx", PANEL_CODE],
  ])("makes no request in %s", (_path, source) => {
    expect(source).not.toMatch(NETWORK);
  });

  it("names no model, query language or query engine", () => {
    for (const source of [CONFIG_CODE, HOOK_CODE, PANEL_CODE]) {
      expect(source).not.toMatch(/openai|anthropic|llm|embedding|\bsql\b/i);
    }
  });

  it("keeps the copy as data — the config imports nothing but two enums", () => {
    // US-030's pattern: the vocabulary is a static value a test can read whole.
    const imports = [...CONFIG_CODE.matchAll(/from "([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(imports.sort()).toEqual(["../repositories/enums", "./chips"]);
  });

  it("adds no dependency — the panel's only package is the icon set", () => {
    const packages = [...PANEL_CODE.matchAll(/from "([^"]+)"/g)]
      .map((match) => match[1]!)
      .filter((specifier) => !specifier.startsWith("."));
    expect(packages.sort()).toEqual(["lucide-react", "react"]);
  });

  it("holds the delay as a plain number of milliseconds", () => {
    expect(typeof THINKING_DELAY_MS).toBe("number");
    expect(typeof REDUCED_THINKING_DELAY_MS).toBe("number");
  });
});
