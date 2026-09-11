import { expect, type Page } from "@playwright/test";

import { DEMO_CREDENTIALS } from "../../../app/lib/demo-access";

/**
 * Clear the cosmetic sign-in gate in a real browser.
 *
 * WHY EVERY SUITE NEEDS IT. The gate is a state of the root (`app/root.tsx`),
 * not a route, so `goto("/")` lands on the login card and no dashboard exists
 * in the document until this runs. Every Chrome suite here is measuring the
 * dashboard, so each opens the door first.
 *
 * IT RETRIES, AND THAT IS NOT FLAKE-PAPERING. The document is server-rendered,
 * so the form is on screen and fillable BEFORE React has hydrated, and a press
 * that lands in that window is swallowed by a button with no handler attached
 * yet. `run-of-show.ts` solved the same problem the same way for the chip it
 * presses ("press until the press is answered"): the retry is how hydration is
 * WAITED FOR, and the assertion inside it is what proves the press took.
 *
 * IT ADDS NO REQUEST. The check is a string comparison in the client bundle
 * (`app/lib/demo-access.ts`) with no server, no cookie and no storage write,
 * which is what keeps US-041's "zero requests after first paint" and the dead-
 * end sweep's "zero sessionStorage keys" true with the gate in front.
 */
export async function signIn(page: Page): Promise<void> {
  await expect(async () => {
    await page.getByLabel("Username").fill(DEMO_CREDENTIALS.username);
    await page.getByLabel("Password").fill(DEMO_CREDENTIALS.password);
    await page.locator('[data-slot="login-submit"]').click();

    await expect(page.locator('[data-slot="app-shell"]')).toBeVisible({
      timeout: 1_000,
    });
  }).toPass();
}
