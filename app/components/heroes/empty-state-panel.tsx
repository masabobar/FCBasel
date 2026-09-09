import { Sparkles } from "lucide-react";

import { cn } from "../../lib/cn";
import { useUid } from "../../lib/hooks/use-motion";

/**
 * The empty-state panel — what the canvas offers BEFORE any question has been
 * asked (US-032, criterion 4).
 *
 * IT IS NOT THE FALLBACK PANEL, and conflating the two is the mistake this
 * pair of files exists to prevent. They appear at different moments and say
 * different things:
 *
 *   | | empty state (this file)            | fallback (`./fallback-panel.tsx`) |
 *   |-|------------------------------------|-----------------------------------|
 *   | when    | on load, and after Reset — nothing asked yet | a typed question matched nothing |
 *   | says    | the dashboard is ready; ask something | the request is reasonable, here are the prepared questions |
 *   | surface | light branded red, hairline red border | neutral white, hairline grey border |
 *   | chips   | none — the row above the field is the affordance | the three prepared questions, inside the panel |
 *
 * WHICH OF THE TWO IS ON SCREEN IS DECIDED IN ONE PLACE:
 * `canvasPanelFor` in `app/lib/dashboard/use-canvas-panel.ts`, which returns
 * exactly one of thinking / fallback / empty / none. Neither panel knows about
 * the other, and none of the three can be on screen beside another.
 *
 * THE SURFACE IS RECORDED REVIEW FEEDBACK, not a free choice: "light
 * branded-red panel, present but quiet, not overpowering the screen", with
 * "improved fonts — a larger bold navy heading and a lighter one-line subtext,
 * with a red gradient icon badge". So:
 *
 *   - the ground is the club red at 4.5% ({@link EMPTY_STATE_PANEL_CLASS}) —
 *     `bg-red/4.5` resolves to `color-mix(… var(--color-red) 4.5% …)`, which is
 *     `rgba(211,1,12,0.045)` DERIVED FROM THE TOKEN. The literal rgba is
 *     nowhere in the code, and neither is the hex;
 *   - the border is the same red, a touch stronger, so the hairline matches the
 *     wash rather than introducing a grey;
 *   - the heading is the band's display step in navy, bold; the subtext is one
 *     line of muted caption beneath it;
 *   - the badge is the red gradient, `--color-red` to `--color-red-vivid`, the
 *     one gradient pair the token set defines for red.
 *
 * RED HERE DOES NOT MEAN "BAD" (colour discipline rule 3, `app/lib/tokens.ts`).
 * It is the club's hero colour, used as a 4.5% wash on an invitation — the
 * quietest possible use of it. Nothing on this panel reports a value, so there
 * is no variance for the colour to be confused with.
 *
 * NO LIVE REGION. This is the canvas's RESTING state, not an announcement: it
 * is present on load, so there is nothing to announce, and a live region that
 * ships with content risks being read out twice. It is a labelled region
 * instead, so a screen-reader user reaches it as a place. The transient panel
 * that DOES announce itself politely is the fallback.
 */

/* ------------------------------------------------------------- STRINGS -- */

/** The heading. Bold navy, the panel's accessible name. */
export const EMPTY_STATE_HEADING = "Your dashboard is ready";

/**
 * The one-line subtext. It names both ways in, in the order they are reachable
 * — the chip row sits directly above the field — and deliberately does not
 * restate the field's own placeholder.
 */
export const EMPTY_STATE_SUBTEXT =
  "Tap one of the prepared questions below, or type a question of your own.";

/* ------------------------------------------------------------ GEOMETRY -- */

/**
 * The panel's placement and surface — the branded-red wash and its matching
 * hairline, both derived from `--color-red` by Tailwind's alpha modifier.
 *
 * `col-span-full`, so it is a grid item on the canvas grid like every section
 * and like the other two transient panels.
 */
export const EMPTY_STATE_PANEL_CLASS =
  "col-span-full rounded-panel border border-red/10 bg-red/4.5 px-5 py-5";

/**
 * The icon badge: the red gradient, in the token pair the set defines for it
 * (`--color-red` → `--color-red-vivid`). The same anatomy as the thinking
 * panel's navy-to-blue badge, in the brand's own colour.
 */
export const EMPTY_STATE_BADGE_CLASS =
  "grid h-10 w-10 shrink-0 place-items-center rounded-badge bg-gradient-to-br from-red to-red-vivid text-bg";

/** The glyph inside the badge. One step up from the fallback panel's mark. */
const GLYPH_SIZE = 20;

/* ------------------------------------------------------------ COMPONENT -- */

export interface EmptyStatePanelProps {
  className?: string;
}

export function EmptyStatePanel({ className }: EmptyStatePanelProps) {
  const headingId = `${useUid("empty-state")}-heading`;

  return (
    // A labelled region: the heading names it, so it is reachable as a place
    // rather than as an unmarked div above the prompt bar.
    <section
      data-slot="empty-state-panel"
      aria-labelledby={headingId}
      className={cn(EMPTY_STATE_PANEL_CLASS, className)}
    >
      <div className="flex items-center gap-4">
        {/* Decorative: the heading beside it carries the message. */}
        <span
          data-slot="empty-state-badge"
          aria-hidden="true"
          className={EMPTY_STATE_BADGE_CLASS}
        >
          <Sparkles size={GLYPH_SIZE} />
        </span>

        <div className="min-w-0">
          <h2
            id={headingId}
            data-slot="empty-state-heading"
            className="text-kpi leading-tight font-bold text-navy"
          >
            {EMPTY_STATE_HEADING}
          </h2>
          <p
            data-slot="empty-state-subtext"
            className="mt-1 text-caption text-muted"
          >
            {EMPTY_STATE_SUBTEXT}
          </p>
        </div>
      </div>
    </section>
  );
}
