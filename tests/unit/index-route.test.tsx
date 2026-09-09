import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import Index, { loader, meta } from "../../app/routes/_index";
import { BASELINE_TILE_ORDER } from "../../app/components/dashboard/baseline-row";
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

  it("returns every figure the four tiles need, and nothing else", () => {
    expect(Object.keys(DATA).sort()).toEqual([
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
      [...container.querySelectorAll("h2")].map((node) => node.textContent),
    ).toEqual([...BASELINE_TILE_ORDER]);
  });

  it("adds nothing to the canvas but the heading and those four tiles", () => {
    const { container } = renderRoute();

    // The heading plus four tiles — no wrapper, so every tile is a grid item.
    expect(container.childElementCount).toBe(5);
  });

  it("sets the document title", () => {
    expect(meta()).toEqual([{ title: "FC Basel Intelligence Platform" }]);
  });
});
