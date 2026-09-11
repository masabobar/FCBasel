# Phase 5: Post-Plan Demo Extras

**Duration:** 2026-09-11 (~1 AI-hour)
**Status:** ✅ Completed (1/1 · 2/2 pts)
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

### Epic 9: E9 — Post-Plan Demo Extras (2 story points)

**Priority:** P2 · **Status:** ✅ Completed (1/1) · **Dependencies:** US-012, US-044

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-046 | Cosmetic sign-in gate | 2 | P2 | ✅ Done |

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

- **Completed Story Points:** 2 / 2 · **Stories:** 1 / 1
- **Tests:** 2262 / 2262 unit (56 files) + 64 / 64 Chrome · **Commits:** pending

---

**Created:** 2026-09-11 · **Last Updated:** 2026-09-11
**Phase Status:** ✅ Completed (1/1 · 2/2 pts)
**Previous:** [Phase 4](phase-4.md) · **Backlog:** [Master Index](../../input/backlog/README.md)
