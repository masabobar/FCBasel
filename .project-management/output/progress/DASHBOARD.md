# 📊 Project Dashboard

**Last Updated:** 2026-09-09
**Current Phase:** Phase 2b - Chart & Tile Component Library *(8/11 stories complete)* · **Phases 1a + 1b + 2a all complete**

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 53% | 100% | 🟢 On Track |
| **Phase 1a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 1b** | 100% — Completed | 100% | 🟢 Done |
| **Phase 2a** | 100% — Completed | 100% | 🟢 Done |
| **Stories Completed** | 24/45 | 45 | 🟢 On Track |
| **Story Points Done** | 62/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% lines (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-09)

**Stories Completed Today:** 24
**Currently Working On:** US-022 — Department table tile (3 pts)
**Story Points Completed Today:** 62

- ✅ **Phase 1a — Setup & Design System (6 stories, 14 pts)** — React Router 7 SSR scaffold (Railway
  deploy stays a human step) · ESLint 9 + Prettier + husky · one token set published as Tailwind v4
  `@theme static` properties *and* a typed TS object, held in lockstep by a parity test · the crest
  self-hosted (194 KB → 17.9 KB) · one `Card` shell every tile composes — slots, not variants · four
  reveal keyframes timed from motion tokens, reduced motion *collapsing* them to a ~1ms final frame.

- ✅ **Phase 1b — Seed data & formatters (5 stories, 10 pts)** — **US-007** the pattern the rest of E3
  follows (enums + types + repository interface, fixtures in `app/lib/mock/`, server-only selection),
  all four periods, totals and deltas *derived* · **US-008/009/010** the three hero datasets: kit
  revenue = units × CHF 99 with the 58% and exactly-8% shares derived and `badgeSegments` correcting
  its rounding remainder; eight fixtures 7,880 → 7,830 plus a twelve-month series at a *different
  scope on purpose*; the departmental table where the **Revenue / Cost tag is load-bearing** — a
  naive "variance > 0 is good" rule misreads exactly one row, and the three drivers (240 + 150 + 20)
  reconcile *exactly* with Marketing's 410 overspend · **US-011** one display layer
  (`app/lib/format.ts`, pure), `CHF` always carried with the sign *before* the unit, the Swiss U+2019
  group mark pinned ICU-independently, one rounding rule imported from `derive.ts`, plus a
  reconciliation suite sweeping every number in all six narratives. **No drift found.**

- ✅ **US-012 — Branded application shell (3 pts)** — the frame Phase 2a builds on: navy sidebar, top
  app bar, and an empty 12-column canvas for US-013/US-014. The persona is a *role* —
  `app/lib/persona.ts` holds the workspace label and the "SM" monogram, and a test accounts for the
  app bar's entire text, so a personal name cannot be added by accident. Placeholder nav items are
  inert **structurally** (`aria-disabled`, no href, no focus). Chrome: no scroll at 1920×1080.

- ✅ **US-014 — Dynamic tile insertion & grid reflow (3 pts)** — the mechanic the whole demo turns on:
  the dashboard **grows, it never clears**. Session state is a memory-only list of `{heroId, phase,
  revision}`, owned by `root.tsx`. Re-asking a hero **refreshes in place** and a follow-up **flips an
  existing section's phase** instead of appending (what US-033 builds on). Sections re-use the canvas
  grid's tracks via `grid-cols-subgrid`, so there is still only **one grid**. Chrome: tiles glide
  rather than jump, the view auto-scrolls, and reduced motion skips the tween with an identical
  layout. A scan asserts no storage API in `app/**`.

- ✅ **US-015 — Reset to baseline (2 pts)** — the control that lets the demo be run twice, built as a
  **transition beside the other three**: `withBaselineRestored`, `reset` on `useDashboard`,
  `scrollToTop`, US-012's Reset wired through `onReset`, restoring `BASELINE_SECTIONS` — the *same*
  constant that is the hook's initial state. **The timer is the story:** `reset` cancels the pending
  beat *first*; deleting that line makes two tests fail with a `HERO_2` section landing in a
  just-cleared dashboard. Ten presses in one frame still run **one** view transition.

- ✅ **US-027 — Motion & animation hooks (3 pts)** — the four hooks the other ten E6 components are
  built on: `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`. **Count-up tracks the figure on
  screen in a ref**, so a filter changed mid-animation carries on from the old number rather than
  snapping to zero (US-016 measured exactly that in Chrome). **Reduced motion means final state in
  the same render**, so `width={grown ? w : 0}` geometry can never be stranded. One source via
  `useSyncExternalStore`; every frame and listener freed on unmount. 42 new tests.

- ✅ **US-017 — KPI tile & variance chip (2 pts)** — the first component built ON the motion hooks,
  and the shape the other nine follow: `DeltaChip` in its own module, plus `KpiSparkline` /
  `KpiFigure` / `KpiTile`. **Colour is never the sole signal, and the `light` variant is the proof**
  — on navy both directions share one white treatment and a test asserts the two chips' class strings
  are *identical* while glyph, explicit sign and an `sr-only` word still differ. **Direction is
  arithmetic, judgement is meaning** — an optional `judgement` prop draws Marketing's overspend as an
  up arrow in the *negative* token. **No variant per hero**: extras arrive as `children`, and
  US-016's navy band composes `KpiFigure onDark`. **The US-012 `tailwind-merge` trap is closed at the
  root** in `app/lib/cn.ts`, so a size and a colour can share an element from here on. 78 tests.

- ✅ **US-021 — Horizontal bar tile (3 pts)** — the most reused chart in the product, built once in
  `app/components/charts/h-bars.tsx` for all five consumers as `HBarRow` / `HBars` / `HBarTile`.
  **The two review decisions are read back off the rendered element by tests:** the 150px label
  column with `truncate` / `text-ellipsis` / `line-clamp` *rejected* (so `Cap "Rotblau"` cannot
  regain its reported ellipsis) and the 96px `nowrap` value column proven through `getComputedStyle`
  on three lists. **One rule serves every consumer: the sign of the displayed figure** — it sets the
  anchor side, the token and the text sign, so `negative` mode is just "every row is a decline".
  Rows keyed by name, so a filter change transitions the *same* bar while the figure counts on from
  what is on screen; `hBarMax` / `hBarPercent` return zero width rather than `NaN`. 55 new tests.

- ✅ **US-013 — Baseline dashboard, four pre-existing tiles (3 pts)** — **the canvas stops being
  empty.** `baseline-row.tsx` composes `KpiTile` ×2, `HBarTile` and a new `PartnersTile` as direct
  children of US-012's one grid. **No figure is re-typed:** figures come from the US-007 repository
  in the SSR loader, `+11.9%` is `seriesTotals` off the same array the sparkline draws, and a
  **source scan** fails on any literal figure, pre-formatted `CHF`/`%` string, product or partner
  name, or `toLocaleString`/`toFixed`. **Reset's baseline seam is closed** (static route chrome,
  proven by an innerHTML compare). **First real-Chrome pass for US-017/US-021/US-027**: no scroll at
  1920×1080, 54 distinct KPI strings, 43 distinct bar widths, two values only reduced. 103 tests.

- ✅ **US-026 — Segmented period filter control (2 pts)** — one control in
  `app/components/controls/segmented.tsx` for all three of its consumers: the dark hero band, Top
  Products' `action` slot, and Hero 1's section header. **Controlled, with no opinion of its own** —
  a press the caller ignores changes nothing on screen, which is what lets one control drive two
  tiles (the band) or three (Hero 1) without them ever disagreeing. Keys are the shared `PeriodKey`,
  never a local union, and the label is data on the *entry*, so Hero 1 says "Current month" for the
  same `THIS_MONTH` key. **11px, deliberately not a pill:** the reviewed radius already existed as
  `--radius-chip`, so the group wears `rounded-chip` and each option the new `.fcb-chip` rule, and
  tests reject `rounded-full` in the markup, the source *and* the stylesheet. Radiogroup semantics:
  one tab stop via roving `tabIndex`, wrapping arrows plus Home/End, and selection carried by shape,
  shadow, weight *and* `aria-checked` — never colour alone. 45 new tests.

- ✅ **US-025 — Line chart component (3 pts)** — one chart in
  `app/components/charts/line-chart.tsx` for both consumers: the navy hero band (gold area line over
  a dashed white one, keyed by period) and Hero 2's twelve-month two-season comparison. Series count
  is a prop, `area` / `dash` is per series, colour is a token **name**, so no hex can enter. **The
  stroke draw survives reduced motion:** `pathLength="1"` plus an offset transitioning 1 → 0, and a
  test reads `stroke-dashoffset="0"` with **zero frames requested**. **It replays by being re-keyed
  and by nothing else.** Hover lists **every** series at the nearest index through US-011, with
  arrow/Home/End/Escape doing the same without capturing Tab. Gradient ids from `useUid`; a missing
  point is a labelled zero, never a `NaN` in a `d`. 73 new tests.

- ✅ **US-016 — Hero band: webshop trend & attendance ring (5 pts)** — **Phase 2a closes at 5/5 ·
  16/16 pts.** The navy greeting band, where **ONE `Segmented` drives both halves** from one
  `BaselinePeriod` entry: the webshop `LineChart` (gold area over a dashed previous period, re-keyed
  by period so the stroke draw replays) and the **one genuinely new visual** — a hand-built
  `AttendanceRing` sweeping on `stroke-dasharray`, its centre swapping to "% of capacity" on hover
  *or focus*. Total and delta are computed from the plotted series (no field stores them); the
  greeting comes from an injectable clock. Top Products' `action` slot gained its light `Segmented`.
  **Chrome at 1920×1080:** no scroll, 54 distinct KPI strings never touching zero, the re-keyed offset
  1px → 0px over 44 values, 43 distinct dash pairs, one value each under reduced motion. One real
  defect found and fixed in `LineChart`: clipped end axis labels now anchor inwards. 92 new tests.

- ✅ **US-018 — Vertical bar chart tile (3 pts)** — the kit-split chart in
  `app/components/charts/v-bars.tsx` (`vBarGeometry` / `VBars` / `VBarTile`), built for US-034's
  "Shirt sales by kit". **Bar persistence is the story, and the test is a re-rank:** columns are keyed
  by category, so a filter press hands `Home` the *same* `<rect>` and its `x`/`y`/`height` CSS
  transition carries it — an index key fails two tests, one on element identity, one showing labels
  jumping to a neighbour's figure. Nothing snaps to zero, and reduced motion lands on final heights
  with **zero frames requested**. Gradient caps, one gradient per *distinct* token colour, gridlines
  behind, counting labels above, a `filter` hover highlight and an optional per-bar renderer (Hero 1's
  units + share + revenue). Category labels are DOM text because SVG text cannot wrap. 52 new tests.

- ✅ **US-019 — Grouped bar chart tile (3 pts)** — the ticket-revenue chart in
  `app/components/charts/grouped-bars.tsx` (`groupedBarGeometry` / `GroupedBars` / `GroupedBarTile`),
  built for US-036's eight fixtures: **sixteen bars (navy 25/26, red 26/27) and eight delta chips in
  one tile.** That density is the whole story, and **the overlap fix the review asked for is now
  arithmetic rather than padding:** the y-axis owns a 44-unit left gutter every bar, chip, label and
  legend row is inset to, and a 34-unit chip band above the bars stays empty because the axis maximum
  is *derived from the geometry* (fed to US-018's `niceMax`, which only rounds up). Both halves are
  **measured**: no chip slot reaches the gutter or its neighbour (at 8 pairs and at 14), the tallest
  bar clears the band across seven datasets × three heights, and a fixed 10% headroom fails that
  test. Chips are US-017's `DeltaChip` in one flex strip, so overlap is impossible by layout too.
  **No per-bar value labels by design** — sixteen figures over sixteen bars *was* the defect — so the
  gutter carries magnitudes, the chip the movement and the tooltip the readings, with a labelled zero
  for a bar with no height. Pairs keyed by fixture (an index key fails the re-rank test); mixed signs
  render both ways. 63 new tests, 1205 green, 100% on the new file.

- ✅ **US-020 — Donut / ring tile (3 pts)** — the sponsor-badge ring in
  `app/components/charts/donut.tsx` (`donutGeometry` / `Donut` / `DonutTile`), built for US-034's
  "Sponsor badges printed": four segments with even gaps, a counting centre total and a legend. **It
  is deliberately not US-016's attendance ring** — that is a single-arc gold gauge on navy; this is
  four series arcs on a white card, sharing only the dasharray technique. **Two hover surfaces, ONE
  state:** an arc and its legend row both write the same hovered index, and a cross-surface test
  hovers the *legend* to assert the *arc* thickens and the centre swaps, then hovers a different arc
  to assert the legend follows — stubbing out either write fails 4-5 tests. Rows are real buttons, so
  focus does what hover does. **The segments morph rather than re-enter:** arcs and rows are keyed by
  sponsor, so a period press transitions the *same* `<circle>`'s dasharray/dashoffset (an index key
  fails the re-rank test) while one `useCountUp` moves the centre between the total and a segment
  figure, never via zero. **The arithmetic is `badgeSegments`'** (US-008), imported not restated, so
  the four printed figures add up exactly to the middle at 3'080 / 1'136 / 430 / 334 and ten
  adversarial totals. 56 new tests, 1261 green.
---

## 🏁 Phase 2a complete — Dashboard Shell & Persona Baseline

**Phase 2a goal:** the frame the demo lives in — shell, persona, a dashboard that already looks
lived-in, and the insertion mechanic. Closed at 100% on 2026-09-09, as did **Phases 1a and 1b**.
**Duration:** 2026-09-09 (one day, ahead of the 2026-09-11 target)
**Progress:** 100% (5/5 stories · 16/16 points)

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-022: Department table tile | ⏳ Ready | Next up; right-aligned numeric headers incl. "% of target" is a review decision |
| US-023: Driver / breakdown tile | ⏳ Ready | Composes US-021's row; no new row to write |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
| US-020: Donut / ring tile | 2026-09-09 | 3 |
| US-019: Grouped bar chart tile | 2026-09-09 | 3 |
| US-018: Vertical bar chart tile | 2026-09-09 | 3 |
| US-016: Hero band — webshop trend & attendance ring | 2026-09-09 | 5 |
| US-026: Segmented period filter control | 2026-09-09 | 2 |
| US-025: Line chart component | 2026-09-09 | 3 |
| US-013: Baseline dashboard — four pre-existing tiles | 2026-09-09 | 3 |
| US-021: Horizontal bar tile | 2026-09-09 | 3 |
| US-017: KPI tile & variance chip | 2026-09-09 | 2 |
| US-027: Motion & animation hooks | 2026-09-09 | 3 |
| US-015: Reset to baseline | 2026-09-09 | 2 |
| US-014: Dynamic tile insertion & grid reflow | 2026-09-09 | 3 |
| US-012: Branded application shell | 2026-09-09 | 3 |
| US-011: Formatters & cross-hero reconciliation | 2026-09-09 | 2 |
| US-010: Hero 3 dataset — departmental performance | 2026-09-09 | 2 |
| US-009: Hero 2 dataset — ticket revenue year on year | 2026-09-09 | 2 |
| US-008: Hero 1 dataset — shirt sales, badges, printed names | 2026-09-09 | 2 |
| US-007: Persona baseline datasets | 2026-09-09 | 2 |
| US-006: Tile-insertion motion & reduced-motion support | 2026-09-09 | 3 |
| US-005: Tile card anatomy | 2026-09-09 | 2 |
| US-004: Self-hosted FCB crest | 2026-09-09 | 1 |
| US-003: Design token set | 2026-09-09 | 3 |
| US-002: Developer tooling & local DX | 2026-09-09 | 2 |
| US-001: Environment & deployment setup | 2026-09-09 | 3 |

---

## ⚠️ Active Blockers

✅ No active blockers

**Open human step (not a blocker):** the Railway deploy for US-001 — run
`railway login && railway init && railway up`, then record the shareable URL.

---

## 📈 Velocity & Timeline

**Current / Average Velocity:** - points/day · **Velocity Trend:** N/A (insufficient data)

**Projected Completion:** 2026-09-15 (8h/day) · 2026-09-11 (24/7) · **Timeline:** 🟢 On Track
**Target Completion:** end of this week — sponsor showing follows

> ⚠️ At **8h/day weekdays only**, AI-realistic lands 2026-09-20, past the deadline. The lever is
> hours per day, not scope — the entire P1 cut set is worth only 0.82 days.

---

## 🧪 Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage (`app/**`) | 99.71% stmts / 97.61% branches / 100% funcs / 100% lines | 80% | 🟢 Good |
| Passing Tests | 1261/1261 | TBD | 🟢 Good |
| TypeScript Errors (strict) | 0 | 0 | 🟢 Good |
| ESLint Problems | 0 errors, 0 warnings | 0 errors | 🟢 Good |
| Dependency Advisories | 0 | 0 high/critical | 🟢 Good |
| Open Bugs | 0 | < 5 | 🟢 Good |

> Coverage is measured over `app/**` only, and the suite is substantive rather than hollow: it pins
> every hex, the type scale and the colour discipline, fails the build if `app/app.css` and
> `app/lib/tokens.ts` disagree, and asserts structurally that no reduced-motion path leaves an
> element stranded at zero. The data suites pin the Specification figures, prove every total is
> *derived*, force the badge segments to sum exactly at every total from 0 to 2,000 (US-020 re-proves
> it on screen), show that a naive "variance > 0 is good" rule misreads exactly one department, and
> (US-011) sweep every number in all six narratives. The component suites test the same way: variance
> stays distinguishable with the colour *removed* (US-017); US-021's and US-019's review decisions
> are read back off the rendered element; US-013 scans its own sources for a literal figure; US-025
> proves no chart path is left undrawn; US-016 and US-020 prove ONE control (or one state) moves two
> things at once. The gate is three-part: strict `tsc`, ESLint 9 and Prettier, via husky.

---

## 📊 Phase Breakdown

| Phase | Status | Stories | Points | Progress |
|-------|--------|---------|--------|----------|
| Phase 1a: Setup & Design System | ✅ Completed | 6/6 | 14/14 | 100% |
| Phase 1b: Seed Data | ✅ Completed | 5/5 | 10/10 | 100% |
| Phase 2a: Shell & Baseline | ✅ Completed | 5/5 | 16/16 | 100% |
| Phase 2b: Component Library | 🔄 In Progress | 8/11 | 22/29 | 76% |
| Phase 3a: Conversation | ⏸️ Pending | 0/6 | 0/17 | 0% |
| Phase 3b: Heroes | ⏸️ Pending | 0/6 | 0/16 | 0% |
| Phase 4: Hardening | ⏸️ Pending | 0/6 | 0/14 | 0% |

---

## 🔗 Quick Links

- **[Current Phase Plan](../phases/phase-2b.md)** - Phase 2b, Chart & Tile Component Library
- **[Phase 2a Plan](../phases/phase-2a.md)** - Completed 2026-09-09 (5/5 · 16/16 pts)
- **[Phase 1b Plan](../phases/phase-1b.md)** - Completed 2026-09-09
- **[Phase 1a Plan](../phases/phase-1a.md)** - Completed 2026-09-09
- **[Backlog](../../input/backlog/)** - All project backlogs
- **[Detailed Status](current-status.md)** - Full status report
- **[Completed Work](completed.md)** - Complete history
- **[Blockers](blockers.md)** - All blockers
- **[Effort Estimate](../reports/ai-hours-estimate-2026-09-09.md)** - AI-hours projection

---

**💡 Tip:** This file updates automatically during `/execute-work`.

**Last Auto-Update:** US-020 completed at 2026-09-09 — Phase 2b is at 8/11 · 22/29 pts. The segmented donut (`Donut` / `DonutTile`) is US-034's sponsor-badge ring: four arcs with even gaps, a counting centre total and a legend. **Criterion 2 is two hover surfaces sharing one state** — an arc and its legend row both write the hovered index, proven by a cross-surface test, and the rows are real buttons so focus does what hover does. **Criterion 3 is a morph, not a remount** — arcs keyed by sponsor, so a period press transitions the same circle's dasharray/dashoffset and the centre counts from the figure on screen. **Criterion 4 reuses `badgeSegments`**, so the four figures add up exactly to the centre total at every period total and ten adversarial ones. **Next is US-022** — department table tile (3 pts)
