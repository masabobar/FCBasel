# Phase 2b: Chart & Tile Component Library

**Duration:** 2026-09-11 to 2026-09-12 (~12.0 AI-hours)
**Status:** In Progress (4/11 stories · 11/29 points)
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

**Priority:** P0 (US-026 is P1) · **Status:** In Progress (4/11) · **Dependencies:** US-003, US-005

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-017 | KPI tile & variance chip | 2 | P0 | ✅ Done |
| US-018 | Vertical bar chart tile | 3 | P0 | 📋 Todo |
| US-019 | Grouped bar chart tile | 3 | P0 | 📋 Todo |
| US-020 | Donut / ring tile | 3 | P0 | 📋 Todo |
| US-021 | Horizontal bar tile | 3 | P0 | ✅ Done |
| US-022 | Department table tile | 3 | P0 | 📋 Todo |
| US-023 | Driver / breakdown tile | 2 | P0 | 📋 Todo |
| US-024 | Recommendation panel & narrative caption strip | 2 | P0 | 📋 Todo |
| US-025 | Line chart component | 3 | P0 | ✅ Done |
| US-026 | Segmented period filter control | 2 | **P1** | 📋 Todo |
| US-027 | Motion & animation hooks | 3 | P0 | ✅ Done |

**Technical Notes:**

- **Charts are hand-built SVG, ported from the reference build** (decided 2026-09-09). No charting
  library, no TanStack Table. The deciding factor was animation: bars persisting across data changes,
  donut segments morphing via `stroke-dasharray`, line stroke-draw on re-key, and count-up from the
  **current displayed value** — "most of the wow", and awkward to guarantee in a library.
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

> The **single largest block** in the build (23% of effort) and the most repetitive — the best place
> to find the estimate's SPEED_FACTOR too cautious.

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 11 / 29 (38%)
- **Completed Stories:** 4 / 11
- **Tests Passing:** 953 / 953 · **Coverage:** 99.9% stmts / 98.6% branches · **Commits:** 3

---

## Dependencies

**Depends On:** US-003 (tokens), US-005 (card shell) from Phase 1a; US-011 (formatters) from Phase 1b.

**Blocks:**
- Every hero in Phase 3b composes these components
- US-013 (baseline Top Products) needs US-021
- US-016 (hero band) needs US-025, US-026, US-027

**Internal ordering:** US-027 → everything else. US-021 → US-023 (the driver tile reuses the bar row).

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| A per-hero copy of a chart type is created under time pressure | Medium | Medium | Genuinely shared components is an explicit acceptance criterion on every story | AI | Open |
| Filter change snaps values to zero instead of transitioning | High | Medium | Count-up tracks the last displayed value in a ref; bars keyed by category | AI | 🔄 Half closed — and now proven for GEOMETRY too: US-021's rows are keyed by name, so a test shows the same bar element surviving a data change and its width moving 100% → 50% while the figure counts from the one on screen. US-025 adds the LINE proof: a re-key replays the stroke draw while a data-only change leaves the line drawn, so nothing flashes. Remaining: US-018, US-020 |
| SVG gradient ids collide across simultaneous charts | Medium | Medium | Stable unique-id hook per component instance (US-027) | AI | ✅ Closed — `useUid` (US-027) and now proven on a real component: two KPI sparklines carry different gradient ids (US-017), and US-025's band + Hero 2 charts on one screen carry distinct ids with each area fill pointing at its own |
| Hand-built SVG takes longer than a library would | Medium | Medium | Port from the reference rather than writing fresh; the components already exist and work | AI | Open |
| Long labels overflow their tile | Low | Medium | Wrap or truncate-with-tooltip; never overflow | AI | ✅ Closed for the shared bar row (US-021): the 150px label column wraps (`break-words`) and a test rejects `truncate` / `text-ellipsis` / `line-clamp`. US-025's legend wraps and its tooltip flips inside the plot near an edge, so neither clips at 1080p |
| A named type-size token is silently dropped beside a colour token | Medium | **High** | `tailwind-merge` reads `text-caption` as a colour; the type scale is now declared in `app/lib/cn.ts`, derived from the token set | AI | ✅ Closed by US-017 for every component that follows |

---

## Progress Log

### 2026-09-09 — US-027 Motion & animation hooks ✅ (3 pts)

**Delivered:** the four hooks every animated component in this epic keys off, in
`app/lib/hooks/use-motion.ts` (technical spec §4.1's reserved slot). The consumer API in full:

```ts
useReducedMotion(): boolean                                  // tracks the preference
useGrow(): boolean                                           // false → true after two frames
useCountUp(target: number, animationMs?: number): number     // from the CURRENT displayed value
useUid(prefix?: string): string                              // "bars-r3" — one id per instance
COUNT_UP_DURATION_MS                                         // 900, from the token set
```

**Count-up from the current displayed value.** The figure on screen is mirrored in a ref as each
frame commits it, and the effect reads that ref (never depends on it) when the target changes — so a
retargeted animation opens on the mid-flight figure and lands *exactly* on the target, both ways.

**Reduced motion means final state in the SAME RENDER, not one effect later.** `useGrow` returns
`grown || reduced`, `useCountUp` returns `reduced ? target : displayed`; under the preference
`useGrow` is `true` on the first render with **zero** frames requested, and a preference flipped
mid-animation abandons the frame — US-006's CSS rule restated in JavaScript, holding even without
`requestAnimationFrame`. **One reduced-motion source of truth:** `reducedMotionQuery()` in
`app/lib/motion.ts` (the string `app/app.css` matches on) behind `useSyncExternalStore` — a test
fails if the hook file calls `matchMedia` itself, and SSR is proven by `renderToString` plus a
`hydrateRoot` pass that fails on `console.error`.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 644/644 tests ✅ (52 new) · build ✅ · coverage 100%
stmts / 99.4% branches. **Security triage:** no security-relevant changes detected — the one value
reaching the DOM is `useUid`'s id, sanitised to `[A-Za-z0-9_-]`. **One seam:** no browser pass.

### 2026-09-09 — US-017 KPI tile & variance chip ✅ (2 pts)

**Delivered:** three exports, so nothing has to be forked later — `delta-chip.tsx` (`DeltaChip`,
wanted alone by US-019/US-022/US-016) and `kpi-tile.tsx` (`KpiSparkline`, `KpiFigure`, `KpiTile`).

```tsx
<KpiTile title="Webshop revenue" period="This month" value={148_200} format={formatMoney}
         delta={{ value: 12 }} subtitle="vs last month" sparkline={sixPoints} />
<KpiFigure value={7_830_000} format={formatMoneyMillions} delta={{ value: -0.6 }} onDark />
```

**Colour is never the sole signal, and it is TESTED that way.** The chip carries direction four
independent times — glyph, explicit `+`/`-` from `formatSignedPercent`, an `sr-only` word, and the
token colour. The proof is the `light` variant: on navy both directions share one white treatment
(the negative token falls to ~2:1 there), and a test asserts the two chips' class strings are
**identical** while sign, glyph and spoken word still differ. Red never means "bad" — only
`variancePositive` / `varianceNegative`, and a test rejects `text-red` on the chip.

**Direction is not judgement.** The arrow follows the arithmetic; the colour follows the meaning, so
Marketing's overspend (UP *and* ADVERSE) comes through an optional `judgement` prop fed from
`varianceJudgement` (US-010) — the chip never re-derives good/bad from a sign. A zero is a **labelled
zero**: dash glyph, `+0%`, the neutral treatment rather than either variance token, "unchanged" spoken.

**One tile carries all three consumers without a variant per hero.** Extra hero content arrives as
`children`; `onDark` on `KpiFigure` is what US-016's navy band composes, forcing the chip's `light`
variant so nobody can leave a red figure on navy.

**The US-012 trap is closed at the root.** `tailwind-merge` reads our named type scale as colours, so
a size beside a colour was silently lost. `app/lib/cn.ts` now declares the scale as the `font-size`
group, **derived from `tokens.fontSize` through the same `cssVariableName` mapping Tailwind generates
the utility from**, so a new token cannot drift. Asserted in `tests/unit/cn.test.ts`.

**Motion is US-027's, with nothing added** — a test greps this file and fails on `useState`,
`setTimeout`, `setInterval` or `requestAnimationFrame`. The sparkline draws with `pathLength="1"` + a
dash offset and paints with `currentColor`, so no colour prop can smuggle a hex through. The frame
and preference stubs moved to `tests/unit/support/motion-harness.ts` — one harness for all nine.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 722/722 tests ✅ (78 new) · build ✅ · coverage 100%
stmts / 99.5% branches. `.kpi-number` was checked to sit *before* the utilities layer so `onDark`'s
white wins. **Security triage:** no security-relevant changes detected.

**One seam, stated plainly:** no real-Chrome pass here — nothing in the app mounted these components
yet. *(Closed 2026-09-09: US-013's baseline row gave US-017, US-021 and US-027 their browser pass —
54 distinct KPI strings and 43 distinct bar widths per frame, two values only under reduced motion.)*

### 2026-09-09 — US-021 Horizontal bar tile ✅ (3 pts)

**Delivered:** `app/components/charts/h-bars.tsx` — the most reused chart in the product. Three
exports, one per seam:

```tsx
<HBarTile title="Top products" period="Units sold" rows={rows} series="blue" />   // Card + rows
<HBars rows={declines} negative format={formatMoneyCompact} />                   // rows, no card
<HBarRow name="Paid social" value={150_000} max={240_000} format={fmt} />        // one row
```

**Both review decisions are asserted, not just implemented.** The label column is 150px at weight 500
with **no truncation** — a test reads `150px` back off every rendered label, rejects `truncate` /
`text-ellipsis` / `line-clamp`, and pins `Cap "Rotblau"` and `Home shirt 26/27` as full strings (a
long label wraps). The value column is 96px `nowrap`, read back through `getComputedStyle` on every
row of three lists, with `-CHF 150k` proven to be a single text node. Both widths are inline geometry
from one exported constant, so each decision has one home.

**One rule carries all five consumers: the sign of the displayed figure.** A negative row grows
leftwards from the far edge in the variance-negative token and its text carries the `-`; everything
else grows rightwards in its series colour. `negative` mode is then just "every row is a decline" —
it negates the stored magnitude (Hero 2 stores `drop: 150`) so `formatMoneyCompact` produces
`-CHF 150k` with the minus **before** the unit, idempotently. The same rule handles the badge trend's
mixed signs (+38%, +6%, -3%) from one dataset. Colour is never the sole signal: direction is the
anchor side, the token *and* the sign, published as `data-direction` so nothing reads a pixel.

**Nothing snaps to zero.** Rows are keyed by name, so a filter change transitions the *same* bar's
width (a test holds element identity across a rerender: 100% → 50%) while `useCountUp` carries the
figure on from what is on screen. The exported pure `hBarMax` / `hBarPercent` return zero width
rather than `NaN`, so a zero is a **labelled zero** with its track, in the neutral treatment.

**Reuse seam for US-023:** the driver tile is `HBarTile` with `format={formatMoneyCompact}` and its
`-CHF 400k total` chip in the card's `action` slot, which passes straight through `Card` (asserted).

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 777/777 tests ✅ (55 new) · build ✅ · coverage 100%
stmts / 99.6% branches; every new utility confirmed in the compiled stylesheet.
**Security triage:** no security-relevant changes detected.

**One deliberate deviation from the reference, flagged for review:** the reference draws
negative-mode bars rightwards; here a decline grows **leftwards**, so direction survives a projector
that washes the red out. Reverting it is one line; the 150px and 96px decisions must not be.

### 2026-09-09 — US-025 Line chart component ✅ (3 pts)

**Delivered:** `app/components/charts/line-chart.tsx` — the only line chart in the product, built for
both consumers at once. Four exports, one per seam:

```tsx
<LineChart key={period} dark legend={false} xs={p.labels} format={formatMoney}   // US-016 band
  series={[{ name: "Previous", values: p.previous, color: "white", dash: true },
           { name: p.label,    values: p.current,  color: "gold",  area: true }]} />
<LineChartLegend series={bandSeries} dark />       // the band puts its legend in its own header
<LineChart xs={months} height={210} format={fmt}   // US-036, light, twelve months, both seasons
  series={[{ name: "Season 25/26", values: s2526, color: "navy" }, { …, area: true }]} />
<LineChartTile title="Ticket revenue by month" period="All home fixtures" … />  // Card + chart
```

**The stroke draw survives reduced motion, and it is proven, not asserted in prose.** A solid line
normalises its own length (`pathLength="1"`), so one dash of 1 covers it and the offset transitions
1 → 0 — no measurement, no per-frame JavaScript. Under the preference `useGrow` is `true` in the
**first** render, so a test reads `stroke-dashoffset="0"` with **zero frames requested**, and again
after a re-key: the line is never stranded at offset 1 awaiting a transition that will not run. A
dashed line cannot draw that way (its dasharray *is* the pattern) so it fades, at full opacity in
that same first render. Flipping the preference mid-entrance resolves the offset immediately.

**It replays by being re-keyed, and there is no second mechanism.** No `replay` prop, no effect
watching the data: `<LineChart key={period}>` remounts and `useGrow` starts at `false` again. Tests
hold both halves — a re-key returns the offset to 1 and clears the hover guide, while a data change
*without* a key change leaves it drawn (no flash).

**Hover shows EVERY series at the hovered x.** The pointer is mapped over the wrapper (the svg's
units are stretched by the `viewBox`) to the nearest index by the exported pure `hoverIndex`; a guide
plus one dot per series is drawn there and the tooltip lists every series' reading — tested by
hovering an exact x and reading the whole tooltip back through US-011's formatters. Keyboard access
came cheap: `tabIndex=0` plus arrow/Home/End/Escape through the pure `nextHoverIndex`, which returns
`null` for every other key, so Tab is not captured (tested).

**Two charts on screen cannot collide.** Gradient ids come from `useUid`; a test renders the band and
Hero 2 together and asserts two distinct ids **and** that each area fill points at its own (the
reference's module-global counter is not used; a test rejects a literal `id="…"`).

**No hex, and no colour parked where a CSS parser may drop it.** Series colours are token names
(`red`/`blue`/`navy`/`gold`/`white`) resolved through `cssVariable` to `var(--color-…)`: the svg takes
them as presentation attributes, the two DOM swatches as a `--line-series` custom property read back
by `bg-[var(--line-series)]`. Gold is a legitimate *series* colour here — navy band only, per the
Guide — and the light default cycle never reaches for it. A zero is a **labelled zero**: `valueAt`
reads a missing, short or non-finite point as `0`, so no `NaN` enters a `d` and the twelve-month axis
still runs full length. Axis labels use the 12px `--text-chart-axis` token rather than the
reference's 10px (E8); the legend wraps, and the tooltip flips inside the plot near either edge.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 953/953 tests ✅ (73 new) · build ✅ · coverage 100%
lines / 100% funcs / 99.3% stmts on the new file (99.9% / 98.6% overall); every new utility confirmed
in the compiled stylesheet. **Security triage:** no security-relevant changes detected — names and
labels are React-escaped and the only values reaching `style` are data numbers plus a token
reference. **One seam:** no real-Chrome pass — nothing mounts a line chart until US-016.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** In Progress — US-027, US-017, US-021, US-025 done (4/11 · 11/29). Phase 2a's
deferred US-013 was completed inside this run (Phase 2a now 4/5 · 11/16), giving US-017/US-021/US-027
their first Chrome pass. **Next: US-026** — the last piece US-016's hero band is waiting on.
**Previous:** [Phase 2a](phase-2a.md) · **Next:** [Phase 3a — Conversation](phase-3a.md)
