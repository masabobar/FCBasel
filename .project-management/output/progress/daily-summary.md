# Daily Work Summary

**Date:** 2026-09-09 (Wednesday)
**Last Updated:** 2026-09-09

---

## Today's Summary

**Stories Completed:** 14 — **Phase 1a and Phase 1b complete; Phase 2a at 3/5 (partial)**
**Story Points:** 32
**Time Worked:** ~8.9 hours
**Files Changed:** 138
**Tests Added:** 592

---

## Work Log

- Project management setup: scope, backlog, docs, phases and tracking from the client documents.
- **US-001 — Environment & deployment setup.** React Router 7.18 framework mode with SSR scaffolded
  at the repo root (Vite 6, Tailwind v4, strict TypeScript), only the prototype's dependency set,
  Railway deploy config committed. Clean-checkout `install` / `build` / `start` verified by
  execution: HTTP 200 with SSR markup, no env var, no database. `pnpm audit` clean after
  overriding a vulnerable transitive `qs`.
- **US-002 — Developer tooling & local DX.** ESLint 9 flat config (TypeScript + React hooks) with
  `eslint-config-prettier` last, Prettier with `prettier-plugin-tailwindcss`, husky v9 +
  lint-staged. Every acceptance-criteria script was executed rather than assumed, and the hook was
  proven with throwaway commits later reset away: a lint error blocked the commit, a badly
  formatted file landed already formatted. All gates clean, 8/8 tests green.
- **US-003 — Design token set.** One token set, published twice on purpose: Tailwind v4 CSS custom
  properties in `app/app.css` (`@theme static`), and a typed object in `app/lib/tokens.ts` for the
  hand-built SVG charts. A parity test parses the stylesheet, resolves the `var()` aliases and
  fails on drift in either direction.
  Reference Guide values win on the three known divergences (surface `#F1F4F9`, text `#161A20`,
  positive variance `#0E9F6E`), and the Specification-only gold ring was not introduced. Colour
  discipline is encoded rather than documented — variance tokens as the only good/bad carriers,
  `varianceNegative` separate from `red`, gold restricted to two accent roles, each backed by a
  test. 96/96 green, coverage 100% of `app/**`, all gates clean.
- **US-004 — Self-hosted FCB crest.** The club serves the crest from a `.webp` URL that actually
  returns PNG bytes, so the download was inspected with `file` before anything was committed and
  stored under its real format as `public/fcb-crest.png`. 608x648 at 194 KB is ~90x more pixels than
  a 32px mark can show, so it was downsampled to 120x128 with macOS `sips` — no image dependency —
  and every ancillary chunk stripped; the asset is 17,908 bytes of `IHDR`/`IDAT`/`IEND`. `Crest`
  renders it with an accessible name and an aspect-ratio-derived width. The no-CDN criterion was
  proved rather than assumed: nothing in `build/` matches `fcb.ch`, both bundles reference the
  literal `/fcb-crest.png`, and the booted server returns HTML whose every `src`/`href` is
  root-relative. 106/106 tests green, coverage 100% of `app/**`.
- **US-005 — Tile card anatomy.** `Card` and `CardCaption` in `app/components/tiles/card.tsx`: the
  one shell that seven Phase 2b tile kinds and three Phase 3b heroes compose, so the prop set was
  designed for those eleven callers rather than for today. Slots, not variants — eleven optional
  props, each collapsing on its own and the header disappearing entirely when nothing would fill it,
  which is what lets an accent-only recommendation panel and a titled KPI tile share one
  implementation. `accent` takes a token name rather than a colour string, so the US-003 colour
  discipline is enforced by the type instead of by review; the title is a real heading; the caption
  strip is one muted line behind an `aria-hidden` AI glyph. `isNew` and `delayMs` are hooks only —
  US-006 owns the keyframes, and there is no gold ring and no glow. 38 tests added (144/144), 100%
  coverage of `app/**`, all gates clean.
- **US-006 — Tile-insertion motion & reduced-motion support.** The four keyframes the orchestrated
  reveal is built from, defined once in `app/app.css` and timed entirely from motion tokens: `fcbUp`
  (a new tile fades in while rising 12px over 400ms on the gentle insertion ease), `fcbGlow` (the
  ambient brand pulse for the sidebar dot and AI orbs — never an inserted tile), `fcbScan` (the
  thinking scan line) and `fcbSrc` (the source-chip reveal). `app/lib/motion.ts` holds the class
  names, so `TILE_ENTER_CLASS` derives from `MOTION_CLASS.enter` instead of repeating the string,
  and the entrance attaches to the card's existing `isNew`/`delayMs` hooks. The subtle criterion
  — nothing stuck at zero under reduced motion — is met by
  *collapsing* animations rather than removing them: `animation: none` would strand any element
  whose opening frame is `opacity: 0`, so the unlayered `prefers-reduced-motion` block gives every
  animation one ~1ms iteration and every transition ~1ms, landing each on its final value at once,
  and then restates each primitive's end state outright. Being unlayered it beats every cascade
  layer and Tailwind utility; written against `*` it will cover US-027's chart geometry before that
  exists. Smooth grid reflow uses a view transition, since CSS cannot transition a grid position;
  the update always runs, wrapped or not. 37 tests added (181/181), gates clean.

- **US-007 — Persona baseline datasets.** The first data story, so it sets the shape US-008 / US-009 /
  US-010 follow: enum keys in `app/lib/repositories/enums.ts`, domain types and the repository
  interface in `types.ts`, derived figures in `derive.ts`, fixtures plus the in-memory implementation
  in `app/lib/mock/baseline.ts`, and one line of selection in `index.server.ts` — recorded in the
  README as a four-step recipe. Per the user's approved decision the delivered set
  exceeds the written criteria: all four periods, not the single period the criteria describe. The
  headline webshop figure and its delta are **computed from the series** rather than stored, so the
  number cannot disagree with the chart under it; the two long periods take their x-axis labels from
  an injectable clock, so no test depends on the wall clock. A figure used twice is written once —
  last month's revenue series *is* this month's comparison series. Partner brand colours are brand
  colours: Bitpanda teal and Sunrise red sit outside the FCB palette on purpose, typed as plain
  strings and guarded by a test. 47 tests added (228/228), all gates clean.

- **US-008 — Hero 1 dataset: shirt sales, badges, printed names.** Mechanical, exactly as US-007
  predicted: `SEASON_TO_DATE` extends the shared `PeriodKey` (a new `KitVariant` enum joins it),
  domain types and `Hero1Repository`, derived figures, fixtures, one line of selection. Per the
  user's approved decision the delivered set
  exceeds the written criteria — all four periods, because the tile has a period switch. One hero
  object with `primary` and `followUp` so the tile and its escalation cannot drift, and a
  `scopeLabel` so the tile states what it covers, which matters when Hero 2 and Hero 3 quote
  different scopes in the same room. **Nothing derivable is stored:** kit revenue is units x CHF 99,
  the Home share is 22,400/38,500 = 58.18% shown as 58%, the badge share exactly 8% — the Guide's
  `homeShare: 58` deliberately did not survive the port. `badgeSegments` corrects its rounding
  remainder into Bitpanda's segment, proved exhaustively: the four parts sum *exactly* to the total
  for every total from 0 to 2,000, the four real period totals and adversarial primes. Both
  narratives are verbatim, checked by SHA-256. The guardrail is tested: squad names exist only as
  print counts, and no salary, goals, assists, minutes or rating appears anywhere (273/273).
- **US-009 — Hero 2 dataset: ticket revenue year on year.** Eight home fixtures in CHF thousands
  (7,880 -> 7,830) plus the twelve-month series the Reference Guide adds beyond the Specification,
  as one `Hero2` object with `primary` and `followUp`. The story's real risk was labelling, not
  arithmetic: the two charts sit at deliberately different scopes — eight highest-grossing fixtures
  against all home fixtures per month (9,880 -> 9,770) — so `scopeLabel` is a field on each series
  and tests assert the labels exist, differ, and that the monthly total is the larger one. Nothing
  derivable is stored: the Guide's `totalPrev`, `totalCurr`, `deltaPct` and second `declines` list
  did not survive the port, so the headline -0.6% comes from the same `seriesTotals` the baseline
  band uses, and FCZ -150 / Lugano -110 / Luzern -70 / Sion -70 and the -CHF 400k badge are
  recovered from the fixture pairs. Both narratives verbatim, pinned by text and length (304/304).
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
  "figures in CHF millions" subtitle. The locale
  decision was made deliberately and documented: `Intl.NumberFormat("en-CH")` per the Reference
  Guide, which groups thousands with the Swiss U+2019 mark rather than a comma — pinned as a
  constant and made independent of the runtime's ICU by rewriting whatever separator ICU actually
  produced, which two tests prove by stubbing `Intl` to `en-US` and `de-DE`. `oneDecimal` was made
  public in `derive.ts` and imported rather than restated, so there is exactly one rounding rule,
  and `chfFromThousands` is the only factor of 1000. Variance carries its meaning through the sign
  plus a `VarianceDirection` enum rather than through colour, and tabular numerals stay in the token
  layer. The reconciliation suite then asserts relationships rather than restating
  constants: kit units summing to 38,500 with the Home share at 58.18% -> 58% and the badge at
  exactly 8.00%, badge segments summing to their period total in all four periods, the fixture fall
  of 50 becoming -0.6% with declines of 150+110+70+70 = 400, monthly totals larger than fixture
  totals *on purpose*, and 69,000 -> 69,680 = +680 -> +1.0% with Marketing's three drivers summing
  to exactly its 410 variance. The one intended cross-hero inequality is asserted as such
  (Ticketing 24,360 exceeds Hero 2's 7,830, both scope-labelled), store-once is asserted
  structurally by pinning each hero's stored key set, and every number in all six narratives is swept
  against the figures the data can produce — with only two documented narrative-only exceptions.
  **No drift was found in any dataset.** 70 tests added (418/418 green), coverage 100% statements /
  98.9% branches of `app/**`, and lint / format / typecheck / build all clean.

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
- **Phase 2b — the component library (US-017 to US-027)** is next. It unblocks the two deferred
  Phase 2a stories: US-013 needs US-017 + US-021, US-016 needs US-025/026/027. Complete both **in
  that run** rather than reopening Phase 2a later.

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
- Phases 1a and 1b are complete and Phase 2a is at 3/5 (32/116 points); continue with
  `/holycode-pm:execute-work phase 2b`, finishing US-013 and US-016 inside that run.
- **Reset's seams are recorded in code, not just here:** US-029's chips should be *derived* from
  `useDashboard`'s `sections` and US-031's thinking beat *scheduled* through its `schedule`, so
  neither story needs reset logic of its own.
- The shell keeps two guardrails as *tests*, not comments: the app bar's whole text must equal the
  known role labels (so no personal name can appear), and the connection status file must contain no
  `fetch`, `axios`, `useEffect` or timer (so it cannot become a live health check).

---

**Auto-Generated** | Updates during `/execute-work` | Archives daily
