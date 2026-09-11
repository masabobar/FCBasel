/**
 * US-028 — the persistent prompt bar.
 *
 * Four acceptance criteria, and every one of them is a recorded review
 * decision rather than a preference, so each is driven here through the DOM
 * rather than asserted as a class name:
 *
 *   ① ONE field, search icon and send button EMBEDDED, no inner bordered box.
 *     Asserted structurally: the input and the button are direct children of
 *     the single bordered element, and no descendant of that element may carry
 *     a border or a ring. A nested box was the reported defect.
 *   ② A press anywhere in the field puts the caret in the input.
 *   ③ Enter submits, the embedded button submits, an empty field does nothing
 *     at all and the chips stay where they are.
 *   ④ Rapid repeated submits produce ONE call, and a `busy` bar produces none.
 *
 * Plus the security pass this story triggers: the typed value is the only user
 * input in the product, so it is proved to travel as a string and never as
 * markup, with an `<img onerror>` payload.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PROMPT_BAR_POSITION_CLASS,
  PROMPT_FIELD_CLASS,
  PROMPT_FORM_LABEL_KEY,
  PROMPT_INPUT_LABEL_KEY,
  PROMPT_PLACEHOLDER_KEY,
  PromptBar,
  SEND_BUTTON_LABEL_KEY,
} from "../../app/components/chrome/prompt-bar";
import { SIDEBAR_WIDTH_CLASS } from "../../app/components/chrome/sidebar";
import { restoreMotionStubs, stubMatchMedia } from "./support/motion-harness";
import { t } from "./support/i18n";

/**
 * The component's source with comments stripped. Several checks below are about
 * what the code may NOT contain, and the doc comment legitimately names
 * `dangerouslySetInnerHTML`, `innerHTML` and `sticky` while explaining why none
 * of them is used here.
 */
const PROMPT_BAR_CODE = readFileSync(
  resolve(process.cwd(), "app/components/chrome/prompt-bar.tsx"),
  "utf8",
)
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

/** An XSS payload: harmless as text, an `onerror` handler as markup. */
const XSS_PAYLOAD = '<img src=x onerror="alert(1)">';

function bar(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="prompt-bar"]')!;
}

function field(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="prompt-field"]')!;
}

function input(): HTMLInputElement {
  return screen.getByRole("textbox", { name: t(PROMPT_INPUT_LABEL_KEY) });
}

function sendButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: t(SEND_BUTTON_LABEL_KEY) });
}

/** Every element inside the field, the input and the button included. */
function fieldDescendants(): HTMLElement[] {
  return [...field().querySelectorAll<HTMLElement>("*")];
}

afterEach(() => {
  restoreMotionStubs();
});

/* ----------------------------------------------------------- STRUCTURE --- */

describe("PromptBar — one field, nothing nested inside it (criterion 1)", () => {
  it("embeds the search icon, the input and the send button in one field", () => {
    render(<PromptBar />);

    // Direct children, in reading order: the icon, the typing area, send.
    const children = [...field().children];
    expect(children).toHaveLength(3);
    expect(children[0]!.tagName).toBe("svg");
    expect(children[1]).toBe(input());
    expect(children[2]).toBe(sendButton());
  });

  it("draws exactly one bordered box, and it is the field itself", () => {
    render(<PromptBar />);

    expect(field().className).toMatch(/\bborder\b/);

    // The defect this story was written against: a bordered box INSIDE the
    // field. Nothing in its subtree may carry a border or a ring of its own.
    // `getAttribute` rather than `className`, because an SVG's `className` is
    // an `SVGAnimatedString` and would stringify to nothing useful.
    for (const element of fieldDescendants()) {
      const classes = element.getAttribute("class") ?? "";
      expect(classes).not.toMatch(/\bborder(-|\b)/);
      expect(classes).not.toMatch(/\bring(-|\b)/);
    }
  });

  it("holds exactly one input and one button in the whole bar", () => {
    render(<PromptBar />);

    expect(bar().querySelectorAll("input")).toHaveLength(1);
    expect(bar().querySelectorAll("button")).toHaveLength(1);
    expect(bar().querySelectorAll("textarea")).toHaveLength(0);
  });

  it("shows the subtle focus ring on the field, on focus-within", () => {
    render(<PromptBar />);

    // The ring cannot live on the input — that would BE the inner box — so it
    // sits on the field and is triggered by focus anywhere inside it.
    expect(PROMPT_FIELD_CLASS).toContain("focus-within:shadow-focus");
    expect(PROMPT_FIELD_CLASS).toContain("focus-within:border-blue");
    expect(field()).toHaveClass("focus-within:shadow-focus");
  });

  it("suppresses the input's own outline, so focus reads as one ring", () => {
    render(<PromptBar />);

    expect(input()).toHaveClass("outline-none");
    expect(input().className).not.toMatch(/\bring/);
  });

  it("is not a chip, and does not borrow the 11px chip surface", () => {
    // `--radius-chip` and `.fcb-chip` belong to the segmented control and to
    // US-029's suggestion chips; a field wearing them makes "11px, not fully
    // rounded" mean nothing.
    render(<PromptBar />);

    expect(field()).toHaveClass("rounded-pill");
    expect(PROMPT_BAR_CODE).not.toMatch(/fcb-chip|CHIP_SURFACE_CLASS/);
    expect(PROMPT_BAR_CODE).not.toMatch(/rounded-chip/);
  });
});

/* ------------------------------------------------------------- GEOMETRY -- */

describe("PromptBar — always visible, never in the way", () => {
  it("is pinned to the foot of the viewport", () => {
    render(<PromptBar />);

    expect(bar()).toHaveClass("fixed", "bottom-0", "inset-x-0");
  });

  it("clears the sidebar at lg, using the sidebar's own width", () => {
    // One value, two files: the sidebar owns it and the bar restates it,
    // because Tailwind cannot extract a composed utility name.
    const step = SIDEBAR_WIDTH_CLASS.replace(/^w-/, "");

    expect(PROMPT_BAR_POSITION_CLASS).toContain(`lg:left-${step}`);
  });

  it("uses fixed positioning rather than sticky", () => {
    // A sticky bar resolves against the shell, which clips overflow and is
    // therefore a scroll container as tall as the dashboard: it would settle
    // at the bottom of the CONTENT, not of the screen.
    expect(PROMPT_BAR_CODE).toContain("fixed");
    expect(PROMPT_BAR_CODE).not.toMatch(/\bsticky\b/);
  });

  it("lets a caller add to its geometry without losing its own", () => {
    render(<PromptBar className="z-10" />);

    expect(bar()).toHaveClass("fixed", "bottom-0", "z-10");
  });

  it("declares no fixed pixel size, so it cannot force a sideways scroll", () => {
    expect(PROMPT_BAR_CODE).not.toMatch(/w-\[\d+px\]/);
    expect(PROMPT_BAR_CODE).not.toMatch(/min-w-\[\d+px\]/);
    expect(PROMPT_BAR_POSITION_CLASS).not.toMatch(/\bw-screen\b/);
  });
});

/* ---------------------------------------------------------------- FOCUS -- */

describe("PromptBar — the field is the typing area (criterion 2)", () => {
  it("focuses the input when the field's padding is pressed", async () => {
    const user = userEvent.setup();
    render(<PromptBar />);

    expect(input()).not.toHaveFocus();
    await user.click(field());

    expect(input()).toHaveFocus();
  });

  it("focuses the input when the decorative search icon is pressed", async () => {
    const user = userEvent.setup();
    render(<PromptBar />);

    await user.click(field().querySelector("svg")!);

    expect(input()).toHaveFocus();
  });

  it("leaves the send button's own press alone", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), "kit sales");
    await user.click(sendButton());

    // The press reached the button rather than being swallowed into a focus
    // move, which is what would happen if the field handled every press.
    expect(onSubmit).toHaveBeenCalledWith("kit sales");
  });

  it("keeps the keyboard path intact", async () => {
    const user = userEvent.setup();
    render(<PromptBar />);

    await user.tab();
    expect(input()).toHaveFocus();

    await user.tab();
    expect(sendButton()).toHaveFocus();
  });
});

/* --------------------------------------------------------- ACCESSIBILITY -- */

describe("PromptBar — accessibility", () => {
  it("names the input with a real label, not the placeholder", () => {
    render(<PromptBar />);

    expect(input()).toHaveAccessibleName(t(PROMPT_INPUT_LABEL_KEY));
    expect(input()).toHaveAttribute("placeholder", t(PROMPT_PLACEHOLDER_KEY));
    expect(document.querySelector("label")).toHaveClass("sr-only");
  });

  it("names the send button and hides its glyph", () => {
    render(<PromptBar />);

    expect(sendButton()).toHaveAccessibleName(t(SEND_BUTTON_LABEL_KEY));
    for (const glyph of field().querySelectorAll("svg")) {
      expect(glyph).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("exposes the bar as a named search region", () => {
    render(<PromptBar />);

    expect(screen.getByRole("search")).toHaveAccessibleName(
      t(PROMPT_FORM_LABEL_KEY),
    );
  });

  it("reports the busy state on the region it applies to", () => {
    render(<PromptBar busy />);

    expect(screen.getByRole("search")).toHaveAttribute("aria-busy", "true");
  });
});

/* --------------------------------------------------------------- SUBMIT -- */

describe("PromptBar — submitting (criterion 3)", () => {
  it("submits the typed question on Enter", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), "how are shirts selling{Enter}");

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("how are shirts selling");
  });

  it("submits the typed question from the embedded send button", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), "webshop revenue");
    await user.click(sendButton());

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("webshop revenue");
  });

  it("trims the question before handing it on", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), "   kit sales   {Enter}");

    expect(onSubmit).toHaveBeenCalledWith("kit sales");
  });

  it("clears the field once the question has been submitted", async () => {
    const user = userEvent.setup();
    render(<PromptBar onSubmit={vi.fn()} />);

    await user.type(input(), "kit sales{Enter}");

    expect(input()).toHaveValue("");
  });

  it("does nothing at all on an empty field, and keeps the chips", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <PromptBar onSubmit={onSubmit}>
        <button type="button">Kit sales</button>
      </PromptBar>,
    );

    await user.click(input());
    await user.keyboard("{Enter}");
    await user.click(sendButton());

    // A no-op: not an error, not a fallback, and nothing removed.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Kit sales" })).toBeVisible();
    expect(screen.getByRole("search")).toBeInTheDocument();
  });

  it("treats a whitespace-only field as empty", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), "    {Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    // The typing is left alone: nothing happened, so nothing was cleared.
    expect(input()).toHaveValue("    ");
  });

  it("survives having no handler attached at all", async () => {
    // The bar ships before the matcher does, exactly as Reset shipped before
    // US-015 supplied its behaviour.
    const user = userEvent.setup();
    render(<PromptBar />);

    await user.type(input(), "kit sales{Enter}");

    expect(input()).toHaveValue("");
    expect(screen.getByRole("search")).toBeInTheDocument();
  });

  it("renders the chip row above the field", () => {
    render(
      <PromptBar>
        <div data-testid="chips">chips</div>
      </PromptBar>,
    );

    const chips = screen.getByTestId("chips");
    expect(bar()).toContainElement(chips);
    expect(
      chips.compareDocumentPosition(field()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

/* ------------------------------------------------------------- DEBOUNCE -- */

describe("PromptBar — one render at a time (criterion 4)", () => {
  it("collapses three rapid Enter presses into one submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), "kit sales");
    await user.keyboard("{Enter}{Enter}{Enter}");

    // A submit CONSUMES the question, so the second and third presses land on
    // an empty field and take the no-op branch.
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("kit sales");
  });

  it("collapses rapid send presses into one submit", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), "kit sales");
    await user.tripleClick(sendButton());

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("refuses to submit at all while a render is in flight", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} busy />);

    expect(input()).toBeDisabled();
    expect(sendButton()).toBeDisabled();

    await user.click(sendButton());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("cannot start a second question while the first is still arriving", async () => {
    /**
     * The real shape of the criterion: US-031 latches `busy` for the length of
     * the thinking beat, so a presenter hammering Enter and the send button
     * gets ONE beat and one render. The latch here never releases, standing in
     * for a beat still in flight.
     */
    function Harness() {
      const [asked, setAsked] = useState<string[]>([]);

      return (
        <>
          <PromptBar
            busy={asked.length > 0}
            onSubmit={(question) => setAsked((all) => [...all, question])}
          />
          <output>{asked.length}</output>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Harness />);

    await user.type(input(), "kit sales");
    await user.keyboard("{Enter}{Enter}");
    await user.click(sendButton());
    await user.keyboard("{Enter}");

    expect(screen.getByRole("status")).toHaveTextContent("1");
  });

  it("ignores a submit that reaches the form by any other route while busy", async () => {
    // The field is `disabled` while a beat runs, so a press cannot get in.
    // This covers the other door: a submit event arriving from elsewhere in
    // the form with a question already typed. Belt and braces, because an
    // overlapping thinking indicator is the one failure a viewer would see.
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), "kit sales");
    rerender(<PromptBar onSubmit={onSubmit} busy />);
    fireEvent.submit(screen.getByRole("search"));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("adds no timer of its own — the dashboard owns the only one", () => {
    // US-015 built `schedule` / `cancelPending` around a single pending timer
    // so a beat cannot land in a dashboard that was just reset. A second clock
    // in here would sit outside that guarantee.
    expect(PROMPT_BAR_CODE).not.toMatch(/setTimeout|setInterval|debounce\(/);
  });
});

/* ------------------------------------------------------------- SECURITY -- */

describe("PromptBar — the only user input in the product", () => {
  it("carries an injected payload as a string, never as markup", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    await user.type(input(), XSS_PAYLOAD);
    expect(input()).toHaveValue(XSS_PAYLOAD);
    // Rendered as a value, so no element was created from it.
    expect(document.querySelector("img")).toBeNull();

    await user.click(sendButton());

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(XSS_PAYLOAD);
    expect(document.querySelector("img")).toBeNull();
    expect(document.body.innerHTML).not.toContain("onerror=");
  });

  it("never injects raw HTML", () => {
    expect(PROMPT_BAR_CODE).not.toMatch(/dangerouslySetInnerHTML/);
    expect(PROMPT_BAR_CODE).not.toMatch(/innerHTML|outerHTML|insertAdjacent/);
    expect(PROMPT_BAR_CODE).not.toMatch(/\beval\(|new Function\(/);
  });

  it("builds no URL, no request and no locator from the typed value", () => {
    // The single selector in the file is a fixed constant, and the prototype
    // makes no network call after load.
    expect(PROMPT_BAR_CODE).not.toMatch(/fetch\(|XMLHttpRequest|axios/);
    expect(PROMPT_BAR_CODE).not.toMatch(/href|window\.location|new URL\(/);
    expect(PROMPT_BAR_CODE).not.toMatch(/querySelector|getElementById/);
    expect(PROMPT_BAR_CODE.match(/closest\(/g)).toHaveLength(1);
    expect(PROMPT_BAR_CODE).toMatch(/closest\(INTERACTIVE_SELECTOR\)/);
  });

  it("keeps nothing — the question is handed on and dropped", async () => {
    const user = userEvent.setup();
    render(<PromptBar onSubmit={vi.fn()} />);

    await user.type(input(), "kit sales{Enter}");

    expect(input()).toHaveValue("");
    expect(PROMPT_BAR_CODE).not.toMatch(/localStorage|sessionStorage|cookie/);
    expect(PROMPT_BAR_CODE).not.toMatch(/console\./);
  });
});

/* --------------------------------------------------- MOTION AND TOKENS -- */

describe("PromptBar — reduced motion and token discipline", () => {
  it("depends on no animation, and still submits under reduced motion", async () => {
    stubMatchMedia(true);
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<PromptBar onSubmit={onSubmit} />);

    expect(field()).toBeVisible();
    await user.type(input(), "kit sales{Enter}");

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("kit sales");
  });

  it("declares no animation and reads no motion preference", () => {
    // Nothing here appears, moves or grows: the focus ring is a transition the
    // stylesheet's reduced-motion block already collapses to its end state.
    expect(PROMPT_BAR_CODE).not.toMatch(/animate-|fcb-enter|MOTION_CLASS/);
    expect(PROMPT_BAR_CODE).not.toMatch(/useReducedMotion|useGrow|useCountUp/);
  });

  it("contains no hex colour and no rgba anywhere in its code", () => {
    expect(PROMPT_BAR_CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(PROMPT_BAR_CODE).not.toMatch(/\brgba?\(/);
  });

  it("contains no arbitrary Tailwind value — every step is a token", () => {
    expect(PROMPT_BAR_CODE).not.toMatch(
      /(?:text|bg|rounded|shadow|border|p|px|py|gap)-\[/,
    );
  });

  it("contains no em dash or en dash in anything it renders", () => {
    for (const copy of [
      t(PROMPT_INPUT_LABEL_KEY),
      t(SEND_BUTTON_LABEL_KEY),
      t(PROMPT_FORM_LABEL_KEY),
      t(PROMPT_PLACEHOLDER_KEY),
    ]) {
      expect(copy).not.toMatch(/[–—]/);
    }
  });
});
