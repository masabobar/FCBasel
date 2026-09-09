# Repositories — the mock → database seam

This directory is the **only** place the rest of the app talks to for data. Everything above it
(routes, loaders, actions, components) depends on the interfaces defined here, never on where the
data physically comes from.

That is what makes the prototype expandable: today these interfaces are implemented against the
in-memory fixtures in `../mock/`; later they get a second implementation backed by Prisma +
Postgres, and nothing outside this directory changes.

## Rules

1. **Define the interface first.** One interface per aggregate, e.g.:

   ```ts
   // app/lib/repositories/types.ts
   export interface MatchRepository {
     list(filter?: MatchFilter): Promise<Match[]>;
     byId(id: string): Promise<Match | null>;
   }
   ```

2. **Mock implementation lives in `../mock/`,** and is selected here — not by callers:

   ```ts
   // app/lib/repositories/index.server.ts
   import { mockMatchRepository } from "../mock/matches";
   export const matchRepository: MatchRepository = mockMatchRepository;
   ```

3. **Server-only.** Use the `.server.ts` suffix so React Router keeps this code out of the client
   bundle. Loaders and actions import from here; components never do.

4. **Domain types, not storage types.** The interface returns `Match`, not a Prisma row and not a
   raw JSON fixture shape. Both implementations map into the same domain type.

5. **Async from day one.** Mock methods return `Promise` even though the data is in memory, so
   swapping in a real database is not a signature change.

## Adding a dataset — the shape US-007 established

Every dataset story lands as the same four edits. US-008, US-009 and US-010 follow this exactly.

1. **Enum keys** → `enums.ts`. Any new period key or category key is added to the existing `const`
   object there (`SCREAMING_SNAKE_CASE` value, `PascalCase` type, plus its `*_LABEL` map). Never
   declare a competing key set inside a fixture file. Display wording that varies by dataset stays a
   `label` field on the dataset entry — Hero 1 says "Current month" where the baseline band says
   "This month".
2. **Domain types + the repository interface** → `types.ts`. Rows with names, not parallel arrays.
   Every method returns a `Promise`. Money is a plain number; nothing is pre-formatted.
3. **Fixtures + the implementation** → `../mock/<dataset>.ts`, exporting a
   `createMock<X>Repository(clock?)` factory. Anything derived from the current date takes the
   injected `Clock` from `../calendar` so tests pin a fixed "now" instead of reading the wall clock.
   A figure that appears twice is written once and referenced.
4. **Selection** → one line in `index.server.ts`.

Values that a tile displays but that follow from other values — a total, a delta, a percentage of
capacity, a scoreline — are **computed in `derive.ts`, never stored**. The Reference Guide requires
the headline number to always agree with the chart under it, and the only way to guarantee that is
for there to be nothing to disagree with.

## Swapping in Prisma later

1. Add the Prisma schema and run `prisma migrate` (per `.claude/rules/database.md` — never
   `db push` in production).
2. Add `matchRepository.prisma.server.ts` implementing the same interface.
3. Change the single export in `index.server.ts`.
4. Keep the mock implementation — it stays useful for tests and for `msw`-free unit runs.

Enum wire format is `SCREAMING_SNAKE_CASE` across mock, database, and client alike, per
`.claude/rules/enums-and-constants.md`, so the swap does not shift any values.
