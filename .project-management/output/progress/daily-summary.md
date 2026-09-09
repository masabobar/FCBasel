# Daily Work Summary

**Date:** 2026-09-09 (Wednesday) · **Last Updated:** 2026-09-09

---

## Today's Summary

**Stories Completed:** 26 — **Phases 1a, 1b and 2a all complete (2a closed by US-016); Phase 2b at
10/11**
**Story Points:** 67
**Time Worked:** ~17.5 hours · **Files Changed:** 218 · **Tests Added:** 1358

---

## Work Log

- **Phase 1a — US-001 to US-006 (14 pts), closed.** Condensed; the full account is in
  [`../phases/phase-1a.md`](../phases/phase-1a.md). In short: the React Router 7.18 SSR scaffold
  verified by execution (US-001, Railway deploy still a human step); ESLint 9 + Prettier + husky with
  the hook *proved* to fire (US-002); one design-token set published as Tailwind v4 properties and as
  typed objects, held in lockstep by a drift test (US-003); the crest self-hosted after verifying its
  bytes were PNG (US-004); one `Card` shell of collapsing slots (US-005); and the four reveal
  keyframes plus `app/lib/motion.ts`, where **reduced motion renders final state rather than
  switching animation off** (US-006).
- **US-007 — Persona baseline datasets.** The first data story, so it sets the shape US-008 to
  US-010 follow: enums, domain types and the repository interface in `app/lib/repositories/`,
  fixtures in `app/lib/mock/`, one line of selection in `index.server.ts`. All four periods, per the
  user's approved decision. The headline webshop figure and its delta are **computed from the
  series**, so a number cannot disagree with the chart under it; the long periods label their x-axis
  from an injectable clock. Partner brand colours stay outside the FCB palette. 228/228.
- **US-008 — Hero 1 dataset: shirt sales, badges, printed names.** One hero object with `primary`
  and `followUp` so a tile and its escalation cannot drift. **Nothing derivable is stored:** kit
  revenue is units × CHF 99, the Home share 58% and the badge share exactly 8%. `badgeSegments`
  corrects its rounding remainder so the four parts sum *exactly* to the total, proved for every
  total 0-2,000 — the arithmetic US-020's donut imports rather than restates (273/273).
- **US-009 — Hero 2 dataset: ticket revenue year on year.** Eight home fixtures in CHF thousands
  (7,880 → 7,830) plus the twelve-month series. The real risk was labelling, not arithmetic: the two
  charts sit at deliberately different scopes, so `scopeLabel` is a field and tests assert the labels
  differ and that the monthly total is the larger. Nothing derivable is stored — the headline -0.6%,
  the four declines and the -CHF 400k badge all come off the fixture pairs (304/304).
- **US-010 — Hero 3 dataset: departmental performance.** Six departments in CHF thousands
  (69,000 → 69,680, +680 / +1.0% derived). The new idea is that a TAG carries the meaning of a
  number: above budget is money earned for five departments and an **overspend** for the Marketing
  cost centre, so `varianceJudgement` decides good-or-bad once from `DepartmentType` — and one test
  proves a naive "variance > 0 is good" rule misreads exactly one department. The follow-up
  reconciles: 240 + 150 + 20 = 410, exactly Marketing's variance. Departments, never people (348).
- **US-011 — Formatters & cross-hero reconciliation.** Phase 1b closes with the two things that keep
  the other four data stories honest. `app/lib/format.ts` is the one place a number becomes a string:
  money always carries `CHF`, the sign goes *before* the unit (`-CHF 400k`), and `en-CH` groups with
  the Swiss U+2019 mark — pinned as a constant and made independent of the runtime's ICU, proved by
  stubbing `Intl` to `en-US` and `de-DE`. One rounding rule, imported from `derive.ts`. The
  reconciliation suite asserts relationships rather than constants — 58.18% → 58%, the fixture fall
  of 50 becoming -0.6%, Marketing's drivers summing to 410, every narrative number swept against
  what the data can produce. **No drift found.** 418/418.
- **US-012 — Branded application shell.** `app/components/chrome/{sidebar,top-bar,app-shell}.tsx`
  plus `app/lib/persona.ts`: the navy sidebar (hidden below `lg`), the app bar carrying the US-004
  crest, the workspace label, a decorative connection status and Reset, and a canvas grid stepping
  12 → 8 → 4 columns. `root.tsx` mounts the shell around `<Outlet />`, so a hero inserted later joins
  the same grid; the canvas is deliberately **empty** (tiles are US-013, insertion US-014). Three
  things were made structural rather than trusted: **the persona is a role** (one module, and a test
  asserts the app bar renders no text beyond those labels), **the placeholders are inert by
  construction** (`aria-disabled`, no href, no focus), and **the status is decorative** (no live
  region, no `fetch`, no timer). No horizontal scroll at 1920×1080. 475/475 green.
- **US-014 — Dynamic tile insertion & grid reflow.** The mechanic the demo turns on: the dashboard
  **grows, it never clears**. A memory-only list of `{heroId, phase, revision}` — pure transitions in
  `sections.ts`, state in `use-dashboard.ts`, owned by `root.tsx`; sections are **direct children of
  the US-012 canvas grid** via `grid-cols-subgrid`. Re-asking a hero **refreshes in place** and a
  follow-up **flips** its parent's phase rather than appending (US-033 inherits that). Reflow runs
  through US-006's `animateReflow`; reduced motion recorded zero view transitions and an identical
  layout. A source scan bans every storage API. 552/552. **Phase 2a then 2/5 · 6/16 points.**
- **US-015 — Reset to baseline.** The control that lets the demo be run twice, built as a
  **transition beside the other three** rather than a mode. **Reset restores a named baseline, never
  a literal empty list**, and that constant is *also* the hook's initial state. **The pending timer
  is the story:** `reset` cancels it first, and deleting that line makes two tests fail with the beat
  dropping an answer into a just-cleared dashboard. The *same list reference* comes back when there
  is nothing to clear, so ten presses in one frame run **one** view transition. 592/592.
- **US-027 — Motion & animation hooks.** Phase 2b opens with the story every other component in it
  depends on: `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`. **Count-up counts from the
  figure on screen, not from zero** — a test proves a target changed mid-flight opens the new
  animation *on that very figure* and lands exactly on target. **Reduced motion means final state in
  the same render:** `useGrow` is `true` on the first render with **zero** frames requested. One
  reduced-motion source, everything cancelled on unmount, SSR proven by `hydrateRoot`. 52 tests.
- **US-017 — KPI tile & variance chip.** The first component built on those hooks, and the shape the
  other nine follow: `DeltaChip` in its own module, plus `KpiSparkline`, `KpiFigure` and `KpiTile`.
  **The chip is where "colour is never the sole signal" stops being a slogan.** Direction is carried
  four independent times — glyph, explicit sign, `sr-only` word, and only then the token colour — and
  the `light` variant is the proof: on navy a test asserts the up and down chips' class strings are
  **identical** while glyph, sign and spoken word still differ. **Direction is arithmetic, judgement
  is meaning:** an optional `judgement` prop draws Marketing's overspend as an up arrow in the
  *negative* token. **No variant per hero** — extras arrive as `children`. **The US-012
  `tailwind-merge` trap is closed at the root**. 78 tests, 722/722.
- **US-021 — Horizontal bar tile.** The most reused chart in the product, built once for five
  consumers as `HBarRow` / `HBars` / `HBarTile`. **The two review decisions are read back off the
  rendered element by tests:** a 150px label column with `truncate` / `text-ellipsis` /
  `line-clamp` *rejected*, so `Cap "Rotblau"` cannot regain its reported ellipsis, and a 96px
  `nowrap` value column asserted through `getComputedStyle`. **One rule serves every consumer: the
  sign of the displayed figure** — it sets the anchor side, the token and the sign in the text. Rows
  are keyed by name, so a filter change transitions the *same* bar while the figure counts on from
  what is on screen. One deviation flagged: a decline grows *leftwards*. 55 tests.
- **US-016 — Hero band. Phase 2a is closed (5/5 · 16/16).** The navy band above the baseline row,
  and the first thing to mount `LineChart` and `Segmented` in the app. **ONE `Segmented` drives both
  halves** from a single `BaselinePeriod` entry (one `useState`, one `<Segmented>`, pinned by tests),
  so the gold-area-over-dashed-white chart (re-keyed by period, replaying the stroke draw) and the
  new hand-built `AttendanceRing` cannot disagree about the month. **The total and its delta are
  `seriesTotals` off the plotted array**; the greeting comes from an injectable clock. Chrome at
  1920×1080: 54 distinct KPI strings, still the old figure in the frame after the click, 43 arc dash
  pairs on the same element, one value each under reduced motion. One defect fixed. 92 tests.
- **US-018 — Vertical bar chart tile.** `app/components/charts/v-bars.tsx` — the kit-split chart
  US-034 composes. **Bar persistence is the story and the test is a re-rank:** columns keyed by
  category, so a filter press hands `Home` the *same* `<rect>` and its `x` / `y` / `height`
  transition carries it; an index key **fails exactly two tests**, and the surviving instance keeps
  its `useCountUp` state. Gradient caps, `filter` hover highlight, optional `tooltip(index)`,
  wrapping DOM-text labels. 52 tests.
- **US-019 — Grouped bar chart tile.** `app/components/charts/grouped-bars.tsx` — US-036's fixture
  chart: eight fixtures giving **sixteen bars and eight delta chips in one tile**. **The review's
  overlap fix is now arithmetic, and both halves are measured:** a 44-unit **left gutter** owned by
  the scale that everything is inset to, and a 34-unit **chip band** that stays empty because the
  axis maximum is *derived from the geometry*. No chip slot reaches the gutter or its neighbour, the
  tallest bar clears the band over seven datasets, and **a fixed 10% headroom fails that test**.
  **No per-bar value labels by design.** Pairs keyed by fixture. 63 tests.
- **US-020 — Donut / ring tile.** `app/components/charts/donut.tsx` — US-034's sponsor-badge ring
  (`donutGeometry` / `Donut` / `DonutTile`), deliberately a different component from US-016's
  single-arc `AttendanceRing`. **Two hover surfaces write ONE state** (arc and legend row), proven by
  a cross-surface test; stub either write and 4-5 tests fail. **The segments morph:** arcs keyed by
  SPONSOR, so a period press transitions the same `<circle>`'s dasharray/dashoffset while one
  `useCountUp` carries the centre, never via zero. **The arithmetic is `badgeSegments`'** (US-008),
  imported not restated, so the four figures add up exactly. 56 tests, 1261/1261.
- **US-022 — Department table tile.** `app/components/tiles/department-table.tsx` — Hero 3's primary
  tile as a real `<table>`, six departments and a total row. **The revenue/cost trap is closed by
  construction:** the colour comes from `row.judgement` (US-010's `varianceJudgement`) through
  US-017's `DeltaChip`, so **Marketing's +410 renders UP and ADVERSE** while Sponsoring's +840
  renders FAVOURABLE, and a source scan rejects `FAVOURABLE` / `ADVERSE`, any `variance <>` test and
  any `DepartmentType` equality. **Both review decisions are asserted:** CHF millions with the
  unremovable subtitle saying so (`/000/` rejected in the rendered tile), and numeric headers
  right-aligned **including "% of target"** from one `columnAlignClass` rule the header *and* its
  cells read. 54 tests, 1315/1315.
- **US-023 — Driver / breakdown tile.** `app/components/tiles/driver-tile.tsx` — `DriverTile`,
  `DriverTotalBadge` and the pure `rankDrivers` / `driverTotal`, for all three causal follow-ups.
  **It draws no bars, and the tests keep it that way:** every row is US-021's `HBarRow` through
  `HBarTile` (the 150px label and 96px `nowrap` columns are read back off the rows this tile
  produced, and the widths are `HBars`' scaling), while a source scan rejects bar geometry, both
  width constants, `useCountUp` / `useGrow` / `transition`, every local state or timer, gradient
  classes and even a second `Card`. **What it adds is three things:** magnitude ranking that is
  **stable for ties** (asserted equal to US-009's `fixtureDeclines`, so Luzern precedes Sion) with
  `rank="none"` for an authored order; a total **derived from the rows on screen** through the newly
  exported `hBarDisplayedValue`, so the `-CHF 400k total` badge matches `declineTotal` and the
  Marketing drivers match the +410 variance; and a muted note line for US-037's attendance
  sentence. Two shared seams were widened rather than forked — `HBarTile`'s `children` slot and
  `DeltaChip`'s `suffix`. 43 tests, 1358/1358.

---

## Stories Completed Today

- ✅ **Phase 1a — US-001 to US-006 (14 pts), closed 6/6.** US-001 4/5 criteria (Railway deploy
  deferred); US-002 to US-006 all criteria met — the token set's two halves held in lockstep by a
  drift test, the crest verified from its bytes, one reusable card shell, and fade-and-rise motion
  where reduced motion renders final state.
- ✅ **Phase 1b — US-007 to US-011 (10 pts), closed 5/5.** Every acceptance criterion met, and US-007
  to US-009 deliberately exceeded theirs (all four periods, the twelve-month series). US-010 derives
  the Revenue/Cost judgement and the attention flag rather than storing either; US-011 adds one
  shared display layer, one rounding rule, and a reconciliation suite that found **no drift**.
- ✅ US-012 — Branded application shell (3 pts) — all 5 criteria met, the two easy ones to fake measured in a real browser. **Phase 2a opens here: 1/5 · 3/16.**
- ✅ US-014 — Dynamic tile insertion & grid reflow (3 pts) — all 7 criteria met: dedupe by hero id
  proven in unit tests and in Chrome, a follow-up flips its parent's phase, no storage API anywhere.
- ✅ US-015 — Reset to baseline (2 pts) — 3 of 5 criteria fully met; the chips (US-029) and the
  thinking beat (US-031) are recorded as seams rather than claimed. **Phase 2a then 3/5 · 8/16.**
- ✅ US-027 — Motion & animation hooks (3 pts) — all 4 acceptance criteria met, including the two
  subtle ones: count-up continues from the current displayed value, and nothing is stranded at zero
  under reduced motion. **Phase 2b opens here: 1/11 stories, 3/29 points.**
- ✅ US-017 — KPI tile & variance chip (2 pts) — all 3 acceptance criteria met; the delta chip's
  meaning survives with the colour removed, and the named-size/colour `tailwind-merge` trap is closed
  for every component after it. **Phase 2b now 2/11 stories, 5/29 points.**
- ✅ US-021 — Horizontal bar tile (3 pts) — all 4 criteria met on the row *five* tiles share. Both
  review decisions are read back off the rendered element — the 150px no-truncate label and the 96px
  `nowrap` value column — and one rule (the sign of the displayed figure) covers every consumer.
  **Phase 2b now 3/11 stories, 8/29 points.**
- ✅ US-013 — Baseline dashboard, four pre-existing tiles (3 pts) — all 4 criteria met, **plus**
  US-015's deferred criterion ① (Reset restores exactly these four tiles). Every figure traces to
  the US-007 repository through an SSR loader.
- ✅ US-025 — Line chart component (3 pts) — all 5 criteria met on one chart serving both the navy
  band and Hero 2's month-by-month comparison: the stroke draw replays on a re-key and renders fully
  drawn under reduced motion, the tooltip shows every series at the hovered x, and two charts on
  screen carry distinct gradient ids. **Phase 2b now 4/11 stories, 11/29 points.**
- ✅ US-026 — Segmented period filter control (2 pts) — all 3 acceptance criteria met: it renders in
  a card's `action` slot *and* a section header, `light` and `dark` variants differ, and the 11px
  radius comes from the existing `--radius-chip` with `rounded-full` rejected by test. Controlled,
  radiogroup semantics with one tab stop. **Phase 2b then 5/11 · 13/29 — US-016 unblocked.**
- ✅ **US-016 — Hero band: webshop trend & attendance ring (5 pts). All 6 criteria met, and Phase 2a
  is CLOSED at 5/5 · 16/16.** One control drives the chart and the ring; a filter change counts from
  the figure on screen, redraws the line and sweeps the arc. 92 tests, 1090/1090 green.
- ✅ US-018 — Vertical bar chart tile (3 pts) — all 3 criteria met: gridlines, count-up labels and a
  hover highlight; an optional per-bar tooltip renderer; and bars keyed by category, proven by a
  re-rank test where the same `<rect>` survives and transitions with its own label.
- ✅ US-019 — Grouped bar chart tile (3 pts) — all 3 criteria met at Hero 2's full density (8
  fixtures, 16 bars, 8 chips): a delta chip above each pair, the y-axis in its own gutter with
  reserved headroom, and a per-fixture tooltip. **The review decision is geometry, not a class.**
- ✅ US-020 — Donut / ring tile (3 pts) — all 4 criteria met: even gaps and a counting centre total;
  an arc **or its legend row** thickens that segment and swaps the centre from one shared state; a
  data change morphs the same `<circle>`; and the segments sum exactly because `badgeSegments` is
  imported rather than re-derived. **Phase 2b then 8/11 stories, 22/29 points.**
- ✅ US-022 — Department table tile (3 pts) — all 5 acceptance criteria met: the six columns plus a
  total row, figures in **CHF millions** under a subtitle that says so (no "000" anywhere), numeric
  headers right-aligned **including "% of target"** from one rule the header and its cells share,
  the Marketing row flagged from `needsAttention`, near-target 95-99 marked in gold (Hospitality yes,
  Merchandising no) and a row hover highlight. **The trap is the story:** Marketing's +410 reads
  ADVERSE because the judgement comes from US-010's `varianceJudgement`, and a source scan stops it
  ever being re-derived from the sign. **Phase 2b then 9/11 stories, 25/29 points.**
- ✅ US-023 — Driver / breakdown tile (2 pts) — all 3 criteria met: ranked contribution bars with a
  custom formatter (used verbatim as `+38%`, `-CHF 150k` and `CHF 240k`), an `action`-slot badge
  whose total is **derived from the rows** rather than passed in, and — the point of the story —
  **no second bar row**: the rendered rows are US-021's, proven by reading its two review-decision
  columns off them, and a source scan keeps bar geometry, motion and gradients out of the new file.
  Ranking is stable for ties, so Luzern precedes Sion as US-009 derives them.
  **Phase 2b now 10/11 stories, 27/29 points.**

*(Long-form accounts are condensed to keep this log inside its 300-line limit — the full detail is
in [`completed.md`](completed.md) and [`../phases/phase-2b.md`](../phases/phase-2b.md).)*

---

## Stories In Progress

*None*

---

## Open Human Step

- **Deploy to Railway** (US-001, the remaining AC): `railway login && railway init && railway up`, then record the URL in `output/phases/phase-1a.md`.

---

## Next Day Plan

**Immediate Focus:**
- **Phases 1a, 1b and 2a are all closed** (14 + 10 + 16 = 40 points). Nothing in Phase 2a is
  outstanding: US-013 and US-016 were both finished inside the Phase 2b run on the day their
  dependencies landed.
- **Phase 2b — the component library** is at 10/11 · 27/29. Next is **US-024 — recommendation panel
  & narrative caption strip (2 pts)**, the last story in the phase: the panel must read as ADVICE
  rather than as a data tile (gold accent, visibly not a metric), and the caption strip already
  exists as `CardCaption` on US-005's `Card` — it must be reused and made carryable by any tile,
  not rebuilt. Every remaining component should import from `app/lib/hooks/use-motion.ts` rather
  than animate by hand, and compose `Card`, `DeltaChip`, `HBars`, `DriverTile`, `VBars`,
  `GroupedBars`, `LineChart`, `Donut` and `Segmented` rather than restate them.

**Priority Stories for This Week:** Phase 1a + 1b foundations (24 pts, done) → Phase 2a + 2b shell
and component library (45 pts, the largest block) → Phase 3a + 3b, the demo itself (33 pts).

---

## Notes

- **The deadline is this week.** Sponsor showing first, owner audience the following week. ~52
  AI-core / ~68 AI-realistic hours for 116 points; extend daily runtime before cutting scope — the
  P1 cut set is worth only ~0.82 days at 8h/day.
- Phases 1a, 1b and 2a are complete and Phase 2b is at 10/11 (67/116 points); continue with
  `/holycode-pm:execute-work phase 2b`, starting at US-024.
- **US-021 is the reuse test for the whole epic, and US-023 passed it:** `HBars` / `HBarRow` is the
  only horizontal bar row (its 150px no-truncate label and 96px `nowrap` column are review
  decisions), and the driver tile composes it. **The pattern to copy when a tile needs a little more
  than a shared component gives it:** widen the shared seam (`HBarTile`'s `children`, `DeltaChip`'s
  `suffix`) and let a source scan prove the new file holds no copy of what it reused.
- **The motion hooks are the shared contract for Phase 2b:** `useCountUp` from the current value and
  `useGrow`'s reduced-motion short-circuit are what keep ten charts consistent. A component that
  reimplements either is a review finding, not a style choice.
- **Two shared pieces US-017 left for the rest of the phase:** `DeltaChip` is the *only* variance
  chip (US-019, US-022 and now US-023's total badge import it, judgement passed in), and
  `app/lib/cn.ts` protects named size tokens — but only through `cn`, so a hand-written
  `class="text-caption text-muted"` is on its own.
- **Reset's seams are recorded in code:** US-029's chips should be *derived* from `useDashboard`'s
  `sections` and US-031's thinking beat *scheduled* through its `schedule`. US-013 closed the third
  (the baseline tiles) as static route chrome — do not move them into the session list.
- **US-013 set the no-hardcoded-figure pattern for every hero:** figures reach a component only
  through a loader-provided view model, and a test scans the component sources for any dataset figure
  written as a literal. US-034 to US-039 should copy that scan.
- **US-025's chart is the only line chart** and both heroes must key it, not fork it: `key={period}`
  is the replay mechanism, `legend={false}` + `LineChartLegend` is how the band places its own legend,
  and a second `smoothPath` anywhere is a review finding.
- **Keying geometry by NAME is now the epic's settled pattern**, proven by US-018 (category),
  US-019 (fixture), US-020 (sponsor) and kept by US-022/US-023 (name). The proof is always a
  **re-rank** test, since an index key is invisible while the order holds.
- **US-019's gutter and headroom are review decisions expressed as arithmetic, not padding:** the
  axis maximum is derived from the geometry, so a chart that crowds labels above its bars should
  reserve a band the same way rather than nudge paddings — and prove it with a computed assertion.
- **US-026's `Segmented` is the only period control**, and the period stays the CALLER's state —
  one value in the band drives both the chart's `key` and the ring, while Top Products holds its own.
  Its 11px radius is reviewed: `rounded-full` on it or on US-029's chips is a review finding.
- **US-016's band is first in the cut order and was built to stay cuttable:** one grid item, no
  shared state, no import from the baseline row (a test asserts it). Its `AttendanceRing` is the
  single-arc gauge and `Donut` (US-020) the segmented ring — two components on purpose; neither
  should grow a mode to become the other.
- The shell keeps two guardrails as *tests*: the app bar's whole text must equal the known role
  labels, and the status file must hold no `fetch`, `useEffect` or timer.

---

**Auto-Generated** | Updates during `/execute-work` | Archives daily
