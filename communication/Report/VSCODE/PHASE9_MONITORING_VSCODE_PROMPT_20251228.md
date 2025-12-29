# Phase 9 Monitoring Prompt (VSCODE)

**Date**: 2025-12-28
**Executor**: VSCODE (Antigravity)

## Request
Goal: Implement Phase 9 Post-Deploy Monitoring & Notifications.
- Scope: Post-deploy monitoring & notifications only.
- Do NOT modify Phase 5~8 pipelines except to emit signals.
- No auto kill-switch.
- Implementation: New `release-observe.yml`.

## Execution Plan
1. Create `.github/workflows/release-observe.yml`:
   - Triggers: `workflow_run` (after deploy), `schedule` (15m).
   - Jobs: `process_deployment` (KPIs/Alerts), `uptime_check`.
2. Update `docs/DEPLOYMENT_RUNBOOK.md`: Add Phase 9 details.
3. Update `docs/ENV_REQUIRED.md`: Add `SLACK_WEBHOOK_URL` etc.
