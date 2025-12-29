# Prompt 13: Compliance Design

## Objective
Create a self-validating mechanism to ensure the library's integrity is maintained after embedding.

## Instructions
1.  **Design `compliance_check.py`**:
    - Define a `REQUIRED_STRUCTURE` dictionary (Path -> Type).
    - Implement a scanner that verifies existence of `00_CONSTITUTION`, `10_LAWS`, etc.
    - Exit Code 0 = Pass, 1 = Fail.
2.  **Draft `compliance_checklist.md`**:
    - Manual review steps for Policy Adherence (e.g., "Is `kdy-addon` ignored?").
3.  **Location**: `70_AUTOMATION/compliance`.
