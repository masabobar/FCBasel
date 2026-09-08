# Project Templates

**Purpose:** Reusable templates for project management files

**Last Updated:** 2026-04-20

---

## 📁 Available Templates

### Backlog Templates

| Template | Purpose | Used By | Size |
|----------|---------|---------|------|
| **backlog-readme-template.md** | Master backlog index with statistics | `/migrate-to-modular`, `/init-project` | ~100 lines |
| **phase-backlog-template.md** | Phase-specific backlog file | `/migrate-to-modular`, `/add-scope` | ~150 lines |
| **backlog-future-template.md** | Post-launch features backlog | `/add-backlog-requirement` | ~100 lines |

### Progress Tracking Templates

| Template | Purpose | Used By | Size |
|----------|---------|---------|------|
| **dashboard-template.md** | Live auto-updating project dashboard | `/migrate-to-modular`, `/init-project` | ~100 lines |
| **daily-summary-template.md** | Daily work log and summary | `/execute-work` (auto-updates) | ~60 lines |
| **weekly-report-template.md** | Weekly progress report | `/execute-work` (weekly) | ~80 lines |
| **current-status-template.md** | Detailed status breakdown | `/project-status` | ~90 lines |
| **completed-template.md** | Completed work log (append-only) | `/execute-work` (auto-updates) | ~50 lines |
| **blockers-template.md** | Active blocker tracking | Manual + `/execute-work` | ~100 lines |

### Phase & Planning Templates

| Template | Purpose | Used By | Size |
|----------|---------|---------|------|
| **phase-template.md** | Phase execution file | `/init-project`, `/add-scope` | ~200 lines |
| **phase-progress-template.md** | Phase progress tracking | `/execute-work` | ~250 lines |

### Documentation Templates

| Template | Purpose | Used By | Size |
|----------|---------|---------|------|
| **prd-template.md** | Product Requirements Document | `/generate-docs` | ~150 lines |
| **technical-spec-template.md** | Technical Specification | `/generate-docs` | ~200 lines |
| **architecture-template.md** | Architecture Documentation | `/generate-docs` | ~250 lines |
| **technical-plan-template.md** | Implementation plan | `/execute-work` (plan mode) | ~150 lines |

### Bug Tracking Templates

| Template | Purpose | Used By | Size |
|----------|---------|---------|------|
| **bug-template.md** | Bug report format (for `--from file.md`) | `/add-bug` | ~60 lines |
| **bugs-readme-template.md** | Bug roadmap master index (severity counts + max ID + links) | `/add-bug`, `/migrate-bugs-to-modular`, `/init-project` | ~90 lines |
| **bug-severity-template.md** | Per-severity bug file (critical/high/medium/low) | `/add-bug`, `/migrate-bugs-to-modular`, `/init-project` | ~30 lines |

---

## 🎯 Usage

### For Commands

Commands automatically use templates when creating files:

```bash
# Uses templates internally:
/migrate-to-modular          # Uses: backlog-readme, phase-backlog, dashboard, progress templates
/init-project                # Uses: all templates to set up project structure
/add-scope add phase 1       # Uses: phase-template
/execute-work story US-001   # Auto-updates: daily-summary, completed, dashboard
```

### For Manual Setup

Copy template and replace placeholders:

```bash
# Copy template
cp templates/daily-summary-template.md output/progress/daily-summary.md

# Replace placeholders manually or with script
sed -i 's/{{PROJECT_NAME}}/My Project/g' output/progress/daily-summary.md
sed -i 's/{{TODAY_DATE}}/2026-04-20/g' output/progress/daily-summary.md
```

---

## 🔧 Template Placeholders

### Common Placeholders

```
{{PROJECT_NAME}}         - Project name from scope.md
{{TIMESTAMP}}            - Current date and time (YYYY-MM-DD HH:MM)
{{TODAY_DATE}}           - Today's date (YYYY-MM-DD)
{{YEAR}}                 - Current year

{{PHASE_NUMBER}}         - Current phase number (1, 2, 3, 4)
{{PHASE_NAME}}           - Current phase name
{{PHASE_GOAL}}           - Phase objective
{{PHASE_DURATION}}       - Estimated duration

{{TOTAL_STORIES}}        - Total story count
{{TOTAL_POINTS}}         - Total story points
{{COMPLETED_STORIES}}    - Completed story count
{{COMPLETED_POINTS}}     - Completed points

{{OVERALL_PCT}}          - Overall progress percentage
{{PHASE_PCT}}            - Current phase progress percentage

{{STORY_ID}}             - Story ID (US-XXX)
{{STORY_TITLE}}          - Story title
{{STORY_POINTS}}         - Story points

{{EPIC_NAME}}            - Epic name
{{EPIC_POINTS}}          - Epic total points
```

### Date/Time Placeholders

```
{{DAY_OF_WEEK}}          - Monday, Tuesday, etc.
{{WEEK_START}}           - Start of week (YYYY-MM-DD)
{{WEEK_END}}             - End of week (YYYY-MM-DD)
{{WEEK_NUMBER}}          - Week number in project
```

### Status Placeholders

```
{{OVERALL_STATUS}}       - 🟢 On Track | 🟡 At Risk | 🔴 Off Track
{{PHASE_STATUS}}         - 🔄 Active | ✅ Complete | ⏸️ Pending
{{TEST_STATUS}}          - 🟢 Pass | 🟡 Warning | 🔴 Fail
```

---

## 📝 Template Structure Guidelines

**All templates should:**
- Use clear section headers with emojis
- Include `{{PLACEHOLDER}}` syntax (double curly braces)
- Have consistent formatting (Markdown)
- Be under 250 lines for readability
- Include usage notes at bottom
- Support English-only content

**Section order:**
1. Title (# Header)
2. Metadata (date, updated, status)
3. Summary section (key metrics)
4. Detailed sections
5. Format/usage notes
6. Auto-generation note (if applicable)

---

## 🔄 Auto-Updating Templates

Some files auto-update during command execution:

| File | Auto-Updates When | Update Trigger |
|------|-------------------|----------------|
| **DASHBOARD.md** | During `/execute-work` | Story start, test run, story complete, phase complete |
| **daily-summary.md** | During `/execute-work` | Story complete |
| **completed.md** | During `/execute-work` | Story complete (append) |
| **weekly-report.md** | End of week (Friday) | `/execute-work` completion |

---

## 📚 Related Documentation

**Command Documentation:**
- `commands/migrate-to-modular.md` - Migration command
- `commands/init-project.md` - Project initialization
- `commands/execute-work.md` - Work execution

**Module Documentation:**
- `commands/modules/backlog-organization.md` - Backlog structure
- `commands/modules/live-progress-dashboard.md` - Dashboard auto-updates
- `commands/modules/execute-work-dashboard-events.md` + `execute-work-dashboard-mechanics.md` - Auto-update logic (split)

**Guides:**
- `.project-management/guides/MODULAR-STRUCTURE-GUIDE.md` - User guide

---

## ✅ Status

**Created:** 2026-04-20
**Maintained:** Yes
**Version:** 3.7.3

**Template Coverage:**
- ✅ Backlog templates (3)
- ✅ Progress tracking templates (6)
- ✅ Phase templates (2)
- ✅ Documentation templates (4)
- ✅ Bug tracking templates (3)

**Total Templates:** 18
