# Phase 4: Demo Hardening & Polish

**Duration:** 2026-09-14 to 2026-09-15 (~6.0 AI-hours)
**Status:** 🔄 In Progress (3/6 · 7/14 pts)
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

**Priority:** P0 (US-043, US-045 are P1) · **Status:** 🔄 In Progress (3/6) · **Dependencies:** all prior phases

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-040 | Presentation sizing & responsiveness | 2 | P0 | ✅ Done |
| US-041 | Offline resilience verification | 2 | P0 | ✅ Done |
| US-042 | Dead-end path sweep | 3 | P0 | ✅ Done |
| US-043 | Transition & timing polish | 3 | **P1** | 📋 Todo |
| US-044 | Brand fidelity & legibility QA | 2 | P0 | 📋 Todo |
| US-045 | Chrome demo run-through & stability | 2 | **P1** | 📋 Todo |

**Technical Notes:**

- **Not in this phase:** new functionality, or anything that changes a hero's content — a gap in a
  hero surfacing here is a Phase 3b change.
- **US-041 and US-042 are verified by DOING, not by inspecting** — the network genuinely severed, the
  whole surface genuinely pressed. Both found what forty stories of code review had not.
- **US-044 checks the dash convention:** no em or en dashes anywhere, including narrative strings and
  the score label (`FCB 2-1 Sion`) — a house-style decision from the Reference Guide. Legibility from
  a room is a real constraint: a projector washes out subtle greys, so borders and type must hold up,
  and variance carries sign and arrow so colour is never the sole signal.
- **US-043 and US-045 lead the documented cut order.** Compress before dropping — a rehearsal that
  catches one broken path is worth more than its two points suggest.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Verification performed against the **running deployed app**, not only locally
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix · i18n.

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 1
- **Estimated Effort:** ~20 team-hours → ~6.0 AI-core hours
- **Risk Level:** Medium — the phase most likely to be compressed by upstream slippage

### Progress Tracking
- **Completed Story Points:** 7 / 14 (50%)
- **Completed Stories:** 3 / 6
- **Tests Passing:** 2225 / 2225 unit (55 files) + 32 / 32 Chrome cases (12 sizing, 4 offline, 16 path sweep) · **Coverage:** 99.71% stmts / 97.96% branches / 100% funcs / 100% lines of `app/**` · **Commits:** 3

---

## Dependencies

**Depends On:** every prior phase — hardening can only verify flows that exist. **Blocks:** the
sponsor showing — the gate between "works on my machine" and "can go in front of the owner".
**External:** the deployed Railway URL must be live for US-045's cold-start check.

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Phase compressed because upstream slipped | High | Medium | Extend daily runtime rather than cutting — the whole P1 set is only 0.82 days at 8h/day | Human | Open |
| A runtime fetch survives review and breaks the offline demo | High | Low | US-041 verifies by disconnecting, not by inspection | AI | **Closed — and it had: TWO real runtime fetches found and fixed** |
| An untested path dead-ends live | High | Low | US-042 sweeps every path incl. the most off-script input imaginable | AI | **Closed — whole surface swept, no dead end; sweep mutation-tested** |
| Transition stutters on the actual demo machine | Medium | Medium | US-043 tunes on target hardware, not the dev machine | AI | Open |
| Projector washes out variance colours | Medium | Medium | Sign and arrow carry the meaning; verified in US-044 | AI | Open |

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

## Progress Log

### US-040 — Presentation sizing & responsiveness (2 pts) · 2026-09-10 · ✅ Done

**A measurement story, so it was measured** — real Chrome against `pnpm build` + `pnpm start`, with
the **full run-of-show loaded** (three heroes, three follow-ups, 15 cards) before a single reading,
because that is the tallest the canvas gets. `playwright.config.ts` and
`tests/e2e/presentation-sizing.spec.ts` are new; **lockfile untouched**.

**Clean at every one of eleven viewports** — the five the story names (1920×1080, 1600×900,
1440×900, 1366×768, 1280×800), four projector aspect ratios (1920×1200, 1280×720, 1152×864,
1024×768) and both tablet orientations: no page horizontal scroll anywhere (re-checked with
`--show-scrollbars`; the scrollbar is an overlay, so no gutter narrows the canvas), no in-card
horizontal scroll (the departmental table's `overflow-x-auto` never engages at 1024+), no clipped
tiles, no truncated chart label or legend, no SVG `<text>` outside its plot. **Prompt-bar clearance
positive at all eleven** (+10.5px at 1920 and 1280). **Type floor 12px** — nothing below the token
set; the scale is US-044's remit. **Mid-session resize both ways** (1920 → 1024 → 1920) with all six
answers open: nothing clips going down, nothing stays clipped coming back.

**ONE REAL SIZING DEFECT FOUND AND FIXED.** Top Products needs 460px for its title block plus the
four-option `Segmented`; `lg:col-span-6` gave it **432px at 1152 and 368px at 1024**, so `Card`'s
`overflow-hidden` cut "Year to date" off by 25.7px and 89.7px. `WIDE_SPAN` is now
`col-span-full xl:col-span-6` (496px at 1280, full width below) — the same measurement that made
US-036 pick `xl`. **A no-op at all five target viewports**; a unit test pins the breakpoint.

**THE FAVICON DEFECT IS CLOSED.** Every load was probing `/favicon.ico`, taking a 404 and logging a
console error — reported "pre-existing" three times, and squarely against US-045. `public/favicon.ico`
is a one-entry ICO wrapping a 32×32 PNG **derived from the already-local crest** (`sips` downsample,
no image dependency added as in US-004) and **re-encoded from raw samples** so only
`IHDR`/`IDAT`/`IEND` ship. 1,742 bytes, declared by a `links` export; `200 image/x-icon` confirmed
from the production server, and the script now runs with zero console errors.

**Security triage — the external-binary trigger fired (A04/A08).** The asset was verified by reading
its bytes: ICO directory header, one 32×32 32bpp entry, declared length equal to the bytes present,
PNG magic, IHDR 32×32/8-bit/RGBA, chunk table walked end to end **consuming the buffer exactly, so
nothing is appended past `IEND`**. The US-004 metadata leak did not recur, but `sips` attached an
`eXIf` block and an `sRGB` chunk of its own, both dropped by the re-encode;
`tests/unit/favicon.test.ts` asserts their absence. **Lockfile untouched.** KL-1 and KL-2 were
recorded above rather than fixed; KL-1's numbers agree with US-036's to the decimal.

### US-041 — Offline resilience verification (2 pts) · 2026-09-10 · ✅ Done

**Verified by disconnecting, and the disconnection paid for itself twice.** `setOffline(true)` plus
`route("**", abort("internetdisconnected"))` — two mechanisms, so a fetch cannot hide behind the
weakness of either — against the **built SSR bundle**, never the dev server, whose HMR websocket is a
live network dependency by design. New: `tests/e2e/offline-resilience.spec.ts` (4 cases) and
`tests/e2e/support/network.ts`. **Lockfile untouched.**

**THE FULL SCRIPT, OFFLINE, ASSERTED AT EVERY BEAT** — baseline → three heroes (each by its own tile
titles) → three follow-ups (3 gold dividers, the causal peak's "What's driving Marketing") → **the
sidebar Dashboard link pressed with six answers on screen** → off-script (fallback copy verbatim,
never echoed) → empty submit → reset → **reset mid-beat**, the pending beat proved *cancelled* by
waiting out twice the delay. Re-run identically with **reduced motion**.

**FINDING 1 — `GET /__manifest?paths=%2F&version=…`.** React Router's lazy route discovery marks
every `<Link>` `data-discover="true"` and fetches the manifest on hydration — a real fetch from the
shipped bundle, invisible to any grep of `app/**`. **Fixed:** `routeDiscovery: { mode: "initial" }`;
there is exactly ONE route. Pinned by `tests/unit/app-config.test.ts`.

**FINDING 2 — `GET /_root.data`, AND IT WAS A DEMO-KILLER.** The sidebar's Dashboard row is a
`<Link to="/">` and the presenter is *always already on that route*, but React Router treats a press
as a navigation and revalidates. Measured offline: the request failed, the navigation errored, and
**the entire dashboard — 4 baseline cards, all 6 answers — was replaced by an error boundary from one
click**, with no way back but a reload an offline machine cannot serve. **Fixed at the root cause:**
`shouldRevalidate: () => false` on **both** matched routes — the single fetch skips the call only when
no route wants data. Wrong online too: the figures are bundled and cannot have changed.

**REQUEST LOG — 10 requests, all local, `0` after first paint, offline and online alike.** `/`,
`/fcb-crest.png`, six `/assets/*.js` chunks (all `modulepreload`ed — nothing lazy) and
`/assets/root-*.css`. **Zero** `fetch`/`xhr`/`websocket`/`eventsource`, zero webfont requests, zero
non-local origins, **zero to `fcb.ch`**, zero failures, **zero console errors**. And the half a log
cannot see: **every `src`/`href` in the document is root-relative**, asserted.

**Security triage — no trigger fired. A10/SSRF: no surface at all** — `app/**` holds no `fetch`,
`XMLHttpRequest`, `WebSocket`, `EventSource` or HTTP client, and no user input reaches a URL.
**A05:** both fixes *reduce* the served surface. **Lockfile untouched.**

### US-042 — Dead-end path sweep (3 pts) · 2026-09-10 · ✅ Done

**Swept the WHOLE interactive surface, not the conversation — US-041's lesson applied.** New:
`tests/e2e/dead-end-path-sweep.spec.ts` (**16 Chrome cases**) and `tests/e2e/support/paths.ts`,
reusing US-040/US-041's harnesses; the three control labels and `BEAT_MS` moved into
`support/demo-script.ts` so three specs share one copy. **No `app/**` source changed. Lockfile
untouched.** e2e is now **32 cases**; unit stays 2225 / 55 files.

**"Dead-end-free" is one helper, `expectAlive`, asserted on every path**: shell mounted and ≥ 4 tiles
(the screen changed or is deliberately unchanged, never silently broken) · ≥ 3 prepared chips and
> 2,000 chars of text (always a next step, never a blank canvas) · no error boundary, no sideways
scroll, never two transient panels — plus **an empty console per case** via US-041's recorder.

**Paths exercised (all green).** Three heroes · three follow-ups · **23 paraphrases**, each landing
its intended hero and no other · **16 off-script strings** incl. XSS, `javascript:`, SQL, a CSS
selector, RTL override, combining marks, five scripts in one line and **50,000 characters** — every
one on the fallback, with its three chips, never echoed · **6 empty/whitespace inputs**, no-ops via
Enter *and* the send button · **8 two-subject questions** asked twice each: exactly one hero,
identical both runs · **3 cold typed follow-ups**, parent first, then the chip offered and taken ·
the **sidebar Dashboard link pressed 5× with six answers up** (nothing lost, no history entry) · the
three **inert placeholders** proved `<span>` / `pointer-events: none` / `tabIndex -1` / no `href`,
clicked with a forced real mouse · crest, workspace label, status, avatar, top bar, sidebar, canvas ·
**141 canvas slots clicked** · **the whole tab ring at the baseline (11 stops) and on a full canvas
(19 stops)**, every stop activated with Enter *and* Space, no focus trap, a focus outline on all but
the prompt input (by design) · the demo driven **keyboard-only** · Reset ×5 with nothing to clear, ×6
over a full canvas, ×6 mid-beat with the beat waited out, and over the fallback · double-tapped hero
and follow-up chips, three chips in one burst, a chip tapped mid-beat, five submits of one question,
a hero re-asked after its follow-up — **never a duplicate section** · reload, mid-beat reload, back
and forward.

**NO DEAD END FOUND — and the sweep was mutation-tested to prove that means something.** Raising
`INTENT_THRESHOLD[HERO]` 2 → 5 failed the paraphrase case; pointing the sidebar link at a dead route
failed on `expectAlive`'s *"the app shell is gone"* — the exact defect class US-041 measured. Both
reverted. **One presentation wart found and recorded as KL-3** above rather than fixed, with the fix
measured and rejected as non-local.

**Security triage — the A03 user-input trigger fired and is the story's own measurement.** Every
hostile string above was typed into the real field on the served page, then **every sink read**: no
`__fcb*` global created (nothing executed), `onerror=` / `svg/onload` / `DROP TABLE` nowhere in the
document, no `src`/`href`/`action`/`style` carrying `javascript:` or any question fragment,
`localStorage` empty, `document.cookie` empty, and the only `sessionStorage` key React Router's
`react-router-scroll-positions` — integers, asserted to hold no question text. The per-module source
scans prove the claim about two files; this proves it on the served page, which is where US-041's
misses lived. No route, endpoint, SQL, `innerHTML`, upload, env var, auth or logging change;
**lockfile untouched**.

## Definition of "Demo Ready"

The phase — and the prototype — is complete when a presenter can open the shareable URL on the demo
machine, with Wi-Fi off, and run baseline → three heroes → three follow-ups → off-script → reset,
with no stutter, no error and no dead end.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-10
**Phase Status:** 🔄 In Progress (3/6 · 7/14 pts) — next: US-044 brand fidelity & legibility QA
**Previous:** [Phase 3b](phase-3b.md) · **Backlog:** [Master Index](../../input/backlog/README.md)
