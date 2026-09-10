# 📊 Project Dashboard

**Last Updated:** 2026-09-10
**Current Phase:** Phase 3b - Heroes *(1/6 stories)* · **Phases 1a + 1b + 2a + 2b + 3a all complete**

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 77% | 100% | 🟢 On Track |
| **Phase 1a / 1b / 2a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 2b** | 100% — Completed (11/11 · 29/29) | 100% | 🟢 Done |
| **Phase 3a** | 100% — Completed (6/6 · 17/17) | 100% | 🟢 Done |
| **Phase 3b** | 19% — In Progress (1/6 · 3/16) | 100% | 🟢 On Track |
| **Stories Completed** | 34/45 | 45 | 🟢 On Track |
| **Story Points Done** | 88/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% lines (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-10)

**Stories Completed Today:** 3 (US-033, US-034, US-035) · **34 total**
**Currently Working On:** US-036 — Hero 2 primary, ticket revenue year on year (3 pts)
**Story Points Completed Today:** 6 · **89 total**

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

- ✅ **US-017 — KPI tile & variance chip (2 pts)** — `DeltaChip` + `KpiSparkline`/`KpiFigure`/
  `KpiTile`, the shape the other nine follow. **Colour is never the sole signal:** on navy both
  directions share one white treatment (class strings asserted *identical*) while glyph, sign and an
  `sr-only` word differ; **direction is arithmetic, judgement is meaning**. 78 tests.

- ✅ **US-021 — Horizontal bar tile (3 pts)** — the most reused chart, built once in
  `app/components/charts/h-bars.tsx` for all five consumers. Both review decisions read back off the
  rendered element: 150px label column, truncation *rejected*, 96px `nowrap` value column via
  `getComputedStyle`. **The sign of the displayed figure** sets anchor, token and text sign. 55.

- ✅ **US-013 — Baseline dashboard, four pre-existing tiles (3 pts)** — **the canvas stops being
  empty.** `baseline-row.tsx` composes `KpiTile` ×2, `HBarTile` and `PartnersTile` as direct children
  of US-012's one grid. **No figure is re-typed** — figures come from the US-007 repository in the
  SSR loader, and a **source scan** fails on any literal figure, `CHF`/`%` string or `toFixed`.
  **Reset's baseline seam is closed** (US-015 ①). First real-Chrome pass for US-017/021/027. 103.

- ✅ **US-026 — Segmented period filter control (2 pts)** — one control in
  `app/components/controls/segmented.tsx` for all three consumers. **Controlled, with no opinion of
  its own** — a press the caller ignores changes nothing, which lets one control drive two tiles
  without them disagreeing. **11px, deliberately not a pill.** Radiogroup semantics: one tab stop,
  wrapping arrows plus Home/End, selection carried by shape, shadow, weight *and* `aria-checked`. 45.

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
  `app/components/charts/v-bars.tsx` (`vBarGeometry`/`VBars`/`VBarTile`), built for US-034's "Shirt
  sales by kit". **Bar persistence is the story, and the test is a re-rank:** columns keyed by
  category, so a filter press hands `Home` the *same* `<rect>` — an index key fails two tests.
  Nothing snaps to zero; reduced motion lands on final heights with **zero frames requested**.
  Gradient caps, gridlines behind, counting labels, hover highlight. 52 new tests.

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
  follow-ups, in `app/components/tiles/driver-tile.tsx`. **It draws no bars, and that is the point:**
  every row is US-021's `HBarRow` through `HBarTile`, and a source scan rejects bar geometry,
  count-up, gradients and local state. **It adds three things:** stable ranking (Luzern stays ahead
  of the tied Sion), a total **derived from the rows on screen** so the `-CHF 400k total` badge
  cannot disagree with the bars, and a muted note. Two seams widened, not forked. 43 tests, 1358.
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

- ✅ **US-030 — Intent normalisation, scoring & tie-breaking (5 pts)** — **the riskiest story: an
  off-script paraphrase, typed live.** A faithful port of the approved algorithm, pinned by an oracle
  over a 90-phrase corpus: normalise → **+2/+1** → threshold **2 hero / 3 follow-up** →
  **strictly-greater**. One input yields **one** match or `null`. No model, no dependency. 89, 1587.

- ✅ **US-031 — Thinking beat (2 pts)** — **the pause that makes the answer feel earned, and it is
  stagecraft: no request is made** (scanned). **Ordering asserted:** at `1150ms - 1` the panel is up
  with no section; at `1150ms` the section is there and the panel gone. Both paths pause via the
  `ChipActions` both already took, so **neither module changed**. **Still ONE timer**, closing
  US-015 ④. Reduced motion: 260ms, chips at final state. 91 tests, 1678.

- ✅ **US-032 — Graceful fallback panel (2 pts)** — **the catch for anything off-script.** Two panels,
  never conflated: the **fallback**, its copy asserted **byte-identical** (straight apostrophe,
  closing *hyphen*) against a literal *and* the backlog, re-surfacing the three prepared questions
  with **US-029's own chip components** (no `<button>` in the file); and the **empty state** — club
  red at **4.5% derived from `--color-red`**, matching hairline, bold navy heading, lighter subtext,
  red gradient badge. **Criterion ② asserted as an ABSENCE:** 18 blame/error words out of the copy,
  the panel *and* the source; no alert role, no red semantics, **the question never echoed** (no
  question prop exists). No beat precedes it, and `canvasPanelFor` returns ONE panel. 125, 1803.

- ✅ **US-033 — Follow-up context gating (3 pts)** — **Phase 3a closes.** One gate
  (`follow-up-gate.ts`, two pure functions) read by both the answer and the beat, so a cold typed
  follow-up renders the **PARENT** first and the follow-up chip is *then* offered to tap — never an
  error, never the fallback, never nothing. Gating and chip visibility are **two readings of one
  list** (`hasSection` pinned to two readers by scan), so Reset re-gates for free. Hero independence
  proved over all **27** sessions and on the real `App`. 46 tests, **1849**.

---

## 🏁 Phase 3b under way — The Three Hero Flows

**Phase 3a** closed at 100% on 2026-09-10 (6/6 · 17/17 pts), joining **1a, 1b, 2a and 2b**: a
question can now be typed or tapped, is matched, waits a beat, and either answers or lands softly —
and a follow-up can never dead-end. **Phase 3b** now builds the three answers themselves.

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-035: Hero 1 follow-up — which badge to push next | 📋 Next | Sharpens the section US-034 put on screen: the badge-selection trend and a recommendation panel |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
| US-034: Hero 1 primary — shirt sales, badges, printed names | 2026-09-10 | 3 |
| US-033: Follow-up context gating | 2026-09-10 | 3 |
| US-032: Graceful fallback panel | 2026-09-09 | 2 |
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
| US-003 / US-004: Design token set & self-hosted crest | 2026-09-09 | 4 |

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
| Test Coverage (`app/**`) | 99.84% stmts / 98.32% branches / 100% funcs / 100% lines | 80% | 🟢 Good |
| Passing Tests | 1949/1949 | TBD | 🟢 Good |
| TypeScript Errors (strict) | 0 | 0 | 🟢 Good |
| ESLint Problems | 0 errors, 0 warnings | 0 errors | 🟢 Good |
| Dependency Advisories | 0 | 0 high/critical | 🟢 Good |
| Open Bugs | 0 | < 5 | 🟢 Good |

> Coverage is measured over `app/**` only, and the suite is substantive rather than hollow: it pins
> every hex, the type scale and the colour discipline, fails the build if `app/app.css` and
> `app/lib/tokens.ts` disagree, and asserts that no reduced-motion path strands an element at zero.
> The data suites pin the Specification figures, prove every total is *derived* and sweep every number
> in all six narratives (US-011). The component suites test the same way: variance stays
> distinguishable with the colour *removed* (US-017), review decisions are read back off the rendered
> element (US-019/US-021), US-022's source cannot NAME a verdict, US-013 scans for a literal figure,
> and US-032 proves an ABSENCE — no blame word, no alert role, no echoed input. US-033 pins its
> one-source-of-truth claim by **source scan** (`hasSection` has exactly two readers) and guards the
> dead end by **mutation**. The gate is three-part: `tsc`, ESLint 9 and Prettier, via husky.

---

## 📊 Phase Breakdown

| Phase | Status | Stories | Points | Progress |
|-------|--------|---------|--------|----------|
| Phase 1a: Setup & Design System | ✅ Completed | 6/6 | 14/14 | 100% |
| Phase 1b: Seed Data | ✅ Completed | 5/5 | 10/10 | 100% |
| Phase 2a: Shell & Baseline | ✅ Completed | 5/5 | 16/16 | 100% |
| Phase 2b: Component Library | ✅ Completed | 11/11 | 29/29 | 100% |
| Phase 3a: Conversation | ✅ Completed | 6/6 | 17/17 | 100% |
| Phase 3b: Heroes | 🔄 Active | 1/6 | 3/16 | 19% |
| Phase 4: Hardening | ⏸️ Pending | 0/6 | 0/14 | 0% |

---

## 🔗 Quick Links
- **[Current Phase Plan](../phases/phase-3b.md)** - Phase 3b, Heroes (US-034 to US-039)
- **[Phase 3a Plan](../phases/phase-3a.md)** - Completed 2026-09-10 (6/6 · 17/17 pts)
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
**Last Auto-Update:** US-034 completed at 2026-09-10 — **PHASE 3b IS OPEN AND THE FIRST SCRIPTED ANSWER IS ON SCREEN (1/6 · 3/16 pts).** This is the phase the prototype exists for, and US-034 proved it is **composition, not invention**: not one chart was built. `VBarTile` (US-018) and `DonutTile` (US-020) reach a screen for the first time here, beside `HBarTile` (US-021), `Segmented` (US-026) and US-024's section head — `app/components/heroes/hero-1.tsx` contributes layout, copy and **one piece of state**, and a source scan proves it holds no `<svg>`, `<rect>` or `viewBox`. **THE SINGLE FILTER IS THE STORY (criterion ⑤):** ONE `Segmented` in the SECTION HEAD — not in a card's `action` slot, because a filter that drives three tiles cannot belong to one of them — over ONE `periodKey` held above all three, the shape US-016's band already uses. A **single click** is asserted to move the bars, the ring AND the names together, for **all four periods**, and again in real Chrome. **NOTHING SNAPS:** the section adds no key of its own, so bars, arcs and rows reconcile by CATEGORY and transition; mid-flight the labels read `16’975 / 7’855 / 4’387` — continuing from the figures on screen, never through zero — and the `<rect>` is asserted to be the SAME node across the press. **THE NARRATIVE IS BYTE-IDENTICAL (criterion ④):** UTF-8 hex against a retyped literal, exact length (**214**), an ASCII-range sweep of every character, and a match against the sentence **in the backlog itself**, so the two copies in this repository cannot drift together; it is rendered straight from the dataset, and the string exists nowhere in the component layer. **NOT ONE FIGURE RE-TYPED (criterion ③):** every displayed number ≥ 100 across all four periods — units, per-kit revenue, totals, badge totals, the four derived segments and the print counts — is asserted absent from five source files, in three spellings each. **Kit revenue is `units × CHF 99` and the Home share is `homeKitShare`**, and the fixture is proved to hold no `revenue`, `total` or `share` key to read instead. **BADGE SEGMENTS SUM EXACTLY** to the centre figure in **all four** periods, read off the rendered legend (3’080 = 1’355+739+616+370; 1’136 = 500+273+227+136) — the rounding correction stays in `derive.ts`, which `hero-1.tsx` never calls. **HOVER READS THREE THINGS (criterion ⑥):** `Home · 22’400 shirts · 58% of shirt sales · CHF 2’217’600`, the share from one new `kitUnitsShare` that `homeKitShare` now delegates to — one division, not two. **Data reaches the sections through a ROOT loader** (`app/lib/dashboard/heroes.ts`, mirroring `baseline.ts`), because `root.tsx` is what inserts them; repositories stay server-only and Chrome records **0 requests** after the first paint. **Chrome pass on the built SSR bundle (1440×950):** three tiles in order with the pinned figures, no horizontal overflow, no truncated name label, re-ask → **one section, three cards**, zero console errors. **Security triage — no security-relevant changes detected:** no endpoint, dependency, env var, storage, `innerHTML`, user-supplied URL, request or logging; the new loader takes no input, and the data it serialises is aggregate merchandising with no PII and **no named-individual performance figure** (asserted absent). 57 new tests, **1906 green**. Heroes 2 and 3 keep the clearly-marked placeholder body. **Next is US-035** — Hero 1's follow-up, sharpening the section already on screen.

*Previously (US-033, 2026-09-10):* Phase 3a closed by making **follow-up gating a single rule in a single place**. `app/lib/dashboard/follow-up-gate.ts` holds two pure functions read by BOTH halves of the behaviour — `use-dashboard.ts` for the answer, `use-thinking.ts` for the beat — so the panel and the canvas can never disagree. **Stated plainly and verified: the behaviour was already correct at HEAD**; reverting the wiring fails only the 2 source-scan tests, so the story is the rule made explicit and exhaustively proved, with the dead end guarded by **mutation** (an ungated `withFollowUpShown` fails 10 tests). **The two-step runs on the real `App` for all three heroes:** a cold typed follow-up renders the **PARENT** at `primary`, the follow-up chip is *then* offered, and tapping it flips that same section — one section, never two; never an error, never the fallback, never the empty state. **Criterion ④ as an absence of parallel state:** a source scan pins `hasSection` and `INTENT_REQUIRES_PARENT` to exactly two readers each, so gating and chip visibility are two readings of ONE list and Reset re-gates for free. **Criterion ⑤ twice** — as a property over all 27 sessions and on the real `App`. 46 tests, 1849 green.
