import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DELTA_VARIANT_CLASS,
  DeltaChip,
  type DeltaChipProps,
} from "../../app/components/tiles/delta-chip";
import {
  formatSignedMoneyCompact,
  formatSignedPercent,
} from "../../app/lib/format";
import { VarianceJudgement } from "../../app/lib/repositories/enums";

/**
 * The chip's source with comments stripped: the checks below are about what the
 * code may NOT contain, and the doc comment legitimately quotes a hex value
 * while explaining why the negative token exists.
 */
const CHIP_CODE = readFileSync(
  resolve(process.cwd(), "app/components/tiles/delta-chip.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/** Renders one chip and returns it — several tests render two and compare. */
function renderChip(props: DeltaChipProps): HTMLElement {
  const { container } = render(<DeltaChip {...props} />);
  return container.querySelector<HTMLElement>('[data-slot="delta-chip"]')!;
}

/** The arrow's own markup. Up, down and the flat dash are different glyphs. */
function glyph(chip: HTMLElement): string {
  return chip.querySelector('[data-slot="delta-arrow"]')!.innerHTML;
}

/** What a screen reader is told about the direction. */
function spokenDirection(chip: HTMLElement): string {
  return chip.querySelector(".sr-only")!.textContent!;
}

describe("DeltaChip — a positive movement", () => {
  it("shows the explicit sign, the value and an up arrow", () => {
    const chip = renderChip({ value: 12 });

    expect(chip).toHaveTextContent("+12%");
    expect(chip.dataset.direction).toBe("UP");
    expect(chip.querySelector('[data-slot="delta-arrow"]')).not.toBeNull();
  });

  it("colours with the positive variance token, never with club red", () => {
    const chip = renderChip({ value: 12 });

    expect(chip).toHaveClass("text-variance-positive");
    expect(chip.className).not.toMatch(/\btext-red\b/);
  });

  it("takes its string from the shared signed formatter", () => {
    const chip = renderChip({ value: 0.6 });

    expect(chip).toHaveTextContent(formatSignedPercent(0.6));
  });
});

describe("DeltaChip — a negative movement", () => {
  it("shows the minus sign, the value and a down arrow", () => {
    const chip = renderChip({ value: -0.6 });

    expect(chip).toHaveTextContent(formatSignedPercent(-0.6));
    expect(chip).toHaveTextContent("-0.6%");
    expect(chip.dataset.direction).toBe("DOWN");
  });

  it("colours with the negative variance token", () => {
    const chip = renderChip({ value: -0.6 });

    expect(chip).toHaveClass("text-variance-negative");
  });

  it("draws a different glyph from a positive movement", () => {
    // Not "an arrow is present" — the two directions must be distinguishable
    // by shape alone, with the colour discarded.
    expect(glyph(renderChip({ value: 12 }))).not.toBe(
      glyph(renderChip({ value: -12 })),
    );
  });
});

describe("DeltaChip — colour is never the sole signal", () => {
  it("keeps sign, glyph and spoken word distinct when the colour is identical", () => {
    // The `light` variant is this principle in production: on the navy band
    // both directions share one white treatment, because the negative token is
    // illegible there. Everything that says WHICH WAY must survive that.
    const up = renderChip({ value: 12, variant: "light" });
    const down = renderChip({ value: -12, variant: "light" });

    expect(up.className).toBe(down.className);

    expect(up.textContent).toContain("+");
    expect(down.textContent).toContain("-");
    expect(glyph(up)).not.toBe(glyph(down));
    expect(spokenDirection(up)).toBe("up");
    expect(spokenDirection(down)).toBe("down");
  });

  it("states the direction in words, which no colour can carry", () => {
    expect(spokenDirection(renderChip({ value: 5 }))).toBe("up");
    expect(spokenDirection(renderChip({ value: -5 }))).toBe("down");
    expect(spokenDirection(renderChip({ value: 0 }))).toBe("unchanged");
  });

  it("hides the arrow from the accessibility tree, since the word replaces it", () => {
    const chip = renderChip({ value: 12 });

    expect(chip.querySelector('[data-slot="delta-arrow"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

describe("DeltaChip — a zero variance", () => {
  it("renders a labelled zero rather than an empty or broken chip", () => {
    const chip = renderChip({ value: 0 });

    expect(chip).toBeInTheDocument();
    // House style signs a zero as `+0%` (`signOf` in app/lib/format.ts); the
    // dash glyph and the spoken "unchanged" carry the flatness.
    expect(chip).toHaveTextContent(formatSignedPercent(0));
    expect(chip.textContent).toContain("0");
    expect(chip.dataset.direction).toBe("FLAT");
  });

  it("uses neither variance token — a zero is neither good nor bad news", () => {
    const chip = renderChip({ value: 0 });

    expect(chip.dataset.judgement).toBe(VarianceJudgement.NEUTRAL);
    expect(chip).toHaveClass("text-muted");
    expect(chip.className).not.toMatch(/variance-(positive|negative)/);
  });

  it("marks it with a dash, not an arrow in either direction", () => {
    const flat = glyph(renderChip({ value: 0 }));

    expect(flat).not.toBe(glyph(renderChip({ value: 1 })));
    expect(flat).not.toBe(glyph(renderChip({ value: -1 })));
  });
});

describe("DeltaChip — direction is not judgement", () => {
  it("draws an up arrow in the negative token for an overspend", () => {
    // Marketing spending CHF 410k above budget: UP and ADVERSE at once. The
    // caller that knows the department's Revenue/Cost tag says so.
    const chip = renderChip({
      value: 410,
      judgement: VarianceJudgement.ADVERSE,
      format: formatSignedMoneyCompact,
    });

    expect(chip.dataset.direction).toBe("UP");
    expect(chip.dataset.judgement).toBe(VarianceJudgement.ADVERSE);
    expect(chip).toHaveClass("text-variance-negative");
    expect(chip).toHaveTextContent(formatSignedMoneyCompact(410));
  });

  it("draws a down arrow in the positive token for spend under budget", () => {
    const chip = renderChip({
      value: -120,
      judgement: VarianceJudgement.FAVOURABLE,
    });

    expect(chip.dataset.direction).toBe("DOWN");
    expect(chip).toHaveClass("text-variance-positive");
  });

  it("falls back to the sign when no judgement is supplied", () => {
    expect(renderChip({ value: 12 }).dataset.judgement).toBe(
      VarianceJudgement.FAVOURABLE,
    );
    expect(renderChip({ value: -12 }).dataset.judgement).toBe(
      VarianceJudgement.ADVERSE,
    );
  });
});

describe("DeltaChip — variants", () => {
  it("differs between the default and the light treatment", () => {
    const onWhite = renderChip({ value: 12 });
    const onNavy = renderChip({ value: 12, variant: "light" });

    expect(onWhite.className).not.toBe(onNavy.className);
    expect(onNavy).toHaveClass("text-bg");
    expect(onWhite).toHaveClass("text-variance-positive");
  });

  it("offers a treatment for every judgement in both variants", () => {
    for (const byJudgement of Object.values(DELTA_VARIANT_CLASS)) {
      for (const judgement of Object.values(VarianceJudgement)) {
        expect(byJudgement[judgement]).toBeTruthy();
      }
    }
  });

  it("only paints with colours that exist as tokens", () => {
    for (const byJudgement of Object.values(DELTA_VARIANT_CLASS)) {
      for (const classes of Object.values(byJudgement)) {
        for (const utility of classes.split(" ")) {
          const token = utility
            .replace(/^(?:bg|text)-/, "")
            .replace(/\/\d+$/, "");
          expect(APP_CSS).toMatch(new RegExp(`--color-${token}:`));
        }
      }
    }
  });
});

describe("DeltaChip — typography and merging", () => {
  it("keeps the caption size token alongside the colour token", () => {
    // The US-012 trap: `tailwind-merge` reads a named size as a colour and
    // silently drops one of the two. Both must survive on one element.
    const chip = renderChip({ value: 12 });

    expect(chip).toHaveClass("text-caption", "text-variance-positive");
  });

  it("renders the figure with tabular numerals so a column of chips aligns", () => {
    const chip = renderChip({ value: 12 });

    expect(chip.querySelector(".tabular-nums")).toHaveTextContent("+12%");
  });

  it("never wraps the arrow away from its value", () => {
    expect(renderChip({ value: 12 })).toHaveClass("whitespace-nowrap");
  });

  it("merges a caller className over its own base classes", () => {
    expect(renderChip({ value: 12, className: "ml-auto" })).toHaveClass(
      "ml-auto",
      "text-caption",
    );
  });
});

describe("DeltaChip — the suffix slot (US-023's total badge)", () => {
  it("puts the caller's word after the figure, inside the one chip", () => {
    const chip = renderChip({ value: -12, suffix: "total" });
    const suffix = chip.querySelector('[data-slot="delta-suffix"]')!;

    expect(suffix).toHaveTextContent("total");
    // After the figure, and still inside the chip — one chip reading
    // `-12% total`, not a chip beside a stray label.
    expect(
      chip.querySelector(".tabular-nums")!.compareDocumentPosition(suffix) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(glyph(chip)).not.toBe("");
    expect(spokenDirection(chip)).toBe("down");
  });

  it("renders no extra element when no suffix is given", () => {
    expect(
      renderChip({ value: 12 }).querySelector('[data-slot="delta-suffix"]'),
    ).toBeNull();
  });
});

describe("DeltaChip — values come from tokens and formatters, never literals", () => {
  it("uses no hardcoded colour", () => {
    expect(CHIP_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CHIP_CODE).not.toMatch(/\brgba?\(/);
  });

  it("writes no currency, percent or sign string of its own", () => {
    expect(CHIP_CODE).not.toMatch(/["'`][^"'`]*(?:CHF|%|\+)[^"'`]*["'`]/);
  });

  it("uses no dangerouslySetInnerHTML", () => {
    expect(CHIP_CODE).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
