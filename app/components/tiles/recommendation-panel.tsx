import { Lightbulb, MessageSquareQuote } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { cn } from "../../lib/cn";
import { useUid } from "../../lib/hooks/use-motion";
import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";
import { CARD_ACCENTS, CardCaption, TILE_ENTER_CLASS } from "./card";

/**
 * The recommendation panel — the element that carries the *so-what* at the end
 * of a follow-up.
 *
 * THIS IS NOT A TILE, AND THAT IS THE REQUIREMENT (US-024, criterion 1).
 * Everything else on the canvas reports a measurement; this one piece of the
 * screen tells the owner what to DO about it, and the client's framing calls
 * these follow-ups "the peak moments of this prototype". A recommendation that
 * renders as one more metric card is therefore a product failure, not a
 * styling nit, so the difference is STRUCTURAL rather than a slightly
 * different border:
 *
 *   | | data tile (`Card`)            | recommendation panel            |
 *   |-|-------------------------------|---------------------------------|
 *   | element   | `div`               | `aside` — a labelled region     |
 *   | data-slot | `card`              | `recommendation-panel`          |
 *   | accent    | 3px bar across the top | 3px bar down the left side   |
 *   | surface   | white, `rounded-tile`, tile shadow | tinted, `rounded-panel`, no shadow |
 *   | chrome    | icon badge, uppercase heading, KPI / chart body | a glyph, an eyebrow label, prose |
 *
 * `tests/unit/recommendation-panel.test.tsx` asserts each of those rows, so a
 * later refactor cannot quietly turn the panel back into a card.
 *
 * IT WRITES NO COPY. The three consumers hand it pre-authored, client-approved
 * strings (US-035 "feature Sunrise in the next drop"; US-039 "pause the
 * incremental paid-social spend and reallocate about CHF 150k"), and it renders
 * them VERBATIM: no truncation, no casing, no smart quotes, no dash
 * substitution, no formatter. The only text this file owns is the eyebrow
 * label, which is an affordance ("this is advice") and not narrative.
 *
 * GOLD IS THE POINT, AND ITS LAST SANCTIONED HOME. Colour discipline rule 4
 * (`app/lib/tokens.ts`) allows gold in exactly two places: target-hit marks
 * and this follow-up treatment (`--color-accent-follow-up`). There is no gold
 * ring on newly inserted tiles and this file must not become the excuse to
 * reintroduce one — the accent classes come from `CARD_ACCENTS`, so gold is
 * still spelled in exactly one module.
 */

/* -------------------------------------------------------------- VARIANTS -- */

/** The eyebrow above the advice. An affordance, not narrative copy. */
export const RECOMMENDATION_LABEL_KEY: TranslationKey = "tiles.recommendation";

/** The eyebrow of the interpretation variant. Also structural, not copy. */
export const NARRATIVE_LABEL_KEY: TranslationKey = "tiles.narrativeLabel";

/**
 * The two follow-up panels the three heroes need.
 *
 * `recommendation` is the gold-accented advice callout — US-035 (feature
 * Sunrise in the next drop) and US-039, the causal peak (pause paid social,
 * reallocate ~CHF 150k to matchday activations).
 *
 * `narrative` is the same anatomy in navy for a follow-up that INTERPRETS
 * without prescribing — US-037's fixtures beat, which explains the decline
 * rather than recommending an action. It is a variant and not a second
 * component because the two differ only in accent, glyph and eyebrow; and it
 * is deliberately not gold, because rule 4 reserves gold for advice and a
 * second gold panel in the same section would spend the accent twice.
 */
export const RECOMMENDATION_VARIANTS = {
  recommendation: {
    labelKey: RECOMMENDATION_LABEL_KEY,
    /** `CARD_ACCENTS.gold` — gold stays spelled once, in `card.tsx`. */
    accent: "gold",
    surface: "border-gold/45 bg-gold/10",
    /** `--color-accent-follow-up`, the deep gold that reads on white. */
    glyph: "text-accent-follow-up",
    icon: Lightbulb,
  },
  narrative: {
    labelKey: NARRATIVE_LABEL_KEY,
    accent: "navy",
    surface: "border-border bg-surface",
    glyph: "text-navy",
    icon: MessageSquareQuote,
  },
} as const satisfies Record<
  string,
  {
    labelKey: TranslationKey;
    accent: keyof typeof CARD_ACCENTS;
    surface: string;
    glyph: string;
    icon: ComponentType<{ size?: number }>;
  }
>;

export type RecommendationVariant = keyof typeof RECOMMENDATION_VARIANTS;

const DEFAULT_VARIANT: RecommendationVariant = "recommendation";

/** Width of the accent bar. Down the SIDE — the tile's bar runs along the top. */
const ACCENT_CLASS = "w-[3px]";

/** The glyph size: one step up from the caption strip's 14px AI mark. */
const GLYPH_SIZE = 18;

/* ----------------------------------------------------------------- PANEL -- */

export interface RecommendationPanelProps {
  /**
   * The advice itself, verbatim from its dataset. Rendered untransformed;
   * React escapes it, so a string is never markup.
   */
  children: ReactNode;
  /** `recommendation` (gold advice) or `narrative` (navy interpretation). */
  variant?: RecommendationVariant;
  /** Override the eyebrow. Defaults to the variant's label. */
  label?: ReactNode;
  /**
   * The tile caption strip, if this panel carries one — US-005's
   * {@link CardCaption}, reused rather than re-implemented, so the AI glyph and
   * its accessibility treatment exist in one place only.
   */
  caption?: ReactNode;
  /** Marks a newly inserted panel so US-006's entrance animation applies. */
  isNew?: boolean;
  /** Stagger, in milliseconds, applied to that entrance animation. */
  delayMs?: number;
  className?: string;
}

export function RecommendationPanel({
  children,
  variant = DEFAULT_VARIANT,
  label,
  caption,
  isNew = false,
  delayMs = 0,
  className,
}: RecommendationPanelProps) {
  const style = RECOMMENDATION_VARIANTS[variant];
  const Icon = style.icon;
  // The panel is a region, so it needs a name; the eyebrow is that name.
  const t = useT();
  const labelId = `${useUid("recommendation")}-label`;

  return (
    // `aside` — a complementary region announced as its own landmark, so a
    // screen-reader user reaches "Recommendation" as a place rather than
    // finding an unmarked div of prose after the charts.
    <aside
      data-slot="recommendation-panel"
      data-variant={variant}
      aria-labelledby={labelId}
      className={cn(
        // `rounded-panel` (16px) against a tile's `rounded-tile` (12px), and
        // no `shadow-tile`: the panel sits ON the canvas, it does not float
        // above it like a card.
        "flex overflow-hidden rounded-panel border",
        style.surface,
        isNew && TILE_ENTER_CLASS,
        className,
      )}
      // Only the stagger is set here; the animation itself is US-006's, and
      // `app/app.css` states the final state outright under reduced motion.
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <div
        data-slot="recommendation-accent"
        aria-hidden="true"
        className={cn("shrink-0", ACCENT_CLASS, CARD_ACCENTS[style.accent])}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3 p-tile">
          {/* Decorative: the eyebrow beside it already says "recommendation". */}
          <span
            data-slot="recommendation-glyph"
            aria-hidden="true"
            className={cn("shrink-0", style.glyph)}
          >
            <Icon size={GLYPH_SIZE} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              id={labelId}
              data-slot="recommendation-label"
              className={cn("tile-title", style.glyph)}
            >
              {label ?? t(style.labelKey)}
            </p>
            {/* Verbatim. No formatter, no clamp, no transformation. */}
            <p data-slot="recommendation-body" className="mt-1.5">
              {children}
            </p>
          </div>
        </div>

        {caption && <CardCaption>{caption}</CardCaption>}
      </div>
    </aside>
  );
}
