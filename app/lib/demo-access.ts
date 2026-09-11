/**
 * The demo sign-in gate — STAGECRAFT, NOT AUTHENTICATION.
 *
 * WHY THIS FILE IS NOT CALLED `auth.ts`, AND MUST NOT BE.
 * `constraints.md` §2 is unambiguous: "No real permissions or authentication.
 * A single persona. A cosmetic login screen is optional and, if present,
 * **decorative only**." `technologies.md` lists `bcryptjs` and
 * `createCookieSessionStorage` as expansion-path defaults explicitly "Not used
 * by the prototype", and `technical-spec.md` §7 records authentication as Not
 * applicable — no accounts, no sessions, no access model. This module is the
 * cosmetic screen that clause permits and nothing more.
 *
 * WHAT THAT MEANS CONCRETELY, so nobody mistakes this for a security control:
 *
 *   - The credential below is a PUBLIC STRING. It is committed, it is printed
 *     on the screen it guards, and it is in the client bundle. It is not a
 *     secret and must never be treated as one.
 *   - There is no server involved. No loader, no action, no endpoint, no
 *     status code, no cookie, no token, no hash. `screen-map.md`'s API table
 *     stays empty and the prototype still makes zero network calls after load
 *     (US-041).
 *   - The gate is CLIENT STATE IN MEMORY. Anyone with dev tools is past it in
 *     seconds. That is acceptable precisely because there is nothing behind it
 *     to protect: the dashboard is seeded fixtures (`app/lib/mock/`), and
 *     `constraints.md` forbids salary and named-individual data anywhere in
 *     them.
 *
 * DO NOT "HARDEN" THIS. Adding bcrypt, a session cookie or a server action
 * would not make the prototype more secure — it would build the access model
 * the specification says is out of scope, and put a real credential surface
 * into a demo that has no user accounts. The permission-aware model is
 * Discovery scope (`future.md` FUT-004).
 */

/**
 * The credential the login screen displays and accepts.
 *
 * NO INDIVIDUAL NAME, by the same rule that governs the persona
 * (`app/lib/persona.ts`): US-012 requires "no real or realistic individual
 * name anywhere", and a demo shown to the club's own staff must not put an
 * invented employee on the opening screen. `demo` is a role-free handle, and
 * the password is self-evidently a placeholder.
 *
 * Exported as ONE object so the screen that prints the hint and the check that
 * accepts the input read the same two strings. A test asserts the rendered
 * hint matches these values, so the printed credential cannot drift from the
 * accepted one and leave a presenter locked out of their own demo.
 */
export const DEMO_CREDENTIALS = {
  username: "demo",
  password: "fcb2026",
} as const;

/**
 * Does this input open the demo?
 *
 * Trimmed on both fields because a presenter typing into a projected screen
 * (or pasting from the hint above the form) picks up stray whitespace, and
 * being turned away by an invisible space is the worst possible moment for
 * this screen to be pedantic. The username is matched case-insensitively for
 * the same reason; the password is not, because a password that ignores case
 * reads as broken even when it is theatre.
 *
 * Plain `===` on a public string is correct here: there is no secret to leak
 * by timing, and a constant-time compare would imply a threat model this
 * screen does not have.
 */
export function opensDemo(username: string, password: string): boolean {
  return (
    username.trim().toLowerCase() === DEMO_CREDENTIALS.username &&
    password.trim() === DEMO_CREDENTIALS.password
  );
}

/** What the screen says when {@link opensDemo} returns false. */
export const SIGN_IN_ERROR = "That is not the demo credential shown above.";
