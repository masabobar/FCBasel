# 📊 Project Dashboard

**Last Updated:** 2026-09-09
**Current Phase:** Phase 3a - Conversation *(1/6 stories)* · **Phases 1a + 1b + 2a + 2b all complete**

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 61% | 100% | 🟢 On Track |
| **Phase 1a / 1b / 2a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 2b** | 100% — Completed (11/11 · 29/29) | 100% | 🟢 Done |
| **Stories Completed** | 28/45 | 45 | 🟢 On Track |
| **Story Points Done** | 71/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% lines (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-09)

**Stories Completed Today:** 28
**Currently Working On:** US-029 — Suggestion chips & chip lifecycle (3 pts)
**Story Points Completed Today:** 71

- ✅ **Phase 1a — Setup & Design System (6 stories, 14 pts)** — RR7 SSR scaffold (Railway deploy is a
  human step) · ESLint 9 + Prettier + husky · one token set as Tailwind v4 `@theme static` *and* a
  typed TS object, kept in lockstep by a parity test · crest self-hosted (194 KB → 17.9 KB) · one
  `Card` shell (slots, not variants) · four keyframes, reduced motion *collapsing* to a final frame.

- ✅ **Phase 1b — Seed data & formatters (5 stories, 10 pts)** — **US-007** set the E3 pattern (enums
  + types + repository interface, fixtures in `app/lib/mock/`, server-only selection, every total
  *derived*) · **US-008/009/010** the three hero datasets, including the departmental table where the
  **Revenue / Cost tag is load-bearing** (a naive "variance > 0 is good" rule misreads exactly one
  row) and drivers reconciling *exactly* with Marketing's 410 overspend · **US-011** one pure display
  layer, Swiss U+2019 pinned ICU-independently, plus a reconciliation sweep of every number in all
  six narratives. **No drift found.**

- ✅ **US-012 / US-014 / US-015 — shell, insertion, reset (8 pts)** — navy sidebar + app bar + one
  12-column canvas, the persona a *role*; the dashboard **grows, it never clears** (memory-only state
  in `root.tsx`, sections reusing the canvas tracks so there is still ONE grid); and Reset as a
  fourth transition restoring the same `BASELINE_SECTIONS`, cancelling the pending beat *first*.

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
  column with `truncate` / `text-ellipsis` / `line-clamp` *rejected*, and the 96px `nowrap` value
  column proven through `getComputedStyle`. **One rule serves every consumer: the sign of the
  displayed figure** sets anchor side, token and text sign. Rows keyed by name, so a filter change
  transitions the *same* bar while the figure counts on from screen. 55 new tests.

- ✅ **US-013 — Baseline dashboard, four pre-existing tiles (3 pts)** — **the canvas stops being
  empty.** `baseline-row.tsx` composes `KpiTile` ×2, `HBarTile` and a new `PartnersTile` as direct
  children of US-012's one grid. **No figure is re-typed:** figures come from the US-007 repository
  in the SSR loader, `+11.9%` is `seriesTotals` off the same array the sparkline draws, and a
  **source scan** fails on any literal figure, pre-formatted `CHF`/`%` string, name, or
  `toLocaleString`/`toFixed`. **Reset's baseline seam is closed.** **First real-Chrome pass for
  US-017/US-021/US-027**: no scroll at 1920×1080, 54 distinct KPI strings. 103 tests.

- ✅ **US-026 — Segmented period filter control (2 pts)** — one control in
  `app/components/controls/segmented.tsx` for all three consumers: the dark band, Top Products'
  `action` slot, Hero 1's section header. **Controlled, with no opinion of its own** — a press the
  caller ignores changes nothing, which is what lets one control drive two tiles without them
  disagreeing. Keys are the shared `PeriodKey`. **11px, deliberately not a pill** (`rounded-full`
  rejected in markup, source *and* stylesheet). Radiogroup semantics: one tab stop, wrapping arrows
  plus Home/End, selection carried by shape, shadow, weight *and* `aria-checked`. 45 tests.

- ✅ **US-025 — Line chart component (3 pts)** — one chart in
  `app/components/charts/line-chart.tsx` for both consumers: the navy hero band and Hero 2's
  twelve-month comparison. Series count is a prop, `area` / `dash` is per series, colour is a token
  **name**, so no hex can enter. **The stroke draw survives reduced motion:** `pathLength="1"` plus
  an offset transitioning 1 → 0, read back as `stroke-dashoffset="0"` with **zero frames
  requested**; it replays by being re-keyed and nothing else. Hover lists **every** series at the
  nearest index, keyboard included. 73 new tests.

- ✅ **US-016 — Hero band: webshop trend & attendance ring (5 pts)** — **Phase 2a closes at 5/5 ·
  16/16 pts.** The navy greeting band, where **ONE `Segmented` drives both halves** from one
  `BaselinePeriod` entry: the webshop `LineChart` and the **one genuinely new visual** — a
  hand-built `AttendanceRing` sweeping on `stroke-dasharray`, its centre swapping to "% of capacity"
  on hover *or focus*. Total and delta are computed from the plotted series. **Chrome at 1920×1080:**
  no scroll, 54 distinct KPI strings, 43 distinct dash pairs, one value each under reduced motion.
  One real defect found and fixed in `LineChart`: clipped end axis labels anchor inwards. 92 tests.

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
  `app/components/charts/donut.tsx`, built for US-034: four segments with even gaps, a counting
  centre total and a legend. **Not US-016's attendance ring**, which is a single-arc gold gauge.
  **Two hover surfaces, ONE state:** an arc and its legend row write the same index, and rows are
  real buttons so focus does what hover does. **The segments morph rather than re-enter:** arcs
  keyed by sponsor. **The arithmetic is `badgeSegments`'** (US-008). 56 tests, 1261.
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
- ✅ **US-024 — Recommendation panel & narrative caption strip (2 pts)** — **Phase 2b closes at
  11/11 · 29/29 pts.** The two elements that carry the insight beat. **The caption strip was reused,
  not rebuilt:** one implementation in `card.tsx`, two placements — a tile's truncated foot line and
  the section narrative that wraps and is never truncated — so the AI glyph and its decorative
  `aria-hidden` exist once. **The recommendation panel is structurally not a tile** (`aside` region,
  its own eyebrow, a gold bar down the SIDE, `rounded-panel`, tinted surface, none of the card's
  metric chrome), because advice must never read as one more metric. **Verbatim is tested byte for
  byte** on US-039's string, and **criterion 3 is order**, so the tests assert the narrative precedes
  every chart in the section. 35 tests, 1393.
- ✅ **US-028 — Persistent prompt bar (2 pts)** — **Phase 3a opens**, and with it the only user input
  in the product. **ONE field, and the field itself is the typing area:** the search icon and the
  send button are siblings of the `<input>` inside the single bordered element, the focus ring is
  `:focus-within` on that same element, and a test walks the field's subtree and fails on any
  descendant carrying a border or a ring — the nested box was the reported defect. A real HTML
  `<form>` was used (the reference build avoided one only because its sandbox swallowed submits), so
  Enter and the embedded button are **one** code path. **Debounce without a second clock:** a submit
  consumes the question, clearing a mirrored ref *before* the callback, so three rapid Enters yield
  exactly one call, and `busy` closes the field for US-031's beat. Empty and whitespace-only are
  no-ops, chips untouched. `fixed`, not `sticky`, because the shell clips overflow; the canvas
  reserves the strip. XSS pass-through proven with an `<img onerror>` payload. 48 tests, 1441.

---

## 🏁 Phase 3a open — Conversational Interface

**Phase 2b** closed at 100% on 2026-09-09 (11/11 · 29/29 pts), as did **Phases 1a, 1b and 2a**: every
tile kind, chart geometry, control and hook a hero needs exists and is shared. **Phase 3a** now
builds the choreography that stands in for the AI, and its first story put a question box on screen.

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-029: Suggestion chips & chip lifecycle | 📋 Next | The bar's `children` slot and `CHIP_SURFACE_CLASS` are waiting for it |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
| US-028: Persistent prompt bar | 2026-09-09 | 2 |
| US-024: Recommendation panel & narrative caption strip | 2026-09-09 | 2 |
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
| Test Coverage (`app/**`) | 99.82% stmts / 98.20% branches / 100% funcs / 100% lines | 80% | 🟢 Good |
| Passing Tests | 1441/1441 | TBD | 🟢 Good |
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
| Phase 2b: Component Library | ✅ Completed | 11/11 | 29/29 | 100% |
| Phase 3a: Conversation | 🔄 Active | 1/6 | 2/17 | 12% |
| Phase 3b: Heroes | ⏸️ Pending | 0/6 | 0/16 | 0% |
| Phase 4: Hardening | ⏸️ Pending | 0/6 | 0/14 | 0% |

---

## 🔗 Quick Links

- **[Current Phase Plan](../phases/phase-3a.md)** - Phase 3a, Conversation (US-028 to US-033)
- **[Phase 2b Plan](../phases/phase-2b.md)** - Completed 2026-09-09 (11/11 · 29/29 pts)
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

**Last Auto-Update:** US-028 completed at 2026-09-09 — **Phase 3a is open at 1/6 · 2/17 pts**, and the product now has a question box. **The field IS the typing area:** one rounded element carries the border, the search icon and the send button sit inside it as siblings of the `<input>`, and the focus ring is `:focus-within` on that same element with the input's own outline suppressed — the inner bordered box that review reported cannot come back, because a test walks the field's subtree and fails on any descendant carrying a border or a ring. **A real HTML `<form>` was chosen**: the reference build avoided one only because its sandbox swallowed submissions, and in this stack the browser's implicit submission makes Enter and the embedded button ONE path instead of two hand-rolled ones. **Criterion 4 was met without inventing a second clock** — US-015 owns the only pending timer. A submit CONSUMES the question: the cleared value is written to a mirrored ref *before* `onSubmit` runs, so a second submit in the same tick reads an empty draft and takes the no-op branch, and `busy` genuinely disables both controls for US-031's beat. Three rapid Enters, a triple-click on send and a latching harness all yield exactly ONE call. Empty and whitespace-only input do nothing at all, chips untouched. `fixed` rather than `sticky`, because the shell clips overflow and would strand a sticky bar at the bottom of the CONTENT; the canvas reserves the strip so no tile hides under it, and the page keeps scrolling as US-015's Reset expects. **The security trigger fired and passed:** this is the app's only user input, and it is proved to travel as a string — rendered only as an input `value`, no `dangerouslySetInnerHTML`, no URL, request or locator built from it, an `<img onerror>` payload reaching the callback verbatim and creating no element. **Next is US-029** — the three suggestion chips, into the bar's `children` slot
