# Completed Work Log

**Last Updated:** 2026-09-09

---

## Summary

**Total Completed:** 11 stories
**Total Points:** 24 / 116
**Start Date:** 2026-09-09
**Days Active:** 1
**Average Velocity:** 24 points/day
**Phases Completed:** Phase 1a, Phase 1b (both 2026-09-09)

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

**What Was Done:** *(full detail in the phase-1a progress log)*
- React Router 7.18 in framework mode with SSR, Vite 6, Tailwind v4, strict TypeScript, and only the
  prototype's dependency set (no Prisma, msw, Recharts, TanStack Table, PDF/email, i18n)
- Railway deploy config committed; verified from a **clean checkout** that install, build and a
  production server return HTTP 200 with server-rendered markup, no env var and no database. Cleared
  2 moderate transitive `qs` advisories with a pnpm override; `pnpm audit` clean

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

**What Was Done:** *(full detail in the phase-1a progress log)*
- The colour, type, spacing, radii, shadow and motion set defined once as Tailwind v4 custom
  properties in `app/app.css` (`@theme static`) and mirrored as a typed object in `app/lib/tokens.ts`
  for the hand-built SVG charts, guarded by a parity test that resolves `var()` aliases
- Colour discipline encoded in the token *names* (series identity, variance as the only good/bad
  carriers, gold restricted to two accent roles), each asserted by a test, with `varianceNegative`
  kept separate from `red` so red can never drift into meaning "bad"
- Typography roles (`.tile-title`, `.kpi-number`, `.chart-axis-label`, `.narrative-caption`) so
  US-005 references a role rather than restating the type spec. All gates clean (96/96)

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
  width, top-left at 32px in a minimal `<header>`; the rest of the shell is **US-012**
- **Proved no CDN request survives:** nothing in `build/` matches `fcb.ch`, both bundles carry the
  literal `"/fcb-crest.png"`, the booted server's HTML is root-relative. All gates clean (106/106)

### US-005: Tile card anatomy (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 (2 code, 1 test, 5 tracking docs)
**Tests Added:** 38 (unit: 38)
**Commit:** see phase-1a progress log
**Notes:** All 4 acceptance criteria met. This is the DRY story — seven Phase 2b tile kinds and
three Phase 3b heroes compose this one shell, so the prop set was designed for that, not for today.

**What Was Done:** *(full detail in the phase-1a progress log)*
- `app/components/tiles/card.tsx` — `Card` (the shell) plus `CardCaption`. Nothing else: no KPI tile,
  no chart, no table, no recommendation panel, no hero
- **Slots, not variants** (eleven optional props, each collapsing on its own), so a recommendation
  panel and a KPI tile share one implementation; `accent` takes a **token name**, never a hex, so
  the colour discipline is enforced by the type rather than by review
- Real heading element (`h3`, nestable) for screen-reader structure; caption strip is one muted line
  behind an `aria-hidden` glyph; `isNew` / `delayMs` are **hooks only** — US-006 owns the keyframes,
  and there is no gold ring and no glow (Guide supersedes the spec). Added `app/lib/cn.ts`
- 38 tests: both directions of every slot, no hex or `rgb()` literal, caller text escaped, no ring
  or glow. All gates clean (144/144), coverage 100% of `app/**`

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
  restored by the reduced-motion block, which must not sit inside a cascade layer
- 37 tests; all five gates clean (181/181); coverage 100% stmts / 97.6% branches of `app/**`

### US-007: Persona baseline datasets (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 14 (9 code, 5 tracking docs)
**Tests Added:** 47 (unit: 47)
**Commit:** see phase-1b progress log
**Notes:** All 4 acceptance criteria met, and the delivered set **intentionally exceeds them** per
the user's approved decision: the criteria describe one period, the Reference Guide (definitive for
the experience, `scope.md` §10) drives all four.

**What Was Done:** *(full detail in the phase-1b progress log)*
- Established the data seam the rest of E3 follows, written down in `app/lib/repositories/README.md`
  as a four-step recipe: enum keys in `enums.ts`, domain types and the repository interface in
  `types.ts`, derived figures in `derive.ts`, fixtures in `app/lib/mock/<dataset>.ts`, selection in
  `index.server.ts`. Domain types, not storage shapes; every method returns a `Promise`; money is a
  plain number, never a formatted string
- Four periods of webshop revenue with their comparison series, the attendance block per period, the
  four-period top-products table and the six partners
- **Totals and deltas are computed, never stored** — `seriesTotals` sums the same arrays the chart
  plots, so the headline figure cannot disagree with its own chart. The two long periods derive their
  x-axis labels from the current date through an injectable `Clock`, so the demo never looks stale
- Store-once proved by test: last month's revenue series *is* this month's comparison series, and the
  monthly points for the last three months are the weekly sums. Partner brand colours are documented
  and tested as brand colours, not design tokens, and typed as plain strings so they cannot be
  mistaken for a `ColorToken`
- The four Specification-pinned figures asserted exactly: CHF 148,200 at +11.9% (+12% rounded),
  FCB 2-1 Sion at 28,900 of ~38,000, this month's five product lines, 6 partners
- 47 tests added (228/228 green), coverage 100% stmts / 98% branches of `app/**`; all gates clean

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

**What Was Done:** *(full detail in the phase-1b progress log)*
- Followed the US-007 four-step recipe exactly: `SEASON_TO_DATE` added to the existing `PeriodKey`
  plus a new `KitVariant` enum with its label map, domain types and `Hero1Repository`, derived
  figures, fixtures, one line of selection
- One hero object with `primary` and `followUp`, per the epic rule, so the tile and its escalation
  cannot drift apart; `scopeLabel` is "Season-to-date merchandising" so the tile can state its scope
- **Nothing derivable is stored.** Kit revenue is units x CHF 99, the Home share is 22,400 / 38,500
  = 58.18% (displays 58%), the badge share is 3,080 / 38,500 = exactly 8%, and the four sponsor
  segments come from `badgeSegments`. The Reference Guide's stored `homeShare: 58` deliberately did
  not survive the port - a stored 58 can outlive an edit to the units beneath it
- `badgeSegments(total, split)` corrects its rounding remainder into the first segment (Bitpanda,
  the largest share). Proved by an exhaustive sweep: the four segments sum *exactly* to the total for
  every total from 0 to 2,000, for all four period totals, and at adversarial values (0, 1, 7,
  primes). Season-to-date arithmetic asserted: 22,400 + 10,300 + 5,800 = 38,500 shirts;
  CHF 2,217,600 / 1,019,700 / 574,200 = CHF 3,811,500 (~3.81M); badge split 44/24/20/12 = 100
- Both narratives are **verbatim**, verified byte-for-byte against the source by SHA-256, and pinned
  by exact text and length so a later "improvement" fails the suite
- Guardrail held: squad names appear only as printed-name counts, and a test asserts no salary,
  goals, assists, appearances, minutes or rating value exists anywhere in the dataset. The baseline
  fixture was narrowed to its own four period keys so extending the shared enum could not silently
  demand invented figures from it
- 45 tests added (273/273 green), coverage 100% stmts / 98.4% branches of `app/**`; all gates clean

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

**What Was Done:** *(full detail in the phase-1b progress log)*
- Followed the US-007 four-step recipe: new `SeasonKey` and `MonthKey` enums with label maps, domain
  types and `Hero2Repository`, derived figures, fixtures, one line of selection
- Eight home fixtures in CHF thousands, 25/26 against 26/27: YB 1,480 -> 1,610; FCZ 1,390 -> 1,240;
  Servette 980 -> 1,050; St. Gallen 1,020 -> 1,090; Luzern 890 -> 820; Sion 760 -> 690;
  GC 640 -> 720; Lugano 720 -> 610
- **The two charts are at different scopes on purpose, and the data says so.** `scopeLabel` is a
  field on each series - eight highest-grossing fixtures (7,880 -> 7,830) against all home fixtures
  per month (9,880 -> 9,770), both excluding the season-ticket base. Tests assert the labels exist,
  differ, and that the monthly total is the larger, so the gap reads as scope, not as a bug
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
- **Revenue vs Cost is modelled so a consumer cannot get it wrong.** `varianceJudgement` decides
  good-or-bad ONCE from the `DepartmentType`, so Marketing's +410 is `ADVERSE` (an overspend) where
  Sponsoring's +840 is `FAVOURABLE`; a test proves a naive "variance > 0" rule misreads one row
- **The flag is derived, not stored** - the Guide's `flag: true` did not survive the port, and
  `departmentsNeedingAttention` finds exactly one row both over budget *and* behind target
- **Totals and variances derived:** `totalBudget` / `totalActual` not ported; `departmentTotals`
  gives 69,000 -> 69,680, +680, +0.99% shown as +1.0% through the same `percentChange` the baseline
  uses (one `oneDecimal` rule), and the narrative's -7.7% / +12.1% with it. The one stored figure is
  `blendedTargetPercent: 96` - a measured attainment no arithmetic over the rows gives (97.0 / 99.7)
- **The follow-up reconciles with the table:** activations 240 + paid social 150 + agency retainer
  20 = 410, exactly Marketing's derived variance (the retainer is a Guide addition, per the approved
  scope decision). Conversion 2.2% vs 2.6% derives 84.6% attainment, -0.4 *points*, -15.4% relative
- **Scope label is data**, as in US-009: Ticketing's 24,360 exceeds Hero 2's 7,830 because it
  includes the season-ticket base. Both narratives **verbatim** (checked against `DATA.hero3`:
  identical, 270 / 468 chars, ASCII), pinned by text, length and range. Guardrail held on the
  dataset closest to the line: departments, never people - no salary, headcount or named individual

### US-011: Formatters & cross-hero reconciliation (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 8 (3 new, 3 modified) + 5 tracking docs
**Tests Added:** 70 (unit: 70) - 418/418 green, 100% stmts / 98.9% branches of `app/**`
**Commit:** see phase-1b progress log
**Notes:** **Closes Phase 1b** (5/5 stories, 10/10 points). No drift found in any dataset.

**What Was Done:**
- `app/lib/format.ts` - the one place a number becomes a string. Money always carries `CHF` and there
  is deliberately no bare-amount variant; the **sign goes before the unit** (`-CHF 400k`); millions
  render bare (`69.68`) under the "figures in CHF millions" subtitle, with no "000" note anywhere
- **Locale decided deliberately:** `Intl.NumberFormat("en-CH")` per the Reference Guide, which groups
  with the Swiss U+2019 mark (`CHF 3'811'500`). Pinned as a constant and made **independent of the
  runtime's ICU** - whatever separator ICU produced is rewritten to the pinned one, proved by tests
  that stub `Intl` to `en-US` and `de-DE`
- **One rounding rule:** `oneDecimal` was made public in `derive.ts` and imported, never restated;
  `chfFromThousands` is the only factor of 1000 in the app. Variance carries its meaning through sign
  plus a new `VarianceDirection` enum (UP / DOWN / FLAT + label map), never colour; tabular numerals
  stay in the token layer and a test reads that declaration back out of `app/app.css`
- `tests/unit/reconciliation.test.ts` (39 tests) asserts **relationships, not constants**: 22,400 +
  10,300 + 5,800 = 38,500 with the Home share 58.18% -> 58% and the badge exactly 8.00%; segments
  summing to their period total in all four periods; 38,500 x CHF 99 = CHF 3,811,500 split
  2.218/1.020/0.574M; 7,880 -> 7,830 = -50 -> -0.6% with declines 150+110+70+70 = 400 and monthly
  totals larger *on purpose*; 69,000 -> 69,680 = +680 -> +1.0%, Merchandising -7.65% -> "7.7% under",
  Marketing +12.06% -> "12% over" and the one department both over budget *and* behind target, its
  drivers 240+150+20 = 410 = its variance
- **Cross-hero:** Ticketing 24,360 legitimately exceeds Hero 2's 7,830, asserted as an intended
  inequality with both scope labels checked; Hero 1's shirt revenue asserted *inside* Hero 3's
  Fanshop actual. **Store-once asserted structurally** (each hero's stored key set is pinned), and
  every number in all six narratives swept against the reachable data, with two documented
  exceptions ("3,200 fewer seats", "18%")

---

**Auto-Generated** | Updates during `/execute-work` | Append-only log
