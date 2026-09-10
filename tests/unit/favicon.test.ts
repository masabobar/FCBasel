import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { FAVICON_HREF, links } from "../../app/root";

/**
 * US-040 — the browser-tab icon, read as bytes.
 *
 * `public/` shipped with only the crest, so every page load left the browser
 * probing `/favicon.ico`, taking a 404 and logging a console error that
 * US-045's "no console errors" criterion does not allow. The fix is a
 * committed binary asset, and a committed binary asset is only as trustworthy
 * as the test that reads it — so this file re-derives everything the security
 * triage claims: the container is a real ICO, the image inside it is the
 * crest's own pixels at 32x32, nothing is appended past `IEND`, and no
 * ancillary chunk survives.
 *
 * THE METADATA CHECK IS NOT THEATRE. US-004 found macOS `sips` re-attaching an
 * XMP `iTXt` naming the source machine; regenerating this icon produced an
 * `eXIf` block (colour space and pixel dimensions) and an `sRGB` chunk instead.
 * The build re-encodes from raw samples rather than editing the file, so
 * neither can survive — and this test is what proves the next regeneration
 * cannot quietly reintroduce them.
 */

const FAVICON_PATH = resolve(process.cwd(), "public/favicon.ico");
const FAVICON = readFileSync(FAVICON_PATH);

/** ICO container: 6-byte directory header plus one 16-byte entry. */
const ICO_HEADER_LENGTH = 6;
const ICO_ENTRY_LENGTH = 16;
const IMAGE_OFFSET = ICO_HEADER_LENGTH + ICO_ENTRY_LENGTH;

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** A 32px icon renders crisply at the 16px browsers actually draw. */
const ICON_SIDE = 32;

/** Generous, and still two orders of magnitude under the 194 KB source art. */
const SIZE_BUDGET_BYTES = 8 * 1024;

/** The PNG payload, as the ICO directory addresses it. */
const payload = FAVICON.subarray(IMAGE_OFFSET);

/** Walk the payload's chunk table, so nothing is taken on trust. */
function pngChunks(png: Buffer): { kind: string; length: number }[] {
  const chunks: { kind: string; length: number }[] = [];
  let cursor = PNG_MAGIC.length;

  while (cursor < png.length) {
    const length = png.readUInt32BE(cursor);
    chunks.push({
      kind: png.toString("latin1", cursor + 4, cursor + 8),
      length,
    });
    // 4 length + 4 type + body + 4 CRC.
    cursor += 12 + length;
  }

  // Consuming exactly the buffer is the "nothing appended" proof.
  expect(cursor).toBe(png.length);
  return chunks;
}

describe("favicon.ico — the container", () => {
  it("is a single-entry Windows icon resource", () => {
    // Reserved 0, type 1 (icon), count 1.
    expect(FAVICON.readUInt16LE(0)).toBe(0);
    expect(FAVICON.readUInt16LE(2)).toBe(1);
    expect(FAVICON.readUInt16LE(4)).toBe(1);
  });

  it("declares a 32x32 32-bit image at the only possible offset", () => {
    expect(FAVICON.readUInt8(6)).toBe(ICON_SIDE);
    expect(FAVICON.readUInt8(7)).toBe(ICON_SIDE);
    // No palette, reserved byte clear, one colour plane, 32bpp.
    expect(FAVICON.readUInt8(8)).toBe(0);
    expect(FAVICON.readUInt8(9)).toBe(0);
    expect(FAVICON.readUInt16LE(10)).toBe(1);
    expect(FAVICON.readUInt16LE(12)).toBe(32);
    expect(FAVICON.readUInt32LE(18)).toBe(IMAGE_OFFSET);
  });

  it("declares the payload length that the file actually holds", () => {
    expect(FAVICON.readUInt32LE(14)).toBe(payload.length);
    expect(FAVICON.length).toBe(IMAGE_OFFSET + payload.length);
  });

  it("stays inside the size budget", () => {
    expect(FAVICON.length).toBeLessThan(SIZE_BUDGET_BYTES);
  });
});

describe("favicon.ico — the image inside it", () => {
  it("is a PNG, as its magic number says", () => {
    expect(payload.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)).toBe(true);
  });

  it("is 32x32, 8-bit RGBA and not interlaced", () => {
    // IHDR body starts 8 bytes of magic + 4 length + 4 type in.
    const ihdr = 16;
    expect(payload.readUInt32BE(ihdr)).toBe(ICON_SIDE);
    expect(payload.readUInt32BE(ihdr + 4)).toBe(ICON_SIDE);
    expect(payload.readUInt8(ihdr + 8)).toBe(8); // bit depth
    expect(payload.readUInt8(ihdr + 9)).toBe(6); // colour type: RGBA
    expect(payload.readUInt8(ihdr + 10)).toBe(0); // compression
    expect(payload.readUInt8(ihdr + 11)).toBe(0); // filter
    expect(payload.readUInt8(ihdr + 12)).toBe(0); // interlace
  });

  it("carries only the three critical chunks, and nothing past IEND", () => {
    const kinds = pngChunks(payload).map((chunk) => chunk.kind);

    expect(kinds[0]).toBe("IHDR");
    expect(kinds.at(-1)).toBe("IEND");
    expect(new Set(kinds)).toEqual(new Set(["IHDR", "IDAT", "IEND"]));
  });

  it("embeds no metadata — no text, EXIF or XMP chunk survives", () => {
    for (const kind of ["tEXt", "zTXt", "iTXt", "eXIf", "sRGB", "pHYs"]) {
      expect(FAVICON.includes(Buffer.from(kind, "latin1"))).toBe(false);
    }
    // The XMP packet wrapper and the hostname US-004 caught, by content.
    for (const marker of ["XML:com.adobe.xmp", "<x:xmpmeta", "MacBook"]) {
      expect(FAVICON.includes(Buffer.from(marker, "latin1"))).toBe(false);
    }
  });
});

describe("the root route declares it", () => {
  it("serves the icon from this origin, so the demo needs no network", () => {
    expect(FAVICON_HREF).toBe("/favicon.ico");
    // Root-relative: no scheme, no host, no protocol-relative prefix.
    expect(FAVICON_HREF).not.toMatch(/^(?:[a-z]+:)?\/\//i);
    expect(FAVICON_HREF.startsWith("/")).toBe(true);
  });

  it("emits exactly one icon link descriptor", () => {
    expect(links()).toEqual([
      { rel: "icon", type: "image/x-icon", href: FAVICON_HREF },
    ]);
  });
});
