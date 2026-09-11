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
import {
  formatNetworkLog,
  recordNetwork,
  severNetwork,
  type NetworkLog,
} from "./support/network";
import { signIn } from "./support/sign-in";

/**
 * US-041 — offline resilience, verified by DISCONNECTING.
 *
 * WHY THIS FILE IS THE ONE THAT MATTERS MOST. The client's framing is blunt
 * about it: the prototype "must run without any live network dependency once
 * loaded, so venue Wi-Fi can never break the demo", and a failing venue
 * connection is the single failure mode that most threatens the meeting. The
 * whole data architecture — bundled seed files under `app/lib/mock/`, a
 * self-hosted crest, server-only repositories behind a `.server.ts` suffix, no
 * model endpoint anywhere — exists to make that survivable. This file is where
 * it stops being an architectural intention and becomes a measurement.
 *
 * NOT BY INSPECTING THE SOURCE. `phase-4.md` says so in as many words, and it
 * is right: a grep for `fetch` proves nothing about a lazily-loaded route
 * chunk, a webfont pulled in by a stylesheet, an image, or a router manifest
 * asked for on demand. So the network is genuinely severed —
 * `context.setOffline(true)` AND an abort route over `**` (see
 * {@link severNetwork}) — and the presenter's whole script is then run against
 * the BUILT SSR BUNDLE, which `playwright.config.ts` boots with
 * `pnpm build && pnpm start`. The dev server would have masked exactly this:
 * its HMR websocket is a live network dependency by design.
 *
 * THE SCRIPT IS RUN, NOT SAMPLED. {@link runPresenterScript} walks every beat
 * the room will see — baseline, three heroes, three follow-ups, an off-script
 * question, an empty submit, reset, and a second reset taken mid-beat — and
 * asserts what is ON SCREEN at each one. "Nothing threw" is not the criterion;
 * the criterion is that the presenter sees the right dashboard.
 */

/* ------------------------------------------------------------------ COPY -- */

/**
 * Visible tile titles, verbatim from the hero components, used to prove that
 * each answer really rendered ITS OWN content rather than merely incrementing a
 * counter.
 *
 * Typed out rather than imported, for the same reason `demo-script.ts` types
 * out the chip labels: this suite reads the served page the way a presenter
 * does. A title that changed in the source and here at once, with no test
 * failing, would be a title nobody can see on screen.
 */
const BASELINE_TILES = [
  "Webshop revenue",
  "Last home match",
  "Top products",
  "Active partners",
] as const;

/** `app/components/dashboard/baseline-row.tsx` composes exactly these four. */
const BASELINE_CARD_COUNT = BASELINE_TILES.length;

const HERO_TILES = {
  shirts: ["Shirt sales by kit", "Sponsor badges printed", "Top printed names"],
  tickets: [
    "Matchday ticket revenue by fixture (CHF 000)",
    "Ticket revenue, year on year",
    "Ticket revenue by month",
  ],
  budgets: [
    "Departmental performance (full year)",
    "Overall, actual against budget",
  ],
} as const;

const FOLLOW_UP_TILES = {
  shirts: "Badge selection trend (last 3 drops)",
  tickets: "Fixtures driving the drop",
  /** The causal peak of the whole demo: the answer that names the driver. */
  budgets: "What's driving Marketing",
} as const;

/** `app/components/heroes/fallback-panel.tsx`, character for character. */
const FALLBACK_MESSAGE =
  "I can pull that together. For this preview, here are the questions I've prepared -";

/**
 * The off-script question, chosen for this story on purpose: the one thing a
 * disconnected machine genuinely cannot answer. It resolves to no intent, so
 * the fallback panel is the correct response — and it must be the response with
 * the network gone, because the fallback is copy plus three chips and neither
 * has ever needed a network.
 */
const OFF_SCRIPT_QUESTION = "what is the weather in basel";

/* --------------------------------------------------------------- LOCATORS -- */

const sections = (page: Page) => page.locator('[data-slot="insight-section"]');
const dividers = (page: Page) =>
  page.locator('[data-slot="follow-up-divider"]');
const cards = (page: Page) => page.locator('[data-slot="card"]');
const emptyState = (page: Page) =>
  page.locator('[data-slot="empty-state-panel"]');
const fallback = (page: Page) => page.locator('[data-slot="fallback-panel"]');
const thinking = (page: Page) => page.locator('[data-slot="thinking-panel"]');
/** The prompt bar's own row. The fallback panel renders a second one. */
const promptChips = (page: Page) =>
  page.locator('[data-slot="prompt-bar"] [data-slot="suggestion-chip"]');

/**
 * The tile whose own header carries this title.
 *
 * SCOPED TO A CARD ON PURPOSE. The hero band restates two baseline titles —
 * "Webshop revenue" names its trend chart — so an unscoped heading lookup finds
 * two elements and proves nothing about which one rendered. A tile is a card,
 * and this is the card.
 *
 * The name is matched as a SUBSTRING because two titles carry their period in
 * parentheses ("Shirt sales by kit (this month)"), and the period is US-016's
 * filter rather than this story's subject. The titles below are distinct enough
 * that a substring names exactly one tile.
 */
const tile = (page: Page, title: string) =>
  cards(page)
    .filter({ has: page.getByRole("heading", { name: title }) })
    .first();

/* ------------------------------------------------------------ THE SCRIPT -- */

/** The baseline: a dashboard that already looks lived-in, and an invitation. */
async function expectBaseline(page: Page, at: string): Promise<void> {
  await expect(cards(page), `${at}: baseline cards`).toHaveCount(
    BASELINE_CARD_COUNT,
  );
  for (const title of BASELINE_TILES) {
    await expect(
      tile(page, title),
      `${at}: baseline tile ${title}`,
    ).toBeVisible();
  }
  await expect(sections(page), `${at}: sections`).toHaveCount(0);
  await expect(dividers(page), `${at}: follow-up dividers`).toHaveCount(0);
  await expect(emptyState(page), `${at}: empty state`).toBeVisible();
  await expect(fallback(page), `${at}: fallback panel`).toHaveCount(0);
  // Three prepared questions, and no follow-up offered before its parent.
  await expect(promptChips(page), `${at}: prepared chips`).toHaveCount(3);
  await expect(
    page.locator('[data-slot="hero-band"]'),
    `${at}: hero band`,
  ).toBeVisible();
}

/** Every named tile of an answer is on screen, not just its section wrapper. */
async function expectTiles(
  page: Page,
  titles: readonly string[],
  at: string,
): Promise<void> {
  for (const title of titles) {
    await expect(tile(page, title), `${at}: tile ${title}`).toBeVisible();
  }
}

/**
 * THE FULL DEMO SCRIPT, beat by beat, with the screen asserted at every one.
 *
 * The order is the Reference Guide's run-of-show as the room will hear it: all
 * three heroes first, so the dashboard visibly accumulates, and then the three
 * follow-ups — which is also the harder order, because a follow-up asked three
 * answers later has to find its parent section rather than the one just
 * rendered.
 */
async function runPresenterScript(page: Page): Promise<void> {
  await expectBaseline(page, "baseline");

  /* --- the three heroes ------------------------------------------------- */

  await tapChip(page, HERO_CHIP.shirts);
  await expectAnswerLanded(page, 1, 0);
  await expectTiles(page, HERO_TILES.shirts, "hero 1");
  // The invitation is replaced by the answer, not stacked with it.
  await expect(emptyState(page), "hero 1: empty state").toHaveCount(0);

  await tapChip(page, HERO_CHIP.tickets);
  await expectAnswerLanded(page, 2, 0);
  await expectTiles(page, HERO_TILES.tickets, "hero 2");

  await tapChip(page, HERO_CHIP.budgets);
  await expectAnswerLanded(page, 3, 0);
  await expectTiles(page, HERO_TILES.budgets, "hero 3");

  // The row is derived from the canvas (`suggestionChips`): the three prepared
  // questions always, plus one follow-up per answer not yet sharpened.
  await expect(promptChips(page), "after three heroes: chips").toHaveCount(6);

  /* --- the three follow-ups --------------------------------------------- */

  await tapChip(page, FOLLOW_UP_CHIP.shirts);
  await expectAnswerLanded(page, 3, 1);
  await expectTiles(page, [FOLLOW_UP_TILES.shirts], "hero 1 follow-up");

  await tapChip(page, FOLLOW_UP_CHIP.tickets);
  await expectAnswerLanded(page, 3, 2);
  await expectTiles(page, [FOLLOW_UP_TILES.tickets], "hero 2 follow-up");

  // The causal peak: the answer the whole demo is built towards.
  await tapChip(page, FOLLOW_UP_CHIP.budgets);
  await expectAnswerLanded(page, 3, 3);
  await expectTiles(page, [FOLLOW_UP_TILES.budgets], "hero 3 follow-up");

  // Every follow-up is spent, so the row is back to the three prepared
  // questions — no chip offers an answer that is already on screen.
  await expect(promptChips(page), "after the follow-ups: chips").toHaveCount(3);

  // Nothing was taken away on the way here: the baseline is still the top row.
  for (const title of BASELINE_TILES) {
    await expect(
      tile(page, title),
      `causal peak: baseline tile ${title} survived`,
    ).toBeVisible();
  }

  /* --- the sidebar's Dashboard link, at the fullest the canvas gets ----- */

  /**
   * THE ONE NAVIGABLE ELEMENT IN THE PRODUCT, AND THE STEP THAT FOUND A REAL
   * DEFECT. The sidebar's Dashboard row is a `<Link to="/">` (US-012) and the
   * presenter is always already on that route, but React Router treated a press
   * as a navigation and revalidated: `GET /_root.data`. Offline that request
   * failed, the navigation errored, and the ENTIRE dashboard — baseline, all
   * six answers — was replaced by an error boundary from one click, with no way
   * back but a reload an offline machine cannot serve.
   *
   * Both routes now decline to revalidate (`shouldRevalidate` in
   * `app/root.tsx` and `app/routes/_index.tsx`), so the press asks for nothing
   * and the session survives it. It is pressed HERE, with six answers on
   * screen, because that is where the loss would have been largest.
   */
  await page.getByRole("link", { name: "Dashboard" }).click();
  await page.waitForTimeout(500);
  await expectAnswerLanded(page, 3, 3);
  await expectTiles(page, [FOLLOW_UP_TILES.budgets], "after Dashboard press");
  for (const title of BASELINE_TILES) {
    await expect(
      tile(page, title),
      `after Dashboard press: baseline tile ${title} survived`,
    ).toBeVisible();
  }

  /* --- the off-script question ------------------------------------------ */

  await page.getByLabel(PROMPT_INPUT_LABEL).fill(OFF_SCRIPT_QUESTION);
  await page.getByLabel(PROMPT_INPUT_LABEL).press("Enter");

  await expect(fallback(page), "off-script: panel").toBeVisible();
  await expect(
    page.locator('[data-slot="fallback-message"]'),
    "off-script: copy",
  ).toHaveText(FALLBACK_MESSAGE);
  // No beat for a miss, and nothing removed: the three answers stay.
  await expect(thinking(page), "off-script: thinking panel").toHaveCount(0);
  await expect(sections(page), "off-script: sections").toHaveCount(3);
  await expect(dividers(page), "off-script: dividers").toHaveCount(3);
  // The next step, always: the panel re-offers the three prepared questions.
  await expect(
    fallback(page).locator('[data-slot="suggestion-chip"]'),
    "off-script: panel chips",
  ).toHaveCount(3);
  // The question is never echoed back into the page.
  await expect(page.locator("body")).not.toContainText(OFF_SCRIPT_QUESTION);

  /* --- the empty submit, which must do nothing at all ------------------- */

  await expect(page.getByLabel(PROMPT_INPUT_LABEL)).toHaveValue("");
  await page.getByRole("button", { name: SEND_BUTTON_LABEL }).click();

  await expect(thinking(page), "empty submit: thinking panel").toHaveCount(0);
  await expect(sections(page), "empty submit: sections").toHaveCount(3);
  await expect(dividers(page), "empty submit: dividers").toHaveCount(3);
  await expect(fallback(page), "empty submit: fallback stayed").toBeVisible();
  await expect(promptChips(page), "empty submit: chips stayed").toHaveCount(3);

  /* --- reset, back to the four cards ------------------------------------ */

  await page.getByRole("button", { name: RESET_LABEL }).click();
  await expectBaseline(page, "after reset");

  /* --- reset again, this time MID-BEAT ---------------------------------- */

  await tapChip(page, HERO_CHIP.tickets);
  // The beat is put up in the same commit as the tap, so it is on screen now.
  await expect(thinking(page), "mid-beat: thinking panel").toBeVisible();
  await page.getByRole("button", { name: RESET_LABEL }).click();

  await expect(thinking(page), "mid-beat reset: panel dropped").toHaveCount(0);
  await expectBaseline(page, "mid-beat reset");

  // The pending beat was CANCELLED, not merely hidden: wait past the delay and
  // no answer may insert itself into a dashboard that was just cleared.
  await page.waitForTimeout(BEAT_MS * 2);
  await expectBaseline(page, "mid-beat reset, beat elapsed");
}

/**
 * Load the page and let it come completely to rest, then draw the first-paint
 * line in the log.
 *
 * Everything the browser needs is asked for here and nowhere else: the
 * document, the stylesheet, the module-preloaded chunks and the crest. The
 * crest is waited on by DECODE rather than by request, because a cached-but-
 * broken image would still have produced a request.
 */
async function loadAndSeal(page: Page, log: NetworkLog): Promise<void> {
  await page.goto("/", { waitUntil: "load" });
  await signIn(page);
  await expect(emptyState(page)).toBeVisible();
  await expect(cards(page)).toHaveCount(BASELINE_CARD_COUNT);
  await expect(
    page.locator('[data-slot="app-shell"] img[alt="FC Basel 1893"]'),
  ).toBeVisible();
  expect(
    await page.evaluate(() => {
      const crest = document.querySelector<HTMLImageElement>(
        'img[alt="FC Basel 1893"]',
      );
      return crest ? crest.complete && crest.naturalWidth > 0 : false;
    }),
    "the crest decoded from the local origin",
  ).toBe(true);
  await page.waitForLoadState("networkidle");

  log.seal();
}

/** The three standing facts every case in this file asserts. */
function expectNoNetworkDependency(log: NetworkLog, at: string): void {
  expect(
    log.afterFirstPaint().map((entry) => `${entry.resourceType} ${entry.url}`),
    `${at}: the page requested something after first paint`,
  ).toEqual([]);
  expect(
    log.foreignOrigins(),
    `${at}: a non-local origin was asked for`,
  ).toEqual([]);
  expect(
    log.requests.filter((entry) => entry.url.includes("fcb.ch")),
    `${at}: the club CDN was contacted`,
  ).toEqual([]);
}

/* ---------------------------------------------------------------- CASES --- */

test.describe("offline resilience", () => {
  // The projector. The offline behaviour is not viewport-dependent — US-040
  // owns the geometry — so one presentation viewport is the honest choice.
  test.use({ viewport: { width: 1920, height: 1080 } });

  test("runs the whole demo script with the network severed after load", async ({
    page,
  }) => {
    const log = recordNetwork(page, BASE_URL);

    await loadAndSeal(page, log);

    // THE DISCONNECT. Everything after this line runs on a machine with no
    // network at all — `navigator.onLine` is false and any request that is
    // attempted anyway is aborted with `net::ERR_INTERNET_DISCONNECTED`.
    await severNetwork(page);
    expect(
      await page.evaluate(() => navigator.onLine),
      "the browser really is offline",
    ).toBe(false);

    await runPresenterScript(page);

    // eslint-disable-next-line no-console
    console.log(
      `offline run — ${log.requests.length} requests, ` +
        `${log.afterFirstPaint().length} after first paint:\n` +
        formatNetworkLog(log, BASE_URL),
    );

    expectNoNetworkDependency(log, "offline");
    // Nothing was even ATTEMPTED, so nothing failed. A populated failure list
    // here would name the exact URL a disconnected demo would have needed.
    expect(log.failures, "offline: requests failed").toEqual([]);
    expect(log.consoleErrors, "offline: console errors").toEqual([]);
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    /**
     * The reduced-motion path is a media query rather than a network concern,
     * but it shortens the thinking beat and swaps every entrance animation
     * (`app/lib/hooks/use-motion.ts`), so it is a genuinely different pass
     * through the same script — and it is cheap to cover here rather than
     * discovering offline was never tested on it.
     */
    test("runs the whole demo script offline", async ({ page }) => {
      const log = recordNetwork(page, BASE_URL);

      await loadAndSeal(page, log);
      expect(
        await page.evaluate(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
        "reduced motion is in force",
      ).toBe(true);

      await severNetwork(page);
      await runPresenterScript(page);

      expectNoNetworkDependency(log, "offline, reduced motion");
      expect(log.failures, "reduced motion: requests failed").toEqual([]);
      expect(log.consoleErrors, "reduced motion: console errors").toEqual([]);
    });
  });
});

test.describe("no runtime network dependency", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  /**
   * The same script with the network LEFT ON — which is the stricter test of
   * the request log, because offline would have aborted a runtime fetch and
   * could be mistaken for the absence of one. Here a lazily-loaded chunk, a
   * revalidating loader or a webfont would succeed, and would still be counted.
   */
  test("asks for nothing after first paint, and never for a foreign origin", async ({
    page,
  }) => {
    const log = recordNetwork(page, BASE_URL);

    await loadAndSeal(page, log);
    await runPresenterScript(page);

    // eslint-disable-next-line no-console
    console.log(
      `online run — ${log.requests.length} requests, ` +
        `${log.afterFirstPaint().length} after first paint:\n` +
        formatNetworkLog(log, BASE_URL),
    );

    expectNoNetworkDependency(log, "online");
    expect(log.failures, "online: requests failed").toEqual([]);
    expect(log.consoleErrors, "online: console errors").toEqual([]);

    // No API, no model endpoint: nothing of the kind a runtime dependency
    // would look like was ever requested, at any point including load.
    expect(
      log.requests.filter((entry) =>
        ["fetch", "xhr", "websocket", "eventsource"].includes(
          entry.resourceType,
        ),
      ),
      "a data request was made",
    ).toEqual([]);

    // The type stack is Helvetica Neue / Arial / system sans by design
    // (US-003), so a webfont request would be a regression, not an omission.
    expect(log.fonts(), "a webfont was fetched").toEqual([]);
  });

  test("serves every asset it loads from the local origin", async ({
    page,
  }) => {
    const log = recordNetwork(page, BASE_URL);

    await loadAndSeal(page, log);

    const inventory = log.assets().map((entry) => ({
      type: entry.resourceType,
      path: entry.url.slice(BASE_URL.length) || "/",
      local: entry.url.startsWith(BASE_URL),
    }));

    // eslint-disable-next-line no-console
    console.log(
      `assets loaded (${inventory.length}):\n` +
        inventory
          .map((asset) => `  ${asset.type.padEnd(10)} ${asset.path}`)
          .join("\n"),
    );

    expect(
      inventory.filter((asset) => !asset.local),
      "an asset came from somewhere other than the local origin",
    ).toEqual([]);

    // The document, the stylesheet, the script chunks and the crest are all
    // accounted for — a page that silently stopped loading its own CSS would
    // otherwise pass every assertion above.
    const types = new Set(inventory.map((asset) => asset.type));
    expect(types.has("document"), "the document was loaded").toBe(true);
    expect(types.has("stylesheet"), "a stylesheet was loaded").toBe(true);
    expect(types.has("script"), "script chunks were loaded").toBe(true);
    expect(
      inventory.some((asset) => asset.path === "/fcb-crest.png"),
      "the crest was loaded from public/",
    ).toBe(true);

    /**
     * The favicon is asserted by request rather than by observation, exactly as
     * US-040 does: headless Chrome does not probe `/favicon.ico`, so it never
     * appears in the log above even though a headed browser asks for it.
     */
    const favicon = await page.request.get(`${BASE_URL}/favicon.ico`);
    expect(favicon.status(), "the favicon is served locally").toBe(200);

    /**
     * AND THE HALF A REQUEST LOG CANNOT SEE: an absolute URL that no headless
     * run happens to fetch — a `srcset`, a print stylesheet, a preconnect, a
     * hotlinked crest behind a media query. Every `src` and `href` in the
     * rendered document must be root-relative or same-origin.
     */
    const absolute = await page.evaluate((origin) => {
      const offenders: string[] = [];
      for (const el of document.querySelectorAll("[src], [href]")) {
        for (const attribute of ["src", "href", "srcset"]) {
          const raw = el.getAttribute(attribute);
          if (!raw) continue;
          for (const candidate of raw.split(",").map((part) => part.trim())) {
            const url = candidate.split(/\s+/)[0] ?? "";
            const scheme = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url);
            if (scheme && !url.startsWith(origin)) {
              offenders.push(
                `${el.tagName.toLowerCase()}[${attribute}]=${url}`,
              );
            }
          }
        }
      }
      return offenders;
    }, BASE_URL);

    expect(absolute, "the document references an absolute URL").toEqual([]);
  });
});
