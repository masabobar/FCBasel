import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../../lib/cn";
import {
  chfFromThousands,
  formatMillions,
  formatPercent,
  formatSignedMillions,
  TABULAR_NUMERALS_CLASS,
} from "../../lib/format";
import { useGrow } from "../../lib/hooks/use-motion";
import { type TranslationKey } from "../../lib/i18n";
import { useT } from "../../lib/i18n/context";
import {
  type DepartmentPerformance,
  departmentTotals,
  ON_TARGET_PERCENT,
} from "../../lib/repositories/derive";
import {
  DepartmentType,
  VarianceJudgement,
} from "../../lib/repositories/enums";
import { Card, type CardProps } from "./card";
import { DeltaChip } from "./delta-chip";

/**
 * The department table — Hero 3's primary tile: six departments, budget against
 * actual against their own outcome target, plus the club total.
 *
 * A REAL `<table>`. This is the one genuinely tabular thing in the product: six
 * rows and a footer, read across as well as down. So it is a `<table>` with
 * `<thead>` / `<tbody>` / `<tfoot>`, `scope="col"` on every header, a
 * `scope="row"` header per department and an `sr-only` `<caption>` — not a grid
 * of divs with table roles bolted on. Six rows is also why there is no
 * TanStack Table here (decided 2026-09-09): nothing sorts, filters or pages.
 *
 * ────────────────────── THE REVENUE / COST TRAP, AND WHY THIS FILE CANNOT
 * FALL INTO IT ──────────────────────
 * For a revenue department an actual above budget is money earned. For the
 * Marketing COST centre the same arithmetic is an OVERSPEND. A table that
 * paints "variance > 0" green shows Marketing's +410 as a success, directly
 * above a follow-up that calls it the club's one problem department.
 *
 * The good/bad reading is therefore NOT made here. `varianceJudgement` in
 * `app/lib/repositories/derive.ts` makes it once, from the department's
 * `type`, and it travels as `judgement` on {@link DepartmentPerformance}; this
 * file hands that value to {@link DeltaChip} and takes the colour from it.
 * There is deliberately no comparison of a variance against zero anywhere
 * below, and the words `FAVOURABLE` and `ADVERSE` do not appear in this file at
 * all — a test scans the source for both, so the judgement can never quietly
 * migrate back into the component.
 *
 * `needsAttention` is used the same way: the flagged row is whichever
 * department is BOTH over budget and behind target, derived in `derive.ts`.
 * Marketing is never named here, so the flag cannot outlive the figures.
 *
 * ────────────────────── TWO REVIEW DECISIONS THAT MUST NOT BE REVERTED
 * ──────────────────────
 *   1. FIGURES ARE IN CHF MILLIONS, and the tile says so. "CHF 000" was wrong
 *      on this table: the fix is {@link formatMillions} plus the
 *      {@link MILLIONS_NOTE_KEY} subtitle, which is not a prop and cannot be
 *      switched off. No thousands figure and no "000" note may come back.
 *   2. THE NUMERIC HEADERS ARE RIGHT-ALIGNED, "% of target" INCLUDED — its
 *      header sat left of its bar-and-percentage content and was reported.
 *      The fix is structural rather than a class pasted onto one `<th>`:
 *      {@link DEPARTMENT_COLUMNS} declares which columns are numeric, and
 *      {@link columnAlignClass} is the ONE rule both the header and the body
 *      cell of a column read their alignment from. A header cannot drift away
 *      from the column under it without moving the column too.
 *
 * ────────────────────── THE REST OF THE HOUSE RULES ──────────────────────
 * Colour is never the sole signal: the variance carries a sign, an arrow and a
 * word (`DeltaChip`), the gold target marks carry a shape and a word, and the
 * flagged row carries an icon and a sentence. Every string comes from
 * `app/lib/format.ts` — there is no `toFixed`, no factor of a thousand and no
 * hex in this file. Rows are keyed by department NAME, never by index. The
 * only motion is US-027's `useGrow` on the target bars, so under reduced
 * motion they render at their final width instead of being stranded at zero.
 */

/* ------------------------------------------------------------- SUBTITLE -- */

/**
 * The scale note, stated once for the whole table.
 *
 * NOT A PROP. Repeating "CHF" in thirty cells is noise, so the cells carry
 * bare figures ({@link formatMillions}) and this line is what makes them
 * readable — which means a caller must not be able to omit it. It is the
 * corrected wording: the table used to be quoted in "CHF 000".
 */
export const MILLIONS_NOTE_KEY: TranslationKey = "tiles.millionsNote";

/** Divider between a caller's scope line and the note above. */
export const SUBTITLE_SEPARATOR = "·";

/**
 * The table's accessible name. A screen-reader user meets the table without
 * the card header around it, so the scale is repeated here rather than assumed.
 */
export const TABLE_CAPTION_KEY: TranslationKey = "tiles.tableCaption";

/* -------------------------------------------------------------- COLUMNS -- */

/** The six columns, by identity. Published on each cell as `data-column`. */
export type DepartmentColumnKey =
  "name" | "type" | "budget" | "actual" | "variance" | "targetPercent";

export interface DepartmentColumn {
  readonly key: DepartmentColumnKey;
  /** Header text, exactly as the acceptance criteria word it, per language. */
  readonly labelKey: TranslationKey;
  /**
   * Whether the column holds FIGURES. It decides the alignment of the header
   * and of every cell under it through {@link columnAlignClass} — one flag,
   * two consumers, which is the whole point.
   */
  readonly numeric: boolean;
}

/**
 * The column set, in order. The single declaration of what this table shows:
 * the header row, the body cells and the total row are all generated against
 * it, so a column cannot exist in one of the three and be missing from another.
 *
 * "% of target" IS NUMERIC even though its cell draws a bar beside the figure —
 * that is exactly the misalignment this flag fixes.
 */
export const DEPARTMENT_COLUMNS: readonly DepartmentColumn[] = [
  { key: "name", labelKey: "tiles.column.name", numeric: false },
  { key: "type", labelKey: "tiles.column.type", numeric: false },
  { key: "budget", labelKey: "tiles.column.budget", numeric: true },
  { key: "actual", labelKey: "tiles.column.actual", numeric: true },
  { key: "variance", labelKey: "tiles.column.variance", numeric: true },
  {
    key: "targetPercent",
    labelKey: "tiles.column.targetPercent",
    numeric: true,
  },
];

/** Alignment of a figure column — header and cell alike. */
export const NUMERIC_ALIGN_CLASS = "text-right";

/** Alignment of a text column. */
export const TEXT_ALIGN_CLASS = "text-left";

/**
 * A column's alignment class.
 *
 * THE PROOF OF REVIEW DECISION 2 LIVES HERE. The header `<th>` and the body
 * `<td>` of a column both take their alignment from this one call, so "the
 * header sits over its content" is a structural property rather than a class
 * someone remembered to type — including on "% of target", the column that was
 * reported.
 */
export function columnAlignClass(column: DepartmentColumn): string {
  return column.numeric ? NUMERIC_ALIGN_CLASS : TEXT_ALIGN_CLASS;
}

/* ---------------------------------------------------------- TARGET MARK -- */

/**
 * Lowest attainment that still counts as NEAR its target, in percent.
 *
 * 95 to 99 is the gold near-target band: Hospitality (95) earns a mark and
 * Merchandising (92) does not. {@link ON_TARGET_PERCENT} — 100 — is imported
 * from `derive.ts` rather than restated, so the two ends of the band cannot
 * drift apart.
 */
export const NEAR_TARGET_MIN_PERCENT = 95;

/**
 * Whether a department's target attainment earns a gold mark, and which.
 *
 * A PRESENTATION BAND, WHICH IS WHY IT IS HERE AND NOT IN `derive.ts`. Whether
 * a department is behind target is a FACT and is derived there (`behindTarget`,
 * and `needsAttention` on top of it). This decides how close to the line is
 * close enough to earn a MARK on the bar — a visual threshold, owned by the
 * component that draws the mark.
 */
export const TargetMark = {
  /** On or above target. */
  HIT: "HIT",
  /** Within the 95-99 band — short, but within touching distance. */
  NEAR: "NEAR",
  /** Below the band. No mark: gold is for target marks only. */
  BEHIND: "BEHIND",
} as const;

export type TargetMark = (typeof TargetMark)[keyof typeof TargetMark];

/** How a mark is worded, since colour reaches no screen reader. */
export const TARGET_MARK_LABEL_KEY: Record<TargetMark, TranslationKey> = {
  [TargetMark.HIT]: "tiles.targetMark.HIT",
  [TargetMark.NEAR]: "tiles.targetMark.NEAR",
  [TargetMark.BEHIND]: "tiles.targetMark.BEHIND",
};

/**
 * The mark's dot, by band. `null` means no mark at all.
 *
 * GOLD IS PERMITTED HERE and nowhere else in this file: colour discipline rule
 * 4 reserves it for target-hit marks, which is precisely what these are. The
 * two bands differ in SHAPE as well as tone — a filled dot for a hit, a ring
 * for a near miss — so the distinction survives a projector that washes the
 * gold out, and the deeper gold is the token made for contrast on white.
 */
export const TARGET_MARK_DOT_CLASS: Record<TargetMark, string | null> = {
  [TargetMark.HIT]: "bg-accent-target-hit",
  [TargetMark.NEAR]: "border-2 border-accent-follow-up",
  [TargetMark.BEHIND]: null,
};

/** Which band an attainment percentage falls in. Pure. */
export function targetMark(percent: number): TargetMark {
  if (!Number.isFinite(percent)) {
    return TargetMark.BEHIND;
  }
  if (percent >= ON_TARGET_PERCENT) {
    return TargetMark.HIT;
  }
  return percent >= NEAR_TARGET_MIN_PERCENT
    ? TargetMark.NEAR
    : TargetMark.BEHIND;
}

/* ------------------------------------------------------------- GEOMETRY -- */

/** Width of the target bar's track, in pixels. */
export const TARGET_BAR_WIDTH_PX = 64;

/** Nothing to draw yet — the state a bar grows out of. */
const NO_WIDTH = 0;

/** Per-row stagger of the width transition, so the column sweeps in. */
const ROW_STAGGER_MS = 40;

/** Size of the flag icon on the department that needs attention. */
const FLAG_ICON_SIZE = 14;

/**
 * A bar's fill as a percentage of its track, `0` to `100`.
 *
 * The track IS the target, so 100% fills it and Events' 105% fills it too —
 * overshoot is carried by the figure beside the bar and by the gold hit mark,
 * not by a bar that runs out of the tile. Non-finite input yields no width
 * rather than a `NaN` that would render as a silently absent bar.
 */
export function targetBarPercent(percent: number): number {
  if (!Number.isFinite(percent) || percent <= NO_WIDTH) {
    return NO_WIDTH;
  }
  return Math.min(percent, ON_TARGET_PERCENT);
}

/* ------------------------------------------------------------ CELL BASE -- */

/** Padding and hairline shared by every body cell. */
const CELL_CLASS = "border-t border-line px-2 py-2.5 align-middle";

/** Figures never wrap: `21.00` and `+0.41` stay on one line. */
const NUMERIC_CELL_CLASS = "whitespace-nowrap";

/**
 * The hover highlight. A background change only — a table row that lifts or
 * grows under the cursor shifts every row below it. The `fast` duration token
 * runs it, and `app/app.css` collapses that to ~1ms under reduced motion, so
 * the highlight still lands.
 */
export const ROW_HOVER_CLASS =
  "transition-colors duration-(--duration-fast) hover:bg-surface";

/**
 * The flagged row's ground: the follow-up gold at low opacity.
 *
 * Gold rather than the negative variance token, because this row is the SUBJECT
 * OF THE FOLLOW-UP ("why is Marketing over budget and behind target?"), which
 * is the accent's own job (colour discipline rule 4). The verdict on the
 * variance is the chip's, and it stays the chip's.
 */
export const FLAGGED_ROW_CLASS = "bg-accent-target-hit/10";

/** What the flag means, in words, for anyone who cannot see the tint. */
export const FLAG_LABEL_KEY: TranslationKey = "tiles.flagLabel";

/** The total row's label. */
export const TOTAL_LABEL_KEY: TranslationKey = "tiles.total";

/* --------------------------------------------------------- TYPE TAG CHIP -- */

/**
 * The revenue / cost tag, by type.
 *
 * IDENTITY, NEVER JUDGEMENT. The tag says which kind of department this is —
 * club blue for the ones that earn, navy for the one that spends. It must not
 * be read as good or bad news: that is the variance chip's job, and the chip
 * gets its answer from `derive.ts`. So the series-identity aliases are used
 * here and the variance tokens are not.
 */
export const DEPARTMENT_TYPE_TAG_CLASS: Record<DepartmentType, string> = {
  [DepartmentType.REVENUE]: "bg-series-secondary/10 text-series-secondary",
  [DepartmentType.COST]: "bg-series-tertiary/10 text-series-tertiary",
};

export interface DepartmentTypeTagProps {
  /** The department's type — the key, for the colour. */
  type: DepartmentType;
  /**
   * How that type is worded. Travels on the datum (`Department.typeLabelKey`,
   * from `DEPARTMENT_TYPE_LABEL_KEY`), so the wording is never spelled in a
   * component and exists in both languages.
   */
  labelKey: TranslationKey;
  className?: string;
}

/** The small revenue / cost chip beside a department name. */
export function DepartmentTypeTag({
  type,
  labelKey,
  className,
}: DepartmentTypeTagProps) {
  const t = useT();

  return (
    <span
      data-slot="department-type-tag"
      data-type={type}
      className={cn(
        "inline-block rounded-badge px-1.5 py-0.5 text-caption font-semibold whitespace-nowrap",
        DEPARTMENT_TYPE_TAG_CLASS[type],
        className,
      )}
    >
      {t(labelKey)}
    </span>
  );
}

/* -------------------------------------------------------- TARGET COLUMN -- */

export interface DepartmentTargetProps {
  /** Attainment of the department's own outcome target, in percent. */
  percent: number;
  /** Stagger of the width transition, in milliseconds. */
  delayMs?: number;
  className?: string;
}

/**
 * The "% of target" cell content: the gold mark, the bar, and the percentage.
 *
 * ORDER MATTERS FOR THE ALIGNMENT FIX. The row is `justify-end` and the FIGURE
 * is last, so every percentage in the column lands on the same right edge —
 * under a right-aligned header. The mark sits at the left of the cell in a
 * fixed-width slot that is present on every row, marked or not, so the bars
 * line up too.
 */
export function DepartmentTarget({
  percent,
  delayMs = 0,
  className,
}: DepartmentTargetProps) {
  const t = useT();
  const grown = useGrow();
  const mark = targetMark(percent);
  const dotClass = TARGET_MARK_DOT_CLASS[mark];

  return (
    <div
      data-slot="department-target"
      data-mark={mark}
      className={cn("flex items-center justify-end gap-2", className)}
    >
      {/* Always rendered, so a marked and an unmarked row keep the same
          geometry; only the dot itself is conditional. */}
      <span
        data-slot="department-target-mark"
        className="flex w-2 shrink-0 justify-center"
      >
        {dotClass && (
          <>
            <span
              data-slot="department-target-dot"
              aria-hidden="true"
              className={cn("h-2 w-2 rounded-pill", dotClass)}
            />
            {/* The mark is a coloured shape; this is the same news in words. */}
            <span className="sr-only">{t(TARGET_MARK_LABEL_KEY[mark])}</span>
          </>
        )}
      </span>

      {/* Decoration: the figure beside it carries the value into the a11y
          tree, so the track says nothing a screen reader needs. */}
      <div
        data-slot="department-target-track"
        aria-hidden="true"
        style={{ width: TARGET_BAR_WIDTH_PX }}
        className="relative h-1.5 shrink-0 overflow-hidden rounded-badge bg-surface"
      >
        <div
          data-slot="department-target-fill"
          className="absolute inset-y-0 left-0 rounded-badge bg-series-tertiary transition-[width] duration-(--duration-grow) ease-enter"
          style={{
            // `useGrow` is `true` in the first render under reduced motion, so
            // this is the final width immediately — never a bar left at zero.
            width: `${grown ? targetBarPercent(percent) : NO_WIDTH}%`,
            transitionDelay: delayMs ? `${delayMs}ms` : undefined,
          }}
        />
      </div>

      <span
        data-slot="department-target-percent"
        className={cn("text-body font-semibold", TABULAR_NUMERALS_CLASS)}
      >
        {formatPercent(percent)}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ ROW -- */

export interface DepartmentRowProps {
  /** The derived row — judgement and flag included, both from `derive.ts`. */
  row: DepartmentPerformance;
  /** Stagger of this row's target bar, in milliseconds. */
  delayMs?: number;
}

/**
 * One department.
 *
 * The name is the row's HEADER (`scope="row"`), because every figure in the row
 * is about that department — which is also what lets a screen reader announce
 * "Marketing & Communications, Variance, +0.41, up" instead of reading a naked
 * number.
 */
export function DepartmentRow({ row, delayMs = 0 }: DepartmentRowProps) {
  const t = useT();
  const flagged = row.needsAttention;

  return (
    <tr
      data-slot="department-row"
      data-department={row.key}
      // The judgement as data, so a test — and the eventual e2e pass — can
      // assert the reading without sampling a colour off a pixel.
      data-judgement={row.judgement}
      data-flagged={flagged ? "true" : "false"}
      className={cn(ROW_HOVER_CLASS, flagged && FLAGGED_ROW_CLASS)}
    >
      <th
        scope="row"
        data-slot="department-name"
        data-column="name"
        className={cn(
          CELL_CLASS,
          TEXT_ALIGN_CLASS,
          // NO TRUNCATION. "Marketing & Communications" and "Merchandising
          // (Fanshop)" wrap inside the column; they never gain an ellipsis and
          // never push the table out of the tile.
          "text-body font-semibold break-words",
        )}
      >
        <span className="inline-flex items-start gap-1.5">
          <span>{t(row.labelKey)}</span>
          {flagged && (
            <span
              data-slot="department-flag"
              className="inline-flex shrink-0 items-center text-accent-follow-up"
            >
              <TriangleAlert aria-hidden="true" size={FLAG_ICON_SIZE} />
              {/* The tint and the icon are visual; this is the reason. */}
              <span className="sr-only">{t(FLAG_LABEL_KEY)}</span>
            </span>
          )}
        </span>
      </th>

      <td data-column="type" className={cn(CELL_CLASS, TEXT_ALIGN_CLASS)}>
        <DepartmentTypeTag type={row.type} labelKey={row.typeLabelKey} />
      </td>

      <td
        data-column="budget"
        className={cn(
          CELL_CLASS,
          NUMERIC_ALIGN_CLASS,
          NUMERIC_CELL_CLASS,
          "text-body",
          TABULAR_NUMERALS_CLASS,
        )}
      >
        {formatMillions(chfFromThousands(row.budget))}
      </td>

      <td
        data-column="actual"
        className={cn(
          CELL_CLASS,
          NUMERIC_ALIGN_CLASS,
          NUMERIC_CELL_CLASS,
          "text-body font-semibold",
          TABULAR_NUMERALS_CLASS,
        )}
      >
        {formatMillions(chfFromThousands(row.actual))}
      </td>

      <td
        data-column="variance"
        className={cn(CELL_CLASS, NUMERIC_ALIGN_CLASS, NUMERIC_CELL_CLASS)}
      >
        {/* THE TRAP, CLOSED. The chip's colour comes from `row.judgement` —
            derived from the department's type in `derive.ts` — while its arrow
            follows the arithmetic. Marketing's +410 is therefore an UP arrow in
            the negative token: an overspend, not a success. */}
        <DeltaChip
          value={chfFromThousands(row.variance)}
          format={formatSignedMillions}
          judgement={row.judgement}
        />
      </td>

      <td
        data-column="targetPercent"
        className={cn(CELL_CLASS, NUMERIC_ALIGN_CLASS, NUMERIC_CELL_CLASS)}
      >
        <DepartmentTarget percent={row.targetPercent} delayMs={delayMs} />
      </td>
    </tr>
  );
}

/* ---------------------------------------------------------------- TABLE -- */

export interface DepartmentTableProps {
  /**
   * The departments, in the order the table lists them.
   *
   * DERIVED ROWS, NOT RAW DEPARTMENTS. `DepartmentPerformance` cannot be
   * produced without a `judgement` and a `needsAttention`, so the type itself
   * is what stops a caller handing this table figures whose meaning has not
   * been worked out — `departmentPerformanceRows()` in `derive.ts` is the way
   * to get them.
   */
  rows: readonly DepartmentPerformance[];
  /**
   * Club-wide blended attainment of the outcome targets, in percent, for the
   * total row.
   *
   * A PROP BECAUSE IT IS A MEASUREMENT, not a sum of the rows (their plain mean
   * is 97.0, budget-weighted 99.7 — the club figure is 96). Omit it and the
   * total row simply shows no percentage rather than inventing one.
   */
  blendedTargetPercent?: number;
  className?: string;
}

/**
 * The table itself: a header row, one row per department, and a total row.
 *
 * THE TOTALS ARE DERIVED FROM THE ROWS ON SCREEN, by `departmentTotals()` in
 * `derive.ts` — the same function the rest of the app uses, called on the rows
 * this table was given. That is deliberate and it is not "computation in a
 * component": it makes a footer that disagrees with the rows above it
 * impossible, which a `totals` prop would not.
 */
export function DepartmentTable({
  rows,
  blendedTargetPercent,
  className,
}: DepartmentTableProps) {
  const t = useT();
  const totals = departmentTotals(rows);

  return (
    // The tile is the boundary: a narrow viewport scrolls the table inside the
    // card rather than letting six columns push the card wider than the grid.
    <div
      data-slot="department-table-scroll"
      className={cn("overflow-x-auto", className)}
    >
      <table data-slot="department-table" className="w-full border-collapse">
        <caption className="sr-only">
          {t(TABLE_CAPTION_KEY, { note: t(MILLIONS_NOTE_KEY) })}
        </caption>

        <thead>
          <tr data-slot="department-header-row">
            {DEPARTMENT_COLUMNS.map((column) => (
              <th
                key={column.key}
                scope="col"
                data-slot="department-header"
                data-column={column.key}
                className={cn(
                  "border-b border-border px-2 pb-2 text-caption font-semibold text-muted",
                  // ONE alignment rule for the header and the cells under it —
                  // "% of target" included. See `columnAlignClass`.
                  columnAlignClass(column),
                )}
              >
                {t(column.labelKey)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            // Keyed by NAME, never by index, so a re-ordered dataset moves the
            // row rather than rewriting a different department's figures into
            // it — and each target bar keeps its own transition.
            <DepartmentRow
              key={row.key}
              row={row}
              delayMs={index * ROW_STAGGER_MS}
            />
          ))}
        </tbody>

        <tfoot>
          <tr
            data-slot="department-total-row"
            className="border-t-2 border-border font-bold"
          >
            <th
              scope="row"
              data-column="name"
              className={cn(CELL_CLASS, TEXT_ALIGN_CLASS, "text-body")}
            >
              {t(TOTAL_LABEL_KEY)}
            </th>

            {/* The club is neither a revenue department nor a cost centre, so
                the tag column is empty rather than carrying an invented type. */}
            <td
              data-column="type"
              className={cn(CELL_CLASS, TEXT_ALIGN_CLASS)}
            />

            <td
              data-column="budget"
              className={cn(
                CELL_CLASS,
                NUMERIC_ALIGN_CLASS,
                NUMERIC_CELL_CLASS,
                "text-body",
                TABULAR_NUMERALS_CLASS,
              )}
            >
              {formatMillions(chfFromThousands(totals.budget))}
            </td>

            <td
              data-column="actual"
              className={cn(
                CELL_CLASS,
                NUMERIC_ALIGN_CLASS,
                NUMERIC_CELL_CLASS,
                "text-body",
                TABULAR_NUMERALS_CLASS,
              )}
            >
              {formatMillions(chfFromThousands(totals.actual))}
            </td>

            <td
              data-column="variance"
              className={cn(
                CELL_CLASS,
                NUMERIC_ALIGN_CLASS,
                NUMERIC_CELL_CLASS,
              )}
            >
              {/* NEUTRAL ON PURPOSE. The club-level movement is arithmetic
                  across five revenue departments and one cost centre, so it is
                  a FACT and not a verdict — `derive.ts` says as much, and
                  judgement stays where the Revenue / Cost tag is: per row. The
                  sign and the arrow still report which way it went. */}
              <DeltaChip
                value={chfFromThousands(totals.variance)}
                format={formatSignedMillions}
                judgement={VarianceJudgement.NEUTRAL}
              />
            </td>

            <td
              data-column="targetPercent"
              className={cn(
                CELL_CLASS,
                NUMERIC_ALIGN_CLASS,
                NUMERIC_CELL_CLASS,
              )}
            >
              {blendedTargetPercent !== undefined && (
                <DepartmentTarget percent={blendedTargetPercent} />
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ----------------------------------------------------------------- TILE -- */

/** The card chrome the tile forwards, listed as `HBarTile` and `KpiTile` do. */
type DepartmentTableChrome = Pick<
  CardProps,
  | "title"
  | "headingLevel"
  | "icon"
  | "action"
  | "accent"
  | "caption"
  | "isNew"
  | "delayMs"
  | "className"
>;

export interface DepartmentTableTileProps
  extends DepartmentTableChrome, Omit<DepartmentTableProps, "className"> {
  /**
   * What the figures cover — Hero 3's `scopeLabel`. It is placed BEFORE the
   * scale note, which is always appended.
   */
  period?: ReactNode;
}

/**
 * `Card` + `DepartmentTable`.
 *
 * The subtitle always ends in {@link MILLIONS_NOTE_KEY}. A caller's scope line is
 * prefixed to it, never substituted for it — the corrected scale note is part
 * of the tile, not something a hero has to remember.
 */
export function DepartmentTableTile({
  rows,
  blendedTargetPercent,
  title,
  period,
  headingLevel,
  icon,
  action,
  accent,
  caption,
  isNew,
  delayMs,
  className,
}: DepartmentTableTileProps) {
  const t = useT();

  return (
    <Card
      title={title}
      subtitle={
        <span data-slot="department-scope">
          {period != null && period !== false && (
            <>
              {period} {SUBTITLE_SEPARATOR}{" "}
            </>
          )}
          <span data-slot="department-millions-note">
            {t(MILLIONS_NOTE_KEY)}
          </span>
        </span>
      }
      headingLevel={headingLevel}
      icon={icon}
      action={action}
      accent={accent}
      caption={caption}
      isNew={isNew}
      delayMs={delayMs}
      className={className}
    >
      <DepartmentTable
        rows={rows}
        blendedTargetPercent={blendedTargetPercent}
      />
    </Card>
  );
}
