# Phase 1a: Project Setup & Design System

**Duration:** 2026-09-09 to 2026-09-09 (~5.8 AI-hours)
**Status:** Completed
**Started:** 2026-09-09
**Target Completion:** 2026-09-09
**Actual Completion:** 2026-09-09

> **Single source of truth for acceptance criteria:** the backlog file
> [`../../input/backlog/phase-1a-setup-design-system.md`](../../input/backlog/phase-1a-setup-design-system.md).
> This file tracks *execution* — status, notes, metrics. Criteria are not duplicated here, to avoid
> the two drifting apart.

---

## Phase Goal

Stand up the project and its Railway deployment, then build the design token foundation (E2) that
every later epic references rather than restates.

**Success Criteria:**
- A shareable Railway URL loads the app cleanly in Chrome
- A single token set exists and is the only source of colour, type, spacing, radii and motion
- The genuine FCB crest is self-hosted and rendered in the app bar
- The tile card shell and insertion animation are defined once and reused everywhere after

---

## Epics in This Phase

### Epic 1: Project Setup & Deployment (5 story points)

**Priority:** P0 · **Status:** Done (2/2) · **Dependencies:** none

| Story | Title | Pts | Owner | Status |
|---|---|---:|---|---|
| US-001 | Environment & deployment setup | 3 | Human+AI | ✅ Done (1 AC deferred) |
| US-002 | Developer tooling & local DX | 2 | AI | ✅ Done |

**Technical Notes:**
- React Router 7 framework mode with SSR; `@react-router/serve` in production
- **No environment variables and no database** — the app must run with zero configuration
- US-001 is the source of the infra figure in the effort estimate (~3 h)
- **US-001 open human step:** the Railway deploy AC is deferred — the AI session has no Railway
  account access. The repo is deploy-ready (`railway.json`, `pnpm build` / `pnpm start`); the human
  runs `railway login && railway init && railway up` and records the URL here.

### Epic 2: E2 — FCB Brand Theming & Design System (9 story points) *(foundation)*

**Priority:** P0 · **Status:** Done (4/4) · **Dependencies:** US-001

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-003 | Design token set | 3 | ✅ Done |
| US-004 | Self-hosted FCB crest | 1 | ✅ Done |
| US-005 | Tile card anatomy | 2 | ✅ Done |
| US-006 | Tile-insertion motion & reduced-motion support | 3 | ✅ Done |

**Technical Notes:**
- **Colour discipline is non-negotiable:** red and blue carry series identity; variance uses only the
  positive/negative tokens *plus* an explicit sign and arrow; red never means "bad", because red is
  the club's hero colour. Gold is an accent only.
- **Resolved conflict (US-006):** the Specification requires a ~1.5s gold ring on newly inserted
  tiles; the Reference Guide removed it. Guide precedence applies — **build fade-and-rise, no ring**.
- Where the Specification and the Guide disagree on a hex value, the Guide wins. Known divergences:
  surface, text, positive-variance.
- The crest is trademarked: download, commit, self-host. Never hotlink — this also removes a
  CORS/availability risk during the demo.

---

## Definition of Done *(applies to every story in this phase)*

- [x] Code implemented and reviewed against `.claude/rules/code-quality.md` (SOLID, DRY)
- [x] Tests written and passing; coverage ≥ 80%
- [x] Security triage run per `.claude/rules/security-review.md`
- [x] Linter clean
- [x] Git commit created per `.claude/rules/git.md` (conventional)
- [x] Progress tracking updated

*Not applicable this project:* API status-code matrix (no endpoints) · i18n translations (English only).

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 2
- **Estimated Effort:** ~19.5 team-hours → ~5.8 AI-core hours
- **Risk Level:** Low

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 14 / 14 (100%)
- **Completed Stories:** 6 / 6
- **Tests Passing:** 181 / 181
- **Code Coverage:** 100% statements / 97.6% branches of `app/**` (46 statements, 14 functions)
- **Linter:** ESLint 9 flat config — clean (0 errors, 0 warnings)
- **Commits:** 6 · **Open human step:** US-001's Railway deploy AC (no AI account access)

---

## Dependencies

**Depends On:** nothing — this is the first phase.

**Blocks:**
- **Everything.** E2 tokens are consumed by E4, E6, E7 and E8; no visual work can start before US-003.
- US-005 (card shell) blocks the entire component library in Phase 2b.
- US-006 (insertion motion) blocks US-014 (dynamic tile insertion).

**External:** Railway account and project (US-001); the club crest source asset (US-004).

---

## Risks & Mitigation

| Risk | Impact | Prob. | Mitigation | Owner | Status |
|------|--------|-------|------------|-------|--------|
| Railway setup consumes more than the ~3 h budgeted | Medium | Low | Zero-config app: no env vars, no database, no migrations; `railway.json` committed so the deploy is one command | Human+AI | Open (human step) |
| Crest asset unavailable or format-awkward | Medium | Low | Self-host from the committed copy; the build must never depend on the live CDN | AI | Closed (US-004) |
| Token drift — a colour introduced outside the set | High | Medium | Not permitted by spec; choose the nearest token. US-003 pins the hex set with a test and fails the suite on any CSS/TS divergence. Re-verified in US-044 brand QA | AI | Mitigated |
| Reduced-motion path leaves a value stuck at zero | Medium | Medium | US-006 collapses animations to a ~1ms final frame instead of removing them, globally, and restates each primitive's end state; the US-027 grow hook will also return `true` immediately | AI | Mitigated (US-006) |

---

## Progress Log

### 2026-09-09 — US-001 Environment & deployment setup (3 pts) ✅

React Router 7.18 framework mode with SSR scaffolded at the repo root: `react-router.config.ts`
(`ssr: true`), `vite.config.ts` (Tailwind v4 + React Router plugins), strict `tsconfig.json`,
`app/root.tsx`, `app/routes.ts`, a minimal `app/routes/_index.tsx`. Only the packages this prototype
needs are installed — Prisma, msw, Recharts, TanStack Table, resend and every i18next package are
expansion-path only and absent, per `input/technologies.md`. Verified by running, not assumed:
`pnpm install --frozen-lockfile`, `pnpm build` and `pnpm start` all succeed from a **clean checkout**
and the server returns HTTP 200 with server-rendered markup. No env var required; no database.

- **Tests:** 8 unit tests passing; coverage of `app/**` 100%. **Typecheck** clean under strict.
- **Security triage:** dependency trigger fired. Two moderate `qs` advisories reaching us via express
  under `@react-router/serve` are cleared by a `qs: ">=6.16.0"` override in `pnpm-workspace.yaml`;
  **`pnpm audit` reports no known vulnerabilities**. No secrets, env vars, handlers, DB or user input.
- **⏸️ Deferred to the human:** the Railway deploy AC (see Epic 1 technical notes).

### 2026-09-09 — US-002 Developer tooling & local DX (2 pts) ✅

ESLint 9 flat config (`eslint.config.js`): `@eslint/js` recommended, `typescript-eslint` recommended
(syntax-only, so it is fast enough for every commit), `eslint-plugin-react-hooks`, and
`eslint-config-prettier` **last** so ESLint never argues with Prettier over formatting. Prettier uses
`prettier-plugin-tailwindcss` with `tailwindStylesheet: ./app/app.css`, and skips
`.project-management/`, `.claude/` and `CLAUDE.md`, whose line limits `documentation.md` governs.
Scripts added: `lint`, `lint:fix`, `format`, `format:check`, `prepare` — all six AC scripts **run,
not assumed** (`dev` and `start` each booted, HTTP 200).

husky v9 + lint-staged run `eslint --fix` then `prettier --write` on staged `*.{ts,tsx}`. **Hook
verified with real throwaway commits** (since removed): an unfixable `no-explicit-any` probe was
rejected and `HEAD` did not move; a formatting-only probe committed with Prettier's reflow and
Tailwind class re-ordering already applied in the committed blob.

- **Tests:** unchanged at 8, all passing; no hollow tests added for config. Coverage still 100%.
- **Linter:** clean over all 11 source files — no rule weakened, no file disabled to get there.
- **Security triage:** dependency trigger fired (A06 — 7 dev-only devDependencies that never ship in
  the server bundle). **`pnpm audit`: no known vulnerabilities**; the US-001 `qs` override retained.

### 2026-09-09 — US-003 Design token set (3 pts) ✅

One token set, published twice on purpose. `app/app.css` carries it as Tailwind v4 custom properties
inside `@theme static`, so utilities are generated and `var(--…)` resolves at runtime;
`app/lib/tokens.ts` carries the same values as a typed object, because the hand-built SVG charts in
Phase 2b need strings for stroke, fill and gradient stops and cannot use a class. Every hex is
written exactly once — semantic aliases are `var()` references in CSS and constant references in
TypeScript — and `tests/unit/tokens.test.ts` parses the stylesheet, resolves those references and
fails on any divergence. That drift test is the load-bearing one here. Values follow the Reference
Guide's `T` object, which wins over the Specification on the three known divergences (`scope.md`
§10): **surface `#F1F4F9`, text `#161A20`, positive variance `#0E9F6E`**. The Specification-only gold
ring for new tiles was **not** introduced — gold exists solely as `accentTargetHit`/`accentFollowUp`.

Colour discipline is encoded, not merely documented: `seriesPrimary`/`seriesSecondary`/
`seriesCurrent`/`seriesPrevious` name identity, `variancePositive`/`varianceNegative` are the only
tokens permitted to mean good/bad, and `varianceNegative` is deliberately a *separate* token from
`red` even though they share a hex, so red can never drift into meaning "bad". Tests assert each
relationship plus that gold has exactly two consumers. Typography roles (`.tile-title`,
`.kpi-number`, `.chart-axis-label`, `.narrative-caption`) are defined once in the components layer,
so US-005 references a role instead of restating "uppercase, 700, 0.04em"; `.kpi-number` carries
`tabular-nums` so count-up animations do not jitter.

- **Tests:** 88 added (96 total, all passing) — exact-hex assertions, Guide-precedence assertions,
  colour-discipline relationships, the type scale, and full CSS↔TS parity in both directions.
- **Coverage:** 100% of `app/**` (21/21 statements, 7/7 functions). **Gates:** all five clean;
  emitted CSS verified — aliases resolve, `.tile-title` and `.kpi-number` ship as written.
- **Security triage:** every §1 trigger considered — no dependency or lockfile change, route, raw
  SQL, `dangerouslySetInnerHTML`, `fetch`, upload, env var, auth, logging or user input. **No
  security-relevant changes detected** (§4).

### 2026-09-09 — US-004 Self-hosted FCB crest (1 pt) ✅

The club serves the crest from `https://fcb.ch/cdn/shop/files/logo.webp` — but the **bytes are a
PNG**, not a WebP; the extension lies and the `Content-Type` tells the truth. The download was
inspected before anything was committed, so it is stored as `public/fcb-crest.png` under its real
format. 194 KB of 608x648 artwork for a 32px mark is ~90x more pixels than it can show, so it was
downsampled with macOS `sips` (**no image dependency added**) to 120x128, crisp to 2x render size;
every ancillary chunk (including an XMP `iTXt` naming the source machine) was then stripped with a
stdlib Python filter, leaving `IHDR`/`IDAT`/`IEND`. Final asset: **17,908 bytes, a 91% reduction**,
transparency intact, verified as the genuine crest.

`app/components/chrome/crest.tsx` exports `Crest`, rendering `/fcb-crest.png` with
`alt="FC Basel 1893"` and deriving width from the asset's aspect ratio so the app bar reserves the
right box and never shifts on decode. A minimal `<header>` in `app/root.tsx` holds it top-left at
32px — **the sidebar, workspace label, avatar, connection status and Reset control are US-012 in
Phase 2a and were not built here**.

- **No CDN request — proved, not assumed:** `grep -rIa "fcb\.ch" build/` returns nothing (the only
  `fcb.ch` string is a warning comment the bundler strips); both bundles reference the literal
  `"/fcb-crest.png"` and nothing else; the booted production server serves HTML in which **every**
  `src`/`href` is root-relative, and `/fcb-crest.png` answers `200 image/png 17908` locally.
- **Tests:** 10 added (106 total, all passing) — accessible name, root-relative `src`, `CREST_SRC`
  matching no absolute URL, the 32px default and aspect-ratio scaling, crest-first placement in the
  `banner` landmark, and — reading the committed file — PNG magic bytes and size budget.
- **Coverage:** 100% of `app/**` (26/26 statements, 8/8 functions). **Gates:** all five clean.
- **Security triage:** the **external-binary trigger fired (A04/A08)** — magic number checked, chunk
  table walked end-to-end (exactly 194,518 bytes consumed, so **nothing appended past `IEND`**), no
  `tEXt`/`zTXt`/`iTXt` chunk survives, so **no secret or tracking payload is embedded**; the asset is
  never executed. `src` is a hardcoded constant, not user input (A03 n/a); no runtime `fetch` remains
  (A10 n/a); lockfile untouched (A06 n/a). No route, SQL, env var, auth or logging change.
- **Trademark:** the genuine crest is used exactly as the Build Specification instructs; it stays in
  this repo and no further club branding was invented.

### 2026-09-09 — US-005 Tile card anatomy (2 pts) ✅

`Card` and `CardCaption` in `app/components/tiles/card.tsx` — the one shell the seven Phase 2b tile
kinds and the three Phase 3b heroes compose. **Slots, not variants**, so a new tile kind never needs
a new card: `title`, `subtitle`, `headingLevel`, `icon`, `action`, `accent`, `caption`, `isNew`,
`delayMs`, `className`, `children`. Every optional part collapses on its own — the header is not
rendered at all when nothing would go in it, which is what lets a recommendation panel (accent, no
title) and a KPI tile (title, icon, no accent) share one implementation.

Two deliberate constraints. `accent` takes a **token name**, not a colour string, so no tile can
smuggle a hex past the closed token set — enforced by the type, not by review. And the title renders
as a real heading (`h3` by default), because a dashboard that grows tile by tile needs structure.
No value is retyped: `rounded-tile`, `p-tile`, `shadow-tile`, `border-border`, `bg-bg` and the
`.tile-title` / `.narrative-caption` role classes come from US-003. `isNew` applies the exported
`TILE_ENTER_CLASS`, `delayMs` sets `animationDelay` — hooks only; **US-006 owns the keyframes**, and
there is no ring, no glow. Nothing beyond the shell and its caption strip was built.

- **Tests:** 38 added (144 total, all passing) — the optionality of every slot in both directions,
  AC values resolving from tokens, no hex or `rgb()` literal in the component, the AI glyph
  `aria-hidden` and announced as nothing, caller text escaped rather than parsed as markup, and no
  ring or glow returning.
- **Coverage:** 100% of `app/**` (35/35 statements, 11/11 functions, 31/31 branches). **Gates:** all
  five clean; emitted CSS checked — every utility the card names is generated.
- **Security triage:** all §1 triggers considered — no dependency change, route, SQL, `fetch`,
  upload, env var, auth or logging; caller content renders as React children only, with **no
  `dangerouslySetInnerHTML`** (asserted by test). **No security-relevant changes detected** (§4).

### 2026-09-09 — US-006 Tile-insertion motion & reduced-motion support (3 pts) ✅

The four keyframes the reveal is built from, defined once in `app/app.css`: `fcbUp` (entrance —
opacity 0→1 while rising `--spacing-enter-rise` = 12px over `--duration-enter` = 400ms on
`--ease-enter`), `fcbGlow` (ambient brand pulse), `fcbScan` (thinking scan line) and `fcbSrc`
(source-chip reveal), each driven from motion tokens so the choreography retimes from the token set.
`app/lib/motion.ts` names the classes (`MOTION_CLASS`) so no component types `"fcb-enter"` by hand —
US-005's `TILE_ENTER_CLASS` now derives from it, and the entrance attaches to the `isNew`/`delayMs`
hooks the card already exposed rather than a parallel mechanism. `both` fill is what makes the
stagger read as one: a delayed tile holds its opening frame instead of flashing in.

**No gold ring.** The Specification's ~1.5s highlight ring stays removed per the Guide
(`scope.md` §10) — a new tile fades and rises, nothing else. Guarded by tests: the entrance keyframes
and `.fcb-enter` may declare nothing but the animation (no `box-shadow`, `outline`, `ring`), the card
never carries `fcb-glow`, and gold has exactly two consumers below the theme block (glow, scan line).

**Reduced motion (AC 4-5).** `animation: none` is the trap, not the answer: strip the animation from
an element whose opening frame is `opacity: 0` and it stays invisible. The unlayered
`@media (prefers-reduced-motion: reduce)` block therefore *collapses* motion instead — one ~1ms
iteration, zero delay, transitions completing in ~1ms — so filled animations land on their closing
frame and transitions on their target, at once. It applies to `*`, covering US-027's
transition-driven chart geometry before it exists; each primitive then restates its end state
outright (`opacity: 1`, `transform: none`, glow cleared), and only the scan line is hidden, having no
meaningful end state. Unlayered, it beats every cascade layer and Tailwind utility.

**Grid reflow (AC 2)** uses a view transition, since CSS cannot transition a grid position:
`animateReflow()` wraps the insertion and the browser tweens each named tile from its old geometry to
its new, timed by `::view-transition-group(*)` to match the entrance. The update always runs —
unwrapped under reduced motion, without support, or on the server — so no state change is lost to a
missing API. `viewTransitionName()` sanitises a tile id into a legal, unique CSS identifier.

- **Tests:** 37 added (181 total, all passing). The load-bearing ones are structural, not string
  matches: every class whose keyframes open at `opacity: 0` must be restored to its final state by
  the reduced-motion block, and that block must not sit inside a cascade layer.
- **Coverage:** 100% statements / 97.6% branches of `app/**` (46 statements, 14 functions).
  **Gates:** all five clean; compiled CSS verified to ship every keyframe and final-state rule.
- **Security triage:** all §1 triggers considered — no dependency or lockfile change, route, SQL,
  `fetch`, upload, env var, auth or logging. The only string reaching CSS (`viewTransitionName`) is
  allowlist-sanitised to `[A-Za-z0-9_-]`, so a tile id cannot break out of an inline style value.
  **No security-relevant changes detected** (§4).

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** Completed — 6/6 stories, 14/14 points (US-001's Railway deploy AC is a human step)
**Next Phase:** [Phase 1b — Seed Data](phase-1b.md)
