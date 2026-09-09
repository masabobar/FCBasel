import { describe, expect, it } from "vitest";

import reactRouterConfig from "../../react-router.config";
import routes from "../../app/routes";

describe("react-router.config", () => {
  it("enables server-side rendering (framework mode)", () => {
    expect(reactRouterConfig.ssr).toBe(true);
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
