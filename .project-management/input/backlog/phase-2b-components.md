# Phase 2b: Chart & Tile Component Library

**Goal:** The reusable visual kit the heroes are assembled from — composition, not bespoke work per
screen. Styled from the E2 tokens, fed from the E3 data.
**Duration:** Days 2-3 (of a one-week build)
**Total Stories:** 11
**Total Points:** 29
**Status:** In Progress (10/11 completed)

> **Global guardrails apply** — see [`../constraints.md`](../constraints.md) §2.

---

## Epic 5: E6 — Chart & Tile Component Library

**Priority:** P0
**Total Story Points:** 29
**Status:** In Progress (10/11 completed)
**Source:** Build Specification E6; Reference Implementation Guide §8.

> **Applies to every story in this epic:**
> - **Presentational and stateless** — data arrives as a prop; **no live computation**, no fetching.
> - Series use brand red/blue; variance uses only pos/neg tokens **plus an explicit sign and arrow**,
>   so a washed-out projector cannot make the meaning ambiguous. Gold only for target-hit marks.
> - Money/percentage/variance formatting consistent everywhere (US-011); legible at 1080p.
> - Genuinely shared — **no per-hero copies**. Long labels wrap or truncate-with-tooltip, never
>   overflow; a zero renders as a labelled zero.
> - **Hand-built SVG, ported from the reference build** — no charting library, no TanStack Table
>   (decided 2026-09-09; see [`../technologies.md`](../technologies.md)).

### Stories:

- **US-017**: KPI tile & variance chip
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** A labelled big number with a delta chip, optional sparkline and subtitle.
  - **Acceptance Criteria:**
    - Large number (30px/700, tight tracking, tabular numerals) with count-up
    - Delta chip shows arrow + value using pos/neg tokens with explicit sign; `light` variant for
      dark backgrounds
    - Optional sparkline and optional supporting subtitle
  - **Dependencies:** US-005, US-027
  - **Completion note (2026-09-09):** All three criteria met. `DeltaChip` is in
    `app/components/tiles/delta-chip.tsx` on its own (US-019/US-022/US-016 want the chip without a
    tile); `KpiSparkline` / `KpiFigure` / `KpiTile` are in `kpi-tile.tsx`. **Colour is never the sole
    signal, and the `light` variant proves it:** on navy both directions share one white treatment
    while glyph, sign and an `sr-only` word still differ. Direction is arithmetic, judgement is
    meaning — an optional `judgement` prop draws Marketing's overspend as an up arrow in the negative
    token; a zero is a labelled zero. Also closed the US-012 `tailwind-merge` trap in
    `app/lib/cn.ts`. 78 tests (722/722). *US-023 later added an optional `suffix` node to the chip,
    for `-CHF 400k total` as one chip.*

- **US-018**: Vertical bar chart tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Gradient vertical bars with rounded caps, used for the kit split.
  - **Acceptance Criteria:**
    - Gridlines, count-up value labels, hover highlight
    - Optional per-bar tooltip renderer (used to show units, share and revenue together)
    - Bars persist across data changes (keyed by category) so a filter change transitions height and
      position via CSS while the label counts up — never a snap to zero
  - **Dependencies:** US-005, US-027
  - **Completion note (2026-09-09):** All three criteria met, in
    `app/components/charts/v-bars.tsx` — `vBarGeometry` (pure), `VBars` and `VBarTile`. **Criterion
    3 is proven by a RE-RANK, not a rerender:** columns are keyed by category, so `Home` keeps the
    *same* `<rect>` and its `x` / `y` / `height` CSS transition — identity is asserted across a data
    change *and* a re-ordered dataset, and an index key fails exactly two tests; the surviving
    instance keeps its `useCountUp` state and reduced motion lands on final heights with **zero
    frames requested**. Gradient fills with rounded caps, gridlines behind, counting labels above, a
    `filter` hover highlight, an optional `tooltip(index)`, wrapping DOM-text labels. 52 tests.

- **US-019**: Grouped bar chart tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Paired two-season bars per fixture for the ticket-revenue hero.
  - **Acceptance Criteria:**
    - Two bars per fixture (25/26 navy, 26/27 red) with a year-on-year delta chip above each pair
    - **Y-axis scale sits in a dedicated left gutter with headroom above the bars, so delta chips
      never collide with the axis or each other**
    - Per-fixture hover tooltip showing both seasons and the delta
  - **Dependencies:** US-005, US-027
  - **Notes:** The overlap fix is an explicit review decision — do not revert it.
  - **Completion note (2026-09-09):** All three criteria met, in
    `app/components/charts/grouped-bars.tsx` — `groupedBarGeometry` (pure), `GroupedBars` and
    `GroupedBarTile`. Eight fixtures, sixteen bars, one `DeltaChip` per pair. **CRITERION 2 IS
    STRUCTURAL AND MEASURED:** the scale owns a 44-unit gutter, everything is inset to `plotLeft`
    (all eight pairs), and the 34-unit chip band holds because the axis maximum is **derived from the
    geometry** — a fixed 10% headroom fails the test. Chips are one flex strip of equal cells, so
    overlap is impossible by layout. No per-bar value labels by design, except a labelled zero.
    Pairs keyed by fixture; reduced motion lands final. 63 tests (1205/1205, 100%).

- **US-020**: Donut / ring tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Segmented ring with a centre total, used for sponsor-badge share.
  - **Acceptance Criteria:**
    - Segments with small gaps; centre shows the total and counts up
    - Hovering a segment **or its legend row** thickens that segment and swaps the centre to that
      segment's figure
    - On a data change, segments morph via `stroke-dasharray` / `stroke-dashoffset` transitions
    - Segment values derive from the fixed percentage split with rounding corrected so parts sum
      exactly to the total
  - **Dependencies:** US-005, US-027
  - **Completion note (2026-09-09):** All four criteria met, in
    `app/components/charts/donut.tsx` — `donutGeometry` (pure), `Donut`, `DonutTile`; deliberately
    NOT US-016's single-arc gold gauge. An arc and its legend row write ONE `hovered` index, proven
    by a cross-surface test both ways (legend rows are real `<button>`s, so focus does what hover
    does). Arcs and rows are keyed by SPONSOR, so a period press morphs the same `<circle>`'s
    dasharray while one `useCountUp` counts the centre from the figure on screen — an index key
    fails the re-rank test. `badgeSegments` (US-008) is reused rather than restated: segments sum
    exactly to the centre total on all four period totals and ten adversarial ones. Gaps are arc
    REMOVED from each segment; ids from `useUid`. 56 tests added (1261/1261, gates clean).

- **US-021**: Horizontal bar tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Ranked-list bars for top products, printed names, badge trend, declining
    fixtures and Marketing drivers.
  - **Acceptance Criteria:**
    - Fixed-width label column (150px, weight 500, **no truncation**) and per-row count-up
    - Bar width transitions on data change
    - **Value column is 96px and `white-space: nowrap`** so `-CHF 150k` never wraps — this is shared,
      so it holds everywhere these rows appear
    - Supports a `negative` mode (for revenue-drop bars) and a custom value formatter
      (e.g. `CHF 150k`, `38%`)
  - **Dependencies:** US-005, US-027
  - **Completion note (2026-09-09):** All four criteria met, in
    `app/components/charts/h-bars.tsx` — `HBarRow` (the unit of reuse), `HBars` (the ranked list) and
    `HBarTile` (`Card` + rows, `action` slot passing through for Hero 2's `-CHF 400k total` badge).
    **Both review decisions are read back off the rendered element by tests:** 150px label at weight
    500 with `truncate` / `text-ellipsis` / `line-clamp` rejected (long labels wrap), and a 96px
    `nowrap` column proven on three lists with `-CHF 150k` a single text node. One rule serves
    all five consumers — the sign of the displayed figure sets the anchor side, the token and the
    text sign — so `negative` mode is idempotent on a stored magnitude and mixed signs work
    unchanged. Rows keyed by name, so a data change transitions the same bar while `useCountUp`
    continues from the figure on screen; `hBarMax` / `hBarPercent` never yield `NaN`. 55 tests
    (777/777, clean). *US-023 composes this, adding two seams here rather than forking:
    `hBarDisplayedValue` and `HBarTile`'s `children` slot under the bars.*

- **US-022**: Department table tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** The departmental table for Hero 3.
  - **Acceptance Criteria:**
    - Columns: Department · Type (revenue/cost tag chip) · Budget · Actual · Variance (sign + token)
      · % of target (bar + percentage), plus a total row
    - Figures render in **CHF millions** with the subtitle "figures in CHF millions" — no "000" note
    - Header row **right-aligns the numeric columns including "% of target"**, so each header sits
      over its content
    - The Marketing row is visibly flagged; near-target (95-99%) marks use the gold accent
    - Row hover highlight
  - **Dependencies:** US-005, US-027
  - **Completion note (2026-09-09):** All five criteria met, in
    `app/components/tiles/department-table.tsx` — a real `<table>` (`scope="col"` headers, a
    `scope="row"` department name, `sr-only` caption), `DepartmentTable`, `DepartmentTableTile` and
    the pure `targetMark` / `targetBarPercent` / `columnAlignClass`. **THE REVENUE / COST TRAP IS
    CLOSED BY CONSTRUCTION:** the colour comes from `row.judgement` (US-010's `varianceJudgement`)
    through US-017's `DeltaChip`, so **Marketing's +410 renders UP and ADVERSE** while Sponsoring's
    +840 renders UP and FAVOURABLE; a source scan rejects `FAVOURABLE` / `ADVERSE`, any
    `variance <>` test and any `DepartmentType` equality, and the flag is `needsAttention` (one row,
    never named). **Both review decisions are asserted:** CHF **millions** with the unremovable
    "figures in CHF millions" subtitle (a test rejects `/000/` in the rendered tile), and numeric
    headers right-aligned **including "% of target"** by one `columnAlignClass` rule the header *and*
    its cells read, compared column by column. Near-target gold is shape plus an `sr-only` word;
    rows keyed by name; long names wrap inside a card-bounded scroll; totals from
    `departmentTotals()` on the rows on screen, the club variance NEUTRAL. 54 tests (1315/1315).

- **US-023**: Driver / breakdown tile
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Small contribution bars for the causal follow-ups.
  - **Acceptance Criteria:**
    - Renders ranked contribution bars with a custom value formatter
    - Supports an `action`-slot badge (e.g. a `-CHF 400k total` summary chip)
    - Reuses the horizontal bar row — not a second implementation
  - **Dependencies:** US-021
  - **Completion note (2026-09-09):** All three criteria met, in
    `app/components/tiles/driver-tile.tsx` — `DriverTile`, `DriverTotalBadge` and the pure
    `rankDrivers` / `driverTotal`. **CRITERION 3 IS THE STORY, AND IT IS ENFORCED TWO WAYS:** every
    row is US-021's `HBarRow` through `HBarTile` — the render tests read the 150px label and 96px
    `nowrap` value columns back off the rows THIS tile produced — and a source scan rejects `h-bar-*`,
    both width constants, `H_BAR_SERIES`, `width` / `toFixed` / `Math.min`, `useCountUp` / `useGrow` /
    `transition`, every `useState` / timer and every gradient class, so a sixth copy of the row cannot
    appear without failing tests. **What the tile adds, and nothing more:** (1) `rankDrivers` —
    magnitude-descending, **stable for ties**, asserted equal to US-009's `fixtureDeclines` order so
    Luzern precedes Sion, with `rank="none"` for an authored order (US-035 leads with Bitpanda);
    (2) `driverTotal` — **derived from the rows on screen** via the newly exported
    `hBarDisplayedValue`, asserted equal to `declineTotal` (-CHF 400k) and `departmentVariance`
    (CHF 410k), re-derived when the rows change; (3) a muted `note` line under the bars (US-037).
    **Two seams were added to the shared modules rather than forked:** `HBarTile`'s `children` slot
    and `DeltaChip`'s `suffix`, so `-CHF 400k total` is ONE chip keeping the arrow, the sign and the
    `sr-only` direction. The formatter is verbatim in all three shapes (`+38%`, `-CHF 150k`,
    `CHF 240k`), mixed signs render both directions, reduced motion lands final with zero frames.
    43 tests added (1358/1358, clean).

- **US-024**: Recommendation panel & narrative caption strip
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** The two elements that carry the insight beat — the peak moments of the demo.
  - **Acceptance Criteria:**
    - Recommendation panel is a gold-accented callout, **visually distinct from a data tile** — it is
      advice, not a metric
    - Narrative caption strip is a reusable one-line element **any tile can carry**, prefixed with a
      small AI glyph
    - The prominent narrative line renders under each section header, stated before the charts
  - **Dependencies:** US-005

- **US-025**: Line chart component
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Multi-series line chart for the hero band and the month-by-month comparison.
  - **Acceptance Criteria:**
    - One or more series, each optionally an area fill or a dashed line; legend
    - Hover guide line plus a tooltip showing every series' value at the hovered point
    - Stroke-draw entrance animation; re-keys cleanly on a filter change so it replays
    - `dark` variant for the navy hero band
    - Scales to its container via `viewBox` and `width: 100%`
  - **Dependencies:** US-005, US-027
  - **Completion note (2026-09-09):** All five criteria met, in
    `app/components/charts/line-chart.tsx` — `lineChartGeometry` (pure), `LineChartLegend` (on its
    own, because the band places its legend in its own header row), `LineChart` and `LineChartTile`.
    Built for BOTH consumers at once: series count is a prop, style is per-series `area` / `dash`,
    colour is a token NAME so no hex can enter. **The stroke draw survives reduced motion** —
    `pathLength="1"` normalises the length and the offset transitions 1 → 0, so under the preference
    a test reads `stroke-dashoffset="0"` with zero frames requested; a dashed line fades instead.
    **It replays by being re-keyed** and by nothing else. Hover maps to the nearest index and the
    tooltip lists EVERY series there; arrow/Home/End/Escape do the same without capturing Tab.
    Gradient ids from `useUid`; a missing point is a labelled zero. 73 tests (953/953, clean).

- **US-026**: Segmented period filter control
  - **Story Points:** 2
  - **Priority:** P1
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** The pill filter control used by the hero band, Top Products and Hero 1.
  - **Acceptance Criteria:**
    - Renders in a card's `action` slot or a section header
    - `light` and `dark` variants
    - 11px corner radius (not a full pill), with a lift-and-tint hover
  - **Dependencies:** US-003
  - **Completion note (2026-09-09):** All three criteria met, in
    `app/components/controls/segmented.tsx` — `Segmented`, the pure `nextOptionIndex` and the
    exported `CHIP_SURFACE_CLASS` US-029's chips reuse. Controlled, keys typed to the shared
    `PeriodKey` with the label as data on each entry. 11px comes from `--radius-chip` plus the new
    `.fcb-chip` rule (radius + 1px lift + transition) — `rounded-full` rejected by test. Radiogroup
    semantics: one tab stop, wrapping arrows, Home/End, selection carried by shape, shadow, weight
    *and* `aria-checked`, never colour alone. Wired in by US-016.

- **US-027**: Motion & animation hooks
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Completed
  - **Description:** The four small hooks every animated component depends on.
  - **Acceptance Criteria:**
    - Reduced-motion hook tracking `prefers-reduced-motion`
    - Grow hook returning false then true after mount, so geometry animates in — **true immediately
      under reduced motion**, so nothing is left stuck at zero
    - Count-up hook animating from the **current displayed value** to the new target (cubic ease-out,
      ~900ms), so a filter change counts from the old figure rather than snapping to zero; snaps
      under reduced motion
    - Stable unique-id hook for SVG gradient ids, so multiple charts on screen never collide
  - **Dependencies:** US-003
  - **Delivered:** `app/lib/hooks/use-motion.ts` — `useReducedMotion()`, `useGrow()`,
    `useCountUp(target, animationMs?)`, `useUid(prefix?)`. Count-up continues from the displayed
    figure (ref-tracked, proven by test); `useGrow` and `useCountUp` return final state in the same
    render under reduced motion, so nothing is stranded at zero. One reduced-motion source
    (US-006's `REDUCED_MOTION_QUERY`, via `useSyncExternalStore`); ~900ms is now the
    `duration.countUp` token.

---

## Phase Summary

**Total Epics:** 1 | **Total Stories:** 11 | **Total Points:** 29
**By Priority:** P0: 10 stories, 27 points · P1: 1 story, 2 points · P2: 0
**By Status:** ✅ 10 stories, 27 points · 🔄 0 · 📋 1 story, 2 points · ⏸️ 0

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-2a-shell.md) · [Next Phase →](phase-3a-conversation.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
