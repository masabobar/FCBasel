# Completed Work Log

**Last Updated:** 2026-09-09

---

## Summary

**Total Completed:** 22 stories
**Total Points:** 56 / 116
**Start Date:** 2026-09-09 · **Days Active:** 1 · **Average Velocity:** 56 points/day
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
  one KPI string and one ring value, nothing left at zero
- **One real defect found and fixed in `LineChart`:** its end axis labels were clipped by the svg's
  own bounds, so `axisLabelAnchor` anchors the first and last inwards
- **Security triage: no security-relevant changes detected** — no handler/route change, no SQL, no
  `innerHTML`, no network call, no upload, no dependency or env change, no logging; every rendered
  string is an escaped text node and the only dynamic style values are token references and geometry

---

## Phase 2b: Component Library — stories in full (6/11)

### US-027: Motion & animation hooks (3 pts)
**Completed:** 2026-09-09
**Files Changed:** 4 code (1 new, 3 modified) + 3 test files + 5 tracking docs
**Tests Added:** 52 (unit: 52) - 644/644 green, 100% stmts / 99.4% branches / 100% funcs of `app/**` · **Commit:** see phase-2b progress log
**Notes:** All 4 acceptance criteria met. **Built first in Phase 2b on purpose** — the other ten E6
components consume these hooks, so the API was designed for them and documented in the module header
(the precedent US-007 set with `app/lib/repositories/README.md`).

**What Was Done:**
- `app/lib/hooks/use-motion.ts` (the `lib/hooks/` slot the technical spec reserved):
  `useReducedMotion()`, `useGrow()`, `useCountUp(target, animationMs?)`, `useUid(prefix?)`
- **Count-up counts from the CURRENT DISPLAYED VALUE** — the figure on screen is mirrored in a ref
  and read (never depended on) when the target changes, so a filter switched mid-animation carries on
  from the old number. Tests prove the retargeted animation *opens on* the mid-flight figure, climbs
  monotonically and lands **exactly** on target, upwards and downwards
- **Reduced motion = final state in the same render:** `useGrow` returns `grown || reduced` and
  `useCountUp` returns `reduced ? target : displayed`, so `width={grown ? w : 0}` geometry is never
  stranded at zero — under the preference, `useGrow` is `true` on render one with **zero** frames
- **One reduced-motion source:** the hook subscribes to US-006's query via `useSyncExternalStore`
  and reacts to a *change*; a test greps the source and fails if it ever calls `matchMedia` itself.
  Every rAF, timer and listener is cancelled on unmount, with ten tiles unmounted mid-count
- ~900ms is now the `duration.countUp` token read through `tokens.durationMs()`; `useUid` shares
  `cssIdentifier`, so a gradient id is always legal in `url(#…)`. **SSR proven**, not asserted:
  `renderToString` with the globals stubbed plus a real `hydrateRoot` pass

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
- **Colour is never the sole signal, and the `light` variant proves it.** On navy the negative token
  sits near 2:1, so the light variant drops colour coding entirely — a test asserts the up and down
  chips' class strings are **identical** there while the glyph, the explicit sign and an `sr-only`
  direction word all still differ. `text-red` on the chip is rejected by test
- **Direction is arithmetic; judgement is meaning.** An optional `judgement` prop (US-010's
  `varianceJudgement`) gives Marketing's overspend an **up arrow in the negative token**; a zero is a
  **labelled zero** in the neutral treatment, never a variance token
- **One API, three consumers, no variant per hero:** hero extras arrive as `children`; US-016's navy
  band composes `KpiFigure onDark`, forcing the light chip. The 30px/700/tight/tabular number is the
  existing `.kpi-number` role class
- Motion is US-027's only — a test greps the source and fails on `useState`, `setTimeout`,
  `setInterval` or `requestAnimationFrame`. The sparkline draws via `pathLength="1"` + a dash offset,
  paints with `currentColor` so no colour prop exists, and handles degenerate series without `NaN`
- **Closed the US-012 `tailwind-merge` trap at the root:** `app/lib/cn.ts` declares the named type
  scale as the `font-size` group, **derived** from `tokens.fontSize` via the same `cssVariableName`
  mapping Tailwind builds the utility from, so it cannot drift
- Extracted `tests/unit/support/motion-harness.ts` (frame and preference stubs) — one harness for
  the nine component stories that follow, rather than nine copies

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
- **Both review decisions are read back off the rendered element, not merely written.** The label
  column is 150px at weight 500 and a test *rejects* `truncate` / `text-ellipsis` / `line-clamp`, so
  `Cap "Rotblau"` cannot regain the ellipsis it was reported with — a long label wraps instead. The
  value column is 96px `nowrap`, asserted through `getComputedStyle` on every row of three lists,
  with `-CHF 150k` proven to be a single text node. Both widths come from one exported constant
- **One rule serves all five consumers: the sign of the DISPLAYED figure.** It sets the anchor side,
  the token and the sign in the text — so `negative` mode is only "every row is a decline" (it
  negates the stored magnitude, idempotently) and the badge trend's mixed signs need nothing extra.
  Direction is published as `data-direction`, so no test has to read a colour off a pixel
- **Nothing snaps to zero:** rows are keyed by name, so a data change transitions the *same* bar
  element — a test holds its identity while the width moves 100% → 50% — while `useCountUp` carries
  the figure on from what is on screen. The pure `hBarMax` / `hBarPercent` return zero width rather
  than `NaN`, so an all-zero list still renders **labelled zeros** with their tracks
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
  normalises its own length (`pathLength="1"`) so one dash of 1 covers it, and the offset transitions
  1 → 0 — no measurement, no per-frame JavaScript. Under the preference `useGrow` is `true` in the
  **first** render, so a test reads `stroke-dashoffset="0"` with **zero frames requested**, and again
  after a re-key: never stranded at offset 1 awaiting a transition that will not run. A dashed line
  cannot draw that way (its dasharray *is* the pattern) so it fades, at full opacity in that same
  first render; flipping the preference mid-entrance resolves the offset at once
- **It replays by being re-keyed and by nothing else** — no `replay` prop, no effect watching the
  data. Tests hold both halves: a re-key returns the offset to 1 and clears the guide, while a
  data-only change leaves the line drawn, so a filter press never flashes
- **Hover is the wrapper's, not the svg's** (the svg's units are stretched by the `viewBox`): the
  exported pure `hoverIndex` maps the pointer to the nearest index and the tooltip lists every series
  there through US-011's formatters, asserted by hovering an exact x and reading the whole tooltip
  back. Keyboard came cheap — `tabIndex=0` plus arrow/Home/End/Escape through the pure
  `nextHoverIndex`, which returns `null` for every other key, so Tab is not captured (tested)
- **No hex, and no colour parked where a CSS parser may drop it.** Series colours are token names
  resolved through `cssVariable` to `var(--color-…)`: the svg takes them as presentation attributes,
  the two DOM swatches as a `--line-series` custom property read back by `bg-[var(--line-series)]`.
  Gold is a legitimate *series* colour here — navy band only, per the Guide
- **Two charts on screen cannot collide:** gradient ids come from `useUid`, and a test renders the
  band and Hero 2 together to assert two distinct ids **and** that each area fill points at its own
- **A zero or missing point is a labelled zero** — `valueAt` reads a missing, short or non-finite
  reading as `0`, so no `NaN` enters a `d`. Legible at 1080p (E8): 12px `--text-chart-axis` labels
  rather than the reference's 10px, a legend that wraps, and a tooltip that flips near either edge
- **Scope held:** no hero band, no period filter, no sparkline. **No real-Chrome pass** here
- **Security triage: no security-relevant changes detected.** Considered and cleared: HTTP handler or
  route, IDOR, raw SQL, `dangerouslySetInnerHTML` (a test rejects it), user-supplied URL / SSRF,
  upload, dependency or lockfile change (**none**), env var or secret, logging, CSRF, storage API.
  Series names and axis labels are React-escaped text; the only values reaching `style` are numbers
  derived from the data plus a token reference

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
  rule in `app/app.css`, and a test reads `border-radius: var(--radius-chip)` back out of the
  stylesheet while rejecting `rounded-full` / `9999px` / `--radius-pill` in the markup, the source
  *and* the CSS, and pins `radius.chip` unequal to both `tile` and `pill`. The lift-and-tint hover is
  split on purpose: `.fcb-chip` carries the 1px lift and the transition (shared with US-029), the
  tint stays in the light/dark table — the only half that has to differ per surface
- **`PeriodKey` reused, never re-declared** (`.claude/rules/enums-and-constants.md` §8):
  `SegmentedOption` is structurally the head of `BaselinePeriod` / `TopProductsPeriod` /
  `Hero1Period`, so a consumer passes its period array straight in. A `@ts-expect-error` line fails
  typecheck the moment the key loosens to `string`, and no period literal appears in the file. **The
  label is data on the entry** — what lets Hero 1 say "Current month" for the same `THIS_MONTH` key
- **Controlled, with no opinion of its own** — a press the caller ignores changes nothing on screen
  (tested), which lets ONE control drive two tiles on the band or three on Hero 1
- **Radiogroup semantics, done properly:** `role="radiogroup"` + `radio` with `aria-checked`, ONE tab
  stop via roving `tabIndex` (the group stays reachable when the value matches no option), wrapping
  arrows plus Home/End through the pure `nextOptionIndex`, which returns `null` for every other key
  so Tab, Enter and Space keep their meaning. **Selection is carried four ways, never colour alone**
- **Scope held:** nothing mounts the control until US-016 — no real-Chrome pass in this story
- **Security triage: no security-relevant changes detected.** Considered and cleared: HTTP handler or
  route, IDOR, raw SQL, `dangerouslySetInnerHTML` / `innerHTML`, user-supplied URL / SSRF, upload,
  dependency or lockfile change (**none**), env var or secret, logging, CSRF, storage API. A
  presentational control with no IO: labels render as React-escaped text and the only DOM query uses
  a constant selector

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
- Gradient fills with rounded caps (`rx`), **one gradient per distinct token colour** with ids from
  `useUid` (two charts on screen carry six distinct ids, each bar pointing at its own); gridlines
  behind and counting labels above; a hover highlight that is a `filter`, so the series colour is
  never swapped; and an **optional `tooltip(index)` renderer** — Hero 1's units + share + revenue
  box — falling back to category + figure so a hover is never silent. Hover is also keyboard
  (arrows/Home/End/Escape), and US-025's `tooltipAnchor` / `nextHoverIndex` are **imported, not
  restated**, so the edge flip and the "do not capture Tab" rule are not fixed twice
- **Category labels are DOM text under the plot**, because SVG text cannot wrap — a test rejects
  `truncate` / `line-clamp` on them. `niceMax` / `vBarHeight` return a usable scale rather than
  `NaN` for a zero, a negative, a hole or an all-zero list, and a zero is a labelled zero. Gold is
  absent from the series map by design; no hex or currency string appears in the file
- **Security triage: no security-relevant changes detected.** Considered and cleared: HTTP handler or
  route, IDOR, raw SQL, `dangerouslySetInnerHTML` / `innerHTML`, user-supplied URL / SSRF, upload,
  dependency or lockfile change (**none**), env var or secret, logging, CSRF, storage API — a
  presentational chart with no IO, whose only `style` values are rounded geometry numbers and a token
  reference. **One seam:** no real-Chrome pass; nothing mounts a vertical bar chart until US-034

---

**Auto-Generated** | Updates during `/execute-work` | Append-only log
