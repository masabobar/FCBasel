import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { AppShell } from "./components/chrome/app-shell";
import { PromptBar } from "./components/chrome/prompt-bar";
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
 * THE PROMPT BAR IS MOUNTED, ITS MEANING IS NOT (US-028). The bar renders and
 * behaves — Enter submits, the embedded button submits, an empty field does
 * nothing — with no handler attached, exactly as `TopBar`'s Reset did before
 * US-015 supplied one. Three props finish it, and each belongs to a later
 * story: `onSubmit` (US-030's matcher, calling `showHero` / `showFollowUp`),
 * `busy` (US-031, while the thinking beat scheduled through `schedule` is in
 * flight) and `children` (US-029's suggestion chips, derived from `sections`).
 *
 * `key={generation}` IS THE RESET WIRING. A half-typed question is the one
 * piece of state that cannot be derived from `sections`, which is precisely
 * what `useDashboard`'s `generation` counter exists for: it advances on every
 * Reset, so the bar remounts with an empty field and the presenter is not left
 * with the previous run's typing in front of a freshly cleared dashboard.
 */
export default function App() {
  const { sections, focus, generation, reset } = useDashboard();

  return (
    <AppShell onReset={reset} promptBar={<PromptBar key={generation} />}>
      <Outlet />
      <InsightSections sections={sections} focus={focus} />
    </AppShell>
  );
}
