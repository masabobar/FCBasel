# 📊 Project Dashboard

**Last Updated:** 2026-09-10
**Current Phase:** Phase 4 - Hardening *(5/6 stories)* · **Phases 1a + 1b + 2a + 2b + 3a + 3b all complete**

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 95% | 100% | 🟢 On Track |
| **Phase 1a / 1b / 2a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 2b** | 100% — Completed (11/11 · 29/29) | 100% | 🟢 Done |
| **Phase 3a** | 100% — Completed (6/6 · 17/17) | 100% | 🟢 Done |
| **Phase 3b** | 100% — Completed (6/6 · 16/16) | 100% | 🟢 Done |
| **Phase 4** | 86% — Active (5/6 · 12/14) | 100% | 🟢 On Track |
| **Stories Completed** | 44/45 | 45 | 🟢 On Track |
| **Story Points Done** | 114/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% lines (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-10)

**Stories Completed Today:** 12 (US-033 to US-039, US-040 to US-044) · **44 total**
**Currently Working On:** US-045 — Chrome demo run-through & stability (2 pts)
**Story Points Completed Today:** 31 · **114 total**

- ✅ **Phase 1a — Setup & Design System (6 stories, 14 pts)** — RR7 SSR scaffold (Railway deploy is a
  human step) · ESLint 9 + Prettier + husky · one token set as Tailwind v4 `@theme static` *and* a
  typed TS object kept in lockstep by a parity test · crest self-hosted (194 KB → 17.9 KB) · one
  `Card` shell · four keyframes, reduced motion *collapsing* to a final frame.
- ✅ **Phase 1b — Seed data & formatters (5 stories, 10 pts)** — **US-007** set the E3 pattern (enums
  + types + repository interface, fixtures in `app/lib/mock/`, server-only selection, every total
  *derived*) · **US-008/009/010** the three hero datasets, including the departmental table where the
  **Revenue / Cost tag is load-bearing** (a naive "variance > 0 is good" rule misreads exactly one
  row) · **US-011** one pure display layer, Swiss U+2019 pinned ICU-independently, plus a
  reconciliation sweep of every number in all six narratives. **No drift found.**
- ✅ **US-012 / US-014 / US-015 — shell, insertion, reset (8 pts)** — navy sidebar + app bar + one
  12-column canvas, the persona a *role*; the dashboard **grows, it never clears** (memory-only state
  in `root.tsx`, sections reusing the canvas tracks so there is still ONE grid); Reset a fourth
  transition restoring `BASELINE_SECTIONS`, cancelling the pending beat *first*.
- ✅ **US-027 — Motion & animation hooks (3 pts)** — the four hooks the other ten E6 components are
  built on. **Count-up tracks the figure on screen in a ref**, so a filter changed mid-animation
  carries on from the old number rather than snapping to zero (US-043 proved this on the page).
  **Reduced motion means final state in the same render.** 42 tests.
- ✅ **US-017 — KPI tile & variance chip (2 pts)** — `DeltaChip` + `KpiSparkline`/`KpiFigure`/
  `KpiTile`, the shape the other nine follow. **Colour is never the sole signal:** on navy both
  directions share one white treatment while glyph, sign and an `sr-only` word differ. 78 tests.
- ✅ **US-021 — Horizontal bar tile (3 pts)** — the most reused chart, built once in
  `app/components/charts/h-bars.tsx` for all five consumers. Both review decisions read back off the
  rendered element: 150px label column, truncation *rejected*, 96px `nowrap` value column. 55.
- ✅ **US-013 — Baseline dashboard, four pre-existing tiles (3 pts)** — **the canvas stops being
  empty.** `baseline-row.tsx` composes `KpiTile` ×2, `HBarTile` and `PartnersTile` as direct children
  of US-012's one grid. **No figure is re-typed** — they come from the US-007 repository in the SSR
  loader, and a **source scan** fails on any literal figure, `CHF`/`%` string or `toFixed`. 103.
- ✅ **US-026 — Segmented period filter control (2 pts)** — one control in
  `app/components/controls/segmented.tsx` for all three consumers. **Controlled, with no opinion of
  its own** — a press the caller ignores changes nothing, which lets one control drive two tiles
  without them disagreeing. **11px, deliberately not a pill.** Radiogroup semantics: one tab stop,
  wrapping arrows plus Home/End, selection carried four ways. 45.
- ✅ **US-025 — Line chart component (3 pts)** — one chart in
  `app/components/charts/line-chart.tsx` for both consumers: the navy hero band and Hero 2's
  twelve-month comparison. Series count is a prop, `area` / `dash` per series, colour a token
  **name**, so no hex can enter. **The stroke draw survives reduced motion:** `pathLength="1"` plus
  an offset transitioning 1 → 0, read back as `stroke-dashoffset="0"` with **zero frames requested**.
  Hover lists **every** series at the nearest index, keyboard included. 73 new tests.
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
  never conflated: the **fallback**, its copy asserted **byte-identical** against a literal *and* the
  backlog, re-surfacing the three prepared questions with **US-029's own chip components**; and the
  **empty state** (club red at 4.5% derived from `--color-red`). **Criterion ② asserted as an
  ABSENCE:** 18 blame/error words out of the copy, the panel *and* the source; no alert role, no red
  semantics, **the question never echoed** (no question prop exists). 125, 1803.
- ✅ **US-033 — Follow-up context gating (3 pts)** — **Phase 3a closes.** One gate
  (`follow-up-gate.ts`, two pure functions) read by both the answer and the beat, so a cold typed
  follow-up renders the **PARENT** first and the follow-up chip is *then* offered — never an error,
  never the fallback, never nothing. Gating and chip visibility are **two readings of one list**, so
  Reset re-gates for free. Hero independence proved over all **27** sessions. 46, **1849**.
- ✅ **US-040 — Presentation sizing & responsiveness (2 pts)** — **Phase 4 opens, and the story is a
  measurement.** Real Chrome against the **built SSR bundle** with the **full run-of-show loaded
  before any reading**: clean at **eleven viewports** — no page or in-card horizontal scroll, no
  clipped tile, axis label or legend, no SVG text outside its plot — and a mid-session 1920 → 1024
  → 1920 resize clean **both ways**. **One real defect fixed** (Top Products' filter clipped 25.7px
  at 1152 → `WIDE_SPAN` at `xl:col-span-6`) and **the favicon 404 closed**. Two limitations
  recorded. 11, **2221**.
- ✅ **US-041 — Offline resilience verification (2 pts)** — **the disconnect found what no grep
  could, twice.** `setOffline(true)` + an abort route over `**` against the built bundle, running
  the whole script asserted at every beat (incl. reset mid-beat), and again under reduced motion.
  **Finding 1:** lazy route discovery fetched `/__manifest` on hydration → `routeDiscovery:
  "initial"`. **Finding 2, a demo-killer:** the sidebar's `<Link to="/">` revalidated `/_root.data`,
  which offline replaced **the whole dashboard with an error boundary from one click** →
  `shouldRevalidate: () => false` on both routes. **10 requests, all local, 0 after first paint.**
- ✅ **US-042 — Dead-end path sweep (3 pts)** — **every path proven to lead somewhere, and the sweep
  is wider than the conversation.** 16 Chrome cases ending at one `expectAlive` helper: three heroes,
  three follow-ups, **23 paraphrases** each landing its own hero, **16 hostile strings** (XSS,
  `javascript:`, SQL, RTL, 50k chars) all on the fallback and never echoed, 6 no-op inputs, 8
  two-subject questions asked twice, 3 cold follow-ups, **141 canvas slots**, **both tab rings with
  Enter and Space**, keyboard-only demo, Reset spammed mid-beat, reload/back/forward. **No dead end
  — mutation-tested.** KL-3 recorded, not fixed. **2225** + 16 cases.
- ✅ **US-044 — Brand fidelity & legibility QA (2 pts)** — **every colour PAINTED on the served page
  measured, not reviewed.** 13 Chrome cases at four moments: **19 distinct colours over 886 painted
  elements, every one a token** (opacity modifiers converted back from oklab, classified against
  `app/lib/tokens.ts` itself), the only non-palette hexes two partner brand colours from the dataset
  · **41 gold paints inside a closed `data-slot` allowlist**, **no gold on any tile surface** ·
  **23 variance chips** each with sign, arrow, spoken word and the pos/neg token · 31 uppercase
  headers · every figure tabular · 19 tab stops ringed · **0 non-hyphen dashes**. **One real defect:
  Hero 3's `CHF 410k` badge had no sign** — US-022's trap exactly; fixed via a `totalFormat` prop to
  **`+CHF 410k`**, rows still unsigned. Borders (1.10-1.24:1) → KL-4. **2228**.
- ✅ **US-043 — Transition & timing polish (3 pts)** — **every frame of the reveal sampled, and it
  found TWO defects a review had not.** 15 Chrome cases + a per-frame `rAF` sampler and a separate
  frame clock; **each fix re-verified by reverting it and watching its test fail.** **The empty state
  flashed back between the beat and its answer** — `startViewTransition` updates asynchronously, so
  `setBeat(null)` painted alone for one frame, then ghosted across the 400ms reflow; the panel now
  comes down in the render the answer lands in, **seam 0 frames**. **The beat's source chips sat
  14.2px under the prompt bar** once the chip row wrapped (bar 117.1 → 159.3px vs a 128px reserve) →
  reserve 176px, clearance **+33.3 to +76.0px**. Both scrolls now wait out the reflow tween, which
  the reveal's used to start 384ms inside. **Layout jump 0.00px over 198 frames**; longest frame
  **33.3ms at 1x, 116.7ms at 6x**, p95 16.8ms, **M1, not the demo machine**. **KL-3 CLOSED.** No
  duration token changed. **2242** + 15 cases.

## 🔄 Phase 4 IN PROGRESS — Hardening a feature-complete prototype

**Phases 1a to 3b are all closed** (39 stories · 102 pts): every client question answers end to end
and each one sharpens, *what* → *so-what*, with **not one placeholder left in the product**.
**Phase 4 is now at 5/6 · 12/14, and every P0 in it is closed.** Nothing new is built from here —
**US-040 measured the finished screen at eleven viewports**, **US-041 severed the network** and cost
two real runtime fetches their lives, **US-042 swept the whole interactive surface** with no dead
end, **US-044 read every painted colour off the served page** and found the one unsigned variance
chip, and **US-043 sampled every frame of the reveal** and found two more — the empty state flashing
back between the beat and its answer, and the beat's own source chips under the pinned prompt bar.

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-045: Chrome demo run-through & stability | 📋 Next | Full run-of-show rehearsed in Chrome with no console errors; Reset spammed and mid-flow; rapid submits debounced; the deployed URL cold-started |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
| US-043: Transition & timing polish *(every frame of the reveal sampled)* | 2026-09-10 | 3 |
| US-044: Brand fidelity & legibility QA *(every painted colour measured)* | 2026-09-10 | 2 |
| US-042: Dead-end path sweep *(the whole surface, in Chrome)* | 2026-09-10 | 3 |
| US-041: Offline resilience verification *(verified by disconnecting)* | 2026-09-10 | 2 |
| US-040: Presentation sizing & responsiveness *(measured in Chrome)* | 2026-09-10 | 2 |
| US-039: Hero 3 follow-up — why Marketing is off plan *(the causal peak)* | 2026-09-10 | 3 |
| US-038: Hero 3 primary — department budget vs actual vs target | 2026-09-10 | 3 |
| US-037: Hero 2 follow-up — which fixtures are driving the drop | 2026-09-10 | 2 |
| US-036: Hero 2 primary — ticket revenue year on year | 2026-09-10 | 3 |
| US-035: Hero 1 follow-up — which badge to push next | 2026-09-10 | 2 |
| US-034: Hero 1 primary — shirt sales, badges, printed names | 2026-09-10 | 3 |
| US-033: Follow-up context gating | 2026-09-10 | 3 |
| US-032: Graceful fallback panel | 2026-09-09 | 2 |
| US-031: Thinking beat | 2026-09-09 | 2 |
| US-030: Intent normalisation, scoring & tie-breaking | 2026-09-09 | 5 |
| US-029: Suggestion chips & chip lifecycle | 2026-09-09 | 3 |
| US-028: Persistent prompt bar | 2026-09-09 | 2 |
| US-020: Donut / ring tile | 2026-09-09 | 3 |
| US-019: Grouped bar chart tile | 2026-09-09 | 3 |
| US-018: Vertical bar chart tile | 2026-09-09 | 3 |
| US-016: Hero band — webshop trend & attendance ring | 2026-09-09 | 5 |

## ⚠️ Active Blockers

✅ No active blockers. **Open human step (not a blocker):** the Railway deploy for US-001 — run
`railway login && railway init && railway up`, then record the shareable URL.

## 📈 Velocity & Timeline

**Projected Completion:** 2026-09-15 (8h/day) · 2026-09-11 (24/7) · **Timeline:** 🟢 On Track
**Target Completion:** end of this week — sponsor showing follows

> ⚠️ At **8h/day weekdays only**, AI-realistic lands 2026-09-20, past the deadline. The lever is hours per day, not scope — the only P1 left (US-045) is worth 2 points.

## 🧪 Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage (`app/**`) | 99.71% stmts / 97.87% branches / 100% funcs / 100% lines | 80% | 🟢 Good |
| Passing Tests | 2242/2242 unit (55 files) + 60/60 Chrome | TBD | 🟢 Good |
| TypeScript Errors (strict) | 0 | 0 | 🟢 Good |
| ESLint Problems | 0 errors, 0 warnings | 0 errors | 🟢 Good |
| Dependency Advisories | 0 | 0 high/critical | 🟢 Good |
| Open Bugs | 0 | < 5 | 🟢 Good |

> Coverage is measured over `app/**` only, and the suite is substantive rather than hollow: it pins
> every hex, the type scale and the colour discipline, fails the build if `app/app.css` and
> `app/lib/tokens.ts` disagree, asserts that no reduced-motion path strands an element at zero, pins
> the Specification figures, proves every total is *derived* and sweeps every number in all six
> narratives (US-011). Variance stays distinguishable with the colour *removed* (US-017), US-022's
> source cannot NAME a verdict, and US-032 proves an ABSENCE — no blame word, no alert role.
> **Phase 4 added five browser suites on top, all against the built SSR bundle** (`pnpm test:e2e`,
> minutes rather than seconds, no dependency added): **US-040** measures what jsdom answers with
> zeros — horizontal scroll, clipping, SVG label boxes, prompt-bar clearance — at eleven viewports;
> **US-041** logs every request then severs the network, so a lazy chunk, a webfont or a revalidation
> cannot return unnoticed; **US-042** presses the whole interactive surface (23 paraphrases, 16
> hostile strings, 141 canvas slots) into one mutation-tested `expectAlive` helper; **US-044**
> resolves every painted colour to sRGB and classifies it against `app/lib/tokens.ts` itself;
> **US-043** samples the reveal frame by frame — panel, per-card opacity, figure strings, chart
> geometry, scroll and the view transition's own `currentTime` — plus a frame clock at 1x, 4x, 6x.

---

## 📊 Phase Breakdown

| Phase | Status | Stories | Points | Progress |
|-------|--------|---------|--------|----------|
| Phase 1a: Setup & Design System | ✅ Completed | 6/6 | 14/14 | 100% |
| Phase 1b: Seed Data | ✅ Completed | 5/5 | 10/10 | 100% |
| Phase 2a: Shell & Baseline | ✅ Completed | 5/5 | 16/16 | 100% |
| Phase 2b: Component Library | ✅ Completed | 11/11 | 29/29 | 100% |
| Phase 3a: Conversation | ✅ Completed | 6/6 | 17/17 | 100% |
| Phase 3b: Heroes | ✅ Completed | 6/6 | 16/16 | 100% |
| Phase 4: Hardening | 🔄 Active | 5/6 | 12/14 | 86% |

---

## 🔗 Quick Links
- **[Current Phase Plan](../phases/phase-4.md)** - Phase 4, Hardening (5/6) + **Known limitations**
- **[Phase 3b Plan](../phases/phase-3b.md)** (6/6 · 16/16) · **[Phase 3a](../phases/phase-3a.md)** (6/6 · 17/17) - Completed 2026-09-10
- **[Phase 2b Plan](../phases/phase-2b.md)** (11/11 · 29/29) · **[Phase 2a](../phases/phase-2a.md)** (5/5 · 16/16) - Completed 2026-09-09
- **[Phase 1b](../phases/phase-1b.md)** · **[Phase 1a](../phases/phase-1a.md)** - Completed 2026-09-09
- **[Backlog](../../input/backlog/)** - All project backlogs
- **[Detailed Status](current-status.md)** · **[Completed Work](completed.md)** · **[Blockers](blockers.md)**
- **[Effort Estimate](../reports/ai-hours-estimate-2026-09-09.md)** - AI-hours projection

---

**💡 Tip:** This file updates automatically during `/execute-work`.
**Last Auto-Update:** US-043 completed at 2026-09-10 — **THE REVEAL WAS SAMPLED FRAME BY FRAME, AND SAMPLING IT FOUND TWO REAL DEFECTS PLUS THE FIX FOR KL-3.** New `tests/e2e/transition-timing.spec.ts` (**15 Chrome cases**) + `tests/e2e/support/timing.ts`: a `requestAnimationFrame` loop INSIDE the page recording the thinking panel, the section count, per-card opacity, every counted figure string, every painted bar and arc extent, `scrollY` and the view transition's own `currentTime`, plus a separate timestamps-only frame clock so the frame budget reported is the product's and not the instrument's. **Every fix below was re-verified by MUTATION — reverted one at a time, and the standing test named here failed each time.** ⚠️ **HARDWARE, STATED HONESTLY: an Apple M1 MacBook Pro (MacBookPro17,1, 8 cores, 16GB, macOS 15.6.1) — this is NOT the demo machine and no claim is made about it.** Longest frame **16.8-33.3ms at 1x**, **33.4-49.9ms at 4x** and **33.3-116.7ms at 6x** CDP CPU throttling (DevTools' own mechanism, the honest approximation of a slower laptop) — that 116.7ms is ONE frame of the hero reveal, the follow-up's worst at 6x being 33.3ms; p95 **16.7-16.8ms** at all three rates, 198-209 frames per reveal. **DEFECT 1 — THE EMPTY STATE FLASHED BACK MID-REVEAL.** `document.startViewTransition` calls its update callback ASYNCHRONOUSLY, after the browser has captured the outgoing frame, so the beat's `setBeat(null)` was flushed on its own a frame BEFORE the answer; `useCanvasPanel` rightly read that gap as "nothing has been asked yet" and painted **"Your dashboard is ready"** back into the spot the panel had just left — which then got baked into the transition's outgoing snapshot and **ghosted across the whole 400ms reflow**. Reverting the fix reproduces it exactly: **one seam frame at 1219.7ms with neither panel nor answer** (~17ms on this machine, longer on a slower one). Fixed in `use-thinking.ts`: the panel now comes down in the render where `focus.tick` shows the answer HAS landed, so both changes are ONE commit — **seam now 0 frames**, asserted. **DEFECT 2 — THE BEAT HIDDEN BEHIND THE PROMPT BAR.** US-029's chip row grows as follow-ups are offered and wraps past four chips, taking the `fixed` bar from **117.1px to 159.3px** against `PROMPT_BAR_CLEARANCE_CLASS`'s **128px** reserve — so from the third question on, the panel's data-source chips (information, not decoration) sat **14.2px UNDER the bar**, reproduced to the decimal by reverting to `pb-32`. Reserve raised to **176px**: source-chip clearance **+33.3 to +76.0px** at every one of the six beats. **ONE TIMING CHANGE, MEASURED: the two scrolls now wait out the reflow tween** (`afterReflow`, the transition's own `finished` promise — never a timer, so the beat's stays the only one in the application). Reverting it puts the reveal's smooth scroll at **1267ms, 384ms INSIDE the 400ms tween**, sliding the live page out from under a snapshot pinned to the viewport. Waiting also puts the reveal in the order criterion 3 states, with the auto-scroll LAST — **tween ends 1646ms, scroll starts 1680ms**. **NO DURATION TOKEN CHANGED:** beat **1118ms** measured (band 600-1200ms), insertion 400ms, reduced beat 218ms. **THE SEQUENCE, ASSERTED IN ORDER:** panel 78→1196ms → section 1230ms → stagger **0/90/180ms** → **446 distinct figure strings** and **488 distinct geometry values** → scroll settled with the new section at **0.3px**. **NO LAYOUT JUMP:** an appended answer moves Hero 1 by **0.00px over 198 frames — ONE distinct document position**; the follow-up that DOES move tiles pushes Hero 3 **+306.4px** through **4 `::view-transition-group` tweens, all 400ms**, sampled at 26 distinct `currentTime` readings to a max of 400ms, so the tween is measured rather than inferred. **FILTER FROM CURRENT:** the first frame after "Current month" still reads the OLD figures (`22’400 | 10’300 | 5’800 | 3’180`) and settles on `2’400 | 1’150 | 620 | 290` over **430 distinct strings, zero zeros anywhere**. **REDUCED MOTION:** beat 218ms, 35 figures and 56 geometry readings at final state, **zero zeros**, no card below opacity 1, **0 animations still running**. **KL-3 IS CLOSED** — `<ScrollRestoration />` removed AND `history.scrollRestoration = "manual"`, because the component's `pagehide` handler put the mode back to `auto` and neither half worked alone: 1920×1080 scrolled to 3927 and 1440×900 to 3709 now both reload at **`scrollY 0`** with the crest at `top: 0`, and **`sessionStorage` holds zero keys**. **Security triage — no trigger fired.** Unit **2242** (55 files), e2e **60 cases**, coverage 99.71% stmts / 100% lines, lockfile untouched. **Next: US-045, Chrome demo run-through & stability.**

*Previously (US-044, 2026-09-10):* brand fidelity became a measurement rather than a review, and measuring it found a defect — 13 Chrome cases at four moments read **19 distinct colours over 886 painted elements, every one a token** (Tailwind's `/opacity` composites converted back from oklab and classified against `app/lib/tokens.ts` itself), the only non-palette hexes two partner brand colours from the dataset; **41 gold paints inside a closed `data-slot` allowlist** with no gold on any tile surface; **23 variance chips** each carrying sign, arrow, spoken word and the pos/neg token; **0 non-hyphen dashes** over every text node and attribute. **Hero 3's `CHF 410k total` badge had no sign** — the only variance chip without one, US-022's trap exactly — fixed with a `totalFormat` prop to **`+CHF 410k total`**. Contrast recorded as KL-4.
