# Daily Work Summary

**Date:** 2026-09-10 (Thursday) · **Last Updated:** 2026-09-10
**Covers:** day 1 (2026-09-09, 32 stories) and day 2 (2026-09-10, US-033 to US-036)

---

## Today's Summary

**Stories Completed:** 36 — **Phases 1a, 1b, 2a, 2b AND 3a ALL complete.** Day 2 closed Phase 3a
with US-033 (6/6 · 17/17) and took Phase 3b to halfway: **Heroes 1 and 2 both answer, and Hero 1
also so-whats** (US-034 to US-036).
**Story Points:** 94
**Time Worked:** ~25.5 hours · **Files Changed:** 288 · **Tests Added:** 2025

---

## Work Log

- **Phase 1a — US-001 to US-006 (14 pts), closed.** Condensed; full account in
  [`../phases/phase-1a.md`](../phases/phase-1a.md): the RR 7.18 SSR scaffold verified by execution
  (US-001, Railway deploy still a human step); ESLint 9 + Prettier + husky with the hook *proved* to
  fire (US-002); one design-token set in Tailwind v4 properties and typed objects, held in lockstep
  by a drift test (US-003); the crest self-hosted after verifying its bytes were PNG (US-004); one
  `Card` shell of collapsing slots (US-005); and the four reveal keyframes plus `app/lib/motion.ts`,
  where **reduced motion renders final state** (US-006).
- **Phase 1b — US-007 to US-011 (10 pts), closed.** Condensed; full account in
  [`../phases/phase-1b.md`](../phases/phase-1b.md). US-007 set the shape (enums, types, repository
  interface, fixtures in `app/lib/mock/`, server-only selection, every headline **computed from the
  series**); US-008 to US-010 built the three hero datasets with **nothing derivable stored** — kit
  revenue as units × CHF 99, `badgeSegments` correcting its rounding remainder, `scopeLabel` a field,
  and `varianceJudgement` deciding good-or-bad once from `DepartmentType`. US-011 made
  `app/lib/format.ts` the one place a number becomes a string and swept every narrative number:
  **no drift found.** 418/418.
- **US-012 / US-014 / US-015 — shell, insertion, reset (8 pts), Phase 2a's first three.** Condensed;
  full account in [`../phases/phase-2a.md`](../phases/phase-2a.md). The navy sidebar, app bar and a
  canvas grid stepping 12 → 8 → 4, with the **persona a role**, the placeholder nav **inert by
  construction** and the connection status **decorative**. Then the mechanic the demo turns on: the
  dashboard **grows, it never clears** — a memory-only `{heroId, phase, revision}` list, pure
  transitions in `sections.ts`, sections as direct children of the SAME grid via `grid-cols-subgrid`,
  re-asking refreshing in place, a follow-up flipping its parent's phase. And Reset as a **fourth
  transition, not a mode**, cancelling the pending beat first and idempotent by reference.
  592/592 green.
- **US-027 — Motion & animation hooks.** Phase 2b opens with the story every other component in it
  depends on: `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`. **Count-up counts from the
  figure on screen, not from zero** — a test proves a target changed mid-flight opens the new
  animation *on that very figure* and lands exactly on target. **Reduced motion means final state in
  the same render:** `useGrow` is `true` on the first render with **zero** frames requested. One
  reduced-motion source, everything cancelled on unmount, SSR proven by `hydrateRoot`. 52 tests.
- **US-017 — KPI tile & variance chip.** The first component on those hooks and the shape the other
  nine follow: `DeltaChip`, `KpiSparkline`, `KpiFigure`, `KpiTile`. **"Colour is never the sole
  signal" stops being a slogan:** on navy the up and down chips' class strings are asserted
  **identical** while glyph, sign and spoken word differ. **Direction is arithmetic, judgement is
  meaning.** 78 tests, 722/722.
- **US-021 — Horizontal bar tile.** The most reused chart, built once for five consumers as
  `HBarRow` / `HBars` / `HBarTile`. **Both review decisions are read back off the rendered
  element:** a 150px label column with truncation *rejected* (so `Cap "Rotblau"` cannot regain its
  ellipsis) and a 96px `nowrap` value column via `getComputedStyle`. **The sign of the displayed
  figure** sets anchor side, token and text sign; rows keyed by name, so a filter transitions the
  *same* bar. 55 tests.
- **US-016 — Hero band. Phase 2a is closed (5/5 · 16/16).** The navy band above the baseline row,
  and the first thing to mount `LineChart` and `Segmented`. **ONE `Segmented` drives both halves**
  from a single `BaselinePeriod` entry, so the chart and the new `AttendanceRing` cannot disagree
  about the month — the shape US-034 reused for three tiles. **The total and its delta are
  `seriesTotals` off the plotted array.** Chrome-verified at 1920×1080. 92 tests.
- **US-018 — Vertical bar chart tile.** The kit-split chart US-034 composes. **Bar persistence is
  the story and the test is a re-rank:** columns keyed by category, so a filter press hands `Home`
  the *same* `<rect>` and its geometry transition carries it — an index key **fails exactly two
  tests**. Gradient caps, hover highlight, wrapping DOM-text labels. 52 tests.
- **US-019 — Grouped bar chart tile.** US-036's fixture chart: **sixteen bars and eight delta chips
  in one tile**. The review's overlap fix is arithmetic and both halves are measured — a 44-unit left
  gutter and a 34-unit chip band kept empty by an axis maximum *derived from the geometry*. 63 tests.
- **US-020 — Donut / ring tile.** US-034's sponsor-badge ring, deliberately a different component
  from US-016's single-arc `AttendanceRing`. **Two hover surfaces write ONE state** (arc and legend
  row), and **the segments morph** — arcs keyed by SPONSOR, so a period press transitions the same
  `<circle>` while one `useCountUp` carries the centre, never via zero. **The arithmetic is
  `badgeSegments`'** (US-008), imported not restated. 56 tests, 1261/1261.
- **US-022 — Department table tile.** Hero 3's primary tile as a real `<table>`. **The revenue/cost
  trap is closed by construction:** colour comes from `row.judgement` (US-010) through `DeltaChip`,
  so **Marketing's +410 renders UP and ADVERSE** while Sponsoring's +840 renders FAVOURABLE, and a
  source scan blocks the judgement migrating back in. 54 tests, 1315/1315.
- **US-023 — Driver / breakdown tile.** `DriverTile`, `DriverTotalBadge` and the pure
  `rankDrivers` / `driverTotal`, for all three causal follow-ups. **It draws no bars, and the tests
  keep it that way:** every row is US-021's `HBarRow` through `HBarTile`, and a source scan rejects
  bar geometry, the width constants, the motion hooks and local state. It adds tie-stable ranking, a
  total **derived from the rows on screen**, and a note line. 43 tests, 1358/1358.
- **US-024 — Recommendation panel & narrative caption strip.** The last story of Phase 2b. **The
  strip was reused, not rebuilt**, and **the panel is structurally not a tile** — an `aside`, told
  apart from a `Card` by test. **Verbatim asserted byte for byte**; the narrative comes before every
  chart. 35 tests, 1393.
- **US-028 — Persistent prompt bar. Phase 3a opens.** The product's only user input. **ONE bordered
  field IS the typing area** — a test rejects any descendant border or ring. **A real `<form>`**, so
  Enter and the button share one path; **debounce with no second clock**. 48 tests, 1441.
- **US-029 — Suggestion chips & chip lifecycle. The screen can now be ASKED a question (2/6 ·
  5/17).** **THE ROW IS DERIVED, NOT STORED:** criterion ③'s "removed once shown" is implemented in
  **no line of code** — the phase flip stops deriving it. Proved over **all 27** hero × phase
  combinations; **US-015's criterion ② is thereby SATISFIED**. 57 tests, 1498/1498.
- **US-030 — Intent normalisation, scoring & tie-breaking. A freely TYPED question now resolves
  (3/6 · 10/17), and this was the riskiest story in the build.** The acceptance is qualitative, so
  **the suite is the deliverable as much as the code. A FAITHFUL PORT, VERIFIED NOT TRUSTED:**
  normalise → **+2 / +1** → threshold **2 hero / 3 follow-up** → **strictly-greater** over an
  ordered config, with an **oracle** test asserting identical scores *and* winners over a 90-phrase
  corpus. **34 paraphrases**; a **three-way** 2/2/2 tie goes to Hero 1; one input yields **one**
  match or `null`. **The two inherited over-matches are PINNED.** No model, no dependency — scanned.
  89 tests, 1587/1587.
- **US-031 — Thinking beat. The answer no longer appears the instant it is asked, and it is
  stagecraft rather than a query.** `thinking.ts`, `use-thinking.ts` and `thinking-panel.tsx`, wired
  in `root.tsx`. **No request is made** (scanned). **THE ORDERING IS ASSERTED:** at `1150ms - 1` the
  panel is up with NO section; at `1150ms` the section is there and the panel gone — landing it
  immediately fails **22** tests. **Both paths pause and neither module changed**, and a no-match
  calls neither action, so an off-script question shows **no beat**. **Still ONE timer**, so
  **US-015 criterion ④ is satisfied**, proved by mutation twice over. 91 tests, 1678/1678.
- **US-032 — Graceful fallback panel. The screen can no longer dead-end (5/6 · 14/17).** Two panels,
  never conflated; the copy **byte-identical** against a literal *and* the backlog; criterion ②
  asserted as an ABSENCE (18 blame words, no alert role, the question never echoed); no beat
  precedes it; the three panels mutually exclusive by construction. 125 tests, 1803/1803.
- **US-033 (2026-09-10) — Follow-up context gating. PHASE 3a CLOSES at 6/6 · 17/17.**
  `follow-up-gate.ts` holds the rule as two pure functions read by BOTH the answer
  (`use-dashboard.ts`) and the beat (`use-thinking.ts`). **Stated plainly: the behaviour was already
  correct at HEAD** — `withFollowUpShown` alone is a no-op for an absent hero, but no caller ever
  invoked it ungated, so reverting the wiring fails only the 2 source-scan tests. The story is
  therefore the rule made explicit and proved, and the dead end is guarded by **mutation** (the
  ungated call fails 10 tests). **The two-step runs on the real `App` for all three heroes:** cold
  typed follow-up → PARENT at `primary` → chip offered → tap → phase flips, one section never two.
  **Criterion ④ by source scan** — `hasSection` has exactly two readers, so gating and chip
  visibility are two readings of ONE list and Reset re-gates for free. **Criterion ⑤ twice** — as a
  property over all 27 sessions and on the real `App`. 46 tests, 1849/1849.
- **US-034 to US-036 (2026-09-10) — PHASE 3b AT HALFWAY (3/6 · 8/16).** Full account in
  [`../phases/phase-3b.md`](../phases/phase-3b.md). All three stories are **composition, not
  invention**: `VBarTile`, `DonutTile` and then `GroupedBarTile` reach a screen for the first time,
  and neither hero file holds an `<svg>` or a re-typed figure (proved by scan). US-034's ONE
  `Segmented` in the section head moves bars, ring and names together and **nothing snaps**;
  US-035 **flips** the section into its so-what beat behind a shared gold divider; US-036 answers
  Hero 2 with **both scope labels on screen and the mismatch proved real** (monthly 9,770 >
  fixtures 7,830), every total derived from the eight pairs the bars plot, and the eight delta chips
  **measured in Chrome** (59.5px in 83.4px cells; the pair stacks below `xl` because 1024 leaves
  51.8px). Three narratives byte-identical — hex, exact length, ASCII sweep, hyphens at 0x2d, and
  against the backlog itself. 176 tests, 2025/2025.

---

## Stories Completed Today

- ✅ **Phase 1a — US-001 to US-006 (14 pts), closed 6/6.** US-001 4/5 criteria (Railway deploy
  deferred); US-002 to US-006 all met — the token set's two halves held in lockstep by a drift test,
  the crest verified from its bytes, one card shell, and reduced motion rendering final state.
- ✅ **Phase 1b — US-007 to US-011 (10 pts), closed 5/5.** Every criterion met, and US-007 to US-009
  exceeded theirs. US-010 derives the Revenue/Cost judgement rather than storing it; US-011 adds one
  display layer, one rounding rule, and a reconciliation suite that found **no drift**.
- ✅ US-012 / US-014 / US-015 (8 pts) — the shell (all 5), insertion (all 7, dedupe proven in
  Chrome) and Reset (3 of 5 then; ①②④ later closed by US-013/US-029/US-031). **Then 3/5 · 8/16.**
- ✅ US-027 — Motion & animation hooks (3 pts) — all 4 acceptance criteria met, including the two
  subtle ones: count-up continues from the current displayed value, and nothing is stranded at zero
  under reduced motion. **Phase 2b opens here: 1/11 stories, 3/29 points.**
- ✅ US-017 / US-021 — the KPI tile and the shared bar row (5 pts) — all criteria met; the delta
  chip's meaning survives with the colour removed, and US-021's two review decisions are read back
  off the rendered element for the *five* tiles that share the row.
- ✅ US-013 — Baseline dashboard (3 pts) — all 4 criteria met, **plus US-015's deferred criterion ①**.
- ✅ US-025 / US-026 — the line chart and the segmented control (5 pts) — all criteria met: one chart
  serves the navy band and Hero 2, and one control renders in a card's `action` slot *and* a section
  header, its 11px radius with `rounded-full` rejected by test. **US-016 unblocked.**
- ✅ **US-016 — Hero band: webshop trend & attendance ring (5 pts). All 6 criteria met, and Phase 2a
  is CLOSED at 5/5 · 16/16.** One control drives the chart and the ring; a filter change counts from
  the figure on screen, redraws the line and sweeps the arc. 92 tests, 1090/1090 green.
- ✅ US-018 / US-019 / US-020 — the three chart geometries (9 pts) — all criteria met: bars keyed by
  category, proven by a re-rank test; the axis gutter and headroom derived as **geometry, not
  padding**; a donut whose segments sum exactly.
- ✅ US-022 / US-023 — the department table and the driver tile (5 pts) — all criteria met. **The
  trap is the story:** Marketing's +410 reads ADVERSE from US-010's `varianceJudgement`, and US-023
  adds **no second bar row**. **Then 10/11 · 27/29.**
- ✅ US-024 — Recommendation panel & narrative caption strip (2 pts) — all 3 criteria met: a callout
  **structurally** not a data tile, the AI strip **reused** from US-005, the narrative asserted in
  DOM order **before** the charts. **Phase 2b CLOSED: 11/11 · 29/29.**

- ✅ US-028 — Persistent prompt bar (2 pts) — all 4 criteria met: one field with the icon and send
  button embedded and **no inner bordered box** (asserted structurally), Enter *and* the button
  submitting through one real form, empty input a no-op, rapid submits collapsing to one call.
  **Phase 3a opens: 1/6 · 2/17.**

- ✅ US-029 — Suggestion chips & chip lifecycle (3 pts) — all 5 criteria met: exactly three chips on
  load with the labels verbatim, a tap resolving **directly** to its hero with no scoring in the
  path, a follow-up chip appearing once its hero renders and gone once that follow-up is shown, and
  US-026's 11px surface reused. **It also closes US-015's criterion ②.** **Phase 3a: 2/6 · 5/17.**

- ✅ US-030 — Intent normalisation, scoring & tie-breaking (5 pts) — all 7 criteria met: normalised,
  scored **+2 strong / +1 weak**, the highest above **threshold 2 hero / 3 follow-up** winning, ties
  broken deterministically so **two heroes never render from one input**, tolerance table-driven at
  34 phrasings, definitions held as static config with the parent-gating flag US-033 reads. Pinned
  by an **oracle** test over a 90-phrase corpus. **Phase 3a: 3/6 stories, 10/17 points.**

- ✅ US-031 — Thinking beat (2 pts) — all 4 criteria met: every successful match holds the panel for
  a fixed 1150ms **before** the section renders (asserted on a fake clock, both sides of the
  boundary), the panel carries the per-flow message, the sweeping scan line and the source chips
  lighting up one by one, reduced motion shortens the beat to 260ms with every animation at its final
  state, and **no request is made** — the delay is a `setTimeout` on `useDashboard`'s single pending
  timer. **It also closes US-015's criterion ④, the last of that story's five.**
  **Phase 3a: 4/6 stories, 12/17 points.**

- ✅ US-032 — Graceful fallback panel (2 pts) — all 4 criteria met: a no-match shows the friendly
  panel with the copy **byte-identical** followed by the three chips; never an error, never blame,
  never a dead end (18 blame words, the alert role and red semantics asserted ABSENT); and the empty
  state shows the branded-red panel at **4.5% derived from the red token**. **Phase 3a: 5/6, 14/17.**

- ✅ US-033 — Follow-up context gating (3 pts, 2026-09-10) — all 5 criteria met: a typed follow-up
  resolves to the deep-dive only once its parent has been shown, otherwise the **parent renders and
  the chip is then offered**; the follow-up **flips** its parent section; one predicate with two
  readers drives both gating and chip visibility. **PHASE 3a COMPLETE: 6/6 · 17/17.**

- ✅ US-034 / US-035 / US-036 (8 pts, 2026-09-10) — every criterion met. Hero 1: three tiles **in
  order** with the pinned figures, one `Segmented` driving all of them, badge segments summing
  exactly, and a follow-up beat that flips the section rather than appending. Hero 2: grouped bars
  over eight fixtures (25/26 navy, 26/27 red) with eight signed delta chips, the totals tile at
  **CHF 7.83M vs CHF 7.88M, -0.6%** with a down arrow, labelled compare bars and `-CHF 50k`, and the
  full-width twelve-month chart with the current season filled — **both scopes labelled**. All three
  narratives **verbatim**. **Phase 3b: 3/6 stories, 8/16 points.**

*(Condensed to keep this log inside its 300-line limit — full detail in
[`completed.md`](completed.md) and [`../phases/phase-3a.md`](../phases/phase-3a.md).)*

---

## Stories In Progress

*None*

---

## Open Human Step

- **Deploy to Railway** (US-001, the remaining AC): `railway login && railway init && railway up`, then record the URL in `output/phases/phase-1a.md`.

---

## Next Day Plan

**Immediate Focus:**
- **Phases 1a, 1b, 2a and 2b are all closed** (69 points): seven tile kinds, four chart geometries,
  the segmented control, the motion hooks and the two insight elements, no per-hero copy anywhere.
- **PHASE 3a IS CLOSED (6/6 · 17/17), and the demo choreography is whole:** a question arrives by
  chip or by typing, waits through the beat and lands; off-script meets the fallback, and a
  follow-up asked cold renders its parent and then offers the chip.
- **PHASE 3b IS HALFWAY (3/6 · 8/16): US-034 and US-036 put two scripted answers on screen** — Hero 1's tiles
  under one narrative and one period filter, every figure from the US-008 repository through a new
  root loader. It confirmed the phase's premise: assembly plus copy, no new visual.
- **US-035 added Hero 1's so-what beat and US-036 answered Hero 2** — the fixture chart's first
  mount, both scope labels on screen with the mismatch proved real, and the eight delta chips
  measured in Chrome (59.5px in 83.4px cells).
- **Next: US-037 — Hero 2 follow-up (2 pts)**, ranking the four declining fixtures behind the gold
  divider already in the section frame.

**Priority Stories for This Week:** foundations + shell + component library (69 pts, done) → Phase
3a (17 pts, done) + 3b, the demo itself (16 pts, 8 done).

---

## Notes

- **The deadline is this week.** Sponsor showing first, owner audience the following week. ~52
  AI-core / ~68 AI-realistic hours for 116 points; extend daily runtime before cutting scope.
- Phases 1a, 1b, 2a, 2b and 3a are complete and 3b is halfway (94/116 points); continue with
  `/holycode-pm:execute-work story US-037`.
- **US-028's three seams are now ALL filled:** `children` (US-029), `onSubmit` (US-030) and `busy`
  (US-031), plus `key={generation}` for a half-typed question. **There is exactly one timer in the
  app and a test pins it there:** a story growing its own submit path, timer or chip styling is a
  review finding.
- **US-029 settled the rule for anything the chip row or a panel needs to know: DERIVE IT FROM
  `sections`** — which is why Reset restores the row for free, and **US-033 did exactly that**: its
  gate reads the same list, pinned by a source scan to one predicate with two readers. A second
  registry of "heroes shown", or a chip tap reaching US-030's scoring, is a review finding.
- **US-021 is the reuse test for the whole epic, and US-023/US-024 both passed it:** widen the shared
  seam when a consumer needs a little more, and let a source scan prove the new file holds no copy
  of what it reused. A second bar row or AI caption element is a review finding.
- **US-024 set the verbatim contract Phase 3b depends on** (the test that matters is `toBe`, not
  "contains" — US-032 took it to UTF-8 bytes), and the narrative is stated BEFORE the charts.
- **The motion hooks are the shared contract for Phase 2b:** reimplementing `useCountUp` or
  `useGrow` anywhere is a review finding.
- **Two shared pieces US-017 left:** `DeltaChip` is the *only* variance chip, and `app/lib/cn.ts`
  protects named size tokens. **All of US-015's seams are closed** (① US-013, ② US-029, ④ US-031),
  so all five of its criteria are met — re-confirmed when US-033 closed Phase 3a.
- **US-030 settled how the matcher may change:** its two over-matches are the asserted contract, so
  tightening either is a deliberate decision, never a tidy-up. **US-032 is the catch behind it** and
  its absence assertions (no blame word, no alert role, no echoed input) are the requirement, not a
  style note. **US-033 added the third rule: gating is decided in one module, for both paths.**
- **US-034 confirmed Phase 3b is assembly:** a hero adds layout, copy and at most ONE piece of
  state; building a chart, restating a figure or paraphrasing a narrative there is a review finding.
- **US-013 set the no-hardcoded-figure pattern:** figures reach a component only through a
  loader-provided view model; a test scans for a literal figure.
- **US-025's chart is the only line chart**: a second `smoothPath` anywhere is a review finding.
- **Keying geometry by NAME is the epic's settled pattern** (US-018/019/020, kept by US-022/023),
  proved by a **re-rank** test.
- **US-026's `Segmented` is the only period control**, the period stays the CALLER's state, and
  `rounded-full` on it or on US-029's chips is a review finding.
- **US-016's band is first in the cut order and was built to stay cuttable:** one grid item, no
  shared state, no import from the baseline row.
- Three shell guardrails are *tests*: the app bar's text equals the role labels, the status file
  holds no timer, the prompt field's subtree may carry no border.

---

**Auto-Generated** | Updates during `/execute-work` | Archives daily
