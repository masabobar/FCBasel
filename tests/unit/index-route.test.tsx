import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import Index, { loader, meta, shouldRevalidate } from "../../app/routes/_index";
import {
  BASELINE_TILE_ORDER,
  TOP_PRODUCTS_PERIOD_LABEL,
} from "../../app/components/dashboard/baseline-row";
import { HERO_BAND_PERIOD_LABEL } from "../../app/components/dashboard/hero-band";
import { type BaselineData } from "../../app/lib/dashboard/baseline";
import { WORKSPACE_LABEL } from "../../app/lib/persona";
import { baselineRepository } from "../../app/lib/repositories/index.server";

const ROUTE_SOURCE = readFileSync(
  resolve(process.cwd(), "app/routes/_index.tsx"),
  "utf8",
);

/**
 * The route component's props come from React Router's generated
 * `Route.ComponentProps` (`params`, `matches`, `loaderData`). Only `loaderData`
 * is read, so the rest are filled in once, here, rather than in every case.
 */
type IndexProps = Parameters<typeof Index>[0];

function props(loaderData: BaselineData): IndexProps {
  return { loaderData, params: {}, matches: [] } as unknown as IndexProps;
}

const DATA = await loader();

function renderRoute() {
  return render(<Index {...props(DATA)} />);
}

describe("index route — loader", () => {
  it("reads the baseline dashboard from the selected repository", async () => {
    const [partners, match] = await Promise.all([
      baselineRepository.partners(),
      baselineRepository.lastHomeMatch(),
    ]);

    expect(DATA.partners).toEqual(partners);
    expect(DATA.match).toEqual(match);
  });

  it("returns every figure the band and the four tiles need, and nothing else", () => {
    expect(Object.keys(DATA).sort()).toEqual([
      "band",
      "match",
      "partners",
      "topProducts",
      "webshop",
    ]);
  });

  it("returns plain serialisable data — nothing a loader cannot hand across", () => {
    expect(JSON.parse(JSON.stringify(DATA))).toEqual(DATA);
  });

  it("is the only place the server-only repository module is imported", () => {
    // Components receive data; they never reach for a repository themselves.
    expect(ROUTE_SOURCE).toContain("../lib/repositories/index.server");
    expect(ROUTE_SOURCE).toMatch(/loadBaseline\(baselineRepository\)/);
  });

  it("adds no HTTP surface — there is no action and no endpoint here", () => {
    expect(ROUTE_SOURCE).not.toMatch(/export\s+(async\s+)?function\s+action/);
    expect(ROUTE_SOURCE).not.toContain("fetch(");
    expect(ROUTE_SOURCE).not.toContain("Response");
  });
});

describe("index route — the baseline dashboard", () => {
  it("gives the single screen an h1 for the growing dashboard to hang off", () => {
    renderRoute();

    const heading = screen.getByRole("heading", {
      level: 1,
      name: `${WORKSPACE_LABEL} dashboard`,
    });
    expect(heading).toBeInTheDocument();
  });

  it("hides that heading visually — the app bar already shows the identity", () => {
    renderRoute();

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("sr-only");
  });

  it("names no individual — the heading is the workspace role", () => {
    renderRoute();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      `${WORKSPACE_LABEL} dashboard`,
    );
  });

  it("shows the four baseline tiles, so the canvas is never an empty one", () => {
    // The whole point of US-013: the dashboard already looks lived-in, and a
    // question ADDS to it. The insight sections a question inserts are still
    // rendered beside this route by `root.tsx` (US-014), not here.
    const { container } = renderRoute();

    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(4);
    expect(
      [...container.querySelectorAll('[data-slot="card"] h2')].map(
        (node) => node.textContent,
      ),
    ).toEqual([...BASELINE_TILE_ORDER]);
  });

  it("mounts the hero band ABOVE that row, as one grid item", () => {
    const { container } = renderRoute();

    const band = container.querySelector('[data-slot="hero-band"]')!;
    const firstTile = container.querySelector('[data-slot="card"]')!;

    expect(band).toBeInTheDocument();
    expect(
      band.compareDocumentPosition(firstTile) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // A grid ITEM, not a grid: it spans the canvas's columns and divides its
    // own padded interior.
    expect(band.className).toContain("col-span-full");
    expect(
      container.querySelectorAll('[data-slot="canvas-grid"]'),
    ).toHaveLength(0);
  });

  it("greets the persona with the string the loader resolved", () => {
    renderRoute();

    expect(
      screen.getByRole("heading", { level: 2, name: DATA.band.greeting }),
    ).toBeInTheDocument();
  });

  it("adds nothing to the canvas but the heading, the band and those four tiles", () => {
    const { container } = renderRoute();

    // The heading, the band, then four tiles — no wrapper, so every one of
    // them is a grid item of US-012's canvas.
    expect(container.childElementCount).toBe(6);
  });

  it("sets the document title", () => {
    expect(meta()).toEqual([{ title: "FC Basel Intelligence Platform" }]);
  });
});

describe("index route — the two period filters are independent", () => {
  it("shows both, each named for what it drives", () => {
    // Two radiogroups on one screen: the band's (chart + ring) and Top
    // Products'. "Period" twice would be ambiguous to anyone hearing it.
    renderRoute();

    const names = screen
      .getAllByRole("radiogroup")
      .map((group) => group.getAttribute("aria-label"));

    expect(names).toEqual([HERO_BAND_PERIOD_LABEL, TOP_PRODUCTS_PERIOD_LABEL]);
    expect(new Set(names).size).toBe(names.length);
  });

  it("leaves Top Products where it is when the band's period changes", async () => {
    // The band's ONE control drives its own two widgets — deliberately not the
    // whole dashboard: a presenter may compare this month's best sellers with
    // a year-to-date revenue trend.
    const user = userEvent.setup();
    renderRoute();

    const [bandFilter, productsFilter] = screen.getAllByRole("radiogroup");
    const productsBefore = within(productsFilter!).getByRole("radio", {
      checked: true,
    }).textContent;

    await user.click(
      within(bandFilter!).getAllByRole("radio", { checked: false })[0]!,
    );

    expect(
      within(productsFilter!).getByRole("radio", { checked: true }),
    ).toHaveTextContent(productsBefore!);
  });
});

/**
 * US-041. The baseline figures are bundled, so this route declines to
 * revalidate too — the request only disappears when BOTH matched routes do.
 * See the note in `app/routes/_index.tsx`: offline, the revalidation a press on
 * the sidebar's Dashboard link triggered took the whole dashboard down with it.
 */
describe("shouldRevalidate", () => {
  it("declines to re-fetch bundled baseline data", () => {
    expect(
      shouldRevalidate({
        currentUrl: new URL("http://localhost/"),
        currentParams: {},
        nextUrl: new URL("http://localhost/"),
        nextParams: {},
        defaultShouldRevalidate: true,
      } as Parameters<typeof shouldRevalidate>[0]),
    ).toBe(false);
  });
});
