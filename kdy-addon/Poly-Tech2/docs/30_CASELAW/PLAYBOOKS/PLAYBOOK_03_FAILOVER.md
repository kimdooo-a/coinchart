# PLAYBOOK 03: FAILOVER & HANDOFF

## 1. Objective
To gracefully handle agent failures without losing data or context.

## 2. Trigger Conditions
- Agent crashes (Exception).
- API Rate Limit exceeded.
- Orchestrator Timeout (Task stuck in `processing` > 30m).

## 3. Failover Procedure

### Phase 1: Isolation
1. Orchestrator detects failure (Exit code != 0).
2. Move task file from `processing/` to `error/`.
3. Release any associated locks (Safety cleanup).

### Phase 2: User Notification
1. `rules.yaml` default handler triggers **Specialist**.
2. Specialist logs: "Task X failed. moved to error bus."

### Phase 3: Manual Handoff
User takes over:
1. Open `error/task_01.md`.
2. Review partial changes in `src/`.
3. **Decision**:
    - **Revert**: `git restore .`
    - **Finish**: Complete manually (Vibe Coding).
    - **Retry**: Move file back to `input/`.

## 4. Handoff to "Dumber" Agent
If "Claude" (Smart) fails, rule can downgrade to "Script":
- **Retry Rule**: If `processing_count > 1`, target_agent = "VS Code Task".
