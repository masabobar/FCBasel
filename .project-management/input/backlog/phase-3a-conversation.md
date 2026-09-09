# Phase 3a: Conversational Interface & Interaction Model

**Goal:** The mechanism that makes the prototype feel intelligent — a prompt bar, keyword
intent-matching to the scripted flows, a short thinking beat, and a graceful fallback so an
off-script question never breaks the demo. This choreography is what stands in for the AI.
**Duration:** Day 3 (of a one-week build)
**Total Stories:** 6
**Total Points:** 17
**Status:** In Progress (4/6 completed)

> **The golden rule:** no model is called, no SQL generated, no answer computed live. The
> "intelligence" is choreography. See [`../constraints.md`](../constraints.md) §2 — *do not "upgrade"
> this to call a live model.*

---

## Epic 6: E5 — Conversational Interface & Interaction Model

**Priority:** P0
**Total Story Points:** 17
**Status:** In Progress (4/6 completed)
**Source:** Build Specification E5 and decision model §5.2; Reference Implementation Guide §6.

### Stories:

- **US-028**: Persistent prompt bar
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Completed (2026-09-09)
  - **Description:** A single unified input field at the bottom of the screen, always visible.
  - **Acceptance Criteria:**
    - One rounded field with the search icon and send button **embedded inside it**; no inner
      bordered box — only the field's own border, with a subtle focus ring on `:focus-within`
    - **Clicking anywhere in the field focuses the input**
    - Enter submits; the embedded send button submits; **empty input is a no-op** and the chips
      remain visible
    - Rapid repeated submits are debounced — one render at a time, no overlapping thinking indicators
  - **Dependencies:** US-003
  - **Notes:** The reference build deliberately uses no HTML `<form>` (submission failed silently in
    its sandbox). In this stack a form is fine — the behaviour above is what must be preserved.
  - **Implementation:** `app/components/chrome/prompt-bar.tsx`, mounted by `app/root.tsx` through a
    new `promptBar` slot on the US-012 shell. **A real `<form>` was used**, so Enter and the embedded
    button share the browser's implicit submission instead of two hand-rolled paths. One bordered
    element is the field; the icon and the send button sit inside it as siblings of the `<input>`,
    and the `:focus-within` ring lives on that same element with the input's own outline suppressed
    — a test walks the subtree and rejects any descendant border or ring. **Debounce needs no second
    timer:** a submit consumes the question, clearing a mirrored ref before `onSubmit`, so a
    re-entrant submit reads an empty draft, and `busy` disables the field for US-031's beat.
    `fixed`, not `sticky` (the shell clips overflow), with the canvas reserving the strip. Seams for
    the next stories: `onSubmit` (US-030), `busy` (US-031), `children` (US-029).

- **US-029**: Suggestion chips & chip lifecycle
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** The tappable prompts that make the prepared questions discoverable.
  - **Acceptance Criteria:**
    - On load, **exactly three chips** show the three hero prompts (short labels per E7)
    - A chip tap resolves **directly** to its mapped intent, bypassing scoring
    - After a hero renders, its follow-up prompt appears as a chip; the chip is removed once that
      follow-up has been shown
    - The three hero chips remain available throughout
    - Chips use an 11px corner radius with a lift-and-tint hover; follow-up chips use the
      gold-tinted variant
  - **Dependencies:** US-028
  - **Implementation:** `app/lib/dashboard/chips.ts` (labels + derivation, pure) and
    `app/components/chrome/suggestion-chips.tsx` (the row), mounted into US-028's `children` slot.
    **The row is DERIVED from `sections`, never stored:** three hero chips always, plus one follow-up
    per section still at `PRIMARY` — so criterion ③'s removal is implemented nowhere, the phase flip
    stops deriving it. Asserted over all 27 hero × phase combinations. **A tap bypasses scoring by
    TYPE** (`selectChip` takes a chip; a source scan rejects any scoring vocabulary in the module).
    Surface reused, not restated — the shared `.fcb-chip` rule carries the 11px radius and the lift;
    only the tint is new, gold for the follow-up (a wash and a border, never a fill), and kind is
    never colour alone. **This also closes US-015 criterion ②.** 57 new tests, 1498 green.

- **US-030**: Intent normalisation, scoring & tie-breaking
  - **Story Points:** 5
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** The keyword matcher that resolves a free-typed question to a scripted flow.
  - **Acceptance Criteria:**
    - Input normalised: lowercased, trimmed, punctuation stripped, space-padded for word matching
    - Scored against per-intent keyword sets: **+2 per strong keyword, +1 per weak keyword**
    - Highest-scoring intent above threshold wins — **threshold 2 for a hero, 3 for a follow-up**, so
      a follow-up cannot steal its parent hero's simpler phrasings
    - **Deterministic tie-break by intent priority order (Hero 1 > Hero 2 > Hero 3 > follow-ups);
      two heroes never render from one input**
    - Tolerant of paraphrase — "kit sales", "how are shirts selling", "trikot" all resolve to Hero 1
    - A single common word ("sales") resolves only if it clears the threshold for exactly one hero;
      otherwise fallback
    - Intent definitions held as static config (id, keyword set, mapped flow, parent-gating flag)
  - **Dependencies:** US-028
  - **Notes:** Highest-risk story in the build — the owner typing an off-script paraphrase is the
    live moment everything else protects. Test several variations per hero.
  - **Implementation:** `app/lib/dashboard/intents.ts` (static config + normalise + score + match +
    the `askQuestion` seam), wired to US-028's `onSubmit`. **A faithful port of the approved
    algorithm, verified rather than trusted:** normalise → **+2 strong / +1 weak** → threshold
    **2 hero / 3 follow-up** → **strictly-greater** over an ordered config, so a tie resolves to the
    earlier intent; an **oracle** test asserts identical scores *and* winners over a 90-phrase
    corpus. **34 paraphrases**, each canonical chip label beating its own follow-up by an asserted
    margin (8v4, 4v0, 10v1). Tie-break proven to a **three-way** 2/2/2 (→ Hero 1); one input yields
    ONE `{heroId, kind}` or `null`. `sales` alone, gibberish, empty and whitespace fall through.
    **The reference's two rough edges are documented and PINNED** (strong keywords prefix-match,
    weak keywords substring-match), so tightening them stays a deliberate decision. The chip path is
    untouched and separated BY TYPE. Golden rule scanned: no `fetch`, model, embedding, fuzzy-match
    library, `new RegExp`, SQL or dependency. 89 new tests, 1587 green.

- **US-031**: Thinking beat
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** The short staged pause that makes the result feel earned.
  - **Acceptance Criteria:**
    - Every successful match shows the thinking indicator for a fixed short delay **before** tiles
      render (~600-1200ms; the reference uses ~1150ms)
    - The panel shows a per-flow message, a sweeping scan line, and data-source chips lighting up one
      by one via staggered animation
    - Under reduced motion the delay shortens to ~260ms and animations render at final state
    - **This is stagecraft, not a query** — no request is made
  - **Dependencies:** US-006, US-028
  - **Implementation:** `app/lib/dashboard/thinking.ts` (the six beats, the two delays and the chip
    stagger, as static config beside the intent config), `app/lib/dashboard/use-thinking.ts` (the
    runner) and `app/components/heroes/thinking-panel.tsx` (the panel), wired in `app/root.tsx`.
    **The beat wraps the two dashboard actions, so both question paths pause and neither module
    changed:** `useThinking(dashboard)` hands back a `ChipActions` — the interface `askQuestion` and
    `selectChip` already took — so a tapped chip waits exactly as a typed question does, while a chip
    tap still bypasses US-030's scoring BY TYPE. A no-match calls neither action, so an off-script
    question shows no beat (US-032's input). **Ordering is asserted, not assumed:** on a fake clock
    the panel is up and no section exists at `1150ms - 1`, and the section is there with the panel
    gone at `1150ms`; making the runner land immediately fails 22 tests. **ONE timer still** — the
    delay goes through `useDashboard`'s `schedule`, there is no `setTimeout` in any new file, and a
    scan of every file under `app/` pins the only two places a timer may be created. A second chip
    tap mid-beat replaces the beat rather than racing it, and `busy` closes the field so a second
    submit is a no-op. **This also closes US-015 criterion ④** — Reset mid-beat leaves no panel, no
    section and no timer, proved by mutation (deleting `cancelPending()` fails 4 tests, deleting the
    panel's `generation` clear fails 4). Reduced motion shortens the beat to 260ms and the source
    chips render at their final state, visible rather than stranded at `opacity: 0`; the sweep hides,
    having no meaningful end state. No new keyframe (US-006's four are reused), no token, no hex, no
    dependency. 91 new tests, 1678 green.

- **US-032**: Graceful fallback panel
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Dead-end prevention — the catch for anything off-script.
  - **Acceptance Criteria:**
    - If no intent scores above threshold, a friendly panel appears reading *"I can pull that
      together. For this preview, here are the questions I've prepared -"* followed by the three
      suggestion chips
    - **Never shows an error, never blames the user, never leaves the screen without a next step**
    - Handles the extreme case (e.g. "show me player injuries") the same way
    - Before any question is asked, the empty state shows a light branded-red panel
      (`rgba(211,1,12,0.045)`) with a matching hairline border, a bold navy heading, a lighter
      one-line subtext and a red gradient icon badge
  - **Dependencies:** US-030
  - **Implementation:** `app/components/heroes/fallback-panel.tsx`,
    `app/components/heroes/empty-state-panel.tsx` and `app/lib/dashboard/use-canvas-panel.ts`
    (which transient panel is on the canvas), wired in `app/root.tsx`. **Two panels, never
    conflated.** The copy is **byte-identical** — asserted as UTF-8 bytes against a retyped literal
    AND against the criterion above, straight apostrophe and closing HYPHEN pinned by code point.
    **Criterion 2 is asserted as an ABSENCE:** eighteen blame/error words out of the copy, the
    rendered panel and the source; no `role="alert"`, no assertive region, no red/negative token.
    **The question is never echoed** — no question prop exists, so an `<img onerror>` payload creates
    no element and appears nowhere in the markup. **No beat precedes it** (`getTimerCount()` is 0).
    The next step is **US-029's own chips** over the frozen `HERO_CHIPS` (reuse proved on the class
    strings; no `<button>` in the file). The **empty state** is the review feedback: club red at
    **4.5% DERIVED from `--color-red`** (`bg-red/4.5`, no rgba literal, no hex), matching hairline,
    bold navy heading, lighter one-line subtext, red gradient badge. **The three panels are mutually
    exclusive by construction** (`canvasPanelFor` returns ONE value) and **Reset returns to the empty
    state**; otherwise the fallback is derived from the list the miss was asked against, so any
    answer drops it with no clearing code. No new timer, keyframe, token or dependency. 125 tests,
    1803 green.

- **US-033**: Follow-up context gating
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Follow-ups only make sense after their parent hero — this mirrors the decision
    model in the specification.
  - **Acceptance Criteria:**
    - A follow-up intent resolves only if its parent hero has already been shown this session
    - **If not, the parent hero renders first, and the follow-up chip is then offered for the user
      to tap** — never an error, never nothing
    - Showing a follow-up flips its parent section's phase rather than appending a new section
    - Session state tracks which heroes have been shown, driving both gating and chip visibility
    - Each hero is independent — any single hero can run start-to-follow-up on its own, so the
      presenter can show just one
  - **Dependencies:** US-030, US-014

---

## Phase Summary

**Total Epics:** 1 | **Total Stories:** 6 | **Total Points:** 17

**By Priority:** P0: 6 stories, 17 points · P1: 0 · P2: 0

**By Status:** ✅ 5 stories, 14 points · 🔄 0 · 📋 1 story, 3 points · ⏸️ 0

---

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-2b-components.md) · [Next Phase →](phase-3b-heroes.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
