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
