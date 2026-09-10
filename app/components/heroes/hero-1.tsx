import { useState } from "react";

import { DonutTile } from "../charts/donut";
import { HBarTile } from "../charts/h-bars";
import { VBarTile } from "../charts/v-bars";
import { Segmented } from "../controls/segmented";
import { DriverTile } from "../tiles/driver-tile";
import { RecommendationPanel } from "../tiles/recommendation-panel";
import { HERO_CHIP_LABEL } from "../../lib/dashboard/chips";
import {
  InsightPhase,
  type InsightSection,
} from "../../lib/dashboard/sections";
import {
  formatMoney,
  formatMoneyMillions,
  formatNumber,
  formatSharePercent,
  formatSignedPercent,
  TABULAR_NUMERALS_CLASS,
} from "../../lib/format";
import {
  badgeShare,
  kitRevenueRows,
  kitRevenueTotal,
  kitUnitsShare,
  kitUnitsTotal,
} from "../../lib/repositories/derive";
import { HeroId, PeriodKey } from "../../lib/repositories/enums";
import {
  type Hero1FollowUp,
  type Hero1Period,
  type Hero1Primary,
} from "../../lib/repositories/types";
import {
  FollowUpDivider,
  SectionHead,
  sectionLabelId,
  tileDelayMs,
} from "./hero-section";

/**
 * HERO 1 — "Show me shirt sales split into home, away and third kit. How many
 * have sponsor badges printed, and the top 5 printed names."
 *
 * Three tiles in a fixed order, under one narrative and ONE period filter:
 *
 *   1. `VBarTile`  Shirt sales by kit          (US-018)
 *   2. `DonutTile` Sponsor badges printed      (US-020)
 *   3. `HBarTile`  Top printed names           (US-021)
 *
 * ── THE STORY IS THE SINGLE FILTER ───────────────────────────────────────────
 * `periodKey` is the ONLY period state in this section, held here — above all
 * three tiles — rather than inside any of them. One press therefore moves the
 * bars, the ring and the names together off the same `Hero1Period`, and the
 * three tiles cannot disagree about which period they are showing. It is the
 * shape US-016's hero band already uses for its chart and its ring, and the
 * reason `Segmented` is a CONTROLLED control with no selection of its own
 * (US-026) and the reason no tile component owns a filter (`HBarTile`'s own
 * period lives in `dashboard/baseline-row.tsx`, not in the tile).
 *
 * The control sits in the SECTION HEAD, not in a card's `action` slot, because
 * a filter that drives three tiles cannot belong to one of them.
 *
 * NOTHING SNAPS ON A PRESS. Every tile below is keyed by CATEGORY inside its
 * own component — bars by kit name, arcs by sponsor, rows by printed name — so
 * a period change transitions the geometry that is on screen and the labels
 * count up from the figure the room can see (US-027). This section adds no key
 * of its own for exactly that reason: keying a tile by period would remount it
 * and every figure would drop to zero and re-enter.
 *
 * ── NOT ONE FIGURE IS TYPED HERE ─────────────────────────────────────────────
 * Every number comes from the US-008 dataset through the root loader, and every
 * number ON TOP of those comes from `repositories/derive.ts`: the kit total,
 * the per-kit revenue and share, the badge share, and the four badge segments
 * (whose rounding correction makes them sum EXACTLY to the centre figure).
 * `kitRevenue` and `homeKitShare` are deliberately absent from the fixture, so
 * `CHF 3.81M` and the narrative's `58%` cannot outlive an edit to the units
 * beneath them. Every string is rendered through `app/lib/format.ts`.
 *
 * BOTH NARRATIVES ARE VERBATIM and are rendered straight from the dataset —
 * this file does not restate either, so there is no second copy to paraphrase.
 *
 * ── THE FOLLOW-UP BEAT (US-035) ──────────────────────────────────────────────
 * "Which badge should we push next?" does NOT append a section. It flips this
 * one's phase to `withFollowUp` and three more grid rows appear under the three
 * above: the shared gold `FollowUpDivider`, a `DriverTile` of the badge trend,
 * and a `RecommendationPanel` carrying the advice. The section that was already
 * on screen grows; nothing is replaced and nothing is duplicated.
 *
 * It is the prototype's first "so-what" moment, so the ORDER OF THE THREE is
 * the argument: the seam says a second question was asked, the bars show that
 * Sunrise is moving fastest, and the panel — an `aside`, structurally not a
 * data tile — says what to do about it. Interpretation is the point; the chart
 * is only the evidence under it.
 *
 * MERCHANDISING DATA ONLY. The squad names below are PRINT COUNTS — what fans
 * bought — and no performance figure of any kind appears beside them.
 */

/* ------------------------------------------------------------------ COPY -- */

/** The three tile titles, in render order. */
export const HERO_1_TILE_TITLES = {
  kits: "Shirt sales by kit",
  badges: "Sponsor badges printed",
  names: "Top printed names",
} as const;

/**
 * The filter's accessible name. Named for what it DRIVES, because the dashboard
 * can show three period filters at once — the band's, Top Products' and this
 * one.
 */
export const HERO_1_PERIOD_LABEL =
  "Period for shirt sales, sponsor badges and printed names";

/** Units the kit figures are counted in, in a subtitle and in a tooltip. */
const SHIRTS_WORD = "shirts";

/** Reads `8% of units` under the ring — the badge share, as a share of shirts. */
const OF_UNITS_TEXT = "of units";

/** Reads `~8%`, quoting the badge share as the Reference Guide quotes it. */
const APPROX_PREFIX = "~";

/** Reads `58% of shirt sales` in a bar's hover box. */
const OF_SALES_TEXT = "of shirt sales";

/** What the printed-names list counts. Copy, not a figure. */
const NAMES_SUBTITLE = "Shirts sold with a name printed";

/** Separates the two halves of a card's scope line. */
const SCOPE_SEPARATOR = " · ";

/**
 * The follow-up tile's title, as the acceptance criteria pin it.
 *
 * "last 3 drops" is the SCOPE OF THE MEASUREMENT, not a figure the tile could
 * derive: the trend entries carry one movement each and nothing in the dataset
 * counts drops, so this is copy in the same sense the tile titles above are.
 */
export const HERO_1_FOLLOW_UP_TITLE = "Badge selection trend (last 3 drops)";

/**
 * The scope line under that title, and the reason the tile does NOT re-rank.
 *
 * The trend arrives in the order sponsors currently sit in `badgeSplit`
 * (Bitpanda 44 / Sunrise 24 / Allianz 20 / IWB 12), so the list reads down from
 * the badge people pick today to the one they pick least — which is what makes
 * Bitpanda's `+2%` read as *flat and already on top* rather than as a small
 * number that lost a race. `tests/unit/hero1-follow-up.test.tsx` asserts the
 * two orders agree, so this line cannot start describing an order the dataset
 * has stopped having.
 */
const TREND_SUBTITLE =
  "Change per sponsor · ordered by current badge selection";

/* -------------------------------------------------------------- GEOMETRY -- */

/**
 * Where each tile sits on US-012's canvas grid — half the grid at `lg`, full
 * width below it, which is the same span Top Products takes for the same
 * reason: a 150px label column plus a 96px value column leave a bar track that
 * must stay readable at 1080p, and the donut needs room for its ring AND its
 * legend side by side.
 */
const TILE_SPAN = "col-span-full lg:col-span-6";

/* --------------------------------------------------------------- PERIOD -- */

/**
 * The period the section OPENS on — the tile's stated scope, and the position
 * the acceptance criteria pin their figures to. It is an initial selection, not
 * a fixed scope: the filter moves it.
 */
export const HERO_1_PERIOD: PeriodKey = PeriodKey.SEASON_TO_DATE;

/* ------------------------------------------------------------------ BODY -- */

export interface Hero1BodyProps {
  /** The Hero 1 primary dataset, from the root loader. */
  primary: Hero1Primary;
  /** The badge-trend follow-up: the movements, and the advice they turn on. */
  followUp: Hero1FollowUp;
  /** Primary answer, or primary plus its follow-up (US-035). */
  phase: InsightSection["phase"];
}

export function Hero1Body({ primary, followUp, phase }: Hero1BodyProps) {
  /**
   * THE ONE PIECE OF PERIOD STATE IN THIS SECTION. Held above all three tiles,
   * which is what makes a single press move every one of them.
   */
  const [periodKey, setPeriodKey] = useState<PeriodKey>(HERO_1_PERIOD);

  // A key with no entry falls back to the first period rather than rendering a
  // section with a hole in it; an empty dataset renders no section body at all.
  // The fallback also means `period.key` — not the raw state — is what the
  // control shows as selected, so the highlight can never lead the tiles.
  const period = primary.periods.find((one) => one.key === periodKey);
  const shown = period ?? primary.periods[0];
  if (!shown) return null;

  const kits = kitRevenueRows(shown);

  return (
    <>
      <SectionHead
        id={sectionLabelId(HeroId.HERO_1)}
        // The chip's own label, imported rather than retyped, so the question
        // in the row above and the answer's heading are one string (US-029).
        label={HERO_CHIP_LABEL[HeroId.HERO_1]}
        // Verbatim, straight from the dataset. Never assembled here.
        narrative={primary.narrative}
        scope={primary.scopeLabel}
        control={
          <Segmented
            // The options ARE the period entries — `SegmentedOption` is the
            // head of `Hero1Period`, so nothing is mapped and the wording
            // ("Current month") travels with the dataset.
            options={primary.periods}
            value={shown.key}
            onChange={setPeriodKey}
            label={HERO_1_PERIOD_LABEL}
          />
        }
      />

      <VBarTile
        title={kitTileTitle(shown)}
        period={kitScopeLine(shown)}
        bars={kits.map((kit) => ({ name: kit.label, value: kit.units }))}
        // Units, share and revenue in one box — criterion 6. The share is
        // `derive.ts`'s division, not a second one written here.
        tooltip={(index) => {
          const kit = kits[index];
          if (!kit) return null;

          return (
            <>
              <div data-slot="kit-tooltip-name" className="mb-0.5 font-bold">
                {kit.label}
              </div>
              <div
                data-slot="kit-tooltip-units"
                className={TABULAR_NUMERALS_CLASS}
              >
                {`${formatNumber(kit.units)} ${SHIRTS_WORD}`}
              </div>
              <div
                data-slot="kit-tooltip-share"
                className={TABULAR_NUMERALS_CLASS}
              >
                {`${formatSharePercent(
                  kitUnitsShare(shown, kit.variant),
                )} ${OF_SALES_TEXT}`}
              </div>
              <div
                data-slot="kit-tooltip-revenue"
                className={TABULAR_NUMERALS_CLASS}
              >
                {formatMoney(kit.revenue)}
              </div>
            </>
          );
        }}
        label={`${HERO_1_TILE_TITLES.kits}, ${shown.label}`}
        isNew
        delayMs={tileDelayMs(0)}
        className={TILE_SPAN}
      />

      <DonutTile
        title={HERO_1_TILE_TITLES.badges}
        period={badgeScopeLine(shown)}
        // The total and the FIXED split; `DonutTile` runs `badgeSegments`
        // itself, so the rounding correction that makes the four segments sum
        // exactly to the centre figure happens once, in `derive.ts`.
        total={shown.badgeTotal}
        split={primary.badgeSplit}
        centreLabel={SHIRTS_WORD}
        label={`${HERO_1_TILE_TITLES.badges}, ${shown.label}`}
        isNew
        delayMs={tileDelayMs(1)}
        className={TILE_SPAN}
      />

      <HBarTile
        title={HERO_1_TILE_TITLES.names}
        period={NAMES_SUBTITLE}
        rows={shown.printedNames.map((printed) => ({
          name: printed.name,
          value: printed.units,
        }))}
        isNew
        delayMs={tileDelayMs(2)}
        className={TILE_SPAN}
      />

      {phase === InsightPhase.WITH_FOLLOW_UP && (
        <>
          {/*
            The beat opens on the shared gold seam, so the three tiles above
            stay the answer to the question that was asked and everything below
            is visibly the answer to the second one. It is a grid item, not a
            wrapper: the section grows by three more rows and never becomes a
            box inside a box.
          */}
          <FollowUpDivider isNew delayMs={tileDelayMs(3)} />

          <DriverTile
            title={HERO_1_FOLLOW_UP_TITLE}
            period={TREND_SUBTITLE}
            // The trend entries ARE the rows — one movement per sponsor, signed
            // in the dataset. Nothing is computed and nothing is retyped.
            rows={followUp.trend.map((entry) => ({
              name: entry.sponsor,
              value: entry.deltaPercent,
            }))}
            // AUTHORED ORDER, NOT MAGNITUDE. `magnitude` would open the list on
            // Sunrise's +38 and push Bitpanda to third, which reads as "Bitpanda
            // is falling behind" — the opposite of the narrative below it.
            // Held in `badgeSplit` order, the column says "who is picked most"
            // and the bars say "who is moving", and the beat's point survives:
            // Sunrise's +38 is the LONGEST bar wherever it sits, because
            // `HBars` scales every row against the largest magnitude in the
            // list. See {@link TREND_SUBTITLE}.
            rank="none"
            // Percentages, both directions, from `app/lib/format.ts` — the
            // sign is the movement's meaning, so it is always spelled out.
            format={formatSignedPercent}
            series="blue"
            // No `showTotal`: adding four percentage movements together
            // produces a number that means nothing, so the badge stays off.
            // No gold accent either — the divider above and the panel below
            // are the beat's gold, and a chart in the beat is still a chart.
            isNew
            delayMs={tileDelayMs(4)}
            className={TILE_SPAN}
          />

          {/*
            THE SO-WHAT. An `aside`, not a fourth metric card (US-024): it sits
            beside the bars at `lg` so the room reads the movement and the
            advice in one glance. The narrative is handed over VERBATIM, from
            the dataset — this file states no part of it.
          */}
          <RecommendationPanel
            isNew
            delayMs={tileDelayMs(5)}
            className={TILE_SPAN}
          >
            {followUp.narrative}
          </RecommendationPanel>
        </>
      )}
    </>
  );
}

/* --------------------------------------------------------------- STRINGS -- */

/**
 * `Shirt sales by kit (season to date)` — the title the acceptance criteria
 * pin, with the period taken from the DATASET's own label rather than written
 * into the string. The section opens on Season to date, so the pinned wording
 * is what the room sees; press the filter and the title follows the figures
 * instead of claiming a scope the bars no longer show.
 */
function kitTileTitle(period: Hero1Period): string {
  return `${HERO_1_TILE_TITLES.kits} (${period.label.toLowerCase()})`;
}

/** `38’500 shirts · CHF 3.81M` — both figures derived, neither stored. */
function kitScopeLine(period: Hero1Period): string {
  return [
    `${formatNumber(kitUnitsTotal(period))} ${SHIRTS_WORD}`,
    formatMoneyMillions(kitRevenueTotal(period)),
  ].join(SCOPE_SEPARATOR);
}

/** `3’080 shirts · ~8% of units` — the badge share is derived from the units. */
function badgeScopeLine(period: Hero1Period): string {
  return [
    `${formatNumber(period.badgeTotal)} ${SHIRTS_WORD}`,
    `${APPROX_PREFIX}${formatSharePercent(badgeShare(period))} ${OF_UNITS_TEXT}`,
  ].join(SCOPE_SEPARATOR);
}
