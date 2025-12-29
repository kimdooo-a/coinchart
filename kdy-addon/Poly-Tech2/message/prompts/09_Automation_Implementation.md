# Prompt 09: Automation Implementation

## Objective
Turn the static Laws into executable code (MVP) to run on a local machine.

## Input Context
- `10_LAWS/L10_ROUTING_ACT.md`
- `10_LAWS/L20_LOCK_GOVERNANCE_ACT.md`

## Instructions
1.  **Design F-MES**: Create `runtime/bus/{input, processing, output, error}`.
2.  **Implement Lock Manager (`lock_manager.py`)**:
    - Must use atomic file creation (`open(x)`).
    - Must write JSON metadata (Owner, Intent, Expiry).
    - Must handle Stale Locks (Watchdog logic).
3.  **Implement Orchestrator (`orchestrator.py`)**:
    - Watch `input` folder.
    - Load rules from `rules.yaml` (Pattern -> Agent).
    - Acquire Lock -> Move to `processing` -> Mock Execute -> Move to `output`.
4.  **Documentation**: Create `USER_GUIDE.md`.
5.  **Location**: Place code in `70_AUTOMATION/orchestrator`.
