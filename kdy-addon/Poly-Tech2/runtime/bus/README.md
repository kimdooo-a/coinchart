# Runtime Bus Protocol

> [!IMPORTANT]
> **Status**: The contents of `runtime/bus` constitute **Evidence of Execution**, NOT "Governance Truth".
> As per **CONSTITUTION Appendix A**, these files are audit logs of what *happened*, not necessarily what was *law*. True Governance resides in `docs/00_CONSTITUTION` and `SHARED_CONTEXT.md`.

## 1. Channel Structure

The bus is strictly organized by processing stage:

*   **`input/`**: Ingress point for Commands and Requests. Agents write here.
*   **`processing/`**: Active state. The Orchestrator locks files here while working.
*   **`output/`**: Success Evidence. JSON files confirming successful actions.
*   **`error/`**: Failure Evidence. JSON files detailing exceptions or rule blocks.

## 2. Message Schema v0.1

All JSON messages in `input/` must adhere to this structure:

```json
{
  "msg_id": "UUID-OR-READABLE-ID",
  "category": "A | B | C | D",
  "msg_type": "COMMAND",   // Fixed for input
  "command_type": "exec | task",
  "title": "Short Description",
  "run": [
    "npm run build",
    "echo 'Hello'"
  ],
  "context": {
    "phase": 2,
    "requested_by": "agent_name"
  },
  "timestamp": "ISO-8601"
}
```

## 3. Rule DSL Execution Logic

The Orchestrator processes messages against `rules.v0.1.yaml` in this exact order:

1.  **Trigger**: Matches `command_type` and event source.
2.  **Guards**: Checks `phase`, `category`, and `approval` state.
    *   *If a Guard fails (e.g., Phase mismatch), the Rule is skipped.*
    *   *If an Approval Guard blocks (e.g., Category B but no approval), execution halts or requests approval.*
3.  **Actions**: Executed sequentially if Trigger and Guards pass.

### Template Rendering Pipeline
Secure command execution follows this pipeline:

1.  **Render**: `{{msg_run_0}}` and variables are replaced in the template string.
2.  **Validate**: The *rendered* string is checked against the Allowlist (e.g., must start with `npm`, `echo`).
3.  **Execute**:
    *   **Live Mode**: Passed to `subprocess.run`.
    *   **Dry-Run Mode**: Logged as "Would execute" evidence.

## 4. Sandbox Precedence

*   **`runtime/_sandbox/bus`**: The testing ground.
*   **Priority**: All verification and dry-runs MUST target the Sandbox first.
*   **Production**: Do not write to the root `runtime/bus` unless the Orchestrator is running in Live Mode and the change is verified.
