# 📊 Project Dashboard

**Last Updated:** 2026-09-09
**Current Phase:** Phase 2b - Chart & Tile Component Library *(5/11 stories complete)* · Phase 2a partial (4/5, US-016 now unblocked) · Phases 1a + 1b complete

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 41% | 100% | 🟢 On Track |
| **Phase 1a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 1b** | 100% — Completed | 100% | 🟢 Done |
| **Stories Completed** | 20/45 | 45 | 🟢 On Track |
| **Story Points Done** | 48/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-09)

**Stories Completed Today:** 20
**Currently Working On:** US-016 — Hero band: webshop trend & attendance ring (5 pts)
**Story Points Completed Today:** 48

- ✅ **Phase 1a — Setup & Design System (6 stories, 14 pts)** — **US-001** React Router 7 SSR scaffold
  (clean-checkout `install`/`build`/`start` verified; the Railway deploy stays a human step) ·
  **US-002** ESLint 9 flat config, Prettier with Tailwind class sorting, husky + lint-staged, the
  hook proven with throwaway commits · **US-003** one token set published as Tailwind v4
  `@theme static` properties *and* a typed TS object, held in lockstep by a CSS↔TS parity test, with
  the colour discipline encoded in the names · **US-004** the club crest self-hosted — `logo.webp` is
  actually a PNG, downsampled 608x648 → 120x128 with `sips` (194 KB → 17.9 KB, no new dependency),
  and the build contains zero `fcb.ch` references · **US-005** one `Card` shell every Phase 2b tile
  and Phase 3b hero composes: slots, not variants, and `accent` takes a token name so no hex reaches
  a tile · **US-006** the four reveal keyframes defined once and timed from motion tokens, fade and
  rise only, with reduced motion *collapsing* animations to a ~1ms final frame rather than removing
  them (nothing is ever stranded at zero).

- ✅ **US-007 — Persona baseline datasets (2 pts)** — the first data story, and the pattern the rest
  of E3 follows: enums, domain types and the repository interface in `app/lib/repositories/`,
  fixtures and the in-memory implementation in `app/lib/mock/`, server-only selection in
  `index.server.ts`. All four periods (the user's approved decision). Totals and deltas are computed
  from the series, never stored; the two long periods take their x-axis labels from the current date
  through an injectable clock; partner brand colours stay outside the token palette on purpose.

- ✅ **US-008 — Hero 1 dataset (2 pts)** — season-to-date merchandising across all four periods: kit
  revenue (units x CHF 99), the 58% Home share and the exactly-8% badge share are *derived*, and
  `badgeSegments` corrects its rounding remainder into the first segment so the donut adds up to the
  number printed inside it.

- ✅ **US-009 — Hero 2 dataset (2 pts)** — matchday ticket revenue year on year: eight home fixtures
  (7,880 → 7,830 CHF thousands) plus the Guide's twelve-month series. The two charts sit at
  *different scopes on purpose*, so each carries its own `scopeLabel` and a test proves they differ;
  totals, the -0.6% and the -CHF 400k badge are all *derived* from the fixture pairs.

- ✅ **US-010 — Hero 3 dataset (2 pts)** — full-year departmental performance: six departments
  (69,000 → 69,680 CHF thousands, +680 / +1.0%, all derived) each tagged Revenue or Cost. That tag is
  *load-bearing*: above budget is earned money for the five revenue departments and an **overspend**
  for the Marketing cost centre, so every row carries a derived `VarianceJudgement` — and a test
  shows a naive "variance > 0 is good" rule misreads exactly one department. The three follow-up
  drivers (240 + 150 + 20) reconcile *exactly* with Marketing's derived 410 overspend; Ticketing's
  24,360 legitimately exceeds Hero 2's 7,830 (season-ticket base), and the `scopeLabel` says so.

- ✅ **US-011 — Formatters & cross-hero reconciliation (2 pts)** — the shared display layer
  (`app/lib/format.ts`, pure and stateless) plus the drift alarm that closes Phase 1b
  (`tests/unit/reconciliation.test.ts`, 39 tests). Money always carries `CHF` with the sign *before*
  the unit (`-CHF 400k`); millions render bare under the "figures in CHF millions" subtitle;
  `Intl.NumberFormat("en-CH")` groups thousands with the Swiss U+2019 mark, pinned as a constant and
  made ICU-independent by stubbing `Intl` to `en-US` and `de-DE`. `oneDecimal` is *imported* from
  `derive.ts`, so there is one rounding rule. The reconciliation suite asserts relationships, not
  constants — every stored key set, every split against its total, the intended cross-hero
  inequality, and every number in all six narratives. **No drift found.**

- ✅ **US-012 — Branded application shell (3 pts)** — the frame Phase 2a builds on: navy sidebar, top
  app bar, and an empty 12-column canvas left for US-013/US-014 to populate. The persona is a *role*
  — `app/lib/persona.ts` holds the workspace label and the "SM" monogram, and a test asserts the app
  bar's entire text is accounted for by those labels, so a personal name cannot be added by accident.
  The three placeholder nav items are inert **structurally**, not by handler: plain `<span>`s with
  `aria-disabled`, no href, no focus, `pointer-events-none`. Verified in real Chrome — `tabIndex` -1
  and `scrollWidth === clientWidth` at 1920×1080. "Connected · 11 systems" is static and marked
  `data-decorative`; tests pin the absence of `fetch`, a live region and any timer.

- ✅ **US-014 — Dynamic tile insertion & grid reflow (3 pts)** — the mechanic the whole demo turns on:
  the dashboard **grows, it never clears**. Session state is a memory-only list of `{heroId, phase,
  revision}` (`app/lib/dashboard/`), owned by `root.tsx` so the canvas and the app bar share one
  source. Re-asking a hero **refreshes in place** — one section, same position, revision bumped —
  and a follow-up **flips an existing section's phase** instead of appending, which is exactly what
  US-033 builds on. Sections re-use the US-012 canvas grid's column tracks via `grid-cols-subgrid`,
  so there is still only **one grid**. Verified in real Chrome: existing tiles glide rather than jump
  while a second section inserts, the view auto-scrolls to the newest section, and under
  `prefers-reduced-motion` the tween is skipped while the final layout renders identically. A source
  scan asserts no storage API anywhere in `app/**`.

- ✅ **US-015 — Reset to baseline (2 pts)** — the control that lets the demo be run twice, built as a
  **transition beside the other three** rather than a special case: `withBaselineRestored`, `reset`
  on `useDashboard`, `scrollToTop`, and US-012's Reset button wired through `onReset`. Reset restores
  `BASELINE_SECTIONS`, the *same* constant that is the hook's initial state. **The timer is the
  story:** `reset` cancels the single pending beat *first*; deleting that line makes two tests fail
  with a `HERO_2` section landing in a dashboard just cleared. Abuse-proofing is structural — the
  same list reference comes back when there is nothing to clear, so ten presses in one frame run
  **one** view transition (`scrollY` 900 → 0 in Chrome, zero `startViewTransition` calls under
  `prefers-reduced-motion`).

- ✅ **US-027 — Motion & animation hooks (3 pts)** — the four hooks the other ten E6 components are
  built on: `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`. **Count-up tracks the figure on
  screen in a ref**, so a filter changed mid-animation carries on from the old number instead of
  snapping to zero. **Reduced motion means final state in the same render, never an effect later**,
  so `width={grown ? w : 0}` geometry can never be stranded at zero — US-006's CSS principle
  restated in JS. One reduced-motion source of truth via `useSyncExternalStore` (SSR-safe by
  construction), proven by a grep test plus a real `renderToString` + `hydrateRoot` pass; every
  frame, timer and listener is cancelled on unmount. 42 new tests. **US-013 gave it its browser pass.**

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
  **The two review decisions are read back off the rendered element by tests:** the label column is
  150px and a test *rejects* `truncate` / `text-ellipsis` / `line-clamp`, so `Cap "Rotblau"` can
  never regain the ellipsis it was reported with; the value column is 96px `nowrap`, proven through
  `getComputedStyle` on three lists. **One rule serves every consumer: the sign of the displayed
  figure** — it sets the anchor side, the token and the sign in the text, so `negative` mode is just
  "every row is a decline" and the badge trend's mixed signs need nothing extra. Rows are keyed by
  name, so a filter change transitions the *same* bar element while the figure counts on from what is
  on screen; `hBarMax` / `hBarPercent` return zero width rather than `NaN`. 55 new tests.

- ✅ **US-013 — Baseline dashboard, four pre-existing tiles (3 pts)** — **the canvas stops being
  empty**, the client's own framing of the mechanic and the first impression in the owner meeting.
  Nothing was invented: `app/components/dashboard/baseline-row.tsx` composes `KpiTile` (US-017)
  twice, `HBarTile` (US-021) and a new `PartnersTile` on the `Card` shell, as **direct children of
  US-012's one canvas grid**, with hero sections inserting *below* them. **No figure is re-typed:**
  `app/lib/dashboard/baseline.ts` reads the US-007 repository in the route's SSR loader, the webshop
  headline and its `+11.9%` are `seriesTotals` off the same array the sparkline draws, and a **source
  scan** fails on any displayed figure written as a literal, any pre-formatted `CHF`/`%` string, any
  product or partner name, or `toLocaleString`/`toFixed`. New `trendEndingAt` makes the six-point
  window *end on the month the headline covers*, so number and glyph cannot drift apart. Partner
  plates carry the partner's **own** brand colour from the data (no hex, no FCB token in the file —
  a plate in club red is wrong to a sponsor in the room). **Reset's baseline seam is closed as
  US-015 described:** the tiles are static route chrome outside the session list, and a test drives
  insert → Reset and compares the canvas `innerHTML` to its load state. **First real-Chrome pass for
  US-017, US-021 and US-027**: no horizontal scroll at 1920×1080 (nor 1440/1280/834/390), 54 distinct
  KPI strings and 43 distinct bar widths per frame, two values only under reduced motion. 103 tests.

- ✅ **US-026 — Segmented period filter control (2 pts)** — one control in
  `app/components/controls/segmented.tsx` for all three of its consumers: the dark hero band, Top
  Products' `action` slot, and Hero 1's section header. **Controlled, with no opinion of its own** —
  a press the caller ignores changes nothing on screen, which is what lets one control drive two
  tiles (the band) or three (Hero 1) without them ever disagreeing. Keys are the shared `PeriodKey`,
  never a local union, and the label is data on the *entry*, so Hero 1 says "Current month" for the
  same `THIS_MONTH` key. **11px, deliberately not a pill:** the reviewed radius already existed as
  `--radius-chip`, so the group wears `rounded-chip` and each option the new `.fcb-chip` rule (radius
  + 1px lift + transition, shared with US-029's chips) — tests reject `rounded-full` in the markup,
  the source *and* the stylesheet. Radiogroup semantics: one tab stop via roving `tabIndex`, wrapping
  arrows on both axes plus Home/End, and selection carried by shape, shadow, weight *and*
  `aria-checked` — never colour alone. Not yet wired into any consumer. 45 new tests.

- ✅ **US-025 — Line chart component (3 pts)** — one chart in
  `app/components/charts/line-chart.tsx` for both of its consumers: the navy hero band (gold area
  line over a dashed white one, keyed by period) and Hero 2's twelve-month two-season comparison.
  Series count is a prop, `area` / `dash` is per series, and colour is a token **name**, so no hex
  can enter. **The stroke draw survives reduced motion:** `pathLength="1"` plus an offset that
  transitions 1 → 0, and under the preference `useGrow` is `true` in the first render — a test reads
  `stroke-dashoffset="0"` with **zero frames requested** rather than a line stranded at offset 1.
  **It replays by being re-keyed and by nothing else** — a re-key returns the offset to 1 and clears
  the guide, a data-only change leaves it drawn. Hover maps the pointer over the wrapper to the
  nearest index and the tooltip lists **every** series there through US-011, with arrow/Home/End/
  Escape doing the same from the keyboard without capturing Tab. Gradient ids come from `useUid`,
  proven distinct with both charts on screen; a zero or missing point is a labelled zero, never a
  `NaN` in a `d`. 73 new tests.
---

## 🏁 Phase 1b complete — Seed Data

**Phase 1b goal:** the single source of truth for every figure in the prototype, seeded locally and
grounded in verified FCB facts. Closed at 100% on 2026-09-09, as did **Phase 1a**.
**Duration:** 2026-09-09 (one day, ahead of the 2026-09-10 target)
**Progress:** 100% (5/5 stories · 10/10 points)

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-016 (Phase 2a) | ⏳ Ready | **Unblocked** — US-025 + US-026 + US-027 all exist |
| US-023: Driver / breakdown tile | ⏳ Ready | Composes US-021's row; no new row to write |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
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
| Test Coverage (`app/**`) | 99.86% stmts / 98.63% branches / 100% funcs / 100% lines | 80% | 🟢 Good |
| Passing Tests | 953/953 | TBD | 🟢 Good |
| TypeScript Errors (strict) | 0 | 0 | 🟢 Good |
| ESLint Problems | 0 errors, 0 warnings | 0 errors | 🟢 Good |
| Dependency Advisories | 0 | 0 high/critical | 🟢 Good |
| Open Bugs | 0 | < 5 | 🟢 Good |

> Coverage is measured over `app/**` only (725 statements), and the suite is substantive rather than
> hollow: it pins every hex, the type scale and the colour discipline, fails the build if
> `app/app.css` and `app/lib/tokens.ts` ever disagree, and asserts structurally that no
> reduced-motion path can leave an element stranded at zero. The data suites pin the Specification
> baseline figures, prove every total is *derived* from its series, force the sponsor badge segments
> to sum exactly to their total at every total from 0 to 2,000, and show that a naive
> "variance > 0 is good" rule misreads exactly one department; US-011 adds a cross-dataset
> reconciliation suite that sweeps every number in all six hero narratives against the data. The
> component suites test the same way: variance stays distinguishable with the colour *removed*
> (US-017), US-021's review decisions are read back off the rendered element, US-013 scans its own
> sources for a dataset figure written as a literal, and US-025 proves no reduced-motion path leaves
> a chart path undrawn. The gate is three-part: strict `tsc`, ESLint 9 and Prettier, via husky.

---

## 📊 Phase Breakdown

| Phase | Status | Stories | Points | Progress |
|-------|--------|---------|--------|----------|
| Phase 1a: Setup & Design System | ✅ Completed | 6/6 | 14/14 | 100% |
| Phase 1b: Seed Data | ✅ Completed | 5/5 | 10/10 | 100% |
| Phase 2a: Shell & Baseline | 🔄 Partial | 4/5 | 11/16 | 69% |
| Phase 2b: Component Library | 🔄 In Progress | 5/11 | 13/29 | 45% |
| Phase 3a: Conversation | ⏸️ Pending | 0/6 | 0/17 | 0% |
| Phase 3b: Heroes | ⏸️ Pending | 0/6 | 0/16 | 0% |
| Phase 4: Hardening | ⏸️ Pending | 0/6 | 0/14 | 0% |

---

## 🔗 Quick Links

- **[Current Phase Plan](../phases/phase-2b.md)** - Phase 2b, Chart & Tile Component Library
- **[Phase 2a Plan](../phases/phase-2a.md)** - Partial (4/5); US-016 unblocked, ready to build
- **[Phase 1b Plan](../phases/phase-1b.md)** - Completed 2026-09-09
- **[Phase 1a Plan](../phases/phase-1a.md)** - Completed 2026-09-09
- **[Backlog](../../input/backlog/)** - All project backlogs
- **[Detailed Status](current-status.md)** - Full status report
- **[Completed Work](completed.md)** - Complete history
- **[Blockers](blockers.md)** - All blockers
- **[Effort Estimate](../reports/ai-hours-estimate-2026-09-09.md)** - AI-hours projection

---

**💡 Tip:** This file updates automatically during `/execute-work`.

**Last Auto-Update:** US-026 completed at 2026-09-09 — **Phase 2b at 5/11 · 13/29 pts**. One segmented period control now serves all three consumers: keys typed to the shared `PeriodKey`, the label carried as data on each entry, `light` / `dark` variants, an 11px radius from the existing `--radius-chip` (never a pill, asserted three ways), and radiogroup semantics with one tab stop. It is deliberately not wired into a consumer yet. **Next is US-016** — the last deferred Phase 2a story, now unblocked because US-025 + US-026 + US-027 all exist
