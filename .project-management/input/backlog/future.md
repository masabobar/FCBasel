# Future — The Discovery Scope (Post-Prototype)

**Status:** Explicitly OUT of prototype scope. Not estimated.
**Last Updated:** 2026-09-09

---

## What this file is

Everything below is **staged** in the prototype and is **exactly what the Discovery must scope**.
It is recorded here so the boundary stays visible to the team, not because it is planned work.

> **The rule that follows** (Framing §5): in the room, present the prototype as a preview of the
> experience, not as a system already wired to the club's data. And internally, do not treat the
> prototype as production foundation — it is a sales artefact built for speed, not a first increment
> of the platform.

Impressive outputs must never imply these problems are already solved. Winning on a promise the team
would then have to walk back is a named risk in [`../scope.md`](../scope.md) §9.

---

## FUT-001: The semantic layer

**The single hardest and most valuable piece of the real platform** — the layer that lets an AI
reliably map a business question to the right data. It does not exist in the prototype; the
prototype simply *is* that layer, hand-built for a handful of questions. In production this is the
core of the work.

## FUT-002: Real system integration

Connecting SAP, the webshop, HR, partner tools, ticketing, website and analytics, and matchday data
into a single data lake. The prototype connects to nothing; all data is local and seeded.

## FUT-003: A real AI layer

A live model and query engine replacing keyword matching over pre-authored narratives. Nothing is
understood, queried or computed live in the prototype.

## FUT-004: Permissions & governance

The vision's granular, permission-aware access model — any internal user from a board member to a
team member, each seeing only what they should. The prototype has one persona and no access model.

## FUT-005: Live data & real-time behaviour

Real query round-trips replacing the fixed thinking delay, which is stagecraft.

## FUT-006: Genuine causal analysis

AI that not only shows information but interprets it and explains *why* things are happening. In the
prototype the "why" beat is a pre-authored narrative. **This is a genuine, later objective and one of
the vision's most valued capabilities** — the follow-up beat exists to show what it would feel like.

## FUT-007: Targets, KPIs, bonuses & leadership tooling

Targets and KPIs embedded in each person's dashboard, with an eventual link to bonuses and
incentives, combining data, AI, reporting, analysis, goal-setting and leadership in one place.

> **Guardrail carried forward:** even in production, salary and named-individual performance data
> were deliberately excluded from the prototype to avoid making a governance-conscious owner flinch.
> Any future work here needs an explicit governance conversation first.

## FUT-008: Persistence & multi-session state

The prototype holds state in memory for one demo run and resets on reload. No database is required
or present.

## FUT-009: Real partner assets

Partner tiles use placeholder monogram logos. Swap for genuine partner assets **when licensed to use
them**.

---

## Adding to this file

Use `/holycode-pm:add-backlog-requirement` to record further post-prototype requirements.
To pull one into active development, use `/holycode-pm:promote-requirement` — but note that doing so
for anything above crosses the prototype-versus-platform boundary and should be a declared, agreed
decision, not a silent one (Framing §7: *deviations are declared, not absorbed*).

---

**Navigation:**
[← Master Index](README.md) · [← Phase 4](phase-4-polish.md) · [Scope](../scope.md)
