# Phase 2a: Dashboard Shell & Persona Baseline

**Duration:** 2026-09-10 to 2026-09-11 (~8.1 AI-hours)
**Status:** ✅ Completed
**Started:** 2026-09-09
**Target Completion:** 2026-09-11
**Actual Completion:** 2026-09-09

> **Acceptance criteria live in** [`../../input/backlog/phase-2a-shell.md`](../../input/backlog/phase-2a-shell.md).
> This file tracks execution.

---

## Phase Goal

Build the frame the whole demo lives in: the branded shell, the persona identity, the pre-populated
baseline dashboard, and the insertion mechanic that makes the dashboard visibly grow when a question
is asked.

**Success Criteria:**
- On load the canvas shows a dashboard that already looks lived-in — not an empty canvas
- Hero tiles insert into the **same** grid; the dashboard grows and never clears
- Reset restores the baseline and the initial chip state with no residual state
- No horizontal scroll and legible sizing at 1920×1080

---

## Epics in This Phase

### Epic 4: E4 — Dashboard Shell & Persona Baseline (16 story points)

**Priority:** P0 (US-016 is P1) · **Status:** ✅ Completed (5/5) · **Dependencies:** US-003, US-004, US-005, US-007

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-012 | Branded application shell | 3 | P0 | ✅ Completed |
| US-013 | Baseline dashboard — four pre-existing tiles | 3 | P0 | ✅ Completed |
| US-014 | Dynamic tile insertion & grid reflow | 3 | P0 | ✅ Completed |
| US-015 | Reset to baseline | 2 | P0 | ✅ Completed |
| US-016 | Hero band — webshop trend & attendance ring | 5 | **P1** | ✅ Completed |

**Technical Notes:**

- **The dashboard grows, it never clears.** This single behaviour is what makes the product read as
  "the system added this to my dashboard" rather than "a page navigated". It is the mechanic the
  client's own framing describes.
- **The persona is a role, not a person:** workspace label "Sales & Marketing", avatar initials "SM".
  No real or realistic individual name anywhere — this keeps clear of the salary/named-individual
  guardrail and avoids colliding with a real employee.
- Sidebar items Reports / Data Sources / Settings are **deliberately inert** — dimmed, no hover
  affordance, no navigation. They imply a fuller product without pretending to be one. Do not wire
  them to routes.
- Re-asking the same hero **refreshes in place** (dedupe by hero id), never duplicates tiles.
- Grid state is an in-memory list of tile descriptors. No persistence, by specification.
- **US-016 is first in the cut order.** It is a Reference Guide refinement beyond the Specification;
  it makes the frame richer but is not one of the three demonstrations. It shipped **self-contained**
  for exactly that reason: one grid item, no state anything else reads, and no import from the
  baseline row — a test asserts the row never mentions it, so the cut stays cheap.

---

## Definition of Done *(applies to every story in this phase)*

- [x] Code implemented and reviewed against `.claude/rules/code-quality.md`
- [x] Tests written and passing; coverage ≥ 80%
- [x] Security triage run per `.claude/rules/security-review.md` — no security-relevant changes in
      any of the five stories
- [x] Linter clean · Git commit created · Progress tracking updated
- [x] Screen map refreshed — every region of SCREEN-001 this phase owns is now Built

*Not applicable:* API status-code matrix · i18n.

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 16 · **Stories:** 5 · **Epics:** 1
- **Estimated Effort:** ~27 team-hours → ~8.1 AI-core hours
- **Risk Level:** Medium — US-014's reflow behaviour is where visual polish is won or lost

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 16 / 16 (100%)
- **Completed Stories:** 5 / 5 — **the phase is COMPLETE**
- **Deferred:** none. US-013 and US-016 were both completed **in the Phase 2b run** once their
  cross-phase dependencies existed (US-017 + US-021 for the row; US-025 + US-026 + US-027 for the
  band), with no rework to either
- **Tests Passing:** 1090 / 1090 · **Coverage:** 99.75% stmts / 98.61% branches / 100% funcs / 100% lines (`app/**`) · **Commits:** 6

---

## Dependencies

**Depends On:**
- US-003 tokens, US-004 crest, US-005 card shell, US-006 insertion motion (Phase 1a)
- US-007 baseline datasets (Phase 1b)
- US-017 KPI tile + US-021 horizontal bar tile — **needed by US-013**; both landed 2026-09-09 and
  US-013 shipped immediately after
- US-025, US-026, US-027 — **needed by US-016** for the hero band; all three landed 2026-09-09 and
  US-016 shipped the same day, composing them without changing any of their APIs

**Blocks:** US-033 (follow-up gating) needs US-014's insertion mechanic.

> ✅ **Sequencing note, closed:** US-013 and US-016 had dependencies in Phase 2b, so the phase ran
> US-012 / US-014 / US-015 first and completed both inside the Phase 2b run once US-017, US-021,
> US-025, US-026 and US-027 existed. Reordering within the run cost nothing and required no rework.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Grid jumps instead of reflowing when tiles insert | High | Medium | Existing tiles animate to new positions; verified in US-043 polish | AI | Mitigated — US-014 wraps every insertion in a view transition; `::view-transition-group(fcb-tile-HERO_1)` observed animating in real Chrome while a second section inserted |
| Reset mid-flow leaves an orphaned timeout or animation | Medium | Medium | Reset clears the pending timeout ref; verified in US-042 and US-045 | AI | Mitigated — US-015 owns the single pending timer (`schedule`) and cancels it **first**, before touching state. Proven by deleting the cancel: the beat then inserted `HERO_2` into the reset dashboard and two tests failed. Repeated presses run one transition, not several |
| Cross-phase dependency stalls US-013 / US-016 | Medium | High | See sequencing note above — reorder within the phase rather than blocking | AI | ✅ Closed — US-013 shipped in the Phase 2b run the day US-017 and US-021 landed, with no rework to either, and US-026 (2026-09-09) was the last piece US-016 waited on: reordering within the run cost nothing |
| Horizontal scroll appears at 1080p | High | Low | Responsive 12-column grid; verified in US-040 | AI | Mitigated — US-012 shell measured in Chrome at 1920×1080, `scrollWidth === clientWidth` |

---

## Progress Log

### 2026-09-09 — US-012 Branded application shell ✅ (3 pts)

**Delivered:** the frame every state of SCREEN-001 lives in — `chrome/{sidebar,top-bar,app-shell}`,
plus `lib/persona.ts` (the role-not-a-person guardrail) and the responsive 12 → 8 → 4 canvas grid,
left **empty** for US-013/US-014. `root.tsx` mounts the shell around `<Outlet />`.

**Inert items are inert structurally, not by handler:** plain `<span>` (no `href`, no `role`, no
handler, no focus, `pointer-events-none`, `aria-disabled`). Chrome: `tabIndex` -1 on all three, a
synthesised click leaves the router at `/`. **"Connected · 11 systems" is decorative** (no `fetch`,
no `useEffect`, no timer in the file). **Reset renders but does nothing** — behaviour is US-015.

**Verified in Chrome at 1920×1080:** `scrollWidth === clientWidth` (also 1280, 900, 390); the
sidebar disappears at 900. **Gates:** all ✅ · 475/475 tests · coverage 100% stmts / 98.9% branches.
**Security triage:** no security-relevant changes detected. Full detail in `completed.md`.

**Next:** US-014 — dynamic tile insertion & grid reflow (3 pts).

### 2026-09-09 — US-014 Dynamic tile insertion & grid reflow ✅ (3 pts)

**Delivered:** the mechanic the whole demo turns on — the dashboard grows, it never clears.
`lib/dashboard/sections.ts` (the session as a pure, memory-only list of `{ heroId, phase,
revision }`), `use-dashboard.ts` (the hook every question arrives through), `heroes/{hero-section,
insight-sections}.tsx`, `scrollRevealedIntoView` in `lib/motion.ts`, and `HeroId` / `HERO_IDS` in
the enum module. `root.tsx` now owns the session state, above both the canvas and the app bar.

**Dedupe by hero id, proven three ways** (pure list, hook, real Chrome). A refresh keeps POSITION
and PHASE and only bumps `revision`; a section already showing its follow-up never regresses. **A
follow-up flips its parent's phase, it does not append** — the behaviour US-033 inherits.

**One grid, not two.** A section spans the canvas grid and re-uses its tracks through
`grid-cols-subgrid`: Chrome at 1920×1080 showed canvas tracks of 122.656px and placeholder tiles
816px wide at x=256/1088 (exactly 6 columns + gap). **Reflow, never jump:**
`::view-transition-group(fcb-tile-HERO_1)` animates while a second section inserts, which
`flushSync` inside the transition callback is what makes real. Auto-scroll took `scrollY` 0 → 154 at
1280×620; under reduced motion Chrome recorded **zero** `startViewTransition` calls.

**No persistence, by specification:** an `app/**` source scan fails on any `localStorage`,
`sessionStorage`, `indexedDB` or `document.cookie`. **Scope held:** hero content is a marked
placeholder; `HeroSectionBody` is the single seam US-034 to US-039 replace.

**Gates:** all ✅ · 552/552 tests (77 new) · coverage 100% stmts / 99.1% branches. **Security
triage:** no security-relevant changes detected. Full detail in `completed.md`.

**Next:** US-015 — Reset to baseline (2 pts).

### 2026-09-09 — US-015 Reset to baseline ✅ (2 pts)

**Delivered:** the control that lets the demo be run twice. Reset is a **transition beside the other
three**, not a special case.
- `app/lib/dashboard/sections.ts` — `BASELINE_SECTIONS` (the named baseline), `withBaselineRestored`,
  `isBaseline`, `sameSections`. Pure, and the reset path nowhere says "empty".
- `app/lib/dashboard/use-dashboard.ts` — `reset`, plus `schedule` (the single pending timer) and
  `generation`. The session is now ONE committed snapshot mirrored into a ref, so a second press in
  the same frame reads the first press's result instead of a stale render.
- `app/lib/motion.ts` — `scrollToTop`, the mirror of `scrollRevealedIntoView`, reduced-motion-aware.
- `app/root.tsx` — `<AppShell onReset={reset}>`. The US-012 control finally does something.

**Two of the five criteria WERE a SEAM, not a claim** (both are closed now — see below) — stated plainly because the things they
describe are not built:
- **① the four baseline tiles are US-013** (deferred to the Phase 2b run). Reset restores
  `BASELINE_SECTIONS`, which is *also* `useDashboard`'s initial state, so US-013 lists its tiles in
  that one constant and gets reset for free. Sections are genuinely all cleared today.
- **② the suggestion chips are US-029** and **④'s thinking beat is US-031.** No chip and no
  thinking panel was invented here. The chip seam is `sections` (derive the row from the session
  list and reset restores it with no logic of its own); the beat seam is `schedule`, and reset
  already cancels it, so US-031 needs no retrofit.
  - **④ ✅ CLOSED BY US-031 (2026-09-09, in the Phase 3a run) — through the `schedule` seam, with
    no reset code touched and no second timer added.** With a real beat to press through, the
    criterion is now driven end to end: Reset mid-beat leaves no panel, no section and **no
    timer**, and the cancelled answer never arrives. Both halves proved by mutation — deleting
    `cancelPending()` fails 4 tests, deleting the beat's `generation` clear fails 4
    (`tests/unit/thinking-beat.test.tsx`). **All five of US-015's criteria are now met.**
  - **② ✅ CLOSED BY US-029 (2026-09-09, in the Phase 3a run) — through the seam exactly as
    described, with no change to any reset code.** `suggestionChips(sections)`
    (`app/lib/dashboard/chips.ts`) is a pure function of the session list, `app/root.tsx` evaluates
    it every render and holds **no chip state**, so Reset restoring `BASELINE_SECTIONS` restores
    the three hero chips and drops every follow-up chip for free. Driven end to end on the real
    `App` in `tests/unit/suggestion-chips.test.tsx`.
- **③ and ⑤ are fully met today.**

**THE TIMER, PROVEN BY BREAKING IT.** `reset` calls `cancelPending()` first, before it touches
state; deleting that one line makes two tests fail with the pending beat inserting an answer into a
dashboard the presenter had just cleared. `schedule` keeps only ONE timer pending, and an unmount
cancels it. **Abuse-proof by construction:** `withBaselineRestored` returns the *same list
reference* when there is nothing to clear, so ten presses in one frame run **one** view transition.

**Verified in real Chrome (1280×620):** three rapid presses from `scrollY` 900 → 0, three scroll
requests, **zero** `startViewTransition` calls — the no-op path under abuse; `behavior: "auto"`
throughout under reduced motion. The *clearing* reflow could not yet be driven from the UI.

**Gates:** all ✅ · 592/592 tests (40 new) · coverage 100% stmts / 99.2% branches. **Security
triage:** no security-relevant changes detected. Full detail in `completed.md`.

**Next:** Phase 2b — the tile components (US-017 to US-027). US-013 and US-016 are completed **in
that run**, once their dependencies exist; Phase 2a therefore closes at **3/5 stories, 8/16 points**
and is deliberately left open.

### 2026-09-09 — US-013 Baseline dashboard: four pre-existing tiles ✅ (3 pts, in the Phase 2b run)

**Delivered: the canvas stops being empty** — the first impression in the owner meeting. Everything
**composes** the Phase 1a/2b parts: `baseline-row.tsx` renders `KpiTile` ×2, `HBarTile` and the new
`PartnersTile` as **direct children of the one canvas grid**, fed by `lib/dashboard/baseline.ts`
through the route's SSR loader; `derive.ts` gained `trailingPoints`, `trendEndingAt` and
`capacityShare`.

**② NO FIGURE IS RE-TYPED — proven two ways.** Every rendered string is asserted EQUAL to
`repository → derive → format.ts` output, and a **source scan** fails on any displayed figure as a
literal in three spellings, any `CHF <digit>` or `<n>%` string, any product or partner name, and on
`toLocaleString` / `toFixed`. The headline and its `+11.9%` are `seriesTotals` off the same array the
sparkline draws, and `trendEndingAt` makes the window **end on the month the headline covers**.
**③** Six monogram plates in each partner's **own** brand colour (no hex, no FCB token in the file);
hover lift measured at exactly 2px. **④** All five Top Products labels whole in a 150px column,
`scrollWidth <= clientWidth`, measured on the real data.

**RESET'S BASELINE SEAM IS CLOSED** the way US-015 described: the tiles are static route chrome
outside the session list, so no question can remove them and Reset cannot fail to restore them —
`baseline-reset.test.tsx` drives insert → Reset and compares the canvas `innerHTML` to its load
state. **First real-Chrome pass for US-017, US-021 and US-027:** no horizontal scroll at 1920×1080
(nor 1440/1280/834/390), 54 distinct KPI strings and 43 bar widths per frame, two values only under
reduced motion. **Gates:** all ✅ · 880/880 tests (103 new) · coverage 100% stmts / 99.58% branches.
**Security triage:** no security-relevant changes detected (the loader is an SSR data hop, not an
HTTP endpoint). Full detail in `completed.md`.

**Next:** US-016 — hero band (5 pts), the last story in this phase.

### 2026-09-09 — US-016 Hero band: webshop trend & attendance ring ✅ (5 pts, in the Phase 2b run)

**Delivered: the band that closes Phase 2a.** The navy greeting strip above the baseline row —
persona greeting, period filter, webshop line chart in the wider left column, attendance ring and
its stats in the narrower right one. New: `components/dashboard/hero-band.tsx`,
`components/charts/attendance-ring.tsx`, `personaGreeting` in `lib/persona.ts`, a `HeroBandData`
half on the existing loader view model, and three token-only rules in `app/app.css` (`.fcb-band`,
`.fcb-band-wash`, `.fcb-ring-glow`).

- **① ONE control drives BOTH widgets.** The band holds exactly one `useState` and exactly one
  `<Segmented>` — a test pins both counts — and the chart and the ring read the SAME
  `BaselinePeriod` entry. One click in Chrome moved the line's `d`, the KPI, the ring's arc and the
  stats together. Top Products keeps its **own** filter deliberately (a presenter may compare this
  month's best sellers against a year-to-date trend); a test proves the band's press leaves it alone.
- **② / ③** Gold area line (current) over a dashed white previous period, in DRAWING order so the
  gold is on top, legend beside the KPI (`legend={false}` on the chart, `LineChartLegend` placed by
  the band), 8 of 12 columns. Hover: a vertical guide, one dot per series, and a tooltip carrying
  **both** readings — Chrome at W3 showed `Previous CHF 30’200` and `This month CHF 33’900`.
- **④ The ring is the one genuinely new visual.** Hand-built SVG, no library: `ringGeometry` is pure
  and clamps a share outside 0–1 (a sell-out would otherwise wrap the arc back over itself), the arc
  sweeps on `stroke-dasharray`, and hover **or focus** swaps the centre to "% of capacity" and adds
  `.fcb-ring-glow`. Gold is an accent on a 12px arc, never a fill — `motion.test.tsx` now allows
  exactly three consumers of `--color-accent-target-hit` and still rejects a gold ring on a tile.
- **⑤ The number counts from what is on screen.** Chrome: settled at `CHF 148’200`, still
  `CHF 148’200` in the frame after the click, then **54 distinct strings** down to `CHF 132’400`.
  The line is **re-keyed** (a new element at `stroke-dashoffset: 1px` → `0px` across 44 values) while
  the ring transitions **on the same element** (43 dash pairs, 315.38px → 300.1px).
- **⑥** `seriesTotals` sums the plotted array on every render; `HeroBandData` has **no** total or
  delta field to read one from, and a scan rejects `total:` / `deltaPercent:` in the band.
- **US-013's loose end closed:** Top Products' `action` slot now holds a light `Segmented` — 48
  distinct bar-width frames, 54 value frames, and the **same** row elements throughout.
- **One real defect found by first mount and fixed in `LineChart`:** end axis labels were clipped by
  the svg's own bounds (`W1`/`W4` at 1080p), so `axisLabelAnchor` now anchors the ends inwards.
- **Reduced motion:** one KPI string, one ring value, arc at 315.38px, line at offset 0, area at
  opacity 1, bars at final width — nothing stranded at zero.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 1090/1090 tests ✅ (92 new) · build ✅ · coverage
**99.75% stmts / 98.61% branches / 100% funcs / 100% lines** (`app/**`). **Security triage:** no
security-relevant changes detected — no route, no handler, no endpoint (the loader's shape is
unchanged), no SQL, no `innerHTML`, no user-supplied URL, no upload, **no dependency change**, no env
var, no logging, no storage API; every rendered string is an escaped text node and the only dynamic
style values are token references and numeric geometry.

**Next:** Phase 2b continues with US-018 — vertical bar chart tile (3 pts).

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** ✅ **Completed** (5/5 stories · 16/16 points) — closed 2026-09-09 with US-016
**Previous:** [Phase 1b](phase-1b.md) · **Next:** [Phase 2b — Components](phase-2b.md)
