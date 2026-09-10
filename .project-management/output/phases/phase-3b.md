# Phase 3b: Scripted Hero Flows & Narrative Orchestration

**Duration:** 2026-09-13 to 2026-09-14 (~6.6 AI-hours)
**Status:** In Progress (5/6 · 13/16 pts)
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

**Priority:** P0 · **Status:** In Progress (5/6) · **Dependencies:** Phases 1b, 2a, 2b, 3a

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-034 | Hero 1 primary — shirt sales, badge share, printed names | 3 | ✅ Done |
| US-035 | Hero 1 follow-up — which badge to push next | 2 | ✅ Done |
| US-036 | Hero 2 primary — ticket revenue year on year | 3 | ✅ Done |
| US-037 | Hero 2 follow-up — which fixtures are driving the drop | 2 | ✅ Done |
| US-038 | Hero 3 primary — department budget vs actual vs target | 3 | ✅ Done |
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
- **Completed Story Points:** 13 / 16 (81%)
- **Completed Stories:** 5 / 6
- **Tests Passing:** 2147 / 2147 · **Coverage:** 100% lines (`app/**`) · **Commits:** 5

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

### US-038 — Hero 3 primary (3 pts) · 2026-09-10 · ✅ Done

Composition, and the **first mount of `DepartmentTableTile`** (US-022): `app/components/heroes/hero-3.tsx`
holds layout, copy and ONE formatter composition, and a source scan proves it contains no `<svg>`,
no `<table>`, no hex and no re-typed figure. The table's rows, total row, Revenue/Cost tags,
variance chips, target bars and flagged row are all its own; the overall tile is US-017's `KpiTile`
around US-036's `CompareBars`. `hero-section.tsx` **lost** `PlaceholderBody` — every primary answer
is now real, so the last stand-in in the product is Hero 3's unbuilt beat.

- **THE REVENUE/COST TRAP, CLOSED AND ASSERTED ON SCREEN.** Marketing's **+0.41 renders ADVERSE**
  (red token, UP arrow, "up") while Sponsoring's **+0.84 renders FAVOURABLE** — same sign, opposite
  meaning — in the same rendered table, on the real data. All six rows are asserted against
  `row.judgement`; source scans re-prove neither the table nor the hero can compute it (no
  `FAVOURABLE|ADVERSE`, no `variance <|>`, no `actual - budget`), and flipping Marketing's *type* in
  test flips the same +410 to FAVOURABLE. Four departments came in above budget, **only three
  happily**.
- **Exactly ONE row is flagged and the DATA picks it.** `data-flagged` matches `needsAttention` for
  all six rows, the gold tint carries an icon and the sentence "Over budget and behind target", and
  "Marketing" appears **nowhere** in the component layer. Pushing Hospitality over budget in test
  flags it too, with no component edit.
- **The near-target gold band, end to end:** Hospitality (95) → `NEAR` with its ring, Merchandising
  (92) → `BEHIND` with no mark at all, three departments → `HIT`. Verified in Chrome as well.
- **`(CHF 000)` is NOT in the title — deliberately.** The backlog words the tile "Departmental
  performance (full year, CHF 000)"; the "000" half is exactly the wording US-022 was reported for
  and corrected (phase-2b review decision 4). Shipped as **"Departmental performance (full year)"**
  with the tile's own non-optional `figures in CHF millions` note; tests assert no `000` and no
  thousands figure anywhere in the tile.
- **Overall tile:** `CHF 69.68M` with **`+1%`** — `variancePercent` **is** the criteria's +1.0%
  (+0.99% raw); the app's one percentage rule drops a redundant `.0`, and the chip is **NEUTRAL**,
  matching the same movement in the table's total row (mixed signs are a fact, not a verdict).
  Compare bars read **`CHF 69.00M` / `CHF 69.68M`** through one new fixed-decimal formatter
  (`formatMoneyMillionsFixed`) — `formatMoneyMillions` drops trailing zeros, which is right for a
  lone headline and wrong for a Budget-over-Actual column. Blended target **96%** stays STORED and
  is asserted not to be any mean; **above target is `3 of 6`, DERIVED** by the new
  `departmentsOnTarget` (the reference build's own `target >= 100` rule — the dispatch note's
  "four ≥ 100%" is not what the data says; four are over BUDGET).
- **One scope, on the head:** `primary.scopeLabel` names the season-ticket inclusion, and the
  mismatch is asserted GENUINE (Ticketing 24,360 > Hero 2's shown 7,830). Unlike Hero 2, both tiles
  share one scope, so it is stated once rather than twice.
- **Narrative byte-identical**: UTF-8 hex against a retyped literal, exact length **270**, an ASCII
  sweep, the sentence's ONLY hyphen (`target - the only`) pinned to `0x2d`, and a match against the
  backlog itself. Rendered from the dataset; absent from the component layer.
- **Chrome pass (built SSR bundle, six widths):** table width 1051/731/625/710/760/694px at
  1920/1440/1280/1024/834/768 — **no horizontal scroll and no overflow at any of them**, and no name
  truncated (`text-overflow: clip`). At 1280 the longest name takes a third line; accepted, which is
  why the column has no ellipsis. Pair shares a row from `xl`. Re-ask → ONE section / two cards;
  follow-up → same section, three cards. **Zero requests after first paint**, no console error but
  the pre-existing missing `favicon.ico`. Reduced motion: figures and every bar final, no zero width.
- **Security triage — no security-relevant changes detected:** no endpoint, route, dependency, env
  var, storage, raw SQL, `innerHTML`, user-supplied URL, request or logging. The root loader gained
  one more static in-memory read. The data is **departmental and budgetary and stays aggregate** —
  no salary, no headcount attributed to a person, no individual's target attainment.
- 66 new tests, **2147 green** (53 files), 100% lines. Hero 3 keeps the placeholder beat until US-039.

### US-037 — Hero 2 follow-up (2 pts) · 2026-09-10 · ✅ Done

The **second so-what beat**, and the story US-023 was built for: `hero-2.tsx` gained a phase branch
of three grid rows — US-035's shared `FollowUpDivider`, one `DriverTile`, and `RecommendationPanel`
in its **`narrative` variant** — and **no new module, no bar, no badge and no divider was built**.
The tile's own ranking, its derived total, its formatter pass-through and its note slot were all
already there; the hero contributes one row mapping, one span, two copy strings and the note.

- **The phase FLIPS, it does not append.** One section, four cards: the three primary tiles stay in
  place (`CHF 7.83M`, eight fixture pairs, both lines still on screen) and the beat joins the same
  cascade at steps 3/4/5. The follow-up chip is withdrawn by US-029's derived visibility, proved on
  the real `App` from the chip row. No placeholder text survives anywhere in the section.
- **Four declines, ranked, and THE TIE HOLDS.** `fixtureDeclines` picks the fallers from the same
  eight pairs the chart above plots — FCZ `-CHF 150k`, Lugano `-CHF 110k`, Luzern `-CHF 70k`, Sion
  `-CHF 70k` — and **Luzern precedes Sion** in the rendered rows, asserted against the dataset's own
  order and against fixture order. US-023's rank is stable (ES2019 `sort`), so the demo cannot
  reshuffle between runs. The four risers are asserted absent, so the list is the fallers exactly.
- **Criterion 5 asserted END TO END on the rendered rows.** `getComputedStyle` reads **96px** and
  `white-space: nowrap` off every value cell here, plus one text node and no break for `-CHF 150k` —
  US-021's "must not be reverted" decision, verified where it matters, not only in its own suite.
- **`-CHF 400k total` is DERIVED from the rows on screen** (US-023's `driverTotal` through
  `hBarDisplayedValue`), in the card's action slot with the arrow, sign and `sr-only` word. No
  literal `400` exists in code; halving FCZ's fall moves the ranking AND the badge in test.
- **Narrative byte-identical**: UTF-8 hex against a retyped literal, exact length, an ASCII sweep,
  **all seven hyphens** pinned to `0x2d` (`(-CHF 150k)`, `(-110k)`, `(-70k)`, `pricing - the`,
  `Friday-night`, `kick-off`), and a match against the sentence in the backlog itself. The
  **"3,200" comma is left exactly as authored** — hand-authored prose against the app's U+2019
  separator, the tension US-011 recorded as known and accepted — and asserted as such.
- **The attendance note is worded independently of the narrative** so the verbatim clause exists in
  one place only; a source scan fails if "lower attendance rather than pricing" reappears in code.
  The panel is the **navy `narrative` variant**, not the gold one: this beat interprets rather than
  advises, and gold is spent once per beat, on the seam (asserted: exactly one gold mark).
- **Security triage — no security-relevant changes detected:** no endpoint, route, dependency, env
  var, storage, raw SQL, `innerHTML`, user-supplied URL, request or logging. One existing loader
  field is read by one more component; the data is aggregate ticketing named by opposing CLUB.
  56 new tests, **2081 green** (52 files).

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
- **The eight chips do not collide — measured, not assumed.** Eight equal cells, none overlapping,
  all right of the axis gutter, tallest bar (YB 1,610) clear of the chip band. Widest chip 59.5px in
  an 83.4px cell at 1440; a money-formatted chip would be **97.6px** and overlap by 14px, which is
  why `formatDelta` is given `formatSignedNumber` and the unit lives in the title `(CHF 000)`.
- **The tiles pair at `xl`, not `lg`** — two thirds of the canvas at 1024 leaves a 51.8px cell, so
  the pair stacks below `xl` (81.0px). Verified 1920→768: no overlap, no horizontal scroll. *Known
  limit:* at a 390px phone the cell is 36px and chips overlap — outside the 1920×1080 target.
- **Chrome pass (built SSR bundle):** three tiles in order, `CHF 7.83M` with `-0.6%` and a down
  arrow, compare bars `CHF 7.88M` / `CHF 7.83M` on one 336px track, `-CHF 50k vs Season 25/26`,
  fixture hover `FCZ · 25/26 CHF 1'390k · 26/27 CHF 1'240k · -CHF 150k`, month hover `Sep · CHF
  1'180k / CHF 1'240k`, re-ask → ONE section, **zero requests after first paint**, no console error
  but the pre-existing missing `favicon.ico`. Reduced motion: no zero-height bar, every line drawn.
- **Security triage — no security-relevant changes detected:** no endpoint, dependency, env var,
  storage, `innerHTML`, user-supplied URL, request or logging. The root loader gained one more
  static in-memory read; the data is aggregate ticketing named by opposing CLUB, no PII.
- 76 new tests, **2025 green**.

### US-035 — Hero 1 follow-up (2 pts) · 2026-09-10 · ✅ Done

The first **so-what** beat, and pure assembly: `DriverTile` (US-023) for the badge trend and
`RecommendationPanel` (US-024) for the advice, behind a gold **Follow-up** divider placed in
`hero-section.tsx` so US-037 and US-039 reuse it rather than each making their own.

- **Phase flips, never appends** — showing the follow-up leaves ONE section with the primary tiles
  in place, and the follow-up chip is withdrawn by US-029's derived visibility.
- **Narrative renders from the dataset** — the string appears zero times in the component layer,
  and is asserted byte-identical in tests.
- 43 tests added (1949 green); lint, format, typecheck, build all clean.

> **Provenance note:** dispatch was interrupted after implementation but before commit; the work was
> verified independently against its criteria and all five gates before being committed as `2881275`.

### US-034 — Hero 1 primary (3 pts) · 2026-09-10 · ✅ Done

**The first scripted answer, and it is composition: not one chart was built.** `VBarTile` (US-018)
and `DonutTile` (US-020) first mount here beside `HBarTile`, `Segmented` and US-024's section head;
`hero-1.tsx` holds layout, copy and ONE `periodKey`, and a source scan proves it has no `<svg>`.

- **THE SINGLE FILTER IS THE STORY.** One `Segmented` in the SECTION HEAD — a filter driving three
  tiles cannot belong to one of them — over one `periodKey` above all three: one press moves the
  bars, the ring and the names together, for **all four periods**, and again in real Chrome.
- **Nothing snaps:** no key of its own, so bars, arcs and rows reconcile by CATEGORY and transition
  (mid-flight `16’975 / 7’855 / 4’387`, never through zero; the same `<rect>` node across the press).
- **Narrative byte-identical** (UTF-8 hex, length 214, ASCII sweep, backlog cross-check), rendered
  from the dataset; **not one figure re-typed** — every displayed number ≥ 100 in all four periods
  absent from five sources. Badge segments sum EXACTLY to the donut centre (3’080 = 1’355+739+616+370).
- **Data reaches the sections through a ROOT loader** (`app/lib/dashboard/heroes.ts`, mirroring
  `baseline.ts`) — server-only repositories, and Chrome confirms **0 requests** after first paint.
- **Chrome pass (1440×950):** three tiles in order, hover `Home · 22’400 shirts · 58% · CHF
  2’217’600`, no overflow, no truncated label, re-ask → one section, zero console errors.
- **Security triage — no security-relevant changes detected.** The one new loader takes no input and
  reads static fixtures; aggregate merchandising, no PII, no named-individual figure. 57 new tests,
  **1906 green**.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-10
**Phase Status:** In Progress (5/6 · 13/16 pts)
**Previous:** [Phase 3a](phase-3a.md) · **Next:** [Phase 4 — Hardening](phase-4.md)
