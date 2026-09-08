# Bug Roadmap - Master Index

**Project:** {{PROJECT_NAME}}
**Last Updated:** {{DATE}}

**All bug reports must be in English only.**

---

## 📊 Summary

| Severity | Count | File |
|----------|-------|------|
| 🔴 Critical | {{CRITICAL_COUNT}} | [critical.md](critical.md) |
| 🟠 High | {{HIGH_COUNT}} | [high.md](high.md) |
| 🟡 Medium | {{MEDIUM_COUNT}} | [medium.md](medium.md) |
| 🟢 Low | {{LOW_COUNT}} | [low.md](low.md) |
| **Total Open** | **{{TOTAL_OPEN}}** | — |

**Max Bug ID:** {{MAX_BUG_ID}}

> `Max Bug ID` is the highest BUG-XXX assigned so far. `/add-bug` reads this to compute the
> next sequential ID without scanning every severity file. It is **never** decremented, even
> when bugs are archived or closed (IDs are immutable).

---

## 📁 Severity Files

Each open bug lives in exactly one severity file, routed by its severity at creation:

- 🔴 **[critical.md](critical.md)** — System unusable, data loss, security vulnerability
- 🟠 **[high.md](high.md)** — Major functionality broken, workaround exists
- 🟡 **[medium.md](medium.md)** — Minor functionality affected, easy workaround
- 🟢 **[low.md](low.md)** — Cosmetic issues, nice-to-have fixes

Fixed / closed bugs move to **[bug-archive.md](bug-archive.md)** (historical log).

> **If a single severity file exceeds 200 lines** (per `.claude/rules/documentation.md` §2.1),
> split it into numbered chunks (e.g. `high-1.md`, `high-2.md`) and link to all chunks here —
> same pattern as backlog sub-phase splits (`phase-2a` / `phase-2b`).

---

## 📝 Bug Entry Format

```markdown
### BUG-XXX: [Bug Title]

**Status:** New | Triaged | In Progress | Fixed | Verified | Closed
**Severity:** Critical | High | Medium | Low
**Reported:** YYYY-MM-DD
**Story Points:** [1, 2, 3, 5, 8, 13]
**Affected Component:** [Component/File path]
**Assigned to Phase:** [Phase N or "Backlog"]

**Description:**
[Brief description of the bug]

**Reproduction Steps:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Additional Notes:**
[Any additional context, screenshots, logs, etc.]
```

---

## 🎯 Quick Navigation

**Want to...**
- Add a new bug → Use `/add-bug` (routes to the correct severity file + updates this index)
- Fix a bug → Use `/execute-work bug BUG-XXX`
- See all High bugs → [high.md](high.md)
- Check bug stats → Use `/project-status`

---

**Related:**
- [Project Scope](../../input/scope.md)
- [Current Status](../progress/DASHBOARD.md)

---

**Last Updated:** {{DATE}}
