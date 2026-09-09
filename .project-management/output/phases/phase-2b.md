# Phase 2b: Chart & Tile Component Library

**Duration:** 2026-09-11 to 2026-09-12 (~12.0 AI-hours)
**Status:** In Progress (7/11 stories · 19/29 points)
**Started:** 2026-09-09
**Target Completion:** 2026-09-12
**Actual Completion:** —

> **Acceptance criteria live in** [`../../input/backlog/phase-2b-components.md`](../../input/backlog/phase-2b-components.md).
> This file tracks execution.

---

## Phase Goal

Build the reusable visual kit the heroes are assembled from, so Phase 3b is composition rather than
bespoke work per screen. Every component is styled from the E2 tokens and fed from the E3 data.

**Success Criteria:**
- All eight component types exist, are stateless, and take E3-shaped data as input
- No component fetches or computes data at render time
- Money, percentage and variance formatting is identical everywhere
- Charts are legible at 1080p — readable axis labels, adequate spacing, no clipped legends
- Each component is genuinely shared; there are no per-hero copies of the same chart type

---

## Epics in This Phase

### Epic 5: E6 — Chart & Tile Component Library (29 story points)

**Priority:** P0 (US-026 is P1) · **Status:** In Progress (7/11) · **Dependencies:** US-003, US-005

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-017 | KPI tile & variance chip | 2 | P0 | ✅ Done |
| US-018 | Vertical bar chart tile | 3 | P0 | ✅ Done |
| US-019 | Grouped bar chart tile | 3 | P0 | ✅ Done |
| US-020 | Donut / ring tile | 3 | P0 | 📋 Todo |
| US-021 | Horizontal bar tile | 3 | P0 | ✅ Done |
| US-022 | Department table tile | 3 | P0 | 📋 Todo |
| US-023 | Driver / breakdown tile | 2 | P0 | 📋 Todo |
| US-024 | Recommendation panel & narrative caption strip | 2 | P0 | 📋 Todo |
| US-025 | Line chart component | 3 | P0 | ✅ Done |
| US-026 | Segmented period filter control | 2 | **P1** | ✅ Done |
| US-027 | Motion & animation hooks | 3 | P0 | ✅ Done |

**Technical Notes:**

- **Charts are hand-built SVG, ported from the reference build** (decided 2026-09-09) — no charting
  library, no TanStack Table. The deciding factor was animation: bars persisting across data changes,
  donut segments morphing, line stroke-draw on re-key, count-up from the **current displayed value**.
- **Build US-027 first.** Every other component in this phase depends on the motion hooks.
- **Colour is never the sole signal.** A projector can shift green/red, so variance always carries an
  explicit sign and arrow alongside the token.
- Three explicit review decisions that must not be reverted: the grouped-bar y-axis gutter with
  headroom (US-019); the 96px `nowrap` value column (US-021, keeps `-CHF 150k` on one line
  **everywhere** the shared row is used); right-aligned numeric headers incl. "% of target" (US-022).
- The recommendation panel must be **visually distinct from a data tile** — it is advice, not a
  metric. It carries the peak moment of each follow-up.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md` (SOLID, DRY)
- [ ] Component tests render from E3-shaped props with no live computation; coverage ≥ 80%
- [ ] Reduced-motion path renders every animated value at final state
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix · i18n.

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 29 · **Stories:** 11 · **Epics:** 1
- **Estimated Effort:** ~40 team-hours → ~12.0 AI-core hours
- **Risk Level:** Low-Medium — the largest phase by volume, but the most mechanical

> The **single largest block** in the build (23% of effort) and the most repetitive — the best place to
> find the estimate's SPEED_FACTOR too cautious.

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 19 / 29 (66%)
- **Completed Stories:** 7 / 11
- **Tests Passing:** 1205 / 1205 · **Coverage:** 99.8% stmts / 98.4% branches · **Commits:** 6

---

## Dependencies

**Depends On:** US-003 (tokens), US-005 (card shell) from Phase 1a; US-011 (formatters) from Phase 1b.

**Blocks:**
- Every hero in Phase 3b composes these components
- US-013 (baseline Top Products) needs US-021
- US-016 (hero band) needs US-025, US-026, US-027 — ✅ all three exist, US-016 is unblocked

**Internal ordering:** US-027 → everything else. US-021 → US-023 (the driver tile reuses the bar row).

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| A per-hero copy of a chart type is created under time pressure | Medium | Medium | Genuinely shared components is an explicit acceptance criterion on every story | AI | Open |
| Filter change snaps values to zero instead of transitioning | High | Medium | Count-up tracks the last displayed value in a ref; bars keyed by category | AI | 🔄 Half closed — and now proven for GEOMETRY too: US-021's rows are keyed by name, so a test shows the same bar element surviving a data change and its width moving 100% → 50% while the figure counts from the one on screen. US-025 adds the LINE proof: a re-key replays the stroke draw while a data-only change leaves the line drawn, so nothing flashes. US-018 adds the VERTICAL BAR proof, and it is a re-rank rather than a rerender: the same `<rect>` survives, transitions height *and* position, and each label stays with its own category — switching the key to the index fails two tests. US-019 adds the GROUPED proof (pairs and chip cells keyed by fixture; an index key fails the re-rank test). Remaining: US-020 |
| SVG gradient ids collide across simultaneous charts | Medium | Medium | Stable unique-id hook per component instance (US-027) | AI | ✅ Closed — `useUid` (US-027) and now proven on a real component: two KPI sparklines carry different gradient ids (US-017), and US-025's band + Hero 2 charts on one screen carry distinct ids with each area fill pointing at its own |
| Hand-built SVG takes longer than a library would | Medium | Medium | Port from the reference rather than writing fresh; the components already exist and work | AI | Open |
| Long labels overflow their tile | Low | Medium | Wrap or truncate-with-tooltip; never overflow | AI | ✅ Closed for the shared bar row (US-021): the 150px label column wraps (`break-words`) and a test rejects `truncate` / `text-ellipsis` / `line-clamp`. US-025's legend wraps and its tooltip flips inside the plot near an edge, so neither clips at 1080p. US-018 keeps its category labels as DOM text under the plot *because* SVG text cannot wrap, and US-019 does the same for `St. Gallen` while moving the y-axis into its own gutter so eight delta chips clear both the scale and each other |
| A named type-size token is silently dropped beside a colour token | Medium | **High** | `tailwind-merge` reads `text-caption` as a colour; the type scale is now declared in `app/lib/cn.ts`, derived from the token set | AI | ✅ Closed by US-017 for every component that follows |

---

## Progress Log

### 2026-09-09 — US-027 Motion & animation hooks ✅ (3 pts)

**Delivered:** `app/lib/hooks/use-motion.ts` — `useReducedMotion()`, `useGrow()`,
`useCountUp(target, animationMs?)`, `useUid(prefix?)`, `COUNT_UP_DURATION_MS` (900, from the token
set). Every animated component in this epic keys off these four. **Count-up runs from the figure on
screen** (mirrored in a ref, read not depended on), so a retargeted animation opens mid-flight and
lands *exactly* on target. **Reduced motion is final state in the SAME render:** `useGrow` returns
`grown || reduced` with **zero** frames requested. One reduced-motion source behind
`useSyncExternalStore`; SSR proven by `renderToString` + `hydrateRoot`.
**Gates:** 644/644 (52 new) · all clean · coverage 100% stmts / 99.4% branches. **Security:** none.

### 2026-09-09 — US-017 KPI tile & variance chip ✅ (2 pts)

**Delivered:** `delta-chip.tsx` (`DeltaChip`, wanted alone by US-019/US-022/US-016) and `kpi-tile.tsx`
(`KpiSparkline`, `KpiFigure`, `KpiTile`). **Colour is never the sole signal, and it is TESTED that
way:** direction is carried four independent times (glyph, explicit sign, `sr-only` word, token), and
the `light` variant proves it — on navy both directions share one white treatment while sign, glyph
and spoken word still differ. **Direction is not judgement:** Marketing's overspend arrives through
an optional `judgement` prop fed from `varianceJudgement` (US-010); a zero is a **labelled zero**.
**The US-012 trap is closed at the root** in `app/lib/cn.ts` (named type scale declared as
`tailwind-merge`'s `font-size` group), so a size beside a colour is no longer dropped.
**Gates:** 722/722 (78 new) · all clean · coverage 100% stmts / 99.5% branches. **Security:** none.
*(Chrome pass arrived with US-013's baseline row.)*

### 2026-09-09 — US-021 Horizontal bar tile ✅ (3 pts)

**Delivered:** `app/components/charts/h-bars.tsx` — the most reused chart in the product:
`HBarTile` (Card + rows), `HBars` (rows alone), `HBarRow` (one row, US-023's unit of reuse).
**Both review decisions are asserted, not just implemented:** the 150px weight-500 label column with
**no truncation** (a test rejects `truncate` / `text-ellipsis` / `line-clamp` and pins
`Cap "Rotblau"` whole) and the 96px `nowrap` value column, read back through `getComputedStyle` on
three lists with `-CHF 150k` proven a single text node. **One rule carries all five consumers: the
sign of the displayed figure** — it sets the anchor side, the token and the text sign, so `negative`
mode is just "every row is a decline" (idempotent on a stored magnitude) and mixed signs work
unchanged. Rows keyed by name, so a data change transitions the *same* bar (100% → 50%);
`hBarMax` / `hBarPercent` return zero, never `NaN`.
**Gates:** 777/777 (55 new) · all clean · coverage 100% stmts / 99.6% branches. **Security:** none.
**One deliberate deviation:** a decline grows **leftwards**, not rightwards as the reference draws
it, so direction survives a washed-out projector. The 150px and 96px decisions must not be reverted.

### 2026-09-09 — US-025 Line chart component ✅ (3 pts)

**Delivered:** `app/components/charts/line-chart.tsx` — the only line chart in the product, built for
both consumers at once: `LineChart` (navy band, `dark`), `LineChartLegend` (the band places its own),
`LineChartTile` (US-036, light) and the pure `lineChartGeometry` / `hoverIndex` / `nextHoverIndex` /
`tooltipAnchor` helpers every later chart imports rather than restating.
**The stroke draw survives reduced motion, and it is proven:** a solid line normalises its own length
(`pathLength="1"`) so the offset transitions 1 → 0 with no measurement and no per-frame JavaScript,
and under the preference a test reads `stroke-dashoffset="0"` with **zero frames requested** — never
stranded awaiting a transition that will not run. A dashed line fades in instead. **It replays by
being re-keyed, with no second mechanism**; a data change without a key change leaves it drawn.
**Hover shows EVERY series at the hovered x**, mapped through the pure `hoverIndex`, with keyboard
access from `nextHoverIndex` (returns `null` for every other key, so Tab is not captured). Gradient
ids from `useUid`, proven distinct with both charts on screen. No hex: series colours are token
names, and a zero is a **labelled zero** (`valueAt` reads a hole as `0`, so no `NaN` enters a `d`).
**Gates:** 953/953 (73 new) · all clean · coverage 100% lines / 99.3% stmts on the new file.
**Security:** no security-relevant changes detected. Chrome pass arrived with US-016.

### 2026-09-09 — US-026 Segmented period filter control ✅ (2 pts)

**Delivered:** `app/components/controls/segmented.tsx` — the one period control, designed for all
three consumers and **wired into none of them**: mounting it is US-016's and US-034's work, so
US-013's `action` slot stays deliberately empty until then.
**11px is a REVIEWED decision and it is asserted, not just implemented.** `--radius-chip: 11px`
already existed, so nothing was redeclared: the group wears `rounded-chip` and every option the new
`.fcb-chip` class, whose `border-radius: var(--radius-chip)` a test reads back out of `app/app.css`;
`rounded-full` / `9999px` / `--radius-pill` are rejected in the markup, the source *and* the
stylesheet. The lift-and-tint hover is split on purpose: `.fcb-chip` carries the 1px lift and the
transition (shared with US-029's chips, hence `CHIP_SURFACE_CLASS`); the tint stays per variant.
**`PeriodKey` reused, never re-declared** — `SegmentedOption` is the structural head of
`BaselinePeriod` / `TopProductsPeriod` / `Hero1Period`, a `@ts-expect-error` line fails typecheck the
moment the key loosens to `string`, and the label is data on the ENTRY (Hero 1 says "Current month"
for the same `THIS_MONTH` key). **Controlled, with no opinion of its own** — a press the caller
ignores changes nothing on screen, which lets ONE control drive two tiles on the band or three on
Hero 1. **Accessibility:** `role="radiogroup"`/`radio` + `aria-checked`, ONE tab stop via roving
`tabIndex`, wrapping arrows plus Home/End through the pure `nextOptionIndex` (which returns `null`
for every other key), and selection carried four ways, never by colour.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 998/998 tests ✅ (45 new) · build ✅ · coverage 100%
lines / 100% funcs / 97.4% stmts on the new file (99.7% / 98.5% overall). **Security triage:** no
security-relevant changes detected — a presentational control with no IO, no dependency change, and
labels rendered as React-escaped text. **One seam:** no real-Chrome pass; nothing mounts it until
US-016 — which this story **unblocks** (US-025 + US-026 + US-027 all exist now).

### 2026-09-09 — US-018 Vertical bar chart tile ✅ (3 pts)

**Delivered:** `app/components/charts/v-bars.tsx` — the only vertical bar chart in the product, built
for US-034's kit split, three exports, one per seam:
```tsx
<VBarTile title="Shirt sales by kit" period={`${p.label} · ${fmt(total)} shirts · ${fmtM(rev)}`}
  bars={[{ name: "Home", value: 22_400 }, { name: "Away", value: 10_300 },
         { name: "3rd", value: 5_800 }]} tooltip={kitTip} />   // Card + chart, colours by position
<VBars bars={kits} format={formatNumber} tooltip={(i) => …} height={206} label="…" />  // no card
export function vBarGeometry(bars, height?): VBarGeometry | null    // pure, testable with no DOM
```

**Criterion 3 is the story, and the proof is a RE-RANK, not a rerender.** Columns are keyed by
category, so a filter press hands `Home` the *same* `<rect>` and the `x` / `y` / `height` CSS
transition carries it from the geometry on screen — element identity is asserted across a data
change *and* across a re-ordered dataset, and each label is shown to stay with its own category.
Switching that key to the array index fails exactly two tests, which is the defect stated as an
assertion. Nothing snaps to zero: the surviving instance keeps its `useCountUp` state, so the figure
counts on from what is displayed, and under reduced motion `useGrow` is already `true` — final
heights and final figures with **zero frames requested**.

**Everything else is the epic's shared rules, not new ones.** Gradient fills with rounded caps, one
gradient per *distinct* token colour (ids from `useUid`, proven distinct with two charts on screen);
gridlines behind, counting labels above; a hover highlight that is a `filter`, so the series colour
is never swapped; and an **optional per-bar renderer** taking the index — Hero 1's units + share +
revenue box — falling back to category + figure so a hover is never silent. US-025's `tooltipAnchor`
and `nextHoverIndex` are imported rather than restated, so the edge flip and the "do not capture
Tab" rule are not fixed twice. **Category labels are DOM text under the plot** because SVG text
cannot wrap, and a test rejects `truncate` / `line-clamp` on them. `niceMax` snaps the axis to a
readable 25'000 and, with `vBarHeight`, returns a usable scale rather than `NaN` for a zero, a
negative, a hole or an all-zero list; a zero is a labelled zero. Gold is absent from the map.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 1142/1142 (52 new) · build ✅ · coverage 100% lines /
100% funcs / 100% stmts on the new file, 94.9% branches (both misses are unreachable `?? "red"`
fallbacks); 99.8% / 98.3% overall. Every new utility confirmed in the compiled stylesheet, including
`transition-property: x,y,height`. **Security triage:** no security-relevant changes detected — a
presentational chart with no IO and no dependency change; the only values reaching `style` are
rounded geometry numbers, and the tooltip renderer's output is React-escaped. **One seam:** no
real-Chrome pass — nothing mounts a vertical bar chart until US-034.

### 2026-09-09 — US-019 Grouped bar chart tile ✅ (3 pts)

**Delivered:** `app/components/charts/grouped-bars.tsx` — two seasons per fixture for US-036's
ticket-revenue hero, three exports, one per seam:
```tsx
<GroupedBarTile title="Matchday ticket revenue by fixture (CHF 000)"   // Card + chart
  period="eight highest-grossing home fixtures" groups={fixtures}
  previousLabel="25/26" currentLabel="26/27" format={money} formatDelta={signedMoney} />
<GroupedBars groups={fixtures} height={260} label="…" tooltip={(i) => …} />   // no card
export function groupedBarGeometry(groups, height?): GroupedBarGeometry | null   // pure, no DOM
```

**THE OVERLAP FIX IS STRUCTURAL, AND BOTH HALVES ARE MEASURED — it cannot be reverted by accident.**
The reported defect was overlapping numbers: the y-axis figures collided with the delta chips, and at
eight pairs the chips collided with each other.
1. **The gutter.** `AXIS_GUTTER` (44 units) belongs to the scale alone; `plotLeft` is its right edge
   and *every* bar, chip cell, fixture label and legend row is inset to it. Tests assert
   `axisLabelX < plotLeft` and `chipLeft >= plotLeft` for all eight pairs, and read the rendered
   strip's own `left` percentage back off the DOM.
2. **The headroom.** `CHIP_BAND` (34 units) at the top of the plot is reserved for the chips, and the
   axis maximum is **derived from the geometry** (`plotHeight / barZoneHeight`, fed to US-018's
   `niceMax`, which only rounds up) so no bar can enter it whatever the data. The test proves
   `tallestBarTop - plotTop >= CHIP_BAND` across seven datasets × three heights — including
   `previous: 500, current: 500`, which a fixed 10% headroom fails. Replacing the derived factor with
   `1.1` fails that test, so the decision is pinned by an assertion, not by a comment.

The chips are one flex strip across that band, one equal-width cell per pair, so **neighbour overlap
is impossible by layout** as well as by arithmetic (`chipRight[i] <= chipLeft[i+1]`, verified at 8
and at 14 pairs). Each chip is US-017's `DeltaChip` — arrow, explicit sign, spoken direction — and
the tooltip's is its `light` variant on the navy box. **There are deliberately no per-bar value
labels:** sixteen figures above sixteen bars *was* the collision, so the gutter carries the
magnitudes, the chip the movement and the hover box the exact readings; the one exception is a
**labelled zero** at the baseline, where a bar with no height would otherwise be an invisible
reading. Pairs and chip cells are keyed by fixture, so a data change transitions the same rects —
element identity is asserted across a change *and* a re-rank, and an index key fails exactly that
test. Reduced motion lands on final heights with **zero frames requested**. `niceMax` / `vBarHeight`
/ `V_BAR_SERIES` (US-018) and `tooltipAnchor` / `nextHoverIndex` (US-025) are imported, not restated.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 1205/1205 (63 new) · build ✅ · coverage **100% on
the new file** (all four metrics); 99.8% stmts / 98.4% branches overall. **Security triage:** no
security-relevant changes detected — a presentational chart with no IO, no dependency change, no
`dangerouslySetInnerHTML` (asserted absent); the only values reaching `style` are rounded geometry
numbers and closed token references. **One seam:** no real-Chrome pass — nothing mounts a grouped
bar chart until US-036.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** In Progress — US-027, US-017, US-021, US-025, US-026, US-018, US-019 done
(7/11 · 19/29). Phase 2a is CLOSED (5/5) after US-016, which gave US-025/US-026/US-027 their
Chrome pass.
**Next: US-020** — donut / ring tile; segments must morph via dasharray/dashoffset, and the rounding
correction has to make the parts sum exactly to the total.
**Previous:** [Phase 2a](phase-2a.md) · **Next:** [Phase 3a — Conversation](phase-3a.md)
