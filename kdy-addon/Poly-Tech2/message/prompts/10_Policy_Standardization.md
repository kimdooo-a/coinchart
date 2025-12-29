# Prompt 10: Policy Standardization

## Objective
Define the rules for how the library is deployed, embedded, and updated to prevent pollution of production builds.

## Instructions
1.  **Draft `BUILD_EXCLUSION_POLICY.md`**:
    - Define `.npmignore` / `.gitignore` rules.
    - Mandate that `kdy-addon` is dev-only.
2.  **Draft `PROJECT_EMBEDDING_POLICY.md`**:
    - Standardize the path: `[Project]/kdy-addon/Poly-Tech2`.
3.  **Draft `LIBRARY_DISTRIBUTION_POLICY.md`**:
    - Define "Core vs Overlay".
    - Core (`00`, `10`) is Read-Only.
    - Overlay (`20`, `50`) is Writable.
4.  **Create Checklists**:
    - `PROJECT_SETUP_CHECKLIST.md`
    - `PROJECT_UPDATE_CHECKLIST.md`
5.  **Location**: Place policies in `20_REGULATIONS` and checklists in `50_TEMPLATES`.
