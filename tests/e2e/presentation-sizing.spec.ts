import { expect, test } from "@playwright/test";

import {
  expectFullScriptLoaded,
  expectPresentationClean,
  loadDemoScript,
  measureLayout,
} from "./support/demo-script";

/**
 * US-040 — presentation sizing & responsiveness, measured in real Chrome
 * against the built SSR bundle.
 *
 * The five headline viewports are the presenter's reality: the projector it is
 * shown on, and the laptop screens it is driven from. Every case loads the FULL
 * run-of-show first — three heroes and three follow-ups — because that is the
 * tallest the canvas gets and the only state in which every chart, legend and
 * delta chip this story is accountable for exists.
 *
 * WHAT THIS FILE DOES NOT CHASE. The known limitation recorded in
 * `phase-4.md` — Hero 2's year-on-year delta chips overlapping at a 390px
 * viewport — is out of scope by decision, not by oversight: 390px is a phone
 * and this story's targets are 1920x1080 and a laptop screen. The chip gap is
 * still MEASURED here at every viewport, so the boundary is a number in a test
 * report rather than a claim in a document.
 */

/** The projector, and the laptops a presenter mirrors from. */
const PRESENTATION_VIEWPORTS = [
  { label: "1920x1080 projector", width: 1920, height: 1080 },
  { label: "1600x900 laptop", width: 1600, height: 900 },
  { label: "1440x900 laptop", width: 1440, height: 900 },
  { label: "1366x768 laptop", width: 1366, height: 768 },
  { label: "1280x800 laptop", width: 1280, height: 800 },
] as const;

/**
 * Aspect ratios a projector actually presents in, beyond the headline five:
 * 16:10 at 1920x1200, 16:9 at 720p, and the 4:3 modes an older room still has.
 * AC4 is about reflow, and reflow is only proved by asking for shapes the
 * design was not drawn to.
 */
const PROJECTOR_MODES = [
  { label: "1920x1200 (16:10)", width: 1920, height: 1200 },
  { label: "1280x720 (16:9 720p)", width: 1280, height: 720 },
  { label: "1152x864 (4:3)", width: 1152, height: 864 },
  { label: "1024x768 (4:3 XGA)", width: 1024, height: 768 },
] as const;

/**
 * The type floor. `--text-chart-axis` is the smallest role in the token set at
 * 12px and nothing may render below it — a stray `text-xs` from outside the
 * tokens is exactly the kind of thing a room cannot read.
 */
const MIN_FONT_PX = 12;

for (const viewport of PRESENTATION_VIEWPORTS) {
  test.describe(viewport.label, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("renders the full demo script with no clipping and no horizontal scroll", async ({
      page,
    }) => {
      await loadDemoScript(page);
      const report = await measureLayout(page);

      expectFullScriptLoaded(report, viewport.label);
      expectPresentationClean(report, viewport.label);

      // AC1: legible from across a room — nothing below the token floor.
      expect(
        report.smallestFontPx,
        `${viewport.label}: type below the token floor`,
      ).toBeGreaterThanOrEqual(MIN_FONT_PX);

      // Recorded, not asserted against a threshold: the boundary of the known
      // 390px limitation, re-measured at a real viewport every run.
      // eslint-disable-next-line no-console
      console.log(
        `${viewport.label}: delta-chip cell ${report.deltaChipCellWidth}px, ` +
          `widest chip ${report.widestDeltaChip}px, ` +
          `min neighbour gap ${report.deltaChipMinGap}px, ` +
          `prompt-bar clearance ${report.promptBarClearance}px`,
      );

      // The chips are clean at every presentation viewport, which is the half
      // of the US-036 finding that this story is responsible for.
      expect(
        report.deltaChipMinGap,
        `${viewport.label}: delta chips overlap`,
      ).toBeGreaterThan(0);
    });
  });
}

test.describe("projector aspect ratios", () => {
  for (const mode of PROJECTOR_MODES) {
    test(`reflows without clipping at ${mode.label}`, async ({ page }) => {
      await page.setViewportSize({ width: mode.width, height: mode.height });
      await loadDemoScript(page);
      const report = await measureLayout(page);

      expectFullScriptLoaded(report, mode.label);
      expectPresentationClean(report, mode.label);
    });
  }
});

test.describe("mid-session resize", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  /**
   * The presenter plugs into the projector with the dashboard already six
   * answers deep. Nothing may clip on the way down, and nothing may stay
   * clipped on the way back up — a one-way reflow would leave the laptop
   * screen broken for the rest of the meeting.
   */
  test("reflows both ways with every section open", async ({ page }) => {
    await loadDemoScript(page);
    expectPresentationClean(
      await measureLayout(page),
      "resize: 1920x1080 start",
    );

    const steps = [
      { label: "1600x900", width: 1600, height: 900 },
      { label: "1280x800", width: 1280, height: 800 },
      { label: "1024x768", width: 1024, height: 768 },
      { label: "1366x768", width: 1366, height: 768 },
      { label: "1920x1080", width: 1920, height: 1080 },
    ];

    for (const step of steps) {
      await page.setViewportSize({
        width: step.width,
        height: step.height,
      });
      // Reflow is layout, not animation: one frame plus the tile transition.
      await page.waitForTimeout(600);

      const report = await measureLayout(page);
      expectFullScriptLoaded(report, `resize: ${step.label}`);
      expectPresentationClean(report, `resize: ${step.label}`);
    }
  });
});

test.describe("chrome", () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  /**
   * The favicon, checked by request rather than by observation.
   *
   * Headless Chrome does not probe `/favicon.ico` on its own, so waiting for a
   * console error to appear would prove nothing either way. Asking for the file
   * is the honest test: a 404 here IS the console error a headed browser logs.
   */
  test("serves a favicon and declares it in the document head", async ({
    page,
    request,
  }) => {
    const response = await request.get("/favicon.ico");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("icon");

    const body = await response.body();
    // ICO directory header: reserved 0, type 1 (icon), one entry.
    expect([...body.subarray(0, 6)]).toEqual([0, 0, 1, 0, 1, 0]);

    await page.goto("/");
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      "/favicon.ico",
    );
  });

  test("runs the whole script with an error-free console", async ({ page }) => {
    const consoleErrors: string[] = [];
    const badResponses: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    page.on("requestfailed", (request_) =>
      badResponses.push(`failed ${request_.url()}`),
    );
    page.on("response", (response) => {
      if (response.status() >= 400) {
        badResponses.push(`${response.status()} ${response.url()}`);
      }
    });

    await loadDemoScript(page);

    expect(consoleErrors).toEqual([]);
    expect(badResponses).toEqual([]);
  });
});
