import { expect, test, type Page } from "@playwright/test";

import { BASE_URL } from "../../playwright.config";
import { expectAnswerLanded, tapChip } from "./support/demo-script";
import {
  formatNetworkLog,
  recordNetwork,
  severNetwork,
  type NetworkLog,
} from "./support/network";
import { signIn } from "./support/sign-in";

/**
 * US-049 — **the demo, given in German, in a real browser.**
 *
 * The unit suite already drives the toggle through the whole component tree
 * (`tests/unit/language-toggle.test.tsx`); what only a browser can prove is
 * the part the demo actually depends on: that switching language **makes no
 * request**. Both dictionaries are bundled, so the German pass has to work
 * with the venue Wi-Fi unplugged exactly as the English one does (US-041) —
 * and a library that fetched a locale file on demand would fail precisely
 * here, in the room, in front of the club.
 *
 * THE COPY IS TYPED OUT, NOT IMPORTED, for the same reason `demo-script.ts`
 * types out the English chip labels: this suite reads the served page the way
 * a presenter does. A dictionary edit that changed a chip and this file at
 * once, with no test failing, would be a change nobody reviewed.
 */

/* ------------------------------------------------------------------ COPY -- */

/** The German chip labels, as `de.json` words them. */
const GERMAN_CHIP = {
  shirts: "Trikotverkäufe nach Ausführung & Sponsorenbadges",
  tickets: "Ticketeinnahmen, dieses Jahr vs. letztes Jahr",
  budgets: "Abteilungsbudgets vs. Ist-Werte",
} as const;

/** German chrome, to prove the switch reached past the toggle itself. */
const GERMAN_CHROME = {
  reset: "Zurücksetzen",
  status: "Verbunden · 11 Systeme",
  navigation: "Datenquellen",
} as const;

/** One German tile title per hero — the answer rendered its OWN content. */
const GERMAN_TILE_TITLE = {
  shirts: "Trikotverkäufe nach Ausführung",
  tickets: "Ticketeinnahmen im Jahresvergleich",
  budgets: "Abteilungsperformance (Gesamtjahr)",
} as const;

/* -------------------------------------------------------------- DRIVING -- */

async function open(page: Page): Promise<NetworkLog> {
  const log = recordNetwork(page, BASE_URL);
  await page.goto(BASE_URL);
  await signIn(page);
  return log;
}

/** Press DE, the way a presenter does: one control in the app bar. */
async function switchToGerman(page: Page): Promise<void> {
  await page.locator('[data-slot="language-option"][data-locale="de"]').click();
  await expect(
    page.locator('[data-slot="language-option"][data-locale="de"]'),
  ).toHaveAttribute("data-selected", "true");
}

/* ------------------------------------------------------------------ TESTS -- */

test.describe("the demo can be given in German", () => {
  test("switches the whole screen, and asks for nothing", async ({ page }) => {
    const log = await open(page);
    const before = log.requests.length;

    await switchToGerman(page);

    // The chrome, past the toggle.
    await expect(
      page.getByRole("button", { name: GERMAN_CHROME.reset }),
    ).toBeVisible();
    await expect(page.getByText(GERMAN_CHROME.status)).toBeVisible();
    await expect(page.getByText(GERMAN_CHROME.navigation)).toBeVisible();

    // The canvas: the prepared questions and the invitation.
    await expect(
      page.getByRole("button", { name: GERMAN_CHIP.shirts }),
    ).toBeVisible();
    await expect(page.getByText("Ihr Dashboard ist bereit")).toBeVisible();

    // The document language, which a screen reader picks its voice from.
    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    // AND NOT ONE REQUEST. Both dictionaries are in the bundle; switching is
    // a re-render, never a fetch.
    expect(
      log.requests.length,
      `switching language made a request:\n${formatNetworkLog(log, BASE_URL)}`,
    ).toBe(before);
  });

  test("answers all three prepared questions with the network severed", async ({
    page,
  }) => {
    await open(page);
    await switchToGerman(page);
    await severNetwork(page);

    let answered = 0;
    for (const [hero, chip] of Object.entries(GERMAN_CHIP)) {
      await tapChip(page, chip);
      answered += 1;
      await expectAnswerLanded(page, answered, 0);
      await expect(
        page
          .getByText(GERMAN_TILE_TITLE[hero as keyof typeof GERMAN_TILE_TITLE])
          .first(),
      ).toBeVisible();
    }

    // The narrative is the dataset's own copy, translated — the proof that the
    // German pass reaches the ANSWERS and not only the frame.
    await expect(
      page.getByText(/Die meisten Abteilungen liegen im Plan oder darüber/),
    ).toBeVisible();
  });

  test("goes back to English with the answers still on the canvas", async ({
    page,
  }) => {
    await open(page);
    await switchToGerman(page);
    await tapChip(page, GERMAN_CHIP.tickets);
    await expectAnswerLanded(page, 1, 0);

    await page
      .locator('[data-slot="language-option"][data-locale="en"]')
      .click();

    await expect(
      page.getByText("Ticket revenue, year on year").first(),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    // The answer did not reload, re-render from zero or disappear.
    await expectAnswerLanded(page, 1, 0);
  });
});
