/**
 * US-033 - **follow-up context gating**, and the last story of Phase 3a.
 *
 * A follow-up only makes sense after its parent hero. The behaviour that
 * matters is what happens when it is asked ANYWAY, cold, in front of the room:
 * the parent renders FIRST and the follow-up is then OFFERED as a chip. Never
 * an error, never nothing, never the fallback. So the criteria are asserted as
 * the full two-step rather than as a gate that merely refuses:
 *
 *   1. A TYPED follow-up resolves to the deep-dive only once its parent has
 *      been shown this session (criterion 1).
 *   2. THE TWO-STEP, for all three heroes (criterion 2, and the whole story):
 *      ask the follow-up cold -> the PARENT section appears -> the follow-up
 *      chip is now offered -> tapping it flips the phase.
 *   3. A follow-up FLIPS its parent section, never appends: one section, not
 *      two, whichever path and however often (criterion 3).
 *   4. ONE SOURCE OF TRUTH. The section list is what "has been shown" means,
 *      and both the gate and the chip row read it - proved as an invariant over
 *      every session shape AND by a source scan, because a parallel registry of
 *      shown heroes is the defect this story is most likely to grow
 *      (criterion 4).
 *   5. EACH HERO IS INDEPENDENT (criterion 5). Hero 2 runs start-to-follow-up
 *      with Heroes 1 and 3 never touched, and a hero's gate depends on its own
 *      parent alone. The presenter may show exactly one flow.
 *
 * THE CHIP PATH WAS ALREADY GATED BY CONSTRUCTION: US-029 derives a follow-up
 * chip only for a hero whose section is on screen at `primary`, so there is no
 * chip to tap for an unanswered hero (asserted below over all 27 session
 * shapes). The gap this story closes is the TYPED path, where the presenter can
 * name any question at any time.
 *
 * THE DOCUMENTED CHOICE: a gated cold follow-up shows the PARENT's thinking
 * message, not the follow-up's, because the panel must name the answer that is
 * actually about to appear. Asserted per hero, both ways round.
 *
 * `fireEvent` on a fake clock throughout the wired suites, for the reason
 * `thinking-beat.test.tsx` gives: `userEvent` schedules waits of its own, and
 * the beat's identity is asserted mid-flight.
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PROMPT_INPUT_LABEL } from "../../app/components/chrome/prompt-bar";
import {
  ChipKind,
  FOLLOW_UP_CHIP_LABEL,
  HERO_CHIP_LABEL,
  suggestionChips,
} from "../../app/lib/dashboard/chips";
import {
  isFollowUpGated,
  renderedKind,
} from "../../app/lib/dashboard/follow-up-gate";
import {
  INTENT_REQUIRES_PARENT,
  matchIntent,
} from "../../app/lib/dashboard/intents";
import {
  InsightPhase,
  type InsightSections,
  NO_SECTIONS,
  withFollowUpShown,
  withHeroShown,
} from "../../app/lib/dashboard/sections";
import {
  thinkingBeatFor,
  thinkingDelayMs,
} from "../../app/lib/dashboard/thinking";
import { HERO_IDS, HeroId } from "../../app/lib/repositories/enums";
import App from "../../app/root";
import { restoreMotionStubs, stubMatchMedia } from "./support/motion-harness";

/* ------------------------------------------------------------- SOURCES -- */

/** A module's source with comments stripped - the scans below are about code. */
function code(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8").replace(
    /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    "",
  );
}

const GATE_CODE = code("app/lib/dashboard/follow-up-gate.ts");
const SECTIONS_CODE = code("app/lib/dashboard/sections.ts");
const CHIPS_CODE = code("app/lib/dashboard/chips.ts");
const INTENTS_CODE = code("app/lib/dashboard/intents.ts");
const DASHBOARD_CODE = code("app/lib/dashboard/use-dashboard.ts");
const THINKING_CODE = code("app/lib/dashboard/use-thinking.ts");
const ROOT_CODE = code("app/root.tsx");

/** Every `.ts`/`.tsx` file under `app/`, as repo-relative paths. */
function appSources(directory = "app"): string[] {
  return readdirSync(resolve(process.cwd(), directory), {
    withFileTypes: true,
  }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return appSources(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/* -------------------------------------------------------- SESSION SHAPES -- */

/** How far one hero has been taken this session. */
const HeroStateKind = {
  ABSENT: "absent",
  PRIMARY: "primary",
  SHARPENED: "sharpened",
} as const;

type HeroStateKind = (typeof HeroStateKind)[keyof typeof HeroStateKind];

const HERO_STATES: readonly HeroStateKind[] = [
  HeroStateKind.ABSENT,
  HeroStateKind.PRIMARY,
  HeroStateKind.SHARPENED,
];

/** One hero's contribution to a session list, applied in `HERO_IDS` order. */
function withHeroState(
  sections: InsightSections,
  heroId: HeroId,
  state: HeroStateKind,
): InsightSections {
  if (state === HeroStateKind.ABSENT) return sections;

  const shown = withHeroShown(sections, heroId);
  return state === HeroStateKind.SHARPENED
    ? withFollowUpShown(shown, heroId)
    : shown;
}

/** The 27 sessions three heroes can be in: absent, primary or sharpened. */
const SESSION_SHAPES: readonly {
  readonly states: Record<HeroId, HeroStateKind>;
  readonly sections: InsightSections;
  readonly label: string;
}[] = HERO_STATES.flatMap((first) =>
  HERO_STATES.flatMap((second) =>
    HERO_STATES.map((third) => {
      const states = {
        [HeroId.HERO_1]: first,
        [HeroId.HERO_2]: second,
        [HeroId.HERO_3]: third,
      } as Record<HeroId, HeroStateKind>;

      return {
        states,
        sections: HERO_IDS.reduce(
          (sections, heroId) => withHeroState(sections, heroId, states[heroId]),
          NO_SECTIONS,
        ),
        label: HERO_IDS.map((heroId) => `${heroId}:${states[heroId]}`).join(
          " ",
        ),
      };
    }),
  ),
);

/* -------------------------------------------------------------- QUERIES -- */

function sections(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>('[data-slot="insight-section"]'),
  ];
}

/** The section for one hero, or `null` if that question is unanswered. */
function sectionFor(heroId: HeroId): HTMLElement | null {
  return (
    sections().find((section) => section.dataset.heroId === heroId) ?? null
  );
}

/** Which heroes are on the canvas, in the order they were asked. */
function heroOrder(): (string | undefined)[] {
  return sections().map((section) => section.dataset.heroId);
}

/** The chips in the prompt bar's own row - the row US-029 derives. */
function rowChips(): HTMLButtonElement[] {
  const row = document.querySelector('[data-slot="prompt-bar"]');
  return row === null
    ? []
    : [
        ...row.querySelectorAll<HTMLButtonElement>(
          '[data-slot="suggestion-chip"]',
        ),
      ];
}

/** The chip offering this hero's question of this kind, if it is offered. */
function chipFor(heroId: HeroId, kind: ChipKind): HTMLButtonElement | null {
  const label =
    kind === ChipKind.FOLLOW_UP
      ? FOLLOW_UP_CHIP_LABEL[heroId]
      : HERO_CHIP_LABEL[heroId];

  return (
    rowChips().find(
      (chip) =>
        chip.dataset.kind === kind && (chip.textContent ?? "").includes(label),
    ) ?? null
  );
}

function fallbackPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-slot="fallback-panel"]');
}

/** The thinking message on screen right now, or `null` if no beat is running. */
function message(): string | null {
  return (
    document.querySelector('[data-slot="thinking-message"]')?.textContent ??
    null
  );
}

function sourceChips(): (string | null)[] {
  return [...document.querySelectorAll('[data-slot="thinking-source"]')].map(
    (chip) => chip.textContent,
  );
}

function promptInput(): HTMLInputElement {
  return screen.getByRole("textbox", {
    name: PROMPT_INPUT_LABEL,
  }) as HTMLInputElement;
}

/* -------------------------------------------------------------- HARNESS -- */

/** `App` on a fake clock - see the file note for why `fireEvent`. */
function renderApp(): void {
  stubMatchMedia(false);
  Object.assign(window, { scrollTo: vi.fn() });
  vi.useFakeTimers();

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<p>child route</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

/** Land whatever beat is in flight. */
function landBeat(): void {
  act(() => {
    vi.advanceTimersByTime(thinkingDelayMs(false));
  });
}

/** Type a question and submit it - the TYPED path, which is what is gated. */
function ask(question: string): void {
  fireEvent.change(promptInput(), { target: { value: question } });
  fireEvent.submit(document.querySelector('[data-slot="prompt-form"]')!);
}

/** Tap a chip that is actually on screen - fails loudly if it is not offered. */
function tapChip(heroId: HeroId, kind: ChipKind): void {
  const chip = chipFor(heroId, kind);
  if (chip === null) {
    throw new Error(`no ${kind} chip is offered for ${heroId}`);
  }
  fireEvent.click(chip);
}

afterEach(() => {
  vi.useRealTimers();
  restoreMotionStubs();
});

/* ==================================== THE GATE, AS A PURE FUNCTION (①④⑤) == */

describe("the gate reads the parent-gating flag and the session (criterion 1)", () => {
  it("gates every follow-up in an empty session", () => {
    for (const heroId of HERO_IDS) {
      expect(isFollowUpGated(NO_SECTIONS, heroId)).toBe(true);
      expect(renderedKind(NO_SECTIONS, heroId, ChipKind.FOLLOW_UP)).toBe(
        ChipKind.HERO,
      );
    }
  });

  it("opens the gate once the parent has been shown", () => {
    for (const heroId of HERO_IDS) {
      const shown = withHeroShown(NO_SECTIONS, heroId);

      expect(isFollowUpGated(shown, heroId)).toBe(false);
      expect(renderedKind(shown, heroId, ChipKind.FOLLOW_UP)).toBe(
        ChipKind.FOLLOW_UP,
      );
    }
  });

  it("keeps the gate open after the follow-up has already been shown", () => {
    // A sharpened section is still "this hero has been shown", so re-asking the
    // follow-up is a follow-up and not a second parent render.
    for (const heroId of HERO_IDS) {
      const sharpened = withFollowUpShown(
        withHeroShown(NO_SECTIONS, heroId),
        heroId,
      );

      expect(isFollowUpGated(sharpened, heroId)).toBe(false);
    }
  });

  it("never gates a hero's own question, in any session", () => {
    // The flag says a hero stands alone, and the gate honours it: for
    // `ChipKind.HERO` the resolution is the identity.
    expect(INTENT_REQUIRES_PARENT[ChipKind.HERO]).toBe(false);

    for (const { sections, label } of SESSION_SHAPES) {
      for (const heroId of HERO_IDS) {
        expect(renderedKind(sections, heroId, ChipKind.HERO), label).toBe(
          ChipKind.HERO,
        );
      }
    }
  });

  it("gates a follow-up exactly when its parent is absent, over all 27 sessions", () => {
    expect(INTENT_REQUIRES_PARENT[ChipKind.FOLLOW_UP]).toBe(true);
    expect(SESSION_SHAPES).toHaveLength(27);

    for (const { states, sections, label } of SESSION_SHAPES) {
      for (const heroId of HERO_IDS) {
        expect(isFollowUpGated(sections, heroId), label).toBe(
          states[heroId] === HeroStateKind.ABSENT,
        );
      }
    }
  });
});

describe("a hero's gate depends on its own parent alone (criterion 5)", () => {
  it("is unchanged by every other hero's state", () => {
    // The independence proof, as a property: the gate computed against the
    // whole session equals the gate computed against this hero's entry alone.
    for (const { states, sections, label } of SESSION_SHAPES) {
      for (const heroId of HERO_IDS) {
        const alone = withHeroState(NO_SECTIONS, heroId, states[heroId]);

        expect(isFollowUpGated(sections, heroId), label).toBe(
          isFollowUpGated(alone, heroId),
        );
      }
    }
  });

  it("stays shut for a hero while another hero is on screen", () => {
    const hero3Only = withHeroShown(NO_SECTIONS, HeroId.HERO_3);

    expect(isFollowUpGated(hero3Only, HeroId.HERO_1)).toBe(true);
    expect(isFollowUpGated(hero3Only, HeroId.HERO_2)).toBe(true);
    expect(isFollowUpGated(hero3Only, HeroId.HERO_3)).toBe(false);
  });
});

/* ============================ ONE SOURCE OF TRUTH, READ TWICE (④) == */

describe("gating and chip visibility read the same session state (criterion 4)", () => {
  it("offers a follow-up chip only for a hero whose gate is open", () => {
    // The chip path is gated BY CONSTRUCTION: there is no chip to tap for a
    // hero that has not been shown, so the two can never disagree.
    for (const { sections, label } of SESSION_SHAPES) {
      const offered = new Set(
        suggestionChips(sections)
          .filter((chip) => chip.kind === ChipKind.FOLLOW_UP)
          .map((chip) => chip.heroId),
      );

      for (const heroId of HERO_IDS) {
        if (isFollowUpGated(sections, heroId)) {
          expect(offered.has(heroId), label).toBe(false);
        }
      }
    }
  });

  it("keeps `hasSection` the only reader of what has been shown", () => {
    // A parallel registry of shown heroes is the defect this story is most
    // likely to grow. The predicate is defined in `sections.ts` and read in
    // `follow-up-gate.ts`; nothing else in the app may ask the question.
    const readers = appSources().filter((path) =>
      /\bhasSection\b/.test(code(path)),
    );

    expect(readers.sort()).toEqual([
      "app/lib/dashboard/follow-up-gate.ts",
      "app/lib/dashboard/sections.ts",
    ]);
  });

  it("keeps the parent-gating flag read in exactly one place", () => {
    const readers = appSources().filter((path) =>
      /\bINTENT_REQUIRES_PARENT\b/.test(code(path)),
    );

    expect(readers.sort()).toEqual([
      "app/lib/dashboard/follow-up-gate.ts",
      "app/lib/dashboard/intents.ts",
    ]);
  });

  it("routes both the answer and the beat through that one gate", () => {
    expect(DASHBOARD_CODE).toMatch(
      /import \{ isFollowUpGated \} from "\.\/follow-up-gate"/,
    );
    expect(THINKING_CODE).toMatch(
      /import \{ renderedKind \} from "\.\/follow-up-gate"/,
    );
    expect(DASHBOARD_CODE).toMatch(/isFollowUpGated\(current, heroId\)/);
    expect(THINKING_CODE).toMatch(
      /renderedKind\(sections, heroId, ChipKind\.FOLLOW_UP\)/,
    );
  });

  it("holds no state of its own in the gate", () => {
    // A pure function of the list plus the flag: no hook, no store, no mutable
    // module scope, and nothing to clear on Reset.
    expect(GATE_CODE).not.toMatch(/useState|useRef|useMemo|useEffect/);
    expect(GATE_CODE).not.toMatch(/\blet\b|\bnew (Map|Set|WeakMap)\b/);
    expect(GATE_CODE).not.toMatch(/localStorage|sessionStorage/);
  });

  it("keeps the chip row derived rather than stored", () => {
    // US-029's guarantee, re-asserted here because criterion 4 depends on it.
    expect(CHIPS_CODE).not.toMatch(/useState|useRef|useEffect/);
    expect(ROOT_CODE).toMatch(/suggestionChips\(sections\)/);
  });

  it("keeps the matcher a pure function of the text", () => {
    // The gate is the seam between the text and the session, so the matcher
    // never sees a section list and `sections.ts` never decides a meaning.
    expect(INTENTS_CODE).not.toMatch(/InsightSections|hasSection|suggestion/);
    expect(SECTIONS_CODE).not.toMatch(/INTENT_REQUIRES_PARENT|matchIntent/);
  });
});

/* ======================= THE FLIP, NEVER AN APPEND (③) == */

describe("a follow-up flips its parent section (criterion 3)", () => {
  it.each(HERO_IDS)("leaves exactly one section for %s", (heroId) => {
    const shown = withHeroShown(NO_SECTIONS, heroId);
    const sharpened = withFollowUpShown(shown, heroId);

    expect(sharpened).toHaveLength(1);
    expect(sharpened[0]?.heroId).toBe(heroId);
    expect(sharpened[0]?.phase).toBe(InsightPhase.WITH_FOLLOW_UP);
  });

  it("is idempotent - a second follow-up appends nothing", () => {
    const once = withFollowUpShown(
      withHeroShown(NO_SECTIONS, HeroId.HERO_2),
      HeroId.HERO_2,
    );

    expect(withFollowUpShown(once, HeroId.HERO_2)).toHaveLength(1);
  });

  it("keeps the section in the position it was asked in", () => {
    let list = withHeroShown(NO_SECTIONS, HeroId.HERO_3);
    list = withHeroShown(list, HeroId.HERO_1);
    list = withFollowUpShown(list, HeroId.HERO_3);

    expect(list.map((section) => section.heroId)).toEqual([
      HeroId.HERO_3,
      HeroId.HERO_1,
    ]);
    expect(list[0]?.phase).toBe(InsightPhase.WITH_FOLLOW_UP);
  });
});

/* ================== THE TYPED TWO-STEP, ON THE REAL APP (②) == */

describe("the follow-up phrases resolve as typed follow-ups", () => {
  it.each(HERO_IDS)("matches %s's follow-up, not its hero", (heroId) => {
    // The two-step below is only a test of the GATE if the phrase really
    // resolves to a follow-up. It does, through US-030's scoring.
    expect(matchIntent(FOLLOW_UP_CHIP_LABEL[heroId])).toEqual({
      heroId,
      kind: ChipKind.FOLLOW_UP,
    });
  });
});

describe("a cold typed follow-up renders the parent, then offers the chip (criterion 2)", () => {
  it.each(HERO_IDS)(
    "runs the whole two-step for %s from an empty session",
    (heroId) => {
      renderApp();

      // Nothing is on screen, so no follow-up chip is on offer for anyone.
      expect(sections()).toHaveLength(0);
      expect(chipFor(heroId, ChipKind.FOLLOW_UP)).toBeNull();

      /* STEP 1 - the follow-up is typed cold, and the PARENT renders. */
      ask(FOLLOW_UP_CHIP_LABEL[heroId]);

      expect(message()).toBe(thinkingBeatFor(heroId, ChipKind.HERO).message);
      landBeat();

      expect(sections()).toHaveLength(1);
      expect(sectionFor(heroId)).not.toBeNull();
      expect(sectionFor(heroId)).toHaveAttribute(
        "data-phase",
        InsightPhase.PRIMARY,
      );

      // Never an error, never nothing, never the fallback.
      expect(fallbackPanel()).toBeNull();

      /* STEP 2 - the follow-up is now OFFERED, for the user to tap. */
      expect(chipFor(heroId, ChipKind.FOLLOW_UP)).not.toBeNull();

      /* STEP 3 - tapping it FLIPS the phase of the section already there. */
      tapChip(heroId, ChipKind.FOLLOW_UP);

      expect(message()).toBe(
        thinkingBeatFor(heroId, ChipKind.FOLLOW_UP).message,
      );
      landBeat();

      expect(sections()).toHaveLength(1);
      expect(sectionFor(heroId)).toHaveAttribute(
        "data-phase",
        InsightPhase.WITH_FOLLOW_UP,
      );

      // And the offer is withdrawn, because it is derived and not stored.
      expect(chipFor(heroId, ChipKind.FOLLOW_UP)).toBeNull();
      expect(chipFor(heroId, ChipKind.HERO)).not.toBeNull();
    },
  );

  it("re-typing the same follow-up sharpens rather than repeating the parent", () => {
    renderApp();

    ask(FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]);
    landBeat();
    ask(FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]);
    landBeat();

    expect(sections()).toHaveLength(1);
    expect(sectionFor(HeroId.HERO_1)).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
  });
});

describe("a typed follow-up after its parent resolves straight through (criterion 1)", () => {
  it.each(HERO_IDS)(
    "sharpens %s's section without a second render",
    (heroId) => {
      renderApp();

      ask(HERO_CHIP_LABEL[heroId]);
      landBeat();

      expect(sections()).toHaveLength(1);
      expect(sectionFor(heroId)).toHaveAttribute(
        "data-phase",
        InsightPhase.PRIMARY,
      );

      ask(FOLLOW_UP_CHIP_LABEL[heroId]);

      // Its OWN beat this time, because its own answer is what is arriving.
      expect(message()).toBe(
        thinkingBeatFor(heroId, ChipKind.FOLLOW_UP).message,
      );
      landBeat();

      expect(sections()).toHaveLength(1);
      expect(sectionFor(heroId)).toHaveAttribute(
        "data-phase",
        InsightPhase.WITH_FOLLOW_UP,
      );
    },
  );
});

/* ================================= EACH HERO ALONE (⑤) == */

describe("any single hero can run start-to-follow-up on its own (criterion 5)", () => {
  it.each(HERO_IDS)("runs %s with the other two never touched", (heroId) => {
    renderApp();

    ask(HERO_CHIP_LABEL[heroId]);
    landBeat();
    tapChip(heroId, ChipKind.FOLLOW_UP);
    landBeat();

    expect(heroOrder()).toEqual([heroId]);
    expect(sectionFor(heroId)).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );

    // The other two flows are exactly as they were on load: no section, and no
    // follow-up on offer.
    for (const other of HERO_IDS.filter((candidate) => candidate !== heroId)) {
      expect(sectionFor(other)).toBeNull();
      expect(chipFor(other, ChipKind.FOLLOW_UP)).toBeNull();
      expect(chipFor(other, ChipKind.HERO)).not.toBeNull();
    }
  });

  it("gates Hero 1's follow-up while Hero 3 is on screen", () => {
    renderApp();

    ask(HERO_CHIP_LABEL[HeroId.HERO_3]);
    landBeat();

    // Another hero's answer is on the canvas, and it changes nothing here.
    ask(FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]);

    expect(message()).toBe(
      thinkingBeatFor(HeroId.HERO_1, ChipKind.HERO).message,
    );
    landBeat();

    expect(heroOrder()).toEqual([HeroId.HERO_3, HeroId.HERO_1]);
    expect(sectionFor(HeroId.HERO_1)).toHaveAttribute(
      "data-phase",
      InsightPhase.PRIMARY,
    );
    expect(sectionFor(HeroId.HERO_3)).toHaveAttribute(
      "data-phase",
      InsightPhase.PRIMARY,
    );

    // And the offer is now there for Hero 1 as well.
    expect(chipFor(HeroId.HERO_1, ChipKind.FOLLOW_UP)).not.toBeNull();
  });

  it("sharpens one hero without disturbing another's phase", () => {
    renderApp();

    ask(HERO_CHIP_LABEL[HeroId.HERO_2]);
    landBeat();
    ask(HERO_CHIP_LABEL[HeroId.HERO_3]);
    landBeat();
    tapChip(HeroId.HERO_2, ChipKind.FOLLOW_UP);
    landBeat();

    expect(sections()).toHaveLength(2);
    expect(sectionFor(HeroId.HERO_2)).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
    expect(sectionFor(HeroId.HERO_3)).toHaveAttribute(
      "data-phase",
      InsightPhase.PRIMARY,
    );
    expect(chipFor(HeroId.HERO_3, ChipKind.FOLLOW_UP)).not.toBeNull();
    expect(chipFor(HeroId.HERO_2, ChipKind.FOLLOW_UP)).toBeNull();
  });
});

/* ======================================== RESET RE-GATES (②④) == */

describe("Reset gates every follow-up again", () => {
  it("withdraws the offer and renders the parent again after a Reset", () => {
    renderApp();

    ask(HERO_CHIP_LABEL[HeroId.HERO_1]);
    landBeat();
    expect(chipFor(HeroId.HERO_1, ChipKind.FOLLOW_UP)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    // The session list is the baseline again, so both readings change together:
    // no chip on offer, and the gate is shut.
    expect(sections()).toHaveLength(0);
    for (const heroId of HERO_IDS) {
      expect(chipFor(heroId, ChipKind.FOLLOW_UP)).toBeNull();
    }

    ask(FOLLOW_UP_CHIP_LABEL[HeroId.HERO_1]);

    expect(message()).toBe(
      thinkingBeatFor(HeroId.HERO_1, ChipKind.HERO).message,
    );
    landBeat();

    expect(sections()).toHaveLength(1);
    expect(sectionFor(HeroId.HERO_1)).toHaveAttribute(
      "data-phase",
      InsightPhase.PRIMARY,
    );
  });
});

/* ============================ NEVER AN ERROR, NEVER THE FALLBACK (②) == */

describe("a cold follow-up is neither an error nor the fallback (criterion 2)", () => {
  it.each(HERO_IDS)("answers %s's cold follow-up with an answer", (heroId) => {
    renderApp();

    ask(FOLLOW_UP_CHIP_LABEL[heroId]);
    landBeat();

    // Never nothing: a section is on screen.
    expect(sections()).toHaveLength(1);

    // Never the fallback, and never the empty state: the question matched.
    expect(fallbackPanel()).toBeNull();
    expect(
      document.querySelector('[data-slot="empty-state-panel"]'),
    ).toBeNull();

    // Never an error, in any of the ways one could be announced.
    expect(document.querySelector('[role="alert"]')).toBeNull();
    expect(document.querySelector('[aria-live="assertive"]')).toBeNull();
    expect(document.querySelector("[aria-invalid]")).toBeNull();
  });

  it("carries no blame vocabulary anywhere in the gate", () => {
    for (const word of [
      "sorry",
      "error",
      "invalid",
      "unable",
      "failed",
      "unsupported",
      "reject",
    ]) {
      expect(GATE_CODE.toLowerCase()).not.toContain(word);
    }

    // And it neither throws nor logs: a gated question is a normal question.
    expect(GATE_CODE).not.toMatch(/throw|console\./);
  });
});

/* ================== WHICH BEAT A GATED FOLLOW-UP SHOWS == */

describe("a gated cold follow-up shows the PARENT's thinking message", () => {
  it.each(HERO_IDS)(
    "names what is about to appear for %s, sources included",
    (heroId) => {
      // THE DOCUMENTED CHOICE (US-031 made it, US-033 pins it): the panel
      // describes the answer that is arriving. A gated follow-up is rendering
      // the parent, so it says the parent's line and lights the parent's
      // sources - it can never promise the deep-dive and then produce the
      // headline figures.
      renderApp();

      ask(FOLLOW_UP_CHIP_LABEL[heroId]);

      const parent = thinkingBeatFor(heroId, ChipKind.HERO);
      const followUp = thinkingBeatFor(heroId, ChipKind.FOLLOW_UP);

      expect(message()).toBe(parent.message);
      expect(message()).not.toBe(followUp.message);
      expect(sourceChips()).toEqual([...parent.sources]);
    },
  );

  it.each(HERO_IDS)(
    "switches to %s's own message once the parent is on screen",
    (heroId) => {
      renderApp();

      ask(HERO_CHIP_LABEL[heroId]);
      landBeat();
      ask(FOLLOW_UP_CHIP_LABEL[heroId]);

      const followUp = thinkingBeatFor(heroId, ChipKind.FOLLOW_UP);

      expect(message()).toBe(followUp.message);
      expect(sourceChips()).toEqual([...followUp.sources]);
    },
  );

  it("keeps the two messages distinct for every hero", () => {
    // Otherwise the assertions above would pass on a coincidence.
    for (const heroId of HERO_IDS) {
      expect(thinkingBeatFor(heroId, ChipKind.HERO).message).not.toBe(
        thinkingBeatFor(heroId, ChipKind.FOLLOW_UP).message,
      );
    }
  });
});
