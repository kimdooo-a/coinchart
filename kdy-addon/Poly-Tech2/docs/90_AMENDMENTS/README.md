# 🗳️ AMENDMENT PROTOCOL

## Purpose
This directory (`docs/90_AMENDMENTS`) stores all **Constitutional Overrides** and **Amendments** issued by the Human User.

Because the Constitution is **Immutable by Agents**, any deviation or permanent change to the core rules (`00_CONSTITUTION/*`) must be recorded here.

---

## Amendment Lifecycle

1.  **Issue**: Human User defines an override or change.
2.  **Record**: An amendment file is created in this directory.
3.  **Enforce**: Antigravity reads this directory as the **Supreme Layer**, overriding conflicting rules in lower layers.
4.  **Promote (Optional)**: If an amendment becomes permanent law, the Human may manually merge it into the Constitution.

---

## File Naming Convention

Format: `ID_Title.md`
Example: `A001_Allow_Direct_Commits.md`

*   **ID**: `A` + 3-digit sequence (e.g., A001, A002).
*   **Title**: Short description of the change.

---

## Amendment Template

```markdown
# Amendment A[XXX]: [Title]

**Status**: Active / Expired / Promoted
**Date**: YYYY-MM-DD
**Target**: [File being overridden, e.g., SAFETY.md]

## Context
[Why is this amendment necessary?]

## The Amendment
[Exact text or rule that overrides the previous law]

## Expiry (Optional)
[If this is temporary, state the end condition or date]
```

---

## Scope of Authority
Amendments in this folder have **Absolute Supremacy** over:
1.  `docs/00_CONSTITUTION`
2.  `docs/10_LAWS`
3.  `docs/20_REGULATIONS`
