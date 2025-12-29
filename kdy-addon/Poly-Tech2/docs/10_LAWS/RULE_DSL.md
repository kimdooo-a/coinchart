# LAW: RULE_DSL

**ID**: L-10-DSL
**Version**: 0.1
**Status**: Active Draft

## 1. Scope
*   **Watcher Role**: Local filesystem watcher routes file events into `runtime/bus`.
*   **Orchestrator Role**: Consumes `bus/input` commands and produces evidence to `bus/output` or `bus/error`.
*   **Governance Constraint**: No governance decisions are made in the bus. Decisions are recorded in `SHARED_CONTEXT.md` or `TO_HUMAN.md` only.

## 2. Core Objects

### 2.1 Event
Represents a filesystem event detected by the watcher.
*   `type`: `created` | `modified` | `deleted` | `renamed`
*   `path`: string (Normalized, relative to repo root)
*   `ts`: ISO8601 Timestamp
*   `actor_hint`: `antigravity` | `cursor` | `claude` | `vscode` | `human` | `unknown` (Best-effort heuristic)

### 2.2 Context
Global state context for rule evaluation.
*   `phase`: `0`..`4` (Derived from `SHARED_CONTEXT.md`)
*   `policy_mode`: `strict` | `relaxed` (Default: `strict`)
*   `allowed_roots`: List of relative paths allowed for execution actions.
*   `dsl_version`: String identifier.

### 2.3 Message (Bus Command)
Minimal schema (YAML or JSON) for objects in `bus/input`.
*   `msg_id`: String (`YYYYMMDD_HHMMSS_<agent>_<slug>`)
*   `msg_type`: `command` | `evidence` (**DECISION is forbidden in bus**)
*   `command_type`: `task` | `exec` | `approval_request`
*   `phase`: `0`..`4`
*   `category`: `A` | `B` | `C` | `D` (Constitutional Policies)
*   `title`: String
*   `target_paths`: List of strings
*   `run`: List of command strings (Optional)
*   `requires_approval`: Boolean (Derived or explicit)
*   `approval_by`: [`human` | `antigravity`] (Optional target authority)
*   `origin_ref`: String (Originating event/path)
*   `created_by`: Agent Identifier
*   `notes`: String

### 2.4 Rule
A rule binds an Event or Bus Command to Actions.

**Schema (YAML):**
```yaml
rule_id: string
priority: int (lower runs first)
trigger:
  kind: fs_event | bus_input
  match:
    paths: [glob...]
    event_types: [modified, ...]          # fs_event only
    command_types: [task, exec, ...]      # bus_input only
guards:
  phase_in: [0, 1, 2, 3, 4]
  category_in: [A, B, C, D]
  require_lock: true | false
  approval:
    mode: none | single | dual | retroactive
    authorities: [antigravity, human]
actions:  # Ordered list
  - type: write_processing_lock
    lock_key: string
  - type: run_cmd
    cmd: string
    cwd: string
    timeout_sec: int
  - type: write_bus
    channel: output | error | processing
    template: string
  - type: request_approval
    channel: input
    to: antigravity | human
    payload_template: string
  - type: release_lock
    lock_key: string
on_error:
  - type: write_bus
    channel: error
    template: string
  - type: release_lock
    lock_key: string
```

## 3. Guard Semantics
*   **Phase Guard**: Rule may execute **only** if the current phase is in `phase_in`.
*   **Category Guard**:
    *   `A`: Runs freely.
    *   `B`/`C`: Requires approval depending on `approval.mode`.
*   **Approval**: Cannot be satisfied inside the bus. Must be satisfied by:
    *   `SHARED_CONTEXT.md` decision marker (reference ID).
    *   Explicit "Approved" token file (outside bus).
*   **Emergency (D)**: Allowed to run immediately, but **must** emit retroactive approval request.

## 4. Deterministic Order
*   Evaluate rules by `priority` **ascending** (1 runs before 100).
*   **First-match wins** unless rule specified `continue: true` (Optional extension).
*   Actions are executed **sequentially**.
*   Any action failure triggers `on_error` block.

## 5. Security Model
*   **Command Whitelist**: `run_cmd` is allowed **only** for whitelisted commands:
    *   `npm`, `pnpm`, `yarn`
    *   `python`, `pytest`
    *   `node`
*   **CWD Constraint**: `cwd` must be within `Context.allowed_roots`.
*   **Interpolation**: Never execute shell commands with untrusted variable interpolation.

## 6. Versioning
*   `dsl_version`: **0.1**
*   Any breaking schema change must be recorded via `90_AMENDMENTS` or the Law revision process.
