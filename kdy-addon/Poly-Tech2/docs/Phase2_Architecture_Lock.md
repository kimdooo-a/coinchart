# Phase 2 Architecture Lock

> [!IMPORTANT]
> **Objective**: Protect the Core Orchestration Layer while allowing rapid Feature Development in Phase 2.
> **Role**: Antigravity enforces this lock.

## 1. Allowed Zones (Read/Write)
Agents (Cursor/VSCode) are **authorized** to modify files in these directories for Feature Implementation:

| Directory | Purpose | Constraints |
| :--- | :--- | :--- |
| **`app/`** | Next.js App Router Pages & API Routes | Strict adherence to "No AI" copy rule. |
| **`components/`** | UI Components (Shadcn/Tailwind) | Must use "Classic Masters" Design System. |
| **`lib/analysis/`** | Analysis Logic, Patterns, Math | No external API calls allowed. |
| **`lib/utils/`** | Helper functions | Pure functions only. |
| **`public/`** | Static Assets | No AI generated images (Use Placeholders or Public Domain). |
| **`styles/`** | Global CSS | Design Token updates only. |

## 2. Forbidden Zones (Read-Only / Governance Lock)
Modification is **STRICTLY PROHIBITED** without explicit *Human* or *Antigravity* Override.

| Directory | Reason | Exception |
| :--- | :--- | :--- |
| **`kdy-addon/Poly-Tech2/core/`** | **Orchestration Brain**. Modifying this kills the agent system. | Antigravity Self-Update only. |
| **`kdy-addon/Poly-Tech2/docs/`** | **Constitution & Rules**. Single Source of Truth. | Governance Requests (`TO_ANTIGRAVITY`). |
| **`docs/`** (Root) | Reserved for project-level documentation. | Documentation Task only. |
| **`communication/bootstrap/`** | Agent Personality & Boot Protocols. | Governance Update only. |

## 3. Gray Zone (Caution)
*   **`package.json`**: Dependency addition requires **Approval**.
*   **`next.config.mjs`**: Build config changes require **Approval**.
