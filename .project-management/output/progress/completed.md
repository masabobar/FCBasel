# Completed Work Log

**Last Updated:** 2026-09-09

---

## Summary

**Total Completed:** 10 stories
**Total Points:** 22 / 116
**Start Date:** 2026-09-09
**Days Active:** 1
**Average Velocity:** 22 points/day
**Phases Completed:** Phase 1a (2026-09-09)

---

## Completed Stories

### US-001: Environment & deployment setup (3 pts)
**Completed:** 2026-09-09
**By:** AI (Railway deploy step remains with the human)
**Files Changed:** 21 (16 code/config, 5 tracking docs)
**Tests Added:** 8 (unit: 8)
**Commit:** see phase-1a progress log
**Notes:** 4 of 5 acceptance criteria met and verified by execution. The Railway deploy AC is
**deferred to the human** — no account access from the AI session.

**What Was Done:**
- Scaffolded React Router 7.18 in framework mode with SSR, Vite 6, Tailwind v4, strict TypeScript,
  and only the prototype's dependency set (no Prisma, msw, Recharts, TanStack Table, PDF/email, i18n)
- Committed Railway deploy config; verified from a **clean checkout** that install, build and a
  production server return HTTP 200 with server-rendered markup, with no env var and no database
- Cleared 2 moderate transitive `qs` advisories with a pnpm override; `pnpm audit` is now clean

### US-002: Developer tooling & local DX (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 13 (8 code/config, 5 tracking docs)
**Tests Added:** 0 (tooling config carries no behaviour worth a hollow test; the existing 8 stay green)
**Commit:** see phase-1a progress log
**Notes:** All 4 acceptance criteria met and verified by execution, including the pre-commit hook.

**What Was Done:**
- ESLint 9 flat config (TypeScript + React hooks, `eslint-config-prettier` last), Prettier with
  `prettier-plugin-tailwindcss` for Tailwind v4 class sorting, and the `lint` / `format` scripts
- Wired husky v9 + lint-staged and **proved the hook fires** with throwaway commits later reset
  away: a lint error blocked the commit; a badly formatted file landed already formatted
- `pnpm lint` clean, `pnpm typecheck` clean, 8/8 tests green, `pnpm audit` clean

### US-003: Design token set (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 (3 code, 5 tracking docs)
**Tests Added:** 88 (unit: 88)
**Commit:** see phase-1a progress log
**Notes:** All 6 acceptance criteria met. Guide precedence applied to the three known divergences:
surface `#F1F4F9`, text `#161A20`, positive variance `#0E9F6E`. No new-tile gold ring introduced.

**What Was Done:**
- Defined the colour, type, spacing, radii, shadow and motion set once as Tailwind v4 CSS custom
  properties in `app/app.css` (`@theme static`, so every variable is emitted for `var()` use)
- Mirrored the same values as a typed object in `app/lib/tokens.ts` for the hand-built SVG charts
- Guarded the pair with a parity test that resolves `var()` aliases and fails on drift either way
- Encoded colour discipline in the token names (series identity, variance as the only good/bad
  carriers, gold restricted to two accent roles), each asserted by a test, and kept
  `varianceNegative` separate from `red` so red can never drift into meaning "bad"
- Added typography roles (`.tile-title`, `.kpi-number`, `.chart-axis-label`, `.narrative-caption`)
  so US-005 references a role rather than restating the type spec
- All gates clean (96/96 tests); coverage 100% of `app/**`

### US-004: Self-hosted FCB crest (1 pt)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 9 (1 asset, 2 code, 1 modified, 5 tracking docs)
**Tests Added:** 10 (unit: 10)
**Commit:** see phase-1a progress log
**Notes:** All 3 acceptance criteria met. The club's `logo.webp` URL serves **PNG bytes** — the
extension is wrong and the bytes were trusted instead. No image dependency was added.

**What Was Done:**
- Inspected the download before committing it: `file` reports `PNG image data, 608 x 648`, so it is
  stored under its real format as `public/fcb-crest.png`, downsampled to 120x128 with macOS `sips`
  (194,518 → 17,908 bytes) and stripped to `IHDR`/`IDAT`/`IEND` — no image dependency, no XMP block
- Added `app/components/chrome/crest.tsx` — `Crest` renders `/fcb-crest.png` with an accessible name
  and an aspect-ratio-derived width, placed top-left at 32px in a minimal `<header>`; the rest of
  the shell is **US-012**
- **Proved no CDN request survives:** nothing in `build/` matches `fcb.ch`, both bundles carry the
  literal `"/fcb-crest.png"`, and the booted server's HTML is entirely root-relative
- All gates clean (106/106 tests); coverage 100% of `app/**`

### US-005: Tile card anatomy (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 (2 code, 1 test, 5 tracking docs)
**Tests Added:** 38 (unit: 38)
**Commit:** see phase-1a progress log
**Notes:** All 4 acceptance criteria met. This is the DRY story — seven Phase 2b tile kinds and
three Phase 3b heroes compose this one shell, so the prop set was designed for that, not for today.

**What Was Done:**
- Added `app/components/tiles/card.tsx` — `Card` (the shell) and `CardCaption` (the narrative strip
  it can carry). Nothing else: no KPI tile, no chart, no table, no recommendation panel, no hero
- **Slots, not variants:** `title`, `subtitle`, `headingLevel`, `icon`, `action`, `accent`,
  `caption`, `isNew`, `delayMs`, `className`, `children`. Each optional part collapses on its own —
  the header is not rendered at all when nothing would fill it — which is what lets a recommendation
  panel (accent, no title) and a KPI tile (title, icon) share one implementation
- `accent` takes a **token name**, never a colour string, so no tile can introduce a hex outside the
  US-003 set; the colour discipline is enforced by the type rather than by review
- The title is a real heading (`h3` by default, `headingLevel` to nest), because the dashboard grows
  tile by tile and the structure is how a screen-reader user follows it
- The caption strip is one muted line behind an `aria-hidden` AI glyph — decoration, never announced
- `isNew` applies the exported `TILE_ENTER_CLASS` and `delayMs` sets `animationDelay`: **hooks only.
  US-006 owns the keyframes, and there is no gold ring and no glow** (Guide supersedes the spec)
- Added `app/lib/cn.ts` so the shell can carry base classes a caller can still override
- 38 tests cover both directions of every optional slot, that the AC values resolve from tokens,
  that no hex or `rgb()` literal exists in the component, that caller text is escaped rather than
  parsed as markup, and that no ring or glow returns
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` (144/144) and `pnpm build` all
  clean; coverage 100% of `app/**`; generated utilities verified in the emitted CSS

### US-006: Tile-insertion motion & reduced-motion support (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 9 (3 code, 1 test, 5 tracking docs)
**Tests Added:** 37 (unit: 37)
**Commit:** see phase-1a progress log
**Notes:** All 5 acceptance criteria met. **Closes Phase 1a** (6/6 stories, 14/14 points). The
resolved conflict holds: fade-and-rise only, no gold ring on an inserted tile.

**What Was Done:**
- Defined the four reveal keyframes once, in `app/app.css`: `fcbUp` (entrance — opacity 0→1 while
  rising 12px over 400ms on `cubic-bezier(0.2, 0.8, 0.2, 1)`), `fcbGlow` (ambient brand pulse),
  `fcbScan` (thinking scan line) and `fcbSrc` (source-chip reveal). Every value comes from a motion
  token, so the whole choreography can be retimed from the token set
- Added `app/lib/motion.ts`: `MOTION_CLASS` (the single spelling of each class name),
  `REDUCED_MOTION_QUERY` / `prefersReducedMotion`, `animateReflow` and `viewTransitionName`.
  US-005's `TILE_ENTER_CLASS` now derives from `MOTION_CLASS.enter` rather than repeating the string
- **Reduced motion renders final state, not "no animation":** the unlayered
  `@media (prefers-reduced-motion: reduce)` block collapses every animation to one ~1ms iteration
  with no delay and every transition to ~1ms, so filled animations land on their closing frame and
  transitions on their target immediately. Applied to `*`, so US-027's transition-driven chart
  geometry is covered before it exists; each primitive then restates its end state outright
- **Grid reflow** wraps an insertion in a view transition (CSS cannot transition a grid position),
  timed by `::view-transition-group(*)` to match the entrance; the update always runs, wrapped or not
- **No gold ring, guarded by tests:** the entrance keyframes and `.fcb-enter` may declare nothing but
  the animation, the card never carries `fcb-glow`, and gold keeps exactly two consumers
- 37 tests, the load-bearing ones structural: every class whose keyframes open at `opacity: 0` must
  be restored to its final state by the reduced-motion block, which must not sit inside a cascade layer
- All five gates clean; 181/181 tests; coverage 100% statements / 97.6% branches of `app/**`;
  compiled CSS verified to ship all four keyframes and every final-state rule

### US-007: Persona baseline datasets (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 14 (9 code, 5 tracking docs)
**Tests Added:** 47 (unit: 47)
**Commit:** see phase-1b progress log
**Notes:** All 4 acceptance criteria met, and the delivered set **intentionally exceeds them** per
the user's approved decision: the criteria describe one period, the Reference Guide (definitive for
the experience, `scope.md` §10) drives all four.

**What Was Done:**
- Established the data seam the rest of E3 follows and wrote it down in
  `app/lib/repositories/README.md` as a four-step recipe: enum keys in `enums.ts`, domain types and
  the repository interface in `types.ts`, derived figures in `derive.ts`, fixtures and the in-memory
  implementation in `app/lib/mock/<dataset>.ts`, selection in `index.server.ts`
- Domain types, not storage shapes: the Guide's parallel name/value arrays become rows; every
  repository method returns a `Promise`; money is a plain number, never a formatted string
- Four periods of webshop revenue with their comparison series, the attendance block per period, the
  four-period top-products table and the six partners
- **Totals and deltas are computed, never stored** — `seriesTotals` sums the same arrays the chart
  plots, so the headline figure cannot disagree with its own chart
- "Last 3 months" and "Year to date" derive x-axis labels from the current date through an
  injectable `Clock`, so the demo never shows stale months and tests never read the wall clock
- Store-once-reference-everywhere proved by test: last month's revenue series *is* this month's
  comparison series, and the monthly points for the last three months are the weekly sums
- Partner brand colours documented and tested as brand colours, not design tokens — Bitpanda teal
  and Sunrise red sit outside the FCB palette deliberately, and the type is a plain string so they
  cannot be mistaken for a `ColorToken`
- The four Specification-pinned figures asserted exactly: CHF 148,200 at +11.9% (+12% rounded),
  FCB 2-1 Sion at 28,900 of ~38,000, this month's five product lines, 6 partners
- 47 tests added (228/228 green), coverage 100% statements / 98% branches of `app/**`; lint, format,
  typecheck and build all clean

### US-008: Hero 1 dataset - shirt sales, badges, printed names (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 9 (2 new, 7 modified)
**Tests Added:** 45 (unit: 45)
**Commit:** see phase-1b progress log
**Notes:** Delivered set intentionally **exceeds the written acceptance criteria**, per the user's
approved decision: all four periods (season to date, last 3 months, last month, current month), not
only the season-to-date figures the criteria describe. `scope.md` §10 makes the Reference Guide
definitive for the experience, and the tile has a period switch that must have data behind it.

**What Was Done:**
- Followed the US-007 four-step recipe exactly: `SEASON_TO_DATE` added to the existing `PeriodKey`
  (plus a new `KitVariant` enum with its label map), domain types and `Hero1Repository` in
  `types.ts`, derived figures in `derive.ts`, fixtures and the in-memory implementation in
  `app/lib/mock/hero1.ts`, one line of selection in `index.server.ts`
- One hero object with `primary` and `followUp`, per the epic rule, so the tile and its escalation
  cannot drift apart; `scopeLabel` is "Season-to-date merchandising" so the tile can state its scope
- **Nothing derivable is stored.** Kit revenue is units x CHF 99, the Home share is 22,400 / 38,500
  = 58.18% (displays 58%), the badge share is 3,080 / 38,500 = exactly 8%, and the four sponsor
  segments come from `badgeSegments`. The Reference Guide's stored `homeShare: 58` deliberately did
  not survive the port - a stored 58 can outlive an edit to the units beneath it
- `badgeSegments(total, split)` corrects its rounding remainder into the first segment (Bitpanda,
  the largest share), reproducing the reference behaviour. Proved by an exhaustive sweep: the four
  segments sum *exactly* to the total for every total from 0 to 2,000, for all four period totals,
  and at adversarial values (0, 1, 7 and a run of primes)
- Season-to-date arithmetic asserted: 22,400 + 10,300 + 5,800 = 38,500 shirts; CHF 2,217,600 /
  1,019,700 / 574,200 = CHF 3,811,500 (~3.81M); badge split 44/24/20/12 summing to 100
- Both narratives are **verbatim**, verified byte-for-byte against the source by SHA-256, and a test
  pins each one's exact text and length so a later "improvement" fails the suite
- Guardrail held: squad names appear only as printed-name counts, and a test asserts no salary,
  goals, assists, appearances, minutes or rating value exists anywhere in the dataset
- Baseline fixture narrowed to its own four period keys so extending the shared enum could not
  silently demand invented figures from it
- 45 tests added (273/273 green), coverage 100% statements / 98.4% branches of `app/**`; lint,
  format, typecheck and build all clean

### US-009: Hero 2 dataset - ticket revenue year on year (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 10 (2 new, 8 modified)
**Tests Added:** 31 (unit: 31)
**Commit:** see phase-1b progress log
**Notes:** Delivered set intentionally **exceeds the written acceptance criteria**, per the user's
approved decision: the month-by-month series (twelve points per season) is a Reference Guide
addition the Build Specification never mentions, and the tile draws it. `scope.md` §10 makes the
Reference Guide definitive for the experience.

**What Was Done:**
- Followed the US-007 four-step recipe: new `SeasonKey` and `MonthKey` enums with their label maps
  in `enums.ts`, domain types and `Hero2Repository` in `types.ts`, derived figures in `derive.ts`,
  fixtures and the in-memory implementation in `app/lib/mock/hero2.ts`, one line of selection in
  `index.server.ts`
- Eight home fixtures in CHF thousands, 25/26 against 26/27: YB 1,480 -> 1,610; FCZ 1,390 -> 1,240;
  Servette 980 -> 1,050; St. Gallen 1,020 -> 1,090; Luzern 890 -> 820; Sion 760 -> 690;
  GC 640 -> 720; Lugano 720 -> 610
- **The two charts are at different scopes on purpose, and the data says so.** `scopeLabel` is a
  field on each series - eight highest-grossing fixtures (7,880 -> 7,830) against all home fixtures
  per month (9,880 -> 9,770), both excluding the season-ticket base. Tests assert the labels exist,
  differ, and that the monthly total is the larger of the two, so the mismatch reads as scope rather
  than as an arithmetic bug
- **Nothing derivable is stored.** The Reference Guide's `totalPrev`, `totalCurr`, `deltaPct` and its
  second `declines` list did not survive the port. Totals come from the same `seriesTotals` the
  baseline band uses, so -50 / 7,880 = -0.63% displays as -0.6% under one rounding rule;
  `fixtureDeclines` recovers FCZ -150, Lugano -110, Luzern -70, Sion -70 from the fixture pairs
  (stable sort keeps Luzern before Sion) and `declineTotal` produces the tile's -CHF 400k badge
- One hero object with `primary` and `followUp`; the follow-up carries only its narrative, because
  its four fixtures *are* the primary's fixtures seen through `fixtureDeclines`
- Both narratives are **verbatim**, extracted from the source and compared programmatically, then
  pinned by exact text, exact length (229 / 338) and a printable-ASCII range check. The hygiene rule
  banning "CHF" and comma-grouped digits from stored strings is scoped to the data strings, because
  this hero's verbatim copy legitimately says "-CHF 150k" and "3,200"
- `MONTH_LABEL` is pinned by test to the baseline band's `Intl`-derived month names, so the two
  spellings of "Jul" cannot diverge
- Guardrail held: fixtures are clubs, and a test asserts no squad name, salary or performance figure
  appears anywhere in the dataset
- 31 tests added (304/304 green), coverage 100% statements / 98.4% branches of `app/**`; lint,
  format, typecheck and build all clean

---

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
- **Revenue vs Cost is modelled so a consumer cannot get it wrong.** `DepartmentType` and
  `VarianceJudgement` are enums; `varianceJudgement` decides good-or-bad ONCE from the type, so
  Marketing's +410 is `ADVERSE` (an overspend) where Sponsoring's +840 is `FAVOURABLE`. Both
  directions tested, plus a test proving a naive "variance > 0 is good" rule misreads one department
- **The flag is derived, not stored** - the Guide's `flag: true` did not survive the port, and
  `departmentsNeedingAttention` finds exactly one row both over budget *and* behind target
- **Totals and variances derived:** `totalBudget` / `totalActual` not ported; `departmentTotals`
  gives 69,000 -> 69,680, +680, +0.99% shown as +1.0% through the same `percentChange` the baseline
  uses (one `oneDecimal` rule), and the narrative's -7.7% / +12.1% with it. The one stored figure is
  `blendedTargetPercent: 96` - a measured attainment no arithmetic over the rows gives (97.0 / 99.7)
- **The follow-up reconciles with the table:** activations 240 + paid social 150 + agency retainer
  20 = 410, exactly Marketing's derived variance (the retainer is a Guide addition beyond the
  Specification, per the approved scope decision). Conversion 2.2% vs 2.6% derives 84.6% attainment,
  -0.4 percentage *points* and a -15.4% relative shortfall
- **Scope label is data**, as in US-009: Ticketing's 24,360 exceeds Hero 2's 7,830 because it
  includes the season-ticket base. Both narratives **verbatim** (checked against `DATA.hero3`:
  identical, 270 / 468 chars, ASCII), pinned by text, length and range. Guardrail held on the
  dataset closest to the line: departments, never people - no salary, headcount or named individual

---

**Auto-Generated** | Updates during `/execute-work` | Append-only log
