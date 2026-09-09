import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardCaption,
  CARD_ACCENTS,
  TILE_ENTER_CLASS,
} from "../../app/components/tiles/card";
import { radius, shadow, spacing } from "../../app/lib/tokens";

const CARD_SOURCE = readFileSync(
  resolve(__dirname, "../../app/components/tiles/card.tsx"),
  "utf8",
);

const APP_CSS = readFileSync(resolve(__dirname, "../../app/app.css"), "utf8");

/** The card root, addressed the way a composing tile never has to. */
function cardRoot(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="card"]')!;
}

function slot(name: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

describe("Card — frame", () => {
  it("renders its children", () => {
    render(<Card>tile body</Card>);

    expect(screen.getByText("tile body")).toBeInTheDocument();
  });

  it("carries the tile surface: white background, 1px border, radius, shadow", () => {
    render(<Card>body</Card>);

    expect(cardRoot()).toHaveClass(
      "rounded-tile",
      "border",
      "border-border",
      "bg-bg",
      "shadow-tile",
    );
  });

  it("pads its content with the 20px tile spacing token", () => {
    render(<Card>body</Card>);

    expect(screen.getByText("body")).toHaveClass("p-tile");
  });

  it("clips content so the accent bar follows the corner radius", () => {
    render(<Card accent="gold">body</Card>);

    expect(cardRoot()).toHaveClass("overflow-hidden");
  });

  it("merges a caller className over its own base classes", () => {
    render(<Card className="h-full">body</Card>);

    expect(cardRoot()).toHaveClass("h-full", "rounded-tile");
  });
});

// The acceptance criteria name exact values; they must come from the token set
// rather than being retyped in the component, so assert the tokens themselves.
describe("Card — values come from tokens, never literals", () => {
  it("uses no hardcoded colour anywhere in the component", () => {
    expect(CARD_SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CARD_SOURCE).not.toMatch(/\brgba?\(/);
  });

  it("uses no dangerouslySetInnerHTML", () => {
    expect(CARD_SOURCE).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it("resolves the tile radius token to the specified 12px", () => {
    expect(radius.tile).toBe("12px");
    expect(APP_CSS).toMatch(/--radius-tile:\s*12px/);
  });

  it("resolves the tile padding token to the specified 20px", () => {
    expect(spacing.tile).toBe("20px");
    expect(APP_CSS).toMatch(/--spacing-tile:\s*20px/);
  });

  it("resolves the tile shadow token to a subtle layered shadow", () => {
    // Two layers: a 1px contact shadow and a wide, lifted ambient one.
    expect(shadow.tile.split("),").length).toBe(2);
    expect(APP_CSS).toMatch(/--shadow-tile:/);
  });

  it("only offers accent colours that exist as tokens", () => {
    for (const utility of Object.values(CARD_ACCENTS)) {
      const token = utility.replace(/^bg-/, "");
      expect(APP_CSS).toMatch(new RegExp(`--color-${token}:`));
    }
  });
});

describe("Card — title and subtitle", () => {
  it("renders the title as a heading in the uppercase tile-title role", () => {
    render(<Card title="Webshop revenue">body</Card>);
    const heading = screen.getByRole("heading", { name: "Webshop revenue" });

    expect(heading).toHaveClass("tile-title");
  });

  it("defines the uppercase treatment once, on the tile-title role class", () => {
    const rule = APP_CSS.slice(APP_CSS.indexOf(".tile-title"));

    expect(rule.slice(0, rule.indexOf("}"))).toMatch(
      /text-transform:\s*uppercase/,
    );
  });

  it("renders at heading level 3 by default", () => {
    render(<Card title="Top products">body</Card>);

    expect(
      screen.getByRole("heading", { level: 3, name: "Top products" }),
    ).toBeInTheDocument();
  });

  it("accepts a deeper heading level for a nested card", () => {
    render(
      <Card title="Top products" headingLevel={4}>
        body
      </Card>,
    );

    expect(
      screen.getByRole("heading", { level: 4, name: "Top products" }),
    ).toBeInTheDocument();
  });

  it("renders no heading at all when no title is given", () => {
    render(<Card>body</Card>);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders the subtitle in muted caption type when given", () => {
    render(
      <Card title="Webshop revenue" subtitle="Year to date">
        body
      </Card>,
    );

    expect(screen.getByText("Year to date")).toHaveClass(
      "text-caption",
      "text-muted",
    );
  });

  it("omits the subtitle when none is given", () => {
    render(<Card title="Webshop revenue">body</Card>);

    expect(slot("card-subtitle")).toBeNull();
  });

  it("omits the whole header when there is nothing to put in it", () => {
    render(<Card>body</Card>);

    expect(slot("card-header")).toBeNull();
  });
});

describe("Card — optional slots", () => {
  it("renders the icon badge when an icon is given", () => {
    render(
      <Card title="Attendance" icon={<span>icon</span>}>
        body
      </Card>,
    );

    expect(slot("card-icon")).not.toBeNull();
    expect(screen.getByText("icon")).toBeInTheDocument();
  });

  it("omits the icon badge when no icon is given", () => {
    render(<Card title="Attendance">body</Card>);

    expect(slot("card-icon")).toBeNull();
  });

  it("renders the right-hand action slot when an action is given", () => {
    render(
      <Card title="Attendance" action={<button>Year to date</button>}>
        body
      </Card>,
    );

    expect(slot("card-action")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Year to date" }),
    ).toBeInTheDocument();
  });

  it("omits the action slot when no action is given", () => {
    render(<Card title="Attendance">body</Card>);

    expect(slot("card-action")).toBeNull();
  });

  it("renders a header for an action even with no title", () => {
    render(<Card action={<button>Filter</button>}>body</Card>);

    expect(slot("card-header")).not.toBeNull();
  });

  it("renders the accent bar at 3px in the named token colour", () => {
    render(<Card accent="gold">body</Card>);

    expect(slot("card-accent")).toHaveClass("h-[3px]", CARD_ACCENTS.gold);
  });

  it("omits the accent bar when no accent is given", () => {
    render(<Card>body</Card>);

    expect(slot("card-accent")).toBeNull();
  });

  it("hides the accent bar from the accessibility tree", () => {
    render(<Card accent="navy">body</Card>);

    expect(slot("card-accent")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Card — narrative caption strip", () => {
  it("renders the caption strip when a caption is given", () => {
    render(
      <Card title="Kit sales" caption="Home kit leads by 4,100 units.">
        body
      </Card>,
    );

    expect(slot("card-caption")).not.toBeNull();
    expect(
      screen.getByText("Home kit leads by 4,100 units."),
    ).toBeInTheDocument();
  });

  it("omits the caption strip when no caption is given", () => {
    render(<Card title="Kit sales">body</Card>);

    expect(slot("card-caption")).toBeNull();
  });

  it("renders the caption as one muted line divided from the body", () => {
    render(<CardCaption>Attendance is up 6% on last season.</CardCaption>);

    expect(slot("card-caption")).toHaveClass(
      "narrative-caption",
      "border-t",
      "border-line",
      "px-tile",
    );
    expect(screen.getByText("Attendance is up 6% on last season.")).toHaveClass(
      "truncate",
    );
  });

  it("defines the muted caption colour once, on the narrative-caption role class", () => {
    const rule = APP_CSS.slice(APP_CSS.indexOf(".narrative-caption"));

    expect(rule.slice(0, rule.indexOf("}"))).toMatch(
      /color:\s*var\(--color-muted\)/,
    );
  });

  it("keeps the AI glyph decorative — never announced as content", () => {
    render(<CardCaption>Season to date.</CardCaption>);
    const glyph = slot("card-caption")!.querySelector("[aria-hidden]");

    expect(glyph).not.toBeNull();
    expect(glyph!.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("graphics-symbol")).not.toBeInTheDocument();
  });

  it("escapes caller text rather than interpreting it as markup", () => {
    render(<CardCaption>{'<img src=x onerror="alert(1)">'}</CardCaption>);

    expect(slot("card-caption")!.querySelector("img")).toBeNull();
    expect(
      screen.getByText('<img src=x onerror="alert(1)">'),
    ).toBeInTheDocument();
  });
});

describe("Card — insertion hooks for US-006", () => {
  it("marks a new tile with the entrance class", () => {
    render(<Card isNew>body</Card>);

    expect(cardRoot()).toHaveClass(TILE_ENTER_CLASS);
  });

  it("leaves an existing tile unanimated", () => {
    render(<Card>body</Card>);

    expect(cardRoot()).not.toHaveClass(TILE_ENTER_CLASS);
  });

  it("carries a stagger delay onto the tile", () => {
    render(
      <Card isNew delayMs={120}>
        body
      </Card>,
    );

    expect(cardRoot()).toHaveStyle({ animationDelay: "120ms" });
  });

  it("sets no delay style when none is asked for", () => {
    render(<Card isNew>body</Card>);

    expect(cardRoot().getAttribute("style")).toBeNull();
  });

  // The Reference Guide removed the Specification's gold ring: new tiles fade
  // and rise only. Guard against it creeping back in.
  it("adds no ring or glow to a new tile", () => {
    render(
      <Card isNew accent="gold">
        body
      </Card>,
    );

    expect(cardRoot().className).not.toMatch(/ring|glow|shadow-raised/);
    expect(slot("card-accent")!.className).not.toMatch(/ring|glow/);
  });
});
