import {
  type InsightSections as InsightSectionList,
  sectionKey,
} from "../../lib/dashboard/sections";
import { type RevealFocus } from "../../lib/dashboard/use-dashboard";
import { HeroSection } from "./hero-section";

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
 */

export interface InsightSectionsProps {
  /** The answered questions, in the order asked. */
  sections: InsightSectionList;
  /** Which section just changed — the one to bring into view. */
  focus: RevealFocus | null;
}

export function InsightSections({ sections, focus }: InsightSectionsProps) {
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
        />
      ))}
    </>
  );
}
