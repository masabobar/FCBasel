# Project Backlog - Master Index

**Project:** {{PROJECT_NAME}}
**Last Updated:** {{DATE}}

---

## 📊 Summary Statistics

**Total Epics:** {{EPIC_COUNT}}
**Total Stories:** {{STORY_COUNT}}
**Total Story Points:** {{TOTAL_POINTS}}

**By Phase:**
- Phase 1 (Foundation): {{P1_STORIES}} stories, {{P1_POINTS}} points
- Phase 2 (Core Features): {{P2_STORIES}} stories, {{P2_POINTS}} points
- Phase 3 (Advanced): {{P3_STORIES}} stories, {{P3_POINTS}} points
- Phase 4 (Polish): {{P4_STORIES}} stories, {{P4_POINTS}} points
- Future (Post-launch): {{FUTURE_STORIES}} stories

**By Priority:**
- P0 (Must Have): {{P0_COUNT}} stories, {{P0_POINTS}} points
- P1 (Should Have): {{P1_COUNT}} stories, {{P1_POINTS}} points
- P2 (Nice to Have): {{P2_COUNT}} stories, {{P2_POINTS}} points

---

## 📁 Phase Backlogs

### [Phase 1: {{PHASE_1_NAME}}](phase-1-foundation.md)
**Goal:** {{PHASE_1_GOAL}}
**Stories:** {{P1_STORIES}} | **Points:** {{P1_POINTS}}
**Status:** {{P1_STATUS}} ({{P1_COMPLETE}}/{{P1_TOTAL}} completed)

### [Phase 2: {{PHASE_2_NAME}}](phase-2-core.md)
**Goal:** {{PHASE_2_GOAL}}
**Stories:** {{P2_STORIES}} | **Points:** {{P2_POINTS}}
**Status:** {{P2_STATUS}} ({{P2_COMPLETE}}/{{P2_TOTAL}} completed)

### [Phase 3: {{PHASE_3_NAME}}](phase-3-advanced.md)
**Goal:** {{PHASE_3_GOAL}}
**Stories:** {{P3_STORIES}} | **Points:** {{P3_POINTS}}
**Status:** {{P3_STATUS}} ({{P3_COMPLETE}}/{{P3_TOTAL}} completed)

### [Phase 4: {{PHASE_4_NAME}}](phase-4-polish.md)
**Goal:** {{PHASE_4_GOAL}}
**Stories:** {{P4_STORIES}} | **Points:** {{P4_POINTS}}
**Status:** {{P4_STATUS}} ({{P4_COMPLETE}}/{{P4_TOTAL}} completed)

### [Future Features (Post-Launch)](future.md)
**Goal:** Version 2.0+ features
**Stories:** {{FUTURE_STORIES}} (not estimated yet)

---

## 🎯 Quick Navigation

**Want to...**
- See all Phase 1 stories → [phase-1-foundation.md](phase-1-foundation.md)
- See all P0 (critical) stories → Check Phase 1 & 2 backlogs
- Add new story to current phase → Use `/add-scope add story [phase] [epic]`
- Add future feature → Use `/add-backlog-requirement` → [future.md](future.md)

---

## 📖 Prefix Legend (for Monorepo projects)

If this is a monorepo project, stories use these prefixes:

- **[BE]** - Backend only (apps/backend/)
- **[Mobile]** - Mobile app only (apps/mobile/)
- **[Web]** - Web app only (apps/web/) - if applicable
- **[Shared]** - Shared packages (packages/*)
- **[Full-stack]** - Touches multiple apps (coordination required)

---

**Related:**
- [Current Phase Plan](../../output/phases/phase-{{CURRENT_PHASE}}.md)
- [Project Scope](../scope.md)
- [Current Status](../../output/progress/DASHBOARD.md)

---

**Last Updated:** {{DATE}}
