import { createRequestHandler } from "@react-router/express";
import express from "express";

import { basicAuth, readAuthConfig } from "./server/basic-auth.js";

/**
 * The production server.
 *
 * WHY THIS FILE EXISTS AT ALL — it replaces `react-router-serve`. That binary
 * is a closed pipeline with no place to put middleware, and the deployment
 * needs exactly one thing in front of everything it serves: the Basic
 * authentication gate (`server/basic-auth.js`). Mounting the gate before
 * `express.static` is the entire reason for the swap, because the alternative
 * (gating inside the app, at `entry.server`) leaves `build/client/assets/*.js`
 * public — and that bundle carries the seeded FC Basel figures.
 *
 * IT IS PLAIN ESM JAVASCRIPT, DELIBERATELY. A TypeScript server would need
 * either a build step of its own or `tsx` at runtime, and `tsx` is a
 * devDependency — a production install that prunes dev dependencies would
 * leave the service unable to boot. Node runs this file as-is.
 *
 * ORDER IS THE SECURITY PROPERTY HERE. Read the `app.use` calls below as a
 * sequence: the gate is first, so nothing after it is reachable unauthenticated.
 * Anything added later must go BELOW the gate unless it is deliberately public.
 */

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const BUILD = await import("./build/server/index.js");

const app = express();

/**
 * ONE hop of proxy is trusted, not all of them. Railway terminates TLS and
 * forwards, so the client address arrives in `X-Forwarded-For`; without this,
 * every request would appear to come from the proxy and the attempt limiter
 * would count the whole internet as one client. Trusting the header blindly
 * (`true`) would be worse than not trusting it at all — anyone could spoof the
 * address and sidestep the limiter by rotating it.
 */
app.set("trust proxy", 1);

/** Express advertises itself by default; there is no reason to help a scanner. */
app.disable("x-powered-by");

/* ------------------------------------------------------------- THE GATE -- */

/**
 * Throws, and is meant to, when production is missing its credential — see
 * `readAuthConfig`. A deployment that boots unprotected because a variable was
 * forgotten is the failure this refuses to allow.
 */
const auth = readAuthConfig(process.env, { production: IS_PRODUCTION });

if (auth) {
  app.use(
    basicAuth(auth, {
      // Structured, and carrying no part of the credential
      // (`error-handling-and-logging.md` §3.4).
      log: (event) => console.warn(JSON.stringify(event)),
    }),
  );
  console.log("Site authentication: ENABLED");
} else {
  console.log("Site authentication: disabled (no credential configured)");
}

/* --------------------------------------------------------- STATIC FILES -- */

/**
 * Fingerprinted assets may be cached forever; everything else in the client
 * build may not. This mirrors what `react-router-serve` did before the swap, so
 * the caching behaviour the Chrome suites measured is unchanged.
 */
app.use(
  "/assets",
  express.static("build/client/assets", {
    immutable: true,
    maxAge: "1y",
  }),
);

app.use(express.static("build/client", { maxAge: "1h" }));

/* ------------------------------------------------------------- THE APP -- */

app.all("*", createRequestHandler({ build: BUILD }));

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
