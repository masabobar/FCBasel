# Phase 5: Post-Plan Demo Extras

**Goal:** Requests that arrived after the 45-story plan closed. Each one is optional by the
specification rather than required by it, and each is added deliberately rather than discovered.
**Duration:** Post-plan, on request
**Total Stories:** 4
**Total Points:** 11
**Status:** ✅ Completed (4/4 · 11/11)

> **Why this is not Phase 4.** Phase 4's own guardrail reads *"Not in this phase: new functionality"*,
> and it closed complete at 6/6. A login screen is new functionality, so folding it back into a
> finished hardening phase would have misrepresented both. This file is where post-plan scope lands.

---

## Epic 9: E9 — Post-Plan Demo Extras

**Priority:** P0
**Total Story Points:** 11
**Status:** ✅ Completed (4/4)
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

- **US-047**: Deployment access gate (HTTP Basic)
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [DevOps]
  - **Status:** ✅ Completed
  - **Description:** Put the deployed URL behind HTTP Basic authentication so the shareable link is
    shared deliberately rather than publicly readable.
  - **Acceptance Criteria:**
    - [x] An unauthenticated request to any path returns **401** with `WWW-Authenticate`, so the
          browser prompts
    - [x] **The gate covers static assets too** — `build/client/assets/*.js` carries the seeded
          figures, so gating only the HTML document would leave the content downloadable
    - [x] Credential comes from `SITE_AUTH_USER` / `SITE_AUTH_PASSWORD`, **never committed**;
          placeholders in `.env.example`
    - [x] **Fail-closed:** with `NODE_ENV=production` the server refuses to boot without both; a
          half-configured pair is an error in every environment
    - [x] Constant-time comparison; length does not leak
    - [x] 5 failed attempts per client per 15 min → **429**; the anonymous handshake never counts
    - [x] No part of the credential is logged
    - [x] The product suite is unaffected — the Chrome cases still measure the dashboard
  - **Dependencies:** US-001
  - **Notes:** ~1 h. Required replacing `@react-router/serve` with a small Express server
    (`server.js`), because that binary has nowhere to mount middleware. **This is deployment
    infrastructure, NOT the product access model** — `constraints.md` §2 forbids roles, permissions
    and the permission-aware AI *in the prototype*, none of which this adds.

- **US-048**: Club red on the app-bar rule
  - **Story Points:** 1
  - **Priority:** P2
  - **Component:** [Web]
  - **Status:** ✅ Completed
  - **Type:** Frontend (Web)
  - **Screen:** SCREEN-001 (app shell chrome)
  - **Description:** Review feedback — *"FCB colour scheme (especially the red) could be used a bit
    more."* The app bar's bottom border becomes the club rule.
  - **Acceptance Criteria:**
    - [x] `top-bar` bottom border is `--color-red`, 2px, replacing `--color-border`
    - [x] **Contrast improves rather than merely changing:** measured **5.04:1** on the served page,
          up from **1.12:1** on the same ground — retires the app-bar edge from KL-4
    - [x] Bar height unchanged at 56px (border-box), so US-040's sizing measurements still hold
    - [x] Adds no colour outside the token set; gold allowlist untouched
    - [x] **Red stays off anything that reads as a judgement about data**
  - **Dependencies:** US-012, US-044
  - **Notes:** ~15 min. `--color-red` is ALSO `varianceNegative`, so the same hex means
    "unfavourable" inside a variance chip. Chrome cannot be mistaken for a judgement about a figure;
    a tile border could be. **Deliberately NOT changed:** the connection-status dot — a red dot
    beside "Connected · 11 systems" reads as offline in every interface convention.

  - **API Endpoints Used:** none — purely client-side.

  - **API contract status:** ✅ Verified — no endpoint exists or is needed.

- **US-049**: German language pass (EN / DE, via JSON keys)
  - **Story Points:** 5
  - **Priority:** P1
  - **Component:** [Web]
  - **Status:** ✅ Completed
  - **Type:** Frontend (Web)
  - **Screen:** SCREEN-001 (app shell chrome) + every tile on it
  - **Description:** Requested after the plan closed — the club is German-speaking and the demo may
    be given in German. Every rendered word moves into two JSON dictionaries behind a small
    in-house translation layer, and the app bar gains an EN / DE toggle. English stays the default;
    German is one press away.
  - **Acceptance Criteria:**
    - [x] **All copy is keyed.** `app/lib/i18n/locales/en.json` + `de.json` hold every rendered
          string; no display text remains in a component or a fixture
    - [x] Enum label maps become `*_LABEL_KEY`; datasets carry `labelKey` / `scopeLabelKey` /
          `narrativeKey`; departments, products and spend drivers become enums so a row is keyed by
          an identifier rather than by a name that changes with the language
    - [x] **One press switches everything** — chrome, prepared questions, empty state, fallback,
          thinking beat, and an answer rendered after the switch
    - [x] **No figure changes with the language:** the same tiles render identical numbers in both
          (`app/lib/format.ts` is Swiss and locale-independent)
    - [x] **A typed German question resolves** — the intent matcher holds both vocabularies in one
          keyword set and never reads the locale; every English score is unchanged
    - [x] Narratives stay **verbatim**: the English is the approved reference copy, the German a
          translation of that same copy
    - [x] **Memory-only** (`constraints.md` §2): no cookie, no storage, no `Accept-Language`; a
          reload returns to English. `<html lang>` is corrected on switch for screen readers
    - [x] **No dependency added** — no i18next package; ~90 lines and a React context
    - [x] Key parity is a TYPE error (`Record<Locale, typeof en>`), and the dictionary suite covers
          the reverse direction plus the house rules in German (no em/en dash, no `ß`, Swiss digit
          grouping)
    - [x] Swiss German throughout: `ss` never `ß`, `3'200` never `3,200`
  - **Dependencies:** US-012, US-029, US-030, US-044
  - **Notes:** ~4 h. It reaches further than a copy change because the datasets held display text:
    the loader now carries a greeting KEY and month KEYS (the language is client state the server
    cannot know), and `derive.ts` takes the translator as a parameter rather than importing one.
    **Deliberately NOT done:** locale detection, a persisted preference, and a third language —
    each would add a dependency or break the memory-only rule for no demo benefit.

  - **API Endpoints Used:** none — purely client-side.

  - **API contract status:** ✅ Verified — no endpoint exists or is needed.

---

## Phase Summary

**Total Epics:** 1 | **Total Stories:** 4 | **Total Points:** 11

**By Priority:** P0: 1 story, 3 points · P1: 1 story, 5 points · P2: 2 stories, 3 points — **all
done**

**By Status:** ✅ 4 stories, 11 points · 🔄 0 · 📋 0 · ⏸️ 0

---

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-4-polish.md) · [Future →](future.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-11
