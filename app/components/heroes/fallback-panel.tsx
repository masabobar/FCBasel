import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "../../lib/cn";
import { HERO_CHIPS, type SuggestionChip } from "../../lib/dashboard/chips";
import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";
import { MOTION_CLASS, scrollRevealedIntoView } from "../../lib/motion";
import { SuggestionChips } from "../chrome/suggestion-chips";

/**
 * The graceful fallback panel — what answers a question nothing matched
 * (US-032, criteria 1 to 3).
 *
 * THE MOMENT THIS FILE EXISTS FOR. The owner ignores the chips, types their own
 * wording in front of the room, and it clears no threshold. `askQuestion`
 * returns `null` (`app/lib/dashboard/intents.ts`) and this panel is the whole
 * of the answer — the client's framing is that nothing "dead-ends, even when
 * someone types a question off-script", and this is the catch that makes that
 * true.
 *
 * THREE THINGS IT MUST NEVER DO, and they are criterion 2 in full:
 *
 *   1. **Never show an error.** No alert role, no error styling, no red
 *      warning semantics — the surface is the same white panel with a hairline
 *      border the thinking panel uses, because this is a normal state of the
 *      product and not a failure of it.
 *   2. **Never blame the user.** The copy is fixed and forward-looking, and
 *      carries no "sorry", no "I didn't understand", no "invalid", no
 *      "unfortunately". `tests/unit/graceful-fallback.test.tsx` asserts the
 *      ABSENCE of that vocabulary, which is a real requirement here rather
 *      than a style preference.
 *   3. **Never leave the screen without a next step.** The three prepared
 *      questions are re-surfaced INSIDE the panel, so the way forward is where
 *      the eye already is instead of only in the bar at the foot of the screen.
 *
 * THE TYPED QUESTION IS NOT QUOTED BACK. This component takes no question text
 * at all — there is no prop for it and no place to put it. That is criterion 2
 * (repeating what someone typed under a heading of prepared alternatives reads
 * as a correction) and it is also the A03 answer: the string cannot reach this
 * panel, so it cannot become markup here even by accident. `intents.ts` reads
 * it, scores it and discards it.
 *
 * NO BEAT PRECEDES IT. A thinking beat promises an answer is coming; nothing is
 * coming, so `askQuestion` never calls a dashboard action and US-031's
 * `useThinking` is never entered. The panel is therefore IMMEDIATE — the
 * presenter presses Enter and this is on screen in the same commit.
 *
 * THE CHIPS ARE US-029'S, NOT A SECOND SET. It renders
 * {@link SuggestionChips} over the frozen {@link HERO_CHIPS} — the same
 * component, the same labels and the same `.fcb-chip` surface as the row above
 * the prompt field. There is no `<button>` in this file: a chip rebuilt here
 * would drift from the row within a sprint.
 *
 * WHY `HERO_CHIPS` AND NOT `suggestionChips(sections)`. Criterion 1 says "the
 * three suggestion chips", and `HERO_CHIPS` is exactly those three, always, in
 * `HERO_IDS` order. The derived row can also carry follow-up chips, and a
 * follow-up offered as a way out of an unmatched question would point at the
 * deep-dive of an answer that is not on screen.
 */

/* ------------------------------------------------------------- STRINGS -- */

/**
 * THE COPY, VERBATIM — criterion 1, and the string is the contract.
 *
 * Rendered untransformed: no truncation, no re-casing, no smart quotes, no
 * dash substitution. Two details are load-bearing and are pinned character by
 * character by the suite:
 *
 *   - a STRAIGHT apostrophe in "I've" (U+0027), not a typographic one;
 *   - it ends in a plain HYPHEN, never an em or en dash. House style is
 *     hyphens only, and the repo already fails a build that introduces one.
 *
 * The tone is the criterion: it opens by saying the request is reasonable ("I
 * can pull that together"), explains the limit as a property of the PREVIEW
 * rather than of the question, and hands over the prepared set. Nothing here
 * says the user did anything wrong, because they did not.
 */
export const FALLBACK_MESSAGE_KEY: TranslationKey = "fallback.message";

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * The panel's placement and surface.
 *
 * `col-span-full` — a grid item on the canvas grid like every section and like
 * the thinking panel, so the dashboard grows by one row and nothing reflows
 * sideways.
 *
 * The surface is deliberately the NEUTRAL one (`bg-bg`, `border-border`): a
 * tinted or red-bordered panel would read as a warning, which is exactly what
 * criterion 2 forbids. The branded-red tint belongs to the empty state, which
 * is an invitation rather than an answer (`./empty-state-panel.tsx`).
 */
export const FALLBACK_PANEL_CLASS =
  "col-span-full rounded-panel border border-border bg-bg px-5 py-4 shadow-raised";

/**
 * The AI mark beside the copy. A plain glyph in navy — the recommendation
 * panel's anatomy (`app/components/tiles/recommendation-panel.tsx`), not the
 * thinking panel's gradient badge: nothing is in flight here, so the panel
 * carries no badge and no pulse.
 */
const GLYPH_CLASS = "shrink-0 text-navy";

/** The glyph size, matching the recommendation panel's mark. */
const GLYPH_SIZE = 18;

/* ------------------------------------------------------------ COMPONENT -- */

export interface FallbackPanelProps {
  /**
   * A chip in the panel was tapped. Wired to `selectChip` exactly as the
   * prompt bar's row is, so a tap from here resolves through the chip path and
   * never through US-030's scoring.
   */
  onSelect: (chip: SuggestionChip) => void;
  className?: string;
}

export function FallbackPanel({ onSelect, className }: FallbackPanelProps) {
  const t = useT();
  const element = useRef<HTMLDivElement>(null);

  /**
   * Bring the panel into view, once, as it mounts — US-014's helper, reused so
   * the scroll reads the motion preference in the one place that decides it.
   * The canvas grows downwards, so by the third question this panel appears
   * below the fold and the presenter would see nothing happen at all: the
   * silent no-op is the dead end this story exists to remove.
   */
  useEffect(() => {
    scrollRevealedIntoView(element.current);
  }, []);

  return (
    <div
      ref={element}
      data-slot="fallback-panel"
      // Polite, and `status` rather than `alert`: this is information, not a
      // problem. An assertive live region would interrupt the reader, and an
      // alert would tell a screen-reader user that something went wrong.
      role="status"
      aria-live="polite"
      className={cn(FALLBACK_PANEL_CLASS, MOTION_CLASS.enter, className)}
    >
      <div className="flex items-start gap-3">
        {/* Decorative: the copy beside it carries the whole message. */}
        <span
          data-slot="fallback-glyph"
          aria-hidden="true"
          className={GLYPH_CLASS}
        >
          <Sparkles size={GLYPH_SIZE} />
        </span>

        <div className="min-w-0 flex-1">
          {/* Verbatim. No formatter, no clamp, no transformation. And not a
              heading: the panel speaks in the assistant's voice, and the
              headings on this canvas belong to answers that rendered. */}
          <p data-slot="fallback-message" className="font-semibold text-navy">
            {t(FALLBACK_MESSAGE_KEY)}
          </p>

          {/* The next step, always. US-029's row, not a second one. */}
          <SuggestionChips
            chips={HERO_CHIPS}
            onSelect={onSelect}
            className="mt-3"
          />
        </div>
      </div>
    </div>
  );
}
