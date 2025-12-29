# Release Versioning Policy

**Version**: 1.0  
**Last Updated**: 2025-12-27  
**Status**: Active

---

## Overview

This document establishes the versioning scheme, release process, and tag management for deployments to production.

**Purpose**: Ensure consistent, traceable releases that support rapid deployment, rollback, and incident response.

---

## Semantic Versioning (SemVer)

All releases follow **Semantic Versioning 2.0.0** format: `vX.Y.Z`

### Version Components

```
vX.Y.Z
 │ │ └─ PATCH: Bug fixes, documentation, operational improvements
 │ └─── MINOR: New features, backward compatible changes
 └───── MAJOR: Breaking changes, API incompatibilities
```

### When to Increment

| Increment | Trigger | Example | Notes |
|-----------|---------|---------|-------|
| **MAJOR** | Breaking change to API, DB schema, or data flow | v0.9.0 → v1.0.0 | Affects users or dependent systems |
| **MINOR** | New feature, new gate, new endpoint (backward compatible) | v1.2.0 → v1.3.0 | Old code still works |
| **PATCH** | Bug fix, documentation update, operational improvement | v1.2.3 → v1.2.4 | No external API changes |
| **PATCH** | Feature gate addition (runtime, no deployment impact) | v1.2.3 → v1.2.4 | Non-breaking |

### Examples

| Version | Reason | Type |
|---------|--------|------|
| v1.0.0 | Initial production release | MAJOR |
| v1.1.0 | Add crypto alert analysis | MINOR |
| v1.1.1 | Fix probability calculation bug | PATCH |
| v1.2.0 | Add stock analysis feature | MINOR |
| v1.2.1 | Update documentation, no code change | PATCH |
| v2.0.0 | Change DB schema (breaking) | MAJOR |

---

## Tag Naming Convention

### Valid Formats

```
✅ v1.0.0
✅ v1.2.3
✅ v2.0.0-rc.1  (pre-release, if needed)
✅ v1.0.0-beta  (pre-release, if needed)
```

### Invalid Formats

```
❌ 1.0.0        (missing 'v')
❌ v1.0         (incomplete)
❌ v1.0.0-a     (unclear pre-release)
❌ Version1.0   (not SemVer)
❌ latest       (not version-specific)
❌ stable       (not version-specific)
```

---

## Release Workflow

### Pre-Release

1. **Code Changes**
   ```bash
   # Work on feature branch
   git checkout -b feature/new-feature
   
   # Make changes, commit
   git add .
   git commit -m "Add new feature"
   ```

2. **Update CHANGELOG.md**
   ```markdown
   ## [Unreleased]
   
   ### Added
   - New feature description
   
   ### Fixed
   - Bug #123 fix
   ```

3. **Determine Version Bump**
   - Discuss with team
   - Review commit messages and PRs
   - Decide: MAJOR, MINOR, or PATCH?

4. **Create Release Branch**
   ```bash
   # From main
   git checkout main
   git pull origin main
   git checkout -b release/v1.2.3
   ```

### Release Preparation

5. **Update CHANGELOG.md** (Finalize)
   ```markdown
   ## [v1.2.3] - 2025-12-27
   
   ### Added
   - Feature X
   
   ### Fixed
   - Bug #123
   ```

6. **Update package.json version** (Optional)
   ```json
   {
     "version": "1.2.3"
   }
   ```

7. **Create Release Notes** (Using template)
   - See RELEASE_NOTES_TEMPLATE.md
   - Document risk level
   - Document rollback procedure

### Release Creation

8. **Create Git Tag**
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z: <short description>"
   # Or with signed commit
   git tag -s vX.Y.Z -m "Release vX.Y.Z: <short description>"
   ```

9. **Push to GitHub**
   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

10. **Create GitHub Release**
    - Go to GitHub → Releases → "Draft a new release"
    - Select tag: `vX.Y.Z`
    - Title: `Release vX.Y.Z`
    - Description: Use release notes template (see RELEASE_NOTES_TEMPLATE.md)
    - Include: Overview, Changes, Operations, Risk, Verification

### Post-Release

11. **Verify Deployment**
    ```bash
    npm run preflight
    npm run healthcheck
    ```

12. **Monitor**
    - Check error logs (first 10 minutes)
    - Check batch job execution (if enabled)
    - Monitor API response times

13. **Notify Team**
    - Post release summary in Slack
    - Pin release notes in relevant channels
    - Update status page (if applicable)

---

## Version History Tracking

### Current Release Line

```
Production: vX.Y.Z (stable)
Staging: vX.Y.(Z+1) or newer (testing)
Development: main branch (daily builds)
```

### Tracking Release Metadata

Each release should be tracked with:

```
Release Date
Version Number
Features Added / Changed / Fixed
Bugs Resolved
Database Changes
Feature Flags Added/Removed
Risk Level (LOW / MEDIUM / HIGH)
Rollback Status (tested or untested)
```

---

## Rollback Procedures by Version Change

### PATCH Release Rollback (v1.2.3 → v1.2.2)

**Time**: ~5 minutes  
**Risk**: Low (same code, just bug fix)

```bash
# Option 1: Revert in Vercel Dashboard (fastest)
Vercel → Deployments → [v1.2.2] → Promote to Production

# Option 2: Git revert
git revert vX.Y.Z
git push origin main
```

### MINOR Release Rollback (v1.3.0 → v1.2.Z)

**Time**: ~10 minutes  
**Risk**: Medium (feature removal may affect users)

```bash
# 1. Verify rollback procedure in release notes
# 2. Disable feature gates (if applicable)
export NEXT_PUBLIC_DISABLE_NEW_FEATURE=true

# 3. Promote previous deployment
Vercel → Deployments → [v1.2.Z] → Promote to Production

# 4. Communicate with users (feature temporarily disabled)
```

### MAJOR Release Rollback (v2.0.0 → v1.9.Z)

**Time**: ~15 minutes  
**Risk**: High (significant changes, user impact)

**Before deploying v2.0.0**:
- [ ] Test rollback to v1.9.Z on staging
- [ ] Document all database changes
- [ ] Have rollback plan documented in release notes
- [ ] Get stakeholder approval

**During MAJOR rollback**:
1. Disable critical features (gates)
2. Promote previous version
3. Monitor for data consistency issues
4. Notify all stakeholders
5. Document incident

---

## Pre-Release Validation

Before creating a tag, verify:

```bash
# 1. Version format
echo "vX.Y.Z" | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' || echo "INVALID FORMAT"

# 2. No duplicate tags
git tag | grep vX.Y.Z || echo "OK - tag does not exist"

# 3. CHANGELOG updated
grep "## \[vX.Y.Z\]" CHANGELOG.md || echo "MISSING CHANGELOG ENTRY"

# 4. Release notes template used
# (Manual check - see RELEASE_NOTES_TEMPLATE.md)

# 5. All tests passing
npm run preflight
npm run build
```

---

## Breaking Change Detection

### What Counts as MAJOR (Breaking)

1. **API Changes**
   - Remove or rename API endpoint
   - Change response format
   - Change authentication method

2. **Database Changes**
   - Alter primary key
   - Remove column (data loss)
   - Change data type (incompatible)

3. **Feature Gates**
   - Remove gate that users depend on
   - Change gate behavior significantly

4. **Data Flow**
   - Change how analysis results are calculated
   - Change ranking algorithm
   - Remove data source

### What Does NOT Count as Breaking

- Add new column to table
- Add new optional parameter
- Improve performance (same API)
- Bug fix (unless it changes API behavior)
- Add new feature gate
- Update documentation

---

## Release Cadence

### Recommended Schedule

| Release Type | Frequency | Example |
|--------------|-----------|---------|
| PATCH | Weekly or as needed | Bug fixes, doc updates |
| MINOR | Bi-weekly to monthly | New features |
| MAJOR | Quarterly or as needed | Significant rewrite |

### Actual Schedule

- **Development**: Continuous (main branch)
- **Staging**: Daily builds (from main)
- **Production**: Weekly or ad-hoc (tagged releases)

---

## Version Numbering Rules

### Starting Version

**v1.0.0** = first production release

- Before: Use dev/staging/pre-release tags if needed
- v0.x.y = pre-release development versions (if used)

### Incrementing Rules

1. **Always increment from the current version**
   ```
   Current: v1.2.3
   Next PATCH: v1.2.4 (not v1.2.5)
   Next MINOR: v1.3.0 (reset PATCH to 0)
   Next MAJOR: v2.0.0 (reset MINOR and PATCH to 0)
   ```

2. **Never skip numbers**
   ```
   ✅ v1.0.0 → v1.0.1 → v1.1.0 → v1.1.1
   ❌ v1.0.0 → v1.0.2 (skip v1.0.1)
   ❌ v1.0.0 → v1.2.0 (skip v1.1.0)
   ```

3. **No side-by-side versions**
   ```
   ✅ v1.0.0 is production, v1.0.1 is next candidate
   ❌ v1.0.0 and v1.0.1 both in production
   ```

---

## Hotfix Releases

### Hotfix Process (Emergency PATCH)

**Trigger**: Critical bug in production, needs immediate fix

**Steps**:
```bash
# 1. Create hotfix branch from production tag
git checkout vX.Y.Z
git checkout -b hotfix/critical-bug

# 2. Fix the bug
# (make minimal changes only)

# 3. Increment PATCH version
# v1.2.3 → v1.2.4

# 4. Update CHANGELOG and release notes

# 5. Tag and deploy
git tag -a v1.2.4 -m "Hotfix: critical bug"
git push origin main v1.2.4

# 6. Verify
npm run healthcheck
```

**Key Rules**:
- Hotfix is a PATCH increment
- Change only what's necessary (no new features)
- Deploy directly from hotfix branch
- Merge back to main after deployment

---

## Documentation & Communication

### What to Document

For each release:
- [ ] Version number (vX.Y.Z)
- [ ] Release date
- [ ] Features added/changed/fixed
- [ ] Database changes (if any)
- [ ] Feature gates (new/changed/removed)
- [ ] Risk level assessment
- [ ] Rollback procedure
- [ ] Verification checklist

### Communication Template

```
🚀 Release vX.Y.Z

Overview: [What's the big idea?]

Changes: [What changed?]
- Added: Feature A, Feature B
- Fixed: Bug #123
- Changed: Performance improvement

Operations: [What needs to be done?]
- Environment: [any new env vars?]
- Gates: [changes to feature gates?]
- DB: [any migrations?]

Risk: [LOW/MEDIUM/HIGH] because [reason]

Rollback: [If issue: git tag -d vX.Y.Z && promote vX.Y.(Z-1)]

Questions? See: [link to release notes]
```

---

## Tools & Automation

### Manual Release (Recommended for Now)

```bash
# Check current version
git tag -l | tail -5

# Create release branch
git checkout -b release/vX.Y.Z

# Update CHANGELOG and docs

# Create tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"

# Push
git push origin main vX.Y.Z

# GitHub: Create release from tag (manual)
```

### Semi-Automated (Future)

Future: Create `scripts/create-release.ts` to:
1. Validate version format
2. Check CHANGELOG updated
3. Generate release notes template
4. Create git tag
5. Print deployment checklist

### Full Automation (Future)

Future: GitHub Actions workflow to:
1. Validate version format on tag push
2. Check release notes template compliance
3. Auto-merge to main (if test pass)
4. Trigger deployment

---

## Compliance & Enforcement

### Manual Enforcement (Current)

- [ ] Team lead reviews release before tagging
- [ ] Release notes must follow template
- [ ] CHANGELOG must be updated
- [ ] No secrets in release notes

### Automated Enforcement (Future)

- CI/CD: Validate tag format on push
- CI/CD: Reject releases with invalid version
- CI/CD: Block if CHANGELOG not updated
- Pre-commit hook: Prevent secret commits

---

## FAQ

**Q: Can I use pre-release versions like v1.0.0-beta?**  
A: Yes, but only for staging/development. Production should always be `vX.Y.Z` (release version).

**Q: What if I need to release two features but one is urgent?**  
A: Release the urgent one first (PATCH or MINOR), then the other. Don't batch unrelated changes.

**Q: Can I rollback to v1.0.0 from v1.2.3?**  
A: Yes, but it's a MAJOR rollback. Verify procedure in release notes. May need DB migration.

**Q: Who decides MAJOR vs MINOR vs PATCH?**  
A: Team consensus. Use SemVer definition as guide. When in doubt, ask.

**Q: How long should I keep old releases?**  
A: At least 3 previous releases ready for rollback. Archive older ones.

---

## Related Documents

- [RELEASE_NOTES_TEMPLATE.md](RELEASE_NOTES_TEMPLATE.md) - Release notes template (locked in)
- [CHANGELOG.md](../CHANGELOG.md) - Full changelog (Keep a Changelog format)
- [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) - Deployment procedures (includes Release step)
- [Phase 8: Deployment Readiness](../PHASE8_DEPLOY_VSCODE_RESULT_20251227.md)

---

**Owner**: DevOps / Release Manager  
**Last Review**: 2025-12-27  
**Next Review**: 2025-01-31

