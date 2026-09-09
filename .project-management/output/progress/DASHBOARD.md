# 📊 Project Dashboard

**Last Updated:** 2026-09-09
**Current Phase:** Phase 3a - Conversation *(4/6 stories)* · **Phases 1a + 1b + 2a + 2b all complete**

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 70% | 100% | 🟢 On Track |
| **Phase 1a / 1b / 2a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 2b** | 100% — Completed (11/11 · 29/29) | 100% | 🟢 Done |
| **Stories Completed** | 31/45 | 45 | 🟢 On Track |
| **Story Points Done** | 81/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% lines (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-09)

**Stories Completed Today:** 31
**Currently Working On:** US-032 — Graceful fallback panel (2 pts)
**Story Points Completed Today:** 81

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
  built on. **Count-up tracks the figure on screen in a ref**, so a filter changed mid-animation
  carries on from the old number rather than snapping to zero. **Reduced motion means final state in
  the same render**, so `width={grown ? w : 0}` geometry can never be stranded. 42 new tests.

- ✅ **US-017 — KPI tile & variance chip (2 pts)** — `DeltaChip` plus `KpiSparkline` / `KpiFigure`
  / `KpiTile`, the shape the other nine components follow. **Colour is never the sole signal:** on
  navy both directions share one white treatment (class strings asserted *identical*) while glyph,
  sign and an `sr-only` word differ; **direction is arithmetic, judgement is meaning** (Marketing's
  overspend is an up arrow in the negative token). The `tailwind-merge` trap is closed in
  `app/lib/cn.ts`. 78 tests.

- ✅ **US-021 — Horizontal bar tile (3 pts)** — the most reused chart, built once in
  `app/components/charts/h-bars.tsx` for all five consumers. Both review decisions are read back off
  the rendered element: a 150px label column with truncation *rejected*, a 96px `nowrap` value
  column proven via `getComputedStyle`. **The sign of the displayed figure** sets anchor side, token
  and text sign; rows keyed by name, so a filter transitions the *same* bar. 55 tests.

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
  `app/components/charts/grouped-bars.tsx`: **sixteen bars and eight delta chips in one tile**, and
  **the overlap fix is arithmetic rather than padding** — a 44-unit axis gutter and a 34-unit chip
  band that stays empty because the axis maximum is *derived from the geometry* (a fixed 10%
  headroom fails the test). Both halves measured; pairs keyed by fixture. 63 tests, 1205 green.

- ✅ **US-020 — Donut / ring tile (3 pts)** — the sponsor-badge ring in
  `app/components/charts/donut.tsx`, built for US-034: four segments with even gaps, a counting
  centre total and a legend. **Not US-016's attendance ring**, which is a single-arc gold gauge.
  **Two hover surfaces, ONE state:** an arc and its legend row write the same index, and rows are
  real buttons so focus does what hover does. **The segments morph rather than re-enter:** arcs
  keyed by sponsor. **The arithmetic is `badgeSegments`'** (US-008). 56 tests, 1261.
- ✅ **US-022 — Department table tile (3 pts)** — Hero 3's real `<table>` in
  `app/components/tiles/department-table.tsx`. **The revenue/cost trap is closed by construction:**
  colour comes from `row.judgement` (US-010, decided once from the department type), so
  **Marketing's +410 is an UP arrow in the NEGATIVE token** while Sponsoring's +840 is favourable,
  and a source scan blocks the judgement migrating back in. CHF **millions** with an unremovable
  subtitle; numeric headers right-aligned by one rule header and cells share. 54 tests, 1315.
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
- ✅ **US-028 — Persistent prompt bar (2 pts)** — **Phase 3a opens**, and with it the only user
  input in the product. **ONE field, and the field itself is the typing area** (a test fails on any
  bordered descendant — the nested box was the reported defect). A real `<form>`, so Enter and the
  button are one code path. **Debounce without a second clock:** a submit clears a mirrored ref
  *before* the callback, so three rapid Enters yield one call. 48 tests, 1441.

- ✅ **US-029 — Suggestion chips & chip lifecycle (3 pts)** — **the screen can now be ASKED a
  question.** **The row is DERIVED, not stored**, so criterion ③'s "removed once shown" is
  implemented *nowhere* — the phase flip stops deriving it. Proven over **all 27** hero × phase
  combinations, and **US-015 criterion ② is thereby satisfied** with no reset code touched. **A tap
  bypasses scoring by TYPE.** Surface reused, not restated. 57 tests, 1498 green.

- ✅ **US-030 — Intent normalisation, scoring & tie-breaking (5 pts)** — **the riskiest story in the
  build: an off-script paraphrase, typed live.** A **faithful port of the approved reference
  algorithm**, pinned rather than trusted (an oracle asserts identical scores *and* winners over a
  90-phrase corpus): normalise → **+2 strong / +1 weak** → threshold **2 hero / 3 follow-up** →
  **strictly-greater** over an ordered config. **34 paraphrases**, each canonical prompt beating its
  own follow-up by an asserted margin; a three-way 2/2/2 tie resolves to Hero 1; one input yields
  **one** match or `null` — never two heroes. No `fetch`, no model, no dependency. 89 tests, 1587.

- ✅ **US-031 — Thinking beat (2 pts)** — **the pause that makes the answer feel earned, and it is
  stagecraft: no request is made** (scanned). **Ordering asserted, not assumed:** at `1150ms - 1` the
  panel is up and there is no section; at `1150ms` the section is there and the panel is gone —
  mutating it to land immediately fails 22 tests. Both question paths pause because `useThinking`
  returns the `ChipActions` the matcher and the chips already took, so **neither module changed** and
  a chip tap still bypasses scoring by type. **Still ONE timer** (a scan pins the only two places in
  `app/**` that may create one), so **US-015 criterion ④ is now satisfied**: Reset mid-beat leaves no
  panel, no section and no timer. Reduced motion: 260ms, chips at final state. 91 tests, 1678.

---

## 🏁 Phase 3a open — Conversational Interface

**Phase 2b** closed at 100% on 2026-09-09 (11/11 · 29/29 pts), as did **Phases 1a, 1b and 2a**: every
tile kind, chart geometry, control and hook a hero needs exists and is shared. **Phase 3a** now
builds the choreography that stands in for the AI, and its first story put a question box on screen.

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-032: Graceful fallback panel | 📋 Next | Dead-end prevention for anything off-script. A no-match shows NO beat, so the panel is the whole of the answer |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
| US-031: Thinking beat | 2026-09-09 | 2 |
| US-030: Intent normalisation, scoring & tie-breaking | 2026-09-09 | 5 |
| US-029: Suggestion chips & chip lifecycle | 2026-09-09 | 3 |
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
| Phase 3a: Conversation | 🔄 Active | 4/6 | 12/17 | 71% |
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
**Last Auto-Update:** US-031 completed at 2026-09-09 — **Phase 3a is at 4/6 · 12/17 pts**, and an answer no longer appears the instant it is asked. The thinking beat is the prototype's one moment of theatre and the Reference Guide is explicit about why it stays: *"the thinking delay is fake latency, not a query. Keep it — it is what makes the result feel earned."* So it is exactly that and nothing more — a fixed `setTimeout` scheduled through `useDashboard`'s single pending timer, with **no request made** anywhere in the three new modules (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `axios` and dynamic `import()` all scanned, no dependency added). **The ordering is asserted rather than assumed:** on a fake clock, one millisecond before the delay elapses the panel is on screen and there is NO section; at the delay the section is there and the panel is gone — and mutating the runner to land the answer immediately fails **22** tests. **Both question paths pause, and neither module changed to make that true:** `useThinking(dashboard)` wraps the hook's two actions and hands back a `ChipActions`, which is the interface `askQuestion` and `selectChip` already took, so a tapped chip waits exactly as a typed question does while a chip tap still bypasses US-030's scoring **by type**. An off-script question shows **no beat at all** — it never reaches the hook — which is precisely US-032's input. **There is still exactly ONE timer in the application:** no `setTimeout` in any new file, and a scan of every `.ts`/`.tsx` under `app/` pins the only two places one may be created. A second chip tap mid-beat therefore *replaces* the beat rather than racing it (one panel, one timer, one answer), and `busy` closes the field and the send button for the beat's length so a second submit is a no-op — removing US-028's guard fails that test. **This closes US-015 criterion ④, the last of its five:** Reset pressed mid-beat leaves no panel, no section and **no timer** (asserted on `vi.getTimerCount()`), the cancelled answer never arrives however far the clock is advanced, and the screen is usable again immediately — proved by mutation twice over (deleting `cancelPending()` fails 4 tests, deleting the beat's `generation` clear fails 4 more). **The panel is the reference's, verbatim:** the per-flow message and ordered source list for all six flows, a sweeping gold scan line, and the source chips lighting up one by one at 150 / 370 / 590ms — every flow's last chip landing before the answer does. A follow-up asked before its parent shows the PARENT's beat, so the panel can never promise something the dashboard is not about to give. **Reduced motion shortens the beat to ~260ms and renders the animations at their final state:** the source chips are VISIBLE rather than stranded at `opacity: 0`, with nothing inline that could override the stylesheet, and the sweep hides because a finished sweep has no meaningful end state. **No new keyframe and no new token** — US-006's four are reused and `app/app.css` still holds exactly four `@keyframes`. Announced politely via `role="status"`; the sweep and glyph are `aria-hidden`. **Next is US-032** — the graceful fallback panel, the catch for everything off-script
