# Phase 3b: Scripted Hero Flows & Narrative Orchestration

**Duration:** 2026-09-13 to 2026-09-14 (~6.6 AI-hours)
**Status:** In Progress (3/6 · 8/16 pts)
**Started:** 2026-09-10
**Target Completion:** 2026-09-14
**Actual Completion:** —

> **Acceptance criteria live in** [`../../input/backlog/phase-3b-heroes.md`](../../input/backlog/phase-3b-heroes.md),
> including the **verbatim narrative strings**. This file tracks execution.

---

## Phase Goal

Wire the three client-provided questions end to end, each as a two-beat flow: a primary view with a
narrative, then an escalating follow-up that moves from *what* to *so-what*.

**This is the heart of the prototype.** Everything before it is scaffolding; everything after it is
protection.

**Success Criteria:**
- Each hero has a canonical prompt, chip label, keyword set, ordered tiles, and a verbatim narrative
- Each hero renders by **adding** tiles to the baseline with the insertion animation
- Each follow-up appears only after its hero and escalates from *what* to *so-what*
- All narrative strings are verbatim and consistent with the E3 figures
- No salary or named-individual performance content appears in any hero

---

## Epics in This Phase

### Epic 7: E7 — Scripted Hero Flows (16 story points)

**Priority:** P0 · **Status:** In Progress (3/6) · **Dependencies:** Phases 1b, 2a, 2b, 3a

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-034 | Hero 1 primary — shirt sales, badge share, printed names | 3 | ✅ Done |
| US-035 | Hero 1 follow-up — which badge to push next | 2 | ✅ Done |
| US-036 | Hero 2 primary — ticket revenue year on year | 3 | ✅ Done |
| US-037 | Hero 2 follow-up — which fixtures are driving the drop | 2 | 📋 Todo |
| US-038 | Hero 3 primary — department budget vs actual vs target | 3 | 📋 Todo |
| US-039 | Hero 3 follow-up — why Marketing is off plan | 3 | 📋 Todo |

**Technical Notes:**

- **Narrative copy is verbatim. Do not paraphrase.** The strings are consistent with the E3 figures
  by construction; editing one silently breaks that consistency. They are also hand-authored
  persuasion writing — the exact wording is the product.
- Each hero renders its tiles **in the defined order** with the E2 insertion animation and its
  narrative caption stated *first*, before the charts.
- Heroes are **independent** — any single hero can run start-to-follow-up on its own, so the
  presenter can show just one if the room's time is short.
- Re-asking a hero refreshes its tiles in place (dedupe by hero id), never duplicates.
- Hero 1 carries a section-level period filter driving all three of its tiles together, with badge
  segments derived per period.
- Hero 2's monthly comparison chart and rebuilt totals tile are Reference Guide additions beyond the
  Specification; its fixture chart and monthly chart are at **different scopes** and must be labelled.

> **US-039 is the causal peak.** Per the brief, this is the beat the owner is expected to lean
> forward on — the moment that separates this from "yet another dashboard project", which is exactly
> the distinction the owner said he cares about. Protect it: if anything in this phase gets rushed,
> it must not be this.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md`
- [ ] Narrative strings verified **character-for-character** against the backlog
- [ ] Figures verified to come from E3 — no values re-typed in the hero component
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix · i18n.

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 16 · **Stories:** 6 · **Epics:** 1
- **Estimated Effort:** ~22 team-hours → ~6.6 AI-core hours
- **Risk Level:** Low-Medium — composition work, provided Phases 2b and 3a landed cleanly

> The lowest-effort phase relative to its importance. That is by design: if the component library and
> the matcher are right, each hero is assembly plus copy. If this phase runs long, the cause is
> upstream.

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 8 / 16 (50%)
- **Completed Stories:** 3 / 6
- **Tests Passing:** 2025 / 2025 · **Coverage:** 100% lines (`app/**`) · **Commits:** 3

---

## Dependencies

**Depends On:** the most dependent phase in the project.
- Datasets US-008 / US-009 / US-010 (Phase 1b)
- Insertion mechanic US-014 (Phase 2a)
- Components US-017 to US-025 (Phase 2b)
- Matching and gating US-030, US-033 (Phase 3a)

**Blocks:** all of Phase 4 — hardening can only verify flows that exist.

**Internal ordering:** each hero's primary precedes its own follow-up. The three heroes are otherwise
independent and can be built in any order.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Narrative string paraphrased during implementation | High | Medium | Verbatim is an explicit DoD item, checked character-for-character | AI | Open |
| A figure re-typed into a hero drifts from the dataset | High | Medium | Heroes read E3 only; verified in review | AI | Open |
| Upstream phase slips and compresses this one | High | Medium | This phase is untouchable in the cut order — cut polish instead | Human | Open |
| Scope difference between Hero 2's charts reads as an error | Medium | Medium | Both charts labelled with their scope (US-009, US-036) | AI | ✅ Closed (US-036) |
| Hero 3 follow-up under-delivers as the emotional peak | High | Low | Recommendation panel visually distinct; narrative leads with cause, not data | AI | Open |

---

## Progress Log

### US-036 — Hero 2 primary (3 pts) · 2026-09-10 · ✅ Done

Composition again, and the first mount of `GroupedBarTile` (US-019): `app/components/heroes/hero-2.tsx`
holds layout, copy and three formatter compositions, and a source scan proves it contains no `<svg>`,
no hex and no re-typed figure. Only `CompareBars` was new (`app/components/tiles/compare-bars.tsx`) —
US-021's `HBars` cannot sit in a 4-of-12 KPI tile, its 150px/96px columns being a review decision for
ranked lists, so the new module borrows `hBarMax`, `hBarPercent` and `H_BAR_SERIES` rather than
restating any of them. US-038's overall tile reuses it.

- **BOTH SCOPE LABELS ARE ON SCREEN, and the mismatch is asserted as real.** The fixture chart and
  the totals tile carry `fixtures.scopeLabel` ("Eight highest-grossing home fixtures … excluding the
  season-ticket base"); the monthly chart carries `monthly.scopeLabel` ("All home fixtures per
  month …"). The section head deliberately has NO scope line — one line cannot describe two scopes.
  Tests assert the labels differ AND that the monthly totals genuinely exceed the fixture totals
  (9,770 > 7,830), so the labels can never describe a difference that stopped existing.
- **Every total is derived.** `fixtureTotals` sums the same eight pairs the bars plot: `CHF 7.83M`,
  `CHF 7.88M`, `-CHF 50k` and the headline `-0.6%`. The dataset is asserted to hold no key matching
  `total|delta|pct|percent|change|sum`, and its serialised form to contain none of those figures;
  editing FCZ moves the headline to `+1.3%` in test, which is the proof it is not stored.
- **Narrative byte-identical**: UTF-8 hex against a retyped literal, exact length (229), an ASCII
  sweep, both hyphens (`(-0.6%)`, `-CHF 150k`) pinned to `0x2d`, and a match against the sentence in
  the backlog itself. It renders from the dataset; the string is absent from the component layer.
- **The eight chips do not collide — measured, not assumed.** Geometry: eight equal cells, none
  overlapping, all right of the axis gutter, and the tallest bar (YB 1,610) stays clear of the chip
  band. In Chrome the widest chip is 59.5px in an 83.4px cell at 1440 (min gap 25.2px, 13.0px at
  1280). Chips are bare signed magnitudes (`+130`) with the unit in the title `(CHF 000)`: a
  money-formatted chip measures **97.6px in an 83.4px cell** and would overlap by 14px, which is why
  the shared component's `formatDelta` prop is given `formatSignedNumber` here.
- **The tiles pair at `xl`, not `lg`** — for the same measured reason: two thirds of the canvas at
  1024 leaves a 51.8px cell, so the pair stacks below `xl` (cell 81.0px) instead. Verified at 1920 /
  1440 / 1280 / 1024 / 834 / 768: no overlap, no horizontal scroll. *Known limit:* at a 390px phone
  the cell is 36px and chips still overlap — outside the 1920×1080 presentation target, and a
  candidate for Phase 4 if phone support is ever wanted.
- **Chrome pass (built SSR bundle):** three tiles in order, `CHF 7.83M` with `-0.6%` and a down
  arrow, compare bars `CHF 7.88M` / `CHF 7.83M` on one 336px track, `-CHF 50k vs Season 25/26`,
  fixture hover `FCZ · Season 25/26 CHF 1'390k · Season 26/27 CHF 1'240k · -CHF 150k`, month hover
  `Sep · CHF 1'180k / CHF 1'240k`, legend on both charts, re-ask → ONE section / three cards, **zero
  requests after first paint** and no console error but the pre-existing missing `favicon.ico`.
  Reduced motion: no zero-height bar, compare fills at 100% / 99.37%, every line drawn.
- **Security triage — no security-relevant changes detected:** no endpoint, dependency, env var,
  storage, `innerHTML`, user-supplied URL, request or logging. The root loader gained one more
  static in-memory read; the data is aggregate ticketing named by opposing CLUB, no PII.
- 76 new tests, **2025 green**. Hero 2's follow-up keeps the shared placeholder until US-037.


### US-035 — Hero 1 follow-up (2 pts) · 2026-09-10 · ✅ Done

The first **so-what** beat, and pure assembly: `DriverTile` (US-023) for the badge trend and
`RecommendationPanel` (US-024) for the advice, behind a gold **Follow-up** divider placed in
`hero-section.tsx` so US-037 and US-039 reuse it rather than each making their own.

- **Phase flips, never appends** — showing the follow-up leaves ONE section with the primary tiles
  in place, and the follow-up chip is withdrawn by US-029's derived visibility.
- **Narrative renders from the dataset** — the string appears zero times in the component layer,
  and is asserted byte-identical in tests.
- 43 tests added (1949 green); lint, format, typecheck, build all clean.

> **Provenance note:** this story's dispatch was interrupted after implementation but before commit.
> The work was verified independently against its acceptance criteria and all five gates before
> being committed as `2881275`, rather than trusted or re-run.


### US-034 — Hero 1 primary (3 pts) · 2026-09-10 · ✅ Done

**The first scripted answer, and it is composition: not one chart was built.** `VBarTile` (US-018)
and `DonutTile` (US-020) reach a screen for the first time here, beside `HBarTile` (US-021),
`Segmented` (US-026) and US-024's section head — `app/components/heroes/hero-1.tsx` contributes
layout, copy and ONE piece of period state, and a source scan proves it holds no `<svg>`.

- **THE SINGLE FILTER IS THE STORY.** One `Segmented` in the SECTION HEAD (not a card's `action`
  slot — a filter driving three tiles cannot belong to one of them) over one `periodKey` held above
  all three tiles, the shape US-016's band already uses. One press moves the bars, the ring and the
  names together: proved by reading all three tiles before and after a single click, for **all four
  periods**, and again in real Chrome.
- **Nothing snaps.** The section adds no key of its own, so the bars, arcs and rows reconcile by
  CATEGORY and transition; mid-flight the labels read `16’975 / 7’855 / 4’387` — counting down from
  the figures on screen, never through zero — and the `<rect>` node is asserted to be the SAME
  element across the press.
- **Narrative byte-identical**, asserted as UTF-8 hex against a retyped literal, by exact length
  (214), by an ASCII-range sweep of every character, and against the sentence in the backlog itself,
  so the two copies in the repo cannot drift together. It is rendered straight from the dataset —
  the string exists nowhere in the component layer.
- **Not one figure re-typed.** Every displayed number ≥ 100 across all four periods (units, per-kit
  revenue, totals, badge totals, the four derived segments, print counts) is asserted absent from
  five source files. Kit revenue is `units × CHF 99` and the Home share is `homeKitShare`; the
  fixture is proved to hold no `revenue`, `total` or `share` key to read instead.
- **Badge segments sum EXACTLY to the centre figure in all four periods**, read off the rendered
  legend (3’080 = 1’355+739+616+370; 1’136 = 500+273+227+136).
- **Data reaches the sections through a ROOT loader** (`app/lib/dashboard/heroes.ts`, mirroring
  `baseline.ts`): the sections are inserted by `root.tsx`, the repositories are server-only, and the
  prototype makes no request after load — Chrome confirms **0 requests** after the first paint.
- **Chrome pass (built SSR bundle, 1440×950):** three tiles in order with the pinned figures, hover
  reading `Home · 22’400 shirts · 58% of shirt sales · CHF 2’217’600`, no horizontal overflow, no
  truncated name label, re-ask → one section / three cards, **zero console errors**.
- **Security triage — no security-relevant changes detected:** no endpoint, dependency, env var,
  storage, `innerHTML`, user-supplied URL, request or logging. The one new loader takes no input and
  reads static in-memory fixtures; the data it serialises is aggregate merchandising with no PII and
  no named-individual performance figure (asserted).
- 57 new tests, **1906 green**. Heroes 2 and 3 keep the clearly-marked placeholder body until
  US-036 / US-038.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-10
**Phase Status:** In Progress (3/6 · 8/16 pts)
**Previous:** [Phase 3a](phase-3a.md) · **Next:** [Phase 4 — Hardening](phase-4.md)
