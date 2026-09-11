import { expect, type Page } from "@playwright/test";

import {
  FOLLOW_UP_CHIP,
  HERO_CHIP,
  PROMPT_INPUT_LABEL,
  RESET_LABEL,
  tapChip,
} from "./demo-script";

/**
 * The instrument for US-042's dead-end sweep.
 *
 * WHAT A "PATH" IS HERE, AND WHY IT IS WIDER THAN THE PROMPT BAR. US-041 found
 * two real runtime fetches that forty stories of code review had missed, and
 * the more dangerous one was fired by the SIDEBAR'S OWN "Dashboard" LINK — an
 * element nobody had ever exercised, which offline replaced the whole dashboard
 * with an error boundary from a single click. The lesson is that the
 * interactive surface is everything a presenter can click, type or press, not
 * just the chips and the field. So a path here is any of:
 *
 *   - the six chips, and a chip tapped twice or during another chip's beat;
 *   - a typed question — paraphrased, ambiguous, empty, or the most off-script
 *     string imaginable;
 *   - the Reset control, pressed repeatedly, mid-beat, and while scrolled;
 *   - the sidebar's Dashboard link and its three inert placeholders;
 *   - the app-bar chrome: crest, workspace label, connection status, avatar;
 *   - every element on the canvas that answers a press at all;
 *   - every keyboard-reachable stop, activated;
 *   - the browser itself: reload, back, forward.
 *
 * WHAT "DEAD-END-FREE" MEANS, AS THREE ASSERTIONS. {@link expectAlive} is the
 * whole definition in one place, because a sweep that checked a different
 * subset per path would prove nothing uniform:
 *
 *   (a) the screen CHANGED or is DELIBERATELY UNCHANGED — never silently
 *       broken. The shell is still mounted and the four baseline tiles are
 *       still there, so the frame the demo lives in survived the press.
 *   (b) there is always a NEXT STEP — the three prepared questions are derived
 *       from the session, so the chip row can never be empty
 *       (`app/lib/dashboard/chips.ts`), and there is content on the canvas.
 *   (c) NO error boundary, NO blank canvas, and (asserted by the spec through
 *       `./network.ts`) no console error. An error boundary is the worst
 *       outcome of the three; US-041 measured exactly one.
 *
 * IT DOES NOT RE-PROVE THE UNIT SUITES. US-030 pins the matcher over a
 * 90-phrase corpus, US-033 the two-step cold follow-up over all 27 session
 * shapes, US-032 the fallback copy. The value here is that these paths are
 * driven END TO END in real Chrome against the built SSR bundle, where an error
 * boundary, a lost hydration, a `pointer-events` mistake or a framework-level
 * navigation can exist at all — none of which jsdom can express.
 */

/* ------------------------------------------------------------- READING -- */

/** One reading of the whole screen, taken after a path was exercised. */
export interface CanvasReading {
  /** `HERO_1:primary` per answered question, in the order asked. */
  readonly sections: readonly string[];
  /** Every tile on screen. Four is the baseline; fewer means something went. */
  readonly cards: number;
  /** The invitation, present only at the baseline. */
  readonly emptyState: number;
  /** The graceful fallback (US-032). */
  readonly fallback: number;
  /** A beat in flight (US-031). */
  readonly thinking: number;
  /** `data-kind` per chip in the PROMPT BAR's row, not the fallback panel's. */
  readonly promptChips: readonly string[];
  /** The branded shell. Zero means an error boundary replaced the app. */
  readonly shell: number;
  /** React Router's default error page, by the copy it renders. */
  readonly errorBoundary: boolean;
  /** `scrollWidth - clientWidth` on the document. Must stay zero. */
  readonly horizontalOverflow: number;
  /** Rendered text length — a blank canvas is a short one. */
  readonly textLength: number;
  readonly scrollY: number;
}

/**
 * Take the reading. One `evaluate`, so every field describes the same moment.
 *
 * The error-boundary test is by COPY rather than by a slot, because the boundary
 * is React Router's own and carries none of this application's markup — which
 * is also why `shell` is the primary signal: the frame is simply not there.
 */
export function readCanvas(page: Page): Promise<CanvasReading> {
  return page.evaluate(() => {
    const text = document.body.textContent ?? "";
    return {
      sections: [
        ...document.querySelectorAll('[data-slot="insight-section"]'),
      ].map(
        (section) =>
          `${section.getAttribute("data-hero-id")}:${section.getAttribute("data-phase")}`,
      ),
      cards: document.querySelectorAll('[data-slot="card"]').length,
      emptyState: document.querySelectorAll('[data-slot="empty-state-panel"]')
        .length,
      fallback: document.querySelectorAll('[data-slot="fallback-panel"]')
        .length,
      thinking: document.querySelectorAll('[data-slot="thinking-panel"]')
        .length,
      promptChips: [
        ...document.querySelectorAll(
          '[data-slot="prompt-bar"] [data-slot="suggestion-chip"]',
        ),
      ].map((chip) => chip.getAttribute("data-kind") ?? "?"),
      shell: document.querySelectorAll('[data-slot="app-shell"]').length,
      errorBoundary: /Unexpected Application Error|Application Error!/i.test(
        text,
      ),
      horizontalOverflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      textLength: text.trim().length,
      scrollY: Math.round(window.scrollY),
    };
  });
}

/**
 * The four baseline tiles are rendered by the route, not by the session, so
 * they are on screen in EVERY reachable state (`app/routes/_index.tsx`). They
 * are therefore the floor a healthy screen never goes below.
 */
export const BASELINE_CARD_COUNT = 4;

/** The three prepared questions are always derived — never fewer. */
export const PREPARED_CHIP_COUNT = 3;

/**
 * Shortest plausible rendered text. The shell's own chrome (sidebar labels,
 * workspace, status, Reset) plus four tiles is an order of magnitude more than
 * this; an error boundary is a few dozen characters.
 */
const MIN_TEXT_LENGTH = 2_000;

/**
 * THE WHOLE DEFINITION OF DEAD-END-FREE, asserted in one place.
 *
 * Every path in the sweep ends here, so "this press was safe" means the same
 * three things everywhere and a new path cannot be added with a weaker check.
 */
export async function expectAlive(
  page: Page,
  at: string,
): Promise<CanvasReading> {
  const reading = await readCanvas(page);

  // (c) no error boundary, no blank canvas.
  expect(reading.errorBoundary, `${at}: an error boundary is on screen`).toBe(
    false,
  );
  expect(reading.shell, `${at}: the app shell is gone`).toBe(1);
  expect(
    reading.textLength,
    `${at}: the canvas is blank (${reading.textLength} chars)`,
  ).toBeGreaterThan(MIN_TEXT_LENGTH);

  // (a) the frame the demo lives in survived: the baseline is never taken away.
  expect(
    reading.cards,
    `${at}: fewer tiles than the baseline`,
  ).toBeGreaterThanOrEqual(BASELINE_CARD_COUNT);
  expect(reading.horizontalOverflow, `${at}: the page scrolls sideways`).toBe(
    0,
  );

  // (b) there is always a next step.
  expect(
    reading.promptChips.length,
    `${at}: the prepared questions are gone`,
  ).toBeGreaterThanOrEqual(PREPARED_CHIP_COUNT);

  // Two transient panels can never be on the canvas at once
  // (`app/lib/dashboard/use-canvas-panel.ts`).
  expect(
    reading.emptyState + reading.fallback + reading.thinking,
    `${at}: more than one transient panel`,
  ).toBeLessThanOrEqual(1);

  return reading;
}

/** The baseline, alive: four tiles, the invitation, exactly three chips. */
export async function expectBaselineAlive(
  page: Page,
  at: string,
): Promise<void> {
  const reading = await expectAlive(page, at);
  expect(reading.sections, `${at}: answers survived`).toEqual([]);
  expect(reading.cards, `${at}: baseline tiles`).toBe(BASELINE_CARD_COUNT);
  expect(reading.emptyState, `${at}: the invitation`).toBe(1);
  expect(reading.fallback, `${at}: the fallback lingered`).toBe(0);
  expect(reading.promptChips, `${at}: prepared chips`).toEqual([
    "hero",
    "hero",
    "hero",
  ]);
}

/* -------------------------------------------------------------- DRIVING -- */

/**
 * How long a beat plus its entrance is given to finish.
 *
 * Used only where the assertion cannot be a counter — activating an unknown
 * tab stop, say, where "nothing happened" is the expected outcome and there is
 * no count to wait for. Where an answer IS expected, the spec waits on the
 * section count instead.
 */
export const SETTLE_MS = 1_500;

/** Type a question and submit it, the way a presenter does. */
export async function askTyped(page: Page, question: string): Promise<void> {
  const field = page.getByLabel(PROMPT_INPUT_LABEL);
  await field.fill(question);
  await field.press("Enter");
}

/**
 * Put the interface back into English (US-049).
 *
 * WHY THE SWEEP NEEDS THIS. `sweepRing` activates EVERY tab stop, and two of
 * them are the language toggle's. From the moment it presses DE, every helper
 * in this file that finds a control by its English name — `pressReset`,
 * `tapChip`, `askTyped` — is looking for a word that is no longer on screen.
 * Restoring the language after each stop keeps the sweep measuring the product
 * rather than the toggle, and the toggle itself is still activated and still
 * asserted safe like any other stop.
 */
export async function restoreEnglish(page: Page): Promise<void> {
  const english = page.locator(
    '[data-slot="language-option"][data-locale="en"]',
  );

  if ((await english.getAttribute("data-selected")) === "true") return;

  await english.click();
  await page.waitForTimeout(150);
}

/** Press Reset and let the clear settle. */
export async function pressReset(page: Page): Promise<void> {
  await page.getByRole("button", { name: RESET_LABEL }).click();
  await page.waitForTimeout(300);
}

/** Reset, then ask one typed question and wait for the beat to land. */
export async function askFromBaseline(
  page: Page,
  question: string,
): Promise<CanvasReading> {
  await pressReset(page);
  await askTyped(page, question);
  await page.waitForTimeout(SETTLE_MS);
  return readCanvas(page);
}

/**
 * The tallest the canvas ever gets: all three heroes, all three follow-ups.
 *
 * Tapped in hero-then-follow-up order because a follow-up chip is only offered
 * once its parent is on screen — asked cold it is not offered at all, which is
 * itself one of the sweep's assertions.
 */
export async function buildFullCanvas(page: Page): Promise<void> {
  for (const chip of [
    HERO_CHIP.shirts,
    HERO_CHIP.tickets,
    HERO_CHIP.budgets,
    FOLLOW_UP_CHIP.shirts,
    FOLLOW_UP_CHIP.tickets,
    FOLLOW_UP_CHIP.budgets,
  ]) {
    await tapChip(page, chip);
    await page.waitForTimeout(SETTLE_MS);
  }
}

/* ------------------------------------------------------------- KEYBOARD -- */

/** One stop in the tab ring, as a keyboard-only presenter meets it. */
export interface TabStop {
  readonly tag: string;
  readonly slot: string | null;
  readonly name: string;
  /** `outlineStyle` while focused — `none` means no visible focus ring. */
  readonly outline: string;
}

/**
 * Put sequential focus navigation back to the start of the document.
 *
 * Necessary, and the reason this is not a bare `page.keyboard.press("Tab")`
 * loop: Tab resumes from whatever was focused last, so a ring walked after a
 * chip was clicked would begin in the middle of the page and silently miss
 * every stop above it. Focusing the root element with a temporary
 * `tabindex="-1"` is the one way to say "start from the top" that does not
 * itself add a stop.
 */
async function focusDocumentStart(page: Page): Promise<void> {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
    const root = document.documentElement;
    root.setAttribute("tabindex", "-1");
    root.focus();
    root.removeAttribute("tabindex");
  });
}

/**
 * Walk the whole tab ring from the top of the document.
 *
 * Terminates when focus returns to the first stop (the ring closed) or leaves
 * the page entirely (the browser's own chrome) — the latter being the proof
 * that there is NO FOCUS TRAP, which is the keyboard-only equivalent of a dead
 * end.
 */
export async function tabRing(page: Page, max = 200): Promise<TabStop[]> {
  await focusDocumentStart(page);

  const stops: TabStop[] = [];
  let firstMark: string | null = null;

  for (let step = 0; step < max; step += 1) {
    await page.keyboard.press("Tab");

    /**
     * A stop is identified by a MARK the walk stamps on the element itself,
     * because two stops can be indistinguishable by tag, slot and label — the
     * hero band and the Top Products card both offer a "This month" segment.
     * Every mark is removed again once the ring has been walked.
     */
    const stop = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) {
        return null;
      }
      let mark = el.getAttribute("data-tab-mark");
      if (mark === null) {
        mark = String(document.querySelectorAll("[data-tab-mark]").length + 1);
        el.setAttribute("data-tab-mark", mark);
      }
      return {
        mark,
        tag: el.tagName.toLowerCase(),
        slot: el.getAttribute("data-slot"),
        name: (el.getAttribute("aria-label") ?? el.textContent ?? "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 44),
        outline: getComputedStyle(el).outlineStyle,
      };
    });

    if (stop === null) break;
    if (firstMark === null) firstMark = stop.mark;
    else if (stop.mark === firstMark) break;
    stops.push({
      tag: stop.tag,
      slot: stop.slot,
      name: stop.name,
      outline: stop.outline,
    });
  }

  await page.evaluate(() => {
    for (const el of document.querySelectorAll("[data-tab-mark]")) {
      el.removeAttribute("data-tab-mark");
    }
  });

  return stops;
}

/** Move focus to the nth stop of the ring, counting from the document start. */
export async function focusTabStop(page: Page, index: number): Promise<string> {
  await focusDocumentStart(page);
  for (let step = 0; step <= index; step += 1) {
    await page.keyboard.press("Tab");
  }
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return "(nothing)";
    return `${el.tagName.toLowerCase()}[${el.getAttribute("data-slot")}] ${(
      el.getAttribute("aria-label") ??
      el.textContent ??
      ""
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 30)}`;
  });
}

/* ---------------------------------------------------- CLICK EVERYTHING -- */

/**
 * Fire a real DOM click on every distinct `data-slot` on the canvas.
 *
 * IN-PAGE ON PURPOSE, and this is the one place the sweep does not drive the
 * mouse. The canvas carries around 140 distinct slots, many of them SVG
 * `<defs>`, gradients and zero-size anchors that a real pointer can never
 * reach; asking Playwright to click each one would spend its whole budget
 * waiting for actionability on elements that are unclickable BY DESIGN. A
 * dispatched click still travels the same delegated React listener that a
 * hardware click ends at, so "pressing this element does nothing" is genuinely
 * tested — for every element, including the ones a mouse cannot land on.
 *
 * Pointer hit-testing — `pointer-events: none` on the inert nav rows — is a
 * different claim and is proved separately, with the real mouse.
 *
 * Returns the slots it clicked, so the spec can assert the sweep was not empty.
 */
export function clickEveryCanvasSlot(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const clicked: string[] = [];
    const slots = new Set<string>();
    for (const el of document.querySelectorAll(
      '[data-slot="canvas"] [data-slot]',
    )) {
      slots.add(el.getAttribute("data-slot")!);
    }
    for (const slot of slots) {
      const el = document.querySelector(
        `[data-slot="canvas"] [data-slot="${slot}"]`,
      );
      if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue;
      el.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
      clicked.push(slot);
    }
    return clicked;
  });
}

/* -------------------------------------------------------------- STORAGE -- */

/** Everything the page could have written, or leaked into an attribute. */
export interface StorageReading {
  readonly localKeys: readonly string[];
  readonly sessionKeys: readonly string[];
  readonly sessionValues: readonly string[];
  readonly cookie: string;
  /** Every `src` / `href` / `action` / `style` value in the document. */
  readonly urlish: readonly string[];
  /** Anything the page set on `window` that a payload could have created. */
  readonly injected: readonly string[];
}

/**
 * Read every sink a typed question could conceivably reach.
 *
 * The claim under test is the one `app/lib/dashboard/intents.ts` and
 * `app/components/chrome/prompt-bar.tsx` both document: the typed string is
 * read and discarded, and never becomes markup, a URL, a selector, a storage
 * key or a log line. Their unit suites prove it by scanning their own source;
 * this proves it on the SERVED page, after the strings have actually been
 * typed — which is the only way to catch a sink neither file owns.
 */
export function readStorage(page: Page): Promise<StorageReading> {
  return page.evaluate(() => {
    const read = (store: Storage) => {
      try {
        return Object.keys(store);
      } catch {
        return ["(blocked)"];
      }
    };
    const urlish: string[] = [];
    for (const el of document.querySelectorAll(
      "[src], [href], [action], [style]",
    )) {
      for (const attribute of ["src", "href", "action", "style"]) {
        const value = el.getAttribute(attribute);
        if (value) urlish.push(value);
      }
    }
    return {
      localKeys: read(localStorage),
      sessionKeys: read(sessionStorage),
      sessionValues: read(sessionStorage).map(
        (key) => sessionStorage.getItem(key) ?? "",
      ),
      cookie: document.cookie,
      urlish,
      injected: Object.keys(window).filter((key) => key.startsWith("__fcb")),
    };
  });
}

/* ------------------------------------------------------- THE INPUT SETS -- */

/**
 * PARAPHRASES — criterion 2, "several variations per hero".
 *
 * Chosen as questions a presenter would actually say rather than as keyword
 * bait: an inflection the keyword list does not carry (`jerseys`), a German
 * spelling (`trikot`), the season written with a slash (`25/26`, which the
 * matcher strips to `2526`), shouting, and a hyphenated fragment. Each must
 * resolve to ITS hero and to no other — US-030 proves the scoring, this proves
 * the section that actually renders in a browser.
 */
export const PARAPHRASES: Record<string, readonly string[]> = {
  HERO_1: [
    "how are shirt sales going",
    "kit sales split home away third",
    "SHIRT SALES!!!",
    "trikot verkauf",
    "which jersey sold best this season",
    "sponsor badges printed on the shirts",
    "top printed names on the back of the kit",
    "shirts?",
    "  KIT-SALES  ",
  ],
  HERO_2: [
    "ticket revenue this year vs last year",
    "matchday income compared to last season",
    "how is the gate doing",
    "compare 25/26 and 26/27 ticket sales",
    "are we selling fewer tickets",
    "what happened to matchday revenue",
    "ticket sales by fixture please",
  ],
  HERO_3: [
    "department budgets versus actuals",
    "which departments are over budget",
    "show me spend against target",
    "budget variance by department",
    "how are the departments performing on budget",
    "actuals vs budget",
    "departments over or under",
  ],
};

/**
 * THE MOST OFF-SCRIPT INPUT IMAGINABLE — criterion 3.
 *
 * Deliberately hostile as well as merely unmatched, because the fallback is the
 * one catch for BOTH and the same path has to hold: an XSS payload, a broken
 * attribute, a `javascript:` scheme, SQL, a template expression, a CSS
 * selector, a right-to-left override, combining marks, five scripts at once,
 * and fifty thousand characters. None may render as markup and all must land on
 * the same white panel with the same three prepared questions.
 */
export const OFF_SCRIPT_INPUTS: readonly string[] = [
  "what is the weather in basel",
  "what is the meaning of life, the universe and everything",
  '<img src=x onerror="window.__fcbPwned=1">',
  "<script>window.__fcbPwned2=1</script>",
  '"><svg/onload=alert(1)>',
  "javascript:alert(document.domain)",
  "'; DROP TABLE heroes; --",
  "${process.env.SECRET}",
  '[data-slot="card"]',
  "../../etc/passwd",
  "?!.,/()'\"...???",
  "aeaeaeaeae",
  "s̸h̷i̶r̴t̵",
  "‮kurat al-qadam‬",
  "🦆 qwertyuiop asdfghjkl zxcvbnm ni hao ᚠᚢᚦᚨᚱᚲ",
  "z".repeat(50_000),
];

/**
 * INPUTS THAT MUST DO NOTHING AT ALL — criterion 6.
 *
 * Not the fallback and not an answer: a submit that carries no question is a
 * no-op, so the panel that was on screen stays and the chips do not move
 * (`submit` in `app/components/chrome/prompt-bar.tsx`).
 */
export const NO_OP_INPUTS: readonly string[] = [
  "",
  " ",
  "     ",
  "\t\t",
  "\n\n\n",
  "  \t \n  ",
];

/**
 * TWO SUBJECTS IN ONE BREATH — criterion 5, tie-breaks.
 *
 * The property under test is not WHICH hero wins but that exactly ONE does,
 * and that it is the same one every time: `matchIntent` returns a single value
 * and resolves equal scores to the earlier intent, so the priority order in
 * `INTENTS` is the tie-break (US-030). The expectation is recorded here so a
 * change of order fails loudly rather than quietly reordering the demo.
 *
 * The last two are the interesting ones: both name a FOLLOW-UP subject with no
 * parent on screen, so the winning intent is a follow-up and the gate renders
 * its parent hero instead (US-033) — one hero, from a question about two.
 */
export const TIE_BREAKS: readonly { question: string; hero: string }[] = [
  { question: "shirt ticket budget", hero: "HERO_1" },
  { question: "shirts and tickets", hero: "HERO_1" },
  { question: "tickets and budgets", hero: "HERO_2" },
  {
    question: "shirt sales and ticket revenue and department budgets",
    hero: "HERO_3",
  },
  { question: "kit budget", hero: "HERO_1" },
  { question: "jersey matchday actuals", hero: "HERO_3" },
  { question: "badge fixtures marketing", hero: "HERO_2" },
  {
    question:
      "why is marketing over budget and which fixtures are driving the drop",
    hero: "HERO_2",
  },
];
