import { BaselineRow } from "../components/dashboard/baseline-row";
import { HeroBand } from "../components/dashboard/hero-band";
import { loadBaseline } from "../lib/dashboard/baseline";
import { WORKSPACE_LABEL } from "../lib/persona";
import { baselineRepository } from "../lib/repositories/index.server";
import type { Route } from "./+types/_index";

export function meta() {
  return [{ title: "FC Basel Intelligence Platform" }];
}

/**
 * The baseline dashboard is fetched on the server, once, per request.
 *
 * WHY A LOADER AND NOT A COMPONENT IMPORT. The US-007 repository is
 * asynchronous by design and `lib/repositories/index.server.ts` is server-only
 * — the `.server` suffix keeps every fixture out of the client bundle. A route
 * loader is the one place allowed to read it, so the tiles receive plain data
 * and stay renderable without a repository at all (which is also what makes
 * them testable).
 *
 * This is NOT an HTTP endpoint. It adds no route, no path and no status-code
 * surface; the prototype still makes zero network calls after load
 * (`constraints.md` §2, and the empty API table in `screen-map.md`).
 */
export async function loader() {
  return await loadBaseline(baselineRepository);
}

/**
 * The single dashboard route — the hero band and the four baseline tiles.
 *
 * The chrome around it — navy sidebar, app bar, and the 12-column canvas grid
 * this renders into — is the US-012 shell in `app/components/chrome/`. What
 * this route returns becomes grid items on that canvas, and the insight
 * sections a question inserts are rendered as siblings of this route by
 * `app/root.tsx`, which owns the session state (US-014). So the baseline sits
 * ABOVE every answer, on the same grid: the dashboard grows beneath a row that
 * was already there.
 *
 * THE BAND AND THE FOUR TILES ARE STATIC CHROME, and that is how they "inherit reset"
 * (US-015). They are rendered by the route rather than held in the session
 * list, so a question cannot remove them and Reset — which replaces the
 * session list with `BASELINE_SECTIONS` — cannot either. Load state and
 * post-reset state are the same DOM by construction, with no baseline
 * special-case anywhere in the reset path. See the note on `BASELINE_SECTIONS`
 * in `app/lib/dashboard/sections.ts`.
 *
 * The heading is visually hidden because the app bar already shows the crest
 * and the workspace label; a real `h1` still has to exist so the headings the
 * dashboard adds (`h2` per baseline tile and per hero section, `h3` per tile
 * inside a section) hang off a proper document outline.
 */
export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1 className="sr-only">{WORKSPACE_LABEL} dashboard</h1>
      {/* The band is ONE full-width grid item above the row, and the row does
          not know it exists (US-016 is first in the cut order — removing these
          two lines removes the band and nothing else). */}
      <HeroBand {...loaderData.band} latest={loaderData.match} />
      <BaselineRow data={loaderData} />
    </>
  );
}
