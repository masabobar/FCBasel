/**
 * US-029 — the suggestion-chip row, and the lifecycle on the real screen.
 *
 * The derivation itself is proved in `dashboard-chips.test.ts` — this suite is
 * about the row a presenter actually sees and touches:
 *
 *   ① EXACTLY THREE CHIPS ON LOAD, labels rendered verbatim: no truncation, no
 *     case transformation, no ellipsis (criterion 1).
 *   ② A TAP RESOLVES DIRECTLY. The component hands the CHIP back — never its
 *     text — and the wired app inserts the hero's section (criterion 2).
 *   ③ THE LIFECYCLE END TO END on `App` itself: tap Hero 1, its follow-up chip
 *     appears beside the three hero chips (4 in total); take the follow-up, and
 *     that chip is gone while the three remain (criteria 3 and 4).
 *   ④ RESET RESTORES EXACTLY THE THREE HERO CHIPS — **US-015 criterion ②**,
 *     which was recorded as a seam pending this story. It holds because the row
 *     is derived, so the test also proves the mechanism, not just the outcome:
 *     `root.tsx` derives its chips and keeps no chip state to clear.
 *   ⑤ 11px, gold-tinted follow-ups, keyboard-reachable, no hex (criterion 5).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PROMPT_INPUT_LABEL } from "../../app/components/chrome/prompt-bar";
import {
  CHIP_KIND_CLASS,
  CHIP_ROW_LABEL,
  FOLLOW_UP_CHIP_HINT,
  SuggestionChips,
} from "../../app/components/chrome/suggestion-chips";
import { CHIP_SURFACE_CLASS } from "../../app/components/controls/segmented";
import {
  ChipKind,
  FOLLOW_UP_CHIP_LABEL,
  HERO_CHIP_LABEL,
  HERO_CHIPS,
  suggestionChips,
  type SuggestionChip,
} from "../../app/lib/dashboard/chips";
import {
  InsightPhase,
  NO_SECTIONS,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import { HERO_IDS, HeroId } from "../../app/lib/repositories/enums";
import { radius } from "../../app/lib/tokens";
import App from "../../app/root";
import { HEROES } from "./support/hero-data";
import { restoreMotionStubs, stubMatchMedia } from "./support/motion-harness";
import { settleThinkingBeat } from "./support/thinking-harness";
import { signIn } from "./support/sign-in";

/**
 * The component's source with comments stripped. Several checks below are about
 * what the code may NOT contain, and the doc comment legitimately names
 * `rounded-full`, `rounded-pill` and `whitespace-nowrap` while explaining why
 * none of them is used here.
 */
const CHIPS_COMPONENT_CODE = readFileSync(
  resolve(process.cwd(), "app/components/chrome/suggestion-chips.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

const ROOT_SOURCE = readFileSync(
  resolve(process.cwd(), "app/root.tsx"),
  "utf8",
);

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/** The `.fcb-chip` rules only — the radius and the lift are asserted on these. */
const CHIP_RULES = (() => {
  const matched = APP_CSS.match(/\.fcb-chip[^{]*\{[^}]*\}/g);
  if (!matched) throw new Error("app/app.css must declare a .fcb-chip rule");
  return matched.join("\n");
})();

function chipButtons(): HTMLButtonElement[] {
  return [
    ...document.querySelectorAll<HTMLButtonElement>(
      '[data-slot="suggestion-chip"]',
    ),
  ];
}

/** Every chip's visible text, exactly as the DOM holds it. */
function chipTexts(): string[] {
  return chipButtons().map((chip) => chip.textContent ?? "");
}

/** The chips of one kind, by their `data-kind` attribute. */
function chipsOfKind(kind: string): HTMLButtonElement[] {
  return chipButtons().filter((chip) => chip.dataset.kind === kind);
}

function heroLabels(): string[] {
  return HERO_IDS.map((heroId) => HERO_CHIP_LABEL[heroId]);
}

function renderRow(chips: readonly SuggestionChip[], onSelect = vi.fn()) {
  render(<SuggestionChips chips={chips} onSelect={onSelect} />);
  return onSelect;
}

/* --------------------------------------------------------- THE ROW ITSELF -- */

describe("SuggestionChips — the row", () => {
  it("renders exactly three chips for the load-state row", () => {
    renderRow(suggestionChips(NO_SECTIONS));

    expect(chipButtons()).toHaveLength(3);
    expect(chipTexts()).toEqual(heroLabels());
  });

  it("renders every label verbatim — no truncation, no re-casing", () => {
    renderRow(suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_3)));

    // The follow-up chip carries a visually hidden kind hint, so its own text
    // is checked as the tail of the button's content rather than the whole.
    expect(chipTexts().slice(0, 3)).toEqual(heroLabels());
    expect(chipTexts()[3]).toBe(
      `${FOLLOW_UP_CHIP_HINT}${FOLLOW_UP_CHIP_LABEL[HeroId.HERO_3]}`,
    );

    for (const chip of chipButtons()) {
      expect(chip.textContent).not.toMatch(/\.\.\.|…/);
      expect(chip.className).not.toMatch(/uppercase|lowercase|capitalize/);
      expect(chip.className).not.toMatch(/truncate|text-ellipsis|line-clamp/);
    }
  });

  it("names the row so the chips are reachable as a group", () => {
    renderRow(HERO_CHIPS);

    expect(
      screen.getByRole("group", { name: CHIP_ROW_LABEL }),
    ).toBeInTheDocument();
  });

  it("wraps rather than overflowing, because a label is never clipped", () => {
    renderRow(suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_3)));

    const row = screen.getByRole("group", { name: CHIP_ROW_LABEL });
    expect(row).toHaveClass("flex-wrap");
    // A nowrap chip wider than a 390px viewport would push the row past the
    // shell, which clips sideways overflow — the label's end would be lost.
    expect(CHIPS_COMPONENT_CODE).not.toMatch(/whitespace-nowrap/);
  });

  it("renders nothing at all for an empty row", () => {
    renderRow([]);

    expect(chipButtons()).toHaveLength(0);
    expect(
      screen.queryByRole("group", { name: CHIP_ROW_LABEL }),
    ).not.toBeInTheDocument();
  });
});

/* ----------------------------------------------------------------- TAPS -- */

describe("SuggestionChips — a tap hands back the chip, not its text", () => {
  it("calls onSelect with the chip object a press belongs to", async () => {
    const user = userEvent.setup();
    const onSelect = renderRow(HERO_CHIPS);

    await user.click(screen.getByRole("button", { name: heroLabels()[1] }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({
      heroId: HeroId.HERO_2,
      kind: ChipKind.HERO,
      label: HERO_CHIP_LABEL[HeroId.HERO_2],
    });
  });

  it("passes the follow-up chip's own kind and hero", async () => {
    const user = userEvent.setup();
    const chips = suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_1));
    const onSelect = renderRow(chips);

    await user.click(chipsOfKind(ChipKind.FOLLOW_UP)[0]!);

    expect(onSelect).toHaveBeenCalledWith({
      heroId: HeroId.HERO_1,
      kind: ChipKind.FOLLOW_UP,
      label: FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1],
    });
  });

  it("never hands a plain string to its caller", async () => {
    // The seam that keeps the tap path away from US-030's matcher: there is no
    // question text in it to match.
    const user = userEvent.setup();
    const onSelect = renderRow(HERO_CHIPS);

    await user.click(chipButtons()[0]!);

    for (const [argument] of onSelect.mock.calls) {
      expect(typeof argument).not.toBe("string");
    }
  });
});

/* ------------------------------------------------------------ ACCESSIBILITY -- */

describe("SuggestionChips — accessibility", () => {
  it("renders real buttons with accessible names", () => {
    renderRow(suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_2)));

    for (const chip of chipButtons()) {
      expect(chip.tagName).toBe("BUTTON");
      // Never a submit: the row sits above US-028's form, and a chip must not
      // submit a half-typed question.
      expect(chip).toHaveAttribute("type", "button");
    }

    expect(
      screen.getAllByRole("button", { name: /./ }).length,
    ).toBeGreaterThanOrEqual(4);
  });

  it("says 'follow-up' in the accessible name, not in colour alone", () => {
    renderRow(suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_2)));

    const followUp = chipsOfKind(ChipKind.FOLLOW_UP)[0]!;

    expect(followUp.querySelector(".sr-only")?.textContent).toBe(
      FOLLOW_UP_CHIP_HINT,
    );
    // Plus the trend glyph the reference build gives it, decorative because
    // the hidden text already carries the meaning.
    expect(followUp.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      screen.getByRole("button", {
        name: `${FOLLOW_UP_CHIP_HINT} ${FOLLOW_UP_CHIP_LABEL[HeroId.HERO_2]}`,
      }),
    ).toBe(followUp);
  });

  it("gives a hero chip no hidden text — its label is its whole name", () => {
    renderRow(HERO_CHIPS);

    for (const chip of chipsOfKind(ChipKind.HERO)) {
      expect(chip.querySelector(".sr-only")).toBeNull();
    }
  });

  it("is navigable by keyboard and does not trap focus", async () => {
    const user = userEvent.setup();
    const chips = suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_1));
    renderRow(chips);
    render(<input aria-label="after the row" />);

    // One tab stop per chip, in DOM order — no roving tabindex, because
    // nothing here is "selected".
    for (const chip of chipButtons()) {
      await user.tab();
      expect(chip).toHaveFocus();
      expect(chip).not.toHaveAttribute("tabindex");
    }

    // Tab leaves the row: focus continues to what follows it.
    await user.tab();
    expect(screen.getByLabelText("after the row")).toHaveFocus();
  });

  it("activates on Enter and on Space, because it is a real button", async () => {
    const user = userEvent.setup();
    const onSelect = renderRow(HERO_CHIPS);

    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect.mock.calls.every(([chip]) => chip === HERO_CHIPS[0])).toBe(
      true,
    );
  });
});

/* ---------------------------------------------------------------- STYLE -- */

describe("SuggestionChips — the 11px chip surface, reused", () => {
  it("wears the shared chip class rather than restating the radius", () => {
    renderRow(suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_1)));

    for (const chip of chipButtons()) {
      expect(chip).toHaveClass(CHIP_SURFACE_CLASS);
    }
    expect(CHIP_RULES).toMatch(/border-radius:\s*var\(--radius-chip\)/);
    // The value lives in the token layer and in the stylesheet — never here.
    expect(CHIPS_COMPONENT_CODE).not.toMatch(/11px|radius-chip|rounded-chip/);
  });

  it("honours reduced motion through the shared blocks, not a rule of its own", () => {
    // The chip declares no motion at all: the lift and its transition are the
    // `.fcb-chip` rule, and the stylesheet's reduced-motion block collapses
    // that transition to ~1ms, so a hover lands on its target state with no
    // travel. The state is never lost, only the movement.
    expect(CHIPS_COMPONENT_CODE).not.toMatch(
      /transition|duration|animate|translate/,
    );
    expect(APP_CSS).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(APP_CSS).toMatch(/transition-duration:\s*1ms\s*!important/);
  });

  it("is NEVER a full pill — the reviewed decision, enforced again", () => {
    renderRow(HERO_CHIPS);

    const everyClass = chipButtons()
      .map((chip) => chip.className)
      .join(" ");

    expect(everyClass).not.toMatch(/\brounded-full\b/);
    expect(everyClass).not.toMatch(/\brounded-pill\b/);
    expect(CHIPS_COMPONENT_CODE).not.toMatch(
      /rounded-full|rounded-pill|radius-pill/,
    );
    expect(radius.chip).not.toBe(radius.pill);
  });

  it("lifts and tints on hover, from that same shared rule", () => {
    expect(CHIP_RULES).toMatch(
      /\.fcb-chip:hover[^{]*\{[^}]*translateY\(-1px\)/,
    );
    expect(CHIP_RULES).toMatch(/transition-duration:\s*var\(--duration-fast\)/);
    // The tint is the variant's half of the pair, and every kind has a hover.
    for (const tint of Object.values(CHIP_KIND_CLASS)) {
      expect(tint).toMatch(/hover:bg-/);
      expect(tint).toMatch(/hover:border-/);
    }
  });

  it("gives a follow-up chip the gold-tinted variant and a hero chip not", () => {
    renderRow(suggestionChips(withHeroShown(NO_SECTIONS, HeroId.HERO_1)));

    const followUp = chipsOfKind(ChipKind.FOLLOW_UP)[0]!;
    expect(followUp.className).toContain(CHIP_KIND_CLASS[ChipKind.FOLLOW_UP]);
    expect(followUp.className).toMatch(/accent-follow-up/);
    expect(followUp.className).toMatch(/bg-gold\//);

    for (const chip of chipsOfKind(ChipKind.HERO)) {
      expect(chip.className).toContain(CHIP_KIND_CLASS[ChipKind.HERO]);
      expect(chip.className).not.toMatch(/gold/);
    }
  });

  it("uses gold as an accent only — a tint and a border, never a fill", () => {
    // Colour discipline rule 4: gold is allowed here (it is one of its three
    // sanctioned uses), but it may not become a surface colour, and there is
    // still no gold ring anywhere.
    const gold = CHIP_KIND_CLASS[ChipKind.FOLLOW_UP];

    expect(gold).toMatch(/bg-gold\/(?:10|20)\b/);
    expect(gold).not.toMatch(/bg-gold(?![/-])/);
    expect(CHIPS_COMPONENT_CODE).not.toMatch(/ring-/);
  });

  it("contains no hex colour and no arbitrary Tailwind value", () => {
    expect(CHIPS_COMPONENT_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CHIPS_COMPONENT_CODE).not.toMatch(
      /(?:text|bg|rounded|shadow|border|p|px|py|gap)-\[/,
    );
  });
});

/* -------------------------------------------------- THE WIRED APPLICATION -- */

describe("the chip row on the real screen (US-029 × US-015)", () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    // Reduced motion: the reveal is US-014's and is covered there. This suite
    // is about which chips are offered, not how a section arrives.
    stubMatchMedia(true);
    Object.assign(window, { scrollTo: vi.fn() });
  });

  afterEach(() => {
    restoreMotionStubs();
    window.scrollTo = originalScrollTo;
    vi.restoreAllMocks();
  });

  function renderApp() {
    const mounted = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App loaderData={HEROES} />}>
            <Route index element={<p>child route</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    signIn();
    return mounted;
  }

  function sectionCount(): number {
    return document.querySelectorAll('[data-slot="insight-section"]').length;
  }

  /**
   * Tap a chip (or Reset) and let US-031's thinking beat land.
   *
   * A chip tap now goes through the beat, so the section it asks for arrives a
   * fixed delay later. This suite is about WHICH chips are offered for a given
   * canvas, not about the pause in front of it, so it waits for the answer and
   * asserts as before; the beat itself is `thinking-beat.test.tsx`'s subject.
   */
  async function tap(name: string) {
    await userEvent.setup().click(screen.getByRole("button", { name }));
    await settleThinkingBeat();
  }

  it("shows exactly the three hero chips on load, inside the prompt bar", () => {
    renderApp();

    expect(chipTexts()).toEqual(heroLabels());
    expect(document.querySelector('[data-slot="prompt-bar"]')).toContainElement(
      screen.getByRole("group", { name: CHIP_ROW_LABEL }),
    );
    // Above the field, which is the row US-028 left for them.
    const row = screen.getByRole("group", { name: CHIP_ROW_LABEL });
    const form = document.querySelector('[data-slot="prompt-form"]')!;
    expect(
      row.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders a hero's section from a chip tap, with no text in the path", async () => {
    renderApp();

    await tap(heroLabels()[0]!);

    expect(sectionCount()).toBe(1);
    // The typed field is untouched: a chip is not a submitted question.
    expect(
      screen.getByRole("textbox", { name: PROMPT_INPUT_LABEL }),
    ).toHaveValue("");
  });

  it("offers that hero's follow-up chip once its section has rendered", async () => {
    renderApp();

    await tap(heroLabels()[0]!);

    expect(chipButtons()).toHaveLength(4);
    expect(chipsOfKind(ChipKind.HERO)).toHaveLength(3);
    expect(chipTexts()[3]).toContain(FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]);
  });

  it("removes the follow-up chip once that follow-up has been shown", async () => {
    renderApp();

    await tap(heroLabels()[0]!);
    await tap(`${FOLLOW_UP_CHIP_HINT} ${FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]}`);

    expect(chipTexts()).toEqual(heroLabels());
    // The answer was sharpened in place, not appended: one section, phase
    // flipped, which is exactly the state that stops deriving the chip.
    expect(sectionCount()).toBe(1);
    expect(
      document.querySelector('[data-slot="insight-section"]'),
    ).toHaveAttribute("data-phase", InsightPhase.WITH_FOLLOW_UP);
  });

  it("keeps the three hero chips available throughout a whole run", async () => {
    renderApp();

    for (const heroId of HERO_IDS) {
      await tap(HERO_CHIP_LABEL[heroId]);
      expect(chipTexts().slice(0, 3)).toEqual(heroLabels());

      await tap(`${FOLLOW_UP_CHIP_HINT} ${FOLLOW_UP_CHIP_LABEL[heroId]}`);
      expect(chipTexts().slice(0, 3)).toEqual(heroLabels());
    }

    expect(sectionCount()).toBe(3);
    expect(chipTexts()).toEqual(heroLabels());
  });

  /**
   * US-015 CRITERION ② — "re-shows the three initial suggestion chips and
   * removes any follow-up chips". It was left as a seam pending this story,
   * and this is the case that closes it.
   */
  it("restores exactly the three hero chips on Reset, follow-ups removed", async () => {
    renderApp();

    await tap(heroLabels()[0]!);
    await tap(heroLabels()[1]!);
    expect(chipButtons()).toHaveLength(5);

    await tap("Reset");

    expect(chipTexts()).toEqual(heroLabels());
    expect(chipsOfKind(ChipKind.FOLLOW_UP)).toHaveLength(0);
    expect(sectionCount()).toBe(0);
  });

  it("restores them from a half-run too — one follow-up taken, one not", async () => {
    renderApp();

    await tap(heroLabels()[2]!);
    await tap(`${FOLLOW_UP_CHIP_HINT} ${FOLLOW_UP_CHIP_LABEL[HeroId.HERO_3]}`);
    await tap(heroLabels()[1]!);

    await tap("Reset");

    expect(chipTexts()).toEqual(heroLabels());
  });

  it("leaves the row usable immediately after Reset", async () => {
    renderApp();

    await tap(heroLabels()[0]!);
    await tap("Reset");
    await tap(heroLabels()[0]!);

    expect(sectionCount()).toBe(1);
    expect(chipButtons()).toHaveLength(4);
  });

  it("keeps NO chip state for Reset to clear — the row is derived", async () => {
    // The mechanism, not just the outcome: `root.tsx` derives the row from the
    // session on every render, so there is nowhere for a stale chip to hide
    // and nothing in the reset path mentions chips.
    expect(ROOT_SOURCE).toMatch(/chips=\{suggestionChips\(sections\)\}/);
    expect(ROOT_SOURCE).not.toMatch(/setChips/);

    // `useState` was banned outright while the root held none of it, which is
    // no longer true: the cosmetic sign-in gate holds exactly one. The guard
    // is therefore the COUNT and its identity rather than the bare literal --
    // chip state added here still fails, because it would be a second one.
    expect(ROOT_SOURCE.match(/useState\(/g)).toHaveLength(1);
    expect(ROOT_SOURCE).toMatch(
      /\[signedIn, setSignedIn\] = useState\(false\)/,
    );
    expect(ROOT_SOURCE).toMatch(/onSelect=\{\(chip\) => selectChip\(chip,/);
  });
});
