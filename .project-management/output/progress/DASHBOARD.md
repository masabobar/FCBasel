# 📊 Project Dashboard

**Last Updated:** 2026-09-09
**Current Phase:** Phase 1b - Seed Data *(Phase 1a complete)*

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 12% | 100% | 🟢 On Track |
| **Phase 1a** | 100% — Completed | 100% | 🟢 Done |
| **Stories Completed** | 6/45 | 45 | 🟢 On Track |
| **Story Points Done** | 14/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-09)

**Stories Completed Today:** 6
**Currently Working On:** None — Phase 1a complete
**Story Points Completed Today:** 14

- ✅ **US-001 — Environment & deployment setup (3 pts)** — React Router 7 SSR scaffold; clean-checkout
  `install` / `build` / `start` all verified. One AC deferred: the Railway deploy is a human step.
- ✅ **US-002 — Developer tooling & local DX (2 pts)** — ESLint 9 flat config, Prettier with Tailwind
  class sorting, husky + lint-staged. Pre-commit hook proven with real throwaway commits.
- ✅ **US-003 — Design token set (3 pts)** — one token set published as Tailwind v4 `@theme static`
  custom properties and a typed TS object, held in lockstep by a CSS↔TS parity test. Colour
  discipline encoded in the token names, not just documented.
- ✅ **US-004 — Self-hosted FCB crest (1 pt)** — the club's `logo.webp` is actually a PNG; verified by
  its bytes, downsampled 608x648 → 120x128 with `sips` (194 KB → 17.9 KB, no new dependency),
  metadata chunks stripped. Served from `public/`; build and running server contain zero `fcb.ch`
  references.
- ✅ **US-005 — Tile card anatomy (2 pts)** — one `Card` shell (plus its narrative caption strip) that
  every Phase 2b tile and Phase 3b hero composes. Slots, not variants; `accent` takes a token name so
  no hex can reach a tile. Entrance hooks only — US-006 owns the motion, and there is no gold ring.
- ✅ **US-006 — Tile-insertion motion & reduced-motion support (3 pts)** — the four reveal keyframes
  (`fcbUp`, `fcbGlow`, `fcbScan`, `fcbSrc`) defined once, timed from motion tokens, wired to the card's
  existing `isNew`/`delayMs` hooks. Fade-and-rise only, no gold ring. Reduced motion *collapses*
  animations to a ~1ms final frame rather than removing them, so nothing is stranded at zero.

---

## 🏁 Phase 1a complete — next: Phase 1b, Seed Data

**Phase 1a goal (met):** stand up the project and build the design token foundation (E2) that every
later epic references.
**Duration:** 2026-09-09 to 2026-09-09 (~5.8 AI-hours)
**Progress:** 100% (6/6 stories · 14/14 points)

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| — none; Phase 1b (Seed Data) is next | ⏸️ Not started | 0% |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
| US-006: Tile-insertion motion & reduced-motion support | 2026-09-09 | 3 |
| US-005: Tile card anatomy | 2026-09-09 | 2 |
| US-004: Self-hosted FCB crest | 2026-09-09 | 1 |
| US-003: Design token set | 2026-09-09 | 3 |
| US-002: Developer tooling & local DX | 2026-09-09 | 2 |
| US-001: Environment & deployment setup | 2026-09-09 | 3 |

---

## ⚠️ Active Blockers

✅ No active blockers

**Open human step (not a blocker):** the Railway deploy for US-001. The repo is deploy-ready —
run `railway login && railway init && railway up`, then record the shareable URL.

---

## 📈 Velocity & Timeline

**Current Velocity:** - points/day
**Average Velocity:** - points/day
**Velocity Trend:** N/A (insufficient data)

**Projected Completion:** 2026-09-15 (8h/day) · 2026-09-11 (24/7)
**Target Completion:** end of this week — sponsor showing follows
**Timeline Status:** 🟢 On Track

> ⚠️ One scenario misses: at **8h/day weekdays only**, AI-realistic lands 2026-09-20, past the
> deadline. The lever is hours per day, not scope — the entire P1 cut set is worth only 0.82 days.

---

## 🧪 Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage (`app/**`) | 100% stmts / 97.6% branches | 80% | 🟢 Good |
| Passing Tests | 181/181 | TBD | 🟢 Good |
| TypeScript Errors (strict) | 0 | 0 | 🟢 Good |
| ESLint Problems | 0 errors, 0 warnings | 0 errors | 🟢 Good |
| Dependency Advisories | 0 | 0 high/critical | 🟢 Good |
| Open Bugs | 0 | < 5 | 🟢 Good |

> Coverage is measured over `app/**` only. The surface is still small (46 statements), but the suite
> is substantive rather than hollow: it pins every hex, the type scale and the colour discipline,
> fails the build if `app/app.css` and `app/lib/tokens.ts` ever disagree, and — since US-006 —
> asserts structurally that no reduced-motion path can leave an element stranded at zero. Since
> US-002 the gate is three-part: strict `tsc`, ESLint 9 flat config, and Prettier — the last two
> enforced on every commit by husky + lint-staged.

---

## 📊 Phase Breakdown

| Phase | Status | Stories | Points | Progress |
|-------|--------|---------|--------|----------|
| Phase 1a: Setup & Design System | ✅ Completed | 6/6 | 14/14 | 100% |
| Phase 1b: Seed Data | 🔄 Active | 0/5 | 0/10 | 0% |
| Phase 2a: Shell & Baseline | ⏸️ Pending | 0/5 | 0/16 | 0% |
| Phase 2b: Component Library | ⏸️ Pending | 0/11 | 0/29 | 0% |
| Phase 3a: Conversation | ⏸️ Pending | 0/6 | 0/17 | 0% |
| Phase 3b: Heroes | ⏸️ Pending | 0/6 | 0/16 | 0% |
| Phase 4: Hardening | ⏸️ Pending | 0/6 | 0/14 | 0% |

---

## 🔗 Quick Links

- **[Next Phase Plan](../phases/phase-1b.md)** - Phase 1b, Seed Data
- **[Phase 1a Plan](../phases/phase-1a.md)** - Completed 2026-09-09
- **[Backlog](../../input/backlog/)** - All project backlogs
- **[Detailed Status](current-status.md)** - Full status report
- **[Completed Work](completed.md)** - Complete history
- **[Blockers](blockers.md)** - All blockers
- **[Effort Estimate](../reports/ai-hours-estimate-2026-09-09.md)** - AI-hours projection

---

**💡 Tip:** This file updates automatically during `/execute-work`. Just refresh to see latest progress!

**Last Auto-Update:** US-006 completed at 2026-09-09 — Phase 1a closed
