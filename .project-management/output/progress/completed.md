# Completed Work Log

**Last Updated:** 2026-09-09

---

## Summary

**Total Completed:** 18 stories
**Total Points:** 43 / 116
**Start Date:** 2026-09-09
**Days Active:** 1
**Average Velocity:** 43 points/day
**Phases Completed:** Phase 1a, Phase 1b (both 2026-09-09)

---

## Completed Stories

## Phase 1a: Setup & Design System — closed 2026-09-09 (6 stories · 14 pts)

Condensed to keep this log inside its 300-line limit; the **full per-story detail lives in
[`../phases/phase-1a.md`](../phases/phase-1a.md)**, which is the authoritative record.

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-001 Environment & deployment setup | 3 | 8 | React Router 7.18 SSR + Vite 6 + Tailwind v4 + strict TS, prototype-only dependency set. From a clean checkout, install/build/serve returns SSR markup with no env var and no database. **The Railway deploy itself remains a human step.** |
| US-002 Developer tooling & local DX | 2 | 0 | ESLint 9 flat config, Prettier with Tailwind class sorting, husky + lint-staged — the pre-commit hook proved to fire by throwaway commits. |
| US-003 Design token set | 3 | 88 | One token set: Tailwind v4 `@theme static` properties in `app/app.css` mirrored as typed objects in `app/lib/tokens.ts`, held in lockstep by a `var()`-resolving parity test. Colour discipline encoded in the token *names* — gold limited to two accent roles, `varianceNegative` kept separate from `red`. |
| US-004 Self-hosted FCB crest | 1 | 10 | The club's `logo.webp` serves **PNG bytes**; the bytes were trusted over the extension. Stored as `public/fcb-crest.png` at 120x128, 194,518 → 17,908 bytes via `sips`, no image dependency. Nothing in `build/` matches `fcb.ch`. |
| US-005 Tile card anatomy | 2 | 38 | `app/components/tiles/card.tsx` — one `Card` shell (plus `CardCaption`) that every 2b tile and 3b hero composes. **Slots, not variants**; `accent` takes a token name so no hex can reach a tile; `isNew` / `delayMs` are hooks only. |
| US-006 Tile-insertion motion & reduced-motion | 3 | 37 | The four reveal keyframes (`fcbUp`, `fcbGlow`, `fcbScan`, `fcbSrc`) defined once and timed from motion tokens, plus `app/lib/motion.ts` (`MOTION_CLASS`, `REDUCED_MOTION_QUERY`, `animateReflow`, `viewTransitionName`). **Reduced motion renders final state, not "no animation"** — an unlayered block collapses every animation to ~1ms on `*`. Fade-and-rise only; no gold ring, guarded structurally. |

---

## Phase 1b: Seed Data — closed 2026-09-09 (5 stories · 10 pts)

Condensed to keep this log inside its 300-line limit; the **full per-story detail lives in
[`../phases/phase-1b.md`](../phases/phase-1b.md)**, which is the authoritative record.

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-007 Persona baseline datasets | 2 | 47 | The data seam the rest of E3 follows (`app/lib/repositories/README.md`): enums, domain types, `derive.ts`, fixtures in `app/lib/mock/`, server-only selection. Every method returns a `Promise`; money is a plain number. **Totals and deltas are computed, never stored** — `seriesTotals` sums the same arrays the chart plots. Four Specification figures pinned exactly: CHF 148,200 at +11.9%, FCB 2-1 Sion at 28,900 of ~38,000, five product lines, 6 partners. Delivered set intentionally exceeds the written AC (user-approved): all four periods. |
| US-008 Hero 1 dataset | 2 | 45 | Season-to-date merchandising across all four periods. Nothing derivable is stored: kit revenue is units × CHF 99, the Home share 22,400/38,500 = 58.18% (displays 58%), the badge share exactly 8%; the Guide's stored `homeShare: 58` did not survive the port. `badgeSegments` corrects its rounding remainder into the first segment, proved by an exhaustive 0–2,000 sweep. Both narratives verbatim (SHA-256 pinned); no salary or named-individual performance figure anywhere. |
| US-009 Hero 2 dataset | 2 | 31 | Eight home fixtures year on year plus the Guide's twelve-month series. **The two charts sit at different scopes on purpose and the data says so** — `scopeLabel` is a field, and tests assert the labels differ and that the monthly total is the larger, so the gap reads as scope rather than a bug. Totals, the -0.6%, the four declining fixtures and the -CHF 400k badge are all derived. Narratives pinned by text, length and ASCII range. |
| US-010 Hero 3 dataset | 2 | 44 | Six departments, each tagged Revenue or Cost — and the tag is load-bearing: `varianceJudgement` decides good-or-bad ONCE from `DepartmentType`, so Marketing's +410 is `ADVERSE` where Sponsoring's +840 is `FAVOURABLE`, and a test proves a naive "variance > 0" rule misreads one row. The attention flag is derived, not stored. The follow-up reconciles: 240 + 150 + 20 = 410, exactly Marketing's variance. |
| US-011 Formatters & reconciliation | 2 | 70 | `app/lib/format.ts` — the one place a number becomes a string. Money always carries `CHF`, the **sign goes before the unit** (`-CHF 400k`), and `en-CH` output is pinned **independent of the runtime's ICU**, proved by stubbing `Intl` to `en-US` and `de-DE`. One rounding rule, imported from `derive.ts`. `reconciliation.test.ts` asserts **relationships, not constants** across all three heroes — no drift found. Closes Phase 1b. |

---

## Completed Stories *(Phase 2a onward)*

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
  column canvas grid. No literal colour anywhere - tests pin that
- **Persona is a role:** the label and the "SM" monogram live in one module, and a test asserts the
  app bar's entire text is exactly those labels. No photo - the crest is the only `<img>`
- **Placeholders inert structurally, not by handler:** `<span aria-disabled="true">`, no href, no
  handler, no focus, `pointer-events-none`. Real Chrome: `tabIndex` -1, a synthesised click leaves
  the router at `/`. **Status is decorative:** static text, `data-decorative`, no live region, and
  source assertions that the file holds no `fetch`, `axios`, `useEffect` or timer; at 1920x1080
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
  (changing the React key, so it re-inserts rather than doing nothing); a section already showing
  its follow-up never regresses. A follow-up **flips** its parent's phase - what US-033 needs
- **One grid, not two:** sections re-use the US-012 canvas grid's tracks via `grid-cols-subgrid`.
  Chrome at 1920x1080: tracks 122.656px, tiles 816px at x=256/1088
- **Reflow, never jump:** every mutation runs through US-006's `animateReflow` with `flushSync`
  inside the transition callback; Chrome shows the view-transition group animating as a second
  section inserts, and reduced motion gives zero transitions with an identical final layout.
  **Auto-scroll:** `scrollY` 0 -> 154 at 1280x620 as the third section overflowed
- **No persistence:** a source scan over `app/**` bans `localStorage`, `sessionStorage`, `indexedDB`
  and `document.cookie`; a remount test shows the session starting empty, as a reload does

### US-015: Reset to baseline (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 6 code (all modified) + 4 test files + 8 tracking docs
**Tests Added:** 40 (unit: 40) - 592/592 green, 100% stmts / 99.2% branches / 100% funcs of `app/**`
**Commit:** see phase-2a progress log
**Notes:** 3 of 5 criteria fully met; **criterion 2 (chips, US-029) and half of criterion 4 (the
thinking beat, US-031) are a SEAM, not a claim**, criterion 1's four tiles are US-013 (deferred).
Nothing was invented to make an unbuilt criterion look done.

**What Was Done:**
- Reset is a **transition beside the other three**: `withBaselineRestored` / `BASELINE_SECTIONS` in
  `sections.ts` (pure), `reset` + `schedule` + `generation` on `use-dashboard.ts`, `scrollToTop` in
  `motion.ts`, `<AppShell onReset={reset}>` in `root.tsx`. It restores the same named constant that
  is the hook's initial state, so **nothing says "empty"** and US-013 gets reset for free
- **The timer, proven by breaking it:** `reset` cancels the single pending beat *first*; deleting
  that line makes two tests fail with a `HERO_2` section landing in a just-cleared dashboard
- **Abuse-proof by construction:** `withBaselineRestored` returns the *same reference* when there is
  nothing to clear, so 10 presses in one frame run **one** transition. Real Chrome: `scrollY`
  900 -> 0 over three rapid presses, zero `startViewTransition` calls under reduced motion

### US-027: Motion & animation hooks (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 4 code (1 new, 3 modified) + 3 test files + 5 tracking docs
**Tests Added:** 52 (unit: 52) - 644/644 green, 100% stmts / 99.4% branches / 100% funcs of `app/**`
**Commit:** see phase-2b progress log
**Notes:** All 4 acceptance criteria met. **Built first in Phase 2b on purpose** — the other ten E6
components consume these hooks, so the API was designed for them and documented in the module
header (the precedent US-007 set with `app/lib/repositories/README.md`).

**What Was Done:**
- `app/lib/hooks/use-motion.ts` (the `lib/hooks/` slot the technical spec reserved):
  `useReducedMotion()`, `useGrow()`, `useCountUp(target, animationMs?)`, `useUid(prefix?)`
- **Count-up counts from the CURRENT DISPLAYED VALUE** — the figure on screen is mirrored in a ref
  and read (never depended on) when the target changes, so a filter switched mid-animation carries on
  from the old number. Tests prove the retargeted animation's *opening sample is* the mid-flight
  figure, climbs monotonically, never dips and lands **exactly** on target, upwards and downwards
- **Reduced motion = final state in the same render:** `useGrow` returns `grown || reduced` and
  `useCountUp` returns `reduced ? target : displayed`, so `width={grown ? w : 0}` geometry is never
  stranded at zero — under the preference, `useGrow` is `true` on render one with **zero** frames
- **One reduced-motion source:** the hook subscribes to US-006's query via `useSyncExternalStore`
  (explicit server snapshot, React owns the unsubscribe) and reacts to a *change*; a test greps the
  source and fails if it ever calls `matchMedia` itself. Every rAF, timer and listener is cancelled
  on unmount, asserted with ten tiles unmounted mid-count
- ~900ms is now the `duration.countUp` token read through a new `tokens.durationMs()`; `useUid`
  shares `cssIdentifier`, so a gradient id is always legal in `url(#…)`. **SSR proven**, not
  asserted: `renderToString` with the globals stubbed away plus a real `hydrateRoot` pass

### US-017: KPI tile & variance chip (2 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 3 code (2 new, 1 modified) + 4 test files (3 new, 1 modified) + 5 tracking docs
**Tests Added:** 78 (unit: 78) - 722/722 green, 100% stmts / 99.5% branches / 100% funcs of `app/**`
**Commit:** see phase-2b progress log
**Notes:** All 3 acceptance criteria met. **No real-Chrome pass** — nothing in the app mounts these
components yet; the browser verification belongs to US-013, the first screen that does.

**What Was Done:**
- `app/components/tiles/delta-chip.tsx` — `DeltaChip`, its own module because US-019, US-022 and
  US-016 all want the chip without a tile around it. `app/components/tiles/kpi-tile.tsx` —
  `KpiSparkline`, `KpiFigure` (the number block, no card) and `KpiTile` (`Card` + figure)
- **Colour is never the sole signal, and the `light` variant is where that is proved.** On navy the
  negative token sits near 2:1, so the light variant drops colour coding entirely — a test asserts
  the up and down chips' class strings are **identical** there while the glyph, the explicit sign and
  an `sr-only` direction word all still differ. `text-red` on the chip is rejected by test
- **Direction is arithmetic; judgement is meaning.** An optional `judgement` prop (US-010's
  `varianceJudgement`) gives Marketing's overspend an **up arrow in the negative token**; a zero is a
  **labelled zero** in the neutral treatment, never a variance token
- **One API, three consumers, no variant per hero:** hero extras arrive as `children`; US-016's navy
  band composes `KpiFigure onDark`, which forces the light chip so an illegible red figure cannot be
  left on navy. The 30px/700/tight/tabular number is the existing `.kpi-number` role class
- Motion is US-027's only — a test greps the source and fails on `useState`, `setTimeout`,
  `setInterval` or `requestAnimationFrame`. The sparkline draws itself via `pathLength="1"` + a dash
  offset, paints with `currentColor` so no colour prop exists, and handles degenerate series rather
  than emitting `NaN`: empty renders nothing, flat draws through the middle, one point reads flat
- **Closed the US-012 `tailwind-merge` trap at the root:** `app/lib/cn.ts` declares the named type
  scale as the `font-size` group, **derived** from `tokens.fontSize` via the same `cssVariableName`
  mapping Tailwind builds the utility from, so it cannot drift
- Extracted `tests/unit/support/motion-harness.ts` (the frame and preference stubs) — the nine
  remaining component stories all need them, so there is one harness rather than nine copies

### US-021: Horizontal bar tile (3 pts)
**Completed:** 2026-09-09
**By:** AI
**Files Changed:** 1 code (new) + 1 test file (new) + 5 tracking docs
**Tests Added:** 55 (unit: 55) - 777/777 green, 100% stmts / 99.6% branches / 100% funcs of `app/**`
**Commit:** see phase-2b progress log
**Notes:** All 4 acceptance criteria met. The most reused chart in the product — five consumers, one
row. **No real-Chrome pass** for the same reason as US-017: nothing mounted it yet. *(US-013 has
since given both stories their browser pass — see below.)*

**What Was Done:**
- `app/components/charts/h-bars.tsx` (the `components/charts/` slot the technical spec reserved) —
  `HBarRow` (the unit of reuse), `HBars` (the ranked list) and `HBarTile` (`Card` + rows). US-023 is
  required to compose these; there is nothing left in it to reimplement
- **Both review decisions are read back off the rendered element, not merely written.** The label
  column is 150px at weight 500 and a test *rejects* `truncate` / `text-ellipsis` / `line-clamp`, so
  `Cap "Rotblau"` and `Home shirt 26/27` cannot regain the ellipsis they were reported with — a long
  label wraps (`break-words`) instead. The value column is 96px with `white-space: nowrap`, asserted
  through `getComputedStyle` on every row of three different lists, and `-CHF 150k` / `-CHF 110k` are
  each proven to be a single text node. Both widths are inline geometry from one exported constant
- **One rule serves all five consumers: the sign of the DISPLAYED figure.** It sets the side the bar
  grows from, the token, and the sign in the text — so `negative` mode is only "every row is a
  decline" (it negates the stored magnitude, idempotently, and `formatMoneyCompact` puts the minus
  *before* the unit) and the badge trend's mixed signs (+38%, +6%, -3%) need nothing extra. Direction
  is published as `data-direction`, so no test has to read a colour off a pixel
- **Nothing snaps to zero:** rows are keyed by name, so a data change transitions the *same* bar
  element — a test holds its identity while the width moves 100% → 50% — while `useCountUp` carries
  the figure on from what is on screen; under reduced motion both are final with zero frames. Widths
  come from pure, exported `hBarMax` / `hBarPercent`, which return zero width rather than `NaN`, so
  an all-zero list still renders **labelled zeros** with their tracks
- **One deliberate deviation from the reference, flagged for review:** a decline grows *leftwards*
  here (the reference drew every bar rightwards), so direction survives a washed-out projector

### US-013: Baseline dashboard — four pre-existing tiles (3 pts)
**Completed:** 2026-09-09 (Phase 2a story, executed in the Phase 2b run once US-017 and US-021 existed)
**By:** AI
**Files Changed:** 9 (3 new code, 2 modified code, 1 route, 4 new/modified test files) + 7 tracking docs
**Tests Added:** 103 (unit) — 880/880 green, 100% stmts / 99.58% branches / 100% funcs / 100% lines of `app/**`
**Commit:** see phase-2a progress log
**Notes:** All 4 acceptance criteria met, **plus** US-015's deferred criterion ① (Reset restores the
four baseline tiles). This is the story that makes the prototype look real: the persona sees a
dashboard that already looks lived-in, and their questions ADD to it.

**What Was Done:**
- `app/components/dashboard/baseline-row.tsx` — the four tiles in order, as a **fragment**, so each
  is a direct child of US-012's one canvas grid (3 + 3 + 6 columns and a full-width partner strip at
  `lg`). It composes `KpiTile` ×2 (US-017), `HBarTile` (US-021) and `PartnersTile` on the US-005
  `Card`; it invents no tile kind, no grid, no formatter and no figure. Layout is four span
  constants, and the two KPI tiles `self-start` so a one-number tile is not stretched to the height
  of a five-row bar list
- `app/components/tiles/partner-tile.tsx` — the one new component: `PartnersTile` / `PartnerCard` /
  `PartnerMonogram` / `partnerMonogram()`. Six plates (`BI`, `MA`, `AL`, `SU`, `FE`, `HO`) in each
  partner's **own brand colour, from the data**, with its `PARTNER_ROLE_LABEL` role tag. A test
  asserts **no hex and no FCB colour token appears in the file at all** — a partner plate rendered
  in club red is wrong to a sponsor in the room, which is the audience for this prototype. Monograms
  are `aria-hidden`; the name is text beside them
- `app/lib/dashboard/baseline.ts` + a `loader` on `app/routes/_index.tsx` — the repository is async
  and server-only, so the fetch is an SSR route loader (not an HTTP endpoint) and the components
  stay data-in / DOM-out. Verified: `grep` for `Bitpanda`, `148200` or `Rotblau` over `build/client/`
  returns nothing, so the fixtures never reach the browser bundle
- `app/lib/repositories/derive.ts` — three pure additions. `trailingPoints`, `capacityShare` (which
  `attendanceShare` and the new `matchCapacityShare` both now delegate to, so the ring and the match
  tile cannot round the same ratio two ways), and **`trendEndingAt`**, which windows the sparkline so
  it **ends on the month the headline figure covers** rather than on the tail of a year-to-date
  series that is sliced by today's date — a test pins that it still holds in December
- **NO FIGURE IS RE-TYPED, proven two ways.** Every rendered string is asserted equal to
  `repository → derive → format.ts` output, and a **source scan** over the four files that touch a
  figure fails on any displayed figure appearing as a literal in three spellings (`148200`,
  `148_200`, `CHF 148’200`), on any `CHF <digit>` or `<n>%` string, on `FCB`/`Sion`, on any product
  or partner name, and on `toLocaleString` / `Intl.NumberFormat` / `toFixed`
- **Reset's baseline seam is closed the way US-015 itself described it.** US-015 named two routes and
  US-013 took the second: a baseline tile that is static chrome "needs no entry here at all". The
  tiles are rendered by the route, above and outside the session list, so no question can remove
  them and Reset cannot fail to restore them. Inventing a `HeroId` per tile would have made them
  dedupeable, re-askable, phase-flippable and removable — none of which a baseline tile is.
  `tests/unit/baseline-reset.test.tsx` drives it: four tiles on load → two sections inserted below
  them → Reset → zero sections, four tiles in order, canvas `innerHTML` identical to load state
- **FIRST REAL-CHROME PASS FOR US-017, US-021 AND US-027**, all of which had deferred it because
  nothing mounted them. At 1920×1080 on the production SSR build: four tiles at x=256/672/1088 plus
  a full-width strip on row 2, canvas grid reporting **12 columns**, and
  `documentElement.scrollWidth === clientWidth` — no horizontal scroll, the same at 1440, 1280, 834
  and 390, with the strip folding 6 → 3 → 2 and **no label clipped at any width**. A per-frame probe
  recorded **54 distinct KPI strings** (`CHF 0 → 8’098 → … → CHF 148’200`), **43 distinct bar
  widths** (`0px → 48px → … → 504px`), the sparkline drawing from `dashoffset` 1 → 0 and the tile
  entrance fading through **25 opacity steps** — it counts and grows, it does not snap. Under
  `prefers-reduced-motion: reduce` the same probe recorded **2** KPI strings and **2** bar widths:
  final state within one frame, opacity 1, `transform: none`, **nothing stranded at zero**
- **Labels whole, measured end to end:** all five Top Products labels in a 150px column with
  `scrollWidth <= clientWidth`, `text-overflow: clip` and `white-space: normal` — `Cap "Rotblau"`
  and `Home shirt 26/27` complete, which is US-021's guarantee proven at the point of use
- **Scope held:** no hero band (US-016), no period filter (US-026 — Top Products' `action` slot is
  empty and says why), no prompt bar, no thinking panel, no narrative caption on any tile
- **Security triage: no security-relevant changes detected.** Considered and cleared: new route
  handler (a loader is not an HTTP endpoint — no path, params, query, body or user input, and it
  reads a static in-repo fixture), IDOR, raw SQL, `dangerouslySetInnerHTML`, user-supplied URL /
  SSRF, upload, dependency or lockfile change (**none** — `package.json` and `pnpm-lock.yaml`
  untouched), env var or secret, logging, CSRF, storage API. The one value-driven style is
  `style={{ backgroundColor: partner.brandColor }}`: a module constant, set through the CSSOM, with
  a test asserting every `brandColor` matches `/^#[0-9A-Fa-f]{6}$/`

---

**Auto-Generated** | Updates during `/execute-work` | Append-only log
