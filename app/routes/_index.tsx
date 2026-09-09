import { WORKSPACE_LABEL } from "../lib/persona";

export function meta() {
  return [{ title: "FC Basel Intelligence Platform" }];
}

/**
 * The single dashboard route.
 *
 * The chrome around it — navy sidebar, app bar, and the 12-column canvas grid
 * this renders into — is the US-012 shell in `app/components/chrome/`. What
 * this route returns becomes grid items on that canvas, and it is deliberately
 * empty apart from the page heading: US-013 adds the four baseline tiles, and
 * the insight sections a question inserts are rendered as siblings of this
 * route by `app/root.tsx`, which owns the session state (US-014).
 *
 * The heading is visually hidden because the app bar already shows the crest
 * and the workspace label; a real `h1` still has to exist so the headings a
 * growing dashboard adds (`h2` per hero section, `h3` per tile) hang off a
 * proper document outline.
 */
export default function Index() {
  return (
    <>
      <h1 className="sr-only">{WORKSPACE_LABEL} dashboard</h1>
      {/* US-013 baseline tiles and US-014 hero sections mount alongside. */}
    </>
  );
}
