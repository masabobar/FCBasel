# Project Scope — FC Basel Intelligence Platform Prototype

**Version:** 1.0.0
**Last Updated:** 2026-09-09
**Status:** Approved (derived from client document set)
**Source documents:** Build Specification (26 pp) + Project Framing, Brief, Goals & Rules (7 pp) +
Reference Implementation Guide + reference JSX build

---

## 1. Vision

FC Basel is the largest football club in Switzerland ("Rotblau", founded 1893, St. Jakob-Park).
Beyond the sporting side it is a substantial commercial organisation — sponsorship and partnerships,
ticketing, hospitality, merchandising and the webshop, events, marketing and communications, finance
and HR — with each area today sitting in its own system.

The club's leadership wants a central **FCB Intelligence Platform**: a single data lake consolidating
every relevant system (SAP, webshop, HR, partner tools, ticketing, website and analytics, matchday
data) with an AI layer on top. In that vision any internal user states what they want in natural
language, and the system finds, links and analyses the relevant data and extends their personal
dashboard — with a permission-aware access model, targets and KPIs embedded per person, and
eventually AI that explains *why* things are happening rather than only *what*.

Leadership has been explicit that this is **not** meant to be "yet another BI or dashboard project".

## 2. What this project delivers

**In one line:** a scripted, clickable, FCB-branded chat-to-dashboard prototype that makes the
vision's core loop feel real — a non-technical manager asks a business question in plain language, a
correct on-brand visualisation appears on their dashboard, and a follow-up makes it sharper.

This is a **proof of experience**, not a working slice of the platform. It is a sales artefact whose
job is to make one specific audience believe the vision is real and that this team can build it.

**The single thing it must prove:** that a plain-language question produces an intelligent, on-brand
result — as though the system understood the question, reached across the club's siloed systems,
found the data and built the view.

## 3. Target audience

One persona, and every screen is their view:

- **Role:** Sales / Marketing / Webshop Manager at FC Basel — a senior commercial manager who owns
  shirt sales, webshop performance, matchday commercial revenue and campaign outcomes.
- **Workspace label:** "Sales & Marketing" (a role, not a real person); avatar initials "SM".
  No real or realistic individual name is used anywhere.
- **On arrival** they see a dashboard that already looks lived-in — not an empty canvas. Their
  questions *add to* that dashboard rather than filling a blank one.

## 4. Objectives & success criteria

The engagement is judged by the meeting outcomes it produces, not by feature count.

| # | Objective | Success criterion |
|---|---|---|
| 1 | Immediate goal | The internal sponsor sees the prototype and green-lights an audience with the club owner |
| 2 | Next goal | In that audience, the owner bypasses the tender and requests the Discovery |
| 3 | Ultimate goal | The engagement is won |

**What "good in the room" looks like, concretely:**

- The owner leans forward on the insight beat — the causal follow-up that explains *why* and
  recommends an action.
- The branding reads as the club's own internal tool, not a generic dashboard in club colours.
- The experience feels instant and flawless; nothing stutters or dead-ends, even when someone types
  a question off-script.
- The owner leaves believing the bigger vision is achievable and that this is the team to achieve it.

## 5. The three demonstrations

All three are the client's own questions, so the owner sees his own use cases answered rather than
invented ones. Each follows the same two-beat pattern: first the data (*what*), then a follow-up
that moves to interpretation and recommendation (*so-what*).

| Hero | Primary question | Follow-up (the escalation) |
|------|------------------|----------------------------|
| 1 | Shirt sales split by kit, sponsor-badge share, top-5 printed names | Which badge should we push in the next drop? |
| 2 | Ticket revenue year on year, compared fixture by fixture | Which fixtures are driving the drop? |
| 3 | Department budgets vs actuals vs % of target | Why is Marketing over budget and behind target? |

## 6. Guiding principles

Design heuristics that govern any judgement call where the specification leaves room:

1. **Experience over capability** — the chat-to-chart mechanic is not a differentiator; how it
   *feels* is. Spend effort on the feeling, not on proving the mechanic.
2. **Insight over charts** — the peak moments are the follow-ups that interpret and recommend.
   Protect those moments.
3. **Unmistakably theirs** — brand fidelity is most of the persuasion, not decoration.
4. **Instant and flawless** — one ugly or wrong render in front of the owner is unrecoverable.
5. **Honest about what is staged** — never imply the hard problems are already solved.
6. **Grounded, not invented** — dummy data anchored to verified FCB facts; plausibility is credibility.
7. **One coherent behaviour** — the dashboard should feel like a single intelligent thing that gets
   sharper as you talk to it, not three separate tricks.

## 7. Out of scope — the prototype-versus-platform boundary

This is the honesty line for the whole team. **What is staged, and is exactly what the Discovery
must scope:**

- **The intelligence.** No AI or model at runtime. Questions are matched to pre-authored responses
  by keyword. Nothing is understood, queried or computed live.
- **The integration.** Nothing connects to SAP, the webshop, HR, ticketing or any real system.
- **The semantic layer.** The single hardest and most valuable piece of the real platform does not
  exist here; the prototype simply *is* that layer, hand-built for a handful of questions.
- **Permissions and governance.** One persona, no real access model.
- **Live data and real-time behaviour.** The pause before a chart appears is stagecraft, not a query.
- **Causal analysis.** The "why" beat is a pre-authored narrative.
- **Persistence.** State lives in memory for a demo run and resets to baseline. No database.
- **Internationalisation.** English only. Not requested in the client brief; the narrative copy is
  hand-authored persuasion writing for one Basel boardroom.

**Hard content guardrail:** no salary and no named-individual performance data appears in any tile,
dataset or narrative. Target and incentive *mechanics* may appear only as the persona's own
self-view or as aggregated team figures.

## 8. Stakeholders

| Role | Interest |
|------|----------|
| The club owner | Ultimate decision-maker. Wants real visibility into KPIs and control; drawn to the bigger vision of data plus leadership plus targets. Audience for the insight and leadership beats. |
| The Head of Sales | Internal sponsor and first gate. Owns the initiative; decides whether the prototype goes in front of the owner. The three demonstrations are his own suggested questions. |
| The source of the detailed vision | A senior club figure whose articulation of the platform ambition is treated as the definitive statement of what the club is reaching for. |
| Commercial lead | Owns the client relationship and all commercial decisions; presents or arranges the presentation. |
| Developer | Builds the prototype to specification and deploys it; owns project setup, stack and deployment. |
| Product / specification owner | Prepared the build input, data, flows and recommendations; resolves ambiguity in the spec. |

## 9. Dependencies, assumptions, risks

**Dependencies**
- The genuine FCB crest asset, downloaded from the club site and **self-hosted** (never hotlinked).
- A deployed shareable URL (Railway) so the artefact can be sent to the sponsor and shown in the meeting.

**Assumptions**
- All figures are dummy but grounded in verified FCB facts, and are internally reconciled across heroes.
- Chrome is the demo machine's browser and the presentation target is 1920×1080.
- The reference JSX build is a faithful expression of the intended experience and can be ported.

**Risks**
| Risk | Mitigation |
|------|------------|
| A live model renders something ugly or wrong in the room | No model at runtime — fully scripted, by deliberate decision |
| Venue Wi-Fi fails mid-demo | Zero runtime network dependency; all data and assets bundled/self-hosted |
| Owner types something entirely off-script | Graceful fallback panel re-surfaces the prepared questions; never an error, never a dead end |
| Someone in the room knows a real FCB number | Figures are plausible and grounded, and are never claimed to be actuals |
| Winning on a promise the team would have to walk back | Present as a preview of the experience, not a system wired to club data |

## 10. Document precedence

Where the Build Specification is precise, follow it exactly. Where it leaves room, the Framing
document's principles (§6 above) and the prototype-versus-platform boundary (§7) guide the choice.

The Reference Implementation Guide records refinements made beyond the specification during
prototyping, at the lead owner's direction. Per that guide, **the guide and the JSX are definitive
for the intended experience; the specification governs scope, structure and guardrails.** Where the
two disagree on a concrete value, this project follows the guide.
