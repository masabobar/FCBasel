# Phase {{PHASE_NUMBER}}: {{PHASE_NAME}}

**Duration:** {{START_DATE}} to {{END_DATE}} ({{DURATION}} weeks/months)
**Status:** Planning / In Progress / Completed / On Hold
**Started:** {{START_DATE}}
**Target Completion:** {{TARGET_DATE}}
**Actual Completion:** {{COMPLETION_DATE}}

---

## Phase Goal

{{PHASE_GOAL_DESCRIPTION}}

**Success Criteria:**
- {{CRITERION_1}}
- {{CRITERION_2}}
- {{CRITERION_3}}

---

## Epics in This Phase

### Epic {{EPIC_ID_1}}: {{EPIC_NAME_1}} ({{TOTAL_POINTS_1}} story points)

**Priority:** P0 / P1 / P2
**Status:** Todo / In Progress / Completed
**Dependencies:** {{DEPENDENCIES}}

**User Stories:**

#### {{STORY_ID_1}}: {{STORY_TITLE_1}}
- **Story Points:** {{POINTS}}
- **Priority:** P0 / P1 / P2
- **Status:** Todo / In Progress / Testing / Completed
- **Assigned To:** {{DEVELOPER_NAME}}
- **Started:** {{DATE}}
- **Completed:** {{DATE}}

**Acceptance Criteria:**
- [ ] {{CRITERIA_1}}
- [ ] {{CRITERIA_2}}
- [ ] {{CRITERIA_3}}

**Technical Notes:**
{{TECHNICAL_DETAILS}}

**Definition of Done:**
- [ ] Code implemented and reviewed
- [ ] All tests passing (unit, integration, E2E)
- [ ] Coverage > 80%
- [ ] All API status codes tested (200/400/401/403/404/500)
- [ ] i18n translations added (if I18N-RULES.md exists)
- [ ] Documentation updated (tech spec, API docs)
- [ ] Security review passed
- [ ] Git commit created
- [ ] Progress tracking updated

---

#### {{STORY_ID_2}}: {{STORY_TITLE_2}}
{{STORY_2_DETAILS}}

---

### Epic {{EPIC_ID_2}}: {{EPIC_NAME_2}} ({{TOTAL_POINTS_2}} story points)
{{EPIC_2_DETAILS}}

---

## Phase Metrics

### Planning Estimates
- **Total Story Points:** {{TOTAL_POINTS}}
- **Total Stories:** {{TOTAL_STORIES}}
- **Total Epics:** {{TOTAL_EPICS}}
- **Estimated Duration:** {{WEEKS}} weeks
- **Risk Level:** Low / Medium / High

### Progress Tracking (Auto-Updated by /execute-work)
- **Completed Story Points:** {{COMPLETED_POINTS}} / {{TOTAL_POINTS}} ({{PERCENTAGE}}%)
- **Completed Stories:** {{COMPLETED_STORIES}} / {{TOTAL_STORIES}}
- **Tests Passing:** {{TESTS_PASSED}} / {{TOTAL_TESTS}}
- **Code Coverage:** {{COVERAGE_PERCENTAGE}}%
- **Commits:** {{COMMIT_COUNT}}

### Velocity
- **Planned Velocity:** {{PLANNED_POINTS}} points/week
- **Actual Velocity:** {{ACTUAL_POINTS}} points/week
- **Trend:** Increasing / Stable / Decreasing

---

## Dependencies

### Internal Dependencies
- **Depends On:**
  - {{DEPENDENCY_1}}: {{DESCRIPTION}}
  - {{DEPENDENCY_2}}: {{DESCRIPTION}}

- **Blocks:**
  - {{BLOCKED_ITEM_1}}: {{DESCRIPTION}}
  - {{BLOCKED_ITEM_2}}: {{DESCRIPTION}}

### External Dependencies
- **Third-Party Services:**
  - {{SERVICE_1}}: {{DESCRIPTION}}
  - {{SERVICE_2}}: {{DESCRIPTION}}

- **Team Dependencies:**
  - {{TEAM_DEPENDENCY_1}}: {{DESCRIPTION}}

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation Strategy | Owner | Status |
|------|--------|-------------|---------------------|-------|--------|
| {{RISK_1}} | High/Medium/Low | High/Medium/Low | {{MITIGATION_1}} | {{OWNER}} | Open/Mitigated |
| {{RISK_2}} | High/Medium/Low | High/Medium/Low | {{MITIGATION_2}} | {{OWNER}} | Open/Mitigated |
| {{RISK_3}} | High/Medium/Low | High/Medium/Low | {{MITIGATION_3}} | {{OWNER}} | Open/Mitigated |

---

## Technical Debt

### Debt Introduced
- {{DEBT_ITEM_1}}: {{DESCRIPTION}} (Impact: {{IMPACT}})
- {{DEBT_ITEM_2}}: {{DESCRIPTION}} (Impact: {{IMPACT}})

### Debt Resolved
- {{RESOLVED_ITEM_1}}: {{DESCRIPTION}}
- {{RESOLVED_ITEM_2}}: {{DESCRIPTION}}

---

## Team Capacity

**Single Developer + AI Tools**

| Week | Available Hours | Planned Points | Actual Points | Notes |
|------|----------------|----------------|---------------|-------|
| Week 1 | {{HOURS}} | {{PLANNED}} | {{ACTUAL}} | {{NOTES}} |
| Week 2 | {{HOURS}} | {{PLANNED}} | {{ACTUAL}} | {{NOTES}} |
| Week 3 | {{HOURS}} | {{PLANNED}} | {{ACTUAL}} | {{NOTES}} |
| Week 4 | {{HOURS}} | {{PLANNED}} | {{ACTUAL}} | {{NOTES}} |

**Total Capacity:** {{TOTAL_HOURS}} hours

---

## Progress Log

### {{DATE_1}}
**Activity:**
- Started Epic {{EPIC_ID}}
- Completed US-{{STORY_ID}} ({{POINTS}} points)
- Tests: {{PASSED}}/{{TOTAL}} passing
- Coverage: {{PERCENTAGE}}%

**Blockers:**
- {{BLOCKER_1}}
- {{BLOCKER_2}}

**Next Steps:**
- {{NEXT_STEP_1}}
- {{NEXT_STEP_2}}

---

### {{DATE_2}}
{{DAILY_LOG_2}}

---

## Phase Review

**Completed:** {{COMPLETION_DATE}}

### Accomplishments
- {{ACCOMPLISHMENT_1}}
- {{ACCOMPLISHMENT_2}}
- {{ACCOMPLISHMENT_3}}

### Incomplete Items
- {{INCOMPLETE_ITEM_1}}: {{REASON}}
- {{INCOMPLETE_ITEM_2}}: {{REASON}}

### Challenges Faced
1. {{CHALLENGE_1}}: {{DESCRIPTION}}
   - **Resolution:** {{RESOLUTION}}
2. {{CHALLENGE_2}}: {{DESCRIPTION}}
   - **Resolution:** {{RESOLUTION}}

### Lessons Learned
1. {{LESSON_1}}
2. {{LESSON_2}}
3. {{LESSON_3}}

### Recommendations for Next Phase
- {{RECOMMENDATION_1}}
- {{RECOMMENDATION_2}}
- {{RECOMMENDATION_3}}

---

## Final Metrics

**Phase {{PHASE_NUMBER}} - {{PHASE_NAME}} - Summary**

| Metric | Planned | Actual | Variance |
|--------|---------|--------|----------|
| Story Points | {{PLANNED_POINTS}} | {{ACTUAL_POINTS}} | {{VARIANCE}} |
| Stories Completed | {{PLANNED_STORIES}} | {{ACTUAL_STORIES}} | {{VARIANCE}} |
| Duration (weeks) | {{PLANNED_WEEKS}} | {{ACTUAL_WEEKS}} | {{VARIANCE}} |
| Tests Written | - | {{TESTS}} | - |
| Code Coverage | 80%+ | {{COVERAGE}}% | {{VARIANCE}} |
| Bugs Found | - | {{BUGS}} | - |
| Bugs Fixed | - | {{FIXED}} | - |
| Commits | - | {{COMMITS}} | - |

**Overall Phase Success:** {{SUCCESS_PERCENTAGE}}%

---

## Carry Over to Next Phase

### Items Moving to Phase {{NEXT_PHASE}}
- {{ITEM_1}}: {{REASON}}
- {{ITEM_2}}: {{REASON}}

### Newly Discovered Work
- {{NEW_WORK_1}}: {{DESCRIPTION}}
- {{NEW_WORK_2}}: {{DESCRIPTION}}

---

## Notes

{{ADDITIONAL_NOTES}}

---

**Created:** {{CREATION_DATE}}
**Last Updated:** {{UPDATE_DATE}}
**Phase Status:** {{STATUS}}
