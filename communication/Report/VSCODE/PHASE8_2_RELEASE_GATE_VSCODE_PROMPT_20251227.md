# Phase 8.2: GitHub Actions Release Validation Gate

**Date**: 2025-12-27  
**Phase**: 8.2 - GitHub Actions Release Validation Gate  
**Status**: PLANNING

---

## Problem Statement

**Current State**:
- Phase 8.1에서 릴리즈 규칙 (vX.Y.Z, CHANGELOG, Template) 정의 완료
- But: 규칙을 "강제하는" 자동화 없음
- Result: 개발자가 규칙을 무시해도 태그가 push됨 → 잘못된 릴리즈 가능

**Impact**:
- 불완전한 릴리즈 노트 (템플릿 섹션 누락)
- CHANGELOG 미업데이트 (버전 추적 불가능)
- 잘못된 태그 포맷 (v1.0, 1.0.0 등)
- 수동 검증 필요 (자동화 안 됨)
- 배포 후 롤백해야 할 수도 있음

**Goal**: **태그가 push되면 자동으로 검증하고, 위반 시 workflow를 실패시켜 배포/릴리즈를 차단한다.**

---

## Solution Design

### 1. GitHub Actions Workflow

**File**: `.github/workflows/release-validate.yml`

**Trigger**: Push to `v*.*.*` tags

```yaml
name: Release Validation Gate

on:
  push:
    tags:
      - 'v*.*.*'  # Only release tags

jobs:
  validate-release:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for changelog check
      
      - name: Validate Release
        run: npx ts-node scripts/release_validate.ts
```

**Expected Behavior**:
- ✅ Tag 푸시 → Workflow 트리거
- ✅ Validation script 실행
- ✅ 검증 성공 → Workflow ✅ (배포 진행)
- ❌ 검증 실패 → Workflow ❌ (배포 차단, GitHub Release 생성 불가)

### 2. Release Validation Script

**File**: `scripts/release_validate.ts`

**Language**: TypeScript (ts-node로 실행)

**Checks** (3개):

#### A) Tag Format Validation
```
Input: GITHUB_REF = "refs/tags/v1.2.3"
Extract: v1.2.3
Check: 정규식 /^v\d+\.\d+\.\d+$/ 일치?
✅ Pass: v1.0.0, v1.2.3, v2.0.0
❌ Fail: v1.0, 1.0.0, v1.0.0-alpha, v1.2.3a
```

#### B) CHANGELOG Validation
```
Check:
1. CHANGELOG.md 존재?
2. [Unreleased] 섹션 존재?
3. [vX.Y.Z] 또는 ## [X.Y.Z] 헤더 존재? (정확히 이번 릴리즈 버전)

✅ Pass:
  ## [Unreleased]
  ## [1.2.3] - 2025-12-28
  
❌ Fail:
  - CHANGELOG.md 파일 없음
  - [Unreleased] 섹션 없음
  - ## [1.2.3] 섹션 누락
```

#### C) Release Notes Template Validation
```
Check:
1. docs/RELEASE_NOTES_TEMPLATE.md 존재?
2. 필수 섹션 헤더 모두 존재?
   - Overview
   - Changes
   - Operations (or Ops)
   - Risk & Rollback (or Rollback)
   - Verification

✅ Pass: 모든 섹션 헤더 있음
❌ Fail: 하나라도 없음
```

### 3. Output Message Format

**Success**:
```
[PASS] Release vX.Y.Z validation passed ✅
- Tag format: vX.Y.Z ✅
- CHANGELOG entry: [X.Y.Z] ✅
- Release template: Complete ✅

Ready to deploy!
```

**Failure**:
```
[FAIL] Release vX.Y.Z validation failed ❌

Reason: CHANGELOG.md missing [1.2.3] entry

Fix: Add to CHANGELOG.md:
## [1.2.3] - YYYY-MM-DD
### Added
- ...
### Fixed
- ...

See: docs/RELEASE_VERSIONING.md for details
```

### 4. Exit Codes

```
0: Validation passed → Workflow continues
1: Validation failed → Workflow stops
```

---

## Implementation Plan

### Step 1: Create GitHub Actions Workflow
**File**: `.github/workflows/release-validate.yml`
- Trigger on tag push
- Run validation script
- Report results

### Step 2: Create Validation Script
**File**: `scripts/release_validate.ts`
- Extract tag from GITHUB_REF
- Check tag format (SemVer)
- Check CHANGELOG.md
- Check template sections
- Exit with code 0 or 1

### Step 3: Update Documentation
**File**: `docs/DEPLOYMENT_RUNBOOK.md`
- Add "Release Gate" section
- Link to workflow
- Explain failure scenarios

### Step 4: Test Cases (Documented)
- ✅ Valid release (v1.2.3 with complete CHANGELOG + template)
- ❌ Invalid tag (v1.2, 1.2.3, v1.2.3a)
- ❌ Missing CHANGELOG entry
- ❌ Missing template sections

---

## Success Criteria

✅ Tag push automatically triggers validation  
✅ Invalid tag format = workflow fails  
✅ Missing CHANGELOG entry = workflow fails  
✅ Incomplete template = workflow fails  
✅ Clear error messages (how to fix)  
✅ Valid release = workflow passes → deployment proceeds  
✅ GitHub Release creation only after validation  

---

## Ownership & Timeline

- **Owner**: CI/CD Engineer
- **Review**: Engineering team
- **Testing**: Test on staging tags first
- **Timeline**: 1 day

---

## Related Documents

- [Phase 8.1: Release Versioning](../PHASE8_1_RELEASE_VSCODE_RESULT_20251227.md)
- [RELEASE_VERSIONING.md](../../docs/RELEASE_VERSIONING.md)
- [RELEASE_NOTES_TEMPLATE.md](../../docs/RELEASE_NOTES_TEMPLATE.md)
- [CHANGELOG.md](../../CHANGELOG.md)
