# Phase 1b: Dummy Data Model & Seed Datasets

**Duration:** 2026-09-09 to 2026-09-10 (~4.5 AI-hours)
**Status:** Completed
**Started:** 2026-09-09
**Target Completion:** 2026-09-10
**Actual Completion:** 2026-09-09

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

**Priority:** P0 · **Status:** ✅ Completed (5/5) · **Dependencies:** US-001

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-007 | Persona baseline datasets (4 tiles) | 2 | ✅ Completed |
| US-008 | Hero 1 dataset — shirt sales, badges, printed names | 2 | ✅ Completed |
| US-009 | Hero 2 dataset — ticket revenue year on year | 2 | ✅ Completed |
| US-010 | Hero 3 dataset — departmental performance | 2 | ✅ Completed |
| US-011 | Formatters & cross-hero reconciliation | 2 | ✅ Completed |

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
- **Guardrail:** no salary and no named-individual performance data in any dataset. Squad names
  (Shaqiri, Sow, Metinho, Daniliuc) appear only as shirt-print counts — merchandising data about
  public figures, not performance data.

---

## Definition of Done *(applies to every story in this phase)*

- [x] Code implemented and reviewed against `.claude/rules/code-quality.md`
- [x] Unit tests cover reconciliation and formatter behaviour; coverage ≥ 80%
- [x] Security triage run per `.claude/rules/security-review.md`
- [x] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix (no endpoints) · i18n (English only) · database migrations
(no database — see `.claude/rules/database.md` for the expansion path only).

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 10 · **Stories:** 5 · **Epics:** 1
- **Estimated Effort:** ~15 team-hours → ~4.5 AI-core hours
- **Risk Level:** Low (mechanical work — every figure is pinned in the specification)

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 10 / 10 (100%)
- **Completed Stories:** 5 / 5
- **Tests Passing:** 418 / 418 · **Coverage:** 100% stmts / 98.9% branches (`app/**`) · **Commits:** 5

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
| Figures re-typed in a component instead of referenced | High | Medium | US-011 enforces store-once-reference-everywhere; `reconciliation.test.ts` asserts the stored key set of every hero, so a re-typed total fails the suite | AI | ✅ Closed |
| Cross-hero totals appear contradictory in the room | High | Medium | Scope labels on every affected tile (see Technical Notes), asserted together with the intended inequality in US-011 | AI | ✅ Closed |
| Rounding makes segments not sum to the total | Medium | Medium | `badgeSegments` corrects the remainder explicitly; proved exhaustively for totals 0-2,000 (US-008) | AI | ✅ Closed |
| Narrative copy edited and figures no longer match | High | Low | Narratives are verbatim and live beside the figures; US-011 sweeps every number in all six narratives against the reachable data | AI | ✅ Closed |

---

## Progress Log

### 2026-09-09 — US-007: Persona baseline datasets (2 pts) ✅

Established the data pattern the rest of E3 follows. Enum keys in
`app/lib/repositories/enums.ts`, domain types plus the repository interface in `types.ts`, derived
figures in `derive.ts`, fixtures and the in-memory implementation in `app/lib/mock/baseline.ts`,
selection in `index.server.ts`. Recorded in `app/lib/repositories/README.md` as a four-step recipe so
US-008 / US-009 / US-010 are mechanical.

**Scope:** intentionally exceeds the written acceptance criteria, per the user's approved decision —
all four periods of the webshop series, attendance block and top-products table, not the single
period the criteria describe. The Reference Guide is definitive (`scope.md` §10).

- The four Specification-pinned figures hold and are asserted: CHF 148,200 this month at +11.9%
  (+12% rounded), FCB 2-1 Sion at 28,900 of ~38,000, this month's five product lines, 6 partners.
- **Totals and deltas are computed, never stored** (`seriesTotals`), so the headline number cannot
  disagree with the chart under it.
- "Last 3 months" and "Year to date" derive their x-axis labels from the current date through an
  injectable `Clock`, so the demo never looks stale and tests never touch the wall clock.
- A figure used twice is written once: last month's revenue series *is* this month's comparison
  series, and the monthly points for the last three months are the sums of the weekly series.
- Partner brand colours are brand colours, not design tokens — Bitpanda teal and Sunrise red sit
  outside the FCB palette on purpose, and a test fails if a later change "fixes" them.
- 47 tests added (228/228 green), coverage 100% statements over `app/**`; lint, format, typecheck
  and build all clean. Security triage: no security-relevant changes (static local data, no
  endpoint, no dependency, no environment variable, no user input).

### 2026-09-09 — US-008: Hero 1 dataset, shirt sales, badges, printed names (2 pts) ✅

The first hero dataset, and the first test of whether the US-007 recipe actually generalises. It did:
`SEASON_TO_DATE` extends the existing `PeriodKey` (joined by a new `KitVariant` enum and its label
map), domain types plus `Hero1Repository` go in `types.ts`, derived figures in `derive.ts`, fixtures
and the implementation in `app/lib/mock/hero1.ts`, one line of selection in `index.server.ts`.

**Scope:** the delivered set intentionally exceeds the written acceptance criteria, per the user's
approved decision — all four periods (season to date, last 3 months, last month, current month),
not only the season-to-date figures the criteria describe. The tile has a period switch and every
position on it must have data behind it; the Reference Guide is definitive for the experience
(`scope.md` §10).

- **One hero object with `primary` and `followUp`**, per the epic rule, so the badge-trend
  escalation cannot drift from the figures its narrative quotes. `scopeLabel` is
  "Season-to-date merchandising" — the scope difference against Hero 2 and Hero 3 is stated on the
  tile, not left for someone in the room to reconcile.
- **Nothing derivable is stored.** Kit revenue is units x CHF 99, the Home share is 22,400 / 38,500
  = 58.18% (displays 58%), the badge share is 3,080 / 38,500 = exactly 8%, and the four sponsor
  segments are computed. The Reference Guide stores `homeShare: 58`; that deliberately did not
  survive the port, because a stored 58 outlives an edit to the units beneath it.
- **`badgeSegments` closes the rounding risk on this phase's risk register.** It corrects the
  remainder into the first segment (Bitpanda, the largest share), and the proof is exhaustive rather
  than anecdotal: the four parts sum *exactly* to the total for every total from 0 to 2,000, for all
  four real period totals, and at adversarial values (0, 1, 7, and a run of primes).
- Season-to-date arithmetic asserted: 38,500 shirts; CHF 2,217,600 / 1,019,700 / 574,200 =
  CHF 3,811,500 (~3.81M); badge percentages 44/24/20/12 summing to 100.
- **Both narratives are verbatim**, verified byte-for-byte against the source by SHA-256 and pinned
  in the suite by exact text *and* exact length, so a later reword fails rather than ships.
- Guardrail held and tested: squad names appear only as shirt-print counts, and no salary, goals,
  assists, appearances, minutes or rating value exists anywhere in the dataset.
- The baseline fixture was narrowed to its own four period keys so extending the shared enum could
  not silently demand invented figures from a dataset that has none.
- 45 tests added (273/273 green), coverage 100% statements / 98.4% branches over `app/**`; lint,
  format, typecheck and build all clean. Security triage: no security-relevant changes (static local
  data, no endpoint, no dependency, no environment variable, no user input, no network call).

### 2026-09-09 — US-009: Hero 2 dataset, ticket revenue year on year (2 pts) ✅

Third pass through the US-007 recipe, and the first one where the *labelling* mattered more than the
arithmetic. New `SeasonKey` and `MonthKey` enums with their label maps in `enums.ts`, domain types
plus `Hero2Repository` in `types.ts`, derived figures in `derive.ts`, fixtures and the implementation
in `app/lib/mock/hero2.ts`, one line of selection in `index.server.ts`.

**Scope:** intentionally exceeds the written criteria, per the user's approved decision — the
month-by-month series (twelve points per season) is a Reference Guide addition the tile draws.

- **The two charts are at DIFFERENT scopes on purpose, and the data says so.** `scopeLabel` sits on
  each series: the fixture chart is "Eight highest-grossing home fixtures, matchday ticket revenue
  excluding the season-ticket base" (7,880 → 7,830), the monthly chart is "All home fixtures per
  month …" (9,880 → 9,770). Summing the months and comparing gives a bigger number — intended, and
  now stated rather than left for someone in the room to reconcile. A test asserts both labels exist,
  differ, and that the monthly total is the larger of the two.
- **Nothing derivable is stored.** The Reference Guide stores `totalPrev`, `totalCurr`, `deltaPct`
  *and* a second list of `declines`; none of them survived the port. Totals come from the same
  `seriesTotals` the baseline band uses, so -50 / 7,880 = -0.63% displays as -0.6% under exactly one
  rounding rule; `fixtureDeclines` recovers FCZ -150, Lugano -110, Luzern -70, Sion -70 *from the
  fixture pairs* (stable sort keeps Luzern before Sion), and `declineTotal` produces the tile's
  -CHF 400k badge. Nothing is re-typed, so nothing can drift.
- **One hero object with `primary` and `followUp`.** The follow-up carries a narrative and nothing
  else — its four fixtures are the primary's fixtures, seen through `fixtureDeclines`.
- **Both narratives verbatim**, extracted from the source and compared programmatically, then pinned
  in the suite by exact text, exact length (229 / 338) and a printable-ASCII range check. The
  hygiene rule that bans "CHF" and comma-grouped digits from stored strings is scoped to the *data*
  strings here, because this hero's verbatim copy legitimately says "-CHF 150k" and "3,200".
- `MONTH_LABEL` is pinned to the baseline band's `Intl`-derived month names by test, so the two
  spellings of "Jul" cannot diverge.
- Guardrail held and tested: fixtures are clubs, and no squad name, salary or performance figure
  appears anywhere in the dataset.
- 31 tests added (304/304 green), coverage 100% statements / 98.4% branches over `app/**`; lint,
  format, typecheck and build all clean. Security triage: no security-relevant changes (static local
  data, no endpoint, no dependency, no environment variable, no user input, no network call).

### 2026-09-09 — US-010: Hero 3 dataset, departmental performance (2 pts) ✅

Fourth pass through the US-007 recipe, and the one where a *tag* carried the meaning. New
`DepartmentType` (REVENUE / COST) and `VarianceJudgement` enums with their label maps in `enums.ts`,
domain types plus `Hero3Repository` in `types.ts`, derived figures in `derive.ts`, fixtures and the
implementation in `app/lib/mock/hero3.ts`, one line of selection in `index.server.ts`.

- **Revenue vs Cost is modelled so a consumer cannot get it wrong.** The sign of a variance does not
  carry its meaning: Sponsoring's +840 is money earned, Marketing's +410 is an overspend. Each row
  therefore carries its `type` *and* a derived `judgement` (`FAVOURABLE` / `ADVERSE` / `NEUTRAL`)
  decided once in `varianceJudgement`, so a tile reads a key and picks a colour instead of inferring
  from the number. Tested in both directions, including a test that shows a naive "variance > 0 is
  good" rule would misread exactly one department — Marketing.
- **The flag is derived, not stored.** The Reference Guide carries `flag: true` on the Marketing row;
  it did not survive the port. `departmentsNeedingAttention` finds the departments both over budget
  *and* behind target from the figures, and a test asserts there is exactly one and that it is
  Marketing. Four departments are over budget and three are behind target on their own — only the
  conjunction is rare, which is what makes the narrative's claim worth checking.
- **Nothing else derivable is stored either.** `totalBudget` / `totalActual` are not ported:
  `departmentTotals` produces 69,000 → 69,680, +680, and +0.99% displayed as +1.0% through the same
  `percentChange` the baseline band uses (now the app's single `oneDecimal` rounding rule). The
  narrative's two quoted variances are derived too: Merchandising -7.65% → -7.7% ("7.7% under") and
  Marketing +12.06% → +12.1% ("12% over"). The one stored figure is `blendedTargetPercent: 96` — a
  measured club-level attainment that no arithmetic over the six rows reproduces (their plain mean is
  97.0, budget-weighted 99.7), pinned by a test so nobody later "fixes" it into a mean.
- **The follow-up reconciles with the table above it.** Match activations 240 + paid social 150 +
  agency retainer 20 = 410, *exactly* Marketing's derived variance — asserted. The agency retainer is
  a Reference Guide addition the Specification never mentions, included per the approved full-JSX
  scope decision; without it the drivers would not add up to the overspend they explain. The
  conversion gap (2.2% against a 2.6% plan) derives three distinct numbers: 84.6% attainment (the
  "~85% of target"), -0.4 percentage *points*, and a -15.4% relative shortfall.
- **The scope label is data, as in US-009.** "Full-year departmental totals … Ticketing includes the
  season-ticket base, so it exceeds the sum of Hero 2's shown fixtures" — 24,360 here against Hero
  2's 7,830 is intended, and now stated on the tile rather than left to be reconciled in the room.
- **Both narratives verbatim**, extracted from the source and compared programmatically (both
  identical, 270 / 468 characters, pure printable ASCII), then pinned in the suite by exact text,
  exact length and an ASCII-range check.
- Guardrail held and tested on the dataset closest to the line: departments, never people. No salary,
  wage, bonus, headcount, FTE, payroll or named individual appears anywhere in it.
- 44 tests added (348/348 green), coverage 100% statements / 98.7% branches over `app/**`; lint,
  format, typecheck and build all clean. Security triage: no security-relevant changes (static local
  data, no endpoint, no dependency, no environment variable, no user input, no network call).

### 2026-09-09 — US-011: Formatters & cross-hero reconciliation (2 pts) ✅

Phase 1b closes with the two things that keep the other four stories honest: one display layer
(`app/lib/format.ts`, pure and stateless) and one drift alarm (`tests/unit/reconciliation.test.ts`).

- **Money always carries its unit.** `formatMoney` → `CHF 3’811’500`; `formatMoneyCompact` →
  `CHF 150k` and `-CHF 150k` with **the sign before the unit**, as the declining-fixtures badge reads
  — and no bare-amount variant exists to reach for by mistake ("currency shown without unit" is a
  Specification edge case). Millions render bare (`69.68`) under the "figures in CHF millions"
  subtitle; no "000" note anywhere.
- **One rounding rule, not two.** `oneDecimal` was made public in `derive.ts` and *imported* by the
  formatters, never restated. `chfFromThousands` is the only factor of 1000 in the app.
- **Locale decided deliberately.** `Intl.NumberFormat("en-CH")` per the Reference Guide, which groups
  with U+2019 (`3’811’500`) — the Swiss mark, kept because the approved prototype renders it, pinned
  as a constant, and made **runtime-independent** (whatever separator ICU produced is rewritten to the
  pinned one; two tests stub `Intl` to `en-US` and `de-DE` to prove it).
- **Variance never rides on colour.** Sign plus a new `VarianceDirection` enum (UP / DOWN / FLAT with
  an accessible label map) — a direction key, never a glyph or a hex, so the component owns the
  colour. Tabular numerals stay in the token layer; a test reads that declaration back out of
  `app/app.css` so `TABULAR_NUMERALS_CLASS` cannot become a second source of truth.
- **The reconciliation suite asserts relationships, not constants.** 39 tests: 22,400 + 10,300 +
  5,800 = 38,500, Home share 58.18% → 58%, badge *exactly* 8.00%, badge segments summing to their
  period total in all four periods, 38,500 × CHF 99 = CHF 3,811,500 split 2.218 / 1.020 / 0.574M;
  7,880 → 7,830 = -50 → -0.6% with declines 150+110+70+70 = 400 and monthly totals larger than
  fixture totals *on purpose*; 69,000 → 69,680 = +680 → +1.0%, Merchandising -7.65% → "7.7% under",
  Marketing +12.06% → "12% over" and the one department both over budget *and* behind target, its
  drivers 240+150+20 = 410 = its variance. **No drift found.**
- **The intended cross-hero inequality is asserted as such:** Hero 3 Ticketing 24,360 (season tickets
  included) legitimately exceeds Hero 2's 7,830 matchday fixtures, with both scope labels checked;
  Hero 1's shirt revenue is likewise asserted to sit *inside* Hero 3's Fanshop actual.
- **Store-once is asserted structurally:** each hero's stored key set is pinned, so a re-typed total,
  variance, share or decline list fails the suite, and labels are checked against the shared enum
  maps. Every number in all six narratives is swept against the figures the data can produce, with
  two documented narrative-only exceptions (Hero 2's "3,200 fewer seats", Hero 3's "18%").
  `blendedTargetPercent: 96` re-verified as a stored measurement (mean 97.0, budget-weighted 99.7,
  actual-weighted 99.8 — none of them 96) and pinned against being "fixed".
- 70 tests added (418/418 green), coverage 100% statements / 98.9% branches over `app/**`; lint,
  format, typecheck and build all clean. Security triage: no security-relevant changes (pure string
  formatting of static local data — no endpoint, no dependency, no env var, no user input, no network
  call, no `innerHTML`).

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** ✅ Completed
**Previous:** [Phase 1a](phase-1a.md) · **Next:** [Phase 2a — Shell](phase-2a.md)
