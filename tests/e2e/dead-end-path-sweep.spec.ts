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
  askFromBaseline,
  askTyped,
  BASELINE_CARD_COUNT,
  buildFullCanvas,
  clickEveryCanvasSlot,
  expectAlive,
  expectBaselineAlive,
  focusTabStop,
  NO_OP_INPUTS,
  OFF_SCRIPT_INPUTS,
  PARAPHRASES,
  PREPARED_CHIP_COUNT,
  pressReset,
  readCanvas,
  readStorage,
  SETTLE_MS,
  tabRing,
  TIE_BREAKS,
} from "./support/paths";

/**
 * US-042 — the dead-end path sweep. Every path leads somewhere.
 *
 * WHY THIS FILE EXISTS AND WHAT IT IS ACCOUNTABLE FOR. The client's framing is
 * that "the experience feels instant and flawless; nothing stutters or
 * dead-ends, even when someone types a question off-script". The owner typing
 * something unprepared in front of the room is the live, unrecoverable moment,
 * and this file is where "every path leads somewhere" stops being a hope and
 * becomes a standing measurement a future change cannot silently break.
 *
 * IT DOES NOT REPEAT THE UNIT SUITES, IT COVERS WHAT THEY STRUCTURALLY CANNOT.
 * US-030 already pins the matcher over a 90-phrase corpus with 34 paraphrases
 * and six tie cases; US-033 pins the two-step cold follow-up over all 27
 * session shapes; US-032 pins the fallback copy and the absence of blame
 * language. All three run in jsdom against modules. What jsdom cannot express
 * is the thing US-041 actually found: a framework-level navigation that
 * replaced the whole dashboard with an ERROR BOUNDARY from one click on the
 * sidebar. So every case here drives the SERVED SSR BUNDLE in real Chrome, and
 * every case ends at `expectAlive` — the three-part definition of dead-end-free
 * in `./support/paths.ts`.
 *
 * THE SURFACE IS WIDER THAN THE PROMPT BAR, which is US-041's lesson written
 * down. Nobody had ever exercised the sidebar's Dashboard link before it was
 * measured, and it was the one navigable element in the product. This sweep
 * therefore walks the WHOLE interactive surface: the six chips, the field, the
 * Reset control, the sidebar's link and its three inert placeholders, the
 * app-bar chrome, every element on the canvas that answers a press, every
 * keyboard-reachable stop, and the browser's own reload, back and forward.
 *
 * EVERY CASE ALSO ASSERTS AN EMPTY CONSOLE. `./support/network.ts`'s recorder
 * is attached before the first `goto` in every test, so a console error or an
 * uncaught page error raised anywhere along a path fails the case that caused
 * it rather than being discovered later by a human watching devtools.
 */

/* ---------------------------------------------------------------- SETUP -- */

/** The projector. Path behaviour is not viewport-dependent; US-040 owns geometry. */
test.use({ viewport: { width: 1920, height: 1080 } });

/**
 * Load the page with the console recorder attached.
 *
 * The recorder is `./support/network.ts`'s, reused rather than reimplemented:
 * US-041 built it to prove nothing is REQUESTED, and it happens to carry
 * exactly the console and page-error capture this story needs to prove nothing
 * THROWS.
 */
async function open(page: Page): Promise<NetworkLog> {
  const log = recordNetwork(page, BASE_URL);
  await page.goto("/", { waitUntil: "load" });
  await expect(page.locator('[data-slot="empty-state-panel"]')).toBeVisible();
  await expect(page.locator('[data-slot="card"]')).toHaveCount(
    BASELINE_CARD_COUNT,
  );
  return log;
}

/** Nothing threw, anywhere along the path just walked. */
function expectQuietConsole(log: NetworkLog, at: string): void {
  expect(log.consoleErrors, `${at}: the console is not clean`).toEqual([]);
}

/* -------------------------------------------- 1. THE SCRIPTED SIX PATHS -- */

test.describe("criterion 1 — every scripted path leaves the screen alive", () => {
  test("each hero, each follow-up, off-script, empty input and reset", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    await expectBaselineAlive(page, "baseline");

    // The three heroes, each asserted alive as it lands.
    let heroes = 0;
    for (const chip of [
      HERO_CHIP.shirts,
      HERO_CHIP.tickets,
      HERO_CHIP.budgets,
    ]) {
      await tapChip(page, chip);
      heroes += 1;
      await expectAnswerLanded(page, heroes, 0);
      await expectAlive(page, `hero ${heroes}`);
    }

    // The three follow-ups, in the order the Reference Guide presents them —
    // all three heroes first, so a follow-up has to find a parent that is not
    // the section just rendered.
    let followUps = 0;
    for (const chip of [
      FOLLOW_UP_CHIP.shirts,
      FOLLOW_UP_CHIP.tickets,
      FOLLOW_UP_CHIP.budgets,
    ]) {
      await tapChip(page, chip);
      followUps += 1;
      await expectAnswerLanded(page, heroes, followUps);
      await expectAlive(page, `follow-up ${followUps}`);
    }

    // Off-script, with the canvas at its fullest — the worst moment for it.
    await askTyped(page, "what is the weather in basel");
    await expect(page.locator('[data-slot="fallback-panel"]')).toBeVisible();
    const missed = await expectAlive(page, "off-script over a full canvas");
    expect(missed.sections, "off-script removed an answer").toHaveLength(3);

    // Empty input, immediately after the miss: the panel stays, nothing moves.
    await page.getByRole("button", { name: SEND_BUTTON_LABEL }).click();
    await page.waitForTimeout(500);
    const afterEmpty = await expectAlive(page, "empty submit");
    expect(afterEmpty.fallback, "empty submit dropped the fallback").toBe(1);
    expect(afterEmpty.sections, "empty submit changed the answers").toEqual(
      missed.sections,
    );

    // Reset, back to the four tiles and the invitation.
    await pressReset(page);
    await expectBaselineAlive(page, "after reset");

    expectQuietConsole(log, "the scripted six");
  });
});

/* --------------------------------------------------- 2. THE TYPED PATHS -- */

test.describe("criteria 2, 3, 5, 6 — the typed path", () => {
  test("every paraphrase resolves to its intended hero, and to no other", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    for (const [hero, questions] of Object.entries(PARAPHRASES)) {
      for (const question of questions) {
        const reading = await askFromBaseline(page, question);
        expect(
          reading.sections,
          `"${question}" should render ${hero} and nothing else`,
        ).toEqual([`${hero}:primary`]);
        expect(reading.fallback, `"${question}" fell through`).toBe(0);
        await expectAlive(page, `paraphrase "${question}"`);
      }
    }

    expectQuietConsole(log, "paraphrases");
  });

  test("the most off-script input imaginable lands on the graceful fallback", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    for (const question of OFF_SCRIPT_INPUTS) {
      const label = `off-script ${JSON.stringify(question.slice(0, 40))}`;
      await pressReset(page);
      await askTyped(page, question);

      // No beat for a miss — the fallback is immediate
      // (`askQuestion` calls no dashboard action, `app/lib/dashboard/intents.ts`).
      await expect(
        page.locator('[data-slot="fallback-panel"]'),
        `${label}: panel`,
      ).toBeVisible();
      const reading = await expectAlive(page, label);
      expect(reading.thinking, `${label}: a beat was shown`).toBe(0);
      expect(reading.sections, `${label}: an answer was rendered`).toEqual([]);

      // THE NEXT STEP IS INSIDE THE PANEL: the three prepared questions again,
      // where the eye already is (US-032 criterion 3).
      await expect(
        page.locator(
          '[data-slot="fallback-panel"] [data-slot="suggestion-chip"]',
        ),
        `${label}: the panel re-offers the prepared questions`,
      ).toHaveCount(PREPARED_CHIP_COUNT);

      // AND THE QUESTION IS NEVER QUOTED BACK. The panel takes no question
      // text at all, so a payload cannot reach the page even as plain text.
      const fragment = question.trim().slice(0, 30);
      if (fragment.length > 3) {
        await expect(
          page.locator("body"),
          `${label}: the question was echoed into the page`,
        ).not.toContainText(fragment);
      }
    }

    // Every path out of the fallback lands an answer, from inside the panel.
    for (const index of [0, 1, 2]) {
      await pressReset(page);
      await askTyped(page, "completely off script");
      await expect(page.locator('[data-slot="fallback-panel"]')).toBeVisible();
      await page
        .locator('[data-slot="fallback-panel"] [data-slot="suggestion-chip"]')
        .nth(index)
        .click();
      await expectAnswerLanded(page, 1, 0);
      const reading = await expectAlive(page, `fallback chip ${index}`);
      expect(reading.fallback, `fallback chip ${index}: panel lingered`).toBe(
        0,
      );
    }

    expectQuietConsole(log, "off-script");
  });

  test("empty and whitespace-only input is a no-op with the chips still visible", async ({
    page,
  }) => {
    const log = await open(page);

    for (const question of NO_OP_INPUTS) {
      const label = `no-op ${JSON.stringify(question)}`;
      const before = await readCanvas(page);

      const field = page.getByLabel(PROMPT_INPUT_LABEL);
      await field.fill(question);
      await field.press("Enter");
      await page.waitForTimeout(400);
      // The send button too, not only Enter: one form, but two affordances.
      await page.getByRole("button", { name: SEND_BUTTON_LABEL }).click();
      await page.waitForTimeout(400);

      const after = await expectAlive(page, label);
      expect(after.sections, `${label}: an answer appeared`).toEqual(
        before.sections,
      );
      expect(after.fallback, `${label}: the fallback appeared`).toBe(0);
      expect(after.thinking, `${label}: a beat was started`).toBe(0);
      expect(after.emptyState, `${label}: the invitation went away`).toBe(1);
      expect(after.promptChips, `${label}: the chips moved`).toEqual([
        "hero",
        "hero",
        "hero",
      ]);
    }

    // And with an answer on screen, where "no-op" has more to leave alone.
    await tapChip(page, HERO_CHIP.tickets);
    await expectAnswerLanded(page, 1, 0);
    const withAnswer = await readCanvas(page);
    await askTyped(page, "   ");
    await page.waitForTimeout(600);
    const after = await expectAlive(page, "no-op over an answer");
    expect(after.sections, "no-op over an answer changed it").toEqual(
      withAnswer.sections,
    );
    expect(after.promptChips, "no-op over an answer moved the chips").toEqual(
      withAnswer.promptChips,
    );

    expectQuietConsole(log, "empty input");
  });

  test("two subjects in one breath render exactly one hero, deterministically", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    for (const { question, hero } of TIE_BREAKS) {
      // Asked twice, from the same baseline, because the criterion is
      // DETERMINISM and a single run cannot tell a fixed order from a lucky one.
      const first = await askFromBaseline(page, question);
      const second = await askFromBaseline(page, question);

      expect(first.sections, `"${question}": two heroes rendered`).toHaveLength(
        1,
      );
      expect(first.sections, `"${question}": wrong hero`).toEqual([
        `${hero}:primary`,
      ]);
      expect(second.sections, `"${question}": not deterministic`).toEqual(
        first.sections,
      );
      await expectAlive(page, `tie-break "${question}"`);
    }

    expectQuietConsole(log, "tie-breaks");
  });
});

/* ------------------------------------------------- 4. THE COLD FOLLOW-UP -- */

test.describe("criterion 4 — a follow-up asked before its parent", () => {
  test("renders the parent first, then offers the follow-up chip", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    // No follow-up is OFFERED before its parent: the chip row is derived from
    // the sections on screen, and there are none (`app/lib/dashboard/chips.ts`).
    await expect(
      page.locator('[data-slot="suggestion-chip"][data-kind="followUp"]'),
      "a follow-up chip was offered at the baseline",
    ).toHaveCount(0);

    const cold = [
      { hero: "HERO_1", question: "which sponsor badge should we push next" },
      { hero: "HERO_2", question: "which fixtures are driving the drop" },
      {
        hero: "HERO_3",
        question: "why is marketing over budget and behind target",
      },
    ] as const;

    for (const { hero, question } of cold) {
      await pressReset(page);
      await askTyped(page, question);
      await expectAnswerLanded(page, 1, 0);

      // THE PARENT RENDERED, at `primary` — not the follow-up, not an error,
      // not nothing (`app/lib/dashboard/follow-up-gate.ts`).
      const gated = await expectAlive(page, `${hero} asked cold`);
      expect(gated.sections, `${hero} asked cold: the parent`).toEqual([
        `${hero}:primary`,
      ]);

      // AND THE FOLLOW-UP IS NOW OFFERED. The parent landing at `primary` IS
      // the offer; there is no queue and no pending question.
      expect(
        gated.promptChips,
        `${hero} asked cold: the follow-up is offered`,
      ).toEqual(["hero", "hero", "hero", "followUp"]);
      const chip =
        FOLLOW_UP_CHIP[
          hero === "HERO_1"
            ? "shirts"
            : hero === "HERO_2"
              ? "tickets"
              : "budgets"
        ];
      await expect(
        page.getByRole("button", { name: chip }),
        `${hero} asked cold: the chip is on screen`,
      ).toHaveCount(1);

      // Taking the offer sharpens the same section rather than appending one.
      await tapChip(page, chip);
      await expectAnswerLanded(page, 1, 1);
      const sharpened = await expectAlive(page, `${hero} follow-up taken`);
      expect(sharpened.sections, `${hero}: the section was sharpened`).toEqual([
        `${hero}:withFollowUp`,
      ]);
      // Spent: the chip is no longer derived, so it is no longer on screen.
      expect(sharpened.promptChips, `${hero}: the spent chip went`).toEqual([
        "hero",
        "hero",
        "hero",
      ]);
    }

    expectQuietConsole(log, "cold follow-ups");
  });
});

/* --------------------------------------------------- 5. THE WHOLE CHROME -- */

test.describe("the chrome — US-041's lesson, kept", () => {
  test("the sidebar's Dashboard link stays inert but safe, with a full canvas", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);
    await buildFullCanvas(page);
    const before = await expectAlive(page, "before the Dashboard press");
    expect(before.sections, "the canvas is not full").toHaveLength(3);

    /**
     * THE PRESS THAT ONCE DESTROYED THE DEMO. This link is a `<Link to="/">`
     * and the presenter is always already on that route, but React Router
     * treated a press as a navigation and revalidated — `GET /_root.data` —
     * which offline failed and replaced the entire dashboard with an error
     * boundary. Both routes now decline to revalidate. Pressed FIVE TIMES here,
     * at the fullest the canvas gets, and asserted to change nothing at all:
     * no answer lost, no history entry added, no request, no boundary.
     */
    const historyBefore = await page.evaluate(() => history.length);
    for (let press = 0; press < 5; press += 1) {
      await page.getByRole("link", { name: "Dashboard" }).click();
      await page.waitForTimeout(300);
      const after = await expectAlive(page, `Dashboard press ${press + 1}`);
      expect(
        after.sections,
        `Dashboard press ${press + 1}: an answer was lost`,
      ).toEqual(before.sections);
      expect(after.cards, `Dashboard press ${press + 1}: a tile was lost`).toBe(
        before.cards,
      );
    }
    expect(
      await page.evaluate(() => history.length),
      "the Dashboard link pushed history entries",
    ).toBe(historyBefore);

    // The three placeholders (US-012): plain `<span>`s with
    // `pointer-events: none`, so a press cannot reach them and they are not in
    // the tab ring. Asserted with the REAL mouse, forced, which is the only way
    // to prove hit-testing rather than the absence of a handler.
    for (const label of ["Reports", "Data Sources", "Settings"]) {
      const item = page.locator('[data-slot="nav-inert"]', { hasText: label });
      await expect(item, `${label}: not a link`).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(
        await item.evaluate((el) => ({
          tag: el.tagName.toLowerCase(),
          pointerEvents: getComputedStyle(el).pointerEvents,
          tabIndex: (el as HTMLElement).tabIndex,
          href: el.getAttribute("href"),
        })),
        `${label}: structurally inert`,
      ).toEqual({
        tag: "span",
        pointerEvents: "none",
        tabIndex: -1,
        href: null,
      });

      await item.click({ force: true });
      await page.waitForTimeout(200);
      const after = await expectAlive(page, `${label} pressed`);
      expect(after.sections, `${label}: it did something`).toEqual(
        before.sections,
      );
      expect(page.url(), `${label}: it navigated`).toBe(`${BASE_URL}/`);
    }

    expectQuietConsole(log, "the sidebar");
  });

  test("no app-bar chrome answers a press", async ({ page }) => {
    test.setTimeout(120_000);
    const log = await open(page);
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    const before = await readCanvas(page);

    for (const selector of [
      '[data-slot="app-shell"] img[alt="FC Basel 1893"]',
      '[data-slot="workspace-label"]',
      '[data-slot="connection-status"]',
      '[data-slot="avatar"]',
      '[data-slot="top-bar"]',
      '[data-slot="sidebar"]',
      '[data-slot="canvas"]',
    ]) {
      await page
        .locator(selector)
        .first()
        .click({ force: true, position: { x: 2, y: 2 } });
      await page.waitForTimeout(200);
      const after = await expectAlive(page, `pressed ${selector}`);
      expect(after.sections, `${selector}: it did something`).toEqual(
        before.sections,
      );
    }

    expectQuietConsole(log, "the app bar");
  });

  test("nothing on the canvas is clickable into a broken state", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);
    await buildFullCanvas(page);
    const before = await expectAlive(page, "before clicking the canvas");

    const clicked = await clickEveryCanvasSlot(page);
    // A canvas at its fullest carries well over a hundred distinct slots; a
    // handful would mean the sweep silently found nothing to click.
    expect(clicked.length, "canvas slots clicked").toBeGreaterThan(100);
    await page.waitForTimeout(SETTLE_MS);

    const after = await expectAlive(page, "after clicking every canvas slot");
    expect(after.sections, "a canvas press changed the answers").toEqual(
      before.sections,
    );
    expect(after.cards, "a canvas press changed the tiles").toBe(before.cards);

    // eslint-disable-next-line no-console
    console.log(`clicked ${clicked.length} canvas slots, nothing broke`);
    expectQuietConsole(log, "the canvas");
  });
});

/* ------------------------------------------------------- 6. THE KEYBOARD -- */

test.describe("keyboard-only traversal", () => {
  /**
   * Walk the ring, then activate EVERY stop in it.
   *
   * The ring is walked first and then re-entered by index, rather than
   * activated as it is walked, because activating a chip changes the ring: the
   * point is that every stop a presenter can REACH is safe to PRESS, measured
   * against the screen that stop was reached on.
   */
  async function sweepRing(
    page: Page,
    rebuild: () => Promise<void>,
    label: string,
  ): Promise<void> {
    const ring = await tabRing(page);
    expect(ring.length, `${label}: the ring is empty`).toBeGreaterThan(5);

    // NO FOCUS TRAP. The ring closed on its own, which means Tab either wrapped
    // to the first stop or left the page for the browser's chrome. A trap would
    // have run to the 200-press cap.
    expect(ring.length, `${label}: focus is trapped`).toBeLessThan(200);

    // A FOCUS RING ON EVERYTHING BUT THE FIELD. The prompt input's own outline
    // is suppressed by design — the field around it draws one ring on
    // `:focus-within`, so a nested box is not drawn twice
    // (`PROMPT_FIELD_CLASS` in `app/components/chrome/prompt-bar.tsx`).
    expect(
      ring.filter((stop) => stop.outline === "none").map((stop) => stop.slot),
      `${label}: a stop has no focus outline`,
    ).toEqual(["prompt-input"]);

    for (let index = 0; index < ring.length; index += 1) {
      const before = await readCanvas(page);
      const who = await focusTabStop(page, index);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(SETTLE_MS);
      await expectAlive(page, `${label}: Enter on ${who}`);

      // Space too, where the stop is a button: a `<button>` answers both, and a
      // stop that answered one and threw on the other would be a real defect.
      await focusTabStop(page, index);
      await page.keyboard.press("Space");
      await page.waitForTimeout(SETTLE_MS);
      await expectAlive(page, `${label}: Space on ${who}`);

      const after = await readCanvas(page);
      if (
        JSON.stringify(after.sections) !== JSON.stringify(before.sections) ||
        after.cards !== before.cards
      ) {
        // The stop did something — a chip, or Reset. Put the screen back so the
        // next stop is measured against the same starting state.
        await pressReset(page);
        await rebuild();
      }
    }
  }

  test("every stop reachable at the baseline is safe to activate", async ({
    page,
  }) => {
    test.setTimeout(300_000);
    const log = await open(page);
    await sweepRing(page, async () => {}, "baseline");
    await expectAlive(page, "after the baseline ring sweep");
    expectQuietConsole(log, "the baseline ring");
  });

  test("every stop reachable on a full canvas is safe to activate", async ({
    page,
  }) => {
    test.setTimeout(600_000);
    const log = await open(page);
    await buildFullCanvas(page);
    await sweepRing(page, () => buildFullCanvas(page), "full canvas");
    await expectAlive(page, "after the full-canvas ring sweep");
    expectQuietConsole(log, "the full-canvas ring");
  });

  test("the whole demo can be driven by keyboard alone", async ({ page }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    // Tab to the chip row and take all three prepared questions by keyboard.
    for (const chip of [
      HERO_CHIP.shirts,
      HERO_CHIP.tickets,
      HERO_CHIP.budgets,
    ]) {
      await page.getByRole("button", { name: chip }).first().focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(SETTLE_MS);
    }
    await expectAnswerLanded(page, 3, 0);

    // Then each follow-up, and then a typed question, all from the keyboard.
    for (const chip of [
      FOLLOW_UP_CHIP.shirts,
      FOLLOW_UP_CHIP.tickets,
      FOLLOW_UP_CHIP.budgets,
    ]) {
      await page.getByRole("button", { name: chip }).first().focus();
      await page.keyboard.press("Space");
      await page.waitForTimeout(SETTLE_MS);
    }
    await expectAnswerLanded(page, 3, 3);

    await page.getByLabel(PROMPT_INPUT_LABEL).focus();
    await page.keyboard.type("how are shirt sales going");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await expectAlive(page, "keyboard-typed question");

    // And Reset, by keyboard, back to the baseline.
    await page.getByRole("button", { name: RESET_LABEL }).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await expectBaselineAlive(page, "keyboard reset");

    expectQuietConsole(log, "keyboard-only demo");
  });
});

/* ---------------------------------------------------------- 7. THE RESET -- */

test.describe("the Reset control", () => {
  test("survives repetition, a mid-beat press, and a fully scrolled canvas", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    // Pressed with nothing to reset — a no-op all the way down.
    for (let press = 0; press < 5; press += 1) await pressReset(page);
    await expectBaselineAlive(page, "reset with nothing to clear");

    // Pressed repeatedly with a full canvas.
    await buildFullCanvas(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    for (let press = 0; press < 6; press += 1) await pressReset(page);
    await expectBaselineAlive(page, "reset spam over a full canvas");
    // Reset drives the window, so the presenter is looking at the top again.
    expect(
      (await readCanvas(page)).scrollY,
      "reset left the page scrolled",
    ).toBeLessThan(50);

    // Pressed MID-BEAT, repeatedly, and the pending beat must never land.
    await tapChip(page, HERO_CHIP.budgets);
    await expect(page.locator('[data-slot="thinking-panel"]')).toBeVisible();
    for (let press = 0; press < 6; press += 1) {
      await page.getByRole("button", { name: RESET_LABEL }).click();
    }
    await page.waitForTimeout(BEAT_MS * 2);
    await expectBaselineAlive(page, "reset spam mid-beat, beat elapsed");

    // Pressed while the fallback is showing.
    await askTyped(page, "utterly off script");
    await expect(page.locator('[data-slot="fallback-panel"]')).toBeVisible();
    await pressReset(page);
    await expectBaselineAlive(page, "reset over the fallback");

    expectQuietConsole(log, "reset");
  });
});

/* ------------------------------------------------- 8. OVERLAPPING PRESSES -- */

test.describe("rapid and overlapping questions", () => {
  test("land exactly one answer and never a duplicate section", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    // A chip double-tapped: one section, not two.
    await page
      .getByRole("button", { name: HERO_CHIP.shirts })
      .first()
      .dblclick();
    await page.waitForTimeout(SETTLE_MS * 2);
    let reading = await expectAlive(page, "hero chip double-tapped");
    expect(reading.sections, "double-tap duplicated a section").toEqual([
      "HERO_1:primary",
    ]);

    // A FOLLOW-UP chip double-tapped — the second press lands on a chip that
    // the first press has already taken off the row.
    await page
      .getByRole("button", { name: FOLLOW_UP_CHIP.shirts })
      .first()
      .dblclick();
    await page.waitForTimeout(SETTLE_MS * 2);
    reading = await expectAlive(page, "follow-up chip double-tapped");
    expect(reading.sections, "double-tap duplicated a follow-up").toEqual([
      "HERO_1:withFollowUp",
    ]);

    // Three chips as fast as the mouse allows. One timer exists in the whole
    // application, so each tap REPLACES the pending beat rather than racing it
    // — exactly one answer lands, and it is the last one asked.
    await pressReset(page);
    for (const chip of [
      HERO_CHIP.shirts,
      HERO_CHIP.tickets,
      HERO_CHIP.budgets,
    ]) {
      await page
        .getByRole("button", { name: chip })
        .first()
        .click({ delay: 0 });
    }
    await page.waitForTimeout(SETTLE_MS * 2);
    reading = await expectAlive(page, "three chips in a row");
    expect(reading.sections, "overlapping chips left a partial canvas").toEqual(
      ["HERO_3:primary"],
    );

    // A chip tapped DURING another chip's beat.
    await pressReset(page);
    await tapChip(page, HERO_CHIP.shirts);
    await expect(page.locator('[data-slot="thinking-panel"]')).toBeVisible();
    await tapChip(page, HERO_CHIP.tickets);
    await page.waitForTimeout(SETTLE_MS * 2);
    reading = await expectAlive(page, "chip tapped mid-beat");
    expect(reading.sections, "a mid-beat tap left two answers").toEqual([
      "HERO_2:primary",
    ]);

    // Enter held down in the field: the draft is consumed by the first submit
    // and the field is disabled for the rest of the beat, so four more presses
    // are no-ops (`app/components/chrome/prompt-bar.tsx`).
    await pressReset(page);
    const field = page.getByLabel(PROMPT_INPUT_LABEL);
    await field.fill("how are shirt sales going");
    for (let press = 0; press < 5; press += 1) await field.press("Enter");
    await page.waitForTimeout(SETTLE_MS * 2);
    reading = await expectAlive(page, "five submits of one question");
    expect(reading.sections, "repeated submits duplicated the answer").toEqual([
      "HERO_1:primary",
    ]);

    // The field and the send button really are closed while a beat runs.
    await pressReset(page);
    await tapChip(page, HERO_CHIP.tickets);
    await expect(page.locator('[data-slot="thinking-panel"]')).toBeVisible();
    expect(
      await page.evaluate(() => ({
        input: document.querySelector<HTMLInputElement>(
          '[data-slot="prompt-input"]',
        )!.disabled,
        send: document.querySelector<HTMLButtonElement>(
          '[data-slot="prompt-send"]',
        )!.disabled,
        busy: document
          .querySelector('[data-slot="prompt-form"]')!
          .getAttribute("aria-busy"),
      })),
      "the prompt bar stayed open during a beat",
    ).toEqual({ input: true, send: true, busy: "true" });

    // Re-asking a hero whose follow-up is already shown refreshes it in place:
    // no second section, and the sharpened answer is not regressed.
    await pressReset(page);
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    await tapChip(page, FOLLOW_UP_CHIP.shirts);
    await expectAnswerLanded(page, 1, 1);
    await tapChip(page, HERO_CHIP.shirts);
    await page.waitForTimeout(SETTLE_MS * 2);
    reading = await expectAlive(page, "hero re-asked after its follow-up");
    expect(
      reading.sections,
      "a re-ask appended or regressed a section",
    ).toEqual(["HERO_1:withFollowUp"]);

    expectQuietConsole(log, "overlapping presses");
  });
});

/* ------------------------------------------------- 9. THE BROWSER ITSELF -- */

test.describe("browser-level paths", () => {
  test("reload, back and forward all land on a usable dashboard", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    // A reload is a FRESH SESSION by specification — state lives in React and
    // nowhere else (`app/lib/dashboard/sections.ts`), so the answers are gone
    // and the baseline is back. That is the documented behaviour, not a defect;
    // what matters is that it is a WORKING baseline and not a broken screen.
    await buildFullCanvas(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(SETTLE_MS);
    await expectBaselineAlive(page, "after a reload");
    // And it is still driveable: the very next question works.
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    await expectAlive(page, "a question after a reload");

    // A reload taken MID-BEAT, which is the panic press a presenter makes.
    await pressReset(page);
    await tapChip(page, HERO_CHIP.tickets);
    await expect(page.locator('[data-slot="thinking-panel"]')).toBeVisible();
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(SETTLE_MS);
    await expectBaselineAlive(page, "after a mid-beat reload");

    // Back, then forward. The app adds no history entries of its own — the one
    // link in the product pushes nothing — so Back leaves the app entirely and
    // Forward returns to a cold, working load rather than a half-restored one.
    await buildFullCanvas(page);
    await page.goBack();
    await page.waitForTimeout(SETTLE_MS);
    await page.goForward();
    await page.waitForTimeout(SETTLE_MS);
    expect(page.url(), "forward did not return to the app").toBe(
      `${BASE_URL}/`,
    );
    await expectBaselineAlive(page, "after back and forward");
    await tapChip(page, HERO_CHIP.budgets);
    await expectAnswerLanded(page, 1, 0);
    await expectAlive(page, "a question after back and forward");

    expectQuietConsole(log, "browser-level paths");
  });
});

/* ------------------------------------------------------- 10. THE SECURITY -- */

test.describe("the one user input", () => {
  /**
   * A03, the user-input trigger of `.claude/rules/security-review.md`.
   *
   * `app/lib/dashboard/intents.ts` and `app/components/chrome/prompt-bar.tsx`
   * both document that the typed string is read and discarded, and both prove
   * it by SCANNING THEIR OWN SOURCE. That is a strong claim about two modules
   * and says nothing about the served page — which is exactly the gap US-041
   * fell into, where the offending behaviour belonged to the framework rather
   * than to `app/**`. So this case types every hostile string from
   * {@link OFF_SCRIPT_INPUTS} into the real field and then reads every sink:
   * markup, attributes, both web storages, cookies, and `window`.
   */
  test("never becomes markup, a URL, a selector, a cookie or a storage key", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const log = await open(page);

    for (const question of OFF_SCRIPT_INPUTS) {
      await pressReset(page);
      await askTyped(page, question);
      await page.waitForTimeout(300);
    }

    const storage = await readStorage(page);
    const html = await page.content();

    // NOT EXECUTED. Every payload above that would have run set a `__fcb*`
    // global; none exists, and no script tag carries one either.
    expect(storage.injected, "a payload executed").toEqual([]);
    expect(html, "a payload reached the document as markup").not.toContain(
      "onerror=",
    );
    expect(html, "a payload reached the document as markup").not.toContain(
      "svg/onload",
    );
    expect(html, "a payload reached the document as markup").not.toContain(
      "DROP TABLE",
    );

    // NOT A URL. No `src`, `href`, `action` or inline `style` in the rendered
    // document carries any fragment of a typed question.
    for (const value of storage.urlish) {
      expect(
        value.toLowerCase(),
        `a typed question reached an attribute: ${value.slice(0, 60)}`,
      ).not.toContain("javascript:");
      expect(value, "a typed question reached an attribute").not.toContain(
        "DROP TABLE",
      );
    }

    // NOT PERSISTED, AND NOW NOT AT ALL. `localStorage`, cookies and
    // `sessionStorage` are all untouched: US-043 removed `<ScrollRestoration />`
    // to close KL-3, and with it the `react-router-scroll-positions` key this
    // assertion used to have to excuse. Memory-only state is now literally
    // true of the browser's storage as well as of the application's.
    expect(storage.localKeys, "localStorage was written").toEqual([]);
    expect(storage.cookie, "a cookie was set").toBe("");
    expect(storage.sessionKeys, "sessionStorage was written").toEqual([]);
    for (const value of storage.sessionValues) {
      expect(value, "a typed question reached sessionStorage").not.toMatch(
        /shirt|DROP TABLE|onerror|javascript:|qwertyuiop/i,
      );
    }

    // And the screen still works after all of it.
    await pressReset(page);
    await expectBaselineAlive(page, "after every hostile string");
    await tapChip(page, HERO_CHIP.shirts);
    await expectAnswerLanded(page, 1, 0);
    await expectAlive(page, "a question after every hostile string");

    expectQuietConsole(log, "hostile input");
  });
});
