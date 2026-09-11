/**
 * Deployment-level Basic authentication (`server/basic-auth.js`).
 *
 * UNLIKE THE COSMETIC GATE, THIS ONE HAS REAL SECURITY PROPERTIES TO ASSERT,
 * and they are the ones that are easy to get subtly wrong:
 *
 *   1. FAIL-CLOSED. Production must refuse to boot without a credential, and a
 *      half-configured pair must be an error everywhere. A gate that silently
 *      does nothing is worse than no gate, because it looks protected.
 *   2. THE HANDSHAKE IS NOT AN ATTACK. Basic auth's first request always
 *      arrives with no header; counting that as a failed attempt would lock out
 *      every ordinary visitor on their fifth page load.
 *   3. NOTHING ABOUT THE CREDENTIAL IS LOGGED (`error-handling-and-logging.md`
 *      §3.4) — not the header, not the supplied username.
 *   4. THE STATUS MATRIX the gate can actually produce: 401, 429, and pass.
 */

import { describe, expect, it, vi } from "vitest";

import {
  AUTH_REALM,
  MAX_FAILED_ATTEMPTS,
  PUBLIC_PATHS,
  basicAuth,
  createAttemptLimiter,
  credentialsMatch,
  parseBasicHeader,
  readAuthConfig,
} from "../../server/basic-auth.js";

const EXPECTED = { user: "fcb", password: "s3cret:with:colons" };

function header(user: string, password: string): string {
  return `Basic ${Buffer.from(`${user}:${password}`, "utf8").toString("base64")}`;
}

/* ------------------------------------------------------------- CONFIG -- */

describe("readAuthConfig — fail-closed", () => {
  it("returns the credential when both halves are set", () => {
    expect(
      readAuthConfig(
        { SITE_AUTH_USER: "fcb", SITE_AUTH_PASSWORD: "pw" },
        { production: true },
      ),
    ).toEqual({ user: "fcb", password: "pw" });
  });

  it("REFUSES TO BOOT in production with no credential", () => {
    expect(() => readAuthConfig({}, { production: true })).toThrow(
      /Refusing to start/,
    );
  });

  it("is simply off outside production, so dev and the Chrome suite are unchanged", () => {
    expect(readAuthConfig({}, { production: false })).toBeNull();
  });

  it.each([
    ["user without password", { SITE_AUTH_USER: "fcb" }],
    ["password without user", { SITE_AUTH_PASSWORD: "pw" }],
  ])("treats a half-configured pair as an error: %s", (_label, env) => {
    for (const production of [true, false]) {
      expect(() => readAuthConfig(env, { production })).toThrow(
        /must be set together/,
      );
    }
  });

  it("trims surrounding whitespace, which a pasted variable carries", () => {
    expect(
      readAuthConfig(
        { SITE_AUTH_USER: "  fcb  ", SITE_AUTH_PASSWORD: "  pw  " },
        { production: true },
      ),
    ).toEqual({ user: "fcb", password: "pw" });
  });

  /**
   * A whitespace-only value is never a live credential. Which of the two
   * errors it produces depends on what sits beside it, and both are checked
   * because the dangerous one is the second: a blank username next to a REAL
   * password would otherwise look configured.
   */
  it("never accepts a whitespace-only value as a credential", () => {
    // Blank and alone: indistinguishable from unset, so production still
    // refuses to boot and non-production simply has no gate.
    expect(() =>
      readAuthConfig({ SITE_AUTH_USER: "   " }, { production: true }),
    ).toThrow(/Refusing to start/);
    expect(
      readAuthConfig({ SITE_AUTH_USER: "   " }, { production: false }),
    ).toBeNull();

    // Blank beside a real value: a half-configured pair, and an error everywhere.
    for (const production of [true, false]) {
      expect(() =>
        readAuthConfig(
          { SITE_AUTH_USER: "   ", SITE_AUTH_PASSWORD: "pw" },
          { production },
        ),
      ).toThrow(/must be set together/);
    }
  });
});

/* -------------------------------------------------------------- PARSE -- */

describe("parseBasicHeader", () => {
  it("reads a well-formed header", () => {
    expect(parseBasicHeader(header("fcb", "pw"))).toEqual({
      user: "fcb",
      password: "pw",
    });
  });

  it("splits on the FIRST colon, so a password may contain colons", () => {
    expect(parseBasicHeader(header("fcb", "a:b:c"))).toEqual({
      user: "fcb",
      password: "a:b:c",
    });
  });

  it("accepts the scheme case-insensitively, as the RFC requires", () => {
    expect(
      parseBasicHeader(header("fcb", "pw").replace("Basic", "basic")),
    ).toEqual({ user: "fcb", password: "pw" });
  });

  it.each([
    ["absent", undefined],
    ["empty", ""],
    ["a different scheme", "Bearer abc"],
    ["scheme with no payload", "Basic"],
    [
      "payload with no colon",
      `Basic ${Buffer.from("nocolon").toString("base64")}`,
    ],
  ])("returns null for %s rather than throwing", (_label, value) => {
    expect(parseBasicHeader(value as string | undefined)).toBeNull();
  });
});

/* ---------------------------------------------------------- COMPARISON -- */

describe("credentialsMatch", () => {
  it("accepts the exact credential", () => {
    expect(credentialsMatch({ ...EXPECTED }, EXPECTED)).toBe(true);
  });

  it.each([
    ["a wrong password", { user: EXPECTED.user, password: "wrong" }],
    ["a wrong username", { user: "nope", password: EXPECTED.password }],
    [
      "a password that is a prefix of the real one",
      { user: EXPECTED.user, password: "s3cret" },
    ],
    [
      "a password that extends the real one",
      { user: EXPECTED.user, password: `${EXPECTED.password}x` },
    ],
    ["empty values", { user: "", password: "" }],
  ])("rejects %s", (_label, given) => {
    expect(credentialsMatch(given, EXPECTED)).toBe(false);
  });

  it("rejects a null credential", () => {
    expect(credentialsMatch(null, EXPECTED)).toBe(false);
  });
});

/* ------------------------------------------------------------ LIMITER -- */

describe("createAttemptLimiter", () => {
  it("locks only after the threshold is crossed", () => {
    const limiter = createAttemptLimiter({ max: 3, windowMs: 1000 });

    for (let i = 0; i < 2; i += 1) limiter.recordFailure("ip");
    expect(limiter.isLocked("ip")).toBe(false);

    limiter.recordFailure("ip");
    expect(limiter.isLocked("ip")).toBe(true);
  });

  it("forgets the window once it has elapsed", () => {
    let clock = 0;
    const limiter = createAttemptLimiter({
      max: 1,
      windowMs: 100,
      now: () => clock,
    });

    limiter.recordFailure("ip");
    expect(limiter.isLocked("ip")).toBe(true);

    clock = 100;
    expect(limiter.isLocked("ip")).toBe(false);
  });

  it("keeps clients apart", () => {
    const limiter = createAttemptLimiter({ max: 1 });

    limiter.recordFailure("a");

    expect(limiter.isLocked("a")).toBe(true);
    expect(limiter.isLocked("b")).toBe(false);
  });

  it("clears the count on a success", () => {
    const limiter = createAttemptLimiter({ max: 2 });

    limiter.recordFailure("ip");
    limiter.reset("ip");
    limiter.recordFailure("ip");

    expect(limiter.isLocked("ip")).toBe(false);
  });
});

/* --------------------------------------------------------- MIDDLEWARE -- */

interface FakeResponse {
  statusCode: number | null;
  headers: Record<string, string>;
  body: string | null;
  status(code: number): FakeResponse;
  set(name: string, value: string): FakeResponse;
  send(body: string): FakeResponse;
}

function fakeResponse(): FakeResponse {
  const res: FakeResponse = {
    statusCode: null,
    headers: {},
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    set(name, value) {
      res.headers[name] = value;
      return res;
    },
    send(body) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function run(
  middleware: ReturnType<typeof basicAuth>,
  authorization?: string,
  ip = "1.2.3.4",
  path = "/",
) {
  const res = fakeResponse();
  const next = vi.fn();
  middleware({ ip, path, headers: { authorization } }, res, next);
  return { res, next };
}

describe("basicAuth middleware — the status matrix", () => {
  it("passes a correct credential through (next, no response written)", () => {
    const { res, next } = run(
      basicAuth(EXPECTED),
      header(EXPECTED.user, EXPECTED.password),
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  it("401s an anonymous request and asks for the credential", () => {
    const { res, next } = run(basicAuth(EXPECTED));

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.headers["WWW-Authenticate"]).toBe(
      `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
    );
  });

  it("401s a wrong credential", () => {
    const { res, next } = run(basicAuth(EXPECTED), header("fcb", "wrong"));

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("429s once the attempt threshold is crossed", () => {
    const middleware = basicAuth(EXPECTED);

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      run(middleware, header("fcb", "wrong"));
    }

    const { res, next } = run(middleware, header("fcb", "wrong"));

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
    expect(res.headers["Retry-After"]).toBe("900");
  });

  it("NEVER counts the anonymous handshake toward the lockout", () => {
    const middleware = basicAuth(EXPECTED);

    // Far more anonymous requests than the threshold: this is what every
    // ordinary visitor's browser does on every page load.
    for (let i = 0; i < MAX_FAILED_ATTEMPTS * 4; i += 1) run(middleware);

    const { next } = run(middleware, header(EXPECTED.user, EXPECTED.password));

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("clears a client's failures once it succeeds", () => {
    const middleware = basicAuth(EXPECTED);

    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i += 1) {
      run(middleware, header("fcb", "wrong"));
    }
    run(middleware, header(EXPECTED.user, EXPECTED.password));

    // Without the reset this next failure would be the one that locks.
    const { res } = run(middleware, header("fcb", "wrong"));

    expect(res.statusCode).toBe(401);
  });

  it("locks one client without locking another", () => {
    const middleware = basicAuth(EXPECTED);

    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      run(middleware, header("fcb", "wrong"), "9.9.9.9");
    }

    expect(
      run(middleware, header("fcb", "wrong"), "9.9.9.9").res.statusCode,
    ).toBe(429);
    expect(run(middleware, undefined, "8.8.8.8").res.statusCode).toBe(401);
  });

  it("logs the rejection but NO part of the credential", () => {
    const log = vi.fn();
    const middleware = basicAuth(EXPECTED, { log });

    run(middleware, header("attacker-name", "attacker-password"));

    expect(log).toHaveBeenCalledTimes(1);
    const serialised = JSON.stringify(log.mock.calls);

    expect(serialised).not.toMatch(/attacker-name|attacker-password/);
    expect(serialised).not.toMatch(/Basic |s3cret/);
  });

  /**
   * THE ONE EXEMPTION, and the tests that keep it at one.
   *
   * A browser fetches the tab icon from its own chrome, without the credential
   * the authenticated page holds, so behind the gate the crest fell back to a
   * generic globe in production while showing correctly on localhost.
   */
  it("serves the favicon with no credential, so the tab keeps the crest", () => {
    const { res, next } = run(
      basicAuth(EXPECTED),
      undefined,
      "1.2.3.4",
      "/favicon.ico",
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBeNull();
  });

  it("serves it even to a client that is locked out", () => {
    // The icon is fetched on every page load; a lockout must not be able to
    // strip the crest from the tab.
    const middleware = basicAuth(EXPECTED);
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i += 1) {
      run(middleware, header("fcb", "wrong"));
    }

    expect(run(middleware, header("fcb", "wrong")).res.statusCode).toBe(429);

    const { next } = run(middleware, undefined, "1.2.3.4", "/favicon.ico");
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the document", "/"],
    ["the bundle that carries the figures", "/assets/entry.client-abc123.js"],
    [
      "the crest, which the authenticated page requests itself",
      "/fcb-crest.png",
    ],
    ["a path merely containing the icon's name", "/assets/favicon.ico"],
    ["a traversal aimed at it", "/../favicon.ico"],
  ])("still guards %s", (_label, path) => {
    const { res, next } = run(basicAuth(EXPECTED), undefined, "1.2.3.4", path);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("keeps the exemption list at exactly one entry", () => {
    // Anything added here is public to the whole internet, forever. The list is
    // asserted rather than described so widening it is a deliberate act that
    // fails a test first.
    expect([...PUBLIC_PATHS]).toEqual(["/favicon.ico"]);
  });

  it("writes no response body containing the expected credential", () => {
    const { res } = run(basicAuth(EXPECTED));

    expect(res.body).not.toMatch(/fcb|s3cret/);
  });
});
