import type { Config } from "@react-router/dev/config";

export default {
  // Framework mode with server-side rendering. The prototype is delivered as a
  // Railway-hosted SSR app served by @react-router/serve.
  ssr: true,

  /**
   * NO LAZY ROUTE DISCOVERY — the one runtime fetch US-041 found and closed.
   *
   * React Router's default `routeDiscovery.mode: "lazy"` marks every `<Link>`
   * with `data-discover="true"` and, on hydration, asks the server for
   * `GET /__manifest?paths=%2F&version=…` so it can discover routes the
   * initial payload did not carry. `tests/e2e/offline-resilience.spec.ts`
   * caught it in the request log: a real `fetch` against a real endpoint, made
   * by the shipped bundle, which no amount of grepping the application source
   * for `fetch` would ever have surfaced.
   *
   * It is pointless here and it is a liability. There is exactly ONE route
   * (`app/routes.ts`), so there is nothing to discover — the manifest the
   * request fetches describes the route already in the document. And the
   * prototype's hardest constraint is that it "must run without any live
   * network dependency once loaded, so venue Wi-Fi can never break the demo":
   * a connection that drops while the page is still hydrating would leave that
   * request failing and a console error in front of the room.
   *
   * `mode: "initial"` ships the whole (single-route) manifest with the initial
   * HTML instead, so the request is never made and the request count after
   * first paint is a true zero. `tests/unit/app-config.test.ts` pins it, and
   * the offline suite fails on any future request at all — so this cannot be
   * silently reverted.
   */
  routeDiscovery: { mode: "initial" },
} satisfies Config;
