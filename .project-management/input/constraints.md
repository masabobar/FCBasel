# Project Constraints — FC Basel Intelligence Platform Prototype

**Version:** 1.0.0
**Last Updated:** 2026-09-09
**Source:** Framing, Brief, Goals & Rules §7; Build Specification §3, E8

---

## 1. Timeline

**The prototype is needed this week.** The internal sponsor sees it first; the owner audience
follows the week after.

- Build to be **demonstrable and robust by the end of the week**, not feature-complete.
- This is the single hardest constraint and it shapes every trade-off below. Where a choice is
  between more capability and a guaranteed-good demo, take the guaranteed-good demo.

## 2. Scope constraints (non-negotiable guardrails)

These are global. Every epic inherits them; no epic overrides them.

| Constraint | Detail |
|---|---|
| **No real system integration** | Nothing connects to SAP, the webshop, HR, ticketing, a CRM, or any live source. All data is local and seeded. |
| **No real AI or LLM at runtime** | Questions are keyword-matched to a fixed set of scripted flows. No model is called, no SQL generated, no answer computed live. **Do not "upgrade" the prototype to call a live model.** |
| **No real permissions or authentication** | A single persona. A cosmetic login screen is optional and, if present, decorative only. |
| **No live data or real-time latency** | The short thinking delay is deliberate, fixed stagecraft — not a query round-trip. |
| **No persistence across sessions** | State lives in memory for a demo run and resets to baseline. No database required. |
| **No salary or named-individual performance data, anywhere** | No individual's pay and no "person X is at Y% of target" in any tile, dataset or narrative. |
| **Not a slice of the real platform** | Outputs must never imply that the semantic layer, integration, governance or causal analysis are solved. |

**Why scripted is deliberate, not a shortcut:** a live model in a high-stakes room can render
something ugly or wrong in front of the owner, and that moment is unrecoverable. The safety of a
guaranteed-good render outweighs the flexibility of a live one; intent-matching plus graceful
fallback give the *feel* of a generative system without the risk.

## 3. Technical constraints

- **Presentation target:** must render correctly and legibly at **1920×1080** with no horizontal
  scroll, and degrade gracefully on a typical laptop screen.
- **Browser:** **Chrome is the demo guarantee.** Other modern browsers should work but Chrome is the
  primary target.
- **Offline resilience:** once loaded, the prototype must function with the **network disconnected** —
  no runtime dependency on the FCB CDN, any API, or any model endpoint. Venue Wi-Fi must never be
  able to break the demo.
- **Asset self-hosting:** the crest is downloaded and self-hosted; the build must not depend on the
  live club CDN at runtime (CORS and availability risk).
- **Dead-end freedom:** every path must be verified dead-end-free — each hero, each follow-up,
  off-script input, empty input, and reset.
- **Colour discipline:** a fixed token set; a design needing a colour outside it is not permitted —
  choose the nearest token. Gold is an accent only, never a third fill colour.

## 4. Data constraints

- **Dummy but realistic.** All data invented, but anchored to verified FCB facts — real kit
  structure, current/previous season, real squad names and shirt numbers, real prices, real sponsors,
  real department names — so nothing jars to someone who knows the club.
- **Internally reconciled.** All splits and variances are pre-checked to reconcile. A figure
  appearing in two tiles is stored once and referenced, never re-typed.
- **Scope differences are intentional and must be labelled.** Hero 1 is season-to-date merchandising;
  Hero 2 is matchday ticket revenue per home fixture (excluding the season-ticket base); Hero 3 is
  full-year departmental totals (whose Ticketing figure includes season tickets, so it exceeds the
  sum of Hero 2's shown fixtures).
- **Currency:** every monetary value renders with `CHF` and thousands separators.
- **Narrative copy is verbatim.** The pre-authored narrative strings must not be paraphrased during
  the build; they are consistent with the figures by construction.

## 5. Team & process constraints

- **Sales artefact, not production.** Optimised for a convincing demonstration under a tight
  deadline. It is not a first increment of the platform and should not be treated or reused as one.
- **Deviations are declared, not absorbed.** This engagement already runs deliberately outside the
  standard discovery-and-proposal process, by agreement. Any further departure from the plan is
  named and agreed, not made silently.
- **Ambiguity is escalated, not guessed.** Where the specification is genuinely undefined or
  contradictory, raise it with the specification owner rather than guessing.
- **Project setup and deployment are the developer's call** — deliberately outside the build
  specification. Their absence from that document is intentional, not an omission.

## 6. Quality constraints

- **Instant and flawless.** Transitions (thinking beat, tile insertion, grid reflow) must be smooth
  with no flicker or layout jump. Timing tuned so renders are smooth on the target hardware.
- **Legible from a room.** Borders, type sizes and chart labels must survive a projector; subtle
  greys must not wash out. Sign and arrow carry variance meaning too, so colour is never the sole
  signal.
- **Accessibility:** focus-visible outlines set; `prefers-reduced-motion` honoured throughout, with
  every animated value rendering at its final state immediately when set; figures use tabular
  numerals so digits do not jitter while animating.
- **Stability under abuse:** rapid repeated submits are debounced (one render at a time); repeated
  reset presses leave no broken state, no duplicate tiles, no overlapping animations.

## 7. Compliance

- No personal data of club employees is processed, stored or displayed.
- The club crest is trademarked — used as the genuine asset per the specification, self-hosted;
  partner logos are placeholders until licensed.
- No GDPR-relevant processing occurs: the prototype has no accounts, no persistence, and no
  network calls at runtime.
