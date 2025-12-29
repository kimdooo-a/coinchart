# Phase 10 KPI & Gates Prompt (VSCODE)

**Date**: 2025-12-28
**Executor**: VSCODE (Antigravity)

## Request
Goal: Implement KPI Capture + Quality Gate.
- Store KPI snapshot as release artifact.
- Implement Quality Gate: Next release fails if previous release failed.
- Do NOT modify Phase 8/9 logic except to read outputs.

## Execution Plan
1. Scripts:
   - `scripts/collect_kpi.ts`: Reader/Writer for KPI JSON.
   - `scripts/release_quality_gate.ts`: Logic to check previous release.
2. Integration:
   - `release-observe.yml`: Upload KPI.
   - `release-validate.yml`: Run Gate check.
3. Docs:
   - Update `DEPLOYMENT_RUNBOOK.md`.
