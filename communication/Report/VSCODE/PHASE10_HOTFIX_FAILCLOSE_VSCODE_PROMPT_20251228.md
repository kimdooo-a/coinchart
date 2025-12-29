# Phase 10 Hotfix: Fail-Close Gate Prompt (VSCODE)

**Date**: 2025-12-28
**Executor**: VSCODE (Antigravity)
**Reason**: Strict Governance Enforcement

## Request
Change Quality Gate from "Fail-Open" to "Fail-Close".
- If previous release exists but has NO `release_kpi.json` -> FAIL.
- If `release_kpi.json` status is not SUCCESS -> FAIL.
- Remove bypass instructions from logs.
- Detect ROLLBACK status in collector.

## Execution Plan
1. Refactor `scripts/release_quality_gate.ts` to strict mode.
2. Refactor `scripts/collect_kpi.ts` to infer ROLLBACK.
3. Update `docs/DEPLOYMENT_RUNBOOK.md`.
