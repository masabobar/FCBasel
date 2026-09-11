import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Card } from "../../app/components/tiles/card";
import {
  CHIP_SURFACE_CLASS,
  NO_SELECTION,
  nextOptionIndex,
  SEGMENTED_VARIANT_CLASS,
  Segmented,
  type SegmentedOption,
  type SegmentedVariant,
} from "../../app/components/controls/segmented";
import { PERIOD_LABEL_KEY, PeriodKey } from "../../app/lib/repositories/enums";
import type { BaselinePeriod } from "../../app/lib/repositories/types";
import { radius } from "../../app/lib/tokens";
import { t } from "./support/i18n";

/**
 * The control's source with comments stripped. Several checks below are about
 * what the code may NOT contain, and the doc comment legitimately names
 * `rounded-full` and `PeriodKey` while explaining why neither is used as a
 * value here.
 */
const SEGMENTED_CODE = readFileSync(
  resolve(process.cwd(), "app/components/controls/segmented.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/** The `.fcb-chip` rules only — the radius and the lift are asserted on these. */
const CHIP_RULES = (() => {
  const matched = APP_CSS.match(/\.fcb-chip[^{]*\{[^}]*\}/g);
  if (!matched) throw new Error("app/app.css must declare a .fcb-chip rule");
  return matched.join("\n");
})();

/**
 * The hero band's four periods, built the way a fixture builds them: the shared
 * key plus the DEFAULT wording from the label map.
 */
const BAND_PERIODS: readonly SegmentedOption[] = [
  {
    key: PeriodKey.THIS_MONTH,
    labelKey: PERIOD_LABEL_KEY[PeriodKey.THIS_MONTH],
  },
  {
    key: PeriodKey.LAST_MONTH,
    labelKey: PERIOD_LABEL_KEY[PeriodKey.LAST_MONTH],
  },
  {
    key: PeriodKey.LAST_3_MONTHS,
    labelKey: PERIOD_LABEL_KEY[PeriodKey.LAST_3_MONTHS],
  },
  {
    key: PeriodKey.YEAR_TO_DATE,
    labelKey: PERIOD_LABEL_KEY[PeriodKey.YEAR_TO_DATE],
  },
];

function group(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="segmented"]')!;
}

function optionButtons(): HTMLButtonElement[] {
  return [
    ...document.querySelectorAll<HTMLButtonElement>(
      '[data-slot="segmented-option"]',
    ),
  ];
}

function optionByLabel(label: string): HTMLButtonElement {
  return screen.getByRole("radio", { name: label });
}

/** The one option the accessibility tree reports as chosen. */
function checkedLabels(): string[] {
  return optionButtons()
    .filter((button) => button.getAttribute("aria-checked") === "true")
    .map((button) => button.textContent!);
}

/**
 * A caller that actually owns the period, so the arrow-key and click paths can
 * be exercised end to end. The control itself never holds this state — the
 * "controlled" tests render `Segmented` directly and prove it.
 */
function Harness({
  initial = PeriodKey.THIS_MONTH,
  variant,
  options = BAND_PERIODS,
}: {
  initial?: PeriodKey;
  variant?: SegmentedVariant;
  options?: readonly SegmentedOption[];
}) {
  const [value, setValue] = useState<PeriodKey>(initial);
  return (
    <>
      <Segmented
        options={options}
        value={value}
        onChange={setValue}
        variant={variant}
      />
      <button type="button">after the group</button>
    </>
  );
}

/* --------------------------------------------------------------- OPTIONS -- */

describe("Segmented — the options", () => {
  it("renders every option, in the order given, with its own wording", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(optionButtons().map((button) => button.textContent)).toEqual([
      "This month",
      "Last month",
      "Last 3 months",
      "Year to date",
    ]);
  });

  it("takes the label from the ENTRY, so Hero 1 can say 'Current month'", () => {
    // Hero 1 renames the very same THIS_MONTH key. Nothing is looked up from
    // the key at render time, which is what makes that possible.
    render(
      <Segmented
        options={[
          {
            key: PeriodKey.SEASON_TO_DATE,
            labelKey: PERIOD_LABEL_KEY[PeriodKey.SEASON_TO_DATE],
          },
          // Hero 1's override: the same key, a different dictionary entry.
          { key: PeriodKey.THIS_MONTH, labelKey: "enum.period.CURRENT_MONTH" },
        ]}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(optionByLabel("Current month")).toBeInTheDocument();
    expect(screen.queryByText("This month")).not.toBeInTheDocument();
  });

  it("renders nothing at all when there are no options", () => {
    const { container } = render(
      <Segmented
        options={[]}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("every option is a real button, so no form can be submitted by one", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    for (const button of optionButtons()) {
      expect(button).toHaveAttribute("type", "button");
    }
  });
});

/* ------------------------------------------------------------ PLACEMENT -- */

describe("Segmented — where it renders", () => {
  it("sits in a card's action slot", () => {
    render(
      <Card
        title="Top products"
        action={
          <Segmented
            options={BAND_PERIODS}
            value={PeriodKey.THIS_MONTH}
            onChange={vi.fn()}
            label="Period for top products"
          />
        }
      >
        rows
      </Card>,
    );

    const slot = document.querySelector('[data-slot="card-action"]')!;
    expect(slot.querySelector('[data-slot="segmented"]')).not.toBeNull();
  });

  it("sits in a section header, named for what it drives", () => {
    render(
      <header>
        <h2>Merchandise</h2>
        <Segmented
          options={BAND_PERIODS}
          value={PeriodKey.THIS_MONTH}
          onChange={vi.fn()}
          label="Period for merchandise"
        />
      </header>,
    );

    expect(
      screen.getByRole("radiogroup", { name: "Period for merchandise" }),
    ).toBeInTheDocument();
  });

  it("is inline, so it does not stretch the header row it is dropped into", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(group()).toHaveClass("inline-flex");
  });
});

/* ------------------------------------------------------- SELECTED STATE -- */

describe("Segmented — the selected option", () => {
  it("is a radiogroup with an accessible name, so it is announced as a choice", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.LAST_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("radiogroup", { name: "Period" })).toBe(group());
    expect(screen.getAllByRole("radio")).toHaveLength(BAND_PERIODS.length);
  });

  it("marks exactly one option chosen in the accessibility tree", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.LAST_3_MONTHS}
        onChange={vi.fn()}
      />,
    );

    expect(checkedLabels()).toEqual(["Last 3 months"]);
    expect(optionByLabel("This month")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("does not rely on colour: the chosen option is filled, raised and heavier", () => {
    // The projector-shift rule. Strip every colour class and the fill, the
    // shadow and the weight still say which period is showing — and
    // `aria-checked` above says it where no colour reaches at all.
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    const chosen = optionByLabel("This month");
    const other = optionByLabel("Last month");

    expect(chosen).toHaveClass("shadow-raised", "font-bold");
    expect(chosen.dataset.selected).toBe("true");
    expect(other.className).not.toMatch(/\bshadow-raised\b/);
    expect(other).toHaveClass("font-semibold");
    expect(other.dataset.selected).toBe("false");
  });

  it("marks nothing chosen when the caller's value is outside the options", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.SEASON_TO_DATE}
        onChange={vi.fn()}
      />,
    );

    expect(checkedLabels()).toEqual([]);
  });
});

/* ---------------------------------------------------------- CONTROLLED -- */

describe("Segmented — it is controlled", () => {
  it("calls back with the pressed period's key", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={onChange}
      />,
    );

    await user.click(optionByLabel("Year to date"));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(PeriodKey.YEAR_TO_DATE);
  });

  it("does NOT select itself — a press the caller ignores changes nothing", async () => {
    const user = userEvent.setup();
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    await user.click(optionByLabel("Last month"));

    // This is what lets ONE control drive two tiles without them disagreeing:
    // the button row shows the caller's period, never its own guess.
    expect(checkedLabels()).toEqual(["This month"]);
  });

  it("follows the caller when the caller does move", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(optionByLabel("Last 3 months"));

    expect(checkedLabels()).toEqual(["Last 3 months"]);
  });

  it("still notifies when the chosen option is pressed again", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={onChange}
      />,
    );

    await user.click(optionByLabel("This month"));

    expect(onChange).toHaveBeenCalledWith(PeriodKey.THIS_MONTH);
  });
});

/* ------------------------------------------------------------ KEYBOARD -- */

describe("nextOptionIndex — where an arrow key goes", () => {
  it("moves forwards and wraps at the end", () => {
    expect(nextOptionIndex("ArrowRight", 0, 4)).toBe(1);
    expect(nextOptionIndex("ArrowRight", 3, 4)).toBe(0);
  });

  it("moves backwards and wraps at the start", () => {
    expect(nextOptionIndex("ArrowLeft", 2, 4)).toBe(1);
    expect(nextOptionIndex("ArrowLeft", 0, 4)).toBe(3);
  });

  it("handles the vertical axis too, for a stacked header", () => {
    expect(nextOptionIndex("ArrowDown", 1, 4)).toBe(2);
    expect(nextOptionIndex("ArrowUp", 1, 4)).toBe(0);
  });

  it("jumps to the ends with Home and End", () => {
    expect(nextOptionIndex("Home", 2, 4)).toBe(0);
    expect(nextOptionIndex("End", 2, 4)).toBe(3);
  });

  it("enters an unset control at the first option, or the last going back", () => {
    expect(nextOptionIndex("ArrowRight", NO_SELECTION, 4)).toBe(0);
    expect(nextOptionIndex("ArrowLeft", NO_SELECTION, 4)).toBe(3);
  });

  it("leaves every other key alone, so Tab and Enter keep their meaning", () => {
    expect(nextOptionIndex("Tab", 0, 4)).toBeNull();
    expect(nextOptionIndex("Enter", 0, 4)).toBeNull();
    expect(nextOptionIndex(" ", 0, 4)).toBeNull();
    expect(nextOptionIndex("Escape", 0, 4)).toBeNull();
  });

  it("has nowhere to go with no options", () => {
    expect(nextOptionIndex("ArrowRight", NO_SELECTION, 0)).toBeNull();
  });
});

describe("Segmented — keyboard", () => {
  it("is ONE tab stop: the chosen option holds it, the rest are skipped", async () => {
    const user = userEvent.setup();
    render(<Harness initial={PeriodKey.LAST_MONTH} />);

    await user.tab();
    expect(optionByLabel("Last month")).toHaveFocus();

    // The next Tab leaves the group entirely rather than walking the options.
    await user.tab();
    expect(
      screen.getByRole("button", { name: "after the group" }),
    ).toHaveFocus();
  });

  it("keeps the group reachable when nothing is chosen", async () => {
    const user = userEvent.setup();
    render(<Harness initial={PeriodKey.SEASON_TO_DATE} />);

    await user.tab();

    expect(optionByLabel("This month")).toHaveFocus();
  });

  it("gives every unchosen option a tabIndex of -1", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.LAST_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(optionByLabel("Last month")).toHaveAttribute("tabindex", "0");
    for (const label of ["This month", "Last 3 months", "Year to date"]) {
      expect(optionByLabel(label)).toHaveAttribute("tabindex", "-1");
    }
  });

  it("selects as it moves, and focus follows the selection", async () => {
    const user = userEvent.setup();
    render(<Harness initial={PeriodKey.THIS_MONTH} />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(checkedLabels()).toEqual(["Last month"]);
    expect(optionByLabel("Last month")).toHaveFocus();
    expect(optionByLabel("Last month")).toHaveAttribute("tabindex", "0");
  });

  it("wraps round the end of the row", async () => {
    const user = userEvent.setup();
    render(<Harness initial={PeriodKey.THIS_MONTH} />);

    await user.tab();
    await user.keyboard("{ArrowLeft}");

    expect(checkedLabels()).toEqual(["Year to date"]);
    expect(optionByLabel("Year to date")).toHaveFocus();
  });

  it("reaches the ends with Home and End", async () => {
    const user = userEvent.setup();
    render(<Harness initial={PeriodKey.LAST_MONTH} />);

    await user.tab();
    await user.keyboard("{End}");
    expect(checkedLabels()).toEqual(["Year to date"]);

    await user.keyboard("{Home}");
    expect(checkedLabels()).toEqual(["This month"]);
  });

  it("notifies the caller with the key the arrows landed on", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={onChange}
      />,
    );

    optionByLabel("This month").focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith(PeriodKey.LAST_MONTH);
  });
});

/* ------------------------------------------------------------ VARIANTS -- */

describe("Segmented — light and dark", () => {
  it("defaults to the light surface", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(group().dataset.variant).toBe("light");
  });

  it("dresses the group differently on each surface", () => {
    const { unmount } = render(<Harness variant="light" />);
    const light = group().className;
    unmount();

    render(<Harness variant="dark" />);
    const dark = group().className;

    expect(light).not.toBe(dark);
    expect(light).toContain("bg-surface");
    // Translucent white, so the navy band shows through the control.
    expect(dark).toContain("bg-bg/10");
  });

  it("dresses the chosen option differently on each surface", () => {
    const { unmount } = render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
        variant="light"
      />,
    );
    const light = optionByLabel("This month").className;
    unmount();

    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
        variant="dark"
      />,
    );
    const dark = optionByLabel("This month").className;

    expect(light).not.toBe(dark);
    // Navy fill on white; the club's gold accent on the navy band.
    expect(light).toContain("bg-navy");
    expect(dark).toContain("bg-gold");
  });

  it("tints on hover on both surfaces — the other half of the lift", () => {
    for (const variant of ["light", "dark"] as const) {
      expect(SEGMENTED_VARIANT_CLASS[variant].option).toMatch(/\bhover:bg-/);
    }
  });

  it("keeps both surfaces on token utilities only", () => {
    for (const tone of Object.values(SEGMENTED_VARIANT_CLASS)) {
      for (const classes of Object.values(tone)) {
        expect(classes).not.toMatch(/#[0-9a-fA-F]{3,8}/);
        expect(classes).not.toMatch(/\[/);
      }
    }
  });
});

/* -------------------------------------------------------------- RADIUS -- */

describe("Segmented — 11px corners, not a pill", () => {
  it("is 11px by token: the control wears the chip radius", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(group()).toHaveClass("rounded-chip");
    expect(radius.chip).toBe("11px");
    expect(APP_CSS).toMatch(/--radius-chip:\s*11px;/);
  });

  it("gives each option the same 11px chip surface, from the same variable", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    for (const button of optionButtons()) {
      expect(button).toHaveClass(CHIP_SURFACE_CLASS);
    }
    expect(CHIP_RULES).toMatch(/border-radius:\s*var\(--radius-chip\)/);
    // The radius is written in the token layer once — never restated here.
    expect(CHIP_RULES).not.toMatch(/border-radius:\s*11px/);
  });

  it("is NEVER a full pill — the reviewed decision, enforced", () => {
    render(
      <Segmented
        options={BAND_PERIODS}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    const everyClass = [group(), ...optionButtons()]
      .map((element) => element.className)
      .join(" ");

    expect(everyClass).not.toMatch(/\brounded-full\b/);
    expect(everyClass).not.toMatch(/\brounded-pill\b/);
    expect(SEGMENTED_CODE).not.toMatch(/rounded-full|rounded-pill|radius-pill/);
    expect(CHIP_RULES).not.toMatch(/9999px|--radius-pill/);
    // 11px is not 12px either: the tile radius is a different decision.
    expect(radius.chip).not.toBe(radius.tile);
    expect(radius.chip).not.toBe(radius.pill);
  });

  it("lifts and tints on hover, from the shared chip class", () => {
    expect(CHIP_RULES).toMatch(
      /\.fcb-chip:hover[^{]*\{[^}]*translateY\(-1px\)/,
    );
    expect(CHIP_RULES).toMatch(/transition-duration:\s*var\(--duration-fast\)/);
    expect(CHIP_RULES).toMatch(/transition-property:[^;]*transform/);
    expect(CHIP_RULES).toMatch(/transition-property:[^;]*background-color/);
  });
});

/* ---------------------------------------------------------- ENUM REUSE -- */

describe("Segmented — it reuses PeriodKey", () => {
  it("imports the shared enum instead of declaring a competing key set", () => {
    expect(SEGMENTED_CODE).toMatch(
      /import \{ type PeriodKey \} from "\.\.\/\.\.\/lib\/repositories\/enums"/,
    );
  });

  it("contains no period string literal at all — the enum is the only source", () => {
    for (const key of Object.values(PeriodKey)) {
      expect(SEGMENTED_CODE).not.toContain(`"${key}"`);
    }
    expect(SEGMENTED_CODE).not.toContain("THIS_MONTH");
  });

  it("types its option key as PeriodKey, so an invented period cannot compile", () => {
    const accepted: SegmentedOption = {
      key: PeriodKey.SEASON_TO_DATE,
      labelKey: PERIOD_LABEL_KEY[PeriodKey.SEASON_TO_DATE],
    };
    const rejected: SegmentedOption = {
      // @ts-expect-error — an arbitrary string is not a PeriodKey. This line
      // fails `pnpm typecheck` the moment the option key loosens to `string`.
      key: "LAST_FORTNIGHT",
      labelKey: PERIOD_LABEL_KEY[PeriodKey.LAST_MONTH],
    };

    expect(accepted.key).toBe(PeriodKey.SEASON_TO_DATE);
    expect(t(rejected.labelKey)).toBe("Last month");
  });

  it("takes a repository period array as it stands, with no remapping", () => {
    // `BaselinePeriod` already starts with `{ key, label }` — the hero band
    // hands its periods straight over.
    const periods: readonly Pick<BaselinePeriod, "key" | "labelKey">[] =
      BAND_PERIODS;

    render(
      <Segmented
        options={periods}
        value={PeriodKey.THIS_MONTH}
        onChange={vi.fn()}
      />,
    );

    expect(optionButtons()).toHaveLength(BAND_PERIODS.length);
  });
});

/* ------------------------------------------------------------- TOKENS --- */

describe("Segmented — token discipline", () => {
  it("contains no hex colour anywhere in its code", () => {
    expect(SEGMENTED_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("contains no arbitrary Tailwind value — every step is a token", () => {
    expect(SEGMENTED_CODE).not.toMatch(/(?:text|bg|rounded|shadow|p|px|py)-\[/);
  });

  it("adds no colour to the stylesheet either", () => {
    expect(CHIP_RULES).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
