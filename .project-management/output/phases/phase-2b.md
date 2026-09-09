# Phase 2b: Chart & Tile Component Library

**Duration:** 2026-09-11 to 2026-09-12 (~12.0 AI-hours)
**Status:** ✅ Completed (11/11 stories · 29/29 points)
**Started:** 2026-09-09
**Target Completion:** 2026-09-12
**Actual Completion:** 2026-09-09

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

**Priority:** P0 (US-026 is P1) · **Status:** ✅ Completed (11/11) · **Dependencies:** US-003, US-005

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-017 | KPI tile & variance chip | 2 | P0 | ✅ Done |
| US-018 | Vertical bar chart tile | 3 | P0 | ✅ Done |
| US-019 | Grouped bar chart tile | 3 | P0 | ✅ Done |
| US-020 | Donut / ring tile | 3 | P0 | ✅ Done |
| US-021 | Horizontal bar tile | 3 | P0 | ✅ Done |
| US-022 | Department table tile | 3 | P0 | ✅ Done |
| US-023 | Driver / breakdown tile | 2 | P0 | ✅ Done |
| US-024 | Recommendation panel & narrative caption strip | 2 | P0 | ✅ Done |
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
  **everywhere** the shared row is used); right-aligned numeric headers incl. "% of target" (US-022,
  now structural — one `columnAlignClass` rule read by the header *and* its cells). US-022 adds a
  fourth: the department table is quoted in **CHF millions with a subtitle saying so**, never in
  "CHF 000".
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
- **Completed Story Points:** 29 / 29 (100%)
- **Completed Stories:** 11 / 11
- **Tests Passing:** 1393 / 1393 · **Coverage:** 99.8% stmts / 98.2% branches · **Commits:** 10

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
| Filter change snaps values to zero instead of transitioning | High | Medium | Count-up tracks the last displayed value in a ref; bars keyed by category | AI | ✅ Closed — proven for every geometry in the kit: US-021's rows are keyed by name, so a test shows the same bar element surviving a data change and its width moving 100% → 50% while the figure counts from the one on screen. US-025 adds the LINE proof: a re-key replays the stroke draw while a data-only change leaves the line drawn, so nothing flashes. US-018 adds the VERTICAL BAR proof, and it is a re-rank rather than a rerender: the same `<rect>` survives, transitions height *and* position, and each label stays with its own category — switching the key to the index fails two tests. US-019 adds the GROUPED proof (pairs and chip cells keyed by fixture; an index key fails the re-rank test). **✅ Closed by US-020**, the last geometry left: the donut's arcs are keyed by SPONSOR, so a period press morphs the same `<circle>`'s `stroke-dasharray` / `stroke-dashoffset` while the centre counts from the figure on screen — an index key fails the re-rank test |
| SVG gradient ids collide across simultaneous charts | Medium | Medium | Stable unique-id hook per component instance (US-027) | AI | ✅ Closed — `useUid` (US-027) and now proven on a real component: two KPI sparklines carry different gradient ids (US-017), and US-025's band + Hero 2 charts on one screen carry distinct ids with each area fill pointing at its own |
| Hand-built SVG takes longer than a library would | Medium | Medium | Port from the reference rather than writing fresh; the components already exist and work | AI | Open |
| Long labels overflow their tile | Low | Medium | Wrap or truncate-with-tooltip; never overflow | AI | ✅ Closed for the shared bar row (US-021): the 150px label column wraps (`break-words`) and a test rejects `truncate` / `text-ellipsis` / `line-clamp`. US-025's legend wraps and its tooltip flips inside the plot near an edge, so neither clips at 1080p. US-018 keeps its category labels as DOM text under the plot *because* SVG text cannot wrap, and US-019 does the same for `St. Gallen` while moving the y-axis into its own gutter so eight delta chips clear both the scale and each other. US-022 closes the TABLE case: `Marketing & Communications` and `Merchandising (Fanshop)` wrap (`break-words`, ellipsis classes rejected) and the table scrolls inside the card rather than widening it |
| A named type-size token is silently dropped beside a colour token | Medium | **High** | `tailwind-merge` reads `text-caption` as a colour; the type scale is now declared in `app/lib/cn.ts`, derived from the token set | AI | ✅ Closed by US-017 for every component that follows |

---

## Progress Log

*(Older entries are compacted; full narratives live in the backlog's completion notes.)*

### 2026-09-09 — US-027 Motion & animation hooks ✅ (3 pts)

**Delivered:** `app/lib/hooks/use-motion.ts` — `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`,
`COUNT_UP_DURATION_MS` (900, from the token set). Every animated component keys off these four.
**Count-up runs from the figure on screen** (ref-mirrored), so a retargeted animation opens mid-flight
and lands exactly on target. **Reduced motion is final state in the SAME render** (`grown || reduced`,
**zero** frames requested); one source behind `useSyncExternalStore`; SSR proven by `renderToString` +
`hydrateRoot`. **Gates:** 644/644 (52 new) · clean · 100% stmts. **Security:** none.

### 2026-09-09 — US-017 KPI tile & variance chip ✅ (2 pts)

**Delivered:** `delta-chip.tsx` (`DeltaChip`, wanted alone by US-019/US-022/US-016) and `kpi-tile.tsx`
(`KpiSparkline`, `KpiFigure`, `KpiTile`). **Colour is never the sole signal, and it is TESTED that
way:** direction is carried four times (glyph, sign, `sr-only` word, token); direction is not
judgement; a zero is a labelled zero. **The US-012 trap is closed at the root** in `app/lib/cn.ts`.
**Gates:** 722/722 (78 new) · clean · 100% stmts. **Security:** none.

### 2026-09-09 — US-021 Horizontal bar tile ✅ (3 pts)

**Delivered:** `app/components/charts/h-bars.tsx` — the most reused chart in the product: `HBarTile`,
`HBars`, `HBarRow` (US-023's unit of reuse). **Both review decisions are asserted:** the 150px
weight-500 label column with **no truncation** (a test rejects `truncate` / `text-ellipsis` /
`line-clamp`) and the 96px `nowrap` value column, read back through `getComputedStyle` with
`-CHF 150k` proven a single text node. **One rule carries all five consumers: the sign of the
displayed figure** — anchor side, token and text sign, so `negative` mode is idempotent on a stored
magnitude. Rows keyed by name, so a data change transitions the same bar. **One deliberate
deviation:** a decline grows **leftwards**, so direction survives a washed-out projector; the 150px
and 96px decisions must not be reverted.
**Gates:** 777/777 (55 new) · clean · 100% stmts. **Security:** none.

### 2026-09-09 — US-025 Line chart component ✅ (3 pts)

**Delivered:** `app/components/charts/line-chart.tsx` — `LineChart` (navy band, `dark`),
`LineChartLegend`, `LineChartTile` (US-036) and the pure `lineChartGeometry` / `hoverIndex` /
`nextHoverIndex` / `tooltipAnchor` helpers every later chart imports rather than restating.
**The stroke draw survives reduced motion:** `pathLength="1"` normalises the length so the offset
transitions 1 → 0 with no measurement, and under the preference a test reads `stroke-dashoffset="0"`
with **zero frames requested**. It replays by being re-keyed, with no second mechanism. **Hover shows
EVERY series at the hovered x**, keyboard access from `nextHoverIndex` (never captures Tab). Gradient
ids from `useUid`, proven distinct; a hole is a labelled zero, so no `NaN` enters a `d`.
**Gates:** 953/953 (73 new) · clean · 100% lines. **Security:** none.

### 2026-09-09 — US-026 Segmented period filter control ✅ (2 pts)

**Delivered:** `app/components/controls/segmented.tsx` — the one period control, designed for all
three consumers and **wired into none of them**. **11px is a REVIEWED decision and it is asserted:**
`rounded-chip` plus the new `.fcb-chip`, whose `border-radius: var(--radius-chip)` a test reads back
out of `app/app.css`; `rounded-full` / `9999px` / `--radius-pill` are rejected in the markup, the
source *and* the stylesheet. The lift-and-tint hover is split on purpose (`.fcb-chip` carries the
lift, shared with US-029; the tint stays per variant). **`PeriodKey` reused, never re-declared** — a
`@ts-expect-error` line fails typecheck the moment the key loosens to `string`. **Controlled, with no
opinion of its own**, so ONE control drives two tiles on the band or three on Hero 1.
`role="radiogroup"`, ONE tab stop via roving `tabIndex`, wrapping arrows + Home/End through the pure
`nextOptionIndex`, and selection carried four ways, never by colour.
**Gates:** 998/998 (45 new) · clean · 100% lines / 97.4% stmts. **Security:** none.

### 2026-09-09 — US-018 Vertical bar chart tile ✅ (3 pts)

**Delivered:** `app/components/charts/v-bars.tsx` — `vBarGeometry` (pure), `VBars`, `VBarTile`, for
US-034's kit split. **Criterion 3 is proven by a RE-RANK, not a rerender:** columns are keyed by
category, so `Home` keeps the *same* `<rect>` while its `x` / `y` / `height` transition; element
identity is asserted across a data change *and* a re-ordered dataset, each label stays with its own
category, and switching that key to the index fails exactly two tests. The surviving instance keeps
its `useCountUp` state, and reduced motion lands on final heights with **zero frames requested**.
Gradient fills with rounded caps (one per distinct token colour, ids from `useUid`), gridlines
behind, labels above, a `filter` hover highlight and an optional per-bar tooltip renderer; category
labels are DOM text so a long one wraps; `niceMax` / `vBarHeight` never yield `NaN`.
**Gates:** 1142/1142 (52 new) · clean · 100% stmts on the new file. **Security:** none.

### 2026-09-09 — US-019 Grouped bar chart tile ✅ (3 pts)

**Delivered:** `app/components/charts/grouped-bars.tsx` — `groupedBarGeometry` (pure), `GroupedBars`,
`GroupedBarTile`, for US-036. **The overlap fix is STRUCTURAL and both halves are measured:**
`AXIS_GUTTER` (44) belongs to the scale alone and every bar, chip, label and legend row is inset to
`plotLeft` (`axisLabelX < plotLeft` and `chipLeft >= plotLeft` for all eight pairs), and `CHIP_BAND`
(34) is reserved headroom whose axis maximum is DERIVED from the geometry, so no bar can enter it
whatever the data — replacing the derived factor with `1.1` fails that test. The chips are one flex
strip of equal cells, so neighbour overlap is impossible by layout (verified at 8 and at 14 pairs);
each is US-017's `DeltaChip`, `light` on the navy tooltip. **No per-bar value labels** — sixteen
figures above sixteen bars WAS the collision — except a labelled zero at the baseline. Pairs and
chip cells keyed by fixture (an index key fails the re-rank test); reduced motion lands final with
zero frames.
**Gates:** 1205/1205 (63 new) · clean · 100% on the new file. **Security:** none.

### 2026-09-09 — US-020 Donut / ring tile ✅ (3 pts)

**Delivered:** `app/components/charts/donut.tsx` — the multi-segment sponsor ring for US-034
(`donutGeometry` pure, `Donut`, `DonutTile`); NOT US-016's single-arc gold gauge. Arc hover and legend
hover write ONE `hovered` index (cross-surface test both ways; rows are real `<button>`s). Arcs and
rows keyed by sponsor, so a period press morphs the same `<circle>`'s dasharray while the centre
counts from the figure on screen; an index key fails the re-rank test. `badgeSegments` (US-008) is
reused, so segments sum exactly to the centre total on all four periods and ten adversarial ones; gaps
are arc removed from each segment, never a background-coloured stroke. Ids from `useUid`.
**Gates:** 1261/1261 (56 new) · clean · 100% stmts on the new file. **Security:** none.

### 2026-09-09 — US-022 Department table tile ✅ (3 pts)

**Delivered:** `app/components/tiles/department-table.tsx` — a real `<table>` with `DepartmentTable`,
`DepartmentTableTile` and the pure `targetMark` / `targetBarPercent` / `columnAlignClass`.
**THE REVENUE / COST TRAP IS CLOSED BY CONSTRUCTION:** colour comes from `row.judgement` (US-010)
through US-017's `DeltaChip`, so Marketing's **+410 renders UP and ADVERSE** while Sponsoring's +840
renders UP and FAVOURABLE; a source scan rejects `FAVOURABLE` / `ADVERSE`, any `variance <>` test and
any `DepartmentType` equality, and the flag is `needsAttention`, never a named row. **Both review
decisions are asserted:** CHF **millions** with the unremovable "figures in CHF millions" subtitle
(`/000/` rejected in the rendered tile), and numeric headers right-aligned **including "% of target"**
by one `columnAlignClass` rule the header *and* its cells read. Near-target gold is shape plus an
`sr-only` word; totals come from `departmentTotals()` on the rows on screen, club variance NEUTRAL.
**Gates:** 1315/1315 (54 new) · clean · 100% on the new file. **Security:** none.

### 2026-09-09 — US-023 Driver / breakdown tile ✅ (2 pts)

**Delivered:** `app/components/tiles/driver-tile.tsx` — `DriverTile`, `DriverTotalBadge` and the pure
`rankDrivers` / `driverTotal`. **IT DRAWS NO BARS, AND THAT IS THE STORY.** Every row is US-021's
`HBarRow` through `HBarTile`; a source scan rejects `h-bar-*`, the two column widths, `H_BAR_SERIES`,
`width` / `toFixed`, `useCountUp` / `useGrow` / `transition`, any `useState` / timer and any gradient
class, while the render tests read the 150px label and 96px `nowrap` value columns back off the rows
this tile produced — so a sixth copy of the row cannot appear without failing tests.
**Three additions, honestly scoped:** (1) `rankDrivers`, magnitude-descending and **stable for ties**,
asserted equal to US-009's `fixtureDeclines` order so Luzern precedes Sion; `rank="none"` keeps an
authored order (US-035 leads with Bitpanda because it leads badge selection). (2) `driverTotal`,
**derived from the rows on screen** through the newly exported `hBarDisplayedValue`, so the badge sums
exactly what the bars show — asserted equal to `declineTotal` (-CHF 400k) and to
`departmentVariance(Marketing)` (CHF 410k), and re-derived when the rows change. (3) A muted `note`
line under the bars for US-037's attendance note — distinct from the card's AI caption strip.
**Two seams added to shared modules rather than forked:** `HBarTile` now has a `children` slot under
the bars, and `DeltaChip` a `suffix` node, so the badge is `-CHF 400k total` in ONE chip with the
arrow, the sign and the `sr-only` direction it already had. Everything else — card chrome, `action`,
formatter, `negative`, series, scaling, stagger, reduced motion — is delegated.
**Gates:** lint ✅ · format ✅ · typecheck ✅ · 1358/1358 (43 new) · build ✅ · coverage 100% on the
new file; 99.8% stmts / 98.1% branches overall. **Security triage:** no trigger fires — no endpoint,
no IO, no dependency change, no raw SQL, no user-supplied URL; `note` / `totalLabel` are React nodes
React escapes, and a scan rejects `dangerouslySetInnerHTML`. **One seam:** no real-Chrome pass until
US-035 / US-037 / US-039 mount it.

### 2026-09-09 — US-024 Recommendation panel & narrative caption strip ✅ (2 pts) — PHASE CLOSED

**Delivered:** `app/components/tiles/recommendation-panel.tsx` (`RecommendationPanel`,
`RECOMMENDATION_VARIANTS`) plus a `section` placement on US-005's `CardCaption`.
**THE CAPTION STRIP WAS REUSED, NOT REBUILT.** One implementation, two placements: `tile` (hairline,
truncated) and `section` (no hairline, WRAPS, never truncated, body size) — the AI glyph, the
escaping and the decorative `aria-hidden` exist once, and `SectionHead` now renders that element
instead of its own `<p>`. Source scans reject a second `Sparkles` or `narrative-caption` in either
consumer.
**The panel is structurally not a tile, and each row of the difference is asserted:** an `aside`
region named by its "Recommendation" eyebrow (vs a `div`), `data-slot="recommendation-panel"` with no
`card` slot inside it, a 3px gold bar down the SIDE (a tile's runs across the top), `rounded-panel`
(16px) on a tinted `bg-gold/10` surface with no `shadow-tile`, and none of the card's metric chrome —
no icon badge, no uppercase heading, no KPI number. A card rendered beside it is told apart by test.
**Verbatim fidelity is the load-bearing test:** US-039's recommendation string renders byte-identical
(`toBe`), straight apostrophe and quotes intact, ASCII hyphens intact, `CHF 240k` / `CHF 150k` /
`2.2% vs 2.6%` intact; no `truncate` / `line-clamp` / casing class on the body, and a scan rejects
`toUpperCase` / `.replace(` / `.slice(` in the module.
**Criterion 3 is order, so DOM ORDER is what is asserted:** in a section shaped the way Phase 3b will
build one, the narrative precedes every `svg`, every card and the panel itself, and the head's last
child is the narrative.
**Gold stayed sanctioned:** three mentions in the module (accent name, tint, border) via
`CARD_ACCENTS`, the glyph through `--color-accent-follow-up`; no ring or glow on an inserted panel,
and the navy `narrative` variant serves US-037 without spending gold twice.
**Gates:** lint ✅ · format ✅ · typecheck ✅ · 1393/1393 (35 new) · build ✅ · coverage 99.8% stmts /
98.2% branches. **Security triage:** no trigger fires — no endpoint, no loader, no IO, no dependency
change, no raw SQL, no user-supplied URL, no `dangerouslySetInnerHTML` (asserted); text arrives as a
React node and is escaped. **One seam:** no real-Chrome pass until US-035 / US-037 / US-039 mount it.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** ✅ **COMPLETED 2026-09-09 — 11/11 stories · 29/29 points.** The whole component
library exists: seven tile kinds, three chart geometries, the segmented filter, the motion hooks and
now the two insight elements. Phase 2a is CLOSED (5/5) too.
**Next:** [Phase 3a — Conversation](phase-3a.md) (US-028 to US-033) — the prompt bar, chips,
intent matching and the thinking beat; then Phase 3b composes these components into the six hero
beats, where every narrative and recommendation string is verbatim.
**Previous:** [Phase 2a](phase-2a.md) · **Next:** [Phase 3a — Conversation](phase-3a.md)
