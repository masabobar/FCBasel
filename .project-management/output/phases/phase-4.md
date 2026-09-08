# Phase 4: Demo Hardening & Polish

**Duration:** 2026-09-14 to 2026-09-15 (~6.0 AI-hours)
**Status:** Planning
**Started:** —
**Target Completion:** 2026-09-15
**Actual Completion:** —

> **Acceptance criteria live in** [`../../input/backlog/phase-4-polish.md`](../../input/backlog/phase-4-polish.md).
> This file tracks execution.

---

## Phase Goal

Turn a working prototype into one that survives a live, high-stakes room — sized for a projector,
smooth, dead-end-proof, and independent of any network mid-demo.

**Success Criteria:**
- Renders correctly and legibly at 1920×1080 with no horizontal scroll
- Fully functional with the **network disconnected** after load
- Every path verified dead-end-free: each hero, each follow-up, off-script, empty input, reset
- Transitions smooth with no flicker or layout jump on the demo hardware
- Brand fidelity confirmed against the token set; gold used only as specified
- Runs cleanly in Chrome with **no console errors**

---

## Epics in This Phase

### Epic 8: E8 — Demo Hardening & Polish (14 story points)

**Priority:** P0 (US-043, US-045 are P1) · **Status:** Todo · **Dependencies:** all prior phases

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-040 | Presentation sizing & responsiveness | 2 | P0 | 📋 Todo |
| US-041 | Offline resilience verification | 2 | P0 | 📋 Todo |
| US-042 | Dead-end path sweep | 3 | P0 | 📋 Todo |
| US-043 | Transition & timing polish | 3 | **P1** | 📋 Todo |
| US-044 | Brand fidelity & legibility QA | 2 | P0 | 📋 Todo |
| US-045 | Chrome demo run-through & stability | 2 | **P1** | 📋 Todo |

**Technical Notes:**

- **Not in this phase:** new functionality, or anything that changes a hero's content. If a gap in a
  hero surfaces here, it is a Phase 3b change, tracked as such.
- **US-041 is verified by actually disconnecting the network** and running the full demo script — not
  by inspecting the code for fetch calls. Venue Wi-Fi failing mid-demo is the failure mode that most
  threatens the meeting, and the prototype's whole data architecture exists to make it survivable.
- **US-044 checks the dash convention:** no em or en dashes anywhere, including narrative strings and
  the score label (`FCB 2-1 Sion`). This is a deliberate house-style decision from the Reference Guide.
- Legibility from a room is a real constraint, not a nicety: a projector washes out subtle greys, so
  borders and type must hold up. Variance carries sign and arrow so colour is never the sole signal.
- **US-043 and US-045 are the first two items in the documented cut order.** Compress before dropping
  — a rehearsal that catches one broken path is worth more than its two points suggest.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Verification performed against the **running deployed app**, not only locally
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix · i18n.

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 1
- **Estimated Effort:** ~20 team-hours → ~6.0 AI-core hours
- **Risk Level:** Medium — the phase most likely to be compressed by upstream slippage

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 0 / 14 (0%)
- **Completed Stories:** 0 / 6
- **Tests Passing:** 0 / 0 · **Coverage:** 0% · **Commits:** 0

---

## Dependencies

**Depends On:** every prior phase. Hardening can only verify flows that exist — US-041 and US-042 in
particular need all three heroes and both fallback paths complete (US-039).

**Blocks:** the sponsor showing. This phase is the gate between "it works on my machine" and "it can
be put in front of the owner".

**External:** the deployed Railway URL must be live for US-045's cold-start check.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Phase compressed because upstream slipped | High | Medium | Extend daily runtime rather than cutting — the whole P1 set is only 0.82 days at 8h/day | Human | Open |
| A runtime fetch survives review and breaks the offline demo | High | Low | US-041 verifies by disconnecting, not by inspection | AI | Open |
| An untested path dead-ends live | High | Low | US-042 sweeps every path incl. the most off-script input imaginable | AI | Open |
| Transition stutters on the actual demo machine | Medium | Medium | US-043 tunes on target hardware, not the dev machine | AI | Open |
| Projector washes out variance colours | Medium | Medium | Sign and arrow carry the meaning; verified in US-044 | AI | Open |

---

## Progress Log

_Entries appear here as `/execute-work` completes stories._

---

## Definition of "Demo Ready"

The phase — and the prototype — is complete when a presenter can open the shareable URL on the demo
machine, with Wi-Fi switched off, and run: baseline → three heroes → three follow-ups → off-script
question → reset, with no stutter, no error, and no dead end.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** Planning
**Previous:** [Phase 3b](phase-3b.md) · **Backlog:** [Master Index](../../input/backlog/README.md)
