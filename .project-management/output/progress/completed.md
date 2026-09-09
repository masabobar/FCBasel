# Completed Work Log

**Last Updated:** 2026-09-09

---

## Summary

**Total Completed:** 13 stories
**Total Points:** 30 / 116
**Start Date:** 2026-09-09
**Days Active:** 1
**Average Velocity:** 30 points/day
**Phases Completed:** Phase 1a, Phase 1b (both 2026-09-09)

---

## Completed Stories

### US-001: Environment & deployment setup (3 pts)
**Completed:** 2026-09-09
**By:** AI (Railway deploy step remains with the human)
**Files Changed:** 21 (16 code/config, 5 tracking docs)
**Tests Added:** 8 (unit: 8)
**Commit:** see phase-1a progress log
**Notes:** 4 of 5 criteria verified by execution; the Railway deploy AC is **deferred to the human**.

**What Was Done:** *(full detail in the phase-1a progress log)*
- React Router 7.18 in framework mode with SSR, Vite 6, Tailwind v4, strict TypeScript, and only
  the prototype's dependency set (no Prisma, msw, Recharts, TanStack Table, PDF/email, i18n)
- Railway deploy config committed; verified from a **clean checkout** that install, build and a
  production server return HTTP 200 with SSR markup, no env var, no database. Two moderate `qs`
  advisories cleared with a pnpm override; `pnpm audit` clean

### US-002: Developer tooling & local DX (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 13 (8 code/config, 5 tracking docs)
**Tests Added:** 0 (tooling config carries no behaviour worth a hollow test; the existing 8 stay green)
**Commit:** see phase-1a progress log
**Notes:** All 4 acceptance criteria met and verified by execution, including the pre-commit hook.

**What Was Done:**
- ESLint 9 flat config (TS + React hooks, `eslint-config-prettier` last), Prettier with
  `prettier-plugin-tailwindcss`, and the `lint` / `format` scripts
- Wired husky v9 + lint-staged and **proved the hook fires** with throwaway commits later reset:
  a lint error blocked the commit; a badly formatted file landed already formatted. All gates clean

### US-003: Design token set (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 (3 code, 5 tracking docs)
**Tests Added:** 88 (unit: 88)
**Commit:** see phase-1a progress log
**Notes:** All 6 acceptance criteria met. Guide precedence applied to the three known divergences:
surface `#F1F4F9`, text `#161A20`, positive variance `#0E9F6E`. No new-tile gold ring introduced.

**What Was Done:** *(full detail in the phase-1a progress log)*
- The colour, type, spacing, radii, shadow and motion set defined once as Tailwind v4 custom
  properties in `app/app.css` (`@theme static`) and mirrored as a typed object in `app/lib/tokens.ts`
  for the SVG charts, guarded by a parity test that resolves `var()` aliases
- Colour discipline encoded in the token *names* (series identity, variance as the only good/bad
  carriers, gold restricted to two accent roles), each asserted by a test, with `varianceNegative`
  separate from `red` so red can never drift into meaning "bad"
- Typography roles (`.tile-title`, `.kpi-number`, `.chart-axis-label`, `.narrative-caption`) so
  US-005 references a role, never the type spec. All gates clean (96/96)

### US-004: Self-hosted FCB crest (1 pt)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 9 (1 asset, 2 code, 1 modified, 5 tracking docs)
**Tests Added:** 10 (unit: 10)
**Commit:** see phase-1a progress log
**Notes:** All 3 acceptance criteria met. The club's `logo.webp` URL serves **PNG bytes** — the
extension is wrong and the bytes were trusted instead. No image dependency was added.

**What Was Done:** *(full detail in the phase-1a progress log)*
- The download was inspected before committing: `file` reports `PNG image data, 608 x 648`, so it is
  stored under its real format as `public/fcb-crest.png`, downsampled to 120x128 with macOS `sips`
  (194,518 → 17,908 bytes), stripped to `IHDR`/`IDAT`/`IEND` — no image dependency, no XMP block
- `app/components/chrome/crest.tsx` renders it with an accessible name and an aspect-ratio-derived
  width, top-left at 32px; the rest of the shell is **US-012**
- **Proved no CDN request survives:** nothing in `build/` matches `fcb.ch` and both bundles carry
  `"/fcb-crest.png"`. All gates clean (106/106)

### US-005: Tile card anatomy (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 (2 code, 1 test, 5 tracking docs)
**Tests Added:** 38 (unit: 38)
**Commit:** see phase-1a progress log
**Notes:** All 4 acceptance criteria met. This is the DRY story — seven Phase 2b tile kinds and
three Phase 3b heroes compose this one shell, so the prop set was designed for that, not for today.

**What Was Done:** *(full detail in the phase-1a progress log)*
- `app/components/tiles/card.tsx` — `Card` plus `CardCaption`. Nothing else: no KPI tile, no chart,
  no table, no recommendation panel, no hero
- **Slots, not variants** (eleven optional props, each collapsing on its own), so a recommendation
  panel and a KPI tile share one implementation; `accent` takes a **token name**, never a hex, so
  the colour discipline is enforced by the type rather than by review
- Real heading element (`h3`, nestable); caption strip is one muted line behind an `aria-hidden`
  glyph; `isNew` / `delayMs` are **hooks only** — US-006 owns the keyframes, and there is no gold
  ring and no glow (Guide supersedes the spec). Added `app/lib/cn.ts`
- 38 tests: both directions of every slot, no hex, caller text escaped. Gates clean (144/144)

### US-006: Tile-insertion motion & reduced-motion support (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 9 (3 code, 1 test, 5 tracking docs)
**Tests Added:** 37 (unit: 37)
**Commit:** see phase-1a progress log
**Notes:** All 5 acceptance criteria met. **Closes Phase 1a** (6/6 stories, 14/14 points). The
resolved conflict holds: fade-and-rise only, no gold ring on an inserted tile.

**What Was Done:** *(full detail in the phase-1a progress log)*
- The four reveal keyframes defined once in `app/app.css` — `fcbUp` (entrance), `fcbGlow`, `fcbScan`,
  `fcbSrc` — every value from a motion token, so the choreography retimes from the token set
- `app/lib/motion.ts`: `MOTION_CLASS` (the single spelling of each class name),
  `REDUCED_MOTION_QUERY` / `prefersReducedMotion`, `animateReflow`, `viewTransitionName`;
  US-005's `TILE_ENTER_CLASS` derives from it rather than repeating the string
- **Reduced motion renders final state, not "no animation":** an unlayered `prefers-reduced-motion`
  block collapses every animation and transition to ~1ms on `*`, so filled animations land on their
  closing frame; each primitive also restates its end state outright
- **Grid reflow** wraps an insertion in a view transition, timed to match the entrance
- **No gold ring, guarded structurally:** every class whose keyframes open at `opacity: 0` must be
  restored by the reduced-motion block, which must not sit inside a cascade layer (181/181 green)

### US-007: Persona baseline datasets (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 14 (9 code, 5 tracking docs)
**Tests Added:** 47 (unit: 47)
**Commit:** see phase-1b progress log
**Notes:** All 4 criteria met; the set **intentionally exceeds them** (user-approved) - the criteria
describe one period, the Reference Guide drives all four.

**What Was Done:** *(full detail in the phase-1b progress log)*
- Established the data seam the rest of E3 follows (`app/lib/repositories/README.md`): enum keys in
  `enums.ts`, types and interfaces in `types.ts`, derived figures in `derive.ts`, fixtures in
  `app/lib/mock/`, selection in `index.server.ts`. Domain types, not storage shapes; every method
  returns a `Promise`; money is a plain number
- Four periods of webshop revenue with comparison series, attendance per period, the four-period
  top-products table and the six partners
- **Totals and deltas are computed, never stored** — `seriesTotals` sums the same arrays the chart
  plots, so the headline figure cannot disagree with its own chart. The two long periods derive their
  x-axis labels from the current date through an injectable `Clock`, so the demo never looks stale
- Store-once proved by test: last month's revenue series *is* this month's comparison series;
  partner brand colours are typed as plain strings, not design tokens
- The four Specification-pinned figures asserted exactly: CHF 148,200 at +11.9%, FCB 2-1 Sion at
  28,900 of ~38,000, five product lines, 6 partners (47 tests, 228/228 green; gates clean)

### US-008: Hero 1 dataset - shirt sales, badges, printed names (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 9 (2 new, 7 modified)
**Tests Added:** 45 (unit: 45)
**Commit:** see phase-1b progress log
**Notes:** Delivered set intentionally **exceeds the written acceptance criteria** (user-approved):
all four periods, not only season-to-date - the tile's period switch must have data behind it.

**What Was Done:** *(full detail in the phase-1b progress log)*
- Followed the US-007 recipe exactly: `SEASON_TO_DATE` added to `PeriodKey` plus a `KitVariant`
  enum, domain types and `Hero1Repository`, derived figures, fixtures, one line of selection
- One hero object with `primary` and `followUp`, per the epic rule, so the tile and its escalation
  cannot drift apart; `scopeLabel` states the tile's scope
- **Nothing derivable is stored.** Kit revenue is units x CHF 99, the Home share 22,400 / 38,500 =
  58.18% (displays 58%), the badge share exactly 8%, the four segments from `badgeSegments`. The
  Guide's stored `homeShare: 58` did not survive the port - it can outlive an edit to its units
- `badgeSegments(total, split)` corrects its rounding remainder into the first segment, proved by an
  exhaustive sweep (every total 0-2,000, all four period totals, adversarial primes). Arithmetic
  asserted: 22,400 + 10,300 + 5,800 = 38,500 shirts; CHF 3,811,500 (~3.81M); 44/24/20/12 = 100
- Both narratives **verbatim**, verified by SHA-256 and pinned by exact text and length
- Guardrail held: squad names appear only as printed-name counts, and a test asserts no salary,
  goals, assists, minutes or rating exists anywhere. The baseline fixture was narrowed to its own
  period keys so extending the shared enum could not demand invented figures (45 tests, 273/273)

### US-009: Hero 2 dataset - ticket revenue year on year (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 10 (2 new, 8 modified)
**Tests Added:** 31 (unit: 31)
**Commit:** see phase-1b progress log
**Notes:** Delivered set intentionally **exceeds the written acceptance criteria** (user-approved):
the month-by-month series is a Reference Guide addition the tile draws.

**What Was Done:** *(full detail in the phase-1b progress log)*
- Followed the US-007 four-step recipe: new `SeasonKey` and `MonthKey` enums with label maps, domain
  types and `Hero2Repository`, derived figures, fixtures, one line of selection
- Eight home fixtures in CHF thousands, 25/26 -> 26/27: YB 1,480/1,610; FCZ 1,390/1,240; Servette
  980/1,050; St. Gallen 1,020/1,090; Luzern 890/820; Sion 760/690; GC 640/720; Lugano 720/610
- **The two charts are at different scopes on purpose, and the data says so.** `scopeLabel` is a
  field on each series - eight highest-grossing fixtures (7,880 -> 7,830) against all home fixtures
  per month (9,880 -> 9,770), both excluding the season-ticket base. Tests assert the labels exist,
  differ, and that the monthly total is the larger, so the gap reads as scope, not as a bug
- **Nothing derivable is stored.** The Guide's `totalPrev`, `totalCurr`, `deltaPct` and second
  `declines` list did not survive the port: totals come from `seriesTotals` (-50 / 7,880 = -0.6%),
  and `fixtureDeclines` recovers FCZ -150, Lugano -110, Luzern -70, Sion -70 (stable sort) with
  `declineTotal` producing the tile's -CHF 400k badge
- One hero object with `primary` and `followUp`; the follow-up carries only its narrative - its four
  fixtures *are* the primary's, seen through `fixtureDeclines`
- Both narratives **verbatim**, pinned by exact text, exact length (229 / 338) and an ASCII range
  check. `MONTH_LABEL` is pinned to the baseline band's `Intl`-derived month names, so the two
  spellings of "Jul" cannot diverge
- Guardrail held: fixtures are clubs, and a test asserts no squad name, salary or performance figure
  appears anywhere in the dataset (31 tests, 304/304 green; all gates clean)

### US-010: Hero 3 dataset - departmental performance (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 6 (2 new, 4 modified) + 5 tracking docs
**Tests Added:** 44 (unit: 44) - 348/348 green, 100% stmts / 98.7% branches of `app/**`
**Commit:** see phase-1b progress log
**Notes:** Fourth pass through the US-007 recipe; the new idea is that a TAG carries meaning.

**What Was Done:**
- Six departments, CHF thousands, Revenue or Cost: Sponsoring 21,000/21,840/104%; Ticketing
  24,000/24,360/102%; Hospitality 7,200/6,840/95%; Merchandising 9,800/9,050/92%; Events
  3,600/3,780/105%; Marketing **(Cost)** 3,400/3,810/84%
- **Revenue vs Cost is modelled so a consumer cannot get it wrong.** `varianceJudgement` decides
  good-or-bad ONCE from the `DepartmentType`: Marketing's +410 is `ADVERSE` (an overspend) where
  Sponsoring's +840 is `FAVOURABLE`; a test proves a naive "variance > 0" rule misreads one row
- **The flag is derived, not stored** - `departmentsNeedingAttention` finds exactly one row both
  over budget *and* behind target; the Guide's `flag: true` did not survive the port
- **Totals and variances derived:** 69,000 -> 69,680, +680, +1.0% through the same `percentChange`.
  The one stored figure is `blendedTargetPercent: 96`, which no arithmetic over the rows gives
- **The follow-up reconciles with the table:** 240 + 150 + 20 = 410, exactly Marketing's variance
- **Scope label is data**, as in US-009: Ticketing's 24,360 exceeds Hero 2's 7,830 (season-ticket
  base). Narratives **verbatim**; guardrail held - departments, never people

### US-011: Formatters & cross-hero reconciliation (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 (3 new, 3 modified) + 5 tracking docs
**Tests Added:** 70 (unit: 70) - 418/418 green, 100% stmts / 98.9% branches of `app/**`
**Commit:** see phase-1b progress log
**Notes:** **Closes Phase 1b** (5/5 stories, 10/10 points). No drift found in any dataset.

**What Was Done:**
- `app/lib/format.ts` - the one place a number becomes a string. Money always carries `CHF`, the
  **sign goes before the unit** (`-CHF 400k`), millions render bare under the "figures in CHF
  millions" subtitle. `Intl.NumberFormat("en-CH")` (Swiss U+2019 mark) pinned as a constant and made
  **independent of the runtime's ICU**, proved by tests that stub `Intl` to `en-US` and `de-DE`
- **One rounding rule:** `oneDecimal` imported from `derive.ts`, never restated; `chfFromThousands`
  is the only factor of 1000. Variance carries meaning through sign plus a `VarianceDirection` enum,
  never colour
- `tests/unit/reconciliation.test.ts` (39 tests) asserts **relationships, not constants** - every
  split against its total in all four periods, every derived delta, Marketing's drivers summing to
  its variance, the intended cross-hero inequality, and every number in all six narratives swept
  against the reachable data. **No drift found**

### US-012: Branded application shell (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 7 code (4 new, 3 modified) + 5 test files + 6 tracking docs
**Tests Added:** 57 net (unit: 57) - 475/475 green, 100% stmts / 98.9% branches of `app/**`
**Commit:** see phase-2a progress log
**Notes:** Scope held to the frame. Baseline tiles (US-013), insertion (US-014), reset behaviour
(US-015) and the hero band (US-016) deliberately not built - the canvas is left empty for them.

**What Was Done:**
- `chrome/{sidebar,top-bar,app-shell}.tsx` + `lib/persona.ts`: navy sidebar (hidden below `lg`), app
  bar with the self-hosted crest, "Sales & Marketing", decorative status and Reset, and a 12/8/4
  column canvas grid. No literal colour anywhere - tests pin that, as they do for the card
- **Persona is a role:** the label and the "SM" monogram live in one module, and a test asserts the
  app bar's entire text is exactly those labels. No photo - the crest is the only `<img>`
- **Placeholders inert structurally, not by handler:** `<span aria-disabled="true">`, no href, no
  role, no handler, no focus, `pointer-events-none`. Real Chrome: `tabIndex` -1, `pointer-events:
  none`, a synthesised click leaves the router at `/`; a source guard bans a `hover:` rule
- **Status is decorative:** static text, `data-decorative`, no live region, and source assertions
  that the file holds no `fetch`, `axios`, `useEffect` or timer. 1920x1080 measured in Chrome:
  `scrollWidth === clientWidth` (also at 1280 / 900 / 390)

### US-014: Dynamic tile insertion & grid reflow (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 code (4 new, 4 modified) + 5 test files + 7 tracking docs
**Tests Added:** 77 (unit: 77) - 552/552 green, 100% stmts / 99.1% branches of `app/**`
**Commit:** see phase-2a progress log
**Notes:** The mechanic the demo turns on: the dashboard **grows, it never clears**. Hero content is
a marked placeholder - tiles are Phase 2b, narratives Phase 3b.

**What Was Done:**
- `lib/dashboard/sections.ts` (pure) + `use-dashboard.ts` (state, owned by `root.tsx`): the session
  as a memory-only `{heroId, phase, revision}` list - append, refresh-in-place, flip-phase
- **Dedupe by hero id:** re-asking keeps ONE section in its original position and bumps `revision`
  (which changes the React key, so it re-inserts rather than doing nothing); a section already
  showing its follow-up never regresses. A follow-up **flips** its parent's phase - what US-033 needs
- **One grid, not two:** sections are direct children of the US-012 canvas grid and re-use its tracks
  via `grid-cols-subgrid`. Chrome at 1920x1080: canvas tracks 122.656px, tiles 816px at x=256/1088
- **Reflow, never jump:** every mutation runs through US-006's `animateReflow` with `flushSync`
  inside the transition callback; Chrome shows `::view-transition-group(fcb-tile-HERO_1)` animating
  as a second section inserts. Under reduced motion: zero transitions, identical final layout
- **Auto-scroll:** `scrollRevealedIntoView` (smooth, `auto` when reduced, focus never moved) -
  `scrollY` 0 -> 154 at 1280x620 as the third section overflowed, section 1 still present
- **No persistence:** a source scan over `app/**` bans `localStorage`, `sessionStorage`, `indexedDB`
  and `document.cookie`; a remount test shows the session starting empty, as a reload does

---

**Auto-Generated** | Updates during `/execute-work` | Append-only log
