# Phase 3b: Scripted Hero Flows & Narrative Orchestration

**Duration:** 2026-09-13 to 2026-09-14 (~6.6 AI-hours)
**Status:** ✅ Completed (6/6 · 16/16 pts)
**Started:** 2026-09-10
**Target Completion:** 2026-09-14
**Actual Completion:** 2026-09-10

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

**Priority:** P0 · **Status:** ✅ Completed (6/6) · **Dependencies:** Phases 1b, 2a, 2b, 3a

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-034 | Hero 1 primary — shirt sales, badge share, printed names | 3 | ✅ Done |
| US-035 | Hero 1 follow-up — which badge to push next | 2 | ✅ Done |
| US-036 | Hero 2 primary — ticket revenue year on year | 3 | ✅ Done |
| US-037 | Hero 2 follow-up — which fixtures are driving the drop | 2 | ✅ Done |
| US-038 | Hero 3 primary — department budget vs actual vs target | 3 | ✅ Done |
| US-039 | Hero 3 follow-up — why Marketing is off plan | 3 | ✅ Done |

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

> **US-039 was the causal peak**, and it shipped as one: the three drivers sum to Marketing's
> derived +410 variance, the conversion gap sits on the same tile, and the advice is an `aside` and
> not a fourth metric. Per the brief, this is the beat that separates this from "yet another
> dashboard project" — the distinction the owner said he cares about.

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
- **Completed Story Points:** 16 / 16 (100%)
- **Completed Stories:** 6 / 6
- **Tests Passing:** 2210 / 2210 · **Coverage:** 100% lines (`app/**`) · **Commits:** 6

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
| Narrative string paraphrased during implementation | High | Medium | Byte-level verbatim tests on all six narratives, cross-checked against the backlog | AI | ✅ Closed |
| A figure re-typed into a hero drifts from the dataset | High | Medium | Source scans in all six hero suites; no displayed figure exists in the component layer | AI | ✅ Closed |
| Upstream phase slips and compresses this one | High | Medium | Did not occur — the phase ran in one day | Human | ✅ Closed |
| Scope difference between Hero 2's charts reads as an error | Medium | Medium | Both charts labelled with their scope (US-009, US-036) | AI | ✅ Closed (US-036) |
| Hero 3 follow-up under-delivers as the emotional peak | High | Low | Shipped: cause first, both halves of the story on one tile, advice as a gold `aside` | AI | ✅ Closed (US-039) |

---

## Progress Log

### US-039 — Hero 3 follow-up, THE CAUSAL PEAK (3 pts) · 2026-09-10 · ✅ Done

**The beat the whole prototype exists to produce, and it is composition: no module was created.**
`hero-3.tsx` gained a phase branch of three grid rows — US-035's shared `FollowUpDivider`, one
`DriverTile` (US-023) and `RecommendationPanel` (US-024) in its **gold `recommendation` variant** —
plus `followUp` on its props and in the dispatch. **`hero-section.tsx` LOST `PlaceholderFollowUp`
and its two constants: the last stand-in in the product is gone, and a scan of every `app/**` source
proves it.**

- **THE DRIVERS EXPLAIN THE WHOLE OVERSPEND.** Match activations `CHF 240k`, Paid social `CHF 150k`,
  Agency retainer `CHF 20k`, and the action-slot badge **`CHF 410k total` is summed from the rows on
  screen** (US-023's `driverTotal`) — which is exactly `departmentVariance` for the department the
  table above flags. Asserted as an EQUALITY, both in the data and on screen.
- **The retainer renders although the narrative omits it.** The sentence says "concentrated in two
  areas" and those two are 390 of the 410; the third row is what closes the arithmetic, and tests
  pin both facts. The paid-social ROW says `CHF 150k`, not the narrative's `18%` — two different
  facts about one driver, and the dataset carries only the money (US-011's allowlist).
- **BOTH HALVES OF THE STORY, ON ONE TILE.** Under the bars: *"What that money was meant to buy:
  webshop conversion 2.2% vs 2.6% plan"* — worded independently of the verbatim clause, with both
  percentages from the dataset through `formatPercent`.
- **The verdict is still not made in a component.** The badge's ADVERSE reading comes from
  `derive.ts`, through the `judgement` on the flagged row, so `hero-3.tsx` contains no
  `FAVOURABLE|ADVERSE`; flipping the department's *type* in test flips the badge to FAVOURABLE.
  "Marketing" appears in the layer exactly ONCE — the AC-pinned tile title — and never in a lookup.
- **The advice is not a metric:** `aside`, `data-variant="recommendation"`, accent down the side,
  no card chrome, not counted among the tiles, and the section's only three gold marks are the seam
  and the panel (a chart inside the beat is still a chart).
- **Narrative byte-identical**: UTF-8 hex against a retyped literal, exact length **468**, ASCII
  sweep, all **three** hyphens (`paid-social` ×2, `underdelivered - conversion`) pinned to `0x2d`,
  the apostrophe in `Marketing's` pinned to `0x27`, `matchday` left as one word, and a match against
  the sentence in the backlog itself. Rendered from the dataset; absent from the component layer.
- **Chrome pass — THE WHOLE DEMO SCRIPT in one session (built SSR bundle, 1920×1080):** baseline
  4 cards → three heroes (12 cards) → three follow-ups, the third asked by TYPING the loose *"why is
  marketing high?"* (15 cards, 3 seams, 3 panels, every section `withFollowUp`) → off-script
  question → graceful fallback with the three sections untouched → **Reset back to 4 cards**.
  **Zero requests after first paint, zero console errors.** Beat measured at six widths
  (1920/1440/1280/1024/834/768): no horizontal overflow anywhere, every value on ONE line, tile and
  panel side by side from `lg`.
- **Security triage — no security-relevant changes detected:** no endpoint, route, dependency, env
  var, storage, raw SQL, `innerHTML`, user-supplied URL, request or logging. One existing loader
  field is read by one more component. The section stays **AGGREGATE**: departmental spend
  categories and a webshop conversion rate — no salary, no headcount, no named individual.
- 63 new tests, **2210 green** (54 files), 100% lines. **Phase 3b closed: 6/6, 16/16 points.**

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
of three grid rows — the shared `FollowUpDivider`, one `DriverTile`, and `RecommendationPanel` in its
**`narrative` variant** — and **no new module, no bar, no badge and no divider was built**.

- **The phase FLIPS, it does not append.** One section, four cards, the three primary tiles in place,
  the beat joining the same cascade at steps 3/4/5; the follow-up chip withdrawn by US-029.
- **Four declines, ranked, and THE TIE HOLDS.** FCZ `-CHF 150k`, Lugano `-CHF 110k`, Luzern and Sion
  `-CHF 70k` each — **Luzern precedes Sion**, asserted against fixture order; US-023's rank is stable
  (ES2019 `sort`), so the demo cannot reshuffle between runs.
- **Criterion 5 asserted END TO END** on the rendered rows: `getComputedStyle` reads **96px** and
  `white-space: nowrap` off every value cell — US-021's "must not be reverted" decision.
- **`-CHF 400k total` DERIVED from the rows on screen**; halving FCZ's fall moves ranking and badge.
- **Narrative byte-identical** (UTF-8 hex, exact length, ASCII sweep, all seven hyphens `0x2d`,
  backlog cross-check). The **"3,200" comma is left exactly as authored** (US-011's known tension),
  and the attendance note is worded independently so the verbatim clause exists in one place.
- Panel is **navy**, not gold: this beat interprets rather than advises, and gold is spent once per
  beat. Security triage: nothing relevant; aggregate ticketing. 56 new tests, **2081 green**.

### US-036 — Hero 2 primary (3 pts) · 2026-09-10 · ✅ Done

Composition again, and the first mount of `GroupedBarTile` (US-019). Only `CompareBars` was new
(US-038's overall tile reuses it), and it borrows `hBarMax`, `hBarPercent` and `H_BAR_SERIES` rather
than restating them.

- **BOTH SCOPE LABELS ON SCREEN, and the mismatch asserted as REAL** — eight fixtures (7,830) against
  all home fixtures per month (9,770). No section-level scope line: one line cannot describe two.
- **Every total derived** by `fixtureTotals`: `CHF 7.83M`, `CHF 7.88M`, `-CHF 50k`, `-0.6%`. The
  dataset holds no `total|delta|pct` key; editing FCZ moves the headline to `+1.3%` in test.
- **Narrative byte-identical** (UTF-8 hex, length 229, ASCII sweep, both hyphens `0x2d`, backlog
  cross-check). **The eight delta chips do not collide — MEASURED:** widest 59.5px in an 83.4px cell
  at 1440, which is why `formatDelta` is `formatSignedNumber` and the unit lives in the title.
- Chrome pass 1920→768, zero requests after first paint. Security triage: nothing relevant; aggregate
  ticketing named by opposing CLUB. 76 new tests, **2025 green**.

### US-035 — Hero 1 follow-up (2 pts) · 2026-09-10 · ✅ Done

The first **so-what** beat, and pure assembly: `DriverTile` (US-023) and `RecommendationPanel`
(US-024) behind a gold **Follow-up** divider placed in `hero-section.tsx` so US-037 and US-039 reuse
it rather than each making their own.

- **Phase flips, never appends**; the follow-up chip is withdrawn by US-029's derived visibility.
- **Narrative renders from the dataset** — zero occurrences in the component layer, byte-identical.
- 43 tests added (1949 green); all five gates clean.

> **Provenance note:** dispatch was interrupted after implementation but before commit; the work was
> verified independently against its criteria and all five gates before being committed as `2881275`.

### US-034 — Hero 1 primary (3 pts) · 2026-09-10 · ✅ Done

**The first scripted answer, and it is composition: not one chart was built.** `VBarTile` (US-018)
and `DonutTile` (US-020) first mount here; a source scan proves `hero-1.tsx` has no `<svg>`.

- **THE SINGLE FILTER IS THE STORY.** One `Segmented` in the SECTION HEAD over one `periodKey` above
  all three tiles: one press moves the bars, the ring and the names together, for all four periods.
  **Nothing snaps** — tiles reconcile by CATEGORY and transition (`16’975 / 7’855 / 4’387` mid-flight).
- **Narrative byte-identical** (length 214, backlog cross-check); **not one figure re-typed** — every
  displayed number ≥ 100 in all four periods absent from five sources. Badge segments sum EXACTLY to
  the donut centre (3’080 = 1’355+739+616+370).
- **Data reaches the sections through a ROOT loader** (`app/lib/dashboard/heroes.ts`); Chrome confirms
  **0 requests** after first paint. Security triage: nothing relevant, aggregate merchandising.
  57 new tests, **1906 green**.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-10
**Phase Status:** ✅ Completed (6/6 · 16/16 pts)
**Previous:** [Phase 3a](phase-3a.md) · **Next:** [Phase 4 — Hardening](phase-4.md)
