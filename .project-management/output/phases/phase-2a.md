# Phase 2a: Dashboard Shell & Persona Baseline

**Duration:** 2026-09-10 to 2026-09-11 (~8.1 AI-hours)
**Status:** In Progress
**Started:** 2026-09-09
**Target Completion:** 2026-09-11
**Actual Completion:** —

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

**Priority:** P0 (US-016 is P1) · **Status:** In Progress (3/5 completed) · **Dependencies:** US-003, US-004, US-005, US-007

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-012 | Branded application shell | 3 | P0 | ✅ Completed |
| US-013 | Baseline dashboard — four pre-existing tiles | 3 | P0 | ⏸️ Deferred to Phase 2b run |
| US-014 | Dynamic tile insertion & grid reflow | 3 | P0 | ✅ Completed |
| US-015 | Reset to baseline | 2 | P0 | ✅ Completed |
| US-016 | Hero band — webshop trend & attendance ring | 5 | **P1** | ⏸️ Deferred to Phase 2b run |

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
  it makes the frame richer but is not one of the three demonstrations.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md`
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated
- [ ] Screen map refreshed if the story changes the single screen's structure

*Not applicable:* API status-code matrix · i18n.

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 16 · **Stories:** 5 · **Epics:** 1
- **Estimated Effort:** ~27 team-hours → ~8.1 AI-core hours
- **Risk Level:** Medium — US-014's reflow behaviour is where visual polish is won or lost

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 8 / 16 (50%)
- **Completed Stories:** 3 / 5 — **the phase is NOT complete**
- **Deferred:** US-013 (3 pts) and US-016 (5 pts) → the **Phase 2b run**; their component
  dependencies (US-017, US-021, US-025, US-026, US-027) all live in Phase 2b
- **Tests Passing:** 592 / 592 · **Coverage:** 100% stmts / 99.2% branches / 100% funcs (`app/**`) · **Commits:** 3

---

## Dependencies

**Depends On:**
- US-003 tokens, US-004 crest, US-005 card shell, US-006 insertion motion (Phase 1a)
- US-007 baseline datasets (Phase 1b)
- US-021 horizontal bar tile — **needed by US-013** for Top Products
- US-025, US-026, US-027 — **needed by US-016** for the hero band

**Blocks:** US-033 (follow-up gating) needs US-014's insertion mechanic.

> ⚠️ **Sequencing note:** US-013 and US-016 have dependencies that live in Phase 2b. If Phase 2a runs
> strictly before 2b, build US-012, US-014 and US-015 first and complete US-013/US-016 after the
> relevant components exist — or pull US-021/US-025/US-026/US-027 forward.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Grid jumps instead of reflowing when tiles insert | High | Medium | Existing tiles animate to new positions; verified in US-043 polish | AI | Mitigated — US-014 wraps every insertion in a view transition; `::view-transition-group(fcb-tile-HERO_1)` observed animating in real Chrome while a second section inserted |
| Reset mid-flow leaves an orphaned timeout or animation | Medium | Medium | Reset clears the pending timeout ref; verified in US-042 and US-045 | AI | Mitigated — US-015 owns the single pending timer (`schedule`) and cancels it **first**, before touching state. Proven by deleting the cancel: the beat then inserted `HERO_2` into the reset dashboard and two tests failed. Repeated presses run one transition, not several |
| Cross-phase dependency stalls US-013 / US-016 | Medium | High | See sequencing note above — reorder within the phase rather than blocking | AI | Open |
| Horizontal scroll appears at 1080p | High | Low | Responsive 12-column grid; verified in US-040 | AI | Mitigated — US-012 shell measured in Chrome at 1920×1080, `scrollWidth === clientWidth` |

---

## Progress Log

### 2026-09-09 — US-012 Branded application shell ✅ (3 pts)

**Delivered:** the frame every state of SCREEN-001 lives in.
- `app/components/chrome/sidebar.tsx` — navy sidebar, `Dashboard` active (`aria-current="page"`),
  three inert placeholders. Hidden below `lg` so a narrow viewport gives the canvas full width.
- `app/components/chrome/top-bar.tsx` — crest, workspace label, decorative connection status,
  Reset, "SM" monogram.
- `app/components/chrome/app-shell.tsx` — composition plus the responsive canvas grid
  (12 → 8 → 4 columns). The grid is left **empty** for US-013/US-014.
- `app/lib/persona.ts` — the role-not-a-person guardrail in one place.
- `app/root.tsx` now mounts the shell around `<Outlet />`; `app/routes/_index.tsx` is reduced to the
  screen's `h1` so the routed page renders as grid items on the canvas.

**Inert items are inert structurally, not by handler:** plain `<span>` (no `href`, no `role`, no
handler, no focus, `pointer-events-none`) with `aria-disabled="true"`. Measured in real Chrome:
`tabIndex` -1 and `pointer-events: none` on all three; a synthesised `click` leaves the router
location at `/`. A source guard fails the build if a `hover:` rule or a second route target appears
in the file.

**"Connected · 11 systems" is decorative** — static text, `data-decorative="true"`, no live region,
and source assertions that the file contains no `fetch`, no `axios`, no `useEffect` and no timer, so
it cannot be wired to a health check. **Reset renders but does nothing** beyond an injected
callback; behaviour is US-015.

**Verified in Chrome at 1920×1080:** `scrollWidth === clientWidth` (also at 1280, 900, 390); the
sidebar disappears at 900 and the grid steps 12 → 8 → 4.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 475/475 tests ✅ · build ✅ · coverage 100% stmts /
98.9% branches. **Security triage:** no security-relevant changes detected — no endpoint, no raw
SQL, no `dangerouslySetInnerHTML`, no user-supplied URL, no upload, no env var, no dependency
change. All rendered text comes from module constants and is React-escaped.

**Not built here, on purpose:** the four baseline tiles (US-013), tile insertion (US-014), reset
behaviour (US-015), the hero band (US-016).

**Next:** US-014 — dynamic tile insertion & grid reflow (3 pts). US-013 and US-016 stay deferred to
the Phase 2b run; their component dependencies live there.

### 2026-09-09 — US-014 Dynamic tile insertion & grid reflow ✅ (3 pts)

**Delivered:** the mechanic the whole demo turns on — the dashboard grows, it never clears.
- `app/lib/dashboard/sections.ts` — the session as a pure, memory-only list of
  `{ heroId, phase, revision }`; append / refresh-in-place / flip-the-phase, and nothing else.
- `app/lib/dashboard/use-dashboard.ts` — the hook every question arrives through
  (`showHero` / `showFollowUp`), wrapping each mutation in US-006's `animateReflow` and publishing a
  `focus` signal for the auto-scroll.
- `app/components/heroes/hero-section.tsx` + `insight-sections.tsx` — the section frame (label,
  narrative first, staggered tiles) and the ordered region, rendered as **direct children of the
  US-012 canvas grid**.
- `app/lib/motion.ts` — adds `scrollRevealedIntoView`, the reduced-motion-aware auto-scroll.
- `app/root.tsx` now owns the session state, above both the canvas and the app bar.
- `app/lib/repositories/enums.ts` — `HeroId` / `HERO_IDS`, the identity a question resolves to and
  the key a section is deduped by.

**Dedupe by hero id, proven three ways:** the pure list returns one entry after five re-asks; the
hook keeps two sections when hero 1 is asked twice around hero 2, with hero 1 still first; and real
Chrome shows two sections (order intact) after a re-ask. A refresh keeps POSITION and PHASE and only
bumps `revision`, which changes the React key so the section re-inserts in place instead of sitting
there unchanged — and a section that already shows its follow-up never regresses.

**Follow-up flips, it does not append** — `withFollowUpShown` sharpens the existing section
(`data-phase="withFollowUp"`, a second panel appears in the same section). US-033 inherits this
directly; a follow-up whose parent has not been shown renders the parent first, never an error.

**One grid, not two.** A section spans the canvas grid and re-uses its tracks through
`grid-cols-subgrid`, so a tile asking for 6 of 12 columns lands on the canvas's own tracks —
measured in Chrome at 1920×1080: canvas tracks 122.656px, section computed `subgrid`, placeholder
tiles 816px wide at x=256 and x=1088 (exactly 6 columns + gap).

**Reflow, never jump — verified in real Chrome:** inserting a second section animates
`::view-transition-group(fcb-tile-HERO_1)` (the existing section gliding to its new row) alongside
`::view-transition-new(fcb-tile-HERO_2)`. `flushSync` inside the transition callback is what makes
this real: a batched React update would let the browser capture the old layout twice.

**Auto-scroll and reduced motion:** the newest (or freshly sharpened) section is scrolled into view
with `behavior: "smooth"`, `"auto"` under `prefers-reduced-motion`, and focus is never moved. At
1280×620, `window.scrollY` went 0 → 154 as the third section overflowed the canvas, with section 1
still in the DOM. Under reduced motion Chrome recorded **zero** `startViewTransition` calls and an
identical final layout (opacity 1, same tile geometry, subgrid intact).

**No persistence, by specification:** a source scan over all of `app/**` (comments stripped) fails
on any `localStorage`, `sessionStorage`, `indexedDB` or `document.cookie`, and a remount test shows
the session starting empty again, as a reload would.

**Scope held:** hero tiles are Phase 2b and hero narratives Phase 3b, so the body is a clearly
marked placeholder — a test asserts no digit reaches the screen from it. `HeroSectionBody` is the
single seam US-034 to US-039 replace.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 552/552 tests ✅ (77 new) · build ✅ · coverage 100%
stmts / 99.1% branches. **Security triage:** no security-relevant changes detected — no endpoint, no
raw SQL, no `dangerouslySetInnerHTML`, no user-supplied URL, no upload, no env var, no dependency
change, and no storage API. All rendered text comes from module constants and is React-escaped.

**Next:** US-015 — Reset to baseline (2 pts); it adds `reset` to `useDashboard` and wires the app
bar's existing `onReset`. US-013 and US-016 stay deferred to the Phase 2b run.

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

**Two of the five criteria are a SEAM, not a claim** — stated plainly because the things they
describe are not built:
- **① the four baseline tiles are US-013** (deferred to the Phase 2b run). Reset restores
  `BASELINE_SECTIONS`, which is *also* `useDashboard`'s initial state, so US-013 lists its tiles in
  that one constant and gets reset for free. Sections are genuinely all cleared today.
- **② the suggestion chips are US-029** and **④'s thinking beat is US-031.** No chip and no
  thinking panel was invented here. The chip seam is `sections` (derive the row from the session
  list and reset restores it with no logic of its own); the beat seam is `schedule`, and reset
  already cancels it, so US-031 needs no retrofit.
- **③ and ⑤ are fully met today.**

**THE TIMER, PROVEN BY BREAKING IT.** `reset` calls `cancelPending()` first, before it touches
state. Deleting that one line makes two tests fail with
`expected [ { heroId: 'HERO_2', … } ] to deeply equal []` — the pending beat inserting an answer
into a dashboard the presenter had just cleared. `schedule` also keeps only ONE timer pending
(a second replaces the first), and an unmount cancels it as a reset the user did not press.

**Abuse-proof by construction, not by a guard clause.** `withBaselineRestored` hands back the *same
list reference* when there is nothing to clear, which is how the hook tells "something to clear"
from "nothing to clear". Ten presses in one frame → **one** view transition, one baseline list, zero
duplicates; a press with an empty canvas starts no transition at all; interleaved
question/reset/question bursts end with exactly one section.

**Verified in real Chrome (1280×620):** from `scrollY` 900, three rapid Reset presses land at
`scrollY` 0 with three scroll requests (a browser replaces an in-flight smooth scroll rather than
stacking) and **zero** `startViewTransition` calls despite the browser supporting them — the no-op
path under abuse. Under `prefers-reduced-motion: reduce` all three presses requested
`behavior: "auto"`. Shell, canvas and Reset control intact, no page error. The *clearing* reflow
cannot yet be driven from the UI (no prompt bar until US-028), so it is covered by jsdom against a
real-shaped `startViewTransition` and gets its browser pass with US-029's chips.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 592/592 tests ✅ (40 new) · build ✅ · coverage 100%
stmts / 99.2% branches / 100% funcs. **Security triage:** no security-relevant changes detected —
no endpoint, no raw SQL, no `dangerouslySetInnerHTML`, no user-supplied URL, no upload, no env var,
no dependency or lockfile change, no logging, and no storage API (the `app/**` scan still passes).
`reset` takes no arguments, so no user input reaches it; the only new resource is one timer, bounded
to one at a time and cleared on reset and on unmount.

**Next:** Phase 2b — the tile components (US-017 to US-027). US-013 and US-016 are completed **in
that run**, once their dependencies exist; Phase 2a therefore closes at **3/5 stories, 8/16 points**
and is deliberately left open.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** In Progress (3/5 stories · 8/16 points) — US-013 and US-016 **deferred to the
Phase 2b run**, so this phase does **not** close here
**Previous:** [Phase 1b](phase-1b.md) · **Next:** [Phase 2b — Components](phase-2b.md)
