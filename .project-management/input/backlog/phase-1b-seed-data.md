# Phase 1b: Dummy Data Model & Seed Datasets

**Goal:** The single source of truth for every figure in the prototype, seeded locally and grounded
in verified FCB facts so nothing jars to someone who knows the club.
**Duration:** Day 1-2 (of a one-week build)
**Total Stories:** 5
**Total Points:** 10
**Status:** In Progress (3/5 completed)

> **Global guardrails apply** — see [`../constraints.md`](../constraints.md) §2.

---

## Epic 3: E3 — Dummy Data Model & Seed Datasets *(foundation)*

**Priority:** P0
**Total Story Points:** 10
**Status:** In Progress (3/5 completed)
**Source:** Build Specification E3.

> **Applies to every story in this epic:**
> - E7 **renders** these datasets; it does not invent numbers. All prototype figures originate here.
> - Ship as **static local files bundled with the app** — no network fetch at runtime (E8 offline
>   resilience).
> - Each hero is **one dataset object with a `primary` and a `followUp` section**, so a hero and its
>   escalation can never drift apart.
> - Figures are dummy but grounded in verified FCB facts; they are plausible and never claimed to be
>   actuals.
> - **No salary and no named-individual performance data exists in any dataset.**

**Verified grounding used throughout:** kit structure Home / Away / 3rd; current season 26/27, prior
25/26; real squad names and shirt numbers (Shaqiri 10, Sow 18, Metinho 5, Daniliuc 24) plus Custom;
real prices (CHF 99 adult, CHF 79 kids, +CHF 25 a name, +CHF 5 a sponsor badge); real badge sponsors
(Bitpanda the main shirt sponsor, Allianz, Sunrise, IWB); real commercial departments.

### Stories:

- **US-007**: Persona baseline datasets
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** The four pre-existing tiles that make the dashboard read as a tool already in use.
  - **Acceptance Criteria:**
    - Webshop revenue this month CHF 148,200, +12% vs last month, 6-point sparkline trending up
    - Last home match FCB 2-1 Sion, attendance 28,900 of ~38,000 capacity
    - Top products (units): Home shirt 26/27 1,840; Home scarf 1,210; Away shirt 26/27 940;
      Cap "Rotblau" 720; 3rd shirt 26/27 510
    - Active partners: 6 — Bitpanda, Macron, Allianz, Sunrise, Feldschlösschen, Hoffmann Automobile
  - **Dependencies:** US-001
  - **Notes:** **Delivered set intentionally exceeds the written AC**, per the user's approved
    decision. The criteria above describe a single period; the Reference Guide (definitive for the
    experience, `scope.md` §10) drives all four periods, so the shipped dataset carries This month /
    Last month / Last 3 months / Year to date for both the webshop series and top products, plus the
    attendance block per period. The two longer periods derive their x-axis labels from the current
    date. The webshop total and its delta are computed from the series, never stored. Partner brand
    colours sit deliberately outside the FCB token palette. Partner names follow the Guide, which
    shortens "Hoffmann Automobile" to "Hoffmann" so the tile does not truncate.

- **US-008**: Hero 1 dataset — shirt sales, badges, printed names
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Season-to-date merchandising figures plus the badge-trend follow-up data.
  - **Acceptance Criteria:**
    - Kit split at CHF 99: Home 22,400 (CHF 2.218M); Away 10,300 (CHF 1.020M); 3rd 5,800
      (CHF 0.574M). Total 38,500 shirts, ~CHF 3.81M gross. Home = 58% of units
    - Badge share ~8% = 3,080 shirts: Bitpanda 44%, Sunrise 24%, Allianz 20%, IWB 12%
    - Top-5 printed names of ~13,400 personalised: Shaqiri 3,180, Sow 1,240, Metinho 1,080,
      Custom 920, Daniliuc 760
    - Follow-up: badge trend over last three drops — Bitpanda flat-to-slightly-up, Sunrise +38%,
      Allianz +6%, IWB -3%
    - **Scope label on the tile:** season-to-date merchandising
  - **Dependencies:** US-001
  - **Notes:** Squad names are real and verified — merchandising data, not performance data, so the
    named-individual guardrail is not engaged. Print counts only; no player performance figures.
    **Delivered set exceeds the written AC, per the user's approved scope decision:** all four
    periods (season to date, last 3 months, last month, current month) are seeded, not only the
    season-to-date figures above — the tile has a period switch and `scope.md` §10 makes the
    Reference Guide definitive for the experience. Kit revenue, the 58% Home share, the 8% badge
    share and the four sponsor segments are **derived**, never stored.

- **US-009**: Hero 2 dataset — ticket revenue year on year
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-09)
  - **Description:** Matchday ticket revenue per home fixture, 25/26 vs 26/27, plus culprit-fixture
    follow-up data.
  - **Acceptance Criteria:**
    - Eight fixtures (CHF thousands, 25/26 → 26/27 → Δ): YB 1,480→1,610 (+130); FCZ 1,390→1,240
      (-150); Servette 980→1,050 (+70); St. Gallen 1,020→1,090 (+70); Luzern 890→820 (-70);
      Sion 760→690 (-70); GC 640→720 (+80); Lugano 720→610 (-110)
    - Totals 7,880 → 7,830, Δ -50, overall **-0.6%**; these are the eight highest-grossing home
      fixtures in both seasons
    - Follow-up: four declining fixtures FCZ -150, Lugano -110, Luzern -70, Sion -70; driver is
      **lower attendance, not pricing**; FCZ sold ~3,200 fewer seats (Friday-night kick-off plus
      reduced away allocation); YB sold out both seasons
    - Month-by-month series for both seasons across twelve months
    - **Scope labels:** the fixture chart is matchday revenue per home fixture (excluding the
      season-ticket base); the monthly chart is all home fixtures, hence larger totals — intentional
  - **Dependencies:** US-001
  - **Notes:** The monthly series is a Reference Guide addition beyond the Specification.

- **US-010**: Hero 3 dataset — departmental performance
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Full-year budget vs actual vs % of target by department, plus the causal
    follow-up data for Marketing.
  - **Acceptance Criteria:**
    - Six departments (CHF thousands, budget/actual/variance/% of target), each tagged Revenue or
      Cost: Sponsoring & Partnerships 21,000/21,840/+840 (+4.0%)/104%; Ticketing
      24,000/24,360/+360 (+1.5%)/102%; Hospitality 7,200/6,840/-360 (-5.0%)/95%; Merchandising
      (Fanshop) 9,800/9,050/-750 (-7.7%)/92%; Events 3,600/3,780/+180 (+5.0%)/105%;
      Marketing & Communications **(Cost)** 3,400/3,810/+410 (+12.1%)/84%
    - Total 69,000/69,680/+680 (+1.0%)/96% blended
    - Marketing flagged as the one department **both over budget and behind target**
    - Follow-up: activations ~CHF 240k over plan (derby + YB); paid social +18%; webshop conversion
      2.2% vs 2.6% plan (~85% of target); recommendation figure CHF 150k reallocation
    - **Scope label:** full-year departmental totals; Ticketing here includes season tickets, so it
      exceeds the sum of Hero 2's shown fixtures — intended, not inconsistent
  - **Dependencies:** US-001
  - **Notes:** Revenue vs Cost tagging is load-bearing — above budget is good for a revenue
    department, overspend for the Marketing cost centre.

- **US-011**: Formatters & cross-hero reconciliation
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** Todo
  - **Description:** Shared number formatting plus a check that figures reconcile across heroes.
  - **Acceptance Criteria:**
    - `CHF` prefix with thousands separators for money; `%` for shares; explicit `+`/`-` for variances
    - Millions helper for the department table ("figures in CHF millions")
    - Tabular numerals so digits do not jitter during count-up
    - **A figure appearing in two tiles is stored once and referenced — never re-typed**
    - Computed values (e.g. the webshop total and its delta) derive from their series so the number
      always matches the chart
    - All splits and variances verified to reconcile; percentages and absolutes agree
  - **Dependencies:** US-007, US-008, US-009, US-010

---

## Phase Summary

**Total Epics:** 1 | **Total Stories:** 5 | **Total Points:** 10

**By Priority:** P0: 5 stories, 10 points · P1: 0 · P2: 0

**By Status:** ✅ 3 stories, 6 points · 🔄 0 · 📋 2 stories, 4 points · ⏸️ 0

---

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-1a-setup-design-system.md) · [Next Phase →](phase-2a-shell.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-09
