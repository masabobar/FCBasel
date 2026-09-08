# Phase 1b: Dummy Data Model & Seed Datasets

**Duration:** 2026-09-09 to 2026-09-10 (~4.5 AI-hours)
**Status:** Planning
**Started:** —
**Target Completion:** 2026-09-10
**Actual Completion:** —

> **Acceptance criteria live in** [`../../input/backlog/phase-1b-seed-data.md`](../../input/backlog/phase-1b-seed-data.md).
> This file tracks execution.

---

## Phase Goal

Build the single source of truth for every figure in the prototype — seeded locally, grounded in
verified FCB facts, and internally reconciled so nothing jars to someone who knows the club.

**Success Criteria:**
- Every figure the prototype will ever display exists in these datasets; no component invents numbers
- Each hero is one object with `primary` and `followUp`, so a hero and its escalation cannot drift
- All data is bundled locally — the running prototype makes no data network call
- Splits, percentages and absolutes reconcile; a figure used twice is stored once and referenced

---

## Epics in This Phase

### Epic 3: E3 — Dummy Data Model & Seed Datasets (10 story points) *(foundation)*

**Priority:** P0 · **Status:** Todo · **Dependencies:** US-001

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-007 | Persona baseline datasets (4 tiles) | 2 | 📋 Todo |
| US-008 | Hero 1 dataset — shirt sales, badges, printed names | 2 | 📋 Todo |
| US-009 | Hero 2 dataset — ticket revenue year on year | 2 | 📋 Todo |
| US-010 | Hero 3 dataset — departmental performance | 2 | 📋 Todo |
| US-011 | Formatters & cross-hero reconciliation | 2 | 📋 Todo |

**Technical Notes:**

- **Scope differences between heroes are intentional and must be labelled on the tile.** Hero 1 is
  season-to-date merchandising; Hero 2 is matchday revenue per home fixture (excluding the
  season-ticket base); Hero 3 is full-year departmental totals whose Ticketing figure *includes*
  season tickets — so it legitimately exceeds the sum of Hero 2's fixtures. Unlabelled, this reads as
  a bug to anyone checking the arithmetic in the room.
- **Revenue vs Cost tagging in Hero 3 is load-bearing:** above budget is good for a revenue
  department and an overspend for the Marketing cost centre. Marketing is the single department both
  over budget *and* behind target — that is the case the causal follow-up interrogates.
- Derived values (webshop total and delta, kit revenue at CHF 99, badge segments from the percentage
  split) are **computed**, not stored, so a number can never disagree with its own chart.
- `badgeSegs` must correct rounding so the four sponsor segments sum exactly to the total.
- **Guardrail:** no salary and no named-individual performance data in any dataset. Squad names
  (Shaqiri, Sow, Metinho, Daniliuc) appear only as shirt-print counts — merchandising data about
  public figures, not performance data.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md`
- [ ] Unit tests cover reconciliation and formatter behaviour; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix (no endpoints) · i18n (English only) · database migrations
(no database — see `.claude/rules/database.md` for the expansion path only).

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 10 · **Stories:** 5 · **Epics:** 1
- **Estimated Effort:** ~15 team-hours → ~4.5 AI-core hours
- **Risk Level:** Low (mechanical work — every figure is pinned in the specification)

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 0 / 10 (0%)
- **Completed Stories:** 0 / 5
- **Tests Passing:** 0 / 0 · **Coverage:** 0% · **Commits:** 0

---

## Dependencies

**Depends On:** US-001 (project scaffold). Does **not** depend on Phase 1a's design tokens — data and
tokens are independent, so 1a and 1b could run in parallel if capacity allowed.

**Blocks:**
- US-013 (baseline dashboard) needs US-007
- Every hero in Phase 3b needs its matching dataset (US-008 / US-009 / US-010)
- US-011 formatters are consumed by every tile in Phase 2b

**External:** none.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Figures re-typed in a component instead of referenced | High | Medium | US-011 enforces store-once-reference-everywhere; a figure in two tiles must come from one constant | AI | Open |
| Cross-hero totals appear contradictory in the room | High | Medium | Scope labels on every affected tile (see Technical Notes) | AI | Open |
| Rounding makes segments not sum to the total | Medium | Medium | `badgeSegs` corrects the remainder explicitly | AI | Open |
| Narrative copy edited and figures no longer match | High | Low | Narratives are verbatim and live beside the figures in the same hero object | AI | Open |

---

## Progress Log

_Entries appear here as `/execute-work` completes stories._

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** Planning
**Previous:** [Phase 1a](phase-1a.md) · **Next:** [Phase 2a — Shell](phase-2a.md)
