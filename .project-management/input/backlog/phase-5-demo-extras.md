# Phase 5: Post-Plan Demo Extras

**Goal:** Requests that arrived after the 45-story plan closed. Each one is optional by the
specification rather than required by it, and each is added deliberately rather than discovered.
**Duration:** Post-plan, on request
**Total Stories:** 1
**Total Points:** 2
**Status:** ✅ Completed (1/1 · 2/2)

> **Why this is not Phase 4.** Phase 4's own guardrail reads *"Not in this phase: new functionality"*,
> and it closed complete at 6/6. A login screen is new functionality, so folding it back into a
> finished hardening phase would have misrepresented both. This file is where post-plan scope lands.

---

## Epic 9: E9 — Post-Plan Demo Extras

**Priority:** P2
**Total Story Points:** 2
**Status:** ✅ Completed (1/1)
**Source:** Requested by the PM after the plan closed. Permitted (not required) by
[`../constraints.md`](../constraints.md) §2.

### Stories:

- **US-046**: Cosmetic sign-in gate
  - **Story Points:** 2
  - **Priority:** P2
  - **Component:** [Web]
  - **Status:** ✅ Completed
  - **Type:** Frontend (Web)
  - **Screen:** SCREEN-002 (cosmetic sign-in gate)
  - **Description:** A branded front door in front of the dashboard, showing the credential it
    accepts. Decorative only, exactly as the specification permits.
  - **Acceptance Criteria:**
    - [x] Screen shows the crest, the workspace label, a username and a password field
    - [x] The accepted credential is **printed on the screen**, read from the same constant the
          check reads, so the hint and the check cannot drift apart
    - [x] Correct credential replaces the gate with the app shell and the dashboard beneath it
    - [x] Wrong credential shows an inline message, announces it to a screen reader, and leaves the
          form usable; typing again clears the message
    - [x] **No real authentication:** no server, no loader, no action, no endpoint, no cookie, no
          token, no hash, and no `sessionStorage` / `localStorage` write
    - [x] **No new route** — the gate is a state of `app/root.tsx`, so the single-route architecture
          (`technical-spec.md` §4.2) is intact
    - [x] Adds no colour outside the token set and **no gold**, per US-044's closed allowlist
    - [x] Renders no em or en dash, per US-044's sweep
  - **Dependencies:** US-012, US-044
  - **Notes:** ~1 h. The module is named `demo-access.ts` rather than `auth.ts` so it cannot be
    misread as authentication. **Known consequence, accepted when the gate was requested:** sign-in
    is memory-only, so a reload returns to it. That follows from `constraints.md` §2 and US-043's
    KL-3 fix, and the fix for anyone who dislikes it is to drop the gate, never to start persisting.

  - **API Endpoints Used:** none — purely client-side.

  - **API contract status:** ✅ Verified — no endpoint exists or is needed.

---

## Phase Summary

**Total Epics:** 1 | **Total Stories:** 1 | **Total Points:** 2

**By Priority:** P0: 0 · P1: 0 · P2: 1 story, 2 points — done

**By Status:** ✅ 1 story, 2 points · 🔄 0 · 📋 0 · ⏸️ 0

---

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-4-polish.md) · [Future →](future.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-11
