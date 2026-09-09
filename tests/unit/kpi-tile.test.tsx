import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  KpiFigure,
  KpiSparkline,
  KpiTile,
  sparklineGeometry,
} from "../../app/components/tiles/kpi-tile";
import { formatMoney, formatMoneyMillions } from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { fontSize, fontWeight, letterSpacing } from "../../app/lib/tokens";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

const KPI_CODE = readFileSync(
  resolve(process.cwd(), "app/components/tiles/kpi-tile.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/** The six-point trend the baseline webshop tile shows. */
const WEBSHOP_TREND = [118_000, 121_500, 119_000, 132_400, 140_600, 148_200];

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

/** The headline figure as it currently reads on screen. */
function valueText(within: ParentNode = document): string {
  return slot("kpi-value", within)!.textContent!;
}

/** A formatter that shows the raw counted number, for the count-up tests. */
function raw(value: number): string {
  return value.toFixed(4);
}

/**
 * Renders and then runs the animation to completion, so a content assertion
 * sees the final figure while still exercising the real (non-reduced) path.
 * Two advances: the first frame only marks the start, the second lands.
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

describe("KpiTile — the big number", () => {
  it("renders the figure through the formatter it is given", () => {
    renderSettled(
      <KpiTile title="Webshop revenue" value={148_200} format={formatMoney} />,
    );

    expect(valueText()).toBe(formatMoney(148_200));
  });

  it("formats a plain count by default, so no caller hand-builds a string", () => {
    renderSettled(<KpiTile title="Attendance" value={28_900} />);

    // Grouped by the shared formatter — never a raw `28900`.
    expect(valueText()).not.toBe("28900");
    expect(valueText()).toContain("28");
  });

  it("carries the kpi-number role, which owns 30px / 700 / tight / tabular", () => {
    renderSettled(<KpiTile value={100} />);

    expect(slot("kpi-value")).toHaveClass("kpi-number");
  });

  it("resolves that role to the specified size, weight, tracking and figures", () => {
    const rule = APP_CSS.slice(APP_CSS.indexOf(".kpi-number"));
    const declarations = rule.slice(0, rule.indexOf("}"));

    expect(declarations).toMatch(/font-size:\s*var\(--text-kpi\)/);
    expect(declarations).toMatch(/font-weight:\s*var\(--font-weight-bold\)/);
    expect(declarations).toMatch(/letter-spacing:\s*var\(--tracking-kpi\)/);
    expect(declarations).toMatch(/font-variant-numeric:\s*tabular-nums/);

    expect(fontSize.kpi).toBe("30px");
    expect(fontWeight.bold).toBe("700");
    expect(letterSpacing.kpi).toBe("-0.02em");
  });
});

describe("KpiTile — count-up", () => {
  it("counts up to the figure and lands exactly on it", () => {
    const frames = stubFrames();
    render(<KpiTile value={100} format={raw} />);

    frames.advance(0);
    expect(Number(valueText())).toBe(0);

    frames.advance(COUNT_UP_DURATION_MS / 2);
    const midway = Number(valueText());
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(100);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(valueText())).toBe(100);
  });

  it("counts a NEW target from the figure on screen, not back from zero", () => {
    // The filter-change case the whole hook exists for. Asserted on the tile
    // because a tile holding its own state would pass every other test here
    // and still flash to zero on every period press.
    const frames = stubFrames();
    const { rerender } = render(<KpiTile value={100} format={raw} />);

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS / 2);
    const onScreen = Number(valueText());
    expect(onScreen).toBeGreaterThan(0);
    expect(onScreen).toBeLessThan(100);

    rerender(<KpiTile value={200} format={raw} />);
    frames.advance(0);

    expect(Number(valueText())).toBeCloseTo(onScreen, 6);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(valueText())).toBe(200);
  });

  it("counts downwards from the displayed figure too", () => {
    const frames = stubFrames();
    const { rerender } = render(<KpiTile value={100} format={raw} />);
    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS);

    rerender(<KpiTile value={40} format={raw} />);
    frames.advance(0);
    expect(Number(valueText())).toBe(100);

    frames.advance(COUNT_UP_DURATION_MS / 2);
    const midway = Number(valueText());
    expect(midway).toBeLessThan(100);
    expect(midway).toBeGreaterThan(40);
  });

  it("uses the shared hook rather than a count of its own", () => {
    expect(KPI_CODE).toMatch(/useCountUp\(/);
    expect(KPI_CODE).not.toMatch(
      /\buseState\b|\bsetInterval\b|\bsetTimeout\b|requestAnimationFrame/,
    );
  });
});

describe("KpiTile — reduced motion", () => {
  it("renders the figure at its final value immediately, with no frames at all", () => {
    stubMatchMedia(true);
    const frames = stubFrames();

    render(<KpiTile value={148_200} format={formatMoney} />);

    expect(valueText()).toBe(formatMoney(148_200));
    expect(frames.requested()).toBe(0);
  });

  it("draws the sparkline outright rather than leaving it undrawn", () => {
    stubMatchMedia(true);
    stubFrames();

    render(<KpiTile value={100} sparkline={WEBSHOP_TREND} />);

    expect(slot("kpi-sparkline-line")).toHaveAttribute(
      "stroke-dashoffset",
      "0",
    );
  });
});

describe("KpiTile — the delta chip", () => {
  it("renders the chip beside the number when a delta is given", () => {
    renderSettled(<KpiTile value={148_200} delta={{ value: 12 }} />);

    expect(slot("delta-chip")).toHaveTextContent("+12%");
  });

  it("renders no chip when no delta is given", () => {
    renderSettled(<KpiTile value={148_200} />);

    expect(slot("delta-chip")).toBeNull();
  });

  it("puts the chip into its light variant on a dark surface, so a caller cannot forget", () => {
    const { container } = renderSettled(
      <KpiFigure value={7_830_000} delta={{ value: -0.6 }} onDark />,
    );

    expect(slot("delta-chip", container)).toHaveClass("text-bg");
    expect(slot("delta-chip", container)).toHaveTextContent("-0.6%");
  });

  it("keeps the chip in its default variant on a white tile", () => {
    const { container } = renderSettled(
      <KpiTile value={148_200} delta={{ value: 12 }} />,
    );

    expect(slot("delta-chip", container)).toHaveClass("text-variance-positive");
  });
});

describe("KpiTile — the supporting subtitle", () => {
  it("renders it only when supplied", () => {
    const withOut = renderSettled(<KpiTile value={100} />);
    expect(slot("kpi-subtitle", withOut.container)).toBeNull();

    const withIt = renderSettled(
      <KpiTile value={100} subtitle="vs last month" />,
    );
    expect(slot("kpi-subtitle", withIt.container)).toHaveTextContent(
      "vs last month",
    );
  });

  it("keeps the caption SIZE token alongside the muted COLOUR token", () => {
    // The US-012 `tailwind-merge` trap, on the element that stacks both.
    const { container } = renderSettled(
      <KpiTile value={100} subtitle="vs last month" />,
    );

    expect(slot("kpi-subtitle", container)).toHaveClass(
      "text-caption",
      "text-muted",
    );
  });

  it("lightens it on a dark surface", () => {
    const { container } = renderSettled(
      <KpiFigure value={100} subtitle="vs 25/26" onDark />,
    );

    expect(slot("kpi-subtitle", container)).toHaveClass("text-caption");
    expect(slot("kpi-subtitle", container)!.className).toContain("text-bg/");
  });
});

describe("KpiTile — the sparkline", () => {
  it("renders it only when points are supplied", () => {
    const withOut = renderSettled(<KpiTile value={100} />);
    expect(slot("kpi-sparkline", withOut.container)).toBeNull();

    const withIt = renderSettled(
      <KpiTile value={100} sparkline={WEBSHOP_TREND} />,
    );
    expect(slot("kpi-sparkline", withIt.container)).not.toBeNull();
  });

  it("renders nothing for an empty series rather than an empty box", () => {
    const { container } = renderSettled(<KpiTile value={100} sparkline={[]} />);

    expect(slot("kpi-sparkline", container)).toBeNull();
  });

  it("plots one point per figure", () => {
    const { container } = renderSettled(
      <KpiTile value={100} sparkline={WEBSHOP_TREND} />,
    );
    const path = slot("kpi-sparkline-line", container)!.getAttribute("d")!;

    expect(path.match(/[ML]/g)).toHaveLength(WEBSHOP_TREND.length);
  });

  it("scales to its container rather than to a fixed pixel width", () => {
    const { container } = renderSettled(
      <KpiTile value={100} sparkline={WEBSHOP_TREND} />,
    );
    const svg = slot("kpi-sparkline", container)!;

    expect(svg).toHaveClass("w-full");
    expect(svg).toHaveAttribute("viewBox");
    expect(svg).not.toHaveAttribute("width");
  });

  it("keeps an even stroke weight despite being stretched", () => {
    const { container } = renderSettled(
      <KpiTile value={100} sparkline={WEBSHOP_TREND} />,
    );

    expect(slot("kpi-sparkline-line", container)).toHaveAttribute(
      "vector-effect",
      "non-scaling-stroke",
    );
  });

  it("draws itself in from nothing once mounted", () => {
    const frames = stubFrames();
    const { container } = render(
      <KpiTile value={100} sparkline={WEBSHOP_TREND} />,
    );

    expect(slot("kpi-sparkline-line", container)).toHaveAttribute(
      "stroke-dashoffset",
      "1",
    );

    frames.advance();
    frames.advance();

    expect(slot("kpi-sparkline-line", container)).toHaveAttribute(
      "stroke-dashoffset",
      "0",
    );
  });

  it("is hidden from the accessibility tree unless it is given a label", () => {
    const bare = renderSettled(
      <KpiTile value={100} sparkline={WEBSHOP_TREND} />,
    );
    expect(slot("kpi-sparkline", bare.container)).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    const labelled = renderSettled(
      <KpiTile
        value={100}
        sparkline={WEBSHOP_TREND}
        sparklineLabel="Rising over six weeks"
      />,
    );
    expect(screen.getByRole("img", { name: "Rising over six weeks" })).toBe(
      slot("kpi-sparkline", labelled.container),
    );
  });

  it("gives every instance its own gradient id, so two tiles cannot collide", () => {
    const first = renderSettled(
      <KpiTile value={100} sparkline={WEBSHOP_TREND} />,
    );
    const second = renderSettled(
      <KpiTile value={200} sparkline={WEBSHOP_TREND} />,
    );

    const idOf = (within: ParentNode) =>
      within.querySelector("linearGradient")!.getAttribute("id");

    expect(idOf(first.container)).not.toBe(idOf(second.container));
  });

  it("paints with currentColor, so no colour can be passed in", () => {
    const { container } = renderSettled(
      <KpiTile value={100} sparkline={WEBSHOP_TREND} />,
    );

    expect(slot("kpi-sparkline-line", container)).toHaveAttribute(
      "stroke",
      "currentColor",
    );
    expect(slot("kpi-sparkline", container)).toHaveClass("text-red");
  });

  it("follows the light treatment on a dark surface", () => {
    const { container } = renderSettled(
      <KpiFigure value={100} sparkline={WEBSHOP_TREND} onDark />,
    );

    expect(slot("kpi-sparkline", container)).toHaveClass("text-bg");
  });
});

describe("sparklineGeometry — the maths, without a DOM", () => {
  it("has nothing to draw for an empty series", () => {
    expect(sparklineGeometry([])).toBeNull();
  });

  it("puts a rising series' last point above its first", () => {
    const { line } = sparklineGeometry([1, 2, 3])!;
    const ys = [...line.matchAll(/[ML] [\d.]+ ([\d.]+)/g)].map((m) =>
      Number(m[1]),
    );

    // SVG y grows downwards, so "up" is a smaller number.
    expect(ys.at(-1)).toBeLessThan(ys[0]!);
  });

  it("draws a flat series through the middle instead of dividing by zero", () => {
    const { line } = sparklineGeometry([5, 5, 5])!;

    expect(line).not.toContain("NaN");
    const ys = [...line.matchAll(/[ML] [\d.]+ ([\d.]+)/g)].map((m) =>
      Number(m[1]),
    );
    expect(new Set(ys).size).toBe(1);
  });

  it("draws a single point as a flat line rather than a zero-length path", () => {
    const { line } = sparklineGeometry([7])!;

    expect(line).not.toContain("NaN");
    expect(line.match(/[ML]/g)).toHaveLength(2);
  });

  it("closes the area path back to the baseline", () => {
    const { area } = sparklineGeometry(WEBSHOP_TREND)!;

    expect(area.endsWith("Z")).toBe(true);
    expect(area).not.toContain("NaN");
  });

  it("renders no element at all when handed nothing to draw", () => {
    const { container } = render(<KpiSparkline points={[]} />);

    expect(container.firstChild).toBeNull();
  });
});

describe("KpiTile — composition", () => {
  it("is the shared Card, not a second card anatomy", () => {
    renderSettled(<KpiTile title="Webshop revenue" value={100} />);

    expect(slot("card")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Webshop revenue" }),
    ).toHaveClass("tile-title");
  });

  it("passes the scope line to the card header, above the number", () => {
    renderSettled(
      <KpiTile title="Webshop revenue" period="This month" value={100} />,
    );

    expect(slot("card-subtitle")).toHaveTextContent("This month");
  });

  it("forwards the card's other slots rather than restating them", () => {
    renderSettled(
      <KpiTile
        title="Overall"
        value={100}
        icon={<span>icon</span>}
        action={<button>Year to date</button>}
        accent="gold"
        caption="Marketing is the only department behind."
        isNew
        delayMs={120}
      />,
    );

    expect(slot("card-icon")).not.toBeNull();
    expect(slot("card-action")).not.toBeNull();
    expect(slot("card-accent")).not.toBeNull();
    expect(slot("card-caption")).toHaveTextContent(
      "Marketing is the only department behind.",
    );
  });

  it("renders extra hero content under the number", () => {
    // Hero 2's compare bars and Hero 3's two-up footer arrive this way — no
    // variant per hero.
    renderSettled(
      <KpiTile value={69_680_000} format={formatMoneyMillions}>
        <div data-slot="test-extra">compare bars</div>
      </KpiTile>,
    );

    expect(slot("test-extra")).toBeInTheDocument();
    expect(valueText()).toBe(formatMoneyMillions(69_680_000));
  });

  it("renders the figure block with no card of its own for the hero band", () => {
    const { container } = renderSettled(
      <KpiFigure value={100} onDark delta={{ value: 12 }} />,
    );

    expect(slot("card", container)).toBeNull();
    expect(slot("kpi-figure", container)).not.toBeNull();
    expect(slot("kpi-value", container)).toHaveClass("kpi-number", "text-bg");
  });
});

describe("KpiTile — the consumers it was designed for", () => {
  it("carries the baseline webshop tile", () => {
    renderSettled(
      <KpiTile
        title="Webshop revenue"
        period="This month"
        value={148_200}
        format={formatMoney}
        delta={{ value: 12 }}
        subtitle="vs last month"
        sparkline={WEBSHOP_TREND}
      />,
    );

    expect(valueText()).toBe(formatMoney(148_200));
    expect(slot("delta-chip")).toHaveTextContent("+12%");
    expect(slot("delta-chip")!.dataset.direction).toBe("UP");
    expect(slot("kpi-sparkline")).not.toBeNull();
  });

  it("carries Hero 2's ticket total, down on the season before", () => {
    renderSettled(
      <KpiTile
        title="Total"
        period="8 fixtures shown"
        value={7_830_000}
        format={formatMoneyMillions}
        delta={{ value: -0.6 }}
        subtitle="26/27 vs 25/26"
      />,
    );

    expect(valueText()).toBe(formatMoneyMillions(7_830_000));
    expect(slot("delta-chip")).toHaveTextContent("-0.6%");
    expect(slot("delta-chip")!.dataset.direction).toBe("DOWN");
    expect(slot("delta-chip")).toHaveClass("text-variance-negative");
  });

  it("carries Hero 3's overall actual against budget", () => {
    renderSettled(
      <KpiTile
        title="Overall"
        value={69_680_000}
        format={formatMoneyMillions}
        delta={{ value: 1 }}
        subtitle="Budget CHF 69.00M"
      />,
    );

    expect(valueText()).toBe(formatMoneyMillions(69_680_000));
    expect(slot("delta-chip")).toHaveTextContent("+1%");
    expect(slot("delta-chip")).toHaveClass("text-variance-positive");
  });
});

describe("KpiTile — values come from tokens and formatters, never literals", () => {
  it("uses no hardcoded colour", () => {
    expect(KPI_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(KPI_CODE).not.toMatch(/\brgba?\(/);
  });

  it("writes no currency or percent string of its own", () => {
    expect(KPI_CODE).not.toMatch(/CHF/);
    // The only `%` literals in the file are the gradient's two stop offsets —
    // geometry, not display copy.
    expect(KPI_CODE.match(/["'][^"']*%[^"']*["']/g)).toEqual([
      '"0%"',
      '"100%"',
    ]);
  });

  it("uses no dangerouslySetInnerHTML", () => {
    expect(KPI_CODE).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it("times its growth from the motion tokens", () => {
    expect(KPI_CODE).toContain("duration-(--duration-grow)");
    expect(APP_CSS).toMatch(/--duration-grow:/);
  });
});
