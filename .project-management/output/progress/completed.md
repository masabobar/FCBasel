# Completed Work Log

**Last Updated:** 2026-09-10

---

## Summary

**Total Completed:** 42 stories
**Total Points:** 109 / 116
**Start Date:** 2026-09-09 · **Days Active:** 2 · **Average Velocity:** 52 points/day
**Phases Completed:** Phase 1a, 1b, 2a, **2b** (all 2026-09-09) · **Phase 3a closed 2026-09-10 (6/6 · 17/17)** · **Phase 3b closed 2026-09-10 (6/6 · 16/16)** · **Phase 4 in progress (2/6 · 4/14)**

---

## Completed Stories

### US-042: Dead-end path sweep (3 pts) — **EVERY PATH PROVEN TO LEAD SOMEWHERE**
**Completed:** 2026-09-10 · **By:** AI · **Tests Added:** 16 Chrome cases (32 e2e total; unit stays 2225)
**Notes:** US-041's lesson taken literally — **the interactive surface is everything a presenter can
click, type or press**, and the defect it found lived on the one element nobody had ever exercised.
New: `tests/e2e/dead-end-path-sweep.spec.ts` + `support/paths.ts`, reusing US-040/US-041's harnesses;
the three control labels and `BEAT_MS` moved into `support/demo-script.ts` so three specs share one
copy. **No `app/**` source changed; lockfile untouched.** **"Dead-end-free" is ONE helper,
`expectAlive`, on every path:** shell mounted and >= 4 tiles · >= 3 prepared chips and > 2,000 chars
of text · no error boundary, no sideways scroll, never two transient panels — plus **an empty console
per case**. **Swept:** three heroes · three follow-ups · **23 paraphrases**, each landing its intended
hero and no other · **16 off-script strings** (XSS, `<script>`, broken attribute, `javascript:`, SQL,
template expression, CSS selector, path traversal, RTL override, combining marks, five scripts in one
line, **50,000 chars**) all on the fallback with its three chips, **never echoed** · **6
empty/whitespace no-ops** via Enter *and* the send button · **8 two-subject questions asked twice**:
exactly one hero, identical both runs · **3 cold typed follow-ups**, parent first then the chip
offered and taken · **the sidebar Dashboard link pressed 5x with six answers up** (nothing lost, no
history entry) · the three **inert placeholders** proved `<span>` / `pointer-events: none` /
`tabIndex -1` / no `href`, then force-clicked with a real mouse · crest, workspace label, status,
avatar, top bar, sidebar, canvas · **141 canvas slots** · **both tab rings** (11 stops baseline, 19
full canvas), every stop activated with Enter *and* Space, no focus trap · the demo driven
**keyboard-only** · Reset x5 idle, x6 over a full canvas, x6 mid-beat with the beat waited out, and
over the fallback · double-taps, three chips in one burst, a chip mid-beat, five submits of one
question, a hero re-asked after its follow-up — **never a duplicate section** · reload, mid-beat
reload, back and forward. **NO DEAD END FOUND, and the sweep is mutation-tested:** threshold 2 -> 5
failed the paraphrase case, a dead sidebar route failed on *"the app shell is gone"*. **KL-3 recorded,
not fixed** — a reload restores the scroll offset (1920x1080 -> `scrollY 185`); not a dead end by this
story's definition, and removing `<ScrollRestoration />` was tried and does not close it.
**Triage: the A03 user-input trigger fired and is the story's own measurement** — every hostile string
typed on the served page, then every sink read: nothing executed, no markup, no attribute, no URL,
`localStorage` and cookies empty, the only `sessionStorage` key React Router's scroll integers.
Full detail: [`../phases/phase-4.md`](../phases/phase-4.md).

### US-041: Offline resilience verification (2 pts) — **TWO RUNTIME FETCHES FOUND AND KILLED**
**Completed:** 2026-09-10 · **By:** AI · **Tests Added:** 3 unit (2225 green) + 4 offline Chrome cases
**Notes:** Verified by DISCONNECTING, as `phase-4.md` demands — `setOffline(true)` **and** an abort
route over `**`, so a fetch cannot hide behind the weakness of either, against the **built SSR
bundle**, never the dev server. New: `tests/e2e/offline-resilience.spec.ts` + `support/network.ts`,
reusing US-040's harness; **lockfile untouched**. **The whole script ran offline, asserted at every
beat** — baseline (4 cards, band, empty state, 3 chips) → three heroes → three follow-ups (3 gold
dividers, the causal peak) → the sidebar link → off-script (fallback verbatim, nothing removed) →
empty submit (true no-op) → reset → **reset mid-beat**, the pending beat proved *cancelled*; repeated
under **reduced motion**. **Finding 1:** lazy route discovery fetched `/__manifest` on hydration →
`routeDiscovery: { mode: "initial" }`. **Finding 2, a demo-killer:** the sidebar's `<Link to="/">`
revalidated `/_root.data`, which offline failed and replaced **the whole dashboard with an error
boundary from one click** → `shouldRevalidate: () => false` on **both** routes (wrong online too:
the figures are bundled). **Log: 10 requests, all local, 0 after first paint** — zero
fetch/webfont/foreign-origin/`fcb.ch`, zero console errors, favicon 200, every document
`src`/`href` root-relative. **Triage: no trigger fired; A10/SSRF has no surface at all.**
Full detail: [`../phases/phase-4.md`](../phases/phase-4.md).

### US-040: Presentation sizing & responsiveness (2 pts) — **PHASE 4 OPENS**
**Completed:** 2026-09-10 · **By:** AI · **Tests Added:** 11 unit (2221 green) + 12 Chrome cases
**Notes:** A measurement story, measured — real Chrome against `pnpm build` + `pnpm start`, with the
**full run-of-show loaded first** (three heroes, three follow-ups, 15 cards). New:
`playwright.config.ts` and `tests/e2e/` (spec + demo-script support); `@playwright/test` was already
a devDependency, so **the lockfile is untouched**. **Clean at eleven
viewports** — the five the story names, four projector aspect ratios (16:10, 16:9, two 4:3) and both
tablet orientations: no page horizontal scroll (`scrollWidth === clientWidth` everywhere), no
in-card scroll (the department table's `overflow-x-auto` never engages at 1024+), no clipped tile,
no truncated axis label, no SVG text outside its plot, no clipped legend, and **prompt-bar clearance
+10.5px to +11.2px**. Mid-session resize 1920 → 1024 → 1920 with every section open is clean both
ways. **One real defect fixed:** Top Products' four-option period filter was clipped by 25.7px at
1152 and 89.7px at 1024, so `WIDE_SPAN` became `col-span-full xl:col-span-6` — the same measurement
that made US-036 pick `xl`, and **a proved no-op at all five target viewports**. **The favicon
defect is closed** (three reviews had called it pre-existing): `public/favicon.ico`, a 32x32 ICO
derived from the already-local crest by `sips` and **re-encoded from raw samples** so only
`IHDR`/`IDAT`/`IEND` ship, declared by a new `links` export — `200 image/x-icon`, and the full script
now runs with **zero console errors and zero responses ≥ 400**. Security triage: the external-binary
trigger fired and the bytes were read back (ICO header, declared length, chunk table consuming the
buffer exactly); **US-004's XMP/hostname leak did not recur, but `sips` attached `eXIf` and `sRGB`
of its own** — both dropped, absence asserted. **Two known limitations recorded in `phase-4.md`
rather than fixed** (the 390px delta-chip overlap; sub-768px generally), with numbers.

### US-039: Hero 3 follow-up — why Marketing is off plan *(the causal peak)* (3 pts)
**Completed:** 2026-09-10 · **By:** AI · **Tests Added:** 63
**Notes:** The beat the prototype exists to produce, and composition to the end — three grid rows
join `hero-3.tsx` (shared `FollowUpDivider`, one `DriverTile`, `RecommendationPanel` in its **gold
`recommendation` variant**) and **no module, bar, badge, divider or panel was built**.
`PlaceholderFollowUp` DELETED: the last stand-in in the product is gone, proved by scanning every
`app/**` source. **The drivers explain the whole overspend** — activations `CHF 240k`, paid social
`CHF 150k`, retainer `CHF 20k`, badge **`CHF 410k total` summed from the rows on screen**, which *is*
`departmentVariance` for the department the table flags (asserted as an equality). The retainer
renders although the narrative omits it (the two named are 390 of 410), and the paid-social row says
`CHF 150k`, never the sentence's 18%. **Both halves on one tile:** the conversion gap reads
"webshop conversion 2.2% vs 2.6% plan" under the bars, worded independently of the verbatim clause.
The ADVERSE badge takes its judgement from `derive.ts` via the flagged row, so no verdict is named
in the hero; "Marketing" appears once, as the AC-pinned title. Narrative byte-identical at **468**
chars (three hyphens `0x2d`, apostrophe `0x27`, backlog cross-check). **The whole demo script runs in
Chrome:** baseline → three heroes → three follow-ups (the third TYPED as "why is marketing high?") →
off-script fallback → Reset, with zero requests after first paint and no overflow at six widths.
**Phase 3b closed: 6/6, 16/16 pts.**

### US-038: Hero 3 primary — department budget vs actual vs target (3 pts)
**Completed:** 2026-09-10 · **By:** AI · **Tests Added:** 66
**Notes:** First mount of `DepartmentTableTile`; the hero holds layout, copy and ONE formatter
composition (no `<svg>`, no `<table>`, no hex, no re-typed figure). **The revenue/cost trap asserted
on screen, on the real data:** Marketing's +0.41 renders ADVERSE while Sponsoring's +0.84 renders
FAVOURABLE, and flipping Marketing's type in test flips the verdict. **One row flagged, chosen by
`needsAttention`**, with "Marketing" absent from the layer; gold band end to end (Hospitality 95
marked, Merchandising 92 not). Title ships as "Departmental performance (full year)" — the backlog's
"CHF 000" half is what US-022 was reported for. Overall: `CHF 69.68M`, `+1%` NEUTRAL, compare bars
`CHF 69.00M` / `CHF 69.68M`, blended 96% STORED, above-target `3 of 6` DERIVED. Narrative
byte-identical at 270 chars. `PlaceholderBody` deleted — every primary answer is real.

### US-037: Hero 2 follow-up — which fixtures are driving the drop (2 pts)
**Completed:** 2026-09-10 · **By:** AI · **Tests Added:** 56
**Notes:** The second so-what beat, and the story US-023 was built for — **no module, bar, badge or
divider was built**. Phase flips, never appends: one section, four cards, chip withdrawn. **The tie
holds** — FCZ -CHF 150k, Lugano -CHF 110k, Luzern and Sion -CHF 70k, Luzern first, asserted against
the derived order. **Criterion 5 end to end:** 96px + `nowrap` read off the rendered rows. The
`-CHF 400k total` badge is summed from those rows; narrative byte-identical, seven hyphens at 0x2d,
"3,200" comma left as authored (US-011's accepted tension).

### US-036: Hero 2 primary — ticket revenue year on year (3 pts)
**Completed:** 2026-09-10 · **By:** AI · **Tests Added:** 76
**Notes:** First mount of `GroupedBarTile`, plus one new module (`CompareBars`, borrowing US-021's
scale — US-038 reuses it). **Both scope labels on screen and the mismatch asserted real** (monthly
9,770 > fixtures 7,830); every total derived, narrative byte-identical (229 chars). Chips measured
in Chrome (59.5px in 83.4px cells), so the pair stacks below `xl`.

### US-035: Hero 1 follow-up — which badge to push next (2 pts)
**Completed:** 2026-09-10 · **By:** AI · **Commit:** 2881275 · **Tests Added:** 43
**Notes:** Pure assembly — DriverTile + RecommendationPanel behind a shared gold Follow-up divider.
Phase flips rather than appending; narrative renders from the dataset. Dispatch was interrupted
before commit; verified independently against all five gates before being committed.


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

## Phase 2a: Shell & Baseline — closed 2026-09-09 (5 stories · 16 pts)

US-012 to US-015 condensed to keep this log inside its 300-line limit; the **full per-story detail
lives in [`../phases/phase-2a.md`](../phases/phase-2a.md)**, the authoritative record. US-016's
entry stays in full below the table — it is the story that closed the phase.

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-012 Branded application shell | 3 | 57 | `chrome/{sidebar,top-bar,app-shell}.tsx` + `lib/persona.ts` — navy sidebar (hidden below `lg`), app bar with the self-hosted crest, and a 12/8/4 canvas grid left **empty** for US-013/014/015/016. No literal colour anywhere. **Persona is a role:** one module holds the label and the "SM" monogram, and a test asserts the app bar's entire text is exactly those labels. **Placeholders are inert structurally, not by handler** (`aria-disabled`, no href, no focus, `pointer-events-none`); status is decorative — no live region, no `fetch`, no timer. Chrome: `scrollWidth === clientWidth` at 1920x1080. |
| US-014 Dynamic tile insertion & grid reflow | 3 | 77 | `lib/dashboard/sections.ts` (pure) + `use-dashboard.ts` (state, owned by `root.tsx`): the session as a memory-only `{heroId, phase, revision}` list. The dashboard **grows, it never clears**. **Dedupe by hero id** — re-asking keeps ONE section in place and bumps `revision` so it re-inserts rather than doing nothing, and a follow-up *flips* its parent's phase (what US-033 needs). **One grid, not two:** sections re-use US-012's tracks via `grid-cols-subgrid`. **Reflow, never jump** — every mutation runs through `animateReflow` with `flushSync` inside the callback; reduced motion gives zero transitions with an identical layout. A source scan bans every storage API. |
| US-013 Baseline dashboard — four tiles | 3 | 103 | `dashboard/baseline-row.tsx` + `tiles/partner-tile.tsx` + `lib/dashboard/baseline.ts` + a `loader` on `_index.tsx`: **the canvas stops being empty.** Four tiles in order as direct children of the one canvas grid, composing `KpiTile` ×2, `HBarTile` and `PartnersTile` — no new tile kind, no second grid. **No figure re-typed:** every string asserted equal to `repository → derive → format.ts`, plus a source scan over four files for literals, `CHF`/`%` strings, product and partner names and `toLocaleString`/`toFixed`. `trendEndingAt` makes the sparkline END on the month the headline covers. Partner plates carry the partner's **own** brand colour (no hex, no FCB token in the file). Reset's baseline seam closed as static route chrome, driven end to end by a test. First real-Chrome pass for US-017/US-021/US-027. |
| US-015 Reset to baseline | 2 | 40 | Reset built as a **transition beside the other three**: `withBaselineRestored` / `BASELINE_SECTIONS`, `reset` + `schedule` + `generation`, `scrollToTop`, `<AppShell onReset>`. It restores the same named constant that is the hook's initial state, so **nothing says "empty"** and US-013 gets reset for free. **The timer, proven by breaking it:** `reset` cancels the pending beat *first*; deleting that line makes two tests fail with a `HERO_2` section landing in a just-cleared dashboard. **Abuse-proof by construction** — the same reference comes back when there is nothing to clear, so 10 presses in one frame run **one** transition. 3 of 5 criteria met at the time; **② is now SATISFIED by US-029** (the row is derived from `sections`) and **④ by US-031** (Reset mid-beat leaves no panel, no section and no timer) — **all five now met.** |

---

### US-016: Hero band — webshop trend & attendance ring (5 pts)
**Completed:** 2026-09-09 · 92 tests (1090 green) — **it closes Phase 2a at 5/5 · 16/16.** One period
control drives both the webshop chart and the attendance ring, proven structurally *and*
behaviourally; `attendance-ring.tsx` is the one genuinely new visual (pure `ringGeometry` clamped to
0-1, the sweep a `stroke-dasharray` transition, hover and focus answering identically).
`personaGreeting(now)` takes the DATE so server and browser cannot disagree about the hour. **One
real defect found and fixed in `LineChart`:** its end axis labels were clipped by the svg bounds, so
`axisLabelAnchor` now anchors the first and last inwards. Full detail:
[`../phases/phase-2a.md`](../phases/phase-2a.md).


## Phase 2b: Component Library — CLOSED 2026-09-09 (11/11 · 29/29 pts)

Condensed to keep this log inside its 300-line limit; the **full per-story detail lives in
[`../phases/phase-2b.md`](../phases/phase-2b.md)** and in the completion notes in
[`../../input/backlog/phase-2b-components.md`](../../input/backlog/phase-2b-components.md).

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-027 Motion & animation hooks | 3 | 52 | `app/lib/hooks/use-motion.ts` — `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`. **Built first on purpose:** the other ten E6 components consume them. **Count-up counts from the CURRENT DISPLAYED VALUE** (ref-mirrored, read not depended on), so a filter switched mid-animation carries on from the old number and lands exactly on target. **Reduced motion = final state in the same render**, so `width={grown ? w : 0}` geometry is never stranded at zero (zero frames requested). One reduced-motion source via `useSyncExternalStore`; a scan fails any component calling `matchMedia`; SSR proven by `renderToString` + `hydrateRoot`. |
| US-017 KPI tile & variance chip | 2 | 78 | `tiles/delta-chip.tsx` (its own module — US-019/US-022/US-016 want the chip alone) + `tiles/kpi-tile.tsx` (`KpiSparkline`, `KpiFigure`, `KpiTile`). **Colour is never the sole signal, and the `light` variant proves it:** on navy a test asserts the up and down chips' class strings are *identical* while glyph, sign and an `sr-only` word still differ. **Direction is arithmetic, judgement is meaning** — an optional `judgement` prop gives Marketing's overspend an up arrow in the negative token; a zero is a labelled zero. Closed the US-012 `tailwind-merge` trap in `app/lib/cn.ts`. |
| US-021 Horizontal bar tile | 3 | 55 | `charts/h-bars.tsx` — the most reused chart in the product: `HBarRow` / `HBars` / `HBarTile`, five consumers, one row. **Both review decisions are read back off the rendered element:** the 150px weight-500 label column with `truncate` / `text-ellipsis` / `line-clamp` *rejected*, and the 96px `nowrap` value column proven via `getComputedStyle` with `-CHF 150k` a single text node. **One rule serves every consumer: the sign of the displayed figure** — anchor side, token and text sign, so `negative` mode is idempotent on a stored magnitude. Rows keyed by name; `hBarMax` / `hBarPercent` return zero, never `NaN`. A decline grows **leftwards** (deliberate deviation). |
| US-025 Line chart component | 3 | 73 | `charts/line-chart.tsx` — the only line chart, built for both consumers at once: `lineChartGeometry` (pure), `LineChartLegend` (standalone, because the band puts its legend in its own header row), `LineChart`, `LineChartTile`. Variable series count, per-series `area` / `dash`, colour by token **name**. **The stroke draw survives reduced motion:** `pathLength="1"` + an offset transitioning 1 → 0, and a test reads `stroke-dashoffset="0"` with zero frames requested. **It replays by being re-keyed and by nothing else.** Hover lists every series at the nearest index; `hoverIndex` / `nextHoverIndex` / `tooltipAnchor` are the pure helpers every later chart imports. |
| US-026 Segmented period filter control | 2 | 45 | `controls/segmented.tsx` — one control for all three consumers, **wired into none** (mounting belongs to US-016 / US-034), which unblocked US-016. **11px is a reviewed radius, not a pill:** `rounded-chip` + the new `.fcb-chip`, whose `border-radius: var(--radius-chip)` a test reads back out of `app/app.css`, with `rounded-full` / `9999px` / `--radius-pill` rejected in markup, source *and* stylesheet. **`PeriodKey` reused, never re-declared** (a `@ts-expect-error` fails typecheck if the key loosens to `string`); the label is data on the entry. **Controlled with no opinion of its own**, so one control drives two tiles or three. Radiogroup semantics, one tab stop, wrapping arrows + Home/End. |
| US-018 Vertical bar chart tile | 3 | 52 | `charts/v-bars.tsx` — `vBarGeometry` (pure), `VBars`, `VBarTile`, for US-034's kit split. **Criterion 3 is proven by a RE-RANK, not a rerender:** columns keyed by category, so `Home` keeps the *same* `<rect>` while `x` / `y` / `height` transition; identity asserted across a data change *and* a re-ordered dataset, and an index key fails exactly two tests. The surviving instance keeps its `useCountUp` state; reduced motion lands on final heights with zero frames. Gradient caps, gridlines, `filter` hover highlight, optional `tooltip(index)`; category labels are DOM text so a long one wraps; `niceMax` / `vBarHeight` never yield `NaN`. |
| US-019 Grouped bar chart tile | 3 | 63 | `charts/grouped-bars.tsx` — `groupedBarGeometry` (pure), `GroupedBars`, `GroupedBarTile` for US-036: sixteen bars and eight `DeltaChip`s in one tile. **The overlap fix is arithmetic, not padding:** the y-axis owns a 44-unit gutter everything is inset to, and a 34-unit chip band stays clear because the axis maximum is *derived from the geometry* — a fixed 10% headroom fails the test. Both halves measured (8 pairs and 14). **No per-bar value labels by design**, except a labelled zero; pairs keyed by fixture, an index key fails the re-rank test. |
| US-020 Donut / ring tile | 3 | 56 | `charts/donut.tsx` — `donutGeometry` (pure), `Donut`, `DonutTile` for US-034: four gapped segments, a counting centre and a legend. **Not US-016's single-arc gold gauge**, sharing only the dasharray technique. **Two hover surfaces, ONE state** — an arc and its legend row write the same index, and rows are real buttons so focus does what hover does. **Segments morph rather than re-enter** (arcs keyed by sponsor). The arithmetic is `badgeSegments`' (US-008), so segments sum exactly to the centre total on every period and ten adversarial ones. |

### US-022: Department table tile (3 pts)
**Completed:** 2026-09-09 · 54 tests, 100% on the new file. A real `<table>` for six rows and a
total. **The revenue/cost trap is closed by construction:** colour comes from `row.judgement`, so
Marketing's +410 renders UP and ADVERSE while Sponsoring's +840 renders UP and FAVOURABLE, and a
source scan rejects `FAVOURABLE`/`ADVERSE`, any `variance` comparison and any `DepartmentType`
equality. The flag is `needsAttention`, not a hardcode — Marketing's name never appears in the
source. Full detail: [`../phases/phase-2b.md`](../phases/phase-2b.md).


### US-023: Driver / breakdown tile (2 pts)
**Completed:** 2026-09-09 · 43 tests. A deliberate REUSE story — every row is US-021's `HBarRow`, and
a source scan rejects the width constants, the motion hooks, gradients and a second `Card`, so the
tile cannot thicken. Ranking is stable (magnitude on a copy, ties keep arrival order). Full detail:
[`../phases/phase-2b.md`](../phases/phase-2b.md).


### US-024: Recommendation panel & narrative caption strip (2 pts)
**Completed:** 2026-09-09 · 30 tests. Gold accent panel plus the caption strip; gold as an ACCENT
only, never a third fill. Full detail: [`../phases/phase-2b.md`](../phases/phase-2b.md).


## Phase 3a: Conversational Interface — closed 2026-09-10 (6/6 stories · 17/17 pts)

Stories US-028 to US-032 condensed to keep this log inside its 300-line limit; the **full per-story
detail lives in [`../phases/phase-3a.md`](../phases/phase-3a.md)**, which is the authoritative record.

| Story | Pts | Tests | What it left behind |
|---|---:|---:|---|
| US-028 Persistent prompt bar | 2 | 48 | **Opens Phase 3a.** ONE field, and the field IS the typing area - icon and send button are siblings of the `<input>` inside the single bordered element, so the reported nested box is rejected structurally (a test fails on any bordered/ringed descendant). A real HTML `<form>`, so Enter and the button are ONE code path; **criterion 4 without a second clock** - a submit CONSUMES the question through a mirrored ref written *before* `onSubmit`. `fixed`, not `sticky`, so the PAGE keeps scrolling. **Security A03 fires and is closed:** the value is rendered only as an input `value`, never as markup. |
| US-029 Suggestion chips & chip lifecycle | 3 | 57 | **THE ROW IS DERIVED, NOT STORED** - three hero chips always plus one follow-up per section still at `PRIMARY`, so criterion 3's removal is implemented *nowhere*. Proven over **all 27** hero x phase combinations, and **US-015 criterion 2 is thereby satisfied** with no reset code touched. A tap bypasses scoring BY TYPE (`selectChip` takes a chip; a `@ts-expect-error` case guards the seam). Surface reused; kind is never colour alone. This derivation is what US-033 later reads as its gate. |
| US-030 Intent normalisation, scoring & tie-breaking | 5 | 89 | **The highest-risk story in the build, verified rather than trusted.** normalise -> +2 strong / +1 weak -> threshold 2 hero / 3 follow-up -> **strictly-greater** over an ordered config, so the order IS the tie-break; an **oracle** test asserts identical scores *and* winners across a 90-phrase corpus. 34 phrasings table-driven, each canonical label beating its own follow-up by an asserted margin; one input yields **one** match or `null`. The two inherited rough edges (prefix / substring) are pinned as the contract. Golden rule by scan. **Security A03 fires and is closed.** |
| US-031 Thinking beat | 2 | 91 | **STAGECRAFT, NOT A QUERY** - a fixed delay and six authored copy blocks; **no request is made** anywhere in the three new modules (scanned). **The ordering is asserted:** at `1150ms - 1` the panel is up with NO section; at `1150ms` the section is there and the panel gone - landing the answer immediately fails **22** tests. Both paths pause and neither module changed. **STILL ONE TIMER**, so **US-015 criterion 4 is satisfied**, proved by mutation twice over. Reduced motion ~260ms at final state. |
| US-032 Graceful fallback panel | 2 | 125 | **One of the three behaviours the backlog marks untouchable.** Two distinct panels, never conflated: the **fallback** (a typed question that matched nothing) and the **empty state** (the canvas before anything is asked). **The copy is byte-identical**, asserted as UTF-8 bytes against a retyped literal *and* the backlog itself. **Criterion 2 asserted as an ABSENCE:** 18 blame words out of copy, panel *and* source; no alert role, no `aria-invalid`, **the question never echoed** (no question prop exists). No beat precedes it; `canvasPanelFor` returns ONE panel. |

### US-033: Follow-up context gating (3 pts) — **CLOSES PHASE 3a**

**Completed:** 2026-09-10 · 46 tests (**1849 green**) · `follow-up-gate.ts` (new) read by both the
answer and the beat · all 5 criteria met.

- **The behaviour was already correct at HEAD — recorded plainly rather than overclaimed:** reverting
  the two call sites fails only the source-scan tests. The story is the rule made explicit,
  single-sourced and exhaustively proved; the dead end is guarded by **mutation** (calling
  `withFollowUpShown` unconditionally fails 10 of the new tests).
- **THE TWO-STEP, ALL THREE HEROES, ON THE REAL `App`:** a cold typed follow-up renders the **PARENT**
  at `primary`, the follow-up chip is *then* offered, and the tap flips the phase — one section, never
  two, never an error and never the fallback. The panel shows the PARENT's message, by design.
- **ONE SOURCE OF TRUTH:** a source scan pins `hasSection` and `INTENT_REQUIRES_PARENT` to two
  readers each, so gating and US-029's chip row are two readings of one list; Reset re-gates for
  free. Hero independence proved as a property over all 27 session shapes and on the real `App`.
- **Security triage — nothing relevant:** the gate is a pure function of a section list and a closed
  enum, and the typed string never reaches it.

---


**Auto-Generated** | Updates during `/execute-work` | Append-only log
