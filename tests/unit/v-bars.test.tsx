import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_V_BAR_HEIGHT,
  V_BAR_SERIES,
  V_BAR_VIEW_WIDTH,
  VBars,
  VBarTile,
  niceMax,
  vBarGeometry,
  vBarHeight,
  vBarSeries,
  type VBarDatum,
} from "../../app/components/charts/v-bars";
import {
  formatMoneyMillions,
  formatNumber,
  formatSharePercent,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

const V_BARS_CODE = readFileSync(
  resolve(process.cwd(), "app/components/charts/v-bars.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/**
 * Hero 1's kit split, season to date — verbatim from US-034: Home 22'400 /
 * Away 10'300 / 3rd 5'800, total 38'500 shirts.
 */
const KITS: readonly VBarDatum[] = [
  { name: "Home", value: 22_400 },
  { name: "Away", value: 10_300 },
  { name: "3rd", value: 5_800 },
];

/** The same three kits after a period filter press — smaller, same categories. */
const KITS_LAST_MONTH: readonly VBarDatum[] = [
  { name: "Home", value: 4_100 },
  { name: "Away", value: 2_050 },
  { name: "3rd", value: 1_150 },
];

/**
 * A period the kits RE-RANK in: the same three categories, in a different
 * order. This is what separates "keyed by category" from "keyed by index" — an
 * index key reuses the element by POSITION, so with an unchanged order it looks
 * identical and only a re-rank exposes it.
 */
const KITS_RERANKED: readonly VBarDatum[] = [
  { name: "Away", value: 2_050 },
  { name: "3rd", value: 1_150 },
  { name: "Home", value: 4_100 },
];

/** Hero 1's shirt price, for the revenue line in the tooltip. */
const SHIRT_PRICE_CHF = 99;

const TOTAL_SHIRTS = KITS.reduce((sum, kit) => sum + kit.value, 0);

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

/** The column for a category, as the presenter would point at it. */
function column(name: string, within: ParentNode = document): HTMLElement {
  const found = slots("v-bar-column", within).find(
    (candidate) => candidate.dataset.name === name,
  );
  if (!found) throw new Error(`no column for "${name}"`);
  return found;
}

function bar(name: string, within: ParentNode = document): HTMLElement {
  return slot("v-bar", column(name, within))!;
}

function barGeometry(name: string, within: ParentNode = document) {
  const rect = bar(name, within);
  return {
    x: rect.getAttribute("x"),
    y: rect.getAttribute("y"),
    height: rect.getAttribute("height"),
  };
}

function valueText(name: string, within: ParentNode = document): string {
  return slot("v-bar-value", column(name, within))!.textContent!;
}

function plot(within: ParentNode = document): HTMLElement {
  return slot("v-bars-plot", within)!;
}

/** A formatter that shows the raw counted number, for the count-up tests. */
function raw(value: number): string {
  return value.toFixed(4);
}

/**
 * Renders and runs the animations to completion, so a geometry assertion sees
 * the grown bars while still exercising the real (non-reduced) path. Two
 * advances: the first frame only marks the start, the second lands.
 */
function renderSettled(ui: ReactElement) {
  const frames = stubFrames();
  const result = render(ui);
  frames.advance(COUNT_UP_DURATION_MS);
  frames.advance(COUNT_UP_DURATION_MS);
  return { ...result, frames };
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

describe("niceMax / vBarHeight / vBarGeometry — the scale, without a DOM", () => {
  it("snaps the axis top up to a round figure above the tallest bar", () => {
    // 22'400 with 10% headroom, rounded up to the next half-magnitude.
    expect(niceMax(22_400)).toBe(25_000);
    expect(niceMax(10_300)).toBe(15_000);
    expect(niceMax(38_500)).toBe(45_000);
  });

  it("never returns zero or a non-finite maximum to divide by", () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(-500)).toBe(1);
    expect(niceMax(Number.NaN)).toBe(1);
    expect(niceMax(Number.POSITIVE_INFINITY)).toBe(1);
  });

  it("scales a bar against the axis top, and clamps it to the plot", () => {
    expect(vBarHeight(100, 100, 158)).toBe(158);
    expect(vBarHeight(50, 100, 158)).toBe(79);
    expect(vBarHeight(200, 100, 158)).toBe(158);
  });

  it("draws nothing rather than NaN for a zero, a negative or a hole", () => {
    expect(vBarHeight(0, 100, 158)).toBe(0);
    expect(vBarHeight(-40, 100, 158)).toBe(0);
    expect(vBarHeight(Number.NaN, 100, 158)).toBe(0);
    expect(vBarHeight(40, 0, 158)).toBe(0);
  });

  it("slots the bars evenly and leaves as much gap as bar", () => {
    const geometry = vBarGeometry(KITS)!;

    expect(geometry.bars).toHaveLength(3);
    expect(geometry.width).toBe(V_BAR_VIEW_WIDTH);
    expect(geometry.height).toBe(DEFAULT_V_BAR_HEIGHT);
    expect(geometry.barWidth).toBeCloseTo(geometry.slotWidth / 2, 1);

    // Each bar is centred in its own slot, in order.
    const centres = geometry.bars.map((one) => one.centerX);
    expect(centres[0]).toBeLessThan(centres[1]!);
    expect(centres[1]).toBeLessThan(centres[2]!);
    for (const one of geometry.bars) {
      expect(one.x).toBeCloseTo(one.centerX - geometry.barWidth / 2, 2);
    }
  });

  it("stands every bar on the baseline and scales it against the axis top", () => {
    const geometry = vBarGeometry(KITS)!;

    expect(geometry.max).toBe(25_000);
    for (const one of geometry.bars) {
      expect(one.y + one.height).toBeCloseTo(geometry.baselineY, 2);
    }
    // Home is the tallest; the others are its proportion, not a rescale.
    expect(geometry.bars[0]!.height).toBeGreaterThan(
      geometry.bars[1]!.height * 2,
    );
    expect(geometry.bars[0]!.height).toBe(
      vBarHeight(22_400, 25_000, geometry.plotHeight),
    );
  });

  it("puts four gridlines inside the plot, the top one at the axis maximum", () => {
    const geometry = vBarGeometry(KITS)!;

    expect(geometry.gridYs).toHaveLength(4);
    expect(geometry.gridYs.at(-1)).toBe(geometry.plotTop);
    for (const y of geometry.gridYs) {
      expect(y).toBeGreaterThanOrEqual(geometry.plotTop);
      expect(y).toBeLessThanOrEqual(geometry.baselineY);
    }
  });

  it("ignores a hole in the data when choosing the axis top", () => {
    const geometry = vBarGeometry([
      { name: "Home", value: 1_000 },
      { name: "Away", value: Number.NaN },
    ])!;

    // The axis is scaled to the readings that exist, and the hole draws no bar.
    expect(geometry.max).toBe(niceMax(1_000));
    expect(geometry.bars[1]!.height).toBe(0);
    expect(geometry.bars[1]!.y).toBe(geometry.baselineY);
  });

  it("has nothing to draw for an empty list or an impossible height", () => {
    expect(vBarGeometry([])).toBeNull();
    expect(vBarGeometry(KITS, 0)).toBeNull();
    expect(vBarGeometry(KITS, Number.NaN)).toBeNull();
  });

  it("takes a caller's height for the plot", () => {
    const geometry = vBarGeometry(KITS, 240)!;

    expect(geometry.height).toBe(240);
    expect(geometry.baselineY).toBeGreaterThan(vBarGeometry(KITS)!.baselineY);
  });
});

describe("VBars — the bars themselves", () => {
  it("renders one gradient-filled, round-capped bar per category", () => {
    renderSettled(<VBars bars={KITS} />);

    expect(slots("v-bar-column")).toHaveLength(3);

    for (const kit of KITS) {
      const rect = bar(kit.name);
      expect(rect.getAttribute("fill")).toMatch(/^url\(#vbar-.+\)$/);
      expect(rect.getAttribute("rx")).toBe("5");
    }
  });

  it("colours the three kits red, blue and navy from the token set", () => {
    renderSettled(<VBars bars={KITS} />);

    const stops = slots("v-bar-gradient").map(
      (gradient) =>
        gradient.querySelector("stop")?.getAttribute("stop-color") ?? "",
    );

    expect(stops).toEqual([
      V_BAR_SERIES.red,
      V_BAR_SERIES.blue,
      V_BAR_SERIES.navy,
    ]);
    // Series identity, never a judgement — and gold is not a series colour.
    expect(Object.keys(V_BAR_SERIES)).toEqual(["red", "blue", "navy"]);
    expect(V_BAR_SERIES).not.toHaveProperty("gold");
  });

  it("lets a caller name a bar's colour instead of taking the cycle", () => {
    renderSettled(
      <VBars
        bars={[
          { name: "Home", value: 100, series: "navy" },
          { name: "Away", value: 50, series: "navy" },
        ]}
      />,
    );

    // One gradient for one distinct colour, and both bars point at it.
    expect(slots("v-bar-gradient")).toHaveLength(1);
    expect(bar("Home").getAttribute("fill")).toBe(
      bar("Away").getAttribute("fill"),
    );
    expect(vBarSeries(undefined, 0)).toBe("red");
    expect(vBarSeries("blue", 0)).toBe("blue");
    // A fourth bar wraps the cycle rather than falling out of the token set.
    expect(vBarSeries(undefined, 3)).toBe("red");
  });

  it("grows each bar from the baseline to its own share of the axis", () => {
    const frames = stubFrames();
    render(<VBars bars={KITS} />);

    const geometry = vBarGeometry(KITS)!;

    // Before growth every bar has no height and stands on the axis.
    expect(barGeometry("Home").height).toBe("0");
    expect(barGeometry("Home").y).toBe(String(geometry.baselineY));

    frames.advance();
    frames.advance();

    expect(barGeometry("Home")).toEqual({
      x: String(geometry.bars[0]!.x),
      y: String(geometry.bars[0]!.y),
      height: String(geometry.bars[0]!.height),
    });
    expect(Number(barGeometry("3rd").height)).toBeLessThan(
      Number(barGeometry("Away").height),
    );
  });

  it("transitions height AND position in CSS, timed from the motion token", () => {
    renderSettled(<VBars bars={KITS} />);

    expect(bar("Home")).toHaveClass(
      "transition-[x,y,height]",
      "duration-(--duration-grow)",
      "ease-enter",
    );
    expect(APP_CSS).toMatch(/--duration-grow:/);
    expect(APP_CSS).toMatch(/--ease-enter:/);
  });

  it("draws gridlines behind the bars, plus the axis they stand on", () => {
    const { container } = renderSettled(<VBars bars={KITS} />);

    expect(slots("v-bar-grid")).toHaveLength(4);
    expect(slot("v-bar-grid")).toHaveClass("stroke-line");
    expect(slot("v-bar-axis")).toHaveClass("stroke-border");

    // Painted first, so a bar is drawn over its gridlines and not under them.
    const painted = [...container.querySelectorAll("[data-slot^='v-bar']")].map(
      (node) => node.getAttribute("data-slot"),
    );
    expect(painted.indexOf("v-bar-grid")).toBeLessThan(
      painted.indexOf("v-bar-column"),
    );
  });

  it("keeps the plot itself out of the accessibility tree", () => {
    renderSettled(<VBars bars={KITS} label="Shirt sales by kit" />);

    expect(slot("v-bars-svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("group", { name: "Shirt sales by kit" })).toBe(
      plot(),
    );
  });
});

describe("VBars — the value labels", () => {
  it("counts every label up to its figure and lands exactly on it", () => {
    const frames = stubFrames();
    render(<VBars bars={KITS} format={raw} />);

    frames.advance(0);
    expect(Number(valueText("Home"))).toBe(0);

    frames.advance(COUNT_UP_DURATION_MS / 2);
    const midway = Number(valueText("Home"));
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(22_400);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(valueText("Home"))).toBe(22_400);
    expect(Number(valueText("3rd"))).toBe(5_800);
  });

  it("sits ABOVE its bar, and rides up with it", () => {
    const frames = stubFrames();
    render(<VBars bars={KITS} />);

    const geometry = vBarGeometry(KITS)!;
    const anchor = () => slot("v-bar-value-anchor", column("Home"))!;

    // Ungrown, the label is on the baseline with the bar.
    expect(anchor().style.transform).toBe(
      `translateY(${geometry.baselineY}px)`,
    );

    frames.advance();
    frames.advance();

    expect(anchor().style.transform).toBe(
      `translateY(${geometry.bars[0]!.y}px)`,
    );
    expect(anchor()).toHaveClass(
      "transition-transform",
      "duration-(--duration-grow)",
      "ease-enter",
    );
    // The text is offset upwards from the bar's own top, so it never overlaps.
    const label = slot("v-bar-value", column("Home"))!;
    expect(Number(label.getAttribute("y"))).toBeLessThan(0);
    expect(label.getAttribute("text-anchor")).toBe("middle");
  });

  it("formats a plain count by default, so no caller hand-builds a string", () => {
    renderSettled(<VBars bars={KITS} />);

    expect(valueText("Home")).toBe(formatNumber(22_400));
    expect(valueText("Home")).not.toBe("22400");
  });

  it("keeps the figures tabular, so counting labels do not jitter", () => {
    renderSettled(<VBars bars={KITS} />);

    expect(slot("v-bar-value")).toHaveClass(
      "tabular-nums",
      "text-body",
      "fill-text",
    );
  });

  it("uses the shared hooks rather than motion of its own", () => {
    expect(V_BARS_CODE).toMatch(/useCountUp\(/);
    expect(V_BARS_CODE).toMatch(/useGrow\(/);
    expect(V_BARS_CODE).toMatch(/useUid\(/);
    expect(V_BARS_CODE).not.toMatch(
      /\bsetInterval\b|\bsetTimeout\b|requestAnimationFrame/,
    );
  });
});

describe("VBars — bars persist across a data change (criterion 3)", () => {
  it("keeps the SAME bar element per category, so nothing snaps to zero", () => {
    // The filter press: same three kits, smaller figures. Columns are keyed by
    // category, so React reconciles onto the same rect and the CSS transition
    // carries it; an index key would remount it at zero height.
    const { rerender } = renderSettled(<VBars bars={KITS} />);

    const before = {
      Home: bar("Home"),
      Away: bar("Away"),
      "3rd": bar("3rd"),
    };
    const grown = barGeometry("Home");
    expect(Number(grown.height)).toBeGreaterThan(0);

    rerender(<VBars bars={KITS_LAST_MONTH} />);

    for (const [name, node] of Object.entries(before)) {
      // Element identity: the very same DOM node, not a fresh one.
      expect(bar(name)).toBe(node);
    }

    const after = barGeometry("Home");
    expect(after.height).not.toBe(grown.height);
    expect(Number(after.height)).toBeGreaterThan(0);
    expect(Number(after.y)).toBeGreaterThan(Number(grown.y));
    expect(after.height).toBe(
      String(vBarGeometry(KITS_LAST_MONTH)!.bars[0]!.height),
    );
  });

  it("keeps its element when the kits RE-RANK — the index-key proof", () => {
    // With an index key this fails: `Home` would be handed the element (and the
    // count-up state) of whatever now sits in the first slot.
    const { rerender } = renderSettled(<VBars bars={KITS} />);

    const before = {
      Home: bar("Home"),
      Away: bar("Away"),
      "3rd": bar("3rd"),
    };
    const wasAt = barGeometry("Home").x;

    rerender(<VBars bars={KITS_RERANKED} />);

    for (const [name, node] of Object.entries(before)) {
      expect(bar(name)).toBe(node);
    }

    // Position transitions too: the same bar is now in the third slot.
    const reranked = vBarGeometry(KITS_RERANKED)!;
    expect(Number(barGeometry("Home").x)).toBeGreaterThan(Number(wasAt));
    expect(barGeometry("Home").x).toBe(String(reranked.bars[2]!.x));
    expect(barGeometry("Home").height).toBe(String(reranked.bars[2]!.height));
  });

  it("keeps each label with its OWN category when they re-rank", () => {
    // Same figures, different order. A category whose figure did not change
    // must not count at all — with an index key every label would jump to a
    // neighbour's figure and count back.
    const frames = stubFrames();
    const { rerender } = render(<VBars bars={KITS} format={raw} />);

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS);

    rerender(
      <VBars
        bars={[
          { name: "Away", value: 10_300 },
          { name: "3rd", value: 5_800 },
          { name: "Home", value: 22_400 },
        ]}
        format={raw}
      />,
    );
    frames.advance(0);

    expect(Number(valueText("Home"))).toBe(22_400);
    expect(Number(valueText("Away"))).toBe(10_300);
    expect(Number(valueText("3rd"))).toBe(5_800);
  });

  it("counts the label from the figure ON SCREEN, never back from zero", () => {
    const frames = stubFrames();
    const { rerender } = render(<VBars bars={KITS} format={raw} />);

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(valueText("Home"))).toBe(22_400);

    rerender(<VBars bars={KITS_LAST_MONTH} format={raw} />);
    frames.advance(0);

    // The frame the new target opens on still shows the old figure — the count
    // starts there, not at zero.
    expect(Number(valueText("Home"))).toBe(22_400);

    frames.advance(COUNT_UP_DURATION_MS / 2);
    const midway = Number(valueText("Home"));
    expect(midway).toBeLessThan(22_400);
    expect(midway).toBeGreaterThan(4_100);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(valueText("Home"))).toBe(4_100);
  });

  it("grows a category that is genuinely new, without disturbing the rest", () => {
    const { rerender } = renderSettled(<VBars bars={KITS.slice(0, 2)} />);
    const home = bar("Home");

    rerender(<VBars bars={KITS} />);

    expect(bar("Home")).toBe(home);
    // A fresh column has not grown yet, so it rises from the axis.
    expect(barGeometry("3rd").height).toBe("0");
  });
});

describe("VBars — hover", () => {
  it("highlights the hovered bar, and only that one", () => {
    renderSettled(<VBars bars={KITS} />);

    expect(bar("Home")).not.toHaveClass("brightness-110");

    fireEvent.mouseEnter(column("Away"));

    expect(bar("Away")).toHaveClass("brightness-110");
    expect(column("Away").dataset.hovered).toBe("true");
    expect(bar("Home")).not.toHaveClass("brightness-110");
    expect(column("Home").dataset.hovered).toBe("false");
  });

  it("hovers the whole column, not just the bar, so a short bar is reachable", () => {
    renderSettled(<VBars bars={KITS} />);
    const geometry = vBarGeometry(KITS)!;
    const hit = slot("v-bar-hit", column("3rd"))!;

    expect(hit.getAttribute("width")).toBe(String(geometry.slotWidth));
    expect(hit.getAttribute("height")).toBe(String(geometry.plotHeight));
    expect(hit.getAttribute("fill")).toBe("transparent");
  });

  it("shows the category and its figure when no renderer is given", () => {
    renderSettled(<VBars bars={KITS} />);

    expect(slot("v-bars-tooltip")).toBeNull();

    fireEvent.mouseEnter(column("Home"));

    const tooltip = slot("v-bars-tooltip")!;
    expect(slot("v-bars-tooltip-heading", tooltip)).toHaveTextContent("Home");
    expect(tooltip).toHaveTextContent(formatNumber(22_400));
    // Announced as the highlight moves, politely.
    expect(tooltip).toHaveAttribute("role", "status");
  });

  it("clears the highlight when the pointer or focus leaves", () => {
    renderSettled(<VBars bars={KITS} />);

    fireEvent.mouseEnter(column("Home"));
    expect(slot("v-bars-tooltip")).not.toBeNull();

    fireEvent.mouseLeave(plot());
    expect(slot("v-bars-tooltip")).toBeNull();
    expect(bar("Home")).not.toHaveClass("brightness-110");

    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(slot("v-bars-tooltip")).not.toBeNull();

    fireEvent.blur(plot());
    expect(slot("v-bars-tooltip")).toBeNull();
  });

  it("is keyboard reachable and arrow-driven, without trapping focus", () => {
    renderSettled(<VBars bars={KITS} />);

    expect(plot()).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(plot(), { key: "ArrowRight" });
    expect(column("Home").dataset.hovered).toBe("true");

    fireEvent.keyDown(plot(), { key: "End" });
    expect(column("3rd").dataset.hovered).toBe("true");

    fireEvent.keyDown(plot(), { key: "Escape" });
    expect(slot("v-bars-tooltip")).toBeNull();

    // Tab is not one of the keys it handles, so the tab order is untouched.
    const tab = fireEvent.keyDown(plot(), { key: "Tab" });
    expect(tab).toBe(true);
  });

  it("pins the box over the hovered bar, flipped inside the plot at the edges", () => {
    renderSettled(<VBars bars={KITS} />);

    fireEvent.mouseEnter(column("Away"));
    // The middle bar's box is centred on it.
    expect(slot("v-bars-tooltip")!.style.transform).toBe("translateX(-50%)");

    fireEvent.mouseEnter(column("Home"));
    expect(slot("v-bars-tooltip")!.style.left).toBe(
      `${(vBarGeometry(KITS)!.bars[0]!.centerX / V_BAR_VIEW_WIDTH) * 100}%`,
    );
  });
});

describe("VBars — the optional per-bar tooltip renderer (criterion 2)", () => {
  it("calls the renderer with the hovered INDEX and shows its output", () => {
    const seen: number[] = [];
    const kitTooltip = (index: number) => {
      seen.push(index);
      const kit = KITS[index]!;
      return (
        <div data-slot="kit-tip">
          <span>{kit.name} kit</span>
          <span>{formatNumber(kit.value)} shirts</span>
          <span>{formatSharePercent(kit.value / TOTAL_SHIRTS)}</span>
          <span>{formatMoneyMillions(kit.value * SHIRT_PRICE_CHF)}</span>
        </div>
      );
    };

    renderSettled(<VBars bars={KITS} tooltip={kitTooltip} />);

    expect(seen).toEqual([]);

    fireEvent.mouseEnter(column("Away"));

    expect(seen).toEqual([1]);
    const tip = slot("kit-tip")!;
    expect(tip).toHaveTextContent("Away kit");
    // Units, share and revenue together — the whole reason it is a renderer.
    expect(tip).toHaveTextContent(formatNumber(10_300));
    expect(tip).toHaveTextContent(formatSharePercent(10_300 / TOTAL_SHIRTS));
    expect(tip).toHaveTextContent(formatMoneyMillions(10_300 * 99));

    // The renderer replaces the default content rather than adding to it.
    expect(slot("v-bars-tooltip-heading")).toBeNull();
  });

  it("follows the pointer to another bar", () => {
    renderSettled(
      <VBars bars={KITS} tooltip={(index) => <span>tip {index}</span>} />,
    );

    fireEvent.mouseEnter(column("Home"));
    expect(slot("v-bars-tooltip")).toHaveTextContent("tip 0");

    fireEvent.mouseEnter(column("3rd"));
    expect(slot("v-bars-tooltip")).toHaveTextContent("tip 2");
  });

  it("keeps the size token beside the colour token on the box", () => {
    // The US-012 `tailwind-merge` trap, on the element that stacks both.
    renderSettled(<VBars bars={KITS} />);
    fireEvent.mouseEnter(column("Home"));

    expect(slot("v-bars-tooltip")).toHaveClass(
      "text-caption",
      "text-bg",
      "bg-navy",
      "shadow-tooltip",
    );
  });
});

describe("VBars — the category labels", () => {
  it("labels every bar in the DOM, under its own column", () => {
    renderSettled(<VBars bars={KITS} />);

    expect(slots("v-bar-label").map((one) => one.textContent)).toEqual([
      "Home",
      "Away",
      "3rd",
    ]);
    // Real text under the plot, so the categories are in the a11y tree even
    // though the svg above is decoration.
    expect(slot("v-bar-labels")!.closest("svg")).toBeNull();
  });

  it("WRAPS a long category rather than letting it overflow", () => {
    renderSettled(
      <VBars
        bars={[
          { name: "Home shirt 26/27 - long sleeve", value: 100 },
          { name: "Away", value: 60 },
        ]}
      />,
    );

    const label = slot("v-bar-label")!;
    expect(label.textContent).toBe("Home shirt 26/27 - long sleeve");
    expect(label).toHaveClass("break-words", "min-w-0", "flex-1");
    expect(label.className).not.toMatch(
      /truncate|text-ellipsis|line-clamp|whitespace-nowrap/,
    );
  });
});

describe("VBars — a zero bar", () => {
  it("renders a LABELLED zero, not a missing bar", () => {
    renderSettled(
      <VBars
        bars={[
          { name: "Home", value: 22_400 },
          { name: "3rd", value: 0 },
        ]}
      />,
    );

    const zero = column("3rd");

    expect(valueText("3rd")).toBe(formatNumber(0));
    expect(slot("v-bar", zero)).not.toBeNull();
    expect(slot("v-bar", zero)!.getAttribute("height")).toBe("0");
    expect(slots("v-bar-label").map((one) => one.textContent)).toContain("3rd");
    // Still hoverable, so the presenter can read what it means.
    fireEvent.mouseEnter(zero);
    expect(slot("v-bars-tooltip")).toHaveTextContent(formatNumber(0));
  });

  it("renders an all-zero list without a NaN height", () => {
    renderSettled(
      <VBars
        bars={[
          { name: "Home", value: 0 },
          { name: "Away", value: 0 },
        ]}
      />,
    );

    for (const rect of slots("v-bar")) {
      expect(rect.getAttribute("height")).toBe("0");
      expect(rect.getAttribute("y")).not.toContain("NaN");
    }
  });

  it("renders nothing at all for an empty list, rather than an empty box", () => {
    const { container } = render(<VBars bars={[]} />);

    expect(container.firstChild).toBeNull();
  });
});

describe("VBars — two charts on one screen", () => {
  it("gives each instance its own gradient ids, each bar pointing at its own", () => {
    renderSettled(
      <>
        <VBars bars={KITS} />
        <VBars bars={KITS} />
      </>,
    );

    const charts = slots("v-bars");
    expect(charts).toHaveLength(2);

    const ids = charts.map((chart) =>
      slots("v-bar-gradient", chart).map((one) => one.id),
    );

    expect(new Set([...ids[0]!, ...ids[1]!]).size).toBe(6);
    for (const [index, chart] of charts.entries()) {
      for (const rect of slots("v-bar", chart)) {
        const target = rect.getAttribute("fill")!.slice(5, -1);
        expect(ids[index]).toContain(target);
      }
    }
  });
});

describe("VBars — reduced motion", () => {
  it("renders the final heights and the final figures immediately", () => {
    stubMatchMedia(true);
    const frames = stubFrames();

    render(<VBars bars={KITS} />);

    const geometry = vBarGeometry(KITS)!;
    expect(barGeometry("Home")).toEqual({
      x: String(geometry.bars[0]!.x),
      y: String(geometry.bars[0]!.y),
      height: String(geometry.bars[0]!.height),
    });
    expect(valueText("Home")).toBe(formatNumber(22_400));
    expect(valueText("3rd")).toBe(formatNumber(5_800));
    // Nothing is stranded at zero, and no frame was requested to get there.
    expect(frames.requested()).toBe(0);
  });

  it("moves straight to the new figures on a filter change", () => {
    stubMatchMedia(true);
    stubFrames();

    const { rerender } = render(<VBars bars={KITS} />);
    rerender(<VBars bars={KITS_LAST_MONTH} />);

    expect(valueText("Home")).toBe(formatNumber(4_100));
    expect(barGeometry("Home").height).toBe(
      String(vBarGeometry(KITS_LAST_MONTH)!.bars[0]!.height),
    );
  });
});

describe("VBarTile — the card around the bars", () => {
  it("is the shared Card, not a second card anatomy", () => {
    renderSettled(<VBarTile title="Shirt sales by kit" bars={KITS} />);

    expect(slot("card")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Shirt sales by kit" }),
    ).toHaveClass("tile-title");
  });

  it("passes the scope line to the card header, above the bars", () => {
    renderSettled(
      <VBarTile
        title="Shirt sales by kit"
        period="Season to date · 38’500 shirts"
        bars={KITS}
      />,
    );

    expect(slot("card-subtitle")).toHaveTextContent("Season to date");
  });

  it("forwards the card's other slots rather than restating them", () => {
    renderSettled(
      <VBarTile
        title="Shirt sales by kit"
        bars={KITS}
        icon={<span>icon</span>}
        action={<span>filter</span>}
        accent="red"
        caption="The Home kit drives 58% of shirt sales."
        isNew
        delayMs={90}
      />,
    );

    expect(slot("card-icon")).not.toBeNull();
    expect(slot("card-action")).toHaveTextContent("filter");
    expect(slot("card-accent")).not.toBeNull();
    expect(slot("card-caption")).toHaveTextContent("The Home kit drives 58%");
    expect(slot("card")).toHaveClass("fcb-enter");
  });
});

describe("VBarTile — the consumer it was designed for (US-034 Hero 1)", () => {
  it("carries the kit split, its subtitle figures and its three-part tooltip", () => {
    const revenue = TOTAL_SHIRTS * SHIRT_PRICE_CHF;

    renderSettled(
      <VBarTile
        title="Shirt sales by kit"
        period={`Season to date · ${formatNumber(TOTAL_SHIRTS)} shirts · ${formatMoneyMillions(revenue)}`}
        bars={KITS}
        label="Shirt sales by kit, season to date"
        tooltip={(index) => {
          const kit = KITS[index]!;
          return (
            <span data-slot="kit-tip">
              {`${kit.name} · ${formatNumber(kit.value)} · ${formatSharePercent(kit.value / TOTAL_SHIRTS)} · ${formatMoneyMillions(kit.value * SHIRT_PRICE_CHF)}`}
            </span>
          );
        }}
      />,
    );

    expect(valueText("Home")).toBe(formatNumber(22_400));
    expect(valueText("Away")).toBe(formatNumber(10_300));
    expect(valueText("3rd")).toBe(formatNumber(5_800));
    expect(slot("card-subtitle")).toHaveTextContent(
      `${formatNumber(38_500)} shirts`,
    );
    expect(slot("card-subtitle")).toHaveTextContent(
      formatMoneyMillions(revenue),
    );

    fireEvent.mouseEnter(column("Home"));
    expect(slot("kit-tip")).toHaveTextContent(
      `Home · ${formatNumber(22_400)} · 58% · ${formatMoneyMillions(22_400 * 99)}`,
    );
  });
});

describe("VBars — values come from tokens and formatters, never literals", () => {
  it("uses no hardcoded colour", () => {
    expect(V_BARS_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(V_BARS_CODE).not.toMatch(/\brgba?\(/);
  });

  it("names its bar colours from the series tokens only", () => {
    for (const value of Object.values(V_BAR_SERIES)) {
      expect(value).toMatch(/^var\(--color-series-\w+\)$/);
      expect(APP_CSS).toMatch(
        new RegExp(`${value.slice(4, -1)}:`.replaceAll("-", "\\-")),
      );
    }
  });

  it("writes no currency string and no percentage of its own", () => {
    expect(V_BARS_CODE).not.toMatch(/CHF/);
    expect(V_BARS_CODE).not.toMatch(/toLocaleString/);
  });

  it("uses no dangerouslySetInnerHTML", () => {
    expect(V_BARS_CODE).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
