# {{SEVERITY_EMOJI}} {{SEVERITY}} Priority Bugs

**Severity:** {{SEVERITY_DESCRIPTION}}

**Index:** [README.md](README.md) · **Archive:** [bug-archive.md](bug-archive.md)

**All bug reports must be in English only.**

---

{{BUG_ENTRIES}}

_(No {{SEVERITY_LOWER}} bugs)_

---

**Last Updated:** {{DATE}}

<!--
USAGE NOTE — this single template renders four files (critical.md / high.md / medium.md / low.md).
Substitute per severity:

| File        | {{SEVERITY}} | {{SEVERITY_EMOJI}} | {{SEVERITY_LOWER}} | {{SEVERITY_DESCRIPTION}}                              |
|-------------|--------------|--------------------|--------------------|-------------------------------------------------------|
| critical.md | Critical     | 🔴                 | critical           | System unusable, data loss, security vulnerability    |
| high.md     | High         | 🟠                 | high               | Major functionality broken, workaround exists         |
| medium.md   | Medium       | 🟡                 | medium             | Minor functionality affected, easy workaround         |
| low.md      | Low          | 🟢                 | low                | Cosmetic issues, nice-to-have fixes                   |

- {{BUG_ENTRIES}}: bug entries for this severity (one per `### BUG-XXX` block). Empty in the
  scaffolded/empty state — then ONLY the `_(No <severity> bugs)_` placeholder shows.
- When the FIRST bug is added to an empty file, replace the `_(No <severity> bugs)_` line with
  the bug entry. Subsequent bugs append after the last entry.
-->

