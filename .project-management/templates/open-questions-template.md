# Open Clarification Questions

**Version:** 1.0
**Last Updated:** {{TIMESTAMP}}
**Status:** Active

Tracks clarification questions skipped during interactive Q&A flows (`/process-client-docs`, `/init-project`, `/add-scope`, …). Resolve via `/resolve-questions` or by answering directly in this file.

---

## Summary

**Total Open:** 0
**P0 (Blocker):** 0  •  **P1 (Important):** 0  •  **P2 (Nice-to-know):** 0

---

## Open Questions

*No open questions.*

---

## Question Format

When questions are skipped, they are appended here with the format below.

### Q-001: {{SHORT_TITLE}}

**Status:** Open
**Priority:** P0 (Blocker) | P1 (Important) | P2 (Nice-to-know)
**Category:** {{authentication | scope | tech-stack | timeline | budget | compliance | …}}
**Asked During:** {{command_name}} on {{YYYY-MM-DD}}
**Skipped:** {{YYYY-MM-DD}} ({{skip_count}}× skipped)

**Question:**
{{full_question_text}}

**Default Recommendation:**
{{recommended_fallback}}

**Impact if Unresolved:**
{{what_breaks_or_remains_unknown — reference affected stories / phases / files}}

**Options Presented:**
- {{option_1_label}} — {{option_1_description}}
- {{option_2_label}} — {{option_2_description}}
- {{option_3_label}} — {{option_3_description}}
- Other (free-text) — user-provided answer, anonymized before storage

**Notes:**
{{additional_context_or_extracted_quote_anonymized}}

---

## Resolved Questions

*No resolved questions yet.*

---

## Resolution Format

When `/resolve-questions` answers a question, it moves here with:

### ✅ Q-001: {{SHORT_TITLE}} (RESOLVED)

**Resolved:** {{YYYY-MM-DD}}
**Answer:** {{chosen_option_label_or_anonymized_free_text}}
**Applied to:** {{file_paths_updated}}
**Notes:** {{any_caveats_or_user_provided_context_anonymized}}

---

## Priority Definitions

- **P0 (Blocker)** — Cannot finalize current phase planning without an answer. Affects estimates, architecture, or scope of work already in flight.
- **P1 (Important)** — Affects an upcoming phase. Required before that phase starts; safe to defer until then.
- **P2 (Nice-to-know)** — Improves accuracy of artefacts but no immediate blocker. Resolve when convenient.

---

## Anonymization

User-typed free-text answers are passed through `.claude/rules/anonymization.md` §3–4 (role-label substitution + source-context phrasing) before being written here. Pre-defined option labels are committed verbatim. Never store personal names, emails, or contact details in this file.

---

**Auto-managed** | Created on first skipped question | Updated by `/process-client-docs`, `/resolve-questions`, and other PM commands invoking `modules/interactive-clarifications.md`
