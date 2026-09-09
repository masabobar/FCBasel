import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  color,
  cssVariable,
  cssVariableName,
  fontSize,
  fontWeight,
  letterSpacing,
  tokens,
  type TokenGroup,
} from "../../app/lib/tokens";

// Read from disk rather than imported: Vitest stubs CSS imports out, and this
// check must see exactly the bytes that ship.
const STYLESHEET = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

/**
 * Parse the `@theme static { … }` block into a map of custom property to value.
 * Values are read verbatim; `var(--x)` references are resolved afterwards so a
 * semantic alias compares equal to the palette entry it points at.
 */
function parseThemeBlock(css: string): Map<string, string> {
  const start = css.indexOf("@theme static {");
  const end = css.indexOf("}", start);
  if (start === -1 || end === -1) {
    throw new Error("app/app.css must declare an @theme static block");
  }

  const body = css
    .slice(start + "@theme static {".length, end)
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const declarations = new Map<string, string>();
  for (const statement of body.split(";")) {
    const match = /^\s*(--[\w-]+)\s*:\s*([\s\S]+)$/.exec(statement);
    if (match?.[1] && match[2]) {
      declarations.set(match[1], match[2]);
    }
  }
  return declarations;
}

function resolveReferences(declarations: Map<string, string>): void {
  const varPattern = /var\((--[\w-]+)\)/;
  for (const [name, value] of declarations) {
    let resolved = value;
    for (let depth = 0; varPattern.test(resolved) && depth < 5; depth += 1) {
      resolved = resolved.replace(varPattern, (_whole, ref: string) => {
        const target = declarations.get(ref);
        if (target === undefined) {
          throw new Error(`${name} references undefined ${ref}`);
        }
        return target;
      });
    }
    declarations.set(name, resolved);
  }
}

/** Compare CSS and TypeScript spellings of the same value fairly. */
function normalise(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/'/g, '"')
    .replace(/\s*,\s*/g, ",")
    .trim()
    .toLowerCase();
}

const themeVariables = parseThemeBlock(STYLESHEET);
resolveReferences(themeVariables);

const tokenEntries = Object.entries(tokens).flatMap(([group, groupTokens]) =>
  Object.entries(groupTokens).map(([key, value]) => ({
    group: group as TokenGroup,
    key,
    value: value as string,
    variable: cssVariableName(group as TokenGroup, key),
  })),
);

describe("colour tokens", () => {
  it.each([
    ["red", "#D3010C"],
    ["redVivid", "#FF1433"],
    ["blue", "#004093"],
    ["navy", "#0E2356"],
    ["gold", "#FBD500"],
    ["bg", "#FFFFFF"],
    ["surface", "#F1F4F9"],
    ["border", "#E4E7EC"],
    ["text", "#161A20"],
    ["muted", "#697386"],
    ["pos", "#0E9F6E"],
    ["neg", "#D3010C"],
  ])("defines %s as %s", (name, hex) => {
    expect(color[name as keyof typeof color]).toBe(hex);
  });

  it("uses the Reference Guide values where it diverges from the Specification", () => {
    // Guide wins on these three (scope.md §10): surface, text and positive
    // variance. Regressing them to the Specification's values is a real bug.
    expect(color.surface).toBe("#F1F4F9");
    expect(color.text).toBe("#161A20");
    expect(color.pos).toBe("#0E9F6E");
  });
});

describe("colour discipline", () => {
  it("gives series identity to red and blue", () => {
    expect(color.seriesPrimary).toBe(color.red);
    expect(color.seriesSecondary).toBe(color.blue);
    expect(color.seriesCurrent).toBe(color.red);
    expect(color.seriesPrevious).toBe(color.navy);
  });

  it("keeps variance tokens distinct from the club palette entries", () => {
    expect(color.variancePositive).toBe(color.pos);
    expect(color.varianceNegative).toBe(color.neg);
    // Red is the hero colour, not a failure state: negative variance shares the
    // hex but must stay a separate token so one can move without the other.
    expect(Object.keys(color)).toContain("varianceNegative");
    expect(Object.keys(color)).toContain("red");
  });

  it("restricts gold to the two accent roles", () => {
    expect(color.accentTargetHit).toBe(color.gold);
    expect(color.accentFollowUp).toBe(color.goldDeep);

    const goldConsumers = Object.entries(color)
      .filter(([, value]) => value === color.gold)
      .map(([key]) => key);
    expect(goldConsumers.sort()).toEqual(["accentTargetHit", "gold"]);
  });

  it("introduces no colour outside the token set", () => {
    const hexes = Object.values(color);
    const uniqueHexes = new Set(hexes.map((hex) => hex.toLowerCase()));
    expect(uniqueHexes.size).toBe(17);
  });
});

describe("type scale", () => {
  it("exposes the specified sizes", () => {
    expect(fontSize).toMatchObject({
      tileTitle: "13px",
      kpi: "30px",
      chartAxis: "12px",
      body: "14px",
      caption: "13px",
    });
  });

  it("exposes 400 body and 700 bold weights", () => {
    expect(fontWeight.body).toBe("400");
    expect(fontWeight.bold).toBe("700");
  });

  it("tracks uppercase headings at ~0.04em", () => {
    expect(letterSpacing.heading).toBe("0.04em");
  });

  it("uses the Helvetica Neue / Arial / system stack", () => {
    const stack = tokens.fontFamily.sans;
    expect(stack.startsWith("'Helvetica Neue', Arial,")).toBe(true);
    expect(stack.endsWith("sans-serif")).toBe(true);
  });

  it("renders tile titles uppercase, bold and tracked in one place", () => {
    const rule = /\.tile-title\s*\{([\s\S]*?)\}/.exec(STYLESHEET)?.[1] ?? "";
    expect(rule).toContain("text-transform: uppercase");
    expect(rule).toContain("var(--font-weight-bold)");
    expect(rule).toContain("var(--tracking-heading)");
  });

  it("sets tabular figures on the KPI number so digits do not jitter", () => {
    const rule = /\.kpi-number\s*\{([\s\S]*?)\}/.exec(STYLESHEET)?.[1] ?? "";
    expect(rule).toContain("font-variant-numeric: tabular-nums");
    expect(rule).toContain("var(--text-kpi)");
  });
});

describe("token set / stylesheet parity", () => {
  it("parses a non-trivial theme block", () => {
    expect(themeVariables.size).toBeGreaterThan(40);
  });

  it.each(tokenEntries)(
    "publishes $group.$key as $variable",
    ({ variable, value }) => {
      const declared = themeVariables.get(variable);
      expect(declared, `${variable} is missing from app/app.css`).toBeDefined();
      expect(normalise(declared ?? "")).toBe(normalise(value));
    },
  );

  it("declares no stylesheet token that the TypeScript set is missing", () => {
    const expected = new Set(tokenEntries.map((entry) => entry.variable));
    const orphans = [...themeVariables.keys()].filter(
      (name) => !expected.has(name),
    );
    expect(orphans).toEqual([]);
  });
});

describe("css variable helpers", () => {
  it("kebab-cases camelCase token keys", () => {
    expect(cssVariableName("color", "redVivid")).toBe("--color-red-vivid");
    expect(cssVariableName("color", "accentTargetHit")).toBe(
      "--color-accent-target-hit",
    );
    expect(cssVariableName("fontSize", "chartAxis")).toBe("--text-chart-axis");
    expect(cssVariableName("easing", "enter")).toBe("--ease-enter");
  });

  it("wraps a token reference for inline styles and SVG attributes", () => {
    expect(cssVariable("color", "red")).toBe("var(--color-red)");
    expect(cssVariable("shadow", "tile")).toBe("var(--shadow-tile)");
  });
});
