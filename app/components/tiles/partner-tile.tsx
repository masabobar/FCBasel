import { Handshake } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import { formatNumber } from "../../lib/format";
import { type Partner } from "../../lib/repositories/types";
import { Card, type CardProps } from "./card";

/**
 * The "Active partners" tile — the club's commercial partners as a row of
 * monogram marks, each with the role it plays.
 *
 * PLACEHOLDER LOGOS, ON PURPOSE. The partners' real marks are licensed assets
 * the prototype does not have, so each tile shows the partner's INITIALS on a
 * plate painted in that partner's own brand colour. Nothing here pretends to be
 * a logo: the monogram is decoration (hidden from the accessibility tree), and
 * the partner's name is text beside it. When the assets are licensed, an
 * `<img>` replaces {@link PartnerMonogram} and nothing else in this file moves.
 *
 * BRAND COLOURS ARE CONTENT, NOT TOKENS — read the warning in
 * `app/lib/mock/baseline.ts` before "fixing" one. Bitpanda's teal and Sunrise's
 * red sit deliberately outside the FCB palette, and a sponsor in the room reads
 * a partner plate painted club red as an error. So the colour arrives as DATA
 * on `Partner.brandColor` and is applied as an inline style; there is no colour
 * prop, no hex literal and no token lookup in this file, and a test asserts
 * that no hex appears here at all.
 *
 * THE HOVER LIFT is the tile's one interactive flourish
 * ({@link PARTNER_HOVER_LIFT_CLASS}): a 2px rise and the raised shadow, over
 * the `fast` duration token. Two pixels — a partner strip that jumps under the
 * cursor reads as a bug, not as polish. Under `prefers-reduced-motion` the
 * global rule in `app/app.css` collapses the transition to ~1ms, so the lift
 * still lands at its final state instead of being lost.
 */

/* ------------------------------------------------------------ MONOGRAM -- */

/** How many glyphs a monogram plate carries. Two reads as a mark; one as a favicon. */
export const MONOGRAM_LENGTH = 2;

/**
 * A partner's monogram: its word initials, or the first letters of a
 * single-word name.
 *
 * Every partner in the dataset is a single word ("Bitpanda", "Macron"), so an
 * initials-only rule would put one lonely glyph on all six plates. Taking two
 * letters instead gives each plate a mark ("BI", "MA") while a multi-word name
 * — the Specification's own "Hoffmann Automobile" — still reduces to its
 * initials ("HA"), which is what a monogram is.
 *
 * Pure and exported so the rule is tested without rendering anything.
 */
export function partnerMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.map((word) => word.slice(0, 1)).join("");
  const source =
    initials.length >= MONOGRAM_LENGTH ? initials : (words[0] ?? "");

  return source.slice(0, MONOGRAM_LENGTH).toUpperCase();
}

export interface PartnerMonogramProps {
  partner: Partner;
  className?: string;
}

/**
 * The coloured monogram plate.
 *
 * `aria-hidden`, because it says nothing the partner's name beside it does not
 * already say — and because the letters on it are an abbreviation a screen
 * reader would spell out as noise.
 */
export function PartnerMonogram({ partner, className }: PartnerMonogramProps) {
  return (
    <span
      data-slot="partner-monogram"
      aria-hidden="true"
      // The partner's OWN brand colour, straight from the dataset. See the
      // module note: this is deliberately not a token.
      style={{ backgroundColor: partner.brandColor }}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-badge text-body font-bold text-bg",
        className,
      )}
    >
      {partnerMonogram(partner.name)}
    </span>
  );
}

/* ---------------------------------------------------------------- CARD -- */

/**
 * The lift a partner plate gains on hover. Exported so the acceptance
 * criterion is asserted against one named value rather than against a class
 * string copied into a test.
 */
export const PARTNER_HOVER_LIFT_CLASS =
  "transition-[transform,box-shadow] duration-(--duration-fast) ease-enter hover:-translate-y-0.5 hover:shadow-raised";

export interface PartnerCardProps {
  partner: Partner;
  className?: string;
}

/** One partner: the monogram plate, the name, and the role tag under it. */
export function PartnerCard({ partner, className }: PartnerCardProps) {
  return (
    <li
      data-slot="partner-card"
      data-partner-role={partner.role}
      className={cn(
        "flex items-center gap-2.5 rounded-badge border border-border bg-bg p-2.5",
        PARTNER_HOVER_LIFT_CLASS,
        className,
      )}
    >
      <PartnerMonogram partner={partner} />

      <span className="min-w-0">
        {/* No `truncate`: "Feldschlösschen" is the longest name in the data and
            wraps inside its column rather than losing its tail. */}
        <span
          data-slot="partner-name"
          className="block text-body font-semibold break-words"
        >
          {partner.name}
        </span>
        {/* The role tag. `roleLabel` travels on the datum, so the wording lives
            in `PARTNER_ROLE_LABEL` and never in a component. */}
        <span
          data-slot="partner-role"
          className="block text-caption text-muted"
        >
          {partner.roleLabel}
        </span>
      </span>
    </li>
  );
}

/* ---------------------------------------------------------------- TILE -- */

/** The card chrome the tile forwards, listed as `KpiTile` and `HBarTile` do. */
type PartnerCardChrome = Pick<
  CardProps,
  | "title"
  | "headingLevel"
  | "icon"
  | "action"
  | "accent"
  | "caption"
  | "isNew"
  | "delayMs"
  | "className"
>;

export interface PartnersTileProps extends PartnerCardChrome {
  /** The partners, in the order the dataset lists them. */
  partners: readonly Partner[];
  /** The scope line in the card header. Defaults to the partner COUNT. */
  period?: ReactNode;
}

/** The default header icon. Decorative — the title carries the meaning. */
const PARTNER_ICON_SIZE = 16;

/**
 * `Card` + the partner grid.
 *
 * Six plates across at `lg` and folding to three and then two, so the strip
 * stays a strip on the demo machine and stacks legibly on a narrow viewport.
 * The count in the header is `partners.length` — the tile cannot claim a number
 * of partners it is not showing.
 */
export function PartnersTile({
  partners,
  title,
  period,
  headingLevel,
  icon = <Handshake size={PARTNER_ICON_SIZE} />,
  action,
  accent,
  caption,
  isNew,
  delayMs,
  className,
}: PartnersTileProps) {
  return (
    <Card
      title={title}
      subtitle={period ?? `${formatNumber(partners.length)} active`}
      headingLevel={headingLevel}
      icon={icon}
      action={action}
      accent={accent}
      caption={caption}
      isNew={isNew}
      delayMs={delayMs}
      className={className}
    >
      <ul
        data-slot="partner-grid"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6"
      >
        {partners.map((partner) => (
          <PartnerCard key={partner.name} partner={partner} />
        ))}
      </ul>
    </Card>
  );
}
