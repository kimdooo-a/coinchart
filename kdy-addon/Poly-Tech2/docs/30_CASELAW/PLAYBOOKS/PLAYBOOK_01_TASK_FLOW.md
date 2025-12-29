# PLAYBOOK 01: STANDARD TASK FLOW

## 1. Objective
To move a request from "User Intent" to "Merged Code" using the QHDE pipeline without human blocking.

## 2. Actors
- **User**: Initiator.
- **Orchestrator**: Router (`orchestrator.py`).
- **Claude**: Batch Worker.
- **Specialist**: Merger.

## 3. Workflow Procedure

### Step 1: Input (Bus Entry)
User defines task in a file:
`echo "Refactor Auth" > runtime/bus/input/task_01.md`

### Step 2: Routing (L10)
Orchestrator detects `.md` (if configured) or reads file content:
- **Decision**: Task > 10 mins -> **Antigravity** (Planning).
- **Action**: Moves file to `runtime/bus/processing/task_01.md`.

### Step 3: Execution (Agent)
Agent claims the task:
1.  **Read**: Reads `processing/task_01.md`.
2.  **Lock**: Acquires `.agent_lock` on `src/auth`.
3.  **Work**: Performs changes (Shadow Worktree).
4.  **Result**: Writes result summary to `output/result_01.md`.
5.  **Unlock**: Releases `.agent_lock`.

### Step 4: Verification & Merge
User reviews `output/result_01.md`.
- **Pass**: Merges Shadow Branch to Main.
- **Fail**: Updates instructions in `input/task_01_fix.md`.
