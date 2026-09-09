# 📊 Project Dashboard

**Last Updated:** 2026-09-09
**Current Phase:** Phase 2b - Chart & Tile Component Library *(3/11 stories complete)* · Phase 2a partial (3/5, US-013 + US-016 folded into the 2b run) · Phases 1a + 1b complete

---

## 🎯 Quick Status

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Overall Progress** | 34% | 100% | 🟢 On Track |
| **Phase 1a** | 100% — Completed | 100% | 🟢 Done |
| **Phase 1b** | 100% — Completed | 100% | 🟢 Done |
| **Stories Completed** | 17/45 | 45 | 🟢 On Track |
| **Story Points Done** | 40/116 | 116 | 🟢 On Track |
| **Test Coverage** | 100% (`app/**`) | 80% | 🟢 Good |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Off Track

---

## 📅 Today's Progress (2026-09-09)

**Stories Completed Today:** 17
**Currently Working On:** US-013 — Baseline dashboard, four pre-existing tiles (3 pts)
**Story Points Completed Today:** 40

- ✅ **US-001 — Environment & deployment setup (3 pts)** — React Router 7 SSR scaffold; clean-checkout
  `install` / `build` / `start` all verified. One AC deferred: the Railway deploy is a human step.
- ✅ **US-002 — Developer tooling & local DX (2 pts)** — ESLint 9 flat config, Prettier with Tailwind
  class sorting, husky + lint-staged. Pre-commit hook proven with real throwaway commits.
- ✅ **US-003 — Design token set (3 pts)** — one token set published as Tailwind v4 `@theme static`
  custom properties and a typed TS object, held in lockstep by a CSS↔TS parity test. Colour
  discipline encoded in the token names, not just documented.
- ✅ **US-004 — Self-hosted FCB crest (1 pt)** — the club's `logo.webp` is actually a PNG; verified by
  its bytes, downsampled 608x648 → 120x128 with `sips` (194 KB → 17.9 KB, no new dependency),
  metadata chunks stripped. Served from `public/`; build and running server contain zero `fcb.ch`
  references.
- ✅ **US-005 — Tile card anatomy (2 pts)** — one `Card` shell (plus its narrative caption strip) that
  every Phase 2b tile and Phase 3b hero composes. Slots, not variants; `accent` takes a token name so
  no hex can reach a tile. Entrance hooks only — US-006 owns the motion, and there is no gold ring.
- ✅ **US-006 — Tile-insertion motion & reduced-motion support (3 pts)** — the four reveal keyframes
  (`fcbUp`, `fcbGlow`, `fcbScan`, `fcbSrc`) defined once, timed from motion tokens, wired to the card's
  existing `isNew`/`delayMs` hooks. Fade-and-rise only, no gold ring. Reduced motion *collapses*
  animations to a ~1ms final frame rather than removing them, so nothing is stranded at zero.

- ✅ **US-007 — Persona baseline datasets (2 pts)** — the first data story, and the pattern the rest of
  E3 follows: enums, domain types and the repository interface in `app/lib/repositories/`, fixtures
  and the in-memory implementation in `app/lib/mock/`, server-only selection in `index.server.ts`.
  Delivered set intentionally exceeds the written AC (all four periods, per the user's approved
  decision). Totals and deltas are computed from the series, never stored; the two long periods take
  their x-axis labels from the current date through an injectable clock; partner brand colours stay
  outside the token palette on purpose.

- ✅ **US-008 — Hero 1 dataset (2 pts)** — season-to-date merchandising: three kits, the sponsor badge
  split and the top five printed names, across all four periods (the user's approved decision). Kit
  revenue (units x CHF 99), the 58% Home share and the exactly-8% badge share are *derived*, never
  stored. `badgeSegments` corrects its rounding remainder into the first segment so the donut always
  adds up to the number printed inside it. Both narratives are byte-identical, proven by SHA-256.

- ✅ **US-009 — Hero 2 dataset (2 pts)** — matchday ticket revenue year on year: eight home fixtures
  (7,880 → 7,830 CHF thousands) plus the twelve-month series the Reference Guide adds. The two charts
  sit at *different scopes on purpose*, so each series carries its own `scopeLabel` and a test proves
  they differ. Totals, the -0.6%, the four declining fixtures and their -CHF 400k badge are all
  *derived* from the fixture pairs. Both narratives verbatim, pinned by text, length and ASCII range.

- ✅ **US-010 — Hero 3 dataset (2 pts)** — full-year departmental performance: six departments
  (69,000 → 69,680 CHF thousands, +680 / +1.0%, all derived) each tagged Revenue or Cost. That tag is
  *load-bearing*: above budget is money earned for the five revenue departments and an **overspend**
  for the Marketing cost centre, so every row carries a derived `VarianceJudgement` — and a test
  shows a naive "variance > 0 is good" rule would misread exactly one department. Marketing being the
  *only* department both over budget and behind target is derived too, and the three follow-up
  drivers (240 + 150 + 20) reconcile *exactly* with its derived 410 overspend. Ticketing's 24,360
  legitimately exceeds Hero 2's 7,830 (it includes the season-ticket base); the `scopeLabel` says so.

- ✅ **US-011 — Formatters & cross-hero reconciliation (2 pts)** — the shared display layer
  (`app/lib/format.ts`, pure and stateless) plus the drift alarm that closes Phase 1b
  (`tests/unit/reconciliation.test.ts`, 39 tests). Money always carries `CHF`, and the sign goes
  *before* the unit (`-CHF 400k`); millions render bare under the "figures in CHF millions" subtitle
  with no "000" note anywhere. `Intl.NumberFormat("en-CH")` per the Reference Guide, so thousands
  group with the Swiss U+2019 mark — pinned as a constant and made runtime-independent of ICU, proved
  by tests that stub `Intl` to `en-US` and `de-DE`. `oneDecimal` is *imported* from `derive.ts`, so
  there is exactly one rounding rule, and variance carries its meaning through sign plus a new
  `VarianceDirection` enum rather than colour. The reconciliation suite asserts relationships and not
  constants — every hero's stored key set, every split against its total, the intended cross-hero
  inequality (Ticketing 24,360 > 7,830, both scope-labelled), and every number in all six narratives
  swept against the figures the data can actually produce. **No drift found.**

- ✅ **US-012 — Branded application shell (3 pts)** — the frame Phase 2a builds on: navy sidebar, top
  app bar, and an empty 12-column canvas left for US-013/US-014 to populate. The persona is a *role*
  — `app/lib/persona.ts` holds the workspace label and the "SM" monogram, and a test asserts the app
  bar's entire text is accounted for by those labels, so a personal name cannot be added by accident.
  The three placeholder nav items are inert **structurally**, not by handler: plain `<span>`s with
  `aria-disabled`, no href, no focus, `pointer-events-none`. Verified in real Chrome — `tabIndex` -1,
  `pointer-events: none`, and `scrollWidth === clientWidth` at 1920×1080. "Connected · 11 systems" is
  static and marked `data-decorative`; tests pin the absence of `fetch`, a live region and any timer,
  so nobody can wire it to a health check. Reset renders here; its behaviour stays US-015.

- ✅ **US-014 — Dynamic tile insertion & grid reflow (3 pts)** — the mechanic the whole demo turns on:
  the dashboard **grows, it never clears**. Session state is a memory-only list of `{heroId, phase,
  revision}` (`app/lib/dashboard/`), owned by `root.tsx` so the canvas and the app bar share one
  source. Re-asking a hero **refreshes in place** — one section, same position, revision bumped —
  and a follow-up **flips an existing section's phase** instead of appending, which is exactly what
  US-033 builds on. Sections re-use the US-012 canvas grid's column tracks via `grid-cols-subgrid`,
  so there is still only **one grid**. Verified in real Chrome: existing tiles glide rather than jump
  while a second section inserts, the view auto-scrolls to the newest section, and under
  `prefers-reduced-motion` the tween is skipped while the final layout renders identically. A source
  scan asserts no `localStorage`, `sessionStorage`, cookie or IndexedDB anywhere in `app/**`.

- ✅ **US-015 — Reset to baseline (2 pts)** — the control that lets the demo be run twice, built as a
  **transition beside the other three** rather than a special case: `withBaselineRestored` in
  `sections.ts`, `reset` on `useDashboard`, `scrollToTop` in `motion.ts`, and the US-012 Reset button
  finally wired through `AppShell`'s `onReset`. Reset restores `BASELINE_SECTIONS` — the *same* named
  constant that is the hook's initial state — so nothing in the reset path says "empty" and US-013's
  four tiles will be restored for free by listing them there. **The timer is the story:** `reset`
  cancels the single pending beat *first*, before it touches state; deleting that one line makes two
  tests fail with a `HERO_2` section landing in a dashboard that was just cleared. Abuse-proofing is
  structural — `withBaselineRestored` returns the *same list reference* when there is nothing to
  clear, so ten presses in one frame run **one** view transition. Verified in real Chrome:
  `scrollY` 900 → 0 across three rapid presses, zero `startViewTransition` calls under
  `prefers-reduced-motion`. **Two criteria are honestly a seam:** the suggestion chips are US-029 and
  the thinking beat is US-031 — they wire into `sections` and `schedule` respectively.

- ✅ **US-027 — Motion & animation hooks (3 pts)** — the four hooks the other ten E6 components are
  built on, and the reason those stories can be mechanical: `useReducedMotion`, `useGrow`,
  `useCountUp`, `useUid` in `app/lib/hooks/use-motion.ts`. **Count-up tracks the figure on screen in
  a ref**, so a period filter changed mid-animation carries on from the old number instead of
  snapping to zero and re-counting — a test asserts the new animation's opening sample *is* the
  displayed value, climbs from there, and lands exactly on the target. **Reduced motion means final
  state in the same render, never an effect later:** `useGrow` returns `true` and `useCountUp`
  returns the target the moment the preference is read, so `width={grown ? w : 0}` geometry can never
  be stranded at zero by a transition that will not run — US-006's CSS principle restated in JS.
  One reduced-motion source of truth: the hooks subscribe to US-006's `REDUCED_MOTION_QUERY` through
  `useSyncExternalStore` (SSR snapshot by construction, React owns the unsubscribe), and a test
  greps the hook layer to prove it never calls `matchMedia` itself. Every frame, timer and listener
  is cancelled on unmount, proven with ten simultaneous tiles. The ~900ms count-up is now a token
  (`--duration-count-up`), read as a number through a new `durationMs()` so no timing is written
  twice. 42 new tests, including a real `renderToString` + `hydrateRoot` pass that fails on any
  hydration mismatch.

- ✅ **US-017 — KPI tile & variance chip (2 pts)** — the first component built ON the motion hooks, and
  the shape the other nine follow. Three exports so nothing is forked later: `DeltaChip` in its own
  module (US-019, US-022 and US-016 want the chip without a tile), plus `KpiSparkline` / `KpiFigure` /
  `KpiTile`. **Colour is never the sole signal, and the `light` variant is the proof** — on the navy
  band both directions share one white treatment, because the negative token sits at roughly 2:1
  there, and a test asserts the two chips' class strings are *identical* while the glyph, the explicit
  sign and an `sr-only` word still differ. Red never means "bad": only the variance tokens, and a zero
  renders as a **labelled zero** in the neutral treatment rather than either of them. **Direction is
  arithmetic, judgement is meaning** — an optional `judgement` prop (from US-010's
  `varianceJudgement`) draws Marketing's overspend as an up arrow in the *negative* token. One API
  carries all three consumers with **no variant per hero**: hero extras arrive as `children`, and
  US-016's navy band composes `KpiFigure onDark`, which forces the light chip so nobody can leave an
  illegible red figure on navy. The 30px/700/tight/tabular treatment is the existing `.kpi-number`
  role class, and a test greps the file to prove it holds no state or timer of its own; the sparkline
  draws itself with `pathLength="1"` and a dash offset and paints with `currentColor`, so no hex can
  be passed in. **The US-012 `tailwind-merge` trap is closed at the root:** `app/lib/cn.ts` declares
  the named type scale as a font-size group, derived from the token set, so a size and a colour can
  share an element everywhere from here on. 78 new tests.

- ✅ **US-021 — Horizontal bar tile (3 pts)** — the most reused chart in the product, built once in
  `app/components/charts/h-bars.tsx` for all five of its consumers (Top Products, top printed names,
  the badge trend, the declining fixtures, the Marketing drivers) as `HBarRow` / `HBars` /
  `HBarTile`. **The two review decisions are read back off the rendered element by tests, not just
  written down:** the label column is 150px at weight 500 and a test *rejects* `truncate`,
  `text-ellipsis` and `line-clamp` on it, so `Cap "Rotblau"` and `Home shirt 26/27` can never regain
  the ellipsis they were reported with — a long label wraps instead; and the value column is 96px
  with `white-space: nowrap`, proven through `getComputedStyle` on three different lists, with
  `-CHF 150k` and `-CHF 110k` each a single text node. **One rule serves every consumer: the sign of
  the displayed figure.** It sets the side the bar grows from, the token, and the sign in the text —
  so `negative` mode is just "every row is a decline" (it negates the stored magnitude,
  idempotently, and `formatMoneyCompact` puts the minus *before* the unit) and the badge trend's
  mixed signs need nothing extra. Rows are keyed by name, so a filter change transitions the *same*
  bar element (a test holds its identity while the width moves 100% → 50%) while the figure counts
  on from what is on screen — never a snap to zero. Widths come from pure, exported `hBarMax` /
  `hBarPercent` that return zero width rather than `NaN`, so an all-zero list still renders labelled
  zeros with their tracks. US-023 now has nothing to reimplement. 55 new tests.
---

## 🏁 Phase 1b complete — Seed Data

**Phase 1b goal:** the single source of truth for every figure in the prototype, seeded locally and
grounded in verified FCB facts. Closed at 100% on 2026-09-09, as did **Phase 1a**.
**Duration:** 2026-09-09 (one day, ahead of the 2026-09-10 target)
**Progress:** 100% (5/5 stories · 10/10 points)

### Active Stories

| Story | Status | Progress |
|-------|--------|----------|
| US-013: Baseline dashboard, four tiles (Phase 2a) | 🔄 Next | Unblocked — US-017 + US-021 done |
| US-016 (Phase 2a) | ⏸️ Deferred | Awaits US-025 + US-026 |
| US-023: Driver / breakdown tile | ⏳ Ready | Composes US-021's row; no new row to write |

### Recently Completed

| Story | Completed | Points |
|-------|-----------|--------|
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

**Open human step (not a blocker):** the Railway deploy for US-001. The repo is deploy-ready —
run `railway login && railway init && railway up`, then record the shareable URL.

---

## 📈 Velocity & Timeline

**Current / Average Velocity:** - points/day · **Velocity Trend:** N/A (insufficient data)

**Projected Completion:** 2026-09-15 (8h/day) · 2026-09-11 (24/7)
**Target Completion:** end of this week — sponsor showing follows
**Timeline Status:** 🟢 On Track

> ⚠️ One scenario misses: at **8h/day weekdays only**, AI-realistic lands 2026-09-20, past the
> deadline. The lever is hours per day, not scope — the entire P1 cut set is worth only 0.82 days.

---

## 🧪 Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage (`app/**`) | 100% stmts / 99.6% branches / 100% funcs | 80% | 🟢 Good |
| Passing Tests | 777/777 | TBD | 🟢 Good |
| TypeScript Errors (strict) | 0 | 0 | 🟢 Good |
| ESLint Problems | 0 errors, 0 warnings | 0 errors | 🟢 Good |
| Dependency Advisories | 0 | 0 high/critical | 🟢 Good |
| Open Bugs | 0 | < 5 | 🟢 Good |

> Coverage is measured over `app/**` only (531 statements), and the suite is substantive rather than
> hollow: it pins every hex, the type scale and the colour discipline, fails the build if
> `app/app.css` and `app/lib/tokens.ts` ever disagree, and asserts structurally that no
> reduced-motion path can leave an element stranded at zero. The data suites pin the Specification
> baseline figures, prove every total is *derived* from its series, force the four sponsor badge
> segments to sum exactly to their total at every total from 0 to 2,000, keep Hero 2's two
> deliberately different scope labels apart, and show that a naive "variance > 0 is good" rule
> misreads exactly one department — so the Revenue/Cost tag cannot be dropped unnoticed. US-011
> closes them with a cross-dataset reconciliation suite that sweeps every number in all six hero
> narratives against the data and pins formatter output glyph by glyph, ICU stubbed. The component
> suites test the same way: the two variance directions must stay distinguishable with the colour
> *removed* (US-017), and US-021's two review decisions are read back off the rendered element —
> 150px, no truncation class, 96px, `nowrap`. Since US-002 the gate is three-part: strict `tsc`,
> ESLint 9 flat config and Prettier, the last two enforced on every commit by husky + lint-staged.

---

## 📊 Phase Breakdown

| Phase | Status | Stories | Points | Progress |
|-------|--------|---------|--------|----------|
| Phase 1a: Setup & Design System | ✅ Completed | 6/6 | 14/14 | 100% |
| Phase 1b: Seed Data | ✅ Completed | 5/5 | 10/10 | 100% |
| Phase 2a: Shell & Baseline | 🔄 Partial | 3/5 | 8/16 | 50% |
| Phase 2b: Component Library | 🔄 In Progress | 3/11 | 8/29 | 28% |
| Phase 3a: Conversation | ⏸️ Pending | 0/6 | 0/17 | 0% |
| Phase 3b: Heroes | ⏸️ Pending | 0/6 | 0/16 | 0% |
| Phase 4: Hardening | ⏸️ Pending | 0/6 | 0/14 | 0% |

---

## 🔗 Quick Links

- **[Current Phase Plan](../phases/phase-2b.md)** - Phase 2b, Chart & Tile Component Library
- **[Phase 2a Plan](../phases/phase-2a.md)** - Partial (3/5); US-013 + US-016 run with Phase 2b
- **[Phase 1b Plan](../phases/phase-1b.md)** - Completed 2026-09-09
- **[Phase 1a Plan](../phases/phase-1a.md)** - Completed 2026-09-09
- **[Backlog](../../input/backlog/)** - All project backlogs
- **[Detailed Status](current-status.md)** - Full status report
- **[Completed Work](completed.md)** - Complete history
- **[Blockers](blockers.md)** - All blockers
- **[Effort Estimate](../reports/ai-hours-estimate-2026-09-09.md)** - AI-hours projection

---

**💡 Tip:** This file updates automatically during `/execute-work`. Just refresh to see latest progress!

**Last Auto-Update:** US-021 completed at 2026-09-09 — Phase 2b at 3/11 · 8/29 pts. The shared horizontal bar row now holds the 150px no-truncate label and the 96px `nowrap` value column for all five of its consumers, and US-023 composes it rather than reimplementing it; next is US-013, the deferred Phase 2a baseline, now unblocked
