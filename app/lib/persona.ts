/**
 * The in-product persona — a ROLE, never a person.
 *
 * WHY THIS IS A KEY AND NOT A NAME
 * The prototype ships with one persona and no authentication (`scope.md` §3).
 * That persona is deliberately identified by its **workspace label** and a
 * generic monogram, never by a real or realistic individual name:
 *
 *   1. `constraints.md` §2 forbids salary or named-individual performance data
 *      anywhere in the product. A named avatar sitting above tiles that show
 *      departmental performance edges straight into that guardrail.
 *   2. A realistic invented name risks colliding with an actual FC Basel
 *      employee, in a demo shown to the club's own people.
 *
 * So there is no name, and no photo. Anything that wants to address the
 * persona resolves these keys through `t()`; a test asserts the shell renders
 * no text beyond them, so a name cannot be reintroduced by accident.
 *
 * THE WORKSPACE IS TRANSLATED, THE MONOGRAM WITH IT (US-049). "Sales &
 * Marketing" becomes "Vertrieb & Marketing", so the initials become VM — which
 * is why the monogram is a dictionary entry beside the label rather than being
 * sliced off it at render time.
 */

import { type TranslationKey, type Translator } from "./i18n";

/** The workspace the persona works in. A role label, not a person. */
export const WORKSPACE_LABEL_KEY: TranslationKey = "persona.workspace";

/** Generic avatar monogram — the workspace's initials, not anyone's. */
export const AVATAR_INITIALS_KEY: TranslationKey = "persona.avatarInitials";

/** Accessible name of the avatar, composed from the workspace label. */
export function avatarLabel(t: Translator): string {
  return t("persona.avatarLabel", { workspace: t(WORKSPACE_LABEL_KEY) });
}

/* ------------------------------------------------------------ GREETING -- */

/**
 * How the hero band opens the screen, by time of day.
 *
 * The greeting addresses the PERSONA, so it lives here beside the workspace
 * label it is composed with rather than in `./calendar.ts` (which derives chart
 * axes): "Good morning, Sales & Marketing" has to name the role, and this is
 * the one module allowed to.
 */
export const GREETING_KEY = {
  MORNING: "persona.greeting.MORNING",
  AFTERNOON: "persona.greeting.AFTERNOON",
  EVENING: "persona.greeting.EVENING",
} as const satisfies Record<string, TranslationKey>;

export type GreetingKey = (typeof GREETING_KEY)[keyof typeof GREETING_KEY];

/** First hour of the afternoon, on a 24-hour clock. */
export const AFTERNOON_FROM_HOUR = 12;

/** First hour of the evening. */
export const EVENING_FROM_HOUR = 18;

/**
 * WHICH greeting a moment calls for — the time-of-day decision, alone.
 *
 * IT TAKES THE DATE, IT DOES NOT READ THE CLOCK. The greeting is resolved ONCE,
 * in the route's loader, and travels to the band as data. Reading the hour
 * inside a component would put a value on screen that the server and the
 * browser can legitimately disagree about — a demo begun at 11:59 would hydrate
 * into a mismatch — and would make the band untestable without faking a global.
 *
 * IT RETURNS A KEY, NOT A SENTENCE (US-049). The hour is a server fact; the
 * language is client state. Resolving the words here would have baked English
 * into the loader's payload, so the loader carries the key and the band says
 * it in whichever language is showing.
 */
export function greetingKeyFor(now: Date): GreetingKey {
  const hour = now.getHours();

  if (hour < AFTERNOON_FROM_HOUR) return GREETING_KEY.MORNING;
  if (hour < EVENING_FROM_HOUR) return GREETING_KEY.AFTERNOON;
  return GREETING_KEY.EVENING;
}

/** `Good morning, Sales & Marketing` — the band's greeting, in one language. */
export function personaGreeting(t: Translator, greeting: GreetingKey): string {
  return t("persona.greetingLine", {
    greeting: t(greeting),
    workspace: t(WORKSPACE_LABEL_KEY),
  });
}
