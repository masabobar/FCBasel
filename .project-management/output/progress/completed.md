# Completed Work Log

**Last Updated:** 2026-09-09

---

## Summary

**Total Completed:** 26 stories
**Total Points:** 67 / 116
**Start Date:** 2026-09-09 · **Days Active:** 1 · **Average Velocity:** 67 points/day
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

## Phase 2b: Component Library — 9/11 complete (the three most recent in full)

Condensed to keep this log inside its 300-line limit; the **full per-story detail lives in
[`../phases/phase-2b.md`](../phases/phase-2b.md)** and in the completion notes in
[`../../input/backlog/phase-2b-components.md`](../../input/backlog/phase-2b-components.md).

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-027 Motion & animation hooks | 3 | 52 | `app/lib/hooks/use-motion.ts` — `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`. **Built first on purpose:** the other ten E6 components consume them. **Count-up counts from the CURRENT DISPLAYED VALUE** (ref-mirrored, read not depended on), so a filter switched mid-animation carries on from the old number and lands exactly on target. **Reduced motion = final state in the same render**, so `width={grown ? w : 0}` geometry is never stranded at zero (zero frames requested). One reduced-motion source via `useSyncExternalStore`; a scan fails any component calling `matchMedia`; SSR proven by `renderToString` + `hydrateRoot`. |
| US-017 KPI tile & variance chip | 2 | 78 | `tiles/delta-chip.tsx` (its own module — US-019/US-022/US-016 want the chip alone) + `tiles/kpi-tile.tsx` (`KpiSparkline`, `KpiFigure`, `KpiTile`). **Colour is never the sole signal, and the `light` variant proves it:** on navy a test asserts the up and down chips' class strings are *identical* while glyph, sign and an `sr-only` word still differ. **Direction is arithmetic, judgement is meaning** — an optional `judgement` prop gives Marketing's overspend an up arrow in the negative token; a zero is a labelled zero. Closed the US-012 `tailwind-merge` trap in `app/lib/cn.ts`. |
| US-021 Horizontal bar tile | 3 | 55 | `charts/h-bars.tsx` — the most reused chart in the product: `HBarRow` / `HBars` / `HBarTile`, five consumers, one row. **Both review decisions are read back off the rendered element:** the 150px weight-500 label column with `truncate` / `text-ellipsis` / `line-clamp` *rejected*, and the 96px `nowrap` value column proven via `getComputedStyle` with `-CHF 150k` a single text node. **One rule serves every consumer: the sign of the displayed figure** — anchor side, token and text sign, so `negative` mode is idempotent on a stored magnitude. Rows keyed by name; `hBarMax` / `hBarPercent` return zero, never `NaN`. A decline grows **leftwards** (deliberate deviation). |
| US-025 Line chart component | 3 | 73 | `charts/line-chart.tsx` — the only line chart, built for both consumers at once: `lineChartGeometry` (pure), `LineChartLegend` (standalone, because the band puts its legend in its own header row), `LineChart`, `LineChartTile`. Variable series count, per-series `area` / `dash`, colour by token **name**. **The stroke draw survives reduced motion:** `pathLength="1"` + an offset transitioning 1 → 0, and a test reads `stroke-dashoffset="0"` with zero frames requested. **It replays by being re-keyed and by nothing else.** Hover lists every series at the nearest index; `hoverIndex` / `nextHoverIndex` / `tooltipAnchor` are the pure helpers every later chart imports. |
| US-026 Segmented period filter control | 2 | 45 | `controls/segmented.tsx` — one control for all three consumers, **wired into none** (mounting belongs to US-016 / US-034), which unblocked US-016. **11px is a reviewed radius, not a pill:** `rounded-chip` + the new `.fcb-chip`, whose `border-radius: var(--radius-chip)` a test reads back out of `app/app.css`, with `rounded-full` / `9999px` / `--radius-pill` rejected in markup, source *and* stylesheet. **`PeriodKey` reused, never re-declared** (a `@ts-expect-error` fails typecheck if the key loosens to `string`); the label is data on the entry. **Controlled with no opinion of its own**, so one control drives two tiles or three. Radiogroup semantics, one tab stop, wrapping arrows + Home/End. |
| US-018 Vertical bar chart tile | 3 | 52 | `charts/v-bars.tsx` — `vBarGeometry` (pure), `VBars`, `VBarTile`, for US-034's kit split. **Criterion 3 is proven by a RE-RANK, not a rerender:** columns keyed by category, so `Home` keeps the *same* `<rect>` while `x` / `y` / `height` transition; identity asserted across a data change *and* a re-ordered dataset, and an index key fails exactly two tests. The surviving instance keeps its `useCountUp` state; reduced motion lands on final heights with zero frames. Gradient caps, gridlines, `filter` hover highlight, optional `tooltip(index)`; category labels are DOM text so a long one wraps; `niceMax` / `vBarHeight` never yield `NaN`. |

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
  44-unit **left gutter** (every bar, chip cell, label and legend row is inset to `plotLeft`), and a
  34-unit **chip band** at the top of the plot is reserved for the chips. The band's emptiness is not
  a hope about round numbers: the axis maximum is **derived from the geometry** (`plotHeight /
  barZoneHeight`, fed to `niceMax`, which only rounds up), so no bar can enter it whatever the data.
  Tests compute rather than assume — no chip slot reaches the gutter or its neighbour (at 8 pairs
  *and* at 14), the tallest bar clears the band across seven datasets × three heights, and the strip's
  own inset is read back off the DOM. **A fixed 10% headroom fails the test** (`previous: 500,
  current: 500` catches it), so the decision cannot be reverted silently
- **Criterion 3:** hovering a fixture's whole slot shows both seasons *and* the delta (the chip's
  `light` variant on the navy box); `role="status"`, keyboard-driven through `nextHoverIndex`
- **No per-bar value labels, by design** — sixteen figures over sixteen bars *was* the reported
  defect; the gutter carries the magnitudes, the chip the movement, the tooltip the readings, and a
  bar with no height is **labelled at the baseline**
- Pairs and chip cells are **keyed by fixture**, so a data change transitions the same rects:
  identity is asserted across a change and a re-rank, and **an index key fails the re-rank test**.
  Mixed-sign deltas render both ways; `St. Gallen` wraps; reduced motion is final state
- **Security triage: no security-relevant changes detected** — considered and cleared: HTTP handler
  or route, IDOR, raw SQL, `dangerouslySetInnerHTML` (a test rejects it), SSRF, upload, dependency
  change (**none**), env var, logging, CSRF, storage. **One seam:** nothing mounts it until US-036

### US-020: Donut / ring tile (3 pts)
**Completed:** 2026-09-09
**Files Changed:** 1 code (new) + 1 test file (new) + 5 tracking docs
**Tests Added:** 56 (unit: 56) - 1261/1261 green, 100% stmts / 100% lines / 91.2% branches on the new file, 99.7% stmts / 97.6% branches of `app/**`
**Notes:** All 4 acceptance criteria met. Built for US-034's "Sponsor badges printed" — 3'080 shirts
in the middle, Bitpanda 44% / Sunrise 24% / Allianz 20% / IWB 12% around it, under a section-level
period filter that changes the total (3'080 / 1'136 / 430 / 334).

**What Was Done:**
- `app/components/charts/donut.tsx` — `donutGeometry` (pure: circumference, per-segment dash length
  and offset, the gaps), `Donut` (ring + centre + legend) and `DonutTile` (`Card` + ring) — the
  three-export shape US-018/US-019/US-021/US-025 set
- **It is deliberately NOT the attendance ring.** US-016's is a single-arc gold gauge against a
  capacity on the navy band; this is four series arcs plus a legend on a white card. The
  `stroke-dasharray` technique and the reduced-motion handling are borrowed; the component is
  separate, because one component doing both would need a mode switch through every line of it
- **Criterion 1:** four arcs whose painted lengths plus four gaps are exactly one circumference, so
  the gap is **arc removed from each segment** (half at each end, hence four even gaps), never a
  stroke painted in the background colour — a test rejects a zero gap *and* the negative dash a
  narrower-than-gap slot would otherwise produce. The centre counts up through `useCountUp`
- **CRITERION 2 IS TWO HOVER SURFACES WRITING ONE STATE.** An arc and its legend row both set the
  single `hovered` index, proven by a **cross-surface** test: hover the LEGEND and the ARC thickens
  while the centre swaps; then hover a different ARC and the LEGEND row follows. Stubbing out either
  surface's write fails 4-5 tests. The thickening is a stroke weight, so nothing is re-laid out. The
  legend rows are real `<button>`s, so focus does exactly what hover does and Tab still leaves
- **Criterion 3 is a morph, and the proof is a re-rank.** Arcs *and* legend rows are keyed by
  SPONSOR, so a period press hands `Bitpanda` the same `<circle>` and its `stroke-dasharray` /
  `stroke-dashoffset` transition in CSS — identity is asserted across a data change and a re-ordered
  split, and **an index key fails that test**. One `useCountUp` drives the centre, so a hover swap
  and a period change both count from the figure ON SCREEN (asserted strictly between the two
  figures mid-flight), never via zero
- **Criterion 4 reuses `badgeSegments` (US-008)** rather than restating its rounding correction: the
  segments sum EXACTLY to the centre total on 3'080 / 1'136 / 430 / 334 and ten adversarial totals,
  asserted on the geometry *and* on the four figures printed on screen (7 → 3 + 2 + 1 + 1). A test
  rejects a local `Math.round`
- Reduced motion lands on final arcs and the final total with **zero frames requested**; ids come
  from `useUid` (8 distinct across two rings); gold is absent and slate is the fourth series; no hex
  and no formatting appear in the file
- **Security triage: no security-relevant changes detected** — considered and cleared: HTTP handler
  or route, IDOR, raw SQL, `dangerouslySetInnerHTML`, user-supplied URL / SSRF, upload, dependency
  or lockfile change (**none**), env var or secret, logging, CSRF, storage API. **One seam:** no
  real-Chrome pass; nothing mounts a donut until US-034

### US-022: Department table tile (3 pts)
**Completed:** 2026-09-09
**Files Changed:** 1 code (new) + 1 test file (new) + 6 tracking docs
**Tests Added:** 54 (unit: 54) - 1315/1315 green, **100% on the new file** (stmts / branches / funcs / lines), 99.8% stmts / 98.1% branches of `app/**`
**Notes:** All 5 acceptance criteria met, both recorded review decisions held, and the revenue/cost
trap closed structurally rather than by care.

**What Was Done:**
- `app/components/tiles/department-table.tsx` — `DepartmentTable`, `DepartmentTableTile` and the
  pure `targetMark` / `targetBarPercent` / `columnAlignClass`. **A real `<table>`** (thead / tbody /
  tfoot, `scope="col"` headers, a `scope="row"` department name, `sr-only` caption), because six
  departments read across as well as down. No TanStack Table: six rows and a total row
- **THE REVENUE / COST TRAP IS CLOSED BY CONSTRUCTION.** The colour comes from `row.judgement` —
  US-010's `varianceJudgement`, decided once from the department's `type` — handed to US-017's
  `DeltaChip`, so **Marketing's +410 renders UP and ADVERSE** (an up arrow in the negative token)
  while **Sponsoring's +840 renders UP and FAVOURABLE**; a test asserts the two chips share a
  `data-direction` and differ in class, and a synthetic cost centre *under* budget flips to
  FAVOURABLE with a down arrow. A source scan rejects the words `FAVOURABLE` / `ADVERSE`, any
  `variance <>` comparison and any `DepartmentType` equality, so the judgement cannot migrate back
  into the component
- **The flag is `needsAttention`, not a hardcode:** exactly one row is flagged and it is Marketing,
  whose name never appears in the source — giving another department both conditions moves the flag.
  It is carried three ways (gold tint, an alert glyph, and the sentence "Over budget and behind
  target" in the a11y tree)
- **REVIEW DECISION 1 — CHF millions, never "000":** `formatMillions(chfFromThousands(…))` gives
  21.00 / 21.84 and a 69.00 / 69.68 total, with the unremovable `MILLIONS_NOTE` subtitle "figures in
  CHF millions". A test rejects `/000/` anywhere in the rendered tile and pins the currency word to a
  single occurrence — in that note
- **REVIEW DECISION 2 — numeric headers right-aligned, "% of target" INCLUDED:** `DEPARTMENT_COLUMNS`
  declares which columns are numeric and `columnAlignClass` is the ONE rule the header `<th>` *and*
  its body cells read, so the alignment is proven column by column (and by comparing header-to-cell
  column position element by element), not asserted from a class on one `<th>`. The cell also ends
  with its FIGURE, so the percentages land on the header's right edge
- **The gold near-target band:** 95-99 takes a deep-gold ring, 100+ a filled gold dot, below 95
  nothing — so **Hospitality (95) is marked and Merchandising (92) is not**, and the two marks differ
  in shape as well as tone, each with an `sr-only` word. Gold appears nowhere else in the file
- Background-only row hover on the `fast` token; rows keyed by department NAME (a reversed dataset
  moves the same element); long names wrap (`break-words`, ellipsis classes rejected) inside a
  card-bounded `overflow-x-auto`; totals come from `departmentTotals()` on the rows on screen, so the
  footer cannot disagree with them, and the club variance is deliberately NEUTRAL — a fact, not a
  verdict. Reduced motion renders every target bar at its final width with **zero frames requested**
- **Security triage: no security-relevant changes detected** — considered and cleared: HTTP handler
  or route, IDOR, raw SQL, `dangerouslySetInnerHTML`, user-supplied URL / SSRF, upload, dependency
  or lockfile change (**none**), env var or secret, logging, CSRF, storage API. **One seam:** no
  real-Chrome pass; nothing mounts the table until US-038

### US-023: Driver / breakdown tile (2 pts)
**Completed:** 2026-09-09
**Files Changed:** 1 code (new) + 2 code (shared seams widened) + 3 test files + 5 tracking docs
**Tests Added:** 43 (unit: 39 new file + 2 on `HBarTile`'s new slot + 2 on `DeltaChip`'s suffix) - 1358/1358 green, **100% on the new file**, 99.8% stmts / 98.1% branches of `app/**`
**Notes:** All 3 acceptance criteria met. The story was deliberately small — a REUSE story — and the
honest outcome is a thin tile plus the tests that keep it thin.

**What Was Done:**
- `app/components/tiles/driver-tile.tsx` — `DriverTile`, `DriverTotalBadge` and the pure
  `rankDrivers` / `driverTotal`, designed at once for all three consumers: US-035's mixed-sign
  percentages, US-037's negative money with the total badge, US-039's positive money
- **CRITERION 3 IS ENFORCED TWO WAYS, not asserted.** Every row is US-021's `HBarRow` reached
  through `HBarTile`: the render tests read the 150px label column, the 96px `nowrap` value column
  and the `aria-hidden` track back off the rows THIS tile produced, and the scaling is `HBars`'
  (FCZ 100% / Lugano 73.33% / Sion 46.67%). A source scan then rejects `h-bar-*`, both width
  constants, `H_BAR_SERIES`, `width` / `toFixed` / `Math.min`, `useCountUp` / `useGrow` /
  `transition` / `animation`, every `useState` / `useEffect` / timer, every gradient class and even
  a second `Card` — so a sixth copy of the shared row cannot appear without failing tests
- **RANKING is the tile's own, and it is STABLE:** `rankDrivers` sorts by magnitude descending on a
  COPY (the caller's dataset is never sorted in place) and equal values keep their arrival order, so
  Luzern precedes the tied Sion — asserted equal to US-009's `fixtureDeclines` order rather than to
  a hand-written list. `rank="none"` keeps an authored order for US-035, whose list leads with
  Bitpanda because Bitpanda leads badge selection, not because +2 is the largest figure
- **THE TOTAL IS DERIVED, so the badge cannot disagree with the bars:** `driverTotal` sums the
  figures the rows DISPLAY through `hBarDisplayedValue` (newly exported from `h-bars.tsx` rather
  than restated), giving `-CHF 400k` — asserted equal to `declineTotal(fixtures)` — and `CHF 410k`
  for the Marketing drivers, asserted equal to `departmentVariance(Marketing)`. It is re-derived on
  a rerender (dropping two rows moves the badge to `-CHF 220k`) and is unaffected by the ranking
- **TWO SEAMS WIDENED IN THE SHARED MODULES RATHER THAN FORKED:** `HBarTile` gained a `children`
  slot rendered under the bars (US-037's one-line attendance `note` lives there, wrapping rather
  than truncating, and distinct from the card's AI caption strip), and `DeltaChip` gained an
  optional `suffix` node so `-CHF 400k total` is ONE chip that keeps the arrow, the explicit sign
  and the `sr-only` direction. An explicit `action` still wins over the derived badge
- The custom formatter is used verbatim in all three shapes (`+38%`, `-CHF 150k`, `CHF 240k`), a
  mixed-sign list renders both directions (`data-direction` UP and DOWN off one dataset), an
  overspend total renders UP and ADVERSE, and reduced motion lands on final widths, final figures
  *and* the final badge with **zero frames requested**
- **Security triage: no trigger fires** — considered and cleared: HTTP handler or route, IDOR, raw
  SQL, `dangerouslySetInnerHTML` (scan-rejected), user-supplied URL / SSRF, upload, dependency or
  lockfile change (**none**), env var or secret, logging, CSRF, storage API. `note` / `totalLabel`
  are React nodes React escapes. **One seam:** no real-Chrome pass until US-035 / US-037 / US-039
  mount it

---

**Auto-Generated** | Updates during `/execute-work` | Append-only log
