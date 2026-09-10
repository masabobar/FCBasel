import { GroupedBarTile, groupedBarDelta } from "../charts/grouped-bars";
import { LineChartTile } from "../charts/line-chart";
import { CompareBars } from "../tiles/compare-bars";
import { DeltaChip } from "../tiles/delta-chip";
import { KpiTile } from "../tiles/kpi-tile";
import { HERO_CHIP_LABEL } from "../../lib/dashboard/chips";
import {
  InsightPhase,
  type InsightSection,
} from "../../lib/dashboard/sections";
import {
  chfFromThousands,
  formatMoneyCompact,
  formatMoneyMillions,
  formatNumber,
  formatSignedMoneyCompact,
  formatSignedNumber,
  TABULAR_NUMERALS_CLASS,
} from "../../lib/format";
import { fixtureTotals } from "../../lib/repositories/derive";
import { HeroId } from "../../lib/repositories/enums";
import { type Hero2Primary } from "../../lib/repositories/types";
import {
  PlaceholderFollowUp,
  SectionHead,
  sectionLabelId,
  tileDelayMs,
} from "./hero-section";

/**
 * HERO 2 — "Show me the ticket revenue of last year and this year. Show me the
 * difference for each match - for example FCB vs FCZ, 25/26 vs 26/27."
 *
 * Three tiles in a fixed order, under one narrative and NO filter:
 *
 *   1. `GroupedBarTile` Matchday ticket revenue by fixture   (US-019)
 *   2. `KpiTile`        Ticket revenue, year on year         (US-017)
 *   3. `LineChartTile`  Ticket revenue by month, full width  (US-025)
 *
 * NOT ONE CHART IS BUILT HERE, and there is no `<svg>` in this file: the three
 * components above are Phase 2b's, and this module contributes layout, copy and
 * the composition of the two formatters the charts are handed. `GroupedBarTile`
 * reaches a screen for the FIRST time here, with the eight fixtures its gutter
 * and its chip band were designed around.
 *
 * ── THE TWO CHARTS ARE AT DIFFERENT SCOPES, AND BOTH SAY SO ─────────────────
 * THE SINGLE MOST IMPORTANT THING IN THIS FILE. The fixture chart covers the
 * EIGHT highest-grossing home fixtures (CHF 7.83M this season); the month-by-
 * month chart covers EVERY home fixture, so summing its twelve points gives a
 * BIGGER number (about CHF 9.77M). Neither is wrong, and the difference is not
 * a bug — but an unlabelled mismatch reads as an arithmetic error to the first
 * person in the room who adds up the months, which in this room is everyone.
 *
 * So each tile's scope line is ITS OWN SERIES' `scopeLabel`, straight from the
 * dataset (US-009 stores the two labels precisely so a component cannot forget
 * one), and there is deliberately NO section-level scope line: a single line
 * over the head would have to describe both scopes and would therefore describe
 * neither. The totals tile carries the FIXTURE label, because the fixtures are
 * what it totals.
 *
 * ── NOT ONE FIGURE IS TYPED HERE ────────────────────────────────────────────
 * Every number comes from the US-009 dataset through the root loader, and the
 * totals on top of it come from `repositories/derive.ts`: `fixtureTotals` sums
 * the same eight pairs the bars plot, so `CHF 7.83M`, `CHF 7.88M`, `-CHF 50k`
 * and the headline `-0.6%` cannot outlive an edit to a fixture. US-009
 * deliberately refused to port the reference build's stored `totalPrev`,
 * `totalCurr` and `deltaPct`; there is no stored total to read here even if a
 * later edit wanted one. The eight movements are `groupedBarDelta`'s, computed
 * by the chart from the same pair it draws.
 *
 * THE NARRATIVE IS VERBATIM and is rendered straight from the dataset — this
 * file does not restate it, so there is no second copy to paraphrase.
 *
 * ── UNITS: THE DATASET IS IN CHF THOUSANDS ──────────────────────────────────
 * Every figure below is CHF thousands, and the three compositions at the foot
 * of this file are the ONLY place that is turned into text — through
 * `app/lib/format.ts`'s `chfFromThousands`, never with a factor written here.
 * The chart's own scale and its delta chips are the one place a bare magnitude
 * appears, and the tile title states the unit for them: `(CHF 000)`. Every
 * other figure on screen — the hover box, the KPI, both compare bars, the
 * absolute change — carries `CHF`.
 *
 * ── NO FILTER, ON PURPOSE ───────────────────────────────────────────────────
 * Hero 1 owns the prototype's section-level period filter. Hero 2's question is
 * a fixed comparison of two named seasons, so there is no period to choose and
 * no `Segmented` here; adding one would invent a control the question does not
 * ask for.
 *
 * ── THE FOLLOW-UP BEAT (US-037) ─────────────────────────────────────────────
 * "Which fixtures are driving the drop?" flips this section's phase and adds
 * rows BELOW the three tiles — it does not append a section. Until US-037 lands
 * that is the shared, clearly-marked `PlaceholderFollowUp`, which invents no
 * narrative and no number.
 *
 * TICKETING DATA ONLY. A fixture is named by the opposing club; no
 * named-individual figure appears anywhere in this section.
 */

/* ------------------------------------------------------------------ COPY -- */

/** The three tile titles, in render order. */
export const HERO_2_TILE_TITLES = {
  /**
   * `(CHF 000)` is the acceptance criteria's own wording, and it is load-
   * bearing rather than decoration: the gutter scale and the eight delta chips
   * are bare magnitudes in CHF thousands, and this is where they get their
   * unit. See the units note above.
   */
  fixtures: "Matchday ticket revenue by fixture (CHF 000)",
  totals: "Ticket revenue, year on year",
  months: "Ticket revenue by month",
} as const;

/** Reads `Season 26/27 vs Season 25/26` under the headline figure. */
const VERSUS_WORD = "vs";

/* -------------------------------------------------------------- GEOMETRY -- */

/**
 * Where each tile sits on US-012's canvas grid.
 *
 * The fixture chart takes two thirds and the totals tile the remaining third,
 * side by side — sixteen bars need the width, and the totals tile is a headline
 * plus two compare bars, which does not. The monthly chart takes the FULL width
 * on every viewport: twelve months across a third of the grid would be
 * unreadable, and the acceptance criteria pin it full width.
 *
 * ── WHY `xl` AND NOT `lg`, WHICH IS WHAT EVERY OTHER TILE USES ───────────────
 * MEASURED, NOT PREFERRED. The eight delta chips are one flex cell per fixture
 * (US-019), so a cell is the plot width divided by eight, and the widest chip
 * (`-110` with its arrow) is 59.5px in Chrome. Two thirds of the canvas at the
 * `lg` breakpoint itself gives a 51.8px cell — the chips overlap by 6.5px,
 * which is precisely the defect US-019's gutter and band exist to prevent.
 * Full width there gives ~112px, and two thirds at `xl` gives 71.3px, so the
 * pair only shares a row once the row is wide enough for the chips to fit:
 *
 *   1920 wide   8 of 12   cell 109px   1280 wide   8 of 12   cell 71px
 *   1024 wide   full      cell 112px    768 wide   full      cell 79px
 *
 * The totals tile follows it, so the two never split a row unevenly.
 */
const FIXTURE_TILE_SPAN = "col-span-full xl:col-span-8";
const TOTALS_TILE_SPAN = "col-span-full xl:col-span-4";
const MONTHLY_TILE_SPAN = "col-span-full";

/**
 * View-box height of the monthly chart, in the chart's own units. Taller than
 * the hero band's 168, because this one is the full width of the canvas.
 *
 * 220 rather than the reference build's 210 for a reason worth keeping: 210 is
 * also July's revenue this season, so the figure scan in
 * `tests/unit/hero2-section.test.tsx` — which proves no displayed figure is
 * re-typed in this file — could not tell the two apart. A layout constant must
 * not be a number the dataset also displays.
 */
const MONTHLY_CHART_HEIGHT = 220;

/* ------------------------------------------------------------------ BODY -- */

export interface Hero2BodyProps {
  /** The Hero 2 primary dataset, from the root loader. */
  primary: Hero2Primary;
  /** Primary answer, or primary plus its follow-up (US-037). */
  phase: InsightSection["phase"];
}

export function Hero2Body({ primary, phase }: Hero2BodyProps) {
  const { previousSeason, currentSeason, fixtures, monthly } = primary;

  // The chart's own shape: the fixture IS the pair's identity, so the bars
  // reconcile by opponent rather than by position.
  const groups = fixtures.fixtures.map((fixture) => ({
    name: fixture.opponent,
    previous: fixture.previous,
    current: fixture.current,
  }));

  // DERIVED, from the same eight pairs the bars above plot. There is no stored
  // total anywhere in the dataset to read instead.
  const totals = fixtureTotals(fixtures.fixtures);

  return (
    <>
      <SectionHead
        id={sectionLabelId(HeroId.HERO_2)}
        // The chip's own label, imported rather than retyped, so the question
        // in the row above and the answer's heading are one string (US-029).
        label={HERO_CHIP_LABEL[HeroId.HERO_2]}
        // Verbatim, straight from the dataset. Never assembled here.
        narrative={primary.narrative}
        // No `scope`: the two charts are at different scopes and each states
        // its own. See the scope note at the top of this file.
      />

      <GroupedBarTile
        title={HERO_2_TILE_TITLES.fixtures}
        // THE NARROWER SCOPE, from the dataset: eight highest-grossing home
        // fixtures, matchday revenue only.
        period={fixtures.scopeLabel}
        groups={groups}
        previousLabel={previousSeason.label}
        currentLabel={currentSeason.label}
        // The gutter scale, in the thousands the title declares.
        format={formatNumber}
        // The eight chips: `+130`, `-150`. Signed, so the direction is in the
        // text as well as in the arrow and the colour token.
        formatDelta={formatSignedNumber}
        // Both seasons WITH their unit, plus the movement, per fixture.
        tooltip={(index) => {
          const group = groups[index];
          if (!group) return null;

          return (
            <>
              <div
                data-slot="fixture-tooltip-name"
                className="mb-0.5 font-bold"
              >
                {group.name}
              </div>
              <div
                data-slot="fixture-tooltip-season"
                data-season="previous"
                className={TABULAR_NUMERALS_CLASS}
              >
                {`${previousSeason.label} ${money(group.previous)}`}
              </div>
              <div
                data-slot="fixture-tooltip-season"
                data-season="current"
                className={TABULAR_NUMERALS_CLASS}
              >
                {`${currentSeason.label} ${money(group.current)}`}
              </div>
              {/* The chart's own movement, not a second subtraction here. */}
              <DeltaChip
                value={groupedBarDelta(group)}
                format={signedMoney}
                variant="light"
                className="mt-1"
              />
            </>
          );
        }}
        label={HERO_2_TILE_TITLES.fixtures}
        isNew
        delayMs={tileDelayMs(0)}
        className={FIXTURE_TILE_SPAN}
      />

      <KpiTile
        title={HERO_2_TILE_TITLES.totals}
        // The totals total the FIXTURES, so they carry the fixture scope.
        period={fixtures.scopeLabel}
        value={totals.current}
        format={moneyMillions}
        // Negative token, explicit sign and a DOWN arrow — three carriers, so
        // the movement survives a projector that washes the colour out.
        delta={{ value: totals.deltaPercent }}
        subtitle={`${currentSeason.label} ${VERSUS_WORD} ${previousSeason.label}`}
        isNew
        delayMs={tileDelayMs(1)}
        className={TOTALS_TILE_SPAN}
      >
        {/* Both seasons on ONE scale, labelled, in the colours the bars above
            use: navy is last season, red is this one. */}
        <CompareBars
          className="mt-4"
          format={moneyMillions}
          rows={[
            {
              name: previousSeason.label,
              value: totals.previous,
              series: "navy",
            },
            { name: currentSeason.label, value: totals.current, series: "red" },
          ]}
        />

        {/* THE ABSOLUTE CHANGE. The percentage beside the headline says how far
            it moved; this says how much money that is. */}
        <div
          data-slot="totals-change"
          className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-caption text-muted"
        >
          <DeltaChip value={totals.delta} format={signedMoney} />
          {`${VERSUS_WORD} ${previousSeason.label}`}
        </div>
      </KpiTile>

      <LineChartTile
        title={HERO_2_TILE_TITLES.months}
        // THE BROADER SCOPE, from the dataset: ALL home fixtures per month.
        // This is why the twelve points sum to more than the total above.
        period={monthly.scopeLabel}
        xs={monthly.months.map((month) => month.label)}
        series={[
          {
            name: previousSeason.label,
            values: monthly.months.map((month) => month.previous),
            color: "navy",
          },
          {
            name: currentSeason.label,
            values: monthly.months.map((month) => month.current),
            color: "red",
            // The season being asked about is the filled one.
            area: true,
          },
        ]}
        format={money}
        height={MONTHLY_CHART_HEIGHT}
        label={HERO_2_TILE_TITLES.months}
        isNew
        delayMs={tileDelayMs(2)}
        className={MONTHLY_TILE_SPAN}
      />

      {phase === InsightPhase.WITH_FOLLOW_UP && (
        // US-037 replaces this with the declining-fixtures beat: a gold
        // divider, the ranked declines and the verbatim advice. Until then the
        // shared placeholder, which invents nothing.
        <PlaceholderFollowUp heroId={HeroId.HERO_2} delayMs={tileDelayMs(3)} />
      )}
    </>
  );
}

/* --------------------------------------------------------------- STRINGS -- */

/**
 * The three compositions that turn CHF THOUSANDS into text — the only place in
 * this section where the dataset's unit becomes a string, and the reason no
 * factor of 1000 is written anywhere above.
 */

/** `CHF 1’480k` — a fixture's or a month's revenue, in the hover boxes. */
function money(thousands: number): string {
  return formatMoneyCompact(chfFromThousands(thousands));
}

/** `-CHF 150k`, `+CHF 130k` — a movement, sign always written. */
function signedMoney(thousands: number): string {
  return formatSignedMoneyCompact(chfFromThousands(thousands));
}

/** `CHF 7.83M` — a season total, as the headline reads it. */
function moneyMillions(thousands: number): string {
  return formatMoneyMillions(chfFromThousands(thousands));
}
