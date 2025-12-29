# Phase 8.4: Auto-Deploy & Rollback Governance

**Date**: 2025-12-28
**Author**: ANTIGRAVITY
**Status**: APPROVED

---

## 1. Governance Decision

### A. Official Trigger
**Decision**: `on: release(types: [published])`

**Rationale**:
- **Human-in-the-Loop**: The existing `release-validate.yml` creates a **Draft Release**. Deployment should ONLY occur when a human explicitly reviews that draft and clicks "Publish".
- **Separation of Concerns**: 
  - CI (Validation): Runs on `push: tag`.
  - CD (Deployment): Runs on `release: published`.
- **Security**: Prevents accidental tag pushes from triggering production deployments.

### B. Gate Enforcement Strategy
The pipeline guarantees a non-bypassable sequence:
1.  **Code & Tag Validation**: `release-validate.yml` (Must pass to create Draft).
2.  **Human Review**: Manual verification of the Draft Release (Changelog, Version).
3.  **Deployment Gate**: `deploy-production.yml` (Triggered ONLY by Publish).
4.  **Post-Deployment Verification**: `healthcheck` script runs immediately against the production URL.

### C. Rollback & Fail-Safe Definition
**Primary Protocol**: **Vercel Instant Rollback (Manual)**
- **Why**: Vercel's "Instant Rollback" (promoting the previous deployment) is atomic and reliable. Automating this via CLI scripts is error-prone (identifying the "correct" previous ID is effectively a state management problem).
- **Execution**: If `healthcheck` fails in the GitHub Action, the workflow marks as **FAILED**. The on-call engineer must click "Rollback" in the Vercel Dashboard.

**Secondary Protocol (Kill-Switch)**:
- **Condition**: If the deployment succeeds but causes logical errors (e.g., API spam, DB load).
- **Execution**: Set `NEXT_PUBLIC_DISABLE_AUTOMATION=true` in Vercel Environment Variables to stop background jobs immediately.

---

## 2. Architecture & Design (SSOT)

### Workflow: `.github/workflows/deploy-production.yml`

This file must be created by VSCODE.

```yaml
name: Production Deploy

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }} > deployment-url.txt

      - name: Run Post-Deploy Healthcheck
        run: |
          DEPLOY_URL=$(cat deployment-url.txt)
          echo "Checking health of: $DEPLOY_URL"
          # Wait for propagation
          sleep 10
          # Run healthcheck script against new URL
          # Must support --url flag or ENV override
          HEALTH_CHECK_URL=$DEPLOY_URL npm run healthcheck
        continue-on-error: false # Fail the job if healthcheck fails
```

### Risk Analysis

| Risk | Probability | Mitigation |
|------|------------|------------|
| **Bad Release Published** | Low | `release-validate` workflow ensures SemVer & Changelog quality before Draft creation. |
| **Healthcheck False Negative** | Medium | Healthcheck script includes retry logic (3 attempts). Job fails only after confirmed persistence. |
| **Vercel API Token Expired** | Low | Managed via GitHub Secrets (Rotation Policy). |
| **Database Schema Mismatch** | Medium | Migration strategy (expand-contract) required. Deploy pipeline does NOT auto-migrate DB in this phase (Manual DB Ops). |

### Required Secrets / ENV

| Branch | Secret Name | Description |
|--------|-------------|-------------|
| Repo | `VERCEL_TOKEN` | Vercel CLI Token (Required for deploy) |
| Repo | `VERCEL_ORG_ID` | Vercel Organization ID |
| Repo | `VERCEL_PROJECT_ID` | Vercel Project ID |
| Repo | `NEXT_PUBLIC_SUPABASE_URL` | Prod DB URL |
| Repo | `SUPABASE_SERVICE_ROLE_KEY` | Admin Key (for preflight/build) |

---

## 3. Approval Checklist (For VSCODE/CURSOR)

**VSCODE Implementation Actions**:
- [ ] **Create Workflow**: Implement `.github/workflows/deploy-production.yml` with the structure above.
- [ ] **Update Runbook**: specific instruction on "How to Trigger Deploy" (Click Publish on GitHub Release).
- [ ] **Verify Script**: Ensure `npm run healthcheck` respects `HEALTH_CHECK_URL` env var override (essential for testing the specific deployment URL).

**CURSOR Audit Questions**:
1. Does the workflow ONLY trigger on `release(published)`? (No `push: main`).
2. Does the workflow fail if `npm run healthcheck` fails?
3. Are `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` configured in the project settings (`vercel.json` or Secrets)?

## 4. Final Verdict

**DECISION**: **APPROVE WITH CONDITIONS**

**Conditions**:
1.  **Strict Release Flow**: Developers MUST NOT deploy by `vercel --prod` locally anymore. All production deploys MUST go through the GitHub Release Publish button.
2.  **Healthcheck Updates**: The `healthcheck` script must be robust enough to handle the immediate post-deploy state (warm-up time).
3.  **Governance Accept**: The user accepts that "Rollback" is a **Manual Action** (Vercel Dashboard) triggered by an **Automated Alert** (GitHub Action Failure).
