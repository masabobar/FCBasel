# Phase 4: Demo Hardening & Polish

**Duration:** 2026-09-14 to 2026-09-15 (~6.0 AI-hours)
**Status:** 🔄 In Progress (4/6 · 9/14 pts)
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

**Priority:** P0 (US-043, US-045 are P1) · **Status:** 🔄 In Progress (4/6) · **Dependencies:** all prior phases

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-040 | Presentation sizing & responsiveness | 2 | P0 | ✅ Done |
| US-041 | Offline resilience verification | 2 | P0 | ✅ Done |
| US-042 | Dead-end path sweep | 3 | P0 | ✅ Done |
| US-043 | Transition & timing polish | 3 | **P1** | 📋 Todo |
| US-044 | Brand fidelity & legibility QA | 2 | P0 | ✅ Done |
| US-045 | Chrome demo run-through & stability | 2 | **P1** | 📋 Todo |

**Technical Notes:**

- **Not in this phase:** new functionality, or anything changing a hero's content — a gap in a hero
  surfacing here is a Phase 3b change.
- **US-041, US-042 and US-044 are verified by DOING, not by inspecting** — the network genuinely
  severed, the whole surface genuinely pressed, every painted colour genuinely read off the served
  page. All three found what forty stories of code review had not.
- **US-043 and US-045 lead the documented cut order.** Compress before dropping — a rehearsal that
  catches one broken path is worth more than its two points suggest.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Verification performed against the **running deployed app**, not only locally
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated · *not applicable:* API
      status-code matrix, i18n.

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 1
- **Estimated Effort:** ~20 team-hours → ~6.0 AI-core hours
- **Risk Level:** Medium — the phase most likely to be compressed by upstream slippage

### Progress Tracking
- **Completed Story Points:** 9 / 14 (64%)
- **Completed Stories:** 4 / 6
- **Tests Passing:** 2228 / 2228 unit (55 files) + 45 / 45 Chrome cases (12 sizing, 4 offline, 16 path sweep, 13 brand) · **Coverage:** 99.71% stmts / 97.97% branches / 100% funcs / 100% lines of `app/**` · **Commits:** 4

---

## Dependencies

**Depends On:** every prior phase. **Blocks:** the sponsor showing.
**External:** the deployed Railway URL must be live for US-045's cold-start check.

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Phase compressed because upstream slipped | High | Medium | Extend daily runtime rather than cutting — the whole P1 set is only 0.82 days at 8h/day | Human | Open |
| A runtime fetch survives review and breaks the offline demo | High | Low | US-041 verifies by disconnecting, not by inspection | AI | **Closed — and it had: TWO real runtime fetches found and fixed** |
| An untested path dead-ends live | High | Low | US-042 sweeps every path incl. the most off-script input imaginable | AI | **Closed — whole surface swept, no dead end; sweep mutation-tested** |
| Transition stutters on the actual demo machine | Medium | Medium | US-043 tunes on target hardware, not the dev machine | AI | Open |
| Projector washes out variance colours | Medium | Medium | Sign and arrow carry the meaning; verified in US-044 | AI | **Closed — all 23 chips measured: sign, arrow and spoken word on every one, and ONE missing sign found and fixed. Border ratios recorded as KL-4** |

---

## Known limitations

> **This section is deliberate, permanent and not a to-do list.** Each entry is a measured behaviour
> that a named decision put OUT OF SCOPE. It lives in the phase file — not a progress log — because a
> log gets compacted and US-036's first attempt to record KL-1 was lost that way. **Do not "fix"
> anything here without reversing its decision first.**

### KL-1 — Hero 2's year-on-year delta chips overlap at a 390px viewport

**What:** `GroupedBarTile` (`app/components/charts/grouped-bars.tsx`) draws eight fixture delta
chips in a band above the bars, one per fixture cell. At a 390px viewport the cell is ~36px against a
chip that is **59.5px** at every width, so neighbouring chips overlap.

**Decision (2026-09-10, recorded by the PM): OUT OF SCOPE.** 390px is a phone; US-040's targets are
**1920×1080 and a typical laptop screen**, presented from a laptop to a projector. Narrowing the chip
(dropping the sign, the arrow or the thousands separator) would cost more than the case is worth, and
this is the one place the sign is the meaning.

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

Every row from 1920 down to 768 was re-measured by US-040 from scratch and agrees with US-036's
figures to the decimal; **the 390 row is US-036's own**, carried forward because 390px is outside
US-040's suite. **Clean from 768px up**, so the whole presentation range and both tablet orientations
are safe. **The tightest point is 1280, not the narrowest viewport** — the tile is
`col-span-full xl:col-span-8`, so 1280 is the `xl` boundary where it is narrowest *as an eight-column
tile*; one pixel below it takes the full width and the cells widen again. Anyone re-tuning that
breakpoint is moving this number. **Re-measured every run:**
`tests/e2e/presentation-sizing.spec.ts` prints all three figures per viewport and fails if the gap is
not positive, so the boundary is a number in a test report rather than a claim in a document.

### KL-2 — Below 768px the layout is not a target at all

Phones are not a presentation surface for this prototype and no story has ever claimed them. The
canvas still steps down to 4 columns and the page never scrolls sideways, but tile-internal geometry
(KL-1 among it) is unverified below 768px and will stay that way.
### KL-3 — A reload restores the scroll offset onto a freshly cleared dashboard

**What:** state is memory-only by specification, so a reload starts a new session at the baseline —
but the SCROLL OFFSET survives it. `<ScrollRestoration />` writes `react-router-scroll-positions` to
`sessionStorage`, and the restored offset, clamped to the much shorter baseline page, lands the
presenter at its foot with the app bar (crest, Reset) scrolled out of view. **Measured after a full
canvas scrolled to the bottom, then reloaded:** 1920×1080 → `scrollY 185`, hero-band greeting at
`top: -89`; 1440×900 → `scrollY 340`, greeting at `top: -244`.

**Decision (2026-09-10, US-042): OUT OF SCOPE HERE, deferred to US-043/US-045.** It is **not a dead
end** by US-042's own three-part definition — the baseline renders correctly, the chips are up in the
pinned bar, the console is clean and the very next question works, all asserted. And **the fix is not
local, measured rather than assumed:** removing `<ScrollRestoration />` was tried end to end — it does
stop the `sessionStorage` write, but Chrome's own restoration then produces the identical offset, so
closing it needs `history.scrollRestoration = "manual"`, i.e. new behaviour in a phase whose charter
adds none. The sweep pins the path's HEALTH, so the deferral cannot rot into a real defect.

### KL-4 — Borders and hairlines measure 1.10-1.24:1 and will wash out on a projector

**What (US-044, Chrome on the served page, full script at 1920×1080):** `--color-border` **1.24:1** on
white, **1.12:1** on the `--color-surface` canvas · `--color-line` hairlines and chart grid **1.13:1**
· donut track **1.10:1** · the navy band's borders **1.57:1**. Text holds up — primary **17.5:1**,
navy headings **15.1:1**, muted **4.78:1** on white and **4.33:1** on surface — but four ink pairs are
marginal by design: the gold-deep eyebrows **2.49:1** (Recommendation) and **2.57:1** (Follow-up), the
positive chip **3.02:1** on its own tint, the Feldschlösschen / Bitpanda plates **2.84** / **3.37:1**.
**Decision (2026-09-10, US-044): OUT OF SCOPE, not a defect.** Nothing here depends on a border
to be read: every tile also carries `--shadow-tile` and a white fill against the grey canvas, and
every chart's geometry is a filled shape, not an outline. Each marginal pair is an ACCENT (a
washed-out eyebrow costs an affordance, not an answer), a partner's own colour (content, US-007), or a
variance chip, which carries its meaning three further ways precisely so a projector can take the
colour. **Moving a token VALUE is US-003's change, not a QA story's**, and
`tests/e2e/brand-fidelity.spec.ts` re-measures every run, failing anything FAINTER than the above.

## Progress Log

### US-040 — Presentation sizing & responsiveness (2 pts) · 2026-09-10 · ✅ Done

**Measured, not reviewed** — real Chrome against `pnpm build` + `pnpm start`, **full run-of-show
loaded** (three heroes, three follow-ups, 15 cards) before a single reading. New
`playwright.config.ts` + `tests/e2e/presentation-sizing.spec.ts`; **lockfile untouched.** **Clean at
ELEVEN viewports** — the five named (1920×1080 down to 1280×800), four projector aspect ratios and
both tablet orientations: no page or in-card horizontal scroll (re-checked with `--show-scrollbars`;
the overlay scrollbar narrows no gutter), no clipped tile, label or legend, no SVG `<text>` outside
its plot, **clearance +10.5px at 1920 and 1280**, **type floor 12px**. **Resize both ways** (1920 →
1024 → 1920), six answers open. **ONE REAL SIZING DEFECT FOUND AND FIXED.** Top Products needs 460px
for its title block plus the four-option `Segmented`; `lg:col-span-6` gave **432px at 1152 and 368px
at 1024**, so `overflow-hidden` cut "Year to date" by 25.7px and 89.7px. `WIDE_SPAN` is now
`col-span-full xl:col-span-6` — **a no-op at all five targets**, breakpoint pinned by a test. **THE
FAVICON DEFECT IS CLOSED** — every load probed `/favicon.ico`, took a 404 and logged a console
error. `public/favicon.ico` wraps a 32×32 PNG **derived from the already-local crest** and
**re-encoded from raw samples** (1,742 bytes, only `IHDR`/`IDAT`/`IEND`; `200 image/x-icon` from
production). **Triage — external-binary trigger fired (A04/A08):** bytes read end to end, chunks
**consuming the buffer exactly so nothing follows `IEND`**, `sips`'s `eXIf`/`sRGB` dropped and
asserted absent. KL-1 / KL-2 recorded, not fixed.

### US-041 — Offline resilience verification (2 pts) · 2026-09-10 · ✅ Done

**Verified by disconnecting, and it paid for itself twice.** `setOffline(true)` **plus**
`route("**", abort("internetdisconnected"))` against the **built SSR bundle**, never the dev server,
whose HMR websocket is a network dependency. New `offline-resilience.spec.ts` (4 cases) +
`support/network.ts`; **lockfile untouched.** **THE FULL SCRIPT, OFFLINE, ASSERTED AT EVERY BEAT** —
baseline → three heroes → three follow-ups → **the sidebar link pressed with six answers up** →
off-script → empty submit → reset → **reset mid-beat**, the pending beat proved *cancelled* by
waiting out twice the delay. Re-run under **reduced motion**. **FINDING 1 — `GET /__manifest?…`:**
lazy route discovery marks every `<Link>` `data-discover="true"` and fetches on hydration — a real
fetch from the shipped bundle, invisible to any grep of `app/**`. **Fixed:** `routeDiscovery: {
mode: "initial" }`, pinned by `tests/unit/app-config.test.ts`. **FINDING 2 — `GET /_root.data`, A
DEMO-KILLER:** the sidebar's Dashboard row is a `<Link to="/">` on the route already shown, but
React Router revalidates. Offline, **the whole dashboard — 4 baseline cards, all 6 answers — became
an error boundary from one click**, unrecoverable without a reload. **Fixed at the root cause:**
`shouldRevalidate: () => false` on **both** matched routes; wrong online too, since the figures are
bundled. **REQUEST LOG — 10 requests, all local, `0` after first paint, offline and online.**
**Zero** `fetch`/`xhr`/`websocket`/`eventsource`, webfonts or foreign origins, zero failures, **zero
console errors**, every `src`/`href` root-relative. **Triage — none fired. A10: no surface at all**;
**A05:** both fixes *reduce* the served surface.

### US-042 — Dead-end path sweep (3 pts) · 2026-09-10 · ✅ Done

**Swept the WHOLE interactive surface, not the conversation — US-041's lesson applied.** New
`tests/e2e/dead-end-path-sweep.spec.ts` (**16 Chrome cases**) + `support/paths.ts`; control labels
and `BEAT_MS` moved into `support/demo-script.ts` so three specs share one copy. **No `app/**`
source changed. Lockfile untouched.** **"Dead-end-free" is one helper, `expectAlive`, on every
path**: shell mounted and ≥ 4 tiles · ≥ 3 prepared chips and > 2,000 chars of text · no error
boundary, no sideways scroll, never two transient panels · **an empty console per case** via
US-041's recorder. **Paths (all green).** Three heroes · three follow-ups · **23 paraphrases**, each
landing its intended hero only · **16 off-script strings** incl. XSS, `javascript:`, SQL, an RTL
override and **50,000 characters** — all on the fallback, never echoed · **6 empty/whitespace**
no-ops via Enter *and* the button · **8 two-subject questions** twice each: one hero, identical both
runs · 3 cold typed follow-ups · the three **inert placeholders** proved `<span>` / `pointer-events:
none` / `tabIndex -1` / no `href` · **141 canvas slots clicked** · **the tab ring at baseline (11
stops) and full (19)**, each stop activated with Enter *and* Space, no focus trap · the demo
**keyboard-only** · Reset ×5 empty, ×6 full, ×6 mid-beat · double-taps, bursts, five submits of one
question, a hero re-asked after its follow-up — **never a duplicate section** · reload, back,
forward. **NO DEAD END FOUND — and the sweep was mutation-tested to prove that means something.**
Raising `INTENT_THRESHOLD[HERO]` 2 → 5 failed the paraphrase case; a dead sidebar route failed on
*"the app shell is gone"* — the exact defect class US-041 measured. Both reverted. **One wart
recorded as KL-3**, its fix measured and rejected as non-local. **Triage — the A03 user-input
trigger fired and IS the measurement:** every hostile string typed into the real field, then **every
sink read** — no `__fcb*` global, no `onerror=`/`svg/onload`/`DROP TABLE` in the document, nothing
carrying `javascript:` or a question fragment, `localStorage` and `document.cookie` empty, the only
`sessionStorage` key React Router's scroll positions (integers, no question text). **Lockfile
untouched.**

### US-044 — Brand fidelity & legibility QA (2 pts) · 2026-09-10 · ✅ Done

**Measured the RENDERED PAGE, not the source — US-041's lesson applied to the palette.** New
`tests/e2e/brand-fidelity.spec.ts` (**13 Chrome cases**) + `support/brand.ts`, reusing
US-040/041/042's harnesses: one `getComputedStyle` walk per moment, every painted value resolved to
sRGB (Tailwind's `/opacity` composites in **oklab**, converted back through the CSS Color 4 matrices)
and classified in Node against `app/lib/tokens.ts` **itself** — not one hex copied into a test. Read
at FOUR moments, since none paints everything: baseline (the only `red-vivid`), mid-beat (the gold
sweep), **full script at 1920×1080**, the fallback's prose. e2e is now **45 cases**; unit 2228 / 55
files. **Lockfile untouched.**

**COLOUR INVENTORY — 19 distinct colours over 886 painted elements, every one a token,** at 15 alphas,
plus `#101840` (a **shadow** token) and `rgba(0,0,0,0)`. **The only non-palette hexes are two partner
brand colours** — Bitpanda `#0a9d8e`, Sunrise `#e4002b`; the other four coincide with FCB tokens by
accident, and all six come from the DATASET, so US-007's exception cannot drift.

**GOLD AUDIT — 41 paints, all inside a CLOSED `data-slot` allowlist, each with a written sanction:**
target marks (×11), the follow-up seam (×6), the recommendation panel (×16), the flagged Marketing
row and its flag, plus the Reference-Guide band and chrome uses the criterion's short form does not
name (selected `Segmented`, gold line and swatch, attendance arc, status dot, thinking sweep).
**`#b8960b` on one partner plate is NOT gold** — Feldschlösschen's own colour shares
`accentFollowUp`'s hex, so it is excluded by SLOT. **No gold on `card`, `card-accent` or
`insight-section`, asserted: the ring the Reference Guide removed (US-006) stays removed.**

**ONE REAL DEFECT FOUND AND FIXED — the only variance chip on the canvas with no sign.** Hero 3's
driver total rendered **`CHF 410k total`**: `DriverTile` handed the badge the ROWS' formatter, rightly
unsigned because a row is an amount, while the badge is a `DeltaChip` and `app/lib/format.ts` is
explicit that variance is never colour alone. Exactly US-022's trap — a POSITIVE figure that is
ADVERSE, so no minus arrived to cover the gap. **Fixed locally:** a `totalFormat` prop defaulting to
`format`, Hero 3 passing the signed twin of its own composition — **`+CHF 410k total`**, same
currency spelling, rows still unsigned. **All 23 chips now carry four carriers** (sign, arrow, spoken
direction, pos/neg token), and the trap is asserted POSITIVELY: an UP arrow in the negative token
must exist, or Marketing has been "simplified" away.

**THE REST, MEASURED.** **31 uppercase headers**, each `uppercase`/700 at `0.04em` × its own size ·
**every figure** carrying `tabular-nums` · **19 tab stops with a visible outline on all but the
prompt input**, whose ring is on the field wrapper by design and asserted there · **DASH SWEEP: 0
offenders** over every text node AND attribute at all four moments, against a wider set than the
dataset tests use incl. **U+2212**, with `FCB 2-1 Sion` in both places and U+002D asserted by code
point. Contrast recorded as **KL-4**. **Triage — no trigger fired:** no route, endpoint, SQL,
`innerHTML`, upload, env var, auth or logging change; the only `app/**` edits are one formatter prop
and its call site, and the harness reads `app/lib/mock/baseline.ts`, an in-memory dataset.

## Definition of "Demo Ready"

The phase — and the prototype — is complete when a presenter can open the shareable URL on the demo
machine, with Wi-Fi off, and run baseline → three heroes → three follow-ups → off-script → reset,
with no stutter, no error and no dead end.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-10
**Phase Status:** 🔄 In Progress (4/6 · 9/14 pts) — next: US-043 transition & timing polish
**Previous:** [Phase 3b](phase-3b.md) · **Backlog:** [Master Index](../../input/backlog/README.md)
