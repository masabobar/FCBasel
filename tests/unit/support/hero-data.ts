import { type HeroesData, loadHeroes } from "../../../app/lib/dashboard/heroes";
import { createMockHero1Repository } from "../../../app/lib/mock/hero1";
import { createMockHero2Repository } from "../../../app/lib/mock/hero2";

/**
 * The hero datasets, read exactly as the root loader reads them (US-034).
 *
 * Every suite that mounts `App` or `InsightSections` needs the same object, and
 * it must come from the REPOSITORY rather than from a hand-written fixture —
 * otherwise a test could pass against figures the product does not ship. Built
 * once, here, so there is one read rather than one per file.
 *
 * Not a `*.test.ts` file, so vitest does not collect it.
 */
export const HEROES: HeroesData = await loadHeroes(
  createMockHero1Repository(),
  createMockHero2Repository(),
);
