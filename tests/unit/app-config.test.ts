import { describe, expect, it } from "vitest";

import reactRouterConfig from "../../react-router.config";
import routes from "../../app/routes";

describe("react-router.config", () => {
  it("enables server-side rendering (framework mode)", () => {
    expect(reactRouterConfig.ssr).toBe(true);
  });

  /**
   * US-041. The default (`mode: "lazy"`) makes the hydrated bundle fetch
   * `/__manifest?paths=…` to discover routes — a real runtime request, found by
   * the offline suite's request log rather than by reading the source. With a
   * single route there is nothing to discover, and the prototype must survive
   * the venue Wi-Fi disappearing, so the manifest ships with the document.
   */
  it("ships the route manifest with the document, making no runtime request for it", () => {
    expect(reactRouterConfig.routeDiscovery).toEqual({ mode: "initial" });
  });
});

describe("app/routes", () => {
  it("declares a single index route backed by the placeholder module", () => {
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      index: true,
      file: "routes/_index.tsx",
    });
  });
});
