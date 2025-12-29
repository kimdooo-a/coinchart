# Deployment Runbook

**Last Updated**: 2025-12-28
**Phase**: 10 (Quality Gates)

Complete guide for deploying "ChartMaster" to production, monitoring health, and managing quality gates.

---

## 🚀 Triggering a Deployment

### 1. Pre-Check: Quality Gate
Before creating a release, the system checks the **Stability of the Previous Release**.
- If the *previous* release encountered a KPI Failure (Rollback, Manual Kill-Switch), the VALIDATION workflow (`release-validate.yml`) will **FAIL**.
- **Fix First Policy**: You must fix the stable branch or acknowledge the issue before releasing new features.

### 2. Create a Release (The ONLY Way)
Production deployments are **strictly automated**. You cannot manually trigger the workflow from the GitHub Actions tab.

1.  Navigate to **Code > Releases**.
2.  Click **Draft a new release**.
3.  **Tag version**: `vX.Y.Z` (e.g., `v1.0.0`).
4.  **Target**: `main`.
5.  **Release title**: `vX.Y.Z - [Short Description]`.
6.  Click **Publish release**.

> [!IMPORTANT]
> The "Publish" action is the **only** event that triggers the `release-deploy.yml` workflow.

### 3. Monitoring Progress
1.  Go to the **Actions** tab.
2.  Click on the running **Auto Deploy Release to Production** workflow.
3.  Observe the steps:
    - **Deploy**: Builds and promotes to Vercel Prod.
    - **Healthcheck**: Verifies the site is up and critical paths work (Timeout: 5 mins).
    - **Rollback**: If healthcheck fails, it attempts to restore the previous deployment.
    - **KPI Collection**: Observes the result and updates the Release Asset (`release_kpi.json`).

---

## 🔐 Phase 10: Release KPI & Quality Gate

The system collects Key Performance Indicators (KPIs) for every release and uses them to enforce quality gates for future releases.

### KPI Metrics

Each release has a `release_kpi.json` attached as a GitHub Release Asset.

| KPI | Values | Meaning | Gate Effect |
|-----|--------|---------|-------------|
| `status` | `SUCCESS` | Deploy + healthcheck passed | Allows next release |
| `status` | `ROLLBACK` | Healthcheck failed, auto-rolled back | **Blocks next release** |
| `status` | `FAILURE` | Deploy failed or kill-switch activated | **Blocks next release** |
| `duration_seconds` | number | Time from deploy start to healthcheck complete | Informational only |
| `incident_count` | number | Critical failures encountered | Informational only |

### When a Release is Blocked

A new release is blocked when:
1. The **previous** published release has `status` other than `SUCCESS`
2. The validation workflow (`release-validate.yml`) checks the previous release's KPI
3. If `status == ROLLBACK` or `status == FAILURE`, validation **FAILS**

**Symptom**: Workflow fails with message "QUALITY GATE FAILED: Previous release unstable"

### Unblock Procedure

#### Option 1: Fix Root Cause (Preferred)
1. Identify why the previous release failed (check logs, artifacts)
2. Fix the code issue
3. Create a hotfix release that passes healthcheck
4. Once successful, the gate opens for the next release

#### Option 2: Re-run After Incident Closure
1. If the failure was environmental (not code), wait for resolution
2. Close any open incident issues
3. Manually update the previous release's `release_kpi.json`:
   - Go to GitHub Releases → Previous Release
   - Upload updated asset with `"status": "SUCCESS"`
4. Re-run validation workflow

#### Option 3: Emergency Manual Override (ANTIGRAVITY Approval Only)

> [!CAUTION]
> This bypasses quality enforcement. Use only for critical hotfixes when normal procedures cannot be followed.

**Requirements**:
- [ ] ANTIGRAVITY team member has approved the override
- [ ] Reason documented in release notes
- [ ] Post-release review scheduled

**Procedure**:
1. Get explicit approval from ANTIGRAVITY team
2. Manually upload `release_kpi.json` to previous release:
   ```json
   {
     "release_tag": "vX.Y.Z",
     "status": "SUCCESS",
     "override": true,
     "approved_by": "ANTIGRAVITY",
     "reason": "[documented reason]"
   }
   ```
3. Re-run validation for new release
4. Document override in release notes

---

## 👁️ Phase 9: Release Observation & Incident Awareness

This phase focuses on **visibility and response** - providing operators with clear signals to assess deployment health and respond to incidents.

### Observable Signals

| Signal | Source | Meaning |
|--------|--------|---------|
| `✅ Deploy Success` | GitHub Actions | Build and promotion completed |
| `✅ Healthcheck Pass` | GitHub Actions | Critical endpoints responding |
| `⚠️ ROLLED BACK` | GitHub Actions | Healthcheck failed, previous version restored |
| `❌ MANUAL ACTION REQUIRED` | GitHub Actions | Rollback failed, operator intervention needed |
| `🔔 Slack Notification` | Slack | Summary posted to channel |
| `📋 GitHub Issue` | GitHub Issues | Incident ticket created with logs |

### Where to Look

| What | Where | URL Pattern |
|------|-------|-------------|
| Workflow Status | GitHub Actions | `github.com/[org]/[repo]/actions` |
| Deployment Logs | GitHub Actions Artifacts | Click workflow run → Artifacts |
| Release History | GitHub Releases | `github.com/[org]/[repo]/releases` |
| Production Status | Vercel Dashboard | `vercel.com/[org]/[project]` |
| Infrastructure Health | Vercel Status | `status.vercel.com` |
| Database Health | Supabase Dashboard | `app.supabase.com/project/[id]` |

---

## 🛡️ Failure & Recovery

### Scenario A: Automatic Rollback
If the deployment succeeds but the healthcheck fails:
1.  The workflow identifies the **previous** healthy deployment ID.
2.  It runs `vercel promote [PREVIOUS_URL]`.
3.  Status is reported as `⚠️ ROLLED BACK`.

**Action**: Check the GitHub Action logs to see why the new version failed healthchecks.

### Scenario B: Manual Kill-Switch (Critical Failure)
If the healthcheck fails AND the automatic rollback fails (or no previous deployment exists):

**The pipeline will FAIL and output "MANUAL ACTION REQUIRED".**

#### 🛑 Kill-Switch Procedure
An operator must manually intervene to safe the system.

1.  **Login to Vercel Dashboard**.
2.  Select the project.
3.  Go to **Settings > Environment Variables**.
4.  Set the following variables for **Production**:
    - `NEXT_PUBLIC_DISABLE_AUTOMATION` = `true`
    - `NEXT_PUBLIC_DISABLE_PRO_GATE` = `true` (Protects users from paid features during instability)
5.  **Redeploy** the current production deployment to apply these env vars.
    - Go to **Deployments**.
    - Click the three dots on the active deployment > **Redeploy**.

---

## 🔍 Pre-Release Checklist (Manual)

Before publishing a release, verify:
- [ ] **Quality Gate**: Is the previous release stable? (If not, fix it first)
- [ ] `npm run build` passes locally.
- [ ] `npm run preflight` passes locally.
- [ ] `.env.production` secrets are up to date in Vercel.
- [ ] Database migrations are applied (Supabase).

---

## 🛠️ Environment Variables (CI/CD)

The GitHub Actions workflow requires these secret variables:

| Variable | Description | Required? |
| :--- | :--- | :--- |
| `VERCEL_TOKEN` | Vercel API Token | **YES** |
| `VERCEL_ORG_ID` | Vercel Organization ID | **YES** |
| `VERCEL_PROJECT_ID` | Vercel Project ID | **YES** |
| `SLACK_WEBHOOK_URL` | Integration for alerts | No (Optional) |
| `NEXT_PUBLIC_SUPABASE_URL` | For build/preflight | **YES** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For build/preflight | **YES** |

---

## 🔗 Emergency Contacts

- **DevOps Lead**: [Name]
- **Vercel Status**: status.vercel.com
- **Supabase Status**: status.supabase.com
