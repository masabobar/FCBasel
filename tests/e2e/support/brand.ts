import { type Page } from "@playwright/test";

import { createMockBaselineRepository } from "../../../app/lib/mock/baseline";
import {
  color as tokenColor,
  shadow as tokenShadow,
} from "../../../app/lib/tokens";

/**
 * The brand instrument for US-044 — measured on the RENDERED PAGE, not the source.
 *
 * WHY THIS EXISTS WHEN THE SOURCE SCANS ALREADY PASS. Forty stories of review,
 * plus per-component tests that reject a literal hex in their own file, cannot
 * answer the question this story actually asks: what colour is on the screen?
 * A token can be spelled correctly and still land wrong — a Tailwind opacity
 * modifier composites through `color-mix(in oklab, …)`, a `currentColor` chain
 * resolves somewhere the component never sees, an SVG paints with `fill` while
 * its ancestor sets `color`, a gradient interpolates. US-041 found two runtime
 * fetches that no grep of `app/**` could see; US-042 upgraded an XSS claim from
 * "two files scanned" to "five sinks measured on the served page". This does
 * the same for the palette: one `getComputedStyle` walk of the whole document,
 * every painted value resolved to sRGB, then classified in Node against
 * `app/lib/tokens.ts` — the token module itself, never a copy of its hexes.
 *
 * WHAT "PAINTED" MEANS, AND WHY THE FILTERS MATTER MORE THAN THE WALK.
 * `getComputedStyle` answers for every property on every element whether or not
 * the browser draws it: `borderTopColor` on a box with no border, `color` on a
 * wrapper with no text, `stopColor` on an element that is not a gradient stop,
 * `textDecorationColor` where nothing is underlined. A naive walk reports
 * `rgb(0, 0, 0)` a thousand times and drowns the real inventory. So a value is
 * only recorded where it is genuinely drawn:
 *
 *   `color`                 an element with a DIRECT text child, and not an
 *                           `<svg>` node — SVG text paints with `fill`, and its
 *                           inherited `color` is a value nobody ever sees.
 *   `background-color`      a box with area and a non-zero alpha.
 *   `border-<side>-color`   only where that side's width is > 0 and its style
 *                           is neither `none` nor `hidden`.
 *   `outline-color`         only where the outline has width and a style.
 *   `fill` / `stroke`       only on SVG SHAPES, `none` excluded, and `stroke`
 *                           only with a non-zero `stroke-width`.
 *   `stop-color`            only on a real `<stop>`.
 *   shadows / gradients     scanned as text, because a shadow and a ramp carry
 *                           their colours inside one property value.
 *
 * Anything with zero area or a 1px clip is skipped, which is what keeps the
 * visually-hidden headings and `sr-only` direction words out of the readings.
 */

/* ----------------------------------------------------------- THE PALETTE -- */

/** One colour the token set publishes, with every token name that carries it. */
export interface TokenColour {
  readonly hex: string;
  readonly names: readonly string[];
}

/**
 * The whole colour token set, keyed by hex, with the names collapsed.
 *
 * Several tokens share a hex ON PURPOSE — `varianceNegative` and `red` are the
 * same #D3010C, and `app/lib/tokens.ts` explains at length why they are still
 * two tokens. A hex is therefore reported with ALL its names, so the inventory
 * reads `#d3010c (neg, red, seriesCurrent, seriesPrimary, varianceNegative)`
 * rather than picking one and implying a meaning the pixel does not carry.
 */
export const TOKEN_COLOURS: readonly TokenColour[] = (() => {
  const byHex = new Map<string, string[]>();
  for (const [name, value] of Object.entries(tokenColor)) {
    const hex = value.toLowerCase();
    const names = byHex.get(hex) ?? [];
    names.push(name);
    byHex.set(hex, names);
  }
  return [...byHex.entries()].map(([hex, names]) => ({
    hex,
    names: names.sort(),
  }));
})();

/**
 * Colours that appear only INSIDE a shadow token — #101840 at four alphas, and
 * the tooltip's black.
 *
 * They are token values, but they live in the `shadow` group rather than the
 * `color` group, so they would read as off-palette against the colour set
 * alone. Parsed out of the shadow tokens themselves rather than retyped, for
 * the same reason everything else here is derived: a shadow retuned in
 * `app/lib/tokens.ts` must not need a second edit in a test.
 */
export const SHADOW_COLOURS: readonly string[] = (() => {
  const found = new Set<string>();
  for (const value of Object.values(tokenShadow)) {
    for (const match of value.matchAll(/rgba?\(([^)]*)\)/gi)) {
      const parts = (match[1] ?? "")
        .split(",")
        .map((part) => Number(part.trim()));
      const [r, g, b] = parts;
      if (r === undefined || g === undefined || b === undefined) continue;
      found.add(hexOf(r, g, b));
    }
  }
  return [...found].sort();
})();

/**
 * The six partner brand colours — the ONE sanctioned set of non-token hexes.
 *
 * US-007 typed them deliberately outside the FCB palette and
 * `app/lib/mock/baseline.ts` carries a warning against "fixing" them: a sponsor
 * in the room reads their own plate painted club red as an error, so Bitpanda's
 * teal and Sunrise's red are CONTENT, not design. Read from the dataset through
 * the repository, so the audit follows a partner change instead of pinning a
 * copy of six hexes that would drift.
 *
 * Three of the six (#d3010c Macron, #004093 Allianz, #0e2356 Hoffmann) collide
 * with FCB tokens by coincidence of those brands. The collision is harmless for
 * the inventory — the pixel is on the palette either way — but it is why the
 * gold audit below has to identify the Feldschlösschen plate by SLOT: its
 * #b8960b is the same hex as `accentFollowUp`.
 */
export async function partnerBrandColours(): Promise<readonly string[]> {
  const partners = await createMockBaselineRepository().partners();
  return partners.map((partner) => partner.brandColor.toLowerCase()).sort();
}

/** `#rrggbb`, lowercase — the one spelling every reading in this file uses. */
function hexOf(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

/**
 * Channels this far apart still count as the same colour.
 *
 * ONE UNIT, AND IT IS NOT A FUDGE. Tailwind's `/opacity` modifier composites in
 * oklab, so Chrome hands back `oklab(0.544993 0.196065 0.105412 / 0.1)` where
 * the stylesheet said `bg-red/10`. Converting that back through the oklab
 * matrices and the sRGB transfer function lands within a unit of #d3010c but
 * not always ON it, because both directions round. A wider tolerance would
 * start absorbing genuinely different colours: the closest pair in the token
 * set is `slate` #94a3b8 against `faint` #9aa3b2, six units apart on the red
 * channel, so one unit cannot confuse them.
 */
const CHANNEL_TOLERANCE = 1;

/* ------------------------------------------------------------ THE READING -- */

/** One colour actually painted on the page, and where. */
export interface PaintedColour {
  /** sRGB, composited from whatever function the browser reported. */
  readonly hex: string;
  /** Every alpha this colour was painted at, lowest first. */
  readonly alphas: readonly number[];
  readonly count: number;
  /** `background-color@card (Webshop revenue)`, up to five. */
  readonly samples: readonly string[];
}

/** One element painted in gold, with the property that paints it. */
export interface GoldPaint {
  /** `#fbd500` (`accentTargetHit`) or `#b8960b` (`accentFollowUp`). */
  readonly hex: string;
  readonly property: string;
  readonly alpha: number;
  /** The `data-slot` chain from the shell down, `>`-joined. */
  readonly path: string;
  /** The innermost slot — what the allowlist is keyed by. */
  readonly slot: string;
}

/** One variance chip, read as the four independent carriers of its meaning. */
export interface VarianceIndicator {
  readonly path: string;
  /** `UP` / `DOWN` / `FLAT` from `data-direction`. */
  readonly direction: string;
  /** `FAVOURABLE` / `ADVERSE` / `NEUTRAL` from `data-judgement`. */
  readonly judgement: string;
  /** The figure as rendered, `+0.41`. */
  readonly figure: string;
  /** `+`, `-` or `` — the explicit sign, carrier one. */
  readonly sign: string;
  /** How many arrow glyphs the chip draws — carrier two. */
  readonly arrows: number;
  /** The `sr-only` direction word — carrier three. */
  readonly spoken: string;
  /** The ink, in sRGB — carrier four, and the only one a projector can take. */
  readonly ink: string;
  readonly tabularNumerals: boolean;
}

/** One heading, read as the three facts the uppercase role is made of. */
export interface HeadingReading {
  readonly path: string;
  readonly slot: string;
  readonly text: string;
  readonly transform: string;
  readonly weight: string;
  /** In px, as Chrome resolves `0.04em` at the element's own size. */
  readonly letterSpacingPx: number;
  readonly fontSizePx: number;
}

/** One figure on the canvas, and whether its digits are locked to a grid. */
export interface FigureReading {
  readonly path: string;
  readonly slot: string;
  readonly text: string;
  readonly fontVariantNumeric: string;
  readonly fontSizePx: number;
}

/** One measured contrast pair. */
export interface ContrastReading {
  /** The ink or edge colour, flattened onto its ground. */
  readonly fg: string;
  /** The colour genuinely behind it, composited up the ancestor chain. */
  readonly bg: string;
  readonly ratio: number;
  /** Type size and weight for ink; border width for an edge. */
  readonly scale: string;
  readonly count: number;
  readonly samples: readonly string[];
}

/** Everything US-044 measures, from one walk of one moment. */
export interface BrandReport {
  readonly colours: readonly PaintedColour[];
  readonly gold: readonly GoldPaint[];
  readonly variance: readonly VarianceIndicator[];
  readonly headings: readonly HeadingReading[];
  readonly figures: readonly FigureReading[];
  readonly textContrast: readonly ContrastReading[];
  readonly edgeContrast: readonly ContrastReading[];
  /** Text nodes and attribute values carrying a non-hyphen dash. */
  readonly dashes: readonly string[];
  /** Every leaf reading `FCB <n>-<n> <opponent>`. */
  readonly scoreLabels: readonly string[];
  /** How many elements the walk actually visited — a floor, so a collapsed
   *  page cannot pass every assertion by rendering nothing. */
  readonly elementsWalked: number;
}

/**
 * Take the whole reading, in one `evaluate`, so every field describes the same
 * moment on the same screen.
 *
 * The two gold hexes are passed IN rather than looked up in the page: the token
 * module is the authority and it lives in Node. Everything else the page
 * computes for itself, because only the browser knows what it painted.
 */
export function readBrand(page: Page): Promise<BrandReport> {
  return page.evaluate(
    ([goldHexes]) => {
      /* ------------------------------------------------ colour arithmetic -- */

      /**
       * oklab to sRGB, because Tailwind's opacity modifier composites there.
       * The matrices are the ones in the CSS Color 4 specification; the second
       * step is the sRGB transfer function.
       */
      const oklabToRgb = (L: number, A: number, B: number): number[] => {
        const l_ = L + 0.3963377774 * A + 0.2158037573 * B;
        const m_ = L - 0.1055613458 * A - 0.0638541728 * B;
        const s_ = L - 0.0894841775 * A - 1.291485548 * B;
        const l = l_ ** 3;
        const m = m_ ** 3;
        const s = s_ ** 3;
        return [
          4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
        ].map((channel) => {
          const encoded =
            channel <= 0.0031308
              ? 12.92 * channel
              : 1.055 * channel ** (1 / 2.4) - 0.055;
          return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
        });
      };

      /** Any colour Chrome can serialize, as `[r, g, b, a]` or `null`. */
      const parse = (raw: string | null): number[] | null => {
        const value = String(raw ?? "")
          .trim()
          .toLowerCase();
        if (!value || value === "none" || value === "currentcolor") return null;
        if (value === "transparent") return [0, 0, 0, 0];

        const numbers = (body: string) =>
          body
            .split(/[\s,/]+/)
            .filter(Boolean)
            .map(Number);

        let match = value.match(/^rgba?\(([^)]*)\)$/);
        if (match?.[1]) {
          const p = numbers(match[1]);
          if (p.length < 3) return null;
          return [p[0]!, p[1]!, p[2]!, p[3] ?? 1];
        }
        match = value.match(/^color\(srgb ([^)]*)\)$/);
        if (match?.[1]) {
          const p = numbers(match[1]);
          if (p.length < 3) return null;
          return [
            Math.round(p[0]! * 255),
            Math.round(p[1]! * 255),
            Math.round(p[2]! * 255),
            p[3] ?? 1,
          ];
        }
        match = value.match(/^oklab\(([^)]*)\)$/);
        if (match?.[1]) {
          const p = numbers(match[1]);
          if (p.length < 3) return null;
          const rgb = oklabToRgb(p[0]!, p[1]!, p[2]!);
          return [rgb[0]!, rgb[1]!, rgb[2]!, p[3] ?? 1];
        }
        match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
        if (match?.[1]) {
          const digits = match[1];
          const pair = (index: number) =>
            digits.length === 3
              ? parseInt(digits[index]!.repeat(2), 16)
              : parseInt(digits.slice(index * 2, index * 2 + 2), 16);
          return [pair(0), pair(1), pair(2), 1];
        }
        return null;
      };

      const hex = (rgb: number[]) =>
        `#${rgb
          .slice(0, 3)
          .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
          .join("")}`;

      /** `fg` composited over an opaque `bg`. */
      const flatten = (fg: number[], bg: number[]): number[] => {
        const alpha = fg[3] ?? 1;
        return [0, 1, 2].map((i) =>
          Math.round(fg[i]! * alpha + bg[i]! * (1 - alpha)),
        );
      };

      const relativeLuminance = (rgb: number[]) => {
        const [r, g, b] = rgb.slice(0, 3).map((channel) => {
          const s = channel / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };

      /** WCAG 2 contrast ratio, rounded to two places by the caller. */
      const contrast = (a: number[], b: number[]) => {
        const first = relativeLuminance(a);
        const second = relativeLuminance(b);
        const light = Math.max(first, second);
        const dark = Math.min(first, second);
        return (light + 0.05) / (dark + 0.05);
      };

      /* ---------------------------------------------------- what is drawn -- */

      const SHAPES = new Set([
        "path",
        "circle",
        "rect",
        "line",
        "polyline",
        "polygon",
        "ellipse",
        "text",
        "tspan",
      ]);

      /** A colour carried inside a compound value — a shadow, a ramp, a filter. */
      const EMBEDDED =
        /(?:rgba?|color|oklab)\([^()]*(?:\([^()]*\)[^()]*)*\)|#[0-9a-f]{3}(?:[0-9a-f]{3})?\b/gi;

      const hasDirectText = (el: Element) => {
        for (const node of el.childNodes) {
          if (node.nodeType === 3 && node.textContent?.trim()) return true;
        }
        return false;
      };

      /**
       * Zero-area and 1px-clipped boxes are not on screen.
       *
       * The 1px floor is what excludes `sr-only` — the visually-hidden route
       * heading and every `DeltaChip`'s spoken direction word sit in a 1px clip,
       * and reading their ink as "text on the page" would report a contrast
       * nobody can see.
       */
      const offScreen = (el: Element, style: CSSStyleDeclaration) => {
        if (style.display === "none" || style.visibility === "hidden") {
          return true;
        }
        const box = el.getBoundingClientRect();
        return box.width <= 1 || box.height <= 1;
      };

      /** The `data-slot` chain, shell downwards. */
      const pathOf = (el: Element | null) => {
        const parts: string[] = [];
        let node: Element | null = el;
        while (node && node !== document.body) {
          const slot = node.getAttribute("data-slot");
          if (slot) parts.unshift(slot);
          node = node.parentElement;
        }
        return parts.join(" > ") || (el?.tagName.toLowerCase() ?? "?");
      };

      const slotOf = (el: Element) => {
        const own = el.getAttribute("data-slot");
        if (own) return own;
        const nearest = el.closest("[data-slot]");
        return nearest?.getAttribute("data-slot") ?? el.tagName.toLowerCase();
      };

      /** A short label for the tile a reading was taken in. */
      const cardOf = (el: Element) => {
        const card = el.closest(
          '[data-slot="card"],[data-slot="recommendation-panel"]',
        );
        const title = card
          ?.querySelector('[data-slot="card-header"],[data-slot="card-title"]')
          ?.textContent?.trim()
          .slice(0, 26);
        return title ? ` (${title})` : "";
      };

      /**
       * The colour genuinely BEHIND an element.
       *
       * Walked up the ancestor chain and composited back down, because a chip on
       * a 10% tint on a card on the canvas is read against the result of all
       * three, not against the nearest declared background. A gradient
       * contributes its FIRST stop, which is the honest reading for the navy
       * band: the ramp runs navy to navy-light and back, and its first stop is
       * the darker end the type actually sits over at the left of the band.
       */
      const groundOf = (el: Element | null) => {
        const layers: number[][] = [];
        let node: Element | null = el;
        while (node) {
          const style = getComputedStyle(node);
          const image = style.backgroundImage;
          if (image && image !== "none") {
            const first = image.match(EMBEDDED);
            const parsed = first?.[0] ? parse(first[0]) : null;
            if (parsed && (parsed[3] ?? 1) > 0) layers.push(parsed);
          }
          const background = parse(style.backgroundColor);
          if (background && (background[3] ?? 1) > 0) layers.push(background);
          node = node.parentElement;
        }
        let ground = [255, 255, 255];
        for (let i = layers.length - 1; i >= 0; i -= 1) {
          ground = flatten(layers[i]!, ground);
        }
        return ground;
      };

      /* --------------------------------------------------- the collectors -- */

      const colours = new Map<
        string,
        { alphas: Set<number>; count: number; samples: string[] }
      >();
      const gold: BrandReport["gold"][number][] = [];

      const record = (
        el: Element,
        property: string,
        raw: string | null | undefined,
      ) => {
        if (!raw || raw === "none") return;
        const matches = String(raw).match(EMBEDDED);
        if (!matches) return;
        for (const literal of matches) {
          const rgba = parse(literal);
          if (!rgba) continue;
          const alpha = Number((rgba[3] ?? 1).toFixed(3));
          const key = hex(rgba);
          const entry = colours.get(key) ?? {
            alphas: new Set<number>(),
            count: 0,
            samples: [],
          };
          entry.alphas.add(alpha);
          entry.count += 1;
          if (entry.samples.length < 5) {
            entry.samples.push(`${property}@${slotOf(el)}${cardOf(el)}`);
          }
          colours.set(key, entry);

          if (alpha > 0 && goldHexes.includes(key)) {
            gold.push({
              hex: key,
              property,
              alpha,
              path: pathOf(el),
              slot: slotOf(el),
            });
          }
        }
      };

      const textContrast = new Map<
        string,
        { ratio: number; count: number; samples: string[] }
      >();
      const edgeContrast = new Map<
        string,
        { ratio: number; count: number; samples: string[] }
      >();

      const noteContrast = (
        into: typeof textContrast,
        fg: number[],
        ground: number[],
        scale: string,
        sample: string,
      ) => {
        const flat = flatten(fg, ground);
        const key = `${hex(flat)}|${hex(ground)}|${scale}`;
        const entry = into.get(key) ?? {
          ratio: contrast(flat, ground),
          count: 0,
          samples: [],
        };
        entry.count += 1;
        if (entry.samples.length < 3) entry.samples.push(sample);
        into.set(key, entry);
      };

      let elementsWalked = 0;

      for (const el of document.querySelectorAll("body *")) {
        const style = getComputedStyle(el);
        if (offScreen(el, style)) continue;
        elementsWalked += 1;

        const isSvg = el instanceof SVGElement;
        const tag = el.tagName.toLowerCase();

        // Ink. SVG text paints with `fill`, so its inherited `color` is skipped
        // here and picked up in the shape pass below.
        if (!isSvg && hasDirectText(el)) {
          record(el, "color", style.color);
          const ink = parse(style.color);
          if (ink) {
            noteContrast(
              textContrast,
              ink,
              groundOf(el),
              `${style.fontSize}/${style.fontWeight}`,
              `${pathOf(el)} :: ${(el.textContent ?? "").trim().slice(0, 24)}`,
            );
          }
        }

        record(el, "background-color", style.backgroundColor);
        record(el, "background-image", style.backgroundImage);
        record(el, "box-shadow", style.boxShadow);
        record(el, "filter", style.filter);
        if (style.textDecorationLine !== "none") {
          record(el, "text-decoration-color", style.textDecorationColor);
        }

        for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
          const width = Number.parseFloat(
            style[`border${side}Width` as "borderTopWidth"] || "0",
          );
          const lineStyle = style[`border${side}Style` as "borderTopStyle"];
          if (!(width > 0) || lineStyle === "none" || lineStyle === "hidden") {
            continue;
          }
          const property = `border-${side.toLowerCase()}-color`;
          const raw = style[`border${side}Color` as "borderTopColor"];
          record(el, property, raw);
          const edge = parse(raw);
          if (edge && (edge[3] ?? 1) > 0) {
            noteContrast(
              edgeContrast,
              edge,
              groundOf(el.parentElement),
              `${width}px border`,
              pathOf(el),
            );
          }
        }

        if (
          Number.parseFloat(style.outlineWidth || "0") > 0 &&
          style.outlineStyle !== "none"
        ) {
          record(el, "outline-color", style.outlineColor);
        }

        if (isSvg && SHAPES.has(tag)) {
          if (style.fill && style.fill !== "none") {
            record(el, "fill", style.fill);
            const ink = parse(style.fill);
            if (ink && (tag === "text" || tag === "tspan")) {
              noteContrast(
                textContrast,
                ink,
                groundOf((el as SVGElement).ownerSVGElement),
                `${style.fontSize} svg`,
                `${pathOf(el)} :: ${(el.textContent ?? "").trim().slice(0, 24)}`,
              );
            }
          }
          const strokeWidth = Number.parseFloat(style.strokeWidth || "1");
          if (style.stroke && style.stroke !== "none" && strokeWidth > 0) {
            record(el, "stroke", style.stroke);
            const edge = parse(style.stroke);
            if (edge && (edge[3] ?? 1) > 0) {
              noteContrast(
                edgeContrast,
                edge,
                groundOf((el as SVGElement).ownerSVGElement),
                `${strokeWidth}px stroke`,
                pathOf(el),
              );
            }
          }
        }

        if (tag === "stop") record(el, "stop-color", style.stopColor);
      }

      /* -------------------------------------------------------- variance -- */

      const variance = [
        ...document.querySelectorAll('[data-slot="delta-chip"]'),
      ].map((chip) => {
        const style = getComputedStyle(chip);
        const spoken =
          chip.querySelector(".sr-only")?.textContent?.trim() ?? "";
        const figureNode = chip.querySelector(".tabular-nums");
        const figure = (figureNode?.textContent ?? "").trim();
        const ink = parse(style.color);
        return {
          path: pathOf(chip),
          direction: chip.getAttribute("data-direction") ?? "",
          judgement: chip.getAttribute("data-judgement") ?? "",
          figure,
          sign: /^[+-]/.test(figure) ? figure.slice(0, 1) : "",
          arrows: chip.querySelectorAll('[data-slot="delta-arrow"]').length,
          spoken,
          ink: ink ? hex(flatten(ink, groundOf(chip))) : "",
          tabularNumerals: figureNode
            ? getComputedStyle(figureNode).fontVariantNumeric.includes(
                "tabular-nums",
              )
            : false,
        };
      });

      /* -------------------------------------------------------- headings -- */

      const HEADING_QUERY = [
        '[data-slot="card-header"] h2',
        '[data-slot="card-header"] h3',
        '[data-slot="card-header"] h4',
        ".tile-title",
        '[data-slot="section-head"] h2',
      ].join(",");

      const headings = [...document.querySelectorAll(HEADING_QUERY)]
        .filter((el) => !offScreen(el, getComputedStyle(el)))
        .map((el) => {
          const style = getComputedStyle(el);
          return {
            path: pathOf(el),
            slot: slotOf(el),
            text: (el.textContent ?? "").trim().slice(0, 34),
            transform: style.textTransform,
            weight: style.fontWeight,
            letterSpacingPx: Number(
              Number.parseFloat(style.letterSpacing || "0").toFixed(3),
            ),
            fontSizePx: Number.parseFloat(style.fontSize),
          };
        });

      /* --------------------------------------------------------- figures -- */

      /** A leaf whose text is a figure — digits, and no prose around them. */
      const FIGURE_TEXT = /^[+-]?(?:CHF\s)?[\d’',. ]+(?:[kKM%]|\spts)?$/;

      /**
       * The element that OWNS the digits, never a wrapper around them.
       *
       * A container's `textContent` is the concatenation of its children, so an
       * SVG `<g>` holding five axis labels reads as `05001'0001'5002'000` —
       * which matches the figure pattern, and whose own `font-variant-numeric`
       * is `normal` because the property belongs to the `<text>` nodes inside
       * it. Requiring that no child element carries text of its own is what
       * keeps the reading on the element the browser actually renders digits
       * with.
       */
      const ownsItsDigits = (el: Element) =>
        [...el.children].every((child) => !child.textContent?.trim());

      const figures = [...document.querySelectorAll('[data-slot="canvas"] *')]
        .filter((el) => {
          const style = getComputedStyle(el);
          if (offScreen(el, style)) return false;
          if (!hasDirectText(el) && !(el instanceof SVGElement)) return false;
          if (!ownsItsDigits(el)) return false;
          const text = (el.textContent ?? "").trim();
          return FIGURE_TEXT.test(text) && /\d/.test(text);
        })
        .map((el) => {
          const style = getComputedStyle(el);
          return {
            path: pathOf(el),
            slot: slotOf(el),
            text: (el.textContent ?? "").trim().slice(0, 20),
            fontVariantNumeric: style.fontVariantNumeric,
            fontSizePx: Number.parseFloat(style.fontSize),
          };
        });

      /* ---------------------------------------------------------- dashes -- */

      /**
       * Every dash-like character that is NOT the plain hyphen U+002D.
       *
       * The house style is a hyphen everywhere — `FCB 2-1 Sion`, `-CHF 150k`,
       * `Follow-up` — so the set is stated as "anything else that looks like a
       * dash": the hyphen variants, the figure dash, en and em, the horizontal
       * bar, the MINUS SIGN U+2212 (which a copy-paste from a spreadsheet
       * brings in and which no test above this one looks for), the small and
       * fullwidth forms, and the hyphen bullet.
       */
      const NON_HYPHEN_DASH = /[‐‑‒–—―−⁃﹘﹣－]/;

      const dashes: string[] = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent ?? "";
        if (NON_HYPHEN_DASH.test(text)) {
          dashes.push(
            `text ${pathOf(node.parentElement)} :: ${text.trim().slice(0, 90)}`,
          );
        }
        node = walker.nextNode();
      }
      for (const el of document.querySelectorAll("*")) {
        for (const attribute of el.attributes) {
          if (NON_HYPHEN_DASH.test(attribute.value)) {
            dashes.push(
              `attr ${attribute.name}@${pathOf(el)} :: ${attribute.value.slice(0, 70)}`,
            );
          }
        }
      }

      const scoreLabels = [...document.querySelectorAll("body *")]
        .filter(
          (el) =>
            el.children.length === 0 && /FCB\s*\d/.test(el.textContent ?? ""),
        )
        .map((el) => (el.textContent ?? "").trim());

      /* ---------------------------------------------------------- output -- */

      const colourList = [...colours.entries()]
        .map(([value, entry]) => ({
          hex: value,
          alphas: [...entry.alphas].sort((a, b) => a - b),
          count: entry.count,
          samples: entry.samples,
        }))
        .sort((a, b) => b.count - a.count);

      const contrastList = (map: typeof textContrast) =>
        [...map.entries()]
          .map(([key, entry]) => {
            const [fg, bg, scale] = key.split("|");
            return {
              fg: fg ?? "",
              bg: bg ?? "",
              scale: scale ?? "",
              ratio: Number(entry.ratio.toFixed(2)),
              count: entry.count,
              samples: entry.samples,
            };
          })
          .sort((a, b) => a.ratio - b.ratio);

      return {
        colours: colourList,
        gold,
        variance,
        headings,
        figures,
        textContrast: contrastList(textContrast),
        edgeContrast: contrastList(edgeContrast),
        dashes,
        scoreLabels,
        elementsWalked,
      };
    },
    [
      [
        tokenColor.accentTargetHit.toLowerCase(),
        tokenColor.accentFollowUp.toLowerCase(),
      ],
    ] as [string[]],
  );
}

/* ------------------------------------------------------- CLASSIFICATION -- */

/** What a painted colour turned out to be. */
export interface ColourVerdict {
  readonly hex: string;
  readonly alphas: readonly number[];
  readonly count: number;
  readonly samples: readonly string[];
  /** `token: red, neg`, `partner brand`, `shadow token`, `transparent`, or `OFF TOKEN`. */
  readonly verdict: string;
  readonly onToken: boolean;
}

function withinTolerance(hex: string, candidate: string): boolean {
  const channels = (value: string) =>
    [1, 3, 5].map((at) => Number.parseInt(value.slice(at, at + 2), 16));
  const left = channels(hex);
  const right = channels(candidate);
  return left.every(
    (channel, index) =>
      Math.abs(channel - (right[index] ?? 0)) <= CHANNEL_TOLERANCE,
  );
}

/**
 * Classify every painted colour against the token set.
 *
 * FULLY TRANSPARENT IS TESTED FIRST, because a colour never painted at any
 * alpha is not a colour: `rgba(0, 0, 0, 0)` is the initial `background-color`
 * of most of the document, and reporting it as "the tooltip shadow's black"
 * because the hexes match would be true and useless. After that the order is
 * the order of authority: the COLOUR tokens, because that is the palette the
 * criterion is about; then the shadow tokens, whose #101840 is a token value
 * living in another group; then the six partner brand colours, which are
 * content and the only sanctioned exception. Anything left is a finding.
 */
export function classifyColours(
  colours: readonly PaintedColour[],
  partners: readonly string[],
): readonly ColourVerdict[] {
  return colours.map((colour) => {
    const token = TOKEN_COLOURS.find((entry) =>
      withinTolerance(colour.hex, entry.hex),
    );
    const shadow = SHADOW_COLOURS.find((entry) =>
      withinTolerance(colour.hex, entry),
    );
    const partner = partners.find((entry) =>
      withinTolerance(colour.hex, entry),
    );
    const invisible = colour.alphas.every((alpha) => alpha === 0);

    let verdict = "OFF TOKEN";
    if (invisible) verdict = "transparent";
    else if (token) verdict = `token: ${token.names.join(", ")}`;
    else if (shadow) verdict = `shadow token: ${shadow}`;
    else if (partner) verdict = `partner brand colour: ${partner}`;

    return { ...colour, verdict, onToken: verdict !== "OFF TOKEN" };
  });
}

/** One line per colour, for the run output. */
export function formatColourInventory(
  verdicts: readonly ColourVerdict[],
): string {
  return verdicts
    .map(
      (entry) =>
        `  ${entry.hex}  a=[${entry.alphas.join(" ")}]  x${String(entry.count).padStart(4)}  ${entry.verdict}` +
        `\n      ${entry.samples.join(" | ")}`,
    )
    .join("\n");
}

/* --------------------------------------------------------- THE GOLD RULE -- */

/**
 * WHERE GOLD IS ALLOWED TO LAND, slot by slot, with the sanction for each.
 *
 * This table IS criterion 2, and it is a CLOSED allowlist: a gold pixel on any
 * other slot fails the audit. Every entry traces to `app/lib/tokens.ts` colour
 * discipline rule 4 — target-hit marks and the follow-up treatment — or to a
 * use the Reference Guide names explicitly, which governs the experience where
 * it and the Build Specification disagree (`scope.md` §10).
 *
 * THE ONE THAT IS NOT HERE IS THE POINT. There is no `card`, no `card-accent`
 * on a data tile and no `insight-section`: the Build Specification's ~1.5s gold
 * highlight RING on a newly inserted tile was removed by the Reference Guide
 * (US-006), and this is the assertion that stops it coming back. New tiles fade
 * and rise, in no colour at all.
 */
export const GOLD_ALLOWED: Readonly<Record<string, string>> = {
  /* --- Target-hit marks (rule 4, first half) --- */
  "department-target-dot":
    "target attainment mark: filled gold at 100%+, a gold-deep ring in the 95-99 near band",
  "attendance-ring-arc":
    "the attendance gauge against capacity - a target reading, and the one ring the Reference Guide lists among gold's uses",

  /* --- The follow-up treatment (rule 4, second half) --- */
  "follow-up-divider-rule": "the follow-up seam itself",
  "follow-up-divider-label": "the seam's `Follow-up` eyebrow, in gold-deep",
  "suggestion-chip":
    "a follow-up suggestion chip - the gold wash and gold-deep ink that mark a chip as a follow-up rather than a prepared question",

  /* --- The recommendation panel accent --- */
  "recommendation-panel":
    "the advice panel's tinted surface and border (gold/10 on gold/45)",
  "recommendation-accent": "the panel's 3px accent bar, down its left side",
  "recommendation-label": "the panel's `Recommendation` eyebrow, in gold-deep",
  "recommendation-glyph": "the panel's lightbulb, in gold-deep",

  /* --- The flagged row: the follow-up treatment, applied in a table --- */
  "department-row":
    "the flagged department's ground (gold/10) - the row the follow-up is about",
  "department-flag":
    "the flag glyph on that row's name, in gold-deep (US-022 pairs it with a word, never colour alone)",

  /* --- Sanctioned band and chrome uses, named by the Reference Guide --- */
  "segmented-option":
    "the SELECTED period on the navy band only - the reference build's gold-on-navy pairing, and the only one that clears contrast at 13px there",
  "line-chart-line":
    "the current period's line on the navy band - the one place gold is a series colour, over a white previous period (`app/components/charts/line-chart.tsx`)",
  "line-chart-legend-swatch": "that line's legend swatch, on the navy band",
  "connection-status":
    "the ambient `fcb-glow` pulse on the status dot - a box-shadow, never a fill",
  "thinking-scan":
    "the thinking panel's sweep, which the Reference Guide lists among gold's ambient uses",
  "thinking-glyph":
    "the thinking panel's glyph, carrying the same ambient glow",
};

/** A gold paint the allowlist does not cover. */
export function strayGold(
  gold: readonly GoldPaint[],
  partnerColours: readonly string[],
): readonly GoldPaint[] {
  return gold.filter((paint) => {
    if (GOLD_ALLOWED[paint.slot]) return false;
    // Feldschlosschen's own brand colour IS `accentFollowUp`'s hex. The plate
    // is content, not an accent, so it is identified by slot rather than by
    // pixel - see `partnerBrandColours` above.
    if (
      paint.slot === "partner-monogram" &&
      partnerColours.includes(paint.hex)
    ) {
      return false;
    }
    return true;
  });
}

/** One line per gold paint, grouped by slot, for the run output. */
export function formatGoldAudit(
  gold: readonly GoldPaint[],
  partnerColours: readonly string[] = [],
): string {
  const bySlot = new Map<string, GoldPaint[]>();
  for (const paint of gold) {
    const list = bySlot.get(paint.slot) ?? [];
    list.push(paint);
    bySlot.set(paint.slot, list);
  }
  return [...bySlot.entries()]
    .map(([slot, paints]) => {
      const properties = [
        ...new Set(
          paints.map(
            (paint) => `${paint.property} ${paint.hex}@${paint.alpha}`,
          ),
        ),
      ];
      const partnerPlate =
        slot === "partner-monogram" &&
        paints.every((paint) => partnerColours.includes(paint.hex));
      const reason = partnerPlate
        ? "NOT gold: Feldschlosschen's own brand colour, which happens to be `accentFollowUp`'s hex - content, not an accent"
        : (GOLD_ALLOWED[slot] ?? "*** NOT ON THE ALLOWLIST ***");
      return `  ${slot} x${paints.length}\n      ${properties.join(", ")}\n      ${reason}`;
    })
    .join("\n");
}

/* ------------------------------------------------------------- CONTRAST -- */

/** One line per contrast pair, worst first. */
export function formatContrast(
  readings: readonly ContrastReading[],
  limit = 40,
): string {
  return readings
    .slice(0, limit)
    .map(
      (reading) =>
        `  ${reading.ratio.toFixed(2)}:1  ${reading.fg} on ${reading.bg}  ${reading.scale}  x${reading.count}` +
        `\n      ${reading.samples.join(" | ")}`,
    )
    .join("\n");
}
