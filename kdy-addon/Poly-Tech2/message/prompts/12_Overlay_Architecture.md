# Prompt 12: Overlay Architecture

## Objective
Design a mechanism for projects to customize the library without creating fork drift.

## Instructions
1.  **Draft `OVERLAY_POLICY.md`**:
    - Rule: "Core is Immutable."
    - Rule: "Customizations live in `kdy-addon/overlay`."
    - Precedence: Overlay Extensions > Core Defaults.
2.  **Create Template Structure**:
    - `50_TEMPLATES/overlay/` mirroring the root structure.
3.  **Create Examples**:
    - `PROJECT_OVERRIDES.example.md` showing a `rules.yaml` extension.
4.  **Location**: `20_REGULATIONS` and `50_TEMPLATES`.
