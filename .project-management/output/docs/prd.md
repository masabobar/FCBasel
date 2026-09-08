# Product Requirements Document (PRD)

**Project Name:** FC Basel — Intelligence Platform Prototype
**Version:** 1.0
**Date:** 2026-09-09
**Status:** Approved
**Author:** Product / specification owner (per the client document set)

---

## Executive Summary

A scripted, clickable, FCB-branded chat-to-dashboard prototype that makes the core loop of the club's
Intelligence Platform vision feel real: a non-technical commercial manager asks a business question
in plain language, and a correct, on-brand visualisation animates onto their dashboard — then gets
sharper on a follow-up.

It is a **proof of experience**, not a working slice of the platform. Its job is to convert the sales
position from "one of several possible providers" to "let's build this together".

**Key Points:**
- Everything is scripted and local — no AI model, no integration, no live data, no persistence
- Three demonstrations, all from the client's own questions, each with a *what → so-what* escalation
- Judged by meeting outcomes, not feature count

---

## 1. Product Overview

### 1.1 Vision
The club's leadership wants a central FCB Intelligence Platform: one data lake consolidating every
relevant system (SAP, webshop, HR, partner tools, ticketing, analytics, matchday data) with an AI
layer on top, so any internal user states what they want in natural language and the system finds,
links and analyses the data and extends their personal dashboard. Leadership has been explicit that
this is **not** "yet another BI or dashboard project".

### 1.2 Target Audience
One persona: a **Sales / Marketing / Webshop Manager** at FC Basel — a senior commercial manager who
owns shirt sales, webshop performance, matchday commercial revenue and campaign outcomes. Every
screen is their view. The workspace shows the role label "Sales & Marketing" and initials "SM";
**no real or realistic individual name is used**.

The audience *for the demo* is different from the persona: the club owner (ultimate decision-maker)
and the Head of Sales (internal sponsor, first gate).

### 1.3 Problem Statement
The club's commercial data sits in isolated systems. Answering a cross-domain business question today
means knowing where data lives and how systems connect. Meanwhile the owner wants far more visibility
into KPIs and is impatient — in the client's own words, everything has to happen yesterday.

For the vendor, the problem is narrower: without something that already *looks like it can do part of
this*, the engagement goes to a formal multi-provider tender.

### 1.4 Solution
A curated illusion of the finished experience. Keyword matching plus pre-authored responses stands in
for the AI; a deliberate pause stands in for query latency. The user cannot tell the difference in a
demo, and the *feeling* — that the system understood, reached across the silos, and built the view —
is exactly what separates this from a dashboard project.

---

## 2. Goals & Objectives

### 2.1 Business Objectives
1. **Immediate:** the Head of Sales green-lights an audience with the owner.
2. **Next:** in that audience, the owner bypasses the tender and requests the Discovery.
3. **Ultimate:** the engagement is won.

### 2.2 Success Metrics (KPIs)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Sponsor green-light | Audience with the owner arranged | Sponsor's decision after first showing |
| Owner engagement on the insight beat | Owner leans forward at the causal follow-up | Observed in the room |
| Brand recognition | Reads as the club's own internal tool, not a generic dashboard in club colours | Owner/sponsor reaction |
| Zero-defect demo | No stutter, no dead end, no wrong render — including off-script input | Full-path rehearsal (US-042, US-045) |
| Tender bypassed | Discovery requested directly | Commercial outcome |

### 2.3 User Goals
The persona wants to ask a plain-language question about their own commercial area and immediately
see a correct, branded answer added to a dashboard that already looks lived-in — then ask *why* and
get an interpretation with a recommended action.

---

## 3. User Personas

### Persona 1: Sales & Marketing Manager *(the in-product persona)*
- **Role:** Sales / Marketing / Webshop Manager, FC Basel
- **Demographics:** Senior commercial manager; non-technical; owns merchandising, webshop, matchday
  commercial revenue and campaign outcomes
- **Goals:** Answer commercial questions without knowing which system holds the data; understand *why*
  a number moved, not just that it did
- **Pain Points:** Data spread across isolated systems; reports show what happened but not why
- **Tech Savviness:** Medium — comfortable with dashboards, not with query tools

### Persona 2: The club owner *(the demo audience)*
- **Role:** Ultimate decision-maker
- **Demographics:** Impatient; wants real visibility into KPIs and control
- **Goals:** Data plus leadership plus targets in one place; AI that interprets, not just reports
- **Pain Points:** Has likely seen chat-to-chart demos before; allergic to "yet another dashboard project"
- **Tech Savviness:** Medium — judges on feel and credibility, not mechanics

---

## 4. Features & Requirements

### 4.1 Must-Have Features (P0) — 41 stories, 104 points
- FCB-branded dashboard workspace: app shell, navy sidebar, top app bar, genuine self-hosted crest (E2, E4)
- Design token system with strict colour discipline (E2)
- Internally consistent dummy datasets grounded in verified FCB facts (E3)
- Persona baseline dashboard — four pre-existing tiles so it reads as already in use (E4)
- Dynamic tile insertion with animation — the dashboard **grows**, never clears (E4, E6)
- Conversational prompt bar with tappable suggestion chips (E5)
- Keyword intent-matching of free-typed questions, tolerant of paraphrase (E5)
- Graceful fallback for off-script input — never a dead end, never an error (E5)
- Reusable chart and tile component library, eight types (E6)
- AI narrative captions on rendered outputs — the "it understood me" layer (E6, E7)
- **Hero 1** shirt sales by kit, badge share, top-5 printed names (+ badge recommendation follow-up)
- **Hero 2** ticket revenue year-on-year per fixture (+ culprit-fixtures follow-up)
- **Hero 3** department budget vs actual vs target (+ causal "why Marketing" follow-up)
- Demo-day hardening: presentation sizing, dead-end prevention, offline resilience (E8)

### 4.2 Should-Have Features (P1) — 4 stories, 12 points
- Hero band: webshop trend chart and attendance ring with a shared period filter (US-016)
- Segmented period filter control (US-026)
- Transition and timing polish (US-043)
- Chrome demo run-through and stability rehearsal (US-045)

### 4.3 Nice-to-Have Features (P2)
None. The specification pins every value, so there is no discretionary tier.

### 4.4 Future Considerations
The Discovery scope — semantic layer, real integration, live AI, permissions and governance, live
data, genuine causal analysis, targets/KPIs/bonuses, persistence, licensed partner assets.
See [`../../input/backlog/future.md`](../../input/backlog/future.md).

---

## 5. User Stories & Use Cases

### 5.1 Epic: Scripted hero flows (E7)

#### User Story — Hero 3, the causal peak
**As a** Sales & Marketing Manager,
**I want to** ask why Marketing is over budget and behind target,
**So that** I understand the cause and know what to do about it.

**Acceptance Criteria:**
- Resolves from loose phrasing ("why is marketing high?"), not only the canonical wording
- Renders a driver breakdown (activations ~CHF 240k over plan; paid social +18%) and the outcome gap
  (webshop conversion 2.2% vs 2.6% plan)
- Renders a recommendation panel, visually distinct from a data tile
- Narrative copy is verbatim and consistent with the E3 figures

#### User Story — off-script input
**As a** presenter,
**I want** any unexpected question to land somewhere sensible,
**So that** the demo can never dead-end in front of the owner.

**Acceptance Criteria:**
- Below-threshold input shows a friendly panel re-surfacing the prepared questions
- Never an error, never blame, never a screen without a next step

### 5.2 Epic: Conversational interface (E5)
Full story set in [`../../input/backlog/phase-3a-conversation.md`](../../input/backlog/phase-3a-conversation.md).

---

## 6. User Experience

### 6.1 User Flows
Three flows, specified as diagrams in the Build Specification §5: end-to-end prototype flow,
conversation decision model, and the two-beat hero escalation pattern shared by all three heroes.
Reproduced in [`architecture.md`](architecture.md) §6.2.

### 6.2 Wireframes / Mockups
The reference JSX build (`client-input/FCB_Prototype_JSX.jsx`) is the definitive visual reference,
documented component-by-component in the Reference Implementation Guide.

### 6.3 Navigation Structure
A single screen. The sidebar carries "Dashboard" (active) plus three deliberately **inert**
placeholders — Reports, Data Sources, Settings — that imply a fuller product without pretending to be
one. See [`../../input/screens/screen-map.md`](../../input/screens/screen-map.md).

---

## 7. Functional Requirements

### 7.1 Authentication & Authorization
**None.** One persona, no access model. A cosmetic login screen is optional and, if present,
decorative only. Explicitly out of scope per the specification.

### 7.2 Data Management
Static local seed files bundled with the app, structured one object per hero with `primary` and
`followUp` sections. No database, no persistence, no runtime fetch. State lives in memory for a demo
run and resets on reload or Reset.

### 7.3 Business Logic
Input normalisation → keyword scoring (+2 strong, +1 weak) → threshold (2 hero / 3 follow-up) →
deterministic tie-break by intent order → thinking beat → tile insertion. Follow-ups are gated on
their parent hero having been shown.

### 7.4 Integrations
**None.** Nothing connects to SAP, the webshop, HR, ticketing, a CRM, or any live source.

---

## 8. Non-Functional Requirements

### 8.1 Performance
- Renders correctly and legibly at 1920×1080 with no horizontal scroll
- Transitions smooth with no flicker or layout jump on the demo hardware
- The thinking delay is a *fixed* ~600-1200ms of stagecraft — it must not feel slow

### 8.2 Security
- No personal data processed, stored or displayed; no accounts, no persistence
- No salary and no named-individual performance data in any tile, dataset or narrative
- Crest self-hosted, never hotlinked

### 8.3 Scalability
Not applicable. Single-session, single-persona demo artefact with no backend.

### 8.4 Reliability & Availability
Must run **fully with the network disconnected** after load. Venue Wi-Fi must never be able to break
the demo.

### 8.5 Usability
`prefers-reduced-motion` honoured throughout; focus-visible outlines; tabular numerals; sign and
arrow carry variance meaning so colour is never the sole signal.

---

## 9. Technical Constraints

Full list in [`../../input/constraints.md`](../../input/constraints.md). The binding ones: one-week
deadline; no runtime model; no integration; no auth; no persistence; Chrome at 1920×1080; offline
after load.

---

## 10. Dependencies

### 10.1 External
- The genuine FCB crest asset, downloaded and self-hosted
- A Railway deployment producing the shareable URL

### 10.2 Internal
- E2 (tokens) and E3 (data) are foundations every later epic reads from
- E5 (conversation) must precede E7 (heroes) — no hero is reachable without it

---

## 11. Assumptions

- Figures are dummy but grounded in verified FCB facts and internally reconciled
- The reference JSX is a faithful expression of the intended experience and can be ported
- Chrome on the demo machine; presentation target 1920×1080

---

## 12. Risks & Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| A live model renders something wrong in the room | High | — | No model at runtime; fully scripted by deliberate decision |
| Venue Wi-Fi fails mid-demo | High | Medium | Zero runtime network dependency; all assets bundled |
| Owner types something entirely off-script | High | High | Graceful fallback re-surfaces prepared questions |
| Someone knows a real FCB number | Medium | Medium | Figures plausible and grounded; never claimed as actuals |
| Winning on a promise that must later be walked back | High | Medium | Present as a preview of the experience, not a wired system |
| One-week deadline at 8h/day weekdays only | High | Medium | Documented cut order; extend runtime before cutting scope |

---

## 13. Timeline & Phases

| Phase | Content | Points |
|---|---|---|
| 1a | Setup, Railway deployment, design tokens (E2) | 14 |
| 1b | Seed datasets (E3) | 10 |
| 2a | Dashboard shell and persona baseline (E4) | 16 |
| 2b | Chart and tile component library (E6) | 29 |
| 3a | Conversational interface (E5) | 17 |
| 3b | The three hero flows (E7) | 16 |
| 4 | Demo hardening and polish (E8) | 14 |

**Total:** 116 points ≈ 52 AI-core hours ≈ 68 AI-realistic hours. Deadline: **this week**.

---

## 14. Out of Scope

The entire staged layer — intelligence, integration, semantic layer, permissions, live data, causal
analysis, persistence — plus internationalisation (English only). Full boundary in
[`../../input/scope.md`](../../input/scope.md) §7.

---

## 15. Open Questions

None outstanding. Three were raised during extraction and all resolved on 2026-09-09: the cut order
under time pressure, the charting approach (hand-built SVG), and the new-tile gold ring conflict
(Guide precedence, no ring).

---

## 16. Approval

| Stakeholder | Role | Status | Date |
|-------------|------|--------|------|
| Commercial lead | Owns client relationship and commercial decisions | Pending | — |
| Product / specification owner | Prepared the build input and resolves spec ambiguity | Approved | 2026-09-09 |
| Developer | Builds and deploys | Pending | — |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-09-09 | Product / specification owner | Initial draft from the client document set |

---

**Document Owner:** Product / specification owner
**Next Review Date:** After the first sponsor showing
