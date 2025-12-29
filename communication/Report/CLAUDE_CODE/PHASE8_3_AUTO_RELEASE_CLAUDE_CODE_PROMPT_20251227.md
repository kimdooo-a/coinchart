# Phase 8.3 Release Body Compliance Review (CHANGELOG → Release Notes) - PROMPT

**Date**: 2025-12-28
**Task**: Release Body Compliance Review
**Order**: 3 / 4 (Parallel Execution)

---

## SSOT Reference

- Release body is based on CHANGELOG's factual/change logs
- Forbidden: exaggeration, solicitation, prediction, guarantee expressions
- Target audience: operators/developers

---

## Global Rules (Mandatory)

- NO code modifications
- Review text/templates/output messages only

---

## Execution Steps

1. Check if "forbidden expressions" can enter release body construction
2. Verify workflow success/failure messages are guidance-only (no exaggeration)
3. If improvements recommended: WARN; if mandatory fixes needed: FAIL

---

## Target Files

| File | Type | Purpose |
|------|------|---------|
| `CHANGELOG.md` | Source Document | Release notes source |
| `scripts/release_body_from_changelog.ts` | Script | Extract release body |
| `.github/workflows/release-validate.yml` | Workflow | Auto-create GitHub Release |

---

## Forbidden Expression Patterns

| Category | Examples |
|----------|----------|
| Exaggeration | "revolutionary", "massive", "incredible", "game-changing" |
| Solicitation | "you must try", "highly recommend" |
| Prediction | "will be", "might be", "should be", "expected to" |
| Guarantee | "guaranteed", "always works", "never fails" |

---

## Data Flow Analysis

```
CHANGELOG.md
    ↓
release_body_from_changelog.ts (extract version section)
    ↓
release_body.md
    ↓
gh release create --notes-file release_body.md
    ↓
GitHub Release Page
```

**Risk Point**: If CHANGELOG.md contains forbidden expressions, they flow to GitHub Release.

---

## Expected Output

- PROMPT record (this file)
- RESULT: PASS/WARN/FAIL with before/after suggestions (text only)
