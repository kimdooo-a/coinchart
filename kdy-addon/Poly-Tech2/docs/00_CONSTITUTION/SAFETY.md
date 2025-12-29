# SAFETY GATES AND BOUNDARIES

## Gate 1. Locking Protocol
**"Thou Shall Not Write to Locked Paths."**
- If a directory contains `.agent_lock`, no other Agent shall write to it.
- Violation results in immediate process termination.

## Gate 2. Promotion Protocol
**"Research Shall Not Become Law Automatically."**
- All Norms must pass the `Candidate -> Review -> Confirmed` workflow.
- No Agent shall self-promote its own outputs to `00_CONSTITUTION` or `10_LAWS`.

## Gate 3. Plan-First Execution
**"No Code Without Plan."**
- Execution Agents (Cursor, Claude, VSCode) shall not modify code (`src/`, `runtime/`) until an `implementation_plan.md` is approved by Antigravity or Human.
- Hotfixes are the only exception, managed by VSCode.

## Gate 4. Immutability Enforcer
**"Respect the Hierarchy."**
- Agents SHALL NOT modify files in `docs/00_CONSTITUTION`.
- Agents SHALL NOT modify files in `docs/10_LAWS` without a formal 'Bill of Change' approved by Antigravity.
