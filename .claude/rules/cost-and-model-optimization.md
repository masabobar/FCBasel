# Cost & Model Optimization — Sub-Agent Tiering, Prompt Caching, Read-Only Fan-Out

**Version:** 1.0
**Last Updated:** 2026-06-01
**Status:** Active

**Trigger (conditional rule):** read this when **dispatching sub-agents** (the `Agent` tool) or **authoring/ running a scan / audit / status command** that reads across many files. It governs *which model* runs *which kind of work*, how to keep the rules + `CLAUDE.md` warm in the prompt cache, and when a read-only command may fan out into parallel agents.

**Why:** every `/execute-work` story already runs in a fresh sub-agent (continuous mode). That sub-agent does both *reasoning* work (writing code, judging security) and *mechanical* work (running the test suite, running `npm audit`). The mechanical parts don't need a frontier model, the rule files are re-read on every dispatch (cacheable), and read-only scans can run in parallel. None of this is wired today — this rule documents the safe, high-ROI optimizations so the orchestrator applies them consistently.

---

## 1. The governing principle — mechanical vs reasoning (NOT easy vs hard)

The split that decides the model tier is **deterministic/mechanical vs reasoning** — *not* "easy vs hard". Debugging a flaky test is hard reasoning and stays on the strong model. Running the test suite is mechanical and can drop to the cheap model.

> **Hard rule:** if the step **decides** something (what code to write, whether a failing test is a real bug, whether a fired security trigger is actually covered, how to structure a backlog), it is **reasoning**. If it **executes a fixed command and reports the result** (run tests, run `npm audit`, run `audit-pm.sh`, count files, aggregate grep output), it is **mechanical**.

| Work | Tier | Model |
|---|---|---|
| Implement code · fix bugs · debug failing tests · security **judgement** · architecture · write docs / backlog / stories | **Reasoning** | **Opus** (session default) |
| Run test suite · run `npm`/`pnpm audit` · run `audit-pm.sh` · collect file/grep counts · mechanical status aggregation | **Deterministic** | **Haiku** |
| Broad read-only code search / inventory across many files | **Read-only fan-out** | **Haiku** (Explore agents, §4) |

Never tier-down a step that decides. Never pay frontier rates for a step that only runs a command.

---

## 2. Model-tiering for sub-agents

Model selection is **per sub-agent**, not per command. Two mechanisms:

- **Per-dispatch:** pass `model: "haiku"` (or `sonnet` / `opus`) on the `Agent` tool call.
- **Per-agent-definition:** set `model:` in an agent's frontmatter.

### 2.1 The `/execute-work` boundary

- The **story / bug sub-agent** (continuous mode) runs on the **default model (Opus)** — it writes code and makes security judgements. This is reasoning; **do NOT tier it down.**
- Inside that sub-agent, the **mechanical command-runs** — STEP 7 test suite, the `npm/pnpm audit` invocation in STEP 6.5 — MAY be delegated to a **Haiku helper** sub-agent that runs the command and returns pass/fail + output. The **default is to run them in-agent** (simplicity first — see §5).
- The **security *judgement*** (is each fired trigger covered? per `security-review.md`) stays with the reasoning agent. Only the `audit` / test *command execution* is mechanical.
- **Gate semantics never change** under tiering: forced final test step, security triage, coverage ≥ 80%, all API status codes — identical whether the command ran in-agent or in a Haiku helper.

### 2.2 Anti-pattern

❌ Tiering the whole story sub-agent down to Haiku "to save money." It writes code and judges security — that is reasoning. A cheaper model there produces worse code, not cheaper code. The saving comes from the *mechanical sub-steps*, never the implementation itself.

---

## 3. Prompt caching — keep the rules + `CLAUDE.md` warm

The rule files and `CLAUDE.md` are re-read on **every** dispatch and **every** command. Re-reading the same bytes is ~0.1× cost when served from the prompt cache versus full price uncached. The cache is a **prefix match with a 5-minute TTL**: any byte change before a point invalidates everything after it.

**Practical guidance (this is doc/structure guidance, NOT an API integration — do not over-engineer):**

- **Read stable content early, in a stable order.** The rules + `CLAUDE.md` are the stable prefix. Read them at the *start* of a dispatch / command, in the *same order* every time, so back-to-back dispatches in one `/execute-work` run reuse the warm prefix.
- **Never interleave volatile content before the stable prefix.** Per-story IDs, timestamps, `git diff` output, file paths-of-the-moment go *after* the rules are read — not mixed into the early context that should stay byte-identical across dispatches.
- **Don't reorder the conditional reading list per story.** The continuous-mode reading list (`execute-work-implementation-continuous.md` STEP 1) is already ordered always-load → conditional; keep that order fixed so the always-load block stays cacheable across units.
- **Within a 5-min run, the win is automatic** if the order is stable: each successive story dispatch re-reads the same rule prefix from cache. Long idle gaps (> 5 min) drop the cache — expected, not a bug.

The point is *how commands structure their reads*, not new code. Stable order + stable prefix = the saving falls out for free.

---

## 4. Parallel read-only fan-out

When a command **only reads** (no writes), it can dispatch **up to ~3 Explore agents in parallel** — single message, multiple `Agent` calls — each with a **disjoint search focus**, each on **Haiku**. The main agent aggregates and makes the judgement; the fan-out only gathers.

**Safe because there are no writes** → no merge conflicts, no race conditions. This is the *only* kind of parallelism this framework endorses.

**Eligible (read-only) commands:**
- `/adopt-project` STEP 1 — codebase scan (stack / type / structure / feature inventory).
- `/security-scan --all` — whole-repo file collection for the OWASP triage (the *judgement* still aggregates in the main agent).
- `/project-status` — data collection (counts, grep aggregation).
- `/audit-pm` — mechanical scans (already a script; fan-out only if extended with agent-side reads).

**Fan-out discipline:** give each agent a non-overlapping scope ("agent 1: backend routes + models; agent 2: frontend screens + components; agent 3: tests + config"). Read excerpts, return conclusions — not whole-file dumps. Cap at 3.

### 4.1 Explicit NON-use

❌ **Never fan out work that writes files in parallel.** Two agents editing the repo concurrently produce merge/clobber conflicts. Parallel *implementation* requires git-worktree isolation and is **out of scope** for this framework — `/execute-work` stays sequential (one story sub-agent at a time). Fan-out is for **reads only**.

---

## 5. Anti-Patterns (quick reference)

| ❌ | Why it breaks | ✅ |
|---|---|---|
| Story sub-agent on Haiku | It writes code + judges security (reasoning) | Opus for the story; Haiku only for its mechanical command-runs |
| Tier by "easy vs hard" | Hard debugging would wrongly drop to Haiku | Tier by mechanical (command) vs reasoning (decision) |
| Adding a Haiku helper for a 3-test suite | Dispatch overhead > the saving; helper can itself fail | Default to in-agent; delegate only when the mechanical run is substantial |
| Injecting per-story IDs / timestamps into early context | Invalidates the cached rule prefix every dispatch | Read rules first, in stable order; volatile data after |
| Reordering the rule reading list per story | Cache miss on the always-load block | Keep the always-load → conditional order fixed |
| Parallel agents that each edit files | Merge / clobber conflicts | Fan out **reads only**; writes stay sequential |
| Fanning out > 3 agents | Coordination + token overhead | Cap at 3, disjoint scopes |

---

## 6. Related

- `commands/modules/execute-work-implementation-continuous.md` — sub-agent dispatch (where §2 tiering applies)
- `commands/modules/execute-work-quality-gates.md` — the gates whose *execution* is mechanical but whose *judgement* is reasoning
- `.claude/rules/security-review.md` — security **judgement** stays on the reasoning tier (never delegated to a mechanical helper)
- `.claude/rules/testing.md` — the forced test step is the canonical mechanical command-run
- `commands/adopt-project.md` / `commands/modules/adopt-project-scan.md` — read-only scan, fan-out per §4
- `commands/security-scan.md` — `--all` collection, fan-out per §4
- `commands/modules/project-status-data-collection.md` — mechanical data collection, fan-out per §4

---

**Status:** ✅ Active
