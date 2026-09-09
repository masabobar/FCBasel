# Daily Work Summary

**Date:** 2026-09-09 (Wednesday) · **Last Updated:** 2026-09-09

---

## Today's Summary

**Stories Completed:** 32 — **Phases 1a, 1b, 2a and 2b ALL complete (2b closed by US-024, 11/11 ·
29/29); Phase 3a open at 5/6 · 14/17 after US-028 to US-032**
**Story Points:** 83
**Time Worked:** ~22.1 hours · **Files Changed:** 254 · **Tests Added:** 1803

---

## Work Log

- **Phase 1a — US-001 to US-006 (14 pts), closed.** Condensed; the full account is in
  [`../phases/phase-1a.md`](../phases/phase-1a.md). In short: the React Router 7.18 SSR scaffold
  verified by execution (US-001, Railway deploy still a human step); ESLint 9 + Prettier + husky with
  the hook *proved* to fire (US-002); one design-token set published as Tailwind v4 properties and as
  typed objects, held in lockstep by a drift test (US-003); the crest self-hosted after verifying its
  bytes were PNG (US-004); one `Card` shell of collapsing slots (US-005); and the four reveal
  keyframes plus `app/lib/motion.ts`, where **reduced motion renders final state rather than
  switching animation off** (US-006).
- **Phase 1b — US-007 to US-011 (10 pts), closed.** Condensed; the full account is in
  [`../phases/phase-1b.md`](../phases/phase-1b.md). US-007 set the shape the rest follow (enums,
  types and the repository interface, fixtures in `app/lib/mock/`, server-only selection, all four
  periods, every headline **computed from the series**). US-008 to US-010 built the three hero
  datasets with **nothing derivable stored** — kit revenue as units × CHF 99, `badgeSegments`
  correcting its rounding remainder so the parts sum exactly, the two Hero 2 charts kept at
  deliberately different scopes with `scopeLabel` as a field, and `varianceJudgement` deciding
  good-or-bad once from `DepartmentType` so a naive "variance > 0" rule is proven to misread exactly
  one department. US-011 made `app/lib/format.ts` the one place a number becomes a string (sign
  before the unit, Swiss U+2019 pinned independent of ICU, one rounding rule) and swept every
  narrative number: **no drift found.** 418/418.
- **US-012 / US-014 / US-015 — shell, insertion, reset (8 pts), Phase 2a's first three.** Condensed;
  the full account is in [`../phases/phase-2a.md`](../phases/phase-2a.md). The navy sidebar, app bar
  and a canvas grid stepping 12 → 8 → 4, with three things made structural rather than trusted: the
  **persona is a role** (a test accounts for the app bar's whole text), the placeholder nav is
  **inert by construction**, and the connection status is **decorative** (no live region, no
  `fetch`, no timer). Then the mechanic the demo turns on: the dashboard **grows, it never clears** —
  a memory-only list of `{heroId, phase, revision}`, pure transitions in `sections.ts`, sections as
  direct children of the SAME canvas grid via `grid-cols-subgrid`, re-asking refreshing in place and
  a follow-up flipping its parent's phase. And Reset as a **fourth transition, not a mode**,
  restoring the named baseline that is also the hook's initial state, cancelling the pending beat
  first (delete that line and two tests fail), and handing back the same list reference when there
  is nothing to clear, so ten presses in one frame run ONE view transition. 592/592 green.
- **US-027 — Motion & animation hooks.** Phase 2b opens with the story every other component in it
  depends on: `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`. **Count-up counts from the
  figure on screen, not from zero** — a test proves a target changed mid-flight opens the new
  animation *on that very figure* and lands exactly on target. **Reduced motion means final state in
  the same render:** `useGrow` is `true` on the first render with **zero** frames requested. One
  reduced-motion source, everything cancelled on unmount, SSR proven by `hydrateRoot`. 52 tests.
- **US-017 — KPI tile & variance chip.** The first component built on those hooks, and the shape
  the other nine follow: `DeltaChip`, plus `KpiSparkline`, `KpiFigure` and `KpiTile`. **The chip is
  where "colour is never the sole signal" stops being a slogan:** direction is carried four times
  over, and the `light` variant is the proof — on navy the up and down chips' class strings are
  asserted **identical** while glyph, sign and spoken word still differ. **Direction is arithmetic,
  judgement is meaning.** Extras arrive as `children`; the `tailwind-merge` trap is closed at the
  root. 78 tests, 722/722.
- **US-021 — Horizontal bar tile.** The most reused chart, built once for five consumers as
  `HBarRow` / `HBars` / `HBarTile`. **Both review decisions are read back off the rendered
  element:** a 150px label column with truncation *rejected* (so `Cap "Rotblau"` cannot regain its
  ellipsis) and a 96px `nowrap` value column via `getComputedStyle`. **The sign of the displayed
  figure** sets anchor side, token and text sign; rows keyed by name, so a filter transitions the
  *same* bar. 55 tests.
- **US-016 — Hero band. Phase 2a is closed (5/5 · 16/16).** The navy band above the baseline row,
  and the first thing to mount `LineChart` and `Segmented` in the app. **ONE `Segmented` drives both
  halves** from a single `BaselinePeriod` entry (one `useState`, one `<Segmented>`, pinned by tests),
  so the gold-area-over-dashed-white chart (re-keyed by period, replaying the stroke draw) and the
  new hand-built `AttendanceRing` cannot disagree about the month. **The total and its delta are
  `seriesTotals` off the plotted array**; the greeting comes from an injectable clock. Chrome at
  1920×1080: 54 distinct KPI strings, still the old figure in the frame after the click, 43 arc dash
  pairs on the same element, one value each under reduced motion. One defect fixed. 92 tests.
- **US-018 — Vertical bar chart tile.** The kit-split chart US-034 composes. **Bar persistence is
  the story and the test is a re-rank:** columns keyed by category, so a filter press hands `Home`
  the *same* `<rect>` and its geometry transition carries it — an index key **fails exactly two
  tests**. Gradient caps, hover highlight, wrapping DOM-text labels. 52 tests.
- **US-019 — Grouped bar chart tile.** US-036's fixture chart: **sixteen bars and eight delta chips
  in one tile**. **The review's overlap fix is arithmetic and both halves are measured:** a 44-unit
  left gutter everything is inset to, and a 34-unit chip band that stays empty because the axis
  maximum is *derived from the geometry* — a fixed 10% headroom fails that test. Pairs keyed by
  fixture. 63 tests.
- **US-020 — Donut / ring tile.** US-034's sponsor-badge ring, deliberately a different component
  from US-016's single-arc `AttendanceRing`. **Two hover surfaces write ONE state** (arc and legend
  row), and **the segments morph** — arcs keyed by SPONSOR, so a period press transitions the same
  `<circle>` while one `useCountUp` carries the centre, never via zero. **The arithmetic is
  `badgeSegments`'** (US-008), imported not restated. 56 tests, 1261/1261.
- **US-022 — Department table tile.** Hero 3's primary tile as a real `<table>`. **The revenue/cost
  trap is closed by construction:** the colour comes from `row.judgement` (US-010) through
  `DeltaChip`, so **Marketing's +410 renders UP and ADVERSE** while Sponsoring's +840 renders
  FAVOURABLE, and a source scan blocks the judgement migrating back into the tile. CHF millions with
  an unremovable subtitle; numeric headers right-aligned by one rule header and cells share.
  54 tests, 1315/1315.
- **US-023 — Driver / breakdown tile.** `DriverTile`, `DriverTotalBadge` and the pure
  `rankDrivers` / `driverTotal`, for all three causal follow-ups. **It draws no bars, and the tests
  keep it that way:** every row is US-021's `HBarRow` through `HBarTile`, and a source scan rejects
  bar geometry, the width constants, the motion hooks, local state and even a second `Card`. What it
  adds: tie-stable magnitude ranking (equal to US-009's `fixtureDeclines`, so Luzern precedes Sion),
  a total **derived from the rows on screen** so the `-CHF 400k total` badge cannot disagree, and a
  note line. Two shared seams widened rather than forked. 43 tests, 1358/1358.
- **US-024 — Recommendation panel & narrative caption strip.** The last story of Phase 2b. **The
  strip was reused, not rebuilt** (US-005's `CardCaption` gained a `section` placement), and **the
  panel is structurally not a tile** — an `aside`, a gold bar down the SIDE, no metric chrome, told
  apart from a `Card` by test. **Verbatim asserted byte for byte**, and **criterion 3 is order**, so
  the narrative comes before every chart. 35 tests, 1393.
- **US-028 — Persistent prompt bar. Phase 3a opens.** The product's only user input. **ONE bordered
  field IS the typing area** — a test rejects any descendant border or ring (the nested box was the
  reported defect). **A real `<form>`**, so Enter and the button share one path, and **debounce with
  no second clock**: a submit consumes the question. XSS pass-through proven. 48 tests, 1441.
- **US-029 — Suggestion chips & chip lifecycle. The screen can now be ASKED a question (2/6 ·
  5/17).** **THE ROW IS DERIVED, NOT STORED:** criterion ③'s "removed once shown" is implemented in
  **no line of code** — the phase flip stops deriving it. Proved over **all 27** hero × phase
  combinations, and **US-015's criterion ② is thereby SATISFIED**. **A tap bypasses scoring by
  TYPE.** Surface reused, not restated. 57 tests, 1498/1498.
- **US-030 — Intent normalisation, scoring & tie-breaking. A freely TYPED question now resolves
  (3/6 · 10/17), and this was the riskiest story in the build.** The acceptance is qualitative, so
  **the suite is the deliverable as much as the code**: 89 tests pinning the matcher input by input.
  **A FAITHFUL PORT, VERIFIED NOT TRUSTED:** normalise → **+2 / +1** → threshold **2 hero / 3
  follow-up** → **strictly-greater** over an ordered config, with an **oracle** test asserting
  identical scores *and* winners over a 90-phrase corpus. **34 paraphrases**, each prompt beating
  its own follow-up by a margin; a **three-way** 2/2/2 tie goes to Hero 1; one input yields **one**
  match or `null`. **The two inherited over-matches are PINNED.** No model, no dependency — scanned.
  89 tests, 1587/1587.
- **US-031 — Thinking beat. The answer no longer appears the instant it is asked, and it is
  stagecraft rather than a query.** `thinking.ts` (the six beats and two delays), `use-thinking.ts`
  (the runner) and `thinking-panel.tsx`, wired in `root.tsx`. **No request is made** (scanned).
  **THE ORDERING IS ASSERTED:** at `1150ms - 1` the panel is up with NO section; at `1150ms` the
  section is there and the panel gone — landing it immediately fails **22** tests. **Both paths pause
  and neither module changed:** `useThinking` returns the `ChipActions` the matcher and the chips
  already took, and a no-match calls neither action, so an off-script question shows **no beat**
  (US-032's input). **Still ONE timer**, so **US-015 criterion ④ is satisfied**, proved by mutation
  twice over. Reduced motion 260ms, chips at final state. No new keyframe. 91 tests, 1678/1678.
- **US-032 — Graceful fallback panel. The screen can no longer dead-end (5/6 · 14/17)**, and this is
  one of the three behaviours the backlog marks untouchable at any cost. `fallback-panel.tsx`,
  `empty-state-panel.tsx` and `use-canvas-panel.ts`, wired in `root.tsx`. **Two panels, never
  conflated.** **The copy is byte-identical:** UTF-8 bytes against a retyped literal *and* against
  the criterion in the backlog, straight apostrophe and closing **hyphen** pinned by code point.
  **Criterion ② is asserted as an ABSENCE:** eighteen blame/error words out of the copy, the panel
  *and* the source; no `role="alert"`, no assertive region, no red semantics. **The question is never
  echoed** (no question prop exists, so an `<img onerror>` payload creates no element). **No beat
  precedes it** (`getTimerCount()` is 0), and the next step is always there — **US-029's own chips**
  over the frozen `HERO_CHIPS`, reuse proved on the class strings. **The empty state** is the review
  feedback: club red at **4.5% derived from `--color-red`** (no rgba literal, no hex), matching
  hairline, bold navy heading, lighter subtext, red gradient badge. **The three panels are mutually
  exclusive by construction** and **Reset returns to the empty state**. 125 tests, 1803/1803.

---

## Stories Completed Today

- ✅ **Phase 1a — US-001 to US-006 (14 pts), closed 6/6.** US-001 4/5 criteria (Railway deploy
  deferred); US-002 to US-006 all met — the token set's two halves held in lockstep by a drift test,
  the crest verified from its bytes, one card shell, and reduced motion rendering final state.
- ✅ **Phase 1b — US-007 to US-011 (10 pts), closed 5/5.** Every criterion met, and US-007 to US-009
  exceeded theirs. US-010 derives the Revenue/Cost judgement rather than storing it; US-011 adds one
  display layer, one rounding rule, and a reconciliation suite that found **no drift**.
- ✅ US-012 / US-014 / US-015 (8 pts) — the shell (all 5 criteria), insertion (all 7, dedupe proven
  in Chrome) and Reset (3 of 5 then; the chips and the beat were seams, both now closed by US-029 and
  US-031). **Phase 2a then 3/5 · 8/16.**
- ✅ US-027 — Motion & animation hooks (3 pts) — all 4 acceptance criteria met, including the two
  subtle ones: count-up continues from the current displayed value, and nothing is stranded at zero
  under reduced motion. **Phase 2b opens here: 1/11 stories, 3/29 points.**
- ✅ US-017 / US-021 — the KPI tile and the shared bar row (5 pts) — all criteria met; the delta
  chip's meaning survives with the colour removed, and US-021's two review decisions are read back
  off the rendered element for the *five* tiles that share the row.
- ✅ US-013 — Baseline dashboard, four pre-existing tiles (3 pts) — all 4 criteria met, **plus**
  US-015's deferred criterion ①. Every figure traces to the US-007 repository through a loader.
- ✅ US-025 / US-026 — the line chart and the segmented control (5 pts) — all criteria met: one chart
  serves the navy band and Hero 2 (stroke replays on a re-key, fully drawn under reduced motion), and
  one control renders in a card's `action` slot *and* a section header, its 11px radius from
  `--radius-chip` with `rounded-full` rejected by test. **US-016 unblocked.**
- ✅ **US-016 — Hero band: webshop trend & attendance ring (5 pts). All 6 criteria met, and Phase 2a
  is CLOSED at 5/5 · 16/16.** One control drives the chart and the ring; a filter change counts from
  the figure on screen, redraws the line and sweeps the arc. 92 tests, 1090/1090 green.
- ✅ US-018 / US-019 / US-020 — the three chart geometries (9 pts) — all criteria met: bars keyed by
  category and proven by a re-rank test; Hero 2's full density with the axis gutter and headroom
  derived as **geometry, not padding**; and a donut whose segments sum exactly.
- ✅ US-022 / US-023 — the department table and the driver tile (5 pts) — all criteria met. **The
  trap is the story:** Marketing's +410 reads ADVERSE from US-010's `varianceJudgement`, and a scan
  stops it being re-derived from the sign. US-023 adds **no second bar row**. **Then 10/11 · 27/29.**
- ✅ US-024 — Recommendation panel & narrative caption strip (2 pts) — all 3 criteria met: a callout
  that is **structurally** not a data tile, the AI strip **reused** from US-005, and the narrative
  asserted in DOM order **before** the charts. **Phase 2b CLOSED: 11/11 · 29/29.**

- ✅ US-028 — Persistent prompt bar (2 pts) — all 4 criteria met: one field with the icon and send
  button embedded and **no inner bordered box** (asserted structurally), a press on the padding
  focusing the input, Enter *and* the button submitting through one real form while empty input is a
  no-op, and rapid submits collapsing to one call. **Phase 3a opens: 1/6 · 2/17.**

- ✅ US-029 — Suggestion chips & chip lifecycle (3 pts) — all 5 criteria met: exactly three chips on
  load with the labels verbatim, a tap resolving **directly** to its hero with no scoring in the
  path (enforced by type and by a source scan), a follow-up chip appearing once its hero renders and
  gone once that follow-up is shown, the three hero chips present throughout, and US-026's 11px
  lift-and-tint surface reused with a gold-tinted variant. **It also closes US-015's criterion ②.**
  **Phase 3a: 2/6 stories, 5/17 points.**

- ✅ US-030 — Intent normalisation, scoring & tie-breaking (5 pts) — all 7 criteria met: normalised,
  scored **+2 strong / +1 weak**, the highest above **threshold 2 hero / 3 follow-up** winning, ties
  broken deterministically so **two heroes never render from one input**, tolerance table-driven at 34
  phrasings, `sales` alone falling through, definitions held as static config with the parent-gating
  flag US-033 will read. Pinned by an **oracle** test over a 90-phrase corpus.
  **Phase 3a: 3/6 stories, 10/17 points.**

- ✅ US-031 — Thinking beat (2 pts) — all 4 criteria met: every successful match holds the panel for
  a fixed 1150ms **before** the section renders (asserted on a fake clock, both sides of the
  boundary), the panel carries the per-flow message, the sweeping scan line and the source chips
  lighting up one by one, reduced motion shortens the beat to 260ms with every animation at its final
  state, and **no request is made** — the delay is a `setTimeout` on `useDashboard`'s single pending
  timer. **It also closes US-015's criterion ④, the last of that story's five.**
  **Phase 3a: 4/6 stories, 12/17 points.**

- ✅ US-032 — Graceful fallback panel (2 pts) — all 4 criteria met: a no-match shows the friendly
  panel with the copy **byte-identical** (hyphen, not an em dash) followed by the three suggestion
  chips; it never shows an error, never blames the user and never leaves the screen without a next
  step (eighteen blame words, the alert role and red semantics all asserted ABSENT); "show me player
  injuries" and gibberish land there identically; and before any question the empty state shows the
  branded-red panel at **4.5% derived from the red token**, bold navy heading, lighter one-line
  subtext, red gradient icon badge. **Phase 3a: 5/6 stories, 14/17 points.**

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
- **Phase 3a is open at 5/6, and the demo choreography is whole apart from gating:** a question
  arrives by chip or by typing, waits through the beat and lands — and anything off-script now meets
  the fallback instead of silence. Next **US-033 gates the follow-ups**, reading
  `INTENT_REQUIRES_PARENT` plus the visibility US-029 derives: an ungated follow-up renders its
  PARENT first and then offers the follow-up chip. Then Phase 3b is composition only — every hero
  beat assembles existing components and supplies the pre-authored strings, which US-024 proved
  render verbatim.

**Priority Stories for This Week:** foundations + shell + component library (69 pts, done) → Phase
3a + 3b, the demo itself (33 pts, 14 done).

---

## Notes

- **The deadline is this week.** Sponsor showing first, owner audience the following week. ~52
  AI-core / ~68 AI-realistic hours for 116 points; extend daily runtime before cutting scope (the P1
  cut set is worth only ~0.82 days at 8h/day).
- Phases 1a, 1b, 2a and 2b are all complete and Phase 3a is open (81/116 points); continue with
  `/holycode-pm:execute-work story US-032`.
- **US-028's three seams are now ALL filled:** `children` (US-029's chips), `onSubmit` (US-030's
  matcher) and `busy` (US-031's beat) — plus `key={generation}`, which is how a half-typed question
  clears with Reset. **There is exactly one timer in the app and a test pins it there:** a story that
  grows its own submit path, its own timer or its own chip styling is a review finding.
- **US-029 settled the rule for anything the chip row or a panel needs to know: DERIVE IT FROM
  `sections`** — which is why Reset restores the row for free. US-033 must read that same derived
  visibility rather than storing a copy. **The chip path and the typed path are separate by TYPE:** a
  chip tap reaching US-030's scoring is a review finding.
- **US-021 is the reuse test for the whole epic, and US-023/US-024 both passed it:** widen the shared
  seam when a consumer needs a little more, and let a source scan prove the new file holds no copy of
  what it reused. A second bar row, or a second AI caption element, is a review finding.
- **US-024 set the verbatim contract Phase 3b depends on** (the test that matters is `toBe`, not
  "contains" — US-032 took it to UTF-8 bytes), and the narrative is stated BEFORE the charts.
- **The motion hooks are the shared contract for Phase 2b:** reimplementing `useCountUp` or
  `useGrow` anywhere is a review finding.
- **Two shared pieces US-017 left:** `DeltaChip` is the *only* variance chip, and `app/lib/cn.ts`
  protects named size tokens — through `cn` only. **All of US-015's seams are now closed** (US-013,
  US-029, US-031), so all five of its criteria are met.
- **US-030 settled how the matcher may change:** its two over-matches are the asserted contract, so
  tightening either is a deliberate decision, never a tidy-up. **US-032 is the catch behind it:**
  every `null` reaches a panel that offers the three prepared questions, and its absence assertions
  (no blame word, no alert role, no echoed input) are the requirement, not a style note.
- **US-013 set the no-hardcoded-figure pattern:** figures reach a component only through a
  loader-provided view model, and a test scans component sources for a literal figure.
- **US-025's chart is the only line chart**: a second `smoothPath` anywhere is a review finding.
- **Keying geometry by NAME is the epic's settled pattern** (US-018/019/020, kept by US-022/023),
  proved by a **re-rank** test since an index key is invisible while the order holds.
- **US-026's `Segmented` is the only period control**, the period stays the CALLER's state, and its
  11px radius is reviewed: `rounded-full` on it or on US-029's chips is a review finding.
- **US-016's band is first in the cut order and was built to stay cuttable:** one grid item, no
  shared state, no import from the baseline row.
- Three shell guardrails are *tests*: the app bar's text equals the role labels, the status file
  holds no timer, and the prompt field's subtree may carry no border.

---

**Auto-Generated** | Updates during `/execute-work` | Archives daily
