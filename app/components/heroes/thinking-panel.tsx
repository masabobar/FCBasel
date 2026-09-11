import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "../../lib/cn";
import {
  sourceChipDelayMs,
  type ThinkingBeat,
} from "../../lib/dashboard/thinking";
import { useI18n } from "../../lib/i18n/context";
import { MOTION_CLASS, scrollRevealedIntoView } from "../../lib/motion";

/**
 * The thinking panel — what is on screen during the beat (US-031).
 *
 * It is the one moment of theatre in the product: a message naming what is
 * being "looked at", a gold line sweeping across the top of the panel, and the
 * data-source chips lighting up one by one. The Reference Guide calls the
 * sequence that follows it — panel, then section, then tiles, then numbers —
 * "the wow", and this is its first frame.
 *
 * NOTHING IS HAPPENING BEHIND IT. The panel makes no request, holds no promise
 * and polls nothing; it renders a value from `app/lib/dashboard/thinking.ts`
 * and unmounts when `app/lib/dashboard/use-thinking.ts` says the beat is over.
 * See that config module for why the copy says "Querying" anyway.
 *
 * EVERY ANIMATION HERE IS US-006'S, REUSED — no keyframe is defined in this
 * file and none was added to `app/app.css` for it:
 *
 *   `MOTION_CLASS.enter`       the panel's own fade-and-rise, the same
 *                              entrance an inserted tile gets.
 *   `MOTION_CLASS.scan`        the sweeping gold line. `.fcb-scan` positions
 *                              itself absolutely inside this panel, which is
 *                              why the panel is `relative overflow-hidden`.
 *   `MOTION_CLASS.glow`        the ambient pulse on the AI glyph. Sanctioned
 *                              here — the Guide lists "the AI orbs in the
 *                              thinking panel" among gold's ambient uses — and
 *                              still never applied to an inserted tile.
 *   `MOTION_CLASS.sourceChip`  one chip appearing. THE STAGGER IS THE CALLER'S
 *                              (`sourceChipDelayMs`), exactly as a tile's
 *                              cascade is `tileDelayMs`.
 *
 * UNDER REDUCED MOTION THE PANEL IS STILL COMPLETE, and this component needs no
 * branch for it. `app/app.css` collapses every animation to its last frame and
 * zeroes every delay, so the source chips render VISIBLE at their final state
 * rather than stranded at `opacity: 0` — the trap US-006's stylesheet exists to
 * avoid. The one exception is the sweep, which `.fcb-scan` hides outright:
 * a finished sweep is a gold bar parked mid-panel, and it carries no
 * information to lose. The beat itself still runs, ~260ms instead of ~1150ms
 * (`thinkingDelayMs`).
 *
 * ACCESSIBILITY — THE BEAT IS ANNOUNCED, THE DECORATION IS NOT.
 * The panel is a polite live region, so a screen-reader user is told what is
 * being looked at instead of meeting a silent pause followed by a dashboard
 * that has quietly grown. Politely, never assertively: this is progress, not an
 * alert, and it must not interrupt whatever the user is reading. The sweep and
 * the glyph are `aria-hidden` — they say "working" to the eye and duplicate
 * nothing. The source chips are real text inside the region, because "which
 * systems is it looking at" is information rather than decoration.
 */

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * The panel's placement and surface.
 *
 * `col-span-full` — it is a grid item on the canvas grid like every section,
 * so the dashboard grows by one row and nothing reflows sideways when the panel
 * is replaced by the answer it precedes.
 *
 * `relative overflow-hidden` is load-bearing rather than cosmetic: `.fcb-scan`
 * is absolutely positioned and travels to `translateX(500%)`, so it needs this
 * box to resolve against and to be clipped by.
 *
 * `rounded-panel` and `shadow-raised` are the tokens the recommendation panel
 * uses — a panel sitting ON the canvas, not a card floating above it.
 */
export const THINKING_PANEL_CLASS =
  "col-span-full relative overflow-hidden rounded-panel border border-border bg-bg px-5 py-4 shadow-raised";

/** The AI glyph's navy-to-blue badge. Both tokens; no gradient hex anywhere. */
const GLYPH_BADGE_CLASS =
  "grid h-9 w-9 shrink-0 place-items-center rounded-badge bg-gradient-to-br from-navy to-blue text-bg";

/** One data-source chip: the inset surface, hairline border, muted text. */
const SOURCE_CHIP_CLASS =
  "rounded-pill border border-border bg-surface px-2 py-0.5 text-caption font-medium text-muted";

/** The glyph size, matching the recommendation panel's mark. */
const GLYPH_SIZE = 17;

/* ------------------------------------------------------------ COMPONENT -- */

export interface ThinkingPanelProps {
  /**
   * The beat to show — `useThinking`'s `beat`, which is one of the six
   * authored entries in `app/lib/dashboard/thinking.ts`. Rendered verbatim.
   */
  beat: ThinkingBeat;
  className?: string;
}

export function ThinkingPanel({ beat, className }: ThinkingPanelProps) {
  const { t, tList } = useI18n();
  const element = useRef<HTMLDivElement>(null);

  /**
   * Bring the panel into view, once, as it mounts — the reference build scrolls
   * down the moment the beat starts, and it has to: the canvas grows downwards,
   * so on the third question the panel appears below the fold and the presenter
   * would watch nothing happen for a second. US-014's helper is reused, so the
   * scroll reads the motion preference in the one place that decides it.
   */
  useEffect(() => {
    scrollRevealedIntoView(element.current);
  }, []);

  return (
    <div
      ref={element}
      data-slot="thinking-panel"
      // A live region rather than a landmark: it is a transient announcement,
      // and `role="status"` is the polite one by definition. `aria-live` is
      // restated because the criterion is about the politeness, not the role.
      role="status"
      aria-live="polite"
      className={cn(THINKING_PANEL_CLASS, MOTION_CLASS.enter, className)}
    >
      {/* The sweep. Decoration: it says "working" and carries nothing. */}
      <span
        data-slot="thinking-scan"
        aria-hidden="true"
        className={MOTION_CLASS.scan}
      />

      <div className="flex items-center gap-3">
        <span
          data-slot="thinking-glyph"
          aria-hidden="true"
          className={cn(GLYPH_BADGE_CLASS, MOTION_CLASS.glow)}
        >
          <Sparkles size={GLYPH_SIZE} />
        </span>

        <div className="min-w-0">
          {/* Verbatim, and the whole of what is announced. */}
          <p data-slot="thinking-message" className="font-semibold text-navy">
            {t(beat.messageKey)}
          </p>

          <div
            data-slot="thinking-sources"
            className="mt-1.5 flex flex-wrap gap-1.5"
          >
            {tList(beat.sourcesKey).map((source, index) => (
              <span
                key={source}
                data-slot="thinking-source"
                className={cn(SOURCE_CHIP_CLASS, MOTION_CLASS.sourceChip)}
                // The stagger, and only the stagger: the animation is US-006's,
                // and `app/app.css` zeroes this delay under reduced motion.
                style={{ animationDelay: `${sourceChipDelayMs(index)}ms` }}
              >
                {source}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
