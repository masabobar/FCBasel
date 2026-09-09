import { RotateCcw } from "lucide-react";

import { cn } from "../../lib/cn";
import { MOTION_CLASS } from "../../lib/motion";
import {
  AVATAR_INITIALS,
  AVATAR_LABEL,
  WORKSPACE_LABEL,
} from "../../lib/persona";
import { Crest } from "./crest";

/**
 * The top app bar: crest, workspace label, connection status, Reset, avatar.
 *
 * Three things in here are easy to get wrong, so they are stated outright.
 *
 * 1. THE CONNECTION STATUS IS DECORATIVE. "Connected · 11 systems" is a static
 *    label that sets the scene — the prototype makes no network call of any
 *    kind after load (`constraints.md` §3, verified in US-041). It must NEVER
 *    be wired to a health check, a poll or a `fetch`. It therefore carries no
 *    `role="status"` and no `aria-live`: nothing about it updates, so nothing
 *    should announce that it did. `data-decorative` marks that in the markup
 *    and a test asserts the live-region attributes stay absent.
 *
 * 2. THE PERSONA IS A ROLE. The label and the monogram come from
 *    `app/lib/persona.ts`; no name and no photo appear here. See that module
 *    for why.
 *
 * 3. RESET IS RENDERED HERE, BUT ITS BEHAVIOUR IS NOT. The control takes an
 *    injected callback and does nothing without one; `app/root.tsx` injects
 *    `useDashboard`'s `reset` (US-015), which clears the session back to its
 *    baseline. Do not grow reset logic in this file — a second implementation
 *    is how a Reset that half-works gets shipped.
 */

/** How many club systems the demo narrative claims to span. */
export const CONNECTED_SYSTEM_COUNT = 11;

/** The decorative status label. Static text — never a measured state. */
export const CONNECTION_STATUS_TEXT = `Connected · ${CONNECTED_SYSTEM_COUNT} systems`;

/** App-bar height from the Build Specification (56px). */
const TOP_BAR_HEIGHT_CLASS = "h-14";

export interface TopBarProps {
  /**
   * Invoked when Reset is pressed. Optional: the shell renders the control,
   * US-015 supplies the behaviour. Absent, the button is a no-op.
   */
  onReset?: () => void;
  className?: string;
}

export function TopBar({ onReset, className }: TopBarProps) {
  return (
    <header
      data-slot="top-bar"
      className={cn(
        "flex shrink-0 items-center gap-4 border-b border-border bg-bg px-4",
        TOP_BAR_HEIGHT_CLASS,
        className,
      )}
    >
      <Crest />

      <span data-slot="workspace-label" className="tile-title truncate">
        {WORKSPACE_LABEL}
      </span>

      {/* Decorative — see (1) above. No live region, no network call. */}
      <div
        data-slot="connection-status"
        data-decorative="true"
        className="ml-auto hidden items-center gap-2 text-caption text-muted sm:flex"
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-2 w-2 shrink-0 rounded-pill bg-navy",
            MOTION_CLASS.glow,
          )}
        />
        {CONNECTION_STATUS_TEXT}
      </div>

      <button
        type="button"
        data-slot="reset"
        onClick={onReset}
        className="ml-auto flex shrink-0 items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-caption font-medium text-navy sm:ml-0"
      >
        <RotateCcw size={14} aria-hidden="true" />
        Reset
      </button>

      {/*
       * Generic monogram. `role="img"` with the workspace as its accessible
       * name, so assistive tech hears the role rather than spelling "SM".
       */}
      <span
        data-slot="avatar"
        role="img"
        aria-label={AVATAR_LABEL}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-navy text-caption font-semibold text-bg"
      >
        {AVATAR_INITIALS}
      </span>
    </header>
  );
}
