# 📊 Project Dashboard

**Last Updated:** 2026-09-11
**Current Phase:** none — **THE 45-STORY PLAN IS COMPLETE (116/116 points), plus 1 post-plan story.**
**Post-plan:** [Phase 5](../phases/phase-5.md) holds requests that arrived after the plan closed —
US-046 cosmetic sign-in gate (2 pts, ✅). Totals below cover the original plan; Phase 5 is counted
separately on purpose, so "45/45" keeps meaning the plan that was estimated and committed to.

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | **100%** | 100% | 🟢 **Complete** |
| **Phase 1a / 1b / 2a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 2b** | 100% — Completed (11/11 · 29/29) | 100% | 🟢 Done |
| **Phase 3a** | 100% — Completed (6/6 · 17/17) | 100% | 🟢 Done |
| **Phase 3b** | 100% — Completed (6/6 · 16/16) | 100% | 🟢 Done |
| **Phase 4** | 100% — Completed (6/6 · 14/14) | 100% | 🟢 Done |
| **Phase 5** *(post-plan)* | 100% — Completed (1/1 · 2/2) | 100% | 🟢 Done |
| **Stories Completed** | **45/45** | 45 | 🟢 Done |
| **Story Points Done** | **116/116** | 116 | 🟢 Done |
| **Test Coverage** | 100% lines (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-10)

**Stories Completed Today:** 13 (US-033 to US-039, US-040 to US-045) · **45 total — the plan is done**
**Currently Working On:** None — all phases complete.
**Story Points Completed Today:** 33 · **116 total**

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
- ✅ **US-021 — Horizontal bar tile (3 pts)** — the most reused chart, built once for all five
  consumers; both review decisions read back off the rendered element: 150px label column,
  truncation *rejected*, 96px `nowrap` value column. 55.
- ✅ **US-013 — Baseline dashboard, four pre-existing tiles (3 pts)** — **the canvas stops being
  empty.** `KpiTile` ×2, `HBarTile` and `PartnersTile` as direct children of US-012's one grid. **No
  figure is re-typed** — they come from the US-007 repository in the SSR loader, and a **source
  scan** fails on any literal figure, `CHF`/`%` string or `toFixed`. 103.
- ✅ **US-026 — Segmented period filter control (2 pts)** — one control for all three consumers.
  **Controlled, with no opinion of its own** — a press the caller ignores changes nothing, which lets
  one control drive two tiles without them disagreeing. **11px, deliberately not a pill.** Radiogroup
  semantics: one tab stop, wrapping arrows plus Home/End, selection carried four ways. 45.
- ✅ **US-025 — Line chart component (3 pts)** — one chart for both consumers: the navy hero band
  and Hero 2's twelve-month comparison. Series count is a prop, `area`/`dash` per series, colour a
  token **name** so no hex can enter. **The stroke draw survives reduced motion:** `pathLength="1"`
  plus an offset transitioning 1 → 0, read back as `stroke-dashoffset="0"` with **zero frames
  requested**. Hover lists **every** series at the nearest index, keyboard included. 73 tests.
- ✅ **US-016 — Hero band: webshop trend & attendance ring (5 pts)** — **Phase 2a closes at 5/5 ·
  16/16 pts.** The navy greeting band, where **ONE `Segmented` drives both halves** from one
  `BaselinePeriod` entry: the webshop `LineChart` and the **one genuinely new visual** — a
  hand-built `AttendanceRing` sweeping on `stroke-dasharray`, its centre swapping to "% of capacity"
  on hover *or focus*. Total and delta are computed from the plotted series. **Chrome at 1920×1080:**
  no scroll, 54 distinct KPI strings, 43 distinct dash pairs, one value each under reduced motion.
  One real defect found and fixed in `LineChart`: clipped end axis labels anchor inwards. 92 tests.
- ✅ **US-018 — Vertical bar chart tile (3 pts)** — the kit-split chart, built for US-034's "Shirt
  sales by kit". **Bar persistence is the story, and the test is a re-rank:** columns keyed by
  category, so a filter press hands `Home` the *same* `<rect>` — an index key fails two tests.
  Nothing snaps to zero; reduced motion lands on final heights with **zero frames requested**. 52.
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
  follow-ups. **It draws no bars, and that is the point:** every row is US-021's `HBarRow`, and a
  source scan rejects bar geometry, count-up, gradients and local state. **It adds three things:**
  stable ranking (Luzern stays ahead of the tied Sion), a total **derived from the rows on screen**,
  and a muted note. Two seams widened, not forked. 43 tests, 1358.
- ✅ **US-024 — Recommendation panel & narrative caption strip (2 pts)** — **Phase 2b closes at
  11/11 · 29/29 pts.** **The caption strip was reused, not rebuilt:** one implementation in
  `card.tsx`, two placements (a tile's truncated foot line, the section narrative that wraps and is
  never truncated). **The recommendation panel is structurally not a tile** — `aside` region, gold
  bar down the SIDE, tinted surface, none of the card's metric chrome — because advice must never
  read as one more metric. Verbatim tested byte for byte; criterion 3 is ORDER, so the narrative is
  asserted to precede every chart. 35 tests, 1393.
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
  `javascript:`, SQL, RTL, 50k chars) all on the fallback and never echoed, 6 no-ops, 8 two-subject
  questions twice, 3 cold follow-ups, **141 canvas slots**, **both tab rings with Enter and Space**,
  keyboard-only demo, Reset spammed mid-beat, reload/back/forward. **No dead end — mutation-tested.**
  KL-3 recorded, not fixed. **2225** + 16 cases.
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
  reserve 176px. Both scrolls now wait out the reflow tween, which the reveal's used to start 384ms
  inside. **Layout jump 0.00px over 198 frames**; longest frame **33.3ms at 1x, 116.7ms at 6x**, p95
  16.8ms, **M1, not the demo machine**. **KL-3 CLOSED.** **2242** + 15 cases.
- ✅ **US-045 — Chrome demo run-through & stability (2 pts)** — **THE PLAN CLOSES, and the dress
  rehearsal found one last real defect.** 4 cases in **REAL Chrome 152** (`channel: "chrome"` — the
  other five suites ran on bundled Chromium), headed, 1920×1080. The whole show as ONE session:
  **panel 10-35ms, answer 1179-1198ms, 11.9s end to end, zero console errors**. **Reset was fighting
  the reveal's own scroll** — pressed mid-scroll it sent the CLEARED baseline to its own foot
  (scrollY 0 → 233) for ~700ms; fixed in two mutation-verified halves in `motion.ts`. Reset abused 20
  ways over 2,012 frames: **0 duplicates, 0 double tweens, 0 orphaned animations**. **31 submits →
  exactly 4 beats.** Cold start **FCP 120-140ms, interactive 178-385ms**. ⏸️ Criterion 5 deferred —
  there is no deployed URL. **2244** + 4 cases.

## ✅ Phase 4 COMPLETE — and with it the whole build

**All 45 stories are closed** (116 pts): every client question answers end to end and each one
sharpens, *what* → *so-what*, with **not one placeholder left in the product**. Phase 4 built nothing
— it measured, six times over, and **every one of the six found something forty stories of code
review had not**: US-040 a clipped filter and a favicon 404 at eleven viewports · US-041 **two real
runtime fetches**, one of which replaced the whole dashboard with an error boundary from one click ·
US-042 no dead end anywhere, mutation-tested · US-044 the one unsigned variance chip · US-043 the
empty state flashing back mid-reveal and the beat hidden behind the prompt bar · and **US-045, the
dress rehearsal, Reset fighting the reveal's own scroll.**

### Active Stories

None — the plan is complete. **One human step remains and it is not code:** the Railway deploy.

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
| US-045: Chrome demo run-through & stability *(the dress rehearsal, in real Chrome)* | 2026-09-10 | 2 |
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

✅ No active blockers. **ONE OPEN ITEM, counted twice, and it is a human step rather than code:**
the Railway deploy. **US-001's deploy criterion** and **US-045's criterion 5** ("the deployed
shareable URL loads cleanly from a cold start") are the same gap. Run
`railway login && railway init && railway up`, then `railway domain`, open the URL it prints in
Chrome and record it. `fcbasel.railway.internal` is NOT it — that is Railway's private network and
returns NXDOMAIN. The repo is deploy-ready: `railway.json`, zero env vars, no database.

## 📈 Velocity & Timeline

**Actual Completion:** 2026-09-10 — **five days ahead of the 2026-09-15 target.** Nothing was cut:
all 45 stories, all 116 points. **Timeline:** 🟢 Complete. Next is the sponsor showing.

## 🧪 Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage (`app/**`) | 99.71% stmts / 97.87% branches / 100% funcs / 100% lines | 80% | 🟢 Good |
| Passing Tests | 2244/2244 unit (55 files) + 64/64 Chrome | TBD | 🟢 Good |
| TypeScript Errors (strict) | 0 | 0 | 🟢 Good |
| ESLint Problems | 0 errors, 0 warnings | 0 errors | 🟢 Good |
| Dependency Advisories | 0 | 0 high/critical | 🟢 Good |
| Open Bugs | 0 | < 5 | 🟢 Good |

> Coverage is over `app/**` only, and the suite is substantive rather than hollow: it pins every hex
> and the type scale, fails the build if `app/app.css` and `app/lib/tokens.ts` disagree, asserts no
> reduced-motion path strands an element at zero, proves every total is *derived* and sweeps every
> number in all six narratives (US-011); variance survives the colour being *removed* (US-017),
> US-022's source cannot NAME a verdict, and US-032 proves an ABSENCE. **Phase 4 added SIX browser
> suites on top, all against the built SSR bundle** (`pnpm test:e2e`, minutes not seconds, no
> dependency added): **US-040** measures what jsdom answers with zeros at eleven viewports;
> **US-041** logs every request then severs the network; **US-042** presses the whole interactive
> surface into one mutation-tested `expectAlive` helper; **US-044** resolves every painted colour to
> sRGB against `app/lib/tokens.ts` itself; **US-043** samples the reveal frame by frame plus a frame
> clock at 1x/4x/6x; and **US-045 performs the whole run of show as ONE session in REAL Chrome**
> (`channel: "chrome"` — the other five use bundled Chromium), timing every beat from inside the
> page and abusing Reset twenty ways while sampling every frame.

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
| Phase 4: Hardening | ✅ Completed | 6/6 | 14/14 | 100% |

---

## 🔗 Quick Links
- **[Phase 4 Plan](../phases/phase-4.md)** (6/6 · 14/14) + **Known limitations**, **Open at plan close** and **the presenter's run of show**
- **[Phase 3b Plan](../phases/phase-3b.md)** (6/6 · 16/16) · **[Phase 3a](../phases/phase-3a.md)** (6/6 · 17/17) - Completed 2026-09-10
- **[Phase 2b Plan](../phases/phase-2b.md)** (11/11 · 29/29) · **[Phase 2a](../phases/phase-2a.md)** (5/5 · 16/16) - Completed 2026-09-09
- **[Phase 1b](../phases/phase-1b.md)** · **[Phase 1a](../phases/phase-1a.md)** - Completed 2026-09-09
- **[Backlog](../../input/backlog/)** - All project backlogs
- **[Detailed Status](current-status.md)** · **[Completed Work](completed.md)** · **[Blockers](blockers.md)**
- **[Effort Estimate](../reports/ai-hours-estimate-2026-09-09.md)** - AI-hours projection

---

**💡 Tip:** This file updates automatically during `/execute-work`.
**Last Auto-Update:** US-045 completed at 2026-09-10 — **THE PLAN IS DONE: 45/45 STORIES, 116/116 POINTS, AND THE DRESS REHEARSAL FOUND ONE LAST REAL DEFECT.** New `tests/e2e/demo-run-through.spec.ts` (**4 Chrome cases**) + `tests/e2e/support/run-of-show.ts`. **REAL CHROME, NOT CHROMIUM, AND THAT IS NEW:** `playwright.config.ts` uses `devices["Desktop Chrome"]`, which is a device DESCRIPTOR — a viewport and a user-agent — and selects no browser channel, so US-040 to US-044 all ran on Playwright's BUNDLED Chromium. That was the right instrument for geometry and colour and the wrong one for "runs cleanly in **Chrome** (the demo guarantee)". This spec sets `channel: "chrome"` and rehearses on **Google Chrome 152.0.7977.83 at 1920×1080**, **headed as well as headless**, because headed is what the room will see. **EVERY TIMESTAMP IS TAKEN INSIDE THE PAGE:** a `Date.now()` either side of a Playwright call reported the thinking panel taking **785ms** to appear, which was the driver's locator resolution and actionability checks billed to the product; a capture-phase listener plus an `rAF` loop report **10-35ms**. **THE SHOW, ONE CONTINUOUS SESSION, ONE CONSOLE** — baseline → three heroes each with its follow-up → an off-script question from the floor → reset: press to panel **10-35ms**, press to answer **1179-1198ms** (the designed ~1150ms beat), answer to viewport at rest **+600 to +899ms**, **1.78-2.08s per question**, **the whole show 11.9s**, and **zero console errors across all of it**; the off-script question lands the fallback in **6ms** with all six answers untouched behind it, and the closing reset clears in **28ms** to `scrollY 0`. **THE DEFECT — RESET FIGHTING THE REVEAL'S OWN SCROLL, fixed in two halves in `app/lib/motion.ts`, each mutation-verified by reverting it.** A smooth scroll belongs to the scrolling box, not to the code that started it, and Reset's glide to the top waits out the 400ms reflow tween (US-043's fix) — so those 400ms were a window in which a stale scroll owned the window. Measured: Reset pressed while the reveal's scroll was in flight sent the **freshly cleared baseline down to its own foot, `scrollY` 0 → 233 — the whole height of the short page — arriving at ~110ms, sitting there until Reset's own scroll was released at ~445ms, and back at the top only at ~710ms**, in 2 of 3 runs. **Fix (a):** `scrollToTop` now stops the page where it is first and synchronously — a non-smooth scroll aborts a smooth one on the same box, so scrolling to where the page already is IS "stop" and moves nothing. **Fix (b):** `afterReflow` no longer runs a callback whose reflow was **superseded** — a skipped transition REJECTS and rejection was being read as completion, so the reveal's queued `scrollIntoView` ran at a section the same press was removing (reproduced at every offset from 50ms to 350ms, peak 233 every time). **After both: excursion 0px, at rest in 476-688ms.** Neither half works alone. **CRITERION 3, RESET UNDER REAL ABUSE**, sampled every frame across ONE session — **2,012 frames, 20 presses over 7 shapes** (spammed ×8 on a full canvas, mid-beat, mid-reveal, mid-scroll, inside the reflow tween, reset-then-ask with no pause, two heroes → reset → re-ask): **0 duplicate sections · 0 duplicate `view-transition-name`s** (two live elements sharing one make the browser silently SKIP the whole transition) **· 0 tiles tweened by two animations at once · 0 frames with two transient panels · 0 finite animations still running at rest** (the infinite brand pulses excluded, or the count could never mean anything). **CRITERION 4, DEBOUNCE UNDER REAL USE:** 8 back-to-back Enter presses → 1 answer · Enter **held** ~900ms → 1 answer · a real click on the send button + 8 dispatched clicks + 8 dispatched form submits → 1 answer · 6 submits during someone else's beat → 1 answer; **31 submit attempts, four questions, exactly 4 beats**, with the field and send button asserted `disabled` / `aria-busy` and the field asserted EMPTY. **COLD START, fresh context, empty cache:** first paint / first contentful paint **120-140ms**, DOM interactive **82-140ms**, **answers a press at 178-385ms**, 11 requests / **183.0 KiB**, console clean. ⏸️ **CRITERION 5 IS DEFERRED AND IS NOT CLAIMED:** it needs the deployed shareable URL, and there is not one — US-001's deploy criterion is still open and `fcbasel.railway.internal` is a PRIVATE Railway name returning NXDOMAIN. The cold start above was measured against the local production build precisely so the deployed URL has a number to be compared against. **A presenter's run of show** is now in `output/phases/phase-4.md`. **Security triage — none fired.** Unit **2244** (55 files), e2e **64 cases**, coverage 99.71% stmts / 100% lines, lockfile untouched. **Next: nothing in this plan. The Railway deploy, then the sponsor showing.**

*Previously (US-043, 2026-09-10):* every frame of the reveal was sampled and it found two defects a review had not — **the empty state flashing back between the beat and its answer** (`startViewTransition` updates asynchronously, so `setBeat(null)` painted alone for one frame and ghosted "Your dashboard is ready" across the whole 400ms reflow; the panel now comes down in the render the answer lands in, **seam 0 frames**) and **the beat's own source chips 14.2px under the pinned prompt bar** once the chip row wrapped (bar 117.1 → 159.3px against a 128px reserve; now 176px). Both scrolls were also made to wait out the reflow tween, which the reveal's used to start 384ms inside. **KL-3 closed.** *Before that (US-044):* 19 painted colours over 886 elements, all tokens; 41 gold paints in a closed allowlist; **Hero 3's `CHF 410k total` badge had no sign** → `+CHF 410k total`.
