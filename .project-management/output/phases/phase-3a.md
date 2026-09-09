# Phase 3a: Conversational Interface & Interaction Model

**Duration:** 2026-09-12 to 2026-09-13 (~8.7 AI-hours)
**Status:** ✅ Completed (6/6 stories · 17/17 pts)
**Started:** 2026-09-09
**Target Completion:** 2026-09-13
**Actual Completion:** 2026-09-10

> **Acceptance criteria live in** [`../../input/backlog/phase-3a-conversation.md`](../../input/backlog/phase-3a-conversation.md).
> This file tracks execution.

---

## Phase Goal

Build the choreography that stands in for the AI: a prompt bar, keyword intent-matching to the
scripted flows, a short thinking beat, and a graceful fallback so an off-script question never breaks
the demo.

**Success Criteria:**
- Free-typed paraphrases resolve to the intended hero, tested with several variations each
- A confident match always precedes tiles with the thinking beat
- Below-threshold input **always** lands on the fallback — never an error, never a dead end
- Follow-ups resolve only after their parent hero; otherwise the parent renders first
- Tie-breaks are deterministic; two heroes never render from one input

---

## Epics in This Phase

### Epic 6: E5 — Conversational Interface & Interaction Model (17 story points)

**Priority:** P0 · **Status:** ✅ Completed (6/6 · 17/17 pts) · **Dependencies:** US-003, US-006, US-014

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-028 | Persistent prompt bar | 2 | ✅ Completed |
| US-029 | Suggestion chips & chip lifecycle | 3 | ✅ Completed |
| US-030 | Intent normalisation, scoring & tie-breaking | 5 | ✅ Completed |
| US-031 | Thinking beat | 2 | ✅ Completed |
| US-032 | Graceful fallback panel | 2 | ✅ Completed |
| US-033 | Follow-up context gating | 3 | ✅ Completed |

**Technical Notes:**

- **The golden rule:** no model is called, no SQL is generated, no answer is computed live. The
  "intelligence" is choreography. *Do not "upgrade" this to call a live model* — the Framing document
  names this a considered decision, because a live model can render something ugly or wrong in front
  of the owner and that moment is unrecoverable.
- Matching: normalise (lowercase, strip punctuation, pad) → score (+2 strong, +1 weak) → threshold
  (**2 for a hero, 3 for a follow-up**) → deterministic tie-break by intent order
  (Hero 1 > Hero 2 > Hero 3 > follow-ups). The higher follow-up threshold exists so a follow-up
  cannot steal its parent hero's simpler phrasings.
- A **chip tap bypasses scoring** and resolves directly to its mapped intent.
- The thinking delay is fixed stagecraft (~1150ms; ~260ms under reduced motion) — it must feel
  earned without feeling slow. Rapid repeated submits are **debounced**: one render at a time.
- The reference build avoids an HTML `<form>` (submission failed silently in its sandbox). Here a
  form is fine — preserve the *behaviour*: Enter submits, the button submits, empty input no-ops.

---

## Definition of Done *(applies to every story in this phase)*

- [x] Code implemented and reviewed against `.claude/rules/code-quality.md`
- [x] Unit tests cover normalise / score / match / tie-break with several paraphrases per intent
- [x] Coverage ≥ 80% (99.84% stmts / 100% lines) · Security triage run per `security-review.md`
- [x] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix · i18n. **All six stories met this DoD.**

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 17 · **Stories:** 6 · **Epics:** 1
- **Estimated Effort:** ~29 team-hours → ~8.7 AI-core hours
- **Risk Level:** **High** — contains the project's single riskiest story

> **US-030 is the highest-risk story in the build.** The owner typing an off-script paraphrase is the
> live moment that everything else in the prototype exists to protect. It is also the story most
> likely to exceed its 5-point estimate, because "resolves the intended hero across several
> paraphrases" is judged, not asserted.

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 17 / 17 (100%)
- **Completed Stories:** 6 / 6
- **Tests Passing:** 1849 / 1849 · **Coverage:** 100% lines (`app/**`) · **Commits:** 6

---

## Dependencies

**Depends On:** US-003 (tokens), US-006 (motion) from Phase 1a; US-014 (tile insertion) from Phase 2a.

**Blocks:** **All of Phase 3b.** No hero is reachable without the matcher — this is why E5 precedes
E7 rather than following it. **Internal ordering:** US-028 → US-029/US-030 → US-031/US-032 → US-033.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| A paraphrase the owner uses fails to match | High | Medium | Generous keyword sets; 8-14 phrasings tested per hero in US-030; fallback always catches | AI | Mitigated |
| A follow-up steals its parent hero's phrasing | High | Medium | Threshold 3 vs 2, plus heroes ordered first so a tie goes to the hero; both pinned | AI | Mitigated |
| Two intents score equally and both render | High | Low | Strictly-greater comparison over an ordered config; three-way tie and corpus-wide single-match invariant asserted | AI | Mitigated |
| Thinking beat reads as slowness rather than effort | Medium | Low | Fixed 1150ms (260ms reduced) in US-031, pinned by test inside the 600-1200ms band; every source chip lands before the answer; re-tune on the demo hardware in US-043 | AI | Mitigated |
| Rapid submits overlap and corrupt state | Medium | Medium | Debounced in US-028: a submit consumes the question through a mirrored ref and `busy` disables the field; three rapid Enters yield one call | AI | Mitigated |
| A follow-up typed cold dead-ends (nothing renders) | High | Low | US-033 routes both paths through one gate (`follow-up-gate.ts`): the parent renders first, then the chip is offered. Guarded by mutation — the ungated call fails 10 tests | AI | Mitigated |

---

## Progress Log

### 2026-09-09 — US-028 Persistent prompt bar (2 pts) ✅

`app/components/chrome/prompt-bar.tsx`, mounted by `app/root.tsx` through a new `promptBar` slot on
US-012's shell. 48 new tests (1441 green), coverage 99.82% stmts / 98.20% branches / 100% lines.

- **ONE field, no inner bordered box.** Icon and send button are siblings of the `<input>` inside the
  single bordered element; the focus ring is `:focus-within` there and the input's own outline is
  suppressed, so focus reads as one ring around one field. A test walks the subtree and fails on any
  descendant border or ring, so the reported defect cannot return.
- **A real HTML `<form>`** — implicit submission makes Enter and the button one code path, not two.
- **Criterion 4 without a second clock.** A submit consumes the question through a mirrored ref
  written *before* `onSubmit` runs, so a re-entrant submit reads an empty draft and no-ops; `busy`
  disables both controls for US-031's beat. No `setTimeout` in the file, asserted. Empty and
  whitespace-only input are no-ops — not an error, not a fallback, nothing removed.
- **`fixed`, not `sticky`,** because the shell is itself a scroll container; the canvas reserves the
  strip (`PROMPT_BAR_CLEARANCE_CLASS`), which Reset and the auto-scroll both depend on.
- **Security (the app's only user input):** rendered solely as an input `value`, never as markup; no
  `innerHTML`, URL, request, storage or built selector; an `<img onerror>` payload reaches the
  callback verbatim and creates no element.
- **Seams left named:** `onSubmit` (US-030), `busy` (US-031), `children` (US-029's chip row), and
  `key={generation}` in `root.tsx` so Reset clears a half-typed question.

### 2026-09-09 — US-029 Suggestion chips & chip lifecycle (3 pts) ✅

`app/lib/dashboard/chips.ts` (the derivation, pure) + `app/components/chrome/suggestion-chips.tsx`
(the row), wired in `app/root.tsx` through US-028's `children` slot. 57 new tests (1498 green),
coverage 99.82% stmts / 98.22% branches / 100% lines.

- **THE ROW IS DERIVED, NOT STORED.** `suggestionChips(sections)` is pure — three hero chips always,
  plus one follow-up per section still at `PRIMARY` — so criterion 3's "removed once shown" is
  implemented nowhere: the phase flip stops the chip being derived. Proved over **all 27** hero ×
  phase combinations, and **US-015 criterion ② is satisfied with no reset code touched**. US-033
  later reads this same derivation as its gate, so chips and gating cannot disagree.
- **A chip tap BYPASSES scoring by TYPE:** `selectChip` takes a `SuggestionChip`, the matcher takes a
  `string`, and a `@ts-expect-error` case fails typecheck if either seam loosens.
- **The chip surface is reused, not restated** (`CHIP_SURFACE_CLASS`, 11px, not a pill); only the
  per-kind TINT is new, gold for the follow-up as a wash and border. Kind is never colour alone: a
  glyph plus a hidden "Follow-up:" in the accessible name.
- **Security triage: no security-relevant changes detected** — a chip carries a `HeroId` from a
  closed enum, not text; no URL, request, storage, `innerHTML`, dependency or endpoint.

### 2026-09-09 — US-030 Intent normalisation, scoring & tie-breaking (5 pts) ✅

`app/lib/dashboard/intents.ts` (config + normalise + score + match + the `askQuestion` seam), wired
in `app/root.tsx` to US-028's `onSubmit`. 89 new tests (1587 green), coverage 100% lines, 99.83%
stmts / 98.26% branches.

- **THE REFERENCE ALGORITHM WAS PORTED FAITHFULLY AND PINNED.** normalise (lowercase, strip
  `/.,?!'"()`, collapse, trim, pad) → +2 strong / +1 weak → threshold 2 hero / 3 follow-up →
  **strictly-greater** over an ordered config, so a tie resolves to the earlier intent. A test
  re-implements the reference formula as an **oracle** and asserts identical scores *and* winners
  across a 90-phrase corpus, so the port is verified rather than trusted. `25/26` → `2526` kept.
- **Two inherited rough edges are DOCUMENTED AND PINNED AS THE CONTRACT:** strong keywords match a
  word **prefix** (`kit` hits `kitchen`), weak keywords match **any substring** (`over` hits
  `recover`). The same leniency resolves `kits`, `kit-sales` and `shirts?` with no keyword of their
  own, and the 1-point weight keeps a stray substring below every threshold.
- **Paraphrase tolerance is the acceptance, so it is table-driven:** 14 phrasings for Hero 1, 10 for
  Hero 2, 10 for Hero 3, each canonical prompt beating its own follow-up by an asserted margin
  (8 vs 4, 4 vs 0, 10 vs 1). `why is marketing high?` lands on Hero 3's follow-up at exactly 3.
- **Tie-break proven:** `kit gate`, `trikot budget`, `ticket budget`, a **three-way** 2/2/2
  (`shirt ticket budget` → Hero 1) and two hero-vs-own-follow-up ties. Corpus-wide invariant: one
  `{heroId, kind}` or `null` — never two heroes. `sales` alone (1 < 2) resolves to nothing;
  gibberish, empty and whitespace all fall through to `null`.
- **Golden rule enforced by scan:** two imports exactly, no `fetch`/`WebSocket`/`axios`, no model,
  embedding or fuzzy-match reference, no `new RegExp`, no SQL, no `eval`/dynamic `import()`.
- **Security triage — A03 user-input trigger FIRES and is covered.** The string is lowercased into a
  local, tested with `String.includes` and discarded; only a `HeroId` and a `ChipKind` escape. It
  never becomes markup, a URL, a query, a selector, a storage key, a React key or a log line (all
  scanned). An `<img onerror>` payload scores 0 and returns `null`.
- **Seams left:** `askQuestion` returns the match so US-032 can hang the fallback on `null`, and
  `INTENT_REQUIRES_PARENT` is the parent-gating flag US-033 reads.

### 2026-09-09 — US-031 Thinking beat (2 pts) ✅

`app/lib/dashboard/thinking.ts` (the six beats, the two delays, the chip stagger),
`app/lib/dashboard/use-thinking.ts` (the runner) and
`app/components/heroes/thinking-panel.tsx` (the panel), wired in `app/root.tsx`. 91 new tests
(1678 green), coverage 100% lines / 99.83% stmts.

- **THE BEAT COMES BEFORE THE TILES, AND THE ORDERING IS ASSERTED.** On a fake clock: at
  `1150ms - 1` the panel is on screen and there is NO section; at `1150ms` the section is there and
  the panel is gone. Mutating the runner to land the answer immediately fails **22** tests. The panel
  is the LAST canvas grid item, so the answer appears exactly where the thinking was.
- **BOTH QUESTION PATHS RUN THROUGH IT AND NEITHER MODULE CHANGED.** `useThinking(dashboard)` returns
  a `ChipActions` — the interface `askQuestion` and `selectChip` already took — so a tapped chip and
  a typed question both wait, and the chip path still bypasses US-030's scoring **by type**.
- **ONE TIMER, STILL.** The delay is scheduled through `useDashboard`'s `schedule`; no `setTimeout`
  in any new file, and a scan of every `.ts`/`.tsx` under `app/` pins the only two places a timer may
  be created. A second chip tap mid-beat REPLACES the beat rather than racing it.
- **US-015 CRITERION ④ IS NOW SATISFIED — the last of its four.** Reset mid-beat leaves no panel, no
  section and **no timer** (`vi.getTimerCount()`), and the cancelled answer never arrives. Proved by
  mutation: deleting `cancelPending()` fails 4 tests, deleting the panel's `generation` clear fails
  4. `phase-2a.md` / `phase-2a-shell.md` updated.
- **Per-flow copy verbatim, all six flows** (message + ordered source list), rendered on the real
  `App` for each. Source chips stagger at 150 / 370 / 590ms, every flow's last chip landing before
  the beat ends. A follow-up asked before its parent shows the PARENT's beat (US-033 pins this).
- **`busy` closes the field for the beat's length**; a second submit during it is a no-op — removing
  US-028's `busy` guard fails that test.
- **Reduced motion: ~260ms, animations at final state** — the delay asserted genuinely shorter, the
  source chips VISIBLE rather than stranded at `opacity: 0`, the sweep hidden. **No new keyframe and
  no new token** (`app/app.css` still has exactly four `@keyframes`; no hex, no dependency).
  `role="status"` + `aria-live="polite"`; sweep and glyph `aria-hidden`.
- **Security triage — no security-relevant changes detected.** No request (`fetch`, `WebSocket`,
  `sendBeacon`, dynamic `import()` all scanned), endpoint, dependency, storage, `innerHTML`, URL or
  logging. The typed string never reaches the beat: only static config selected by id and kind.
- **Seams left:** a no-match still shows no beat, which is exactly US-032's input; US-033's typed
  follow-up gating slots in behind `askQuestion` with nothing here to change.

### 2026-09-09 — US-032 Graceful fallback panel (2 pts) ✅

`app/components/heroes/fallback-panel.tsx`, `app/components/heroes/empty-state-panel.tsx` and
`app/lib/dashboard/use-canvas-panel.ts` (which panel is on the canvas), wired in `app/root.tsx`.
125 new tests (1803 green), coverage 99.84% stmts / 98.32% branches / 100% lines.

- **TWO DISTINCT PANELS, NEVER CONFLATED.** The **fallback** answers a typed question that matched
  nothing; the **empty state** is the canvas before anything has been asked. Different moments,
  copy and surfaces — the table at the head of `empty-state-panel.tsx` states the difference so a
  later change cannot merge them.
- **THE COPY IS BYTE-IDENTICAL, asserted as UTF-8 bytes** against a retyped literal *and* against the
  acceptance criterion in `phase-3a-conversation.md`, so the two copies cannot drift together. The
  apostrophe in "I've" and the closing **hyphen** are pinned by code point; smart quotes, em/en
  dashes, truncation and ellipsis all asserted absent.
- **CRITERION ② IS ASSERTED AS AN ABSENCE.** Eighteen blame/error words are proved out of the copy,
  the rendered panel *and* the source; no `role="alert"`, no `aria-live="assertive"`, no
  `aria-invalid`, and no red or negative token near the panel — red never means "bad" here.
- **THE TYPED QUESTION IS NEVER ECHOED.** The panel has no question prop at all (props asserted
  exactly): an `<img onerror>` payload reaches it as no element and no visible text.
- **NO BEAT PRECEDES IT** — `askQuestion` calls no dashboard action for a miss, so the panel is up in
  the same commit as the submit and `vi.getTimerCount()` is 0. **THE NEXT STEP IS ALWAYS THERE:**
  US-029's own `SuggestionChips` over the frozen `HERO_CHIPS` (never the derived row, so no
  follow-up can point at an absent answer); reuse proved on the class strings, no `<button>` here.
- **THE EMPTY STATE IS THE RECORDED REVIEW FEEDBACK:** club red at **4.5% DERIVED from
  `--color-red`** (`bg-red/4.5` → `color-mix(…)`; the rgba literal and every hex absent by scan), a
  red hairline, bold navy heading, lighter subtext and a decorative gradient badge. A labelled
  region, not a live one — it ships with content, so there is nothing to announce.
- **THE THREE PANELS ARE MUTUALLY EXCLUSIVE BY CONSTRUCTION.** `canvasPanelFor` returns ONE of
  thinking / fallback / empty / none, asserted over every combination and in the DOM at all four
  canvas states. **Reset returns to the empty state** (the `generation` seam).
- **Security triage — A03 user-input trigger considered and covered:** the question is read and
  discarded by `intents.ts` and **never reaches either panel as markup or as text**; no `innerHTML`,
  URL, request, storage, selector or logging in the three new modules (scanned), no dependency, no
  endpoint. No new keyframe, token or timer.
- **Seams left:** US-033's gating sits behind `askQuestion` and needs nothing here; the fallback's
  chips are the row US-033 will also offer a follow-up through.

### 2026-09-10 — US-033 Follow-up context gating (3 pts) ✅ — **PHASE 3a CLOSED**

`app/lib/dashboard/follow-up-gate.ts` (new, 2 pure functions), read by `use-dashboard.ts` (the
answer) and `use-thinking.ts` (the beat). 46 new tests (1849 green), coverage 99.84% / 100% lines.

- **THE BEHAVIOUR WAS ALREADY CORRECT AT HEAD — STATED PLAINLY.** `withFollowUpShown` alone *is* a
  no-op for an absent hero, but no caller ever invoked it ungated: US-014's `showFollowUp` already
  branched on `hasSection`, and US-031's beat already chose the parent's message. Reverting both to
  HEAD fails only the 2 source-scan tests, not one behavioural one. **So this story is not a bug
  fix; it is the rule made explicit, single-sourced and exhaustively proved.** The dead end is
  guarded by mutation instead: calling `withFollowUpShown` unconditionally — the ungated form the
  briefing feared — **fails 10 of these tests**, so the no-op can never be reintroduced silently.
- **ONE GATE, IN ONE MODULE.** The rule lived in two hand-written branches that could drift; it is
  now `renderedKind(sections, heroId, asked)` plus `isFollowUpGated`, and a source scan pins
  `hasSection` and `INTENT_REQUIRES_PARENT` to **exactly two readers each** — so gating and chip
  visibility are two readings of ONE list (criterion ④), with no parallel registry of shown heroes.
  The matcher still never sees the session and `sections.ts` still never decides a meaning.
- **THE CHIP PATH WAS ALREADY GATED BY CONSTRUCTION** (US-029 derives a follow-up chip only for a
  section at `PRIMARY`), asserted over all **27** hero × phase sessions. **The TYPED path is the one
  this story owns**, driven end to end on the real `App` for all three heroes: cold follow-up →
  parent renders at `primary` → follow-up chip is now offered → tap → phase flips, **one section,
  never two**. Never an error, never the fallback, never the empty state, no `role="alert"`.
- **Criterion ⑤ proved twice:** as a property (a hero's gate against the whole session equals its
  gate against its own entry alone, over all 27 shapes), and on the real `App` — each hero runs
  primary → follow-up with the other two never touched.
- **The documented choice: a gated cold follow-up shows the PARENT's thinking message and sources**,
  because the panel must name the answer actually arriving. Asserted per hero, both ways round.
- **Reset re-gates for free** — the list is `BASELINE_SECTIONS` again, so the gate shuts and the chip
  is withdrawn together, no reset code touched. **US-015's ①②④ re-confirmed closed** (US-013 /
  US-029 / US-031) in `phase-2a.md` and `phase-2a-shell.md`; nothing dangles.
- **Security triage — no security-relevant changes detected.** No endpoint, dependency, storage,
  `innerHTML`, URL, request or logging; the gate is a pure function of a section list and a closed
  enum, and the typed string never reaches it.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-10
**Phase Status:** ✅ Completed (6/6 stories · 17/17 pts) — 2026-09-10
**Previous:** [Phase 2b](phase-2b.md) · **Next:** [Phase 3b — Heroes](phase-3b.md)
