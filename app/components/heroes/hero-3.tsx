import { CompareBars } from "../tiles/compare-bars";
import { DepartmentTableTile } from "../tiles/department-table";
import { DriverTile } from "../tiles/driver-tile";
import { KpiTile } from "../tiles/kpi-tile";
import { RecommendationPanel } from "../tiles/recommendation-panel";
import { HERO_CHIP_LABEL } from "../../lib/dashboard/chips";
import {
  InsightPhase,
  type InsightSection,
} from "../../lib/dashboard/sections";
import {
  chfFromThousands,
  formatMoneyCompact,
  formatMoneyMillionsFixed,
  formatNumber,
  formatPercent,
  formatSignedMoneyCompact,
  TABULAR_NUMERALS_CLASS,
} from "../../lib/format";
import {
  departmentPerformanceRows,
  departmentsNeedingAttention,
  departmentsOnTarget,
  departmentTotals,
} from "../../lib/repositories/derive";
import { HeroId, VarianceJudgement } from "../../lib/repositories/enums";
import {
  type ConversionGap,
  type Hero3FollowUp,
  type Hero3Primary,
} from "../../lib/repositories/types";
import {
  FollowUpDivider,
  SectionHead,
  sectionLabelId,
  tileDelayMs,
} from "./hero-section";

/**
 * HERO 3 — "Show me the budget of each department, the difference of actuals to
 * budget, and the % of target achieved."
 *
 * Two tiles in a fixed order, under one narrative, one scope line and NO
 * filter:
 *
 *   1. `DepartmentTableTile`  Departmental performance (full year)   (US-022)
 *   2. `KpiTile` + `CompareBars`  Overall, actual against budget  (US-017/036)
 *
 * NOTHING IS BUILT HERE. `DepartmentTableTile` reaches a screen for the FIRST
 * time in this file — the six rows, the total row, the Revenue / Cost tags, the
 * variance chips, the target bars and the flagged row are all its own — and the
 * overall tile is US-017's `KpiTile` around US-036's `CompareBars`. This module
 * contributes layout, copy, and the composition of the one formatter both tiles
 * are handed.
 *
 * ── THE REVENUE / COST TRAP, AND WHY IT CANNOT BITE HERE ────────────────────
 * THE SINGLE MOST IMPORTANT THING IN THIS SECTION. For a REVENUE department an
 * actual above budget is money earned; for the Marketing COST CENTRE the same
 * arithmetic is an OVERSPEND. A table that painted "variance > 0" green would
 * show Marketing's +0.41 as a success directly above a follow-up that calls it
 * the club's one problem department — wrong in front of the owner, and it would
 * gut the beat US-039 exists for.
 *
 * The good/bad reading is therefore never made in a component. `derive.ts`
 * makes it once from the department's `type` (`varianceJudgement`) and it
 * travels as `judgement` on every row this file hands over, so Sponsoring's
 * +0.84 renders FAVOURABLE and Marketing's +0.41 renders ADVERSE on the same
 * screen. `needsAttention` works the same way: the flagged row is whichever
 * department is BOTH over budget and behind target, which the figures decide.
 * Marketing is not named in this file, and neither judgement word appears in it.
 *
 * ── NOT ONE FIGURE IS TYPED HERE ────────────────────────────────────────────
 * Every figure comes from the US-010 dataset through the root loader, and
 * everything on top of it is `derive.ts`'s: `departmentPerformanceRows` derives
 * the six rows, `departmentTotals` the 69.00 / 69.68 / +0.68 headline and its
 * +1.0%, and `departmentsOnTarget` the above-target COUNT — three of six, never
 * a literal. US-010 refused to port the Reference Guide's stored `totalBudget`,
 * `totalActual` and Marketing `flag`; there is no stored total or flag to read
 * here even if a later edit wanted one.
 *
 * `blendedTargetPercent` IS the one stored figure, and it has to be: it is a
 * Finance-supplied club-level attainment that no arithmetic over the six rows
 * reproduces (their plain mean is 97.0, budget-weighted 99.7, and the club
 * figure is 96). It is passed through untouched — never recomputed, never
 * "corrected" to a mean.
 *
 * THE NARRATIVE IS VERBATIM and is rendered straight from the dataset — this
 * file does not restate it, so there is no second copy to paraphrase.
 *
 * ── ONE SCOPE, AND IT IS ON THE HEAD ────────────────────────────────────────
 * Hero 3's figures are FULL-YEAR departmental totals and its Ticketing row
 * INCLUDES the season-ticket base, so 24.36 here legitimately exceeds the 7.83
 * of Hero 2's eight shown matchday fixtures. Intended, not inconsistent — but
 * an unlabelled mismatch reads as an arithmetic error to the first person in
 * the room who adds up the two sections, which in this room is everyone.
 *
 * So `primary.scopeLabel` is on the SECTION HEAD, from the dataset. Unlike
 * Hero 2 — whose two charts are at two different scopes and therefore each
 * carry their own line — both of Hero 3's tiles are the same six departments
 * over the same full year, so the scope is stated ONCE above them instead of
 * twice inside them.
 *
 * ── UNITS: THE DATASET IS IN CHF THOUSANDS, THE SCREEN IS IN MILLIONS ───────
 * US-022's review decision, which must not be reverted: this table is quoted in
 * CHF MILLIONS with a subtitle saying so, never in "CHF 000". The tile appends
 * that note itself and it cannot be switched off. The acceptance criteria word
 * the title "(full year, CHF 000)"; the "000" half is the wording US-022 was
 * reported for and corrected, so the title carries the SCOPE half only and the
 * scale is the tile's own note. There is no factor of a thousand in this file —
 * `chfFromThousands` is the one conversion, and the single composition at the
 * foot of this file is the only place a figure becomes text.
 *
 * ── NO FILTER, ON PURPOSE ───────────────────────────────────────────────────
 * Hero 1 owns the prototype's section-level period filter. Hero 3's question is
 * a closed full-year budget, so there is no period to choose and no `Segmented`
 * here; adding one would invent a control the question does not ask for.
 *
 * ── THE FOLLOW-UP BEAT (US-039) — THE CAUSAL PEAK ───────────────────────────
 * "Why is Marketing over budget and behind target?" is the beat the whole
 * prototype exists to produce, and it does NOT append a section: it flips this
 * one's phase and three more grid rows appear under the two tiles above — the
 * shared gold `FollowUpDivider`, a `DriverTile` of Marketing's overspend, and a
 * `RecommendationPanel` in its GOLD `recommendation` variant. The section that
 * was already on screen grows; the table and the overall tile stay put.
 *
 * THE ORDER OF THE THREE IS THE ARGUMENT. The seam says a second question was
 * asked; the tile says WHERE the money went (match activations CHF 240k, paid
 * social CHF 150k, the agency retainer CHF 20k) and, in the same tile, that it
 * bought LESS than planned (webshop conversion against its plan); and the panel
 * says what to DO — an `aside`, structurally not a data tile (US-024), because
 * this is the one place on the canvas that advises rather than measures. Unlike
 * Hero 2's beat the panel is GOLD: this copy ends in an explicit
 * recommendation, which is exactly what colour rule 4 reserves gold for.
 *
 * BOTH HALVES OF THE STORY ARE ON THE TILE. Marketing overspent AND
 * underdelivered, so the bars alone are only half an answer: the conversion
 * figures sit under them as the outcome the spend was chasing. Both come from
 * `followUp`, formatted once at the foot of this file.
 *
 * NOT ONE FIGURE IN THE BEAT IS TYPED EITHER. The three drivers are the
 * dataset's own rows, the conversion pair is its own measurement, and the
 * `+CHF 410k total` badge is US-023's `driverTotal` — summed from the rows ON
 * SCREEN, which is what makes it equal to the Marketing variance the table
 * above derives. The badge's judgement is the one thing that cannot come from
 * the sign: an overspend going UP is bad news, so it is passed ADVERSE, the
 * same Revenue / Cost reading the table makes one row at a time. The SIGN is
 * still written, because the badge is a variance chip (US-044).
 *
 * DEPARTMENTS, NEVER PEOPLE. This is the section closest to the
 * named-individual guardrail and it stays aggregate: departmental budgets,
 * actuals and outcome attainment. No salary, no headcount attributed to a
 * person, no individual's target.
 */

/* ------------------------------------------------------------------ COPY -- */

/** The two tile titles, in render order. */
export const HERO_3_TILE_TITLES = {
  /**
   * The acceptance criteria's wording MINUS its "CHF 000" half — see the units
   * note above. "(full year)" is the scope of the figures and stays; the scale
   * is the tile's own `MILLIONS_NOTE`, appended to the subtitle by US-022's
   * component rather than typed into a title here.
   */
  table: "Departmental performance (full year)",
  overall: "Overall, actual against budget",
} as const;

/** The line under the overall tile's headline: what the figure is OF. */
const OVERALL_SUBTITLE = "Actual across all departments";

/** The two compare bars' labels — the comparison, in words. */
export const HERO_3_COMPARE_LABELS = {
  budget: "Budget",
  actual: "Actual",
} as const;

/**
 * The two-up footer's eyebrows.
 *
 * `blended` names a MEASUREMENT (the stored club-level attainment) and
 * `aboveTarget` names a COUNT derived from the rows above it. Both are labels
 * only: neither states how many or how much.
 */
export const HERO_3_FOOTER_LABELS = {
  blended: "Blended target",
  aboveTarget: "Above target",
} as const;

/** Reads `3 of 6` — the count, then the field it was counted out of. */
const OF_WORD = "of";

/**
 * The follow-up tile's title, as the acceptance criteria pin it.
 *
 * It NAMES Marketing, and it is the only place in this file that does. The
 * primary answer must not (the table's flag is derived from the figures, so
 * naming a department there would hard-code the club's problem); the beat is
 * asked about one department by name, so its tile says which. The department it
 * names is the one `departmentsNeedingAttention` flags in the table above —
 * asserted in `tests/unit/hero3-follow-up.test.tsx`, so the title cannot start
 * interrogating a department the figures have stopped flagging.
 */
export const HERO_3_FOLLOW_UP_TITLE = "What's driving Marketing";

/**
 * The scope line under that title. It states the ORDER, because the order is
 * the tile's claim: the biggest slice of the overspend first.
 */
const DRIVER_SUBTITLE = "Overspend against plan per driver · biggest first";

/**
 * THE OUTCOME HALF, under the bars: the webshop conversion the paid-social
 * spend was chasing, achieved against planned.
 *
 * The bars say the money went out; this says what it bought, which is the
 * difference between "Marketing overspent" and the answer the room actually
 * asked for. Its two figures are the dataset's, formatted at the foot of this
 * file — nothing here states either of them.
 *
 * The wording is deliberately NOT a copy of the narrative's clause: the
 * dataset's sentence makes the same point at length ("conversion landed at 2.2%
 * against a 2.6% plan") and this line is worded independently, so the verbatim
 * copy exists in exactly one place. A test scans the component layer for that
 * clause and fails if it reappears here.
 */
const CONVERSION_PREFIX = "What that money was meant to buy:";
const CONVERSION_LABEL = "webshop conversion";

/** Reads `2.2% vs 2.6% plan` — the achieved figure against the planned one. */
const VERSUS_WORD = "vs";
const PLAN_WORD = "plan";

/* -------------------------------------------------------------- GEOMETRY -- */

/**
 * Where each tile sits on US-012's canvas grid.
 *
 * The table takes two thirds and the overall tile the remaining third, side by
 * side — the reference build's own split, and the table needs the width: six
 * columns, one of them holding "Marketing & Communications", against a headline
 * with two compare bars and a two-up footer, which does not.
 *
 * ── WHY `xl` AND NOT `lg`, MEASURED IN CHROME ───────────────────────────────
 * The same class of reason US-019's chips forced Hero 2's pair to `xl`. Table
 * width, and how the longest name ("Marketing & Communications") wraps in it:
 *
 *   1920   8 of 12   1051px   2 lines      1280   8 of 12   625px   3 lines
 *   1440   8 of 12    731px   2 lines      1024   full      710px   2 lines
 *    834   full       760px   2 lines       768   full      694px   2 lines
 *
 * At `lg` two thirds of the canvas would leave the table under 500px, which is
 * where the figure columns start colliding; the tile scrolls its table rather
 * than overflowing it (US-022), so nothing would break — but a horizontal
 * scrollbar under the club's numbers is not what the room should be looking at.
 *
 * At `xl` itself, 625px still costs the longest name a third line. That is
 * ACCEPTED and it is the reason the name column has no truncation: the row
 * grows, the figures stay put, and no name is ever cut. Nothing scrolls and
 * nothing overflows at any of the six widths above. The presentation target is
 * 1920, where the table has a thousand pixels and every name reads on two.
 */
const TABLE_TILE_SPAN = "col-span-full xl:col-span-8";
const OVERALL_TILE_SPAN = "col-span-full xl:col-span-4";

/**
 * The beat's two rows: half the grid each at `lg`, so the room reads WHERE the
 * money went and WHAT TO DO about it in one glance — the same span Hero 1's and
 * Hero 2's beats take, because it is the same pair of elements.
 *
 * `lg` and not the `xl` the two tiles above need: a three-row bar list is a
 * 150px label column plus a 96px value column (US-021), which fits half the
 * canvas comfortably at 1024. Nothing here has the table's six columns.
 */
const FOLLOW_UP_TILE_SPAN = "col-span-full lg:col-span-6";

/* ------------------------------------------------------------------ BODY -- */

export interface Hero3BodyProps {
  /** The Hero 3 primary dataset, from the root loader. */
  primary: Hero3Primary;
  /**
   * The causal follow-up: Marketing's spend drivers, the webshop conversion
   * they were chasing, and the VERBATIM recommendation. Held beside `primary`
   * exactly as Heroes 1 and 2 hold both halves, so the beat's figures are
   * already on the client when the second question is asked.
   */
  followUp: Hero3FollowUp;
  /** Primary answer, or primary plus its follow-up (US-039). */
  phase: InsightSection["phase"];
}

export function Hero3Body({ primary, followUp, phase }: Hero3BodyProps) {
  const { departments, blendedTargetPercent } = primary;

  // DERIVED ROWS, not raw departments: every row arrives carrying the
  // revenue/cost-aware `judgement` and the `needsAttention` flag, worked out
  // once in `derive.ts`. The table's own prop type refuses anything less.
  const rows = departmentPerformanceRows(departments);

  // The club-wide position, summed from the same six rows the table lists.
  const totals = departmentTotals(departments);

  // The above-target COUNT, derived from the same rows: the departments that
  // hit or beat their own outcome target.
  const onTarget = departmentsOnTarget(departments);

  // THE BEAT'S SUBJECT, TAKEN FROM THE FIGURES RATHER THAN FROM A NAME: the
  // department both over budget and behind target — the one row the table
  // above flags. Only its `judgement` is read here, because that is the
  // revenue/cost reading `derive.ts` already made, and it is what tells the
  // beat's badge that a rising total is bad news. On the seeded data that is
  // Marketing; if the figures moved, both the flag and the badge would follow.
  const flagged = departmentsNeedingAttention(departments)[0];

  return (
    <>
      <SectionHead
        id={sectionLabelId(HeroId.HERO_3)}
        // The chip's own label, imported rather than retyped, so the question
        // in the row above and the answer's heading are one string (US-029).
        label={HERO_CHIP_LABEL[HeroId.HERO_3]}
        // Verbatim, straight from the dataset. Never assembled here.
        narrative={primary.narrative}
        // ONE scope for both tiles, from the dataset — it is what makes the
        // Ticketing row and Hero 2's fixture total both correct.
        scope={primary.scopeLabel}
      />

      <DepartmentTableTile
        title={HERO_3_TILE_TITLES.table}
        // Six departments plus the total row, each tagged Revenue or Cost,
        // with its variance and its % of target. Marketing is flagged because
        // `needsAttention` says so, not because this file names it.
        rows={rows}
        // The STORED club-level attainment, passed through for the total row.
        // Omitting it would leave the footer with no percentage rather than an
        // invented one; recomputing it would invent one.
        blendedTargetPercent={blendedTargetPercent}
        isNew
        delayMs={tileDelayMs(0)}
        className={TABLE_TILE_SPAN}
      />

      <KpiTile
        title={HERO_3_TILE_TITLES.overall}
        // CHF 69.68M, derived from the rows in the table beside it.
        value={totals.actual}
        format={moneyMillions}
        // +1.0% against the budgeted position, and NEUTRAL on purpose: the
        // club-level movement is arithmetic across five revenue departments and
        // one cost centre, so it is a FACT rather than a verdict — exactly as
        // the table's own total row states it (US-022). Judgement stays per
        // row, where the Revenue / Cost tag is. The sign and the arrow still
        // report which way it went.
        delta={{
          value: totals.variancePercent,
          judgement: VarianceJudgement.NEUTRAL,
        }}
        subtitle={OVERALL_SUBTITLE}
        isNew
        delayMs={tileDelayMs(1)}
        className={OVERALL_TILE_SPAN}
      >
        {/* Budget against actual on ONE scale, labelled, in the table's own
            colours: navy for the plan, club blue for what happened. Both
            figures go through the same fixed-decimal composition, so the pair
            reads as two figures of one measure. */}
        <CompareBars
          className="mt-4"
          format={moneyMillions}
          rows={[
            {
              name: HERO_3_COMPARE_LABELS.budget,
              value: totals.budget,
              series: "navy",
            },
            {
              name: HERO_3_COMPARE_LABELS.actual,
              value: totals.actual,
              series: "blue",
            },
          ]}
        />

        {/* THE TWO-UP FOOTER. The blended target is the club's measured
            attainment; the count beside it is how many of the six departments
            got to their own. Two different kinds of answer to "did we hit
            target?", which is why they sit side by side. */}
        <div
          data-slot="overall-footer"
          className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3.5"
        >
          <div data-slot="overall-blended">
            <div className="tile-title">{HERO_3_FOOTER_LABELS.blended}</div>
            <div
              data-slot="overall-blended-value"
              className={`mt-0.5 text-body font-bold ${TABULAR_NUMERALS_CLASS}`}
            >
              {formatPercent(blendedTargetPercent)}
            </div>
          </div>

          <div data-slot="overall-above-target">
            <div className="tile-title">{HERO_3_FOOTER_LABELS.aboveTarget}</div>
            <div
              data-slot="overall-above-target-value"
              className={`mt-0.5 text-body font-bold ${TABULAR_NUMERALS_CLASS}`}
            >
              {formatNumber(onTarget.length)}
              <span className="ml-1 font-medium text-muted">
                {`${OF_WORD} ${formatNumber(rows.length)}`}
              </span>
            </div>
          </div>
        </div>
      </KpiTile>

      {phase === InsightPhase.WITH_FOLLOW_UP && (
        <>
          {/*
            THE CAUSAL PEAK opens on the shared gold seam — the same component
            Heroes 1 and 2 open on, never a third gold rule. It is a grid item,
            so the section grows by three more rows instead of becoming a box
            in a box.
          */}
          <FollowUpDivider isNew delayMs={tileDelayMs(2)} />

          <DriverTile
            title={HERO_3_FOLLOW_UP_TITLE}
            period={DRIVER_SUBTITLE}
            // The dataset's own drivers ARE the rows — one amount over plan
            // each. Nothing is computed and nothing is retyped.
            rows={followUp.drivers.map((driver) => ({
              name: driver.name,
              value: driver.amount,
            }))}
            // Every row is money over plan, so one compact composition spells
            // all four figures identically.
            format={money}
            // THE BADGE IS A VARIANCE, THE ROWS ARE MAGNITUDES (US-044). A row
            // reads `CHF 240k` of overspend; the total reads `+CHF 410k`,
            // because a variance chip always writes its sign and this one is a
            // rise. Same composition, signed — see `totalFormat` in
            // `app/components/tiles/driver-tile.tsx`.
            totalFormat={signedMoney}
            // MAGNITUDE ORDER, the tile's default: the biggest slice of the
            // overspend first, which is the one the recommendation acts on.
            //
            // `CHF 410k total` in the card's action slot, summed by US-023 from
            // the rows above it — and therefore equal to the variance the table
            // derives for Marketing, which is the substance of this beat: the
            // three drivers explain the WHOLE overspend, not part of it.
            showTotal
            // THE ONE JUDGEMENT THE SIGN CANNOT CARRY (US-022's trap again).
            // A rising total is money earned for a revenue department and an
            // OVERSPEND for this cost centre, so the badge is told which — and
            // it is told by `derive.ts`, through the judgement already on the
            // row the table above flags. No verdict is decided in this file.
            totalJudgement={flagged?.judgement}
            // The outcome half: what the money bought, under the bars that say
            // where it went.
            note={
              <>
                {`${CONVERSION_PREFIX} `}
                <span
                  data-slot="conversion-gap"
                  className={`font-semibold text-text ${TABULAR_NUMERALS_CLASS}`}
                >
                  {`${CONVERSION_LABEL} ${conversionGap(followUp.conversion)}`}
                </span>
              </>
            }
            isNew
            delayMs={tileDelayMs(3)}
            className={FOLLOW_UP_TILE_SPAN}
          />

          {/*
            THE SO-WHAT, AND THE MOMENT THE PROTOTYPE EXISTS FOR. An `aside`,
            not a third metric card (US-024): advice, in the GOLD
            `recommendation` variant, because this copy ends in an explicit
            recommendation. The sentence is handed over VERBATIM, from the
            dataset; this file states no part of it.
          */}
          <RecommendationPanel
            isNew
            delayMs={tileDelayMs(4)}
            className={FOLLOW_UP_TILE_SPAN}
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
 * The ONE composition that turns CHF THOUSANDS into text in this section, and
 * the reason no factor of a thousand is written above.
 *
 * `CHF 69.00M`, `CHF 69.68M` — fixed at two decimals, because the headline and
 * the two compare bars are one comparison and a comparison is a column. The
 * table's own cells format themselves (US-022, bare millions under the scale
 * note); this is only for the tile beside it.
 */
function moneyMillions(thousands: number): string {
  return formatMoneyMillionsFixed(chfFromThousands(thousands));
}

/**
 * `CHF 240k` — one driver's overspend against plan, as a bar label.
 *
 * Compact, because the beat's figures are hundreds of thousands rather than the
 * tens of millions the two tiles above report, and a bar label reads at a
 * glance. UNSIGNED: each row is an amount that went somewhere, not a movement.
 */
function money(thousands: number): string {
  return formatMoneyCompact(chfFromThousands(thousands));
}

/**
 * `+CHF 410k` — the beat's TOTAL, which is a movement and therefore signed.
 *
 * The same compact composition as {@link money}, so the badge and the bars
 * cannot spell CHF thousands differently; the only difference is the sign,
 * which a variance chip always writes (`app/lib/format.ts`). Marketing's
 * overspend is a RISE, so the sign is a plus and the token is still the
 * negative one — US-022's trap, spelled out.
 */
function signedMoney(thousands: number): string {
  return formatSignedMoneyCompact(chfFromThousands(thousands));
}

/**
 * `2.2% vs 2.6% plan` — the achieved conversion against the planned one.
 *
 * The ONE place the outcome half becomes text. Both percentages come from the
 * dataset's measurement and go through the app's own percentage rule, so
 * neither is rounded here and neither is written here.
 */
function conversionGap(conversion: ConversionGap): string {
  return [
    formatPercent(conversion.actualPercent),
    VERSUS_WORD,
    formatPercent(conversion.planPercent),
    PLAN_WORD,
  ].join(" ");
}
