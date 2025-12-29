# Phase 8.4 Option A Patch Prompt (VSCODE)

**Date**: 2025-12-28
**Executor**: VSCODE (Antigravity)

## Request
Goal: Make Phase 8.4 non-bypassable + policy-consistent with Option A.
- Auto Deploy runs ONLY on GitHub Release Published.
- Kill-switch is NOT auto-applied; it is an operator runbook action.
- Remove bypass (workflow_dispatch).
- Update docs (Runbook + Env).

## Execution Plan
1. Modify `.github/workflows/release-deploy.yml`: Remove dispatch, add timeout, instruction-only failure.
2. Update `docs/DEPLOYMENT_RUNBOOK.md`: Phase 8.4 governance.
3. Update `docs/ENV_REQUIRED.md`: Add Vercel secrets.
4. Create Test Plan.
