# Runtime Rules Configuration

This directory contains the Active Execution Rules for the Poly-Tech2 Orchestrator.

## Active Rule Set
**File**: `rules.v0.1.yaml`
**DSL Version**: 0.1 (See `docs/10_LAWS/RULE_DSL.md`)

## How to Apply
The Orchestrator Watcher loads these rules at startup.

```bash
# Example (Stub)
python runtime/orchestrator_stub.py --rules runtime/rules/rules.v0.1.yaml
```

## Rule Summary

| ID | Description | Phase |
| :--- | :--- | :--- |
| **R1** | **Bootstrap Guard**: Prevents bootstrap actions outside Phase 0. | 1-4 |
| **R2** | **Lint TS**: Auto-lints `src/` and `app/` changes. | 2 |
| **R3** | **Test Spec**: Auto-runs tests on spec changes. | 2 |
| **R4** | **Approval Guard**: Blocks Category B/C execution without approval. | * |
| **R4a**| **Approved Exec**: Executes Category B/C if approved. | * |
| **R5** | **Emergency D**: Immediate execution with retroactive approval. | * |

## Locking Strategy
*   All execution rules utilize `write_processing_lock` to prevent race conditions.
*   Lock keys are derived from the target path or message ID (e.g., `lint_{slug}`).
