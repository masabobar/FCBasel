# Completed Work Log

**Last Updated:** 2026-09-09

---

## Summary

**Total Completed:** 23 stories
**Total Points:** 59 / 116
**Start Date:** 2026-09-09 · **Days Active:** 1 · **Average Velocity:** 59 points/day
**Phases Completed:** Phase 1a, Phase 1b, Phase 2a (all 2026-09-09)

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

## Phase 1b: Seed Data — closed 2026-09-09 (5 stories · 10 pts)

Condensed to keep this log inside its 300-line limit; the **full per-story detail lives in
[`../phases/phase-1b.md`](../phases/phase-1b.md)**, which is the authoritative record.

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-007 Persona baseline datasets | 2 | 47 | The data seam the rest of E3 follows (`app/lib/repositories/README.md`): enums, domain types, `derive.ts`, fixtures in `app/lib/mock/`, server-only selection. Every method returns a `Promise`; money is a plain number. **Totals and deltas are computed, never stored** — `seriesTotals` sums the same arrays the chart plots. Four Specification figures pinned exactly: CHF 148,200 at +11.9%, FCB 2-1 Sion at 28,900 of ~38,000, five product lines, 6 partners. Delivered set intentionally exceeds the written AC (user-approved): all four periods. |
| US-008 Hero 1 dataset | 2 | 45 | Season-to-date merchandising across all four periods. Nothing derivable is stored: kit revenue is units × CHF 99, the Home share 22,400/38,500 = 58.18% (displays 58%), the badge share exactly 8%; the Guide's stored `homeShare: 58` did not survive the port. `badgeSegments` corrects its rounding remainder into the first segment, proved by an exhaustive 0–2,000 sweep. Both narratives verbatim (SHA-256 pinned); no salary or named-individual performance figure anywhere. |
| US-009 Hero 2 dataset | 2 | 31 | Eight home fixtures year on year plus the Guide's twelve-month series. **The two charts sit at different scopes on purpose and the data says so** — `scopeLabel` is a field, and tests assert the labels differ and that the monthly total is the larger, so the gap reads as scope rather than a bug. Totals, the -0.6%, the four declining fixtures and the -CHF 400k badge are all derived. Narratives pinned by text, length and ASCII range. |
| US-010 Hero 3 dataset | 2 | 44 | Six departments, each tagged Revenue or Cost — and the tag is load-bearing: `varianceJudgement` decides good-or-bad ONCE from `DepartmentType`, so Marketing's +410 is `ADVERSE` where Sponsoring's +840 is `FAVOURABLE`, and a test proves a naive "variance > 0" rule misreads one row. The attention flag is derived, not stored. The follow-up reconciles: 240 + 150 + 20 = 410, exactly Marketing's variance. |
| US-011 Formatters & reconciliation | 2 | 70 | `app/lib/format.ts` — the one place a number becomes a string. Money always carries `CHF`, the **sign goes before the unit** (`-CHF 400k`), and `en-CH` output is pinned **independent of the runtime's ICU**, proved by stubbing `Intl` to `en-US` and `de-DE`. One rounding rule, imported from `derive.ts`. `reconciliation.test.ts` asserts **relationships, not constants** across all three heroes — no drift found. Closes Phase 1b. |

---

## Phase 2a: Shell & Baseline — closed 2026-09-09 (5 stories · 16 pts)

US-012 to US-015 condensed to keep this log inside its 300-line limit; the **full per-story detail
lives in [`../phases/phase-2a.md`](../phases/phase-2a.md)**, the authoritative record. US-016's
entry stays in full below the table — it is the story that closed the phase.

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-012 Branded application shell | 3 | 57 | `chrome/{sidebar,top-bar,app-shell}.tsx` + `lib/persona.ts` — navy sidebar (hidden below `lg`), app bar with the self-hosted crest, and a 12/8/4 canvas grid left **empty** for US-013/014/015/016. No literal colour anywhere. **Persona is a role:** one module holds the label and the "SM" monogram, and a test asserts the app bar's entire text is exactly those labels. **Placeholders are inert structurally, not by handler** (`aria-disabled`, no href, no focus, `pointer-events-none`); status is decorative — no live region, no `fetch`, no timer. Chrome: `scrollWidth === clientWidth` at 1920x1080. |
| US-014 Dynamic tile insertion & grid reflow | 3 | 77 | `lib/dashboard/sections.ts` (pure) + `use-dashboard.ts` (state, owned by `root.tsx`): the session as a memory-only `{heroId, phase, revision}` list. The dashboard **grows, it never clears**. **Dedupe by hero id** — re-asking keeps ONE section in place and bumps `revision` so it re-inserts rather than doing nothing, and a follow-up *flips* its parent's phase (what US-033 needs). **One grid, not two:** sections re-use US-012's tracks via `grid-cols-subgrid`. **Reflow, never jump** — every mutation runs through `animateReflow` with `flushSync` inside the callback; reduced motion gives zero transitions with an identical layout. A source scan bans every storage API. |
| US-013 Baseline dashboard — four tiles | 3 | 103 | `dashboard/baseline-row.tsx` + `tiles/partner-tile.tsx` + `lib/dashboard/baseline.ts` + a `loader` on `_index.tsx`: **the canvas stops being empty.** Four tiles in order as direct children of the one canvas grid, composing `KpiTile` ×2, `HBarTile` and `PartnersTile` — no new tile kind, no second grid. **No figure re-typed:** every string asserted equal to `repository → derive → format.ts`, plus a source scan over four files for literals, `CHF`/`%` strings, product and partner names and `toLocaleString`/`toFixed`. `trendEndingAt` makes the sparkline END on the month the headline covers. Partner plates carry the partner's **own** brand colour (no hex, no FCB token in the file). Reset's baseline seam closed as static route chrome, driven end to end by a test. First real-Chrome pass for US-017/US-021/US-027. |
| US-015 Reset to baseline | 2 | 40 | Reset built as a **transition beside the other three**: `withBaselineRestored` / `BASELINE_SECTIONS`, `reset` + `schedule` + `generation`, `scrollToTop`, `<AppShell onReset>`. It restores the same named constant that is the hook's initial state, so **nothing says "empty"** and US-013 gets reset for free. **The timer, proven by breaking it:** `reset` cancels the pending beat *first*; deleting that line makes two tests fail with a `HERO_2` section landing in a just-cleared dashboard. **Abuse-proof by construction** — the same reference comes back when there is nothing to clear, so 10 presses in one frame run **one** transition. 3 of 5 criteria met; the chips (US-029) and half the thinking beat (US-031) are a stated SEAM, not a claim. |

---

### US-016: Hero band — webshop trend & attendance ring (5 pts)
**Completed:** 2026-09-09 (Phase 2a story, executed in the Phase 2b run once US-025/026/027 existed) — **it closes Phase 2a at 5/5 · 16/16 pts**
**Files Changed:** 13 code/test + 7 tracking docs · **Tests Added:** 92 — 1090/1090 green, 99.75% stmts / 100% lines of `app/**`
**Notes:** All 6 acceptance criteria met, **plus** the loose end US-013 left (Top Products' period
filter). Full detail in [`../phases/phase-2a.md`](../phases/phase-2a.md).

**What Was Done:**
- `dashboard/hero-band.tsx` — greeting, ONE period filter, the webshop chart in the wider left
  column, the ring and its stats in the narrower right one. It **composes** `Segmented`,
  `LineChart` + `LineChartLegend`, `KpiFigure onDark`, `DeltaChip` and the US-027 hooks, inventing
  only layout, copy and one piece of state (a test asserts no `<svg>`, no timer, no rAF in the file)
- `charts/attendance-ring.tsx` — **the one genuinely new visual.** Hand-built SVG: pure
  `ringGeometry` (clamped to 0–1; a non-finite share draws nothing rather than `NaN`), the sweep a
  `stroke-dasharray` transition off `useGrow`, the centre counting through `useCountUp`, and a hover
  that swaps average attendance for "% of capacity" **and answers focus identically**
- `lib/persona.ts` gained `personaGreeting(now)` — it takes the DATE, so server and browser cannot
  disagree about the hour; `HeroBandData` holds **no total and no delta**, so nothing can be read
  instead of computed
- **① One control, two widgets, proven twice** — structurally (exactly one `useState`, one
  `<Segmented>`) and behaviourally (one click moves the line, the KPI, the arc and the stats)
- **⑤ / ⑥ measured in real Chrome at 1920×1080:** no horizontal scroll (nor 1440/1280/834/390), the
  KPI **still `CHF 148’200` in the frame after the click** then 54 distinct strings to `CHF 132’400`,
  the re-keyed line's offset 1px → 0px, 43 arc dash pairs on the SAME element; under reduced motion
  one KPI string and one ring value. **One real defect found and fixed in `LineChart`:** its end axis
  labels were clipped by the svg's bounds, so `axisLabelAnchor` anchors the first and last inwards
- **Security triage: no security-relevant changes detected** — no handler/route change, no SQL, no
  `innerHTML`, no network call, no upload, no dependency or env change, no logging

---

## Phase 2b: Component Library — stories in full (7/11)

### US-027: Motion & animation hooks (3 pts)
**Completed:** 2026-09-09
**Files Changed:** 4 code (1 new, 3 modified) + 3 test files + 5 tracking docs · **Tests Added:** 52 - 644/644 green, 100% stmts / 99.4% branches of `app/**`
**Notes:** All 4 acceptance criteria met. **Built first in Phase 2b on purpose** — the other ten E6
components consume these hooks, so the API was designed for them and documented in the module header.

**What Was Done:**
- `app/lib/hooks/use-motion.ts`: `useReducedMotion()`, `useGrow()`, `useCountUp(target, ms?)`,
  `useUid(prefix?)`
- **Count-up counts from the CURRENT DISPLAYED VALUE** — mirrored in a ref and read (never depended
  on) when the target changes, so a filter switched mid-animation carries on from the old number and
  lands **exactly** on target, upwards and downwards
- **Reduced motion = final state in the same render**, so `width={grown ? w : 0}` geometry is never
  stranded at zero — under the preference `useGrow` is `true` on render one with **zero** frames
- **One reduced-motion source** (US-006's query via `useSyncExternalStore`, reacting to a *change*);
  a source scan fails if a component ever calls `matchMedia` itself, and every rAF, timer and
  listener is cancelled on unmount. ~900ms is the `duration.countUp` token; **SSR proven** by
  `renderToString` plus a real `hydrateRoot` pass

### US-017: KPI tile & variance chip (2 pts)
**Completed:** 2026-09-09
**Files Changed:** 3 code (2 new, 1 modified) + 4 test files (3 new, 1 modified) + 5 tracking docs
**Tests Added:** 78 (unit: 78) - 722/722 green, 100% stmts / 99.5% branches / 100% funcs of `app/**` · **Commit:** see phase-2b progress log
**Notes:** All 3 acceptance criteria met. **No real-Chrome pass** — nothing in the app mounts these
components yet; the browser verification belongs to US-013, the first screen that does.

**What Was Done:**
- `app/components/tiles/delta-chip.tsx` — `DeltaChip`, its own module because US-019, US-022 and
  US-016 all want the chip without a tile around it. `app/components/tiles/kpi-tile.tsx` —
  `KpiSparkline`, `KpiFigure` (the number block, no card) and `KpiTile` (`Card` + figure)
- **Colour is never the sole signal, and the `light` variant proves it:** on navy a test asserts the
  up and down chips' class strings are **identical** while glyph, explicit sign and an `sr-only`
  direction word still differ; `text-red` on the chip is rejected by test
- **Direction is arithmetic; judgement is meaning** — an optional `judgement` prop (US-010's
  `varianceJudgement`) gives Marketing's overspend an **up arrow in the negative token**; a zero is a
  **labelled zero**. No variant per hero: extras arrive as `children`, and `KpiFigure onDark` serves
  the navy band. Motion is US-027's only (a source scan bans local timers and frames)
- **Closed the US-012 `tailwind-merge` trap at the root:** `app/lib/cn.ts` declares the named type
  scale as the `font-size` group, **derived** from `tokens.fontSize`, so it cannot drift
- Extracted `tests/unit/support/motion-harness.ts` — one harness for the nine stories that follow

### US-021: Horizontal bar tile (3 pts)
**Completed:** 2026-09-09
**Files Changed:** 1 code (new) + 1 test file (new) + 5 tracking docs
**Tests Added:** 55 (unit: 55) - 777/777 green, 100% stmts / 99.6% branches / 100% funcs of `app/**` · **Commit:** see phase-2b progress log
**Notes:** All 4 acceptance criteria met. The most reused chart in the product — five consumers, one
row. **No real-Chrome pass** for the same reason as US-017: nothing mounted it yet. *(US-013 has
since given both stories their browser pass — see below.)*

**What Was Done:**
- `app/components/charts/h-bars.tsx` (the `components/charts/` slot the technical spec reserved) —
  `HBarRow` (the unit of reuse), `HBars` (the ranked list) and `HBarTile` (`Card` + rows). US-023 is
  required to compose these; there is nothing left in it to reimplement
- **Both review decisions are read back off the rendered element, not merely written:** the 150px
  weight-500 label column with `truncate` / `text-ellipsis` / `line-clamp` *rejected* by test (so
  `Cap "Rotblau"` cannot regain its reported ellipsis), and the 96px `nowrap` value column asserted
  through `getComputedStyle` on three lists with `-CHF 150k` a single text node
- **One rule serves all five consumers: the sign of the DISPLAYED figure** — it sets the anchor side,
  the token and the text sign, so `negative` mode is only "every row is a decline" (idempotent on a
  stored magnitude) and mixed signs need nothing extra. Direction is published as `data-direction`
- **Nothing snaps to zero:** rows keyed by name, so a data change transitions the *same* bar (100% →
  50%) while `useCountUp` carries on from the figure on screen; `hBarMax` / `hBarPercent` return zero
  width rather than `NaN`, so an all-zero list still renders **labelled zeros** with their tracks
- **One deliberate deviation from the reference, flagged for review:** a decline grows *leftwards*
  here (the reference drew every bar rightwards), so direction survives a washed-out projector

### US-025: Line chart component (3 pts)
**Completed:** 2026-09-09 · **Phase:** 2b · **Tests:** 73 new (953/953 green)

**Delivered:** `app/components/charts/line-chart.tsx` — the only line chart in the product, built for
both consumers at once. Four exports: `lineChartGeometry` (pure paths and coordinates),
`LineChartLegend` (standalone, because the hero band puts its legend in its own header row rather
than under the chart), `LineChart`, `LineChartTile`.

- **All five acceptance criteria met.** Variable series count with per-series `area` / `dash`; a
  legend listing every series, dashed swatch for a dashed line; a hover guide plus a tooltip showing
  **every** series' value at the hovered index; a stroke-draw entrance that replays on a re-key; a
  `dark` variant for the navy band; `viewBox` + `width="100%"`
- **The stroke draw survives reduced motion, and that is the load-bearing test.** A solid line
  normalises its own length (`pathLength="1"`) so the offset transitions 1 → 0 with no measurement
  and no per-frame JavaScript; under the preference a test reads `stroke-dashoffset="0"` with **zero
  frames requested**, and again after a re-key — never stranded awaiting a transition that will not
  run. A dashed line fades instead, at full opacity in that same first render
- **It replays by being re-keyed and by nothing else** — no `replay` prop, no effect watching the
  data: a re-key returns the offset to 1 and clears the guide, a data-only change leaves it drawn
- **Hover is the wrapper's, not the svg's** (the `viewBox` stretches the svg's units): the pure
  `hoverIndex` maps the pointer to the nearest index and the tooltip lists every series there through
  US-011. Keyboard came cheap — arrow/Home/End/Escape through the pure `nextHoverIndex`, which
  returns `null` for every other key, so Tab is not captured (tested)
- **No hex, and no colour parked where a CSS parser may drop it:** series colours are token names
  resolved to `var(--color-…)`, taken as presentation attributes and as a `--line-series` custom
  property on the swatches. Gradient ids come from `useUid`, proven distinct with both charts up
- **A zero or missing point is a labelled zero** (`valueAt` reads a hole as `0`, so no `NaN` enters
  a `d`). Legible at 1080p: 12px axis labels, a legend that wraps, a tooltip that flips at an edge
- **Security triage: no security-relevant changes detected** — considered and cleared: HTTP handler,
  IDOR, raw SQL, `dangerouslySetInnerHTML` (a test rejects it), SSRF, upload, dependency change
  (**none**), env var, logging, CSRF, storage. **No real-Chrome pass** here

### US-026: Segmented period filter control (2 pts)
**Completed:** 2026-09-09
**Files Changed:** 2 code (1 new, 1 modified) + 1 test file + 5 tracking docs
**Tests Added:** 45 (unit: 45) - 998/998 green, 100% lines / 100% funcs on the new file, 99.7% stmts / 98.5% branches of `app/**` · **Commit:** see phase-2b progress log
**Notes:** All 3 acceptance criteria met. **Designed for all three consumers, wired into none** —
mounting it belongs to US-016 and US-034, so US-013's `action` slot stays deliberately empty until
then. This story **unblocks US-016**, the last deferred Phase 2a story.

**What Was Done:**
- `app/components/controls/segmented.tsx` — `Segmented`, the pure `nextOptionIndex`, the closed
  `SEGMENTED_VARIANT_CLASS` table, and `CHIP_SURFACE_CLASS` for US-029's suggestion chips to reuse
- **11px is a reviewed decision and it is asserted three ways.** `--radius-chip: 11px` already
  existed, so nothing was redeclared: the group wears `rounded-chip`, each option the new `.fcb-chip`
  rule, and a test reads the radius back out of the stylesheet while rejecting `rounded-full` /
  `9999px` / `--radius-pill` in the markup, the source *and* the CSS. The lift is shared with
  US-029; the tint stays per surface — the only half that has to differ
- **`PeriodKey` reused, never re-declared:** `SegmentedOption` is structurally the head of the three
  period types, a `@ts-expect-error` line fails typecheck the moment the key loosens to `string`, and
  **the label is data on the entry** — what lets Hero 1 say "Current month" for `THIS_MONTH`
- **Controlled, with no opinion of its own** — a press the caller ignores changes nothing on screen
  (tested), which lets ONE control drive two tiles on the band or three on Hero 1
- **Radiogroup semantics, done properly:** ONE tab stop via roving `tabIndex`, wrapping arrows plus
  Home/End through the pure `nextOptionIndex` (which returns `null` for every other key, so Tab,
  Enter and Space keep their meaning), and **selection carried four ways, never colour alone**
- **Security triage: no security-relevant changes detected** — considered and cleared: HTTP handler,
  IDOR, raw SQL, `innerHTML`, SSRF, upload, dependency change (**none**), env var, logging, CSRF,
  storage. **Scope held:** nothing mounts the control until US-016

### US-018: Vertical bar chart tile (3 pts)
**Completed:** 2026-09-09
**Files Changed:** 1 code (new) + 1 test file (new) + 5 tracking docs
**Tests Added:** 52 (unit: 52) - 1142/1142 green, 100% lines / funcs / stmts on the new file (94.9% branches — both misses unreachable `?? "red"` fallbacks), 99.8% stmts / 98.3% branches of `app/**`
**Notes:** All 3 acceptance criteria met. Built for US-034's "Shirt sales by kit", which sits under a
section-level filter driving three tiles — the reason criterion 3 exists.

**What Was Done:**
- `app/components/charts/v-bars.tsx` — `vBarGeometry` (pure: slots, bar widths, gridlines, the
  `niceMax` axis top), `VBars` and `VBarTile` (`Card` + chart, card slots passing through) — three
  exports, matching the shape US-021 and US-025 set
- **Criterion 3 is proven by a RE-RANK, not a rerender.** Columns are keyed by category name, so a
  filter press hands `Home` the *same* `<rect>` and the `x` / `y` / `height` CSS transition carries
  it from the geometry on screen. Element identity is asserted across a data change **and** across a
  re-ordered dataset, each label is shown to stay with its own category, and **switching that key to
  the array index fails exactly two tests** — the defect stated as an assertion rather than prose.
  Because the instance survives, so does its `useCountUp` state: the figure counts on from what is
  displayed, never back from zero
- **Reduced motion is final state:** `useGrow` is `true` in the first render, so a test reads the
  final heights and figures with **zero frames requested** — no bar left at zero height
- Gradient fills with rounded caps, **one gradient per distinct token colour** with ids from `useUid`
  (two charts carry six distinct ids); gridlines behind, counting labels above, a `filter` hover
  highlight so the series colour is never swapped, and an **optional `tooltip(index)` renderer**
  (Hero 1's units + share + revenue) falling back to category + figure. Hover is also keyboard, and
  US-025's `tooltipAnchor` / `nextHoverIndex` are **imported, not restated**
- **Category labels are DOM text under the plot**, because SVG text cannot wrap — a test rejects
  `truncate` / `line-clamp`. `niceMax` / `vBarHeight` never yield `NaN`; a zero is a labelled zero;
  gold is absent from the series map by design; no hex or currency string appears in the file
- **Security triage: no security-relevant changes detected** — considered and cleared: HTTP handler,
  IDOR, raw SQL, `dangerouslySetInnerHTML`, SSRF, upload, dependency change (**none**), env var,
  logging, CSRF, storage. **One seam:** nothing mounts a vertical bar chart until US-034

### US-019: Grouped bar chart tile (3 pts)
**Completed:** 2026-09-09
**Files Changed:** 1 code (new) + 1 test file (new) + 5 tracking docs
**Tests Added:** 63 (unit: 63) - 1205/1205 green, **100% lines / funcs / stmts / branches on the new file**, 99.8% stmts / 98.4% branches of `app/**`
**Notes:** All 3 acceptance criteria met. Built for US-036's "Matchday ticket revenue by fixture
(CHF 000)" — eight fixtures, sixteen bars and eight chips in one tile, which is why criterion 2
exists.

**What Was Done:**
- `app/components/charts/grouped-bars.tsx` — `groupedBarGeometry` (pure: the gutter, the chip band,
  slots, pair placement, axis ticks, per-pair deltas), `GroupedBars` and `GroupedBarTile` (`Card` +
  chart) — the three-export shape US-018/US-021/US-025 set
- **Criterion 1:** two bars per fixture, previous 25/26 in navy and current 26/27 in club red (both
  from US-018's `V_BAR_SERIES` tokens, gradient-filled, round-capped), with US-017's `DeltaChip`
  above each pair — arrow, explicit sign and a spoken direction, so colour is never the sole signal
- **CRITERION 2 IS THE REVIEW DECISION, AND BOTH HALVES ARE MEASURED GEOMETRY.** The scale owns a
  44-unit **left gutter** (`plotLeft` is its right edge; every bar, chip cell, fixture label and
  legend row is inset to it), and a 34-unit **chip band** at the top of the plot is reserved for the
  chips. The band's emptiness is not a hope about round numbers: the axis maximum is **derived from
  the geometry** (`plotHeight / barZoneHeight`, fed to `niceMax`, which only rounds up), so no bar
  can enter it whatever the data. Tests compute rather than assume — no chip slot reaches the gutter
  and none overlaps its neighbour (verified at 8 pairs *and* at 14), the tallest bar's top clears
  `plotTop` by the full band across seven datasets × three heights, and the rendered strip's own
  inset and band height are read back off the DOM. **Replacing the derived factor with a fixed 10%
  fails the headroom test** (`previous: 500, current: 500` is the case that catches it), so the
  decision cannot be reverted silently. The chips are one flex strip of equal cells, so neighbour
  overlap is impossible by layout as well as by arithmetic
- **Criterion 3:** hovering a fixture's whole slot (not its bars, so a short fixture is as reachable
  as a tall one) shows both seasons *and* the delta, the last as the chip's `light` variant on the
  navy box; `role="status"`, keyboard-driven through `nextHoverIndex`, pinned by `tooltipAnchor`
- **No per-bar value labels, by design** — sixteen figures over sixteen bars *was* the reported
  defect. The gutter carries the magnitudes, the chip the movement, the tooltip the exact readings;
  the one exception is a bar with no height, which is **labelled at the baseline** so a zero (or a
  hole) is never an invisible reading
- Pairs and chip cells are **keyed by fixture**, so a data change transitions the same rects and the
  same chip: element identity is asserted across a change and a re-rank, and **an index key fails the
  re-rank test**. Mixed-sign deltas render both directions; `St. Gallen` wraps (a test rejects
  `truncate` / `line-clamp`); reduced motion lands on final heights with **zero frames requested**
- **Security triage: no security-relevant changes detected** — considered and cleared: HTTP handler
  or route, IDOR, raw SQL, `dangerouslySetInnerHTML` (a test rejects it), user-supplied URL / SSRF,
  upload, dependency or lockfile change (**none**), env var or secret, logging, CSRF, storage API. A
  presentational chart with no IO whose only `style` values are rounded geometry numbers and closed
  token references. **One seam:** no real-Chrome pass; nothing mounts it until US-036

---

**Auto-Generated** | Updates during `/execute-work` | Append-only log
