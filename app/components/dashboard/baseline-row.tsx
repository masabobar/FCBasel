import { Handshake, Package, ShoppingBag, Trophy } from "lucide-react";
import { useState } from "react";

import { HBarTile } from "../charts/h-bars";
import { Segmented } from "../controls/segmented";
import { tileDelayMs } from "../heroes/hero-section";
import { KpiTile } from "../tiles/kpi-tile";
import { PartnersTile } from "../tiles/partner-tile";
import {
  BASELINE_PERIOD,
  type BaselineData,
} from "../../lib/dashboard/baseline";
import {
  formatMoney,
  formatNumber,
  formatSharePercent,
} from "../../lib/format";
import { matchCapacityShare, scoreline } from "../../lib/repositories/derive";
import { type PeriodKey } from "../../lib/repositories/enums";

/**
 * THE BASELINE ROW — the four tiles that are on the canvas before a single
 * question is asked.
 *
 * This is the whole point of the mechanic the client specified: the persona
 * "sees a dashboard that already looks lived-in — NOT an empty canvas. Their
 * questions ADD TO this dashboard rather than filling a blank one." Everything
 * US-014 inserts lands BELOW these four, on the same grid, so an answer joins
 * a working dashboard instead of populating a placeholder.
 *
 * WHAT THIS FILE IS ALLOWED TO CONTAIN, AND WHAT IT IS NOT
 * Composition and layout, and nothing else. It invents no tile kind (every one
 * is a Phase 2b component: `KpiTile`, `HBarTile`, `PartnersTile`), no grid (the
 * spans below place these tiles on US-012's ONE canvas grid), no formatter
 * (every string comes from `app/lib/format.ts`) and — the acceptance criterion
 * — **no figure**. Every number arrives on {@link BaselineData} from the US-007
 * repository through the route's loader, and `tests/unit/baseline-row.test.tsx`
 * scans this source for the dataset's own figures and fails if it finds one.
 *
 * ORDER IS AN ACCEPTANCE CRITERION: Webshop revenue, Last home match, Top
 * products, Active partners. It is the DOM order below, so a reordering is a
 * visible diff rather than a CSS accident.
 *
 * TOP PRODUCTS HAS ITS OWN PERIOD, AND THAT IS DELIBERATE (US-016). Its
 * `action` slot now holds US-026's `Segmented`, so the five figures
 * recalculate and the bars transition on a press. The filter is INDEPENDENT of
 * the hero band's: the band's one control drives its chart and its ring because
 * those are two views of a single reading, whereas a presenter comparing this
 * month's best sellers against a year-to-date revenue trend is asking a
 * reasonable question. `HBars` keys its rows by product name, so a press
 * transitions the same five bars instead of remounting them at zero width.
 *
 * WHAT IS DELIBERATELY MISSING
 *   - **The hero band** (US-016) is not here — it is a sibling on the canvas
 *     (`app/components/dashboard/hero-band.tsx`, mounted by the route above
 *     this row) and nothing in this file imports it, so the band can be cut
 *     without touching the baseline.
 *   - **Any narrative.** No tile carries a `caption`: the baseline states
 *     figures, and the assistant's prose belongs to the answers (Phase 3b).
 */

/* ------------------------------------------------------------ COPY -------- */

/**
 * The row's fixed labels. Copy, not data — these are the names of the tiles,
 * and the only strings in this file that are not read off the dataset.
 */
export const BASELINE_TILE_TITLES = {
  webshop: "Webshop revenue",
  match: "Last home match",
  topProducts: "Top products",
  partners: "Active partners",
} as const;

/** Tile titles in render order — the acceptance criterion, as a value. */
export const BASELINE_TILE_ORDER: readonly string[] = [
  BASELINE_TILE_TITLES.webshop,
  BASELINE_TILE_TITLES.match,
  BASELINE_TILE_TITLES.topProducts,
  BASELINE_TILE_TITLES.partners,
];

/** Prefix of the webshop tile's comparison line: `vs last month`. */
const COMPARISON_PREFIX = "vs";

/** Capacity is quoted as an approximation, as the Reference Guide quotes it. */
const APPROX_PREFIX = "~";

/** Reads `of ~38’000 · 76% of capacity`. */
const OF_PREFIX = "of";
const CAPACITY_SUFFIX = "of capacity";
const DOT_SEPARATOR = "·";

/** The scope line above the Top Products bars. */
const UNITS_SOLD = "Units sold";

/**
 * The accessible name of Top Products' period filter.
 *
 * Named for what it DRIVES, because the hero band shows a second period filter
 * at the same time and "Period" twice on one screen is ambiguous to anyone
 * hearing it rather than seeing it.
 */
export const TOP_PRODUCTS_PERIOD_LABEL = "Period for top products";

/* ------------------------------------------------------------ GEOMETRY ---- */

/**
 * Where each tile sits on US-012's canvas grid — 12 columns at `lg`, 8 at `sm`,
 * 4 below.
 *
 * The two KPI tiles are quarter-width because a single big number needs no more
 * room than that; Top Products takes half from `xl` up because its fixed 150px
 * label column plus a 96px value column leave a bar track that must stay
 * readable at 1080p, and the full width below that (see {@link WIDE_SPAN}); and
 * the partner strip takes the full width so its six plates sit in one row
 * rather than wrapping into an awkward 4 + 2.
 *
 * Every span is a factor of the column count at its breakpoint, so nothing
 * lands on a fractional track.
 *
 * The two KPI tiles also `self-start`: a grid row stretches its items to the
 * tallest of them, which would give a tile holding one number and one line the
 * height of a five-row bar list and leave a hundred pixels of empty card under
 * the figure. Sizing them to their own content is the only opinion this file
 * has about height.
 */
const KPI_SPAN = "col-span-full self-start sm:col-span-4 lg:col-span-3";
/**
 * Top Products is half-width at `xl` AND ABOVE, NOT at `lg` — measured, the
 * same way US-036 chose `xl` for Hero 2's tile pair (US-040).
 *
 * Six of twelve columns is 496px at 1280 and the tile's header needs 460px of
 * it (title block plus the four-option `Segmented` in the `action` slot), so it
 * fits with room to spare at every viewport this prototype is presented at. At
 * `lg` it does not: 432px at 1152 and 368px at 1024, which clipped the last
 * period option — "Year to date" — against `Card`'s `overflow-hidden` by 25.7px
 * and 89.7px respectively. Half-width was never the point; a readable bar track
 * next to a readable filter row was, and below 1280 the full width is what
 * delivers it. The reflow costs nothing: the tile simply takes its own row.
 */
const WIDE_SPAN = "col-span-full xl:col-span-6";
const FULL_SPAN = "col-span-full";

/** Header icons. Decorative — `Card` puts the meaning in the title. */
const ICON_SIZE = 16;

/**
 * Tile headings are `h2`.
 *
 * The route's only heading is a visually hidden `h1`, and these four tiles are
 * top-level regions of the dashboard rather than parts of a section — so they
 * hang straight off it. `Card`'s default `h3` is for a tile INSIDE a hero
 * section, whose section head owns the `h2` (`heroes/hero-section.tsx`).
 */
const BASELINE_HEADING_LEVEL = 2;

/* ------------------------------------------------------------------ ROW --- */

export interface BaselineRowProps {
  /** The four tiles' figures, from the route loader. */
  data: BaselineData;
}

export function BaselineRow({ data }: BaselineRowProps) {
  const { webshop, match, topProducts, partners } = data;

  /**
   * Top Products' own period. Held here rather than in `HBarTile`, because the
   * card's header (its scope line) and its bars have to move together — and
   * because a tile component that owned a filter could not be reused by a hero
   * that drives three tiles from one (US-034).
   */
  const [productsPeriod, setProductsPeriod] =
    useState<PeriodKey>(BASELINE_PERIOD);

  // A key with no entry falls back to the first period rather than dropping the
  // tile; the fallback also means `products.key` — not the state — is what the
  // control shows as selected, so the highlight can never lead the bars.
  const products =
    topProducts.find((period) => period.key === productsPeriod) ??
    topProducts[0];

  return (
    // A fragment, so all four tiles are direct children of the canvas grid.
    // There is exactly one grid on this screen (`chrome/app-shell.tsx`).
    <>
      <KpiTile
        title={BASELINE_TILE_TITLES.webshop}
        period={webshop.periodLabel}
        headingLevel={BASELINE_HEADING_LEVEL}
        icon={<ShoppingBag size={ICON_SIZE} />}
        value={webshop.total}
        format={formatMoney}
        // Both the figure above and this percentage are `seriesTotals` off the
        // same array the sparkline draws — see `lib/dashboard/baseline.ts`.
        delta={{ value: webshop.deltaPercent }}
        subtitle={`${COMPARISON_PREFIX} ${webshop.comparisonLabel.toLowerCase()}`}
        sparkline={webshop.trend}
        isNew
        delayMs={tileDelayMs(0)}
        className={KPI_SPAN}
      />

      <KpiTile
        title={BASELINE_TILE_TITLES.match}
        // House style, rendered by `derive.ts` and never assembled here: a
        // plain hyphen in `FCB 2-1 Sion`, no en dash.
        period={scoreline(match)}
        headingLevel={BASELINE_HEADING_LEVEL}
        icon={<Trophy size={ICON_SIZE} />}
        value={match.attendance}
        format={formatNumber}
        // No variance chip: a single fixture has nothing to be compared with.
        // Attendance MOVEMENT is a property of a period, and it belongs to
        // US-016's ring, which reads `attendanceChangePercent`.
        subtitle={`${OF_PREFIX} ${APPROX_PREFIX}${formatNumber(
          match.capacity,
        )} ${DOT_SEPARATOR} ${formatSharePercent(
          matchCapacityShare(match),
        )} ${CAPACITY_SUFFIX}`}
        isNew
        delayMs={tileDelayMs(1)}
        className={KPI_SPAN}
      />

      {products && (
        <HBarTile
          title={BASELINE_TILE_TITLES.topProducts}
          period={`${UNITS_SOLD} ${DOT_SEPARATOR} ${products.label}`}
          headingLevel={BASELINE_HEADING_LEVEL}
          icon={<Package size={ICON_SIZE} />}
          // Club blue, per `H_BAR_SERIES` — Top Products is the blue list. The
          // fixed 150px label column that keeps `Cap "Rotblau"` and
          // `Home shirt 26/27` whole belongs to `HBarRow`, and is asserted end
          // to end here.
          series="blue"
          rows={products.rows.map((row) => ({
            name: row.product,
            value: row.units,
          }))}
          // The period filter US-013 left this slot empty for. `light`, because
          // it sits on a white card rather than on the navy band.
          action={
            <Segmented
              options={topProducts}
              value={products.key}
              onChange={setProductsPeriod}
              label={TOP_PRODUCTS_PERIOD_LABEL}
            />
          }
          isNew
          delayMs={tileDelayMs(2)}
          className={WIDE_SPAN}
        />
      )}

      <PartnersTile
        title={BASELINE_TILE_TITLES.partners}
        headingLevel={BASELINE_HEADING_LEVEL}
        icon={<Handshake size={ICON_SIZE} />}
        partners={partners}
        isNew
        delayMs={tileDelayMs(3)}
        className={FULL_SPAN}
      />
    </>
  );
}
