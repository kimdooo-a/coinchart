# SHARED CONTEXT — POLY-TECH2 SESSION

> [!NOTE]
> **SSOT Declaration**
> This file is the **Session Baseline**.
> All Agents must sync with this context before execution.

## 1. Current Phase
*   **Active Phase**: **STEP 4 (Bootstrap & Onboarding)**
*   **Status**: Bootstrap Complete / Architecture Lock Pending

## 2. Environment Constraints
*   **Primary Execution**: **Local Sandbox** (Strictly Enforced)
*   **Cloud Execution**: **DISABLED** (Unless explicitly authorized)
*   **Network**: No external calls allowed without explicit User permission.

## 3. Active Agents & Roles
| Agent | Role Summary |
| :--- | :--- |
| **Antigravity** | **Governance & Architecture**. Approval Authority. |
| **Cursor** | **Implementation & Editing**. Code Writer. |
| **Claude Code** | **Reasoning & Analysis**. Deep Thinker. |
| **VSCode** | **Execution & Verification**. Runtime Environment. |

## 4. SSOT Hierarchy (Truth Layers)
1.  **Constitution** (`docs/00_CONSTITUTION/*`) - **IMMUTABLE**
2.  **Regulations** (`docs/Regulations/*` if any) - **HARD Rules**
3.  **Prompts** (`message/prompts/*`) - **Soft Guidance**
4.  **Runtime** (`runtime/bus/`) - **Evidence & Logs**

## 5. Working Directories & "Where to Write"
*   **`docs/`**: Documentation & Specs. (Write Allowed)
*   **`runtime/bus/`**: Execution Logs & Evidence. (Write Allowed)
*   **`message/`**: Prompts & Communication. (Read/Write)
*   **Project Root**: **READ ONLY** (Except `TO_*.md` files).

## 6. How to Start
*   **First Command**: Verify integrity.
    ```bash
    # Check for Constitution
    ls docs/00_CONSTITUTION/
    ```
*   **Bus Policy**: All execution outputs must be piped to `runtime/bus/`.
    *   **Auto-Logging Policy**:
        *   Used for: **Prompt & Result Tracking**.
        *   Path: `communication/Report/<AGENT>/<DATE>/`.
        *   Files: `PROMPT.md` (Original Request), `RESULT.md` (Action Summary).

---
**Last Updated**: 2025-12-27
**Maintainer**: Antigravity
