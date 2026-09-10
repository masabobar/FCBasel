# Phase 4: Demo Hardening & Polish

**Duration:** 2026-09-14 to 2026-09-15 (~6.0 AI-hours)
**Status:** 🔄 In Progress (1/6 · 2/14 pts)
**Started:** 2026-09-10
**Target Completion:** 2026-09-15
**Actual Completion:** —

> **Acceptance criteria live in** [`../../input/backlog/phase-4-polish.md`](../../input/backlog/phase-4-polish.md).
> This file tracks execution.

---

## Phase Goal

Turn a working prototype into one that survives a live, high-stakes room — sized for a projector,
smooth, dead-end-proof, and independent of any network mid-demo.

**Success Criteria:**
- Renders correctly and legibly at 1920×1080 with no horizontal scroll
- Fully functional with the **network disconnected** after load
- Every path verified dead-end-free: each hero, each follow-up, off-script, empty input, reset
- Transitions smooth with no flicker or layout jump on the demo hardware
- Brand fidelity confirmed against the token set; gold used only as specified
- Runs cleanly in Chrome with **no console errors**

---

## Epics in This Phase

### Epic 8: E8 — Demo Hardening & Polish (14 story points)

**Priority:** P0 (US-043, US-045 are P1) · **Status:** 🔄 In Progress (1/6) · **Dependencies:** all prior phases

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-040 | Presentation sizing & responsiveness | 2 | P0 | ✅ Done |
| US-041 | Offline resilience verification | 2 | P0 | 📋 Todo |
| US-042 | Dead-end path sweep | 3 | P0 | 📋 Todo |
| US-043 | Transition & timing polish | 3 | **P1** | 📋 Todo |
| US-044 | Brand fidelity & legibility QA | 2 | P0 | 📋 Todo |
| US-045 | Chrome demo run-through & stability | 2 | **P1** | 📋 Todo |

**Technical Notes:**

- **Not in this phase:** new functionality, or anything that changes a hero's content. If a gap in a
  hero surfaces here, it is a Phase 3b change, tracked as such.
- **US-041 is verified by actually disconnecting the network** and running the full demo script — not
  by inspecting the code for fetch calls. Venue Wi-Fi failing mid-demo is the failure mode that most
  threatens the meeting, and the prototype's whole data architecture exists to make it survivable.
- **US-044 checks the dash convention:** no em or en dashes anywhere, including narrative strings and
  the score label (`FCB 2-1 Sion`). This is a deliberate house-style decision from the Reference Guide.
- Legibility from a room is a real constraint, not a nicety: a projector washes out subtle greys, so
  borders and type must hold up. Variance carries sign and arrow so colour is never the sole signal.
- **US-043 and US-045 are the first two items in the documented cut order.** Compress before dropping
  — a rehearsal that catches one broken path is worth more than its two points suggest.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Verification performed against the **running deployed app**, not only locally
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix · i18n.

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 1
- **Estimated Effort:** ~20 team-hours → ~6.0 AI-core hours
- **Risk Level:** Medium — the phase most likely to be compressed by upstream slippage

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 2 / 14 (14%)
- **Completed Stories:** 1 / 6
- **Tests Passing:** 2221 / 2221 unit (55 files) + 12 / 12 Chrome measurement cases · **Coverage:** 99.71% stmts / 97.96% branches / 100% funcs / 100% lines of `app/**` · **Commits:** 1

---

## Dependencies

**Depends On:** every prior phase. Hardening can only verify flows that exist — US-041 and US-042 in
particular need all three heroes and both fallback paths complete (US-039).

**Blocks:** the sponsor showing. This phase is the gate between "it works on my machine" and "it can
be put in front of the owner".

**External:** the deployed Railway URL must be live for US-045's cold-start check.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Phase compressed because upstream slipped | High | Medium | Extend daily runtime rather than cutting — the whole P1 set is only 0.82 days at 8h/day | Human | Open |
| A runtime fetch survives review and breaks the offline demo | High | Low | US-041 verifies by disconnecting, not by inspection | AI | Open |
| An untested path dead-ends live | High | Low | US-042 sweeps every path incl. the most off-script input imaginable | AI | Open |
| Transition stutters on the actual demo machine | Medium | Medium | US-043 tunes on target hardware, not the dev machine | AI | Open |
| Projector washes out variance colours | Medium | Medium | Sign and arrow carry the meaning; verified in US-044 | AI | Open |

---

## Known limitations

> **This section is deliberate, permanent and not a to-do list.** Each entry is a measured
> behaviour that a named decision put OUT OF SCOPE. It lives in the phase file — not in a progress
> log — because a progress log gets compacted and US-036's first attempt to record the entry below
> was lost that way. **Do not "fix" anything in this section without reversing its decision first.**

### KL-1 — Hero 2's year-on-year delta chips overlap at a 390px viewport

**What:** `GroupedBarTile` (`app/components/charts/grouped-bars.tsx`) draws eight fixture delta
chips in a band above the bars, one per fixture cell. At a 390px viewport the cell is ~36px against a
chip that is **59.5px** at every width, so neighbouring chips overlap.

**Decision (2026-09-10, recorded by the PM): OUT OF SCOPE.** 390px is a phone.
US-040's targets are **1920×1080 and a typical laptop screen**, and the prototype is presented from a
laptop to a projector. Narrowing the chip (dropping the sign, the arrow or the thousands separator)
would cost more than the case is worth, and it is the one place the sign is the meaning.

**Measured — full demo script loaded, Chrome against the built SSR bundle, widest chip 59.5px
throughout:**

| Viewport width | Chip cell | Min neighbour gap | Verdict |
|---:|---:|---:|---|
| 1920 | 119.9px | **61.7px** | clean |
| 1600 | 95.6px | **37.3px** | clean |
| 1440 | 83.4px | **25.2px** | clean |
| 1366 | 77.8px | **19.6px** | clean |
| 1280 | 71.3px | **13.0px** | clean — the narrowest gap anywhere |
| 1152 | 95.6px | **37.3px** | clean |
| 1024 | 81.0px | **22.8px** | clean |
| 834 | 86.7px | **28.5px** | clean |
| 768 | 79.2px | **20.9px** | clean |
| 390 | ~36px | **negative** | **overlaps** |

Every row from 1920 down to 768 was re-measured by US-040 from scratch and agrees with US-036's
figures to the decimal. **The 390 row is US-036's own measurement, carried forward** — 390px is
outside US-040's suite because it is outside the target range, so nothing re-takes it.

**The minimum width at which it is clean is 768px** — every width from 768 up has a positive gap, so
the whole presentation range and both tablet orientations are safe. **The tightest point is 1280, not
the narrowest viewport**, which reads as a contradiction and is not one: the tile is
`col-span-full xl:col-span-8`, so 1280 is the `xl` boundary where it is at its narrowest *as an
eight-column tile*; one pixel below, it takes the full width and the cells widen again. Anyone
re-tuning that breakpoint is moving this number.

**Re-measured every run.** `tests/e2e/presentation-sizing.spec.ts` prints the cell width, the widest
chip and the minimum gap for each presentation viewport, and fails if the gap is not positive. The
boundary is therefore a number in a test report rather than a claim in a document.

### KL-2 — Below 768px the layout is not a target at all

Phones are not a presentation surface for this prototype and no story has ever claimed them. The
canvas still steps down to 4 columns and the page never scrolls sideways, but tile-internal geometry
(KL-1 among it) is unverified below 768px and will stay that way.

---

## Progress Log

### US-040 — Presentation sizing & responsiveness (2 pts) · 2026-09-10 · ✅ Done

**A measurement story, so it was measured** — real Chrome against `pnpm build` + `pnpm start`, with
the **full run-of-show loaded** (three heroes and three follow-ups, 15 cards, 3 gold seams) before a
single reading was taken, because that is the tallest the canvas ever gets and the only state in
which every legend, axis and delta chip exists. `playwright.config.ts` and
`tests/e2e/presentation-sizing.spec.ts` are new; `@playwright/test` was already a devDependency, so
**the lockfile is untouched**.

**Clean at every one of eleven viewports** — the five the story names (1920×1080, 1600×900,
1440×900, 1366×768, 1280×800), four projector aspect ratios (1920×1200 16:10, 1280×720 16:9,
1152×864 and 1024×768 4:3) and both tablet orientations (834×1112, 768×1024):

- **No page horizontal scroll anywhere:** `documentElement.scrollWidth === clientWidth` at all
  eleven, and `body.scrollWidth` matches too. This is structural, not a media query — the sidebar is
  the only fixed-width box and the shell clips what survives (US-012). Re-checked in a Chrome
  launched with `--show-scrollbars` at 1920, 1440 and 1280 in case the headless default was hiding a
  gutter: identical readings, and `innerWidth - clientWidth` is **0** because the scrollbar is an
  overlay, so no gutter ever narrows the canvas.
- **No in-card horizontal scroll:** zero elements with a scrolling `overflow-x`. Notably the
  departmental table's `overflow-x-auto` escape hatch **never engages at 1024 or above**, so the
  six-column table fits on its own.
- **No clipped tiles and nothing outside its container** — every grid item inside the canvas grid,
  every card inside its section.
- **No clipped chart labels or legends:** no ellipsis engaged on any axis, bar, legend or table
  label; no SVG `<text>` painted outside the `<svg>` that owns it; no legend past its tile's clip
  edge.
- **The prompt bar never covers content:** scrolled fully down, clearance is **+10.5px at 1920 and
  1280, +10.9px at 1600/1440, +10.7px at 1366** — positive at all eleven. `pb-32` is doing its job.
- **Type floor holds:** the smallest rendered size on the canvas is **12px** (`--text-chart-axis`),
  with 13px, 14px and the 30px KPI above it. Nothing renders below the token set, which is what
  "legible from across a room" reduces to once the scale itself is fixed. **The type scale was not
  touched** — that is US-044's remit, and US-034 already raised the figure the room reads to 14px.
- **Mid-session resize, both ways:** 1920 → 1600 → 1280 → 1024 → 1366 → 1920 with all six answers
  open, measured at every step. Nothing clips on the way down and nothing stays clipped on the way
  back up.

**ONE REAL SIZING DEFECT FOUND AND FIXED.** Top Products' header needs 460px for its title block
plus the four-option `Segmented`, and `lg:col-span-6` gave it **432px at 1152 and 368px at 1024** —
so `Card`'s `overflow-hidden` cut "Year to date" off by **25.7px and 89.7px**. `WIDE_SPAN` is now
`col-span-full xl:col-span-6`: 496px at 1280 and the full width below, which is exactly the
measurement that made US-036 pick `xl` for Hero 2's tile pair. **Verified a no-op at every target
viewport** — all five re-measured byte-for-byte identical to the pre-fix reading. A unit test pins
the breakpoint with the numbers in its comment so it cannot be stepped back to `lg` silently.

**THE FAVICON DEFECT IS CLOSED.** `public/` held only the crest, so every load left the browser
probing `/favicon.ico`, taking a 404 and logging a console error — reported as "pre-existing" three
times and squarely against US-045's "no console errors". `public/favicon.ico` is now a one-entry ICO
wrapping a 32×32 PNG **derived from the crest that is already local**: `sips` downsample (no image
dependency added, as US-004), centred on a transparent canvas and **re-encoded from raw samples** so
only `IHDR`/`IDAT`/`IEND` ship. 1,742 bytes. `app/root.tsx` gained a `links` export declaring it, so
a browser uses the tag and the conventional path answers the probe anyway. Confirmed
`200 image/x-icon` from the booted production server, and the full script now runs with **zero
console errors and zero responses ≥ 400**.

**Security triage — the external-binary trigger fired (A04/A08), everything else n/a.** The
committed asset was verified by reading its bytes, not by trusting the tool: ICO directory header
(`00 00 01 00 01 00`), one 32×32 32bpp entry at offset 22, declared payload length equal to the
bytes actually present, PNG magic, IHDR 32×32/8-bit/RGBA/non-interlaced, and the chunk table walked
end to end — **consuming the buffer exactly, so nothing is appended past `IEND`**. **The US-004
metadata leak was checked for specifically and did not recur, but `sips` did attach metadata of its
own:** an `eXIf` block (colour space plus pixel dimensions) and an `sRGB` chunk, both dropped by the
re-encode. `tests/unit/favicon.test.ts` asserts the absence of `tEXt`/`zTXt`/`iTXt`/`eXIf`/`sRGB`/
`pHYs` and of the XMP wrapper and hostname strings, so the next regeneration cannot reintroduce
them. **No runtime network dependency added:** the href is root-relative and matches no absolute URL
(asserted), and the file is served from `public/`. No route, endpoint, SQL, env var, auth, upload or
logging change; **lockfile untouched, so no dependency advisory gate applies**.

**Two known limitations recorded above** (KL-1, KL-2) rather than fixed. KL-1's numbers were
re-measured from scratch and agree with US-036's to the decimal.

---

## Definition of "Demo Ready"

The phase — and the prototype — is complete when a presenter can open the shareable URL on the demo
machine, with Wi-Fi switched off, and run: baseline → three heroes → three follow-ups → off-script
question → reset, with no stutter, no error, and no dead end.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-10
**Phase Status:** 🔄 In Progress (1/6 · 2/14 pts) — next: US-041 offline resilience verification
**Previous:** [Phase 3b](phase-3b.md) · **Backlog:** [Master Index](../../input/backlog/README.md)
