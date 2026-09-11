# Project Backlog — Master Index

**Project:** FC Basel — Intelligence Platform Prototype
**Last Updated:** 2026-09-09
**Derived from:** Build Specification (E2-E8) + Project Framing, Brief, Goals & Rules +
Reference Implementation Guide + reference JSX

---

## ⚠️ Global guardrails — every story inherits these

No epic overrides them. Full detail in [`../constraints.md`](../constraints.md) §2.

- **No real system integration** — nothing connects to SAP, webshop, HR, ticketing or any live source
- **No real AI or LLM at runtime** — keyword matching over pre-authored responses; *do not "upgrade"
  this to call a live model*
- **No real permissions or authentication** — one persona
- **No live data** — the thinking delay is stagecraft, not a query
- **No persistence** — memory-only, resets to baseline; no database
- **No salary or named-individual performance data, anywhere**
- **Not a slice of the real platform** — outputs must never imply the hard problems are solved
- **English only** — no i18n; narrative copy is hand-authored and verbatim

---

## 📊 Summary Statistics

**Total Epics:** 8 · **Total Stories:** 45 · **Total Story Points:** 116

**By Phase:**

| Phase | Epics | Stories | Points |
|---|---|---|---|
| 1a — Setup & Design System | Setup, E2 | 6 | 14 |
| 1b — Seed Data | E3 | 5 | 10 |
| 2a — Shell | E4 | 5 | 16 |
| 2b — Components | E6 | 11 | 29 |
| 3a — Conversation | E5 | 6 | 17 |
| 3b — Heroes | E7 | 6 | 16 |
| 4 — Hardening | E8 | 6 | 14 |
| Future | — | 9 items | not estimated |

**By Priority:** P0 (Must Have): 41 stories, 104 points · P1 (Should Have): 4 stories, 12 points ·
P2: 0

---

## 📁 Phase Backlogs

### [Phase 1a: Project Setup & Design System](phase-1a-setup-design-system.md)
**Goal:** Stand up project + Railway deployment, then the design token foundation (E2) that every
later epic references.
**Stories:** 6 | **Points:** 14 | **Status:** ✅ Completed (6/6) — US-001's Railway deploy AC remains
a human step

### [Phase 1b: Dummy Data Model & Seed Datasets](phase-1b-seed-data.md)
**Goal:** The single source of truth for every figure in the prototype (E3), grounded in verified
FCB facts and bundled locally.
**Stories:** 5 | **Points:** 10 | **Status:** ✅ Completed (5/5) — 2026-09-09

### [Phase 2a: Dashboard Shell & Persona Baseline](phase-2a-shell.md)
**Goal:** The branded shell, the lived-in baseline dashboard, and the insertion mechanic that makes
the dashboard *grow* rather than clear.
**Stories:** 5 | **Points:** 16 | **Status:** ✅ Completed (5/5) — 2026-09-09

### [Phase 2b: Chart & Tile Component Library](phase-2b-components.md)
**Goal:** The eight reusable component types the heroes are composed from — stateless, token-styled,
fed from E3.
**Stories:** 11 | **Points:** 29 | **Status:** ✅ Completed (11/11) — 2026-09-09

### [Phase 3a: Conversational Interface & Interaction Model](phase-3a-conversation.md)
**Goal:** The choreography that stands in for the AI — prompt bar, intent matching, thinking beat,
graceful fallback, follow-up gating.
**Stories:** 6 | **Points:** 17 | **Status:** 🔄 Active (0/6)

### [Phase 3b: Scripted Hero Flows & Narrative Orchestration](phase-3b-heroes.md)
**Goal:** The three client questions, each wired end to end as a two-beat *what → so-what* flow.
**Stories:** 6 | **Points:** 16 | **Status:** Not Started (0/6)

### [Phase 4: Demo Hardening & Polish](phase-4-polish.md)
**Goal:** Survive a live, high-stakes room — projector sizing, offline resilience, dead-end sweep,
timing polish, brand QA.
**Stories:** 6 | **Points:** 14 | **Status:** Not Started (0/6)

### [Phase 5: Post-Plan Demo Extras](phase-5-demo-extras.md)
**Goal:** Requests that arrived after the 45-story plan closed. Optional by the specification, not
required by it.
**Stories:** 2 | **Points:** 5 | **Status:** ✅ Completed (2/2)

### [Future — The Discovery Scope](future.md)
**Goal:** What is deliberately staged and must be scoped by the Discovery. **Out of prototype scope.**
**Items:** 9 (not estimated)

---

## 🔗 Dependency order

Phases are sequenced by hard dependency, not preference:

```
Phase 1a  Setup + design tokens (E2)
Phase 1b  Seed datasets (E3)
    ↓     everything is styled from E2 and fed from E3
Phase 2a  Shell (E4)
Phase 2b  Components (E6)          the heroes compose these
    ↓
Phase 3a  Conversation (E5)        nothing can be triggered without it
    ↓
Phase 3b  Heroes (E7)              the three demonstrations
    ↓
Phase 4   Hardening (E8)
```

**Notes on the structure:** E5 (conversation) precedes E7 (heroes) because no hero can be reached
without it. Phase 1 and Phase 2 are each split across two files purely to stay under the 200-line
rule (`.claude/rules/documentation.md` §2.1) — 1a/1b and 2a/2b are sequential, not parallel.

**Start-to-finish order:** 1a → 1b → 2a → 2b → 3a → 3b → 4.

---

## 🎯 Quick Navigation

- Continue the build → `/holycode-pm:execute-work phase 1b` *(1a is complete)*
- Run a single story → `/holycode-pm:execute-work story US-001`
- Add a story → `/holycode-pm:add-scope`
- Record a post-prototype requirement → `/holycode-pm:add-backlog-requirement` → [future.md](future.md)
- Effort estimate → `/holycode-pm:estimate-ai-hours`

---

## 📖 Component Legend

Single application (not a monorepo), so component tags are functional:

- **[Web]** — the React Router 7 application (`app/`)
- **[DevOps]** — project setup, tooling, Railway deployment

---

## ✂️ Cut order under time pressure *(confirmed 2026-09-09)*

The brief asks for **demonstrable and robust by end of week, not feature-complete**. If the week
runs short, drop in this order — and only in this order:

1. **US-045** Chrome rehearsal → compress, do not skip entirely
2. **US-043** Transition & timing polish → accept "good" over "tuned"
3. **US-026** Segmented filter → drops US-016 with it
4. **US-016** Hero band → a Reference Guide refinement beyond the Specification

**Untouchable at any cost:** the three heroes and their follow-ups (US-034 to US-039), the
conversational layer (US-028 to US-033), offline resilience (US-041), and the dead-end sweep
(US-042). These are the demo. Everything else is the frame around them.

---

## 🔴 Highest-risk stories

| Story | Why |
|---|---|
| [US-030](phase-3a-conversation.md) Intent matching | The owner typing an off-script paraphrase is the live moment everything else protects |
| [US-039](phase-3b-heroes.md) Hero 3 follow-up | The causal peak — the beat the owner is expected to lean forward on |
| [US-041](phase-4-polish.md) Offline resilience | Venue Wi-Fi failing mid-demo is an unrecoverable moment |

---

**Related:** [Project Scope](../scope.md) · [Constraints](../constraints.md) ·
[Technologies](../technologies.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
