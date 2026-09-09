import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { AppShell } from "./components/chrome/app-shell";

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
    /*
     * The routed page renders as grid items inside the shell's canvas, so a
     * hero section inserted by US-014 joins the same grid as the baseline
     * tiles instead of replacing the view. Reset's behaviour is US-015: it
     * will own the dashboard state here and pass `onReset` down.
     */
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
