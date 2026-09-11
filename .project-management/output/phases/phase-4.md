# Phase 4: Demo Hardening & Polish

**Duration:** 2026-09-14 to 2026-09-15 (~6.0 AI-hours)
**Status:** ✅ Completed (6/6 · 14/14 pts)
**Started:** 2026-09-10
**Target Completion:** 2026-09-15
**Actual Completion:** 2026-09-10 — **this closes Phase 4 and the whole 45-story plan.**

> **Acceptance criteria live in** [`../../input/backlog/phase-4-polish.md`](../../input/backlog/phase-4-polish.md). This file tracks execution.

---

## Phase Goal

Turn a working prototype into one that survives a live, high-stakes room — sized for a projector,
smooth, dead-end-proof, and independent of any network mid-demo.

**Success Criteria — all met:** legible at 1920×1080 with no horizontal scroll · fully functional
with the **network disconnected** after load · every path dead-end-free · transitions smooth, no
flicker or layout jump · brand fidelity confirmed against the token set · **no console errors** in
Chrome.

---

## Epics in This Phase

### Epic 8: E8 — Demo Hardening & Polish (14 story points)

**Priority:** P0 (US-043, US-045 are P1) · **Status:** ✅ Completed (6/6) · **Dependencies:** all prior phases

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-040 | Presentation sizing & responsiveness | 2 | P0 | ✅ Done |
| US-041 | Offline resilience verification | 2 | P0 | ✅ Done |
| US-042 | Dead-end path sweep | 3 | P0 | ✅ Done |
| US-043 | Transition & timing polish | 3 | **P1** | ✅ Done |
| US-044 | Brand fidelity & legibility QA | 2 | P0 | ✅ Done |
| US-045 | Chrome demo run-through & stability | 2 | **P1** | ✅ Done *(criterion 5 ⏸️ deferred)* |

**Technical Notes:**

- **Not in this phase:** new functionality, or anything changing a hero's content.
- **US-040 to US-045 are verified by DOING, not by inspecting** — the network genuinely severed, the
  whole surface pressed, every painted colour read off the served page, every frame of the reveal
  sampled, the whole show performed end to end in real Chrome. **All six found what forty stories of
  code review had not**, US-045 included: the rehearsal was worth far more than its two points.

---

## Definition of Done *(applies to every story in this phase)*

- [x] Tests passing, coverage ≥ 80% · security triage per `.claude/rules/security-review.md` ·
      linter clean · commit created · progress tracking updated · *not applicable:* API status-code
      matrix, i18n. **Verification against the running deployed app is the ONE item this phase could
      not tick** — there is no deployed app to verify against. See "Open at plan close" below.

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 1 · **Estimated Effort:** ~20 team-hours
  → ~6.0 AI-core hours · **Risk Level:** Medium — most likely phase to be compressed by slippage

### Progress Tracking
- **Completed Story Points:** 14 / 14 (100%)
- **Completed Stories:** 6 / 6
- **Tests Passing:** 2244 / 2244 unit (55 files) + 64 / 64 Chrome cases (12 sizing, 4 offline, 16 path sweep, 13 brand, 15 transition/timing, 4 run-through) · **Coverage:** 99.71% stmts / 97.87% branches / 100% funcs / 100% lines of `app/**` · **Commits:** 6

---

## Open at plan close — ONE gap, counted twice

**There is no public URL for this prototype.** The repo is deploy-ready — `railway.json`, zero
environment variables, no database, `pnpm build` + `pnpm start` is the whole of it — but nobody has
run `railway up` and `railway domain`, and it is a human step (an account, a login, a paid plan).
`fcbasel.railway.internal`, supplied as the URL, returns **NXDOMAIN**: `.railway.internal` names are
Railway's PRIVATE network and are not reachable or shareable from outside it.

Two items name that one gap, and **both stay open after this plan closes:**

1. **US-001's deploy acceptance criterion** — "deployed and reachable at a shareable URL".
2. **US-045 criterion 5** — "the deployed shareable URL loads cleanly from a cold start". ⏸️
   **Deferred, not met and not claimed.** US-045 measured the identical cold start against the local
   production build so there is a number to compare the deployed URL against: **first contentful
   paint 124-140ms, answers a press at 178-385ms, 11 requests / 183.0 KiB, console clean.**

**What the PM must do:** `railway login && railway init && railway up`, then `railway domain`;
open the URL it prints in Chrome, confirm it loads, ask one hero, and record it in US-001 and here.
Nothing in the code needs to change for that to work.

## Dependencies

**Depends On:** every prior phase. **Blocks:** the sponsor showing. **External:** the deployed
Railway URL, still not live — see "Open at plan close".

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
baseline — but the SCROLL OFFSET survived it, landing the presenter at the foot of the much shorter
baseline page with the app bar (crest, Reset) scrolled out of view. **Measured (US-042), full canvas
scrolled to the bottom then reloaded:** 1920x1080 -> `scrollY 185`, greeting at `top: -89`; 1440x900
-> `scrollY 340`, greeting at `top: -244`. **Decision (2026-09-10, US-042): out of scope there,
deferred to US-043** — not a dead end by its three-part definition.

**RESOLVED (2026-09-10, US-043) — both halves, because neither works alone.** `<ScrollRestoration />`
is gone from `app/root.tsx` (it wrote `react-router-scroll-positions` to `sessionStorage`) AND
`disableScrollRestoration()` (`app/lib/motion.ts`) sets `history.scrollRestoration = "manual"` on
mount, because Chrome's own restoration reproduced the identical offset — and the component's
`pagehide` handler puts the mode back to `auto`, so the two cannot be applied in either order alone.
**Re-measured end to end:** 1920x1080 scrolled to `3927` and 1440x900 to `3709`, both reloading at
**`scrollY 0`** with the crest at `top: 0`, Reset on screen, mode `"manual"` and **zero
`sessionStorage` keys**. **Standing tests:** `transition-timing.spec.ts` (both viewports, plus "Reset
still returns the view to the top"), `motion.test.tsx`, `root.test.tsx`, `dead-end-path-sweep.spec.ts`.

### KL-4 — Borders and hairlines measure 1.10-1.24:1 and will wash out on a projector

> **PARTIALLY RETIRED (2026-09-11, US-048).** The app-bar edge is no longer one of these. Review
> asked for more of the club's red, and `top-bar`'s bottom border was the right home for it: it is
> chrome, it spans the full width, and it was one of the faintest readings here. Re-measured on the
> served page: **`#d3010c` on `#f1f4f9`, 2px, 5.04:1** — up from **1.12:1** on the same ground.
> **Everything below still stands** for tile borders, chart grid, the donut track and the hairlines,
> because `--color-border` itself was not touched — moving a token VALUE is still US-003's change,
> not a QA story's. The reasoning below is why those remain acceptable.

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

> **All six stories in this phase measured the served page rather than reviewing the source, and all
> six found something forty stories of code review had not.** US-040 to US-044 are compacted below to
> finding + number, because this file is capped and their full narratives are in
> `output/progress/completed.md`, in the DASHBOARD's auto-update lines and — most durably — in the
> header comments of the specs and harnesses themselves. Decisions that OUTLIVE a log live above,
> under "Known limitations".

| Story | Instrument | What it FOUND, and the fix | The numbers |
|---|---|---|---|
| **US-040** sizing (2) | `presentation-sizing.spec.ts` **12 cases**, full script loaded before any reading | **Top Products' filter clipped** — 460px needed, `lg:col-span-6` gave 432px at 1152 and 368px at 1024 → `WIDE_SPAN` is `col-span-full xl:col-span-6`. **The favicon 404**, a console error on every load → `public/favicon.ico`, a 32×32 PNG derived from the local crest, re-encoded from raw samples | Clean at **11 viewports** + a 1920→1024→1920 resize both ways; "Year to date" cut by **25.7 / 89.7px** before the fix; icon 1,742 bytes, only `IHDR`/`IDAT`/`IEND`; type floor **12px**. Triage: external-binary trigger fired (A04/A08), `eXIf`/`sRGB` asserted absent. KL-1 / KL-2 |
| **US-041** offline (2) | `offline-resilience.spec.ts` **4 cases** + `support/network.ts`; `setOffline(true)` **plus** an abort route over `**` | **`GET /__manifest`** — lazy route discovery fetches on hydration, invisible to any grep → `routeDiscovery: "initial"`. **`GET /_root.data`, a demo-killer** — the sidebar's `<Link to="/">` revalidated the route already shown and offline **the whole dashboard became an error boundary from one click** → `shouldRevalidate: () => false` | Whole script asserted at every beat, reset mid-beat proved to cancel, re-run under reduced motion. **10 requests, all local, `0` after first paint**; zero fetch/xhr/websocket, webfonts, foreign origins, console errors. Triage: none fired — both fixes REDUCE the surface |
| **US-042** dead ends (3) | `dead-end-path-sweep.spec.ts` **16 cases** + `support/paths.ts`; one `expectAlive` helper on every path. **No `app/**` source changed** | **No dead end anywhere** — and the sweep was **mutation-tested** so that means something: `INTENT_THRESHOLD[HERO]` 2 → 5 failed the paraphrase case, a dead sidebar route failed on "the app shell is gone". One wart recorded as **KL-3**, closed later by US-043 | **23 paraphrases** each landing its hero only · **16 hostile strings** (XSS, `javascript:`, SQL, RTL, **50,000 chars**) all on the fallback, never echoed · 6 no-ops · 8 two-subject questions twice · **141 canvas slots** · both tab rings, Enter *and* Space · Reset ×17 · reload/back/forward. Triage: A03 fired and IS the measurement — every sink read, storage and cookies empty |
| **US-044** brand (2) | `brand-fidelity.spec.ts` **13 cases** + `support/brand.ts`; every painted value resolved to sRGB (`/opacity` composites in **oklab**, converted back through CSS Color 4) and classified against `app/lib/tokens.ts` **itself**, at four moments | **The one variance chip with no sign** — Hero 3's driver total read `CHF 410k total` because `DriverTile` handed the badge the ROWS' unsigned formatter → a `totalFormat` prop gives **`+CHF 410k total`**, rows still unsigned | **19 colours over 886 painted elements, every one a token**; the only non-palette hexes two partner brands, both from the DATASET · **41 gold paints in a CLOSED allowlist**, none on any tile surface · 23 chips × 4 carriers · 31 uppercase headers · 19 outlined stops · **0 dash offenders**. Contrast → **KL-4**. Triage: none fired |
| **US-043** timing (3) | `transition-timing.spec.ts` **15 cases** + `support/timing.ts`; an `rAF` loop inside the page plus a separate timestamps-only clock, so the frame budget is the product's not the instrument's. **Every fix mutation-verified** | **The empty state flashed back mid-reveal** — `startViewTransition` updates ASYNCHRONOUSLY, so `setBeat(null)` painted alone a frame before the answer and ghosted "Your dashboard is ready" across the 400ms reflow → the panel comes down in the render the answer lands in. **The beat sat behind the prompt bar** — the chip row wraps past four chips (bar **117.1 → 159.3px** vs a 128px reserve), so from question three the source chips were **14.2px UNDER** it → reserve 176px. **Both scrolls now wait out the reflow tween**, which the reveal's used to start **384ms inside** | ⚠️ **Apple M1 MacBook Pro — NOT the demo machine.** Longest frame **16.8-33.3ms at 1x, 33.4-49.9 at 4x, 33.3-116.7 at 6x**; p95 **16.7-16.8ms**. Seam **0 frames**; clearance **+33.1 to +108.2px**. No duration token changed — beat **1118ms**, insertion 400ms, reduced 218ms. Sequence panel 78→1196 → section 1230 → stagger **0/90/180** → **446 figure strings / 488 geometry values** → tween 1646 → scroll 1680 → top **0.3px**; append moves Hero 1 **0.00px over 198 frames**. **KL-3 CLOSED**. Triage: none fired |

### US-045 — Chrome demo run-through & stability (2 pts) · 2026-09-10 · ✅ Done *(criterion 5 ⏸️)*

**THE DRESS REHEARSAL — and rehearsing it found a defect in Reset that sixty cases had not.** New
`demo-run-through.spec.ts` (**4 cases**) + `support/run-of-show.ts`. **REAL CHROME, NOT CHROMIUM, AND
THAT IS NEW:** `playwright.config.ts` uses `devices["Desktop Chrome"]`, a device DESCRIPTOR that
selects no channel — US-040 to US-044 all ran on Playwright's **bundled Chromium**, the right
instrument for geometry and colour and the wrong one for "runs cleanly in **Chrome**". This spec sets
`channel: "chrome"` and rehearses on **Google Chrome 152.0.7977.83 at 1920×1080**, **headed as well
as headless**. Every timestamp is taken INSIDE the page: a `Date.now()` either side of a Playwright
call reported the panel taking **785ms** to appear, which was the driver's locator and actionability
cost billed to the product. **Lockfile untouched.**

**THE SHOW, ONE CONTINUOUS SESSION, ONE CONSOLE** — baseline → three heroes each with its follow-up →
an off-script question from the floor → reset: **press to panel 10-35ms · press to answer
1179-1198ms** (the designed ~1150ms beat) **· answer to viewport at rest +600 to +899ms ·
1.78-2.08s per question · the whole show 11.9s**, and **zero console errors across all of it**. The
off-script question lands the fallback in **6ms** with all six answers untouched behind it; the
closing reset clears in **28ms** to `scrollY 0`.

**ONE REAL DEFECT, FIXED IN TWO HALVES, BOTH IN `app/lib/motion.ts` — RESET FIGHTING THE REVEAL'S
SCROLL.** A smooth scroll belongs to the scrolling box, not to the code that started it, and Reset's
glide to the top waits out the 400ms reflow tween (US-043) — so those 400ms were a window in which a
stale scroll owned the window. **Measured, then mutation-verified by reverting each half in turn:**
Reset pressed while the reveal's scroll was in flight sent the **freshly cleared baseline down to its
own foot — `scrollY` 0 → 233, the whole height of the short page — arriving at ~110ms, sitting there
until Reset's own scroll was released at ~445ms, back at the top only at ~710ms**, in 2 of 3 runs.
**Fix (a):** `scrollToTop` stops the page where it is first, synchronously — a non-smooth scroll
aborts a smooth one on the same box, so scrolling to where the page already is IS "stop" and moves
nothing. **Fix (b):** `afterReflow` no longer runs a callback whose reflow was **superseded** — a
skipped transition REJECTS, and rejection was being read as completion, so the reveal's queued
`scrollIntoView` ran at a section the same press was removing (reproduced at every offset from 50 to
350ms, peak 233 every time). **After both: excursion 0px, at rest in 476-688ms.** Neither half works
alone; each has its own standing test in `motion.test.tsx` and in the spec.

**CRITERION 3 — RESET UNDER REAL ABUSE**, sampled every frame across ONE session: **2,012 frames, 20
presses over 7 shapes** — spammed ×8 on a full canvas, mid-beat, mid-reveal, mid-scroll, inside the
reflow tween, reset-then-ask with no pause, two heroes → reset → re-ask. "No broken state" is four
per-frame facts in one `expectStable` helper: **0 duplicate sections · 0 duplicate
`view-transition-name`s** (two live elements sharing one make the browser silently SKIP the whole
transition) **· 0 tiles tweened by two animations at once · 0 frames with two transient panels** —
plus **0 finite animations still running at rest**, the infinite brand pulses excluded or the count
could never mean anything. Peak 12 tiles, 12 beats, a cancelled beat proved never to land.

**CRITERION 4 — DEBOUNCE UNDER REAL USE:** 8 back-to-back Enter presses → 1 answer · Enter **held**
~900ms → 1 answer · one real click on the send button + 8 dispatched clicks + 8 dispatched form
submits → 1 answer · 6 submits during someone else's beat → 1 answer. **31 submit attempts, four
questions, exactly 4 beats.** Field and send button asserted `disabled` with `aria-busy="true"`
mid-beat, and the field asserted EMPTY, so the draft really was consumed by the first submit.

**COLD START, fresh context, empty cache**, against the local production build — the same SSR bundle
Railway would serve: **first paint / first contentful paint 120-140ms · DOM interactive 82-140ms ·
answers a press at 178-385ms · 11 requests / 183.0 KiB · console clean.** **THIS DOES NOT CLAIM
CRITERION 5** — see "Open at plan close"; it exists so there is a number to compare the deployed URL
against. **Also fixed:** US-043's prompt-bar clearance case capped its scroll-rest wait at 800ms and
expired mid-scroll under a full-suite run (**-279.5px** against a panel still travelling, **+107.5px**
in isolation on the same build) → cap now 3,000ms, which costs a healthy run nothing. **Triage —
none fired:** two scroll-scheduling changes, no input, no network, no dependency.

## The presenter's run of show

> **Terse on purpose. If anything at all goes wrong, press Reset — it is the recovery for every state
> in the product, and US-045 pressed it 20 ways to prove it.**

**Before the room:** open **Google Chrome** (not Safari, not Edge), one window, **1920×1080**, zoom
**100%**, full screen. Load the URL once while the network is up. **Wi-Fi may then be switched off** —
nothing is fetched after first paint (US-041). Do **not** reload with the network off.

| # | Do this | Expect |
|---|---|---|
| 1 | Open the URL | Navy sidebar, crest, four baseline tiles, "Your dashboard is ready", three chips |
| 2 | Tap **"Shirt sales by kit & sponsor badges"** | Thinking beat ~1.2s, the section builds, the view scrolls to it (~2s in all) |
| 3 | Tap **"Which badge should we push next?"** | The SAME section sharpens — gold divider, drivers, recommendation |
| 4 | Tap **"Ticket revenue, this year vs last"** | A second section appends BELOW; nothing above moves |
| 5 | Tap **"Which fixtures are driving the drop?"** | Section 2 sharpens |
| 6 | Tap **"Department budgets vs actuals"** | A third section appends |
| 7 | Tap **"Why is Marketing over budget & behind target?"** | Section 3 sharpens; Marketing's +410 reads as unfavourable |
| 8 | Take a question from the floor — type anything | It matches a hero, or the white fallback re-offers the three prepared questions. **Never an error, never nothing** |
| 9 | Press **Reset** | Everything clears to the baseline and the view returns to the top |

**If something looks wrong:** press **Reset** once and carry on — it cancels any beat in flight,
clears the canvas and returns to the top. Once is enough; a second press is a no-op by design. **Do
not reload with the network off.** Nothing is stored, so a reload (network up) always starts a clean
session at the baseline. **Two things worth knowing:** typing is optional — every scripted question
is a chip, and a chip cannot mis-match; and the prompt bar CLOSES for ~1.2s while a beat runs, which
is deliberate, not a freeze.

## Definition of "Demo Ready"

The phase — and the prototype — is complete when a presenter can open the shareable URL on the demo
machine, with Wi-Fi off, and run baseline → three heroes → three follow-ups → off-script → reset,
with no stutter, no error and no dead end. **US-041 proved the script offline; US-042 proved no dead
end; US-043 proved no stutter; US-045 performed the whole thing end to end in real Chrome with a
clean console. The ONE clause not yet demonstrable is "the shareable URL", because there is not one
— see "Open at plan close".**

---

**Created:** 2026-09-09 · **Last Updated:** 2026-09-10
**Phase Status:** ✅ Completed (6/6 · 14/14 pts) — **and with it the whole 45-story plan (116/116).**
One item is open and it is a human step, not code: the Railway deploy (see "Open at plan close").
**Previous:** [Phase 3b](phase-3b.md) · **Backlog:** [Master Index](../../input/backlog/README.md)
