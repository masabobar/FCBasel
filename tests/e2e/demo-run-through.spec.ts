import { expect, test, type Page } from "@playwright/test";

import { BASE_URL } from "../../playwright.config";
import {
  BEAT_MS,
  expectAnswerLanded,
  FOLLOW_UP_CHIP,
  HERO_CHIP,
  PROMPT_INPUT_LABEL,
  RESET_LABEL,
  SEND_BUTTON_LABEL,
  tapChip,
} from "./support/demo-script";
import { recordNetwork, type NetworkLog } from "./support/network";
import {
  BASELINE_CARD_COUNT,
  expectAlive,
  expectBaselineAlive,
  readCanvas,
} from "./support/paths";
import {
  type Beat,
  expectStable,
  formatColdStart,
  formatSchedule,
  measureColdStart,
  resetInsideTheTween,
  scrollExcursion,
  startStabilityWatch,
  stopStabilityWatch,
  timedBeat,
  waitForRest,
} from "./support/run-of-show";
import { signIn } from "./support/sign-in";

/**
 * US-045 — the dress rehearsal, in the browser the demo is guaranteed on.
 *
 * REAL CHROME, NOT CHROMIUM, AND THAT IS THE POINT OF THIS FILE'S `test.use`.
 * `playwright.config.ts` uses `devices["Desktop Chrome"]`, which is a device
 * DESCRIPTOR — a viewport, a user-agent string and a touch profile. It selects
 * no browser channel, so US-040 to US-044 all ran against Playwright's BUNDLED
 * Chromium. That was the right instrument for measuring geometry and colour,
 * which are identical in both. It is not the right instrument for the criterion
 * this story is accountable for: "runs cleanly in Chrome (the demo guarantee)".
 * `channel: "chrome"` launches the Google Chrome installed on the machine —
 * Google's own build, with its own version, its own media stack and its own
 * default flags. The version is printed by the first case so the report can name
 * what was actually rehearsed on.
 *
 * 1920x1080, because that is what the phase says the room will see.
 *
 * WHAT THIS FILE DOES THAT THE OTHER SIXTY CASES DO NOT. Every existing case is
 * a probe: it opens the app, establishes one fact and closes it. A rehearsal is
 * the claim they cannot make between them — that the show holds together as ONE
 * CONTINUOUS SESSION in the order a presenter performs it, that the thing
 * survives being abused in the middle of that session, and that a machine which
 * has never seen the app can open it and use it. Four groups, one per remaining
 * criterion:
 *
 *   1. the run of show, one session, one console, with the clock running
 *   2. Reset abused — repeatedly, mid-beat, mid-reveal, mid-scroll, and
 *      followed instantly by the next question
 *   3. rapid repeated submits, by keyboard AND by the send button AND during a
 *      beat
 *   4. a cold start, in a browser context that has never seen the app
 *
 * CRITERION 5 IS NOT IN THIS FILE, AND DELIBERATELY SO. "The deployed shareable
 * URL loads cleanly from a cold start" needs a deployed shareable URL. The repo
 * is deploy-ready (`railway.json`, no env vars, no database) but nobody has run
 * `railway up` and `railway domain`, and `fcbasel.railway.internal` is a
 * PRIVATE-network name that does not resolve from outside Railway's own network.
 * Group 4 therefore measures the cold start against the local production build
 * and reports the numbers, so that when the public URL exists there is something
 * to compare it to. The criterion is recorded as deferred in
 * `.project-management/output/phases/phase-4.md`, alongside US-001's own open
 * deploy criterion, which is the same gap.
 */

test.use({
  channel: "chrome",
  viewport: { width: 1920, height: 1080 },
});

/* ------------------------------------------------------------ VOCABULARY -- */

const THINKING_PANEL = '[data-slot="thinking-panel"]';
const EMPTY_STATE = '[data-slot="empty-state-panel"]';
const FALLBACK = '[data-slot="fallback-panel"]';
const SECTION = '[data-slot="insight-section"]';

/** The most off-script thing a presenter is likely to be asked in the room. */
const OFF_SCRIPT_QUESTION = "what is the weather in basel";

/* --------------------------------------------------------------- DRIVERS -- */

/** Open the app with the console recorder attached, at the baseline. */
async function open(page: Page): Promise<NetworkLog> {
  const log = recordNetwork(page, BASE_URL);
  await page.goto("/", { waitUntil: "load" });
  await signIn(page);
  await expect(page.locator(EMPTY_STATE)).toBeVisible();
  await expect(page.locator('[data-slot="card"]')).toHaveCount(
    BASELINE_CARD_COUNT,
  );
  return log;
}

/** Nothing threw, anywhere in the session just performed. */
function expectQuietConsole(log: NetworkLog, at: string): void {
  expect(log.consoleErrors, `${at}: the console is not clean`).toEqual([]);
}

/** Press Reset without waiting for anything — the abuse cases need this. */
function pressResetNow(page: Page): Promise<void> {
  return page.getByRole("button", { name: RESET_LABEL }).click({ delay: 0 });
}

/* ================================================================ GROUP 1 == */

test.describe("criterion 1 and 2 — the run of show, one continuous session", () => {
  test("baseline, three heroes with follow-ups, off-script, reset", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    // Named in the output, because "runs cleanly in Chrome" is a claim about a
    // specific browser and the report has to say which one it was.
    const build = await page.evaluate(() => navigator.userAgent);
    // eslint-disable-next-line no-console
    console.log(
      `\n  REHEARSED ON: ${browser.browserType().name()} ${browser.version()} (channel "chrome")\n  ${build}\n`,
    );

    await expectBaselineAlive(page, "the presenter opens the URL");

    const beats: Beat[] = [];
    let sections = 0;
    let followUps = 0;

    // THE SHOW, IN THE ORDER A PRESENTER PERFORMS IT: each hero followed
    // straight away by its own follow-up, which is US-045 criterion 2's "three
    // heroes with follow-ups". US-041 asks the same six questions in the
    // Reference Guide's other order (all heroes, then all follow-ups); both are
    // rehearsed across the suite, and this is the one a room actually flows in.
    for (const hero of ["shirts", "tickets", "budgets"] as const) {
      sections += 1;
      beats.push(
        await timedBeat(
          page,
          `hero: ${HERO_CHIP[hero].slice(0, 30)}`,
          () => tapChip(page, HERO_CHIP[hero]),
          () => expectAnswerLanded(page, sections, followUps),
          { sections, followUps },
        ),
      );
      await expectAlive(page, `hero ${sections} landed`);

      followUps += 1;
      beats.push(
        await timedBeat(
          page,
          `follow-up: ${FOLLOW_UP_CHIP[hero].slice(0, 26)}`,
          () => tapChip(page, FOLLOW_UP_CHIP[hero]),
          () => expectAnswerLanded(page, sections, followUps),
          { sections, followUps },
        ),
      );
      await expectAlive(page, `follow-up ${followUps} landed`);
    }

    // THE QUESTION FROM THE FLOOR. No hero matches, so no beat runs at all
    // (`useThinking` is never reached) and the graceful fallback catches it —
    // with the six answers still on the canvas behind it.
    beats.push(
      await timedBeat(
        page,
        "off-script: from the floor",
        async () => {
          const field = page.getByLabel(PROMPT_INPUT_LABEL);
          await field.fill(OFF_SCRIPT_QUESTION);
          await field.press("Enter");
        },
        async () => {
          await expect(page.locator(FALLBACK)).toBeVisible();
          await expect(page.locator(SECTION)).toHaveCount(3);
        },
        { fallback: 1, sections: 3 },
      ),
    );
    const withFallback = await expectAlive(page, "off-script question");
    expect(
      withFallback.sections,
      "the off-script question disturbed the answers already on screen",
    ).toEqual([
      "HERO_1:withFollowUp",
      "HERO_2:withFollowUp",
      "HERO_3:withFollowUp",
    ]);

    // AND BACK TO THE START, which is how the demo ends and how a presenter
    // recovers from anything at all.
    beats.push(
      await timedBeat(
        page,
        "reset: back to the baseline",
        () => pressResetNow(page),
        async () => {
          await expect(page.locator(SECTION)).toHaveCount(0);
          await expect(page.locator(EMPTY_STATE)).toBeVisible();
        },
        { sections: 0, emptyState: 1 },
      ),
    );
    await expectBaselineAlive(page, "after the closing reset");
    expect(
      (await readCanvas(page)).scrollY,
      "the closing reset left the presenter scrolled down the page",
    ).toBe(0);

    // THE SHOW IS CONSISTENT BEAT TO BEAT. Each answered question takes about
    // the same time, so the room learns the product's rhythm rather than
    // wondering whether it has hung. The beat itself is ~1150ms by design
    // (`THINKING_DELAY_MS`); the bound below is that plus the reveal.
    const answered = beats.filter((beat) => beat.toPanelMs !== null);
    expect(answered, "no beat ran at all").toHaveLength(6);
    for (const beat of answered) {
      expect(
        beat.toPanelMs!,
        `${beat.label}: the thinking panel was slow to appear`,
        // Measured 10-35ms across the six beats. The press-to-panel gap is the
        // only part of the show a presenter can perceive as lag, because
        // everything after it is a deliberate ~1150ms beat.
      ).toBeLessThan(150);
      expect(
        beat.toAnswerMs,
        `${beat.label}: the answer landed early — the beat was skipped`,
      ).toBeGreaterThan(BEAT_MS * 0.6);
      expect(
        beat.toAnswerMs,
        `${beat.label}: the answer took longer than the room will wait`,
      ).toBeLessThan(4_000);
    }

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "  THE RUN OF SHOW, ONE CONTINUOUS SESSION (real Chrome, 1920x1080)",
        formatSchedule(beats),
        "",
      ].join("\n"),
    );

    expectQuietConsole(log, "the whole run of show");
  });
});

/* ================================================================ GROUP 2 == */

test.describe("criterion 3 — Reset under real abuse", () => {
  test("repeatedly, mid-beat, mid-reveal, mid-scroll, and straight into the next question", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const log = await open(page);

    // The watch runs across the WHOLE abuse session, not per press: the failure
    // this criterion names — a duplicate tile, two tweens on one tile, two
    // panels at once — is a thing that exists for a handful of frames between
    // two presses, and a check taken after the dust settles cannot see it.
    await startStabilityWatch(page);

    // (a) RESET SPAMMED ON A FULL CANVAS, with no settle between presses. Eight
    // presses inside the time one reflow takes.
    for (const hero of [HERO_CHIP.shirts, HERO_CHIP.tickets] as const) {
      await tapChip(page, hero);
    }
    await expectAnswerLanded(page, 1, 0);
    await tapChip(page, HERO_CHIP.budgets);
    await expectAnswerLanded(page, 2, 0);
    for (let press = 0; press < 8; press += 1) await pressResetNow(page);
    await expect(page.locator(EMPTY_STATE)).toBeVisible();

    // (b) RESET MID-BEAT — the pending answer must never arrive.
    await tapChip(page, HERO_CHIP.shirts);
    await expect(page.locator(THINKING_PANEL)).toBeVisible();
    await pressResetNow(page);
    await expect(page.locator(THINKING_PANEL)).toHaveCount(0);
    await page.waitForTimeout(BEAT_MS * 2);
    expect(
      await page.locator(SECTION).count(),
      "a beat cancelled by Reset landed its answer anyway",
    ).toBe(0);

    // (c) RESET MID-REVEAL — pressed in the same breath as the answer arriving,
    // so the clear's own view transition begins while the insertion's is still
    // tweening. The browser SKIPS the first transition when a second starts, and
    // a skipped tween must not strand a tile mid-flight.
    await tapChip(page, HERO_CHIP.tickets);
    await expectAnswerLanded(page, 1, 0);
    await pressResetNow(page);
    await expect(page.locator(EMPTY_STATE)).toBeVisible();

    // (d) RESET MID-SCROLL — AND THIS IS WHERE THE REHEARSAL FOUND ITS DEFECT.
    // The reveal's auto-scroll starts once the 400ms reflow tween ends
    // (US-043), and Reset's own scroll waits out its own tween for the same
    // reason — which left 400ms in which a reveal scroll still travelling had
    // the window to itself. Measured before the fix, Reset pressed while the
    // reveal's scroll was in flight: the CLEARED baseline glided down to its
    // own foot (scrollY 0 -> 233, the whole of the short page), sat there until
    // Reset's scroll was released at ~445ms and eased back to the top at
    // ~710ms. Both halves of the fix are in `app/lib/motion.ts`, and this is
    // their standing test: the excursion is what has to stay near zero, because
    // the SETTLED screen was correct all along and says nothing.
    await tapChip(page, HERO_CHIP.budgets);
    await expectAnswerLanded(page, 1, 0);
    await page.waitForTimeout(450);
    const midScroll = await scrollExcursion(page, () => pressResetNow(page));
    await expectBaselineAlive(page, "reset during the reveal's scroll");
    expect(
      midScroll.excursion,
      "Reset pressed mid-scroll sent the cleared baseline further down the page",
    ).toBeLessThan(20);
    expect(
      midScroll.settled,
      "Reset pressed during the reveal's scroll left the page part way down",
    ).toBe(0);

    // (d2) THE SAME PRESS, TIMED INSIDE THE REFLOW TWEEN — the second half of
    // the defect, and it needs the press scheduled in the page to land at all
    // (see `resetInsideTheTween`). Pressed 150ms after the answer appears, the
    // reveal's own scroll has been QUEUED on a tween that Reset is about to
    // skip. `afterReflow` used to run that queued scroll anyway — a skipped
    // transition REJECTS, and rejection was being read as completion — pointing
    // a fresh smooth scroll at the very section the press was removing.
    // Measured before the fix, at every offset from 50ms to 350ms: the cleared
    // baseline travelled to scrollY 233 and stayed there until ~440ms.
    const midTween = await resetInsideTheTween(page, 150, () =>
      tapChip(page, HERO_CHIP.shirts),
    );
    await expectBaselineAlive(page, "reset inside the reflow tween");
    expect(
      midTween.excursion,
      "a scroll queued on the superseded reflow ran after the canvas was cleared",
    ).toBeLessThan(20);
    expect(
      midTween.settled,
      "Reset pressed inside the reflow tween left the page part way down",
    ).toBe(0);

    // (e) RESET THEN IMMEDIATELY ASK, with no pause at all — the presenter who
    // clears and asks in one movement. The clear's reflow is still running when
    // the next question is submitted.
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    await pressResetNow(page);
    await tapChip(page, HERO_CHIP.tickets);
    await expectAnswerLanded(page, 1, 0);
    let reading = await expectAlive(page, "reset then asked immediately");
    expect(
      reading.sections,
      "asking straight after a Reset left the cleared answer behind",
    ).toEqual(["HERO_2:primary"]);

    // (f) TWO HEROES, RESET, THEN THE SAME HERO AGAIN — the shape that would
    // expose a section list that was cleared in the view but not in the
    // committed snapshot: the re-ask would append a second copy.
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 2, 0);
    await tapChip(page, HERO_CHIP.budgets);
    await expectAnswerLanded(page, 3, 0);
    await pressResetNow(page);
    await expect(page.locator(EMPTY_STATE)).toBeVisible();
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    await tapChip(page, FOLLOW_UP_CHIP.shirts);
    await expectAnswerLanded(page, 1, 1);
    reading = await expectAlive(page, "re-asked after a reset");
    expect(
      reading.sections,
      "a hero re-asked after a Reset duplicated its section",
    ).toEqual(["HERO_1:withFollowUp"]);

    // (g) AND RESET ONE LAST TIME, from a scrolled position, back to a baseline
    // that has to be indistinguishable from a fresh load.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await pressResetNow(page);
    await expect(page.locator(EMPTY_STATE)).toBeVisible();
    await waitForRest(page);
    await expectBaselineAlive(page, "the last reset");

    // Let the tail of the last transition run out before the watch is read: the
    // rest reading below is only meaningful once the canvas has settled.
    await page.waitForTimeout(1_000);
    const watch = await stopStabilityWatch(page);

    expectStable(watch, "Reset abused");
    expect(
      watch.frames.length,
      "the stability watch recorded nothing",
    ).toBeGreaterThan(500);
    // The canvas reached its full height at least once, so the watch was
    // looking at a real session and not at an empty page.
    expect(
      watch.peakCards,
      "the canvas never grew beyond the baseline during the abuse",
    ).toBeGreaterThan(BASELINE_CARD_COUNT);

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "  RESET UNDER ABUSE — 20 presses across 7 shapes, sampled every frame",
        `    frames watched               ${watch.frames.length}`,
        `    peak tiles on the canvas     ${watch.peakCards}`,
        `    beats started                ${watch.beats}`,
        `    duplicate sections           ${watch.duplicateSections.length}`,
        `    duplicate transition names   ${watch.duplicateNames.length}`,
        `    tiles tweened twice at once  ${watch.duplicateGroups.length}`,
        `    frames with two panels       ${watch.overlappingPanels.length}`,
        `    finite animations at rest    ${watch.restRunning}`,
        `    reset mid-scroll             pressed at scrollY ${midScroll.atPress}, peak ${midScroll.peak} (+${midScroll.excursion}), settled ${midScroll.settled} at ${midScroll.settledMs}ms`,
        `    reset inside the tween       pressed at scrollY ${midTween.atPress}, peak ${midTween.peak} (+${midTween.excursion}), settled ${midTween.settled} at ${midTween.settledMs}ms`,
        "",
      ].join("\n"),
    );

    expectQuietConsole(log, "Reset abused");
  });
});

/* ================================================================ GROUP 3 == */

test.describe("criterion 4 — rapid repeated submits stay debounced", () => {
  test("by keyboard, by the send button, and during a beat", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);
    await startStabilityWatch(page);

    const field = page.getByLabel(PROMPT_INPUT_LABEL);
    const send = page.getByRole("button", { name: SEND_BUTTON_LABEL });

    // (a) EIGHT ENTER PRESSES, back to back, on one typed question. The draft
    // is consumed by the first submit (`prompt-bar.tsx` clears the ref BEFORE
    // calling `onSubmit`), so presses two to eight read an empty draft and take
    // the no-op branch — and `busy` has closed the field behind them anyway.
    await field.fill("how are shirt sales going");
    for (let press = 0; press < 8; press += 1) {
      await field.press("Enter", { delay: 0 });
    }
    await expectAnswerLanded(page, 1, 0);
    await page.waitForTimeout(BEAT_MS * 2);
    let reading = await expectAlive(page, "eight Enter presses");
    expect(
      reading.sections,
      "eight rapid Enter presses produced more than one answer",
    ).toEqual(["HERO_1:primary"]);

    // (b) ENTER HELD DOWN. Not the same test: a held key auto-repeats in the
    // browser's own event loop rather than in Playwright's, so the repeats
    // arrive at whatever rate the OS produces them.
    await pressResetNow(page);
    await expect(page.locator(EMPTY_STATE)).toBeVisible();
    await field.fill("ticket revenue this year vs last year");
    await field.press("Enter", { delay: 0 });
    await page.keyboard.down("Enter");
    await page.waitForTimeout(900);
    await page.keyboard.up("Enter");
    await expectAnswerLanded(page, 1, 0);
    await page.waitForTimeout(BEAT_MS * 2);
    reading = await expectAlive(page, "Enter held down");
    expect(
      reading.sections,
      "a held Enter produced more than one answer",
    ).toEqual(["HERO_2:primary"]);

    // (c) THE SEND BUTTON, HAMMERED. The first press disables the button for
    // the length of the beat, so a real pointer cannot reach it again — which is
    // exactly what has to be proved rather than assumed. The first click is a
    // real one; the rest are dispatched at the element, which travels the same
    // React listener a hardware click ends at, so "the button ignores this" is
    // genuinely tested rather than skipped by actionability.
    await pressResetNow(page);
    await expect(page.locator(EMPTY_STATE)).toBeVisible();
    await field.fill("department budgets versus actuals");
    await send.click({ delay: 0 });
    const refused = await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>(
        '[data-slot="prompt-send"]',
      )!;
      const form = document.querySelector<HTMLFormElement>(
        '[data-slot="prompt-form"]',
      )!;
      for (let press = 0; press < 8; press += 1) {
        button.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        );
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
      return {
        disabled: button.disabled,
        busy: form.getAttribute("aria-busy"),
      };
    });
    expect(
      refused,
      "the send button stayed open while its own beat was running",
    ).toEqual({ disabled: true, busy: "true" });
    await expectAnswerLanded(page, 1, 0);
    await page.waitForTimeout(BEAT_MS * 2);
    reading = await expectAlive(page, "the send button hammered");
    expect(
      reading.sections,
      "hammering the send button produced more than one answer",
    ).toEqual(["HERO_3:primary"]);

    // (d) SUBMITTING DURING SOMEONE ELSE'S BEAT. A chip tap is deliberately
    // still available mid-beat and REPLACES the pending beat (one timer in the
    // whole application); a typed submit is refused outright. Both are asserted
    // here, because "debounced" means neither can produce a second answer.
    await pressResetNow(page);
    await expect(page.locator(EMPTY_STATE)).toBeVisible();
    await field.fill("how are shirt sales going");
    await field.press("Enter", { delay: 0 });
    await expect(page.locator(THINKING_PANEL)).toBeVisible();
    const midBeat = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-slot="prompt-input"]',
      )!;
      const form = document.querySelector<HTMLFormElement>(
        '[data-slot="prompt-form"]',
      )!;
      for (let press = 0; press < 6; press += 1) {
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
      return { disabled: input.disabled, value: input.value };
    });
    expect(
      midBeat,
      "the field stayed open, and holding its text, during a beat",
    ).toEqual({ disabled: true, value: "" });
    await expectAnswerLanded(page, 1, 0);
    await page.waitForTimeout(BEAT_MS * 2);
    reading = await expectAlive(page, "submits during a beat");
    expect(
      reading.sections,
      "a submit during a beat produced a second answer",
    ).toEqual(["HERO_1:primary"]);

    await page.waitForTimeout(1_000);
    const watch = await stopStabilityWatch(page);
    expectStable(watch, "rapid repeated submits");

    // FOUR QUESTIONS WERE ASKED, so exactly four beats may have run — 30-odd
    // submit attempts, four panels. This is the criterion as a count.
    expect(
      watch.beats,
      "more beats ran than questions were asked: a submit got through",
    ).toBe(4);

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "  DEBOUNCE UNDER REAL USE",
        "    8 Enter presses            -> 1 answer",
        "    Enter held for ~900ms      -> 1 answer",
        "    1 click + 8 dispatched clicks + 8 submits -> 1 answer",
        "    6 submits during a beat    -> 1 answer",
        `    beats started in total     ${watch.beats} (four questions asked)`,
        `    duplicate sections         ${watch.duplicateSections.length}`,
        `    finite animations at rest  ${watch.restRunning}`,
        "",
      ].join("\n"),
    );

    expectQuietConsole(log, "rapid repeated submits");
  });
});

/* ================================================================ GROUP 4 == */

test.describe("cold start", () => {
  /**
   * CRITERION 5 IS ABOUT THE DEPLOYED URL AND THERE IS NOT ONE YET. This case
   * measures the same thing against the local production build — the identical
   * SSR bundle Railway would serve, from `react-router-serve` — so the numbers
   * exist to compare the deployed URL to on the day it is created. It does not
   * and cannot close criterion 5.
   */
  test("a browser that has never seen the app opens it and answers a press", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const { cold, consoleErrors } = await measureColdStart(
      browser,
      `${BASE_URL}/`,
      HERO_CHIP.shirts,
      { width: 1920, height: 1080 },
    );

    expect(consoleErrors, "the cold start logged a console error").toEqual([]);
    expect(
      cold.firstContentfulPaintMs,
      "the page never reported a contentful paint",
    ).not.toBeNull();
    expect(
      cold.firstContentfulPaintMs!,
      "first contentful paint is slow enough for the room to notice",
    ).toBeLessThan(2_000);
    expect(
      cold.interactiveMs,
      "the app took too long to answer its first press",
    ).toBeLessThan(10_000);
    // Every byte is served from the bundle, so a cold start is a fixed, small,
    // knowable cost. A number that has grown by an order of magnitude means
    // something started being fetched that was not before.
    expect(
      cold.transferredBytes,
      "the cold start transferred far more than the bundle",
    ).toBeLessThan(5 * 1024 * 1024);

    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        formatColdStart(cold, "local production build, fresh context"),
        "    (criterion 5 needs the deployed Railway URL — see phase-4.md)",
        "",
      ].join("\n"),
    );
  });
});
