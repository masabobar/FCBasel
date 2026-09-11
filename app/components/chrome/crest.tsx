/**
 * The FC Basel crest, self-hosted.
 *
 * WHY SELF-HOSTED: the asset is served from `public/fcb-crest.png` and is
 * referenced by a root-relative path only. The prototype must never request
 * the club CDN (`fcb.ch`) at runtime — a hotlink would add a CORS and an
 * availability failure mode to a live demo that has to survive a disconnected
 * network (E8 offline resilience). Do not reintroduce an absolute URL here.
 *
 * The committed file is a 120x128 PNG downsampled from the club's 608x648
 * original, which keeps the app-bar mark crisp to 64px (2x of the 32px render)
 * at a tenth of the bytes.
 */

import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";

/** Root-relative path of the committed crest. Never an absolute URL. */
export const CREST_SRC = "/fcb-crest.png";

/**
 * Accessible name of the crest. The club's full registered name, which is a
 * proper noun and therefore the same string in both languages - it goes
 * through the dictionary anyway (US-049) so that every rendered word has
 * exactly one home.
 */
export const CREST_LABEL_KEY: TranslationKey = "crest.label";

/** Intrinsic pixel dimensions of the committed asset. */
const CREST_ASPECT_RATIO = 120 / 128;

/** App-bar height from the Build Specification. */
const DEFAULT_CREST_HEIGHT = 32;

interface CrestProps {
  /** Rendered height in CSS pixels. Defaults to the app-bar size (32px). */
  size?: number;
  className?: string;
}

/**
 * Renders the crest at a given height. Width is derived from the asset's own
 * aspect ratio, so the browser reserves the correct box before the image
 * decodes and the app bar never shifts.
 */
export function Crest({ size = DEFAULT_CREST_HEIGHT, className }: CrestProps) {
  const t = useT();

  return (
    <img
      src={CREST_SRC}
      alt={t(CREST_LABEL_KEY)}
      width={Math.round(size * CREST_ASPECT_RATIO)}
      height={size}
      className={className}
      decoding="async"
    />
  );
}
