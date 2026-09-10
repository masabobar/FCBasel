# Daily Work Summary

**Date:** 2026-09-10 (Thursday) · **Last Updated:** 2026-09-10
**Covers:** day 1 (2026-09-09, 32 stories) and day 2 (2026-09-10, US-033 to US-041)

---

## Today's Summary

**Stories Completed:** 41 — **Phases 1a, 1b, 2a, 2b, 3a AND 3b ALL complete.** Day 2 closed Phase 3a
with US-033 (6/6 · 17/17), closed **Phase 3b (6/6 · 16/16)** on **US-039, the causal peak**, and then
opened Phase 4 with US-040 (eleven viewports measured) and **US-041, which severed the network and
found two real runtime fetches**. **Story Points:** 106
**Time Worked:** ~31 hours · **Files Changed:** 324 · **Tests Added:** 2225 unit + 16 Chrome cases

---

## Work Log

- **Phase 1a — US-001 to US-006 (14 pts), closed.** Condensed; full account in
  [`../phases/phase-1a.md`](../phases/phase-1a.md): the RR 7.18 SSR scaffold verified by execution
  (Railway deploy still a human step), ESLint 9 + Prettier + husky with the hook *proved* to fire,
  one design-token set held in lockstep by a drift test, the crest self-hosted after verifying its
  bytes, one `Card` shell of collapsing slots, and four keyframes where **reduced motion renders
  final state**.
- **Phase 1b — US-007 to US-011 (10 pts), closed.** Condensed; full account in
  [`../phases/phase-1b.md`](../phases/phase-1b.md). US-007 set the shape (enums, types, repository
  interface, server-only selection, every headline **computed from the series**); US-008 to US-010
  built the three hero datasets with **nothing derivable stored** — kit revenue as units × CHF 99,
  `badgeSegments` correcting its rounding remainder, `varianceJudgement` deciding good-or-bad once
  from `DepartmentType`. US-011 made `app/lib/format.ts` the one place a number becomes a string and
  swept every narrative number: **no drift found.**
- **US-012 / US-014 / US-015 — shell, insertion, reset (8 pts), Phase 2a's first three.** Condensed;
  full account in [`../phases/phase-2a.md`](../phases/phase-2a.md). The navy sidebar, app bar and a
  canvas grid stepping 12 → 8 → 4, with the **persona a role**, the placeholder nav **inert by
  construction** and the connection status **decorative**. Then the mechanic the demo turns on: the
  dashboard **grows, it never clears** — a memory-only `{heroId, phase, revision}` list, pure
  transitions, sections as direct children of the SAME grid via `grid-cols-subgrid`, re-asking
  refreshing in place. And Reset as a **fourth transition, not a mode**, cancelling the pending
  beat first and idempotent by reference. 592/592 green.
- **US-027 — Motion & animation hooks.** Phase 2b opens with the story every other component in it
  depends on. **Count-up counts from the figure on screen, not from zero** (a target changed
  mid-flight opens the new animation *on that very figure*), and **reduced motion means final state
  in the same render** with **zero** frames requested. 52 tests.
- **US-017 — KPI tile & variance chip.** The shape the other nine follow. **"Colour is never the
  sole signal" stops being a slogan:** on navy the up and down chips' class strings are asserted
  **identical** while glyph, sign and spoken word differ. **Direction is arithmetic, judgement is
  meaning.** 78 tests, 722/722.
- **US-021 — Horizontal bar tile.** The most reused chart, built once for five consumers. **Both
  review decisions are read back off the rendered element:** a 150px label column with truncation
  *rejected* and a 96px `nowrap` value column via `getComputedStyle`. 55 tests.
- **US-016 — Hero band. Phase 2a is closed (5/5 · 16/16).** The navy band above the baseline row,
  and the first thing to mount `LineChart` and `Segmented`. **ONE `Segmented` drives both halves**
  from a single `BaselinePeriod` entry, so the chart and the new `AttendanceRing` cannot disagree
  about the month — the shape US-034 reused for three tiles. **The total and its delta are
  `seriesTotals` off the plotted array.** Chrome-verified at 1920×1080. 92 tests.
- **US-018 — Vertical bar chart tile.** The kit-split chart US-034 composes. **Bar persistence is
  the story and the test is a re-rank:** columns keyed by category, so a filter press hands `Home`
  the *same* `<rect>` — an index key **fails exactly two tests**. 52 tests.
- **US-019 — Grouped bar chart tile.** US-036's fixture chart: **sixteen bars and eight delta chips
  in one tile**, with the review's overlap fix as arithmetic and both halves measured — a 44-unit
  gutter and a 34-unit chip band kept empty by an axis maximum *derived from the geometry*. **The
  chips' clean range was later measured end to end by US-040** (see `phase-4.md`, KL-1). 63 tests.
- **US-020 — Donut / ring tile.** US-034's sponsor-badge ring, deliberately a different component
  from US-016's single-arc `AttendanceRing`. **Two hover surfaces write ONE state**, **the segments
  morph** (arcs keyed by SPONSOR, one `useCountUp` on the centre, never via zero), and **the
  arithmetic is `badgeSegments`'** (US-008), imported not restated. 56 tests, 1261/1261.
- **US-022 — Department table tile.** Hero 3's primary tile as a real `<table>`. **The revenue/cost
  trap is closed by construction:** colour comes from `row.judgement` (US-010) through `DeltaChip`,
  so **Marketing's +410 renders ADVERSE** while Sponsoring's +840 renders FAVOURABLE, with a scan
  blocking the judgement migrating back in. 54 tests, 1315/1315.
- **US-023 — Driver / breakdown tile.** `DriverTile`, `DriverTotalBadge` and the pure
  `rankDrivers` / `driverTotal`, for all three causal follow-ups. **It draws no bars, and the tests
  keep it that way** (every row is US-021's `HBarRow`; a scan rejects bar geometry, the width
  constants, the motion hooks and local state), adding tie-stable ranking, a total **derived from
  the rows on screen**, and a note line. 43 tests, 1358/1358.
- **US-024 — Recommendation panel & narrative caption strip.** The last story of Phase 2b. **The
  strip was reused, not rebuilt**, and **the panel is structurally not a tile** — an `aside`, told
  apart from a `Card` by test. **Verbatim byte for byte**; narrative before every chart. 35, 1393.
- **US-028 — Persistent prompt bar. Phase 3a opens.** The product's only user input. **ONE bordered
  field IS the typing area** — a test rejects any descendant border or ring. **A real `<form>`**, so
  Enter and the button share one path; **debounce with no second clock**. 48 tests, 1441.
- **US-029 — Suggestion chips & chip lifecycle. The screen can now be ASKED a question (2/6 ·
  5/17).** **THE ROW IS DERIVED, NOT STORED:** criterion ③'s "removed once shown" is implemented in
  **no line of code** — the phase flip stops deriving it. Proved over **all 27** hero × phase
  combinations; **US-015's criterion ② is thereby SATISFIED**. 57 tests, 1498/1498.
- **US-030 — Intent normalisation, scoring & tie-breaking. A freely TYPED question now resolves
  (3/6 · 10/17), and this was the riskiest story in the build.** The acceptance is qualitative, so
  **the suite is the deliverable as much as the code — A FAITHFUL PORT, VERIFIED NOT TRUSTED:**
  normalise → **+2 / +1** → threshold **2 hero / 3 follow-up** → **strictly-greater** over an
  ordered config, with an **oracle** test asserting identical scores *and* winners over a 90-phrase
  corpus. **34 paraphrases**; a three-way 2/2/2 tie goes to Hero 1; one input yields **one** match
  or `null`; **the two inherited over-matches are PINNED**. No model, no dependency — scanned. 89.
- **US-031 — Thinking beat. The answer no longer appears the instant it is asked, and it is
  stagecraft rather than a query.** **No request is made** (scanned). **THE ORDERING IS ASSERTED:**
  at `1150ms - 1` the panel is up with NO section; at `1150ms` the section is there and the panel
  gone — landing it immediately fails **22** tests. Both paths pause, neither module changed, and a
  no-match shows **no beat**. **Still ONE timer** (US-015 ④), by mutation twice over. 91 tests.
- **US-032 — Graceful fallback panel. The screen can no longer dead-end (5/6 · 14/17).** Two panels,
  never conflated; the copy **byte-identical** against a literal *and* the backlog; criterion ②
  asserted as an ABSENCE (18 blame words, no alert role, the question never echoed); the three
  panels mutually exclusive by construction. 125 tests, 1803/1803.
- **US-033 (2026-09-10) — Follow-up context gating. PHASE 3a CLOSES at 6/6 · 17/17.**
  `follow-up-gate.ts` holds the rule as two pure functions read by BOTH the answer and the beat.
  **Stated plainly: the behaviour was already correct at HEAD** — reverting the wiring fails only
  the 2 source-scan tests — so the story is the rule made explicit and proved, with the dead end
  guarded by **mutation** (the ungated call fails 10 tests). **The two-step runs on the real `App`
  for all three heroes:** cold typed follow-up → PARENT at `primary` → chip offered → tap → phase
  flips, one section never two. **Criterion ④ by source scan** (`hasSection` has exactly two
  readers, so Reset re-gates for free) and **⑤ twice**, as a property over all 27 sessions and on
  the real `App`. 46 tests, 1849/1849.
- **US-034 to US-039 (2026-09-10) — PHASE 3b COMPLETE, 6/6 · 16/16.** Condensed; full account in
  [`../phases/phase-3b.md`](../phases/phase-3b.md). All six are **composition, not invention**:
  `VBarTile`, `DonutTile`, `GroupedBarTile` and `DepartmentTableTile` each reach a screen for the
  first time, no hero file holds an `<svg>`, a `<table>` or a re-typed figure (proved by scan), and
  **US-037 built nothing at all**. US-034's ONE `Segmented` moves bars, ring and names together
  with nothing snapping; US-036 puts both scope labels on screen with the mismatch proved real;
  **US-038 settles the revenue/cost trap in front of the owner** (Marketing's +0.41 ADVERSE against
  Sponsoring's +0.84 FAVOURABLE); **US-039 is the causal peak** — three drivers whose derived
  `CHF 410k total` **equals** Marketing's variance — and it deleted `PlaceholderFollowUp`, so **no
  stand-in is left in the product**. Six narratives byte-identical. 361 tests, 2210/2210.
- **US-040 (2026-09-10) — PHASE 4 OPENS. The story is a measurement, so it was measured.** Full
  account in [`../phases/phase-4.md`](../phases/phase-4.md). Real Chrome against the **built SSR
  bundle**, with the **full run-of-show loaded before any reading was taken** — new
  `playwright.config.ts` and `tests/e2e/`, and **no dependency added** (`@playwright/test` was
  already there). **Clean at eleven viewports** (the five named, four projector aspect ratios, both
  tablet orientations): no page or in-card horizontal scroll, no clipped tile, axis label or legend,
  no SVG text outside its plot, prompt-bar clearance +10.5px to +11.2px, and a mid-session
  1920 → 1024 → 1920 resize clean **both ways**. **One real defect fixed** — Top Products' four
  option filter was clipped 25.7px at 1152 and 89.7px at 1024, so `WIDE_SPAN` moved to
  `xl:col-span-6`, US-036's precedent, **proved a no-op at every target viewport**. **And the
  favicon 404 that three reviews waved through is closed:** a 32x32 ICO derived from the local crest
  and re-encoded so only `IHDR`/`IDAT`/`IEND` ship (`sips` had attached `eXIf` + `sRGB`), declared
  by a `links` export — the script now runs with **zero console errors**. Two known limitations
  **recorded, not fixed**, with the numbers.
- **US-041 (2026-09-10) — THE OFFLINE DEMO IS PROVEN, AND PROVING IT FOUND TWO RUNTIME FETCHES.**
  Full account in [`../phases/phase-4.md`](../phases/phase-4.md). `setOffline(true)` **and** an abort
  route over `**`, against the built bundle, running the whole script with the screen asserted at
  every beat — baseline, three heroes, three follow-ups, the sidebar link, off-script, empty submit,
  reset, **reset again mid-beat** — and again under reduced motion. **Finding 1:** lazy route
  discovery fetched `/__manifest` on hydration → `routeDiscovery: { mode: "initial" }`. **Finding 2,
  a demo-killer:** the sidebar's `<Link to="/">` revalidated `/_root.data`, which offline failed and
  replaced **the whole dashboard with an error boundary from one click** → `shouldRevalidate` false
  on both routes. **10 requests, all local, 0 after first paint**; zero
  fetch/webfont/foreign-origin/`fcb.ch`, zero console errors, every `src`/`href` root-relative.

---

## Stories Completed Today

- ✅ **Phase 1a — US-001 to US-006 (14 pts), closed 6/6.** US-001 4/5 criteria (Railway deploy
  deferred); US-002 to US-006 all met — the token set's two halves held in lockstep by a drift test,
  the crest verified from its bytes, one card shell, and reduced motion rendering final state.
- ✅ **Phase 1b — US-007 to US-011 (10 pts), closed 5/5.** Every criterion met, and US-007 to US-009
  exceeded theirs. US-010 derives the Revenue/Cost judgement rather than storing it; US-011 adds one
  display layer, one rounding rule, and a reconciliation suite that found **no drift**.
- ✅ US-012 / US-014 / US-015 (8 pts) — the shell (all 5), insertion (all 7, dedupe proven in
  Chrome), Reset (3 of 5 then; ①②④ later closed). **Then 3/5 · 8/16.**
- ✅ US-027 / US-017 / US-021 — the motion hooks, the KPI tile and the shared bar row (8 pts) — all
  criteria met, including the two subtle ones (count-up continues from the displayed value, nothing
  stranded at zero under reduced motion); the delta chip's meaning survives with the colour removed,
  and US-021's two review decisions are read back off the rendered element for all *five* tiles.
- ✅ US-013 — Baseline dashboard (3 pts) — all 4 criteria met, plus US-015's deferred criterion ①.
- ✅ US-025 / US-026 / US-016 — the line chart, the segmented control and the hero band (10 pts) —
  all criteria met, **and Phase 2a is CLOSED at 5/5 · 16/16**: one chart serves the navy band and
  Hero 2, one control renders in a card's `action` slot *and* a section header (11px, `rounded-full`
  rejected by test), and ONE control drives both the band's chart and its ring. 1090/1090 green.
- ✅ US-018 / US-019 / US-020 — the three chart geometries (9 pts) — all criteria met: bars keyed by
  category (proven by a re-rank test), the axis gutter and headroom derived as **geometry, not
  padding**, a donut whose segments sum exactly.
- ✅ US-022 / US-023 — the department table and the driver tile (5 pts) — all criteria met. **The
  trap is the story:** Marketing's +410 reads ADVERSE from `varianceJudgement`, and US-023 adds **no
  second bar row**. **Then 10/11 · 27/29.**

- ✅ US-024 — Recommendation panel & narrative caption strip (2 pts) — all 3 criteria met: a callout
  **structurally** not a data tile, the AI strip **reused** from US-005, the narrative asserted in
  DOM order **before** the charts. **Phase 2b CLOSED: 11/11 · 29/29.**

- ✅ US-028 — Persistent prompt bar (2 pts) — all 4 criteria met: one field with the icon and send
  button embedded and **no inner bordered box** (asserted structurally), Enter *and* the button
  submitting through one real form, empty input a no-op, rapid submits collapsing to one call.
  **Phase 3a opens: 1/6 · 2/17.**
- ✅ US-029 — Suggestion chips & chip lifecycle (3 pts) — all 5 criteria met: three chips on load
  with the labels verbatim, a tap resolving **directly** to its hero with no scoring in the path, a
  follow-up chip appearing once its hero renders and gone once shown. **Closes US-015's ②.**
- ✅ US-030 / US-031 / US-032 (9 pts) — all criteria met: **+2 strong / +1 weak** over **threshold 2
  hero / 3 follow-up** with deterministic ties, pinned by an **oracle** test over a 90-phrase corpus;
  a fixed 1150ms hold asserted on both sides of the boundary with **no request made** (closing
  US-015's ④); and a no-match landing on the friendly panel with the copy **byte-identical**, blame
  words, the alert role and red semantics all asserted ABSENT. **Then 5/6 · 14/17.**

- ✅ US-033 — Follow-up context gating (3 pts, 2026-09-10) — all 5 criteria met: a typed follow-up
  resolves to the deep-dive only once its parent has been shown, otherwise the **parent renders and
  the chip is then offered**; one predicate with two readers drives both gating and chip visibility.
  **PHASE 3a COMPLETE: 6/6 · 17/17.**

- ✅ US-034 to US-039 (16 pts, 2026-09-10) — every criterion met. Hero 1: three tiles **in order**,
  one `Segmented` driving all of them, badge segments summing exactly. Hero 2: grouped bars over
  eight fixtures at **CHF 7.83M vs CHF 7.88M, -0.6%**, a full-width twelve-month chart — **both
  scopes labelled** — plus four ranked declines and a derived **-CHF 400k total**. Hero 3: six
  departments plus a total row tagged Revenue or Cost, **Marketing flagged as both over budget AND
  behind target**, the overall tile at **CHF 69.68M vs CHF 69.00M, +1%, 96% blended, 3 of 6 above
  target** — then **why**: `CHF 240k` / `CHF 150k` / `CHF 20k` summing to a derived `CHF 410k total`
  equal to Marketing's variance, the conversion gap on the tile, the recommendation beside it.
  Six narratives **verbatim**. **PHASE 3b COMPLETE: 6/6 · 16/16.**

- ✅ US-040 — Presentation sizing & responsiveness (2 pts, 2026-09-10) — all 5 criteria met **by
  measurement in real Chrome against the built bundle**: eleven viewports clean, a mid-session resize
  clean both ways, one clipped period filter fixed, the **favicon 404 closed**. Two known limitations
  **recorded with their numbers** in `phase-4.md`. **PHASE 4 OPENS: 1/6 · 2/14.**

- ✅ US-041 — Offline resilience verification (2 pts, 2026-09-10) — all 4 criteria met **by
  disconnecting**: the full script offline, asserted beat by beat, plus a reduced-motion pass;
  **10 requests, all local, 0 after first paint**, no foreign origin, `fcb.ch`, webfont or console
  error. **Two real runtime fetches found and fixed** — `/__manifest` and a `/_root.data`
  revalidation that blanked the dashboard offline. **PHASE 4: 2/6 · 4/14.**

*(Condensed to keep this log inside its 300-line limit — full detail in
[`completed.md`](completed.md) and the phase files.)*

---

## Stories In Progress

*None* — next up is US-042, dead-end path sweep.

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
- **PHASE 3b IS CLOSED (6/6 · 16/16): ALL THREE FLOWS RUN, BOTH BEATS EACH** — every figure from the
  US-008 / US-009 / US-010 repositories through the root loader. The phase's premise held to the end:
  US-037 and US-039 added no component at all and US-038 added only a formatter.
- **The prototype is FEATURE COMPLETE and the demo script runs end to end in Chrome.** No placeholder
  remains anywhere in the product.
- **PHASE 4 IS AT 2/6 · 4/14.** US-040 measured the finished screen at eleven viewports and left a
  **"Known limitations"** section in `phase-4.md` that later stories must read first; **US-041 then
  severed the network and killed the last two runtime fetches** — `/__manifest` and a `/_root.data`
  revalidation that blanked the whole dashboard offline from one click on the sidebar.
- **Next: US-042 — dead-end path sweep (3 pts).** Every path, several paraphrases per hero.

**Priority Stories for This Week:** foundations + shell + component library (69 pts, done) → Phase
3a (17 pts, done) → Phase 3b, the demo itself (16 pts, done) → Phase 4 hardening (14 pts).

---

## Notes

- Sponsor showing first, owner audience the following week. ~52 AI-core / ~68 AI-realistic hours for 116 points; extend daily runtime before cutting scope.
- Phases 1a to 3b are complete and Phase 4 is at 2/6 (106/116 points); continue with
  `/holycode-pm:execute-work story US-042`.
- **US-040 and US-041 set the hardening pattern: measure, do not assert.** Every claim in Phase 4
  comes from real Chrome against `pnpm build` + `pnpm start` with the whole run-of-show loaded —
  jsdom answers layout questions with zeros and a grep answers network questions wrongly, which is
  how a `__manifest` probe and a `_root.data` revalidation survived forty stories of review.
- **US-028's three seams are ALL filled** (US-029/030/031), and **there is exactly one timer in the
  app with a test pinning it there.** **US-029's rule for anything the chip row or a panel needs:
  DERIVE IT FROM `sections`** — why Reset restores the row for free, and why **US-033's gate reads
  that same list** (one predicate, two readers, pinned by scan). A story growing its own submit
  path, timer, chip styling or second registry is a review finding.
- **US-021 is the reuse test for the whole epic, and US-023/024 both passed it** — widen the shared
  seam, and prove by scan that the new file holds no copy of what it reused; **US-037 collected the
  dividend.** Same rule for the motion hooks, US-025's line chart, `DeltaChip` as the *only*
  variance chip, `app/lib/cn.ts` for named size tokens, US-026's `Segmented` as the only period
  control (`rounded-full` on it or on US-029's chips is a finding), and geometry keyed by NAME
  (US-018/019/020, kept by US-022/023). **All of US-015's seams are closed** (① US-013, ② US-029,
  ④ US-031).
- **US-024 set the verbatim contract Phase 3b depends on** — `toBe`, not "contains" (US-032 took it
  to UTF-8 bytes) — and the narrative is stated BEFORE the charts.
- **US-030 settled how the matcher may change:** its two over-matches are the asserted contract, so
  tightening either is deliberate, never a tidy-up. **US-032 is the catch behind it**, its absence
  assertions are the requirement, and **US-033 keeps gating in one module for both paths.**
- **US-034 to US-039 confirmed Phase 3b is assembly:** a hero adds layout, copy and at most ONE piece
  of state; building a chart or a table, restating a figure or paraphrasing a narrative is a finding.
  **And no component may decide a verdict** — US-022 proved it by scan, US-038 end to end and US-039
  to the last beat: the revenue/cost judgement is DATA from `derive.ts`, never a sign test, and a
  breakdown must reconcile with the row it explains (410 = Marketing's variance).
- **US-038 settled the last shared-formatter question:** a COMPARISON is formatted by one function
  for both halves (`formatMoneyMillionsFixed`); a second money-in-millions spelling is a finding.
  **US-013's no-hardcoded-figure rule still holds:** figures reach a component only through a
  loader-provided view model, and a test scans for a literal.
- **US-016's band is first in the cut order and stays cuttable:** one grid item, no shared state.
  Three shell guardrails are *tests*: the app bar's text equals the role labels, the status file
  holds no timer, and the prompt field's subtree may carry no border. **The deadline is this week.**

---

**Auto-Generated** | Updates during `/execute-work` | Archives daily
