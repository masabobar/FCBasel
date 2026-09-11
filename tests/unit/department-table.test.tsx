import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  DEPARTMENT_COLUMNS,
  DEPARTMENT_TYPE_TAG_CLASS,
  DepartmentTable,
  DepartmentTableTile,
  FLAG_LABEL_KEY,
  FLAGGED_ROW_CLASS,
  MILLIONS_NOTE_KEY,
  NEAR_TARGET_MIN_PERCENT,
  NUMERIC_ALIGN_CLASS,
  ROW_HOVER_CLASS,
  TABLE_CAPTION_KEY,
  TARGET_BAR_WIDTH_PX,
  TARGET_MARK_LABEL_KEY,
  TOTAL_LABEL_KEY,
  TargetMark,
  columnAlignClass,
  targetBarPercent,
  targetMark,
} from "../../app/components/tiles/department-table";
import {
  chfFromThousands,
  formatMillions,
  formatPercent,
  formatSignedMillions,
} from "../../app/lib/format";
import { createMockHero3Repository } from "../../app/lib/mock/hero3";
import {
  ON_TARGET_PERCENT,
  type DepartmentPerformance,
  departmentPerformanceRows,
  departmentTotals,
} from "../../app/lib/repositories/derive";
import {
  DEPARTMENT_LABEL_KEY,
  DEPARTMENT_TYPE_LABEL_KEY,
  DepartmentKey,
  DepartmentType,
} from "../../app/lib/repositories/enums";
import {
  restoreMotionStubs,
  stubFrames,
  stubMatchMedia,
} from "./support/motion-harness";
import { de, t } from "./support/i18n";

/**
 * US-022 — the department table.
 *
 * The two review decisions (CHF MILLIONS, not "000"; numeric headers
 * right-aligned INCLUDING "% of target") and the revenue/cost trap each get
 * their own describe block, and each is asserted against the REAL Hero 3 data
 * rather than a convenient fixture — Marketing's +410 reading as ADVERSE is the
 * whole point of the story and would be meaningless against invented rows.
 */

const SOURCE = readFileSync(
  resolve(process.cwd(), "app/components/tiles/department-table.tsx"),
  "utf8",
);

/** The module notes discuss the trap at length; the scans must not read them. */
const CODE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const APP_CSS = readFileSync(resolve(process.cwd(), "app/app.css"), "utf8");

const hero3 = await createMockHero3Repository().hero();
const DEPARTMENTS = hero3.primary.departments;
const ROWS: readonly DepartmentPerformance[] =
  departmentPerformanceRows(DEPARTMENTS);
const TOTALS = departmentTotals(DEPARTMENTS);
const BLENDED = hero3.primary.blendedTargetPercent;

/**
 * Departments are addressed by KEY since US-049 — `data-department` carries
 * the identifier, not the name, precisely so a row can be found in either
 * language. {@link departmentName} is for the assertions that are ABOUT the
 * displayed words.
 */
const SPONSORING = DepartmentKey.SPONSORING_PARTNERSHIPS;
const TICKETING = DepartmentKey.TICKETING;
const HOSPITALITY = DepartmentKey.HOSPITALITY;
const MERCHANDISING = DepartmentKey.MERCHANDISING;
const EVENTS = DepartmentKey.EVENTS;
const MARKETING = DepartmentKey.MARKETING_COMMUNICATIONS;

function departmentName(key: DepartmentKey): string {
  return t(DEPARTMENT_LABEL_KEY[key]);
}

/** The table's accessible name, composed the way the component composes it. */
const TABLE_CAPTION = t(TABLE_CAPTION_KEY, { note: t(MILLIONS_NOTE_KEY) });

function slot(name: string, within: ParentNode = document): HTMLElement | null {
  return within.querySelector<HTMLElement>(`[data-slot="${name}"]`);
}

function slots(name: string, within: ParentNode = document): HTMLElement[] {
  return [...within.querySelectorAll<HTMLElement>(`[data-slot="${name}"]`)];
}

/** The row for a department, found the way a presenter finds it: by name. */
function row(name: string, within: ParentNode = document): HTMLElement {
  const found = slots("department-row", within).find(
    (candidate) => candidate.dataset.department === name,
  );
  if (!found) throw new Error(`no row for "${name}"`);
  return found;
}

function cell(
  name: string,
  column: string,
  within: ParentNode = document,
): HTMLElement {
  const found = row(name, within).querySelector<HTMLElement>(
    `[data-column="${column}"]`,
  );
  if (!found) throw new Error(`no ${column} cell for "${name}"`);
  return found;
}

function totalCell(column: string, within: ParentNode = document): HTMLElement {
  const found = slot(
    "department-total-row",
    within,
  )!.querySelector<HTMLElement>(`[data-column="${column}"]`);
  if (!found) throw new Error(`no total ${column} cell`);
  return found;
}

function header(column: string, within: ParentNode = document): HTMLElement {
  const found = slots("department-header", within).find(
    (candidate) => candidate.dataset.column === column,
  );
  if (!found) throw new Error(`no header for "${column}"`);
  return found;
}

function chip(name: string, within: ParentNode = document): HTMLElement {
  return slot("delta-chip", cell(name, "variance", within))!;
}

/** Renders with frames advanced, so bar widths are at their final value. */
function renderSettled(ui: ReactElement) {
  const frames = stubFrames();
  const result = render(ui);
  frames.advance();
  frames.advance();
  return { ...result, frames };
}

function table(props: Partial<Parameters<typeof DepartmentTable>[0]> = {}) {
  return (
    <DepartmentTable rows={ROWS} blendedTargetPercent={BLENDED} {...props} />
  );
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  restoreMotionStubs();
});

/* ------------------------------------------------------------------------ */

describe("DepartmentTable — the six columns and the total row", () => {
  it("declares exactly the six columns the criteria name, in order", () => {
    expect(DEPARTMENT_COLUMNS.map((column) => t(column.labelKey))).toEqual([
      "Department",
      "Type",
      "Budget",
      "Actual",
      "Variance",
      "% of target",
    ]);
  });

  it("renders a header cell for every column and nothing else", () => {
    renderSettled(table());

    expect(slots("department-header")).toHaveLength(6);
    expect(slots("department-header").map((each) => each.textContent)).toEqual(
      DEPARTMENT_COLUMNS.map((column) => t(column.labelKey)),
    );
  });

  it("renders one row per department, plus a total row", () => {
    renderSettled(table());

    expect(slots("department-row")).toHaveLength(DEPARTMENTS.length);
    expect(slots("department-row")).toHaveLength(6);
    expect(slot("department-total-row")).not.toBeNull();
    expect(slot("department-total-row")).toHaveTextContent(t(TOTAL_LABEL_KEY));
  });

  it("fills every column of every row — no silently missing cell", () => {
    renderSettled(table());

    for (const each of DEPARTMENTS) {
      for (const column of DEPARTMENT_COLUMNS) {
        expect(cell(each.key, column.key)).not.toBeNull();
      }
    }
  });

  it("derives the total from the rows on screen, so the footer cannot drift", () => {
    // A subset in, and the footer follows it rather than the club figure.
    const subset = ROWS.slice(0, 2);
    renderSettled(<DepartmentTable rows={subset} />);

    const expected = departmentTotals(subset);
    expect(totalCell("budget").textContent).toBe(
      formatMillions(chfFromThousands(expected.budget)),
    );
    expect(expected.budget).not.toBe(TOTALS.budget);
  });

  it("is a real table with proper header semantics", () => {
    renderSettled(table());

    const found = screen.getByRole("table", { name: TABLE_CAPTION });
    expect(found.tagName).toBe("TABLE");
    expect(found.querySelector("thead")).not.toBeNull();
    expect(found.querySelector("tbody")).not.toBeNull();
    expect(found.querySelector("tfoot")).not.toBeNull();

    for (const each of slots("department-header")) {
      expect(each.tagName).toBe("TH");
      expect(each).toHaveAttribute("scope", "col");
    }

    // The department name is the ROW header — every figure beside it is about
    // that department.
    const name = cell(MARKETING, "name");
    expect(name.tagName).toBe("TH");
    expect(name).toHaveAttribute("scope", "row");

    expect(
      screen.getByRole("rowheader", {
        name: new RegExp(departmentName(MARKETING)),
      }),
    ).toBe(name);
    expect(screen.getAllByRole("columnheader")).toHaveLength(6);
  });
});

describe("DepartmentTable — the revenue / cost type tag", () => {
  it("tags each department with the label carried on the datum", () => {
    renderSettled(table());

    for (const each of DEPARTMENTS) {
      const tag = slot("department-type-tag", cell(each.key, "type"))!;
      expect(tag.textContent).toBe(t(each.typeLabelKey));
      expect(tag.dataset.type).toBe(each.type);
    }

    expect(
      slot("department-type-tag", cell(MARKETING, "type"))!.textContent,
    ).toBe("Cost");
    expect(
      slot("department-type-tag", cell(TICKETING, "type"))!.textContent,
    ).toBe("Revenue");
  });

  it("colours the tag by IDENTITY, never with a variance token", () => {
    renderSettled(table());

    expect(slot("department-type-tag", cell(TICKETING, "type"))).toHaveClass(
      ...DEPARTMENT_TYPE_TAG_CLASS[DepartmentType.REVENUE].split(" "),
    );
    expect(slot("department-type-tag", cell(MARKETING, "type"))).toHaveClass(
      ...DEPARTMENT_TYPE_TAG_CLASS[DepartmentType.COST].split(" "),
    );

    for (const tag of slots("department-type-tag")) {
      expect(tag.className).not.toContain("variance-");
    }
  });
});

describe("DepartmentTable — REVIEW DECISION: CHF millions, never '000'", () => {
  it("renders budget and actual in millions, through format.ts", () => {
    renderSettled(table());

    expect(cell(SPONSORING, "budget").textContent).toBe("21.00");
    expect(cell(SPONSORING, "actual").textContent).toBe("21.84");
    expect(cell(MARKETING, "budget").textContent).toBe("3.40");
    expect(cell(MARKETING, "actual").textContent).toBe("3.81");

    for (const each of DEPARTMENTS) {
      expect(cell(each.key, "budget").textContent).toBe(
        formatMillions(chfFromThousands(each.budget)),
      );
      expect(cell(each.key, "actual").textContent).toBe(
        formatMillions(chfFromThousands(each.actual)),
      );
    }
  });

  it("totals in millions too: 69.00 against 69.68", () => {
    renderSettled(table());

    expect(totalCell("budget").textContent).toBe("69.00");
    expect(totalCell("actual").textContent).toBe("69.68");
  });

  it("shows no thousands figure and no '000' anywhere in the tile", () => {
    const { container } = renderSettled(
      <DepartmentTableTile
        title="Departmental performance"
        period={t(hero3.primary.scopeLabelKey)}
        rows={ROWS}
        blendedTargetPercent={BLENDED}
      />,
    );

    const text = container.textContent!;
    expect(text).not.toMatch(/000/);
    expect(text).not.toMatch(/CHF 0/i);
    // The thousands figures themselves must be nowhere on screen.
    for (const raw of ["21’000", "24’000", "69’000", "69’680"]) {
      expect(text).not.toContain(raw);
    }
  });

  it("states the scale ONCE, in the subtitle, in the corrected wording", () => {
    renderSettled(
      <DepartmentTableTile title="Departmental performance" rows={ROWS} />,
    );

    expect(t(MILLIONS_NOTE_KEY)).toBe("figures in CHF millions");
    expect(slot("department-millions-note")!.textContent).toBe(
      t(MILLIONS_NOTE_KEY),
    );
    expect(slot("card-subtitle")).toHaveTextContent(t(MILLIONS_NOTE_KEY));
  });

  it("keeps the note even when a caller passes its own scope line", () => {
    renderSettled(
      <DepartmentTableTile
        title="Departmental performance"
        period="Full-year departmental totals"
        rows={ROWS}
      />,
    );

    const subtitle = slot("card-subtitle")!;
    expect(subtitle).toHaveTextContent("Full-year departmental totals");
    expect(subtitle).toHaveTextContent(t(MILLIONS_NOTE_KEY));
  });

  it("repeats the scale in the table's accessible name", () => {
    renderSettled(table());

    expect(TABLE_CAPTION).toContain(t(MILLIONS_NOTE_KEY));
    expect(TABLE_CAPTION).not.toContain("000");
    expect(screen.getByRole("table", { name: TABLE_CAPTION })).not.toBeNull();
  });
});

describe("DepartmentTable — REVIEW DECISION: numeric headers right-aligned", () => {
  it("right-aligns every figure header, '% of target' INCLUDED", () => {
    renderSettled(table());

    for (const column of ["budget", "actual", "variance", "targetPercent"]) {
      expect(header(column)).toHaveClass(NUMERIC_ALIGN_CLASS);
    }
    // The reported one, named explicitly.
    expect(header("targetPercent").textContent).toBe("% of target");
    expect(header("targetPercent")).toHaveClass("text-right");
    expect(header("targetPercent")).not.toHaveClass("text-left");
    // And it is not a class pasted onto one header: the column declares
    // itself numeric, which is what right-aligns the cells under it too.
    expect(
      DEPARTMENT_COLUMNS.filter((column) => column.numeric).map(
        (column) => column.key,
      ),
    ).toEqual(["budget", "actual", "variance", "targetPercent"]);
  });

  it("leaves the two text headers left-aligned", () => {
    renderSettled(table());

    expect(header("name")).toHaveClass("text-left");
    expect(header("type")).toHaveClass("text-left");
    expect(header("name")).not.toHaveClass(NUMERIC_ALIGN_CLASS);
  });

  it("gives a header the SAME alignment as the cells under it", () => {
    renderSettled(table());

    // The alignment is one rule, read twice — that is what makes the header
    // sit over its content instead of merely claiming to.
    for (const column of DEPARTMENT_COLUMNS) {
      const expected = columnAlignClass(column);

      expect(header(column.key)).toHaveClass(expected);
      for (const each of DEPARTMENTS) {
        expect(cell(each.key, column.key)).toHaveClass(expected);
      }
      expect(totalCell(column.key)).toHaveClass(expected);
    }
  });

  it("puts each header in the same COLUMN POSITION as its cells", () => {
    renderSettled(table());

    const headers = slots("department-header").map(
      (each) => each.dataset.column,
    );
    expect(headers).toEqual(DEPARTMENT_COLUMNS.map((column) => column.key));

    for (const name of [MARKETING, HOSPITALITY]) {
      const columns = [...row(name).children].map(
        (each) => (each as HTMLElement).dataset.column,
      );
      expect(columns).toEqual(headers);
    }

    const totalColumns = [...slot("department-total-row")!.children].map(
      (each) => (each as HTMLElement).dataset.column,
    );
    expect(totalColumns).toEqual(headers);
  });

  it("ends the '% of target' cell with its FIGURE, so the column reads right", () => {
    renderSettled(table());

    const target = slot(
      "department-target",
      cell(HOSPITALITY, "targetPercent"),
    )!;
    const last = target.lastElementChild as HTMLElement;

    expect(last.dataset.slot).toBe("department-target-percent");
    expect(last.textContent).toBe(formatPercent(95));
    expect(target).toHaveClass("justify-end");
  });
});

describe("DepartmentTable — THE REVENUE / COST TRAP", () => {
  it("renders Marketing's POSITIVE variance as ADVERSE, in the negative token", () => {
    renderSettled(table());

    const marketing = chip(MARKETING);

    // The figure is positive and says so...
    expect(marketing.textContent).toContain("+0.41");
    expect(marketing.textContent).toContain(
      formatSignedMillions(chfFromThousands(410)),
    );
    // ...the arrow follows the arithmetic...
    expect(marketing.dataset.direction).toBe("UP");
    expect(slot("delta-arrow", marketing)).not.toBeNull();
    // ...and the READING is adverse: an overspend, not a success.
    expect(marketing.dataset.judgement).toBe("ADVERSE");
    expect(marketing).toHaveClass("text-variance-negative");
    expect(marketing.className).not.toContain("variance-positive");
    expect(row(MARKETING).dataset.judgement).toBe("ADVERSE");
  });

  it("renders Sponsoring's positive variance as FAVOURABLE — same sign, other reading", () => {
    renderSettled(table());

    const sponsoring = chip(SPONSORING);

    expect(sponsoring.textContent).toContain("+0.84");
    expect(sponsoring.dataset.direction).toBe("UP");
    expect(sponsoring.dataset.judgement).toBe("FAVOURABLE");
    expect(sponsoring).toHaveClass("text-variance-positive");

    // The trap in one assertion: two rows, the same sign, opposite colours.
    expect(chip(MARKETING).dataset.direction).toBe(
      chip(SPONSORING).dataset.direction,
    );
    expect(chip(MARKETING).className).not.toBe(chip(SPONSORING).className);
  });

  it("reads every row's judgement off derive.ts, both directions", () => {
    renderSettled(table());

    for (const each of ROWS) {
      expect(chip(each.key).dataset.judgement).toBe(each.judgement);
      expect(chip(each.key).textContent).toContain(
        formatSignedMillions(chfFromThousands(each.variance)),
      );
    }

    // A revenue department UNDER budget is adverse; the cost centre under
    // budget would be favourable — the sign alone decides neither.
    expect(chip(HOSPITALITY).dataset.judgement).toBe("ADVERSE");
    expect(chip(HOSPITALITY).dataset.direction).toBe("DOWN");
    expect(chip(EVENTS).dataset.judgement).toBe("FAVOURABLE");
  });

  it("flips with the TYPE, not with the number — a cost centre under budget", () => {
    // Same figures as Marketing, spending BELOW plan: favourable, arrow down.
    const underspend = departmentPerformanceRows([
      {
        key: MARKETING,
        labelKey: DEPARTMENT_LABEL_KEY[MARKETING],
        type: DepartmentType.COST,
        typeLabelKey: DEPARTMENT_TYPE_LABEL_KEY[DepartmentType.COST],
        budget: 3_400,
        actual: 3_000,
        targetPercent: 84,
      },
    ]);
    renderSettled(<DepartmentTable rows={underspend} />);

    expect(chip(MARKETING).dataset.judgement).toBe("FAVOURABLE");
    expect(chip(MARKETING).dataset.direction).toBe("DOWN");
    expect(chip(MARKETING)).toHaveClass("text-variance-positive");
  });

  it("does not compute the judgement — the source cannot even name one", () => {
    // The component may pass a judgement through and may say NEUTRAL for the
    // club total, but FAVOURABLE and ADVERSE are decisions and belong to
    // `varianceJudgement` in derive.ts alone.
    expect(CODE).not.toMatch(/FAVOURABLE|ADVERSE/);
    expect(CODE).toMatch(/judgement=\{row\.judgement\}/);

    // No sign test, and no re-reading of the Revenue / Cost tag as meaning.
    expect(CODE).not.toMatch(/variance\s*[<>]/);
    expect(CODE).not.toMatch(/DepartmentType\.\w+\s*[=!]==/);
    expect(CODE).not.toMatch(/varianceJudgement\s*\(/);

    // And the values it does render come from derive.ts, not from arithmetic.
    expect(CODE).toMatch(/departmentTotals\(/);
    expect(CODE).not.toMatch(/\breduce\(|\bactual\s*-\s*|\bbudget\s*-\s*/);
  });

  it("keeps the club total a FACT, not a verdict", () => {
    renderSettled(table());

    const total = slot("delta-chip", totalCell("variance"))!;

    expect(total.textContent).toContain(
      formatSignedMillions(chfFromThousands(TOTALS.variance)),
    );
    expect(total.textContent).toContain("+0.68");
    // Mixed signs across five revenue departments and one cost centre: the
    // direction is real, the good/bad claim is not the club's to make.
    expect(total.dataset.direction).toBe("UP");
    expect(total.dataset.judgement).toBe("NEUTRAL");
    expect(total.className).not.toContain("variance-");
  });
});

describe("DepartmentTable — the flagged department", () => {
  it("flags EXACTLY ONE row, and it is Marketing", () => {
    renderSettled(table());

    const flagged = slots("department-row").filter(
      (each) => each.dataset.flagged === "true",
    );

    expect(flagged).toHaveLength(1);
    expect(flagged[0]!.dataset.department).toBe(MARKETING);
    expect(slots("department-flag")).toHaveLength(1);
  });

  it("takes the flag from needsAttention, not from the department's name", () => {
    // Marketing is not special-cased: give the flag's conditions to another
    // department and the flag moves. The name never appears in the source.
    expect(CODE).not.toContain(departmentName(MARKETING));
    expect(CODE).toMatch(/row\.needsAttention/);

    const moved = departmentPerformanceRows([
      {
        key: HOSPITALITY,
        labelKey: DEPARTMENT_LABEL_KEY[HOSPITALITY],
        type: DepartmentType.REVENUE,
        typeLabelKey: DEPARTMENT_TYPE_LABEL_KEY[DepartmentType.REVENUE],
        // Over budget AND behind target — the two conditions, on a revenue row.
        budget: 7_200,
        actual: 7_400,
        targetPercent: 95,
      },
      DEPARTMENTS.find((each) => each.key === EVENTS)!,
    ]);
    renderSettled(<DepartmentTable rows={moved} />);

    expect(row(HOSPITALITY).dataset.flagged).toBe("true");
    expect(row(EVENTS).dataset.flagged).toBe("false");
    expect(slots("department-row")).toHaveLength(2);
    expect(slots("department-flag")).toHaveLength(1);
  });

  it("makes the flag visible AND readable — tint, icon and a sentence", () => {
    renderSettled(table());

    expect(row(MARKETING)).toHaveClass(...FLAGGED_ROW_CLASS.split(" "));
    expect(row(HOSPITALITY)).not.toHaveClass(...FLAGGED_ROW_CLASS.split(" "));

    const flag = slot("department-flag", cell(MARKETING, "name"))!;
    // A shape, so the flag survives a washed-out projector...
    expect(flag.querySelector("svg")).not.toBeNull();
    expect(flag.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    // ...and the reason in words, which colour never carries.
    expect(flag).toHaveTextContent(t(FLAG_LABEL_KEY));
    expect(t(FLAG_LABEL_KEY)).toBe("Over budget and behind target");
  });

  it("uses the follow-up gold, not a hex, for the flag", () => {
    renderSettled(table());

    expect(slot("department-flag")).toHaveClass("text-accent-follow-up");
    expect(FLAGGED_ROW_CLASS).toContain("accent-target-hit");
    expect(APP_CSS).toMatch(/--color-accent-follow-up:/);
    expect(APP_CSS).toMatch(/--color-accent-target-hit:/);
  });
});

describe("DepartmentTable — the near-target gold band", () => {
  it("bands 95-99 as NEAR, 100 and above as HIT, below 95 as BEHIND", () => {
    expect(NEAR_TARGET_MIN_PERCENT).toBe(95);
    expect(ON_TARGET_PERCENT).toBe(100);

    expect(targetMark(94.9)).toBe(TargetMark.BEHIND);
    expect(targetMark(95)).toBe(TargetMark.NEAR);
    expect(targetMark(99)).toBe(TargetMark.NEAR);
    expect(targetMark(99.9)).toBe(TargetMark.NEAR);
    expect(targetMark(100)).toBe(TargetMark.HIT);
    expect(targetMark(105)).toBe(TargetMark.HIT);
    expect(targetMark(Number.NaN)).toBe(TargetMark.BEHIND);
  });

  it("marks Hospitality (95) in gold and Merchandising (92) not at all", () => {
    renderSettled(table());

    const hospitality = cell(HOSPITALITY, "targetPercent");
    const merchandising = cell(MERCHANDISING, "targetPercent");

    expect(slot("department-target", hospitality)!.dataset.mark).toBe("NEAR");
    const dot = slot("department-target-dot", hospitality)!;
    expect(dot).not.toBeNull();
    expect(dot.className).toContain("accent-follow-up");
    expect(slot("department-target-mark", hospitality)).toHaveTextContent(
      t(TARGET_MARK_LABEL_KEY[TargetMark.NEAR]),
    );

    expect(slot("department-target", merchandising)!.dataset.mark).toBe(
      "BEHIND",
    );
    expect(slot("department-target-dot", merchandising)).toBeNull();
    expect(slot("department-target-mark", merchandising)!.textContent).toBe("");
  });

  it("gives the departments at or above target the gold hit mark", () => {
    renderSettled(table());

    for (const name of [SPONSORING, TICKETING, EVENTS]) {
      const target = cell(name, "targetPercent");
      expect(slot("department-target", target)!.dataset.mark).toBe("HIT");
      expect(slot("department-target-dot", target)!.className).toContain(
        "accent-target-hit",
      );
      expect(slot("department-target-mark", target)).toHaveTextContent(
        t(TARGET_MARK_LABEL_KEY[TargetMark.HIT]),
      );
    }

    // Marketing at 84% earns nothing — gold is for target marks only.
    expect(
      slot("department-target-dot", cell(MARKETING, "targetPercent")),
    ).toBeNull();
    expect(slots("department-target-dot")).toHaveLength(4 + 1);
  });

  it("distinguishes the two marks by SHAPE as well as by tone", () => {
    renderSettled(table());

    const hit = slot("department-target-dot", cell(EVENTS, "targetPercent"))!;
    const near = slot(
      "department-target-dot",
      cell(HOSPITALITY, "targetPercent"),
    )!;

    expect(hit.className).toContain("bg-accent-target-hit");
    expect(near.className).toContain("border-accent-follow-up");
    expect(near.className).not.toContain("bg-accent");
  });

  it("bands the club's blended attainment the same way", () => {
    renderSettled(table());

    const blended = totalCell("targetPercent");
    expect(slot("department-target-percent", blended)!.textContent).toBe(
      formatPercent(BLENDED),
    );
    expect(slot("department-target", blended)!.dataset.mark).toBe("NEAR");
  });

  it("omits the total percentage entirely when there is no club figure", () => {
    renderSettled(<DepartmentTable rows={ROWS} />);

    expect(totalCell("targetPercent").textContent).toBe("");
    expect(slots("department-target")).toHaveLength(DEPARTMENTS.length);
  });
});

describe("DepartmentTable — the '% of target' bar", () => {
  it("shows the percentage through format.ts, never a raw number", () => {
    renderSettled(table());

    for (const each of DEPARTMENTS) {
      const percent = slot(
        "department-target-percent",
        cell(each.key, "targetPercent"),
      )!;
      expect(percent.textContent).toBe(formatPercent(each.targetPercent));
      expect(percent).toHaveClass("tabular-nums");
    }

    expect(
      slot("department-target-percent", cell(MARKETING, "targetPercent"))!
        .textContent,
    ).toBe("84%");
  });

  it("scales the bar against the target and caps an overshoot", () => {
    expect(targetBarPercent(84)).toBe(84);
    expect(targetBarPercent(95)).toBe(95);
    expect(targetBarPercent(105)).toBe(100);
    expect(targetBarPercent(0)).toBe(0);
    expect(targetBarPercent(-4)).toBe(0);
    expect(targetBarPercent(Number.NaN)).toBe(0);
  });

  it("grows each bar to its width, transitioned in CSS from the token", () => {
    const frames = stubFrames();
    render(table());

    const fill = slot(
      "department-target-fill",
      cell(MARKETING, "targetPercent"),
    )!;
    expect(fill.style.width).toBe("0%");

    frames.advance();
    frames.advance();

    expect(fill.style.width).toBe("84%");
    expect(
      slot("department-target-fill", cell(EVENTS, "targetPercent"))!.style
        .width,
    ).toBe("100%");
    expect(fill).toHaveClass(
      "transition-[width]",
      "duration-(--duration-grow)",
      "ease-enter",
    );
    expect(APP_CSS).toMatch(/--duration-grow:/);
    expect(fill.style.width).not.toContain("NaN");
  });

  it("draws the track at one fixed width, so the column lines up", () => {
    renderSettled(table());

    for (const track of slots("department-target-track")) {
      expect(getComputedStyle(track).width).toBe(`${TARGET_BAR_WIDTH_PX}px`);
      expect(track).toHaveAttribute("aria-hidden", "true");
      expect(track).toHaveClass("bg-surface", "shrink-0");
    }
  });

  it("staggers the bars by row, so the column sweeps in", () => {
    renderSettled(table());

    const fills = slots("department-target-fill");
    expect(fills[0]!.style.transitionDelay).toBe("");
    expect(fills[1]!.style.transitionDelay).toBe("40ms");
    expect(fills[2]!.style.transitionDelay).toBe("80ms");
  });
});

describe("DepartmentTable — row hover, keys and long labels", () => {
  it("highlights the row under the cursor", () => {
    renderSettled(table());

    for (const each of slots("department-row")) {
      expect(each).toHaveClass(...ROW_HOVER_CLASS.split(" "));
    }
    expect(ROW_HOVER_CLASS).toContain("hover:bg-surface");
    expect(ROW_HOVER_CLASS).toContain("transition-colors");
    expect(APP_CSS).toMatch(/--duration-fast:/);
  });

  it("keeps the highlight on the flagged row too", () => {
    renderSettled(table());

    expect(row(MARKETING)).toHaveClass("hover:bg-surface");
    expect(row(MARKETING)).toHaveClass(...FLAGGED_ROW_CLASS.split(" "));
  });

  it("keys rows by department NAME, so a re-order moves the row", () => {
    const { rerender } = renderSettled(table());
    const before = row(MARKETING);

    rerender(
      <DepartmentTable
        rows={[...ROWS].reverse()}
        blendedTargetPercent={BLENDED}
      />,
    );

    // Same element, same department, now first — an index key would have
    // rewritten Sponsoring's figures into Marketing's row.
    const after = row(MARKETING);
    expect(after).toBe(before);
    expect(slots("department-row")[0]!.dataset.department).toBe(MARKETING);
    expect(cell(MARKETING, "actual").textContent).toBe("3.81");
  });

  it("wraps the two long names instead of truncating or overflowing", () => {
    renderSettled(table());

    for (const key of [MARKETING, MERCHANDISING]) {
      const label = cell(key, "name");

      expect(label).toHaveTextContent(departmentName(key));
      expect(label).toHaveClass("break-words");
      expect(label.className).not.toMatch(
        /truncate|text-ellipsis|line-clamp|overflow-hidden/,
      );
    }

    // And the table itself scrolls inside the tile rather than widening it.
    expect(slot("department-table-scroll")).toHaveClass("overflow-x-auto");
    expect(slot("department-table")).toHaveClass("w-full");
  });

  it("keeps every figure on one line", () => {
    renderSettled(table());

    for (const column of ["budget", "actual", "variance", "targetPercent"]) {
      expect(cell(MARKETING, column)).toHaveClass("whitespace-nowrap");
      expect(totalCell(column)).toHaveClass("whitespace-nowrap");
    }
    expect(cell(MARKETING, "budget").textContent).not.toContain("\n");
  });

  it("renders an empty list as a table with only its total row", () => {
    renderSettled(<DepartmentTable rows={[]} />);

    expect(slots("department-row")).toHaveLength(0);
    expect(totalCell("budget").textContent).toBe(formatMillions(0));
    expect(totalCell("budget").textContent).toBe("0.00");
  });
});

describe("DepartmentTable — reduced motion", () => {
  it("renders every bar at its FINAL width, with no frame requested", () => {
    stubMatchMedia(true);
    const frames = stubFrames();

    render(table());

    expect(
      slot("department-target-fill", cell(MARKETING, "targetPercent"))!.style
        .width,
    ).toBe("84%");
    expect(
      slot("department-target-fill", cell(HOSPITALITY, "targetPercent"))!.style
        .width,
    ).toBe("95%");
    expect(
      slot("department-target-fill", cell(EVENTS, "targetPercent"))!.style
        .width,
    ).toBe("100%");

    // Not one bar stranded at zero, and not one animation frame asked for.
    for (const fill of slots("department-target-fill")) {
      expect(fill.style.width).not.toBe("0%");
    }
    expect(frames.requested()).toBe(0);
  });

  it("still shows the figures, the marks and the flag", () => {
    stubMatchMedia(true);
    stubFrames();

    render(table());

    expect(cell(SPONSORING, "actual").textContent).toBe("21.84");
    expect(chip(MARKETING).dataset.judgement).toBe("ADVERSE");
    expect(row(MARKETING).dataset.flagged).toBe("true");
    expect(
      slot("department-target-dot", cell(HOSPITALITY, "targetPercent")),
    ).not.toBeNull();
  });
});

describe("DepartmentTableTile — the card around the table", () => {
  it("is the shared Card, not a second card anatomy", () => {
    renderSettled(
      <DepartmentTableTile title="Departmental performance" rows={ROWS} />,
    );

    expect(slot("card")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Departmental performance" }),
    ).toHaveClass("tile-title");
    expect(slot("department-table")).not.toBeNull();
  });

  it("passes the card slots through — action, caption and the entrance", () => {
    renderSettled(
      <DepartmentTableTile
        title="Departmental performance"
        rows={ROWS}
        blendedTargetPercent={BLENDED}
        action={<span>Season 26/27</span>}
        caption={t(hero3.primary.narrativeKey)}
        isNew
        delayMs={120}
      />,
    );

    expect(slot("card-action")).toHaveTextContent("Season 26/27");
    expect(slot("card-caption")).toHaveTextContent(
      "the only department both over budget and behind target",
    );
    expect(slot("card")).toHaveClass("fcb-enter");
    expect(slot("card")!.style.animationDelay).toBe("120ms");
  });
});

describe("department-table.tsx — code discipline", () => {
  it("carries no hex literal and no colour outside the token set", () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/rgb\(|hsl\(/);
  });

  it("formats no number of its own — every string comes from format.ts", () => {
    expect(CODE).not.toMatch(/toFixed\(|toLocaleString\(|Intl\./);
    // No factor of a thousand: the thousands-to-CHF conversion is format.ts's.
    expect(CODE).not.toMatch(/1_000|1000/);
    // The currency word does not appear in the component AT ALL since
    // US-049: the scale note is a dictionary entry, in both languages, and
    // this file holds only its key.
    expect(CODE).not.toMatch(/CHF/);
    expect(CODE).toContain(`"tiles.millionsNote"`);
    expect([t(MILLIONS_NOTE_KEY), de(MILLIONS_NOTE_KEY)]).toEqual([
      "figures in CHF millions",
      "Angaben in Mio. CHF",
    ]);
    expect(CODE).toMatch(/formatMillions\(/);
    expect(CODE).toMatch(/formatSignedMillions\b/);
    expect(CODE).toMatch(/formatPercent\(/);
    expect(CODE).toMatch(/chfFromThousands\(/);
  });

  it("owns no motion and no state of its own", () => {
    expect(CODE).toMatch(/useGrow\(/);
    expect(CODE).not.toMatch(
      /\buseState\b|\bsetInterval\b|\bsetTimeout\b|requestAnimationFrame/,
    );
  });

  it("composes the shared chip and the shared card rather than forking them", () => {
    expect(CODE).toMatch(/<DeltaChip/);
    expect(CODE).toMatch(/<Card\b/);
    expect(CODE).not.toMatch(/ArrowUp|ArrowDown/);
  });
});
