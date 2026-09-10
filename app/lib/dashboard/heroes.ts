/**
 * The hero datasets, read out of the repositories once, in the ROOT loader.
 *
 * WHY THIS MODULE EXISTS, AND WHY IT IS SO THIN
 * An insight section is inserted by `app/root.tsx`, which owns the session list
 * — so the figures a section renders have to be on the client BEFORE the
 * question is asked. The repositories are asynchronous and server-only
 * (`../repositories/index.server.ts`), and the prototype makes no network call
 * after load (`technical-spec.md` §4.4), which leaves exactly one correct
 * shape: fetch every hero in the root loader, hand the plain data down, and let
 * a question do nothing but decide which section renders.
 *
 * It mirrors `./baseline.ts` deliberately — one function the loader calls, one
 * plain-data view model that crosses the loader-to-component boundary — so the
 * two halves of the screen are fetched the same way.
 *
 * IT RESOLVES NO PERIOD AND DERIVES NO FIGURE. Hero 1's period filter is client
 * state driving three tiles at once (US-034), so every period has to be on the
 * client already; and everything a tile shows on top of the stored figures —
 * kit revenue, the Home share, the badge share, the badge segments — is
 * `../repositories/derive.ts`'s work at render time. A `total` or a `share`
 * field here would be a stored copy of a derived number, which is the one thing
 * the data layer refuses to hold.
 *
 * A hero travels as ONE object, primary and follow-up together, exactly as the
 * fixtures hold it: the follow-up's copy quotes the primary's figures, and
 * splitting them here would let the two arrive from different reads.
 *
 * It takes the repository as a PARAMETER rather than importing the selected
 * one, because `../repositories/index.server.ts` is server-only and a test has
 * to be able to build the same view model from a mock.
 */

import {
  type Hero1,
  type Hero1Repository,
  type Hero2,
  type Hero2Repository,
  type Hero3,
  type Hero3Repository,
} from "../repositories/types";

/**
 * Everything the inserted sections render, in hero order. All three heroes are
 * here as of US-038; there is no fourth.
 */
export interface HeroesData {
  /** Merchandising — shirt sales, sponsor badges, printed names. */
  readonly hero1: Hero1;
  /** Ticketing — matchday revenue by fixture and by month, year on year. */
  readonly hero2: Hero2;
  /** Departmental budgets — budget against actual against outcome target. */
  readonly hero3: Hero3;
}

/**
 * Read the hero datasets out of their repositories, all at once.
 *
 * `Promise.all` rather than one `await` per hero: the reads are independent, so
 * a slower implementation behind one repository must not serialise the others.
 */
export async function loadHeroes(
  hero1Repository: Hero1Repository,
  hero2Repository: Hero2Repository,
  hero3Repository: Hero3Repository,
): Promise<HeroesData> {
  const [hero1, hero2, hero3] = await Promise.all([
    hero1Repository.hero(),
    hero2Repository.hero(),
    hero3Repository.hero(),
  ]);

  return { hero1, hero2, hero3 };
}
