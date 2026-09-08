# Phase 1a: Project Setup & Design System

**Duration:** 2026-09-09 to 2026-09-09 (~5.8 AI-hours)
**Status:** Planning
**Started:** —
**Target Completion:** 2026-09-09
**Actual Completion:** —

> **Single source of truth for acceptance criteria:** the backlog file
> [`../../input/backlog/phase-1a-setup-design-system.md`](../../input/backlog/phase-1a-setup-design-system.md).
> This file tracks *execution* — status, notes, metrics. Criteria are not duplicated here, to avoid
> the two drifting apart.

---

## Phase Goal

Stand up the project and its Railway deployment, then build the design token foundation (E2) that
every later epic references rather than restates.

**Success Criteria:**
- A shareable Railway URL loads the app cleanly in Chrome
- A single token set exists and is the only source of colour, type, spacing, radii and motion
- The genuine FCB crest is self-hosted and rendered in the app bar
- The tile card shell and insertion animation are defined once and reused everywhere after

---

## Epics in This Phase

### Epic 1: Project Setup & Deployment (5 story points)

**Priority:** P0 · **Status:** Todo · **Dependencies:** none

| Story | Title | Pts | Owner | Status |
|---|---|---:|---|---|
| US-001 | Environment & deployment setup | 3 | Human+AI | 📋 Todo |
| US-002 | Developer tooling & local DX | 2 | AI | 📋 Todo |

**Technical Notes:**
- React Router 7 framework mode with SSR; `@react-router/serve` in production
- **No environment variables and no database** — the app must run with zero configuration
- US-001 is the source of the infra figure in the effort estimate (~3 h)

### Epic 2: E2 — FCB Brand Theming & Design System (9 story points) *(foundation)*

**Priority:** P0 · **Status:** Todo · **Dependencies:** US-001

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-003 | Design token set | 3 | 📋 Todo |
| US-004 | Self-hosted FCB crest | 1 | 📋 Todo |
| US-005 | Tile card anatomy | 2 | 📋 Todo |
| US-006 | Tile-insertion motion & reduced-motion support | 3 | 📋 Todo |

**Technical Notes:**
- **Colour discipline is non-negotiable:** red and blue carry series identity; variance uses only the
  positive/negative tokens *plus* an explicit sign and arrow; red never means "bad", because red is
  the club's hero colour. Gold is an accent only.
- **Resolved conflict (US-006):** the Specification requires a ~1.5s gold ring on newly inserted
  tiles; the Reference Guide removed it. Guide precedence applies — **build fade-and-rise, no ring**.
- Where the Specification and the Guide disagree on a hex value, the Guide wins. Known divergences:
  surface, text, positive-variance.
- The crest is trademarked: download, commit, self-host. Never hotlink — this also removes a
  CORS/availability risk during the demo.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md` (SOLID, DRY)
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean
- [ ] Git commit created per `.claude/rules/git.md` (conventional, no AI credits)
- [ ] Progress tracking updated

*Not applicable this project:* API status-code matrix (no endpoints) · i18n translations (English only).

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 2
- **Estimated Effort:** ~19.5 team-hours → ~5.8 AI-core hours
- **Risk Level:** Low

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 0 / 14 (0%)
- **Completed Stories:** 0 / 6
- **Tests Passing:** 0 / 0
- **Code Coverage:** 0%
- **Commits:** 0

---

## Dependencies

**Depends On:** nothing — this is the first phase.

**Blocks:**
- **Everything.** E2 tokens are consumed by E4, E6, E7 and E8; no visual work can start before US-003.
- US-005 (card shell) blocks the entire component library in Phase 2b.
- US-006 (insertion motion) blocks US-014 (dynamic tile insertion).

**External:** Railway account and project (US-001); the club crest source asset (US-004).

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Railway setup consumes more than the ~3 h budgeted | Medium | Low | Zero-config app: no env vars, no database, no migrations | Human+AI | Open |
| Crest asset unavailable or format-awkward | Medium | Low | Self-host from the committed copy; the build must never depend on the live CDN | AI | Open |
| Token drift — a colour introduced outside the set | High | Medium | Not permitted by spec; choose the nearest token. Verified in US-044 brand QA | AI | Open |
| Reduced-motion path leaves a value stuck at zero | Medium | Medium | Grow hook returns `true` immediately under reduced motion | AI | Open |

---

## Progress Log

_Entries appear here as `/execute-work` completes stories._

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** Planning
**Next Phase:** [Phase 1b — Seed Data](phase-1b.md)
