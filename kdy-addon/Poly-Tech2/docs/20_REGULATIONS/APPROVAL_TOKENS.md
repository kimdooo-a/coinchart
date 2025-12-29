# REGULATION: APPROVAL_TOKENS

**ID**: R-20-TOKEN
**Reference**: L-10-DSL (Rule DSL) / COMMUNICATION.md

## 1. Purpose
This regulation defines the **canonical mechanism** for granting, recording, and verifying Approvals within Poly-Tech2.
It connects the **Governance Decision** (Human/Antigravity) with the **Execution Runtime** (Orchestrator).

---

## 2. Chosen Mechanism: Shared Context Registry
To ensure atomic visibility and a single source of truth, Approvals are **not** separate files.
They are **Structured Entries** recorded directly in `SHARED_CONTEXT.md`.

*   **Option Selected**: `SHARED_CONTEXT.md` Registry (Option A).
*   **Rationale**: Centralizes state, simpler locking, prevents file clutter.

---

## 3. Approval Schema
Valid approvals MUST appear in `SHARED_CONTEXT.md` under a dedicated `## Active Approvals` section using the following format:

` - [Status] MSG_ID | Authority | Category | Timestamp | Hash(Optional)`

### Fields
1.  **Status**:
    *   `[x]` : **Active / Granted** (Orchestrator may proceed).
    *   `[~]` : **Revoked** (Orchestrator must halt/rollback).
    *   `[!]` : **Expired** (No longer valid).
2.  **MSG_ID**: The exact ID of the `bus/input` Command message being approved.
3.  **Authority**: Who granted it (`Antigravity`, `Human`).
4.  **Category**: Constitutional Policy Category (`B`, `C`, `D`).
5.  **Timestamp**: UTC ISO8601 when approval was written.

### Example
```markdown
## Active Approvals
- [x] 20251227_1000_EXEC_001 | Antigravity | Cat-B | 2025-12-27T10:05:00Z
- [x] 20251227_1200_EMERG_999 | Human       | Cat-C | 2025-12-27T12:01:00Z
- [~] 20251227_0900_TASK_OLD  | Antigravity | Cat-B | 2025-12-27T09:00:00Z (Revoked due to conflict)
```

---

## 4. Orchestrator Detection Logic
The Orchestrator's `approval.mode` guard works as follows:

1.  **Read**: Parse `SHARED_CONTEXT.md`.
2.  **Scan**: Look for line containing `MSG_ID` in `## Active Approvals`.
3.  **Verify**:
    *   Must start with `-[x]` or `[x]` (markdown checklist syntax).
    *   `Authority` must match Rule requirements.
    *   `Category` must match Command category.
4.  **Result**:
    *   Found & Valid -> **Execution Permitted**.
    *   Missing / Revoked -> **Execution Blocked**.

---

## 5. Revocation Protocol
An authority may **Revoke** an approval at any time before execution completes.

1.  **Locate** the entry in `SHARED_CONTEXT.md`.
2.  **Change** `[x]` to `[~]`.
3.  **Append** reason: `(Revoked: Reason)`.
4.  **Orchestrator Action**: If running, immediate **Emergency Stop** (Rule R5-equivalent behavior) or graceful cancel.

---

## 6. Audit & History
`SHARED_CONTEXT.md` is for **Operational State**. It is not a permanent log.

*   When a Phase transitions (e.g., Phase 2 -> 3), completed approvals in `SHARED_CONTEXT.md` SHOULD be archived to `TO_HUMAN.md` summary reports.
*   Once archived, they can be removed from `SHARED_CONTEXT.md` to keep it lightweight.

---

## 7. Implementation Note
The **Antigravity** agent is responsible for writing these lines in response to `request_approval` messages found in `runtime/bus/input`.
