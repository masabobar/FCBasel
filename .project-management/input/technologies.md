# Technologies

**Project:** FC Basel
**Version:** 1.0.0
**Last Updated:** 2026-09-09
**Status:** Approved — stack fixed; reconciled against the client document set

> **Stack ownership:** the Build Specification states that standing up the project (framework,
> repository) and deploying to **Railway** are the developer's call and deliberately outside that
> document. Their absence there is intentional, not an omission — this file is that decision.

---

## Project Type

**Project Type:** Web Only (prototype, with server-side data layer)
**Repository Type:** Single Application (no monorepo, no pnpm workspace, no Turborepo)

React Router 7 runs in **framework mode with SSR**, so server-side code (loaders, actions, server-only
modules) lives inside the same application. That covers the "small parts of backend" requirement without
a separate deployable: mock data is served from server modules today and can be swapped for a real
database later without restructuring the repository.

**Expansion path:** if the prototype later needs an independently deployable API, extract
`app/lib/repositories/` + `app/lib/mock/` into `apps/backend/` and convert this repo to the monorepo
layout in `templates/` / `init-project-structure-setup.md` Option 3.

---

## Stack Approach

**Selected:** Default — the battle-tested defaults from `.claude/rules/stack-specific.md`.

---

## Core Framework

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.0.0 | UI library |
| react-dom | ^19.0.0 | DOM rendering |
| react-router | ^7.13.0 | Full-stack framework (framework mode with SSR) |
| @react-router/dev | ^7.13.0 | Dev tooling / Vite plugin |
| @react-router/node | ^7.13.0 | Node.js adapter for SSR |
| @react-router/serve | ^7.13.0 | Production server |
| typescript | ^5.7.0 | Type system |
| vite | ^6.1.0 | Build tool |

## Database & ORM

| Package | Version | Purpose |
|---------|---------|---------|
| prisma | ^6.19.0 | CLI and migration tool |
| @prisma/client | ^6.19.0 | Database client |
| PostgreSQL | 16.x | Database engine |

**Not used by the prototype — and by specification, not by omission.** The Build Specification is
explicit: *"No persistence across sessions. State lives in memory for the duration of a demo run and
resets to baseline. No database is required for the prototype itself."*

Seed data ships as **static local files bundled with the app** (`app/lib/mock/`), read through the
repository interface in `app/lib/repositories/`. Nothing is fetched at runtime — that is a hard
demo-day requirement (offline resilience, E8), not a convenience.

The rows above are recorded as the **expansion path**, not current dependencies: introducing Prisma
later means implementing the same repository interface against Postgres, via `prisma migrate` and
never `db push` in production (`.claude/rules/database.md`). Doing so crosses the
prototype-versus-platform boundary and would be a declared decision — see `scope.md` §7.

## Authentication & Security

| Package | Version | Purpose |
|---------|---------|---------|
| bcryptjs | ^2.4.3 | Password hashing |
| createCookieSessionStorage | built-in (react-router) | Session management |

**Not used by the prototype.** The Build Specification states: *"No real permissions or
authentication. There is a single persona. Role-based access, granular permissions and the
permission-aware AI from the client's vision are not built. A cosmetic login screen is optional and,
if present, decorative only."* Cookie-based sessions (no JWT) remain the expansion-path default.

## Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| react-hook-form | ^7.54.0 | Form state management |
| @hookform/resolvers | ^3.9.0 | Zod resolver |
| zod | ^3.24.0 | Schema validation (shared client/server) |

**Minimal use.** The prototype's only input is the prompt bar (free text plus chip taps). There are
no data-entry forms. The reference build deliberately avoids an HTML `<form>`; in this stack a form
is fine — see US-028 for the behaviour that must be preserved.

## Internationalization

**Not used — English only.** No i18n library is installed and `I18N-RULES.md` does not exist, so
`/execute-work` performs no translation-key check.

Neither client document requests multi-language support: the prototype has one persona, one Basel
boardroom audience, a one-week deadline, and every narrative string is hand-authored persuasion copy
that must render **verbatim**. Conventions are British English, currency CHF throughout.

## UI & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| tailwindcss | ^4.1.0 | Utility-first CSS (v4 Oxide engine) |
| @tailwindcss/vite | ^4.1.0 | Vite plugin |
| shadcn/ui | latest | Component library |
| radix-ui | latest | Primitives (shadcn dependency) |
| lucide-react | ^0.475.0 | Icons |
| clsx | ^2.1.0 | Conditional classes |
| tailwind-merge | ^3.0.0 | Class conflict resolution |
| class-variance-authority | ^0.7.0 | Component variants |

## Data Tables & Charts

| Package | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-table | ^8.21.0 | Headless data table |
| recharts | ^2.15.0 | Charting |

**Charting decision — DECIDED (2026-09-09): port the reference hand-built SVG components.**
`recharts` and `@tanstack/react-table` are **not installed.**

The Build Specification (E6) leaves the library to the developer, naming Recharts or Chart.js as a
reasonable default, but requires that whatever is used honours the E2 colour discipline and stays
legible at 1080p. The reference build uses hand-built SVG for full control over the branded look and
the animation feel, and to avoid a charting dependency.

The deciding factor: several Phase 2b acceptance criteria are animation-specific — bars persisting
across data changes so a filter transitions rather than snaps, donut segments morphing via
`stroke-dasharray`/`stroke-dashoffset`, line stroke-draw on re-key, count-up from the *current*
displayed value. These are natural in hand-built SVG and awkward to guarantee in Recharts, and the
brief calls those animations "most of the wow". The department table is likewise hand-built rather
than TanStack Table — it is six rows and a total, not a data grid.

## PDF Generation & Email

`@react-pdf/renderer`, `resend` and `react-email` are part of the default stack but have **no use in
this prototype** — there is no export and no email path. Not installed.

## Testing

| Package | Version | Purpose |
|---------|---------|---------|
| vitest | ^4.0.0 | Unit/integration test runner |
| @testing-library/react | ^16.0.0 | Component testing |
| @testing-library/jest-dom | ^6.6.0 | DOM matchers |
| @testing-library/user-event | ^14.6.0 | User interaction simulation |
| @playwright/test | ^1.58.0 | E2E testing |
| @vitest/coverage-v8 | ^4.0.0 | Code coverage |

Coverage target ≥ 80% per `.claude/rules/testing.md`. `msw` is dropped — there are no API calls to
mock.

**Where testing effort belongs here:** this prototype has no API surface, so the usual API
status-matrix requirement (200/400/401/403/404/500) does not apply. The risk is concentrated in the
intent matcher and the dead-end paths, so the valuable tests are unit tests over
normalise/score/match/tie-break (US-030) and Playwright runs of the full demo script including
off-script input, empty input, follow-up-before-parent, and reset (US-042).

## Dev Tooling

| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^9.0.0 | Linting (flat config) |
| prettier | ^3.4.0 | Formatting |
| prettier-plugin-tailwindcss | ^0.6.0 | Tailwind class sorting |
| husky | ^9.1.0 | Git hooks |
| lint-staged | ^15.3.0 | Pre-commit lint runner |
| tsx | ^4.19.0 | TS execution for scripts |

## Deployment

| Service | Purpose |
|---------|---------|
| Railway | Hosting — **the shareable URL is the deliverable** |

Railway's managed PostgreSQL is **not provisioned**; the prototype needs no database. The deployed
URL is sent to the internal sponsor and opened in the owner meeting, so a cold-start load in Chrome
must be clean (US-045).

**Browser target:** Chrome is the demo guarantee. Other modern browsers should work, but Chrome is
what gets rehearsed.

---

## Open Items

- Packages above are declared, not installed. US-001/US-002 create `package.json` and materialize
  the dependency set with `pnpm install`.
- **Not installed for this prototype:** Prisma, `@prisma/client`, bcryptjs, msw, recharts,
  `@tanstack/react-table`, `@react-pdf/renderer`, resend, react-email, and every i18next package.
  Each is recorded above as the expansion path only.
- The genuine FCB crest must be downloaded and committed before US-004 can pass; the build must not
  reach the club CDN at runtime.
