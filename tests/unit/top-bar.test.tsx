import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  CONNECTED_SYSTEM_COUNT,
  CONNECTION_STATUS_TEXT,
  TopBar,
} from "../../app/components/chrome/top-bar";
import { CREST_LABEL } from "../../app/components/chrome/crest";
import { MOTION_CLASS } from "../../app/lib/motion";
import {
  AVATAR_INITIALS,
  AVATAR_LABEL,
  WORKSPACE_LABEL,
} from "../../app/lib/persona";

const TOP_BAR_SOURCE = readFileSync(
  resolve(__dirname, "../../app/components/chrome/top-bar.tsx"),
  "utf8",
);

const PERSONA_SOURCE = readFileSync(
  resolve(__dirname, "../../app/lib/persona.ts"),
  "utf8",
);

function slot(name: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-slot="${name}"]`)!;
}

describe("TopBar — identity", () => {
  it("is a banner landmark", () => {
    render(<TopBar />);

    expect(screen.getByRole("banner")).toBe(slot("top-bar"));
  });

  it("opens with the self-hosted crest at app-bar size", () => {
    render(<TopBar />);

    const crest = screen.getByRole("img", { name: CREST_LABEL });
    expect(screen.getByRole("banner").firstElementChild).toBe(crest);
    expect(crest).toHaveAttribute("height", "32");
    // The crest is committed to `public/`; never a club-CDN URL (US-004).
    expect(crest).toHaveAttribute("src", "/fcb-crest.png");
  });

  it("shows the workspace label", () => {
    render(<TopBar />);

    expect(slot("workspace-label")).toHaveTextContent(WORKSPACE_LABEL);
    expect(WORKSPACE_LABEL).toBe("Sales & Marketing");
  });

  it("shows a generic avatar carrying the workspace initials", () => {
    render(<TopBar />);

    const avatar = slot("avatar");
    expect(avatar).toHaveTextContent(AVATAR_INITIALS);
    expect(AVATAR_INITIALS).toBe("SM");
    expect(screen.getByRole("img", { name: AVATAR_LABEL })).toBe(avatar);
  });

  it("carries no photo — the crest is the only image element", () => {
    const { container } = render(<TopBar />);

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("alt", CREST_LABEL);
  });

  it("names no individual anywhere — the persona is a role", () => {
    render(<TopBar />);

    // The bar's entire text is accounted for by known role labels, so a
    // personal name cannot have been added without failing here.
    const expected = [
      WORKSPACE_LABEL,
      CONNECTION_STATUS_TEXT,
      "Reset",
      AVATAR_INITIALS,
    ].join("");
    expect(screen.getByRole("banner").textContent).toBe(expected);
  });

  it("keeps the avatar label derived from the workspace label", () => {
    expect(AVATAR_LABEL).toBe(`${WORKSPACE_LABEL} workspace`);
    expect(PERSONA_SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe("TopBar — the connection status is decorative", () => {
  it("shows the scripted status text", () => {
    render(<TopBar />);

    expect(CONNECTED_SYSTEM_COUNT).toBe(11);
    expect(CONNECTION_STATUS_TEXT).toBe("Connected · 11 systems");
    expect(slot("connection-status")).toHaveTextContent(CONNECTION_STATUS_TEXT);
  });

  it("is marked decorative in the markup", () => {
    render(<TopBar />);

    expect(slot("connection-status")).toHaveAttribute(
      "data-decorative",
      "true",
    );
  });

  it("is not a live region — nothing about it is ever measured", () => {
    render(<TopBar />);

    const status = slot("connection-status");
    expect(status).not.toHaveAttribute("aria-live");
    expect(status).not.toHaveAttribute("role");
    expect(screen.queryAllByRole("status")).toHaveLength(0);
  });

  it("hides its pulsing dot from assistive tech", () => {
    render(<TopBar />);

    const dot = slot("connection-status").firstElementChild!;
    expect(dot).toHaveAttribute("aria-hidden", "true");
    // The ambient brand pulse, not an insertion effect (US-006).
    expect(dot).toHaveClass(MOTION_CLASS.glow);
  });

  it("makes no network call and holds no health-check hook", () => {
    // The prototype must survive a disconnected venue network
    // (`constraints.md` §3): nothing in the app bar may reach out.
    expect(TOP_BAR_SOURCE).not.toMatch(/\bfetch\(/);
    expect(TOP_BAR_SOURCE).not.toMatch(/\baxios\b/);
    expect(TOP_BAR_SOURCE).not.toMatch(/\buseEffect\b/);
    expect(TOP_BAR_SOURCE).not.toMatch(/setInterval|setTimeout/);
  });
});

describe("TopBar — the Reset control", () => {
  it("renders a real button", () => {
    render(<TopBar />);

    const reset = screen.getByRole("button", { name: "Reset" });
    expect(reset).toBe(slot("reset"));
    expect(reset).toHaveAttribute("type", "button");
  });

  it("calls the injected handler when pressed", async () => {
    const onReset = vi.fn();
    render(<TopBar onReset={onReset} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("is a harmless no-op without a handler — behaviour is US-015", async () => {
    render(<TopBar />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });
});

describe("TopBar — token discipline", () => {
  it("uses no literal colour value", () => {
    expect(TOP_BAR_SOURCE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(TOP_BAR_SOURCE).not.toMatch(/\brgba?\(/);
  });

  it("never injects raw HTML", () => {
    expect(TOP_BAR_SOURCE).not.toMatch(/dangerouslySetInnerHTML/);
  });
});
