import { type Page } from "@playwright/test";

/**
 * The network instrument for US-041 — offline resilience.
 *
 * The story is explicit that it is verified BY DISCONNECTING, not by reading
 * the source for `fetch` calls. A grep proves nothing about a lazily-loaded
 * route chunk, a webfont, an image, or a manifest the router asks for on
 * demand; the only honest test is to record what the browser actually asks for
 * and then to take the network away.
 *
 * Two instruments live here:
 *
 *   {@link recordNetwork}  attaches to a page and logs EVERY request, failure
 *                          and console error, with a seal that marks first
 *                          paint so "nothing is requested after load" becomes a
 *                          count rather than an opinion.
 *   {@link severNetwork}   genuinely disconnects the browser context, two ways
 *                          at once.
 */

/* ------------------------------------------------------------ THE LOG ----- */

/** One request the page made, with the side of first paint it fell on. */
export interface RecordedRequest {
  readonly url: string;
  readonly method: string;
  /** Playwright's classification: `document`, `script`, `stylesheet`, `image`, `font`, `fetch`, … */
  readonly resourceType: string;
  /** `true` once {@link NetworkLog.seal} has drawn the first-paint line. */
  readonly afterFirstPaint: boolean;
}

export interface NetworkLog {
  /** Every request, in order, both sides of the seal. */
  readonly requests: readonly RecordedRequest[];
  /** Requests the browser could not complete — an offline abort lands here. */
  readonly failures: readonly string[];
  /** `console.error` and uncaught page errors. */
  readonly consoleErrors: readonly string[];
  /**
   * Draw the first-paint line. Everything recorded from here on is a RUNTIME
   * request — which for this prototype must be nothing at all.
   */
  seal(): void;
  /** Requests made after the seal. The count that has to be zero. */
  afterFirstPaint(): readonly RecordedRequest[];
  /** Origins asked for that are not the local server. Must be empty. */
  foreignOrigins(): readonly string[];
  /** Webfont requests. The type stack is system-only (US-003), so: none. */
  fonts(): readonly RecordedRequest[];
  /** Distinct local paths asked for, by resource type — the asset inventory. */
  assets(): readonly RecordedRequest[];
}

/**
 * Origins that are not really origins.
 *
 * `data:` and `blob:` URLs never leave the browser, and `about:` is not a
 * fetch. Counting them as foreign would make the assertion below fail on
 * something that cannot depend on a network.
 */
const NON_NETWORK_SCHEMES = ["data:", "blob:", "about:", "chrome-extension://"];

/** A webfont, by resource type or by extension when the type is generic. */
const FONT_FILE = /\.(?:woff2?|ttf|otf|eot)(?:$|\?)/i;

/**
 * Attach the recorder. Call before the first `goto`, or the document request
 * itself goes unrecorded.
 *
 * `localOrigin` is the served bundle's own origin; everything else is foreign
 * by definition, which is stricter and more honest than a denylist of hosts
 * somebody has to remember to extend.
 */
export function recordNetwork(page: Page, localOrigin: string): NetworkLog {
  const requests: RecordedRequest[] = [];
  const failures: string[] = [];
  const consoleErrors: string[] = [];
  let sealed = false;

  page.on("request", (request) => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      afterFirstPaint: sealed,
    });
  });

  page.on("requestfailed", (request) => {
    failures.push(
      `${request.url()} (${request.failure()?.errorText ?? "unknown"})`,
    );
  });

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  const isNetwork = (url: string) =>
    !NON_NETWORK_SCHEMES.some((scheme) => url.startsWith(scheme));

  return {
    requests,
    failures,
    consoleErrors,
    seal() {
      sealed = true;
    },
    afterFirstPaint: () => requests.filter((entry) => entry.afterFirstPaint),
    foreignOrigins: () => [
      ...new Set(
        requests
          .filter(
            (entry) =>
              isNetwork(entry.url) && !entry.url.startsWith(localOrigin),
          )
          .map((entry) => new URL(entry.url).origin),
      ),
    ],
    fonts: () =>
      requests.filter(
        (entry) => entry.resourceType === "font" || FONT_FILE.test(entry.url),
      ),
    assets: () => {
      const seen = new Set<string>();
      return requests.filter((entry) => {
        if (seen.has(entry.url)) return false;
        seen.add(entry.url);
        return isNetwork(entry.url);
      });
    },
  };
}

/** The log as a readable line per request, for the run output. */
export function formatNetworkLog(log: NetworkLog, localOrigin: string): string {
  if (log.requests.length === 0) return "  (no requests at all)";
  return log.requests
    .map((entry) => {
      const path = entry.url.startsWith(localOrigin)
        ? entry.url.slice(localOrigin.length) || "/"
        : entry.url;
      const phase = entry.afterFirstPaint ? "AFTER FIRST PAINT" : "load";
      return `  ${entry.method} ${entry.resourceType.padEnd(10)} ${path}  [${phase}]`;
    })
    .join("\n");
}

/* ------------------------------------------------------- THE DISCONNECT --- */

/**
 * Sever the browser context's network. Belt and braces, on purpose.
 *
 *   1. `setOffline(true)` puts the context into the browser's own offline
 *      state — `navigator.onLine` flips, and the network stack refuses to
 *      resolve or connect, exactly as unplugging the venue Wi-Fi does.
 *   2. `route("**")` aborts every request that is attempted anyway, with the
 *      error code a disconnected machine reports. This catches anything that
 *      might be answered from a cache or a service worker rather than the
 *      network, so a request that would have "worked offline" by accident still
 *      shows up as a failure in the log.
 *
 * Either one alone would be a defensible test. Both together mean a runtime
 * fetch cannot hide behind the weaknesses of the other.
 */
export async function severNetwork(page: Page): Promise<void> {
  const context = page.context();
  await context.setOffline(true);
  await context.route("**", (route) => route.abort("internetdisconnected"));
}
