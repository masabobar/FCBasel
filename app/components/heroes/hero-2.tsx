import { GroupedBarTile, groupedBarDelta } from "../charts/grouped-bars";
import { LineChartTile } from "../charts/line-chart";
import { CompareBars } from "../tiles/compare-bars";
import { DeltaChip } from "../tiles/delta-chip";
import { DriverTile } from "../tiles/driver-tile";
import { KpiTile } from "../tiles/kpi-tile";
import { RecommendationPanel } from "../tiles/recommendation-panel";
import { HERO_CHIP_LABEL_KEY } from "../../lib/dashboard/chips";
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
import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";
import { fixtureDeclines, fixtureTotals } from "../../lib/repositories/derive";
import { HeroId } from "../../lib/repositories/enums";
import {
  type Hero2FollowUp,
  type Hero2Primary,
} from "../../lib/repositories/types";
import {
  FollowUpDivider,
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
 * three rows BELOW the three tiles — it does not append a section. The shared
 * gold `FollowUpDivider`, a `DriverTile` of the four declining fixtures, and a
 * `RecommendationPanel` in its NARRATIVE variant carrying the verbatim
 * explanation. The section that was already on screen grows.
 *
 * IT IS THE SECOND "SO-WHAT" BEAT, and the argument is the order of the three:
 * the seam says a second question was asked, the bars say WHICH fixtures (FCZ
 * and Lugano are two thirds of the fall on their own), and the panel says WHY —
 * attendance, not pricing. The panel is `narrative`, not `recommendation`: this
 * beat explains rather than prescribes, and gold is already spent on the seam.
 *
 * NOT ONE FIGURE IN THE BEAT IS TYPED EITHER. The four declines are
 * `fixtureDeclines`, derived from the same eight pairs the chart above plots,
 * and the `-CHF 400k total` badge is US-023's `driverTotal` — computed from the
 * rows ON SCREEN, so the badge cannot disagree with the bars. Ranking is
 * US-023's too, and it is STABLE for ties: Luzern and Sion both fell CHF 70k,
 * and Luzern stays ahead of it because that is the order the fixtures derive
 * in. Nothing here re-sorts, re-sums or re-states any of that.
 *
 * TICKETING DATA ONLY. A fixture is named by the opposing club; no
 * named-individual figure appears anywhere in this section.
 */

/* ------------------------------------------------------------------ COPY -- */

/** The three tile titles, in render order. */
export const HERO_2_TILE_TITLE_KEY = {
  /**
   * `(CHF 000)` is the acceptance criteria's own wording, and it is load-
   * bearing rather than decoration: the gutter scale and the eight delta chips
   * are bare magnitudes in CHF thousands, and this is where they get their
   * unit. See the units note above.
   */
  fixtures: "hero2.fixturesTitle",
  totals: "hero2.totalsTitle",
  months: "hero2.monthsTitle",
} as const satisfies Record<string, TranslationKey>;

/** Reads `Season 26/27 vs Season 25/26` under the headline figure. */
const VERSUS_WORD_KEY: TranslationKey = "hero2.versus";

/**
 * The follow-up tile's title — what the beat's bars are a list OF.
 *
 * Copy in the same sense the three titles above are: it names the list, it does
 * not count it. How many fixtures fell and by how much is
 * `fixtureDeclines`' answer, and it is never restated in a string.
 */
export const HERO_2_FOLLOW_UP_TITLE_KEY: TranslationKey = "hero2.followUpTitle";

/**
 * The scope line under that title. It states the ORDER, because the order is
 * the tile's claim: biggest decline first, which is what makes the top row the
 * fixture to talk about in the room.
 */
const DECLINE_SUBTITLE_KEY: TranslationKey = "hero2.declineSubtitle";

/**
 * THE ONE-LINE ATTENDANCE NOTE (criterion 3), under the bars.
 *
 * A footnote on the data, not narrative: it says what KIND of cause every bar
 * in the list shares, so the four rows are not read as four separate stories.
 *
 * IT IS DELIBERATELY NOT A COPY OF THE NARRATIVE'S CLAUSE. The dataset's
 * sentence makes the same point at length ("the fall is driven by lower
 * attendance rather than pricing", with the FCZ seat count behind it), and this
 * line is worded independently so the verbatim copy exists in exactly one
 * place — `tests/unit/hero2-follow-up.test.tsx` scans the component layer for
 * that clause and fails if it reappears here. It also carries no figure, so
 * nothing in it can drift from the fixtures.
 */
const ATTENDANCE_NOTE_KEY: TranslationKey = "hero2.attendanceNote";

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
 * The beat's two rows: half the grid each at `lg`, so the room reads WHICH
 * fixtures and WHY in one glance.
 *
 * `lg` and not `xl` here, unlike the fixture chart above: a four-row bar list is
 * a 150px label column plus a 96px value column (US-021), which fits half the
 * canvas comfortably at 1024 — the eight-chip collision that forced the
 * fixture chart to `xl` has nothing to do with this tile.
 */
const FOLLOW_UP_TILE_SPAN = "col-span-full lg:col-span-6";

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
  /**
   * The declining-fixtures follow-up. It carries the VERBATIM explanation and
   * nothing else — the four declines and their total are derived from
   * `primary.fixtures` below, never stored beside the sentence.
   */
  followUp: Hero2FollowUp;
  /** Primary answer, or primary plus its follow-up (US-037). */
  phase: InsightSection["phase"];
}

export function Hero2Body({ primary, followUp, phase }: Hero2BodyProps) {
  const t = useT();
  const { previousSeason, currentSeason, fixtures, monthly } = primary;

  // Both season names, resolved once: they appear in a legend, two axes, a
  // subtitle and a change line, and one resolution keeps the five identical.
  const previousSeasonLabel = t(previousSeason.labelKey);
  const currentSeasonLabel = t(currentSeason.labelKey);
  const versus = t(VERSUS_WORD_KEY);

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

  // The follow-up's four rows, from those same pairs: the fixtures that fell,
  // biggest fall first, with equal falls in fixture order (Luzern, then Sion).
  const declines = fixtureDeclines(fixtures.fixtures);

  return (
    <>
      <SectionHead
        id={sectionLabelId(HeroId.HERO_2)}
        // The chip's own label, imported rather than retyped, so the question
        // in the row above and the answer's heading are one string (US-029).
        label={t(HERO_CHIP_LABEL_KEY[HeroId.HERO_2])}
        // Verbatim, straight from the dataset. Never assembled here.
        narrative={t(primary.narrativeKey)}
        // No `scope`: the two charts are at different scopes and each states
        // its own. See the scope note at the top of this file.
      />

      <GroupedBarTile
        title={t(HERO_2_TILE_TITLE_KEY.fixtures)}
        // THE NARROWER SCOPE, from the dataset: eight highest-grossing home
        // fixtures, matchday revenue only.
        period={t(fixtures.scopeLabelKey)}
        groups={groups}
        previousLabel={previousSeasonLabel}
        currentLabel={currentSeasonLabel}
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
                {`${previousSeasonLabel} ${money(group.previous)}`}
              </div>
              <div
                data-slot="fixture-tooltip-season"
                data-season="current"
                className={TABULAR_NUMERALS_CLASS}
              >
                {`${currentSeasonLabel} ${money(group.current)}`}
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
        label={HERO_2_TILE_TITLE_KEY.fixtures}
        isNew
        delayMs={tileDelayMs(0)}
        className={FIXTURE_TILE_SPAN}
      />

      <KpiTile
        title={t(HERO_2_TILE_TITLE_KEY.totals)}
        // The totals total the FIXTURES, so they carry the fixture scope.
        period={t(fixtures.scopeLabelKey)}
        value={totals.current}
        format={moneyMillions}
        // Negative token, explicit sign and a DOWN arrow — three carriers, so
        // the movement survives a projector that washes the colour out.
        delta={{ value: totals.deltaPercent }}
        subtitle={`${currentSeasonLabel} ${versus} ${previousSeasonLabel}`}
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
              name: previousSeasonLabel,
              value: totals.previous,
              series: "navy",
            },
            { name: currentSeasonLabel, value: totals.current, series: "red" },
          ]}
        />

        {/* THE ABSOLUTE CHANGE. The percentage beside the headline says how far
            it moved; this says how much money that is. */}
        <div
          data-slot="totals-change"
          className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-caption text-muted"
        >
          <DeltaChip value={totals.delta} format={signedMoney} />
          {`${versus} ${previousSeasonLabel}`}
        </div>
      </KpiTile>

      <LineChartTile
        title={t(HERO_2_TILE_TITLE_KEY.months)}
        // THE BROADER SCOPE, from the dataset: ALL home fixtures per month.
        // This is why the twelve points sum to more than the total above.
        period={t(monthly.scopeLabelKey)}
        xs={monthly.months.map((month) => t(month.labelKey))}
        series={[
          {
            name: previousSeasonLabel,
            values: monthly.months.map((month) => month.previous),
            color: "navy",
          },
          {
            name: currentSeasonLabel,
            values: monthly.months.map((month) => month.current),
            color: "red",
            // The season being asked about is the filled one.
            area: true,
          },
        ]}
        format={money}
        height={MONTHLY_CHART_HEIGHT}
        label={t(HERO_2_TILE_TITLE_KEY.months)}
        isNew
        delayMs={tileDelayMs(2)}
        className={MONTHLY_TILE_SPAN}
      />

      {phase === InsightPhase.WITH_FOLLOW_UP && (
        <>
          {/*
            The beat opens on the shared gold seam — the same component Hero 1's
            beat opens on, never a second gold rule. It is a grid item, so the
            section grows by three more rows instead of becoming a box in a box.
          */}
          <FollowUpDivider isNew delayMs={tileDelayMs(3)} />

          <DriverTile
            title={t(HERO_2_FOLLOW_UP_TITLE_KEY)}
            period={t(DECLINE_SUBTITLE_KEY)}
            // DERIVED, from the eight pairs the chart above plots: the four
            // fixtures that fell, each as the SIZE of its fall. There is no
            // stored list of declines to read instead.
            rows={declines.map((decline) => ({
              name: decline.opponent,
              value: decline.drop,
            }))}
            // Every row is a decline, so the tile shows the magnitudes as
            // negative money and grows them leftwards in the variance token —
            // and `-CHF 150k` gets its minus BEFORE the unit (US-021).
            negative
            // The same composition the hover boxes use, so the beat and the
            // chart above spell CHF thousands identically. The 96px `nowrap`
            // value column keeps `-CHF 150k` on one line.
            format={money}
            // MAGNITUDE ORDER, the tile's default: biggest decline first, and
            // stable for ties, so Luzern stays ahead of Sion.
            //
            // `-CHF 400k total` in the card's action slot, summed by US-023
            // from the rows above it. No literal is passed and no judgement is
            // needed: a decline's sign IS its meaning.
            showTotal
            note={t(ATTENDANCE_NOTE_KEY)}
            isNew
            delayMs={tileDelayMs(4)}
            className={FOLLOW_UP_TILE_SPAN}
          />

          {/*
            THE SO-WHAT. An `aside`, not a fourth metric card (US-024). The
            NARRATIVE variant, because this beat interprets rather than
            prescribes — and because gold is spent once per beat, on the seam
            above. The sentence is handed over VERBATIM, from the dataset; this
            file states no part of it.
          */}
          <RecommendationPanel
            variant="narrative"
            isNew
            delayMs={tileDelayMs(5)}
            className={FOLLOW_UP_TILE_SPAN}
          >
            {t(followUp.narrativeKey)}
          </RecommendationPanel>
        </>
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
