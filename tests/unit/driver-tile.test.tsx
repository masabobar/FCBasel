import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  H_BAR_LABEL_WIDTH_PX,
  H_BAR_VALUE_WIDTH_PX,
  type HBarDatum,
} from "../../app/components/charts/h-bars";
import {
  DRIVER_TOTAL_LABEL,
  DriverTile,
  DriverTotalBadge,
  driverTotal,
  rankDrivers,
} from "../../app/components/tiles/driver-tile";
import {
  chfFromThousands,
  formatMoneyCompact,
  formatNumber,
  formatSignedPercent,
} from "../../app/lib/format";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { createMockHero1Repository } from "../../app/lib/mock/hero1";
import { createMockHero2Repository } from "../../app/lib/mock/hero2";
import { createMockHero3Repository } from "../../app/lib/mock/hero3";
import {
  declineTotal,
  departmentVariance,
  fixtureDeclines,
} from "../../app/lib/repositories/derive";
import { VarianceJudgement } from "../../app/lib/repositories/enums";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";

/**
 * US-023 — the driver / breakdown tile.
 *
 * The story is a REUSE story, so the tests are too: every assertion about a bar
 * checks that US-021's `HBarRow` is what rendered (its 150px label column, its
 * 96px `nowrap` value column, its `data-slot`s, its reduced-motion behaviour),
 * and a source scan rejects any bar geometry, count-up or value column
 * reappearing in `driver-tile.tsx`. What the tile OWNS — ranking, the derived
 * total and the note line — is tested against the real Hero 1 / 2 / 3 datasets,
 * because "the badge agrees with the bars" is meaningless against a fixture
 * invented to agree.
 */

const SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/tiles/driver-tile.tsx"),
  "utf8",
);

/** The module notes name the things the scans forbid; scan the CODE only. */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const hero1 = await createMockHero1Repository().hero();
const hero3 = await createMockHero3Repository().hero();
const FIXTURES = await createMockHero2Repository().fixtures();

/** US-035 — the badge trend, in the dataset's own order. Mixed sign. */
const BADGE_TREND: readonly HBarDatum[] = hero1.followUp.trend.map((entry) => ({
  name: entry.sponsor,
  value: entry.deltaPercent,
}));

/**
 * US-037 — the four declining fixtures, in FIXTURE order rather than ranked:
 * FCZ, Luzern, Sion, Lugano. Ranking them is the tile's job, and feeding it the
 * unranked list is the only way to prove it does it — including the tie, where
 * Luzern must stay ahead of Sion.
 */
const DECLINES: readonly HBarDatum[] = FIXTURES.filter(
  (fixture) => fixture.current < fixture.previous,
).map((fixture) => ({
  name: fixture.opponent,
  value: chfFromThousands(fixture.previous - fixture.current),
}));

/** US-039 — where Marketing's overspend went. Positive money. */
const DRIVERS: readonly HBarDatum[] = hero3.followUp.drivers.map((driver) => ({
  name: driver.name,
  value: chfFromThousands(driver.amount),
}));

/** The Marketing row, whose variance the drivers must add up to. */
const MARKETING = hero3.primary.departments.find(
  (department) => department.name === "Marketing & Communications",
)!;

const ATTENDANCE_NOTE =
  "The fall is lower attendance rather than pricing in every case.";

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

/** The row labels, top to bottom — the tile's ranking, as rendered. */
function renderedOrder(): string[] {
  return slots("h-bar-row").map(
    (bar) => slot("h-bar-label", bar)!.textContent!,
  );
}

function rowFor(name: string): HTMLElement {
  const found = slots("h-bar-row").find(
    (candidate) => slot("h-bar-label", candidate)?.textContent === name,
  );
  if (!found) throw new Error(`no row labelled "${name}"`);
  return found;
}

function valueText(name: string): string {
  return slot("h-bar-value", rowFor(name))!.textContent!;
}

function fillWidth(name: string): string {
  return slot("h-bar-fill", rowFor(name))!.style.width;
}

/** The badge in the card's action slot, whatever it turns out to be. */
function actionChip(): HTMLElement | null {
  const action = slot("card-action");
  return action ? slot("delta-chip", action) : null;
}

/** Renders and runs the animations out, so assertions see the final figures. */
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

/* ------------------------------------------------------------------------ */

describe("rankDrivers — biggest contribution first, stable for ties", () => {
  it("orders the declining fixtures by size of decline", () => {
    expect(rankDrivers(DECLINES).map((row) => row.name)).toEqual([
      "FCZ",
      "Lugano",
      "Luzern",
      "Sion",
    ]);
  });

  it("keeps Luzern ahead of Sion, which are tied at CHF 70k", () => {
    const tied = rankDrivers(DECLINES).filter(
      (row) => row.value === chfFromThousands(70),
    );

    expect(tied.map((row) => row.name)).toEqual(["Luzern", "Sion"]);
  });

  it("agrees with US-009's derived decline order", () => {
    expect(rankDrivers(DECLINES).map((row) => row.name)).toEqual(
      fixtureDeclines(FIXTURES).map((decline) => decline.opponent),
    );
  });

  it("ranks a mixed-sign list by how much a row moved, not which way", () => {
    expect(rankDrivers(BADGE_TREND).map((row) => row.name)).toEqual([
      "Sunrise",
      "Allianz",
      "IWB",
      "Bitpanda",
    ]);
  });

  it("leaves an authored order alone when asked to", () => {
    expect(rankDrivers(BADGE_TREND, "none")).toBe(BADGE_TREND);
  });

  it("never sorts the caller's dataset in place", () => {
    const before = DECLINES.map((row) => row.name);

    rankDrivers(DECLINES);

    expect(DECLINES.map((row) => row.name)).toEqual(before);
    expect(before).toEqual(["FCZ", "Luzern", "Sion", "Lugano"]);
  });

  it("handles an empty list", () => {
    expect(rankDrivers([])).toEqual([]);
  });
});

describe("driverTotal — derived from the rows, never passed in", () => {
  it("totals the declining fixtures as a decline of CHF 400k", () => {
    expect(driverTotal(DECLINES, true)).toBe(
      chfFromThousands(-declineTotal(FIXTURES)),
    );
    expect(driverTotal(DECLINES, true)).toBe(chfFromThousands(-400));
  });

  it("totals Marketing's drivers to exactly the Marketing variance", () => {
    expect(driverTotal(DRIVERS)).toBe(
      chfFromThousands(departmentVariance(MARKETING)),
    );
    expect(driverTotal(DRIVERS)).toBe(chfFromThousands(410));
  });

  it("sums a mixed-sign list with its signs", () => {
    expect(driverTotal(BADGE_TREND)).toBe(2 + 38 + 6 - 3);
  });

  it("is unchanged by ranking — the badge cannot depend on the order", () => {
    expect(driverTotal(rankDrivers(DECLINES), true)).toBe(
      driverTotal(DECLINES, true),
    );
  });

  it("treats a stored negative the same as a magnitude in negative mode", () => {
    expect(driverTotal([{ name: "FCZ", value: -150 }], true)).toBe(-150);
    expect(driverTotal([{ name: "FCZ", value: 150 }], true)).toBe(-150);
  });

  it("is zero for an empty list", () => {
    expect(driverTotal([])).toBe(0);
  });
});

describe("DriverTile — ranked bars with a custom formatter", () => {
  it("renders the declining fixtures ranked, as negative money", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
      />,
    );

    expect(renderedOrder()).toEqual(["FCZ", "Lugano", "Luzern", "Sion"]);
    expect(valueText("FCZ")).toBe("-CHF 150k");
    expect(valueText("Lugano")).toBe("-CHF 110k");
    expect(valueText("Luzern")).toBe("-CHF 70k");
    expect(valueText("Sion")).toBe("-CHF 70k");
  });

  it("renders the Marketing drivers as positive money", () => {
    renderSettled(
      <DriverTile
        title="What's driving Marketing"
        rows={DRIVERS}
        format={formatMoneyCompact}
      />,
    );

    expect(renderedOrder()).toEqual([
      "Match activations",
      "Paid social",
      "Agency retainer",
    ]);
    expect(valueText("Match activations")).toBe("CHF 240k");
    expect(valueText("Paid social")).toBe("CHF 150k");
    expect(valueText("Agency retainer")).toBe("CHF 20k");
  });

  it("renders the badge trend as signed percentages, both directions", () => {
    renderSettled(
      <DriverTile
        title="Badge selection trend"
        rows={BADGE_TREND}
        rank="none"
        format={formatSignedPercent}
        series="blue"
      />,
    );

    expect(renderedOrder()).toEqual(["Bitpanda", "Sunrise", "Allianz", "IWB"]);
    expect(valueText("Sunrise")).toBe("+38%");
    expect(valueText("Bitpanda")).toBe("+2%");
    expect(valueText("IWB")).toBe("-3%");

    // Mixed sign renders BOTH directions from one dataset, and the direction
    // is published as data rather than only as a colour.
    expect(rowFor("Sunrise").dataset.direction).toBe("UP");
    expect(rowFor("IWB").dataset.direction).toBe("DOWN");
  });

  it("falls back to the shared default formatter when none is given", () => {
    renderSettled(<DriverTile title="Units" rows={DRIVERS} />);

    expect(valueText("Match activations")).toBe(
      formatNumber(chfFromThousands(240)),
    );
  });

  it("renders nothing for an empty list but keeps its card", () => {
    render(<DriverTile title="Nothing to explain" rows={[]} />);

    expect(slots("h-bar-row")).toHaveLength(0);
    expect(screen.getByText("Nothing to explain")).toBeTruthy();
  });
});

describe("DriverTile — the action-slot badge, derived from the rows", () => {
  it("puts a `-CHF 400k total` chip in the card's action slot", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        showTotal
      />,
    );

    const chip = actionChip()!;
    expect(chip.textContent).toContain("-CHF 400k");
    expect(slot("delta-suffix", chip)!.textContent).toBe(DRIVER_TOTAL_LABEL);
    // Sign, arrow and word — never colour alone.
    expect(chip.dataset.direction).toBe("DOWN");
    expect(chip.textContent).toContain("down");
  });

  it("spells the badge with the SAME formatter the rows use", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        showTotal
      />,
    );

    expect(actionChip()!.textContent).toContain(
      formatMoneyCompact(driverTotal(DECLINES, true)),
    );
  });

  it("re-derives the total when the rows change, so it cannot disagree", () => {
    const { rerender } = renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        showTotal
      />,
    );
    expect(actionChip()!.textContent).toContain("-CHF 400k");

    rerender(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES.slice(0, 2)}
        negative
        format={formatMoneyCompact}
        showTotal
      />,
    );

    expect(actionChip()!.textContent).toContain("-CHF 220k");
  });

  it("shows an overspend total as ADVERSE when the caller says so", () => {
    renderSettled(
      <DriverTile
        title="What's driving Marketing"
        rows={DRIVERS}
        format={formatMoneyCompact}
        showTotal
        totalJudgement={VarianceJudgement.ADVERSE}
      />,
    );

    const chip = actionChip()!;
    expect(chip.textContent).toContain("CHF 410k");
    // UP and ADVERSE at once — an overspend that grew is bad news (US-022).
    expect(chip.dataset.direction).toBe("UP");
    expect(chip.dataset.judgement).toBe(VarianceJudgement.ADVERSE);
  });

  it("takes a caller's own label for the trailing word", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        showTotal
        totalLabel="lost"
      />,
    );

    expect(slot("delta-suffix")!.textContent).toBe("lost");
  });

  it("shows no badge unless asked", () => {
    renderSettled(<DriverTile title="Badge trend" rows={BADGE_TREND} />);

    expect(actionChip()).toBeNull();
  });

  it("yields the slot to an explicit action rather than combining the two", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        showTotal
        action={<span>Last 8 fixtures</span>}
      />,
    );

    expect(slot("card-action")!.textContent).toBe("Last 8 fixtures");
    expect(actionChip()).toBeNull();
  });
});

describe("DriverTotalBadge — the chip on its own", () => {
  it("is DeltaChip with a word after the figure", () => {
    render(
      <DriverTotalBadge
        total={chfFromThousands(-400)}
        format={formatMoneyCompact}
      />,
    );

    const chip = slot("delta-chip")!;
    expect(chip.textContent).toContain("-CHF 400k");
    expect(slot("delta-suffix", chip)!.textContent).toBe("total");
    expect(slot("delta-arrow", chip)).toBeTruthy();
  });

  it("formats plain counts by default, as the bar row does", () => {
    render(<DriverTotalBadge total={1_840} />);

    expect(slot("delta-chip")!.textContent).toContain(formatNumber(1_840));
  });
});

describe("DriverTile — the note line under the bars", () => {
  it("renders the attendance note, wrapping rather than truncating", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        note={ATTENDANCE_NOTE}
      />,
    );

    const note = slot("driver-note")!;
    expect(note.textContent).toBe(ATTENDANCE_NOTE);
    expect(note.className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
  });

  it("sits under the bars, inside the same card", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        note={ATTENDANCE_NOTE}
      />,
    );

    const bars = slot("h-bars")!;
    const note = slot("driver-note")!;
    expect(bars.parentElement).toBe(note.parentElement);
    expect(
      bars.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(slot("card")!.contains(note)).toBe(true);
  });

  it("renders no note element when there is no note", () => {
    renderSettled(<DriverTile title="Badge trend" rows={BADGE_TREND} />);

    expect(slot("driver-note")).toBeNull();
  });

  it("is not the card's narrative caption strip", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        note={ATTENDANCE_NOTE}
        caption="Written by the assistant."
      />,
    );

    expect(slot("driver-note")!.textContent).toBe(ATTENDANCE_NOTE);
    expect(slot("card-caption")!.textContent).toContain(
      "Written by the assistant.",
    );
  });
});

describe("DriverTile — REUSE: the rows are US-021's, not a second row", () => {
  it("renders `HBarRow`s, keeping both of its review decisions", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
      />,
    );

    expect(slots("h-bar-row")).toHaveLength(DECLINES.length);

    for (const bar of slots("h-bar-row")) {
      const label = slot("h-bar-label", bar)!;
      const value = slot("h-bar-value", bar)!;

      // The 150px label column and the 96px `nowrap` value column, read back
      // off the rendered element exactly as `h-bars.test.tsx` reads them.
      expect(label.style.width).toBe(`${H_BAR_LABEL_WIDTH_PX}px`);
      expect(value.style.width).toBe(`${H_BAR_VALUE_WIDTH_PX}px`);
      expect(value.style.whiteSpace).toBe("nowrap");
      expect(label.className).not.toMatch(/truncate|line-clamp|text-ellipsis/);
      expect(slot("h-bar-track", bar)!.getAttribute("aria-hidden")).toBe(
        "true",
      );
    }
  });

  it("gets its scaling from `HBars` — the longest bar fills the track", () => {
    renderSettled(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
      />,
    );

    expect(fillWidth("FCZ")).toBe("100%");
    expect(fillWidth("Lugano")).toBe("73.33%");
    expect(fillWidth("Sion")).toBe("46.67%");
  });

  it("contains no bar geometry, value column or motion of its own", () => {
    // The row, the track, the fill, the two column widths and the count-up all
    // live in `h-bars.tsx`. A copy of any of them here is the defect this
    // story exists to prevent.
    expect(CODE).not.toMatch(/h-bar-(?:row|track|fill|label|value)/);
    expect(CODE).not.toMatch(/H_BAR_(?:LABEL|VALUE)_WIDTH_PX|H_BAR_SERIES/);
    expect(CODE).not.toMatch(/whiteSpace|nowrap|truncate/);
    expect(CODE).not.toMatch(/\bwidth\b|\btoFixed\b|Math\.min/);
    expect(CODE).not.toMatch(/useCountUp|useGrow|transition|animation/);
    expect(CODE).not.toMatch(
      /\buseState\b|\buseEffect\b|\bsetInterval\b|\bsetTimeout\b|requestAnimationFrame/,
    );
    expect(CODE).not.toMatch(/from-|to-|bg-linear/);
  });

  it("delegates the card chrome and the chip rather than restating them", () => {
    expect(CODE).toMatch(/import\s*\{[\s\S]*?\bHBarTile\b[\s\S]*?\}\s*from/);
    expect(CODE).toMatch(/\bDeltaChip\b/);
    // No second `Card`, and no second chip: both arrive through the two
    // components above.
    expect(CODE).not.toMatch(/\bCard\b|rounded-badge|rounded-tile/);
  });
});

describe("DriverTile — reduced motion", () => {
  it("renders the final widths, figures and total immediately", () => {
    stubMatchMedia(true);
    const frames = stubFrames();

    render(
      <DriverTile
        title="Fixtures driving the drop"
        rows={DECLINES}
        negative
        format={formatMoneyCompact}
        showTotal
      />,
    );

    expect(fillWidth("FCZ")).toBe("100%");
    expect(valueText("FCZ")).toBe("-CHF 150k");
    expect(valueText("Sion")).toBe("-CHF 70k");
    expect(actionChip()!.textContent).toContain("-CHF 400k");
    expect(frames.requested()).toBe(0);
  });
});

describe("DriverTile — values come from tokens and formatters only", () => {
  it("uses no hardcoded colour", () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\brgba?\(/);
  });

  it("assembles no figure or currency string of its own", () => {
    // Every single-line string literal in the module — none of them may carry
    // a unit or a sign, because every figure on screen comes from
    // `app/lib/format.ts` through the `format` prop.
    const literals = CODE.match(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/g) ?? [];

    expect(literals.length).toBeGreaterThan(0);
    for (const literal of literals) {
      expect(literal).not.toMatch(/CHF|%|\+/);
    }
    expect(CODE).toMatch(/formatNumber/);
  });

  it("uses no dangerouslySetInnerHTML", () => {
    expect(CODE).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
