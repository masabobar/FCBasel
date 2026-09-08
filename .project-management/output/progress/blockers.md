# Active Blockers

**Last Updated:** 2026-09-09

---

## Summary

**Total Active Blockers:** 0
**Critical (P0):** 0
**High (P1):** 0
**Medium (P2):** 0
**Low (P3):** 0

---

## Active Blockers

*No active blockers! 🎉*

---

## Known Watch Items *(not blockers yet)*

These are tracked risks, not blockers. They become blockers only if they actually stall a story.

| Item | Type | Why it matters |
|---|---|---|
| Railway account and project access | Infrastructure | US-001 cannot complete without it; the deployed URL is the deliverable |
| FCB crest source asset | External Dependency | US-004 needs the genuine asset committed and self-hosted |
| Cross-phase dependency on US-013 / US-016 | Technical | Both need components that live in Phase 2b — reorder within the phase rather than blocking |

---

## Format

When blockers occur, they will be logged here with this format:

```markdown
### BLOCKER-001: Crest asset unavailable from the club source

**Story ID:** US-004
**Story Title:** Self-hosted FCB crest
**Blocker Type:** External Dependency
**Priority:** P1 (High)
**Status:** 🔴 Active

**Description:** The genuine crest could not be retrieved from the source asset named in the
Build Specification, so it cannot be committed and self-hosted.

**Impact:**
- US-004 cannot complete
- US-012 (app shell) renders without the crest, which undermines brand fidelity
- US-044 brand QA cannot pass

**Reported:** 2026-09-09 · **Reported By:** AI

**Resolution Plan:**
- [ ] Retry the source asset URL from the Specification
- [ ] Ask the commercial lead to obtain the asset from the club
- [ ] Confirm licensing for the trademarked crest

**Dependencies:** Club-side asset access

**Notes:** Never hotlink as a workaround — the build must not depend on the live CDN (E8).
```

---

## Resolved Blockers

*No resolved blockers yet.*

---

## Resolution Format

```markdown
### ✅ BLOCKER-001: Crest asset unavailable from the club source (RESOLVED)

**Resolution Date:** 2026-09-10 · **Resolution Time:** 1 day
**Resolved By:** Commercial lead
**Solution:** Asset supplied directly by the club, committed to `public/` and self-hosted.
```

---

## Blocker Categories

**Technical:** code bugs blocking implementation · architecture issues · performance problems
**External Dependency:** waiting on an asset, vendor, or service
**Decision Needed:** product decision · architecture choice · scope clarification
**Resource:** missing team member · access permissions needed
**Infrastructure:** environment issues · deployment problems

> **Project-specific note:** the usual "integration failure" and "third-party API" categories cannot
> occur here — this prototype has no integrations and makes no runtime network calls.

---

**Auto-Generated** | Updates during `/execute-work` | Manual blocker logging
