# COMMUNICATION.md - The Protocol of Poly-Tech2

> [!IMPORTANT]
> This document is the **Single Source of Truth (SSOT)** for all inter-agent communication within Poly-Tech2. It defines the authorized channels, message formats, and strict prohibitions to maintain state integrity.

## 1. Channel Definitions & Authorities

Communication in Poly-Tech2 is **file-based**. Ownership of a file (Write Permission) dictates Authority.

| Channel Filename | Owner (Write) | Audience (Read) | Purpose |
| :--- | :--- | :--- | :--- |
| `TO_ANTIGRAVITY.md` | Agents (Cursor/VSCode/Claude) | Antigravity | Escalation, Approval Request, Status Report |
| `TO_CURSOR.md` | Antigravity / Human | Cursor Agent | Work Orders, Tasks, Implementation Instructions |
| `TO_CLAUDE.md` | Antigravity / Human | Claude Agent | Architectural Design, High-Level Planning Requests |
| `TO_VSCODE.md` | Antigravity / Human | VSCode Agent | Execution Tasks, Terminal Commands, Testing |
| `TO_HUMAN.md` | **ALL AGENTS** | Human User | Usage Reports, Critical Alerts, Final Handover |
| `SHARED_CONTEXT.md` | **ANTIGRAVITY ONLY** | **ALL AGENTS** | System State (Phase), Global Configurations, Approval Registry |

## 2. Channel Roles

*   **Command Channels (`TO_AGENT.md`)**: Used by higher tiers to instruct lower tiers. Content here is a **Directive**.
*   **Report Channels (`TO_MANAGER.md`)**: Used by lower tiers to report back. Content here is **Evidence** or **Request**.
*   **Context Baseline (`SHARED_CONTEXT.md`)**: The absolute runtime truth. Contains the "Now".
    *   *Note*: Only Antigravity (Governing Agent) generally updates this, representing the system's state transition.

## 3. Strict Prohibitions (The "Thou Shalt Not"s)

1.  **No Cross-Writing**: An agent MUST NOT write to a channel owned by another agent (e.g., Cursor cannot write to `TO_VSCODE.md`).
2.  **No Context Tampering**: Agents MUST NOT modify `SHARED_CONTEXT.md` directly. Changes to context must be requested via `TO_ANTIGRAVITY.md`.
3.  **No Constitutional Edits**: Agents MUST NOT directly edit or propose changes to `00_CONSTITUTION` files unless acting under a specific Bill/Amendment process authorized by the Human.
4.  **No Ephemeral Decisions**: Decisions made in chat but not recorded in a file DO NOT EXIST.

## 4. Message Format Standard

All major communications (Task handovers, Approval requests, Critical reports) MUST use the following header format:

```markdown
# [MESSAGE_TYPE] Title of Message

**ID**: `UUID` or `MSG-YYYYMMDD-001`
**DATE**: `ISO-8601`
**PHASE**: `Current Phase (0-4)`
**OWNER**: `Agent Name`
**STATUS**: `DRAFT` | `OPEN` | `COMPLETED` | `REJECTED`

## Request / Decision
(The core content)

## Evidence Link
(Link to artifacts, logs, or other files confirming the content)
```

## 5. Governance Integration

This protocol is part of the Poly-Tech2 Constitution. Violation of these communication rules constitutes a **Runtime Exception** and grounds for process termination.
