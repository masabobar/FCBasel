import { expect, test, type Page } from "@playwright/test";

import {
  classifyColours,
  formatColourInventory,
  formatContrast,
  formatGoldAudit,
  GOLD_ALLOWED,
  partnerBrandColours,
  readBrand,
  strayGold,
  TOKEN_COLOURS,
  type BrandReport,
  type ContrastReading,
} from "./support/brand";
import {
  FOLLOW_UP_COUNT,
  HERO_COUNT,
  loadDemoScript,
  PROMPT_INPUT_LABEL,
} from "./support/demo-script";
import { askFromBaseline, tabRing } from "./support/paths";
import { signIn } from "./support/sign-in";

/**
 * US-044 — brand fidelity and legibility, MEASURED ON THE RENDERED PAGE.
 *
 * From the client's framing, principle 3: for an audience that knows FC Basel
 * intimately, "the gap between 'looks roughly like the club' and 'looks like
 * our own tool' is the gap between a polite nod and a sold room. Brand fidelity
 * is not decoration here - it is most of the persuasion." So this is not a
 * styling checklist; it is the last gate on the thing that does the persuading.
 *
 * AND IT IS MEASURED, NOT REVIEWED. The source scans already pass: every tile
 * component has a unit test that rejects a literal hex in its own file, and the
 * token parity test (US-003) pins `app/app.css` to `app/lib/tokens.ts`. None of
 * that can see what is ON THE SCREEN. A token can be spelled correctly and
 * still land wrong - an opacity modifier composites through oklab, a
 * `currentColor` chain resolves in an ancestor the component never sees, an SVG
 * paints with `fill` while its parent sets `color`, a gradient interpolates
 * between two stops. US-041 found two runtime fetches that no grep could see
 * and US-042 upgraded an XSS claim from "two files scanned" to "five sinks
 * measured on the served page"; this suite does the same for the palette.
 *
 * WITH THE WHOLE RUN OF SHOW LOADED. Three heroes and three follow-ups is the
 * only state in which every colour, chip, mark, divider and recommendation
 * panel is on screen AT ONCE - which is the only state in which "gold appears
 * nowhere else" is a fact rather than a hope. Two further moments are read
 * separately, because each paints something the full canvas does not: the
 * BASELINE carries the empty-state panel's red-to-red-vivid badge, and the
 * MID-BEAT carries the thinking panel's gold sweep.
 *
 * WHAT IT IS FOR AFTER TODAY. The deliverable is not this run's pass; it is a
 * standing colour inventory and gold audit that fails the moment an off-token
 * colour or a stray gold fill appears anywhere on the canvas.
 */

/* ----------------------------------------------------------- THRESHOLDS -- */

/**
 * The floors, stated as numbers because criterion 4 is a number.
 *
 * A projector washes out subtle greys, so "borders and text survive a
 * projector" cannot be asserted as a boolean - it is a set of measured ratios,
 * printed by this suite every run. The floors below are set at the values the
 * product MEASURES today, so the assertion catches a regression to anything
 * FAINTER rather than blessing an arbitrary target. Where a reading is already
 * marginal it is reported with its number and its mitigation, never quietly
 * "improved": a token value is US-003's to change, not this story's.
 */

/** Body copy, data, axis labels, prose. WCAG AA is 4.5; the product's own
 *  floor is muted-on-surface, which measures 4.33. */
const MIN_TEXT_RATIO = 4.3;

/**
 * Variance chips. `#0e9f6e` on its own 10% tint measures ~3.0, and that is
 * BY DESIGN rather than an oversight: colour is the fourth and most disposable
 * carrier on a chip that also draws an arrow, writes an explicit sign and
 * states the direction in the accessibility tree (criterion 3). A projector may
 * take the colour; it cannot take the other three.
 */
const MIN_CHIP_RATIO = 3.0;

/**
 * Gold-deep eyebrows (`Follow-up`, `Recommendation`) and the partner monogram
 * plates. Between 2.4 and 3.0, and deliberately so - gold IS the accent, and
 * the plates wear the partner's own brand colour, which is content.
 */
const MIN_ACCENT_RATIO = 2.4;

/**
 * Borders, hairlines and chart grid lines.
 *
 * THESE ARE THE NUMBERS THE CRITERION IS REALLY ABOUT, and they are low:
 * `--color-border` on white measures 1.24:1 and `--color-line` 1.13:1. They
 * WILL wash out on a projector, which is why nothing on this canvas depends on
 * a border to be readable - every tile also carries `--shadow-tile` and a white
 * fill against the `--color-surface` canvas, and every chart's geometry is a
 * filled shape rather than an outline. The floor exists to fail a border that
 * gets fainter still.
 */
const MIN_EDGE_RATIO = 1.05;

/** The uppercase heading role: 700 weight at `--tracking-heading` 0.04em. */
const HEADING_WEIGHT = "700";
const HEADING_TRACKING_EM = 0.04;

/* ------------------------------------------------------- CLASSIFICATION -- */

/** Slots whose ink is an ACCENT or a partner's own colour, not data or prose. */
const ACCENT_INK_SLOTS = [
  "recommendation-label",
  "follow-up-divider-label",
  "partner-monogram",
  "suggestion-chip",
];

function isChip(reading: ContrastReading): boolean {
  return reading.samples.some((sample) => sample.includes("delta-chip"));
}

function isAccentInk(reading: ContrastReading): boolean {
  return reading.samples.some((sample) =>
    ACCENT_INK_SLOTS.some((slot) => sample.includes(slot)),
  );
}

/** The floor a text reading is held to, and the reason it is that floor. */
function textFloor(reading: ContrastReading): number {
  if (isChip(reading)) return MIN_CHIP_RATIO;
  if (isAccentInk(reading)) return MIN_ACCENT_RATIO;
  return MIN_TEXT_RATIO;
}

/* -------------------------------------------------- THE FULL RUN OF SHOW -- */

test.describe("brand fidelity with the whole demo script on screen", () => {
  test.describe.configure({ mode: "serial" });

  let page: Page;
  let report: BrandReport;
  let partners: readonly string[];

  test.beforeAll(async ({ browser }) => {
    // 1920x1080 explicitly: the presentation target US-040 measured, so every
    // reading here is taken on the geometry the room will actually see.
    page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await loadDemoScript(page);
    report = await readBrand(page);
    partners = await partnerBrandColours();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("the whole script really is on screen", () => {
    expect(report.elementsWalked).toBeGreaterThan(600);
    expect(
      report.variance.length,
      "variance chips on the full canvas",
    ).toBeGreaterThan(15);
    expect(report.headings.length, "uppercase headings").toBeGreaterThan(20);
  });

  /* ------------------------------------------------------- CRITERION 1 -- */

  test("every colour painted on the page resolves to a token", () => {
    const verdicts = classifyColours(report.colours, partners);

    // eslint-disable-next-line no-console
    console.log(
      `\nCOLOUR INVENTORY - full script, ${report.colours.length} distinct colours ` +
        `over ${report.elementsWalked} painted elements\n` +
        formatColourInventory(verdicts),
    );

    expect(
      verdicts.filter((entry) => !entry.onToken),
      "colours painted that are not in the token set",
    ).toEqual([]);

    // The exceptions are the ONLY exceptions: six partner brand colours, the
    // shadow tokens' own #101840 / black, and fully transparent.
    const nonPalette = verdicts.filter(
      (entry) => !entry.verdict.startsWith("token:"),
    );
    for (const entry of nonPalette) {
      expect(
        entry.verdict,
        `${entry.hex} is outside the colour tokens - it must be a partner brand colour, a shadow token, or transparent`,
      ).toMatch(/^(partner brand colour|shadow token|transparent)/);
    }

    // And the partner plates really are painted: an inventory that had lost
    // them would pass the assertion above by rendering nothing.
    const partnerHexes = verdicts
      .filter((entry) => entry.verdict.startsWith("partner brand"))
      .map((entry) => entry.hex);
    expect(
      partnerHexes.length,
      "partner brand colours painted",
    ).toBeGreaterThan(0);
    for (const hex of partnerHexes) expect(partners).toContain(hex);
  });

  /* ------------------------------------------------------- CRITERION 2 -- */

  test("gold paints only its sanctioned homes, and never a third fill", () => {
    // eslint-disable-next-line no-console
    console.log(
      `\nGOLD AUDIT - full script, ${report.gold.length} gold paints\n` +
        formatGoldAudit(report.gold, partners),
    );

    expect(
      strayGold(report.gold, partners),
      "gold painted somewhere the allowlist does not sanction",
    ).toEqual([]);

    // THE RING THAT DOES NOT EXIST. The Build Specification's ~1.5s gold
    // highlight ring on a newly inserted tile was removed by the Reference
    // Guide (US-006); this is the assertion that keeps it gone. A tile's own
    // surface, its accent bar and the section around it carry no gold at all.
    const tileSlots = ["card", "card-accent", "insight-section", "canvas-grid"];
    const onTiles = report.gold.filter((paint) =>
      tileSlots.includes(paint.slot),
    );
    expect(onTiles, "gold on a tile surface, accent bar or section").toEqual(
      [],
    );

    // Both halves of rule 4 are genuinely present - a canvas that had lost its
    // target marks or its follow-up seams would pass the audit above trivially.
    const slots = new Set(report.gold.map((paint) => paint.slot));
    expect(slots, "the target-hit marks").toContain("department-target-dot");
    expect(slots, "the follow-up seam").toContain("follow-up-divider-rule");
    expect(slots, "the recommendation accent").toContain(
      "recommendation-accent",
    );

    // Every slot that DID paint gold is in the table with a written sanction.
    for (const slot of slots) {
      if (slot === "partner-monogram") continue;
      expect(
        GOLD_ALLOWED[slot],
        `${slot} has no recorded sanction`,
      ).toBeTruthy();
    }
  });

  /* ------------------------------------------------------- CRITERION 3 -- */

  test("every variance indicator carries a token, an explicit sign and an arrow", () => {
    // eslint-disable-next-line no-console
    console.log(
      `\nVARIANCE AUDIT - ${report.variance.length} chips\n` +
        report.variance
          .map(
            (chip) =>
              `  ${chip.figure.padEnd(12)} ${chip.direction.padEnd(5)} ${chip.judgement.padEnd(11)} ` +
              `ink ${chip.ink} sign "${chip.sign}" arrows ${chip.arrows} spoken "${chip.spoken}" ` +
              `tabular ${chip.tabularNumerals}\n      ${chip.path}`,
          )
          .join("\n"),
    );

    const positive = TOKEN_COLOURS.find((entry) =>
      entry.names.includes("variancePositive"),
    )!.hex;
    const negative = TOKEN_COLOURS.find((entry) =>
      entry.names.includes("varianceNegative"),
    )!.hex;

    for (const chip of report.variance) {
      const at = `${chip.figure} at ${chip.path}`;

      // Carrier one: the sign is written, always, whichever way it points.
      expect(chip.sign, `${at}: no explicit sign`).toMatch(/^[+-]$/);
      // Carrier two: an arrow glyph, exactly one.
      expect(chip.arrows, `${at}: no arrow`).toBe(1);
      // Carrier three: the direction in words, for a reader with no colour
      // at all.
      expect(chip.spoken, `${at}: direction not spoken`).not.toBe("");
      // The figure sits in a column of figures: tabular digits, always.
      expect(chip.tabularNumerals, `${at}: figures not tabular`).toBe(true);

      // Carrier four: the colour, and ONLY from the variance tokens. `light`
      // chips on the navy band drop colour coding altogether and lean on the
      // three carriers above, which is the principle made load-bearing rather
      // than a compromise.
      const onBand = chip.path.includes("hero-band");
      if (chip.judgement === "FAVOURABLE" && !onBand) {
        expect(chip.ink, `${at}: not the positive token`).toBe(positive);
      }
      if (chip.judgement === "ADVERSE" && !onBand) {
        expect(chip.ink, `${at}: not the negative token`).toBe(negative);
      }
    }

    // US-022'S TRAP, ASSERTED POSITIVELY. Marketing's overspend is UP and
    // ADVERSE at once, so somewhere on this canvas an UP arrow must be sitting
    // in the NEGATIVE token. If that pair ever disappears, either the trap has
    // been "fixed" into a plain sign-follows-colour rule or Hero 3 has lost its
    // flagged department - both of which are worse than the oddity.
    const trap = report.variance.filter(
      (chip) => chip.direction === "UP" && chip.judgement === "ADVERSE",
    );
    expect(
      trap.length,
      "an UP movement in the negative token - Marketing's adverse overspend",
    ).toBeGreaterThan(0);
    for (const chip of trap) {
      expect(chip.sign, "the adverse rise still writes its plus").toBe("+");
      expect(chip.ink).toBe(negative);
    }
  });

  /* ------------------------------------------------------- CRITERION 6a -- */

  test("uppercase headers render uppercase, bold, and tracked out", () => {
    // eslint-disable-next-line no-console
    console.log(
      `\nUPPERCASE HEADERS - ${report.headings.length}\n` +
        report.headings
          .map(
            (heading) =>
              `  ${heading.transform.padEnd(10)} ${heading.weight} ` +
              `${heading.letterSpacingPx}px/${heading.fontSizePx}px  ` +
              `${heading.slot} :: ${heading.text}`,
          )
          .join("\n"),
    );

    for (const heading of report.headings) {
      const at = `${heading.slot} "${heading.text}"`;
      expect(heading.transform, `${at}: not uppercase`).toBe("uppercase");
      expect(heading.weight, `${at}: not bold`).toBe(HEADING_WEIGHT);
      // `0.04em` resolved at the element's own size, so the assertion follows
      // the token rather than a px figure that would break at a new type step.
      expect(
        heading.letterSpacingPx,
        `${at}: letter-spacing is not --tracking-heading`,
      ).toBeCloseTo(heading.fontSizePx * HEADING_TRACKING_EM, 1);
    }
  });

  /* ------------------------------------------------------- CRITERION 6b -- */

  test("every figure on the canvas uses tabular numerals", () => {
    const jittering = report.figures.filter(
      (figure) => !figure.fontVariantNumeric.includes("tabular-nums"),
    );

    // eslint-disable-next-line no-console
    console.log(
      `\nTABULAR NUMERALS - ${report.figures.length} figures on the canvas, ` +
        `${jittering.length} without\n` +
        report.figures
          .map(
            (figure) =>
              `  ${figure.fontVariantNumeric.padEnd(14)} ${figure.fontSizePx}px  ` +
              `${figure.slot} :: ${figure.text}`,
          )
          .join("\n"),
    );

    expect(
      jittering.map((figure) => `${figure.slot} :: ${figure.text}`),
      "figures whose digits can jitter during a count-up",
    ).toEqual([]);
  });

  /* ------------------------------------------------------- CRITERION 4 -- */

  test("borders and text survive a projector - the measured ratios", () => {
    // eslint-disable-next-line no-console
    console.log(
      `\nTEXT CONTRAST - ${report.textContrast.length} pairs, worst first\n` +
        formatContrast(report.textContrast) +
        `\n\nBORDER AND HAIRLINE CONTRAST - ${report.edgeContrast.length} pairs, worst first\n` +
        formatContrast(report.edgeContrast),
    );

    for (const reading of report.textContrast) {
      const floor = textFloor(reading);
      expect(
        reading.ratio,
        `${reading.fg} on ${reading.bg} (${reading.scale}) measures ${reading.ratio}:1, under ${floor}:1 - ${reading.samples[0]}`,
      ).toBeGreaterThanOrEqual(floor);
    }

    for (const reading of report.edgeContrast) {
      expect(
        reading.ratio,
        `edge ${reading.fg} on ${reading.bg} measures ${reading.ratio}:1 - ${reading.samples[0]}`,
      ).toBeGreaterThanOrEqual(MIN_EDGE_RATIO);
    }

    // The primary text token is not marginal anywhere, and that is the reading
    // the room actually depends on.
    const primary = report.textContrast.filter(
      (reading) => reading.fg === "#161a20",
    );
    expect(primary.length, "primary text painted").toBeGreaterThan(0);
    for (const reading of primary) {
      expect(reading.ratio, `primary text on ${reading.bg}`).toBeGreaterThan(
        12,
      );
    }
  });

  /* ------------------------------------------------------- CRITERION 5 -- */

  test("no em or en dash anywhere on the rendered page", () => {
    // eslint-disable-next-line no-console
    console.log(
      `\nDASH SWEEP - full script: ${report.dashes.length} offenders; ` +
        `score labels ${JSON.stringify(report.scoreLabels)}`,
    );

    expect(report.dashes, "non-hyphen dashes on the full canvas").toEqual([]);

    // The score label by name, because it is the one the story calls out: a
    // plain hyphen U+002D, no spaces around it, in every place it renders.
    expect(
      report.scoreLabels.length,
      "the scoreline on screen",
    ).toBeGreaterThan(0);
    for (const label of report.scoreLabels) {
      expect(label).toMatch(/FCB 2-1 Sion$/);
      expect([...label].map((char) => char.codePointAt(0))).toContain(0x2d);
    }
  });

  /* ------------------------------------------------------- CRITERION 6c -- */

  test("every tab stop shows a focus-visible outline", async () => {
    const stops = await tabRing(page);

    // eslint-disable-next-line no-console
    console.log(
      `\nFOCUS RING - ${stops.length} stops\n` +
        stops
          .map(
            (stop) =>
              `  outline ${stop.outline.padEnd(6)} ${stop.tag}[${stop.slot}] ${stop.name}`,
          )
          .join("\n"),
    );

    expect(stops.length, "keyboard-reachable stops").toBeGreaterThan(15);

    const ringless = stops.filter((stop) => stop.outline === "none");

    // THE ONE EXCEPTION, AND IT IS DELIBERATE (US-042). The prompt input's own
    // outline is suppressed because the ring moved OUTWARDS onto the field
    // wrapper: focus has to read as one ring around one field, and the wrapper
    // is the element that draws the border. It is asserted below rather than
    // waved through.
    expect(ringless.map((stop) => stop.slot)).toEqual(["prompt-input"]);

    await page.getByLabel(PROMPT_INPUT_LABEL).focus();
    const field = await page.evaluate(() => {
      const el = document.querySelector('[data-slot="prompt-field"]')!;
      const style = getComputedStyle(el);
      return {
        borderColor: style.borderTopColor,
        boxShadow: style.boxShadow,
      };
    });
    const blue = TOKEN_COLOURS.find((entry) => entry.names.includes("blue"))!;
    expect(
      field.borderColor,
      "the focused field's border is not club blue",
    ).toBe("rgb(0, 64, 147)");
    expect(blue.hex).toBe("#004093");
    // `--shadow-focus`, which is the blue at 10% - the ring itself.
    expect(field.boxShadow).toContain("rgba(0, 64, 147, 0.1)");
  });
});

/* ---------------------------------------------- THE OTHER THREE MOMENTS -- */

/**
 * Three states the full canvas does not contain, each read the same way.
 *
 * The BASELINE paints the empty-state panel's red-to-red-vivid badge, which is
 * the only place `--color-red-vivid` renders at all. The MID-BEAT paints the
 * thinking panel's gold sweep and its glow. The FALLBACK paints US-032's panel,
 * which carries authored prose - and prose is where a typographic dash gets in.
 */
test.describe("the moments the full canvas does not contain", () => {
  test("the baseline: on-token, gold-clean, dash-free", async ({ page }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator('[data-slot="empty-state-panel"]')).toBeVisible();
    await page.waitForTimeout(1_200);

    const report = await readBrand(page);
    const partners = await partnerBrandColours();
    const verdicts = classifyColours(report.colours, partners);

    // eslint-disable-next-line no-console
    console.log(
      `\nCOLOUR INVENTORY - baseline, ${report.colours.length} distinct\n` +
        formatColourInventory(verdicts),
    );

    expect(
      verdicts.filter((entry) => !entry.onToken),
      "off-token colours at the baseline",
    ).toEqual([]);
    expect(
      strayGold(report.gold, partners),
      "stray gold at the baseline",
    ).toEqual([]);
    expect(report.dashes, "non-hyphen dashes at the baseline").toEqual([]);

    // The empty state's badge is the one place `red-vivid` is painted; if it
    // stops appearing, this inventory has stopped covering the gradient.
    const vivid = TOKEN_COLOURS.find((entry) =>
      entry.names.includes("redVivid"),
    )!;
    expect(
      report.colours.map((colour) => colour.hex),
      "the empty-state badge gradient",
    ).toContain(vivid.hex);
  });

  test("mid-beat: the thinking panel's gold is the sweep and the glow", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator('[data-slot="empty-state-panel"]')).toBeVisible();
    await page
      .getByRole("button", { name: "Shirt sales by kit & sponsor badges" })
      .first()
      .click();
    await expect(page.locator('[data-slot="thinking-panel"]')).toBeVisible();

    const report = await readBrand(page);
    const partners = await partnerBrandColours();
    const verdicts = classifyColours(report.colours, partners);

    // eslint-disable-next-line no-console
    console.log(
      `\nGOLD AUDIT - mid-beat\n${formatGoldAudit(report.gold, partners)}`,
    );

    expect(
      verdicts.filter((entry) => !entry.onToken),
      "off-token colours mid-beat",
    ).toEqual([]);
    expect(strayGold(report.gold, partners), "stray gold mid-beat").toEqual([]);
    expect(report.dashes, "non-hyphen dashes mid-beat").toEqual([]);

    const slots = new Set(report.gold.map((paint) => paint.slot));
    expect(slots, "the thinking sweep").toContain("thinking-scan");
  });

  test("the fallback panel: authored prose, dash-free and on-token", async ({
    page,
  }) => {
    await page.goto("/");
    await signIn(page);
    await expect(page.locator('[data-slot="empty-state-panel"]')).toBeVisible();
    await askFromBaseline(page, "what is the weather in basel");
    await expect(page.locator('[data-slot="fallback-panel"]')).toBeVisible();

    const report = await readBrand(page);
    const partners = await partnerBrandColours();
    const verdicts = classifyColours(report.colours, partners);

    expect(
      verdicts.filter((entry) => !entry.onToken),
      "off-token colours on the fallback",
    ).toEqual([]);
    expect(
      strayGold(report.gold, partners),
      "stray gold on the fallback",
    ).toEqual([]);
    expect(report.dashes, "non-hyphen dashes on the fallback").toEqual([]);
  });
});

/**
 * The counters this suite depends on, restated so a change to the run of show
 * cannot silently shrink what the audit above covers.
 */
test("the run of show is still three heroes and three follow-ups", () => {
  expect(HERO_COUNT).toBe(3);
  expect(FOLLOW_UP_COUNT).toBe(3);
});
