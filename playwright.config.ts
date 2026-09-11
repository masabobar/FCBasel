import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright — the measurement rig for US-040's presentation sizing.
 *
 * WHY THIS EXISTS AND WHY IT IS NOT VITEST. Every criterion in US-040 is a
 * geometric fact: `scrollWidth` against `clientWidth`, a tile's box against its
 * container's, a chart label's painted box against the plot it sits in. jsdom
 * has no layout engine, so it answers all of those with zeros and would pass a
 * page that is visibly broken. Real Chrome is the only instrument that can
 * measure this, and `@playwright/test` was already a devDependency — nothing
 * was added to the lockfile.
 *
 * AGAINST THE BUILT SSR BUNDLE, NOT THE DEV SERVER. The demo is presented from
 * `react-router-serve` on Railway, and the dev server differs in exactly the
 * ways that matter here — unminified CSS, injected HMR client, no production
 * asset hashing. `webServer` therefore builds first and serves the build, so
 * what is measured is what the room will see.
 *
 * SEPARATE FROM `pnpm test` ON PURPOSE. `pnpm test` is the fast unit gate that
 * runs on every commit; this suite boots a browser and drives the full demo
 * script six chips deep at eleven viewports, which is minutes rather than
 * seconds. Run it with `pnpm test:e2e`.
 */

const PORT = Number(process.env.E2E_PORT ?? 4173);

export const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  // The suite drives one shared server and measures window geometry; parallel
  // workers resizing the same build buy nothing and make failures ambiguous.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"]],
  // A single viewport case loads the whole run-of-show: three heroes and three
  // follow-ups, each behind a ~1150ms thinking beat.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    ...devices["Desktop Chrome"],
    // Every measurement is in CSS pixels; a scaled backing store would make
    // the numbers unreadable against the acceptance criteria.
    deviceScaleFactor: 1,
  },
  webServer: {
    /**
     * `node server.js` DIRECTLY, not `pnpm start`.
     *
     * `pnpm start` pins `NODE_ENV=production`, which makes the Basic
     * authentication gate mandatory — the server refuses to boot without
     * `SITE_AUTH_USER` / `SITE_AUTH_PASSWORD` (`server/basic-auth.js`). That
     * is deliberately fail-closed for the deploy, and equally deliberately not
     * what this suite wants: these 64 cases measure the PRODUCT, and putting a
     * credential prompt in front of every one of them would test the gate
     * sixty-four times and the dashboard never.
     *
     * The gate itself is covered where it belongs, at its own boundary:
     * `tests/unit/basic-auth.test.ts` (401 / 429 / pass, the lockout, the
     * handshake exemption, and that nothing of the credential is logged).
     *
     * The server process is otherwise IDENTICAL to the deployed one — same
     * `server.js`, same build, same static middleware and cache headers — so
     * what this suite measures is still what the room will see.
     */
    command: `pnpm build && E2E_PORT=${PORT} PORT=${PORT} node server.js`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Surfaced, not swallowed: a build error or a bound port has to be
    // readable in the run output, or a failure here looks like a flake.
    stdout: "pipe",
    stderr: "pipe",
  },
});
