/**
 * US-013 — the "Active partners" tile.
 *
 * The acceptance criterion is narrow and specific: "Partner tiles use
 * placeholder monogram logos (initials on a coloured tile) plus a role tag,
 * with a subtle hover lift." All four halves of that are asserted here, plus
 * the one thing a reviewer is most likely to break — the brand colours, which
 * are the PARTNERS' colours and deliberately outside the FCB token palette.
 */

import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  MONOGRAM_LENGTH,
  PARTNER_HOVER_LIFT_CLASS,
  PartnerCard,
  PartnerMonogram,
  PartnersTile,
  partnerMonogram,
} from "../../app/components/tiles/partner-tile";
import { createMockBaselineRepository } from "../../app/lib/mock/baseline";
import {
  PARTNER_ROLE_LABEL,
  PartnerRole,
} from "../../app/lib/repositories/enums";
import { type Partner } from "../../app/lib/repositories/types";

const PARTNER_SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/tiles/partner-tile.tsx"),
  "utf8",
);

/** Comments describe the brand-colour rule and must not trip the hex scan. */
const PARTNER_CODE = PARTNER_SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(
  /\/\/.*$/gm,
  "",
);

const PARTNERS = await createMockBaselineRepository().partners();

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

describe("partnerMonogram", () => {
  it("gives a single-word brand two letters, not one lonely glyph", () => {
    expect(partnerMonogram("Bitpanda")).toBe("BI");
    expect(partnerMonogram("Macron")).toBe("MA");
    expect(partnerMonogram("Feldschlösschen")).toBe("FE");
  });

  it("reduces a multi-word name to its initials", () => {
    // The Specification's own full name for the mobility partner.
    expect(partnerMonogram("Hoffmann Automobile")).toBe("HA");
    expect(partnerMonogram("Basler Kantonal Bank")).toBe("BK");
  });

  it("is always upper case and never longer than the plate", () => {
    for (const partner of PARTNERS) {
      const monogram = partnerMonogram(partner.name);
      expect(monogram).toBe(monogram.toUpperCase());
      expect(monogram.length).toBeLessThanOrEqual(MONOGRAM_LENGTH);
    }
  });

  it("survives padding and an empty name without throwing", () => {
    expect(partnerMonogram("  Sunrise  ")).toBe("SU");
    expect(partnerMonogram("")).toBe("");
    expect(partnerMonogram("   ")).toBe("");
  });
});

describe("PartnerMonogram — the placeholder logo", () => {
  const partner: Partner = PARTNERS[0]!;

  it("paints the plate in the partner's OWN brand colour, from the data", () => {
    render(<PartnerMonogram partner={partner} />);

    expect(slots("partner-monogram")[0]).toHaveStyle({
      backgroundColor: partner.brandColor,
    });
  });

  it("hides the monogram from the accessibility tree", () => {
    // The partner's name is text beside it; the letters are an abbreviation a
    // screen reader would only spell out as noise.
    render(<PartnerMonogram partner={partner} />);

    expect(slots("partner-monogram")[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("contains no hex literal — brand colours arrive as data, never as code", () => {
    expect(PARTNER_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    for (const each of PARTNERS) {
      expect(PARTNER_CODE).not.toContain(each.brandColor);
    }
  });

  it("reads no design token for the plate colour either", () => {
    // A partner plate in club red is wrong to a sponsor in the room.
    expect(PARTNER_CODE).not.toMatch(/bg-(red|blue|navy|gold)\b/);
    expect(PARTNER_CODE).not.toMatch(/--color-(red|blue|navy|gold)/);
  });
});

describe("PartnerCard — name, role tag and hover lift", () => {
  const partner: Partner = {
    name: "Bitpanda",
    role: PartnerRole.MAIN_SHIRT_SPONSOR,
    roleLabel: PARTNER_ROLE_LABEL[PartnerRole.MAIN_SHIRT_SPONSOR],
    brandColor: "#0A9D8E",
  };

  it("shows the name and the role tag", () => {
    render(
      <ul>
        <PartnerCard partner={partner} />
      </ul>,
    );

    expect(slots("partner-name")[0]).toHaveTextContent("Bitpanda");
    expect(slots("partner-role")[0]).toHaveTextContent("Main shirt sponsor");
  });

  it("takes the role wording from the enum's label map, not from copy", () => {
    render(
      <ul>
        <PartnerCard partner={partner} />
      </ul>,
    );

    expect(slots("partner-role")[0]!.textContent).toBe(partner.roleLabel);
    expect(PARTNER_CODE).not.toContain("Main shirt sponsor");
  });

  it("publishes the role as data, so a test never reads it off a colour", () => {
    render(
      <ul>
        <PartnerCard partner={partner} />
      </ul>,
    );

    expect(slots("partner-card")[0]).toHaveAttribute(
      "data-partner-role",
      PartnerRole.MAIN_SHIRT_SPONSOR,
    );
  });

  it("lifts on hover — a 2px rise and the raised shadow, and nothing more", () => {
    render(
      <ul>
        <PartnerCard partner={partner} />
      </ul>,
    );

    const card = slots("partner-card")[0]!;
    for (const className of PARTNER_HOVER_LIFT_CLASS.split(" ")) {
      expect(card).toHaveClass(className);
    }

    // Subtle: half a spacing step, not a jump. And timed off the `fast` token.
    expect(PARTNER_HOVER_LIFT_CLASS).toContain("hover:-translate-y-0.5");
    expect(PARTNER_HOVER_LIFT_CLASS).toContain("hover:shadow-raised");
    expect(PARTNER_HOVER_LIFT_CLASS).toContain("duration-(--duration-fast)");
  });

  it("never truncates a partner name", () => {
    render(
      <ul>
        <PartnerCard partner={{ ...partner, name: "Feldschlösschen" }} />
      </ul>,
    );

    const name = slots("partner-name")[0]!;
    expect(name).toHaveTextContent("Feldschlösschen");
    expect(name.className).not.toMatch(/truncate|text-ellipsis|line-clamp/);
  });
});

describe("PartnersTile", () => {
  it("renders one card per partner, in dataset order", () => {
    render(<PartnersTile title="Active partners" partners={PARTNERS} />);

    expect(slots("partner-card")).toHaveLength(PARTNERS.length);
    expect(slots("partner-name").map((node) => node.textContent)).toEqual(
      PARTNERS.map((partner) => partner.name),
    );
  });

  it("gives every card a monogram plate and a role tag", () => {
    render(<PartnersTile title="Active partners" partners={PARTNERS} />);

    expect(slots("partner-monogram")).toHaveLength(PARTNERS.length);
    expect(slots("partner-role").map((node) => node.textContent)).toEqual(
      PARTNERS.map((partner) => partner.roleLabel),
    );
  });

  it("counts the partners it is actually showing", () => {
    render(<PartnersTile title="Active partners" partners={PARTNERS} />);

    expect(slots("card-subtitle")[0]).toHaveTextContent(
      `${PARTNERS.length} active`,
    );
  });

  it("marks the partners up as a list", () => {
    render(<PartnersTile title="Active partners" partners={PARTNERS} />);

    expect(screen.getByRole("list")).toBe(slots("partner-grid")[0]);
    expect(screen.getAllByRole("listitem")).toHaveLength(PARTNERS.length);
  });

  it("composes the one Card shell rather than forking it", () => {
    render(<PartnersTile title="Active partners" partners={PARTNERS} />);

    expect(slots("card")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Active partners" }),
    ).toBeInTheDocument();
  });

  it("renders nothing but the shell for an empty partner list", () => {
    render(<PartnersTile title="Active partners" partners={[]} />);

    expect(slots("partner-card")).toHaveLength(0);
    expect(slots("card-subtitle")[0]).toHaveTextContent("0 active");
  });
});
