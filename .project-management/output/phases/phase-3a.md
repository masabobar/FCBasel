# Phase 3a: Conversational Interface & Interaction Model

**Duration:** 2026-09-12 to 2026-09-13 (~8.7 AI-hours)
**Status:** Active (1/6 stories)
**Started:** 2026-09-09
**Target Completion:** 2026-09-13
**Actual Completion:** —

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

**Priority:** P0 · **Status:** In Progress (1/6 · 2/17 pts) · **Dependencies:** US-003, US-006, US-014

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-028 | Persistent prompt bar | 2 | ✅ Completed |
| US-029 | Suggestion chips & chip lifecycle | 3 | 📋 Todo |
| US-030 | Intent normalisation, scoring & tie-breaking | 5 | 📋 Todo |
| US-031 | Thinking beat | 2 | 📋 Todo |
| US-032 | Graceful fallback panel | 2 | 📋 Todo |
| US-033 | Follow-up context gating | 3 | 📋 Todo |

**Technical Notes:**

- **The golden rule:** no model is called, no SQL is generated, no answer is computed live. The
  "intelligence" is choreography. *Do not "upgrade" this to call a live model* — the Framing document
  names this as a considered decision, not a shortcut, because a live model can render something ugly
  or wrong in front of the owner and that moment is unrecoverable.
- Matching: normalise (lowercase, strip punctuation, pad) → score (+2 strong, +1 weak) → threshold
  (**2 for a hero, 3 for a follow-up**) → deterministic tie-break by intent order
  (Hero 1 > Hero 2 > Hero 3 > follow-ups). The higher follow-up threshold exists so a follow-up
  cannot steal its parent hero's simpler phrasings.
- A **chip tap bypasses scoring** and resolves directly to its mapped intent.
- The thinking delay is fixed stagecraft (~1150ms in the reference; ~260ms under reduced motion). It
  must feel earned without feeling slow.
- The reference build deliberately avoids an HTML `<form>` (submission failed silently in its
  sandbox). In this stack a form is fine — preserve the *behaviour*: Enter submits, the embedded
  button submits, empty input is a no-op.
- Rapid repeated submits must be **debounced** — one render at a time, no overlapping indicators.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md`
- [ ] Unit tests cover normalise / score / match / tie-break with several paraphrases per intent
- [ ] Coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix · i18n.

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
- **Completed Story Points:** 2 / 17 (12%)
- **Completed Stories:** 1 / 6
- **Tests Passing:** 1441 / 1441 · **Coverage:** 100% lines (`app/**`) · **Commits:** 1

---

## Dependencies

**Depends On:** US-003 (tokens), US-006 (motion) from Phase 1a; US-014 (tile insertion) from Phase 2a.

**Blocks:** **All of Phase 3b.** No hero is reachable without the matcher — this is why E5 precedes
E7 rather than following it.

**Internal ordering:** US-028 → US-029/US-030 → US-031/US-032 → US-033.

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| A paraphrase the owner uses fails to match | High | Medium | Generous keyword sets; several variations tested per hero; fallback always catches | AI | Open |
| A follow-up steals its parent hero's phrasing | High | Medium | Follow-up threshold is 3, not 2 — requires a strong *and* a weak term | AI | Open |
| Two intents score equally and both render | High | Low | Deterministic tie-break by intent order; never two heroes from one input | AI | Open |
| Thinking beat reads as slowness rather than effort | Medium | Low | Fixed ~600-1200ms; tuned on the demo hardware in US-043 | AI | Open |
| Rapid submits overlap and corrupt state | Medium | Medium | Debounced in US-028: a submit consumes the question through a mirrored ref and `busy` disables the field; three rapid Enters yield one call | AI | Mitigated |

---

## Progress Log

### 2026-09-09 — US-028 Persistent prompt bar (2 pts) ✅

`app/components/chrome/prompt-bar.tsx`, mounted by `app/root.tsx` through a new `promptBar` slot on
US-012's shell. 48 new tests (1441 green), coverage 99.82% stmts / 98.20% branches / 100% lines.

- **ONE field, no inner bordered box.** The search icon and the send button are siblings of the
  `<input>` inside the single bordered element; the focus ring is `:focus-within` on that same
  element and the input's own outline is suppressed, so focus reads as one ring around one field. A
  test walks the field's subtree and fails on any descendant carrying a border or a ring, so the
  defect review reported cannot return. The field deliberately does **not** wear `.fcb-chip` /
  `--radius-chip`: those stay with the segmented control and US-029's chips.
- **A real HTML `<form>` was used.** The reference build avoided one only because its sandbox
  swallowed submissions; here the browser's implicit submission makes Enter and the embedded button
  one code path rather than two hand-rolled ones. `preventDefault`, because there is nowhere to go.
- **Criterion 4 without a second clock.** A submit consumes the question: the cleared value is
  written to a mirrored ref *before* `onSubmit` runs (the same trick `useDashboard` uses for two
  presses in one frame), so a re-entrant submit reads an empty draft and takes the no-op branch, and
  `busy` disables both controls for US-031's beat. No `setTimeout` in the file, asserted.
- **Empty and whitespace-only input are no-ops** — not an error, not a fallback, nothing removed.
- **`fixed`, not `sticky`.** The shell clips sideways overflow, which makes it a scroll container as
  tall as the dashboard, so a sticky bar would settle at the bottom of the content. The canvas
  reserves the strip (`PROMPT_BAR_CLEARANCE_CLASS`) and the page keeps scrolling, which US-015's
  Reset and US-014's auto-scroll both depend on.
- **Security (the app's only user input):** the value is rendered solely as an input `value`, never
  as markup; no `dangerouslySetInnerHTML`/`innerHTML`, no URL, request, storage or selector built
  from it (the one selector is a fixed constant); an `<img onerror>` payload reaches the callback
  verbatim and creates no element. It will be matched against a fixed intent list in US-030 and
  discarded.
- **Seams left named:** `onSubmit` (US-030's matcher), `busy` (US-031), `children` (US-029's chip
  row), and `key={generation}` in `root.tsx` so Reset clears a half-typed question.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** Active (1/6 stories · 2/17 pts)
**Previous:** [Phase 2b](phase-2b.md) · **Next:** [Phase 3b — Heroes](phase-3b.md)
