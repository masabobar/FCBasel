/**
 * US-013 — the baseline row, end to end.
 *
 * THE FOUR ACCEPTANCE CRITERIA, in order:
 *   1. exactly the four E3 tiles, in the specified order;
 *   2. every figure from the US-007 dataset, none re-typed in a component;
 *   3. partner monograms with role tags and a hover lift (also
 *      `partner-tile.test.tsx`, which owns the tile itself);
 *   4. Top Products labels not truncated — the fixed 150px column, asserted
 *      here on the real data rather than on a fixture of it.
 *
 * Criterion 2 is the one that needs a technique rather than an assertion. So
 * this suite does both halves: it asserts each rendered string EQUALS what the
 * repository plus a shared formatter produce, and it SCANS the component
 * sources for the dataset's own figures and fails if any appears as a literal.
 * The scan is the same mechanism earlier stories used to prove no storage API
 * is called anywhere in `app/**`.
 */

import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BASELINE_TILE_ORDER,
  BaselineRow,
} from "../../app/components/dashboard/baseline-row";
import {
  H_BAR_LABEL_WIDTH_PX,
  H_BAR_SERIES,
} from "../../app/components/charts/h-bars";
import { sparklineGeometry } from "../../app/components/tiles/kpi-tile";
import { type Clock } from "../../app/lib/calendar";
import {
  type BaselineData,
  loadBaseline,
  SPARKLINE_POINTS,
} from "../../app/lib/dashboard/baseline";
import {
  formatMoney,
  formatNumber,
  formatSharePercent,
  formatSignedPercent,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { createMockBaselineRepository } from "../../app/lib/mock/baseline";
import {
  matchCapacityShare,
  scoreline,
} from "../../app/lib/repositories/derive";
import { VarianceDirection } from "../../app/lib/repositories/enums";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

/* -------------------------------------------------------------- FIXTURE -- */

/** A fixed clock, so the date-derived x-axis labels never move under the suite. */
const SEPTEMBER: Clock = () => new Date(2026, 8, 9);

/** The real dataset, read through the real loader. No hand-written figures. */
const DATA: BaselineData = await loadBaseline(
  createMockBaselineRepository(SEPTEMBER),
);

/* --------------------------------------------------------------- SOURCE -- */

/**
 * Every source file that renders a baseline figure. The scan below covers all
 * of them, so a figure cannot be re-typed one layer up instead.
 */
const SCANNED_SOURCES = [
  "app/components/dashboard/baseline-row.tsx",
  "app/components/tiles/partner-tile.tsx",
  "app/lib/dashboard/baseline.ts",
  "app/routes/_index.tsx",
] as const;

/** Comments explain the figures; only executable code may not restate them. */
function code(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

const SOURCES = SCANNED_SOURCES.map((path) => ({ path, code: code(path) }));

/**
 * Every figure the baseline row displays, taken from the loaded data.
 *
 * Values below 100 are excluded: goals, a partner count and a percentage share
 * are single- or double-digit numbers that collide with Tailwind spans, icon
 * sizes and array indices, so a scan for them would be noise rather than a
 * guard. The figures the criterion is actually about — revenue, attendance,
 * capacity and every unit count — are all far above that floor.
 */
const FIGURE_FLOOR = 100;

const DISPLAYED_FIGURES: readonly number[] = [
  DATA.webshop.total,
  ...DATA.webshop.trend,
  DATA.match.attendance,
  DATA.match.capacity,
  ...DATA.topProducts.rows.map((row) => row.units),
].filter((value) => Math.abs(value) >= FIGURE_FLOOR);

/* ------------------------------------------------------------- HARNESS -- */

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

/** Renders and runs every count-up and growth transition to completion. */
function renderSettled(ui: ReactElement) {
  const frames = stubFrames();
  const result = render(ui);
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
  return { ...result, frames };
}

function renderRow() {
  return renderSettled(<BaselineRow data={DATA} />);
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ------------------------------------------------- ① FOUR TILES, IN ORDER -- */

describe("BaselineRow — exactly four tiles, in the specified order", () => {
  it("renders four tiles and no more", () => {
    renderRow();

    expect(slots("card")).toHaveLength(4);
  });

  it("orders them Webshop revenue, Last home match, Top products, Active partners", () => {
    renderRow();

    const titles = slots("card")
      .map((card) => card.querySelector("h2"))
      .map((heading) => heading?.textContent);

    expect(titles).toEqual([...BASELINE_TILE_ORDER]);
    expect(BASELINE_TILE_ORDER).toEqual([
      "Webshop revenue",
      "Last home match",
      "Top products",
      "Active partners",
    ]);
  });

  it("titles every tile as an h2, so the sr-only h1 outline is unbroken", () => {
    renderRow();

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(4);
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(0);
  });

  it("returns the tiles as siblings — it owns no grid of its own", () => {
    // There is exactly one grid on this screen: US-012's canvas.
    const { container } = renderRow();

    expect(container.childElementCount).toBe(4);
    for (const child of container.children) {
      expect(child.getAttribute("data-slot")).toBe("card");
    }
  });

  it("places each tile on the canvas grid by span, not by a nested grid", () => {
    renderRow();

    const [webshop, match, products, partners] = slots("card");
    expect(webshop!.className).toContain("lg:col-span-3");
    expect(match!.className).toContain("lg:col-span-3");
    expect(products!.className).toContain("lg:col-span-6");
    expect(partners!.className).toContain("col-span-full");
  });

  it("carries no narrative caption — prose belongs to the answers", () => {
    renderRow();

    expect(slots("card-caption")).toHaveLength(0);
  });
});

/* ------------------------------------------- ② FIGURES FROM THE DATASET -- */

describe("BaselineRow — webshop revenue", () => {
  it("shows the computed total through the money formatter", () => {
    renderRow();

    expect(slots("kpi-value")[0]).toHaveTextContent(
      formatMoney(DATA.webshop.total),
    );
  });

  it("shows the computed delta as a signed percentage, pointing up", () => {
    renderRow();

    const chip = slots("delta-chip")[0]!;
    expect(chip).toHaveTextContent(
      formatSignedPercent(DATA.webshop.deltaPercent),
    );
    expect(chip).toHaveAttribute("data-direction", VarianceDirection.UP);
  });

  it("names the comparison period from the dataset's own label", () => {
    renderRow();

    expect(slots("kpi-subtitle")[0]).toHaveTextContent(
      `vs ${DATA.webshop.comparisonLabel.toLowerCase()}`,
    );
  });

  it("scopes the tile with the period label the dataset carries", () => {
    renderRow();

    expect(slots("card-subtitle")[0]).toHaveTextContent(
      DATA.webshop.periodLabel,
    );
  });

  it("draws the six-point sparkline from that same series", () => {
    renderRow();

    expect(DATA.webshop.trend).toHaveLength(SPARKLINE_POINTS);
    expect(slot("kpi-sparkline-line")).toHaveAttribute(
      "d",
      sparklineGeometry(DATA.webshop.trend)!.line,
    );
  });

  it("draws exactly one sparkline — the match tile has no trend to show", () => {
    renderRow();

    expect(slots("kpi-sparkline")).toHaveLength(1);
  });
});

describe("BaselineRow — last home match", () => {
  it("renders the scoreline with a plain hyphen, from derive.ts", () => {
    renderRow();

    const subtitle = slots("card-subtitle")[1]!;
    expect(subtitle).toHaveTextContent(scoreline(DATA.match));
    expect(subtitle.textContent).toBe("FCB 2-1 Sion");
  });

  it("never renders an en dash or an em dash in a scoreline", () => {
    const { container } = renderRow();

    expect(container.textContent).not.toMatch(/\d\s*[–—]\s*\d/);
  });

  it("shows the attendance through the shared number formatter", () => {
    renderRow();

    expect(slots("kpi-value")[1]).toHaveTextContent(
      formatNumber(DATA.match.attendance),
    );
  });

  it("quotes the capacity as an approximation, and the share of it", () => {
    renderRow();

    const subtitle = slots("kpi-subtitle")[1]!;
    expect(subtitle).toHaveTextContent(`~${formatNumber(DATA.match.capacity)}`);
    expect(subtitle).toHaveTextContent(
      formatSharePercent(matchCapacityShare(DATA.match)),
    );
  });

  it("carries no variance chip — one fixture has nothing to compare against", () => {
    renderRow();

    // The webshop tile is the only tile in the row with a delta.
    expect(slots("delta-chip")).toHaveLength(1);
  });
});

describe("BaselineRow — top products", () => {
  it("renders one bar per product, best-selling first, from the dataset", () => {
    renderRow();

    const labels = slots("h-bar-label").map((node) => node.textContent);
    expect(labels).toEqual(DATA.topProducts.rows.map((row) => row.product));
  });

  it("renders every unit count through the shared number formatter", () => {
    renderRow();

    const values = slots("h-bar-value").map((node) => node.textContent);
    expect(values).toEqual(
      DATA.topProducts.rows.map((row) => formatNumber(row.units)),
    );
  });

  it("scopes the tile with the dataset's period label", () => {
    renderRow();

    expect(slots("card-subtitle")[2]).toHaveTextContent(DATA.topProducts.label);
  });

  it("uses the club-blue series, as H_BAR_SERIES assigns Top Products", () => {
    renderRow();

    const fill = slots("h-bar-fill")[0]!;
    for (const className of H_BAR_SERIES.blue.split(" ")) {
      expect(fill).toHaveClass(className);
    }
  });

  it("leaves the action slot empty — the period filter is US-026 / US-016", () => {
    renderRow();

    expect(slots("card-action")).toHaveLength(0);
  });

  it("grows the bars rather than snapping them to width", () => {
    // Before the growth frame every fill is at zero; after it, at its share.
    const frames = stubFrames();
    render(<BaselineRow data={DATA} />);

    expect(slots("h-bar-fill")[0]!.style.width).toBe("0%");

    frames.advance();
    frames.advance();

    expect(slots("h-bar-fill")[0]!.style.width).toBe("100%");
    expect(slots("h-bar-fill")[0]!.className).toContain("transition-[width]");
  });
});

/* ------------------------------------ ④ LABELS ARE NOT TRUNCATED, END TO END -- */

describe("BaselineRow — Top Products labels show in full", () => {
  it("renders the two long names complete, quotes and slashes included", () => {
    renderRow();

    const labels = slots("h-bar-label").map((node) => node.textContent);
    expect(labels).toContain("Home shirt 26/27");
    expect(labels).toContain('Cap "Rotblau"');
  });

  it("gives every label the fixed 150px column and no ellipsis", () => {
    renderRow();

    const labels = slots("h-bar-label");
    expect(labels).toHaveLength(DATA.topProducts.rows.length);

    for (const label of labels) {
      expect(label.style.width).toBe(`${H_BAR_LABEL_WIDTH_PX}px`);
      // A long name WRAPS inside that column; it never gains an ellipsis.
      expect(label.className).toContain("break-words");
      expect(label.className).not.toMatch(/truncate|text-ellipsis|line-clamp/);
      expect(label.style.textOverflow).toBe("");
      expect(label.style.whiteSpace).toBe("");
    }
  });

  it("pins the column at the width the reported defect was fixed to", () => {
    expect(H_BAR_LABEL_WIDTH_PX).toBe(150);
  });
});

/* ---------------------------------------------- ③ PARTNERS IN THE ROW ----- */

describe("BaselineRow — active partners", () => {
  it("renders a monogram plate and a role tag for all six", () => {
    renderRow();

    expect(slots("partner-card")).toHaveLength(DATA.partners.length);
    expect(DATA.partners).toHaveLength(6);
    expect(slots("partner-monogram")).toHaveLength(6);
    expect(slots("partner-role").map((node) => node.textContent)).toEqual(
      DATA.partners.map((partner) => partner.roleLabel),
    );
  });

  it("paints each plate in that partner's own brand colour", () => {
    renderRow();

    const plates = slots("partner-monogram");
    DATA.partners.forEach((partner, index) => {
      expect(plates[index]).toHaveStyle({
        backgroundColor: partner.brandColor,
      });
    });
  });

  it("gives every plate the hover lift", () => {
    renderRow();

    for (const card of slots("partner-card")) {
      expect(card.className).toContain("hover:-translate-y-0.5");
      expect(card.className).toContain("hover:shadow-raised");
    }
  });
});

/* --------------------------------- ② NO FIGURE IS RE-TYPED IN A COMPONENT -- */

describe("BaselineRow — no figure is re-typed in a component", () => {
  it("scans a source set that covers every layer a figure passes through", () => {
    expect(SOURCES).toHaveLength(SCANNED_SOURCES.length);
    for (const source of SOURCES) {
      expect(source.code.length).toBeGreaterThan(0);
    }
  });

  it("has figures to scan for, including the four the Specification pins", () => {
    expect(DISPLAYED_FIGURES.length).toBeGreaterThanOrEqual(10);
    expect(DISPLAYED_FIGURES).toContain(148_200);
    expect(DISPLAYED_FIGURES).toContain(28_900);
    expect(DISPLAYED_FIGURES).toContain(38_000);
    expect(DISPLAYED_FIGURES).toContain(1_840);
  });

  it("contains no displayed figure as a numeric literal, however spelt", () => {
    for (const figure of DISPLAYED_FIGURES) {
      // Plain digits, TypeScript's `_` grouping, and the rendered string.
      const spellings = [
        String(figure),
        String(figure).replace(/\B(?=(\d{3})+(?!\d))/g, "_"),
        formatNumber(figure),
      ];

      for (const source of SOURCES) {
        for (const spelling of spellings) {
          expect(
            source.code,
            `${source.path} restates the figure ${spelling}`,
          ).not.toContain(spelling);
        }
      }
    }
  });

  it("contains no pre-formatted money or percentage string", () => {
    for (const source of SOURCES) {
      // `CHF 148’200` is built by `formatMoney`, never written out.
      expect(source.code).not.toMatch(/CHF\s*\d/);
      expect(source.code).not.toMatch(/\d+(\.\d+)?%/);
    }
  });

  it("assembles no scoreline of its own", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toContain("FCB");
      expect(source.code).not.toContain("Sion");
    }
  });

  it("names no product and no partner", () => {
    const names = [
      ...DATA.topProducts.rows.map((row) => row.product),
      ...DATA.partners.map((partner) => partner.name),
    ];

    for (const source of SOURCES) {
      for (const name of names) {
        expect(source.code).not.toContain(name);
      }
    }
  });

  it("builds no number string itself — every figure goes through format.ts", () => {
    for (const source of SOURCES) {
      expect(source.code).not.toContain("toLocaleString");
      expect(source.code).not.toContain("Intl.NumberFormat");
      expect(source.code).not.toContain("toFixed");
    }
  });
});

/* --------------------------------------------------------- REDUCED MOTION -- */

describe("BaselineRow — reduced motion renders the final state", () => {
  it("shows every figure at once, with no element left at zero", () => {
    stubMatchMedia(true);
    render(<BaselineRow data={DATA} />);

    // The count-ups have landed without a single frame being run.
    expect(slots("kpi-value")[0]).toHaveTextContent(
      formatMoney(DATA.webshop.total),
    );
    expect(slots("kpi-value")[1]).toHaveTextContent(
      formatNumber(DATA.match.attendance),
    );
    expect(slots("h-bar-value").map((node) => node.textContent)).toEqual(
      DATA.topProducts.rows.map((row) => formatNumber(row.units)),
    );

    // And no bar and no sparkline is stranded at its zero geometry.
    for (const fill of slots("h-bar-fill")) {
      expect(fill.style.width).not.toBe("0%");
    }
    expect(slot("kpi-sparkline-line")).toHaveAttribute(
      "stroke-dashoffset",
      "0",
    );
  });

  it("still shows all four tiles and all six partners", () => {
    stubMatchMedia(true);
    render(<BaselineRow data={DATA} />);

    expect(slots("card")).toHaveLength(4);
    expect(slots("partner-card")).toHaveLength(6);
  });
});
