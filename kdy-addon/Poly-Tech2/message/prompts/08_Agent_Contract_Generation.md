# Prompt 08: Agent Contract Generation

## Objective
Create specific behavioral contracts for each AI agent to ensure they adhere to the Poly-Tech2 Constitution.

## Input Context
- `00_CONSTITUTION/ROLES_AND_POWERS.md`
- `10_LAWS/L10_ROUTING_ACT.md`
- `10_LAWS/L20_LOCK_GOVERNANCE_ACT.md`

## Instructions
1.  **Analyze Roles**: Identify the specific constraints for "Operator" (Claude) and "Interface" (Cursor).
2.  **Draft `CLAUDE.md`**:
    - Mandate Batch Operations.
    - Enforce "Acquire Lock -> Write -> Release Lock".
    - Forbid purely aesthetic changes unless requested.
3.  **Draft `.cursorrules`**:
    - Mandate Latency < 1s (Human Supremacy).
    - Warn user if editing a locked file.
4.  **Draft `rules.md`**:
    - Generic entry point for unknown agents.
5.  **Location**: Place all in `80_RUNTIME_CONTRACTS`.
