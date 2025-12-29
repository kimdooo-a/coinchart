# Release Notes Template

**Purpose**: Standardized format for all GitHub Releases  
**Status**: LOCKED (all releases must follow this template)  
**Version**: 1.0  
**Last Updated**: 2025-12-27

---

## Template

Copy and paste the template below for each new release. Fill in each section according to instructions.

```markdown
# Release vX.Y.Z

**Release Date**: YYYY-MM-DD  
**Release Type**: MAJOR / MINOR / PATCH

---

## Overview

[MANDATORY: 1-3 sentences explaining what this release does]

Example:
- "This release fixes a critical bug in probability calculation that affected 10% of crypto analyses."
- "Adds stock market analysis capability, bringing equities to feature parity with crypto analysis."
- "Routine maintenance release: database optimization, dependency updates, documentation improvements."

⚠️ **What NOT to include in Overview**:
- ❌ Speculation ("should be faster", "might improve reliability")
- ❌ Promises ("will support Forex next quarter")
- ❌ Adjectives without proof ("major", "revolutionary", "game-changing")
- ✅ Factual statements only ("adds", "fixes", "removes", "updates")

---

## Changes

### Added
[List new features, new endpoints, new gates - OR state "None"]
- Feature/capability 1
- Feature/capability 2

Example:
```
- Stock analysis API: `/api/analysis/stock/{symbol}`
- New feature gate: `NEXT_PUBLIC_DISABLE_STOCK` for emergency shutdown
- Weekly batch job: automated stock report generation
```

### Changed
[List modifications to existing features - OR state "None"]
- Changed X from Y to Z
- Updated algorithm for better accuracy

Example:
```
- Probability calculation: improved accuracy from 92% to 95%
- Cache TTL: increased from 30s to 60s for performance
- Database query: optimized for 50% faster response time
```

### Fixed
[List bug fixes with issue numbers - OR state "None"]
- Fixed #123: bug description
- Fixed #456: crash when condition X

Example:
```
- Fixed #789: NaN in probability calculation when volume = 0
- Fixed #790: memory leak in analysis cache
- Fixed #791: console error when switching between crypto/stock
```

### Removed (if any)
[List deprecated features, removed gates - OR state "None"]
- Removed: X (use Y instead)
- Deprecated gate: Z (use new gate W)

Example:
```
- Removed: legacy news feed API (use `/api/news/crypto` instead)
- Removed: old dashboard (use new market page)
```

---

## Operations

### Environment Variables

#### New
[List new env vars - OR state "None"]
- Name: `NEXT_PUBLIC_FEATURE_X`
  - Type: `boolean`
  - Default: `false`
  - Required: No
  - Purpose: Enable feature X

Example:
```
- Name: `NEXT_PUBLIC_STOCK_ENABLED`
  - Type: `boolean`
  - Default: `true`
  - Required: No
  - Purpose: Toggle stock analysis feature
  - Action: Add to Vercel Settings → Environment Variables
```

#### Changed
[List modified env vars - OR state "None"]
- Name: `NEXT_PUBLIC_CACHE_TTL`
  - Old value: 30
  - New value: 60
  - Impact: Cached results live longer (may be stale)

Example:
```
- Name: `NEXT_PUBLIC_BATCH_TIMEOUT`
  - Old value: 300s (5 min)
  - New value: 600s (10 min)
  - Impact: Batch jobs allowed to run longer
```

#### Removed
[List deleted env vars - OR state "None"]
- Name: `LEGACY_FEATURE_X` (no longer used)

### Feature Gates

[List gate changes - OR state "None"]

Example:
```
- NEXT_PUBLIC_DISABLE_AUTOMATION: unchanged (no impact)
- NEXT_PUBLIC_DISABLE_PRO_GATE: unchanged (no impact)
- NEXT_PUBLIC_DISABLE_STOCK: NEW (emergency stock shutdown, if needed)
```

### Scheduled Jobs

[List cron/batch job changes - OR state "None"]

Example:
```
- batch:daily: running as usual (no changes)
- batch:weekly: now generates stock reports (new)
```

### Database Changes

[List DB migrations/schema changes - OR state "None"]

Example:
```
- No migrations required
```

OR

```
- Migration: add `confidence_grade` column to `batch_analysis_results`
- Migration: create index on `(symbol, created_at)`
- Action: Run `npm run db:migrate` before deploying
- Action: Backup database before running migration
```

---

## Risk Assessment

### Risk Level: 

Choose ONE: **LOW** / **MEDIUM** / **HIGH**

### Reasoning

[2-3 sentences explaining why this risk level]

Example LOW:
```
Risk Level: LOW

Reasoning:
- Bug fix to non-critical path (crypto probability calculation)
- Change affects <1% of daily queries
- Rollback procedure simple (no DB changes)
```

Example MEDIUM:
```
Risk Level: MEDIUM

Reasoning:
- New feature (stock analysis) may have edge cases
- Affects all users with stock portfolios
- Requires feature gate testing before full rollout
```

Example HIGH:
```
Risk Level: HIGH

Reasoning:
- Database schema change (breaking)
- Affects all users (blocking API change)
- Rollback requires data migration
- Recommend deploying during business hours with team on standby
```

### Affected Components

- [ ] Frontend (UI/UX)
- [ ] API (endpoints, responses)
- [ ] Database (schema, queries)
- [ ] Batch jobs (daily/weekly tasks)
- [ ] Feature gates (new/modified flags)
- [ ] Authentication (login, session)

---

## Rollback Procedure

### Quick Rollback (< 5 minutes)

[Describe steps if issue detected immediately after deployment]

Example:
```bash
# If critical issue within 5 minutes:

# Option A: Disable gate (fastest)
# In Vercel: Settings → Environment Variables
# Set: NEXT_PUBLIC_DISABLE_STOCK=true
# Redeploy (5 min)

# Option B: Promote previous version
# In Vercel: Deployments → [vX.Y.(Z-1)] → Promote to Production
# Wait 2-5 min for DNS propagation
```

### Full Rollback (5-15 minutes)

[Describe steps if issue requires complete revert]

Example:
```bash
# If issue can't be fixed with gates:

git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
git checkout vX.Y.(Z-1)
git push origin main
# Wait for Vercel to redeploy previous version (5-10 min)
```

### Database Rollback (if applicable)

[If DB schema changed]

Example:
```bash
# If migration broke data:
# 1. Stop batch jobs: set NEXT_PUBLIC_DISABLE_AUTOMATION=true
# 2. Restore DB from backup (Supabase backup tab)
# 3. Promote vX.Y.(Z-1)
# 4. Verify data consistency
# 5. Re-enable automation
```

### Emergency Flags (if needed)

[List flags to use during incident]

Example:
```
If stock analysis broken:
- Set: NEXT_PUBLIC_DISABLE_STOCK=true
- Effect: Stock routes return 404 (users redirected to home)
- Recovery: Fix code → new release → set to false

If Pro gating broken:
- Set: NEXT_PUBLIC_DISABLE_PRO_GATE=true
- Effect: All users see Pro features (temporary emergency)
- Recovery: Fix code → new release → set to false
```

### Rollback Success Criteria

- [ ] /api/health returns 200 OK
- [ ] /api/analysis/crypto/BTC returns data
- [ ] /api/analysis/stock/AAPL returns data (if stock enabled)
- [ ] No critical errors in logs
- [ ] Batch jobs running (if enabled)
- [ ] Users can access core features

---

## Verification Checklist

**Before deploying, verify**:

- [ ] Preflight checks passed
  ```bash
  npm run preflight
  # Should show: [PASSED] All preflight checks passed ✅
  ```

- [ ] Build successful
  ```bash
  npm run build
  # Should show: Compiled successfully
  ```

- [ ] Tag created correctly
  ```bash
  git tag -a vX.Y.Z -m "Release vX.Y.Z"
  ```

- [ ] GitHub Release created with this template
  - [ ] Sections filled in completely
  - [ ] No secrets/API keys in notes
  - [ ] Rollback procedure documented
  - [ ] Risk level specified

- [ ] Health checks passed (5 min after deploy)
  ```bash
  npm run healthcheck
  # Should show: [PASSED] All health checks passed ✅
  ```

- [ ] Manual smoke tests passed
  - [ ] Homepage loads
  - [ ] Crypto analysis works
  - [ ] Stock analysis works (if applicable)
  - [ ] No console errors

- [ ] Monitoring shows normal metrics
  - [ ] Error rate: < 0.1%
  - [ ] Response time: < 500ms average
  - [ ] Database: healthy queries

- [ ] Rollback procedure tested (on staging)
  - [ ] Can promote previous version
  - [ ] Can use emergency gates
  - [ ] Can restore from backup (if applicable)

---

## Related Issues & PRs

- Closes #123 (Feature A)
- Closes #456 (Feature B)
- Fixes #789 (Bug X)
- References PR #100 (related work)

---

## Contributors

[List GitHub usernames of contributors to this release]

Example:
```
- @alice (feature A)
- @bob (bug fix X)
- @charlie (documentation)
```

---

## Migration Guide (if applicable)

[If users need to do anything, explain here - OR state "None"]

Example:
```
## For Pro Users

Stock analysis is now available. To enable:
1. Go to Settings
2. Check "Enable Stock Analysis"
3. Reload page

No action required for existing features.
```

---

## Additional Notes

[Anything else team/users should know - OR omit this section]

Example:
```
- Batch jobs running daily at 00:00 UTC
- Weekly reports available Friday morning
- Performance improved ~20% for crypto queries
- See documentation for new stock analysis API
```

---

## Deployment Owner

**Deployed by**: [Name]  
**Tested by**: [Name]  
**Verified at**: [Date/Time UTC]  
**Time to Deploy**: [X min]  
**Issues Encountered**: None / [list]

---

**This release follows [RELEASE_VERSIONING.md](RELEASE_VERSIONING.md) policy.**
```

---

## Instructions for Release Authors

### Step 1: Prepare Release
1. Copy template above
2. Replace `vX.Y.Z` with actual version (e.g., v1.2.3)
3. Replace YYYY-MM-DD with actual date

### Step 2: Fill Each Section
- **Overview**: 1-3 sentences, factual only
- **Changes**: List actual changes, use issue numbers
- **Operations**: Document env vars, gates, DB changes
- **Risk Assessment**: Be honest (LOW/MEDIUM/HIGH)
- **Rollback**: Write actual steps, test on staging first
- **Verification**: Check all boxes before approving

### Step 3: Review
- [ ] No secrets in release notes
- [ ] All sections filled in
- [ ] Rollback procedure makes sense
- [ ] Template sections used (don't add custom sections)
- [ ] Tone is professional, factual, helpful

### Step 4: Publish
- Go to GitHub Releases
- Create new release from tag `vX.Y.Z`
- Paste completed template
- Click "Publish release"

---

## What NOT to Include

### ❌ Forbidden Content

- **Secrets**: API keys, tokens, passwords, database URLs
- **Speculation**: "should be", "might be", "expected to"
- **Promises**: "will support", "coming soon", "future roadmap"
- **Adjectives without proof**: "revolutionary", "game-changing", "massive"
- **Blame**: "finally fixed", "stupid bug", "took forever"
- **Internal politics**: Team names, blame, grievances

### ✅ Allowed Content

- **Facts**: "added X", "fixed bug #123", "improved Y from 50% to 60%"
- **Measurable**: "response time: 200ms → 100ms", "errors: 5% → 0.1%"
- **Actions**: "deploy", "restart batch job", "update env var"
- **Professional tone**: Clear, helpful, actionable

---

## Examples

### Example 1: PATCH Release (Bug Fix)

```markdown
# Release v1.2.4

**Release Date**: 2025-12-28  
**Release Type**: PATCH

## Overview

This release fixes a critical bug in probability calculation when trading volume is zero, affecting approximately 2% of daily analyses.

## Changes

### Fixed
- Fixed #789: NaN in probability calculation when volume = 0
- Fixed #790: memory leak in analysis cache

### Added
- None

### Changed
- None

### Removed
- None

## Operations

### Environment Variables
- None

### Feature Gates
- NEXT_PUBLIC_DISABLE_AUTOMATION: unchanged
- NEXT_PUBLIC_DISABLE_PRO_GATE: unchanged

### Scheduled Jobs
- batch:daily: running as usual
- batch:weekly: running as usual

### Database Changes
- None

## Risk Assessment

### Risk Level: LOW

### Reasoning
- Bug fix to non-critical path
- No code structure changes
- Rollback is immediate (no DB migration)
- Affects <2% of queries

## Rollback Procedure

### Quick Rollback (< 5 minutes)

If issue detected within 5 minutes:

```bash
# Option A: Promote previous version (fastest)
# In Vercel: Deployments → [v1.2.3] → Promote to Production

# Option B: Disable and fix
# Disable stock analysis: set NEXT_PUBLIC_DISABLE_STOCK=true
```

## Verification Checklist

- [x] Preflight checks passed
- [x] Build successful
- [x] Tag created: v1.2.4
- [x] Health checks passed
- [x] Manual smoke tests passed
- [x] No secrets in release notes
- [x] Rollback tested on staging

## Contributors

- @alice (bug fix)
- @bob (testing)

## Deployment Owner

**Deployed by**: Alice  
**Tested by**: Bob  
**Verified at**: 2025-12-28 10:30 UTC  
**Time to Deploy**: 8 min
```

### Example 2: MINOR Release (New Feature)

```markdown
# Release v1.3.0

**Release Date**: 2025-12-28  
**Release Type**: MINOR

## Overview

This release adds stock market analysis capability, bringing equities to feature parity with crypto analysis. Includes new `/api/analysis/stock/{symbol}` endpoint and weekly stock report generation.

## Changes

### Added
- Stock analysis API: `/api/analysis/stock/{symbol}`
- Stock analysis UI: new /analysis/stock page
- Weekly batch job: automated stock report generation
- Feature gate: NEXT_PUBLIC_DISABLE_STOCK (emergency shutdown)

### Changed
- Dashboard: added "Stock" tab alongside "Crypto"
- Menu: added link to Stock Analysis

### Fixed
- None

### Removed
- None

## Operations

### Environment Variables

#### New
- Name: `NEXT_PUBLIC_STOCK_ENABLED`
  - Type: boolean
  - Default: true
  - Required: No
  - Purpose: Toggle stock analysis feature

### Feature Gates
- NEXT_PUBLIC_DISABLE_STOCK: NEW (use if stock analysis broken)
- NEXT_PUBLIC_DISABLE_AUTOMATION: unchanged

### Database Changes

Migration required:
```sql
-- Add stock support to batch_analysis_results
ALTER TABLE batch_analysis_results ADD COLUMN asset_type VARCHAR(10) DEFAULT 'crypto';
CREATE INDEX idx_batch_asset_type ON batch_analysis_results(asset_type, symbol);
```

**Action**: Run `npm run db:migrate` before deploying

### Scheduled Jobs
- batch:daily: now analyzes stocks in addition to crypto
- batch:weekly: new weekly stock report generation

## Risk Assessment

### Risk Level: MEDIUM

### Reasoning
- New feature (stock analysis) may have edge cases in real-world usage
- Database migration required (easy to rollback)
- Affects all users but feature is optional
- Recommend 24-hour monitoring after deploy

## Rollback Procedure

### Quick Rollback (< 5 minutes)

If critical issue within 5 minutes:

```bash
# Option A: Disable stock feature
# In Vercel: Settings → Environment Variables
# Set: NEXT_PUBLIC_DISABLE_STOCK=true
# Redeploy (5 min)

# Option B: Promote previous version
# In Vercel: Deployments → [v1.2.4] → Promote to Production
```

### Full Rollback (10 minutes)

If migration broke data:

```bash
# 1. Disable stock feature immediately
export NEXT_PUBLIC_DISABLE_STOCK=true

# 2. Restore DB from backup
# In Supabase: Database → Backups → [pre-v1.3.0] → Restore

# 3. Promote v1.2.4
# In Vercel: Deployments → [v1.2.4] → Promote to Production

# 4. Verify data consistency
npm run healthcheck
```

## Verification Checklist

- [x] Preflight checks passed
- [x] Build successful
- [x] Tag created: v1.3.0
- [x] Database migration tested on staging
- [x] Health checks passed
- [x] Stock analysis manual testing passed
- [x] No secrets in release notes
- [x] Rollback tested on staging

## Contributors

- @charlie (stock analysis feature)
- @delta (UI/UX)
- @alice (batch job integration)

## Deployment Owner

**Deployed by**: Charlie  
**Tested by**: Alice & Delta  
**Verified at**: 2025-12-28 14:00 UTC  
**Time to Deploy**: 12 min
```

---

## Template Compliance Check

Before publishing release, verify:

- [ ] Follows format above (no custom sections)
- [ ] All required sections present
- [ ] Overview is 1-3 sentences, factual
- [ ] Changes list actual work (not intentions)
- [ ] Operations section documents every change
- [ ] Risk level is clearly stated with reasoning
- [ ] Rollback procedure is specific and tested
- [ ] Verification checklist is complete
- [ ] No secrets (keys, tokens, URLs)
- [ ] Professional tone throughout

---

**Status**: LOCKED (effective 2025-12-27)  
**Owner**: Release Manager  
**Questions?**: See RELEASE_VERSIONING.md

