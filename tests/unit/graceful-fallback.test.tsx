/**
 * US-032 — **the graceful fallback panel**, and the empty state beside it.
 *
 * The backlog names this behaviour untouchable at any cost, because it guards
 * the one live moment the prototype cannot recover from: the owner ignores the
 * chips, types their own wording in front of the room, and it matches nothing.
 * So the four criteria are asserted as absolutes rather than as appearances:
 *
 *   ① THE COPY IS BYTE-IDENTICAL to the authored string — straight apostrophe,
 *     closing HYPHEN, no smart quotes — and the three prepared questions are
 *     re-surfaced INSIDE the panel, using US-029's own chip components.
 *   ② NEVER AN ERROR, NEVER BLAME, NEVER A DEAD END. No alert role, no
 *     assertive region, no error styling, and none of the blame vocabulary
 *     ("sorry", "error", "invalid", "understand", "unfortunately", "failed") in
 *     the copy, in the rendered panel or in the source. The chips are always
 *     there, so the screen always has a next step.
 *   ③ THE EXTREME CASE lands here like any other: "show me player injuries",
 *     pure gibberish and an `<img onerror>` payload all reach the same panel,
 *     and NO BEAT precedes any of them — the panel is immediate.
 *   ④ THE EMPTY STATE, before anything is asked: the branded-red wash DERIVED
 *     from `--color-red` at 4.5% (never the rgba literal), a matching hairline,
 *     a bold navy heading, a lighter one-line subtext and a red gradient badge.
 *
 * AND THE INVARIANT ACROSS BOTH: thinking, fallback and empty state are
 * MUTUALLY EXCLUSIVE, decided in one place (`canvasPanelFor`) that returns a
 * single value; Reset returns the canvas to the empty state.
 *
 * `fireEvent` on a fake clock throughout the wired suites, for the reason
 * `thinking-beat.test.tsx` gives: `userEvent` schedules waits of its own, and
 * "no beat precedes the fallback" is asserted on `vi.getTimerCount()`.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PROMPT_INPUT_LABEL,
  SEND_BUTTON_LABEL,
} from "../../app/components/chrome/prompt-bar";
import {
  CHIP_KIND_CLASS,
  CHIP_ROW_LABEL,
  FOLLOW_UP_CHIP_HINT,
} from "../../app/components/chrome/suggestion-chips";
import {
  EMPTY_STATE_BADGE_CLASS,
  EMPTY_STATE_HEADING,
  EMPTY_STATE_PANEL_CLASS,
  EMPTY_STATE_SUBTEXT,
  EmptyStatePanel,
} from "../../app/components/heroes/empty-state-panel";
import {
  FALLBACK_MESSAGE,
  FALLBACK_PANEL_CLASS,
  FallbackPanel,
} from "../../app/components/heroes/fallback-panel";
import {
  ChipKind,
  FOLLOW_UP_CHIP_LABEL,
  HERO_CHIP_LABEL,
  HERO_CHIPS,
} from "../../app/lib/dashboard/chips";
import {
  BASELINE_SECTIONS,
  InsightPhase,
  type InsightSections,
  NO_SECTIONS,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import {
  CanvasPanel,
  canvasPanelFor,
} from "../../app/lib/dashboard/use-canvas-panel";
import { thinkingDelayMs } from "../../app/lib/dashboard/thinking";
import { MOTION_CLASS } from "../../app/lib/motion";
import { HERO_IDS, HeroId } from "../../app/lib/repositories/enums";
import { color, fontSize } from "../../app/lib/tokens";
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

const FALLBACK_CODE = code("app/components/heroes/fallback-panel.tsx");
const EMPTY_CODE = code("app/components/heroes/empty-state-panel.tsx");
const HOOK_CODE = code("app/lib/dashboard/use-canvas-panel.ts");
const ROOT_CODE = code("app/root.tsx");
const ROOT_SOURCE = readFileSync(
  resolve(process.cwd(), "app/root.tsx"),
  "utf8",
);
const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/**
 * The acceptance criteria as written, whitespace-collapsed.
 *
 * The verbatim string is checked against THIS as well as against a literal in
 * the test, so the two copies cannot drift together: the backlog is the source
 * the client signed off, and it wraps the sentence across two lines.
 */
const BACKLOG = readFileSync(
  resolve(
    process.cwd(),
    ".project-management/input/backlog/phase-3a-conversation.md",
  ),
  "utf8",
).replace(/\s+/g, " ");

/* -------------------------------------------------------------- QUERIES -- */

function fallbackPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="fallback-panel"]');
}

function emptyPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="empty-state-panel"]');
}

function thinkingPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="thinking-panel"]');
}

function fallbackMessage(): string | null {
  return (
    document.querySelector('[data-slot="fallback-message"]')?.textContent ??
    null
  );
}

function sections(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>('[data-slot="insight-section"]'),
  ];
}

function chipButtons(root: ParentNode = document): HTMLButtonElement[] {
  return [
    ...root.querySelectorAll<HTMLButtonElement>(
      '[data-slot="suggestion-chip"]',
    ),
  ];
}

/** The chips inside the fallback panel — the ones criterion 1 is about. */
function panelChips(): HTMLButtonElement[] {
  const panel = fallbackPanel();
  return panel === null ? [] : chipButtons(panel);
}

/** The chips in the prompt bar's own row, which the panel must not duplicate. */
function rowChips(): HTMLButtonElement[] {
  const row = document.querySelector('[data-slot="prompt-bar"]');
  return row === null ? [] : chipButtons(row);
}

function promptInput(): HTMLInputElement {
  return screen.getByRole("textbox", {
    name: PROMPT_INPUT_LABEL,
  }) as HTMLInputElement;
}

/** How many of the three transient panels are on screen. Must never exceed 1. */
function panelsOnScreen(): string[] {
  return (
    [
      ["thinking", thinkingPanel()],
      ["fallback", fallbackPanel()],
      ["empty", emptyPanel()],
    ] as const
  )
    .filter(([, element]) => element !== null)
    .map(([name]) => name);
}

/* -------------------------------------------------------------- HARNESS -- */

/** `App` on a fake clock — see the file note for why `fireEvent`. */
function renderApp(): void {
  stubMatchMedia(false);
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

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Land whatever beat is in flight. */
function landBeat(): void {
  advance(thinkingDelayMs(false));
}

function tap(name: string | RegExp): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

/** Type a question and submit it — the one path Enter and the button share. */
function ask(question: string): void {
  fireEvent.change(promptInput(), { target: { value: question } });
  fireEvent.submit(document.querySelector('[data-slot="prompt-form"]')!);
}

afterEach(() => {
  vi.useRealTimers();
  restoreMotionStubs();
});

/* ============================================== THE VERBATIM COPY (①) == */

/** The string as the backlog authors it. Retyped here on purpose. */
const AUTHORED =
  "I can pull that together. For this preview, here are the questions I've prepared -";

/** UTF-8 bytes, so "byte-identical" is asserted rather than approximated. */
function bytes(value: string): string {
  return Buffer.from(value, "utf8").toString("hex");
}

describe("the fallback copy is the contract (criterion 1)", () => {
  it("is byte-identical to the authored string", () => {
    expect(bytes(FALLBACK_MESSAGE)).toBe(bytes(AUTHORED));
    expect(FALLBACK_MESSAGE).toHaveLength(AUTHORED.length);
  });

  it("matches the acceptance criterion in the backlog itself", () => {
    // Two independent copies would drift together; the signed-off document
    // cannot, so the string is checked against it as well.
    expect(BACKLOG).toContain(FALLBACK_MESSAGE);
  });

  it('uses a STRAIGHT apostrophe in "I\'ve"', () => {
    expect(FALLBACK_MESSAGE).toContain("I've");
    expect(FALLBACK_MESSAGE.codePointAt(FALLBACK_MESSAGE.indexOf("'"))).toBe(
      0x27,
    );
    // No typographic quote of any kind: a smart apostrophe here is the classic
    // silent "improvement" a copy pass makes.
    expect(FALLBACK_MESSAGE).not.toMatch(/[‘’“”]/u);
  });

  it("ends in a plain HYPHEN, never an em or en dash", () => {
    // House style is hyphens only, and this is the character most likely to be
    // "improved" by an editor or a formatter.
    expect(FALLBACK_MESSAGE.endsWith(" -")).toBe(true);
    expect(FALLBACK_MESSAGE.codePointAt(FALLBACK_MESSAGE.length - 1)).toBe(
      0x2d,
    );
    expect(FALLBACK_MESSAGE).not.toMatch(/[–—]/);
  });

  it("carries no dash outside that hyphen, in either panel's copy", () => {
    for (const copy of [
      FALLBACK_MESSAGE,
      EMPTY_STATE_HEADING,
      EMPTY_STATE_SUBTEXT,
    ]) {
      expect(copy).not.toMatch(/[–—]/);
    }
  });

  it("renders untransformed — no truncation, no re-casing, no ellipsis", () => {
    renderApp();

    ask("show me player injuries");

    expect(bytes(fallbackMessage() ?? "")).toBe(bytes(AUTHORED));
    expect(fallbackMessage()).not.toMatch(/…|\.\.\./);
  });
});

/* ========================================== ANYTHING OFF-SCRIPT (①③) == */

describe("an off-script question lands on the panel (criteria 1 and 3)", () => {
  /** The extreme case the criterion names, plus gibberish and near-misses. */
  const OFF_SCRIPT = [
    "show me player injuries",
    "asdfghjkl qwerty zxcv",
    "hello",
    "what is the weather in basel",
    "marketing",
    "sales",
    "!!!???",
    '<img src=x onerror="alert(1)">',
  ];

  it.each(OFF_SCRIPT)("answers %j with the panel", (question) => {
    renderApp();

    ask(question);

    expect(fallbackPanel()).not.toBeNull();
    expect(fallbackMessage()).toBe(FALLBACK_MESSAGE);
    expect(panelChips()).toHaveLength(HERO_IDS.length);
  });

  it.each(OFF_SCRIPT)("inserts no section for %j", (question) => {
    renderApp();

    ask(question);

    expect(sections()).toHaveLength(0);
  });

  it("removes nothing that was already on the canvas", () => {
    // "Never leaves the screen without a next step" also means never taking
    // anything away: the routed page and both controls stay exactly as they
    // were.
    renderApp();

    ask("show me player injuries");

    expect(screen.getByText("child route")).toBeInTheDocument();
    expect(promptInput()).toBeEnabled();
    expect(
      screen.getByRole("button", { name: SEND_BUTTON_LABEL }),
    ).toBeEnabled();
  });

  it("shows the panel BELOW the answers, last on the canvas", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    landBeat();
    ask("show me player injuries");

    const grid = document.querySelector('[data-slot="canvas-grid"]')!;
    expect(grid.lastElementChild).toBe(fallbackPanel());
    expect(sections()).toHaveLength(1);
  });
});

/* ================================================ NO BEAT PRECEDES IT == */

describe("the panel is immediate — no thinking beat (criterion 3)", () => {
  it("puts the panel up in the same commit as the submit", () => {
    // A beat promises an answer. Nothing is coming, so nothing is promised and
    // nothing is waited for: no clock is advanced anywhere in this test.
    renderApp();

    ask("show me player injuries");

    expect(fallbackPanel()).not.toBeNull();
    expect(thinkingPanel()).toBeNull();
  });

  it("schedules no timer at all", () => {
    renderApp();

    ask("show me player injuries");

    expect(vi.getTimerCount()).toBe(0);
  });

  it("still shows the same panel long after the beat would have landed", () => {
    renderApp();

    ask("show me player injuries");
    advance(thinkingDelayMs(false) * 3);

    expect(fallbackPanel()).not.toBeNull();
    expect(thinkingPanel()).toBeNull();
    expect(sections()).toHaveLength(0);
  });

  it("does not raise the panel for an empty submit", () => {
    // Empty input is a no-op (US-028), not an off-script question: the canvas
    // stays at its invitation.
    renderApp();

    tap(SEND_BUTTON_LABEL);

    expect(fallbackPanel()).toBeNull();
    expect(emptyPanel()).not.toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});

/* ================================== THE THREE PREPARED QUESTIONS (①) == */

describe("the panel re-surfaces the three prepared questions", () => {
  it("offers exactly three chips, in the prepared order", () => {
    renderApp();

    ask("show me player injuries");

    expect(panelChips().map((chip) => chip.textContent)).toEqual(
      HERO_IDS.map((heroId) => HERO_CHIP_LABEL[heroId]),
    );
  });

  it("offers hero chips only, never a follow-up", () => {
    // A follow-up points at the deep-dive of an answer that is not on screen,
    // so the panel carries the three prepared questions even when the row
    // above the field is offering a follow-up as well.
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    landBeat();
    ask("show me player injuries");

    expect(
      panelChips().every((chip) => chip.dataset.kind === ChipKind.HERO),
    ).toBe(true);
    expect(panelChips()).toHaveLength(3);
    expect(rowChips()).toHaveLength(4);
    expect(
      screen.getAllByRole("button", {
        name: `${FOLLOW_UP_CHIP_HINT} ${FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]}`,
      }),
    ).toHaveLength(1);
  });

  it("renders US-029's chip components, not a second set of buttons", () => {
    // Reuse asserted three ways: the same `data-slot`, the same surface and
    // tint classes as the row above the field, and no `<button>` of its own
    // anywhere in the panel's source.
    renderApp();

    ask("show me player injuries");

    const [panelChip] = panelChips();
    const rowChip = rowChips().find(
      (chip) => chip.textContent === panelChip?.textContent,
    );

    expect(panelChip).toBeDefined();
    expect(rowChip).toBeDefined();
    expect(panelChip!.className).toBe(rowChip!.className);
    expect(panelChip!.className).toContain(CHIP_KIND_CLASS[ChipKind.HERO]);
    expect(FALLBACK_CODE).not.toMatch(/<button/);
    expect(FALLBACK_CODE).toMatch(
      /import \{ SuggestionChips \} from "\.\.\/chrome\/suggestion-chips"/,
    );
  });

  it("draws them from the frozen prepared set, not from the derived row", () => {
    expect(FALLBACK_CODE).toContain("HERO_CHIPS");
    expect(FALLBACK_CODE).not.toContain("suggestionChips(");
    expect(HERO_CHIPS.map((chip) => chip.kind)).toEqual(
      HERO_IDS.map(() => ChipKind.HERO),
    );
  });

  it("names the group, so the chips are reachable together", () => {
    renderApp();

    ask("show me player injuries");

    expect(
      fallbackPanel()!.querySelector('[data-slot="suggestion-chips"]'),
    ).toHaveAttribute("aria-label", CHIP_ROW_LABEL);
  });

  it("gives the screen a next step that WORKS", () => {
    // The whole point of criterion 2's third clause: the way out is one tap
    // away, and the tap resolves through the chip path.
    renderApp();

    ask("show me player injuries");
    fireEvent.click(panelChips()[1]!);
    landBeat();

    expect(sections()).toHaveLength(1);
    expect(sections()[0]).toHaveAttribute("data-hero-id", HeroId.HERO_2);
    expect(fallbackPanel()).toBeNull();
  });
});

/* ========================= NEVER AN ERROR, NEVER BLAME (CRITERION 2) == */

describe("never an error, never blame (criterion 2)", () => {
  /**
   * The vocabulary that must not appear. Each one either states a failure or
   * puts it on the person who typed the question, and the tone this panel
   * exists to hold is capable and forward-looking.
   */
  const BLAME = [
    "sorry",
    "error",
    "invalid",
    "understand",
    "unfortunately",
    "failed",
    "fail",
    "unable",
    "wrong",
    "oops",
    "not found",
    "no results",
    "cannot",
    "can't",
    "unsupported",
    "unrecognised",
    "unrecognized",
    "try again",
  ];

  it.each(BLAME)("keeps %j out of the copy", (word) => {
    for (const copy of [
      FALLBACK_MESSAGE,
      EMPTY_STATE_HEADING,
      EMPTY_STATE_SUBTEXT,
    ]) {
      expect(copy.toLowerCase()).not.toContain(word);
    }
  });

  it.each(BLAME)("keeps %j out of the rendered panel", (word) => {
    renderApp();

    ask("show me player injuries");

    expect(fallbackPanel()!.textContent!.toLowerCase()).not.toContain(word);
  });

  it("says the request is reasonable before it says anything else", () => {
    // The copy opens by accepting the question ("I can pull that together")
    // and frames the limit as a property of the PREVIEW, not of the question.
    expect(FALLBACK_MESSAGE.startsWith("I can pull that together.")).toBe(true);
    expect(FALLBACK_MESSAGE).toContain("For this preview");
    expect(FALLBACK_MESSAGE).toContain("I've prepared");
  });

  it("is announced politely, and is never an alert", () => {
    renderApp();

    ask("show me player injuries");

    expect(fallbackPanel()).toHaveAttribute("role", "status");
    expect(fallbackPanel()).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("status")).toHaveTextContent(FALLBACK_MESSAGE);
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.querySelector('[aria-live="assertive"]')).toBeNull();
    expect(document.querySelector("[aria-invalid]")).toBeNull();
    expect(document.querySelector("[aria-errormessage]")).toBeNull();
  });

  it("wears no error styling — the neutral panel surface, no red semantics", () => {
    // Red never means "bad" in this product (colour discipline rule 3), so the
    // fallback does not reach for it at all: it is the same white panel with a
    // hairline border the thinking panel uses.
    expect(FALLBACK_PANEL_CLASS).toContain("bg-bg");
    expect(FALLBACK_PANEL_CLASS).toContain("border-border");
    expect(FALLBACK_PANEL_CLASS).not.toMatch(/\bred\b|\bneg\b|variance/);
    expect(FALLBACK_CODE).not.toMatch(
      /\bred\b|\bneg\b|variance|destructive|warning/,
    );
  });

  it("carries none of that vocabulary in its own source either", () => {
    // A comment or a prop name that talks about failure is how the tone slips
    // back in on the next change.
    for (const word of ["sorry", "invalid", "unfortunately", "oops"]) {
      expect(FALLBACK_CODE.toLowerCase()).not.toContain(word);
      expect(EMPTY_CODE.toLowerCase()).not.toContain(word);
    }
  });

  it("leaves the field open for the next question", () => {
    renderApp();

    ask("show me player injuries");

    expect(promptInput()).toBeEnabled();
    expect(promptInput()).toHaveValue("");
    expect(rowChips()).toHaveLength(3);
  });
});

/* ================================ THE QUESTION IS NEVER ECHOED BACK == */

describe("the typed question is never echoed back (criterion 2, A03)", () => {
  it("does not quote the question in the panel", () => {
    renderApp();

    ask("zebra nonsense phrase");

    expect(fallbackPanel()).not.toBeNull();
    expect(fallbackPanel()!.textContent).not.toContain("zebra");
    expect(document.body.textContent).not.toContain("zebra");
  });

  it("turns a script payload into no markup at all", () => {
    renderApp();

    ask('<img src=x onerror="alert(1)">');

    expect(fallbackPanel()).not.toBeNull();
    expect(document.querySelector("img[src='x']")).toBeNull();
    expect(fallbackPanel()!.querySelector("img")).toBeNull();
    expect(fallbackPanel()!.innerHTML).not.toContain("onerror");
    expect(fallbackPanel()!.innerHTML).not.toContain("&lt;img");
  });

  it("has nowhere to put it: the panel takes no question", () => {
    // Structural, not a promise: the props are the chip callback and a class
    // name, and there is no `dangerouslySetInnerHTML` or `innerHTML` anywhere.
    const props =
      /interface FallbackPanelProps \{([\s\S]*?)\n\}/.exec(
        FALLBACK_CODE,
      )?.[1] ?? "";

    expect(props).toMatch(/onSelect/);
    expect(props.replace(/\s/g, "")).toBe(
      "onSelect:(chip:SuggestionChip)=>void;className?:string;",
    );
    for (const source of [FALLBACK_CODE, EMPTY_CODE, HOOK_CODE]) {
      expect(source).not.toMatch(/dangerouslySetInnerHTML|innerHTML/);
    }
  });

  it("keeps the matcher's string out of the panel's state", () => {
    // The hook records the RESULT of matching (a match or `null`), never the
    // text that produced it.
    expect(HOOK_CODE).not.toMatch(/string/);
    expect(HOOK_CODE).toMatch(/IntentMatch \| null/);
  });
});

/* ========================================= THE EMPTY STATE (④) ======== */

describe("the empty state before any question (criterion 4)", () => {
  it("is on the canvas on load, and the fallback is not", () => {
    renderApp();

    expect(emptyPanel()).not.toBeNull();
    expect(fallbackPanel()).toBeNull();
    expect(thinkingPanel()).toBeNull();
  });

  it("shows the heading and the one-line subtext", () => {
    renderApp();

    expect(
      document.querySelector('[data-slot="empty-state-heading"]'),
    ).toHaveTextContent(EMPTY_STATE_HEADING);
    expect(
      document.querySelector('[data-slot="empty-state-subtext"]'),
    ).toHaveTextContent(EMPTY_STATE_SUBTEXT);
    expect(EMPTY_STATE_SUBTEXT.split(". ")).toHaveLength(1);
  });

  it("washes the panel in the club red at 4.5%, DERIVED from the token", () => {
    // `rgba(211,1,12,0.045)` is `--color-red` at 4.5% alpha. The literal is
    // nowhere in the code: Tailwind's alpha modifier resolves `bg-red/4.5` to
    // `color-mix(in oklab, var(--color-red) 4.5%, transparent)`.
    const alpha = /bg-red\/([\d.]+)\b/.exec(EMPTY_STATE_PANEL_CLASS)?.[1];

    expect(alpha).toBeDefined();
    expect(Number(alpha) / 100).toBeCloseTo(0.045, 5);
    expect(color.red).toBe("#D3010C");
    expect(EMPTY_CODE).not.toMatch(/rgba?\(/);
    expect(EMPTY_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("draws a matching hairline border from the same red", () => {
    expect(EMPTY_STATE_PANEL_CLASS).toMatch(/\bborder\b/);
    expect(EMPTY_STATE_PANEL_CLASS).toMatch(/\bborder-red\/\d/);
    expect(EMPTY_STATE_PANEL_CLASS).not.toContain("border-border");
  });

  it("sets a bold navy heading above a lighter subtext", () => {
    renderApp();

    const heading = document.querySelector(
      '[data-slot="empty-state-heading"]',
    )!;
    const subtext = document.querySelector(
      '[data-slot="empty-state-subtext"]',
    )!;

    expect(heading.className).toContain("font-bold");
    expect(heading.className).toContain("text-navy");
    expect(heading.className).toContain("text-kpi");
    expect(subtext.className).toContain("text-caption");
    expect(subtext.className).toContain("text-muted");
    // "Larger", asserted on the token values rather than on the class names.
    expect(Number.parseInt(fontSize.kpi, 10)).toBeGreaterThan(
      Number.parseInt(fontSize.caption, 10),
    );
    expect(color.muted).not.toBe(color.navy);
  });

  it("carries a red GRADIENT icon badge, decorative", () => {
    renderApp();

    const badge = document.querySelector('[data-slot="empty-state-badge"]')!;

    expect(badge.className).toBe(EMPTY_STATE_BADGE_CLASS);
    expect(EMPTY_STATE_BADGE_CLASS).toContain("bg-gradient-to-br");
    expect(EMPTY_STATE_BADGE_CLASS).toContain("from-red");
    expect(EMPTY_STATE_BADGE_CLASS).toContain("to-red-vivid");
    expect(EMPTY_STATE_BADGE_CLASS).toContain("rounded-badge");
    expect(badge).toHaveAttribute("aria-hidden", "true");
    expect(badge.querySelector("svg")).not.toBeNull();
  });

  it("is a labelled region named by its heading", () => {
    renderApp();

    const panel = emptyPanel()!;
    const heading = screen.getByRole("heading", { name: EMPTY_STATE_HEADING });

    expect(panel.tagName).toBe("SECTION");
    expect(heading.tagName).toBe("H2");
    expect(panel.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("is the resting state, so it announces nothing", () => {
    // Present on load: there is no change to announce, and a live region that
    // ships with content risks being read twice. The panel that DOES announce
    // itself politely is the fallback.
    renderApp();

    expect(emptyPanel()).not.toHaveAttribute("aria-live");
    expect(emptyPanel()).not.toHaveAttribute("role");
  });

  it("offers no chips of its own — the row above the field is the way in", () => {
    renderApp();

    expect(chipButtons(emptyPanel()!)).toHaveLength(0);
    expect(rowChips()).toHaveLength(3);
    expect(EMPTY_CODE).not.toMatch(/<button|SuggestionChips/);
  });

  it("spans the canvas grid rather than starting a layout of its own", () => {
    expect(EMPTY_STATE_PANEL_CLASS).toContain("col-span-full");
    expect(FALLBACK_PANEL_CLASS).toContain("col-span-full");
  });

  it("goes the moment the first answer arrives", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
    landBeat();

    expect(emptyPanel()).toBeNull();
    expect(sections()).toHaveLength(1);
  });
});

/* ============================================ MUTUALLY EXCLUSIVE ====== */

describe("canvasPanelFor decides which panel, and there is only one", () => {
  const ANSWERED = withHeroShown(NO_SECTIONS, HeroId.HERO_1);

  /** thinking, missed, session list, the ONE panel that may be on screen. */
  const CASES: [boolean, boolean, InsightSections, CanvasPanel][] = [
    [true, true, ANSWERED, CanvasPanel.THINKING],
    [true, false, BASELINE_SECTIONS, CanvasPanel.THINKING],
    [true, true, BASELINE_SECTIONS, CanvasPanel.THINKING],
    [false, true, BASELINE_SECTIONS, CanvasPanel.FALLBACK],
    [false, true, ANSWERED, CanvasPanel.FALLBACK],
    [false, false, BASELINE_SECTIONS, CanvasPanel.EMPTY],
    [false, false, ANSWERED, CanvasPanel.NONE],
  ];

  it.each(CASES)(
    "thinking=%s missed=%s over %j resolves to %s",
    (thinking, missed, list, expected) => {
      expect(canvasPanelFor(thinking, missed, list)).toBe(expected);
    },
  );

  it("returns ONE value, so two panels cannot both be derived", () => {
    for (const thinking of [true, false]) {
      for (const missed of [true, false]) {
        for (const list of [
          BASELINE_SECTIONS,
          ANSWERED,
          withFollowUpShown(ANSWERED, HeroId.HERO_1),
        ]) {
          const panel = canvasPanelFor(thinking, missed, list);
          expect(Object.values(CanvasPanel)).toContain(panel);
        }
      }
    }
  });

  it("reads the baseline through isBaseline, not a length check", () => {
    expect(HOOK_CODE).toContain("isBaseline(sections)");
    expect(HOOK_CODE).not.toMatch(/sections\.length/);
  });

  /** Each state of the canvas, and the ONE panel that may be on it. */
  const STATES: [string, () => void, string[]][] = [
    ["on load", () => {}, ["empty"]],
    ["during a beat", () => tap(HERO_CHIP_LABEL[HeroId.HERO_1]), ["thinking"]],
    ["after a no-match", () => ask("show me player injuries"), ["fallback"]],
    [
      "with an answer on screen",
      () => {
        tap(HERO_CHIP_LABEL[HeroId.HERO_1]);
        landBeat();
      },
      [],
    ],
  ];

  it.each(STATES)("shows exactly one panel %s", (_state, reach, expected) => {
    renderApp();

    reach();

    expect(panelsOnScreen()).toEqual(expected);
  });

  it("replaces the fallback with the beat when a chip is tapped from it", () => {
    renderApp();

    ask("show me player injuries");
    expect(panelsOnScreen()).toEqual(["fallback"]);

    fireEvent.click(panelChips()[0]!);

    expect(panelsOnScreen()).toEqual(["thinking"]);
  });
});

/* ================================================ RESET, AND DERIVATION == */

describe("Reset returns the canvas to the empty state", () => {
  it("clears the fallback raised on a baseline dashboard", () => {
    // The case the section list alone cannot detect: `withBaselineRestored`
    // hands back the very list it was given when there is nothing to clear, so
    // this is what `generation` is read for.
    renderApp();

    ask("show me player injuries");
    tap("Reset");

    expect(fallbackPanel()).toBeNull();
    expect(emptyPanel()).not.toBeNull();
  });

  it("clears a fallback that was raised over answers", () => {
    renderApp();

    tap(HERO_CHIP_LABEL[HeroId.HERO_2]);
    landBeat();
    ask("show me player injuries");
    tap("Reset");

    expect(sections()).toHaveLength(0);
    expect(panelsOnScreen()).toEqual(["empty"]);
  });

  it("leaves the screen able to ask again immediately after the clear", () => {
    renderApp();

    ask("show me player injuries");
    tap("Reset");
    tap(HERO_CHIP_LABEL[HeroId.HERO_3]);
    landBeat();

    expect(sections()).toHaveLength(1);
    expect(sections()[0]).toHaveAttribute("data-hero-id", HeroId.HERO_3);
    expect(panelsOnScreen()).toEqual([]);
  });

  it("keys the fallback off the session, so an answer drops it with no clearing code", () => {
    // Derived, not cleared: the hook holds the section list the miss was asked
    // against, and any answer produces a new list.
    expect(HOOK_CODE).toMatch(/missedFor === sections/);
    expect(ROOT_CODE).not.toMatch(/clearFallback|setMissed|useState/);
  });

  it("keeps standing while the canvas has not moved on", () => {
    renderApp();

    ask("show me player injuries");
    ask("what about the weather");

    expect(panelsOnScreen()).toEqual(["fallback"]);
    expect(
      document.querySelectorAll('[data-slot="fallback-panel"]'),
    ).toHaveLength(1);
  });

  it("goes when a later typed question DOES resolve", () => {
    renderApp();

    ask("show me player injuries");
    ask("shirt sales by kit");
    landBeat();

    expect(fallbackPanel()).toBeNull();
    expect(sections()).toHaveLength(1);
    expect(sections()[0]).toHaveAttribute("data-phase", InsightPhase.PRIMARY);
  });
});

/* ===================================================== THE WIRING ====== */

describe("app/root.tsx wiring", () => {
  it("hands the matcher's own return value to the panel state", () => {
    expect(ROOT_SOURCE).toMatch(
      /canvas\.record\(askQuestion\(question, actions\)\)/,
    );
    expect(ROOT_SOURCE).toMatch(
      /const canvas = useCanvasPanel\(dashboard, beat !== null\);/,
    );
  });

  it("keeps the chip path out of the matcher, in the panel too", () => {
    // Two rows of chips now, and both resolve the same way: a chip carries the
    // hero it means, so neither can reach US-030's scoring.
    expect([
      ...ROOT_SOURCE.matchAll(/selectChip\(chip, actions\)/g),
    ]).toHaveLength(2);
  });

  it("renders both panels as grid items on the canvas, after the sections", () => {
    expect(ROOT_SOURCE.indexOf("<InsightSections")).toBeLessThan(
      ROOT_SOURCE.indexOf("<FallbackPanel"),
    );
    expect(ROOT_SOURCE.indexOf("<FallbackPanel")).toBeLessThan(
      ROOT_SOURCE.indexOf("<EmptyStatePanel"),
    );
  });
});

/* ============================================ DISCIPLINE, AND MOTION == */

describe("tokens, motion and dependencies", () => {
  it("uses tokens only — no hex, no rgba, no arbitrary value", () => {
    for (const source of [FALLBACK_CODE, EMPTY_CODE]) {
      expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(source).not.toMatch(/rgba?\(/);
      expect(source).not.toMatch(
        /(?:text|bg|rounded|shadow|border|from|to)-\[/,
      );
    }
  });

  it("defines no keyframe and adds none to the stylesheet", () => {
    for (const source of [FALLBACK_CODE, EMPTY_CODE]) {
      expect(source).not.toMatch(/@keyframes|animation:/);
    }
    expect(APP_CSS.match(/@keyframes/g)).toHaveLength(4);
  });

  it("reuses US-006's entrance for the fallback, and none for the invitation", () => {
    renderApp();

    expect(emptyPanel()).not.toHaveClass(MOTION_CLASS.enter);

    ask("show me player injuries");

    expect(fallbackPanel()).toHaveClass(MOTION_CLASS.enter);
  });

  it("creates no timer and makes no request", () => {
    for (const source of [FALLBACK_CODE, EMPTY_CODE, HOOK_CODE]) {
      expect(source).not.toMatch(/setTimeout|setInterval|clearTimeout/);
      expect(source).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|axios/);
    }
  });

  it("adds no dependency — lucide and the app's own modules only", () => {
    const imports = [
      ...`${FALLBACK_CODE}\n${EMPTY_CODE}\n${HOOK_CODE}`.matchAll(
        /from "([^"]+)"/g,
      ),
    ].map(([, specifier]) => specifier);

    for (const specifier of imports) {
      expect(specifier).toMatch(/^(?:\.|react$|lucide-react$)/);
    }
  });
});

/* ================================================ THE PANELS ALONE ===== */

describe("FallbackPanel in isolation", () => {
  it("hands the tapped chip back, not its label", () => {
    const onSelect = vi.fn();
    render(<FallbackPanel onSelect={onSelect} />);

    fireEvent.click(chipButtons()[0]!);

    expect(onSelect).toHaveBeenCalledWith(HERO_CHIPS[0]);
    expect(typeof onSelect.mock.calls[0]![0]).not.toBe("string");
  });

  it("merges a caller's class without losing the panel surface", () => {
    render(<FallbackPanel onSelect={vi.fn()} className="mt-6" />);

    expect(fallbackPanel()).toHaveClass("mt-6");
    expect(fallbackPanel()).toHaveClass("rounded-panel");
  });

  it("marks its glyph decorative", () => {
    render(<FallbackPanel onSelect={vi.fn()} />);

    expect(
      document.querySelector('[data-slot="fallback-glyph"]'),
    ).toHaveAttribute("aria-hidden", "true");
  });

  it("brings itself into view as it mounts", () => {
    // The canvas grows downwards: by the third question the panel would appear
    // below the fold, and a presenter would see nothing happen at all.
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    render(<FallbackPanel onSelect={vi.fn()} />);

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });
});

describe("EmptyStatePanel in isolation", () => {
  it("renders the heading, the subtext and the badge", () => {
    render(<EmptyStatePanel />);

    expect(
      screen.getByRole("heading", { name: EMPTY_STATE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByText(EMPTY_STATE_SUBTEXT)).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="empty-state-badge"]'),
    ).not.toBeNull();
  });

  it("does not scroll the page on mount", () => {
    // It is present on load; scrolling to it would move the viewport away from
    // the dashboard the presenter is looking at.
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    render(<EmptyStatePanel />);

    expect(scrollIntoView).not.toHaveBeenCalled();
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("merges a caller's class without losing the branded surface", () => {
    render(<EmptyStatePanel className="mt-6" />);

    expect(emptyPanel()).toHaveClass("mt-6");
    expect(emptyPanel()).toHaveClass("rounded-panel");
  });
});
