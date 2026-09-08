# Future Backlog Template

**Use this template when adding future requirements via `/add-backlog-requirement --from file.md`**

**All requirements must be in English only.**

---

## Story Template

```markdown
### US: {{STORY_TITLE}}

**Target Version:** {{2.0 | 3.0 | Unversioned}}
**Priority:** {{High | Medium | Low}}
**Story Points:** {{1, 2, 3, 5, 8, 13}} (optional - will estimate if not provided)
**Epic:** {{Epic name}} (optional)

**Description:**
{{As a [user type], I want [goal] so that [benefit]}}

**Acceptance Criteria:**
- [ ] {{Criterion 1}}
- [ ] {{Criterion 2}}
- [ ] {{Criterion 3}}

**Definition of Done:**
- [ ] Implementation complete
- [ ] Tests written and passing (80%+ coverage)
- [ ] Documentation updated
- [ ] Code reviewed

**Notes:** (optional)
{{Any additional context, technical considerations, dependencies}}
```

---

## Epic Template

```markdown
### Epic: {{EPIC_NAME}}

**Target Version:** {{2.0 | 3.0 | Unversioned}}
**Priority:** {{High | Medium | Low}}

**Goal:**
{{What this epic achieves - the big picture}}

**User Stories:** (list individual stories below)
- {{Story 1 title}}
- {{Story 2 title}}
- {{Story 3 title}}

**Business Value:**
{{Why this epic matters to users/business}}

**Technical Considerations:**
{{Architecture changes, dependencies, risks}}

**Notes:** (optional)
{{Strategic context, timeline thoughts, research needed}}
```

---

## Example: Story

```markdown
### US: Advanced search with filters

**Target Version:** 2.0
**Priority:** High
**Story Points:** 8
**Epic:** Enhanced Search

**Description:**
As a user, I want to filter search results by date, category, and tags so that I can find specific items more quickly.

**Acceptance Criteria:**
- [ ] Add filter panel to search page
- [ ] Filters: date range, category dropdown, tag checkboxes
- [ ] Apply filters without page reload (AJAX)
- [ ] Show filter count badges
- [ ] Persist filters in URL query params
- [ ] Clear all filters button

**Definition of Done:**
- [ ] Implementation complete
- [ ] Unit tests for filter logic
- [ ] E2E tests for filter interactions
- [ ] Documentation updated
- [ ] Performance tested with 10k+ items

**Notes:**
Depends on search index optimization (US-045).
Consider using Elasticsearch for better performance.
```

---

## Example: Epic

```markdown
### Epic: Mobile App Launch

**Target Version:** 3.0
**Priority:** Medium

**Goal:**
Launch native mobile apps (iOS and Android) with core features from web version.

**User Stories:**
- Mobile authentication (biometric login)
- Offline mode with sync
- Push notifications
- Mobile-optimized UI
- Camera integration for uploads

**Business Value:**
Expand user base to mobile-first users. Estimated 40% of potential users prefer mobile.

**Technical Considerations:**
- Choose framework: React Native vs Flutter vs Native
- API modifications for mobile-specific endpoints
- Mobile CI/CD pipeline
- App store deployment process
- Mobile analytics integration

**Notes:**
Major undertaking - needs dedicated 3-4 month timeline.
Research phase required before committing to version 3.0.
```
