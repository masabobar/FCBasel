import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { Crest } from "./components/chrome/crest";

import "./app.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      {/*
       * Minimal app bar — the crest only. The full shell (sidebar, workspace
       * label, connection status, avatar, Reset) is US-012 in Phase 2a and
       * grows from this header; do not build it here.
       */}
      <header className="flex h-14 items-center border-b border-border bg-bg px-4">
        <Crest />
      </header>
      <Outlet />
    </>
  );
}
