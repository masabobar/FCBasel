import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { AppShell } from "./components/chrome/app-shell";
import { PromptBar } from "./components/chrome/prompt-bar";
import { SuggestionChips } from "./components/chrome/suggestion-chips";
import { InsightSections } from "./components/heroes/insight-sections";
import { ThinkingPanel } from "./components/heroes/thinking-panel";
import { selectChip, suggestionChips } from "./lib/dashboard/chips";
import { askQuestion } from "./lib/dashboard/intents";
import { useDashboard } from "./lib/dashboard/use-dashboard";
import { useThinking } from "./lib/dashboard/use-thinking";

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
 * THE PROMPT BAR IS MOUNTED, AND ALL OF ITS SEAMS ARE NOW FILLED.
 * US-028 mounted the bar with three seams named; US-029 filled `children` with
 * the suggestion-chip row, US-030 filled `onSubmit`, and US-031 fills the last
 * one, `busy` — set while a thinking beat is in flight, so the field and the
 * send button are closed and no second question can start an overlapping
 * render. The chips are DERIVED from `sections` by `suggestionChips` rather
 * than kept in state of their own — which is what makes US-015 criterion 2
 * hold without a line of reset logic: Reset restores `BASELINE_SECTIONS`, the
 * derivation runs again, and the row is back to exactly the three hero chips.
 *
 * EVERY ANSWER ARRIVES THROUGH THE BEAT (US-031). `useThinking` wraps the
 * hook's two actions in the staged pause and hands back a `ChipActions` — the
 * interface `askQuestion` and `selectChip` already take — so a tapped chip and
 * a typed question both wait, and neither module changed to make that true. The
 * panel it puts up is the LAST grid item on the canvas, below the sections, so
 * the answer appears exactly where the thinking was. An unmatched question
 * shows no beat at all: `askQuestion` returns `null` without calling either
 * action.
 *
 * A CHIP TAP AND A TYPED QUESTION ARE TWO DIFFERENT PATHS, and this is the one
 * place both are visible. A chip carries the hero it means, so `selectChip`
 * calls `showHero` / `showFollowUp` straight away — no normalising, no keyword
 * scoring, no threshold (US-029 criterion 2). A typed question is a `string`
 * and goes through `askQuestion`, which normalises it, scores it against the
 * static intent config and resolves at most ONE hero (US-030). The two paths
 * meet only at the two dashboard actions they both end in, and they are kept
 * apart BY TYPE: neither function will accept the other's argument.
 *
 * AN OFF-SCRIPT QUESTION IS NOT AN ERROR HERE. `askQuestion` returns `null`
 * when nothing clears its threshold, and today that leaves the canvas exactly
 * as it was — the chips above the field are still the way forward. US-032 hangs
 * the fallback panel on that same return value.
 *
 * `key={generation}` IS THE RESET WIRING. A half-typed question is the one
 * piece of state that cannot be derived from `sections`, which is precisely
 * what `useDashboard`'s `generation` counter exists for: it advances on every
 * Reset, so the bar remounts with an empty field and the presenter is not left
 * with the previous run's typing in front of a freshly cleared dashboard. The
 * chips inside it need no such help — they are derived.
 */
export default function App() {
  const dashboard = useDashboard();
  const { sections, focus, generation, reset } = dashboard;
  const { beat, busy, actions } = useThinking(dashboard);

  return (
    <AppShell
      onReset={reset}
      promptBar={
        <PromptBar
          key={generation}
          busy={busy}
          onSubmit={(question) => {
            askQuestion(question, actions);
          }}
        >
          <SuggestionChips
            chips={suggestionChips(sections)}
            onSelect={(chip) => selectChip(chip, actions)}
          />
        </PromptBar>
      }
    >
      <Outlet />
      <InsightSections sections={sections} focus={focus} />
      {beat && <ThinkingPanel beat={beat} />}
    </AppShell>
  );
}
