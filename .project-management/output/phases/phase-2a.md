# Phase 2a: Dashboard Shell & Persona Baseline

**Duration:** 2026-09-10 to 2026-09-11 (~8.1 AI-hours)
**Status:** Planning
**Started:** —
**Target Completion:** 2026-09-11
**Actual Completion:** —

> **Acceptance criteria live in** [`../../input/backlog/phase-2a-shell.md`](../../input/backlog/phase-2a-shell.md).
> This file tracks execution.

---

## Phase Goal

Build the frame the whole demo lives in: the branded shell, the persona identity, the pre-populated
baseline dashboard, and the insertion mechanic that makes the dashboard visibly grow when a question
is asked.

**Success Criteria:**
- On load the canvas shows a dashboard that already looks lived-in — not an empty canvas
- Hero tiles insert into the **same** grid; the dashboard grows and never clears
- Reset restores the baseline and the initial chip state with no residual state
- No horizontal scroll and legible sizing at 1920×1080

---

## Epics in This Phase

### Epic 4: E4 — Dashboard Shell & Persona Baseline (16 story points)

**Priority:** P0 (US-016 is P1) · **Status:** Todo · **Dependencies:** US-003, US-004, US-005, US-007

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-012 | Branded application shell | 3 | P0 | 📋 Todo |
| US-013 | Baseline dashboard — four pre-existing tiles | 3 | P0 | 📋 Todo |
| US-014 | Dynamic tile insertion & grid reflow | 3 | P0 | 📋 Todo |
| US-015 | Reset to baseline | 2 | P0 | 📋 Todo |
| US-016 | Hero band — webshop trend & attendance ring | 5 | **P1** | 📋 Todo |

**Technical Notes:**

- **The dashboard grows, it never clears.** This single behaviour is what makes the product read as
  "the system added this to my dashboard" rather than "a page navigated". It is the mechanic the
  client's own framing describes.
- **The persona is a role, not a person:** workspace label "Sales & Marketing", avatar initials "SM".
  No real or realistic individual name anywhere — this keeps clear of the salary/named-individual
  guardrail and avoids colliding with a real employee.
- Sidebar items Reports / Data Sources / Settings are **deliberately inert** — dimmed, no hover
  affordance, no navigation. They imply a fuller product without pretending to be one. Do not wire
  them to routes.
- Re-asking the same hero **refreshes in place** (dedupe by hero id), never duplicates tiles.
- Grid state is an in-memory list of tile descriptors. No persistence, by specification.
- **US-016 is first in the cut order.** It is a Reference Guide refinement beyond the Specification;
  it makes the frame richer but is not one of the three demonstrations.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md`
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated
- [ ] Screen map refreshed if the story changes the single screen's structure

*Not applicable:* API status-code matrix · i18n.

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 16 · **Stories:** 5 · **Epics:** 1
- **Estimated Effort:** ~27 team-hours → ~8.1 AI-core hours
- **Risk Level:** Medium — US-014's reflow behaviour is where visual polish is won or lost

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 0 / 16 (0%)
- **Completed Stories:** 0 / 5
- **Tests Passing:** 0 / 0 · **Coverage:** 0% · **Commits:** 0

---

## Dependencies

**Depends On:**
- US-003 tokens, US-004 crest, US-005 card shell, US-006 insertion motion (Phase 1a)
- US-007 baseline datasets (Phase 1b)
- US-021 horizontal bar tile — **needed by US-013** for Top Products
- US-025, US-026, US-027 — **needed by US-016** for the hero band

**Blocks:** US-033 (follow-up gating) needs US-014's insertion mechanic.

> ⚠️ **Sequencing note:** US-013 and US-016 have dependencies that live in Phase 2b. If Phase 2a runs
> strictly before 2b, build US-012, US-014 and US-015 first and complete US-013/US-016 after the
> relevant components exist — or pull US-021/US-025/US-026/US-027 forward.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Grid jumps instead of reflowing when tiles insert | High | Medium | Existing tiles animate to new positions; verified in US-043 polish | AI | Open |
| Reset mid-flow leaves an orphaned timeout or animation | Medium | Medium | Reset clears the pending timeout ref; verified in US-042 and US-045 | AI | Open |
| Cross-phase dependency stalls US-013 / US-016 | Medium | High | See sequencing note above — reorder within the phase rather than blocking | AI | Open |
| Horizontal scroll appears at 1080p | High | Low | Responsive 12-column grid; verified in US-040 | AI | Open |

---

## Progress Log

_Entries appear here as `/execute-work` completes stories._

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** Planning
**Previous:** [Phase 1b](phase-1b.md) · **Next:** [Phase 2b — Components](phase-2b.md)
