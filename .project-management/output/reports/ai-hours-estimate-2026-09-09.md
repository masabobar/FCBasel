# AI Rapid-Development Estimate — FC Basel Intelligence Platform Prototype

**Generated:** 2026-09-09
**Mode:** A — Initial estimate (backlog only, no execution data yet)
**Source:** `.project-management/input/backlog/`
**Scope:** 7 phase files, 45 stories, 116 story points (`future.md` excluded)

**Conversion factors used:**

| Factor | Value | Meaning |
|---|---|---|
| SPEED_FACTOR | `0.25` | Claude is 4× faster than a human team on focused implementation (conservative end of the 3-6× band) |
| OVERHEAD_FACTOR | `1.20` | +20% for plan-mode rounds, verification, test runs, review iterations |
| HUMAN_LOOP_FACTOR | `0.25` | +25% for review, business decisions, third-party setup, waiting |
| Hours per point | mid-band | 1→1.5h · 2→3h · 3→4h · 5→12h |
| WALL_CLOCK_DIVISOR | `1.0` | 24/7 continuous as the primary annotation |

---

## Three Scenarios — Do Not Add

These are **three alternative estimates of the same 116 points**, not components of a total.

| Scenario | Hours | What it means |
|---|---:|---|
| 👤 **Team-hours** | **~173** | A traditional human team working a classic process |
| 🤖 **AI-core hours** | **~52** | A 24/7 Claude agent doing focused implementation against this spec |
| 🤖 **AI-realistic hours** | **~68** | AI-core plus the work the agent cannot do |

> ⚠️ **Never sum Team and AI.** Pick one scenario. AI-realistic is guidance for planning, not a
> contract — it is an adjustment of AI-core, not a separate measurement.

### AI-Realistic Adjustments

```
ai_core       =  172.5 team-hours × 0.25 × 1.20   =  51.8 h
human_in_loop =  51.8 × 0.25                      =  12.9 h
infra_setup   =  US-001 "Environment & deployment setup"  =   3.0 h
                                                     ────────
ai_realistic                                      =  67.7 h
```

**Infra source:** US-001 in [phase-1a](../../input/backlog/phase-1a-setup-design-system.md) is the
Environment & Deployment Setup foundation story, noted at ~2-4 h → **3 h** taken. This coincides
with the module's Railway-stack default, so the figure holds either way. It would scale to 1-2 days
on AWS/GCP/self-hosted.

**What human-in-the-loop covers here:** reviewing generated work, the Railway account and deploy
configuration, sourcing and committing the genuine club crest, and confirming the verbatim narrative
copy renders exactly as specified. Note there are **no third-party integrations** in this prototype
(no Stripe, no OAuth, no email provider), so 0.25 is if anything generous — see Calibration below.

---

## Overall

| Metric | Value |
|---|---|
| Total scope | 116 points |
| Done | 0 points |
| Remaining | 116 points |
| Progress | 0% |
| Remaining effort | Team ~173h · AI-core ~52h · AI-realistic ~68h |

---

## Per-Phase Breakdown

| Phase | Epic | Status | Points | Team-h | AI-core h | Days @8h | Cumulative finish |
|---|---|:--:|---:|---:|---:|---:|---|
| 1a — Setup & Design System | Setup, E2 | ⏳ | 14 | 19.5 | 5.8 | 0.73 | 2026-09-09 |
| 1b — Seed Data | E3 | ⏳ | 10 | 15.0 | 4.5 | 0.56 | 2026-09-10 |
| 2a — Shell | E4 | ⏳ | 16 | 27.0 | 8.1 | 1.01 | 2026-09-11 |
| 2b — Components | E6 | ⏳ | 29 | 40.0 | 12.0 | 1.50 | 2026-09-12 |
| 3a — Conversation | E5 | ⏳ | 17 | 29.0 | 8.7 | 1.09 | 2026-09-13 |
| 3b — Heroes | E7 | ⏳ | 16 | 22.0 | 6.6 | 0.82 | 2026-09-14 |
| 4 — Hardening | E8 | ⏳ | 14 | 20.0 | 6.0 | 0.75 | 2026-09-15 |
| **Total** | | | **116** | **172.5** | **51.8** | **6.47** | **2026-09-15** |

*Icons: ✅ done · 🔄 active · ⏳ not started*

**Phase 2b is the single largest block** (12 AI-hours, 23% of the build) — eleven chart and tile
components. It is also the most parallelisable and the most mechanical, so it is the phase where the
SPEED_FACTOR is most likely to prove conservative.

---

## Per-Priority Breakdown (remaining)

| Priority | Stories | Points | Team-h | AI-core h | Days @8h |
|---|---:|---:|---:|---:|---:|
| P0 — Must Have | 41 | 104 | 150.5 | 45.1 | 5.64 |
| P1 — Should Have | 4 | 12 | 22.0 | 6.6 | 0.82 |
| P2 — Nice to Have | 0 | 0 | 0 | 0 | 0 |

The P1 set is exactly the documented cut order (US-016, US-026, US-043, US-045). Dropping all four
saves ~6.6 AI-hours — **under one 8-hour day**. That is worth knowing before sacrificing polish: the
schedule pressure this prototype faces is not primarily a scope problem.

---

## Wall-Clock Projection

**AI-core (~51.8 h)**

| Scenario | Days | Finish |
|---|---:|---|
| 24/7 continuous | 2.2 | 2026-09-11 |
| 16h/day (2 shifts) | 3.2 | 2026-09-12 |
| 8h/day (1 shift) | 6.5 | 2026-09-15 |
| 8h/day, weekdays only | 9.1 | 2026-09-18 |

**AI-realistic (~67.7 h)**

| Scenario | Days | Finish |
|---|---:|---|
| 24/7 continuous | 2.8 | 2026-09-11 |
| 16h/day (2 shifts) | 4.2 | 2026-09-13 |
| 8h/day (1 shift) | 8.5 | 2026-09-17 |
| 8h/day, weekdays only | 11.8 | 2026-09-20 |

> The human-in-the-loop and infra portions of AI-realistic do not run in parallel with the agent, so
> they add calendar time rather than being absorbed by it.

---

## Reading This Against the Deadline

The brief requires the prototype **demonstrable and robust by the end of this week**, with the
internal sponsor seeing it first and the owner audience the week after.

- At **24/7 or 16h/day**, the full 116 points finish inside the week with room to spare.
- At **8h/day weekdays only**, AI-realistic lands 2026-09-20 — **past the deadline**. This is the
  scenario to watch.

The lever that matters is therefore **hours per day, not scope**. Cutting the entire P1 set buys
back only 0.82 days at 8h/day; moving from one shift to two buys back 4.3 days. If the week is at
risk, extend daily runtime before cutting the hero band.

---

## Notes & Caveats

- **Stories flagged for breakdown (≥21 pts):** none. Largest stories are 5 points
  (US-016 hero band, US-030 intent matching).
- **Stories without estimate:** none — all 45 stories parsed with both points and priority.
- **Point distribution:** 1×1pt · 21×2pt · 21×3pt · 2×5pt. A deliberately fine-grained backlog,
  which is why team-hours (173) is lower than the raw point count might suggest.
- **Parsing deviation:** the `/estimate-ai-hours` STEP 1 regexes expect `### US-NNN:` headers with
  `**Estimate:** N points`. This backlog uses the framework's own `phase-backlog-template.md` format
  (`- **US-NNN**:` with `**Story Points:** N`). The documented regex would have matched zero stories
  and reported 0 hours; the actual template format was parsed instead.
- **Band table source:** `backlog/README.md` has no "Story Point Reference" section, so the mid-band
  table from `estimate-ai-hours-conversion.md` was used directly.
- **These are Mode A estimates** — derived from the backlog, with no execution data to check them
  against. Treat them as an opinion until Phase 1 lands.

---

## Calibration

The defaults are an opinion, not a measurement. After Phase 1a and 1b complete:

1. Read the actual elapsed AI-time (sum of active session durations, **not** wall-clock with idle gaps).
2. Compute `actual_factor = actual_ai_hours / (planned_team_hours × 1.20)`.
   Phases 1a+1b planned at 34.5 team-hours → expected ~10.4 AI-hours at default.
3. If `actual_factor` differs from `0.25` by more than ±0.05, adopt it and re-run:
   `/holycode-pm:estimate-ai-hours --speed=<new>`

**Two reasons this estimate may prove conservative for this particular project:**
- The specification pins every value — colours, figures, verbatim copy — so there are unusually few
  design decisions to make during implementation. That is the condition the module names for
  `--speed=0.20`.
- There are no third-party integrations, so the 0.25 human-loop factor is carrying less than it
  usually does.

**One reason it may prove optimistic:** US-030 (intent matching) and Phase 4's dead-end sweep are
qualitative — "resolves the intended hero across several paraphrases" is judged, not asserted, and
may need more iterations than a 5-point story implies.

---

**Source:** `.project-management/input/backlog/` (45 stories across 7 phase files)
**Command:** `/holycode-pm:estimate-ai-hours` (defaults, no flags)
**Related:** [Scope](../../input/scope.md) · [Constraints](../../input/constraints.md) · [Backlog Index](../../input/backlog/README.md)
