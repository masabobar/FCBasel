# Phase 3a: Conversational Interface & Interaction Model

**Duration:** 2026-09-12 to 2026-09-13 (~8.7 AI-hours)
**Status:** Active (3/6 stories)
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

**Priority:** P0 · **Status:** In Progress (3/6 · 10/17 pts) · **Dependencies:** US-003, US-006, US-014

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-028 | Persistent prompt bar | 2 | ✅ Completed |
| US-029 | Suggestion chips & chip lifecycle | 3 | ✅ Completed |
| US-030 | Intent normalisation, scoring & tie-breaking | 5 | ✅ Completed |
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
- **Completed Story Points:** 10 / 17 (59%)
- **Completed Stories:** 3 / 6
- **Tests Passing:** 1587 / 1587 · **Coverage:** 100% lines (`app/**`) · **Commits:** 3

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
| A paraphrase the owner uses fails to match | High | Medium | Generous keyword sets; 8-14 phrasings tested per hero in US-030; fallback always catches | AI | Mitigated |
| A follow-up steals its parent hero's phrasing | High | Medium | Threshold 3 vs 2, plus heroes ordered first so a tie goes to the hero; both pinned | AI | Mitigated |
| Two intents score equally and both render | High | Low | Strictly-greater comparison over an ordered config; three-way tie and corpus-wide single-match invariant asserted | AI | Mitigated |
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

### 2026-09-09 — US-029 Suggestion chips & chip lifecycle (3 pts) ✅

`app/lib/dashboard/chips.ts` (the derivation, pure) + `app/components/chrome/suggestion-chips.tsx`
(the row), wired in `app/root.tsx` through US-028's `children` slot. 57 new tests (1498 green),
coverage 99.82% stmts / 98.22% branches / 100% lines.

- **THE ROW IS DERIVED, NOT STORED — the decision the whole story rests on.**
  `suggestionChips(sections)` is a pure function: the three hero chips always, plus one follow-up
  chip per section still at `PRIMARY`. There is no chip state anywhere, so criterion 3's "removed
  once that follow-up has been shown" is not implemented at all — the phase flip stops the chip
  being derived. Proved as a function over **all 27** combinations of three heroes ×
  {absent, primary, withFollowUp}, plus non-mutation, fresh-array and no-`let`/no-`useState` checks.
- **US-015 CRITERION ② IS NOW SATISFIED, through its own seam and with no reset code touched.**
  Reset restores `BASELINE_SECTIONS`, the derivation runs again, and the row is exactly the three
  hero chips with every follow-up gone. Driven end to end on the real `App`: chips tapped,
  follow-ups taken, Reset pressed → three hero labels, zero follow-up chips, zero sections; the row
  is usable again immediately afterwards. `phase-2a.md` / `phase-2a-shell.md` updated.
- **A chip tap BYPASSES scoring, by type and not by discipline.** `selectChip(chip, actions)` takes
  a `SuggestionChip` and reads its `heroId`; US-030's matcher will take a `string` through
  `onSubmit`. Two paths that meet only at `showHero` / `showFollowUp`. A source scan fails on
  `score|threshold|keyword|normalis|tie-break|toLowerCase` anywhere in the chip module, and a
  `@ts-expect-error` case fails typecheck if the argument ever loosens to `string`.
- **Nothing about the chip surface was restated.** The row imports `CHIP_SURFACE_CLASS` from
  US-026's segmented control; the 11px radius and the one-pixel lift stay in the shared `.fcb-chip`
  rule, and the component contains no `11px`, no `radius-chip`, no `rounded-full`/`rounded-pill` and
  no transition of its own (reduced motion is the stylesheet's global block). Only the TINT is new:
  a closed table keyed by chip kind, gold for the follow-up variant — a wash and a border, never a
  fill, and still no gold ring.
- **Kind is not carried by colour alone:** a follow-up chip also wears the trend glyph and a
  visually hidden "Follow-up:" in its accessible name. Plain buttons, one tab stop each, no roving
  tabindex and no trap — Tab walks the row and continues into the field; Enter and Space activate.
  Labels render verbatim: no truncation, no re-casing, and `whitespace-nowrap` is deliberately
  absent so a long label wraps instead of pushing the row past the shell's clipped overflow.
- **Security triage: no security-relevant changes detected.** No new user input (the chip carries a
  hero id from a closed enum, not text), no URL, request, storage or `innerHTML`, no dependency
  change, no endpoint. The one user input in the product is still US-028's field.
- **Seams left:** the derived row is the state US-033 will read for typed-input gating, and
  `onSubmit` / `busy` are still untouched for US-030 / US-031.

### 2026-09-09 — US-030 Intent normalisation, scoring & tie-breaking (5 pts) ✅

`app/lib/dashboard/intents.ts` (config + normalise + score + match + the `askQuestion` seam), wired
in `app/root.tsx` to US-028's `onSubmit`. 89 new tests (1587 green), coverage 100% lines, 99.83%
stmts / 98.26% branches.

- **THE REFERENCE ALGORITHM WAS PORTED FAITHFULLY AND PINNED, per the approved decision.** normalise
  (lowercase, strip `/.,?!'"()`, collapse whitespace, trim, pad) → +2 strong / +1 weak → threshold 2
  hero / 3 follow-up → **strictly-greater** comparison over an ordered config, so a tie resolves to
  the earlier intent. A test re-implements the reference formula as an **oracle** (redundant disjunct
  included) and asserts identical scores *and* identical winners across a 90-phrase corpus, so the
  port is verified rather than trusted. `25/26` → `2526` preserved.
- **Two inherited rough edges are DOCUMENTED AND PINNED AS THE CURRENT CONTRACT**, with a comment
  saying tightening them is a deliberate future decision: strong keywords match a word **prefix**
  (`kit` hits `kitchen`, `gate` hits `gateway` — each a full 2), weak keywords match **any
  substring** (`over` hits `overall`/`recover`, `name` hits `nameplate`). The same leniency is what
  makes `kits`, `kit-sales` and `shirts?` resolve with no keyword of their own, and the 1-point weight
  keeps a stray substring below every threshold (`recover the nameplate` → no match).
- **Paraphrase tolerance is the acceptance, so it is table-driven:** 14 phrasings for Hero 1
  (including the three named — `kit sales`, `how are shirts selling`, `trikot`), 10 for Hero 2, 10 for
  Hero 3. Each canonical chip label resolves to its own hero with an asserted **margin** over that
  hero's follow-up (8 vs 4, 4 vs 0, 10 vs 1), so the prepared question can never read as the
  deep-dive. The loose `why is marketing high?` edge lands on Hero 3's follow-up at **exactly 3**
  while Hero 3's primary scores 0.
- **Tie-break proven, not asserted:** `kit gate` (2/2 → Hero 1), `trikot budget` (Hero 1 over Hero
  3), `ticket budget` (Hero 2 over Hero 3), `shirt ticket budget` (**three-way** 2/2/2 → Hero 1), and
  two hero-vs-own-follow-up ties (`budgets marketing why` 4/4, `which fixtures matchday` 5/5) that go
  to the hero. `over target` carries both threshold halves on one input: 2 matches the hero, the same
  2 does not match the follow-up. Corpus-wide invariant: the return is one `{heroId, kind}` or `null`
  — never two heroes.
- **`sales` alone resolves to nothing** (1 < 2), like nine other lone common words; off-script,
  gibberish, empty and whitespace all fall through to `null`, which is US-032's input and not an
  error.
- **The chip path was not touched.** `askQuestion` takes a `string`, `selectChip` takes a chip, and a
  `@ts-expect-error` case in each suite fails typecheck if either seam loosens. US-029's source scan
  still passes.
- **Golden rule enforced by scan:** the module imports only `../repositories/enums` and `./chips`
  (asserted exactly), and contains no `fetch`/`WebSocket`/`axios`, no model, embedding or fuzzy-match
  reference, no `new RegExp`, no SQL, no `eval`/dynamic `import()`; `package.json` is unchanged and
  scanned for AI/fuzzy-match packages.
- **Security triage — A03 user-input trigger FIRES and is covered.** The typed string is lowercased
  into a local, tested against the fixed keyword list with `String.includes`, and discarded; only a
  `HeroId` and a `ChipKind` escape. It never becomes markup, a URL, a query, a DOM selector, a
  storage key, a React key or a log line (all scanned), and no regex is built from it, so no pattern
  injection. An `<img onerror>` payload scores 0 everywhere, returns `null` and creates no element on
  the real `App`.
- **Seams left:** `askQuestion` returns the match so US-032 can hang the fallback on `null`, and
  `INTENT_REQUIRES_PARENT` is the parent-gating flag US-033 reads. `busy` is still untouched
  (US-031).

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** Active (3/6 stories · 10/17 pts)
**Previous:** [Phase 2b](phase-2b.md) · **Next:** [Phase 3b — Heroes](phase-3b.md)
