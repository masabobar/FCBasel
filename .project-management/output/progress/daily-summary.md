# Daily Work Summary

**Date:** 2026-09-09 (Wednesday) · **Last Updated:** 2026-09-09

---

## Today's Summary

**Stories Completed:** 21 — **Phases 1a, 1b and 2a all complete (2a closed by US-016); Phase 2b at
5/11**
**Story Points:** 53
**Time Worked:** ~14.5 hours · **Files Changed:** 198 · **Tests Added:** 1090

---

## Work Log

- **Phase 1a — US-001 to US-006 (14 pts), closed.** Condensed; the full account is in
  [`../phases/phase-1a.md`](../phases/phase-1a.md). In short: the React Router 7.18 SSR scaffold
  verified by execution (US-001, Railway deploy still a human step); ESLint 9 + Prettier + husky with
  the hook *proved* to fire (US-002); one design-token set published as Tailwind v4 properties and as
  typed objects, held in lockstep by a drift test (US-003); the crest self-hosted after verifying its
  bytes were PNG (US-004); one `Card` shell of collapsing slots (US-005); and the four reveal
  keyframes plus `app/lib/motion.ts`, where **reduced motion renders final state rather than
  switching animation off** (US-006).
- **US-007 — Persona baseline datasets.** The first data story, so it sets the shape US-008 to
  US-010 follow: enums, domain types and the repository interface in `app/lib/repositories/`,
  fixtures in `app/lib/mock/`, one line of selection in `index.server.ts`. All four periods, per the
  user's approved decision. The headline webshop figure and its delta are **computed from the
  series**, so a number cannot disagree with the chart under it; the long periods label their x-axis
  from an injectable clock. Partner brand colours stay outside the FCB palette. 228/228.
- **US-008 — Hero 1 dataset: shirt sales, badges, printed names.** One hero object with `primary`
  and `followUp` so a tile and its escalation cannot drift. **Nothing derivable is stored:** kit
  revenue is units × CHF 99, the Home share 58% and the badge share exactly 8%. `badgeSegments`
  corrects its rounding remainder so the four parts sum *exactly* to the total, proved for every
  total from 0 to 2,000. Narratives verbatim by SHA-256 (273/273).
- **US-009 — Hero 2 dataset: ticket revenue year on year.** Eight home fixtures in CHF thousands
  (7,880 → 7,830) plus the twelve-month series. The real risk was labelling, not arithmetic: the two
  charts sit at deliberately different scopes, so `scopeLabel` is a field on each series and tests
  assert the labels differ and that the monthly total is the larger. Nothing derivable is stored —
  the headline -0.6%, the four declines and the -CHF 400k badge all come off the fixture pairs.
  Narratives verbatim (304/304).
- **US-010 — Hero 3 dataset: departmental performance.** Six departments in CHF thousands
  (69,000 → 69,680, +680 / +1.0% derived). The new idea is that a TAG carries the meaning of a
  number: above budget is money earned for five departments and an **overspend** for the Marketing
  cost centre, so `varianceJudgement` decides good-or-bad once from `DepartmentType` — and one test
  proves a naive "variance > 0 is good" rule misreads exactly one department. `blendedTargetPercent`
  is the one stored figure, a measurement no arithmetic over the rows reproduces. The follow-up
  reconciles: 240 + 150 + 20 = 410, exactly Marketing's variance. Departments, never people. 44
  tests (348/348).
- **US-011 — Formatters & cross-hero reconciliation.** Phase 1b closes with the two things that keep
  the other four data stories honest. `app/lib/format.ts` is the one place a number becomes a string:
  money always carries `CHF`, the sign goes *before* the unit (`-CHF 400k`), and millions render bare
  under the "figures in CHF millions" subtitle. `en-CH` groups thousands with the Swiss U+2019 mark —
  pinned as a constant and made independent of the runtime's ICU, proved by stubbing `Intl` to
  `en-US` and `de-DE`. `oneDecimal` is imported from `derive.ts`, so there is exactly one rounding
  rule. The reconciliation suite asserts relationships rather than constants — 58.18% → 58%, the
  fixture fall of 50 becoming -0.6%, Marketing's drivers summing to exactly 410, and every narrative
  number swept against what the data can produce. **No drift found.** 418/418.
- **US-012 — Branded application shell.** `app/components/chrome/{sidebar,top-bar,app-shell}.tsx`
  plus `app/lib/persona.ts`: the navy sidebar (hidden below `lg`), the app bar carrying the US-004
  crest, the workspace label, a decorative connection status and Reset, and a canvas grid stepping
  12 → 8 → 4 columns. `root.tsx` mounts the shell around `<Outlet />` and `_index.tsx` shrinks to the
  screen's `h1`, so the routed page renders as grid items and a hero inserted later joins the same
  grid. The canvas is deliberately **empty** — the tiles are US-013, insertion US-014. Three things
  were made structural rather than trusted. **The persona is a role:** the label and the "SM"
  monogram live in one module and a test asserts the app bar renders no text beyond those labels.
  **The placeholders are inert by construction** (`aria-disabled`, no href, no focus — Chrome reports
  `tabIndex` -1 on all three). **The connection status is decorative:** static, no live region, no
  `fetch` and no timer. No horizontal scroll at 1920×1080. 475/475 green.
- **US-014 — Dynamic tile insertion & grid reflow.** The mechanic the demo turns on: the dashboard
  **grows, it never clears**. The session is a memory-only list of `{heroId, phase, revision}` —
  pure transitions in `sections.ts`, React state in `use-dashboard.ts`, owned by `root.tsx`. Sections
  are **direct children of the US-012 canvas grid**, re-using its tracks via `grid-cols-subgrid`.
  Re-asking a hero **refreshes in place**, and a follow-up **flips** its parent's phase rather than
  appending, which is what US-033 inherits. Reflow runs through US-006's `animateReflow` with
  `flushSync` inside the transition callback; Chrome shows the view-transition group animating and
  the newest section scrolled into view, while reduced motion recorded zero view transitions and an
  identical layout. An `app/**` source scan bans every storage API. 552/552.
  **Phase 2a now 2/5 stories, 6/16 points.**
- **US-015 — Reset to baseline.** The control that lets the demo be run twice, built as a
  **transition beside the other three** rather than a mode: `withBaselineRestored` and the named
  `BASELINE_SECTIONS`, `reset` / `schedule` / `generation`, `scrollToTop`, `<AppShell onReset>`.
  **Reset restores a named baseline, never a literal empty list**, and that constant is *also* the
  hook's initial state. **The pending timer is the story:** `reset` cancels it first, and deleting
  that line makes two tests fail with the beat dropping an answer into a just-cleared dashboard. The
  *same list reference* comes back when there is nothing to clear, so ten presses in one frame run
  **one** view transition. The chips (US-029) and the beat (US-031) are honestly a seam. 592/592.
- **US-027 — Motion & animation hooks.** Phase 2b opens with the story every other component in it
  depends on: `useReducedMotion`, `useGrow`, `useCountUp`, `useUid`, with the consumer API in the
  module header so the next ten stories are composition rather than invention. **Count-up counts
  from the figure on screen, not from zero** — a test proves a target changed mid-flight opens the
  new animation *on that very figure* and lands exactly on target. **Reduced motion means final
  state in the same render:** `useGrow` is `true` on the first render with **zero** frames
  requested, so `width={grown ? w : 0}` geometry is never stranded. One reduced-motion source, every
  rAF/timer/listener cancelled on unmount, and SSR *proven* by `renderToString` plus a real
  `hydrateRoot` pass. 52 tests added, 644/644 green.
- **US-017 — KPI tile & variance chip.** The first component built on those hooks, and the shape the
  other nine follow: `DeltaChip` in its own module, plus `KpiSparkline`, `KpiFigure` and `KpiTile`.
  **The chip is where "colour is never the sole signal" stops being a slogan.** Direction is carried
  four independent times — glyph, explicit sign, `sr-only` word, and only then the token colour — and
  the `light` variant is the proof: on navy it drops colour coding altogether, and a test asserts the
  up and down chips' class strings are **identical** while glyph, sign and spoken word still differ.
  **Direction is arithmetic, judgement is meaning:** an optional `judgement` prop draws Marketing's
  overspend as an up arrow in the *negative* token. **No variant per hero** — extras arrive as
  `children`, and US-016's band composes `KpiFigure onDark`. Motion is US-027's, and **the US-012
  `tailwind-merge` trap is closed at the root**. 78 tests, 722/722.
- **US-021 — Horizontal bar tile.** The most reused chart in the product, built once for five
  consumers as `HBarRow` / `HBars` / `HBarTile`. **The two review decisions are read back off the
  rendered element by tests:** a 150px label column with `truncate` / `text-ellipsis` /
  `line-clamp` *rejected*, so `Cap "Rotblau"` cannot regain its reported ellipsis, and a 96px
  `nowrap` value column asserted through `getComputedStyle`. **One rule serves every consumer: the
  sign of the displayed figure** — it sets the anchor side, the token and the sign in the text. Rows
  are keyed by name, so a filter change transitions the *same* bar while the figure counts on from
  what is on screen. One deviation flagged: a decline grows *leftwards*. 55 tests.
- **US-016 — Hero band. Phase 2a is closed (5/5 · 16/16).** The navy band above the baseline row,
  and the first thing to mount `LineChart` and `Segmented` in the app.
  **ONE `Segmented` drives both halves** from a single `BaselinePeriod` entry — one `useState` and
  one `<Segmented>` in the file, both counts pinned by tests — so the gold-area-over-dashed-white
  chart (re-keyed by period, which is what replays the stroke draw) and the new hand-built
  `AttendanceRing` (arc sweeping on `stroke-dasharray`, centre swapping to "% of capacity" on hover
  *or focus*, with a gold glow that is an accent on a 12px arc and never a fill) cannot disagree
  about the month. **The total and its delta are `seriesTotals` off the plotted array on every
  render**, and `HeroBandData` deliberately has no field to read a stored one from. The greeting is
  resolved in the loader from an injectable clock, so server and browser cannot differ on the hour.
  **US-013's loose end closed:** Top Products' `action` slot now holds a light `Segmented`, its own
  period, independent of the band's by design. Chrome at 1920×1080: **54 distinct KPI strings from
  `CHF 148’200` → `CHF 132’400`, still the old figure in the frame after the click**, 44 stroke
  offsets on the re-keyed line, 43 arc dash pairs on the same element, and one KPI / one ring value
  under reduced motion. One defect exposed by first mount, fixed in `LineChart`: clipped end axis
  labels. 92 tests, 1090/1090.
---

## Stories Completed Today

- ✅ **Phase 1a — US-001 to US-006 (14 pts), closed 6/6.** US-001 4/5 criteria (Railway deploy
  deferred); US-002 to US-006 all criteria met — the token set's CSS and TypeScript halves held in
  lockstep by a drift test, the crest's format verified from its bytes with no `fcb.ch` reference
  left in the build, one reusable card shell with no per-hero copies, and fade-and-rise motion where
  reduced motion renders final state.
- ✅ **Phase 1b — US-007 to US-011 (10 pts), closed 5/5.** Every acceptance criterion met, and US-007
  to US-009 deliberately exceeded theirs (all four periods, the twelve-month series) per the user's
  approved scope decision. US-010 derives the Revenue/Cost judgement and the attention flag rather
  than storing either; US-011 adds one shared display layer, one rounding rule, and a reconciliation
  suite that found **no drift**.
- ✅ US-012 — Branded application shell (3 pts) — all 5 acceptance criteria met, and the two easy
  ones to fake were measured in a real browser. **Phase 2a opens here: 1/5 stories, 3/16 points.**
- ✅ US-014 — Dynamic tile insertion & grid reflow (3 pts) — all 7 acceptance criteria met: dedupe
  by hero id proven in unit tests and in Chrome, a follow-up flips its parent's phase, the reflow
  tween observed animating, no storage API anywhere. **Phase 2a: 2/5, 6/16 points.**
- ✅ US-015 — Reset to baseline (2 pts) — 3 of 5 acceptance criteria fully met; the chips (US-029)
  and the thinking beat (US-031) are recorded as seams rather than claimed.
  **Phase 2a partial: 3/5 stories, 8/16 points, left open.**
- ✅ US-027 — Motion & animation hooks (3 pts) — all 4 acceptance criteria met, including the two
  subtle ones: count-up continues from the current displayed value, and nothing is stranded at zero
  under reduced motion. **Phase 2b opens here: 1/11 stories, 3/29 points.**
- ✅ US-017 — KPI tile & variance chip (2 pts) — all 3 acceptance criteria met; the delta chip's
  meaning survives with the colour removed, and the named-size/colour `tailwind-merge` trap is closed
  for every component after it. **Phase 2b now 2/11 stories, 5/29 points.**
- ✅ US-021 — Horizontal bar tile (3 pts) — all 4 acceptance criteria met on the row *five* tiles
  share. Both review decisions are read back off the rendered element by tests — the 150px label with
  no truncation class, and the 96px `nowrap` value column — and one rule (the sign of the displayed
  figure) covers positive lists, `negative` mode and a mixed-sign dataset alike.
  **Phase 2b now 3/11 stories, 8/29 points.**
- ✅ US-013 — Baseline dashboard, four pre-existing tiles (3 pts) — all 4 acceptance criteria met,
  **plus** US-015's deferred criterion ① (Reset restores exactly these four tiles). Every figure
  traces to the US-007 repository through an SSR loader, and the row composes existing components
  rather than adding a tile kind. First real-Chrome pass for US-017, US-021 and US-027.
  **Phase 2a now 4/5 stories, 11/16 points** — US-016 still deferred, so the phase stays open.
- ✅ US-025 — Line chart component (3 pts) — all 5 acceptance criteria met on one chart serving both
  the navy hero band and Hero 2's month-by-month comparison. The stroke-draw entrance replays on a
  re-key and renders fully drawn in the first render under reduced motion; the tooltip shows every
  series at the hovered x; two charts on screen carry distinct gradient ids.
  **Phase 2b now 4/11 stories, 11/29 points.**
- ✅ US-026 — Segmented period filter control (2 pts) — all 3 acceptance criteria met: it renders in
  a card's `action` slot *and* a section header, `light` and `dark` variants differ, and the 11px
  radius comes from the existing `--radius-chip` with `rounded-full` rejected by test. Controlled,
  keys typed to the shared `PeriodKey`, radiogroup semantics with one tab stop. Not wired into a
  consumer — that is US-016's and US-034's work.
  **Phase 2b now 5/11 stories, 13/29 points — and US-016 is unblocked.**

- **US-013 — Baseline dashboard: four pre-existing tiles.** The story that makes the prototype look
  real, and the deferred Phase 2a one US-017 + US-021 had just unblocked. **The canvas stops being
  empty:** four tiles in order — Webshop revenue, Last home match, Top products, Active partners — as
  direct children of US-012's one canvas grid, composing `KpiTile`, `HBarTile` and the `Card` shell;
  the only new component is the partner strip. **No figure is re-typed:** the route gained an SSR
  `loader` reading the US-007 repository through `app/lib/dashboard/baseline.ts`, the webshop headline
  and its `+11.9%` are `seriesTotals` off the same array the sparkline draws, and a source scan fails
  on any dataset figure written as a literal. **Reset's baseline seam is closed as US-015 described**
  — the tiles are static route chrome outside the session list, and a test drives insert → Reset and
  compares the canvas to its load state. **Also the first real-Chrome pass for US-017, US-021 and
  US-027:** no horizontal scroll at 1920×1080 (nor 1440/1280/834/390), 54 distinct KPI strings and 43
  distinct bar widths per frame, two values only under reduced motion. 880/880, gates clean.

- **US-025 — Line chart component.** One chart in `app/components/charts/line-chart.tsx` for both of
  its consumers: the navy hero band (a gold area line over a dashed white previous period, keyed by
  period) and Hero 2's twelve-month two-season comparison. Series count is a prop, `area` / `dash` is
  per series, and colour is a token **name**, so no hex can enter — gold is a legitimate series
  colour on the band only, per the Guide. **The stroke draw survives reduced motion, and that is the
  load-bearing test:** `pathLength="1"` plus an offset that transitions 1 → 0, and because `useGrow`
  is `true` in the first render under the preference, a test reads `stroke-dashoffset="0"` with
  **zero frames requested** rather than a line stranded at offset 1. **It replays by being re-keyed
  and by nothing else** — a re-key returns the offset to 1 and clears the guide, a data-only change
  leaves it drawn, so a filter press never flashes. Hover maps the pointer over the wrapper to the
  nearest index and the tooltip lists **every** series there through US-011; arrow/Home/End/Escape do
  the same from the keyboard without capturing Tab. Gradient ids come from `useUid`, proven distinct
  with both charts on screen. A zero or missing point is a labelled zero, never a `NaN` in a `d`.
  73 tests, 953/953 green.
- **US-026 — Segmented period filter control.** One control for all three of its consumers — the dark
  hero band, Top Products' `action` slot and Hero 1's section header — and **wired into none of them
  on purpose**: mounting it belongs to US-016 and US-034. **It is controlled and has no opinion of
  its own** — no internal selection, no defaulting to the first option, so a press the caller ignores
  changes nothing on screen (tested), which is exactly what lets one control drive two tiles on the
  band or three on Hero 1 without them ever disagreeing. Keys are the shared `PeriodKey` rather than
  a local union — a `@ts-expect-error` line fails `pnpm typecheck` the moment they loosen to `string`
  — while the label travels as data on the *entry*, which lets Hero 1 say "Current month" for the
  same `THIS_MONTH` key. **11px, deliberately not a pill:** the reviewed radius already existed as
  `--radius-chip`, so the group wears `rounded-chip` and each option the new `.fcb-chip` rule (radius
  + 1px lift + transition, shared ahead with US-029's chips), with `rounded-full` rejected in the
  markup, the source *and* the stylesheet. Radiogroup semantics with one tab stop, wrapping arrows on
  both axes plus Home/End, and selection carried by shape, shadow, weight *and* `aria-checked` —
  never colour alone. 45 tests, 998/998 green.
- ✅ **US-016 — Hero band: webshop trend & attendance ring (5 pts). All 6 criteria met, and Phase 2a
  is CLOSED at 5/5 · 16/16.** One control drives the chart and the ring; hover gives a guide plus
  both series' values; the ring swaps its centre and glows; a filter change counts from the figure on
  screen, redraws the line and sweeps the arc; the total and delta are computed from the series.
  Top Products' filter is wired too. 92 tests, 1090/1090 green.

---

## Stories In Progress

*None*

---

## Open Human Step

- **Deploy to Railway** (US-001, the remaining AC). The repo is deploy-ready: run
  `railway login && railway init && railway up`, then record the URL in `output/phases/phase-1a.md`.

---

## Next Day Plan

**Immediate Focus:**
- **Phases 1a, 1b and 2a are all closed** (14 + 10 + 16 = 40 points). Nothing in Phase 2a is
  outstanding: US-013 and US-016 were both finished inside the Phase 2b run on the day their
  dependencies landed.
- **Phase 2b — the component library** is at 5/11 · 13/29. Next is **US-018 — vertical bar chart
  tile (3 pts)**. Every remaining component should import from `app/lib/hooks/use-motion.ts` rather
  than animate by hand, and compose `Card`, `DeltaChip`, `HBars`, `LineChart` and `Segmented` rather
  than restate them — US-023 in particular must reuse US-021's bar row. `LineChart` and `Segmented`
  are now proven in the app (US-016's Chrome pass), so US-036 and US-034 can mount them as they are.

**Priority Stories for This Week:** Phase 1a + 1b foundations (24 pts, done) → Phase 2a + 2b shell
and component library (45 pts, the largest block) → Phase 3a + 3b conversation and the three heroes
(33 pts, the demo itself).

---

## Notes

- **The deadline is this week.** Sponsor showing first, owner audience the following week.
  Estimated ~52 AI-core / ~68 AI-realistic hours for the full 116 points; if the week gets tight,
  extend daily runtime before cutting scope — the P1 cut set is worth only ~0.82 days at 8h/day.
- Phases 1a, 1b and 2a are complete and Phase 2b is at 5/11 (53/116 points); continue with
  `/holycode-pm:execute-work phase 2b`, starting at US-018.
- **US-021 is the reuse test for the whole epic:** `HBars` / `HBarRow` must be the only horizontal
  bar row in the codebase. Its 150px no-truncate label and 96px `nowrap` value column are review
  decisions, and a second implementation would silently drop both.
- **The motion hooks are the shared contract for Phase 2b:** `useCountUp` from the current value and
  `useGrow`'s reduced-motion short-circuit are what keep ten charts consistent. A component that
  reimplements either is a review finding, not a style choice.
- **Two shared pieces US-017 left for the rest of the phase:** `DeltaChip` is the *only* variance
  chip (US-019 and US-022 import it, judgement passed in), and `app/lib/cn.ts` protects named size
  tokens — but only through `cn`, so a hand-written `class="text-caption text-muted"` is on its own.
- **Reset's seams are recorded in code:** US-029's chips should be *derived* from `useDashboard`'s
  `sections` and US-031's thinking beat *scheduled* through its `schedule`. US-013 closed the third
  (the baseline tiles) as static chrome on the route — do not move them into the session list.
- **US-013 set the no-hardcoded-figure pattern for every hero:** figures reach a component only
  through a loader-provided view model, and `tests/unit/baseline-row.test.tsx` scans the component
  sources for any dataset figure written as a literal. US-034 to US-039 should copy that scan.
- **US-025's chart is the only line chart** and both heroes must key it, not fork it: `key={period}`
  is the replay mechanism, `legend={false}` plus `LineChartLegend` is how the band places its own
  legend, and a second `smoothPath` anywhere is a review finding.
- **US-026's `Segmented` is the only period control**, and the period stays the CALLER's state —
  US-016 proved the pattern: one value in the band drives both the chart's `key` and the ring, while
  Top Products holds its own. Its 11px radius is a reviewed decision: `rounded-full` on it or on
  US-029's chips is a review finding, and US-029 should wear `CHIP_SURFACE_CLASS`.
- **US-016's band is first in the cut order and was built to stay cuttable:** one grid item, no
  shared state, and no import from the baseline row (a test asserts it). Anything added to it must
  keep that property. Its `AttendanceRing` is the only ring in the product — US-020's donut is a
  different component and must not be folded into it.
- The shell keeps two guardrails as *tests*: the app bar's whole text must equal the known role
  labels, and the connection status file must contain no `fetch`, `useEffect` or timer.

---

**Auto-Generated** | Updates during `/execute-work` | Archives daily
