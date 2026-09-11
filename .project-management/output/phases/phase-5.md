# Phase 5: Post-Plan Demo Extras

**Duration:** 2026-09-11 (~2 AI-hours)
**Status:** ✅ Completed (2/2 · 5/5 pts)
**Started:** 2026-09-11
**Target Completion:** 2026-09-11
**Actual Completion:** 2026-09-11

> **Acceptance criteria live in** [`../../input/backlog/phase-5-demo-extras.md`](../../input/backlog/phase-5-demo-extras.md). This file tracks execution.

---

## Phase Goal

Hold post-plan requests that arrive after the 45-story plan closed, so a finished phase is never
reopened to absorb new functionality. Phase 4's own guardrail reads *"Not in this phase: new
functionality"*, and it closed complete at 6/6.

---

## Epics in This Phase

### Epic 9: E9 — Post-Plan Demo Extras (5 story points)

**Priority:** P0 · **Status:** ✅ Completed (2/2) · **Dependencies:** US-001, US-012, US-044

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-046 | Cosmetic sign-in gate | 2 | P2 | ✅ Done |
| US-047 | Deployment access gate (HTTP Basic) | 3 | **P0** | ✅ Done |

---

## Progress Log

### US-046 — Cosmetic sign-in gate (2 pts) · 2026-09-11 · ✅ Done

**Requested by the PM after the plan closed; permitted, not required, by `constraints.md` §2**
("A cosmetic login screen is optional and, if present, decorative only"). Built as
`app/lib/demo-access.ts` + `app/components/chrome/login-screen.tsx`, gated in `app/root.tsx`.

**IT IS A STATE, NOT A ROUTE.** `routes.ts` is untouched, so the single-route architecture
(`technical-spec.md` §4.2) and US-012's "the inert items must never become routes" both still hold.
The gate renders instead of the shell while closed; every hook runs on both sides of the branch.

**THE GATE WAS CHOSEN OVER A STANDALONE SCREEN, WITH ITS COST STATED UP FRONT.** The alternative was
a decorative `/login` leaving `/` open, which would have broken nothing. Gating was chosen
deliberately, and its consequence is real: **a reload returns to the gate**, because
`constraints.md` §2 forbids persistence across sessions and US-043's KL-3 fix made memory-only
literally true of browser storage. Recorded as **KL-5** below.

**TESTS — 18 new unit cases + the whole suite re-validated.** `tests/unit/login-screen.test.tsx`
drives the form with **the string the screen actually renders**, so a hint that stops matching the
check fails in CI rather than in the demo room. `tests/unit/root.test.tsx` adds the closed state
directly: no shell, no sidebar, no routed child before sign-in, and **zero `sessionStorage` /
`localStorage` / cookie writes** after it.

**THE RELATED-TEST RE-VALIDATION IS THE REAL WORK OF THIS STORY, and it found what it exists to
find.** 154 unit tests across 9 files broke on first run, and **3 Chrome cases broke on reload** --
the dead-end sweep's "reload, back and forward all land on a usable dashboard" and KL-3's two
viewports. None was a defect in the gate; each was a standing guarantee the gate now sits inside, so
each path was walked THROUGH the gate rather than around it and every original assertion kept. KL-3
gained an assertion rather than losing one: the scroll offset is now checked **on the gate as well**,
since a restoration would land there first.

**Two source-scan assertions were narrowed, not deleted.** `graceful-fallback` and
`suggestion-chips` banned the literal `useState` in `app/root.tsx` as a proxy for "nothing derived is
held in state". The root now legitimately holds exactly one. Both now assert the **count and its
identity**, so chip or fallback state added later still fails.

**Security triage — the `login` trigger fired (A01/A02/A07) and the deep gate is Not Applicable, as a
conclusion rather than a skip.** `security-and-auth.md` requires sessions, bcrypt, rate limits and
401/403/IDOR tests; none exists here because **no authentication was built** and the specification
forbids building one. No server, no loader, no action, no endpoint, no cookie, no token, no hash.
**A02 note:** the committed credential is NOT a secret -- it is printed on the screen it opens and is
in the client bundle; a scanner flagging it should be pointed here. **A03:** input is bound through
React-controlled `value`, never echoed, `dangerouslySetInnerHTML` absent. **A06:** no dependency
added, lockfile untouched. **Residual risk, accepted and written down: the gate is trivially
bypassable and protects nothing.** That is its specification, not its weakness.

### US-047 — Deployment access gate, HTTP Basic (3 pts) · 2026-09-11 · ✅ Done

**A DIFFERENT THING FROM US-046, and the two must never be confused.** US-046 is theatre inside the
product; this is **deployment infrastructure** keeping the public Railway URL from being readable by
anyone who finds it. `constraints.md` §2 forbids an access model *in the prototype* -- roles,
permissions, the permission-aware AI -- and none of that is built. It lives in `server/`, not `app/`.

**THE SERVER WAS REPLACED, AND THAT WAS THE POINT.** `@react-router/serve` is a closed pipeline with
nowhere to mount middleware, so `server.js` is now a small Express server doing what it did (assets
with the same cache headers, then the React Router handler) with the gate in front. **Gating only the
HTML document would have missed the actual content:** `build/client/assets/*.js` carries the seeded
FC Basel figures, so a document-only gate leaves them downloadable by anyone who knows an asset URL.
**Verified against a real server, five ways:** anonymous → **401 + `WWW-Authenticate`**, wrong
credential → **401**, correct → **200**, **asset with no credential → 401**, asset with credential →
200.

**FAIL-CLOSED, WHICH IS THE HALF THAT MATTERS.** A gate that silently does nothing when a variable is
forgotten is worse than no gate, because it looks protected. `pnpm start` pins
`NODE_ENV=production` rather than trusting the platform to set it, and in production the server
**refuses to boot** without both variables (verified: the boot attempt throws). A half-configured
pair is an error in every environment. Credential is env-only, `.env.example` carries placeholders,
nothing is committed.

**Comparison is constant-time** (`timingSafeEqual`, both halves always compared, length-padded so
length does not leak). **Brute force:** 5 failures per client per 15 min → **429 + `Retry-After`** --
and **the anonymous handshake never counts**, because Basic auth's first request always arrives with
no header and counting it would lock out every ordinary visitor on their fifth page load. **Nothing
of the credential is logged**, asserted positively.

**TESTS — 35 new cases** (`tests/unit/basic-auth.test.ts`): the 401 / 429 / pass matrix, the lockout
and its per-client isolation, the window expiring, the handshake exemption, and redaction.
**One assertion I wrote was wrong and the suite caught it**: a whitespace-only username *alone* is
indistinguishable from unset, so it correctly yields "refuse to boot" in production rather than the
"set together" error. The test now asserts the property that actually matters -- a blank value is
never a live credential -- across both shapes.

**The Chrome suite runs `node server.js` directly** rather than `pnpm start`, so the mandatory
production gate does not put a credential prompt in front of 64 cases that exist to measure the
dashboard. Same file, same build, same middleware; the gate is covered at its own boundary instead.

**Dependency gate: `pnpm audit` clean, no advisories.** `express` and `@react-router/express` were
already in the tree transitively at the same versions, so they were promoted to direct dependencies
with **no new code downloaded**. `@react-router/serve` was removed as genuinely dead.

---

## Known limitations

### KL-5 — A reload returns to the sign-in gate

**What:** sign-in is React state in `app/root.tsx` with no persistence, so any reload, and the
forward half of a back/forward pair, lands on the gate again.

**Why it is not a defect.** `constraints.md` §2 forbids persistence across sessions, and US-043
closed KL-3 by making memory-only literally true of the browser's storage -- the dead-end sweep
asserts **zero `sessionStorage` keys**. Remembering a sign-in is exactly the write that assertion
exists to catch. **Decision (2026-09-11, the PM): the gate was requested with this cost stated.**

**The fix, if it is ever unwanted, is to DROP THE GATE, never to start persisting it** -- a
standalone decorative screen with `/` left open carries none of this.

**Demo consequence to know before the room:** the run-of-show now opens with sign-in
(`demo` / `fcb2026`), and a mid-demo reload needs it again.

---

## Phase Metrics

- **Completed Story Points:** 5 / 5 · **Stories:** 2 / 2
- **Tests:** 2297 / 2297 unit (57 files) + **64 / 64 Chrome (13.2m)** · **Commits:** 2

---

**Created:** 2026-09-11 · **Last Updated:** 2026-09-11
**Phase Status:** ✅ Completed (2/2 · 5/5 pts)
**Previous:** [Phase 4](phase-4.md) · **Backlog:** [Master Index](../../input/backlog/README.md)
