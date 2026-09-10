# Phase 4: Demo Hardening & Polish

**Duration:** 2026-09-14 to 2026-09-15 (~6.0 AI-hours)
**Status:** 🔄 In Progress (5/6 · 12/14 pts)
**Started:** 2026-09-10
**Target Completion:** 2026-09-15
**Actual Completion:** —

> **Acceptance criteria live in** [`../../input/backlog/phase-4-polish.md`](../../input/backlog/phase-4-polish.md). This file tracks execution.

---

## Phase Goal

Turn a working prototype into one that survives a live, high-stakes room — sized for a projector,
smooth, dead-end-proof, and independent of any network mid-demo.

**Success Criteria:** renders legibly at 1920×1080 with no horizontal scroll · fully functional with
the **network disconnected** after load · every path dead-end-free (each hero, each follow-up,
off-script, empty input, reset) · transitions smooth, no flicker or layout jump · brand fidelity
confirmed against the token set, gold only as specified · **no console errors** in Chrome.

---

## Epics in This Phase

### Epic 8: E8 — Demo Hardening & Polish (14 story points)

**Priority:** P0 (US-043, US-045 are P1) · **Status:** 🔄 In Progress (5/6) · **Dependencies:** all prior phases

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-040 | Presentation sizing & responsiveness | 2 | P0 | ✅ Done |
| US-041 | Offline resilience verification | 2 | P0 | ✅ Done |
| US-042 | Dead-end path sweep | 3 | P0 | ✅ Done |
| US-043 | Transition & timing polish | 3 | **P1** | ✅ Done |
| US-044 | Brand fidelity & legibility QA | 2 | P0 | ✅ Done |
| US-045 | Chrome demo run-through & stability | 2 | **P1** | 📋 Todo |

**Technical Notes:**

- **Not in this phase:** new functionality, or anything changing a hero's content — a gap in a hero
  surfacing here is a Phase 3b change.
- **US-041 to US-044 are verified by DOING, not by inspecting** — the network genuinely severed, the
  whole surface genuinely pressed, every painted colour read off the served page, every frame of the
  reveal sampled. All four found what forty stories of code review had not.
- **US-045 leads the documented cut order.** Compress before dropping — a rehearsal that catches one
  broken path is worth more than its two points suggest. **US-043 found two defects a review had not.**

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Verification against the **running deployed app**, not only locally · tests passing, coverage
      ≥ 80% · security triage per `.claude/rules/security-review.md` · linter clean · commit
      created · progress tracking updated · *not applicable:* API status-code matrix, i18n.

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 1 · **Estimated Effort:** ~20 team-hours
  → ~6.0 AI-core hours · **Risk Level:** Medium — most likely phase to be compressed by slippage

### Progress Tracking
- **Completed Story Points:** 12 / 14 (86%)
- **Completed Stories:** 5 / 6
- **Tests Passing:** 2242 / 2242 unit (55 files) + 61 / 61 Chrome cases (12 sizing, 4 offline, 16 path sweep, 13 brand, 16 transition/timing) · **Coverage:** 99.71% stmts / 97.87% branches / 100% funcs / 100% lines of `app/**` · **Commits:** 5

---

## Dependencies

**Depends On:** every prior phase. **Blocks:** the sponsor showing. **External:** the deployed
Railway URL must be live for US-045's cold-start check.

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Phase compressed because upstream slipped | High | Medium | Extend daily runtime rather than cutting — the whole P1 set is only 0.82 days at 8h/day | Human | Open |
| A runtime fetch survives review and breaks the offline demo | High | Low | US-041 verifies by disconnecting, not by inspection | AI | **Closed — and it had: TWO real runtime fetches found and fixed** |
| An untested path dead-ends live | High | Low | US-042 sweeps every path incl. the most off-script input imaginable | AI | **Closed — whole surface swept, no dead end; sweep mutation-tested** |
| Transition stutters on the actual demo machine | Medium | Medium | US-043 sampled every frame of the reveal; **the demo machine is NOT this one and no claim is made about it** — measured on an Apple M1 MacBook Pro, plus CPU-throttled 4x and 6x | AI | **Mitigated, not closed — longest frame 33.3ms at 1x, 116.7ms at 6x, p95 16.8ms throughout; only the room's own machine can close this** |
| Projector washes out variance colours | Medium | Medium | Sign and arrow carry the meaning; verified in US-044 | AI | **Closed — all 23 chips measured: sign, arrow and spoken word on every one, and ONE missing sign found and fixed. Border ratios recorded as KL-4** |

---

## Known limitations

> **This section is deliberate, permanent and not a to-do list.** Each entry is a measured behaviour
> that a named decision put OUT OF SCOPE (or, once resolved, the record of how). It lives in the
> phase file — not a progress log — because a log gets compacted and US-036's first attempt to record
> KL-1 was lost that way. **Do not "fix" anything here without reversing its decision first.**

### KL-1 — Hero 2's year-on-year delta chips overlap at a 390px viewport

**What:** `GroupedBarTile` (`app/components/charts/grouped-bars.tsx`) draws eight fixture delta chips
in a band above the bars, one per fixture cell. At a 390px viewport the cell is ~36px against a chip
that is **59.5px** at every width, so neighbouring chips overlap. **Decision (2026-09-10, recorded by
the PM): OUT OF SCOPE.** 390px is a phone; US-040's targets are **1920×1080 and a typical laptop
screen**. Narrowing the chip (dropping the sign, the arrow or the thousands separator) would cost
more than the case is worth, and this is the one place the sign is the meaning.

**Measured — full script loaded, Chrome against the built SSR bundle, widest chip 59.5px throughout:**

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

Every row from 1920 down to 768 was re-measured by US-040 and agrees with US-036's figures to the
decimal; **the 390 row is US-036's own**, outside US-040's suite. **Clean from 768px up.** **The
tightest point is 1280, not the narrowest viewport:** the tile is `col-span-full xl:col-span-8`, so
1280 is the `xl` boundary where it is narrowest *as an eight-column tile* — anyone re-tuning that
breakpoint moves this number. `tests/e2e/presentation-sizing.spec.ts` re-measures every run.

### KL-2 — Below 768px the layout is not a target at all

Phones are not a presentation surface for this prototype and no story has claimed them. The canvas
still steps down to 4 columns and the page never scrolls sideways, but tile-internal geometry (KL-1
among it) is unverified below 768px and will stay that way.
### KL-3 — A reload restored the scroll offset onto a freshly cleared dashboard · **RESOLVED by US-043**

**What it was:** state is memory-only by specification, so a reload starts a new session at the
baseline — but the SCROLL OFFSET survived it. `<ScrollRestoration />` wrote
`react-router-scroll-positions` to `sessionStorage`, and the restored offset, clamped to the much
shorter baseline page, landed the presenter at its foot with the app bar (crest, Reset) scrolled out
of view. **Measured after a full canvas scrolled to the bottom, then reloaded:** 1920×1080 →
`scrollY 185`, greeting at `top: -89`; 1440×900 → `scrollY 340`, greeting at `top: -244`. US-042's
measurement is kept because it is the useful record — it is why the fix took two parts. **Decision
(2026-09-10, US-042): out of scope there, deferred to US-043.** Not a dead end by US-042's
three-part definition, and **the fix was measured rather than assumed to be non-local:** removing
`<ScrollRestoration />` alone stopped the `sessionStorage` write, but Chrome's own restoration then
produced the identical offset.

**RESOLVED (2026-09-10, US-043) — both halves, because neither works alone.** The component is gone
from `app/root.tsx` and `disableScrollRestoration()` (`app/lib/motion.ts`) sets
`history.scrollRestoration = "manual"` on mount. Doing both is not belt-and-braces: the component's
own `pagehide` handler sets the mode back to `auto` as the document unloads, so `manual` alongside it
would have been undone every time. **Re-measured end to end — really scrolled, really reloaded:**
1920×1080 scrolled to `3927` and 1440×900 to `3709`, both reloading at **`scrollY 0`** with the crest
at `top: 0`, Reset on screen, mode `"manual"` and **zero `sessionStorage` keys** — memory-only is now
literally true of the browser's storage too. **Standing tests:**
`tests/e2e/transition-timing.spec.ts` (both viewports, plus "Reset still returns the view to the
top"), `tests/unit/motion.test.tsx`, `tests/unit/root.test.tsx` (no `<ScrollRestoration />` in the
rendered tree, mode `manual` after mount) and `tests/e2e/dead-end-path-sweep.spec.ts`, whose storage
assertion no longer has a key to excuse.

### KL-4 — Borders and hairlines measure 1.10-1.24:1 and will wash out on a projector

**What (US-044, Chrome on the served page, full script at 1920×1080):** `--color-border` **1.24:1** on
white and **1.12:1** on the `--color-surface` canvas · `--color-line` hairlines and chart grid
**1.13:1** · donut track **1.10:1** · the navy band's borders **1.57:1**. Text holds up — primary
**17.5:1**, navy headings **15.1:1**, muted **4.78:1** / **4.33:1** — but four ink pairs are marginal
by design: the gold-deep eyebrows **2.49** / **2.57:1**, the positive chip **3.02:1** on its own tint,
the Feldschlösschen / Bitpanda plates **2.84** / **3.37:1**.
**Decision (2026-09-10, US-044): OUT OF SCOPE, not a defect.** Nothing here depends on a border to be
read: every tile also carries `--shadow-tile` and a white fill against the grey canvas, and every
chart's geometry is a filled shape, not an outline. Each marginal pair is an ACCENT, a partner's own
colour (content, US-007), or a variance chip carrying its meaning three further ways. **Moving a
token VALUE is US-003's change, not a QA story's**, and `tests/e2e/brand-fidelity.spec.ts`
re-measures every run, failing anything FAINTER than the above.

## Progress Log

### US-040 — Presentation sizing & responsiveness (2 pts) · 2026-09-10 · ✅ Done

**Measured, not reviewed** — real Chrome against `pnpm build` + `pnpm start`, **full run-of-show
loaded** (three heroes, three follow-ups, 15 cards) before a single reading. New
`playwright.config.ts` + `tests/e2e/presentation-sizing.spec.ts`; **lockfile untouched.** **Clean at
ELEVEN viewports** — the five named (1920×1080 down to 1280×800), four projector aspect ratios and
both tablet orientations: no page or in-card horizontal scroll (re-checked with `--show-scrollbars`),
no clipped tile, label or legend, no SVG `<text>` outside its plot, **type floor 12px**, and **resize
both ways** (1920 → 1024 → 1920) with six answers open. **ONE REAL SIZING DEFECT FOUND AND FIXED:**
Top Products needs 460px for its title block plus the four-option `Segmented`; `lg:col-span-6` gave
432px at 1152 and 368px at 1024, so `overflow-hidden` cut "Year to date" by 25.7px and 89.7px.
`WIDE_SPAN` is now `col-span-full xl:col-span-6` — a no-op at all five targets, breakpoint pinned by
a test. **THE FAVICON DEFECT IS CLOSED** — every load probed `/favicon.ico`, took a 404 and logged a
console error. `public/favicon.ico` wraps a 32×32 PNG **derived from the already-local crest** and
**re-encoded from raw samples** (1,742 bytes, only `IHDR`/`IDAT`/`IEND`). **Triage —
external-binary trigger fired (A04/A08):** bytes read end to end, chunks consuming the buffer exactly
so nothing follows `IEND`, `sips`'s `eXIf`/`sRGB` dropped and asserted absent. KL-1 / KL-2 recorded.

### US-041 — Offline resilience verification (2 pts) · 2026-09-10 · ✅ Done

**Verified by disconnecting, and it paid for itself twice.** `setOffline(true)` **plus**
`route("**", abort("internetdisconnected"))` against the **built SSR bundle**, never the dev server,
whose HMR websocket is a network dependency. New `offline-resilience.spec.ts` (4 cases) +
`support/network.ts`; **lockfile untouched.** **THE FULL SCRIPT, OFFLINE, ASSERTED AT EVERY BEAT** —
baseline → three heroes → three follow-ups → the sidebar link pressed with six answers up →
off-script → empty submit → reset → **reset mid-beat**, the pending beat proved *cancelled*. Re-run
under reduced motion. **FINDING 1 — `GET /__manifest?…`:** lazy route discovery marks every `<Link>`
`data-discover="true"` and fetches on hydration, invisible to any grep of `app/**`. Fixed with
`routeDiscovery: { mode: "initial" }`. **FINDING 2 — `GET /_root.data`, A DEMO-KILLER:** the
sidebar's Dashboard row is a `<Link to="/">` on the route already shown, and React Router
revalidates; offline, **the whole dashboard became an error boundary from one click**, unrecoverable
without a reload an offline machine cannot serve. Fixed at the root cause with
`shouldRevalidate: () => false` on both matched routes — wrong online too, since the figures are
bundled. **REQUEST LOG — 10 requests, all local, `0` after first paint**, zero
`fetch`/`xhr`/`websocket`, zero webfonts, zero foreign origins, **zero console errors**. **Triage —
none fired. A10: no surface at all**; **A05:** both fixes *reduce* the served surface.

### US-042 — Dead-end path sweep (3 pts) · 2026-09-10 · ✅ Done

**Swept the WHOLE interactive surface, not the conversation — US-041's lesson applied.** New
`tests/e2e/dead-end-path-sweep.spec.ts` (**16 Chrome cases**) + `support/paths.ts`; control labels and
`BEAT_MS` moved into `support/demo-script.ts` so three specs share one copy. **No `app/**` source
changed. Lockfile untouched.** "Dead-end-free" is ONE helper, `expectAlive`, on every path: shell
mounted and ≥ 4 tiles · ≥ 3 prepared chips and > 2,000 chars of text · no error boundary, no
sideways scroll, never two transient panels · an empty console per case via US-041's recorder.
**Paths, all green:** three heroes · three follow-ups · **23 paraphrases**, each landing its intended
hero only · **16 off-script strings** incl. XSS, `javascript:`, SQL, an RTL override and **50,000
characters**, all on the fallback and never echoed · 6 empty no-ops · 8 two-subject questions twice
each, identical both runs · 3 cold typed follow-ups · **141 canvas slots clicked** · both tab rings
(11 stops and 19) activated with Enter *and* Space · the demo keyboard-only · Reset ×5 empty, ×6
full, ×6 mid-beat · bursts and a hero re-asked after its follow-up, **never a duplicate section** ·
reload, back, forward. **NO DEAD END FOUND — and the sweep was mutation-tested to prove that means
something:** raising `INTENT_THRESHOLD[HERO]` 2 → 5 failed the paraphrase case and a dead sidebar
route failed on *"the app shell is gone"*; both reverted. **One wart recorded as KL-3** — **US-043
has since closed it.** **Triage — the A03 user-input trigger fired and IS the measurement:** every
hostile string typed into the real field, then every sink read; nothing in the document carries
`javascript:` or a question fragment, `localStorage`/cookies empty.

### US-044 — Brand fidelity & legibility QA (2 pts) · 2026-09-10 · ✅ Done

**Measured the RENDERED PAGE, not the source — US-041's lesson applied to the palette.** New
`tests/e2e/brand-fidelity.spec.ts` (**13 Chrome cases**) + `support/brand.ts`: one `getComputedStyle`
walk per moment, every painted value resolved to sRGB (Tailwind's `/opacity` composites in **oklab**,
converted back through the CSS Color 4 matrices) and classified in Node against `app/lib/tokens.ts`
**itself** — not one hex copied into a test. Read at FOUR moments, since none paints everything.
**COLOUR INVENTORY — 19 distinct colours over 886 painted elements, every one a token,** at 15
alphas, plus `#101840` (a shadow token) and `rgba(0,0,0,0)`; **the only non-palette hexes are two
partner brand colours** (Bitpanda `#0a9d8e`, Sunrise `#e4002b`), and all six partner colours come
from the DATASET, so US-007's exception cannot drift. **GOLD AUDIT — 41 paints, all inside a CLOSED
`data-slot` allowlist, each with a written sanction**; `#b8960b` on the Feldschlösschen plate is that
brand's own colour and is excluded by SLOT, and **no gold on `card`, `card-accent` or
`insight-section`, asserted: the ring the Reference Guide removed stays removed.** **ONE REAL DEFECT
FOUND AND FIXED — the only variance chip on the canvas with no sign:** Hero 3's driver total rendered
`CHF 410k total` because `DriverTile` handed the badge the ROWS' unsigned formatter. Fixed with a
`totalFormat` prop defaulting to `format` → **`+CHF 410k total`**, rows still unsigned; all 23 chips
now carry four carriers, asserted positively. **The rest:** 31 uppercase headers · every figure
`tabular-nums` · 19 tab stops with a visible outline · **dash sweep 0 offenders** over every text
node and attribute at all four moments. Contrast recorded as **KL-4**. **Triage — none fired.**

### US-043 — Transition & timing polish (3 pts) · 2026-09-10 · ✅ Done

**SAMPLED EVERY FRAME OF THE REVEAL — and sampling it found TWO real defects, plus KL-3's fix.** New
`tests/e2e/transition-timing.spec.ts` (**15 Chrome cases**) + `support/timing.ts`: a
`requestAnimationFrame` loop inside the page recording panel, sections, per-card opacity, figure
strings, chart geometry, `scrollY` and the view transition's own `currentTime`, plus a separate
timestamps-only clock so the frame budget is the product's and not the instrument's. **Each fix was
re-verified by MUTATION: reverted one at a time, its standing test failed.** **Lockfile untouched.**
⚠️ **HARDWARE: an Apple M1 MacBook Pro (MacBookPro17,1, 8 cores, 16GB, macOS 15.6.1) — NOT the demo
machine, and nothing here claims it is.** Longest frame **16.8-33.3ms at 1x**, **33.4-49.9ms at 4x**,
**33.3-116.7ms at 6x** CDP throttling (that 116.7ms is ONE frame of the hero reveal; the follow-up's
worst at 6x is 33.3ms); p95 **16.7-16.8ms** at all three, 198-209 frames per reveal.
**DEFECT 1 — THE EMPTY STATE FLASHING BACK MID-REVEAL.** `startViewTransition` runs its update
ASYNCHRONOUSLY, so the beat's `setBeat(null)` was flushed a frame BEFORE the answer; `useCanvasPanel`
rightly read that gap as "nothing has been asked yet" and painted "Your dashboard is ready" into the
spot the panel had just left, then ghosted across the 400ms reflow. **Reverting the fix reproduces
it: ONE seam frame, neither panel nor answer** (~17ms here, longer on a slower box). Fixed in
`use-thinking.ts`: the panel comes down in the render where `focus.tick` shows the answer HAS landed
— **seam now 0 frames**. **DEFECT 2 — THE BEAT HIDDEN BEHIND THE PROMPT BAR.** The chip row wraps
past four chips, taking the fixed bar from **117.1px to 159.3px** against
`PROMPT_BAR_CLEARANCE_CLASS`'s **128px** reserve, so from the third question on the panel's source
chips sat **14.2px UNDER the bar** — reproduced by reverting to `pb-32`. Reserve now 176px:
source-chip clearance **+33.3 to +76.0px** at all six beats. **TIMING CHANGE —
the two scrolls now wait out the reflow tween** (`afterReflow`, the transition's own `finished`
promise, never a timer): the reveal's scroll used to start **1267ms, 384ms INSIDE the 400ms tween**,
sliding the live page out from under a snapshot pinned to the viewport. It also puts the reveal in
the criterion's order: **tween ends 1646ms, scroll starts 1680ms.** **NO DURATION TOKEN CHANGED** —
beat **1118ms** measured (band 600-1200), insertion 400ms, reduced beat 218ms. **THE NUMBERS:** panel
78→1196ms → section 1230ms → stagger **0/90/180ms** → **446 distinct figure strings**, **488 distinct
geometry values** → scroll settled, new section top **0.3px**. An appended answer moves Hero 1 by
**0.00px over 198 frames, ONE distinct value**; the follow-up that DOES move things pushes Hero 3
**+306.4px** through **4 `::view-transition-group` tweens, all 400ms**, sampled at 26 distinct
`currentTime` readings to a max of 400ms. Filter from current: the first frame after "Current month"
reads the OLD figures (`22’400 | 10’300 | 5’800 | 3’180`), settling on `2’400 | 1’150 | 620 | 290`
over **430 distinct strings, zero zeros**. Reduced motion: 35 figures and 56 geometry readings at
final state, **zero zeros**, no card below opacity 1, **0 animations running**. **KL-3 CLOSED** — see
above. **Triage — none fired:** a state-ordering fix, a padding class, a `scrollRestoration` write.
## Definition of "Demo Ready"

The phase — and the prototype — is complete when a presenter can open the shareable URL on the demo
machine, with Wi-Fi off, and run baseline → three heroes → three follow-ups → off-script → reset,
with no stutter, no error and no dead end.

---

**Created:** 2026-09-09 · **Last Updated:** 2026-09-10
**Phase Status:** 🔄 In Progress (5/6 · 12/14 pts) — next: US-045 Chrome demo run-through & stability
**Previous:** [Phase 3b](phase-3b.md) · **Backlog:** [Master Index](../../input/backlog/README.md)
