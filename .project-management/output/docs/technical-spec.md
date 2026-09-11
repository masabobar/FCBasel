# Technical Specification — FC Basel Intelligence Platform Prototype

**Version:** 1.0
**Date:** 2026-09-09
**Status:** Approved
**Author:** Developer (project setup and stack are developer-owned per the Build Specification)

> **Template note:** the framework's technical-spec template assumes a conventional 3-tier CRUD
> application with a database, JWT auth, third-party integrations and caching. This prototype has
> **none** of those by design. Sections are kept and numbered for consistency, but where a section
> does not apply it says so and says why, rather than inventing content.

---

## 1. Overview

### 1.1 Purpose
Defines how the scripted FCB chat-to-dashboard prototype is built: stack, structure, the intent
matching engine, the data layer, testing, and deployment.

### 1.2 Scope
Frontend architecture, the server-side seed-data layer, the conversational interaction engine,
component library, testing strategy, and Railway deployment. **Not** covered: database design, API
specification, authentication — none exist in this prototype.

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|------------|
| Hero | One of the three scripted demonstration flows (shirt sales / ticket revenue / department budgets) |
| Follow-up | The second beat of a hero — escalates from *what happened* to *why, and what to do* |
| Intent | A keyword set mapped to a hero or follow-up flow |
| Thinking beat | The fixed staged delay before tiles render; stagecraft, not a query |
| Tile | One card in the dashboard grid |
| Narrative | Pre-authored, verbatim "AI answer" copy rendered under a section header |
| E2-E8 | Epic identifiers from the Build Specification |

---

## 2-3. Technology Stack & Architecture

Full stack table in [`../../input/technologies.md`](../../input/technologies.md). Summary:

| Layer | Choice |
|---|---|
| Framework | React Router 7.13 (framework mode, SSR) + React 19 + Vite 6 |
| Language | TypeScript 5.7, strict mode |
| Styling | Tailwind CSS 4 + design tokens; shadcn/ui where useful |
| Charts | **Hand-built SVG**, ported from the reference build — no charting library |
| Icons | lucide-react |
| Data | Static local seed modules; no database |
| Testing | Vitest + Testing Library + Playwright |
| Deployment | Railway (shareable URL) |

**Not installed:** Prisma, `@prisma/client`, bcryptjs, msw, recharts, `@tanstack/react-table`,
`@react-pdf/renderer`, resend, react-email, all i18next packages. Recorded as expansion path only.

---

## 4. Frontend Architecture

### 4.1 Directory Structure

```
app/
├── root.tsx                    app shell, tokens, global CSS
├── routes/
│   └── _index.tsx              the single dashboard route
├── components/
│   ├── chrome/                 Sidebar, TopBar, HeroBand, PromptBar
│   ├── charts/                 LineChart, BarsGradient, GroupedBars,
│   │                           DonutRefined, HBarsGradient  (hand-built SVG)
│   ├── tiles/                  Card, KpiTile, DeptTable, Recommendation,
│   │                           Narrative, Delta, CompareBar
│   └── heroes/                 Hero1, Hero2, Hero3, HeroSection, SectionHead
├── lib/
│   ├── mock/                   seed datasets (E3) — the swap point for real data
│   ├── repositories/           interfaces the rest of the app reads through
│   ├── dashboard/              session state: the {heroId, phase} list  (US-014)
│   ├── intents/                normalise, score, match, tie-break  (E5)
│   ├── format/                 CHF, %, signed, millions, tabular  (US-011)
│   └── hooks/                  useReducedMotion, useGrow, useCountUp, useUid
└── styles/
    └── tokens.css              the E2 token set — single source
```

### 4.2 Routing Strategy
A **single route**. The prototype has one screen; hero output is inserted into the same grid rather
than navigated to. The sidebar's Reports / Data Sources / Settings items are inert by specification —
they must not be routes.

**The cosmetic sign-in gate adds no route either, deliberately.** It is a state of the root
(`app/root.tsx`), rendered *instead of* the shell while closed, so no path, no navigation and no
revalidation are introduced and the single-route property above still holds. See §7.

### 4.3 State Management Strategy
React state only — no store library, no persistence.

- `App` (`app/root.tsx`) owns: `input` (string), the section list (`{heroId, phase, revision}[]`
  where phase is `primary` or `withFollowUp`), `thinking` (`{message, sources} | null`), `fallback`
  (bool), plus a ref for the pending timeout. **Built in US-014:** the list lives in
  `app/lib/dashboard/` — pure transitions in `sections.ts`, React state in `use-dashboard.ts`
  (`showHero` / `showFollowUp`, each wrapped in `animateReflow`, plus a `focus` signal the section
  component's auto-scroll follows). `revision` is added beyond the reference model so a re-asked
  hero re-inserts in place instead of being a silent no-op. Sections render as direct children of
  the canvas grid and re-use its columns via `grid-cols-subgrid` — one grid, never two.
- Section-level components own their own period filters (hero band, Top Products, Hero 1).
- Each chart owns local hover / grow / count-up state.

Everything else derives from these plus the data constants. **No `localStorage`, no
`sessionStorage`, no IndexedDB** — state resets on reload, which is acceptable and specified.

### 4.4 API Integration
**None.** Data is imported from server-side seed modules through the repository interface. The
running prototype makes no network call of any kind after load — this is a hard demo-day requirement
(E8), verified in US-041.

---

## 5. Backend Architecture

### 5.1 Directory Structure
React Router 7 framework mode places server-only code in the same app. Server modules use the
`.server.ts` suffix so they are excluded from the client bundle: `app/lib/repositories/index.server.ts`
selects the mock implementation.

### 5.2 API Design
**No API.** There are no HTTP endpoints, so `.claude/rules/api-documentation.md`,
`api-versioning.md` and the API status-code matrix in `testing.md` do not engage on any story in this
backlog. If a story ever adds an endpoint, those rules apply in full.

### 5.3 Middleware Stack
**None.** No auth middleware, no rate limiting, no CORS handling — there is nothing to protect and
no cross-origin traffic.

### 5.4 Business Logic Layer

The only real logic is the intent matcher (`app/lib/intents/`):

```
normalise(input)   lowercase → strip punctuation → collapse whitespace → pad with spaces
scoreIntent(text, intent)   +2 per strong keyword present, +1 per weak keyword
matchIntent(text)  highest score above threshold wins
                   threshold: 2 for a hero, 3 for a follow-up
                   ties resolve by intent order: Hero 1 > Hero 2 > Hero 3 > follow-ups
```

The follow-up threshold is deliberately higher so a follow-up cannot steal its parent hero's simpler
phrasings. A chip tap bypasses scoring and resolves directly to its mapped intent.

---

## 6. Database Design

**Not applicable — by specification, not omission.** The Build Specification states: *"No persistence
across sessions. State lives in memory for the duration of a demo run and resets to baseline. No
database is required for the prototype itself."*

Seed data ships as static local modules under `app/lib/mock/`, one object per hero with `primary` and
`followUp` sections so a hero and its escalation cannot drift apart. Introducing Prisma + Postgres
later means implementing the existing repository interface against the database — see
[`../../app/lib/repositories/README.md`](../../../app/lib/repositories/README.md).

---

## 7. Authentication & Authorization

**Not applicable.** One persona, no access model, no accounts, no sessions. A cosmetic login screen
is optional and decorative only. The vision's permission-aware model is Discovery scope
([`../../input/backlog/future.md`](../../input/backlog/future.md) FUT-004).

### 7.1 The cosmetic sign-in gate (built)

The optional screen that clause permits **is now built** and stands in front of the dashboard.
**It is theatre, not a security control**, and must not be mistaken for one:

| Property | Value |
|---|---|
| Source | `app/lib/demo-access.ts` (the credential + check), `app/components/chrome/login-screen.tsx` (the screen) |
| Credential | `demo` / `fcb2026` — **printed on the screen it opens**, committed, and present in the client bundle. Not a secret. |
| Server involvement | **None.** No loader, action, endpoint, status code, cookie, token or hash. §8's empty API table is unchanged. |
| State | Client memory only (`useState` in `app/root.tsx`). Zero `sessionStorage` / `localStorage` / cookie writes, asserted by test. |
| Consequence | **A reload returns to the gate**, because `constraints.md` §2 forbids persistence across sessions and US-043 closed KL-3 by making memory-only literally true of browser storage. This is the accepted cost of gating, not a defect. |
| Naming | The module is `demo-access.ts`, **not** `auth.ts`, so nobody reads it as authentication. |

**Do not "harden" it.** Adding bcrypt, a session cookie or a server action would build the access
model the specification puts out of scope, and would create a real credential surface in a demo that
has no user accounts. `technologies.md` still lists `bcryptjs` and `createCookieSessionStorage` as
expansion-path defaults **not used by the prototype**.

### 7.2 Deployment access gate — HTTP Basic (US-047)

**A different thing entirely from §7.1, and the two must never be confused.** This one keeps the
public Railway URL from being readable by anyone who finds it. It is **infrastructure, not the
product's access model**: still one persona, still no roles, still no accounts. That is why it lives
in `server/` and not in `app/`.

| Property | Value |
|---|---|
| Source | `server/basic-auth.js` (gate + attempt limiter), `server.js` (the server it mounts on) |
| Credential | `SITE_AUTH_USER` / `SITE_AUTH_PASSWORD`, **env only, never committed**. Placeholders in `.env.example`. |
| Scope | **Everything.** Mounted before `express.static`, so `build/client/assets/*.js` is covered too — that bundle carries the seeded figures, so gating only the HTML would have left the content public. |
| Boot behaviour | **Fail-closed.** With `NODE_ENV=production` the server REFUSES TO START without both values. A half-configured pair is an error in every environment. |
| Comparison | Constant-time (`timingSafeEqual`), both halves always compared, length-padded so length does not leak. |
| Brute force | 5 failed attempts per client per 15 min → `429` + `Retry-After`. **Anonymous requests never count** — they are Basic auth's handshake, not attempts. |
| Logging | Outcome and client only. No header, no supplied username, no fragment of either. |
| Tests | `tests/unit/basic-auth.test.ts` — 401 / 429 / pass, lockout, handshake exemption, redaction. |

**Why the server was replaced.** `react-router-serve` is a closed pipeline with nowhere to mount
middleware. `server.js` is a small Express server doing exactly what it did (static assets with the
same cache headers, then the React Router handler) with the gate in front. **Order in `server.js` is
the security property** — anything added later goes below the gate unless it is deliberately public.

**`pnpm start` pins `NODE_ENV=production`** so the deploy cannot boot unprotected even if the
platform does not set it. The Chrome suite therefore runs `node server.js` directly
(`playwright.config.ts`), which is the same process without the mandatory gate.

---

## 8. API Specification

**Not applicable.** See §5.2.

---

## 9. Testing Strategy

With no API surface and no database, the usual status-matrix and integration-test requirements do not
engage. Effort concentrates where the risk actually is.

**Unit tests (Vitest)** — the highest-value tests in this project:
- `normalise` / `scoreIntent` / `matchIntent`: several paraphrases per hero, threshold boundaries,
  the deterministic tie-break, single-common-word input, gibberish
- Formatters: CHF, percentage, signed variance, millions
- `badgeSegs` rounding correction — parts must sum exactly to the total
- Dataset reconciliation: cross-hero figures agree; percentages match absolutes

**Component tests (Testing Library):**
- Tiles render from E3-shaped props with no live computation
- Reduced-motion path renders every animated value at final state

**E2E (Playwright)** — the demo script itself:
- Each hero start-to-follow-up; follow-up requested before its parent; off-script input; empty input;
  reset mid-flow; reset repeatedly; rapid repeated submits
- Offline: disconnect the network after load and run the full script (US-041)

**Coverage target:** ≥80% per `.claude/rules/testing.md`.

**Structure:** `tests/unit/`, `tests/e2e/`.

---

## 10. Deployment

**Platform:** Railway. The deployed shareable URL **is the deliverable** — it is sent to the internal
sponsor and opened in the owner meeting.

- Build: `pnpm build` → `@react-router/serve` in production
- **No environment variables are required** for the prototype to run
- No database provisioned
- Cold-start load in Chrome must be clean (US-045)
- Health check: the root route returns the baseline dashboard

---

## 11. Performance Requirements

| Metric | Target |
|--------|--------|
| Renders at 1920×1080 | No horizontal scroll, legible from a room |
| Tile insertion animation | ~400ms fade-and-rise, no flicker or layout jump |
| Thinking beat | Fixed ~600-1200ms (reference: ~1150ms; ~260ms under reduced motion) |
| Count-up animation | ~900ms cubic ease-out from the *current* displayed value |
| Runtime network calls after load | **Zero** |

Standard web-performance targets (FCP, TTI, API p95, query p95) are not meaningful here: the payload
is static, bundled, and served from one route with no data fetching.

---

## 12. Monitoring & Logging

**Not applicable.** A single-session demo artefact with no backend, no accounts and no persistence
has nothing to monitor. No Sentry, no structured logging, no metrics. Console must be **error-free**
in Chrome (US-045) — that is the whole observability requirement.

---

## 13. Development Workflow

**Standards:** `.claude/rules/code-quality.md` (SOLID, DRY) · `.claude/rules/git.md` (conventional
commits, no AI credits) · `.claude/rules/testing.md`.

Given the one-week deadline and a single developer plus agent, the branch-and-PR ceremony is
compressed: implement → test → lint → commit. `/holycode-pm:execute-work` enforces the quality gate
per story.

---

## 14. Appendices

### A. Environment Variables
**None.** Deliberate — the prototype must run with no configuration and no network.

### B. Third-Party Services
**None at runtime.** Railway (hosting) is the only external service, and only at deploy time. The
club CDN is used **once, at build time**, to obtain the crest — which is then self-hosted.

### C. References
- [Architecture](architecture.md) · [PRD](prd.md)
- [Scope](../../input/scope.md) · [Constraints](../../input/constraints.md) · [Technologies](../../input/technologies.md)
- [Backlog index](../../input/backlog/README.md)

---

**Document Owner:** Developer
**Last Updated:** 2026-09-09
