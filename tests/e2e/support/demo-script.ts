import { expect, type Page } from "@playwright/test";

/**
 * The run-of-show, and the instrument that measures it (US-040).
 *
 * Two things live here so the spec beside it reads as acceptance criteria
 * rather than as DOM plumbing:
 *
 *   {@link loadDemoScript}  drives the presenter's whole script — three heroes
 *                           and three follow-ups — and waits for each answer to
 *                           land rather than sleeping through it.
 *   {@link measureLayout}   takes one geometric reading of the finished screen.
 *
 * THE FULL SCRIPT IS THE WORST CASE, which is why nothing here measures the
 * baseline alone. Six answers on screen is the tallest the canvas ever gets,
 * the most charts it ever holds, and the only state in which every legend, axis
 * and delta chip US-040 is accountable for is actually rendered.
 */

/* -------------------------------------------------------- THE RUN OF SHOW -- */

/**
 * Chip labels, verbatim from `app/lib/dashboard/chips.ts`, in the order the
 * Reference Guide's run-of-show asks them: each hero, then its follow-up.
 *
 * Typed out rather than imported because this suite drives the SERVED page as a
 * presenter would — through the accessible name on screen. Importing the
 * constant would let a label change and the test keep passing against a chip
 * nobody can find.
 */
export const DEMO_SCRIPT = [
  { chip: "Shirt sales by kit & sponsor badges", kind: "hero" },
  { chip: "Which badge should we push next?", kind: "followUp" },
  { chip: "Ticket revenue, this year vs last", kind: "hero" },
  { chip: "Which fixtures are driving the drop?", kind: "followUp" },
  { chip: "Department budgets vs actuals", kind: "hero" },
  { chip: "Why is Marketing over budget & behind target?", kind: "followUp" },
] as const;

export const HERO_COUNT = DEMO_SCRIPT.filter(
  (step) => step.kind === "hero",
).length;

export const FOLLOW_UP_COUNT = DEMO_SCRIPT.filter(
  (step) => step.kind === "followUp",
).length;

/**
 * How long the screen is given to come to rest after the last answer lands.
 *
 * The beat itself is waited out by assertion, not by clock — but the tile
 * entrance, the bar growth and the count-up are CSS transitions whose
 * mid-flight widths are not the widths this story is about. The longest of them
 * is `--duration-count-up` at 900ms over `--duration-grow` at 700ms, so this is
 * the settle, not the wait.
 */
const SETTLE_MS = 1_500;

/**
 * Run the presenter's script, waiting on the DOM for each answer.
 *
 * A hero's answer ADDS a section; a follow-up FLIPS its section's phase and
 * adds the gold divider (`app/lib/dashboard/sections.ts`), so the two steps are
 * waited on by different counters. Both also wait for the thinking panel to
 * leave, which is what makes this deterministic instead of a race with a
 * ~1150ms timer.
 */
export async function loadDemoScript(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator('[data-slot="empty-state-panel"]')).toBeVisible();

  let heroes = 0;
  let followUps = 0;

  for (const step of DEMO_SCRIPT) {
    // Substring, deliberately NOT `exact`: a follow-up chip prefixes a visually
    // hidden "Follow-up:" into its accessible name (US-029), so its name is the
    // hint plus the label. The visible label is what a presenter reads and what
    // this asserts; the six labels are distinct, so a substring is unambiguous.
    await page.getByRole("button", { name: step.chip }).click();

    if (step.kind === "hero") heroes += 1;
    else followUps += 1;

    await expect(page.locator('[data-slot="insight-section"]')).toHaveCount(
      heroes,
    );
    await expect(page.locator('[data-slot="follow-up-divider"]')).toHaveCount(
      followUps,
    );
    await expect(page.locator('[data-slot="thinking-panel"]')).toHaveCount(0);
  }

  await page.waitForTimeout(SETTLE_MS);
}

/* -------------------------------------------------------- THE MEASUREMENT -- */

/** One element that is wider than the box meant to contain it. */
export interface Offender {
  readonly slot: string;
  readonly tile: string | null;
  readonly text: string;
  readonly over: number;
}

/** One geometric reading of the whole canvas. */
export interface LayoutReport {
  /** The page's own horizontal scroll: these two must be equal. */
  readonly documentScrollWidth: number;
  readonly documentClientWidth: number;
  /** Elements whose `overflow-x` is genuinely scrolling — a scrollbar in a card. */
  readonly inCardScrollers: readonly Offender[];
  /** Real content cut off by a clipping ancestor. Decoration is excluded. */
  readonly clippedContent: readonly Offender[];
  /** Chart labels whose ellipsis has engaged. */
  readonly truncatedLabels: readonly Offender[];
  /** Chart text painted outside the plot it belongs to. */
  readonly chartTextOutsidePlot: readonly Offender[];
  /** Legend rows painted outside their tile. */
  readonly legendsOutsideTile: readonly Offender[];
  /** Grid items and cards escaping their container — a clipped tile. */
  readonly tilesOutsideContainer: readonly Offender[];
  /** Gap between the lowest content and the pinned bar, fully scrolled down. */
  readonly promptBarClearance: number;
  readonly sections: number;
  readonly followUps: number;
  readonly charts: number;
  /** Smallest rendered font size on the canvas, in CSS pixels. */
  readonly smallestFontPx: number;
  /**
   * Narrowest gap between two neighbouring year-on-year delta chips, or `null`
   * where fewer than two are on screen. US-036's measurement, re-taken.
   */
  readonly deltaChipMinGap: number | null;
  readonly deltaChipCellWidth: number;
  readonly widestDeltaChip: number;
}

/**
 * Chart text that has to stay readable — AC5's "readable axis labels" and "no
 * clipped legends", named slot by slot so a failure says which label.
 *
 * A tile CAPTION is deliberately absent: `CARD_CAPTION_VARIANTS.tile` carries
 * `truncate` by design, and flagging it would be flagging the design.
 */
const CHART_LABEL_SLOTS = [
  "grouped-bar-axis-label",
  "grouped-bar-label",
  "grouped-bar-legend-item",
  "line-chart-axis-label",
  "line-chart-legend-item",
  "donut-legend-name",
  "donut-legend-value",
  "donut-legend-share",
  "v-bar-label",
  "v-bar-value",
  "h-bar-label",
  "h-bar-value",
  "compare-bar-label",
  "compare-bar-value",
  "department-header",
  "department-name",
] as const;

const LEGEND_SLOTS = [
  "grouped-bar-legend",
  "line-chart-legend",
  "donut-legend",
] as const;

/**
 * Take the reading.
 *
 * Everything runs inside the page because these are live layout values; the
 * function is passed the slot lists so the vocabulary stays in this file.
 *
 * ONE SUBTLETY WORTH THE COMMENT. `scrollWidth > clientWidth` on a clipping box
 * is NOT by itself a defect: the hero band deliberately clips a decorative
 * bloom that overhangs its corner by 30px (`hero-band-wash`, `aria-hidden`).
 * So a clipping box is only reported when a NON-decorative descendant is the
 * thing sticking out — the difference between "a gradient is cropped" and "the
 * presenter cannot read the fourth period filter".
 */
export async function measureLayout(page: Page): Promise<LayoutReport> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(100);

  return page.evaluate(
    ([labelSlots, legendSlots]) => {
      const EPS = 1;

      const describe = (el: Element, over: number) => ({
        slot: el.getAttribute("data-slot") ?? el.tagName.toLowerCase(),
        tile:
          el
            .closest('[data-slot="card"]')
            ?.querySelector('[data-slot="card-header"]')
            ?.textContent?.trim()
            .slice(0, 40) ?? null,
        text: (el.textContent ?? "").trim().slice(0, 40),
        over: Number(over.toFixed(1)),
      });

      const decorative = (el: Element) =>
        Boolean(el.closest('[aria-hidden="true"]'));

      /** Right edge of the box that `overflow: hidden` clips against. */
      const clipEdge = (el: Element) => {
        const style = getComputedStyle(el);
        return (
          el.getBoundingClientRect().right -
          parseFloat(style.borderRightWidth || "0")
        );
      };

      /** The worst non-decorative descendant sticking out of a clipping box. */
      const escapingContent = (el: Element) => {
        const edge = clipEdge(el);
        let worst = 0;
        let culprit: Element | null = null;
        for (const node of el.querySelectorAll("*")) {
          if (decorative(node)) continue;
          const box = node.getBoundingClientRect();
          if (box.width === 0 && box.height === 0) continue;
          const over = box.right - edge;
          if (over > worst) {
            worst = over;
            culprit = node;
          }
        }
        return culprit ? describe(culprit, worst) : null;
      };

      const inCardScrollers: ReturnType<typeof describe>[] = [];
      const clippedContent: ReturnType<typeof describe>[] = [];

      for (const el of document.querySelectorAll("[data-slot]")) {
        if (el instanceof SVGElement) continue;
        if (el.scrollWidth - el.clientWidth <= EPS) continue;

        const overflowX = getComputedStyle(el).overflowX;
        if (overflowX === "auto" || overflowX === "scroll") {
          inCardScrollers.push(describe(el, el.scrollWidth - el.clientWidth));
        } else if (overflowX === "hidden" || overflowX === "clip") {
          const escaping = escapingContent(el);
          if (escaping && escaping.over > EPS) clippedContent.push(escaping);
        }
      }

      const truncatedLabels: ReturnType<typeof describe>[] = [];
      for (const slot of labelSlots) {
        for (const el of document.querySelectorAll(`[data-slot="${slot}"]`)) {
          if (el instanceof SVGElement) continue;
          const over = el.scrollWidth - el.clientWidth;
          if (over > EPS) truncatedLabels.push(describe(el, over));
        }
      }

      // SVG text has no scroll box; the honest test is the painted box against
      // the <svg> that owns it.
      const chartTextOutsidePlot: ReturnType<typeof describe>[] = [];
      for (const text of document.querySelectorAll<SVGTextElement>(
        "svg text",
      )) {
        const svg = text.ownerSVGElement;
        if (!svg) continue;
        const box = text.getBoundingClientRect();
        if (box.width === 0) continue;
        const plot = svg.getBoundingClientRect();
        const over = Math.max(plot.left - box.left, box.right - plot.right);
        if (over > EPS) chartTextOutsidePlot.push(describe(text, over));
      }

      const legendsOutsideTile: ReturnType<typeof describe>[] = [];
      for (const slot of legendSlots) {
        for (const legend of document.querySelectorAll(
          `[data-slot="${slot}"]`,
        )) {
          const tile = legend.closest('[data-slot="card"]');
          if (!tile) continue;
          const edge = clipEdge(tile);
          const box = legend.getBoundingClientRect();
          if (box.right - edge > EPS) {
            legendsOutsideTile.push(describe(legend, box.right - edge));
          }
        }
      }

      const grid = document.querySelector('[data-slot="canvas-grid"]')!;
      const tilesOutsideContainer: ReturnType<typeof describe>[] = [];
      const checkInside = (child: Element, parent: Element) => {
        const box = child.getBoundingClientRect();
        const bounds = parent.getBoundingClientRect();
        const over = Math.max(bounds.left - box.left, box.right - bounds.right);
        if (over > EPS) tilesOutsideContainer.push(describe(child, over));
      };
      for (const child of grid.children) checkInside(child, grid);
      for (const card of document.querySelectorAll('[data-slot="card"]')) {
        if (card.parentElement) checkInside(card, card.parentElement);
      }

      const bar = document
        .querySelector('[data-slot="prompt-bar"]')!
        .getBoundingClientRect();
      let contentBottom = -Infinity;
      for (const child of grid.children) {
        contentBottom = Math.max(
          contentBottom,
          child.getBoundingClientRect().bottom,
        );
      }

      let smallestFontPx = Infinity;
      for (const el of document.querySelectorAll('[data-slot="canvas"] *')) {
        const first = el.firstChild;
        if (!first || first.nodeType !== Node.TEXT_NODE) continue;
        if (!first.textContent?.trim()) continue;
        smallestFontPx = Math.min(
          smallestFontPx,
          parseFloat(getComputedStyle(el).fontSize),
        );
      }

      const cells = [
        ...document.querySelectorAll('[data-slot="grouped-bar-chip-cell"]'),
      ];
      const chips = cells
        .map((cell) => cell.querySelector('[data-slot="delta-chip"]'))
        .filter((chip): chip is Element => chip !== null)
        .map((chip) => chip.getBoundingClientRect());
      let minGap = Infinity;
      let widest = 0;
      for (const chip of chips) widest = Math.max(widest, chip.width);
      for (let i = 1; i < chips.length; i += 1) {
        minGap = Math.min(minGap, chips[i]!.left - chips[i - 1]!.right);
      }

      return {
        documentScrollWidth: document.documentElement.scrollWidth,
        documentClientWidth: document.documentElement.clientWidth,
        inCardScrollers,
        clippedContent,
        truncatedLabels,
        chartTextOutsidePlot,
        legendsOutsideTile,
        tilesOutsideContainer,
        promptBarClearance: Number((bar.top - contentBottom).toFixed(1)),
        sections: document.querySelectorAll('[data-slot="insight-section"]')
          .length,
        followUps: document.querySelectorAll('[data-slot="follow-up-divider"]')
          .length,
        charts: document.querySelectorAll('[data-slot="canvas"] svg').length,
        smallestFontPx: Number.isFinite(smallestFontPx) ? smallestFontPx : 0,
        deltaChipMinGap: chips.length > 1 ? Number(minGap.toFixed(1)) : null,
        deltaChipCellWidth: cells.length
          ? Number(cells[0]!.getBoundingClientRect().width.toFixed(1))
          : 0,
        widestDeltaChip: Number(widest.toFixed(1)),
      };
    },
    [CHART_LABEL_SLOTS, LEGEND_SLOTS] as [readonly string[], readonly string[]],
  );
}

/**
 * Assert one reading is presentation-clean.
 *
 * Shared by the per-viewport cases and the mid-session resize case, because
 * "no clipping after a resize" and "no clipping at 1440" are the same set of
 * facts measured at different moments.
 */
export function expectPresentationClean(
  report: LayoutReport,
  label: string,
): void {
  // AC1 / AC3: the page itself never scrolls sideways.
  expect(
    report.documentScrollWidth,
    `${label}: page scrolls horizontally`,
  ).toBe(report.documentClientWidth);

  // AC4: no clipped tiles, and nothing escaping its container.
  expect(
    report.tilesOutsideContainer,
    `${label}: tile outside container`,
  ).toEqual([]);
  expect(report.clippedContent, `${label}: content clipped`).toEqual([]);

  // AC2 / AC3: no card asks the presenter to scroll inside it.
  expect(report.inCardScrollers, `${label}: in-card horizontal scroll`).toEqual(
    [],
  );

  // AC5: charts stay legible — nothing truncated, nothing outside its plot,
  // no clipped legend.
  expect(report.truncatedLabels, `${label}: chart label truncated`).toEqual([]);
  expect(
    report.chartTextOutsidePlot,
    `${label}: chart text outside its plot`,
  ).toEqual([]);
  expect(report.legendsOutsideTile, `${label}: legend clipped`).toEqual([]);

  // The pinned prompt bar covers no content once the page is scrolled down.
  expect(
    report.promptBarClearance,
    `${label}: prompt bar overlaps the canvas`,
  ).toBeGreaterThan(0);
}

/** The whole run-of-show really is on screen — this is the worst case or nothing. */
export function expectFullScriptLoaded(
  report: LayoutReport,
  label: string,
): void {
  expect(report.sections, `${label}: heroes on screen`).toBe(HERO_COUNT);
  expect(report.followUps, `${label}: follow-ups on screen`).toBe(
    FOLLOW_UP_COUNT,
  );
  // Six answers plus the baseline draw well over a dozen charts; a collapsed
  // canvas would silently make every other assertion trivial.
  expect(report.charts, `${label}: charts rendered`).toBeGreaterThan(10);
}
