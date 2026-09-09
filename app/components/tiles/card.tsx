import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";

/**
 * The tile card shell — the ONE card anatomy every tile and hero panel in the
 * product composes.
 *
 * WHY THIS IS THE ONLY CARD
 * Phase 2b builds seven tile kinds on top of this (KPI, bar, donut, horizontal
 * bar, department table, driver, recommendation) and Phase 3b composes them
 * into three heroes. Any per-hero copy of this shell multiplies a styling
 * mistake eleven times over and guarantees drift, so tiles pass content in
 * through the slots below rather than restating the chrome. If a tile needs
 * something the slots cannot express, widen the slots here — never fork.
 *
 * Anatomy, top to bottom:
 *   1. optional 3px accent bar, full bleed
 *   2. optional header — icon badge, uppercase title, muted subtitle, and a
 *      right-hand `action` slot (period filters, small badges)
 *   3. the body (`children`)
 *   4. optional narrative caption strip — one muted line behind an AI glyph
 *
 * Every colour, radius, shadow and padding value comes from the E2 token set
 * (`app/app.css` + `app/lib/tokens.ts`). No literal hex may appear in this
 * file; a test enforces that.
 */

/* -------------------------------------------------------------- ACCENT -- */

/**
 * Accent-bar colours, restricted to token names on purpose. The token set is
 * closed (`app/lib/tokens.ts` — colour discipline rule 5), so the accent slot
 * takes a name from the set rather than an arbitrary colour string; a tile
 * cannot smuggle a new hex in through this prop.
 */
export const CARD_ACCENTS = {
  /** Recommendation panels — the follow-up / advice accent. */
  gold: "bg-gold",
  /** Follow-up narrative panels. */
  navy: "bg-navy",
  red: "bg-red",
  blue: "bg-blue",
} as const;

export type CardAccent = keyof typeof CARD_ACCENTS;

/* ------------------------------------------------------------- HEADING -- */

/**
 * Heading element the tile title renders as. Tiles sit inside hero sections
 * that own an `h2`, so `h3` is the default; a card nested deeper passes `4`.
 * The title is always a real heading so screen-reader users can walk a
 * dashboard that grows tile by tile.
 */
const HEADING_TAGS = { 2: "h2", 3: "h3", 4: "h4" } as const;

export type CardHeadingLevel = keyof typeof HEADING_TAGS;

const DEFAULT_HEADING_LEVEL: CardHeadingLevel = 3;

/* --------------------------------------------------------- ENTRANCE ----- */

/**
 * Class a newly inserted tile carries. US-006 owns the keyframes behind it and
 * the `prefers-reduced-motion` handling; this shell only decides WHICH tiles
 * are new and how long each waits, so the stagger lives in one place.
 *
 * There is deliberately NO ring or glow on a new tile — new tiles fade and
 * rise only (Reference Guide; supersedes the Specification's gold-ring text).
 */
export const TILE_ENTER_CLASS = "fcb-enter";

/* ------------------------------------------------------- CAPTION STRIP -- */

interface CardCaptionProps {
  /** The one-line narrative. Plain text; React escapes it. */
  children: ReactNode;
  className?: string;
}

/**
 * The narrative caption strip that closes a tile: a single muted line behind a
 * small AI glyph, divided from the body by a hairline.
 *
 * The glyph is decoration — it signals "this line was written by the
 * assistant" visually and carries no information a screen reader needs, so it
 * is hidden from the accessibility tree rather than announced.
 *
 * Exported for the rare panel that composes the strip itself; a tile should
 * normally pass `caption` to `Card` and let the shell place it.
 */
export function CardCaption({ children, className }: CardCaptionProps) {
  return (
    <div
      data-slot="card-caption"
      className={cn(
        "narrative-caption flex items-center gap-2 border-t border-line px-tile py-3",
        className,
      )}
    >
      <span aria-hidden="true" className="shrink-0 text-navy">
        <Sparkles size={14} />
      </span>
      {/* One line by design — the strip summarises, it does not explain. */}
      <span className="truncate">{children}</span>
    </div>
  );
}

/* ----------------------------------------------------------------- CARD -- */

export interface CardProps {
  /** Tile title. Rendered uppercase by the `.tile-title` role class. */
  title?: ReactNode;
  /** Period or scope line under the title, muted. */
  subtitle?: ReactNode;
  /** Heading level of the title. Defaults to `3`. */
  headingLevel?: CardHeadingLevel;
  /** Icon badge left of the title — decorative; the title carries the meaning. */
  icon?: ReactNode;
  /** Right-hand slot: period filters (`Segmented`) and small badges. */
  action?: ReactNode;
  /** 3px accent bar across the top, by token name. */
  accent?: CardAccent;
  /** Narrative caption strip at the foot of the tile. */
  caption?: ReactNode;
  /** Marks a newly inserted tile so US-006's entrance animation applies. */
  isNew?: boolean;
  /** Stagger, in milliseconds, applied to that entrance animation. */
  delayMs?: number;
  className?: string;
  children?: ReactNode;
}

export function Card({
  title,
  subtitle,
  headingLevel = DEFAULT_HEADING_LEVEL,
  icon,
  action,
  accent,
  caption,
  isNew = false,
  delayMs = 0,
  className,
  children,
}: CardProps) {
  const Heading = HEADING_TAGS[headingLevel];
  const hasHeader = Boolean(title || icon || action);

  return (
    <div
      data-slot="card"
      className={cn(
        "overflow-hidden rounded-tile border border-border bg-bg shadow-tile",
        isNew && TILE_ENTER_CLASS,
        className,
      )}
      // Only the stagger is set here; the animation itself is US-006's.
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {accent && (
        <div
          data-slot="card-accent"
          aria-hidden="true"
          className={cn("h-[3px]", CARD_ACCENTS[accent])}
        />
      )}

      <div className="p-tile">
        {hasHeader && (
          <div
            data-slot="card-header"
            className={cn(
              "flex items-center gap-2.5",
              children != null && children !== false && "mb-4",
            )}
          >
            {icon && (
              <span
                data-slot="card-icon"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-badge bg-surface text-navy"
              >
                {icon}
              </span>
            )}
            {(title || subtitle) && (
              <div className="min-w-0 flex-1">
                {title && <Heading className="tile-title">{title}</Heading>}
                {subtitle && (
                  <div
                    data-slot="card-subtitle"
                    className="text-caption text-muted"
                  >
                    {subtitle}
                  </div>
                )}
              </div>
            )}
            {action && (
              <div data-slot="card-action" className="ml-auto shrink-0">
                {action}
              </div>
            )}
          </div>
        )}
        {children}
      </div>

      {caption && <CardCaption>{caption}</CardCaption>}
    </div>
  );
}
