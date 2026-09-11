/**
 * The cosmetic sign-in gate.
 *
 * WHAT IS WORTH ASSERTING ABOUT THEATRE. This screen protects nothing
 * (`app/lib/demo-access.ts` explains at length why that is the specification's
 * choice and not an oversight), so there is no security property to test. What
 * CAN break a live demo is narrower and entirely real:
 *
 *   1. THE PRINTED CREDENTIAL STOPS OPENING THE DOOR. The screen shows the
 *      credential it asks for; if the hint and the check ever drift apart, the
 *      presenter is locked out of their own demo in front of the room. Asserted
 *      by driving the form with the string the screen actually renders.
 *   2. A REJECTION LEAVES NO WAY FORWARD. Wrong input must say so and must
 *      stay usable.
 *   3. IT BREAKS A PHASE 4 GUARANTEE. US-044 pins the colour inventory and
 *      sweeps every rendered string for em and en dashes; this screen is new
 *      surface that both rules now cover.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LoginScreen } from "../../app/components/chrome/login-screen";
import { CREST_LABEL } from "../../app/components/chrome/crest";
import {
  DEMO_CREDENTIALS,
  SIGN_IN_ERROR,
  opensDemo,
} from "../../app/lib/demo-access";
import { WORKSPACE_LABEL } from "../../app/lib/persona";

/* ---------------------------------------------------------------- SETUP -- */

function renderScreen() {
  const onSignIn = vi.fn();
  render(<LoginScreen onSignIn={onSignIn} />);
  return { onSignIn };
}

function fillIn(username: string, password: string): void {
  fireEvent.change(screen.getByLabelText("Username"), {
    target: { value: username },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

function error(): HTMLElement | null {
  return screen.queryByRole("alert");
}

/* ------------------------------------------------------- THE CREDENTIAL -- */

describe("the credential the screen prints is the credential it accepts", () => {
  it("prints both halves of DEMO_CREDENTIALS", () => {
    renderScreen();

    const hint = document.querySelector('[data-slot="login-hint"]')!;

    expect(
      within(hint as HTMLElement).getByText(DEMO_CREDENTIALS.username),
    ).toBeInTheDocument();
    expect(
      within(hint as HTMLElement).getByText(DEMO_CREDENTIALS.password),
    ).toBeInTheDocument();
  });

  it("opens when the printed credential is typed back in", () => {
    const { onSignIn } = renderScreen();

    const hint = document.querySelector('[data-slot="login-hint"]')!;
    const printed = hint.textContent!;

    // Driven by what the SCREEN says rather than by the constant, so a hint
    // that stops matching the check fails here rather than in the demo room.
    const [username, password] = printed
      .replace(/^.*?:\s*/, "")
      .split("/")
      .map((part) => part.trim());

    fillIn(username!, password!);

    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(error()).toBeNull();
  });

  it("tolerates the whitespace and casing a projected screen produces", () => {
    expect(opensDemo("  DEMO  ", `  ${DEMO_CREDENTIALS.password}  `)).toBe(
      true,
    );
  });

  it("does not tolerate a different password casing", () => {
    expect(opensDemo(DEMO_CREDENTIALS.username, "FCB2026")).toBe(false);
  });

  it("names no individual, in keeping with the persona rule", () => {
    // US-012: "no real or realistic individual name anywhere". A handle, not a
    // person, and no surname-shaped string in either half.
    expect(DEMO_CREDENTIALS.username).toBe("demo");
    expect(
      `${DEMO_CREDENTIALS.username} ${DEMO_CREDENTIALS.password}`,
    ).not.toMatch(/[A-Z][a-z]{2,}/);
  });
});

/* ---------------------------------------------------------- A REJECTION -- */

describe("a rejection says so and stays usable", () => {
  it("does not sign in on a wrong password", () => {
    const { onSignIn } = renderScreen();

    fillIn(DEMO_CREDENTIALS.username, "not-the-password");

    expect(onSignIn).not.toHaveBeenCalled();
    expect(error()).toHaveTextContent(SIGN_IN_ERROR);
  });

  it("does not sign in on a wrong username", () => {
    const { onSignIn } = renderScreen();

    fillIn("someone-else", DEMO_CREDENTIALS.password);

    expect(onSignIn).not.toHaveBeenCalled();
    expect(error()).toBeInTheDocument();
  });

  it("does not sign in on an empty submit", () => {
    const { onSignIn } = renderScreen();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(onSignIn).not.toHaveBeenCalled();
  });

  it("clears the rejection as soon as the presenter types again", () => {
    renderScreen();

    fillIn(DEMO_CREDENTIALS.username, "wrong");
    expect(error()).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "f" },
    });

    expect(error()).toBeNull();
  });

  it("recovers: a rejection then the right credential still opens", () => {
    const { onSignIn } = renderScreen();

    fillIn(DEMO_CREDENTIALS.username, "wrong");
    fillIn(DEMO_CREDENTIALS.username, DEMO_CREDENTIALS.password);

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("ties the message to the field for a screen reader", () => {
    renderScreen();

    fillIn(DEMO_CREDENTIALS.username, "wrong");

    const described = screen
      .getByLabelText("Password")
      .getAttribute("aria-describedby");

    expect(described).toBe(error()!.id);
  });
});

/* ------------------------------------------------------------ THE FRAME -- */

describe("the screen reads as the club's own front door", () => {
  it("shows the self-hosted crest and the workspace label", () => {
    renderScreen();

    expect(screen.getByAltText(CREST_LABEL)).toHaveAttribute(
      "src",
      "/fcb-crest.png",
    );
    expect(screen.getByText(WORKSPACE_LABEL)).toBeInTheDocument();
  });

  it("masks the password field", () => {
    renderScreen();

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("adds no gold, which US-044 pins to a closed allowlist", () => {
    const { container } = render(<LoginScreen onSignIn={vi.fn()} />);

    expect(container.innerHTML).not.toMatch(/gold/);
  });

  it("renders no em or en dash, which US-044 sweeps for", () => {
    renderScreen();

    // Every text node and every attribute value, the same surface the Chrome
    // sweep walks.
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ALL,
    );
    const offenders: string[] = [];

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE && /[—–]/.test(node.textContent!)) {
        offenders.push(node.textContent!);
      }
      if (node instanceof Element) {
        for (const attr of node.attributes) {
          if (/[—–]/.test(attr.value))
            offenders.push(`${attr.name}=${attr.value}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
