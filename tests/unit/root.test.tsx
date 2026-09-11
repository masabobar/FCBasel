import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PROMPT_BAR_CLEARANCE_CLASS } from "../../app/components/chrome/app-shell";
import { PROMPT_INPUT_LABEL_KEY } from "../../app/components/chrome/prompt-bar";
import { InsightPhase } from "../../app/lib/dashboard/sections";
import { HeroId } from "../../app/lib/repositories/enums";
import App, { Layout, shouldRevalidate } from "../../app/root";
import { HEROES } from "./support/hero-data";
import { settleThinkingBeat } from "./support/thinking-harness";
import { signIn } from "./support/sign-in";
import { t } from "./support/i18n";

const ROOT_SOURCE = readFileSync(
  resolve(process.cwd(), "app/root.tsx"),
  "utf8",
);

type AnyElement = ReactElement<Record<string, unknown>>;

function flatten(node: unknown): AnyElement[] {
  if (Array.isArray(node)) return node.flatMap(flatten);
  if (node === null || typeof node !== "object") return [];
  const element = node as AnyElement;
  if (!("type" in element)) return [];
  return [element, ...flatten(element.props.children)];
}

describe("Layout", () => {
  // Layout renders the SSR document shell (<html>/<head>/<body>), which cannot
  // be mounted into a jsdom container, so the returned tree is inspected.
  const tree = Layout({ children: "page content" }) as ReactElement<{
    lang: string;
  }>;
  const nodes = flatten(tree);

  it("renders an English html document", () => {
    expect(tree.type).toBe("html");
    expect(tree.props.lang).toBe("en");
  });

  it("declares the charset and viewport meta tags", () => {
    const metas = nodes.filter((node) => node.type === "meta");
    expect(metas).toHaveLength(2);
    expect(metas.map((meta) => meta.props)).toEqual([
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ]);
  });

  it("places the page content inside the body", () => {
    const body = nodes.find((node) => node.type === "body");
    expect(body).toBeDefined();
    expect((body!.props.children as unknown[])[0]).toBe("page content");
  });

  it("renders NO ScrollRestoration — KL-3, closed by US-043", () => {
    // Half of the fix. The component replayed the previous session's scroll
    // offset into a freshly cleared baseline (`scrollY 185` at 1920x1080),
    // and its `pagehide` handler put the mode back to `auto` on the way out,
    // so `manual` alone could not have closed it. Nothing is lost: one route,
    // no revalidation, no derived scroll state.
    const names = nodes.map((node) =>
      typeof node.type === "function" ? node.type.name : String(node.type),
    );
    // The rendered tree, not a substring scan: `disableScrollRestoration` is
    // the OTHER half of the fix and the docblock above explains the removal,
    // so both share the word. What must be gone is the ELEMENT — and the
    // import that would let it back in.
    expect(names).not.toContain("ScrollRestoration");
    const imported = /import \{([\s\S]*?)\} from "react-router"/.exec(
      ROOT_SOURCE,
    )?.[1];
    expect(imported, "root no longer imports from react-router").toBeDefined();
    expect(imported!.split(",").map((name) => name.trim())).not.toContain(
      "ScrollRestoration",
    );
  });
});

describe("App", () => {
  const originalScrollTo = window.scrollTo;

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    vi.restoreAllMocks();
  });

  function renderApp() {
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
   * THE COSMETIC GATE STANDS IN FRONT OF ALL OF IT. Decorative by
   * `constraints.md` §2, so what is asserted here is not a security property
   * but the two facts a demo depends on: the dashboard is genuinely absent
   * until the gate is cleared, and clearing it is what puts the shell up. Every
   * other suite in this project reaches the dashboard through `signIn()`, so
   * this is the one place the closed state is looked at directly.
   */
  describe("the cosmetic sign-in gate", () => {
    function mountGated() {
      return render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<App loaderData={HEROES} />}>
              <Route index element={<p>child route</p>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
    }

    it("shows the login screen and no dashboard before sign-in", () => {
      mountGated();

      expect(
        document.querySelector('[data-slot="login-card"]'),
      ).toBeInTheDocument();
      expect(document.querySelector('[data-slot="app-shell"]')).toBeNull();
      expect(document.querySelector('[data-slot="sidebar"]')).toBeNull();
      expect(screen.queryByText("child route")).toBeNull();
    });

    it("replaces itself with the shell once the credential is accepted", () => {
      mountGated();
      signIn();

      expect(document.querySelector('[data-slot="login-card"]')).toBeNull();
      expect(
        document.querySelector('[data-slot="app-shell"]'),
      ).toBeInTheDocument();
      expect(screen.getByText("child route")).toBeInTheDocument();
    });

    /**
     * MEMORY-ONLY, AND THAT IS THE POINT. US-043 closed KL-3 by making
     * memory-only literally true of browser storage, and the dead-end sweep
     * asserts zero `sessionStorage` keys. Remembering a sign-in is exactly the
     * write that assertion exists to catch.
     */
    it("writes nothing to browser storage", () => {
      mountGated();
      signIn();

      expect(sessionStorage.length).toBe(0);
      expect(localStorage.length).toBe(0);
      expect(document.cookie).toBe("");
    });
  });

  it("renders the matched child route through the outlet", () => {
    renderApp();

    expect(screen.getByText("child route")).toBeInTheDocument();
  });

  it("mounts the branded shell around the routed page", () => {
    renderApp();

    const shell = document.querySelector('[data-slot="app-shell"]');
    expect(shell).toBeInTheDocument();
    expect(document.querySelector('[data-slot="sidebar"]')).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders the routed page as a grid item on the canvas", () => {
    renderApp();

    // US-014 inserts hero sections as siblings here, so the dashboard grows
    // inside the same grid instead of the view being replaced.
    const grid = document.querySelector('[data-slot="canvas-grid"]')!;
    expect(grid).toContainElement(screen.getByText("child route"));
  });

  it("starts the session with no insight section on the canvas", () => {
    // Memory-only state: a load (and therefore a reload) starts empty.
    renderApp();

    expect(
      document.querySelectorAll('[data-slot="insight-section"]'),
    ).toHaveLength(0);
  });

  it("takes scroll restoration off the browser on mount — KL-3", () => {
    // The other half of the fix. Memory-only state means a reload starts a
    // fresh session, so the offset must not survive it either; the mode is a
    // property of the history entry, so setting it once on mount covers the
    // reload that follows. `tests/e2e/transition-timing.spec.ts` proves the
    // effect end to end by really scrolling and really reloading.
    window.history.scrollRestoration = "auto";

    renderApp();

    expect(window.history.scrollRestoration).toBe("manual");
  });

  it("owns the dashboard state above both the canvas and the app bar", () => {
    // The sections render as siblings of the routed page inside the shell's
    // canvas, so an answer joins the same grid instead of replacing the view.
    expect(ROOT_SOURCE).toMatch(/useDashboard\(\)/);
    expect(ROOT_SOURCE).toMatch(
      /<InsightSections\s+sections=\{sections\}\s+heroes=\{loaderData\}\s+focus=\{focus\}\s*\/>/,
    );
    expect(ROOT_SOURCE.indexOf("<Outlet />")).toBeLessThan(
      ROOT_SOURCE.indexOf("<InsightSections"),
    );
  });

  it("wires the app bar's Reset to the dashboard's own reset", () => {
    // One implementation, one wiring point: the control is US-012's, the
    // behaviour is `useDashboard`'s, and this is where they meet (US-015).
    // The hook is now held as a value as well as destructured, because US-031's
    // `useThinking` takes the whole state; `reset` is still the hook's own.
    expect(ROOT_SOURCE).toMatch(/const dashboard = useDashboard\(\);/);
    expect(ROOT_SOURCE).toMatch(/const \{[^}]*reset[^}]*\} = dashboard;/);
    expect(ROOT_SOURCE).toMatch(/<AppShell\s+onReset=\{reset\}/);
  });

  it("presses Reset on a baseline dashboard without breaking the screen", async () => {
    // Nothing to reset is the state the demo starts in, so the very first
    // press a presenter can make must be a safe no-op.
    const scrollTo = vi.fn();
    Object.assign(window, { scrollTo });
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(
      document.querySelectorAll('[data-slot="insight-section"]'),
    ).toHaveLength(0);
    expect(screen.getByText("child route")).toBeInTheDocument();
    // Two requests per press since US-045: "stop where you are", which aborts
    // any stale smooth scroll, then the glide to the top (`app/lib/motion.ts`).
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ top: 0 }),
    );
  });

  it("mounts the persistent prompt bar below the canvas", () => {
    // US-028: the bar is part of the frame, and it is the LAST thing on the
    // page so the canvas keeps the tab order it had.
    renderApp();

    const bar = document.querySelector('[data-slot="prompt-bar"]')!;
    expect(bar).toBeInTheDocument();
    expect(
      screen.getByRole("main").compareDocumentPosition(bar) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("reserves the strip the pinned bar covers, so no tile hides under it", () => {
    renderApp();

    expect(screen.getByRole("main")).toHaveClass(PROMPT_BAR_CLEARANCE_CLASS);
  });

  it("clears a half-typed question when Reset is pressed", async () => {
    // `generation` is `useDashboard`'s extension point for state it cannot
    // derive, and a half-typed prompt is exactly that: the bar is keyed on it,
    // so Reset takes the typing with it (US-015 × US-028).
    Object.assign(window, { scrollTo: vi.fn() });
    const user = userEvent.setup();
    renderApp();

    const input = screen.getByRole("textbox", {
      name: t(PROMPT_INPUT_LABEL_KEY),
    });
    await user.type(input, "kit sales");
    expect(input).toHaveValue("kit sales");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(
      screen.getByRole("textbox", { name: t(PROMPT_INPUT_LABEL_KEY) }),
    ).toHaveValue("");
  });

  it("wires the prompt bar's onSubmit to the intent matcher (US-030)", () => {
    // The TYPED path. A chip tap resolves by type through `selectChip`; a typed
    // question is a string and goes through `askQuestion`, which is the only
    // thing in the app that scores text.
    expect(ROOT_SOURCE).toMatch(/onSubmit=\{\(question\) => \{/);
    // The actions are US-031's beat-wrapped pair (`useThinking`), which is
    // structurally the same `ChipActions` the matcher always took.
    expect(ROOT_SOURCE).toMatch(/askQuestion\(question, actions\)/);
  });

  it("answers a typed paraphrase with the hero it resolves to", async () => {
    // The live moment the whole prototype protects: off-script wording, typed,
    // and the right hero arrives — after US-031's thinking beat.
    const user = userEvent.setup();
    renderApp();

    await user.type(
      screen.getByRole("textbox", { name: t(PROMPT_INPUT_LABEL_KEY) }),
      "how are shirts selling{Enter}",
    );
    await settleThinkingBeat();

    const sections = document.querySelectorAll('[data-slot="insight-section"]');
    expect(sections).toHaveLength(1);
    expect(sections[0]).toHaveAttribute("data-hero-id", HeroId.HERO_1);
    expect(sections[0]).toHaveAttribute("data-phase", InsightPhase.PRIMARY);
  });

  it("renders exactly ONE section for a question that names two heroes", async () => {
    // Criterion 4: two heroes never render from one input. "shirt ticket
    // budget" ties all three heroes at 2, and Hero 1 takes the tie.
    const user = userEvent.setup();
    renderApp();

    await user.type(
      screen.getByRole("textbox", { name: t(PROMPT_INPUT_LABEL_KEY) }),
      "shirt ticket budget{Enter}",
    );
    await settleThinkingBeat();

    const sections = document.querySelectorAll('[data-slot="insight-section"]');
    expect(sections).toHaveLength(1);
    expect(sections[0]).toHaveAttribute("data-hero-id", HeroId.HERO_1);
  });

  it("sharpens the section in place when a follow-up is typed", async () => {
    const user = userEvent.setup();
    renderApp();
    const input = screen.getByRole("textbox", {
      name: t(PROMPT_INPUT_LABEL_KEY),
    });

    await user.type(input, "department budgets{Enter}");
    await settleThinkingBeat();
    await user.type(input, "why is marketing high?{Enter}");
    await settleThinkingBeat();

    const sections = document.querySelectorAll('[data-slot="insight-section"]');
    expect(sections).toHaveLength(1);
    expect(sections[0]).toHaveAttribute("data-hero-id", HeroId.HERO_3);
    expect(sections[0]).toHaveAttribute(
      "data-phase",
      InsightPhase.WITH_FOLLOW_UP,
    );
  });

  it("answers an off-script question with the fallback panel", async () => {
    // No match is not an error and not a dead end: nothing is removed, and
    // US-032's panel re-offers the prepared questions on the canvas as well as
    // in the row above the field — hence two of each chip.
    // `tests/unit/graceful-fallback.test.tsx` owns the panel itself.
    const user = userEvent.setup();
    renderApp();

    await user.type(
      screen.getByRole("textbox", { name: t(PROMPT_INPUT_LABEL_KEY) }),
      "show me player injuries{Enter}",
    );

    expect(
      document.querySelectorAll('[data-slot="insight-section"]'),
    ).toHaveLength(0);
    expect(screen.getByText("child route")).toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="fallback-panel"]'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Shirt sales by kit/ }),
    ).toHaveLength(2);
  });

  it("treats a script payload as an ordinary unmatched question", async () => {
    // A03: the typed string is scored and discarded. It never becomes markup,
    // so the payload creates no element and resolves to no hero.
    const user = userEvent.setup();
    renderApp();

    await user.type(
      screen.getByRole("textbox", { name: t(PROMPT_INPUT_LABEL_KEY) }),
      '<img src=x onerror="alert(1)">{Enter}',
    );

    expect(document.querySelector("img[src='x']")).toBeNull();
    expect(
      document.querySelectorAll('[data-slot="insight-section"]'),
    ).toHaveLength(0);
  });

  it("renders the crest as the first item of the app bar", () => {
    renderApp();

    const appBar = screen.getByRole("banner");
    const crest = screen.getByRole("img", { name: "FC Basel 1893" });

    expect(appBar).toContainElement(crest);
    expect(appBar.firstElementChild).toBe(crest);
    expect(crest).toHaveAttribute("height", "32");
  });

  it("puts the app bar above the routed page content", () => {
    const { container } = renderApp();

    const appBar = screen.getByRole("banner");
    const page = screen.getByText("child route");

    expect(container.firstElementChild).toBe(
      document.querySelector('[data-slot="app-shell"]'),
    );
    expect(
      appBar.compareDocumentPosition(page) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

/**
 * US-041 — the revalidation opt-out.
 *
 * The sidebar's Dashboard row is a `<Link to="/">` and the presenter is always
 * already on that route, so a press is a same-URL navigation. React Router
 * revalidates one of those by default, and the offline suite measured the
 * consequence: `GET /_root.data` failed with the network severed, the
 * navigation errored, and the entire dashboard was replaced by an error
 * boundary. The data is bundled and static, so a re-fetch could never have
 * learned anything — declining is both the fix and the truth.
 *
 * Asserted per route rather than only end to end, because React Router's single
 * fetch skips the request only when NO matched route asks to revalidate: one of
 * the two silently returning `true` again would bring the request back.
 */
describe("shouldRevalidate", () => {
  const revalidationArgs = (from: string, to: string) =>
    ({
      currentUrl: new URL(from),
      currentParams: {},
      nextUrl: new URL(to),
      nextParams: {},
      defaultShouldRevalidate: true,
    }) as Parameters<typeof shouldRevalidate>[0];

  it("declines to re-fetch on a same-URL navigation", () => {
    expect(
      shouldRevalidate(
        revalidationArgs("http://localhost/", "http://localhost/"),
      ),
    ).toBe(false);
  });

  it("declines even when React Router would default to revalidating", () => {
    // `defaultShouldRevalidate` is `true` above: the opt-out is unconditional,
    // not a pass-through of the framework's own opinion.
    expect(
      shouldRevalidate(
        revalidationArgs("http://localhost/", "http://localhost/?x=1"),
      ),
    ).toBe(false);
  });
});
