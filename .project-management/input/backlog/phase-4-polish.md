# Phase 4: Demo Hardening & Polish

**Goal:** Turn a working prototype into one that survives a live, high-stakes room — sized for a
projector, smooth, dead-end-proof, and independent of any network mid-demo. This is where the
"instant and flawless" feeling is secured.
**Duration:** Days 5-6 (of a one-week build)
**Total Stories:** 6
**Total Points:** 14
**Status:** Not Started (0/6 completed)

> **Not in this phase:** new functionality, or anything that changes a hero's content.
> A live, high-stakes room is unforgiving; one ugly or wrong render in front of the owner is
> unrecoverable. Everything here exists to make that impossible.

---

## Epic 8: E8 — Demo Hardening & Polish

**Priority:** P0
**Total Story Points:** 14
**Status:** Not Started (0/6 completed)
**Source:** Build Specification E8; Framing §4 principle 4 ("Instant and flawless").

### Stories:

- **US-040**: Presentation sizing & responsiveness
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Size the whole surface for a laptop-to-projector setup.
  - **Acceptance Criteria:**
    - Renders correctly at **1920×1080 with no horizontal scroll**; type legible from across a room
    - Degrades gracefully on a typical laptop screen
    - Presenter's screen mirroring at a different resolution: layout reflows, no clipping, no
      horizontal scroll
    - Window resize / projector aspect ratio: grid reflows responsively, no clipped tiles
    - Charts remain legible — readable axis labels, adequate bar spacing, no clipped legends
  - **Dependencies:** US-012, US-034, US-036, US-038

- **US-041**: Offline resilience verification
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Prove that venue Wi-Fi cannot break the demo.
  - **Acceptance Criteria:**
    - **Fully functional with the network disconnected after load** — every hero, every follow-up,
      reset, and the fallback all work
    - No runtime dependency on the club CDN, any API, or any model endpoint
    - Crest and all assets confirmed self-hosted; all data bundled locally
    - Verified by disconnecting the network and running the full demo script end to end
  - **Dependencies:** US-004, US-011, US-039

- **US-042**: Dead-end path sweep
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Verify every path end to end — the fallback always catches.
  - **Acceptance Criteria:**
    - Every path verified dead-end-free: each hero, each follow-up, off-script input, empty input,
      and reset
    - Paraphrased questions resolve to the intended hero, tested with **several variations per hero**
    - The most off-script input imaginable still lands on the graceful fallback
    - A follow-up asked before its parent renders the parent first, then offers the chip
    - Tie-breaks are deterministic — two heroes never render from one input
    - Empty input is a no-op with chips still visible
  - **Dependencies:** US-030, US-032, US-033, US-039

- **US-043**: Transition & timing polish
  - **Story Points:** 3
  - **Priority:** P1
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Tune the choreography so every render feels earned and nothing stutters.
  - **Acceptance Criteria:**
    - Thinking beat, tile insertion and grid reflow are smooth with **no flicker and no layout jump**
    - Timing tuned so renders are smooth on the actual demo hardware
    - The orchestrated reveal reads as one sequence: thinking panel → section mounts → cards stagger
      in → numbers count up → bars/donuts/rings animate → auto-scroll to the new section
    - Filter changes animate from current values rather than snapping to zero
    - Reduced-motion path verified: everything renders at final state, nothing stuck at zero
  - **Dependencies:** US-006, US-027, US-031

- **US-044**: Brand fidelity & legibility QA
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Final pass confirming the shell reads as the club's own internal tool.
  - **Acceptance Criteria:**
    - Crest, colours and uppercase headers match the token set exactly; no colour outside the tokens
    - **Gold used only as specified** — target-hit marks and the follow-up accent; never a third fill
    - Series identity in red/blue; variance only in pos/neg tokens with sign and arrow
    - Borders and text survive a projector — subtle greys do not wash out
    - No em or en dashes anywhere, including narrative strings and the score label (`FCB 2-1 Sion`)
    - Focus-visible outlines present; figures use tabular numerals
  - **Dependencies:** US-003, US-039

- **US-045**: Chrome demo run-through & stability
  - **Story Points:** 2
  - **Priority:** P1
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Rehearse the run-of-show on the target browser and hardware.
  - **Acceptance Criteria:**
    - Runs cleanly in **Chrome** (the demo guarantee); no console errors
    - Full run-of-show rehearsed: open URL → baseline → three heroes with follow-ups → reset
    - Reset pressed repeatedly and mid-flow leaves no broken state, no duplicate tiles, no
      overlapping animations
    - Rapid repeated submits stay debounced under real use
    - The deployed shareable URL loads cleanly from a cold start
  - **Dependencies:** US-001, US-042, US-043

---

## Phase Summary

**Total Epics:** 1 | **Total Stories:** 6 | **Total Points:** 14

**By Priority:** P0: 4 stories, 9 points · P1: 2 stories, 5 points · P2: 0

**By Status:** ✅ 0 · 🔄 0 · 📋 6 stories, 14 points · ⏸️ 0

---

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-3b-heroes.md) · [Future →](future.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
