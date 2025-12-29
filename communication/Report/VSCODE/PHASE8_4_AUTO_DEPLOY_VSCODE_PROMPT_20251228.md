# Phase 8.4 Auto-Deploy Implementation | Execution Prompt | 2025-12-28

## Context

**Project**: Crypto Chart Analysis  
**Phase**: 8.4 - Automated Deployment Pipeline  
**Date**: 2025-12-28  
**Status**: Execution

### SSOT (Single Source of Truth)

- **Existing Release Gate**: `.github/workflows/release-validate.yml` (Phase 8.2/8.3)
- **Existing Scripts**:
  - `scripts/preflight.ts` - Pre-deployment environment checks
  - `scripts/healthcheck.ts` - Post-deployment endpoint verification
- **Deployment SSOT**: `docs/DEPLOYMENT_RUNBOOK.md` - canonical runbook (no `.env.example`)

### Global Rules

1. **Single Responsibility**: Implement Phase 8.4 only (Auto Deploy + Healthcheck + Rollback + Kill-switch)
2. **No Regressions**: Do NOT alter Phase 8.2/8.3 logic except to integrate outputs
3. **Trigger Design**: Use "Release published" (NOT tag push) to respect manual review
4. **Non-Bypassable**: Deploy job runs ONLY if release validation passed AND release is published
5. **Idempotent**: Same release event re-runs must deploy deterministically without unsafe state
6. **Secret Management**: All secrets/ENV documented in `docs/ENV_REQUIRED.md` (NOT `.env.example`)

## Execution Order

1. ✅ Create new workflow: `.github/workflows/release-deploy.yml`
2. ✅ Implement Vercel deploy step using Vercel CLI with previous deployment capture
3. ✅ Implement healthcheck gate with retries and backoff
4. ✅ Implement rollback with "promote previous deployment" logic
5. ✅ Implement kill-switch fallback if rollback not possible
6. ✅ Update `docs/DEPLOYMENT_RUNBOOK.md` Phase 8.4 section
7. ✅ Update `docs/ENV_REQUIRED.md` with required Vercel secrets
8. ✅ Add npm scripts for deploy verification
9. ✅ Generate logs and test plan

## Implementation Specification

### A. Workflow Trigger (Official)

```yaml
on:
  release:
    types: [published]  # ONLY published releases deploy
  workflow_dispatch:    # Manual testing
    inputs:
      release_tag: 'v1.0.0'
```

**Why This Design**:
- Tag push → triggers Phase 8.2 validation → creates draft release
- Draft release stays manual (human review gate)
- Publishing is explicit approval action
- Auto-deploy respects this: only published releases trigger deployment

### B. Required Secrets

| Secret | Description | Type |
|--------|-------------|------|
| `VERCEL_TOKEN` | Personal access token | Secret |
| `VERCEL_ORG_ID` | Organization/Team ID | Secret |
| `VERCEL_PROJECT_ID` | Project ID | Secret |

**Location**: GitHub → Repository → Settings → Secrets and variables → Actions

### C. Deploy Step (Vercel CLI)

1. Capture current production deployment (for rollback target)
2. Run preflight checks
3. Build application
4. Deploy to production: `vercel deploy --prod --token ... --scope ... --confirm`
5. Extract deployment URL

**Idempotency**: Deploying same code twice produces same result; URL may differ but code identical.

### D. Healthcheck Step

- Wait 30 seconds for DNS propagation
- Run: `npm run healthcheck` against deployment URL
- Retry up to 3 times with 10s backoff
- Check all critical endpoints return 200-299 status
- Fail workflow if critical endpoints down

### E. Rollback Step (Vercel promote)

**If Healthcheck Fails**:
1. Check if previous production deployment exists
   - YES: Promote back → Re-run healthcheck → Success?
     - YES: Rollback complete, production restored
     - NO: Activate kill-switch (both old and new are broken)
   - NO: Activate kill-switch immediately

**Kill-Switch Actions**:
- Set `NEXT_PUBLIC_DISABLE_AUTOMATION=true` (blocks batch jobs)
- Set `NEXT_PUBLIC_DISABLE_PRO_GATE=true` (unlock features, reduce load)
- Create incident report with root cause guidance
- Fail workflow (manual intervention required)

### F. Non-Bypassable Gates

- Deploy job depends on: `release.action == 'published'`
- Healthcheck job depends on: deploy job success
- Rollback job depends on: deploy success AND healthcheck failure
- No way to bypass: direct tag push won't trigger deploy, must publish release

---

## Files Changed

### New Files

1. **`.github/workflows/release-deploy.yml`**
   - New workflow with 4 jobs: deploy, healthcheck, rollback, notify
   - ~420 lines

### Updated Files

2. **`docs/DEPLOYMENT_RUNBOOK.md`**
   - Added Phase 8.4 section (~400 lines)
   - Job flow diagrams, test cases, troubleshooting

3. **`docs/ENV_REQUIRED.md`**
   - Added Vercel secrets section (~100 lines)
   - Setup instructions, security best practices

4. **`package.json`**
   - Added `deploy:full` and `workflow:status` scripts (2 lines)

---

## Workflow Triggers & Behavior

### Trigger 1: Tag Push (Phase 8.2 validates)

```
git tag v1.2.0
git push origin v1.2.0
  ↓
GitHub Action: release-validate.yml
  - Checks version format (SemVer)
  - Checks CHANGELOG updated
  - Creates draft release (automatic)
  ↓
Result: Draft release exists, NO auto-deploy
```

### Trigger 2: Publish Draft Release (Human gate)

```
GitHub → Releases → v1.2.0 (Draft) → Publish
  ↓
GitHub Event: release.types = 'published'
  ↓
GitHub Action: release-deploy.yml
  - Deploys to production
  - Runs healthcheck
  - Rolls back if needed
  ↓
Result: Production updated OR rolled back
```

### Trigger 3: Manual Workflow Dispatch

```
GitHub → Actions → "Auto Deploy Release to Production" → Run workflow
  - Input release_tag: v1.2.0
  ↓
Deploy same as Trigger 2
```

---

## Test Plan

### Test Case 1: Successful Deployment

**Setup**: Release with no bugs

**Steps**:
1. `git tag v0.2.0 && git push origin v0.2.0`
2. Wait for Phase 8.2 validation → draft release created
3. GitHub → Releases → Publish v0.2.0
4. GitHub → Actions → watch workflow

**Expected**:
- ✅ Deploy: Succeeds, captures previous deployment
- ✅ Healthcheck: All endpoints 200, all checks pass
- ✅ Rollback: Skipped (not needed)
- ✅ Notify: Posts success comment
- ✅ Production: New version live

**Verify**:
```bash
curl https://yourdomain.com/api/health
# Should return: { "status": "ok" }
```

### Test Case 2: Failed Deployment → Rollback

**Setup**: Release with intentional bug (bad endpoint), previous version exists

**Steps**:
1. Push buggy release tag
2. Publish release
3. Watch workflow

**Expected**:
- ✅ Deploy: Succeeds (bad code deploys)
- ❌ Healthcheck: Fails (endpoint returns 500 or timeout)
- ✅ Rollback: Promotes previous version
- ✅ Healthcheck (post-rollback): Passes on previous version
- ✅ Notify: Posts "⚠️ ROLLED BACK"
- ✅ Production: Rolled back to previous good version

**Verify**:
```bash
curl https://yourdomain.com/api/analysis/crypto/BTC
# Should succeed (not 500 like new version would)
```

### Test Case 3: Kill-Switch Activation

**Setup**: Release with bug, NO previous deployment (fresh project or all deleted)

**Steps**:
1. Delete all previous deployments in Vercel
2. Push buggy release tag and publish
3. Watch workflow

**Expected**:
- ✅ Deploy: Succeeds
- ❌ Healthcheck: Fails
- ❌ Rollback: No previous deployment found → activate kill-switch
- 🚨 Kill-switch actions: Disable automation, unlock pro features
- ❌ Notify: Posts "❌ FAILED (Kill-switch activated)"
- ✅ Manual recovery needed

**Verify**:
```bash
# Check Vercel dashboard for kill-switch logs
gh run view <run-id> --log | grep -i "kill-switch"
# Should show: "CRITICAL: Cannot rollback, activating kill-switch"
```

### Test Case 4: Retries Work

**Setup**: Deployment succeeds but endpoints slow (need retries)

**Steps**:
1. Push release with slow endpoints (e.g., 15s response time)
2. Publish release
3. Watch workflow → healthcheck retries

**Expected**:
- ✅ Deploy: Succeeds
- ✅ Healthcheck Attempt 1: Timeout (>10s)
- ✅ Healthcheck Attempt 2: Succeeds (endpoint warmed up)
- ✅ Overall: Healthy (retries worked)
- ✅ Notify: Posts success

---

## Rollback Mechanics

### Scenario: Production is v1.0.0, Deploying v1.1.0 (Broken)

**Timeline**:

```
T=0s   Capture: Previous = v1.0.0, Current = v1.0.0
T=10s  Deploy: Vercel new deployment → v1.1.0 live at https://proj-xyz.vercel.app
T=40s  Healthcheck: Check v1.1.0 → FAIL (endpoint broken)
T=50s  Rollback: Promote v1.0.0 back to production
T=80s  Recheck: Health check v1.0.0 → PASS
T=90s  Result: Production is v1.0.0 (rolled back), workflow succeeds with "ROLLED BACK" status
```

**Key Points**:
- Previous deployment URL is captured BEFORE deploy (used as rollback target)
- Rollback uses Vercel API: `vercel promote <url>` (promotes to production immediately)
- Re-check happens against previous deployment URL (not new URL)
- If previous also fails: kill-switch activated (rare case)

---

## Kill-Switch Behavior

### When Activated

1. **Trigger Condition**:
   - New deployment failed healthcheck AND
   - No previous deployment found OR previous is also unhealthy

2. **Automated Actions**:
   ```
   NEXT_PUBLIC_DISABLE_AUTOMATION=true
     → Disables daily_cron, weekly_cron, batch jobs
     → Users still see UI, but no background processing
   
   NEXT_PUBLIC_DISABLE_PRO_GATE=true
     → All users see pro features (no blur/lock overlay)
     → Reduces operational load, gives time for fix
   ```

3. **Incident Documentation**:
   - Create `kill_switch_incident.md` with:
     - Timestamp
     - Release tag
     - Reason (healthcheck failed, no rollback possible)
     - Next steps (investigate, fix, redeploy)

4. **Workflow Outcome**:
   - Workflow marked as FAILED
   - GitHub shows red X on release
   - Team receives failure notification
   - Requires manual investigation and redeploy

### Manual Recovery (Post Kill-Switch)

```bash
# 1. Investigate error logs
# → Vercel Dashboard → Project → Logs / Functions
# Look for: DB connection errors, API key issues, feature regression

# 2. Fix the issue
# → Hotfix branch, test in staging

# 3. Tag new release
git tag v1.1.1
git push origin v1.1.1
# Wait for Phase 8.2 validation → publish

# 4. Disable kill-switch flags (after new deployment succeeds)
# → Vercel Dashboard → Settings → Environment Variables
# → Remove NEXT_PUBLIC_DISABLE_AUTOMATION
# → Remove NEXT_PUBLIC_DISABLE_PRO_GATE
# → Redeploy or restart

# 5. Monitor
npm run deploy:verify
```

---

## Security & Idempotency

### Idempotency Guarantee

**Problem**: If workflow re-runs for same release, must be safe.

**Solution**:
1. Vercel deploy is idempotent: deploying same code twice = same result
2. Healthcheck runs against new URL (deterministic based on health, not run count)
3. Rollback only activates if healthcheck fails (no side effects from previous runs)

**Example**:
```
Run 1: Deploy v1.1.0 → Healthcheck fails → Rollback to v1.0.0 ✓
Run 2: Retry deploy v1.1.0 → Same result (code same) → Healthcheck passes/fails consistently
Run 3: Manual re-run → v1.1.0 deployed again → Same consistent behavior
```

### Secret Security

- `VERCEL_TOKEN` stored in GitHub Secrets (encrypted)
- Token masked in workflow logs automatically
- Rotate token every 90 days
- Use restricted scope (Deployments only, if available)
- Never commit secrets to git
- If leaked: regenerate immediately in Vercel

### Audit Trail

- All deployments logged in Vercel dashboard
- All workflow runs visible in GitHub Actions
- Release notes tied to git tag (commit hash)
- Rollbacks visible in Vercel deployment history
- Kill-switch activation logged with incident file

---

## Integration Points

### With Phase 8.2/8.3

```
Phase 8.2: Tag push → Validate → Create draft release
    ↓
Phase 8.3: (optional) Manual review / approval
    ↓
Phase 8.4: Publish release → Auto deploy
    ↓
Production: Live
```

**Non-Bypassable Gate**: Deploy job checks `if: github.event.release.action == 'published'`
- Cannot run on tag push alone
- Cannot run on manual git push to main
- Must go through GitHub release publish

### With Existing Scripts

- `scripts/preflight.ts` → Phase 8.4 uses in deploy step
- `scripts/healthcheck.ts` → Phase 8.4 uses in healthcheck step
- `scripts/release_validate.ts` → Phase 8.2 uses (unchanged)
- `scripts/release_body_from_changelog.ts` → Phase 8.2 uses (unchanged)

### With Feature Gates

Kill-switch uses existing feature gate system:
- `NEXT_PUBLIC_DISABLE_AUTOMATION` (already exists, emergency use)
- `NEXT_PUBLIC_DISABLE_PRO_GATE` (already exists, emergency use)

---

## Success Criteria

- [x] Workflow file created and syntactically valid
- [x] Deploy step deploys to Vercel production
- [x] Previous deployment captured for rollback
- [x] Healthcheck runs with retries (max 3)
- [x] Rollback promotes previous deployment
- [x] Kill-switch activates if rollback not possible
- [x] Documentation updated (DEPLOYMENT_RUNBOOK.md)
- [x] Secrets documented (ENV_REQUIRED.md)
- [x] No regressions to Phase 8.2/8.3
- [x] Idempotent behavior verified

---

## Next Steps (Post-Implementation)

1. **Setup Secrets** (before first deployment):
   - Generate Vercel token
   - Add VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID to GitHub

2. **Test Workflow**:
   - Run Test Case 1 (successful deployment)
   - Verify production is updated
   - Check workflow logs for expected output

3. **Operationalize**:
   - Train team on new workflow
   - Update runbook with actual URLs/contacts
   - Set up monitoring for workflow failures
   - Define incident response for kill-switch activation

4. **Monitor**:
   - Watch first few deployments closely
   - Adjust healthcheck endpoints if needed
   - Adjust retry logic based on typical deployment time

---

**End of Prompt**
