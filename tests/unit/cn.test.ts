import { describe, expect, it } from "vitest";

import { cn } from "../../app/lib/cn";
import { cssVariableName, fontSize } from "../../app/lib/tokens";

/**
 * `cn` exists to resolve Tailwind conflicts. These tests are mostly about ONE
 * conflict it must NOT invent: our type scale is named (`text-caption`,
 * `text-kpi`), and out of the box `tailwind-merge` reads any `text-…` it does
 * not recognise as a colour — so a size and a colour on one element looked like
 * two colours and the size was silently dropped. Found in US-012, closed in
 * US-017; every tile from here on stacks a size and a colour.
 */

/** Every type-scale utility the token set publishes, e.g. `text-caption`. */
const TOKEN_FONT_SIZES = Object.keys(fontSize).map((token) =>
  cssVariableName("fontSize", token).replace(/^--/, ""),
);

describe("cn — the named type scale survives a colour", () => {
  it("keeps every size token alongside a colour token", () => {
    for (const size of TOKEN_FONT_SIZES) {
      expect(cn(size, "text-muted").split(" ").sort()).toEqual(
        [size, "text-muted"].sort(),
      );
    }
  });

  it("keeps the pairing in either order", () => {
    expect(cn("text-muted", "text-caption")).toContain("text-caption");
    expect(cn("text-muted", "text-caption")).toContain("text-muted");
  });

  it("covers the whole scale, derived rather than retyped", () => {
    // If a size token is added to `tokens.ts`, it is understood here at once.
    expect(TOKEN_FONT_SIZES).toContain("text-caption");
    expect(TOKEN_FONT_SIZES).toContain("text-kpi");
    expect(TOKEN_FONT_SIZES).toContain("text-tile-title");
    expect(TOKEN_FONT_SIZES.length).toBe(Object.keys(fontSize).length);
  });
});

describe("cn — the conflicts it must still resolve", () => {
  it("collapses two sizes to the last one", () => {
    expect(cn("text-caption", "text-kpi")).toBe("text-kpi");
    expect(cn("text-body", "text-sm")).toBe("text-sm");
  });

  it("collapses two colours to the last one", () => {
    expect(cn("text-muted", "text-navy")).toBe("text-navy");
  });

  it("lets a caller override a component's base size through className", () => {
    expect(cn("text-caption text-muted", "text-body")).toBe(
      "text-muted text-body",
    );
  });

  it("still resolves the standard groups", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("flex", undefined, null, "hidden")).toBe("hidden");
  });

  it("passes token utilities outside the scale through untouched", () => {
    // The safe direction: nothing is dropped that `tailwind-merge` cannot
    // reason about.
    expect(cn("p-tile", "rounded-tile")).toBe("p-tile rounded-tile");
  });
});
