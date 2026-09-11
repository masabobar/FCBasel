/**
 * US-049 — **the language toggle, and the dashboard behind it.**
 *
 * The demo can be given in German. This suite drives the switch the way a
 * presenter does — one press in the app bar — and then checks that the words
 * around it actually changed: the chrome, the prepared questions, the empty
 * state, and an answer rendered after the switch.
 *
 * THREE PROPERTIES IT PROTECTS, each of which would be a live-room failure:
 *
 *   1. **The switch reaches everything.** The locale is context, not a prop
 *      threaded by hand, so a tile added later is translated by construction.
 *      A test that only checked the app bar would pass while the canvas stayed
 *      English.
 *   2. **Nothing is persisted.** `constraints.md` §2 forbids persistence
 *      across sessions and US-043's dead-end sweep asserts ZERO storage keys;
 *      a language preference is exactly the write that would break it.
 *   3. **`<html lang>` follows the copy.** The document is server-rendered in
 *      English, so switching has to correct the attribute — a screen reader
 *      picks its voice from it.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { BaselineRow } from "../../app/components/dashboard/baseline-row";
import {
  LANGUAGE_TOGGLE_LABEL_KEY,
  LanguageToggle,
} from "../../app/components/chrome/language-toggle";
import App from "../../app/root";
import { loadBaseline } from "../../app/lib/dashboard/baseline";
import { COUNT_UP_DURATION_MS } from "../../app/lib/hooks/use-motion";
import { Locale } from "../../app/lib/i18n";
import { createMockBaselineRepository } from "../../app/lib/mock/baseline";
import { HEROES } from "./support/hero-data";
import { de, renderIn } from "./support/i18n";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";
import { signIn } from "./support/sign-in";

const BASELINE = await loadBaseline(
  createMockBaselineRepository(() => new Date(2026, 8, 9, 9)),
  () => new Date(2026, 8, 9, 9),
);

afterEach(() => {
  restoreMotionStubs();
});

function renderApp() {
  stubMatchMedia(false);

  const mounted = render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<App loaderData={HEROES} />}>
          <Route index element={<p>child route</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  signIn();
  return mounted;
}

/**
 * The toggle, found by its slot rather than by its name — the name is itself
 * translated, so a lookup by text could only ever work in one language.
 */
function toggle(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="language-toggle"]')!;
}

async function switchTo(locale: Locale): Promise<void> {
  const label = locale === Locale.DE ? "DE" : "EN";
  await userEvent.click(within(toggle()).getByRole("radio", { name: label }));
}

/* --------------------------------------------------------------- CONTROL -- */

describe("LanguageToggle — the control itself", () => {
  it("is a radiogroup of exactly the two languages, English selected", () => {
    renderIn(Locale.EN, <LanguageToggle />);

    const options = screen.getAllByRole("radio");
    expect(options.map((option) => option.textContent)).toEqual(["EN", "DE"]);
    expect(options[0]).toHaveAttribute("aria-checked", "true");
    expect(options[1]).toHaveAttribute("aria-checked", "false");
  });

  it("marks the selected language in the markup as well as in the a11y tree", () => {
    renderIn(Locale.DE, <LanguageToggle />);

    const german = screen.getByRole("radio", { name: "DE" });
    expect(german).toHaveAttribute("aria-checked", "true");
    expect(german.dataset.selected).toBe("true");
    expect(german.dataset.locale).toBe("de");
  });

  it("names itself in the language on screen", () => {
    renderIn(Locale.DE, <LanguageToggle />);

    expect(
      screen.getByRole("radiogroup", { name: de(LANGUAGE_TOGGLE_LABEL_KEY) }),
    ).toBeInTheDocument();
    expect(de(LANGUAGE_TOGGLE_LABEL_KEY)).toBe("Sprache");
  });
});

/* ------------------------------------------------------------ THE SWITCH -- */

describe("one press switches the whole product", () => {
  it("translates the chrome: sidebar, status, Reset and the prompt bar", async () => {
    renderApp();

    expect(screen.getByText("Data Sources")).toBeInTheDocument();
    await switchTo(Locale.DE);

    expect(screen.getByText("Datenquellen")).toBeInTheDocument();
    expect(screen.getByText("Berichte")).toBeInTheDocument();
    expect(screen.getByText("Einstellungen")).toBeInTheDocument();
    expect(screen.getByText("Verbunden · 11 Systeme")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Zurücksetzen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Fragen Sie alles zur Performance des Clubs"),
    ).toBeInTheDocument();
  });

  it("translates the prepared questions and the empty state", async () => {
    renderApp();
    await switchTo(Locale.DE);

    expect(
      screen.getByRole("button", {
        name: "Trikotverkäufe nach Ausführung & Sponsorenbadges",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ihr Dashboard ist bereit")).toBeInTheDocument();
  });

  it("translates an answer the presenter asks for AFTER switching", async () => {
    renderApp();
    await switchTo(Locale.DE);

    await userEvent.click(
      screen.getByRole("button", { name: "Abteilungsbudgets vs. Ist-Werte" }),
    );

    // The section head takes the chip's own wording, so the answer's heading
    // is the question in the language it was asked in.
    // Past the thinking beat, which is real time here (~1150ms).
    expect(
      await screen.findByRole(
        "heading",
        { name: "Abteilungsbudgets vs. Ist-Werte" },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Abteilungsperformance (Gesamtjahr)"),
    ).toBeInTheDocument();
  });

  it("re-translates an answer that is ALREADY on the canvas", async () => {
    // The likelier demo: the room asks in English, someone asks for German,
    // and the answer already on screen has to follow rather than stay behind.
    renderApp();

    await userEvent.click(
      screen.getByRole("button", { name: "Ticket revenue, this year vs last" }),
    );
    expect(
      await screen.findByRole(
        "heading",
        { name: "Ticket revenue, this year vs last" },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();

    await switchTo(Locale.DE);

    expect(
      screen.getByRole("heading", {
        name: "Ticketeinnahmen, dieses Jahr vs. letztes Jahr",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ticketeinnahmen im Jahresvergleich"),
    ).toBeInTheDocument();
    // The narrative is the dataset's, so it moves with the rest.
    expect(
      screen.getByText(/Die Matchday-Ticketeinnahmen sind im Jahresvergleich/),
    ).toBeInTheDocument();
  });

  it("switches back, and the English is exactly what it was", async () => {
    renderApp();
    const before = screen.getByRole("banner").textContent;

    await switchTo(Locale.DE);
    expect(screen.getByRole("banner").textContent).not.toBe(before);

    await switchTo(Locale.EN);
    expect(screen.getByRole("banner").textContent).toBe(before);
  });
});

/* ------------------------------------------------------------- THE DATA -- */

describe("the dataset renders in either language from ONE set of figures", () => {
  it("translates the baseline tiles, and changes not one number", () => {
    // The KPI figures count up on animation frames, so both renders are
    // settled before they are compared.
    let frames = stubFrames();
    const english = renderIn(Locale.EN, <BaselineRow data={BASELINE} />);
    // Two advances: the first frame marks the start, the second lands.
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);
    const figures = (container: HTMLElement): string[] =>
      [...container.querySelectorAll('[data-slot="kpi-value"]')].map(
        (node) => node.textContent ?? "",
      );

    const englishFigures = figures(english.container);
    // Guard the guard: an empty list would make the comparison vacuous.
    expect(englishFigures).toEqual(["CHF 148’200", "28’900"]);
    expect(screen.getByText("Webshop revenue")).toBeInTheDocument();
    english.unmount();

    frames = stubFrames();
    const german = renderIn(Locale.DE, <BaselineRow data={BASELINE} />);
    // Two advances: the first frame marks the start, the second lands.
    frames.advance(COUNT_UP_DURATION_MS);
    frames.advance(COUNT_UP_DURATION_MS);
    expect(screen.getByText("Webshop-Umsatz")).toBeInTheDocument();
    expect(screen.getByText("Letztes Heimspiel")).toBeInTheDocument();
    expect(screen.getByText("Topprodukte")).toBeInTheDocument();
    expect(screen.getByText("Aktive Partner")).toBeInTheDocument();
    // Product names and partner roles come from the same dataset rows.
    expect(screen.getByText("Heimtrikot 26/27")).toBeInTheDocument();
    expect(screen.getByText("Haupt-Trikotsponsor")).toBeInTheDocument();

    // THE FIGURES ARE THE SAME OBJECT, so the German pass cannot restate one.
    expect(figures(german.container)).toEqual(englishFigures);
  });
});

/* ---------------------------------------------------- MEMORY-ONLY, LANG -- */

describe("the language is session state, and nothing more", () => {
  it("writes no cookie and no storage key", async () => {
    renderApp();
    await switchTo(Locale.DE);

    expect(document.cookie).toBe("");
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it("corrects the document language so a screen reader follows the copy", async () => {
    renderApp();
    expect(document.documentElement.lang).toBe("en");

    await switchTo(Locale.DE);
    expect(document.documentElement.lang).toBe("de");

    await switchTo(Locale.EN);
    expect(document.documentElement.lang).toBe("en");
  });
});
