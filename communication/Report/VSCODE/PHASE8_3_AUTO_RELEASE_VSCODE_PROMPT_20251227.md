# Phase 8.3: Auto Create GitHub Release on Valid Tag

**Date**: 2025-12-27  
**Phase**: 8.3 - Auto Create GitHub Release (CHANGELOG → Release Body)  
**Status**: PLANNING

---

## Problem Statement

**Current State**:
- Phase 8.2에서 tag validation gate 완료 (pass/fail)
- But: Validation PASS 후에도 GitHub Release는 수동으로 생성해야 함
- Result: 자동화 불완전 (사람이 복사/붙여넣기 해야 함)

**Impact**:
- Release body를 수동으로 작성 (휴먼 에러, 포맷 불일치)
- CHANGELOG와 GitHub Release 내용 분기
- 배포 프로세스 완전 자동화 불가능

**Goal**: **Validation PASS → 자동으로 GitHub Release 생성 (CHANGELOG → Release body)**

---

## Solution Design

### 1. Workflow Extension

**File**: `.github/workflows/release-validate.yml` (수정)

**Two Jobs**:

```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    outputs:
      passed: ${{ steps.validate.outcome == 'success' }}
    steps:
      - uses: actions/checkout@v4
      - name: Run Release Validation
        id: validate
        run: npm run validate:release

  create_release:
    needs: validate
    if: needs.validate.outputs.passed == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Extract Release Body from CHANGELOG
        run: npm run release:body
        env:
          GITHUB_REF: ${{ github.ref }}
      
      - name: Create GitHub Release
        run: gh release create $TAG \
          --title "$TAG" \
          --notes-file release_body.md \
          --draft
        env:
          TAG: ${{ github.ref_name }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Flow**:
```
Tag push (v1.2.3)
    ↓
Job 1: validate
    ├─ npm run validate:release
    └─ outputs.passed = true/false
    ↓
Job 2: create_release (if passed == true)
    ├─ npm run release:body → release_body.md
    └─ gh release create → GitHub Release (draft)
```

### 2. Release Body Script

**File**: `scripts/release_body_from_changelog.ts`

**Input**:
```
GITHUB_REF = refs/tags/v1.2.3
CHANGELOG.md (file)
```

**Process**:
```
1. Extract version from tag: v1.2.3 → 1.2.3
2. Find CHANGELOG section:
   ## [1.2.3] - 2025-12-27
   ### Added
   - Feature A
   
   ### Fixed
   - Bug #123
   
   ## [1.2.2] - 2025-12-20
   ↑ Stop here
   
3. Extract content between headers
4. Write to release_body.md
```

**Output**:
```markdown
## [1.2.3] - 2025-12-27

### Added
- Feature A

### Fixed
- Bug #123
```

**Validation**:
- Empty section → FAIL (don't create empty release)
- Missing section → FAIL (shouldn't happen if validation passed)
- Valid content → Success (write release_body.md)

### 3. GitHub Release Creation

**Method**: `gh release create` (GitHub CLI)

**Idempotency**:
```bash
# Check if release exists
if gh release view $TAG > /dev/null 2>&1; then
  echo "Release already exists"
  exit 0  # Success
fi

# Create if doesn't exist
gh release create $TAG --title "$TAG" --notes-file release_body.md --draft
```

**Options**:
- `--title`: Release tag (e.g., v1.2.3)
- `--notes-file`: release_body.md content
- `--draft`: Keep as draft (person reviews before publishing)
- `--prerelease`: (optional, if needed)

---

## Implementation Plan

### Step 1: Create Release Body Script
**File**: `scripts/release_body_from_changelog.ts`
- Extract version from GITHUB_REF
- Parse CHANGELOG.md
- Extract version section
- Write release_body.md
- Validate not empty

### Step 2: Extend Workflow
**File**: `.github/workflows/release-validate.yml`
- Add Job 2: create_release (needs: validate)
- Condition: only if Job 1 passed
- Run release:body script
- Run gh release create

### Step 3: Update Package.json
**Add**: `release:body` script

### Step 4: Update Documentation
**File**: `docs/DEPLOYMENT_RUNBOOK.md`
- Document validation → auto release flow
- Explain draft mode
- Explain failure scenarios

---

## Success Criteria

✅ Validation passes → Release created automatically  
✅ Validation fails → No release created  
✅ Release already exists → Idempotent (skip)  
✅ Release body = CHANGELOG section  
✅ Draft by default (not published)  
✅ Clear error messages if CHANGELOG section missing  
✅ GITHUB_TOKEN works without repo token leak  

---

## Ownership & Timeline

- **Owner**: CI/CD Engineer
- **Timeline**: 1 day

---

## Related Documents

- [Phase 8.2: Release Validation](../PHASE8_2_RELEASE_GATE_VSCODE_RESULT_20251227.md)
- [CHANGELOG.md](../../CHANGELOG.md)
