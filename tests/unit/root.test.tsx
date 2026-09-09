import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import App, { Layout } from "../../app/root";

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
});

describe("App", () => {
  const originalScrollTo = window.scrollTo;

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    vi.restoreAllMocks();
  });

  function renderApp() {
    return render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<p>child route</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

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

  it("owns the dashboard state above both the canvas and the app bar", () => {
    // The sections render as siblings of the routed page inside the shell's
    // canvas, so an answer joins the same grid instead of replacing the view.
    expect(ROOT_SOURCE).toMatch(/useDashboard\(\)/);
    expect(ROOT_SOURCE).toMatch(
      /<InsightSections sections=\{sections\} focus=\{focus\} \/>/,
    );
    expect(ROOT_SOURCE.indexOf("<Outlet />")).toBeLessThan(
      ROOT_SOURCE.indexOf("<InsightSections"),
    );
  });

  it("wires the app bar's Reset to the dashboard's own reset", () => {
    // One implementation, one wiring point: the control is US-012's, the
    // behaviour is `useDashboard`'s, and this is where they meet (US-015).
    expect(ROOT_SOURCE).toMatch(/const \{[^}]*reset[^}]*\} = useDashboard\(\)/);
    expect(ROOT_SOURCE).toMatch(/<AppShell onReset=\{reset\}>/);
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
    expect(scrollTo).toHaveBeenCalledTimes(1);
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
