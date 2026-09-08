# Phase {{PHASE_NUMBER}}: {{PHASE_NAME}} - Progress Tracking

**Last Updated:** {{TIMESTAMP}} (Auto-updated by /execute-work)
**Status:** {{STATUS}}
**Progress:** {{COMPLETED_POINTS}}/{{TOTAL_POINTS}} story points ({{PERCENTAGE}}%)

---

## Overview

| Metric | Value |
|--------|-------|
| **Phase Status** | {{STATUS}} |
| **Started** | {{START_DATE}} |
| **Target Completion** | {{TARGET_DATE}} |
| **Days Elapsed** | {{DAYS_ELAPSED}} |
| **Days Remaining** | {{DAYS_REMAINING}} |
| **Completion Rate** | {{PERCENTAGE}}% |

---

## Story Points Breakdown

```
Total Points:     {{TOTAL_POINTS}}
Completed:        {{COMPLETED_POINTS}} ({{COMPLETED_PERCENTAGE}}%)
In Progress:      {{IN_PROGRESS_POINTS}} ({{IN_PROGRESS_PERCENTAGE}}%)
Blocked:          {{BLOCKED_POINTS}} ({{BLOCKED_PERCENTAGE}}%)
Todo:             {{TODO_POINTS}} ({{TODO_PERCENTAGE}}%)
```

**Progress Bar:**
```
[████████████░░░░░░░░] {{PERCENTAGE}}%
```

---

## Epics Progress

### Epic {{EPIC_ID_1}}: {{EPIC_NAME_1}}
- **Status:** {{STATUS}}
- **Progress:** {{COMPLETED}}/{{TOTAL}} stories ({{PERCENTAGE}}%)
- **Story Points:** {{COMPLETED_POINTS}}/{{TOTAL_POINTS}}
- **Started:** {{START_DATE}}
- **Completed:** {{COMPLETION_DATE}}

### Epic {{EPIC_ID_2}}: {{EPIC_NAME_2}}
- **Status:** {{STATUS}}
- **Progress:** {{COMPLETED}}/{{TOTAL}} stories ({{PERCENTAGE}}%)
- **Story Points:** {{COMPLETED_POINTS}}/{{TOTAL_POINTS}}
- **Started:** {{START_DATE}}
- **Estimated Completion:** {{EST_DATE}}

---

## Completed Stories ✅

### {{DATE_1}}

#### US-{{STORY_ID_1}}: {{STORY_TITLE_1}} ✅
- **Story Points:** {{POINTS}}
- **Epic:** {{EPIC_NAME}}
- **Completed:** {{TIMESTAMP}}
- **Tests:** {{TESTS_PASSED}}/{{TESTS_TOTAL}} passing
- **Coverage:** {{COVERAGE}}%
- **Commit:** [`{{COMMIT_SHORT}}`] {{COMMIT_MESSAGE}}
- **Duration:** {{HOURS}} hours

**Acceptance Criteria Met:**
- [x] {{CRITERIA_1}}
- [x] {{CRITERIA_2}}
- [x] {{CRITERIA_3}}

**Technical Achievements:**
- {{ACHIEVEMENT_1}}
- {{ACHIEVEMENT_2}}

---

#### US-{{STORY_ID_2}}: {{STORY_TITLE_2}} ✅
{{STORY_2_DETAILS}}

---

### {{DATE_2}}
{{MORE_COMPLETED_STORIES}}

---

## In Progress Stories 🔄

### US-{{STORY_ID_X}}: {{STORY_TITLE_X}} 🔄
- **Story Points:** {{POINTS}}
- **Epic:** {{EPIC_NAME}}
- **Started:** {{START_DATE}}
- **Progress:** {{TASK_PROGRESS}} ({{COMPLETED_TASKS}}/{{TOTAL_TASKS}} tasks)
- **Estimated Completion:** {{EST_DATE}}

**Current Task:**
- {{CURRENT_TASK_DESCRIPTION}}

**Completed Tasks:**
- [x] {{TASK_1}}
- [x] {{TASK_2}}

**Remaining Tasks:**
- [ ] {{TASK_3}}
- [ ] {{TASK_4}}

---

## Blocked Stories ⚠️

### US-{{STORY_ID_Y}}: {{STORY_TITLE_Y}} ⚠️
- **Story Points:** {{POINTS}}
- **Epic:** {{EPIC_NAME}}
- **Blocked Since:** {{BLOCKED_DATE}}
- **Blocker:** {{BLOCKER_DESCRIPTION}}
- **Impact:** High / Medium / Low
- **Resolution Plan:** {{RESOLUTION_PLAN}}
- **Owner:** {{OWNER}}
- **Target Resolution:** {{TARGET_DATE}}

---

## Upcoming Stories (Next 5) ⏳

### US-{{STORY_ID_Z}}: {{STORY_TITLE_Z}} ⏳
- **Story Points:** {{POINTS}}
- **Epic:** {{EPIC_NAME}}
- **Priority:** P0 / P1 / P2
- **Dependencies:** {{DEPENDENCIES}}
- **Estimated Start:** {{EST_START_DATE}}

---

## Testing Metrics

### Test Coverage
```
Overall Coverage:    {{COVERAGE}}%
Unit Tests:          {{UNIT_COVERAGE}}%
Integration Tests:   {{INTEGRATION_COVERAGE}}%
E2E Tests:           {{E2E_COVERAGE}}%
```

### Test Results
| Type | Passing | Failing | Skipped | Total |
|------|---------|---------|---------|-------|
| **Unit** | {{UNIT_PASS}} | {{UNIT_FAIL}} | {{UNIT_SKIP}} | {{UNIT_TOTAL}} |
| **Integration** | {{INT_PASS}} | {{INT_FAIL}} | {{INT_SKIP}} | {{INT_TOTAL}} |
| **E2E** | {{E2E_PASS}} | {{E2E_FAIL}} | {{E2E_SKIP}} | {{E2E_TOTAL}} |
| **TOTAL** | {{TOTAL_PASS}} | {{TOTAL_FAIL}} | {{TOTAL_SKIP}} | {{TOTAL_TESTS}} |

**Status:** {{TEST_STATUS}}

**Recent Test Additions:**
- {{TEST_FILE_1}}: {{TEST_COUNT_1}} tests added
- {{TEST_FILE_2}}: {{TEST_COUNT_2}} tests added

---

## Code Quality Metrics

### Linting
- **Errors:** {{LINT_ERRORS}}
- **Warnings:** {{LINT_WARNINGS}}
- **Status:** {{LINT_STATUS}}

### Type Coverage (TypeScript)
- **Coverage:** {{TYPE_COVERAGE}}%
- **Any Types:** {{ANY_COUNT}}
- **Status:** {{TYPE_STATUS}}

### SOLID & DRY Compliance
- **Status:** {{COMPLIANCE_STATUS}}
- **Recent Refactorings:** {{REFACTORING_COUNT}}

---

## Git Activity

### Commits This Phase
- **Total Commits:** {{COMMIT_COUNT}}
- **Average Commits/Day:** {{AVG_COMMITS}}
- **Last Commit:** {{LAST_COMMIT_DATE}}

### Recent Commits
```
{{COMMIT_SHORT_1}} - {{COMMIT_MESSAGE_1}}
{{COMMIT_SHORT_2}} - {{COMMIT_MESSAGE_2}}
{{COMMIT_SHORT_3}} - {{COMMIT_MESSAGE_3}}
```

---

## Velocity Tracking

### Current Phase Velocity
- **Planned Velocity:** {{PLANNED_VELOCITY}} points/week
- **Actual Velocity:** {{ACTUAL_VELOCITY}} points/week
- **Variance:** {{VARIANCE}}%

### Historical Velocity
| Week | Planned | Actual | Variance | Notes |
|------|---------|--------|----------|-------|
| Week 1 | {{PLAN_1}} | {{ACTUAL_1}} | {{VAR_1}}% | {{NOTES_1}} |
| Week 2 | {{PLAN_2}} | {{ACTUAL_2}} | {{VAR_2}}% | {{NOTES_2}} |
| Week 3 | {{PLAN_3}} | {{ACTUAL_3}} | {{VAR_3}}% | {{NOTES_3}} |
| Week 4 | {{PLAN_4}} | {{ACTUAL_4}} | {{VAR_4}}% | {{NOTES_4}} |

**Trend:** {{TREND}} (Increasing / Stable / Decreasing)

---

## Burndown Chart Data

| Day | Date | Planned Remaining | Actual Remaining | Completed Today |
|-----|------|------------------|------------------|-----------------|
| 1 | {{DATE_1}} | {{TOTAL_POINTS}} | {{TOTAL_POINTS}} | 0 |
| 2 | {{DATE_2}} | {{REMAINING_2}} | {{ACTUAL_2}} | {{COMPLETED_2}} |
| 3 | {{DATE_3}} | {{REMAINING_3}} | {{ACTUAL_3}} | {{COMPLETED_3}} |
| ... | ... | ... | ... | ... |

---

## Time Tracking

### Time Spent This Phase
- **Total Hours:** {{TOTAL_HOURS}}
- **Average Hours/Day:** {{AVG_HOURS}}
- **Estimated Hours Remaining:** {{EST_REMAINING}}

### Time Breakdown by Activity
| Activity | Hours | Percentage |
|----------|-------|------------|
| Implementation | {{IMPL_HOURS}} | {{IMPL_PCT}}% |
| Testing | {{TEST_HOURS}} | {{TEST_PCT}}% |
| Bug Fixing | {{BUG_HOURS}} | {{BUG_PCT}}% |
| Documentation | {{DOC_HOURS}} | {{DOC_PCT}}% |
| Planning | {{PLAN_HOURS}} | {{PLAN_PCT}}% |
| Other | {{OTHER_HOURS}} | {{OTHER_PCT}}% |

---

## Issues & Blockers

### Active Blockers
1. **{{BLOCKER_1}}**
   - Impact: High / Medium / Low
   - Since: {{DATE}}
   - Owner: {{OWNER}}
   - Resolution: {{PLAN}}

2. **{{BLOCKER_2}}**
   {{BLOCKER_2_DETAILS}}

### Resolved Issues This Phase
- {{RESOLVED_1}}: {{RESOLUTION_DATE}}
- {{RESOLVED_2}}: {{RESOLUTION_DATE}}

---

## Technical Debt

### Debt Introduced This Phase
- {{DEBT_1}}: {{DESCRIPTION}} (Priority: {{PRIORITY}})
- {{DEBT_2}}: {{DESCRIPTION}} (Priority: {{PRIORITY}})

### Debt Resolved This Phase
- {{RESOLVED_DEBT_1}}: {{DESCRIPTION}}
- {{RESOLVED_DEBT_2}}: {{DESCRIPTION}}

**Net Technical Debt:** {{NET_DEBT}} (Positive = Reduced, Negative = Increased)

---

## Documentation Updates

### Updated Documents
- {{DOC_1}}: {{UPDATE_DATE}} - {{CHANGES}}
- {{DOC_2}}: {{UPDATE_DATE}} - {{CHANGES}}

### Documents Needing Update
- [ ] {{PENDING_DOC_1}}
- [ ] {{PENDING_DOC_2}}

---

## Risks & Issues

### New Risks Identified
1. **{{RISK_1}}**
   - Probability: High / Medium / Low
   - Impact: High / Medium / Low
   - Mitigation: {{MITIGATION}}

### Risk Status Updates
- {{RISK_X}}: Status changed from {{OLD_STATUS}} to {{NEW_STATUS}}

---

## Next Steps

### Immediate (Next 3 Days)
1. {{NEXT_STEP_1}}
2. {{NEXT_STEP_2}}
3. {{NEXT_STEP_3}}

### Short Term (Next Week)
1. {{SHORT_TERM_1}}
2. {{SHORT_TERM_2}}

### Medium Term (Next 2 Weeks)
1. {{MEDIUM_TERM_1}}
2. {{MEDIUM_TERM_2}}

---

## Phase Forecast

### Projected Completion Date
**Current Projection:** {{PROJECTED_DATE}}
**Original Target:** {{TARGET_DATE}}
**Variance:** {{VARIANCE}} days ({{AHEAD_BEHIND}})

### Confidence Level
**Confidence:** {{CONFIDENCE}}% (High / Medium / Low)

**Factors:**
- Velocity stability: {{VELOCITY_STABILITY}}
- Blocker count: {{BLOCKER_COUNT}}
- Team availability: {{AVAILABILITY}}%
- Technical risk: {{RISK_LEVEL}}

---

## Notes

{{ADDITIONAL_NOTES}}

---

**Auto-Generated By:** /execute-work command
**Generation Time:** {{TIMESTAMP}}
**Next Update:** After next story completion
