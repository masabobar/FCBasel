# Phase 2a: Dashboard Shell & Persona Baseline

**Goal:** The frame the whole demo lives in — the branded shell, the persona identity, the
pre-populated baseline dashboard, and the tile-insertion mechanic that makes the dashboard visibly
grow when a question is asked.
**Duration:** Day 2 (of a one-week build)
**Total Stories:** 5
**Total Points:** 16
**Status:** In Progress (1/5 completed)

> **Global guardrails apply** — see [`../constraints.md`](../constraints.md) §2.

---

## Epic 4: E4 — Dashboard Shell & Persona Baseline

**Priority:** P0
**Total Story Points:** 16
**Status:** In Progress (1/5 completed)
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
  - **Status:** ⏸️ Deferred to the Phase 2b run
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
  - **Status note (2026-09-09):** ⏸️ **Deferred to the Phase 2b run.** US-017 (KPI tile, for the
    Webshop revenue and Last home match tiles) and US-021 (horizontal bars, for Top Products) both
    live in Phase 2b. US-017 was missing from this dependency list and has been added.
  - **Notes:** Partner logos are placeholders until licensed.

- **US-014**: Dynamic tile insertion & grid reflow
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
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

- **US-015**: Reset to baseline
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** A visible Reset affordance that returns the dashboard to its initial state for
    the next demo run.
  - **Acceptance Criteria:**
    - Clears all hero sections and restores exactly the four baseline tiles
    - Re-shows the three initial suggestion chips and removes any follow-up chips
    - Scrolls back to top; no residual state
    - Pressed mid-flow (during a thinking beat) leaves no broken state and no orphaned animation
    - Pressed repeatedly / rapidly: stable, no duplicate tiles, no overlapping animations
  - **Dependencies:** US-014

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

**By Status:** ✅ 1 story, 3 points · 🔄 0 · 📋 2 stories, 5 points · ⏸️ 2 stories, 8 points (US-013, US-016 — dependencies live in Phase 2b)

---

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-1b-seed-data.md) · [Next Phase →](phase-2b-components.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
