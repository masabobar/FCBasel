import { expect, test, type Page } from "@playwright/test";

import {
  expectAnswerLanded,
  FOLLOW_UP_CHIP,
  HERO_CHIP,
  loadDemoScript,
  RESET_LABEL,
  tapChip,
} from "./support/demo-script";
import {
  distinct,
  formatFrameClock,
  panelFrames,
  readsAsZero,
  type SampleRun,
  startFrameClock,
  startSampler,
  stopFrameClock,
  stopSampler,
  throttleCpu,
  waitForScrollRest,
} from "./support/timing";
import { signIn } from "./support/sign-in";

/**
 * US-043 — transition and timing polish, MEASURED FRAME BY FRAME.
 *
 * The Reference Guide calls the orchestrated reveal "the wow": the thinking
 * panel goes up, the section mounts, the cards stagger in, the numbers count up,
 * the bars and rings grow, and the view scrolls to the new answer. Every
 * criterion in this story is a claim about what happens BETWEEN two states, so
 * every case here samples the page on every animation frame (`support/timing.ts`)
 * rather than asserting on the settled screen — which by definition looks fine.
 *
 * WHAT IS MEASURED HERE AND ON WHAT. Real Chrome against the BUILT SSR bundle,
 * exactly as US-040/041/042/044 do. **The machine is an Apple M1 MacBook Pro
 * (MacBookPro17,1, 8 cores, 16GB, macOS 15.6.1) — it is NOT the demo machine,
 * and nothing here claims otherwise.** The frame budget is therefore also
 * measured under CDP CPU throttling at 4x and 6x, which is the honest way to
 * say something about hardware slower than the one to hand.
 *
 * SIX GROUPS, ONE PER CRITERION:
 *   1. the sequence, in order and without overlap        (criterion 3)
 *   2. no flicker — nothing stranded, nothing blanked    (criterion 1)
 *   3. no layout jump across an insertion                (criterion 1)
 *   4. a filter counts from the figures on screen        (criterion 4)
 *   5. reduced motion is final state, never zero         (criterion 5)
 *   6. frame budget, plain and throttled                 (criterion 2)
 *   7. KL-3 — a reload lands at the top of the page      (this story's own fix)
 */

/* ------------------------------------------------------------ VOCABULARY -- */

const HERO_1_SECTION = '[data-hero-id="HERO_1"]';
const HERO_2_SECTION = '[data-hero-id="HERO_2"]';
const HERO_3_SECTION = '[data-hero-id="HERO_3"]';
const EMPTY_STATE = '[data-slot="empty-state-panel"]';
const CREST = '[data-slot="top-bar"] img';

/** Hero 1's period filter — the one control that re-drives figures already up. */
const PERIOD_SEASON = "Season to date";
const PERIOD_CURRENT_MONTH = "Current month";

/**
 * `--duration-enter` 400ms + `--duration-grow` 700ms + `--duration-count-up`
 * 900ms, with the tile stagger on top. Sampling stops here, so every frame of
 * the reveal is in the run and the tail is at rest.
 */
const SETTLE_MS = 2_000;

/** Tile stagger — `TILE_STAGGER_MS` in `app/components/heroes/hero-section.tsx`. */
const TILE_STAGGER_MS = 90;

/** `--duration-enter`, the insertion and the reflow tween. */
const ENTER_MS = 400;

/* --------------------------------------------------------------- DRIVERS -- */

/** Open the app at the baseline, empty state up, nothing asked yet. */
async function openBaseline(page: Page) {
  await page.goto("/");
  await signIn(page);
  await expect(page.locator(EMPTY_STATE)).toBeVisible();
}

/**
 * Ask one question with the sampler running, and hand back the whole reveal.
 *
 * The answer is waited for by ASSERTION (`expectAnswerLanded`), never by clock,
 * so the run cannot race the ~1150ms beat; the trailing settle is what puts the
 * count-up and the growth inside the sample.
 */
async function sampleReveal(
  page: Page,
  chip: string,
  counts: { sections: number; followUps: number },
  config: { focus?: string | null; anchor?: string | null } = {},
): Promise<SampleRun> {
  await startSampler(page, config);
  await tapChip(page, chip);
  await expectAnswerLanded(page, counts.sections, counts.followUps);
  await page.waitForTimeout(SETTLE_MS);
  return stopSampler(page, config);
}

/** Every figure string the run ever sampled, deduplicated. */
function figuresSeen(run: SampleRun): readonly string[] {
  return distinct(run.frames.flatMap((frame) => [...frame.figures]));
}

/** Every geometry reading the run ever sampled, deduplicated. */
function geometrySeen(run: SampleRun): readonly number[] {
  return distinct(run.frames.flatMap((frame) => [...frame.geometry]));
}

/* ================================================================ GROUP 1 == */

test.describe("the orchestrated reveal is one sequence", () => {
  test("panel, then section, then stagger, then figures, then geometry, then scroll", async ({
    page,
  }) => {
    await openBaseline(page);
    const run = await sampleReveal(
      page,
      HERO_CHIP.shirts,
      { sections: 1, followUps: 0 },
      { focus: HERO_1_SECTION },
    );

    // BEAT 1 — the panel is on screen, and for the beat's own length.
    const panel = panelFrames(run);
    expect(
      panel.length,
      "the thinking panel was never sampled",
    ).toBeGreaterThan(10);
    const panelUp = panel[0]!.t;
    const panelDown = panel.at(-1)!.t;
    expect(
      panelDown - panelUp,
      "the beat is outside the criterion's 600-1200ms band",
    ).toBeGreaterThan(600);
    expect(
      panelDown - panelUp,
      "the beat is outside the criterion's 600-1200ms band",
    ).toBeLessThan(1_250);

    // BEAT 2 — the section mounts, and NOT WHILE THE PANEL IS STILL THERE.
    // The two writes are one commit (`useThinking` schedules inside
    // `useDashboard`'s `flushSync`), so no frame may show both.
    const overlap = run.frames.filter(
      (frame) => frame.panel && frame.sections > 0,
    );
    expect(overlap, "a frame showed the panel beside its own answer").toEqual(
      [],
    );
    const sectionUp = run.frames.find((frame) => frame.sections > 0);
    expect(sectionUp, "the section never appeared").toBeTruthy();
    expect(
      sectionUp!.t,
      "the section mounted before the panel left",
    ).toBeGreaterThanOrEqual(panelDown);

    // AND NO SEAM BETWEEN THEM. This is the defect US-043 found: the panel
    // used to come down one or two frames BEFORE the answer, and
    // `useCanvasPanel` correctly read that gap as "nothing has been asked
    // yet" and flashed the EMPTY STATE back into the spot the panel had just
    // left — which then ghosted across the whole 400ms reflow. Measured at
    // ~51ms before the fix; it must be zero frames now.
    const seam = run.frames.filter(
      (frame) => frame.t > panelUp && !frame.panel && frame.sections === 0,
    );
    expect(
      seam.map((frame) => `${frame.t}ms`),
      "a frame had neither the panel nor the answer",
    ).toEqual([]);

    // BEAT 3 — the cards' stagger delays ASCEND, one step per tile.
    expect(
      run.staggerDelaysMs,
      "the cards did not stagger in ascending steps",
    ).toEqual([0, TILE_STAGGER_MS, 2 * TILE_STAGGER_MS]);

    // BEAT 4 — the figures COUNT. Many distinct strings, not two.
    const figures = figuresSeen(run);
    expect(
      figures.length,
      "the figures never counted up (one value throughout)",
    ).toBeGreaterThan(10);

    // BEAT 5 — the geometry GROWS. Same test, on painted extents.
    const geometry = geometrySeen(run);
    expect(
      geometry.length,
      "the bars and arcs never grew (one extent throughout)",
    ).toBeGreaterThan(10);

    // The counting and the growing happen AFTER the section mounts, which is
    // what makes them the fourth and fifth beats rather than the second.
    const firstFigureChange = run.frames.find(
      (frame, index) =>
        index > 0 &&
        frame.figures.join("|") !== run.frames[index - 1]!.figures.join("|"),
    );
    expect(
      firstFigureChange!.t,
      "a figure moved before the section existed",
    ).toBeGreaterThanOrEqual(sectionUp!.t);

    // BEAT 6 — THE AUTO-SCROLL COMES LAST, as the criterion lists it, and
    // never during the reflow tween. Moving the viewport while the browser is
    // cross-fading a snapshot OF that viewport slid the live page out from
    // under the outgoing snapshot: a doubled canvas and a white band up to
    // ~80px across the top of the screen, for the length of the tween. US-043
    // made both scrolls wait on the transition's own `finished` promise.
    const tweenFrames = run.frames.filter(
      (frame) => frame.viewTransitionTime !== null,
    );
    expect(tweenFrames.length, "no reflow tween ran at all").toBeGreaterThan(5);
    const tweenEnd = tweenFrames.at(-1)!.t;
    const atMount = sectionUp!.scrollY;
    const scrollMoved = run.frames.find(
      (frame) => frame.t > sectionUp!.t && frame.scrollY !== atMount,
    );
    expect(scrollMoved, "the reveal never scrolled to its answer").toBeTruthy();
    expect(
      scrollMoved!.t,
      "the view scrolled while the reflow tween was still running",
    ).toBeGreaterThan(tweenEnd);

    const settled = run.frames.at(-1)!;
    const sectionTop = await page
      .locator(HERO_1_SECTION)
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(
      Math.abs(sectionTop),
      "the reveal did not settle with the new section in view",
    ).toBeLessThan(80);
    // And the scroll came to REST: the last twenty frames agree on it.
    const tail = distinct(run.frames.slice(-20).map((frame) => frame.scrollY));
    expect(tail.length, "the scroll was still moving at the end").toBe(1);
    expect(settled.sections, "the section did not survive the reveal").toBe(1);

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "  REVEAL, SAMPLED FRAME BY FRAME (Hero 1 from the baseline)",
        `    frames sampled            ${run.frames.length}`,
        `    panel up .. down          ${panelUp.toFixed(0)}ms .. ${panelDown.toFixed(0)}ms  (${(panelDown - panelUp).toFixed(0)}ms)`,
        `    section mounted           ${sectionUp!.t.toFixed(0)}ms`,
        `    seam frames (neither)     ${seam.length}`,
        `    stagger delays            ${run.staggerDelaysMs.join(", ")}ms`,
        `    distinct figure strings   ${figures.length}`,
        `    distinct geometry values  ${geometry.length}`,
        `    reflow tween ended        ${tweenEnd.toFixed(0)}ms`,
        `    scroll started            ${scrollMoved!.t.toFixed(0)}ms  (after the tween)`,
        `    settled scrollY           ${settled.scrollY}`,
        `    new section top           ${sectionTop.toFixed(1)}px`,
        "",
      ].join("\n"),
    );
  });

  test("every hero and every follow-up runs the same sequence", async ({
    page,
  }) => {
    await openBaseline(page);

    const script = [
      { chip: HERO_CHIP.shirts, sections: 1, followUps: 0 },
      { chip: HERO_CHIP.tickets, sections: 2, followUps: 0 },
      { chip: HERO_CHIP.budgets, sections: 3, followUps: 0 },
      { chip: FOLLOW_UP_CHIP.shirts, sections: 3, followUps: 1 },
      { chip: FOLLOW_UP_CHIP.tickets, sections: 3, followUps: 2 },
      { chip: FOLLOW_UP_CHIP.budgets, sections: 3, followUps: 3 },
    ] as const;

    for (const step of script) {
      const run = await sampleReveal(page, step.chip, step);
      const panel = panelFrames(run);

      expect(panel.length, `${step.chip}: no beat`).toBeGreaterThan(5);

      // ONE BEAT, ONCE. The panel goes up, comes down, and does not come back:
      // `useThinking` holds a single beat and `useDashboard` a single timer, so
      // a second panel in one answer would mean two beats were racing.
      const beatEnd = panel.at(-1)!.t;
      expect(
        run.frames.filter((frame) => frame.t > beatEnd && frame.panel),
        `${step.chip}: the panel came back after its answer`,
      ).toEqual([]);

      // THE CANVAS ONLY EVER GROWS during an answer — no frame shows fewer
      // cards than the frame before it, which is the flicker this criterion
      // names ("a frame where the canvas is empty mid-transition").
      const shrank = run.frames.filter(
        (frame, index) =>
          index > 0 && frame.cards < run.frames[index - 1]!.cards,
      );
      expect(
        shrank.map((frame) => `${frame.t}ms: ${frame.cards} cards`),
        `${step.chip}: the canvas lost a card mid-answer`,
      ).toEqual([]);
    }
  });
});

/* ================================================================ GROUP 2 == */

test.describe("no flicker", () => {
  test("no tile is stranded at opacity zero once its turn has come", async ({
    page,
  }) => {
    await openBaseline(page);
    const run = await sampleReveal(
      page,
      HERO_CHIP.shirts,
      { sections: 1, followUps: 0 },
      { focus: HERO_1_SECTION },
    );

    // The section's own mount is t0 for the cascade: each card holds its
    // opening frame for `animation-delay` (that is `both`, and it is what stops
    // a staggered tile flashing), then rises over `--duration-enter`.
    const mounted = run.frames.find((frame) => frame.opacities.length > 0)!;
    const stranded: string[] = [];

    for (const frame of run.frames) {
      const since = frame.t - mounted.t;
      frame.opacities.forEach((opacity, index) => {
        const startsAt = index * TILE_STAGGER_MS;
        // A generous frame of slack either side: the delay is honoured by the
        // compositor, not by this loop's clock.
        const shouldBeUp = since > startsAt + ENTER_MS + 40;
        if (shouldBeUp && opacity < 0.99) {
          stranded.push(
            `tile ${index} at ${since.toFixed(0)}ms after mount: opacity ${opacity}`,
          );
        }
      });
    }

    expect(
      stranded.slice(0, 5),
      "a tile was still transparent after its entrance should have finished",
    ).toEqual([]);

    // And the entrance really is an ENTRANCE: every tile was sampled below
    // full opacity at some point, so none of them simply appeared.
    const faded = run.frames.some((frame) =>
      frame.opacities.some((opacity) => opacity > 0 && opacity < 0.99),
    );
    expect(faded, "no tile was ever sampled mid-fade").toBe(true);
  });

  test("the canvas never empties mid-transition", async ({ page }) => {
    await openBaseline(page);
    const before = await page.locator('[data-slot="card"]').count();

    // The worst moment for a blanked canvas is the second and third insertion,
    // when a view transition is capturing a canvas that already has content.
    for (const step of [
      { chip: HERO_CHIP.shirts, sections: 1, followUps: 0 },
      { chip: HERO_CHIP.tickets, sections: 2, followUps: 0 },
      { chip: FOLLOW_UP_CHIP.shirts, sections: 2, followUps: 1 },
    ] as const) {
      const run = await sampleReveal(page, step.chip, step);

      const emptied = run.frames.filter((frame) => frame.cards < before);
      expect(
        emptied
          .map((frame) => `${frame.t}ms: ${frame.cards} cards`)
          .slice(0, 5),
        `${step.chip}: the canvas lost cards mid-transition`,
      ).toEqual([]);

      // Nothing that was ALREADY up went transparent either: `cardsAtZero`
      // counts the whole canvas, so it may only ever be the tiles of the
      // section being inserted.
      const worst = Math.max(...run.frames.map((frame) => frame.cardsAtZero));
      expect(
        worst,
        `${step.chip}: more cards were transparent than the insertion inserts`,
      ).toBeLessThanOrEqual(6);
    }
  });

  test("the thinking panel is never hidden behind the pinned prompt bar", async ({
    page,
  }) => {
    // The panel scrolls itself into view as it mounts (US-031), but it is the
    // LAST grid item on a canvas that is already scrolled to its end, so on the
    // later beats it cannot reach the top of the viewport. The prompt bar is
    // `fixed`, and its chip row GROWS as follow-ups are offered — six chips
    // wrap to two rows — so the question is whether the beat the room is
    // reading survives the bar it sits under.
    await page.setViewportSize({ width: 1440, height: 900 });
    await openBaseline(page);

    const readings: string[] = [];
    let sections = 0;
    let followUps = 0;

    for (const step of [
      { chip: HERO_CHIP.shirts, kind: "hero" },
      { chip: HERO_CHIP.tickets, kind: "hero" },
      { chip: HERO_CHIP.budgets, kind: "hero" },
      { chip: FOLLOW_UP_CHIP.shirts, kind: "followUp" },
      { chip: FOLLOW_UP_CHIP.tickets, kind: "followUp" },
      { chip: FOLLOW_UP_CHIP.budgets, kind: "followUp" },
    ] as const) {
      await tapChip(page, step.chip);
      await expect(page.locator('[data-slot="thinking-panel"]')).toBeVisible();
      // WITH THE VIEWPORT AT REST, and this matters: read part way through the
      // panel's own smooth scroll and the message measures ~115px behind the
      // bar simply because it is still travelling. That reading was taken, and
      // it was the instrument, not the product.
      //
      // THE CAP WAS 800ms AND THAT WAS NOT ENOUGH — US-045. `waitForScrollRest`
      // returns the moment two consecutive samples agree, so a healthy run pays
      // nothing for a longer cap; but running the whole suite end to end put a
      // smooth scroll past 800ms on a loaded machine, the cap expired mid-flight
      // and the case failed at -279.5px against a panel that was merely still
      // travelling. It passed in isolation on the same build, at +107.5px. The
      // budget is now generous enough that expiry means the scroll really is
      // stuck rather than slow.
      await waitForScrollRest(page, 3_000);

      const reading = await page.evaluate(() => {
        const bar = document
          .querySelector('[data-slot="prompt-bar"]')!
          .getBoundingClientRect();
        const message = document
          .querySelector('[data-slot="thinking-message"]')!
          .getBoundingClientRect();
        const sources = document
          .querySelector('[data-slot="thinking-sources"]')!
          .getBoundingClientRect();
        return {
          barHeight: Number(bar.height.toFixed(1)),
          messageClearance: Number((bar.top - message.bottom).toFixed(1)),
          sourcesClearance: Number((bar.top - sources.bottom).toFixed(1)),
        };
      });

      readings.push(
        `${step.chip.slice(0, 34).padEnd(34)} bar ${String(reading.barHeight).padStart(6)}px  message ${String(reading.messageClearance).padStart(7)}px  sources ${String(reading.sourcesClearance).padStart(7)}px`,
      );

      // BOTH LINES CLEAR THE BAR. The message names what is being looked at
      // and the source chips say which systems; between them they are the whole
      // of the beat, and the bar is `fixed` with a chip row that GROWS as
      // follow-ups are offered — past four chips it wraps to a second row and
      // takes the bar from 117px to 159px. THIS IS WHERE US-043 FOUND ITS
      // SECOND DEFECT: `PROMPT_BAR_CLEARANCE_CLASS` reserved 128px, so from the
      // third question on the panel's source chips sat 14.2px UNDER the bar.
      // The reserve is now 176px. The margin is thinnest on the two-row beats,
      // so the number is asserted at every one of them rather than at one.
      expect(
        reading.messageClearance,
        `${step.chip}: the thinking message is behind the prompt bar`,
      ).toBeGreaterThan(0);
      expect(
        reading.sourcesClearance,
        `${step.chip}: the source chips are behind the prompt bar`,
      ).toBeGreaterThan(0);

      if (step.kind === "hero") sections += 1;
      else followUps += 1;
      await expectAnswerLanded(page, sections, followUps);
      await page.waitForTimeout(SETTLE_MS);
    }

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "  THINKING PANEL vs THE PINNED PROMPT BAR (1440x900)",
        ...readings.map((line) => `    ${line}`),
        "",
      ].join("\n"),
    );
  });
});

/* ================================================================ GROUP 3 == */

test.describe("no layout jump", () => {
  test("an appended answer moves nothing that is already on screen", async ({
    page,
  }) => {
    await openBaseline(page);
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    await page.waitForTimeout(SETTLE_MS);

    // Hero 1 is up. Insert Hero 2 beneath it and watch Hero 1's document-space
    // position on every frame: sections APPEND, so nothing above may move by so
    // much as a pixel — the strongest form of "no layout jump" there is.
    const run = await sampleReveal(
      page,
      HERO_CHIP.tickets,
      { sections: 2, followUps: 0 },
      { anchor: HERO_1_SECTION, focus: HERO_2_SECTION },
    );

    const tops = distinct(
      run.frames
        .map((frame) => frame.anchorTop)
        .filter((top): top is number => top !== null),
    );
    const drift = Math.max(...tops) - Math.min(...tops);
    expect(
      drift,
      `Hero 1 moved during Hero 2's insertion: ${tops.join(", ")}`,
    ).toBeLessThan(1);

    // eslint-disable-next-line no-console
    console.log(
      `\n  APPEND: Hero 1's document top over ${run.frames.length} frames — ` +
        `${tops.length} distinct value(s), drift ${drift.toFixed(2)}px\n`,
    );
  });

  test("a reflow that does move tiles is tweened, never teleported", async ({
    page,
  }) => {
    await openBaseline(page);
    // One at a time: a chip tap REPLACES a beat in flight rather than queueing
    // behind it (`app/lib/dashboard/use-thinking.ts`), so three taps in a burst
    // land one answer, not three. That is the designed behaviour, not a race.
    const heroes = [HERO_CHIP.shirts, HERO_CHIP.tickets, HERO_CHIP.budgets];
    for (const [index, chip] of heroes.entries()) {
      await tapChip(page, chip);
      await expectAnswerLanded(page, index + 1, 0);
    }
    await page.waitForTimeout(SETTLE_MS);

    const before = await page
      .locator(HERO_3_SECTION)
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

    // Hero 1's follow-up adds three rows INSIDE the first section, so Heroes 2
    // and 3 are pushed down. This is the only insertion in the product where
    // tiles already on screen change position.
    const run = await sampleReveal(
      page,
      FOLLOW_UP_CHIP.shirts,
      { sections: 3, followUps: 1 },
      { anchor: HERO_3_SECTION, focus: HERO_1_SECTION },
    );

    const after = await page
      .locator(HERO_3_SECTION)
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    const pushed = after - before;
    expect(pushed, "the follow-up pushed nothing down").toBeGreaterThan(100);

    // The real DOM moves in one frame and the TWEEN runs on the
    // `::view-transition-group` pseudo-elements, so the honest measurement is
    // the pseudo-element animation's own clock.
    const groups = run.viewTransitions.filter((animation) =>
      animation.pseudo.startsWith("::view-transition-group"),
    );
    expect(
      groups.length,
      "no reflow tween ran: the tiles teleported to their new rows",
    ).toBeGreaterThanOrEqual(3);
    for (const group of groups) {
      expect(
        group.durationMs,
        `${group.pseudo} is not timed to the insertion`,
      ).toBe(ENTER_MS);
    }
    // Each of the three sections was paired with itself across the update.
    for (const hero of ["HERO_1", "HERO_2", "HERO_3"]) {
      expect(
        groups.some((group) => group.pseudo.includes(`fcb-tile-${hero}`)),
        `${hero} was not paired across the insertion`,
      ).toBe(true);
    }

    // And the tween ADVANCED, frame by frame, rather than snapping: many
    // distinct `currentTime` readings between 0 and the 400ms duration.
    const progress = run.frames
      .map((frame) => frame.viewTransitionTime)
      .filter((time): time is number => time !== null);
    expect(
      distinct(progress).length,
      "the reflow tween was sampled at one instant only",
    ).toBeGreaterThan(8);
    expect(
      Math.max(...progress),
      "the tween never reached its end",
    ).toBeGreaterThan(ENTER_MS * 0.5);

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "  REFLOW: Hero 1's follow-up pushes Heroes 2 and 3 down",
        `    Hero 3 document top    ${before.toFixed(1)}px -> ${after.toFixed(1)}px  (+${pushed.toFixed(1)}px)`,
        `    reflow tweens          ${groups.length} groups, all ${ENTER_MS}ms`,
        `    tween samples          ${distinct(progress).length} distinct currentTime readings, max ${Math.max(...progress).toFixed(0)}ms`,
        "",
      ].join("\n"),
    );
  });
});

/* ================================================================ GROUP 4 == */

test.describe("a filter counts from the figures on screen", () => {
  test("the first sample after a filter press is the OLD value, never zero", async ({
    page,
  }) => {
    await openBaseline(page);
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    await page.waitForTimeout(SETTLE_MS);

    const settled = await page.locator(HERO_1_SECTION).evaluate(
      (section, slots) => {
        const out: string[] = [];
        for (const slot of slots) {
          for (const el of section.querySelectorAll(`[data-slot="${slot}"]`)) {
            out.push((el.textContent ?? "").trim());
          }
        }
        return out;
      },
      ["kpi-value", "v-bar-value", "h-bar-value", "donut-centre-value"],
    );

    expect(settled.length, "no figures to count from").toBeGreaterThan(5);
    expect(
      settled.filter(readsAsZero),
      "the section settled with a figure at zero",
    ).toEqual([]);

    await startSampler(page, { focus: HERO_1_SECTION });
    // Scoped to the section: the baseline canvas carries a Segmented of its
    // own, and only Hero 1's says "Current month" (`PERIOD_LABEL_OVERRIDE`).
    await page
      .locator(HERO_1_SECTION)
      .getByRole("radio", { name: PERIOD_CURRENT_MONTH })
      .click();
    await page.waitForTimeout(SETTLE_MS);
    const run = await stopSampler(page, { focus: HERO_1_SECTION });

    const frames = run.frames.filter((frame) => frame.figures.length > 0);
    expect(frames.length, "the filter press was not sampled").toBeGreaterThan(
      30,
    );

    // THE CRITERION. The first frame after the press still shows the figures
    // the presenter was looking at; `useCountUp` continues from them.
    expect(
      frames[0]!.figures,
      "the first frame after the press did not show the old figures",
    ).toEqual(settled);

    // NOTHING SNAPS TO ZERO — on any frame, for any figure, at any point in
    // the transition. This is the criterion's actual failure mode.
    const zeros = run.frames.flatMap((frame) =>
      frame.figures.filter(readsAsZero).map((text) => `${frame.t}ms: ${text}`),
    );
    expect(
      zeros.slice(0, 5),
      "a figure flashed back to zero on a filter change",
    ).toEqual([]);

    // It really did move: the run has to end somewhere else than it began.
    const last = frames.at(-1)!.figures;
    expect(last, "the filter changed nothing").not.toEqual(settled);
    const distinctFigures = distinct(
      run.frames.flatMap((frame) => [...frame.figures]),
    );
    expect(
      distinctFigures.length,
      "the figures snapped rather than counted",
    ).toBeGreaterThan(settled.length + 5);

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        `  FILTER: ${PERIOD_SEASON} -> ${PERIOD_CURRENT_MONTH}`,
        `    figures sampled        ${settled.length} per frame over ${run.frames.length} frames`,
        `    first frame after press ${frames[0]!.figures.slice(0, 4).join(" | ")}`,
        `    settled on             ${last.slice(0, 4).join(" | ")}`,
        `    distinct strings seen  ${distinctFigures.length}, zeros: 0`,
        "",
      ].join("\n"),
    );
  });
});

/* ================================================================ GROUP 5 == */

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("everything renders at final state and nothing is stuck at zero", async ({
    page,
  }) => {
    await openBaseline(page);

    // The beat still runs, and it is the SHORT one (~260ms).
    await startSampler(page, { focus: HERO_1_SECTION });
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    await page.waitForTimeout(600);
    const run = await stopSampler(page, { focus: HERO_1_SECTION });

    const panel = panelFrames(run);
    expect(panel.length, "the beat was skipped entirely").toBeGreaterThan(0);
    const beat = panel.at(-1)!.t - panel[0]!.t;
    expect(beat, "the reduced-motion beat is not the short one").toBeLessThan(
      600,
    );

    // NOTHING WAS EVER TRANSPARENT. Under the preference `app/app.css` states
    // the entrance's final state outright, so there is no fade to catch.
    const transparent = run.frames.filter((frame) =>
      frame.opacities.some((opacity) => opacity < 0.99),
    );
    expect(
      transparent.slice(0, 3).map((frame) => frame.opacities),
      "a tile faded in under reduced motion",
    ).toEqual([]);

    // And the whole script renders at final state, with no zeros anywhere.
    await loadDemoScript(page);
    const final = await page.evaluate(
      ({ figureSlots, rectSlots, dashSlots }) => {
        const zeroFigures: string[] = [];
        const zeroGeometry: string[] = [];
        let figures = 0;
        let geometry = 0;

        for (const slot of figureSlots) {
          for (const el of document.querySelectorAll(`[data-slot="${slot}"]`)) {
            const text = (el.textContent ?? "").trim();
            figures += 1;
            const digits = text.replace(/[^0-9]/g, "");
            if (digits.length > 0 && /^0+$/.test(digits)) {
              zeroFigures.push(`${slot}: ${text}`);
            }
          }
        }

        for (const { slot, axis } of rectSlots) {
          for (const el of document.querySelectorAll(`[data-slot="${slot}"]`)) {
            const box = el.getBoundingClientRect();
            const extent = axis === "width" ? box.width : box.height;
            geometry += 1;
            if (extent < 0.5) zeroGeometry.push(`${slot}: ${axis} ${extent}`);
          }
        }

        for (const slot of dashSlots) {
          for (const el of document.querySelectorAll(`[data-slot="${slot}"]`)) {
            const dash = Number.parseFloat(
              getComputedStyle(el).strokeDasharray,
            );
            geometry += 1;
            if (!(dash > 0)) zeroGeometry.push(`${slot}: dash ${dash}`);
          }
        }

        // Nothing may still be animating: under the preference every animation
        // and transition is collapsed to ~1ms.
        const running = document
          .getAnimations()
          .filter((animation) => animation.playState === "running").length;

        return {
          figures,
          geometry,
          zeroFigures,
          zeroGeometry,
          running,
          cardsAtZero: [
            ...document.querySelectorAll('[data-slot="card"]'),
          ].filter(
            (card) => Number.parseFloat(getComputedStyle(card).opacity) < 0.99,
          ).length,
          scanLines: [
            ...document.querySelectorAll('[data-slot="thinking-scan"]'),
          ].length,
        };
      },
      {
        figureSlots: [
          "kpi-value",
          "v-bar-value",
          "h-bar-value",
          "donut-centre-value",
          "attendance-ring-value",
          "compare-bar-value",
        ],
        rectSlots: [
          { slot: "h-bar-fill", axis: "width" },
          { slot: "v-bar", axis: "height" },
          { slot: "grouped-bar", axis: "height" },
          { slot: "compare-bar-fill", axis: "width" },
          { slot: "department-target-fill", axis: "width" },
        ],
        dashSlots: ["donut-arc", "attendance-ring-arc"],
      },
    );

    expect(
      final.figures,
      "no figures on the reduced-motion canvas",
    ).toBeGreaterThan(30);
    expect(
      final.geometry,
      "no geometry on the reduced-motion canvas",
    ).toBeGreaterThan(30);
    expect(final.zeroFigures, "a figure is stuck at zero").toEqual([]);
    expect(final.zeroGeometry, "geometry is stuck at zero").toEqual([]);
    expect(final.cardsAtZero, "a card is not at full opacity").toBe(0);
    expect(final.running, "something is still animating").toBe(0);

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "  REDUCED MOTION, full script",
        `    beat length            ${beat.toFixed(0)}ms (short beat)`,
        `    figures at final state ${final.figures}, zeros: 0`,
        `    geometry at final state ${final.geometry}, zeros: 0`,
        `    cards below opacity 1  ${final.cardsAtZero}`,
        `    animations running     ${final.running}`,
        "",
      ].join("\n"),
    );
  });
});

/* ================================================================ GROUP 6 == */

test.describe("frame budget", () => {
  /**
   * MEASURED ON THIS MACHINE, WHICH IS NOT THE DEMO MACHINE. An Apple M1
   * MacBook Pro is the instrument available; CPU throttling is the honest way
   * to say anything about hardware slower than it. Both readings are reported.
   */
  for (const rate of [1, 4, 6]) {
    test(`the reveal holds its frames at ${rate}x CPU cost`, async ({
      page,
    }) => {
      if (rate > 1) await throttleCpu(page, rate);
      await openBaseline(page);

      await startFrameClock(page);
      await tapChip(page, HERO_CHIP.shirts);
      await expectAnswerLanded(page, 1, 0);
      await page.waitForTimeout(SETTLE_MS);
      const hero = await stopFrameClock(page);

      await startFrameClock(page);
      await tapChip(page, FOLLOW_UP_CHIP.shirts);
      await expectAnswerLanded(page, 1, 1);
      await page.waitForTimeout(SETTLE_MS);
      const followUp = await stopFrameClock(page);

      // eslint-disable-next-line no-console
      console.log(
        [
          "",
          `  FRAME BUDGET at ${rate}x CPU cost (Apple M1, headless Chrome, built bundle)`,
          formatFrameClock(hero, "hero 1 reveal"),
          formatFrameClock(followUp, "hero 1 follow-up"),
          "",
        ].join("\n"),
      );

      // A reveal that cannot keep a frame under a third of a second is a
      // stutter the room would see. Deliberately loose at 6x: the point of the
      // throttled runs is the number in the report, not a tight bound on a
      // machine nobody is presenting from.
      const ceiling = rate === 1 ? 120 : 400;
      expect(
        hero.longestFrameMs,
        `${rate}x: the hero reveal dropped a long frame`,
      ).toBeLessThan(ceiling);
      expect(
        followUp.longestFrameMs,
        `${rate}x: the follow-up reveal dropped a long frame`,
      ).toBeLessThan(ceiling);
      expect(hero.frames, `${rate}x: no frames rendered`).toBeGreaterThan(20);
    });
  }
});

/* ================================================================ GROUP 7 == */

test.describe("KL-3 — a reload lands at the top of the page", () => {
  /**
   * The standing test for this story's own fix. State is memory-only, so a
   * reload starts a fresh session at the baseline — and before US-043 the SCROLL
   * OFFSET survived it, landing the presenter at the foot of a freshly cleared
   * canvas with the crest and Reset off screen (measured `scrollY 185` at
   * 1920x1080 and `340` at 1440x900, recorded as KL-3 by US-042).
   *
   * Two halves, and the test covers both: `<ScrollRestoration />` is gone from
   * `app/root.tsx`, and `history.scrollRestoration` is `manual` so Chrome's own
   * restoration cannot reproduce the offset either.
   */
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
  ]) {
    const label = `${viewport.width}x${viewport.height}`;

    test(`a reload after scrolling the full canvas starts at the top (${label})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await loadDemoScript(page);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const scrolled = await page.evaluate(() => window.scrollY);
      expect(scrolled, `${label}: the canvas did not scroll`).toBeGreaterThan(
        400,
      );

      await page.reload();

      // THE COSMETIC GATE RETURNS ON A RELOAD, and that is the documented
      // consequence of it being memory-only (US-046). KL-3's guarantee is
      // unchanged and is asserted below exactly as before: what the reload must
      // never do is restore a scroll offset. The offset is checked on the gate
      // FIRST, because a restoration would land there, and then again on the
      // dashboard once it is back.
      expect(
        await page.evaluate(() => window.scrollY),
        `${label}: the reload restored an offset onto the sign-in gate`,
      ).toBe(0);

      await signIn(page);
      await expect(page.locator(EMPTY_STATE)).toBeVisible();
      await page.waitForTimeout(400);

      const after = await page.evaluate(() => ({
        scrollY: window.scrollY,
        mode: history.scrollRestoration,
        sessionKeys: Object.keys(sessionStorage),
        crestTop: document
          .querySelector('[data-slot="top-bar"]')!
          .getBoundingClientRect().top,
        resetTop: document
          .querySelector('[data-slot="reset"]')!
          .getBoundingClientRect().top,
      }));

      expect(
        after.mode,
        `${label}: the browser still owns scroll restoration`,
      ).toBe("manual");
      expect(
        after.scrollY,
        `${label}: the reload restored a scroll offset`,
      ).toBe(0);
      // The app bar is the thing the presenter loses, so it is asserted by
      // name: crest and Reset both on screen, not merely a scrollY of zero.
      // The bar is NOT sticky (`app/components/chrome/top-bar.tsx`), which is
      // exactly why a restored offset took it away.
      expect(
        after.crestTop,
        `${label}: the app bar is off screen`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        after.crestTop,
        `${label}: the app bar is off screen`,
      ).toBeLessThan(2);
      expect(
        after.resetTop,
        `${label}: Reset is off screen`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        after.sessionKeys,
        `${label}: something is persisting session state`,
      ).toEqual([]);

      // And the freshly reloaded baseline works: the crest is up, the chips
      // are up, and the next question lands.
      await expect(page.locator(CREST)).toBeVisible();
      await tapChip(page, HERO_CHIP.shirts);
      await expectAnswerLanded(page, 1, 0);

      // eslint-disable-next-line no-console
      console.log(
        `\n  KL-3 at ${label}: scrolled to ${scrolled}, reloaded at scrollY ${after.scrollY}, ` +
          `mode "${after.mode}", sessionStorage keys ${after.sessionKeys.length}\n`,
      );
    });
  }

  test("Reset still returns the view to the top", async ({ page }) => {
    // `manual` restoration must not have taken the deliberate scrolls with it:
    // Reset scrolls to the top (US-015) and the reveal scrolls to the answer.
    await loadDemoScript(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(100);

    await page.getByRole("button", { name: RESET_LABEL }).click();
    await expect(page.locator(EMPTY_STATE)).toBeVisible();
    // Reset's scroll now waits out its own reflow tween (US-043), so this is
    // the 400ms tween plus the smooth scroll, with room to spare.
    await page.waitForTimeout(1_600);
    expect(
      await page.evaluate(() => window.scrollY),
      "Reset no longer returns to the top",
    ).toBe(0);
  });
});
