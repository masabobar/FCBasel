import { useState } from "react";

import { AttendanceRing } from "../charts/attendance-ring";
import {
  LineChart,
  LineChartLegend,
  type LineSeries,
} from "../charts/line-chart";
import { Segmented } from "../controls/segmented";
import { DeltaChip } from "../tiles/delta-chip";
import { KpiFigure } from "../tiles/kpi-tile";
import { cn } from "../../lib/cn";
import {
  BASELINE_PERIOD,
  type HeroBandData,
} from "../../lib/dashboard/baseline";
import {
  formatMoney,
  formatNumber,
  formatSharePercent,
} from "../../lib/format";
import { useUid } from "../../lib/hooks/use-motion";
import {
  attendanceChangePercent,
  attendanceShare,
  scoreline,
  seriesTotals,
} from "../../lib/repositories/derive";
import { type PeriodKey } from "../../lib/repositories/enums";
import { type HomeMatch } from "../../lib/repositories/types";

/**
 * THE HERO BAND — the navy greeting band above the baseline row (US-016).
 *
 * Four things on one surface: the persona greeting, the period filter, the
 * webshop line chart in the wide left column, and the attendance ring with its
 * supporting stats in the narrow right one.
 *
 * ONE CONTROL DRIVES BOTH WIDGETS, and that is the point of the story rather
 * than a detail of it. The `Segmented` filter is the only period state on this
 * surface: the chart re-keys off it (so the stroke draw replays) and the ring
 * reads the SAME `BaselinePeriod` entry's attendance (so the arc sweeps) from
 * the same press. Neither widget owns a period of its own, and there is no
 * second filter anywhere in the band — a chart and a ring that could disagree
 * about which month they are showing is the defect this shape prevents.
 *
 * NOTHING IS INVENTED HERE. The band COMPOSES what Phase 2b built:
 * `Segmented` (US-026), `LineChart` + `LineChartLegend` (US-025), `KpiFigure`
 * with `onDark` and `DeltaChip` (US-017), `AttendanceRing` (the one new visual,
 * beside this file), the US-027 motion hooks, and the formatters and derived
 * figures of US-011 / US-007. It contributes layout, copy and the single piece
 * of period state.
 *
 * THE TOTAL AND ITS DELTA ARE COMPUTED, NEVER STORED. `seriesTotals` sums the
 * very array the chart plots, on every render, so the headline figure and the
 * gold line cannot disagree — and `HeroBandData` deliberately has no field to
 * read a stored total from. Same for the ring: the share is `attendanceShare`,
 * and the movement `attendanceChangePercent`.
 *
 * IT IS SELF-CONTAINED, BECAUSE IT IS FIRST IN THE CUT ORDER. The band is a
 * Reference Guide refinement beyond the Build Specification and is the first
 * thing to go if the week runs short (P1). It is one grid item on the canvas
 * with its own surface, it holds no state anything else reads, and nothing in
 * the baseline row imports it — deleting this file and its line in
 * `app/routes/_index.tsx` would leave US-013 untouched.
 *
 * NO HEX AND NO FORMATTING. Every colour is a token utility class or the band
 * surface in `app/app.css`; every string on screen comes from
 * `app/lib/format.ts` or from the dataset's own labels. A test scans this file
 * for both.
 */

/* ------------------------------------------------------------------ COPY -- */

/** The band's two section labels. Copy, not data. */
export const HERO_BAND_LABELS = {
  webshop: "Webshop revenue",
  attendance: "Home attendance",
} as const;

/** The line under the greeting. It says what the band is and what to do next. */
export const HERO_BAND_SUBTITLE =
  "Your commercial overview. Ask a question below to expand it.";

/**
 * The comparison series' name, in the legend and in the hover tooltip. The
 * CURRENT series is named by the dataset's own period label, so only this one
 * is copy.
 */
export const PREVIOUS_SERIES_NAME = "Previous";

/**
 * The filter's accessible name. It is named for what it DRIVES, because the
 * dashboard shows a second period filter (Top Products') at the same time.
 */
export const HERO_BAND_PERIOD_LABEL = "Period for webshop and attendance";

/** Reads `+5.1% vs previous` beside the ring. */
const COMPARISON_TEXT = "vs previous";

/** Reads `2 home matches` — pluralised, since a period can hold one. */
const HOME_MATCH_TEXT = { one: "home match", many: "home matches" } as const;

/** Reads `76% of ~38’000`, quoting the capacity as the Guide quotes it. */
const OF_PREFIX = "of";
const APPROX_PREFIX = "~";

/** Reads `Latest: FCB 2-1 Sion`. The scoreline itself comes from `derive.ts`. */
const LATEST_PREFIX = "Latest:";

/* -------------------------------------------------------------- GEOMETRY -- */

/**
 * The band's own columns: 8 for the chart, 4 for the ring at `lg`, stacked
 * below it.
 *
 * WHY THIS ONE PANEL HAS COLUMNS OF ITS OWN. Every TILE on this screen is a
 * grid item of US-012's single canvas grid, and a hero section re-uses that
 * grid's tracks through `grid-cols-subgrid`. The band is neither: it is one
 * self-contained panel with its own padded, gradient surface, so a subgrid
 * would inherit tracks its padding has already shifted. It therefore takes ONE
 * full-width slot on the canvas and divides its own interior — which is also
 * what keeps it cuttable (see the note above).
 */
const BAND_SPAN = "col-span-full";
const CHART_COLUMN = "min-w-0 lg:col-span-8";
const RING_COLUMN =
  "flex min-w-0 flex-wrap items-center gap-grid-gap lg:col-span-4 lg:border-l lg:border-bg/15 lg:pl-6";

/**
 * The chart's view-box height. Taller than the default 158 because the band's
 * chart is the largest thing on the screen at load and the reference build
 * draws it at 168.
 */
export const BAND_CHART_HEIGHT = 168;

/* ------------------------------------------------------------------ BAND -- */

export interface HeroBandProps extends HeroBandData {
  /**
   * The latest home fixture, quoted under the ring. The same object the match
   * tile renders, so the two cannot show different scorelines.
   */
  latest: HomeMatch;
  className?: string;
}

export function HeroBand({
  greeting,
  periods,
  latest,
  className,
}: HeroBandProps) {
  /**
   * THE ONE PIECE OF PERIOD STATE ON THIS SURFACE. It is held here, above both
   * widgets, rather than inside either of them — which is what makes a single
   * press move both.
   */
  const [periodKey, setPeriodKey] = useState<PeriodKey>(BASELINE_PERIOD);
  const uid = useUid("hero-band");

  // A key with no entry falls back to the first period rather than rendering a
  // band with a hole in it; an empty dataset renders no band at all.
  const period = periods.find((one) => one.key === periodKey) ?? periods[0];
  if (!period) return null;

  const totals = seriesTotals(period.webshop);
  const { attendance } = period;
  const greetingId = `${uid}-greeting`;

  /**
   * The two series, in DRAWING order: the dashed comparison first, so the gold
   * current period is stroked over it. The legend beside the KPI is given this
   * same array — one array, so the chart, the legend and the tooltip cannot
   * disagree about a colour or a dash.
   */
  const series: readonly LineSeries[] = [
    {
      name: PREVIOUS_SERIES_NAME,
      values: period.webshop.previous,
      color: "white",
      dash: true,
    },
    {
      name: period.label,
      values: period.webshop.current,
      color: "gold",
      area: true,
    },
  ];

  return (
    <section
      data-slot="hero-band"
      aria-labelledby={greetingId}
      className={cn(
        "fcb-band relative overflow-hidden rounded-panel",
        BAND_SPAN,
        className,
      )}
    >
      {/* The warm bloom in the corner. Pure decoration, and inert. */}
      <span
        data-slot="hero-band-wash"
        aria-hidden="true"
        className="fcb-band-wash"
      />

      <div className="relative p-tile lg:px-7 lg:py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id={greetingId}
              data-slot="hero-band-greeting"
              className="text-kpi leading-tight font-bold text-bg"
            >
              {greeting}
            </h2>
            <p
              data-slot="hero-band-subtitle"
              className="mt-1 text-caption text-bg/60"
            >
              {HERO_BAND_SUBTITLE}
            </p>
          </div>

          {/* ONE control. Its options ARE the period entries — `SegmentedOption`
              is the head of `BaselinePeriod`, so nothing is mapped. */}
          <Segmented
            options={periods}
            value={period.key}
            onChange={setPeriodKey}
            variant="dark"
            label={HERO_BAND_PERIOD_LABEL}
          />
        </div>

        <div className="grid grid-cols-1 gap-grid-gap lg:grid-cols-12">
          <div data-slot="hero-band-chart" className={CHART_COLUMN}>
            <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="tile-title text-bg/60">
                  {HERO_BAND_LABELS.webshop}
                </h3>
                {/* Summed from the plotted array on every render — see the note
                    on this file. `onDark` also forces the chip's light variant,
                    because the negative token is illegible on navy. */}
                <KpiFigure
                  value={totals.current}
                  format={formatMoney}
                  delta={{ value: totals.deltaPercent }}
                  onDark
                  className="mt-1"
                />
              </div>
              {/* The legend sits in the header row, opposite the KPI, which is
                  why `LineChart` is told not to render one of its own. */}
              <LineChartLegend series={series} dark />
            </div>

            {/* KEYED BY PERIOD. That is what replays the stroke draw on a
                filter change (US-025's entrance is a first-paint effect). */}
            <LineChart
              key={period.key}
              xs={period.webshop.labels}
              series={series}
              format={formatMoney}
              height={BAND_CHART_HEIGHT}
              dark
              legend={false}
              label={`${HERO_BAND_LABELS.webshop}, ${period.label}`}
            />
          </div>

          <div data-slot="hero-band-attendance" className={RING_COLUMN}>
            <AttendanceRing attendance={attendance} />

            <div className="min-w-0">
              <h3 className="tile-title text-bg/60">
                {HERO_BAND_LABELS.attendance}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <DeltaChip
                  value={attendanceChangePercent(attendance)}
                  variant="light"
                />
                <span className="text-caption text-bg/60">
                  {COMPARISON_TEXT}
                </span>
              </div>
              <div
                data-slot="hero-band-stats"
                className="mt-2 space-y-0.5 text-caption text-bg/70"
              >
                <div>
                  {`${formatNumber(attendance.matches)} ${
                    attendance.matches === 1
                      ? HOME_MATCH_TEXT.one
                      : HOME_MATCH_TEXT.many
                  }`}
                </div>
                <div>
                  {`${formatSharePercent(
                    attendanceShare(attendance),
                  )} ${OF_PREFIX} ${APPROX_PREFIX}${formatNumber(
                    attendance.capacity,
                  )}`}
                </div>
                {/* Rendered by `derive.ts`, never assembled here. */}
                <div className="text-bg/50">{`${LATEST_PREFIX} ${scoreline(latest)}`}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
