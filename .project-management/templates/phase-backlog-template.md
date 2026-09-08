# Phase {{PHASE_NUMBER}}: {{PHASE_NAME}}

**Goal:** {{PHASE_GOAL}}
**Duration:** {{DURATION}}
**Total Stories:** {{STORY_COUNT}}
**Total Points:** {{TOTAL_POINTS}}
**Status:** {{STATUS}} ({{COMPLETED}}/{{TOTAL}} completed)

---

## Epic {{EPIC_NUMBER}}: {{EPIC_NAME}}

**Priority:** {{PRIORITY}}
**Total Story Points:** {{EPIC_POINTS}}
**Status:** {{EPIC_STATUS}} ({{EPIC_COMPLETED}}/{{EPIC_TOTAL}} completed)

### Stories:

- **US-{{ID}}**: {{TITLE}}
  - **Story Points:** {{POINTS}}
  - **Priority:** {{PRIORITY}}
  - **Component:** {{COMPONENT}} (e.g., [BE], [Mobile], [Shared], [Full-stack])
  - **Status:** {{STATUS}} (Todo / In Progress / Completed)
  - **Description:** {{DESCRIPTION}}
  - **Acceptance Criteria:**
    - {{CRITERION_1}}
    - {{CRITERION_2}}
    - {{CRITERION_3}}
  - **Dependencies:** {{DEPENDENCIES}} (e.g., US-001, US-002 or None)
  - **Notes:** {{NOTES}} (optional)

- **US-{{ID}}**: {{TITLE}}
  - Story Points: {{POINTS}}
  - Priority: {{PRIORITY}}
  - Component: {{COMPONENT}}
  - Status: {{STATUS}}
  - Description: {{DESCRIPTION}}
  - Acceptance Criteria:
    - {{CRITERION_1}}
    - {{CRITERION_2}}
  - Dependencies: {{DEPENDENCIES}}

---

## Epic {{EPIC_NUMBER}}: {{EPIC_NAME}}

**Priority:** {{PRIORITY}}
**Total Story Points:** {{EPIC_POINTS}}
**Status:** {{EPIC_STATUS}}

### Stories:

{{MORE_STORIES}}

---

## Phase Summary

**Total Epics:** {{EPIC_COUNT}}
**Total Stories:** {{STORY_COUNT}}
**Total Points:** {{TOTAL_POINTS}}

**By Priority:**
- P0: {{P0_COUNT}} stories, {{P0_POINTS}} points
- P1: {{P1_COUNT}} stories, {{P1_POINTS}} points
- P2: {{P2_COUNT}} stories, {{P2_POINTS}} points

**By Status:**
- ✅ Completed: {{COMPLETED_COUNT}} stories, {{COMPLETED_POINTS}} points
- 🔄 In Progress: {{IN_PROGRESS_COUNT}} stories, {{IN_PROGRESS_POINTS}} points
- 📋 Todo: {{TODO_COUNT}} stories, {{TODO_POINTS}} points
- ⏸️ Blocked: {{BLOCKED_COUNT}} stories, {{BLOCKED_POINTS}} points

---

**Navigation:**
- [← Back to Master Index](README.md)
- [Next Phase →](phase-{{NEXT_PHASE}}-{{NEXT_NAME}}.md) (if exists)
- [Current Phase Plan](../../output/phases/phase-{{PHASE_NUMBER}}.md)
- [Project Dashboard](../../output/progress/DASHBOARD.md)

---

**Last Updated:** {{DATE}}
