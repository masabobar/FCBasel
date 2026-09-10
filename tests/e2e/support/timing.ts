import { type Page } from "@playwright/test";

/**
 * The timing instrument for US-043 — per-frame sampling of the orchestrated
 * reveal.
 *
 * WHY A FRAME SAMPLER AND NOT AN ASSERTION ON THE FINAL SCREEN. Every criterion
 * in this story is about WHAT HAPPENS BETWEEN two states: whether a tile is
 * stranded at `opacity: 0` after its turn came, whether a figure restarts from
 * zero when a filter is pressed, whether the beats overlap, whether a frame took
 * 90ms. None of that survives to the settled screen — by the time the canvas is
 * at rest every one of those questions answers "fine". So the instrument runs a
 * `requestAnimationFrame` loop INSIDE the page and records the screen frame by
 * frame, exactly as US-013 sampled 54 KPI strings and 43 bar widths and US-016
 * sampled the ring and the line together.
 *
 * THREE INSTRUMENTS, DELIBERATELY SEPARATE:
 *
 *   {@link startFrameClock}  timestamps only — no DOM reads at all, so the
 *                            frame budget it reports is the application's and
 *                            not the sampler's.
 *   {@link startSampler}     the content sample: panel, sections, card
 *                            opacities, figure strings, chart geometry, scroll,
 *                            and the view-transition animations' own
 *                            `currentTime`.
 *   {@link throttleCpu}      CDP CPU throttling, so the same reveal can be
 *                            measured again as a slower laptop would run it.
 *
 * THE CLOCK AND THE SAMPLE ARE NEVER RUN TOGETHER. Reading a hundred boxes and
 * a hundred computed styles every frame costs milliseconds of its own, and a
 * frame budget measured through that lens would be the instrument's, not the
 * product's. Two passes over the same script, and each pass says which it is.
 *
 * WHAT JAVASCRIPT CAN AND CANNOT SEE OF A VIEW TRANSITION — read this before
 * trusting any number out of here. `animateReflow` (US-006) wraps the state
 * update in `document.startViewTransition`, so the REAL DOM moves to its final
 * geometry in a single frame and the visible tween runs on
 * `::view-transition-group(*)` pseudo-elements. `getBoundingClientRect` therefore
 * shows a jump even when the screen glides. The honest measurement is the
 * pseudo-element animation itself: {@link FrameSample.viewTransitionTime}
 * samples its `currentTime` every frame, so the tween is measured directly
 * rather than inferred.
 */

/* ------------------------------------------------------------- THE SAMPLE -- */

/** One frame of the reveal. */
export interface FrameSample {
  /** Milliseconds since sampling started. */
  readonly t: number;
  /** The thinking panel is on the canvas. */
  readonly panel: boolean;
  /** Insight sections on the canvas. */
  readonly sections: number;
  /** Cards anywhere on the canvas. */
  readonly cards: number;
  /** Cards painted at an opacity a presenter could not see. */
  readonly cardsAtZero: number;
  /** Card opacities inside the focused section, in DOM order. */
  readonly opacities: readonly number[];
  /** Figure strings inside the focused section, in DOM order. */
  readonly figures: readonly string[];
  /** Chart geometry inside the focused section — bar extents, arc lengths. */
  readonly geometry: readonly number[];
  readonly scrollY: number;
  /**
   * Document-space top of the anchor element — an element that was ALREADY on
   * screen before the insertion. `scrollY` is added in, so a page that scrolls
   * does not look like a page that moved.
   */
  readonly anchorTop: number | null;
  /**
   * `currentTime` of the furthest-advanced `::view-transition-group` animation,
   * or `null` when no view transition is running. This is the reflow tween,
   * measured rather than assumed.
   */
  readonly viewTransitionTime: number | null;
}

/** One `::view-transition-*` animation the browser ran during the sample. */
export interface ViewTransitionAnimation {
  /** e.g. `::view-transition-group(fcb-tile-hero-2)`. */
  readonly pseudo: string;
  /** Its computed duration in milliseconds. */
  readonly durationMs: number;
}

export interface SampleRun {
  readonly frames: readonly FrameSample[];
  /** Every view-transition pseudo-element animation seen, deduplicated. */
  readonly viewTransitions: readonly ViewTransitionAnimation[];
  /** `animation-delay` of each card in the focused section, in DOM order. */
  readonly staggerDelaysMs: readonly number[];
}

export interface SamplerConfig {
  /**
   * The section the reveal is about — its cards, figures and geometry are the
   * ones sampled per frame. A CSS selector; `null` samples the whole canvas.
   */
  readonly focus?: string | null;
  /**
   * An element already on screen before the action, whose document-space
   * position must not move. A CSS selector.
   */
  readonly anchor?: string | null;
}

/* --------------------------------------------------------- THE VOCABULARY -- */

/**
 * Figure slots that COUNT UP — the numbers `useCountUp` drives (US-027).
 *
 * Only the counted ones: a subtitle or a scope line is a static string, and
 * including it would make "the figures changed" true for the wrong reason.
 */
export const COUNTED_FIGURE_SLOTS = [
  "kpi-value",
  "v-bar-value",
  "h-bar-value",
  "donut-centre-value",
  "attendance-ring-value",
  "compare-bar-value",
] as const;

/**
 * Geometry that GROWS as a CSS transition off `useGrow` — measured as a painted
 * extent, which is the only reading that cannot be faked by a class name.
 */
export const GROWN_RECT_SLOTS = [
  { slot: "h-bar-fill", axis: "width" },
  { slot: "v-bar", axis: "height" },
  { slot: "grouped-bar", axis: "height" },
  { slot: "compare-bar-fill", axis: "width" },
  { slot: "department-target-fill", axis: "width" },
] as const;

/**
 * Ring and donut geometry, which grows by `stroke-dasharray` rather than by a
 * box: an arc's painted rect is the whole circle whether or not it has grown, so
 * the dash length is the only honest reading.
 */
export const GROWN_DASH_SLOTS = ["donut-arc", "attendance-ring-arc"] as const;

/* --------------------------------------------------------------- SAMPLING -- */

/** The globals the in-page loops write to. Namespaced, and removed when read. */
const SAMPLE_GLOBAL = "__fcbSample";
const CLOCK_GLOBAL = "__fcbClock";

/**
 * Start recording the screen, one entry per animation frame.
 *
 * Everything below the `page.evaluate` boundary runs in the page, because these
 * are live layout and computed-style values; the slot vocabulary is passed in so
 * it stays in this file.
 */
export async function startSampler(
  page: Page,
  config: SamplerConfig = {},
): Promise<void> {
  await page.evaluate(
    ({ global, figureSlots, rectSlots, dashSlots, focus, anchor }) => {
      const state = {
        frames: [] as unknown[],
        transitions: new Map<string, number>(),
        stopped: false,
        started: performance.now(),
      };
      (window as unknown as Record<string, unknown>)[global] = state;

      const root = (): ParentNode | null =>
        focus ? document.querySelector(focus) : document;

      const query = (scope: ParentNode, slot: string) =>
        scope.querySelectorAll(`[data-slot="${slot}"]`);

      /** The first number in a `stroke-dasharray`, in user units. */
      const dashLength = (el: Element): number => {
        const raw = getComputedStyle(el).strokeDasharray;
        const first = Number.parseFloat(raw);
        return Number.isFinite(first) ? first : 0;
      };

      /**
       * The furthest-advanced reflow tween, and a note of every pseudo-element
       * animation seen. `getAnimations` is the only window onto a view
       * transition: the real DOM has already moved.
       */
      const viewTransition = (): number | null => {
        let furthest: number | null = null;
        for (const animation of document.getAnimations()) {
          const effect = animation.effect as KeyframeEffect | null;
          const pseudo = effect?.pseudoElement ?? null;
          if (!pseudo?.startsWith("::view-transition")) continue;

          const timing = effect!.getComputedTiming();
          const duration =
            typeof timing.duration === "number" ? timing.duration : 0;
          if (!state.transitions.has(pseudo)) {
            state.transitions.set(pseudo, Math.round(duration));
          }

          if (!pseudo.startsWith("::view-transition-group")) continue;
          const current = animation.currentTime;
          const ms = typeof current === "number" ? current : null;
          if (ms !== null && (furthest === null || ms > furthest)) {
            furthest = ms;
          }
        }
        return furthest;
      };

      const sample = () => {
        const scope = root();
        const cards = document.querySelectorAll('[data-slot="card"]');
        let cardsAtZero = 0;
        for (const card of cards) {
          if (Number.parseFloat(getComputedStyle(card).opacity) <= 0.01) {
            cardsAtZero += 1;
          }
        }

        const opacities: number[] = [];
        const figures: string[] = [];
        const geometry: number[] = [];

        if (scope) {
          for (const card of query(scope, "card")) {
            opacities.push(
              Number(
                Number.parseFloat(getComputedStyle(card).opacity).toFixed(3),
              ),
            );
          }
          for (const slot of figureSlots) {
            for (const el of query(scope, slot)) {
              figures.push((el.textContent ?? "").trim());
            }
          }
          for (const { slot, axis } of rectSlots) {
            for (const el of query(scope, slot)) {
              const box = el.getBoundingClientRect();
              geometry.push(
                Number((axis === "width" ? box.width : box.height).toFixed(2)),
              );
            }
          }
          for (const slot of dashSlots) {
            for (const el of query(scope, slot)) {
              geometry.push(Number(dashLength(el).toFixed(2)));
            }
          }
        }

        const anchorEl = anchor ? document.querySelector(anchor) : null;

        state.frames.push({
          t: Number((performance.now() - state.started).toFixed(1)),
          panel:
            document.querySelector('[data-slot="thinking-panel"]') !== null,
          sections: document.querySelectorAll('[data-slot="insight-section"]')
            .length,
          cards: cards.length,
          cardsAtZero,
          opacities,
          figures,
          geometry,
          scrollY: Number(window.scrollY.toFixed(1)),
          anchorTop: anchorEl
            ? Number(
                (anchorEl.getBoundingClientRect().top + window.scrollY).toFixed(
                  2,
                ),
              )
            : null,
          viewTransitionTime: viewTransition(),
        });

        if (!state.stopped) requestAnimationFrame(sample);
      };

      requestAnimationFrame(sample);
    },
    {
      global: SAMPLE_GLOBAL,
      figureSlots: COUNTED_FIGURE_SLOTS as readonly string[],
      rectSlots: GROWN_RECT_SLOTS as readonly {
        slot: string;
        axis: string;
      }[],
      dashSlots: GROWN_DASH_SLOTS as readonly string[],
      focus: config.focus ?? null,
      anchor: config.anchor ?? null,
    },
  );
}

/**
 * Stop sampling and hand back the run, including the per-card stagger read from
 * the settled DOM.
 *
 * The stagger is read at the END rather than per frame because
 * `animation-delay` is a static declaration, not a moving value — sampling it a
 * hundred times would say the same thing a hundred times.
 */
export async function stopSampler(
  page: Page,
  config: SamplerConfig = {},
): Promise<SampleRun> {
  return page.evaluate(
    ({ global, focus }) => {
      const state = (window as unknown as Record<string, unknown>)[global] as {
        frames: unknown[];
        transitions: Map<string, number>;
        stopped: boolean;
      };
      state.stopped = true;
      delete (window as unknown as Record<string, unknown>)[global];

      const scope = focus ? document.querySelector(focus) : document;
      const staggerDelaysMs = scope
        ? [...scope.querySelectorAll('[data-slot="card"]')].map((card) =>
            Math.round(
              Number.parseFloat(getComputedStyle(card).animationDelay) * 1000,
            ),
          )
        : [];

      return {
        frames: state.frames,
        viewTransitions: [...state.transitions].map(([pseudo, durationMs]) => ({
          pseudo,
          durationMs,
        })),
        staggerDelaysMs,
      };
    },
    { global: SAMPLE_GLOBAL, focus: config.focus ?? null },
  ) as Promise<SampleRun>;
}

/* ------------------------------------------------------------ FRAME CLOCK -- */

export interface FrameClock {
  /** Frames observed. */
  readonly frames: number;
  /** Wall time the clock ran, in milliseconds. */
  readonly spanMs: number;
  /** The worst gap between two consecutive frames. */
  readonly longestFrameMs: number;
  /** Gaps over 33.4ms — a frame that could not be served at 30fps. */
  readonly over33: number;
  /** Gaps over 16.7ms — the 60fps budget. Some slack is normal. */
  readonly over17: number;
  /** 95th-percentile gap. */
  readonly p95FrameMs: number;
}

/**
 * Start a timestamps-only frame clock. NO DOM reads: this measures the
 * application's frame budget, and an instrument that walked the canvas every
 * frame would be measuring itself.
 */
export async function startFrameClock(page: Page): Promise<void> {
  await page.evaluate((global) => {
    const state = { gaps: [] as number[], stopped: false };
    (window as unknown as Record<string, unknown>)[global] = state;

    let previous = performance.now();
    const tick = (now: number) => {
      state.gaps.push(now - previous);
      previous = now;
      if (!state.stopped) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, CLOCK_GLOBAL);
}

/** Stop the clock and reduce the gaps to the figures this story reports. */
export async function stopFrameClock(page: Page): Promise<FrameClock> {
  return page.evaluate((global) => {
    const state = (window as unknown as Record<string, unknown>)[global] as {
      gaps: number[];
      stopped: boolean;
    };
    state.stopped = true;
    delete (window as unknown as Record<string, unknown>)[global];

    // The first gap is measured from `startFrameClock`'s own call rather than
    // from a frame, so it is bookkeeping rather than a rendered frame.
    const gaps = state.gaps.slice(1);
    const sorted = [...gaps].sort((a, b) => a - b);
    const round = (value: number) => Number(value.toFixed(1));

    return {
      frames: gaps.length,
      spanMs: round(gaps.reduce((sum, gap) => sum + gap, 0)),
      longestFrameMs: round(sorted.at(-1) ?? 0),
      over33: gaps.filter((gap) => gap > 33.4).length,
      over17: gaps.filter((gap) => gap > 16.7).length,
      p95FrameMs: round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
    };
  }, CLOCK_GLOBAL);
}

/** The frame clock as one readable line for the run output. */
export function formatFrameClock(clock: FrameClock, label: string): string {
  return [
    `  ${label.padEnd(28)}`,
    `${String(clock.frames).padStart(4)} frames`,
    `over ${String(Math.round(clock.spanMs)).padStart(5)}ms`,
    `longest ${clock.longestFrameMs.toFixed(1).padStart(6)}ms`,
    `p95 ${clock.p95FrameMs.toFixed(1).padStart(5)}ms`,
    `>33ms: ${String(clock.over33).padStart(3)}`,
    `>17ms: ${String(clock.over17).padStart(3)}`,
  ].join("  ");
}

/* -------------------------------------------------------------- THROTTLING -- */

/**
 * Slow the renderer down by `rate`x through CDP, the way DevTools' own CPU
 * throttling does.
 *
 * WHY THIS IS HERE AND WHAT IT IS NOT. The acceptance criterion asks for the
 * ACTUAL DEMO HARDWARE, which is not the machine this suite runs on and cannot
 * be reached from it. Throttling is the honest approximation available: it
 * multiplies the cost of every task on the main thread, so a reveal that keeps
 * its frames at 4x and 6x has headroom for a machine several times slower than
 * this one. It is an approximation and the story's report says so.
 */
export async function throttleCpu(page: Page, rate: number): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send("Emulation.setCPUThrottlingRate", { rate });
}

/* --------------------------------------------------------- SCROLL AT REST -- */

/**
 * Wait until the page has stopped scrolling, or `capMs` has passed.
 *
 * Anything that measures a box against the PINNED prompt bar has to be read
 * with the viewport at rest: a smooth scroll of several hundred pixels takes a
 * few hundred milliseconds, and a reading taken part way through says the last
 * row is behind the bar when it is merely still on its way. Two consecutive
 * equal samples, not a fixed sleep, so the wait is as short as the scroll is.
 */
export async function waitForScrollRest(
  page: Page,
  capMs = 1_200,
): Promise<number> {
  const step = 60;
  let previous = await page.evaluate(() => window.scrollY);

  for (let waited = 0; waited < capMs; waited += step) {
    await page.waitForTimeout(step);
    const current = await page.evaluate(() => window.scrollY);
    if (current === previous) return current;
    previous = current;
  }

  return previous;
}

/* ------------------------------------------------------------- READINGS -- */

/** Frames in which the thinking panel was on screen. */
export function panelFrames(run: SampleRun): readonly FrameSample[] {
  return run.frames.filter((frame) => frame.panel);
}

/** The first frame at or after which the predicate holds. */
export function firstFrame(
  run: SampleRun,
  predicate: (frame: FrameSample) => boolean,
): FrameSample | null {
  return run.frames.find(predicate) ?? null;
}

/** Distinct values a sampled series took, in the order first seen. */
export function distinct<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}

/**
 * Whether a rendered figure reads as zero — `0`, `CHF 0`, `0.0%`, `0’000`.
 *
 * The digits are what is judged, not the currency word or the sign, so a
 * formatter change cannot quietly make this stop matching. A string with no
 * digits at all is not a figure and is not zero.
 */
export function readsAsZero(text: string): boolean {
  const digits = text.replace(/[^0-9]/g, "");
  return digits.length > 0 && /^0+$/.test(digits);
}
