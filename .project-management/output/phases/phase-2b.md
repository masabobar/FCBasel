# Phase 2b: Chart & Tile Component Library

**Duration:** 2026-09-11 to 2026-09-12 (~12.0 AI-hours)
**Status:** In Progress (2/11 stories · 5/29 points)
**Started:** 2026-09-09
**Target Completion:** 2026-09-12
**Actual Completion:** —

> **Acceptance criteria live in** [`../../input/backlog/phase-2b-components.md`](../../input/backlog/phase-2b-components.md).
> This file tracks execution.

---

## Phase Goal

Build the reusable visual kit the heroes are assembled from, so Phase 3b is composition rather than
bespoke work per screen. Every component is styled from the E2 tokens and fed from the E3 data.

**Success Criteria:**
- All eight component types exist, are stateless, and take E3-shaped data as input
- No component fetches or computes data at render time
- Money, percentage and variance formatting is identical everywhere
- Charts are legible at 1080p — readable axis labels, adequate spacing, no clipped legends
- Each component is genuinely shared; there are no per-hero copies of the same chart type

---

## Epics in This Phase

### Epic 5: E6 — Chart & Tile Component Library (29 story points)

**Priority:** P0 (US-026 is P1) · **Status:** In Progress (2/11) · **Dependencies:** US-003, US-005

| Story | Title | Pts | Pri | Status |
|---|---|---:|---|---|
| US-017 | KPI tile & variance chip | 2 | P0 | ✅ Done |
| US-018 | Vertical bar chart tile | 3 | P0 | 📋 Todo |
| US-019 | Grouped bar chart tile | 3 | P0 | 📋 Todo |
| US-020 | Donut / ring tile | 3 | P0 | 📋 Todo |
| US-021 | Horizontal bar tile | 3 | P0 | 📋 Todo |
| US-022 | Department table tile | 3 | P0 | 📋 Todo |
| US-023 | Driver / breakdown tile | 2 | P0 | 📋 Todo |
| US-024 | Recommendation panel & narrative caption strip | 2 | P0 | 📋 Todo |
| US-025 | Line chart component | 3 | P0 | 📋 Todo |
| US-026 | Segmented period filter control | 2 | **P1** | 📋 Todo |
| US-027 | Motion & animation hooks | 3 | P0 | ✅ Done |

**Technical Notes:**

- **Charts are hand-built SVG, ported from the reference build** (decided 2026-09-09). No charting
  library, no TanStack Table. The deciding factor was animation: bars persisting across data changes
  so a filter *transitions* rather than snapping, donut segments morphing via `stroke-dasharray`,
  line stroke-draw on re-key, and count-up from the **current displayed value**. Those behaviours are
  "most of the wow" per the brief and are awkward to guarantee in a library.
- **Build US-027 first.** Every other component in this phase depends on the motion hooks.
- **Colour is never the sole signal.** A projector can shift green/red, so variance always carries an
  explicit sign and arrow alongside the token.
- Three explicit review decisions that must not be reverted: the grouped-bar y-axis gutter with
  headroom (US-019, fixes delta-chip collision); the 96px `nowrap` value column (US-021, keeps
  `-CHF 150k` on one line **everywhere** the shared row is used); right-aligned numeric headers
  including "% of target" (US-022).
- The recommendation panel must be **visually distinct from a data tile** — it is advice, not a
  metric. It carries the peak moment of each follow-up.

---

## Definition of Done *(applies to every story in this phase)*

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md` (SOLID, DRY)
- [ ] Component tests render from E3-shaped props with no live computation; coverage ≥ 80%
- [ ] Reduced-motion path renders every animated value at final state
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean · Git commit created · Progress tracking updated

*Not applicable:* API status-code matrix · i18n.

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 29 · **Stories:** 11 · **Epics:** 1
- **Estimated Effort:** ~40 team-hours → ~12.0 AI-core hours
- **Risk Level:** Low-Medium — the largest phase by volume, but the most mechanical

> This is the **single largest block** in the build (23% of total effort) and the most repetitive.
> It is therefore the phase where the estimate's conservative SPEED_FACTOR is most likely to prove
> too cautious — a good place to calibrate.

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 5 / 29 (17%)
- **Completed Stories:** 2 / 11
- **Tests Passing:** 722 / 722 · **Coverage:** 100% stmts / 99.5% branches · **Commits:** 2

---

## Dependencies

**Depends On:** US-003 (tokens), US-005 (card shell) from Phase 1a; US-011 (formatters) from Phase 1b.

**Blocks:**
- Every hero in Phase 3b composes these components
- US-013 (baseline Top Products) needs US-021
- US-016 (hero band) needs US-025, US-026, US-027

**Internal ordering:** US-027 → everything else. US-021 → US-023 (the driver tile reuses the bar row).

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| A per-hero copy of a chart type is created under time pressure | Medium | Medium | Genuinely shared components is an explicit acceptance criterion on every story | AI | Open |
| Filter change snaps values to zero instead of transitioning | High | Medium | Count-up tracks the last displayed value in a ref; bars keyed by category | AI | 🔄 Half closed — proven again at COMPONENT level in US-017 (a retargeted tile's opening frame is the figure on screen); per-component geometry keying still on each chart story |
| SVG gradient ids collide across simultaneous charts | Medium | Medium | Stable unique-id hook per component instance (US-027) | AI | ✅ Closed — `useUid` (US-027) and now proven on a real component: two KPI sparklines on one screen carry different gradient ids (US-017) |
| Hand-built SVG takes longer than a library would | Medium | Medium | Port from the reference rather than writing fresh; the components already exist and work | AI | Open |
| Long labels overflow their tile | Low | Medium | Wrap or truncate-with-tooltip; never overflow | AI | Open |
| A named type-size token is silently dropped beside a colour token | Medium | **High** | `tailwind-merge` reads `text-caption` as a colour; the type scale is now declared in `app/lib/cn.ts`, derived from the token set | AI | ✅ Closed by US-017 for every component that follows |

---

## Progress Log

### 2026-09-09 — US-027 Motion & animation hooks ✅ (3 pts)

**Delivered:** the four hooks every animated component in this epic keys off, in
`app/lib/hooks/use-motion.ts` (the `lib/hooks/` slot the technical spec §4.1 reserved). The
consumer API, which the next ten stories should import and nothing more:

```ts
useReducedMotion(): boolean                                  // tracks the preference
useGrow(): boolean                                           // false → true after two frames
useCountUp(target: number, animationMs?: number): number     // from the CURRENT displayed value
useUid(prefix?: string): string                              // "bars-r3" — one id per instance
COUNT_UP_DURATION_MS                                         // 900, from the token set
```

**Count-up from the current displayed value — the story.** The figure on screen is mirrored in a
ref as each frame commits it, and the effect reads that ref (never depends on it) when the target
changes. A test proves the retargeted animation's **opening sample IS the mid-flight figure**,
climbs monotonically from there, never dips, and lands *exactly* on the target; a second test does
the same downwards, because Hero 1's filter moves numbers both ways. A naive `0 → target` would
have looked broken on every filter press in all ten consuming components.

**Reduced motion means final state in the SAME RENDER, not one effect later.** `useGrow` returns
`grown || reduced` and `useCountUp` returns `reduced ? target : displayed`, so `width={grown ? w : 0}`
geometry and every KPI number are at their final value the moment the preference is read — nothing
waits on a transition that will never run. Tested explicitly: under the preference `useGrow` is
`true` on the first render with **zero** frames requested, and a preference flipped mid-animation
abandons the frame and shows the target. This is US-006's CSS rule ("collapse to the last frame,
never switch the animation off") restated in JavaScript, and the same guarantee holds where
`requestAnimationFrame` does not exist at all (it degrades to a cancelled timeout).

**One reduced-motion source of truth.** `app/lib/motion.ts` gained `reducedMotionQuery()` (the live
`MediaQueryList` for US-006's `REDUCED_MOTION_QUERY` — the same string `app/app.css` matches on) and
`prefersReducedMotion()` now reads through it. `useReducedMotion` subscribes with
`useSyncExternalStore`: an explicit server snapshot makes it SSR-safe by construction, React owns
the unsubscribe, and it reacts to a change rather than reading once at mount (modern and legacy
`MediaQueryList` APIs both handled). A test strips comments from the hook source and fails if it
ever calls `matchMedia` or spells the query itself.

**Cleanup, because ten charts animate at once on the demo machine.** Every rAF, timer and listener
is cancelled on unmount — asserted per hook, and once with ten tiles unmounted mid-count leaving
zero pending frames.

**Also:** the ~900ms count-up is now a real token (`duration.countUp` / `--duration-count-up`,
kept honest by the existing parity test) read as a number through a new `tokens.durationMs()`, so no
timing is written twice; and the CSS-identifier sanitiser hidden inside `viewTransitionName` was
extracted as `cssIdentifier` and is now shared with `useUid`, which launders React's `useId()` into
something legal inside `url(#…)` and in a selector.

**SSR:** no hook touches `window`, `document` or `matchMedia` during render. Proven by a
`renderToString` with `window`, `requestAnimationFrame` and `cancelAnimationFrame` stubbed away, and
by a real `hydrateRoot` pass that fails on any `console.error` — including under reduced motion,
where the post-hydration state is the final one (grown, counted) rather than zero.

**One seam stated plainly:** there is no browser pass, because hooks have no UI of their own. The
first real-Chrome verification of growth, count-up and gradient ids belongs to **US-017**, the first
consumer.

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 644/644 tests ✅ (52 new: 42 hook, 6 motion, 4 token)
· build ✅ · coverage 100% stmts / 99.4% branches / 100% funcs. **Security triage:** no
security-relevant changes detected — no endpoint, no raw SQL, no `dangerouslySetInnerHTML`, no
user-supplied URL, no upload, no env var, no dependency or lockfile change, no logging, no storage
API. The one value that reaches the DOM is `useUid`'s id, and it is sanitised to `[A-Za-z0-9_-]`
before it can appear in an attribute or a selector.

### 2026-09-09 — US-017 KPI tile & variance chip ✅ (2 pts)

**Delivered:** three exports, so nothing has to be forked later —
`app/components/tiles/delta-chip.tsx` (`DeltaChip`, wanted on its own by US-019, US-022 and US-016)
and `app/components/tiles/kpi-tile.tsx` (`KpiSparkline`, `KpiFigure`, `KpiTile`, `sparklineGeometry`).

```tsx
<KpiTile title="Webshop revenue" period="This month"
         value={148_200} format={formatMoney}      // counts up; strings from US-011
         delta={{ value: 12 }}                      // + arrow + pos token, or judgement={...}
         subtitle="vs last month" sparkline={sixPoints} />

<KpiFigure value={7_830_000} format={formatMoneyMillions} delta={{ value: -0.6 }} onDark />
```

**Colour is never the sole signal, and it is TESTED that way.** The chip carries direction four
independent times — the glyph, the explicit `+`/`-` from `formatSignedPercent`, a `sr-only` word,
and the token colour. The proof is the `light` variant: on the navy band both directions share one
white treatment (the negative token falls to ~2:1 on navy and is illegible at 13px), and a test
asserts the two chips' `className` strings are **identical** while sign, glyph and spoken word still
differ. Red never means "bad" anywhere — only `variancePositive` / `varianceNegative`, and a test
rejects `text-red` on the chip.

**Direction is not judgement.** The arrow follows the arithmetic; the colour follows the meaning.
Marketing's overspend is UP *and* ADVERSE, so `judgement` is an optional prop the caller passes from
`varianceJudgement` (US-010) and the chip never re-derives good/bad from a sign. A zero renders as a
**labelled zero**: dash glyph, `+0%` in house style, the neutral (muted) treatment rather than either
variance token, and "unchanged" in the accessibility tree.

**One tile carries all three consumers without a variant per hero.** Extra hero content (Hero 2's
compare bars, Hero 3's two-up footer) arrives as `children` under the number; `onDark` on `KpiFigure`
is what US-016's navy band composes, and it forces the chip's `light` variant so a caller cannot
leave an illegible red figure on navy. Verified against all three: the baseline webshop tile, Hero 2's
`-0.6%` total and Hero 3's `+1%` overall.

**The US-012 trap is closed at the root, not worked around.** `tailwind-merge` reads our named type
scale (`text-caption`, `text-kpi`) as colours, so a size and a colour on one element silently lost the
size. `app/lib/cn.ts` now declares the scale as the `font-size` group, **derived from
`tokens.fontSize` through the same `cssVariableName` mapping Tailwind generates the utility from**, so
a new token is understood immediately and cannot drift. Two sizes still collapse, two colours still
collapse, and a caller can still override a base size. Asserted in `tests/unit/cn.test.ts` and again
on the rendered subtitle and chip.

**Motion is US-027's, with nothing added.** `useCountUp` for the number, `useGrow` for the sparkline's
stroke draw, `useUid` for its gradient id; a test greps this file and fails on `useState`,
`setTimeout`, `setInterval` or `requestAnimationFrame`. The sparkline draws itself with
`pathLength="1"` + a dash offset — no path measurement, no per-frame JavaScript — and it paints with
`currentColor`, so there is no colour prop to smuggle a hex through. Degenerate series are handled
rather than left to emit `NaN` into a `d` attribute: empty renders nothing, a flat series draws
through the middle, a single point reads as a flat line.

**Also:** the frame and preference stubs moved to `tests/unit/support/motion-harness.ts` — every one
of the nine remaining component stories needs them, so there is one harness rather than nine copies
(`use-motion.test.tsx` now imports it, still 42/42).

**Gates:** lint ✅ · format ✅ · typecheck ✅ · 722/722 tests ✅ (78 new: 45 tile, 25 chip, 8 `cn`)
· build ✅ · coverage 100% stmts / 99.5% branches / 100% funcs. Every utility used was confirmed
present in the compiled stylesheet (`bg-variance-positive/10`, `duration-(--duration-grow)`,
`text-bg/70`…), and `.kpi-number` was checked to sit *before* the utilities layer so `onDark`'s white
actually wins. **Security triage:** no security-relevant changes detected — no endpoint, no raw SQL,
no `dangerouslySetInnerHTML` (asserted), no user-supplied URL, no upload, no env var, no dependency
or lockfile change, no logging, no storage API. All rendered text is React-escaped; `format` is a
caller-supplied pure function, not input.

**One seam, stated plainly:** still no real-Chrome pass. Nothing in the app mounts these components
yet — the first screen that does is **US-013**, and the browser verification of count-up, the stroke
draw and two sparklines side by side belongs there.

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** In Progress — US-027 and US-017 done; US-021 next
**Previous:** [Phase 2a](phase-2a.md) · **Next:** [Phase 3a — Conversation](phase-3a.md)
