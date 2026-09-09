import {
  Database,
  FileText,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

import { cn } from "../../lib/cn";

/**
 * The navy left sidebar.
 *
 * It carries exactly one real destination — Dashboard, the prototype's single
 * screen — plus three placeholder items.
 *
 * THE PLACEHOLDER ITEMS ARE INERT BY SPECIFICATION. They exist so the shell
 * reads as one view of a fuller product; they must never pretend to be one.
 * Concretely (`phase-2a-shell.md` US-012, `technical-spec.md` §4.2):
 *
 *   - they are NOT routes, NOT `<a>` and NOT `<button>` — a plain `<span>`
 *     cannot navigate, cannot be activated and cannot be focused, so the
 *     "nothing happens" behaviour is structural rather than a handler someone
 *     can later fill in;
 *   - `aria-disabled` plus the absence of any interactive role means a screen
 *     reader announces them as text, never as something to activate;
 *   - `pointer-events-none` removes the hover affordance as well as the click,
 *     so the cursor never suggests they are live.
 *
 * If a future story needs one of them to work, it adds a route and swaps the
 * element for a `Link` — deliberately, not by loosening this file.
 */

interface NavItem {
  label: string;
  /** Decorative glyph; the label carries the meaning. */
  icon: LucideIcon;
}

/** The one real destination. `/` is the prototype's only route. */
export const ACTIVE_NAV_ITEM: NavItem = {
  label: "Dashboard",
  icon: LayoutDashboard,
};

/** Dimmed, non-interactive placeholders. Never routes. */
export const INERT_NAV_ITEMS: readonly NavItem[] = [
  { label: "Reports", icon: FileText },
  { label: "Data Sources", icon: Database },
  { label: "Settings", icon: Settings },
];

/**
 * Shared geometry, so the active row and the inert rows cannot drift apart.
 *
 * No font-size utility here on purpose: `body` already sets `--text-body`, and
 * a `text-body` class would sit in the same `tailwind-merge` conflict group as
 * each row's `text-*` colour and be silently dropped by `cn`.
 */
const NAV_ROW_CLASS = "flex items-center gap-2.5 rounded-badge px-3 py-2";

/**
 * Sidebar width. Fixed, so the canvas beside it owns all remaining space.
 *
 * Exported because US-028's prompt bar is pinned to the viewport and therefore
 * has to offset itself past this column by hand (`PROMPT_BAR_POSITION_CLASS`
 * in `./prompt-bar.tsx`). A test asserts the two agree, which is the closest a
 * statically extracted utility can get to sharing one value.
 */
export const SIDEBAR_WIDTH_CLASS = "w-60";

const ICON_SIZE = 16;

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const ActiveIcon = ACTIVE_NAV_ITEM.icon;

  return (
    <aside
      data-slot="sidebar"
      className={cn(
        // Hidden below `lg` — a narrow viewport gives the canvas its full
        // width rather than scrolling the shell sideways (US-012 AC 4).
        "hidden shrink-0 flex-col bg-navy py-4",
        SIDEBAR_WIDTH_CLASS,
        "lg:flex",
        className,
      )}
    >
      <nav aria-label="Workspace">
        <ul role="list" className="flex flex-col gap-1 px-3">
          <li>
            <Link
              to="/"
              aria-current="page"
              data-slot="nav-active"
              className={cn(
                NAV_ROW_CLASS,
                "bg-navy-light font-semibold text-bg",
              )}
            >
              <ActiveIcon size={ICON_SIZE} aria-hidden="true" />
              {ACTIVE_NAV_ITEM.label}
            </Link>
          </li>

          {INERT_NAV_ITEMS.map(({ label, icon: Icon }) => (
            <li key={label}>
              {/*
               * Inert placeholder. A `<span>` on purpose: no href, no handler,
               * no focus, no hover. Do not turn this into a link or a button.
               */}
              <span
                data-slot="nav-inert"
                data-inert="true"
                aria-disabled="true"
                className={cn(
                  NAV_ROW_CLASS,
                  "pointer-events-none cursor-default text-slate opacity-50 select-none",
                )}
              >
                <Icon size={ICON_SIZE} aria-hidden="true" />
                {label}
              </span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
