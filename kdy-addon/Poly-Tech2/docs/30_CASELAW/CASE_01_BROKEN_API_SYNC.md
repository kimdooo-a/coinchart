# CASE 01: BROKEN API SYNC

## 1. Incident
**Context**: Developer updated `config/apis/registry.yaml` manually to add a new key, but forgot to update `.env.example`.
**Result**: Deployment failed because the application crashed on startup (Missing Environment Variable).

## 2. Ruling (The "Fix")
**Violation**: Law 10 (Routing) implies automation should handle routing of configs. Manual editing caused drift.
**Correction**:
1. Revert manual changes.
2. Update the Source of Truth: `kdy-addon/Poly-Tech2/.../registry.yaml`.
3. Run `sync_api.py`.
4. Run `api_compliance_check.py` to verify `.env.example` is patched.

## 3. Precedent
- **"Source Over Sink"**: Never edit the destination (`config/apis`) if an automated source (`kdy-addon`) exists.
- **"Validation First"**: Always run compliance checks before commit.
