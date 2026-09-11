import { expect, type Browser, type Page } from "@playwright/test";

/**
 * The dress-rehearsal instrument for US-045.
 *
 * WHY A SIXTH HARNESS EXISTS AT ALL. US-040 to US-044 each measured ONE
 * property of the product in isolation — a geometry, a request log, a path, a
 * palette, a frame. Every one of those cases opens the app, does its one thing
 * and closes it again. A rehearsal is the opposite claim: that the whole
 * run-of-show holds together as ONE CONTINUOUS SESSION, in the order a presenter
 * will actually perform it, with the clock running between the beats. Nothing in
 * the existing sixty cases says anything about that, because none of them ever
 * stays in one session long enough to.
 *
 * THREE THINGS THIS FILE ADDS, AND NOTHING ELSE:
 *
 *   {@link timedBeat}         drives one beat of the show and TIMES it — press
 *                             to panel, press to answer, answer to at rest — so
 *                             the rehearsal produces a schedule rather than a
 *                             pass mark.
 *   {@link startStabilityWatch} records, on every animation frame, the four
 *                             facts that "no broken state, no duplicate tiles,
 *                             no overlapping animations" actually decomposes
 *                             into. See below.
 *   {@link measureColdStart}  opens the app in a browser context that has never
 *                             seen it, and reports first paint, first
 *                             contentful paint and the moment the page first
 *                             ANSWERS A PRESS.
 *
 * WHAT "NO OVERLAPPING ANIMATIONS" MEANS AS A MEASUREMENT. It is easy to assert
 * and hard to define, so it is defined once, here, as four per-frame facts:
 *
 *   1. NO DUPLICATE SECTION. Two `insight-section` elements carrying the same
 *      `data-hero-id` is the duplicate-tile failure in its purest form — the
 *      canvas showing one hero twice.
 *   2. NO DUPLICATE `view-transition-name`. `hero-section.tsx` names each
 *      section `fcb-tile-<heroId>` so the browser can pair it across a reflow.
 *      Two live elements sharing a name make the browser SKIP the whole
 *      transition, which is a silent downgrade of the reveal rather than a
 *      visible error — invisible to every other suite.
 *   3. NO TILE TWEENED TWICE IN ONE FRAME. A `::view-transition-group(NAME)`
 *      appearing twice in one frame's `getAnimations()` is literally two
 *      animations moving one tile.
 *   4. NEVER TWO TRANSIENT PANELS. The empty state, the fallback and the
 *      thinking panel occupy the same slot on the canvas
 *      (`app/lib/dashboard/use-canvas-panel.ts`); two at once is the overlap a
 *      presenter would actually see.
 *
 * And one fact about the END of the sample: {@link StabilityWatch.restRunning}
 * counts animations still running once the canvas has settled, EXCLUDING the
 * infinite ones. The sidebar status dot and the AI orbs pulse forever by design
 * (`MOTION_CLASS.glow`), so an unfiltered count would never be zero and would
 * therefore never mean anything. A FINITE animation still running long after
 * the last press is an orphan — the thing US-015's criterion calls "no orphaned
 * animation".
 */

/* ---------------------------------------------------------- THE SCHEDULE -- */

/** One beat of the run-of-show, with the clock on it. */
export interface Beat {
  /** What the presenter did, in the words the checklist uses. */
  readonly label: string;
  /** Press to the thinking panel appearing, or `null` where no beat runs. */
  readonly toPanelMs: number | null;
  /** Press to the answer being on screen. */
  readonly toAnswerMs: number;
  /** Answer on screen to the viewport at rest. */
  readonly toRestMs: number;
  /** Press to at rest — what the room experiences. */
  readonly totalMs: number;
  /** Sections on the canvas once it settled. */
  readonly sections: number;
}

/** What "the answer has landed" means for one beat. Unset fields are ignored. */
export interface BeatTarget {
  readonly sections?: number;
  readonly followUps?: number;
  readonly fallback?: number;
  readonly emptyState?: number;
}

/**
 * The beat clock — every timestamp in {@link Beat} is taken INSIDE THE PAGE.
 *
 * This is not fussiness. The obvious instrument is a `Date.now()` either side of
 * the Playwright call, and it was tried: it reported the thinking panel taking
 * 785ms to appear on a follow-up chip. It does not. What that number contained
 * was Playwright resolving the locator, scrolling the chip into view and
 * waiting for it to be stable — the driver's cost, attributed to the product.
 * A capture-phase listener stamps the moment the press actually reaches the
 * document, an animation-frame loop records the screen after it, and the
 * schedule below is therefore the room's experience rather than the harness's.
 */
const BEAT_GLOBAL = "__fcbBeat";

async function startBeatClock(page: Page): Promise<void> {
  await page.evaluate((global) => {
    const state = {
      inputAt: null as number | null,
      frames: [] as {
        t: number;
        panel: boolean;
        sections: number;
        followUps: number;
        fallback: number;
        emptyState: number;
        scrollY: number;
      }[],
      stopped: false,
    };
    (window as unknown as Record<string, unknown>)[global] = state;

    // The press itself: whichever of the three ways a question can be submitted
    // happens first. Capture phase, so nothing downstream can swallow it. The
    // listeners come off again as soon as the press is stamped — a beat clock
    // that left three listeners on the document per beat would be adding
    // handlers to the page it is measuring.
    const types = ["click", "keydown", "submit"];
    const stamp = () => {
      if (state.inputAt !== null) return;
      state.inputAt = performance.now();
      for (const type of types) {
        document.removeEventListener(type, stamp, { capture: true });
      }
    };
    for (const type of types) {
      document.addEventListener(type, stamp, { capture: true });
    }

    const tick = () => {
      state.frames.push({
        t: performance.now(),
        panel: document.querySelector('[data-slot="thinking-panel"]') !== null,
        sections: document.querySelectorAll('[data-slot="insight-section"]')
          .length,
        followUps: document.querySelectorAll('[data-slot="follow-up-divider"]')
          .length,
        fallback: document.querySelectorAll('[data-slot="fallback-panel"]')
          .length,
        emptyState: document.querySelectorAll('[data-slot="empty-state-panel"]')
          .length,
        scrollY: Math.round(window.scrollY),
      });
      if (!state.stopped) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, BEAT_GLOBAL);
}

async function stopBeatClock(
  page: Page,
  label: string,
  target: BeatTarget,
): Promise<Beat> {
  return page.evaluate(
    ({ global, label, target }) => {
      const state = (window as unknown as Record<string, unknown>)[global] as {
        inputAt: number | null;
        frames: {
          t: number;
          panel: boolean;
          sections: number;
          followUps: number;
          fallback: number;
          emptyState: number;
          scrollY: number;
        }[];
        stopped: boolean;
      };
      state.stopped = true;
      delete (window as unknown as Record<string, unknown>)[global];

      const input = state.inputAt ?? state.frames[0]?.t ?? 0;
      const after = state.frames.filter((frame) => frame.t >= input);
      const matches = (frame: (typeof after)[number]) =>
        (target.sections === undefined || frame.sections === target.sections) &&
        (target.followUps === undefined ||
          frame.followUps === target.followUps) &&
        (target.fallback === undefined || frame.fallback === target.fallback) &&
        (target.emptyState === undefined ||
          frame.emptyState === target.emptyState);

      const panel = after.find((frame) => frame.panel) ?? null;
      const answer = after.find(matches) ?? after.at(-1)!;
      // The last frame at which the viewport was still moving.
      const settledY = after.at(-1)!.scrollY;
      let restAt = answer.t;
      for (let i = after.length - 1; i >= 0; i -= 1) {
        if (after[i]!.scrollY !== settledY) {
          restAt = (after[i + 1] ?? after[i]!).t;
          break;
        }
      }

      const round = (value: number) => Math.round(value);
      return {
        label,
        toPanelMs: panel === null ? null : round(panel.t - input),
        toAnswerMs: round(answer.t - input),
        toRestMs: round(Math.max(restAt, answer.t) - answer.t),
        totalMs: round(Math.max(restAt, answer.t) - input),
        sections: after.at(-1)!.sections,
      };
    },
    { global: BEAT_GLOBAL, label, target },
  );
}

/**
 * Wait until the page has stopped scrolling, or `capMs` has passed.
 *
 * Two consecutive equal readings rather than a fixed sleep, so the settle is as
 * short as the scroll is and the timing reported is the product's rather than
 * this function's. (`support/timing.ts` has the same helper for US-043; it is
 * restated rather than imported so a change to the timing story's sampler
 * cannot silently retime the rehearsal.)
 */
export async function waitForRest(
  page: Page,
  capMs = 2_500,
  minMs = 0,
): Promise<number> {
  // THE FLOOR IS NOT PADDING. Both of this product's scrolls wait out the 400ms
  // reflow tween before they start (US-043), so a page asked "have you stopped
  // moving?" the instant an answer lands answers "yes" — it has not started.
  // Callers timing a beat pass a floor that covers the tween; callers who only
  // want the scroll already in flight to finish leave it at zero.
  if (minMs > 0) await page.waitForTimeout(minMs);

  const step = 50;
  let previous = await page.evaluate(() => window.scrollY);

  for (let waited = 0; waited < capMs; waited += step) {
    await page.waitForTimeout(step);
    const current = await page.evaluate(() => window.scrollY);
    if (current === previous) return current;
    previous = current;
  }

  return previous;
}

/**
 * `--duration-enter`, the reflow tween both scrolls wait out, with a frame or
 * two of slack. The floor {@link timedBeat} gives {@link waitForRest}.
 */
const REFLOW_TWEEN_MS = 500;

/**
 * Drive one beat of the show and time it.
 *
 * `press` is the presenter's action. `landed` is the assertion that the answer
 * is ON SCREEN — a counter, never a clock, so the timing cannot race the beat.
 * `expectsPanel` says whether a thinking beat is expected at all: an off-script
 * question resolves to no hero, so `askQuestion` never reaches `useThinking` and
 * the panel is correctly never shown (US-032).
 */
export async function timedBeat(
  page: Page,
  label: string,
  press: () => Promise<void>,
  landed: () => Promise<void>,
  target: BeatTarget,
): Promise<Beat> {
  await startBeatClock(page);
  await press();
  await landed();
  await waitForRest(page, 2_500, REFLOW_TWEEN_MS);
  return stopBeatClock(page, label, target);
}

/** The schedule as the block the run output prints. */
export function formatSchedule(beats: readonly Beat[]): string {
  const row = (beat: Beat) =>
    [
      `    ${beat.label.padEnd(38)}`,
      `panel ${(beat.toPanelMs === null ? "-" : `${beat.toPanelMs}ms`).padStart(7)}`,
      `answer ${`${beat.toAnswerMs}ms`.padStart(7)}`,
      `rest +${`${beat.toRestMs}ms`.padStart(6)}`,
      `total ${`${beat.totalMs}ms`.padStart(7)}`,
      `sections ${beat.sections}`,
    ].join("  ");

  const total = beats.reduce((sum, beat) => sum + beat.totalMs, 0);
  return [
    ...beats.map(row),
    `    ${"".padEnd(38)}${" ".repeat(45)}SHOW ${(total / 1000).toFixed(1)}s`,
  ].join("\n");
}

/* ------------------------------------------------------- SCROLL EXCURSION -- */

/** Where the viewport went between a press and coming to rest. */
export interface ScrollExcursion {
  /** `scrollY` on the frame the press landed. */
  readonly atPress: number;
  /** The furthest DOWN the page travelled after the press. */
  readonly peak: number;
  /** How much further down than it already was. This is the defect's shape. */
  readonly excursion: number;
  /** Where it came to rest. */
  readonly settled: number;
  /** How long it took to get there. */
  readonly settledMs: number;
}

/**
 * Watch the viewport across a press — the standing measurement for the defect
 * US-045 found in Reset.
 *
 * A SMOOTH SCROLL BELONGS TO THE SCROLLING BOX, NOT TO THE CODE THAT STARTED IT.
 * The reveal's `scrollIntoView` and Reset's `scrollTo` both drive the window,
 * and Reset's waits out a 400ms reflow tween before it runs (US-043) — so a
 * reveal scroll still travelling when Reset is pressed had 400ms of clear air in
 * which to drag the freshly cleared baseline down to its own foot. Nothing about
 * the settled screen shows it: the page arrives at the top either way, roughly
 * half a second later. Only the path between says whether the presenter saw the
 * empty dashboard dive to the bottom and climb back.
 */
export async function scrollExcursion(
  page: Page,
  press: () => Promise<void>,
  watchMs = 2_500,
): Promise<ScrollExcursion> {
  await armScrollWatch(page, watchMs, null);
  await press();
  await page.waitForTimeout(watchMs + 200);
  return readScrollWatch(page);
}

/**
 * The same measurement, with Reset pressed FROM INSIDE THE PAGE a fixed number
 * of milliseconds after the answer appears.
 *
 * WHY THE PRESS CANNOT COME FROM THE DRIVER. The window this case is about is
 * the 400ms reflow tween, and a Playwright `click()` costs a few hundred
 * milliseconds of locator resolution and actionability checks before it lands —
 * enough that every attempt to press "just as the answer arrives" from Node
 * actually pressed after the tween had ended, and measured a clean screen. An
 * in-page `MutationObserver` fires on the frame the section is inserted, so the
 * press lands where it is aimed. The click is a real one on the real control;
 * only its scheduling is in the page.
 */
export async function resetInsideTheTween(
  page: Page,
  offsetMs: number,
  ask: () => Promise<void>,
  watchMs = 2_500,
): Promise<ScrollExcursion> {
  await armScrollWatch(page, watchMs, offsetMs);
  await ask();
  await page.waitForTimeout(watchMs + 400);
  return readScrollWatch(page);
}

const SCROLL_GLOBAL = "__fcbScroll";

/**
 * Start recording `window.scrollY` per frame, stamping the press.
 *
 * `resetAfterMs` non-null schedules the Reset press itself, `offsetMs` after an
 * insight section first appears; `null` stamps whichever press the driver makes
 * next, through a capture-phase listener that removes itself once it has fired.
 */
async function armScrollWatch(
  page: Page,
  watchMs: number,
  resetAfterMs: number | null,
): Promise<void> {
  await page.evaluate(
    ({ global, watchMs, resetAfterMs, resetLabel }) => {
      const state = {
        pressedAt: null as number | null,
        frames: [] as [number, number][],
      };
      (window as unknown as Record<string, unknown>)[global] = state;

      if (resetAfterMs === null) {
        const types = ["click", "keydown", "submit"];
        const stamp = () => {
          if (state.pressedAt !== null) return;
          state.pressedAt = performance.now();
          for (const type of types) {
            document.removeEventListener(type, stamp, { capture: true });
          }
        };
        for (const type of types) {
          document.addEventListener(type, stamp, { capture: true });
        }
      } else {
        const observer = new MutationObserver(() => {
          if (
            state.pressedAt !== null ||
            !document.querySelector('[data-slot="insight-section"]')
          ) {
            return;
          }
          // Claimed before the timer runs, so a second mutation cannot schedule
          // a second press.
          state.pressedAt = -1;
          observer.disconnect();
          setTimeout(() => {
            state.pressedAt = performance.now();
            const reset = [...document.querySelectorAll("button")].find(
              (button) => (button.textContent ?? "").trim() === resetLabel,
            );
            reset?.click();
          }, resetAfterMs);
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }

      const t0 = performance.now();
      const tick = () => {
        state.frames.push([performance.now(), Math.round(window.scrollY)]);
        if (performance.now() - t0 < watchMs) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    {
      global: SCROLL_GLOBAL,
      watchMs,
      resetAfterMs,
      resetLabel: "Reset",
    },
  );
}

/** Reduce the recorded frames to the excursion either side of the press. */
function readScrollWatch(page: Page): Promise<ScrollExcursion> {
  return page.evaluate((global) => {
    const state = (window as unknown as Record<string, unknown>)[global] as {
      pressedAt: number | null;
      frames: [number, number][];
    };
    delete (window as unknown as Record<string, unknown>)[global];

    const pressed =
      state.pressedAt !== null && state.pressedAt > 0
        ? state.pressedAt
        : state.frames[0]![0];
    const after = state.frames.filter(([t]) => t >= pressed);
    const atPress = after[0]![1];
    const peak = Math.max(...after.map(([, y]) => y));
    const settled = after.at(-1)![1];

    let settledMs = 0;
    for (let i = after.length - 1; i >= 0; i -= 1) {
      if (after[i]![1] !== settled) {
        settledMs = Math.round((after[i + 1] ?? after[i]!)[0] - pressed);
        break;
      }
    }

    return { atPress, peak, excursion: peak - atPress, settled, settledMs };
  }, SCROLL_GLOBAL);
}

/* ------------------------------------------------------- THE STABILITY WATCH */

/** One frame of the canvas, seen through the four stability facts. */
export interface StabilityFrame {
  readonly t: number;
  /** `data-hero-id` per section, in DOM order. */
  readonly heroIds: readonly string[];
  /** `view-transition-name` per section, in DOM order. */
  readonly names: readonly string[];
  readonly cards: number;
  /** Empty state + fallback + thinking panel. Never more than one. */
  readonly panels: number;
  readonly thinking: boolean;
  /** `::view-transition-group(...)` animations running this frame. */
  readonly groups: readonly string[];
  /** Running animations that will end on their own. Infinite ones excluded. */
  readonly finiteRunning: number;
}

export interface StabilityWatch {
  readonly frames: readonly StabilityFrame[];
  /** Frames showing one hero twice — a duplicate tile. */
  readonly duplicateSections: readonly string[];
  /** Frames where two elements shared a `view-transition-name`. */
  readonly duplicateNames: readonly string[];
  /** Frames where one tile was being tweened by two animations. */
  readonly duplicateGroups: readonly string[];
  /** Frames showing two transient panels at once. */
  readonly overlappingPanels: readonly string[];
  /** How many times the thinking panel went up during the watch. */
  readonly beats: number;
  /** Finite animations still running on the last frame sampled. */
  readonly restRunning: number;
  /** The largest number of tiles seen in any frame. */
  readonly peakCards: number;
}

const WATCH_GLOBAL = "__fcbWatch";

/** Start the per-frame stability watch. Everything below runs in the page. */
export async function startStabilityWatch(page: Page): Promise<void> {
  await page.evaluate((global) => {
    const state = {
      frames: [] as unknown[],
      stopped: false,
      started: performance.now(),
    };
    (window as unknown as Record<string, unknown>)[global] = state;

    const sample = () => {
      const sections = [
        ...document.querySelectorAll('[data-slot="insight-section"]'),
      ];

      const groups: string[] = [];
      let finiteRunning = 0;
      for (const animation of document.getAnimations()) {
        if (animation.playState !== "running") continue;
        const effect = animation.effect as KeyframeEffect | null;
        const timing = effect?.getComputedTiming();
        // The ambient brand pulses (`MOTION_CLASS.glow`) iterate forever by
        // design, so only a FINITE animation can be an orphan.
        if (Number.isFinite(timing?.iterations ?? 1)) finiteRunning += 1;
        const pseudo = effect?.pseudoElement ?? null;
        if (pseudo?.startsWith("::view-transition-group")) groups.push(pseudo);
      }

      state.frames.push({
        t: Number((performance.now() - state.started).toFixed(1)),
        heroIds: sections.map(
          (section) => section.getAttribute("data-hero-id") ?? "?",
        ),
        names: sections.map(
          (section) => getComputedStyle(section).viewTransitionName || "(none)",
        ),
        cards: document.querySelectorAll('[data-slot="card"]').length,
        panels:
          document.querySelectorAll('[data-slot="empty-state-panel"]').length +
          document.querySelectorAll('[data-slot="fallback-panel"]').length +
          document.querySelectorAll('[data-slot="thinking-panel"]').length,
        thinking:
          document.querySelector('[data-slot="thinking-panel"]') !== null,
        groups,
        finiteRunning,
      });

      if (!state.stopped) requestAnimationFrame(sample);
    };

    requestAnimationFrame(sample);
  }, WATCH_GLOBAL);
}

/** Stop the watch and reduce the frames to the four facts plus the tail. */
export async function stopStabilityWatch(page: Page): Promise<StabilityWatch> {
  const frames = (await page.evaluate((global) => {
    const state = (window as unknown as Record<string, unknown>)[global] as {
      frames: unknown[];
      stopped: boolean;
    };
    state.stopped = true;
    delete (window as unknown as Record<string, unknown>)[global];
    return state.frames;
  }, WATCH_GLOBAL)) as StabilityFrame[];

  const repeated = (values: readonly string[]) =>
    new Set(values).size !== values.length;

  const duplicateSections: string[] = [];
  const duplicateNames: string[] = [];
  const duplicateGroups: string[] = [];
  const overlappingPanels: string[] = [];
  let beats = 0;
  let peakCards = 0;

  frames.forEach((frame, index) => {
    if (repeated(frame.heroIds)) {
      duplicateSections.push(`${frame.t}ms: ${frame.heroIds.join(", ")}`);
    }
    // "(none)" is the value of an element the browser is not naming, which is
    // every section under reduced motion; only a real name can collide.
    const named = frame.names.filter((name) => name !== "(none)");
    if (repeated(named)) {
      duplicateNames.push(`${frame.t}ms: ${named.join(", ")}`);
    }
    if (repeated(frame.groups)) {
      duplicateGroups.push(`${frame.t}ms: ${frame.groups.join(", ")}`);
    }
    if (frame.panels > 1) {
      overlappingPanels.push(`${frame.t}ms: ${frame.panels} panels`);
    }
    if (frame.thinking && !(frames[index - 1]?.thinking ?? false)) beats += 1;
    peakCards = Math.max(peakCards, frame.cards);
  });

  return {
    frames,
    duplicateSections,
    duplicateNames,
    duplicateGroups,
    overlappingPanels,
    beats,
    restRunning: frames.at(-1)?.finiteRunning ?? 0,
    peakCards,
  };
}

/**
 * Assert the four facts. One helper so every abuse case means the same thing by
 * "left no broken state", exactly as US-042's `expectAlive` does for dead ends.
 */
export function expectStable(watch: StabilityWatch, at: string): void {
  expect(
    watch.duplicateSections.slice(0, 5),
    `${at}: the same hero rendered twice`,
  ).toEqual([]);
  expect(
    watch.duplicateNames.slice(0, 5),
    `${at}: two elements shared a view-transition-name`,
  ).toEqual([]);
  expect(
    watch.duplicateGroups.slice(0, 5),
    `${at}: one tile was tweened by two animations at once`,
  ).toEqual([]);
  expect(
    watch.overlappingPanels.slice(0, 5),
    `${at}: two transient panels were on the canvas at once`,
  ).toEqual([]);
  expect(
    watch.restRunning,
    `${at}: a finite animation was still running once the canvas had settled`,
  ).toBe(0);
}

/* ------------------------------------------------------------ COLD START -- */

/** What a browser that has never seen this app takes to become useful. */
export interface ColdStart {
  /** `first-paint`, from the page's own paint timeline. */
  readonly firstPaintMs: number | null;
  /** `first-contentful-paint` — the first pixels of the shell. */
  readonly firstContentfulPaintMs: number | null;
  readonly domInteractiveMs: number;
  readonly domContentLoadedMs: number;
  readonly loadMs: number;
  /**
   * Navigation start to the moment a PRESS IS ANSWERED — the honest
   * time-to-interactive for this product, because a server-rendered page paints
   * long before React has hydrated and a chip tapped before hydration does
   * nothing at all. Measured by pressing until the app responds.
   */
  readonly interactiveMs: number;
  /** Bytes the browser had to fetch, and how many requests. */
  readonly requests: number;
  readonly transferredBytes: number;
}

/**
 * Open the app in a context that has never seen it, and time it.
 *
 * A NEW CONTEXT IS THE COLD START. Playwright gives every context its own
 * profile directory, so its HTTP cache, its storage and its service workers are
 * empty — the same state as a demo machine opening the URL for the first time.
 * `chip` is pressed in a retry loop rather than once, because the press that
 * lands before hydration is a no-op and the interesting number is when one
 * STOPS being a no-op.
 */
export async function measureColdStart(
  browser: Browser,
  url: string,
  chip: string,
  viewport: { width: number; height: number },
): Promise<{ cold: ColdStart; consoleErrors: readonly string[] }> {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(url, { waitUntil: "load" });

  // Press until the press is answered. The thinking panel is the app's first
  // reply to any input, so its appearance is the moment hydration has taken.
  await expect(async () => {
    await page
      .getByRole("button", { name: chip })
      .first()
      .click({ timeout: 2_000 });
    await expect(page.locator('[data-slot="thinking-panel"]')).toBeVisible({
      timeout: 300,
    });
  }).toPass({ timeout: 20_000 });

  const cold = await page.evaluate(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    const paint = (name: string) => {
      const entry = performance
        .getEntriesByType("paint")
        .find((candidate) => candidate.name === name);
      return entry ? Number(entry.startTime.toFixed(1)) : null;
    };
    const resources = performance.getEntriesByType(
      "resource",
    ) as PerformanceResourceTiming[];

    return {
      firstPaintMs: paint("first-paint"),
      firstContentfulPaintMs: paint("first-contentful-paint"),
      domInteractiveMs: Number(nav.domInteractive.toFixed(1)),
      domContentLoadedMs: Number(nav.domContentLoadedEventEnd.toFixed(1)),
      loadMs: Number(nav.loadEventEnd.toFixed(1)),
      // `performance.now()` at this instant IS time since navigation start.
      interactiveMs: Number(performance.now().toFixed(1)),
      requests: resources.length + 1,
      transferredBytes:
        nav.transferSize +
        resources.reduce((sum, entry) => sum + entry.transferSize, 0),
    };
  });

  await context.close();
  return { cold, consoleErrors };
}

/** The cold start as the block the run output prints. */
export function formatColdStart(cold: ColdStart, label: string): string {
  const ms = (value: number | null) =>
    value === null ? "     -" : `${value.toFixed(0)}ms`.padStart(7);
  return [
    `  COLD START — ${label}`,
    `    first paint              ${ms(cold.firstPaintMs)}`,
    `    first contentful paint   ${ms(cold.firstContentfulPaintMs)}`,
    `    dom interactive          ${ms(cold.domInteractiveMs)}`,
    `    dom content loaded       ${ms(cold.domContentLoadedMs)}`,
    `    load event               ${ms(cold.loadMs)}`,
    `    ANSWERS A PRESS          ${ms(cold.interactiveMs)}`,
    `    requests / transferred   ${cold.requests} / ${(cold.transferredBytes / 1024).toFixed(1)} KiB`,
  ].join("\n");
}
