# Rule Candidates: Isolation & Locking Protocols

## [LAW-CANDIDATE] Shadow Workspace Mandate
- **Purpose**: Prevent "State Pollution" and UI Freezing during AI Batch Operations.
- **Rule**: Any automated task expected to run longer than **1 minute** or modify **>10 files** MUST execute in a `Git Worktree` with a dedicated `--user-data-dir`.
- **Relation**: Law 20 (Lock Governance) - Reduces the need for locking by providing a shared-nothing architecture.

## [LAW-CANDIDATE] Agent Lock JSON Schema
- **Purpose**: Establish a standard language for declaring resource ownership.
- **Rule**: All `.agent_lock` files MUST contain valid JSON with:
    - `lockId` (UUID)
    - `owner` (Agent Name, PID)
    - `intent` (Description, Action)
    - `expiryTimestamp` (ISO 8601)
- **Relation**: Law 20 (Lock Governance) - Defines the "Format" of the lock mentioned in the Act.

## [PATTERN-CANDIDATE] Zombie Lock Recovery
- **Type**: Technical Protocol
- **Pattern**:
    1. Check `expiryTimestamp`.
    2. If expired -> Check if `processId` is alive.
    3. If dead -> Atomic Unlink (Steal Lock).
- **Relation**: Safety Gate 1 (Locking Protocol) - Defines the exception handler.
