# Phase 1a: Project Setup & Design System

**Goal:** Stand up the project and its Railway deployment, then build the design token foundation
(E2) that every later epic references rather than restates.
**Duration:** Day 1 (of a one-week build)
**Total Stories:** 6
**Total Points:** 14
**Status:** In Progress (4/6 completed)

> **Global guardrails apply to every story here** — see [`../constraints.md`](../constraints.md) §2.
> No integration, no runtime model, no auth, no persistence, no salary/named-individual data.

---

## Epic 1: Project Setup & Deployment

**Priority:** P0
**Total Story Points:** 5
**Status:** Completed (2/2 completed)
**Source:** Developer-owned; deliberately outside the Build Specification.

### Stories:

- **US-001**: Environment & deployment setup
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [DevOps]
  - **Owner:** Human+AI
  - **Status:** Completed
  - **Description:** Stand up the React Router 7 app, the repository, and a Railway deployment
    producing the shareable URL the prototype is delivered on.
  - **Acceptance Criteria:**
    - ✅ React Router 7 (framework mode, SSR) app scaffolds and runs locally
    - ⏸️ Deployed to Railway on a shareable URL that loads cleanly in Chrome — **deferred, human
      step** (no Railway account access from the AI session; the repo is deploy-ready)
    - ✅ Production build succeeds from a clean checkout
    - ✅ No environment variable is required for the prototype to run
    - ✅ No database is provisioned
  - **Dependencies:** None
  - **Notes:** ~2-4 h. The URL is the deliverable — it is sent to the sponsor and opened in the meeting.
    Deploy config is committed (`railway.json`, `build`/`start` scripts); the human runs
    `railway init && railway up` to produce the URL.

- **US-002**: Developer tooling & local DX
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [DevOps]
  - **Owner:** AI
  - **Status:** Completed
  - **Description:** Scripts and quality tooling so the one-week build stays fast and clean.
  - **Acceptance Criteria:**
    - ✅ `dev`, `build`, `start`, `lint`, `format`, `test` scripts all work
    - ✅ ESLint 9 flat config + Prettier with `prettier-plugin-tailwindcss`
    - ✅ husky + lint-staged run lint/format on commit
    - ✅ TypeScript strict mode passes with no errors
  - **Dependencies:** US-001
  - **Notes:** ~1-2 h. `eslint-config-prettier` is applied last so ESLint never argues with Prettier
    over formatting. Prettier skips `.project-management/`, `.claude/` and `CLAUDE.md` — those docs
    carry their own line-count limits.

---

## Epic 2: E2 — FCB Brand Theming & Design System *(foundation)*

**Priority:** P0
**Total Story Points:** 9
**Status:** In Progress (2/4 completed)
**Source:** Build Specification E2; Reference Implementation Guide §4.

> Getting this right is most of what sells the illusion to an audience that knows FC Basel
> intimately. This is a foundation epic, not a finishing pass. E4-E8 reference these tokens.

### Stories:

- **US-003**: Design token set
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Completed
  - **Description:** A single token set — colours, type scale, spacing, radii, shadows, motion —
    applied consistently across shell, tiles and charts. No other colours may be introduced.
  - **Acceptance Criteria:**
    - ✅ Colour tokens defined exactly: red `#D3010C`, redVivid `#FF1433`, blue `#004093`,
      navy `#0E2356`, gold `#FBD500`, bg `#FFFFFF`, surface, border, text, muted, pos, neg
    - ✅ Typography: Helvetica Neue / Arial / system stack; 400 body, 700 bold; headings and tile
      titles uppercase, weight 700, letter-spacing ~0.04em
    - ✅ Type scale: tile title 13px, KPI number 30px/700, chart axis 12px, body 14px, caption 13px
    - ✅ **Colour discipline enforced:** red and blue carry series identity; variance uses only
      pos/neg tokens plus an explicit sign and arrow; red never means "bad"
    - ✅ Gold appears only as target-hit marks and the follow-up accent (see US-006 — no new-tile ring)
    - ✅ A design needing a colour outside the set is not permitted — choose the nearest token
  - **Dependencies:** US-001
  - **Notes:** Where the Build Specification and the Reference Guide disagree on a hex value, the
    Guide wins (see [`../scope.md`](../scope.md) §10). Divergences: surface, text, pos.
    Delivered as `app/app.css` (`@theme static`) + `app/lib/tokens.ts`, kept in lockstep by a
    parity test. Guide values used: surface `#F1F4F9`, text `#161A20`, pos `#0E9F6E`.

- **US-004**: Self-hosted FCB crest
  - **Story Points:** 1
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Completed
  - **Description:** Download the genuine club crest and self-host it in the project.
  - **Acceptance Criteria:**
    - ✅ Crest downloaded from the club source asset and committed to the repo
    - ✅ Rendered top-left in the app bar at ~32px height
    - ✅ **No runtime request to the club CDN** — verified with the network disconnected
  - **Dependencies:** US-001
  - **Notes:** Replaces the reference build's placeholder `Monogram`. Trademarked asset; self-host,
    never hotlink — this also removes a CORS and availability risk during the demo.
    The club's `logo.webp` URL serves **PNG** bytes, so the asset is committed under its real format
    as `public/fcb-crest.png`, downsampled 608x648 → 120x128 with `sips` (194 KB → 17.9 KB, no new
    dependency) and stripped of all ancillary chunks. Rendered by `Crest`
    (`app/components/chrome/crest.tsx`) in a minimal `<header>` in `app/root.tsx`; the full app bar
    remains US-012.

- **US-005**: Tile card anatomy
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** One reusable card shell every tile in the product uses.
  - **Acceptance Criteria:**
    - White background, 1px border token, 12px radius, subtle layered shadow, 20px internal padding
    - Top: uppercase title + optional period/subtitle in muted; optional icon badge; optional
      right-hand action slot (used by period filters and badges); optional 3px top accent bar
    - Bottom (optional): the narrative caption strip, one line, muted, prefixed with an AI glyph
    - Defined once and reused — no per-hero copies
  - **Dependencies:** US-003

- **US-006**: Tile-insertion motion & reduced-motion support
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** The insertion animation and motion primitives that make the dashboard visibly
    grow on command. This choreography is most of the "wow".
  - **Acceptance Criteria:**
    - New tiles fade in and rise ~12px over ~400ms with a gentle ease
    - The grid reflows smoothly — existing tiles animate to new positions, never jump
    - Keyframes defined for entrance, accent glow, thinking scan line, source-chip reveal
    - `prefers-reduced-motion` honoured: every animated value renders at its final state immediately
    - No animation can leave an element stuck at zero when reduced motion is set
  - **Dependencies:** US-003
  - **Notes:** **Resolved conflict (2026-09-09) — no gold ring.** The Specification's E2 acceptance
    criteria require a ~1.5s gold highlight ring on newly inserted tiles; the Reference Guide
    explicitly removed it in favour of fade-and-rise only. The documented precedence rule applies
    (Guide + JSX govern the experience — [`../scope.md`](../scope.md) §10), so build fade-and-rise.
    Do not reintroduce the ring from the spec text. Gold therefore appears only as target-hit marks
    and the follow-up accent.

---

## Phase Summary

**Total Epics:** 2 | **Total Stories:** 6 | **Total Points:** 14

**By Priority:** P0: 6 stories, 14 points · P1: 0 · P2: 0

**By Status:** ✅ 4 stories, 9 points · 🔄 0 · 📋 2 stories, 5 points · ⏸️ 0

---

**Navigation:**
[← Master Index](README.md) · [Next Phase →](phase-1b-seed-data.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
