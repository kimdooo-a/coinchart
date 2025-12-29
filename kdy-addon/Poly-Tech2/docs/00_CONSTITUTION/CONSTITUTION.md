# CONSTITUTION OF POLY-TECH2

## Preamble
We, the intelligence of the Poly-Tech2 ecosystem, enable a **Quad-Hybrid Development Environment**.
To ensure harmony between human intent and artificial execution, this Constitution is established as the Supreme Law.

## Article 1. Identity
> **Defined in [IDENTITY.md](./IDENTITY.md)**

Poly-Tech2 is a **local, file-based, cost-free multi-agent orchestration library**.
It functions as a **Project Constitution**, imposing structure on chaos through an 8-Tier Document Hierarchy.
It is **NOT** a SaaS platform, Cloud Service, or "Black Box" executable.

## Article 2. Supremacy
This document and its sub-articles (`PRINCIPLES.md`, `ROLE_MODEL.md`, `SAFETY.md`, `AUTHORITY.md`, `POLICIES.md`, `WORKFLOW.md`, `COMMUNICATION.md`) stand above all other Laws, Regulations, and Contracts.
Any Law conflict shall be resolved in favor of the Constitution.

## Article 3. Structure of Governance
| Category | Document | Description |
| :--- | :--- | :--- |
| Governance | [ROLE_MODEL.md](./ROLE_MODEL.md) | Agent Roles & Responsibilities |
| Governance | [PRINCIPLES.md](./PRINCIPLES.md) | Core Operating Principles |
| Governance | [SAFETY.md](./SAFETY.md) | Safety & Ethical Guidelines |
| Governance | [AUTHORITY.md](./AUTHORITY.md) | Decision-Making & Permissions |
| Governance | [POLICIES.md](./POLICIES.md) | Operational Policies |
| Governance | [WORKFLOW.md](./WORKFLOW.md) | Workflow & Gates |
| Governance | [COMMUNICATION.md](./COMMUNICATION.md) | Agent Communication Protocol |

## Article 4. Amendment & Hierarchy
The Constitution is immutable by Agents. Only the Human User may amend these texts.

| Layer | Status | Modifiable By |
| :--- | :--- | :--- |
| **00_CONSTITUTION** | **Immutable** | Human User ONLY |
| **10_LAWS** | **Semi-Mutable** | Antigravity (Bill Process) |
| -> [RULE_DSL](./../10_LAWS/RULE_DSL.md) | | Watcher/Orchestrator Rules |
| **20_REGULATIONS** | **Mutable** | Antigravity / Governance |
| **90_AMENDMENTS** | **Supreme** | Human User (Overrides Constitution) |

---

## Appendix A: Single Source of Truth & Mapping

### 1. Canonical Hierarchy
* **The Constitution** (`docs/00_CONSTITUTION/*`) is the absolute Source of Truth for **Governance**.
* **The Regulations** (`docs/20_REGULATIONS/*`) are the Source of Truth for **Specific Implementation Details**.
* **The Prompts** (`prompts/*`) are **Executable Tools**; they must yield to the Constitution if they conflict.
* **Runtime Artifacts** (`runtime/*`, `bus/*`) are **Evidence of Execution**, not Governance Truth. They reflect what *happened*, not necessarily what *should* happen.

### 2. Workflow <-> Prompt Mapping
The Constitutional **Phases** (defined in `WORKFLOW.md`) correspond to the Agent **Prompts** as follows:

| Workflow Phase | Name | Corresponding Prompts (Steps) |
| :--- | :--- | :--- |
| **Phase 0** | Bootstrap | `01_System_Role` (DNA Definition) |
| **Phase 1** | Architecture Lock | `02_Structure` ~ `07_Validation` (Analysis & Structure) |
| **Phase 2** | Parallel Execution | `08_Contract` ~ `12_Overlay` (Generation & Implementation) |
| **Phase 3** | Review & Approval | `13_Compliance` ~ `14_Auditor` (Verification) |
| **Phase 4** | Debug & Stabilize | *Runtime Execution Agents (VSCode/Extension)* |

> **Note**: Prompts use an internal "STEP" numbering (01-14). Constitutional Phases (0-4) group these steps into logical governance blocks.
