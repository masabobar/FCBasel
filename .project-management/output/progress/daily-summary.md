# Daily Work Summary

**Date:** 2026-09-09 (Wednesday)
**Last Updated:** 2026-09-09

---

## Today's Summary

**Stories Completed:** 16 — **Phase 1a and Phase 1b complete; Phase 2a at 3/5 (partial); Phase 2b
at 2/11**
**Story Points:** 37
**Time Worked:** ~10.0 hours
**Files Changed:** 162
**Tests Added:** 722

---

## Work Log

- Project management setup: scope, backlog, docs, phases and tracking from the client documents.
- **Phase 1a — US-001 to US-006 (14 pts), closed.** Condensed here to keep this file inside its
  300-line limit; the full account is in [`completed.md`](completed.md) and
  [`../phases/phase-1a.md`](../phases/phase-1a.md). In short: the React Router 7.18 SSR scaffold with
  the prototype's dependency set and a clean-checkout install/build/serve verified by execution
  (US-001, Railway deploy still a human step); ESLint 9 + Prettier + husky with the pre-commit hook
  *proved* to fire (US-002); one design-token set published as Tailwind v4 `@theme static` properties
  and as typed objects, held in lockstep by a drift test, with colour discipline encoded in the token
  names (US-003); the crest self-hosted after verifying its bytes were PNG despite the `.webp` URL,
  downsampled with `sips` and with no `fcb.ch` reference left anywhere (US-004); one `Card` shell of
  independently collapsing slots that every 2b tile and 3b hero composes (US-005); and the four
  reveal keyframes plus `app/lib/motion.ts`, where **reduced motion renders final state rather than
  switching animation off** — the principle US-027 later restated in JavaScript (US-006).
- **US-007 — Persona baseline datasets.** The first data story, so it sets the shape US-008 / US-009 /
  US-010 follow: enums, domain types and the repository interface in `app/lib/repositories/`,
  fixtures and the in-memory implementation in `app/lib/mock/`, one line of selection in
  `index.server.ts` — recorded in the README as a four-step recipe. Per the user's approved decision
  the delivered set exceeds the written criteria (all four periods). The headline webshop figure and
  its delta are **computed from the series**, so a number cannot disagree with the chart under it; a
  figure used twice is written once (last month's series *is* this month's comparison series); the
  long periods label their x-axis from an injectable clock. Partner brand colours stay outside the
  FCB palette on purpose, guarded by a test. 47 tests added (228/228), all gates clean.

- **US-008 — Hero 1 dataset: shirt sales, badges, printed names.** Mechanical, exactly as US-007
  predicted, and again exceeding the written criteria by the user's approved decision. One hero
  object with `primary` and `followUp` so a tile and its escalation cannot drift, plus a `scopeLabel`
  per series. **Nothing derivable is stored:** kit revenue is units x CHF 99, the Home share 58% and
  the badge share exactly 8% — the Guide's `homeShare: 58` did not survive the port. `badgeSegments`
  corrects its rounding remainder so the four parts sum *exactly* to the total, proved for every
  total from 0 to 2,000 and adversarial primes. Narratives verbatim by SHA-256, and the guardrail is
  tested: squad names exist only as shirt-print counts (273/273). Full detail in
  [`completed.md`](completed.md).

- **US-009 — Hero 2 dataset: ticket revenue year on year.** Eight home fixtures in CHF thousands
  (7,880 -> 7,830) plus the twelve-month series the Reference Guide adds beyond the Specification.
  The real risk was labelling, not arithmetic: the two charts sit at deliberately different scopes
  (eight highest-grossing fixtures against all home fixtures per month, 9,880 -> 9,770), so
  `scopeLabel` is a field on each series and tests assert the labels exist, differ, and that the
  monthly total is the larger. Nothing derivable is stored — the Guide's `totalPrev`, `totalCurr`,
  `deltaPct` and second `declines` list did not survive the port, so the headline -0.6%, the four
  declines and the -CHF 400k badge all come off the fixture pairs. Narratives verbatim (304/304).

- **US-010 — Hero 3 dataset: departmental performance.** Six departments in CHF thousands
  (69,000 -> 69,680, +680 / +1.0% derived) as one `Hero3` object with `primary` and `followUp`. The
  new idea here is that a TAG carries the meaning of a number: above budget is money earned for the
  five revenue departments and an **overspend** for the Marketing cost centre, so `DepartmentType`
  and `VarianceJudgement` are enums, `varianceJudgement` decides good-or-bad once from the type, and
  every row carries the verdict as data — Marketing's +410 comes back `ADVERSE` where Sponsoring's
  +840 comes back `FAVOURABLE`. Both directions are tested, and one test proves that a naive
  "variance > 0 is good" rule would misread exactly one department, which is the failure the tag
  exists to prevent. Marketing being the only department both over budget *and* behind target is
  derived by `departmentsNeedingAttention` rather than read from the Guide's `flag: true`. Totals
  are derived through the same `percentChange` the baseline band uses (a single `oneDecimal`
  rounding rule); the one stored figure is `blendedTargetPercent: 96`, a measured club-level
  attainment that no arithmetic over the six rows reproduces, pinned by test so it cannot be
  "fixed" into a mean. The follow-up reconciles with the table: 240 + 150 + 20 = 410, exactly
  Marketing's derived variance. The scope label states that Ticketing includes the season-ticket
  base, which is why its 24,360 exceeds Hero 2's 7,830. Guardrail held on the dataset closest to
  the line — departments, never people. 44 tests added (348/348), all gates clean.

- **US-011 — Formatters & cross-hero reconciliation.** Phase 1b closes with the two things that keep
  the other four data stories honest. `app/lib/format.ts` is the one place a number becomes a
  string: money always carries `CHF` (no bare-amount variant to reach for), the sign goes *before*
  the unit as the declining-fixtures badge reads (`-CHF 400k`), and millions render bare under the
  "figures in CHF millions" subtitle. The locale decision was made deliberately and documented:
  `Intl.NumberFormat("en-CH")` per the Reference Guide, which groups thousands with the Swiss U+2019
  mark — pinned as a constant and made independent of the runtime's ICU by rewriting whatever
  separator ICU actually produced, which two tests prove by stubbing `Intl` to `en-US` and `de-DE`.
  `oneDecimal` is imported from `derive.ts` rather than restated, so there is exactly one rounding
  rule, and `chfFromThousands` is the only factor of 1000. Variance carries its meaning through the
  sign plus a `VarianceDirection` enum rather than through colour. The reconciliation suite then
  asserts relationships rather than restating constants — kit units to 38,500 with the Home share at
  58.18% -> 58% and the badge at exactly 8.00%, the fixture fall of 50 becoming -0.6% with declines
  of 150+110+70+70 = 400, 69,000 -> 69,680 = +680 -> +1.0% with Marketing's three drivers summing to
  exactly its 410 variance, the intended cross-hero inequality asserted *as* intended (Ticketing
  24,360 exceeds Hero 2's 7,830, both scope-labelled), store-once pinned per hero, and every number
  in all six narratives swept against what the data can produce, with two documented exceptions.
  **No drift was found in any dataset.** 70 tests added (418/418), all gates clean.

- **US-012 — Branded application shell.** `app/components/chrome/{sidebar,top-bar,app-shell}.tsx`
  plus `app/lib/persona.ts`: the navy sidebar (hidden below `lg`), the app bar carrying the
  US-004 crest, the workspace label, a decorative connection status and Reset, and a responsive
  canvas grid that steps 12 → 8 → 4 columns. `app/root.tsx` now mounts the shell around
  `<Outlet />` and `app/routes/_index.tsx` shrinks to the screen's `h1`, so the routed page renders
  as grid items and a hero inserted later joins the same grid. The canvas is deliberately **empty** —
  the four baseline tiles are US-013, insertion is US-014.
  Three things were made structural rather than trusted. **The persona is a role:** the label and
  the "SM" monogram live in one module and a test asserts the app bar renders no text beyond those
  labels; the crest is the only `<img>`. **The placeholder items are inert by construction:** plain
  `<span aria-disabled="true">`, no href, no role, no handler, no focus, `pointer-events-none` —
  Chrome reports `tabIndex` -1 on all three, a synthesised click leaves the router at `/`, and a
  source guard bans a `hover:` rule. **The connection status is decorative:** static text,
  `data-decorative`, no live region, and source assertions that the file holds no `fetch`, `axios`,
  `useEffect` or timer. Verified in Chrome at 1920×1080 (and 1280 / 900 / 390): no horizontal
  scroll, the sidebar leaves at 900, the grid steps down as designed. 475/475 green, all gates
  clean. Security triage: no security-relevant changes.
- **US-014 — Dynamic tile insertion & grid reflow.** The mechanic the demo turns on: the dashboard
  **grows, it never clears**. The session is a memory-only list of `{heroId, phase, revision}` —
  pure transitions in `app/lib/dashboard/sections.ts`, React state in `use-dashboard.ts`, owned by
  `root.tsx` so the canvas and the app bar share one source. Sections are **direct children of the
  US-012 canvas grid**, re-using its tracks via `grid-cols-subgrid` — still exactly one grid
  (Chrome: canvas tracks 122.656px, placeholder tiles 816px at x=256 and x=1088).
  Re-asking a hero **refreshes in place** — one section, original position, `revision` bumped so
  the React key changes and the section re-inserts — and a follow-up **flips** its parent's phase
  rather than appending, which is what US-033 inherits. Reflow runs through US-006's
  `animateReflow` with `flushSync` inside the transition callback; real Chrome shows
  `::view-transition-group(fcb-tile-HERO_1)` animating as a second section inserts, and the newest
  section is scrolled into view (`scrollY` 0 → 154 at 1280×620, focus never moved). Under
  `prefers-reduced-motion` Chrome recorded zero view transitions and an identical final layout.
  Hero content is a clearly marked placeholder; a source scan over `app/**` bans every storage
  API. 77 tests added, 552/552 green.
  **Phase 2a now 2/5 stories, 6/16 points.**
- ✅ US-015 — Reset to baseline (2 pts) — **3 of 5 acceptance criteria fully met; criterion 2
  (suggestion chips) and half of criterion 4 (the thinking beat) are a SEAM pending US-029/US-031,
  and criterion 1's four baseline tiles are US-013 (deferred).** Reset restores a *named baseline*,
  never a literal empty list; it cancels the pending timer **first** (proven by deleting that line
  and watching two tests fail), and ten presses in one frame run one view transition.
  **Phase 2a now 3/5 stories, 8/16 points — the phase stays open.**
- **US-015 — Reset to baseline.** The control that lets the demo be run twice, built as a
  **transition beside the other three** rather than a mode: `withBaselineRestored` and the named
  `BASELINE_SECTIONS` in `sections.ts`, `reset` / `schedule` / `generation` on `use-dashboard.ts`,
  `scrollToTop` in `motion.ts`, `<AppShell onReset={reset}>` in `root.tsx` — one implementation, and
  the US-012 button finally acts. **Reset restores a named baseline, never a literal empty list:**
  that constant is *also* the hook's initial state, so US-013 lists its four tiles there once and
  load-state and reset-state stay identical for free. **The pending timer is the story.** `reset`
  calls `cancelPending()` first, before it touches state; deleting that one line makes two tests
  fail with `expected [ { heroId: 'HERO_2', … } ] to deeply equal []` — the thinking beat dropping
  an answer into a dashboard the presenter had just cleared. Abuse-proofing is structural:
  `withBaselineRestored` returns the *same list reference* when there is nothing to clear, so ten
  presses in one frame run **one** view transition and a press on an empty canvas runs none. Real
  Chrome (1280×620): from `scrollY` 900, three rapid presses land at 0 with three scroll requests
  and **zero** `startViewTransition` calls; under `prefers-reduced-motion` all three asked for
  `behavior: "auto"`. **Two criteria are honestly a seam, not a claim** — the chips are US-029
  (derive the row from `sections`) and the thinking beat is US-031 (schedule it through
  `schedule`). 40 tests added, 592/592 green. **Phase 2a now 3/5 stories, 8/16 points — and it
  stays open: US-013 and US-016 are deferred to the Phase 2b run.**
- **US-027 — Motion & animation hooks.** Phase 2b opens with the story every other component in it
  depends on: `useReducedMotion`, `useGrow`, `useCountUp`, `useUid` in
  `app/lib/hooks/use-motion.ts`, the consumer API documented in the module header so the next ten
  stories are composition rather than invention. **Count-up counts from the figure on screen, not
  from zero** — the displayed value is mirrored in a ref, and a test proves a target changed
  mid-flight opens the new animation *on that very figure*, climbs monotonically, never dips and
  lands exactly on target, both directions. **Reduced motion means final state in the same render:**
  `useGrow` is `true` on the first render with **zero** frames requested, so `width={grown ? w : 0}`
  geometry is never stranded. One reduced-motion source (US-006's `REDUCED_MOTION_QUERY` via
  `useSyncExternalStore`), every rAF/timer/listener cancelled on unmount, ~900ms promoted to the
  `duration.countUp` token, SSR *proven* by `renderToString` plus a real `hydrateRoot` pass. Full
  account in [`completed.md`](completed.md). 52 tests added, 644/644 green.
- **US-017 — KPI tile & variance chip.** The first component built on those hooks, and the shape the
  other nine follow. Three exports so nothing is forked later: `DeltaChip` in its own module
  (US-019, US-022 and US-016 want the chip without a tile), plus `KpiSparkline`, `KpiFigure` and
  `KpiTile`. **The chip is where "colour is never the sole signal" stops being a slogan.** Direction
  is carried four independent times — the glyph, the explicit `+`/`-` from `formatSignedPercent`, an
  `sr-only` word, and only then the token colour — and the `light` variant is the proof: on the navy
  band the negative token sits near 2:1 and is illegible at 13px, so that variant drops colour
  coding altogether and a test asserts the up and down chips' class strings are **identical** while
  glyph, sign and spoken word still differ. Red never means "bad" (a test rejects `text-red` on the
  chip) and a zero is a **labelled zero** in the neutral treatment, not a variance token.
  **Direction is arithmetic, judgement is meaning:** an optional `judgement` prop from US-010's
  `varianceJudgement` draws Marketing's overspend as an up arrow in the *negative* token, so the
  chip never re-derives good/bad from a sign. One API carries all three consumers with **no variant
  per hero** — hero extras arrive as `children`, and US-016's navy band composes `KpiFigure onDark`,
  which forces the light chip so nobody can leave an illegible red figure on navy. Nothing was
  reinvented: the number is the existing `.kpi-number` role class and the motion is US-027's, with a
  test grepping the source to fail on any local `useState`, timer or rAF. The sparkline draws itself
  with `pathLength="1"` and a dash offset and paints with `currentColor`, so no hex can be passed in;
  empty, flat and single-point series are handled rather than left to emit `NaN`. **The US-012
  `tailwind-merge` trap is closed at the root** — `app/lib/cn.ts` declares the named type scale as a
  font-size group, derived from the token set — and the frame/preference stubs moved to
  `tests/unit/support/motion-harness.ts` for the nine stories still to come. **No browser pass,
  stated plainly:** nothing mounts these components yet, so US-013 owns that. 78 tests added,
  722/722 green.
---

## Stories Completed Today

- ✅ US-001 — Environment & deployment setup (3 pts) — 4/5 acceptance criteria met; the Railway
  deploy AC is deferred to the human.
- ✅ US-002 — Developer tooling & local DX (2 pts) — all 4 acceptance criteria met and verified by
  execution, including the pre-commit hook.
- ✅ US-003 — Design token set (3 pts) — all 6 acceptance criteria met; CSS and TypeScript halves
  held in lockstep by a drift test.
- ✅ US-004 — Self-hosted FCB crest (1 pt) — all 3 acceptance criteria met; the asset's real format
  was verified from its bytes and the absence of any `fcb.ch` reference proved against the build and
  the running server.
- ✅ US-005 — Tile card anatomy (2 pts) — all 4 acceptance criteria met; one reusable shell, no
  per-hero copies, no hardcoded colour, and the entrance hooks US-006 will attach to.
- ✅ US-006 — Tile-insertion motion & reduced-motion support (3 pts) — all 5 acceptance criteria met;
  fade-and-rise only, and reduced motion renders final state rather than switching animation off.
  **Phase 1a closes here: 6/6 stories, 14/14 points.**
- ✅ US-007 — Persona baseline datasets (2 pts) — all 4 acceptance criteria met and deliberately
  exceeded (all four periods, per the user's approved scope decision). Phase 1b: 1/5 stories.
- ✅ US-008 — Hero 1 dataset: shirt sales, badges, printed names (2 pts) — all 5 acceptance criteria
  met and deliberately exceeded (all four periods, per the user's approved scope decision).
- ✅ US-009 — Hero 2 dataset: ticket revenue year on year (2 pts) — all 5 acceptance criteria met and
  deliberately exceeded (the twelve-month series, per the user's approved scope decision).
- ✅ US-010 — Hero 3 dataset: departmental performance (2 pts) — all 5 acceptance criteria met,
  including the derived Revenue/Cost judgement and the derived over-budget-and-behind-target flag.
  Phase 1b: 4/5 stories.
- ✅ US-011 — Formatters & cross-hero reconciliation (2 pts) — all 6 acceptance criteria met; one
  shared display layer, one rounding rule, and a reconciliation suite that found **no drift**.
  **Phase 1b closes here: 5/5 stories, 10/10 points.**
- ✅ US-012 — Branded application shell (3 pts) — all 5 acceptance criteria met, and the two easy
  ones to fake were measured in a real browser: the placeholder nav items come back `tabIndex` -1
  with `pointer-events: none`, and `scrollWidth === clientWidth` at 1920×1080.
  **Phase 2a opens here: 1/5 stories, 3/16 points.**
- ✅ US-014 — Dynamic tile insertion & grid reflow (3 pts) — all 7 acceptance criteria met: dedupe
  by hero id proven in unit tests and in real Chrome, a follow-up flips its parent's phase, the
  reflow tween observed animating, auto-scroll measured, and no storage API anywhere.
  **Phase 2a now 2/5 stories, 6/16 points.**
- ✅ US-015 — Reset to baseline (2 pts) — 3 of 5 acceptance criteria fully met; the chips (US-029)
  and the thinking beat (US-031) are recorded as seams rather than claimed.
  **Phase 2a partial: 3/5 stories, 8/16 points, left open.**
- ✅ US-027 — Motion & animation hooks (3 pts) — all 4 acceptance criteria met, including the two
  subtle ones: count-up continues from the current displayed value, and nothing is stranded at zero
  under reduced motion. **Phase 2b opens here: 1/11 stories, 3/29 points.**
- ✅ US-017 — KPI tile & variance chip (2 pts) — all 3 acceptance criteria met; the delta chip's
  meaning survives with the colour removed, and the named-size/colour `tailwind-merge` trap is closed
  for every component after it. **Phase 2b now 2/11 stories, 5/29 points.**

---

## Stories In Progress

*None*

---

## Open Human Step

- **Deploy to Railway** (US-001, the remaining AC). The repo is deploy-ready. Run
  `railway login && railway init && railway up`, open the URL in Chrome, then record it in
  `output/phases/phase-1a.md` and the backlog entry.

---

## Next Day Plan

**Immediate Focus:**
- **Phase 2a is done for now at 3/5 stories, 8/16 points** — US-012, US-014, US-015 built. It is
  deliberately left open, not closed.
- **Phase 2b — the component library** is under way: the motion hooks (US-027) and the KPI tile
  (US-017) are done. Next is **US-021 — Horizontal bar tile (3 pts)**, then US-013, US-025, US-026,
  US-016 and the rest of the charts. Every one of them should import from
  `app/lib/hooks/use-motion.ts` rather than animate by hand, and compose `Card` and `DeltaChip`
  rather than restate them — US-023 in particular must reuse US-021's bar row.

**Priority Stories for This Week:**
1. Phase 1a + 1b — foundations (24 pts): tokens and seed data, which everything else reads from
2. Phase 2a + 2b — shell and component library (45 pts): the largest block
3. Phase 3a + 3b — conversation and the three heroes (33 pts): the demo itself

---

## Notes

- **The deadline is this week.** Sponsor showing first, owner audience the following week.
- Estimated ~52 AI-core hours / ~68 AI-realistic hours for the full 116 points.
- If the week gets tight, extend daily runtime before cutting scope — the entire P1 cut set is worth
  only ~0.82 days at 8h/day.
- Phases 1a and 1b are complete, Phase 2a is at 3/5 and Phase 2b at 2/11 (37/116 points); continue
  with `/holycode-pm:execute-work phase 2b`, finishing US-013 and US-016 inside that run.
- **The motion hooks are the shared contract for Phase 2b:** `useCountUp` from the current value and
  `useGrow`'s reduced-motion short-circuit are what keep ten charts consistent. A component that
  reimplements either is a review finding, not a style choice.
- **Two shared pieces US-017 left for the rest of the phase:** `DeltaChip` is the *only* variance
  chip (US-019's per-pair chips and US-022's variance column import it, judgement passed in), and
  `app/lib/cn.ts` now protects named size tokens — but only through `cn`, so a component that hand
  writes `class="text-caption text-muted"` outside it is still on its own.
- **Reset's seams are recorded in code, not just here:** US-029's chips should be *derived* from
  `useDashboard`'s `sections` and US-031's thinking beat *scheduled* through its `schedule`, so
  neither story needs reset logic of its own.
- The shell keeps two guardrails as *tests*, not comments: the app bar's whole text must equal the
  known role labels (so no personal name can appear), and the connection status file must contain no
  `fetch`, `axios`, `useEffect` or timer (so it cannot become a live health check).

---

**Auto-Generated** | Updates during `/execute-work` | Archives daily
