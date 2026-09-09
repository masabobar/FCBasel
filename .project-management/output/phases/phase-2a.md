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

**Priority:** P0 (US-016 is P1) · **Status:** In Progress (4/5 completed) · **Dependencies:** US-003, US-004, US-005, US-007

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-012 | Branded application shell | 3 | P0 | ✅ Completed |
| US-013 | Baseline dashboard — four pre-existing tiles | 3 | P0 | ✅ Completed |
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
- **Completed Story Points:** 11 / 16 (69%)
- **Completed Stories:** 4 / 5 — **the phase is NOT complete**
- **Deferred:** US-016 (5 pts) → still open; its dependencies US-025 (line chart) and US-026
  (segmented filter) are not built yet. US-013 was completed in the Phase 2b run on 2026-09-09,
  once US-017 and US-021 existed
- **Tests Passing:** 880 / 880 · **Coverage:** 100% stmts / 99.6% branches / 100% funcs (`app/**`) · **Commits:** 4

---

## Dependencies

**Depends On:**
- US-003 tokens, US-004 crest, US-005 card shell, US-006 insertion motion (Phase 1a)
- US-007 baseline datasets (Phase 1b)
- US-017 KPI tile + US-021 horizontal bar tile — **needed by US-013**; both landed 2026-09-09 and
  US-013 shipped immediately after
- US-025, US-026, US-027 — **needed by US-016** for the hero band (US-027 landed; US-025/US-026 open)

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
| Cross-phase dependency stalls US-013 / US-016 | Medium | High | See sequencing note above — reorder within the phase rather than blocking | AI | Half closed — US-013 shipped in the Phase 2b run the day US-017 and US-021 landed, with no rework to either. US-016 stays open until US-025/US-026 exist |
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

**Delivered: the canvas stops being empty.** This is the first impression in the owner meeting and
the client's own framing of the mechanic — the persona sees a dashboard that already looks lived-in,
and their questions ADD to it rather than filling a blank one. Everything here **composes** the
Phase 1a/2b parts; no tile kind, grid, formatter or figure was invented.

- `app/lib/dashboard/baseline.ts` — `loadBaseline(repository)`, the view model the route's loader
  hands to the row. One place reads the US-007 repository, derives the webshop total and delta, and
  windows the sparkline; nothing downstream holds a number it did not receive.
- `app/components/dashboard/baseline-row.tsx` — the four tiles, in order, as **direct children of
  the US-012 canvas grid** (a fragment, so there is still exactly one grid). `KpiTile` ×2,
  `HBarTile`, `PartnersTile`; layout is four span constants and nothing else.
- `app/components/tiles/partner-tile.tsx` — `PartnersTile` / `PartnerCard` / `PartnerMonogram` /
  `partnerMonogram()`. The one new component, and it is a `Card` composition.
- `app/routes/_index.tsx` — gains a `loader` (React Router 7 framework mode, SSR). The repository is
  async and server-only, so the fetch happens there and the components stay data-in / DOM-out.
- `app/lib/repositories/derive.ts` — three pure additions: `trailingPoints`, `trendEndingAt`, and
  `capacityShare` (which `attendanceShare` and the new `matchCapacityShare` now both delegate to, so
  the ring and the match tile cannot round the same ratio two ways).

**② NO FIGURE IS RE-TYPED — proven two ways, not asserted.** Every rendered string is asserted
EQUAL to `repository → derive → format.ts` output, and a **source scan** over `baseline-row.tsx`,
`partner-tile.tsx`, `baseline.ts` and `_index.tsx` fails on any displayed figure appearing as a
literal in three spellings (`148200`, `148_200`, `CHF 148’200`), on any `CHF <digit>` or `<n>%`
string, on `FCB`/`Sion`, on any product or partner name, and on `toLocaleString` /
`Intl.NumberFormat` / `toFixed`. The webshop headline and its `+11.9%` are `seriesTotals` off the
same array the sparkline draws, so the number and its own glyph cannot disagree — and
`trendEndingAt` makes that structural: the six-point window **ends on the month the headline
covers**, located inside the monthly series rather than taken off its tail, so it still holds in
December when the year-to-date series runs past the baseline month (a test pins that).

**③ Partner plates.** Six monograms (`BI`, `MA`, `AL`, `SU`, `FE`, `HO`) on plates painted in the
partner's OWN brand colour, each with its `PARTNER_ROLE_LABEL` role tag. The colour arrives as data
and is applied as an inline style: a test asserts **no hex and no `bg-red`/`bg-navy` token appears
in the file at all**, because a partner plate rendered in club red is wrong to a sponsor in the
room. Monograms are `aria-hidden` — the name is text beside them. Hover lift measured in real
Chrome: **exactly 2px** and `shadow-raised`, timed off `--duration-fast`.

**④ Top Products labels are whole, end to end.** Measured in Chrome on the real data:
`scrollWidth <= clientWidth` on all five labels (nothing ellipsised), each in a 150px column,
`text-overflow: clip`, `white-space: normal` — `Cap "Rotblau"` and `Home shirt 26/27` both complete.

**RESET INHERITS THE BASELINE, and the seam US-015 left is closed the way US-015 itself described.**
US-015 offered two routes and named both; US-013 took the second — a baseline tile that is static
chrome "needs no entry here at all". The four tiles are rendered by the ROUTE, above and outside the
session list, so **no question can remove them and Reset cannot fail to restore them**: load state
and post-reset state are the same DOM by construction, with no baseline special-case anywhere in the
reset path. Inventing a `HeroId` per tile would have made them dedupeable, re-askable,
phase-flippable and removable — none of which a baseline tile is — and forced a discriminated union
through every pure transition. `tests/unit/baseline-reset.test.tsx` drives the whole mechanic: four
tiles on load → two sections inserted **below** them, order and figures intact → Reset → zero
sections, exactly four tiles in order, and the canvas `innerHTML` byte-identical to its load state
(only React's `useId` gradient ids normalised). Repeated presses stay stable.

**FIRST REAL-CHROME PASS FOR US-017, US-021 AND US-027** — all three deferred visual verification
because nothing mounted them. At 1920×1080 on the production SSR build:
- four tiles in order at x=256/672/1088 and a full-width partner strip on row 2; canvas grid
  reports **12 columns**; `documentElement.scrollWidth === clientWidth` (1920) — **no horizontal
  scroll**, and the same at 1440, 1280, 834 and 390, with the partner strip folding 6 → 3 → 2 and
  no label clipped at any width;
- **the number counts up and the bars grow, they do not snap:** a per-frame probe recorded **54
  distinct KPI strings** (`CHF 0 → 8’098 → 15’849 → … → CHF 148’200`), **43 distinct bar widths**
  (`0px → 48px → 97px → … → 504px`), the sparkline stroke drawing from `dashoffset` 1 → 0, and the
  tile entrance fading through **25 opacity steps**;
- under `prefers-reduced-motion: reduce` the same probe recorded **2** distinct KPI strings and **2**
  bar widths — final state within one frame, opacity 1, `transform: none`, bars at 504px, sparkline
  at `dashoffset: 0`. **Nothing is stranded at zero.**

**Scope held.** No hero band (US-016), no period filter (Top Products' `action` slot is empty and
says why), no prompt bar, no thinking panel, no narrative caption on any tile. The client build
confirms the `.server` boundary: `grep` for `Bitpanda`, `148200` and `Rotblau` over `build/client/`
returns nothing, so the fixtures never reach the browser bundle.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 880/880 tests ✅ (103 new) · build ✅ · coverage
**100% stmts / 99.58% branches / 100% funcs / 100% lines** (`app/**`). **Security triage:** no
security-relevant changes detected. Triggers considered — new route handler (a React Router loader
is not an HTTP endpoint: no path, no params, no query, no body, no user input, and it reads a static
in-repo fixture), resource-by-id lookup (none), raw SQL (none), `dangerouslySetInnerHTML` /
`innerHTML` (none), user-supplied `href`/`src`/URL and SSRF (none — zero network calls),
file upload (none), dependency or lockfile change (**none** — `package.json` and `pnpm-lock.yaml`
untouched), env var or secret (none), logging (none), state-changing endpoint / CSRF (none), storage
API (none — the `app/**` scan still passes). The one value-driven style in the change is
`style={{ backgroundColor: partner.brandColor }}`; the value is a module constant, React sets it
through the CSSOM (which rejects anything that is not a colour), and a test asserts every partner's
`brandColor` matches `/^#[0-9A-Fa-f]{6}$/`.

**Next:** US-025 — line chart component (3 pts), which with US-026 unblocks US-016 and closes
Phase 2a.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** In Progress (4/5 stories · 11/16 points) — US-016 remains **deferred**, so this
phase does **not** close here
**Previous:** [Phase 1b](phase-1b.md) · **Next:** [Phase 2b — Components](phase-2b.md)
