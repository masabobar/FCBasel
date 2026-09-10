# 📊 Project Dashboard

**Last Updated:** 2026-09-10
**Current Phase:** Phase 4 - Hardening *(1/6 stories)* · **Phases 1a + 1b + 2a + 2b + 3a + 3b all complete**

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 90% | 100% | 🟢 On Track |
| **Phase 1a / 1b / 2a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 2b** | 100% — Completed (11/11 · 29/29) | 100% | 🟢 Done |
| **Phase 3a** | 100% — Completed (6/6 · 17/17) | 100% | 🟢 Done |
| **Phase 3b** | 100% — Completed (6/6 · 16/16) | 100% | 🟢 Done |
| **Phase 4** | 14% — Active (1/6 · 2/14) | 100% | 🟢 On Track |
| **Stories Completed** | 40/45 | 45 | 🟢 On Track |
| **Story Points Done** | 104/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% lines (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-10)

**Stories Completed Today:** 8 (US-033 to US-039, **US-040**) · **40 total**
**Currently Working On:** US-041 — Offline resilience verification (2 pts)
**Story Points Completed Today:** 21 · **104 total**

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
- ✅ **US-040 — Presentation sizing & responsiveness (2 pts)** — **Phase 4 opens, and the story is a
  measurement.** Real Chrome against the **built SSR bundle** with the **full run-of-show loaded
  before any reading**: clean at **eleven viewports** (five presentation sizes, four projector
  aspect ratios, both tablet orientations) — no page or in-card horizontal scroll, no clipped tile,
  axis label or legend, no SVG text outside its plot, **prompt-bar clearance +10.5 to +11.2px** —
  and a mid-session 1920 → 1024 → 1920 resize clean **both ways**. **One real defect fixed:** Top
  Products' four-option filter was clipped 25.7px at 1152 and 89.7px at 1024, so `WIDE_SPAN` moved
  to `xl:col-span-6` (US-036's precedent), **proved a no-op at every target viewport**. **And the
  favicon 404 three reviews waved through is closed** — a 32x32 ICO from the local crest, re-encoded
  so only `IHDR`/`IDAT`/`IEND` ship, so the script runs with **zero console errors**. Two
  limitations **recorded, not fixed**. 11 tests, **2221** (55 files) + **12 Chrome cases**.

---

## 🔄 Phase 4 IN PROGRESS — Hardening a feature-complete prototype

**Phases 1a to 3b are all closed** (39 stories · 102 pts): every client question answers end to end
and each one sharpens, *what* → *so-what*, with **not one placeholder left in the product**.
**Phase 4 is now open at 1/6 · 2/14.** Nothing new is built from here — **US-040 measured the
finished screen in real Chrome at eleven viewports**, fixed one clipped period filter and the
favicon 404, and recorded two out-of-scope limitations **with their numbers** under a durable
"Known limitations" heading in `phase-4.md` that later stories must read first.

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-041: Offline resilience verification | 📋 Next | Verified by disconnecting the network and running the script, not by scanning for `fetch` |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
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
| US-022: Department table tile | 2026-09-09 | 3 |
| US-020: Donut / ring tile | 2026-09-09 | 3 |
| US-019: Grouped bar chart tile | 2026-09-09 | 3 |
| US-018: Vertical bar chart tile | 2026-09-09 | 3 |
| US-016: Hero band — webshop trend & attendance ring | 2026-09-09 | 5 |
| US-026: Segmented period filter control | 2026-09-09 | 2 |
| US-014: Dynamic tile insertion & grid reflow | 2026-09-09 | 3 |
| US-012: Branded application shell | 2026-09-09 | 3 |
| US-011: Formatters & cross-hero reconciliation | 2026-09-09 | 2 |
| US-010: Hero 3 dataset — departmental performance | 2026-09-09 | 2 |
| US-009: Hero 2 dataset — ticket revenue year on year | 2026-09-09 | 2 |
| US-008: Hero 1 dataset — shirt sales, badges, printed names | 2026-09-09 | 2 |
| US-007: Persona baseline datasets | 2026-09-09 | 2 |
| US-005 / US-006: Tile card anatomy & tile-insertion motion | 2026-09-09 | 5 |
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
> hours per day, not scope — the P1 cut set (US-043, US-045) is worth only 0.82 days.

---

## 🧪 Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage (`app/**`) | 99.71% stmts / 97.96% branches / 100% funcs / 100% lines | 80% | 🟢 Good |
| Passing Tests | 2221/2221 unit (55 files) + 12/12 Chrome | TBD | 🟢 Good |
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
> claim by **source scan** and its dead end by **mutation**. The gate: `tsc`, ESLint 9, Prettier.
> **US-040 added the second kind of suite: a real browser.** `pnpm test:e2e` drives the full
> run-of-show in Chrome against the built SSR bundle and measures what jsdom answers with zeros —
> horizontal scroll, tile and legend clipping, SVG label boxes against their plots, prompt-bar
> clearance — at eleven viewports, plus the favicon and an error-free console. It is separate from
> `pnpm test` (minutes, not seconds) and added no dependency.

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
| Phase 4: Hardening | 🔄 Active | 1/6 | 2/14 | 14% |

---

## 🔗 Quick Links
- **[Current Phase Plan](../phases/phase-4.md)** - Phase 4, Hardening (1/6) + **Known limitations**
- **[Phase 3b Plan](../phases/phase-3b.md)** - Completed 2026-09-10 (6/6 · 16/16 pts)
- **[Phase 3a Plan](../phases/phase-3a.md)** - Completed 2026-09-10 (6/6 · 17/17 pts)
- **[Phase 2b Plan](../phases/phase-2b.md)** - Completed 2026-09-09 (11/11 · 29/29 pts)
- **[Phase 2a Plan](../phases/phase-2a.md)** - Completed 2026-09-09 (5/5 · 16/16 pts)
- **[Phase 1b Plan](../phases/phase-1b.md)** - Completed 2026-09-09
- **[Phase 1a Plan](../phases/phase-1a.md)** - Completed 2026-09-09
- **[Backlog](../../input/backlog/)** - All project backlogs
- **[Detailed Status](current-status.md)** · **[Completed Work](completed.md)** · **[Blockers](blockers.md)**
- **[Effort Estimate](../reports/ai-hours-estimate-2026-09-09.md)** - AI-hours projection

---

**💡 Tip:** This file updates automatically during `/execute-work`.
**Last Auto-Update:** US-040 completed at 2026-09-10 — **PHASE 4 IS OPEN, AND THE FIRST HARDENING STORY WAS MEASURED RATHER THAN ASSERTED.** Every geometric claim here comes from real Chrome driving `pnpm build` + `pnpm start`, with the **full run-of-show loaded before a single reading was taken** — three heroes, three follow-ups, 15 cards, 3 gold seams — because that is the tallest the canvas ever gets and the only state in which every legend, axis and delta chip this story is accountable for exists. New: `playwright.config.ts` and `tests/e2e/`; `@playwright/test` was already a devDependency, so **the lockfile is untouched**. **CLEAN AT ELEVEN VIEWPORTS** — the five the story names (1920x1080, 1600x900, 1440x900, 1366x768, 1280x800), four projector aspect ratios (1920x1200 16:10, 1280x720 16:9, 1152x864 and 1024x768 4:3) and both tablet orientations (834x1112, 768x1024): `documentElement.scrollWidth === clientWidth` everywhere so **there is no page horizontal scroll anywhere**; **zero in-card scrollers**, and notably the departmental table’s `overflow-x-auto` escape hatch **never engages at 1024 or above**; no tile or card outside its container; **no ellipsis engaged on any axis, bar, legend or table label, no SVG `<text>` painted outside the `<svg>` that owns it and no legend past its tile’s clip edge**; and, scrolled fully down, **prompt-bar clearance of +10.5px at 1920 and 1280, +10.9px at 1600/1440, +10.7px at 1366** — `pb-32` is doing its job. **Mid-session resize both ways** (1920 -> 1600 -> 1280 -> 1024 -> 1366 -> 1920 with all six answers open) clips nothing on the way down and leaves nothing clipped on the way back up. **Type floor holds:** the smallest rendered size on the canvas is 12px (`--text-chart-axis`), and **the type scale was deliberately NOT touched** — that is US-044’s remit. **ONE REAL SIZING DEFECT FOUND AND FIXED:** Top Products’ header needs 460px for its title block plus the four-option `Segmented`, and `lg:col-span-6` gave it 432px at 1152 and 368px at 1024, so `Card`’s `overflow-hidden` cut "Year to date" off by **25.7px and 89.7px**; `WIDE_SPAN` is now `col-span-full xl:col-span-6` (496px at 1280, full width below) — exactly the measurement that made US-036 pick `xl`, **proved a no-op at all five target viewports**, and pinned by a unit test carrying the numbers. **THE FAVICON DEFECT IS CLOSED** after three reviews called it pre-existing: `public/favicon.ico` is a one-entry ICO wrapping a 32x32 PNG **derived from the crest that is already local** (`sips` downsample, no image dependency added, as US-004), centred on a transparent canvas and **re-encoded from raw samples** so only `IHDR`/`IDAT`/`IEND` ship — 1,742 bytes, `200 image/x-icon` from the booted production server, declared by a new `links` export, and **the full script now runs with zero console errors and zero responses >= 400**. **Security triage — the external-binary trigger fired (A04/A08) and the bytes were read back rather than trusted:** ICO directory header, one 32x32 32bpp entry at offset 22, declared payload length equal to the bytes present, PNG magic, IHDR 32x32/8-bit/RGBA/non-interlaced, and the chunk table walked **consuming the buffer exactly, so nothing is appended past `IEND`**. **US-004’s XMP/hostname leak did not recur, but `sips` attached an `eXIf` block and an `sRGB` chunk of its own** — both dropped by the re-encode, and their absence is now asserted so the next regeneration cannot reintroduce them. No route, endpoint, SQL, env var, auth, upload or logging change; **lockfile untouched, so no dependency-advisory gate applies**. **Two known limitations were RECORDED, NOT FIXED**, in `phase-4.md` under a durable "Known limitations" heading — KL-1, Hero 2’s delta chips overlapping at 390px (out of scope by decision; min neighbour gap 61.7px at 1920, 37.3 at 1600, 25.2 at 1440, 19.6 at 1366, **13.0 at 1280 — the tightest anywhere, because 1280 is the `xl` boundary**, 37.3 at 1152, 22.8 at 1024, 28.5 at 834, 20.9 at 768, and clean at every width from 768 up), and KL-2, sub-768px being no target at all. US-036’s numbers were re-measured from scratch and agree to the decimal. 11 new unit tests, **2221 green** (55 files), plus **12 Chrome measurement cases**. **Next: US-041, offline resilience.**

*Previously (US-039, 2026-09-10):* the causal peak went on screen and **Phase 3b closed (6/6 · 16/16)** — three grid rows joined `hero-3.tsx` with **no module, bar, badge, divider or panel built**, `PlaceholderFollowUp` deleted so no stand-in remains in the product, and the drivers explaining the whole overspend (`CHF 240k` / `CHF 150k` / `CHF 20k`, badge `CHF 410k total` **equal to** the variance the table derives). Narrative byte-identical at 468 chars; the whole demo script run in Chrome with zero requests after first paint. 63 tests, 2210 green.

*Previously (US-038, 2026-09-10):* Hero 3's primary answer went on screen and **the revenue/cost trap was closed in front of the owner** — Marketing's `+0.41` renders ADVERSE while Sponsoring's `+0.84` renders FAVOURABLE, same sign, opposite meaning, with source scans proving neither the table nor the hero can compute a verdict; exactly one row is flagged and `needsAttention` picks it. Overall `CHF 69.68M` at `+1%` (NEUTRAL), blended target 96% stored, above target `3 of 6` derived. 66 tests, 2147 green.
