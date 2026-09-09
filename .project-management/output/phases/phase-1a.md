# Phase 1a: Project Setup & Design System

**Duration:** 2026-09-09 to 2026-09-09 (~5.8 AI-hours)
**Status:** In Progress
**Started:** 2026-09-09
**Target Completion:** 2026-09-09
**Actual Completion:** —

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

**Priority:** P0 · **Status:** In Progress (3/4) · **Dependencies:** US-001

| Story | Title | Pts | Status |
|---|---|---:|---|
| US-003 | Design token set | 3 | ✅ Done |
| US-004 | Self-hosted FCB crest | 1 | ✅ Done |
| US-005 | Tile card anatomy | 2 | ✅ Done |
| US-006 | Tile-insertion motion & reduced-motion support | 3 | 📋 Todo |

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

- [ ] Code implemented and reviewed against `.claude/rules/code-quality.md` (SOLID, DRY)
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] Security triage run per `.claude/rules/security-review.md`
- [ ] Linter clean
- [ ] Git commit created per `.claude/rules/git.md` (conventional, no AI credits)
- [ ] Progress tracking updated

*Not applicable this project:* API status-code matrix (no endpoints) · i18n translations (English only).

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** 14 · **Stories:** 6 · **Epics:** 2
- **Estimated Effort:** ~19.5 team-hours → ~5.8 AI-core hours
- **Risk Level:** Low

### Progress Tracking *(auto-updated by `/execute-work`)*
- **Completed Story Points:** 11 / 14 (79%)
- **Completed Stories:** 5 / 6
- **Tests Passing:** 144 / 144
- **Code Coverage:** 100% of `app/**` (35 statements, 11 functions)
- **Linter:** ESLint 9 flat config — clean (0 errors, 0 warnings)
- **Commits:** 5

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
| Reduced-motion path leaves a value stuck at zero | Medium | Medium | Grow hook returns `true` immediately under reduced motion | AI | Open |

---

## Progress Log

### 2026-09-09 — US-001 Environment & deployment setup (3 pts) ✅

React Router 7.18 framework mode with SSR scaffolded at the repo root: `react-router.config.ts`
(`ssr: true`), `vite.config.ts` (Tailwind v4 + React Router plugins), strict `tsconfig.json`,
`app/root.tsx`, `app/routes.ts` and a deliberately minimal `app/routes/_index.tsx`. Only the
packages this prototype needs are installed — Prisma, bcryptjs, msw, Recharts, TanStack Table,
`@react-pdf/renderer`, resend, react-email and every i18next package are expansion-path only and
absent, per `input/technologies.md`.

Verified by running, not assumed: `pnpm install --frozen-lockfile`, `pnpm build` and `pnpm start`
all succeed from a **clean checkout** (fresh tree, no `node_modules`), and the server returns
HTTP 200 with server-rendered markup. No environment variable is required (`PORT` is honoured when
the platform supplies it, defaulting to 3000); no database is provisioned.

- **Tests:** 8 unit tests, all passing; coverage scoped to `app/**` only (100%, small surface).
- **Typecheck:** `pnpm typecheck` clean under TypeScript strict.
- **Security triage:** dependency trigger fired (`package.json` + lockfile added). `pnpm audit`
  initially reported 2 moderate `qs` advisories reaching us through express under
  `@react-router/serve`; a `qs: ">=6.16.0"` override in `pnpm-workspace.yaml` clears them.
  **`pnpm audit` now reports no known vulnerabilities.** No high/critical. No secrets, no env vars,
  no HTTP handlers, no database, no user input — no other trigger applies.
- **⏸️ Deferred to the human:** the Railway deploy AC. The repo is deploy-ready (`railway.json`,
  `build`/`start` scripts, `@react-router/serve` as the production server). Run
  `railway login && railway init && railway up`, then record the shareable URL in this file and in
  the backlog entry.

### 2026-09-09 — US-002 Developer tooling & local DX (2 pts) ✅

ESLint 9 flat config (`eslint.config.js`) covering TypeScript and React hooks: `@eslint/js`
recommended, `typescript-eslint` recommended (syntax-only, not type-aware — fast enough to run on
every commit), `eslint-plugin-react-hooks` flat recommended, and `eslint-config-prettier` **last**
so ESLint never argues with Prettier over formatting. Prettier is configured in `.prettierrc.json`
with `prettier-plugin-tailwindcss` and `tailwindStylesheet: ./app/app.css` for Tailwind v4 class
sorting. Build artefacts (`build/`, `.react-router/`, `coverage/`, `node_modules/`) are ignored by
both tools; Prettier additionally skips `.project-management/`, `.claude/` and `CLAUDE.md`, whose
line-count limits are governed by `.claude/rules/documentation.md`.

Scripts added: `lint`, `lint:fix`, `format`, `format:check`, `prepare`. All six acceptance-criteria
scripts were **run, not assumed** — `dev` and `start` were each booted and answered HTTP 200.

husky v9 + lint-staged run `eslint --fix` then `prettier --write` on staged `*.{ts,tsx}`, and
`prettier --write` on staged config/markdown. **Hook verified with real throwaway commits** (both
since removed with `git reset --soft`, history left tidy): a probe file with an unfixable
`no-explicit-any` error was rejected and `HEAD` did not move; a probe with only formatting problems
committed successfully with Prettier's reflow *and* Tailwind class re-ordering already applied in
the committed blob.

- **Tests:** unchanged at 8 unit tests, all passing; no hollow tests added for config. Coverage of
  `app/**` still 100%.
- **Typecheck:** `pnpm typecheck` clean under TypeScript strict.
- **Linter:** `pnpm lint` clean over all 11 source files — no rule was weakened and no file was
  disabled to get there.
- **Security triage:** dependency trigger fired (A06 — `package.json` + lockfile changed for
  7 new devDependencies). **`pnpm audit`: no known vulnerabilities**; the `qs: ">=6.16.0"` override
  from US-001 is retained. All additions are dev-only tooling that never ships in the server bundle.
  No secrets, env vars, HTTP handlers, database, user input or uploads — no other trigger applies.

### 2026-09-09 — US-003 Design token set (3 pts) ✅

One token set, published twice on purpose. `app/app.css` carries it as Tailwind v4 CSS custom
properties inside `@theme static`, so utilities are generated and `var(--…)` resolves at runtime;
`app/lib/tokens.ts` carries the same values as a typed object, because the hand-built SVG charts in
Phase 2b need strings for stroke, fill and gradient stops and cannot use a class. Every hex is
written exactly once — the semantic aliases are `var()` references in CSS and constant references in
TypeScript — and `tests/unit/tokens.test.ts` parses the stylesheet, resolves those references and
fails on any divergence. That drift test is the load-bearing one in this story.

Values follow the Reference Guide's `T` object, which wins over the Specification on the three known
divergences (`scope.md` §10): **surface `#F1F4F9`, text `#161A20`, positive variance `#0E9F6E`**.
The Specification-only gold ring for new tiles was **not** introduced — gold exists solely as
`accentTargetHit` and `accentFollowUp`.

Colour discipline is encoded, not merely documented: `seriesPrimary`/`seriesSecondary`/
`seriesCurrent`/`seriesPrevious` name identity, `variancePositive`/`varianceNegative` are the only
tokens permitted to mean good/bad, and `varianceNegative` is deliberately a *separate* token from
`red` even though they share a hex, so red can never drift into meaning "bad". Tests assert each of
those relationships plus that gold has exactly two consumers. Typography roles (`.tile-title`,
`.kpi-number`, `.chart-axis-label`, `.narrative-caption`) are defined once in the components layer,
so US-005 references a role instead of restating "uppercase, 700, 0.04em"; `.kpi-number` carries
`tabular-nums` so count-up animations do not jitter.

- **Tests:** 88 added (96 total, all passing) — exact-hex assertions, Guide-precedence assertions,
  colour-discipline relationships, the type scale, and full CSS↔TS parity in both directions.
- **Coverage:** 100% of `app/**` (21/21 statements, 7/7 functions) — above the 80% gate.
- **Gates:** `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build` all clean.
  Emitted CSS verified in `build/client/assets/root-*.css`: aliases resolve, `.tile-title` and
  `.kpi-number` ship as written.
- **Security triage:** every trigger in `.claude/rules/security-review.md` §1 considered — no
  dependency or lockfile change, no HTTP handler or route, no raw SQL, no `dangerouslySetInnerHTML`,
  no `fetch`, no upload, no env var, no auth, no logging, no user input. **No security-relevant
  changes detected** (§4).

### 2026-09-09 — US-004 Self-hosted FCB crest (1 pt) ✅

The club serves the crest from `https://fcb.ch/cdn/shop/files/logo.webp` — but the **bytes are a
PNG**, not a WebP; the extension lies and the `Content-Type` (`image/png`) tells the truth. The
downloaded file was inspected before anything was committed (`file`: `PNG image data, 608 x 648,
8-bit/color RGBA`), so it is stored as `public/fcb-crest.png` under its real format. Committing it
as `.webp` would have shipped a file no build tool could reason about.

194 KB of 608x648 artwork for a 32px app-bar mark is ~90x more pixels than the mark can show, so it
was downsampled with macOS `sips` (already on the machine — **no image dependency was added**) to
120x128, which stays crisp to 64px, i.e. 2x of the render size. `sips` re-attached an XMP `iTXt`
chunk carrying the source machine's `HostComputer` name; every ancillary chunk was then stripped
with a stdlib Python filter, leaving only `IHDR`/`IDAT`/`IEND`. Final asset: **17,908 bytes, a 91%
reduction**, transparency intact, visually verified as the genuine crest.

`app/components/chrome/crest.tsx` exports `Crest`, which renders `/fcb-crest.png` with
`alt="FC Basel 1893"` and derives width from the asset's own aspect ratio so the app bar reserves
the right box and never shifts on decode. A deliberately minimal `<header>` in `app/root.tsx` holds
it top-left at 32px — **the sidebar, workspace label, avatar, connection status and Reset control
are US-012 in Phase 2a and were not built here**.

- **No CDN request — proved four ways, not assumed:** `grep -rIa "fcb\.ch" build/` returns nothing;
  the only `fcb.ch` string in the repo is a warning comment in `crest.tsx`, which the bundler strips.
  Both bundles reference the literal `"/fcb-crest.png"` and nothing else. The production server was
  booted and the served HTML contains `<img src="/fcb-crest.png" … height="32">` with **every**
  `src`/`href` on the page root-relative — zero external hosts of any kind. `/fcb-crest.png` answers
  `200 image/png 17908` from the local server.
- **Tests:** 10 added (106 total, all passing). They assert the accessible name, the root-relative
  `src`, that `CREST_SRC` matches no absolute URL or `fcb.ch`, the 32px default and aspect-ratio
  scaling, crest-first placement inside the `banner` landmark, and — reading the committed file — the
  PNG magic bytes and the size budget. That last pair is what would catch a future "fix" that
  re-hotlinks or swaps the asset for a mislabelled one.
- **Coverage:** 100% of `app/**` (26/26 statements, 8/8 functions) — above the 80% gate.
- **Gates:** `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build` all clean.
- **Security triage:** the **external-binary trigger fired (A04/A08)** — bytes verified against the
  PNG magic number and the real format used, chunk table walked end-to-end (`IHDR`+`eXIf`+`iCCP`+
  `pHYs`+`IDAT`x25+`IEND` consuming exactly 194,518 bytes, so **no data appended past `IEND`**), no
  `tEXt`/`zTXt`/`iTXt` chunk survives in the committed file, so **no secret or tracking payload is
  embedded**; the asset is static content that is never executed. `src` is a hardcoded constant, not
  user input (A03 n/a). **No runtime `fetch` remains (A10 n/a)** — the download was a one-off
  authoring step. `package.json` and the lockfile are untouched, so the A06 audit gate does not
  fire. No route, raw SQL, env var, auth or logging change.
- **Trademark:** the genuine crest is used exactly as the client's Build Specification instructs.
  It stays in this repo; no further club branding was invented.

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

- **Tests:** 38 added (144 total, all passing). They cover the optionality of every slot in both
  directions, that the AC values resolve from tokens, that no hex or `rgb()` literal exists in the
  component, that the AI glyph is `aria-hidden` and announced as nothing, that caller text is
  escaped rather than parsed as markup, and that no ring or glow returns.
- **Coverage:** 100% of `app/**` (35/35 statements, 11/11 functions, 31/31 branches).
- **Gates:** `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build` clean.
  Emitted CSS checked in `build/client/assets/root-*.css`: every utility the card names is generated.
- **Security triage:** all `.claude/rules/security-review.md` §1 triggers considered — no dependency
  or lockfile change, no route or handler, no SQL, no `fetch`, no upload, no env var, no auth, no
  logging. Caller content is rendered as React children only: **no `dangerouslySetInnerHTML`**
  (asserted by test), so slot content is escaped. **No security-relevant changes detected** (§4).

---

**Created:** 2026-09-09
**Last Updated:** 2026-09-09
**Phase Status:** In Progress
**Next Phase:** [Phase 1b — Seed Data](phase-1b.md)
