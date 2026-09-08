# Architecture Document — FC Basel Intelligence Platform Prototype

**Version:** 1.0
**Date:** 2026-09-09
**Status:** Approved
**Author:** Developer

> **Template note:** the framework's architecture template assumes a 3-tier system with a database,
> external integrations, caching and disaster recovery. This prototype has none by design. Sections
> are kept and numbered, but where one does not apply it says so and why.

---

## 1. Executive Summary

**Architecture Style:** Single-tier client-rendered application with server-side rendering — a
**data-driven, scripted UI** with no backend services and no data layer beyond bundled constants.

**Key Technologies:** React Router 7 (framework mode, SSR), React 19, TypeScript, Tailwind 4,
hand-built SVG charts, Railway.

**Summary:** One route renders a persona dashboard. User input is matched against static intent
definitions; a matched intent appends tile descriptors to in-memory state; the grid re-renders with
an insertion animation. There is no server round-trip, no database, and no external call at runtime.
The architecture's entire job is to make a **scripted, local** experience feel like an intelligent,
connected one.

---

## 2. Architecture Overview

### 2.1 Architecture Style
Single-tier. Presentation and "business logic" (intent matching) live in the same client bundle;
seed data is imported as modules. SSR provides the initial paint; everything after that is local
state.

### 2.2 Key Architectural Decisions

| Decision | Choice | Rationale | Trade-offs |
|----------|--------|-----------|------------|
| Intelligence | Keyword matching over pre-authored narratives | A live model can render something ugly or wrong in a high-stakes room; that moment is unrecoverable | Only prepared questions are truly answered — mitigated by the graceful fallback |
| Data | Static bundled modules | Offline resilience is a hard demo requirement; venue Wi-Fi must not be able to break the demo | Data changes require a rebuild — acceptable for a demo artefact |
| Persistence | None (in-memory) | A demo run resets between showings; no accounts exist | Reload loses state — specified and desirable |
| Charts | Hand-built SVG, ported from the reference | Animation requirements (bar persistence, donut morph, stroke-draw, count-up from current value) are awkward to guarantee in a charting library | More code to own; offset by full control and zero dependency |
| Structure | Single app, not a monorepo | One deployable, one week, no separate API | Extracting a backend later needs a restructure — the repository seam limits the blast radius |
| Repository seam | Interfaces in `app/lib/repositories/` | Lets mock data be swapped for Prisma without touching callers | Slight indirection for a prototype that may never need it |

---

## 3. System Context

### 3.1 System Context Diagram

```
┌──────────────────────────────────────────────┐
│  Presenter's laptop (Chrome, 1920×1080)      │
│  ┌────────────────────────────────────────┐  │
│  │  FCB Prototype (Railway-served bundle) │  │
│  │  · seed data      (bundled)            │  │
│  │  · crest asset    (self-hosted)        │  │
│  │  · intent config  (static)             │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
        ▲ once, at load
        │
   ┌────┴─────┐        ✗ no runtime calls to: SAP · webshop · HR ·
   │ Railway  │          ticketing · CRM · any model endpoint · club CDN
   └──────────┘
```

After load, the box is sealed. That is the architecture's central property.

### 3.2 External Systems & Integrations

| System | Purpose | Integration Method |
|--------|---------|-------------------|
| Railway | Hosting; serves the bundle | Deploy-time only |
| Club CDN | Source of the genuine crest | **Build-time only** — asset downloaded and committed |

No others. Not SAP, not the webshop, not ticketing, not any model.

---

## 4. Container Diagram

### 4.1 Application Containers

**Single container.** React Router 7 framework mode serves SSR HTML and the client bundle from one
Node process on Railway.

- **Technology:** Node + `@react-router/serve`
- **Responsibilities:** serve the app shell and static assets; nothing else
- **Communication:** none outbound

There is no backend container and **no database container** — see §6.

---

## 5. Component Architecture

### 5.1 Frontend Components

```
App
├─ Sidebar                  navy rail; Dashboard active, three items inert
└─ main (scroll container)
   ├─ TopBar                connection status (decorative), Reset, avatar
   ├─ HeroBand              greeting + period filter + webshop chart + attendance ring
   ├─ Baseline              Top Products (own filter) + Active Partners
   ├─ HeroSection*          one per answered question, in the order asked
   │   └─ Hero1 | Hero2 | Hero3
   │       ├─ SectionHead   the asked-question pill
   │       ├─ Narrative     the verbatim "AI answer" line
   │       ├─ Cards         charts / tables / KPI tiles
   │       └─ (follow-up)   FollowDivider + escalation tiles + Recommendation
   ├─ Thinking              during the staged latency beat
   ├─ Fallback              when typed input matches nothing
   └─ empty-state           before any question is asked
└─ PromptBar                suggestion chips + input + send
```

**Layering rule:** charts and tiles are presentational and stateless; heroes compose them and supply
E3 data; only `App` and the intent module hold interaction state.

### 5.2 Backend Components
**None.** The only server-side code is the seed-data selection in `app/lib/repositories/index.server.ts`.

---

## 6. Data Architecture

### 6.1 Data Model

No database, no ERD. Seed data is a set of typed constants:

| Constant | Feeds |
|---|---|
| `HERO_PERIODS` | Hero band — webshop series (current vs previous) + attendance per period |
| `TP_PRODUCTS` / `TP_PERIODS` | Top Products bars |
| `PARTNERS` | Active Partners tiles |
| `H1_PERIODS`, `KIT_*`, `H1_BADGE_SPLIT` | Hero 1 across four periods |
| `DATA.hero1/2/3` | Hero datasets **and the verbatim narratives** |
| `HEROES` / `FOLLOWUPS` | Chip labels, thinking messages, source chips |
| `INTENTS` | Keyword sets for matching |

Each hero is **one object with `primary` and `followUp`**, so a hero and its escalation cannot drift.
Derived figures (e.g. the webshop total and its delta) are computed from their series so the number
always matches the chart.

### 6.2 Data Flow

```
input (typed or chip tap)
   │
   ├─ chip tap ──────────────► resolve directly to mapped intent
   │
   └─ free text ─► normalise ─► score against INTENTS ─► above threshold?
                                                          │
                                        no ───────────────┴──► Fallback panel
                                        yes
                                         │
                              hero ──────┴────── follow-up
                                │                    │
                                │            parent shown this session?
                                │                 no │ yes
                                │      render parent │ flip phase to
                                │      + offer chip  │ withFollowUp
                                ▼                    ▼
                          set thinking state (fixed delay, no request)
                                         │
                          append/refresh tile descriptors in memory
                                         │
                          grid re-renders with insertion animation
                                         │
                          auto-scroll to the newest section
```

### 6.3 Data Storage Strategy
**Primary:** bundled JS/TS modules. **Caching:** none. **File storage:** none — the crest and any
images are committed static assets.

### 6.4 Caching Strategy
**Not applicable.** Nothing is fetched, so nothing is cached. Standard browser caching of the static
bundle is all that applies, and it is Railway's default.

---

## 7. Security Architecture

The threat surface is close to empty: no accounts, no persistence, no user input reaching a server,
no data store, no network calls after load.

**What still matters:**
- **No PII.** No personal data is processed, stored or displayed.
- **Content guardrail.** No salary and no named-individual performance data in any tile, dataset or
  narrative — the one thing most likely to make a governance-conscious owner flinch.
- **Asset provenance.** The crest is self-hosted, not hotlinked (also removes a CORS/availability risk).
- **XSS.** React auto-escaping covers the only user input (the prompt field), which is never
  rendered back as markup — it is matched against a fixed intent list and discarded.

Not applicable: HTTPS-only enforcement beyond Railway's default, JWT, RBAC, CSRF tokens, rate
limiting, SQL-injection prevention. There is no session, no form post, and no database.

---

## 8. Integration Architecture

### 8.1 Third-Party Integrations
**None.** See §3.2.

### 8.2 API Strategy
**No API.** No internal endpoints, no versioning scheme, no external clients. If the prototype ever
grows one, `.claude/rules/api-versioning.md` and `api-documentation.md` apply in full — they simply
do not engage on any story in this backlog.

---

## 9. Deployment Architecture

**Infrastructure:** one Railway service. No database, no Redis, no CDN, no worker.

```
push to main ─► Railway build ─► pnpm build ─► @react-router/serve ─► shareable URL
```

No migrations (no database). No secrets (no environment variables). Health check is the root route
returning the baseline dashboard.

---

## 10. Performance & Scalability

### Performance Targets
See [`technical-spec.md`](technical-spec.md) §11. The targets that matter are animation smoothness
and presentation legibility, not throughput.

### Scalability Strategy
**Not applicable.** The audience is one room. There is no concurrency story, no read replica, no
horizontal scaling — and adding any would be scope creep against a one-week sales artefact.

---

## 11. Monitoring & Observability

**Not applicable.** See [`technical-spec.md`](technical-spec.md) §12. The observability requirement
is an error-free Chrome console during rehearsal.

---

## 12. Disaster Recovery

### 12.1 Backup Strategy
No data to back up. The code is the artefact; git is the backup.

> ⚠️ **Real recovery risk, and it is not technical:** the four source client documents in
> `.project-management/client-input/` are **gitignored** for privacy and exist only on the
> developer's machine. Losing that directory loses the specification. Keep a copy elsewhere.

### 12.2 Recovery Procedures
Redeploy from git. Since there is no state and no database, recovery is a rebuild — minutes, not
hours. **The demo itself needs no recovery procedure:** once the page is loaded it survives total
network loss, which is the failure mode that actually threatens the meeting.

---

## 13. Technical Debt & Future Considerations

### 13.1 Known Technical Debt — accepted deliberately
- **The intelligence is keyword matching.** Named, not hidden. This is the prototype's premise.
- **Data is bundled constants.** Changing a figure needs a rebuild.
- **No persistence.** Every reload is a fresh demo.
- **Placeholder partner logos.** Initials on coloured tiles until assets are licensed.

None of this is debt to repay inside the prototype. Per the Framing document, this is a **sales
artefact built for speed, not a first increment of the platform** — it should not be treated or
reused as production foundation.

### 13.2 Future Improvements
The Discovery scope in [`../../input/backlog/future.md`](../../input/backlog/future.md): semantic
layer, real integration, live AI, permissions and governance, live data, genuine causal analysis,
targets/KPIs/bonuses, persistence, licensed assets.

---

## 14. Appendices

### A. Architecture Decision Records
The decisions table in §2.2 serves as the ADR set for this prototype. Three were resolved explicitly
on 2026-09-09: charting approach (hand-built SVG), the cut order under time pressure, and the
Specification-vs-Guide conflict on the new-tile gold ring (Guide precedence — no ring).

### B. Glossary
See [`technical-spec.md`](technical-spec.md) §1.3.

### C. References
- [Technical Specification](technical-spec.md) · [PRD](prd.md)
- [Scope](../../input/scope.md) · [Constraints](../../input/constraints.md)
- [Repository seam](../../../app/lib/repositories/README.md)

---

**Document Owner:** Developer
**Last Updated:** 2026-09-09
