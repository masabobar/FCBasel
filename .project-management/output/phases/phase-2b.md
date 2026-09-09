# Phase 2b: Chart & Tile Component Library

**Duration:** 2026-09-11 to 2026-09-12 (~12.0 AI-hours)
**Status:** In Progress (6/11 stories · 16/29 points)
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

**Priority:** P0 (US-026 is P1) · **Status:** In Progress (6/11) · **Dependencies:** US-003, US-005

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-017 | KPI tile & variance chip | 2 | P0 | ✅ Done |
| US-018 | Vertical bar chart tile | 3 | P0 | ✅ Done |
| US-019 | Grouped bar chart tile | 3 | P0 | 📋 Todo |
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
- **Completed Story Points:** 16 / 29 (55%)
- **Completed Stories:** 6 / 11
- **Tests Passing:** 1142 / 1142 · **Coverage:** 99.8% stmts / 98.3% branches · **Commits:** 5

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
| Filter change snaps values to zero instead of transitioning | High | Medium | Count-up tracks the last displayed value in a ref; bars keyed by category | AI | 🔄 Half closed — and now proven for GEOMETRY too: US-021's rows are keyed by name, so a test shows the same bar element surviving a data change and its width moving 100% → 50% while the figure counts from the one on screen. US-025 adds the LINE proof: a re-key replays the stroke draw while a data-only change leaves the line drawn, so nothing flashes. US-018 adds the VERTICAL BAR proof, and it is a re-rank rather than a rerender: the same `<rect>` survives, transitions height *and* position, and each label stays with its own category — switching the key to the index fails two tests. Remaining: US-020 |
| SVG gradient ids collide across simultaneous charts | Medium | Medium | Stable unique-id hook per component instance (US-027) | AI | ✅ Closed — `useUid` (US-027) and now proven on a real component: two KPI sparklines carry different gradient ids (US-017), and US-025's band + Hero 2 charts on one screen carry distinct ids with each area fill pointing at its own |
| Hand-built SVG takes longer than a library would | Medium | Medium | Port from the reference rather than writing fresh; the components already exist and work | AI | Open |
| Long labels overflow their tile | Low | Medium | Wrap or truncate-with-tooltip; never overflow | AI | ✅ Closed for the shared bar row (US-021): the 150px label column wraps (`break-words`) and a test rejects `truncate` / `text-ellipsis` / `line-clamp`. US-025's legend wraps and its tooltip flips inside the plot near an edge, so neither clips at 1080p. US-018 keeps its category labels as DOM text under the plot *because* SVG text cannot wrap |
| A named type-size token is silently dropped beside a colour token | Medium | **High** | `tailwind-merge` reads `text-caption` as a colour; the type scale is now declared in `app/lib/cn.ts`, derived from the token set | AI | ✅ Closed by US-017 for every component that follows |

---

## Progress Log

### 2026-09-09 — US-027 Motion & animation hooks ✅ (3 pts)

**Delivered:** `app/lib/hooks/use-motion.ts` — `useReducedMotion()`, `useGrow()`,
`useCountUp(target, animationMs?)`, `useUid(prefix?)`, `COUNT_UP_DURATION_MS` (900, from the token
set). Every animated component in this epic keys off these four. **Count-up runs from the figure on
screen**, mirrored in a ref as each frame commits it and read (never depended on) when the target
changes, so a retargeted animation opens mid-flight and lands *exactly* on target. **Reduced motion
is final state in the SAME render:** `useGrow` returns `grown || reduced` with **zero** frames
requested. One reduced-motion source (`reducedMotionQuery()` behind `useSyncExternalStore`); SSR
proven by `renderToString` + `hydrateRoot`.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 644/644 (52 new) · build ✅ · coverage 100% stmts /
99.4% branches. **Security triage:** none — the one value reaching the DOM is `useUid`'s sanitised id.

### 2026-09-09 — US-017 KPI tile & variance chip ✅ (2 pts)

**Delivered:** `delta-chip.tsx` (`DeltaChip`, wanted alone by US-019/US-022/US-016) and `kpi-tile.tsx`
(`KpiSparkline`, `KpiFigure`, `KpiTile`) — so nothing has to be forked later.
**Colour is never the sole signal, and it is TESTED that way.** The chip carries direction four
independent times — glyph, explicit `+`/`-`, an `sr-only` word, and the token. The proof is the
`light` variant: on navy both directions share one white treatment and a test asserts the two class
strings are **identical** while sign, glyph and spoken word still differ; a test rejects `text-red`.
**Direction is not judgement:** Marketing's overspend arrives through an optional `judgement` prop
fed from `varianceJudgement` (US-010). A zero is a **labelled zero**; `onDark` forces the chip's
`light` variant. **The US-012 trap is closed at the root:** `app/lib/cn.ts` declares our named type
scale as `tailwind-merge`'s `font-size` group, derived from `tokens.fontSize` through the same
mapping Tailwind generates the utility from, so a size beside a colour is no longer dropped.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 722/722 (78 new) · build ✅ · coverage 100% stmts /
99.5% branches. **Security triage:** none. *(The "no browser pass" seam closed 2026-09-09 with
US-013's baseline row, which gave US-017/US-021/US-027 their Chrome pass.)*

### 2026-09-09 — US-021 Horizontal bar tile ✅ (3 pts)

**Delivered:** `app/components/charts/h-bars.tsx` — the most reused chart in the product, three
exports, one per seam:
```tsx
<HBarTile title="Top products" period="Units sold" rows={rows} series="blue" />   // Card + rows
<HBars rows={declines} negative format={formatMoneyCompact} />                   // rows, no card
<HBarRow name="Paid social" value={150_000} max={240_000} format={fmt} />        // one row
```

**Both review decisions are asserted, not just implemented.** The label column is 150px at weight 500
with **no truncation** — a test reads `150px` back off every label, rejects `truncate` /
`text-ellipsis` / `line-clamp`, and pins `Cap "Rotblau"` as a full string (long labels wrap). The
value column is 96px `nowrap`, read back through `getComputedStyle` on every row of three lists, with
`-CHF 150k` proven a single text node. Both are inline geometry from one exported constant.

**One rule carries all five consumers: the sign of the displayed figure.** A negative row grows
leftwards from the far edge in the variance-negative token and its text carries the `-`; everything
else grows rightwards in its series colour. `negative` mode is then just "every row is a decline" —
it negates the stored magnitude (Hero 2 stores `drop: 150`) so `formatMoneyCompact` produces
`-CHF 150k` idempotently, and the same rule handles mixed signs from one dataset. Direction is the
anchor side, the token *and* the sign, published as `data-direction`. **Nothing snaps to zero** —
rows are keyed by name, so a filter change transitions the *same* bar's width (element identity held
across a rerender: 100% → 50%); `hBarMax` / `hBarPercent` return zero, never `NaN`. **Reuse seam for
US-023:** the driver tile is `HBarTile` with its `-CHF 400k total` chip in the card's `action` slot.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 777/777 (55 new) · build ✅ · coverage 100% stmts /
99.6% branches; every new utility confirmed in the compiled stylesheet. **Security triage:** none.
**One deliberate deviation, flagged for review:** the reference draws negative-mode bars rightwards;
here a decline grows **leftwards**, so direction survives a washed-out projector. Reverting it is one
line; the 150px and 96px decisions must not be.

### 2026-09-09 — US-025 Line chart component ✅ (3 pts)

**Delivered:** `app/components/charts/line-chart.tsx` — the only line chart in the product, built for
both consumers at once, four exports, one per seam:
```tsx
<LineChart key={period} dark legend={false} xs={p.labels} format={formatMoney}   // US-016 band
  series={[{ name: "Previous", values: p.previous, color: "white", dash: true },
           { name: p.label, values: p.current, color: "gold", area: true }]} />
<LineChartLegend series={bandSeries} dark />       // the band places its own legend
<LineChartTile title="Ticket revenue by month" xs={months} height={210} … />  // US-036, light
```

**The stroke draw survives reduced motion, and it is proven, not asserted in prose.** A solid line
normalises its own length (`pathLength="1"`), so one dash of 1 covers it and the offset transitions
1 → 0 — no measurement, no per-frame JavaScript. Under the preference `useGrow` is `true` in the
**first** render, so a test reads `stroke-dashoffset="0"` with **zero frames requested**, and again
after a re-key: the line is never stranded at offset 1 awaiting a transition that will not run. A
dashed line cannot draw that way (its dasharray *is* the pattern) so it fades in instead, at full
opacity in that same first render. **It replays by being re-keyed, with no second mechanism** — no
`replay` prop, no effect watching the data; a re-key returns the offset to 1 and clears the hover
guide, while a data change *without* a key change leaves it drawn (no flash).

**Hover shows EVERY series at the hovered x.** The pointer is mapped over the wrapper (the svg's
units are stretched by the `viewBox`) to the nearest index by the exported pure `hoverIndex`; a guide
plus one dot per series is drawn and the tooltip lists every series' reading through US-011's
formatters. Keyboard access came cheap: `tabIndex=0` plus arrow/Home/End/Escape through the pure
`nextHoverIndex`, which returns `null` for every other key so Tab is not captured. **Two charts
cannot collide:** gradient ids come from `useUid`, proven distinct with both charts on screen.

**No hex, and no colour parked where a CSS parser may drop it.** Series colours are token names
resolved through `cssVariable` to `var(--color-…)`: the svg takes them as presentation attributes,
the two DOM swatches as a `--line-series` custom property read back by `bg-[var(--line-series)]`.
Gold is a legitimate *series* colour here — navy band only, per the Guide. A zero is a **labelled
zero**: `valueAt` reads a missing or non-finite point as `0`, so no `NaN` enters a `d`. Axis labels
use the 12px `--text-chart-axis` token, not the reference's 10px (E8).

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 953/953 (73 new) · build ✅ · coverage 100%
lines / 100% funcs / 99.3% stmts on the new file (99.9% / 98.6% overall); every new utility confirmed
in the compiled stylesheet. **Security triage:** no security-relevant changes detected — names and
labels are React-escaped and the only values reaching `style` are data numbers plus a token
reference. **One seam:** no real-Chrome pass — nothing mounts a line chart until US-016.

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

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** In Progress — US-027, US-017, US-021, US-025, US-026, US-018 done (6/11 · 16/29).
Phase 2a is CLOSED (5/5) after US-016, which gave US-025/US-026/US-027 their Chrome pass.
**Next: US-019** — grouped bars; the y-axis gutter with headroom must not be reverted.
**Previous:** [Phase 2a](phase-2a.md) · **Next:** [Phase 3a — Conversation](phase-3a.md)
