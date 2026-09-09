# 📊 Project Dashboard

**Last Updated:** 2026-09-09
**Current Phase:** Phase 2b - Chart & Tile Component Library *(10/11 stories complete)* · **Phases 1a + 1b + 2a all complete**

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 58% | 100% | 🟢 On Track |
| **Phase 1a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 1b** | 100% — Completed | 100% | 🟢 Done |
| **Phase 2a** | 100% — Completed | 100% | 🟢 Done |
| **Stories Completed** | 26/45 | 45 | 🟢 On Track |
| **Story Points Done** | 67/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% lines (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-09)

**Stories Completed Today:** 26
**Currently Working On:** US-024 — Recommendation panel & narrative caption strip (2 pts)
**Story Points Completed Today:** 67

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

- ✅ **US-012 — Branded application shell (3 pts)** — navy sidebar, top app bar, an empty 12-column
  canvas. The persona is a *role* (`app/lib/persona.ts`); a test accounts for the app bar's entire
  text, so a personal name cannot be added by accident. Placeholder nav is inert structurally.

- ✅ **US-014 — Dynamic tile insertion & grid reflow (3 pts)** — the mechanic the demo turns on: the
  dashboard **grows, it never clears**. Memory-only session state in `root.tsx`; re-asking refreshes
  in place and a follow-up flips a section's phase instead of appending. Sections reuse the canvas
  tracks (`grid-cols-subgrid`), so there is still **one grid**; a scan asserts no storage API.

- ✅ **US-015 — Reset to baseline (2 pts)** — the control that lets the demo be run twice, built as a
  transition beside the other three and restoring the *same* `BASELINE_SECTIONS` the hook starts
  from. **The timer is the story:** `reset` cancels the pending beat *first* — delete that line and
  two tests fail with a `HERO_2` section landing in a just-cleared dashboard.

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
  **source scan** fails on any literal figure, pre-formatted `CHF`/`%` string, name, or
  `toLocaleString`/`toFixed`. **Reset's baseline seam is closed.** **First real-Chrome pass for
  US-017/US-021/US-027**: no scroll at 1920×1080, 54 distinct KPI strings. 103 tests.

- ✅ **US-026 — Segmented period filter control (2 pts)** — one control in
  `app/components/controls/segmented.tsx` for all three of its consumers: the dark hero band, Top
  Products' `action` slot, and Hero 1's section header. **Controlled, with no opinion of its own** —
  a press the caller ignores changes nothing on screen, which is what lets one control drive two
  tiles (the band) or three (Hero 1) without them ever disagreeing. Keys are the shared `PeriodKey`,
  never a local union. **11px, deliberately not a pill:** the reviewed radius already existed as
  `--radius-chip`, and tests reject `rounded-full` in the markup, the source *and* the stylesheet.
  Radiogroup semantics: one tab stop, wrapping arrows plus Home/End, selection carried by shape,
  shadow, weight *and* `aria-checked` — never colour alone. 45 tests.

- ✅ **US-025 — Line chart component (3 pts)** — one chart in
  `app/components/charts/line-chart.tsx` for both consumers: the navy hero band (gold area line over
  a dashed white one, keyed by period) and Hero 2's twelve-month two-season comparison. Series count
  is a prop, `area` / `dash` is per series, colour is a token **name**, so no hex can enter. **The
  stroke draw survives reduced motion:** `pathLength="1"` plus an offset transitioning 1 → 0, read
  back as `stroke-dashoffset="0"` with **zero frames requested**; it replays by being re-keyed and by
  nothing else. Hover lists **every** series at the nearest index, keyboard included. Gradient ids
  from `useUid`; a missing point is a labelled zero. 73 new tests.

- ✅ **US-016 — Hero band: webshop trend & attendance ring (5 pts)** — **Phase 2a closes at 5/5 ·
  16/16 pts.** The navy greeting band, where **ONE `Segmented` drives both halves** from one
  `BaselinePeriod` entry: the webshop `LineChart` (gold area over a dashed previous period, re-keyed
  so the stroke draw replays) and the **one genuinely new visual** — a hand-built `AttendanceRing`
  sweeping on `stroke-dasharray`, its centre swapping to "% of capacity" on hover *or focus*. Total
  and delta are computed from the plotted series; the greeting comes from an injectable clock.
  **Chrome at 1920×1080:** no scroll, 54 distinct KPI strings never touching zero, 43 distinct dash
  pairs, one value each under reduced motion. One real defect found and fixed in `LineChart`:
  clipped end axis labels now anchor inwards. 92 new tests.

- ✅ **US-018 — Vertical bar chart tile (3 pts)** — the kit-split chart in
  `app/components/charts/v-bars.tsx` (`vBarGeometry` / `VBars` / `VBarTile`), built for US-034's
  "Shirt sales by kit". **Bar persistence is the story, and the test is a re-rank:** columns are keyed
  by category, so a filter press hands `Home` the *same* `<rect>` and its `x`/`y`/`height` CSS
  transition carries it — an index key fails two tests, one on element identity, one showing labels
  jumping to a neighbour's figure. Nothing snaps to zero, and reduced motion lands on final heights
  with **zero frames requested**. Gradient caps, one gradient per *distinct* token colour, gridlines
  behind, counting labels above, a hover highlight and an optional per-bar renderer. Category labels
  are DOM text because SVG text cannot wrap. 52 new tests.

- ✅ **US-019 — Grouped bar chart tile (3 pts)** — the ticket-revenue chart in
  `app/components/charts/grouped-bars.tsx` (`groupedBarGeometry` / `GroupedBars` / `GroupedBarTile`),
  built for US-036's eight fixtures: **sixteen bars and eight delta chips in one tile.** That density
  is the story, and **the overlap fix is arithmetic rather than padding:** the y-axis owns a 44-unit
  gutter everything is inset to, and a 34-unit chip band stays empty because the axis maximum is
  *derived from the geometry*. Both halves are **measured** — no chip slot reaches the gutter or its
  neighbour (8 pairs and 14), the tallest bar clears the band across seven datasets, and a fixed 10%
  headroom fails that test. **No per-bar value labels by design**, except a labelled zero. Pairs
  keyed by fixture; an index key fails the re-rank test. 63 new tests, 1205 green.

- ✅ **US-020 — Donut / ring tile (3 pts)** — the sponsor-badge ring in
  `app/components/charts/donut.tsx` (`donutGeometry` / `Donut` / `DonutTile`), built for US-034's
  "Sponsor badges printed": four segments with even gaps, a counting centre total and a legend. **Not
  US-016's attendance ring** — that is a single-arc gold gauge on navy; this is four series arcs on a
  white card, sharing only the dasharray technique. **Two hover surfaces, ONE state:** an arc and its
  legend row write the same index, proven by a cross-surface test; rows are real buttons, so focus
  does what hover does. **The segments morph rather than re-enter:** arcs keyed by sponsor, so a
  period press transitions the *same* circle's dasharray while one `useCountUp` moves the centre.
  **The arithmetic is `badgeSegments`'** (US-008), so the figures add up exactly. 56 tests, 1261.
- ✅ **US-022 — Department table tile (3 pts)** — Hero 3's primary tile in
  `app/components/tiles/department-table.tsx`: a real `<table>`, six departments and a total row.
  **The revenue/cost trap is closed by construction, not by care:** the colour comes from
  `row.judgement` (US-010's `varianceJudgement`, decided once from the department's type) through
  US-017's `DeltaChip`, so **Marketing's +410 renders as an UP arrow in the NEGATIVE token** while
  Sponsoring's +840 renders FAVOURABLE — and a source scan rejects `FAVOURABLE` / `ADVERSE`, any
  `variance <>` test and any `DepartmentType` equality, so the judgement cannot migrate back in.
  **Both review decisions are asserted:** CHF **millions** with an unremovable subtitle saying so
  (no `/000/` anywhere), and numeric headers right-aligned **including "% of target"** through one
  rule the header *and* its cells read. 54 new tests, 1315 green.
- ✅ **US-023 — Driver / breakdown tile (2 pts)** — the contribution list for all three causal
  follow-ups, in `app/components/tiles/driver-tile.tsx`. **It draws no bars, and that is the
  point:**
  every row is US-021's `HBarRow` through `HBarTile`, the tests read the 150px label and 96px
  `nowrap` value columns back off the rows this tile produced, and a source scan rejects bar
  geometry, count-up, gradients and local state. **What it adds is three things:** stable ranking
  (equal to US-009's `fixtureDeclines`, so Luzern stays ahead of the tied Sion), a total **derived
  from the rows on screen** so the `-CHF 400k total` badge cannot disagree with the bars (it matches
  `declineTotal` and Marketing's +410 variance), and a muted note line. Two seams were widened
  rather than forked: `HBarTile` gained a `children` slot, `DeltaChip` a `suffix`. 43 tests, 1358.

---

## 🏁 Phase 2a complete — Dashboard Shell & Persona Baseline

**Phase 2a goal:** the frame the demo lives in — shell, persona, a dashboard that already looks
lived-in, and the insertion mechanic. Closed at 100% on 2026-09-09, as did **Phases 1a and 1b**.
**Duration:** 2026-09-09 (one day, ahead of the 2026-09-11 target)
**Progress:** 100% (5/5 stories · 16/16 points)

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-024: Recommendation panel & caption strip | ⏳ Ready | Next up, and the last of Phase 2b; must read as advice, not as a data tile, and must reuse `Card`'s existing caption strip |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
| US-023: Driver / breakdown tile | 2026-09-09 | 2 |
| US-022: Department table tile | 2026-09-09 | 3 |
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
> hours per day, not scope — the P1 cut set is worth only 0.82 days.

---

## 🧪 Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage (`app/**`) | 99.81% stmts / 98.08% branches / 100% funcs / 100% lines | 80% | 🟢 Good |
| Passing Tests | 1358/1358 | TBD | 🟢 Good |
| TypeScript Errors (strict) | 0 | 0 | 🟢 Good |
| ESLint Problems | 0 errors, 0 warnings | 0 errors | 🟢 Good |
| Dependency Advisories | 0 | 0 high/critical | 🟢 Good |
| Open Bugs | 0 | < 5 | 🟢 Good |

> Coverage is measured over `app/**` only, and the suite is substantive rather than hollow: it pins
> every hex, the type scale and the colour discipline, fails the build if `app/app.css` and
> `app/lib/tokens.ts` disagree, and asserts that no reduced-motion path strands an element at zero.
> The data suites pin the Specification figures, prove every total is *derived*, force the badge
> segments to sum exactly at every total from 0 to 2,000 (US-020 re-proves it on screen), show that a
> naive "variance > 0 is good" rule misreads exactly one department, and
> (US-011) sweep every number in all six narratives. The component suites test the same way: variance
> stays distinguishable with the colour *removed* (US-017); US-021's and US-019's review decisions are
> read back off the rendered element, US-022's source cannot even NAME a good/bad verdict and
> US-023's cannot contain bar geometry; US-013 scans for a literal figure; US-016 and US-020 prove
> ONE control moves two things. The gate is three-part: `tsc`, ESLint 9 and Prettier, via husky.

---

## 📊 Phase Breakdown

| Phase | Status | Stories | Points | Progress |
|-------|--------|---------|--------|----------|
| Phase 1a: Setup & Design System | ✅ Completed | 6/6 | 14/14 | 100% |
| Phase 1b: Seed Data | ✅ Completed | 5/5 | 10/10 | 100% |
| Phase 2a: Shell & Baseline | ✅ Completed | 5/5 | 16/16 | 100% |
| Phase 2b: Component Library | 🔄 In Progress | 10/11 | 27/29 | 93% |
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

**Last Auto-Update:** US-023 completed at 2026-09-09 — Phase 2b is at 10/11 · 27/29 pts. The driver tile (`DriverTile`, `DriverTotalBadge`, plus the pure `rankDrivers` / `driverTotal`) is the contribution list under all three causal follow-ups, and it is deliberately THIN: **every row is US-021's `HBarRow` through `HBarTile`** — the tests read the 150px label and 96px `nowrap` value columns back off the rows this tile produced, and a source scan rejects bar geometry, count-up, gradients and local state, so the shared row cannot be copied a sixth time. It adds exactly three things: **stable magnitude ranking** (equal to US-009's `fixtureDeclines`, so Luzern stays ahead of the tied Sion), a **total derived from the rows on screen** so the `-CHF 400k total` badge can never disagree with the bars (it matches `declineTotal`, and Marketing's drivers match the +410 variance), and a muted note line for US-037's attendance sentence. `HBarTile` gained a `children` slot and `DeltaChip` a `suffix` node — seams widened, not forked. **Next is US-024** — recommendation panel & narrative caption strip (2 pts), the last story in Phase 2b
