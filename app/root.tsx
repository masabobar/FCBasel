import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { AppShell } from "./components/chrome/app-shell";
import { InsightSections } from "./components/heroes/insight-sections";
import { useDashboard } from "./lib/dashboard/use-dashboard";

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

/**
 * The application root owns the dashboard's session state.
 *
 * It sits above both halves of the growing screen — the canvas the sections
 * render into, and the app-bar and prompt-bar controls that will drive and
 * clear them — which is why `useDashboard` lives here rather than in the route
 * (`technical-spec.md` §4.3).
 *
 * The routed page and the inserted sections are siblings inside the shell's
 * canvas, so both are grid items on the SAME grid: an answer joins the
 * dashboard instead of replacing the view. It grows; it never clears.
 *
 * The app bar's Reset is wired straight to the hook's `reset` (US-015): the
 * control renders in `TopBar`, the behaviour lives in `useDashboard`, and this
 * is the one place the two meet.
 *
 * Still to be wired here: the prompt bar and suggestion chips (US-028 to
 * US-033, to `showHero` / `showFollowUp`, and to `schedule` for the thinking
 * beat so Reset cancels it).
 */
export default function App() {
  const { sections, focus, reset } = useDashboard();

  return (
    <AppShell onReset={reset}>
      <Outlet />
      <InsightSections sections={sections} focus={focus} />
    </AppShell>
  );
}
