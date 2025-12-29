# Phase 8.1: Release Tag Rules (vX.Y.Z) + Release Notes Template

**Date**: 2025-12-27  
**Phase**: 8.1 - Release Versioning & Notes Template Lock-in  
**Status**: PLANNING

---

## Problem Statement

**Current State**:
- Phase 8에서 배포 게이트(preflight, healthcheck, gates) 구축 완료
- But: 릴리즈 버전 규칙 없음 (ad-hoc tagging, 불일치하는 릴리즈 노트)
- Result: 배포/롤백/트러블슈팅을 "릴리즈 단위"로 추적 불가능

**Impact**:
- 버전 충돌 (v1.2, v1.2.0, 1.2.0 혼용)
- 릴리즈 노트 형식 불일치 (일부는 자세함, 일부는 부실)
- 롤백 시 어느 버전으로 돌아갈지 불명확
- 자동화 어려움 (CI/CD에서 버전 파싱 실패)

---

## Solution Design

### 1. Release Versioning Policy

**SemVer Format**: `vX.Y.Z`

| Type | Increment | Example | Trigger |
|------|-----------|---------|---------|
| MAJOR | X | v0.1.0 → v1.0.0 | Breaking API change, DB schema change |
| MINOR | Y | v1.0.0 → v1.1.0 | New feature (backward compatible) |
| PATCH | Z | v1.1.0 → v1.1.1 | Bug fix, doc update, operational improvement |

**Rules**:
- Only `vX.Y.Z` format is valid (no `v1.2.0-alpha`, no `1.2.0`, no `v1.2`)
- Tags must be signed (GPG recommended)
- Each tag must have corresponding GitHub Release
- Release notes must follow template

### 2. Release Notes Template (Fixed Sections)

**Template Structure**:
```markdown
# Release v1.2.3

## Overview
[1-3 sentences: What's the big idea?]

## Changes

### Added
- Feature A
- Feature B

### Changed
- Updated X
- Modified Y

### Fixed
- Bug #123
- Crash when Z

### Removed (if any)
- Deprecated feature

## Operations

### Environment Variables
- New: `NEXT_PUBLIC_FEATURE_X` (optional/required)
- Changed: `NEXT_PUBLIC_CACHE_TTL` (30s → 60s)
- Removed: `OLD_FEATURE_FLAG`

### Feature Gates
- `DISABLE_AUTOMATION`: unchanged
- `DISABLE_PRO_GATE`: unchanged

### Scheduled Jobs
- `batch:daily`: running (no changes)
- `batch:weekly`: running (no changes)

### Database Migrations
- (none) OR
- Run: `npm run db:migrate` before deploying

## Risk Assessment & Rollback

### Risk Level: LOW / MEDIUM / HIGH

### Rollback Procedure
```bash
# If issue detected within 5 minutes:
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3
npm run rollback v1.2.2  # or manual revert
```

### Emergency Flags (if needed)
- Set `NEXT_PUBLIC_DISABLE_AUTOMATION=true` to kill batch jobs
- Set `NEXT_PUBLIC_DISABLE_PRO_GATE=true` to emergency unlock

### Kill Switch
- Flag: (name) / Value: (value)
- If issue: set flag immediately in Vercel → redeploy (5 min)

## Verification Checklist

- [ ] Preflight checks passed: `npm run preflight`
- [ ] Build successful: `npm run build`
- [ ] Tag created: `git tag vX.Y.Z`
- [ ] GitHub Release published (this doc)
- [ ] Health checks passed: `npm run healthcheck`
- [ ] No secrets in release notes
- [ ] Rollback procedure documented and tested

## Related Issues & PRs
- Closes #123 (Feature X)
- Fixes #456 (Bug Y)
- References PR #789

## Contributors
- @team-member-1
- @team-member-2

---
**Deployment Owner**: [Name]  
**Tested By**: [Name]  
**Verified At**: [Date/Time]
```

### 3. CHANGELOG.md (Keep a Changelog Format)

**Structure**:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- (pending changes)

### Changed
- (pending changes)

## [v1.2.3] - 2025-12-27

### Added
- New feature X

### Fixed
- Bug #123

## [v1.2.2] - 2025-12-20

### Fixed
- Critical API issue
```

### 4. Release Checklist Integration (in DEPLOYMENT_RUNBOOK.md)

Add to "Pre-Deployment Checklist":

```markdown
## Release Validation (vX.Y.Z)

- [ ] Version number follows SemVer (vX.Y.Z only)
- [ ] Release notes use template (see RELEASE_NOTES_TEMPLATE.md)
- [ ] CHANGELOG.md updated
- [ ] No secrets in release notes
- [ ] Rollback procedure documented
- [ ] Risk level assessed (LOW/MEDIUM/HIGH)
```

---

## Implementation Plan

### Step 1: Create RELEASE_VERSIONING.md
- Document SemVer rules
- Version bump triggers
- Tag naming conventions
- Git workflow

### Step 2: Create RELEASE_NOTES_TEMPLATE.md
- Lock-in template sections
- Examples for each section
- What NOT to include (secrets, speculation)
- Checklist for release author

### Step 3: Create/Update CHANGELOG.md
- Format: Keep a Changelog
- [Unreleased] section
- Historical entries (if exist)
- Instructions for maintainers

### Step 4: Update DEPLOYMENT_RUNBOOK.md
- Add "Release Step" section
- Link to RELEASE_VERSIONING.md
- Link to RELEASE_NOTES_TEMPLATE.md
- Include full checklist

### Step 5: Create Release Script (Optional)
- `scripts/create-release.ts`
- Validates version format
- Auto-generates release checklist
- Creates git tag with message

---

## Success Criteria

✅ All release tags are `vX.Y.Z` format  
✅ Each tag has GitHub Release with template-based notes  
✅ CHANGELOG.md is up-to-date  
✅ Release notes include risk assessment & rollback procedure  
✅ Team can quickly answer: "Which version has feature X?"  
✅ Rollback decision is fast: "Revert to vX.Y.Z"  
✅ No secrets leaked in release notes  
✅ CI/CD can parse version from tag  

---

## Ownership & Timeline

- **Owner**: [Release Manager / DevOps]
- **Review**: Engineering team
- **Enforcement**: CI/CD checks (optional)
- **Timeline**: 1 day

---

## Related Documents

- [Phase 8: Deployment Readiness](../PHASE8_DEPLOY_VSCODE_RESULT_20251227.md)
- [DEPLOYMENT_RUNBOOK.md](../docs/DEPLOYMENT_RUNBOOK.md)
- [RELEASE_VERSIONING.md](../docs/RELEASE_VERSIONING.md) (to create)
- [RELEASE_NOTES_TEMPLATE.md](../docs/RELEASE_NOTES_TEMPLATE.md) (to create)
- [CHANGELOG.md](../CHANGELOG.md) (to create)

