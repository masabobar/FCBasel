/**
 * The in-product persona — a ROLE, never a person.
 *
 * WHY THIS IS A CONSTANT AND NOT A NAME
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
 * persona reads these constants; a test asserts the shell renders no text
 * beyond them, so a name cannot be reintroduced by accident.
 */

/** The workspace the persona works in. A role label, not a person. */
export const WORKSPACE_LABEL = "Sales & Marketing";

/** Generic avatar monogram — the workspace's initials, not anyone's. */
export const AVATAR_INITIALS = "SM";

/** Accessible name of the avatar, derived so the two can never drift. */
export const AVATAR_LABEL = `${WORKSPACE_LABEL} workspace`;

/* ------------------------------------------------------------ GREETING -- */

/**
 * How the hero band opens the screen, by time of day.
 *
 * The greeting addresses the PERSONA, so it lives here beside the workspace
 * label it is composed with rather than in `./calendar.ts` (which derives chart
 * labels): "Good morning, Sales & Marketing" has to name the role, and this is
 * the one module allowed to.
 */
export const GREETING = {
  MORNING: "Good morning",
  AFTERNOON: "Good afternoon",
  EVENING: "Good evening",
} as const;

/** First hour of the afternoon, on a 24-hour clock. */
export const AFTERNOON_FROM_HOUR = 12;

/** First hour of the evening. */
export const EVENING_FROM_HOUR = 18;

/**
 * `Good morning, Sales & Marketing` — the band's greeting for a given moment.
 *
 * IT TAKES THE DATE, IT DOES NOT READ THE CLOCK. The greeting is resolved ONCE,
 * in the route's loader, and travels to the band as data. Reading the hour
 * inside a component would put a value on screen that the server and the
 * browser can legitimately disagree about — a demo begun at 11:59 would hydrate
 * into a mismatch — and would make the band untestable without faking a global.
 */
export function personaGreeting(now: Date): string {
  const hour = now.getHours();
  const greeting =
    hour < AFTERNOON_FROM_HOUR
      ? GREETING.MORNING
      : hour < EVENING_FROM_HOUR
        ? GREETING.AFTERNOON
        : GREETING.EVENING;

  return `${greeting}, ${WORKSPACE_LABEL}`;
}
