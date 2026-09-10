import { type HeroesData } from "../../lib/dashboard/heroes";
import {
  type InsightSection,
  type InsightSections as InsightSectionList,
  sectionKey,
} from "../../lib/dashboard/sections";
import { type RevealFocus } from "../../lib/dashboard/use-dashboard";
import { HeroId } from "../../lib/repositories/enums";
import { Hero1Body } from "./hero-1";
import { Hero2Body } from "./hero-2";
import { HeroSection, PlaceholderBody } from "./hero-section";

/**
 * The "Insight sections" region of the dashboard (`screen-map.md` §2.2): one
 * section per answered question, rendered as grid items on the canvas the
 * baseline tiles already occupy.
 *
 * It renders no frame of its own — no wrapper element, no grid, no heading.
 * That is the point: each section is a direct child of the canvas grid, so the
 * dashboard GROWS as answers arrive instead of a second container appearing
 * beneath the first. There is exactly one grid on this screen
 * (`app/components/chrome/app-shell.tsx`).
 *
 * ORDER IS THE ORDER THE QUESTIONS WERE ASKED. This maps the list as it comes,
 * and `app/lib/dashboard/sections.ts` keeps a refreshed section in the position
 * it already held, so the region reads as a transcript of the session.
 *
 * IT IS ALSO WHERE A HERO ID BECOMES CONTENT ({@link heroBody}). The dispatch
 * lives here rather than inside `./hero-section.tsx` so the frame does not
 * import the heroes and the heroes can import the frame's head and stagger —
 * one direction, no cycle. US-038 adds the last branch below and one module
 * beside `./hero-1.tsx` and `./hero-2.tsx`.
 */

export interface InsightSectionsProps {
  /** The answered questions, in the order asked. */
  sections: InsightSectionList;
  /** The hero datasets, from the root loader. Figures come from here only. */
  heroes: HeroesData;
  /** Which section just changed — the one to bring into view. */
  focus: RevealFocus | null;
}

/** The head and tiles for one answered question. */
function heroBody(section: InsightSection, heroes: HeroesData) {
  if (section.heroId === HeroId.HERO_1) {
    // Primary and follow-up are handed over together, as the dataset holds
    // them: the phase decides how far the section renders, so the beat's
    // figures are already on the client when the second question is asked.
    return (
      <Hero1Body
        primary={heroes.hero1.primary}
        followUp={heroes.hero1.followUp}
        phase={section.phase}
      />
    );
  }

  if (section.heroId === HeroId.HERO_2) {
    // Hero 2 needs no follow-up data yet: its beat is still the shared
    // placeholder, and US-037 adds `followUp` here the way US-035 did above.
    return <Hero2Body primary={heroes.hero2.primary} phase={section.phase} />;
  }

  return <PlaceholderBody heroId={section.heroId} phase={section.phase} />;
}

export function InsightSections({
  sections,
  heroes,
  focus,
}: InsightSectionsProps) {
  // A fragment, so every section is a direct child of the canvas grid.
  return (
    <>
      {sections.map((section) => (
        <HeroSection
          // The key carries the revision, so a re-asked hero remounts and
          // replays its entrance in place rather than sitting there unchanged.
          key={sectionKey(section)}
          section={section}
          focusTick={focus?.heroId === section.heroId ? focus.tick : null}
        >
          {heroBody(section, heroes)}
        </HeroSection>
      ))}
    </>
  );
}
