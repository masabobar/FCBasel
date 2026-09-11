import { fireEvent, screen } from "@testing-library/react";

import { DEMO_CREDENTIALS } from "../../../app/lib/demo-access";

/**
 * Get past the cosmetic sign-in gate the way a presenter does.
 *
 * WHY EVERY SUITE THAT MOUNTS `App` NEEDS THIS. The gate is a state of the
 * root (`app/root.tsx`), not a route, so mounting `App` lands on the login
 * screen and the dashboard is not in the tree until it is cleared. Every suite
 * below is testing the dashboard, so each one opens it first.
 *
 * IT TYPES THE REAL CREDENTIAL RATHER THAN BYPASSING THE GATE. Injecting a
 * pre-signed-in flag would have been fewer keystrokes and would have tested a
 * door nobody opens: this way the gate is exercised ~150 times a run as a side
 * effect, so a change that breaks sign-in cannot pass the suite while every
 * dashboard test still goes green.
 *
 * Synchronous on purpose. The gate is plain React state with no timer and no
 * request behind it, so it commits inside `fireEvent` and suites running fake
 * clocks need no special handling.
 */
export function signIn(): void {
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: DEMO_CREDENTIALS.username },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: DEMO_CREDENTIALS.password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}
