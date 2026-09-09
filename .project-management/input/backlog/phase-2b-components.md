# Phase 2b: Chart & Tile Component Library

**Goal:** The reusable visual kit the heroes are assembled from — composition, not bespoke work per
screen. Styled from the E2 tokens, fed from the E3 data.
**Duration:** Days 2-3 (of a one-week build)
**Total Stories:** 11
**Total Points:** 29
**Status:** In Progress (3/11 completed)

> **Global guardrails apply** — see [`../constraints.md`](../constraints.md) §2.

---

## Epic 5: E6 — Chart & Tile Component Library

**Priority:** P0
**Total Story Points:** 29
**Status:** In Progress (3/11 completed)
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
  - **Completion note (2026-09-09):** All three criteria met. `DeltaChip` lives in
    `app/components/tiles/delta-chip.tsx` on its own, because US-019, US-022 and US-016 want the chip
    without a tile around it; `KpiSparkline`, `KpiFigure` and `KpiTile` are in
    `app/components/tiles/kpi-tile.tsx`. **Colour is never the sole signal, and the `light` variant
    proves it:** on navy both directions share one white treatment, and a test asserts the two chips'
    class strings are identical while the glyph, the explicit sign and an `sr-only` word still differ.
    Direction is arithmetic and judgement is meaning, so an optional `judgement` prop draws
    Marketing's overspend as an up arrow in the negative token; a zero is a labelled zero. Hero extras
    arrive as `children` and the navy band composes `KpiFigure onDark` — **no variant per hero**.
    Motion is US-027's only and every string comes from US-011. Also closed the US-012
    `tailwind-merge` trap at the root in `app/lib/cn.ts`. 78 tests added (722/722, gates clean).

- **US-018**: Vertical bar chart tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Gradient vertical bars with rounded caps, used for the kit split.
  - **Acceptance Criteria:**
    - Gridlines, count-up value labels, hover highlight
    - Optional per-bar tooltip renderer (used to show units, share and revenue together)
    - Bars persist across data changes (keyed by category) so a filter change transitions height and
      position via CSS while the label counts up — never a snap to zero
  - **Dependencies:** US-005, US-027

- **US-019**: Grouped bar chart tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Paired two-season bars per fixture for the ticket-revenue hero.
  - **Acceptance Criteria:**
    - Two bars per fixture (25/26 navy, 26/27 red) with a year-on-year delta chip above each pair
    - **Y-axis scale sits in a dedicated left gutter with headroom above the bars, so delta chips
      never collide with the axis or each other**
    - Per-fixture hover tooltip showing both seasons and the delta
  - **Dependencies:** US-005, US-027
  - **Notes:** The overlap fix is an explicit review decision — do not revert it.

- **US-020**: Donut / ring tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Segmented ring with a centre total, used for sponsor-badge share.
  - **Acceptance Criteria:**
    - Segments with small gaps; centre shows the total and counts up
    - Hovering a segment **or its legend row** thickens that segment and swaps the centre to that
      segment's figure
    - On a data change, segments morph via `stroke-dasharray` / `stroke-dashoffset` transitions
    - Segment values derive from the fixed percentage split with rounding corrected so parts sum
      exactly to the total
  - **Dependencies:** US-005, US-027

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
    **Both review decisions are read back off the rendered element by tests**, not merely written:
    150px label at weight 500 with `truncate` / `text-ellipsis` / `line-clamp` rejected (long labels
    wrap), and a 96px `nowrap` value column proven on three different lists with `-CHF 150k` a single
    text node. One rule serves all five consumers — the sign of the displayed figure sets the anchor
    side, the token and the text sign — so `negative` mode is just "every row is a decline" (it
    negates the stored magnitude, idempotently) and the badge trend's mixed signs work unchanged.
    Rows keyed by name, so a data change transitions the same bar (100% → 50%) while `useCountUp`
    continues from the figure on screen; `hBarMax` / `hBarPercent` are pure and return zero width,
    never `NaN`, so a zero is a labelled zero. US-023 composes this, with nothing to reimplement.
    55 tests added (777/777, gates clean, coverage 100% stmts).

- **US-022**: Department table tile
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
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

- **US-023**: Driver / breakdown tile
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Small contribution bars for the causal follow-ups.
  - **Acceptance Criteria:**
    - Renders ranked contribution bars with a custom value formatter
    - Supports an `action`-slot badge (e.g. a `-CHF 400k total` summary chip)
    - Reuses the horizontal bar row — not a second implementation
  - **Dependencies:** US-021

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
  - **Status:** Todo
  - **Description:** Multi-series line chart for the hero band and the month-by-month comparison.
  - **Acceptance Criteria:**
    - One or more series, each optionally an area fill or a dashed line; legend
    - Hover guide line plus a tooltip showing every series' value at the hovered point
    - Stroke-draw entrance animation; re-keys cleanly on a filter change so it replays
    - `dark` variant for the navy hero band
    - Scales to its container via `viewBox` and `width: 100%`
  - **Dependencies:** US-005, US-027

- **US-026**: Segmented period filter control
  - **Story Points:** 2
  - **Priority:** P1
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** The pill filter control used by the hero band, Top Products and Hero 1.
  - **Acceptance Criteria:**
    - Renders in a card's `action` slot or a section header
    - `light` and `dark` variants
    - 11px corner radius (not a full pill), with a lift-and-tint hover
  - **Dependencies:** US-003

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
**By Status:** ✅ 2 stories, 5 points · 🔄 0 · 📋 9 stories, 24 points · ⏸️ 0

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-2a-shell.md) · [Next Phase →](phase-3a-conversation.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
