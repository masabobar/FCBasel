# Phase 3b: Scripted Hero Flows & Narrative Orchestration

**Goal:** The heart of the prototype — the three client-provided questions, each wired end to end as
a two-beat flow: a primary view with a narrative, then an escalating follow-up that moves from
*what* to *so-what*.
**Duration:** Days 4-5 (of a one-week build)
**Total Stories:** 6
**Total Points:** 16
**Status:** ✅ Completed (6/6)

> **Applies to every story in this epic:**
> - Each hero renders its tiles **in the defined order**, with the E2 insertion animation and its
>   narrative caption.
> - **All narrative copy is verbatim — the developer must not paraphrase narrative strings.** They
>   are consistent with the E3 figures by construction; editing one silently breaks that.
> - Figures come from E3 only. Heroes render datasets; they do not invent numbers.
> - A follow-up chip appears only after its hero has rendered.
> - Re-asking a hero refreshes its tiles in place (dedupe by hero id), never duplicates them.

---

## Epic 7: E7 — Scripted Hero Flows

**Priority:** P0
**Total Story Points:** 16
**Status:** ✅ Completed (6/6)
**Source:** Build Specification E7 and pattern §5.3; Reference Implementation Guide §8, §13.

### Stories:

- **US-034**: Hero 1 primary — shirt sales, badge share, printed names
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-10)
  - **Description:** *"Show me shirt sales split into home, away and third kit. How many have sponsor
    badges (Bitpanda, Allianz, Sunrise, IWB) printed, and the top 5 printed names."*
  - **Acceptance Criteria:**
    - Chip label: "Shirt sales by kit & sponsor badges"
    - Keyword set: shirt/shirts/trikot/kit/kits/jersey/jerseys + any of
      sales/sold/split/home/away/third/3rd/badge/badges/sponsor/printed/name/names
    - Tiles in order: (1) bar chart "Shirt sales by kit (season to date)" — Home 22,400 / Away 10,300
      / 3rd 5,800 units, subtitle total 38,500 shirts · CHF 3.81M; (2) donut "Sponsor badges printed"
      — centre 3,080 (~8%), segments Bitpanda 44%, Sunrise 24%, Allianz 20%, IWB 12%;
      (3) horizontal bars "Top printed names" — Shaqiri 3,180 / Sow 1,240 / Metinho 1,080 /
      Custom 920 / Daniliuc 760
    - Narrative **verbatim**: *"Pulled from Merchandising, Webshop and flock-printing. The Home kit
      drives 58% of shirt sales; about 8% of shirts carry a sponsor badge, with Bitpanda the most
      printed; Shaqiri is comfortably the most printed name."*
    - A section-level `Segmented` filter (Season to date / Last 3 months / Last month / Current
      month) drives **all three tiles** together; badge segments derive per period with rounding
      corrected to sum exactly
    - Bar hover shows units, share and revenue; labels count up on filter change
  - **Dependencies:** US-008, US-018, US-020, US-021, US-024, US-026, US-033

- **US-035**: Hero 1 follow-up — which badge to push next
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-10)
  - **Description:** *"Which badge should we push in the next drop?"*
  - **Acceptance Criteria:**
    - Chip label: "Which badge should we push next?"; triggers on which/what + badge/sponsor +
      push/promote/next/drop/recommend
    - Gold "Follow-up" divider separates the beat
    - Driver tile "Badge selection trend (last 3 drops)": Bitpanda flat-high, **Sunrise +38%**,
      Allianz +6%, IWB -3% — plus a recommendation panel
    - Narrative **verbatim**: *"Bitpanda already leads badge selection, but Sunrise is growing
      fastest - up 38% over the last three drops off a smaller base. Recommendation: feature Sunrise
      in the next drop to convert its momentum, while keeping Bitpanda as the default option."*
  - **Dependencies:** US-034, US-023

- **US-036**: Hero 2 primary — ticket revenue year on year
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-10)
  - **Description:** *"Show me the ticket revenue of last year and this year. Show me the difference
    for each match - for example FCB vs FCZ, 25/26 vs 26/27."*
  - **Acceptance Criteria:**
    - Chip label: "Ticket revenue, this year vs last"
    - Keyword set: ticket/tickets/matchday/gate + revenue/last year/this year/season/25 26/26 27/
      per match/fixture/fixtures/difference/compare/FCZ
    - Tiles in order: (1) grouped bars "Matchday ticket revenue by fixture (CHF 000)" — eight
      fixtures, two bars each (25/26 navy, 26/27 red), subtitle "eight highest-grossing home
      fixtures"; (2) totals tile — 26/27 CHF 7.83M vs 25/26 CHF 7.88M, **-0.6%** with negative token
      and down arrow, both seasons as labelled compare bars plus the absolute change
    - Full-width month-by-month line chart comparing both seasons across twelve months, current
      season filled, with legend and hover — **labelled as all home fixtures**, a broader scope than
      the eight fixtures above
    - Narrative **verbatim**: *"Overall matchday ticket revenue is roughly flat year on year (-0.6%),
      but it varies sharply by fixture: YB, Servette and St. Gallen are up, while FCZ, Lugano and
      Sion are down. The FCZ match is the single biggest drop, -CHF 150k."*
  - **Dependencies:** US-009, US-017, US-019, US-024, US-025, US-033
  - **Notes:** The monthly chart and the rebuilt totals tile are Reference Guide additions.

- **US-037**: Hero 2 follow-up — which fixtures are driving the drop
  - **Story Points:** 2
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-10)
  - **Description:** *"Which fixtures are driving the drop?"*
  - **Acceptance Criteria:**
    - Chip label: "Which fixtures are driving the drop?"; triggers on which/what + fixtures/matches +
      driving/drop/down/decline, or why + down/lower
    - Horizontal bars ranking the four declining fixtures by size of decline, in negative mode with a
      `CHF ...k` formatter: FCZ **-CHF 150k**, Lugano -CHF 110k, Luzern -CHF 70k, Sion -CHF 70k
    - A `-CHF 400k total` badge in the card's action slot; a one-line attendance note
    - Narrative **verbatim**: *"Four fixtures account for the decline: FCZ (-CHF 150k), Lugano
      (-110k), Luzern (-70k) and Sion (-70k). In each, the fall is driven by lower attendance rather
      than pricing - the FCZ match sold about 3,200 fewer seats year on year, partly a Friday-night
      kick-off and partly a reduced away allocation. YB, by contrast, sold out both seasons."*
    - Values render on a single line — never wrapped
  - **Dependencies:** US-036, US-023

- **US-038**: Hero 3 primary — department budget vs actual vs target
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-10)
  - **Description:** *"Show me the budget of each department, the difference of actuals to budget,
    and the % of target achieved."*
  - **Acceptance Criteria:**
    - Chip label: "Department budgets vs actuals"
    - Keyword set: budget/budgets/department/departments/actuals/actual/variance/spend + any of
      difference/over/under/target/achieved/%/performance
    - Tiles in order: (1) table "Departmental performance (full year, CHF 000)" — six departments
      plus a total row, each tagged Revenue or Cost, with variance and % of target; **Marketing &
      Communications visibly flagged as both over budget and behind target**; figures shown in CHF
      millions; (2) overall tile — Actual CHF 69.68M vs Budget CHF 69.00M, **+1.0%**, blended target
      96%, with budget-vs-actual compare bars and an above-target count
    - Narrative **verbatim**: *"Most departments are on or ahead of plan. Two need attention:
      Merchandising is 7.7% under its revenue target, and Marketing & Communications is 12% over its
      spend budget while sitting at 84% of its outcome target - the only department both over budget
      and behind target."*
    - Revenue vs cost tagging reads correctly: above budget is good for revenue departments,
      overspend for the Marketing cost centre
  - **Dependencies:** US-010, US-017, US-022, US-024, US-033

- **US-039**: Hero 3 follow-up — why Marketing is off plan *(the causal peak)*
  - **Story Points:** 3
  - **Priority:** P0
  - **Component:** [Web]
  - **Status:** ✅ Completed (2026-09-10)
  - **Description:** *"Why is Marketing over budget and behind target?"* — the moment the whole
    prototype exists to produce.
  - **Acceptance Criteria:**
    - Chip label: "Why is Marketing over budget & behind target?"; triggers on why + marketing (or
      explain/what's driving + marketing); also resolves loose phrasing such as "why is marketing
      high?"
    - Driver tile "What's driving Marketing": overspend split (match activations ~CHF 240k over;
      paid social +18%) and the outcome gap (webshop conversion 2.2% vs 2.6% plan)
    - Recommendation panel, visually distinct from the data tiles
    - Narrative **verbatim**: *"Marketing's overspend is concentrated in two areas: the derby and YB
      match activations ran about CHF 240k over plan combined, and paid-social spend rose 18% chasing
      a webshop conversion target that underdelivered - conversion landed at 2.2% against a 2.6%
      plan. Recommendation: pause the incremental paid-social spend and reallocate about CHF 150k to
      the matchday activations that did convert, and revisit the conversion target with Webshop
      before the winter campaign."*
  - **Dependencies:** US-038, US-023
  - **Notes:** Per the brief, the beat the owner is expected to lean forward on. Shipped with the
    three drivers summing to Marketing's derived +410 variance and the narrative byte-identical.

---

## Phase Summary

**Total Epics:** 1 | **Total Stories:** 6 | **Total Points:** 16

**By Priority:** P0: 6 stories, 16 points · P1: 0 · P2: 0

**By Status:** ✅ 6 stories, 16 points · 🔄 0 · 📋 0 · ⏸️ 0

---

**Navigation:**
[← Master Index](README.md) · [← Previous](phase-3a-conversation.md) · [Next Phase →](phase-4-polish.md) · [Dashboard](../../output/progress/DASHBOARD.md)

**Last Updated:** 2026-09-10
