import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  Crest,
  CREST_LABEL_KEY,
  CREST_SRC,
} from "../../app/components/chrome/crest";
import { t } from "./support/i18n";

const PUBLIC_CREST = resolve(__dirname, "../../public/fcb-crest.png");

/** The eight-byte PNG signature every valid PNG file starts with. */
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

describe("Crest", () => {
  it("exposes an accessible name", () => {
    render(<Crest />);

    expect(
      screen.getByRole("img", { name: t(CREST_LABEL_KEY) }),
    ).toBeInTheDocument();
  });

  it("points at the self-hosted asset by a root-relative path", () => {
    render(<Crest />);

    expect(
      screen.getByRole("img", { name: t(CREST_LABEL_KEY) }),
    ).toHaveAttribute("src", "/fcb-crest.png");
  });

  // The whole point of US-004: a hotlink to the club CDN would break the demo
  // with the network disconnected, so no absolute URL may appear in the source.
  it("never references the club CDN or any absolute URL", () => {
    expect(CREST_SRC).toMatch(/^\/[^/]/);
    expect(CREST_SRC).not.toMatch(/fcb\.ch/);
    expect(CREST_SRC).not.toMatch(/^(https?:)?\/\//);
  });

  it("renders at the 32px app-bar height by default", () => {
    render(<Crest />);
    const crest = screen.getByRole("img", { name: t(CREST_LABEL_KEY) });

    expect(crest).toHaveAttribute("height", "32");
    expect(crest).toHaveAttribute("width", "30");
  });

  it("scales width with height so the box keeps the asset's aspect ratio", () => {
    render(<Crest size={64} />);
    const crest = screen.getByRole("img", { name: t(CREST_LABEL_KEY) });

    expect(crest).toHaveAttribute("height", "64");
    expect(crest).toHaveAttribute("width", "60");
  });

  it("forwards a className", () => {
    render(<Crest className="shrink-0" />);

    expect(screen.getByRole("img", { name: t(CREST_LABEL_KEY) })).toHaveClass(
      "shrink-0",
    );
  });
});

describe("committed crest asset", () => {
  // Guards the acceptance criterion that the asset is in the repo, and the
  // finding that the club serves a PNG behind a `.webp` URL — the bytes, not
  // the extension, decide the format.
  it("is a real PNG committed under public/", () => {
    const bytes = readFileSync(PUBLIC_CREST);

    expect(bytes.subarray(0, 8)).toEqual(PNG_SIGNATURE);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it("is small enough to ship in the app bar", () => {
    expect(readFileSync(PUBLIC_CREST).byteLength).toBeLessThan(64 * 1024);
  });
});
