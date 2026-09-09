# Phase 2a: Dashboard Shell & Persona Baseline

**Goal:** The frame the whole demo lives in — the branded shell, the persona identity, the
pre-populated baseline dashboard, and the tile-insertion mechanic that makes the dashboard visibly
grow when a question is asked.
**Duration:** Day 2 (of a one-week build)
**Total Stories:** 5
**Total Points:** 16
**Status:** In Progress (4/5 completed — US-016 still deferred; its US-025/US-026 dependencies are unbuilt)

> **Global guardrails apply** — see [`../constraints.md`](../constraints.md) §2.

---

## Epic 4: E4 — Dashboard Shell & Persona Baseline

**Priority:** P0
**Total Story Points:** 16
**Status:** In Progress (4/5 completed — US-016 still deferred; its US-025/US-026 dependencies are unbuilt)
**Source:** Build Specification E4; Reference Implementation Guide §8.

> The dashboard **never clears to show a hero — it grows.** That single behaviour is what makes the
> product read as "the system added this to my dashboard" rather than "a page navigated".

### Stories:

- **US-012**: Branded application shell
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Navy left sidebar, top app bar, and the main canvas holding a responsive tile grid.
  - **Acceptance Criteria:**
    - App bar shows the self-hosted crest, the workspace label "Sales & Marketing", and a generic
      avatar with initials "SM" — **no real or realistic individual name anywhere**
    - Navy sidebar carries "Dashboard" (active) plus **inert** placeholder items "Reports",
      "Data Sources", "Settings" — visibly dimmed, no hover affordance, no navigation on click
    - App bar also carries a decorative "Connected · 11 systems" status and a Reset control
    - Main canvas is a responsive 12-column grid; sidebar hides below the large breakpoint
    - No horizontal scroll at 1920×1080
  - **Dependencies:** US-003, US-004, US-005
  - **Notes:** The inert items imply a fuller product without pretending to be one.
  - **Completion note (2026-09-09):** All five criteria met. The shell lives in
    `app/components/chrome/{sidebar,top-bar,app-shell}.tsx`; the persona label and monogram are
    centralised in `app/lib/persona.ts` and a test asserts the app bar renders no text beyond those
    role labels. The three placeholders are `<span aria-disabled="true">` — no href, no role, no
    handler, no focus, `pointer-events-none` — proven non-focusable and click-inert in real Chrome.
    The connection status is static and `data-decorative`; Reset renders but its behaviour is
    US-015. Canvas grid is 12 columns at `lg`, 8 at `sm`, 4 below, and stays **empty** for
    US-013/US-014. Measured `scrollWidth === clientWidth` at 1920×1080.

- **US-013**: Baseline dashboard — four pre-existing tiles
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09, in the Phase 2b run)
  - **Description:** On load the canvas shows a dashboard that already looks lived-in, not an empty
    canvas.
  - **Acceptance Criteria:**
    - Exactly the four E3 baseline tiles render, **in this order**: Webshop revenue, Last home match,
      Top products, Active partners
    - Figures come from the US-007 dataset — no values re-typed in components
    - Partner tiles use placeholder monogram logos (initials on a coloured tile) plus a role tag,
      with a subtle hover lift
    - Top Products labels are **not truncated** — a fixed 150px label column so `Cap "Rotblau"` and
      `Home shirt 26/27` show in full
  - **Dependencies:** US-007, US-012, **US-017**, US-021
  - **Notes:** Partner logos are placeholders until licensed.
  - **Completion note (2026-09-09, built in the Phase 2b run once US-017 and US-021 existed):** All
    four criteria met, and nothing was reinvented — the row **composes** `KpiTile` (US-017) ×2,
    `HBarTile` (US-021), the `Card` shell (US-005), the US-027 motion hooks and the US-011
    formatters as direct children of US-012's single canvas grid.
    - **①** `app/components/dashboard/baseline-row.tsx` renders exactly four tiles in DOM order —
      Webshop revenue, Last home match, Top products, Active partners — as a fragment, so each is a
      grid item and there is still exactly one grid. Order is asserted as a value
      (`BASELINE_TILE_ORDER`) and measured in Chrome.
    - **②** Figures reach the tiles through `app/lib/dashboard/baseline.ts` from the US-007
      repository, fetched in the route's SSR loader (the repository is async and server-only). The
      webshop total and its `+11.9%` are `seriesTotals` off the same array the sparkline draws, and
      `trendEndingAt` makes the six-point window **end on the month the headline covers** so the
      number and its glyph cannot disagree. Proven by a **source scan** that fails on any displayed
      figure appearing as a literal in three spellings, on any pre-formatted `CHF`/`%` string, on a
      scoreline, on any product or partner name, and on `toLocaleString`/`toFixed`.
    - **③** `app/components/tiles/partner-tile.tsx` — six monogram plates (`BI`, `MA`, `AL`, `SU`,
      `FE`, `HO`) painted in each partner's **own brand colour from the data**, with its
      `PARTNER_ROLE_LABEL` role tag. A test asserts no hex and no FCB colour token appears in the
      file at all: a partner plate in club red is wrong to a sponsor in the room. Hover lift
      measured in real Chrome at **exactly 2px** plus `shadow-raised`.
    - **④** Measured end to end in Chrome on the real data: all five labels in a 150px column with
      `scrollWidth <= clientWidth`, `text-overflow: clip`, `white-space: normal`.
    - **Reset (US-015 criterion ①) is now met** by the second of the two routes US-015's own note
      offered: the tiles are static chrome rendered by the route, above and outside the session
      list, so no question can remove them and Reset cannot fail to restore them.
      `tests/unit/baseline-reset.test.tsx` drives it end to end.
    - **First real-Chrome pass for US-017, US-021 and US-027**, which had all deferred it: no
      horizontal scroll at 1920×1080 (nor 1440/1280/834/390), 54 distinct KPI strings and 43
      distinct bar widths recorded per frame (it counts and grows, it does not snap), and two values
      only under `prefers-reduced-motion` — final state, nothing stranded at zero.
    - **Out of scope, deliberately:** the hero band (US-016), Top Products' period filter (US-026,
      wired by US-016 — the `action` slot is empty and says so), the prompt bar, the thinking panel.
      103 new tests, 880 total green.

- **US-014**: Dynamic tile insertion & grid reflow
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Hero tiles insert into the same grid with the E2 animation; the dashboard grows
    rather than clearing.
  - **Acceptance Criteria:**
    - Adding a hero appends tile descriptors to in-memory grid state; existing tiles reflow smoothly
    - Each answer renders as a self-contained, labelled insight section with its narrative stated first
    - Sections appear in the order the questions were asked
    - The view auto-scrolls to the newly added section
    - **Re-asking the same hero refreshes/re-inserts rather than duplicating** (dedupe by hero id)
    - Many tiles in one session: the grid scrolls vertically, earlier tiles remain, layout stays intact
    - No persistence — state is memory-only and resets on reload
  - **Dependencies:** US-006, US-012
  - **Completion note (2026-09-09):** All seven criteria met. Session state is a memory-only list of
    `{ heroId, phase, revision }` — pure transitions in `app/lib/dashboard/sections.ts`, React state
    in `use-dashboard.ts`, owned by `app/root.tsx` so the canvas and the app bar share one source.
    Sections render as **direct children of the US-012 canvas grid** and re-use its column tracks
    through `grid-cols-subgrid`, so there is still exactly one grid: measured in Chrome, canvas
    tracks 122.656px and a placeholder tile 816px wide (6 columns + gap) at the canvas's own column
    starts. Re-asking a hero refreshes in place — one section, same position, `revision` bumped, and
    a section already showing its follow-up never regresses; a follow-up **flips** its parent's
    phase rather than appending (the behaviour US-033 depends on), and a follow-up whose parent has
    not been shown renders the parent first. Reflow goes through US-006's `animateReflow` with
    `flushSync` inside the transition callback: real Chrome shows
    `::view-transition-group(fcb-tile-HERO_1)` animating while a second section inserts. The newest
    section is scrolled into view (`smooth`, `auto` under reduced motion, focus never moved) —
    `scrollY` 0 → 154 at 1280×620 as the third section overflowed, with the first still present.
    Under `prefers-reduced-motion` Chrome recorded zero `startViewTransition` calls and an identical
    final layout. A source scan over `app/**` fails on any `localStorage`, `sessionStorage`,
    `indexedDB` or `document.cookie`. Hero tiles (Phase 2b) and narratives (Phase 3b) are a clearly
    marked placeholder; `HeroSectionBody` is the single seam US-034 to US-039 replace.

- **US-015**: Reset to baseline
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** A visible Reset affordance that returns the dashboard to its initial state for
    the next demo run.
  - **Acceptance Criteria:**
    - Clears all hero sections and restores exactly the four baseline tiles
    - Re-shows the three initial suggestion chips and removes any follow-up chips
    - Scrolls back to top; no residual state
    - Pressed mid-flow (during a thinking beat) leaves no broken state and no orphaned animation
    - Pressed repeatedly / rapidly: stable, no duplicate tiles, no overlapping animations
  - **Dependencies:** US-014
  - **Completion note (2026-09-09):** Reset is a **pure transition beside the other three**
    (`withBaselineRestored` in `app/lib/dashboard/sections.ts`) driven by `reset` on
    `use-dashboard.ts`, wired to the app bar's existing US-012 control through `AppShell`'s
    `onReset` in `app/root.tsx`. Which criteria are met now and which are a seam:
    - **① Partly — seam-only for the four tiles (US-013).** Every hero section is cleared and the
      session returns to `BASELINE_SECTIONS`, the single named constant that is *also*
      `useDashboard`'s initial state. Nothing in the reset path says "empty"; US-013 lists its
      tiles in that one constant and load-state and reset-state stay identical for free.
    - **② Seam-only — the chips are US-029.** No chip is invented here. The intended wiring is
      recorded in the hook: a chip row **derived** from `sections` (initial chips at the baseline,
      follow-up chips from the sections on screen) is restored by reset with no reset logic of its
      own; `generation` is there for anything US-028/US-029 hold that cannot be derived.
    - **③ Fully met.** `scrollToTop` (`app/lib/motion.ts`) returns the window to the top, reduced-
      motion-aware and focus-preserving; the session is replaced by one whole baseline snapshot,
      so sections, focus and counters all clear together — no residual state.
    - **④ Partly — the mechanism is fully built, the thinking beat is US-031.** `schedule` owns the
      single pending timer and `reset` cancels it **first**, before touching state. Proven by
      deleting the cancel: the pending beat then inserted `HERO_2` into the freshly-reset
      dashboard and two tests failed. US-031 schedules through this and needs no retrofit.
    - **⑤ Fully met.** `withBaselineRestored` returns the *same list reference* when there is
      nothing to clear, so a second press in the same frame (which reads the first press's
      committed snapshot, not a stale render) animates nothing. Ten presses in one frame → one
      view transition, one baseline list, no duplicates. Real Chrome: three rapid presses from
      `scrollY` 900 → 0, three scroll requests, **zero** `startViewTransition` calls, and
      `behavior: "auto"` throughout under `prefers-reduced-motion`.
    - No persistence — the `app/**` storage scan still passes. 40 new tests, 592 total green.

- **US-016**: Hero band — webshop trend & attendance ring
  - **Story Points:** 5
  - **Priority:** P1
  - **Component:** [Web]
  - **Status:** ⏸️ Deferred to the Phase 2b run
  - **Description:** The navy greeting band above the baseline row: a persona greeting, a period
    filter, the webshop line chart, and the attendance ring.
  - **Acceptance Criteria:**
    - One `Segmented` period filter (This month / Last month / Last 3 months / Year to date) drives
      **both** the webshop chart and the attendance ring from the same period dataset
    - Webshop chart plots the selected period against the previous period — gold area line (current)
      over a dashed white line (previous), with a legend; spans the wider left column
    - Hover renders a vertical guide plus a tooltip showing both series' values at that point
    - Attendance ring: on hover the centre swaps from average attendance to "% of capacity" and the
      arc gains a soft glow
    - On every filter change the number counts up from its current value, the line redraws, and the
      ring sweeps to the new value
    - Webshop total and its delta are **computed** from the series, never stored separately
  - **Dependencies:** US-007, US-025, US-026, US-027
  - **Status note (2026-09-09):** ⏸️ **Deferred to the Phase 2b run** — US-025 (line chart),
    US-026 (segmented filter) and US-027 (motion hooks) all live in Phase 2b.
  - **Notes:** A Reference Guide addition beyond the Build Specification, added at the lead owner's
    direction. P1 because the three heroes are the demo's core; this is the frame around them.

---

## Phase Summary

**Total Epics:** 1 | **Total Stories:** 5 | **Total Points:** 16

**By Priority:** P0: 4 stories, 11 points · P1: 1 story, 5 points · P2: 0

**By Status:** ✅ 4 stories, 11 points · 🔄 0 · 📋 0 · ⏸️ 1 story, 5 points (US-016 — US-025/US-026 unbuilt)

---

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-1b-seed-data.md) · [Next Phase →](phase-2b-components.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
