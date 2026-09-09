# Completed Work Log

**Last Updated:** 2026-09-09

---

## Summary

**Total Completed:** 16 stories
**Total Points:** 37 / 116
**Start Date:** 2026-09-09
**Days Active:** 1
**Average Velocity:** 37 points/day
**Phases Completed:** Phase 1a, Phase 1b (both 2026-09-09)

---

## Completed Stories

## Phase 1a: Setup & Design System — closed 2026-09-09 (6 stories · 14 pts)

Condensed to keep this log inside its 300-line limit; the **full per-story detail lives in
[`../phases/phase-1a.md`](../phases/phase-1a.md)**, which is the authoritative record.

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-001 Environment & deployment setup | 3 | 8 | React Router 7.18 SSR + Vite 6 + Tailwind v4 + strict TS, prototype-only dependency set. From a clean checkout, install/build/serve returns SSR markup with no env var and no database. **The Railway deploy itself remains a human step.** |
| US-002 Developer tooling & local DX | 2 | 0 | ESLint 9 flat config, Prettier with Tailwind class sorting, husky + lint-staged — the pre-commit hook proved to fire by throwaway commits. |
| US-003 Design token set | 3 | 88 | One token set: Tailwind v4 `@theme static` properties in `app/app.css` mirrored as typed objects in `app/lib/tokens.ts`, held in lockstep by a `var()`-resolving parity test. Colour discipline encoded in the token *names* — gold limited to two accent roles, `varianceNegative` kept separate from `red`. |
| US-004 Self-hosted FCB crest | 1 | 10 | The club's `logo.webp` serves **PNG bytes**; the bytes were trusted over the extension. Stored as `public/fcb-crest.png` at 120x128, 194,518 → 17,908 bytes via `sips`, no image dependency. Nothing in `build/` matches `fcb.ch`. |
| US-005 Tile card anatomy | 2 | 38 | `app/components/tiles/card.tsx` — one `Card` shell (plus `CardCaption`) that every 2b tile and 3b hero composes. **Slots, not variants**; `accent` takes a token name so no hex can reach a tile; `isNew` / `delayMs` are hooks only. |
| US-006 Tile-insertion motion & reduced-motion | 3 | 37 | The four reveal keyframes (`fcbUp`, `fcbGlow`, `fcbScan`, `fcbSrc`) defined once and timed from motion tokens, plus `app/lib/motion.ts` (`MOTION_CLASS`, `REDUCED_MOTION_QUERY`, `animateReflow`, `viewTransitionName`). **Reduced motion renders final state, not "no animation"** — an unlayered block collapses every animation to ~1ms on `*`. Fade-and-rise only; no gold ring, guarded structurally. |

---

## Completed Stories *(Phase 1b onward)*

### US-007: Persona baseline datasets (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 14 (9 code, 5 tracking docs)
**Tests Added:** 47 (unit: 47)
**Commit:** see phase-1b progress log
**Notes:** All 4 criteria met; the set **intentionally exceeds them** (user-approved) - the criteria
describe one period, the Reference Guide drives all four.

**What Was Done:** *(full detail in the phase-1b progress log)*
- Established the data seam the rest of E3 follows (`app/lib/repositories/README.md`): enums, types,
  `derive.ts`, fixtures in `app/lib/mock/`, selection in `index.server.ts`. Domain types, not storage
  shapes; every method returns a `Promise`; money is a plain number
- Four periods of webshop revenue with comparison series, attendance per period, the four-period
  top-products table and the six partners
- **Totals and deltas are computed, never stored** — `seriesTotals` sums the same arrays the chart
  plots, so a headline figure cannot disagree with its own chart; the two long periods derive their
  x-axis labels from an injectable `Clock`, so the demo never looks stale. Store-once proved by test:
  last month's revenue series *is* this month's comparison series
- The four Specification-pinned figures asserted exactly: CHF 148,200 at +11.9%, FCB 2-1 Sion at
  28,900 of ~38,000, five product lines, 6 partners (47 tests, 228/228; gates clean)

### US-008: Hero 1 dataset - shirt sales, badges, printed names (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 9 (2 new, 7 modified)
**Tests Added:** 45 (unit: 45)
**Commit:** see phase-1b progress log
**Notes:** Delivered set intentionally **exceeds the written acceptance criteria** (user-approved):
all four periods, not only season-to-date - the tile's period switch must have data behind it.

**What Was Done:** *(full detail in the phase-1b progress log)*
- Followed the US-007 recipe exactly: `SEASON_TO_DATE` + a `KitVariant` enum, domain types and
  `Hero1Repository`, derived figures, fixtures, one line of selection. One hero object with
  `primary` and `followUp` so tile and escalation cannot drift apart
- **Nothing derivable is stored.** Kit revenue is units x CHF 99, the Home share 22,400 / 38,500 =
  58.18% (displays 58%), the badge share exactly 8%. The Guide's stored `homeShare: 58` did not
  survive the port - it can outlive an edit to its units
- `badgeSegments(total, split)` corrects its rounding remainder into the first segment, proved by an
  exhaustive sweep (every total 0-2,000, all four period totals, adversarial primes). Arithmetic
  asserted: 22,400 + 10,300 + 5,800 = 38,500 shirts; CHF 3,811,500 (~3.81M); 44/24/20/12 = 100
- Both narratives **verbatim** (SHA-256 pinned). Guardrail held: squad names appear only as
  printed-name counts, and a test asserts no salary, goals, assists, minutes or rating exists
  anywhere in the app (45 tests, 273/273)

### US-009: Hero 2 dataset - ticket revenue year on year (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 10 (2 new, 8 modified)
**Tests Added:** 31 (unit: 31)
**Commit:** see phase-1b progress log
**Notes:** Delivered set intentionally **exceeds the written acceptance criteria** (user-approved):
the month-by-month series is a Reference Guide addition the tile draws.

**What Was Done:** *(full detail in the phase-1b progress log)*
- Followed the US-007 four-step recipe: new `SeasonKey` and `MonthKey` enums with label maps, domain
  types and `Hero2Repository`, derived figures, fixtures, one line of selection
- Eight home fixtures in CHF thousands, 25/26 -> 26/27: YB 1,480/1,610; FCZ 1,390/1,240; Servette
  980/1,050; St. Gallen 1,020/1,090; Luzern 890/820; Sion 760/690; GC 640/720; Lugano 720/610
- **The two charts are at different scopes on purpose, and the data says so.** `scopeLabel` is a
  field on each series - eight highest-grossing fixtures (7,880 -> 7,830) against all home fixtures
  per month (9,880 -> 9,770), both excluding the season-ticket base. Tests assert the labels exist,
  differ, and that the monthly total is the larger, so the gap reads as scope, not as a bug
- **Nothing derivable is stored.** The Guide's `totalPrev`, `totalCurr`, `deltaPct` and second
  `declines` list did not survive the port: totals come from `seriesTotals` (-50 / 7,880 = -0.6%),
  and `fixtureDeclines` recovers FCZ -150, Lugano -110, Luzern -70, Sion -70 (stable sort) with
  `declineTotal` producing the tile's -CHF 400k badge
- One hero object with `primary` and `followUp`; the follow-up carries only its narrative - its four
  fixtures *are* the primary's, seen through `fixtureDeclines`
- Both narratives **verbatim**, pinned by exact text, exact length (229 / 338) and an ASCII range
  check. `MONTH_LABEL` is pinned to the baseline band's `Intl`-derived month names, so the two
  spellings of "Jul" cannot diverge
- Guardrail held: fixtures are clubs, and a test asserts no squad name, salary or performance figure
  appears anywhere in the dataset (31 tests, 304/304 green; all gates clean)

### US-010: Hero 3 dataset - departmental performance (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 6 (2 new, 4 modified) + 5 tracking docs
**Tests Added:** 44 (unit: 44) - 348/348 green, 100% stmts / 98.7% branches of `app/**`
**Commit:** see phase-1b progress log
**Notes:** Fourth pass through the US-007 recipe; the new idea is that a TAG carries meaning.

**What Was Done:**
- Six departments, CHF thousands, Revenue or Cost: Sponsoring 21,000/21,840/104%; Ticketing
  24,000/24,360/102%; Hospitality 7,200/6,840/95%; Merchandising 9,800/9,050/92%; Events
  3,600/3,780/105%; Marketing **(Cost)** 3,400/3,810/84%
- **Revenue vs Cost is modelled so a consumer cannot get it wrong.** `varianceJudgement` decides
  good-or-bad ONCE from the `DepartmentType`: Marketing's +410 is `ADVERSE` (an overspend) where
  Sponsoring's +840 is `FAVOURABLE`; a test proves a naive "variance > 0" rule misreads one row
- **The flag is derived, not stored** - `departmentsNeedingAttention` finds exactly one row both
  over budget *and* behind target; the Guide's `flag: true` did not survive the port. Totals derived
  too: 69,000 -> 69,680, +680, +1.0% through the same `percentChange`; the one stored figure is
  `blendedTargetPercent: 96`, which no arithmetic over the rows gives
- **The follow-up reconciles with the table:** 240 + 150 + 20 = 410, exactly Marketing's variance;
  narratives **verbatim**; guardrail held - departments, never people

### US-011: Formatters & cross-hero reconciliation (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 (3 new, 3 modified) + 5 tracking docs
**Tests Added:** 70 (unit: 70) - 418/418 green, 100% stmts / 98.9% branches of `app/**`
**Commit:** see phase-1b progress log
**Notes:** **Closes Phase 1b** (5/5 stories, 10/10 points). No drift found in any dataset.

**What Was Done:**
- `app/lib/format.ts` - the one place a number becomes a string. Money always carries `CHF`, the
  **sign goes before the unit** (`-CHF 400k`). `Intl.NumberFormat("en-CH")` (Swiss U+2019 mark) is
  pinned as a constant and made **independent of the runtime's ICU**, proved by tests that stub
  `Intl` to `en-US` and `de-DE`. **One rounding rule:** `oneDecimal` imported from `derive.ts`
- `tests/unit/reconciliation.test.ts` (39 tests) asserts **relationships, not constants** - every
  split against its total in all four periods, every derived delta, Marketing's drivers summing to
  its variance, the cross-hero inequality, and every number in all six narratives swept against the
  reachable data. **No drift found**

### US-012: Branded application shell (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 7 code (4 new, 3 modified) + 5 test files + 6 tracking docs
**Tests Added:** 57 net (unit: 57) - 475/475 green, 100% stmts / 98.9% branches of `app/**`
**Commit:** see phase-2a progress log
**Notes:** Scope held to the frame. Baseline tiles (US-013), insertion (US-014), reset behaviour
(US-015) and the hero band (US-016) deliberately not built - the canvas is left empty for them.

**What Was Done:**
- `chrome/{sidebar,top-bar,app-shell}.tsx` + `lib/persona.ts`: navy sidebar (hidden below `lg`), app
  bar with the self-hosted crest, "Sales & Marketing", decorative status and Reset, and a 12/8/4
  column canvas grid. No literal colour anywhere - tests pin that
- **Persona is a role:** the label and the "SM" monogram live in one module, and a test asserts the
  app bar's entire text is exactly those labels. No photo - the crest is the only `<img>`
- **Placeholders inert structurally, not by handler:** `<span aria-disabled="true">`, no href, no
  role, no handler, no focus, `pointer-events-none`. Real Chrome: `tabIndex` -1, a synthesised click
  leaves the router at `/`; a source guard bans a `hover:` rule
- **Status is decorative:** static text, `data-decorative`, no live region, and source assertions
  that the file holds no `fetch`, `axios`, `useEffect` or timer. 1920x1080 in Chrome:
  `scrollWidth === clientWidth` (also at 1280 / 900 / 390)

### US-014: Dynamic tile insertion & grid reflow (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 code (4 new, 4 modified) + 5 test files + 7 tracking docs
**Tests Added:** 77 (unit: 77) - 552/552 green, 100% stmts / 99.1% branches of `app/**`
**Commit:** see phase-2a progress log
**Notes:** The mechanic the demo turns on: the dashboard **grows, it never clears**. Hero content is
a marked placeholder - tiles are Phase 2b, narratives Phase 3b.

**What Was Done:**
- `lib/dashboard/sections.ts` (pure) + `use-dashboard.ts` (state, owned by `root.tsx`): the session
  as a memory-only `{heroId, phase, revision}` list - append, refresh-in-place, flip-phase
- **Dedupe by hero id:** re-asking keeps ONE section in its original position and bumps `revision`
  (changing the React key, so it re-inserts rather than doing nothing); a section already showing
  its follow-up never regresses. A follow-up **flips** its parent's phase - what US-033 needs
- **One grid, not two:** sections are direct children of the US-012 canvas grid and re-use its
  tracks via `grid-cols-subgrid`. Chrome at 1920x1080: tracks 122.656px, tiles 816px at x=256/1088
- **Reflow, never jump:** every mutation runs through US-006's `animateReflow` with `flushSync`
  inside the transition callback; Chrome shows `::view-transition-group(fcb-tile-HERO_1)` animating
  as a second section inserts. Under reduced motion: zero transitions, identical final layout.
  **Auto-scroll:** `scrollY` 0 -> 154 at 1280x620 as the third section overflowed, section 1 present
- **No persistence:** a source scan over `app/**` bans `localStorage`, `sessionStorage`, `indexedDB`
  and `document.cookie`; a remount test shows the session starting empty, as a reload does

### US-015: Reset to baseline (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 6 code (all modified) + 4 test files + 8 tracking docs
**Tests Added:** 40 (unit: 40) - 592/592 green, 100% stmts / 99.2% branches / 100% funcs of `app/**`
**Commit:** see phase-2a progress log
**Notes:** 3 of 5 criteria fully met; **criterion 2 (chips, US-029) and half of criterion 4 (the
thinking beat, US-031) are a SEAM, not a claim**, criterion 1's four tiles are US-013 (deferred).
Nothing was invented to make an unbuilt criterion look done.

**What Was Done:**
- Reset is a **transition beside the other three**: `withBaselineRestored` / `BASELINE_SECTIONS` in
  `sections.ts` (pure), `reset` + `schedule` + `generation` on `use-dashboard.ts`, `scrollToTop` in
  `motion.ts`, `<AppShell onReset={reset}>` in `root.tsx`. It restores the same named constant that
  is the hook's initial state, so **nothing says "empty"** and US-013 gets reset for free
- **The timer, proven by breaking it:** `reset` cancels the single pending beat *first*; deleting
  that line makes two tests fail with a `HERO_2` section landing in a just-cleared dashboard
- **Abuse-proof by construction:** `withBaselineRestored` returns the *same reference* when there is
  nothing to clear, so 10 presses in one frame run **one** transition and an empty-canvas press
  runs none. Real Chrome: `scrollY` 900 -> 0 over three rapid presses, three scroll requests, zero
  `startViewTransition` calls, `behavior: "auto"` throughout under reduced motion

### US-027: Motion & animation hooks (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 4 code (1 new, 3 modified) + 3 test files + 5 tracking docs
**Tests Added:** 52 (unit: 52) - 644/644 green, 100% stmts / 99.4% branches / 100% funcs of `app/**`
**Commit:** see phase-2b progress log
**Notes:** All 4 acceptance criteria met. **Built first in Phase 2b on purpose** — the other ten E6
components consume these hooks, so the API was designed for them and documented in the module
header (the precedent US-007 set with `app/lib/repositories/README.md`).

**What Was Done:**
- `app/lib/hooks/use-motion.ts` (the `lib/hooks/` slot the technical spec reserved):
  `useReducedMotion()`, `useGrow()`, `useCountUp(target, animationMs?)`, `useUid(prefix?)`
- **Count-up counts from the CURRENT DISPLAYED VALUE.** The figure on screen is mirrored in a ref as
  each frame commits it and read (never depended on) when the target changes, so a filter switched
  mid-animation carries on from the old number. Tests prove the retargeted animation's *opening
  sample is* the mid-flight figure, that it climbs monotonically from there, that it never dips, and
  that it lands **exactly** on the target — upwards and downwards both
- **Reduced motion = final state in the same render.** `useGrow` returns `grown || reduced` and
  `useCountUp` returns `reduced ? target : displayed`, so `width={grown ? w : 0}` geometry and every
  KPI number are final the moment the preference is read: under the preference `useGrow` is `true`
  on the first render with **zero** frames requested. US-006's CSS rule, restated in JS
- **One reduced-motion source:** `motion.ts` gained `reducedMotionQuery()` and `prefersReducedMotion`
  now reads through it; the hook subscribes via `useSyncExternalStore` (explicit server snapshot,
  React owns the unsubscribe) and reacts to a *change*, not just the value at mount. A test greps the
  comment-stripped hook source and fails if it ever calls `matchMedia` itself
- **Nothing outlives a component:** every rAF, fallback timer and media listener cancelled on
  unmount, asserted per hook and once with ten tiles unmounted mid-count
- ~900ms is now the `duration.countUp` token (`--duration-count-up`, parity-tested) read as a number
  through a new `tokens.durationMs()`; `cssIdentifier` was extracted from `viewTransitionName` and is
  shared with `useUid`, so an SVG gradient id is always legal in `url(#…)` and in a selector
- **SSR proven, not asserted:** a `renderToString` with `window` and the frame APIs stubbed away,
  plus a real `hydrateRoot` pass that fails on any `console.error` — including under reduced motion

### US-017: KPI tile & variance chip (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 3 code (2 new, 1 modified) + 4 test files (3 new, 1 modified) + 5 tracking docs
**Tests Added:** 78 (unit: 78) - 722/722 green, 100% stmts / 99.5% branches / 100% funcs of `app/**`
**Commit:** see phase-2b progress log
**Notes:** All 3 acceptance criteria met. **No real-Chrome pass** — nothing in the app mounts these
components yet; the browser verification belongs to US-013, the first screen that does.

**What Was Done:**
- `app/components/tiles/delta-chip.tsx` — `DeltaChip`, its own module because US-019, US-022 and
  US-016 all want the chip without a tile around it. `app/components/tiles/kpi-tile.tsx` —
  `KpiSparkline`, `KpiFigure` (the number block, no card) and `KpiTile` (`Card` + figure)
- **Colour is never the sole signal, and the `light` variant is where that is proved.** On navy the
  negative token sits near 2:1, so the light variant drops colour coding entirely — a test asserts
  the up and down chips' class strings are **identical** there while the glyph, the explicit sign
  from `formatSignedPercent` and an `sr-only` direction word all still differ. `text-red` on the chip
  is rejected by test: red never means "bad"
- **Direction is arithmetic; judgement is meaning.** An optional `judgement` prop (US-010's
  `varianceJudgement`) gives Marketing's overspend an **up arrow in the negative token**; the chip
  never re-derives good/bad from the sign. A zero is a **labelled zero** — dash glyph, `+0%` in house
  style, neutral treatment, "unchanged" spoken — never a variance token
- **One API, three consumers, no variant per hero:** hero extras (Hero 2's compare bars, Hero 3's
  two-up footer) arrive as `children`; US-016's navy band composes `KpiFigure onDark`, which forces
  the chip's light variant so an illegible red figure cannot be left on navy. All three verified
- The 30px/700/tight/tabular number is the existing `.kpi-number` role class, not four utilities
  restated. Motion is US-027's only — a test greps the comment-stripped source and fails on
  `useState`, `setTimeout`, `setInterval` or `requestAnimationFrame`, and the retarget test proves a
  new value continues from the figure on screen at the *component* level
- The sparkline draws itself via `pathLength="1"` + a dash offset (no path measurement, no per-frame
  JS), paints with `currentColor` so no colour prop exists, and handles the degenerate series rather
  than emitting `NaN` into a `d`: empty renders nothing, flat draws through the middle, one point
  reads as a flat line. Two on screen carry different gradient ids (`useUid`)
- **Closed the US-012 `tailwind-merge` trap at the root:** `app/lib/cn.ts` declares the named type
  scale as the `font-size` group, **derived** from `tokens.fontSize` via the same `cssVariableName`
  mapping Tailwind builds the utility from, so it cannot drift. Two sizes still collapse, two colours
  still collapse, a caller can still override a base size
- Extracted `tests/unit/support/motion-harness.ts` (the frame and preference stubs) — the nine
  remaining component stories all need them, so there is one harness rather than nine copies

---

**Auto-Generated** | Updates during `/execute-work` | Append-only log
