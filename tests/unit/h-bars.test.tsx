import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  H_BAR_LABEL_WIDTH_PX,
  H_BAR_SERIES,
  H_BAR_VALUE_WIDTH_PX,
  HBarRow,
  HBars,
  HBarTile,
  hBarDisplayedValue,
  hBarMax,
  hBarPercent,
  type HBarDatum,
} from "../../app/components/charts/h-bars";
import {
  chfFromThousands,
  formatMoneyCompact,
  formatNumber,
  formatSignedPercent,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { fontWeight } from "../../app/lib/tokens";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

const H_BARS_CODE = readFileSync(
  resolve(process.cwd(), "app/components/charts/h-bars.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/**
 * Top Products, this month — the baseline list, verbatim from the dataset. The
 * two long names are the point: `Cap "Rotblau"` and `Home shirt 26/27` are the
 * labels that were reported as truncated.
 */
const TOP_PRODUCTS: readonly HBarDatum[] = [
  { name: "Home shirt 26/27", value: 1_840 },
  { name: "Home scarf", value: 1_210 },
  { name: "Away shirt 26/27", value: 940 },
  { name: 'Cap "Rotblau"', value: 720 },
  { name: "3rd shirt 26/27", value: 540 },
];

/** Hero 1's badge trend — the mixed-sign list: +38%, +6%, -3%. */
const BADGE_TREND: readonly HBarDatum[] = [
  { name: "Bitpanda", value: 38 },
  { name: "Allianz", value: 6 },
  { name: "Sunrise", value: -3 },
];

/** Hero 2's declining fixtures, in CHF (the dataset stores thousands). */
const DECLINES: readonly HBarDatum[] = [
  { name: "FCB - FCZ", value: chfFromThousands(150) },
  { name: "FCB - Lugano", value: chfFromThousands(110) },
  { name: "FCB - Luzern", value: chfFromThousands(70) },
  { name: "FCB - Sion", value: chfFromThousands(70) },
];

/** Hero 3's Marketing drivers, in CHF. */
const DRIVERS: readonly HBarDatum[] = [
  { name: "Match activations", value: chfFromThousands(240) },
  { name: "Paid social", value: chfFromThousands(150) },
  { name: "Agency retainer", value: chfFromThousands(20) },
];

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

/** The row whose label reads `name`, as the presenter would find it. */
function row(name: string, within: ParentNode = document): HTMLElement {
  const found = slots("h-bar-row", within).find(
    (candidate) => slot("h-bar-label", candidate)?.textContent === name,
  );
  if (!found) throw new Error(`no row labelled "${name}"`);
  return found;
}

function valueText(name: string, within: ParentNode = document): string {
  return slot("h-bar-value", row(name, within))!.textContent!;
}

function fillWidth(name: string, within: ParentNode = document): string {
  return slot("h-bar-fill", row(name, within))!.style.width;
}

/** A formatter that shows the raw counted number, for the count-up tests. */
function raw(value: number): string {
  return value.toFixed(4);
}

/**
 * Renders and runs the animations to completion, so a content assertion sees
 * the final figures while still exercising the real (non-reduced) path. Two
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

describe("HBars — the label column (review decision: 150px, 500, no truncation)", () => {
  it("is a fixed 150px column on every row", () => {
    renderSettled(<HBars rows={TOP_PRODUCTS} />);

    for (const label of slots("h-bar-label")) {
      expect(getComputedStyle(label).width).toBe(`${H_BAR_LABEL_WIDTH_PX}px`);
    }
    expect(H_BAR_LABEL_WIDTH_PX).toBe(150);
  });

  it("carries weight 500, which the token set spells as 500", () => {
    renderSettled(<HBars rows={TOP_PRODUCTS} />);

    expect(slot("h-bar-label", row('Cap "Rotblau"'))).toHaveClass(
      "font-medium",
    );
    expect(fontWeight.medium).toBe("500");
    expect(APP_CSS).toMatch(/--font-weight-medium:\s*500/);
  });

  it("shows the reported long names in FULL, with no truncation class", () => {
    renderSettled(<HBars rows={TOP_PRODUCTS} />);

    for (const name of ['Cap "Rotblau"', "Home shirt 26/27"]) {
      const label = slot("h-bar-label", row(name))!;

      expect(label.textContent).toBe(name);
      // The defect, stated as an assertion: no ellipsis, ever.
      expect(label.className).not.toMatch(
        /truncate|text-ellipsis|line-clamp|overflow-hidden/,
      );
      expect(label.style.whiteSpace).toBe("");
    }
  });

  it("wraps a long label rather than letting it overflow the tile", () => {
    renderSettled(
      <HBars rows={[{ name: "Home shirt 26/27 - long sleeve", value: 100 }]} />,
    );

    expect(slot("h-bar-label")).toHaveClass("break-words");
  });

  it("never lets the label column be squeezed by the bar beside it", () => {
    renderSettled(<HBars rows={TOP_PRODUCTS} />);

    expect(slot("h-bar-label")).toHaveClass("shrink-0");
  });
});

describe("HBars — the value column (review decision: 96px, nowrap)", () => {
  it("is a fixed 96px column, set to nowrap, on every row", () => {
    renderSettled(
      <HBars rows={DECLINES} negative format={formatMoneyCompact} />,
    );

    for (const value of slots("h-bar-value")) {
      const computed = getComputedStyle(value);
      expect(computed.width).toBe(`${H_BAR_VALUE_WIDTH_PX}px`);
      expect(computed.whiteSpace).toBe("nowrap");
    }
    expect(H_BAR_VALUE_WIDTH_PX).toBe(96);
  });

  it("keeps `-CHF 150k` and `-CHF 110k` on ONE line", () => {
    renderSettled(
      <HBars rows={DECLINES} negative format={formatMoneyCompact} />,
    );

    for (const [name, chf] of [
      ["FCB - FCZ", 150],
      ["FCB - Lugano", 110],
    ] as const) {
      const value = slot("h-bar-value", row(name))!;
      const expected = formatMoneyCompact(-chfFromThousands(chf));

      // One text node, no break opportunity taken, and nowrap in force — the
      // three things that together mean "a single line".
      expect(value.textContent).toBe(expected);
      expect(value.textContent).not.toContain("\n");
      expect(value.childNodes).toHaveLength(1);
      expect(getComputedStyle(value).whiteSpace).toBe("nowrap");
    }

    expect(valueText("FCB - FCZ")).toBe("-CHF 150k");
    expect(valueText("FCB - Lugano")).toBe("-CHF 110k");
  });

  it("holds the same column everywhere the row is reused", () => {
    // The decision is on the SHARED row, so it cannot hold in one tile only.
    for (const rows of [TOP_PRODUCTS, BADGE_TREND, DRIVERS]) {
      const { container, unmount } = renderSettled(<HBars rows={rows} />);

      for (const value of slots("h-bar-value", container)) {
        expect(getComputedStyle(value).width).toBe(`${H_BAR_VALUE_WIDTH_PX}px`);
        expect(getComputedStyle(value).whiteSpace).toBe("nowrap");
      }

      unmount();
    }
  });

  it("aligns the column with tabular figures, so counting rows do not jitter", () => {
    renderSettled(<HBars rows={TOP_PRODUCTS} />);

    expect(slot("h-bar-value")).toHaveClass("tabular-nums", "text-right");
  });

  it("keeps the body SIZE token alongside the text COLOUR token", () => {
    // The US-012 `tailwind-merge` trap, on the element that stacks both.
    renderSettled(<HBars rows={TOP_PRODUCTS} />);

    expect(slot("h-bar-value")).toHaveClass("text-body", "text-text");
  });
});

describe("HBars — count-up per row", () => {
  it("counts every row up to its figure and lands exactly on it", () => {
    const frames = stubFrames();
    render(<HBars rows={TOP_PRODUCTS} format={raw} />);

    frames.advance(0);
    expect(Number(valueText("Home shirt 26/27"))).toBe(0);
    expect(Number(valueText("Home scarf"))).toBe(0);

    frames.advance(COUNT_UP_DURATION_MS / 2);
    const midway = Number(valueText("Home shirt 26/27"));
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(1_840);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(valueText("Home shirt 26/27"))).toBe(1_840);
    expect(Number(valueText('Cap "Rotblau"'))).toBe(720);
  });

  it("counts a NEW figure from the one on screen, not back from zero", () => {
    // The filter-change case: Top Products switching period.
    const frames = stubFrames();
    const { rerender } = render(<HBars rows={TOP_PRODUCTS} format={raw} />);

    frames.advance(0);
    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(valueText("Home shirt 26/27"))).toBe(1_840);

    rerender(
      <HBars
        rows={[{ name: "Home shirt 26/27", value: 5_210 }]}
        format={raw}
      />,
    );
    frames.advance(0);

    expect(Number(valueText("Home shirt 26/27"))).toBe(1_840);

    frames.advance(COUNT_UP_DURATION_MS / 2);
    const midway = Number(valueText("Home shirt 26/27"));
    expect(midway).toBeGreaterThan(1_840);
    expect(midway).toBeLessThan(5_210);

    frames.advance(COUNT_UP_DURATION_MS);
    expect(Number(valueText("Home shirt 26/27"))).toBe(5_210);
  });

  it("uses the shared hooks rather than motion of its own", () => {
    expect(H_BARS_CODE).toMatch(/useCountUp\(/);
    expect(H_BARS_CODE).toMatch(/useGrow\(/);
    expect(H_BARS_CODE).not.toMatch(
      /\buseState\b|\bsetInterval\b|\bsetTimeout\b|requestAnimationFrame/,
    );
  });
});

describe("HBars — bars grow, transition and persist", () => {
  it("grows each bar from nothing to its share of the largest", () => {
    const frames = stubFrames();
    render(<HBars rows={TOP_PRODUCTS} />);

    expect(fillWidth("Home shirt 26/27")).toBe("0%");

    frames.advance();
    frames.advance();

    // 1,840 is the largest, so it fills the track; the rest are its fraction.
    expect(fillWidth("Home shirt 26/27")).toBe("100%");
    expect(fillWidth("Home scarf")).toBe("65.76%");
    expect(fillWidth('Cap "Rotblau"')).toBe("39.13%");
  });

  it("transitions the width in CSS, timed from the motion token", () => {
    renderSettled(<HBars rows={TOP_PRODUCTS} />);

    expect(slot("h-bar-fill")).toHaveClass(
      "transition-[width]",
      "duration-(--duration-grow)",
      "ease-enter",
    );
    expect(APP_CSS).toMatch(/--duration-grow:/);
  });

  it("keeps the SAME bar element across a data change, so nothing snaps to zero", () => {
    // Rows are keyed by name; an index key would remount the bar and the
    // width would restart from 0 on every filter press.
    const { rerender } = renderSettled(<HBars rows={TOP_PRODUCTS} />);
    const before = slot("h-bar-fill", row("Home shirt 26/27"))!;

    expect(before.style.width).toBe("100%");

    rerender(
      <HBars
        rows={[
          { name: "Home shirt 26/27", value: 1_000 },
          { name: "Home scarf", value: 2_000 },
        ]}
      />,
    );

    const after = slot("h-bar-fill", row("Home shirt 26/27"))!;
    expect(after).toBe(before);
    expect(after.style.width).toBe("50%");
  });

  it("staggers the rows so the list sweeps in", () => {
    renderSettled(<HBars rows={TOP_PRODUCTS} />);
    const fills = slots("h-bar-fill");

    expect(fills[0]!.style.transitionDelay).toBe("");
    expect(fills[1]!.style.transitionDelay).toBe("50ms");
    expect(fills[2]!.style.transitionDelay).toBe("100ms");
  });

  it("renders a track behind every bar", () => {
    renderSettled(<HBars rows={TOP_PRODUCTS} />);

    expect(slots("h-bar-track")).toHaveLength(TOP_PRODUCTS.length);
    expect(slot("h-bar-track")).toHaveClass("bg-surface", "rounded-badge");
    // The track is the same shape on every row; the value beside it speaks.
    expect(slot("h-bar-track")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("HBars — negative mode", () => {
  it("shows a decline as a negative figure, from a stored magnitude", () => {
    renderSettled(
      <HBars rows={DECLINES} negative format={formatMoneyCompact} />,
    );

    expect(valueText("FCB - FCZ")).toBe("-CHF 150k");
    expect(valueText("FCB - Sion")).toBe("-CHF 70k");
  });

  it("marks every row as down, in the variance-negative token", () => {
    renderSettled(
      <HBars rows={DECLINES} negative format={formatMoneyCompact} />,
    );

    for (const name of ["FCB - FCZ", "FCB - Lugano"]) {
      expect(row(name).dataset.direction).toBe("DOWN");
      expect(slot("h-bar-value", row(name))).toHaveClass(
        "text-variance-negative",
      );
      expect(slot("h-bar-fill", row(name))!.className).toContain(
        "variance-negative",
      );
    }
  });

  it("grows a declining bar leftwards, so direction is not colour alone", () => {
    renderSettled(
      <HBars rows={DECLINES} negative format={formatMoneyCompact} />,
    );

    expect(slot("h-bar-fill", row("FCB - FCZ"))).toHaveClass(
      "right-0",
      "bg-linear-to-l",
    );
    expect(slot("h-bar-fill", row("FCB - FCZ"))).not.toHaveClass("left-0");
  });

  it("scales the declines against the largest decline", () => {
    renderSettled(
      <HBars rows={DECLINES} negative format={formatMoneyCompact} />,
    );

    expect(fillWidth("FCB - FCZ")).toBe("100%");
    expect(fillWidth("FCB - Lugano")).toBe("73.33%");
    expect(fillWidth("FCB - Sion")).toBe("46.67%");
  });

  it("is idempotent — an already-negative figure is not flipped back", () => {
    renderSettled(
      <HBars
        rows={[{ name: "FCB - FCZ", value: -chfFromThousands(150) }]}
        negative
        format={formatMoneyCompact}
      />,
    );

    expect(valueText("FCB - FCZ")).toBe("-CHF 150k");
  });

  it("leaves a positive list alone without it", () => {
    renderSettled(<HBars rows={DRIVERS} format={formatMoneyCompact} />);

    expect(valueText("Match activations")).toBe("CHF 240k");
    expect(row("Match activations").dataset.direction).toBe("UP");
    expect(slot("h-bar-fill", row("Match activations"))).toHaveClass(
      "left-0",
      "bg-linear-to-r",
    );
  });
});

describe("HBars — a mixed-sign dataset", () => {
  it("renders both directions from one list", () => {
    renderSettled(<HBars rows={BADGE_TREND} format={formatSignedPercent} />);

    expect(valueText("Bitpanda")).toBe("+38%");
    expect(valueText("Allianz")).toBe("+6%");
    expect(valueText("Sunrise")).toBe("-3%");

    expect(row("Bitpanda").dataset.direction).toBe("UP");
    expect(row("Sunrise").dataset.direction).toBe("DOWN");
  });

  it("anchors and tones each row by its own sign", () => {
    renderSettled(
      <HBars rows={BADGE_TREND} series="blue" format={formatSignedPercent} />,
    );

    const rising = slot("h-bar-fill", row("Bitpanda"))!;
    const falling = slot("h-bar-fill", row("Sunrise"))!;

    expect(rising).toHaveClass("left-0", "bg-linear-to-r");
    expect(rising.className).toContain("series-secondary");
    expect(falling).toHaveClass("right-0", "bg-linear-to-l");
    expect(falling.className).toContain("variance-negative");

    expect(slot("h-bar-value", row("Bitpanda"))).toHaveClass("text-text");
    expect(slot("h-bar-value", row("Sunrise"))).toHaveClass(
      "text-variance-negative",
    );
  });

  it("scales both signs against the largest magnitude", () => {
    renderSettled(<HBars rows={BADGE_TREND} format={formatSignedPercent} />);

    expect(fillWidth("Bitpanda")).toBe("100%");
    expect(fillWidth("Allianz")).toBe("15.79%");
    expect(fillWidth("Sunrise")).toBe("7.89%");
  });
});

describe("HBars — a zero row", () => {
  it("renders a labelled zero, not a broken or absent row", () => {
    renderSettled(
      <HBars
        rows={[
          { name: "Home shirt 26/27", value: 1_840 },
          { name: "3rd shirt 26/27", value: 0 },
        ]}
      />,
    );

    const zero = row("3rd shirt 26/27");

    expect(slot("h-bar-label", zero)).toHaveTextContent("3rd shirt 26/27");
    expect(slot("h-bar-value", zero)!.textContent).toBe(formatNumber(0));
    expect(slot("h-bar-track", zero)).not.toBeNull();
    expect(slot("h-bar-fill", zero)!.style.width).toBe("0%");
    expect(zero.dataset.direction).toBe("FLAT");
  });

  it("keeps a zero out of the variance tokens entirely", () => {
    renderSettled(<HBars rows={[{ name: "3rd shirt 26/27", value: 0 }]} />);

    expect(slot("h-bar-value")).toHaveClass("text-text");
    expect(slot("h-bar-value")).not.toHaveClass("text-variance-negative");
  });

  it("renders an all-zero list without a NaN width", () => {
    renderSettled(
      <HBars
        rows={[
          { name: "Home scarf", value: 0 },
          { name: "Home shirt 26/27", value: 0 },
        ]}
      />,
    );

    for (const fill of slots("h-bar-fill")) {
      expect(fill.style.width).toBe("0%");
      expect(fill.style.width).not.toContain("NaN");
    }
  });
});

describe("HBars — the custom value formatter", () => {
  it("uses the given formatter verbatim, for money and for percentages", () => {
    const money = renderSettled(
      <HBars rows={DRIVERS} format={formatMoneyCompact} />,
    );
    expect(valueText("Match activations", money.container)).toBe("CHF 240k");
    expect(valueText("Paid social", money.container)).toBe("CHF 150k");
    money.unmount();

    const percent = renderSettled(
      <HBars rows={BADGE_TREND} format={formatSignedPercent} />,
    );
    expect(valueText("Bitpanda", percent.container)).toBe("+38%");
  });

  it("formats a plain count by default, so no caller hand-builds a string", () => {
    renderSettled(
      <HBars rows={[{ name: "Home shirt 26/27", value: 18_400 }]} />,
    );

    expect(valueText("Home shirt 26/27")).toBe(formatNumber(18_400));
    expect(valueText("Home shirt 26/27")).not.toBe("18400");
  });
});

describe("HBars — reduced motion", () => {
  it("renders the final widths and the final figures immediately", () => {
    stubMatchMedia(true);
    const frames = stubFrames();

    render(<HBars rows={TOP_PRODUCTS} />);

    expect(fillWidth("Home shirt 26/27")).toBe("100%");
    expect(fillWidth("Home scarf")).toBe("65.76%");
    expect(valueText("Home shirt 26/27")).toBe(formatNumber(1_840));
    expect(frames.requested()).toBe(0);
  });

  it("does the same for a negative list, sign and all", () => {
    stubMatchMedia(true);
    stubFrames();

    render(<HBars rows={DECLINES} negative format={formatMoneyCompact} />);

    expect(valueText("FCB - FCZ")).toBe("-CHF 150k");
    expect(fillWidth("FCB - FCZ")).toBe("100%");
  });
});

describe("HBarTile — the card around the rows", () => {
  it("is the shared Card, not a second card anatomy", () => {
    renderSettled(<HBarTile title="Top products" rows={TOP_PRODUCTS} />);

    expect(slot("card")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Top products" })).toHaveClass(
      "tile-title",
    );
  });

  it("passes the scope line to the card header, above the rows", () => {
    renderSettled(
      <HBarTile title="Top products" period="Units sold" rows={TOP_PRODUCTS} />,
    );

    expect(slot("card-subtitle")).toHaveTextContent("Units sold");
  });

  it("passes the ACTION slot through — Hero 2's total badge lives there", () => {
    renderSettled(
      <HBarTile
        title="Fixtures driving the decline"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        action={<span>-CHF 400k total</span>}
      />,
    );

    expect(slot("card-action")).toHaveTextContent("-CHF 400k total");
  });

  it("forwards the card's other slots rather than restating them", () => {
    renderSettled(
      <HBarTile
        title="What's driving Marketing"
        rows={DRIVERS}
        format={formatMoneyCompact}
        icon={<span>icon</span>}
        accent="gold"
        caption="Two areas account for the overspend."
        isNew
        delayMs={120}
      />,
    );

    expect(slot("card-icon")).not.toBeNull();
    expect(slot("card-accent")).not.toBeNull();
    expect(slot("card-caption")).toHaveTextContent(
      "Two areas account for the overspend.",
    );
    expect(slot("card")).toHaveClass("fcb-enter");
  });
});

describe("HBars — the five consumers it was designed for", () => {
  it("carries Top Products: units, five rows, club blue", () => {
    renderSettled(
      <HBarTile
        title="Top products"
        period="Units sold"
        rows={TOP_PRODUCTS}
        series="blue"
      />,
    );

    expect(slots("h-bar-row")).toHaveLength(5);
    expect(valueText('Cap "Rotblau"')).toBe(formatNumber(720));
    expect(slot("h-bar-fill")!.className).toContain("series-secondary");
  });

  it("carries Hero 1's top printed names in club red", () => {
    const names: readonly HBarDatum[] = [
      { name: "Shaqiri", value: 3_180 },
      { name: "Sow", value: 1_240 },
      { name: "Metinho", value: 1_080 },
    ];
    renderSettled(<HBarTile title="Top printed names" rows={names} />);

    expect(valueText("Shaqiri")).toBe(formatNumber(3_180));
    expect(slot("h-bar-fill")!.className).toContain("series-primary");
  });

  it("carries Hero 1's badge trend as mixed-sign percentages", () => {
    renderSettled(
      <HBarTile
        title="Badge selection trend"
        rows={BADGE_TREND}
        series="blue"
        format={formatSignedPercent}
      />,
    );

    expect(slots("h-bar-value").map((value) => value.textContent)).toEqual([
      "+38%",
      "+6%",
      "-3%",
    ]);
  });

  it("carries Hero 2's declining fixtures with the total badge", () => {
    renderSettled(
      <HBarTile
        title="Fixtures driving the decline"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        action={<span>-CHF 400k total</span>}
      />,
    );

    expect(slots("h-bar-value").map((value) => value.textContent)).toEqual([
      "-CHF 150k",
      "-CHF 110k",
      "-CHF 70k",
      "-CHF 70k",
    ]);
    expect(slot("card-action")).toHaveTextContent("-CHF 400k total");
  });

  it("carries Hero 3's Marketing drivers as money", () => {
    renderSettled(
      <HBarTile
        title="What's driving Marketing"
        rows={DRIVERS}
        format={formatMoneyCompact}
      />,
    );

    expect(slots("h-bar-value").map((value) => value.textContent)).toEqual([
      "CHF 240k",
      "CHF 150k",
      "CHF 20k",
    ]);
  });
});

describe("HBarRow / HBars — the reuse seam US-023 composes", () => {
  it("renders one row on its own, with no list and no card around it", () => {
    const { container } = renderSettled(
      <HBarRow
        name="Paid social"
        value={chfFromThousands(150)}
        max={chfFromThousands(240)}
        format={formatMoneyCompact}
      />,
    );

    expect(slot("h-bars", container)).toBeNull();
    expect(slot("card", container)).toBeNull();
    expect(slot("h-bar-value", container)!.textContent).toBe("CHF 150k");
    expect(slot("h-bar-fill", container)!.style.width).toBe("62.5%");
  });

  it("renders the list on its own, for a caller with its own surface", () => {
    const { container } = renderSettled(<HBars rows={DRIVERS} />);

    expect(slot("card", container)).toBeNull();
    expect(slots("h-bar-row", container)).toHaveLength(3);
  });

  it("renders nothing at all for an empty list, rather than an empty box", () => {
    const { container } = render(<HBars rows={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("gives the tile a slot UNDER the bars, so a footnote needs no new card", () => {
    renderSettled(
      <HBarTile title="Fixtures driving the decline" rows={DECLINES} negative>
        <p data-slot="test-note">Lower attendance, not pricing.</p>
      </HBarTile>,
    );

    const note = slot("test-note")!;
    expect(slot("card")!.contains(note)).toBe(true);
    // Under the bars, and inside the same body — not after the card.
    expect(note.parentElement).toBe(slot("h-bars")!.parentElement);
    expect(
      slot("h-bars")!.compareDocumentPosition(note) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("exposes the displayed figure, so a summary can add up the rows", () => {
    // US-023's `-CHF 400k total` badge sums the figures the rows SHOW.
    expect(hBarDisplayedValue(150, true)).toBe(-150);
    expect(hBarDisplayedValue(-150, true)).toBe(-150);
    expect(hBarDisplayedValue(-150, false)).toBe(-150);
    expect(hBarDisplayedValue(150, false)).toBe(150);
    // Zero negates to `-0`, which is still zero to every formatter and to
    // `varianceDirection` — a zero row reads FLAT, never as a decline.
    expect(hBarDisplayedValue(0, true) === 0).toBe(true);
    expect(
      DECLINES.reduce(
        (total, row) => total + hBarDisplayedValue(row.value, true),
        0,
      ),
    ).toBe(chfFromThousands(-400));
  });
});

describe("hBarMax / hBarPercent — the scaling, without a DOM", () => {
  it("takes the largest MAGNITUDE, so a mixed-sign list scales correctly", () => {
    expect(hBarMax(BADGE_TREND)).toBe(38);
    expect(
      hBarMax([
        { name: "a", value: -50 },
        { name: "b", value: 20 },
      ]),
    ).toBe(50);
  });

  it("is zero for an empty list", () => {
    expect(hBarMax([])).toBe(0);
  });

  it("gives the largest row the whole track and the rest a fraction of it", () => {
    expect(hBarPercent(1_840, 1_840)).toBe(100);
    expect(hBarPercent(920, 1_840)).toBe(50);
    expect(hBarPercent(-920, 1_840)).toBe(50);
  });

  it("returns zero width rather than NaN or Infinity for a degenerate list", () => {
    expect(hBarPercent(0, 0)).toBe(0);
    expect(hBarPercent(5, 0)).toBe(0);
    expect(hBarPercent(5, -1)).toBe(0);
    expect(hBarPercent(Number.NaN, 100)).toBe(0);
    expect(hBarPercent(5, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("never exceeds the track, even if a row is larger than the stated max", () => {
    expect(hBarPercent(200, 100)).toBe(100);
  });
});

describe("HBars — values come from tokens and formatters, never literals", () => {
  it("uses no hardcoded colour", () => {
    expect(H_BARS_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(H_BARS_CODE).not.toMatch(/\brgba?\(/);
  });

  it("names its bar colours from the series and variance tokens only", () => {
    for (const fill of Object.values(H_BAR_SERIES)) {
      expect(fill).toMatch(/^from-series-\w+ to-series-\w+\/\d+$/);
    }
    expect(APP_CSS).toMatch(/--color-series-primary:/);
    expect(APP_CSS).toMatch(/--color-variance-negative:/);
  });

  it("writes no currency string of its own", () => {
    expect(H_BARS_CODE).not.toMatch(/CHF/);
  });

  it("uses no dangerouslySetInnerHTML", () => {
    expect(H_BARS_CODE).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
