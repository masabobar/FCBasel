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

/** Root-relative path of the committed crest. Never an absolute URL. */
export const CREST_SRC = "/fcb-crest.png";

/** Accessible name of the crest. The club's full registered name. */
export const CREST_LABEL = "FC Basel 1893";

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
  return (
    <img
      src={CREST_SRC}
      alt={CREST_LABEL}
      width={Math.round(size * CREST_ASPECT_RATIO)}
      height={size}
      className={className}
      decoding="async"
    />
  );
}
