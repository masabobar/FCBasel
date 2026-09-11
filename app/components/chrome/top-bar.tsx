import { LogOut, RotateCcw } from "lucide-react";

import { cn } from "../../lib/cn";
import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";
import { MOTION_CLASS } from "../../lib/motion";
import {
  AVATAR_INITIALS_KEY,
  WORKSPACE_LABEL_KEY,
  avatarLabel,
} from "../../lib/persona";
import { Crest } from "./crest";
import { LanguageToggle } from "./language-toggle";

/**
 * The top app bar: crest, workspace label, connection status, the language
 * toggle, Reset, avatar.
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
 * 3. THE LANGUAGE TOGGLE IS CHROME, NOT A SETTING (US-049). It flips memory-
 *    only state in `app/root.tsx` and writes nothing anywhere; see
 *    `./language-toggle.tsx`. It sits beside Reset because both are things the
 *    presenter reaches for mid-demo, and neither is part of the data.
 *
 * 4. RESET IS RENDERED HERE, BUT ITS BEHAVIOUR IS NOT. The control takes an
 *    injected callback and does nothing without one; `app/root.tsx` injects
 *    `useDashboard`'s `reset` (US-015), which clears the session back to its
 *    baseline. Do not grow reset logic in this file — a second implementation
 *    is how a Reset that half-works gets shipped.
 */

/** How many club systems the demo narrative claims to span. */
export const CONNECTED_SYSTEM_COUNT = 11;

/**
 * The decorative status label. Static text — never a measured state.
 *
 * The COUNT is interpolated into the translated sentence rather than
 * concatenated with it, because German puts the noun after the number in a
 * different case ("11 Systeme") and a joined string cannot be translated.
 */
export const CONNECTION_STATUS_KEY: TranslationKey = "topBar.connectionStatus";

/** App-bar height from the Build Specification (56px). */
const TOP_BAR_HEIGHT_CLASS = "h-14";

/**
 * THE CLUB RULE UNDER THE APP BAR — `border-b-2 border-red` on the header.
 *
 * IT DOES TWO THINGS, AND THE SECOND IS WHY IT IS RED RATHER THAN DARKER GREY.
 *
 *   1. Brand. Review asked for more of the club's red, and this is the single
 *      most-looked-at edge in the product: it spans the full width, above every
 *      screen state, and it is chrome — so it carries no meaning that could be
 *      confused with data.
 *   2. KL-4. This edge used to be `border-border`, which US-044 measured at
 *      **1.24:1 on white** and recorded as washing out on a projector. Red is
 *      far stronger, so the brand change also retires that reading for this
 *      border. `tests/e2e/brand-fidelity.spec.ts` measures it every run and
 *      fails anything FAINTER, so the improvement cannot silently regress.
 *
 * WHY RED IS SAFE HERE BUT NOT EVERYWHERE. `--color-red` is also
 * `varianceNegative` (`app/lib/tokens.ts`), so the same hex means "unfavourable"
 * inside a variance chip. That is exactly why this is the app-bar rule and not,
 * say, a tile border: chrome cannot be mistaken for a judgement about a figure.
 * Do not carry red onto anything that sits on or beside data for the same reason.
 *
 * NOT THE CONNECTION DOT. The obvious next place to add red is the
 * `connection-status` indicator below, and it must not be: a red dot beside
 * "Connected · 11 systems" reads as offline in every interface convention, and
 * this demo's whole claim is that those systems ARE connected.
 *
 * The 2px does not change the bar's height — Tailwind's preflight sets
 * `box-sizing: border-box`, so the rule is drawn inside the 56px.
 */

export interface TopBarProps {
  /**
   * Invoked when Reset is pressed. Optional: the shell renders the control,
   * US-015 supplies the behaviour. Absent, the button is a no-op.
   */
  onReset?: () => void;
  /**
   * Invoked when Sign out is pressed (US-050). Same injection rule as
   * {@link TopBarProps.onReset}: this file renders the affordance and owns none
   * of the behaviour. `app/root.tsx` supplies the handler, and it does TWO
   * things — see there for why ending the session is not optional.
   *
   * Absent, the control is not rendered at all rather than rendered dead. The
   * gate is optional (`constraints.md` §2), so a build without it must not show
   * a Sign out that does nothing.
   */
  onSignOut?: () => void;
  className?: string;
}

export function TopBar({ onReset, onSignOut, className }: TopBarProps) {
  const t = useT();

  return (
    <header
      data-slot="top-bar"
      className={cn(
        "flex shrink-0 items-center gap-4 border-b-2 border-red bg-bg px-4",
        TOP_BAR_HEIGHT_CLASS,
        className,
      )}
    >
      <Crest />

      <span data-slot="workspace-label" className="tile-title truncate">
        {t(WORKSPACE_LABEL_KEY)}
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
        {t(CONNECTION_STATUS_KEY, { count: CONNECTED_SYSTEM_COUNT })}
      </div>

      {/*
       * `ml-auto` below `sm`, where the connection status is hidden and this
       * becomes the first thing on the right-hand side. From `sm` up the
       * status owns the gap and both controls sit against the avatar.
       */}
      <LanguageToggle className="ml-auto sm:ml-0" />

      <button
        type="button"
        data-slot="reset"
        onClick={onReset}
        className="flex shrink-0 items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-caption font-medium text-navy"
      >
        <RotateCcw size={14} aria-hidden="true" />
        {t("topBar.reset")}
      </button>

      {/*
       * Sign out (US-050), rendered only when a handler is supplied — see
       * `TopBarProps.onSignOut`. It sits between Reset and the avatar because
       * that is what it acts on: Reset clears the DASHBOARD, this ends the
       * SESSION, and the monogram beside it is the session it ends. Muted
       * against Reset's navy on purpose; Reset is the control a presenter
       * reaches for mid-demo, and this one should not compete with it.
       */}
      {onSignOut && (
        <button
          type="button"
          data-slot="sign-out"
          onClick={onSignOut}
          className="flex shrink-0 items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 text-caption font-medium text-muted"
        >
          <LogOut size={14} aria-hidden="true" />
          {t("topBar.signOut")}
        </button>
      )}

      {/*
       * Generic monogram. `role="img"` with the workspace as its accessible
       * name, so assistive tech hears the role rather than spelling "SM".
       */}
      <span
        data-slot="avatar"
        role="img"
        aria-label={avatarLabel(t)}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-navy text-caption font-semibold text-bg"
      >
        {t(AVATAR_INITIALS_KEY)}
      </span>
    </header>
  );
}
