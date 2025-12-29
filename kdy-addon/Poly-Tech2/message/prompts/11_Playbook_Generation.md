# Prompt 11: Playbook Generation

## Objective
Document standard operating procedures (SOPs) for the automated system to ensure consistent human/agent behavior.

## Instructions
1.  **Draft `PLAYBOOK_01_TASK_FLOW.md`**:
    - Describe the "Happy Path": Input -> Route -> Lock -> Execute -> Merge.
2.  **Draft `PLAYBOOK_02_LOCKING.md`**:
    - Describe "Lock Contention" (Backoff).
    - Describe "Zombie Lock Recovery" (Force Delete if expired).
3.  **Draft `PLAYBOOK_03_FAILOVER.md`**:
    - Describe "Process Crash" -> Error Bus.
    - Describe "Manual Handoff" (Human finishes task).
4.  **Location**: Place in `30_CASELAW/PLAYBOOKS`.
