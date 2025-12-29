# Phase 8.2 Release Gate Messaging Compliance Review - PROMPT

**Date**: 2025-12-28
**Task**: Release Gate Messaging Compliance Review
**Order**: 3 / 4 (Parallel Execution)

---

## SSOT Reference

- Release validation messages: operational/policy guidance only
- Forbidden: exaggeration, solicitation, prediction, guarantee expressions
- Target audience: operators/developers (NOT end-users)

---

## Global Rules (Mandatory)

- NO code modifications
- Review output messages and documentation only
- Maintain operator/developer-oriented tone

---

## Execution Steps

1. Workflow failure output message review
2. RUNBOOK update message review
3. Forbidden expression detection
4. Final verdict: PASS / WARN / FAIL

---

## Target Files

| File | Type |
|------|------|
| `.github/workflows/release-validate.yml` | GitHub Actions Workflow |
| `scripts/release_validate.ts` | Validation Script |
| `docs/DEPLOYMENT_RUNBOOK.md` | Deployment Guide |
| `docs/RELEASE_VERSIONING.md` | Versioning Policy |
| `docs/RELEASE_NOTES_TEMPLATE.md` | Release Notes Template |

---

## Forbidden Expression Patterns

| Category | Examples |
|----------|----------|
| Exaggeration | "revolutionary", "massive", "incredible", "game-changing" |
| Solicitation | "you must try", "highly recommend" |
| Prediction | "will be", "might be", "should be", "expected to" |
| Guarantee | "guaranteed", "always works", "never fails" |

---

## Expected Output

- PROMPT record (this file)
- RESULT compliance report with verdict
