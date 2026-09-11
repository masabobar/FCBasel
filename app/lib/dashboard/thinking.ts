import { type TranslationKey, type TranslationListKey } from "../i18n";
import { HeroId } from "../repositories/enums";
import { ChipKind } from "./chips";

/**
 * The thinking beat — the short staged pause between a question and its answer,
 * as static config.
 *
 * IT IS STAGECRAFT, NOT A QUERY (US-031 criterion 4, `constraints.md` §2).
 * Nothing here asks anything of anything: the "delay" is a number of
 * milliseconds and the "sources" are six hand-authored lists of words. There is
 * no `fetch`, no client, no repository call, no promise and no dependency in
 * this file, and a source scan in `tests/unit/thinking-beat.test.tsx` keeps it
 * that way. The Reference Guide is explicit — *"the thinking delay is fake
 * latency, not a query. Keep it — it is what makes the result feel earned."*
 *
 * WHY THE COPY SAYS "QUERYING". The messages are the reference build's,
 * verbatim in English and translated for German (US-049 — the words live in
 * `app/lib/i18n/locales/*.json` and this file holds the keys), and they are
 * deliberate stagecraft copy rather than a claim about what the prototype does: the presenter is showing what the finished platform
 * WOULD do, and every word here was approved as part of that script. They are
 * rendered exactly as written — never re-cased, never truncated, never
 * assembled from fragments (which is also why they are whole sentences in the
 * config instead of a verb plus a source list).
 *
 * WHAT LIVES HERE AND WHAT DOES NOT
 * This module is data and arithmetic only — the per-flow copy, the two delays
 * and the chip stagger. The state machine that runs the beat is
 * `./use-thinking.ts` (which schedules it through `useDashboard`'s ONE pending
 * timer), and the panel it puts on screen is
 * `app/components/heroes/thinking-panel.tsx`. Kept apart for the same reason
 * `./chips.ts` and `./intents.ts` are: the config is a pure value a test can
 * read end to end, and the hook has no copy in it.
 *
 * KEYED BY KIND THEN HERO, exactly the pair {@link IntentMatch} carries and the
 * pair a {@link SuggestionChip} carries, so BOTH question paths — a typed
 * question scored by `./intents.ts` and a tapped chip resolved by `./chips.ts`
 * — look their beat up the same way and neither can reach a beat that does not
 * exist. `Record` over closed unions, so a fourth hero cannot be added without
 * its two beats being written too.
 */

/* --------------------------------------------------------------- TIMINGS -- */

/**
 * The beat, in milliseconds: the reference build's ~1150ms, inside the
 * criterion's 600-1200ms band.
 *
 * IT IS TUNED, NOT ARBITRARY. Too short and the answer looks pre-baked, which
 * is the one thing the beat exists to prevent; too long and the demo feels
 * slow, and the client's framing asks for "instant and flawless". The
 * reference's value is the one that was reviewed on the real screen, so it is
 * the one kept.
 *
 * NOT a motion token: `app/lib/tokens.ts` times ANIMATIONS, and this is not an
 * animation — it is how long the panel is on screen, which is a product
 * decision about pacing rather than a value the stylesheet needs. The
 * animations inside the panel (the sweep, the chips) are tokens, and they are
 * US-006's.
 */
export const THINKING_DELAY_MS = 1150;

/**
 * The beat under reduced motion — ~260ms, the reference's value.
 *
 * SHORTENED, NEVER REMOVED. A visitor who has asked for less motion still gets
 * the beat, because it is not motion: it is the pause that makes the answer
 * feel earned, and dropping it to zero would make the dashboard snap in a way
 * nobody asked for. What reduced motion changes is that the animations INSIDE
 * the panel render at their final state (`app/app.css`), so there is nothing
 * left to wait for and holding the panel for a full second would be dead time.
 */
export const REDUCED_THINKING_DELAY_MS = 260;

/** How long the panel stays on screen, given the visitor's motion preference. */
export function thinkingDelayMs(reducedMotion: boolean): number {
  return reducedMotion ? REDUCED_THINKING_DELAY_MS : THINKING_DELAY_MS;
}

/* ------------------------------------------------------- SOURCE STAGGER -- */

/**
 * Before the FIRST source chip appears — the reference's `0.15s`.
 *
 * The panel's own entrance is running at that moment, so the lead is what stops
 * the chips racing the box they sit in.
 */
export const SOURCE_CHIP_LEAD_MS = 150;

/**
 * Between one source chip and the next — the reference's `0.22s`.
 *
 * This is criterion 2's "lighting up one by one": the chips are staggered, not
 * simultaneous, so the panel reads as work being done rather than as a static
 * label. Two chips therefore finish arriving at 150 + 220 = 370ms and three at
 * 590ms, comfortably inside {@link THINKING_DELAY_MS} — no flow's last chip is
 * still animating when the answer lands.
 */
export const SOURCE_CHIP_STAGGER_MS = 220;

/**
 * The entrance delay for the source chip at `index`, in milliseconds.
 *
 * The same shape as `tileDelayMs` in `app/components/heroes/hero-section.tsx`:
 * the caller hands the result to an `animation-delay` and US-006's `fcb-src`
 * keyframe does the rest. Under reduced motion `app/app.css` zeroes every
 * `animation-delay` and states `.fcb-src`'s final state outright, so the chips
 * are all VISIBLE at once rather than stranded at `opacity: 0` — which is why
 * this function needs no reduced-motion branch of its own.
 */
export function sourceChipDelayMs(index: number): number {
  return SOURCE_CHIP_LEAD_MS + index * SOURCE_CHIP_STAGGER_MS;
}

/* ---------------------------------------------------------------- CONFIG -- */

/** What the panel says while one flow is "running". */
export interface ThinkingBeat {
  /** The per-flow message, resolved through `t()` and rendered verbatim. */
  readonly messageKey: TranslationKey;
  /** The data sources that light up one by one, in order. */
  readonly sourcesKey: TranslationListKey;
}

/**
 * THE SIX BEATS — verbatim from the approved reference build's
 * `HEROES[*].thinking` / `.sources` and `FOLLOWUPS[*].thinking` / `.sources`.
 *
 * One per (kind, hero) pair, which is every question this prototype can
 * answer. A hero's beat names the SYSTEMS a real platform would have to reach
 * into; a follow-up's names the analysis, because by then the systems have
 * already been named on screen.
 */
export const THINKING_BEATS: Record<ChipKind, Record<HeroId, ThinkingBeat>> = {
  [ChipKind.HERO]: {
    [HeroId.HERO_1]: {
      messageKey: "thinking.hero.HERO_1.message",
      sourcesKey: "thinking.hero.HERO_1.sources",
    },
    [HeroId.HERO_2]: {
      messageKey: "thinking.hero.HERO_2.message",
      sourcesKey: "thinking.hero.HERO_2.sources",
    },
    [HeroId.HERO_3]: {
      messageKey: "thinking.hero.HERO_3.message",
      sourcesKey: "thinking.hero.HERO_3.sources",
    },
  },
  [ChipKind.FOLLOW_UP]: {
    [HeroId.HERO_1]: {
      messageKey: "thinking.followUp.HERO_1.message",
      sourcesKey: "thinking.followUp.HERO_1.sources",
    },
    [HeroId.HERO_2]: {
      messageKey: "thinking.followUp.HERO_2.message",
      sourcesKey: "thinking.followUp.HERO_2.sources",
    },
    [HeroId.HERO_3]: {
      messageKey: "thinking.followUp.HERO_3.message",
      sourcesKey: "thinking.followUp.HERO_3.sources",
    },
  },
};

/**
 * The beat for one question. A total function over the two closed unions, so
 * every question that can be asked has a beat and none has to be invented.
 */
export function thinkingBeatFor(heroId: HeroId, kind: ChipKind): ThinkingBeat {
  return THINKING_BEATS[kind][heroId];
}
