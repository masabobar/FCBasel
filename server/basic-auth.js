import { timingSafeEqual } from "node:crypto";

/**
 * HTTP Basic authentication for the deployed prototype.
 *
 * WHAT THIS IS, AND WHAT IT IS NOT. This is **deployment-level access
 * control**: it keeps the public Railway URL from being open to anyone who
 * finds it. It is NOT the product's access model. `constraints.md` §2 forbids
 * "real permissions or authentication" *in the prototype* — roles, granular
 * permissions, the permission-aware AI — and none of that is built here. One
 * shared credential in front of one private demo is infrastructure, and it is
 * the reason this file lives in `server/` rather than in `app/`.
 *
 * IT IS ALSO NOT `app/lib/demo-access.ts`. That one is theatre: a public
 * string, printed on the screen it opens, guarding nothing. THIS one is a real
 * secret, is never committed, and is compared in constant time. Do not confuse
 * the two, and do not let the existence of the cosmetic screen suggest this can
 * be relaxed.
 *
 * IN FRONT OF EVERYTHING, WHICH IS THE WHOLE POINT. The middleware is mounted
 * before `express.static`, so the client bundle is covered too. That matters
 * specifically: `build/client/assets/*.js` carries the seeded FC Basel figures,
 * so gating only the HTML document would have left the actual content
 * downloadable by anyone who knew an asset URL.
 */

/** Shown by the browser in its credential dialog. */
export const AUTH_REALM = "FC Basel Intelligence Platform";

/**
 * The ONLY paths served without a credential.
 *
 * WHY THE FAVICON HAS TO BE HERE. A browser fetches the tab icon from its own
 * chrome, not from the authenticated page, and that fetch does not carry the
 * Basic credential the page already holds. Behind the gate it took a 401 and
 * the tab fell back to a generic globe — the club crest showed locally and was
 * missing in production, which is exactly the sort of detail a demo is judged
 * on.
 *
 * WHY IT IS SAFE, STATED SO NOBODY WIDENS IT CASUALLY. `public/favicon.ico` is
 * 1,742 bytes derived from the club's own public crest. It carries no figures,
 * no dataset, no bundle — and the realm string above already announces the
 * club's name to anyone who requests the site at all, so this adds no
 * disclosure that the 401 itself does not.
 *
 * KEEP THIS LIST AT ONE ENTRY. `/fcb-crest.png` deliberately is NOT here: it is
 * requested by the page, which IS authenticated, so it needs no exemption. Any
 * path added here is public to the whole internet forever; the bundle under
 * `/assets` carries the seeded FC Basel figures and must never appear.
 */
export const PUBLIC_PATHS = new Set(["/favicon.ico"]);

/** Failed attempts allowed per client before a cool-off, per `security-and-auth.md` §2.3. */
export const MAX_FAILED_ATTEMPTS = 5;

/** How long that cool-off lasts. */
export const LOCKOUT_MS = 15 * 60 * 1000;

/**
 * Read the credential from the environment.
 *
 * FAIL-CLOSED IN PRODUCTION, and this is the important half. A gate that
 * silently does nothing when someone forgets to set an env var is worse than
 * no gate, because it looks protected. So in production the credential is
 * REQUIRED and the server refuses to boot without it; everywhere else the gate
 * is simply off unless both values are supplied, which is what keeps
 * `pnpm dev` and the Chrome suite unchanged.
 *
 * A HALF-CONFIGURED GATE IS ALWAYS AN ERROR, in any environment. One variable
 * set and the other missing is a typo or a half-finished deploy, never an
 * intention, and guessing which was meant is how a site ends up open.
 *
 * @param {Record<string, string | undefined>} env
 * @param {{ production: boolean }} options
 * @returns {{ user: string, password: string } | null} null when the gate is off
 */
export function readAuthConfig(env, { production }) {
  const user = env.SITE_AUTH_USER?.trim();
  const password = env.SITE_AUTH_PASSWORD?.trim();

  if (user && password) return { user, password };

  if (user || password) {
    throw new Error(
      "SITE_AUTH_USER and SITE_AUTH_PASSWORD must be set together. " +
        "One without the other leaves the deployment unprotected.",
    );
  }

  if (production) {
    throw new Error(
      "Refusing to start: SITE_AUTH_USER and SITE_AUTH_PASSWORD are required " +
        "in production so the deployed prototype is not publicly readable. " +
        "Set both in the Railway service variables (see .env.example).",
    );
  }

  return null;
}

/**
 * Pull the credential out of an `Authorization` header.
 *
 * Returns `null` for anything malformed rather than throwing, because a
 * malformed header is an ordinary thing for a public endpoint to receive and
 * the caller treats "absent" and "unparseable" identically.
 *
 * @param {string | undefined} header
 * @returns {{ user: string, password: string } | null}
 */
export function parseBasicHeader(header) {
  if (typeof header !== "string") return null;

  const [scheme, encoded] = header.split(" ");
  if (scheme?.toLowerCase() !== "basic" || !encoded) return null;

  let decoded;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }

  // Only the FIRST colon separates the two: a password may legitimately
  // contain colons, a username may not.
  const separator = decoded.indexOf(":");
  if (separator === -1) return null;

  return {
    user: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

/**
 * Constant-time comparison of one supplied value against one expected value.
 *
 * WHY NOT `===`. This is a real secret, so the comparison must not leak its
 * length or its matching prefix through timing. `timingSafeEqual` throws on a
 * length mismatch, which would leak the length by itself, so both sides are
 * hashed to a fixed width first — the standard way to compare secrets of
 * unknown length.
 *
 * @param {string} given
 * @param {string} expected
 */
function safeEqual(given, expected) {
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");

  // Equal-length buffers are a precondition of timingSafeEqual; padding both
  // to the longer length keeps the comparison itself constant-time, and the
  // explicit length check below is what actually rejects a length mismatch.
  const width = Math.max(a.length, b.length);
  const padded = (buffer) => Buffer.concat([buffer], width);

  return timingSafeEqual(padded(a), padded(b)) && a.length === b.length;
}

/**
 * Does this credential open the deployment?
 *
 * BOTH HALVES ARE ALWAYS COMPARED. Short-circuiting on a wrong username would
 * make a valid username measurably slower to reject than an invalid one.
 *
 * @param {{ user: string, password: string } | null} given
 * @param {{ user: string, password: string }} expected
 */
export function credentialsMatch(given, expected) {
  if (!given) return false;

  const userOk = safeEqual(given.user, expected.user);
  const passwordOk = safeEqual(given.password, expected.password);

  return userOk && passwordOk;
}

/**
 * A fixed-window failed-attempt counter, per `security-and-auth.md` §2.3.
 *
 * IT COUNTS WRONG CREDENTIALS, NEVER ABSENT ONES, and that distinction is what
 * makes it usable. Basic authentication is a two-step handshake: every browser
 * makes its first request with NO `Authorization` header, takes the 401, and
 * only then asks the user and retries. Counting that first anonymous request
 * as a failure would lock out every single visitor on their fifth page load.
 *
 * In memory and per process, which is proportionate here: one small service,
 * one credential, and the goal is to blunt automated guessing rather than to
 * survive a distributed attack.
 */
export function createAttemptLimiter({
  max = MAX_FAILED_ATTEMPTS,
  windowMs = LOCKOUT_MS,
  now = () => Date.now(),
} = {}) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const attempts = new Map();

  return {
    /** @param {string} key */
    isLocked(key) {
      const entry = attempts.get(key);
      if (!entry) return false;

      if (now() >= entry.resetAt) {
        attempts.delete(key);
        return false;
      }

      return entry.count >= max;
    },

    /** @param {string} key */
    recordFailure(key) {
      const entry = attempts.get(key);

      if (!entry || now() >= entry.resetAt) {
        attempts.set(key, { count: 1, resetAt: now() + windowMs });
        return;
      }

      entry.count += 1;
    },

    /** @param {string} key */
    reset(key) {
      attempts.delete(key);
    },
  };
}

/**
 * The Express middleware.
 *
 * NOTHING ABOUT THE CREDENTIAL IS EVER LOGGED — not the header, not the
 * supplied username, not a prefix of either (`error-handling-and-logging.md`
 * §3.4). A rejection logs the outcome and the client, and that is all.
 *
 * @param {{ user: string, password: string }} expected
 * @param {{ limiter?: ReturnType<typeof createAttemptLimiter>, log?: (event: object) => void }} [options]
 */
export function basicAuth(expected, options = {}) {
  const limiter = options.limiter ?? createAttemptLimiter();
  const log = options.log ?? (() => {});

  return function basicAuthMiddleware(req, res, next) {
    // Checked FIRST, and deliberately before the attempt limiter: the tab icon
    // is fetched on every page load, and a lockout must never be able to take
    // the crest off the tab. See PUBLIC_PATHS for why this stays at one entry.
    if (PUBLIC_PATHS.has(req.path)) {
      next();
      return;
    }

    const client = req.ip ?? "unknown";

    if (limiter.isLocked(client)) {
      log({ event: "site_auth.locked", client });
      res.status(429).set("Retry-After", "900").send("Too many attempts.");
      return;
    }

    const given = parseBasicHeader(req.headers.authorization);

    if (credentialsMatch(given, expected)) {
      limiter.reset(client);
      next();
      return;
    }

    // An absent header is the handshake, not an attempt (see the limiter's
    // note). Only a header that was present and WRONG counts against the
    // client.
    if (given) {
      limiter.recordFailure(client);
      log({ event: "site_auth.failure", client });
    }

    res
      .status(401)
      .set("WWW-Authenticate", `Basic realm="${AUTH_REALM}", charset="UTF-8"`)
      .send("Authentication required.");
  };
}
