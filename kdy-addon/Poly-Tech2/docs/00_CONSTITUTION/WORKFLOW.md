# 🔄 WORKFLOW.md

## Purpose

This document defines the **Constitutional Workflow Model** for **poly-tech2**.

It specifies **how collaboration progresses over time**, how authority shifts across phases, and how gates are enforced.

> If ROLE_MODEL defines *who*, AUTHORITY defines *who decides*, and POLICIES define *what is allowed*,
> **WORKFLOW defines *when and how actions may occur*.**

This workflow is **project-agnostic** and applies to **all projects embedding poly-tech2**.

---

## Core Workflow Principles

1. **Phase-Based Progression**

   * All collaboration occurs within an explicit Phase

2. **Single Active Phase**

   * At any moment, only one Phase is active

3. **Gate Enforcement**

   * A Phase may not advance until its Gate conditions are satisfied

4. **Authority Shifts by Phase**

   * Different agents lead depending on the Phase

---

## Phase Overview

| Phase   | Name               | Lead Authority | Core Objective                |
| ------- | ------------------ | -------------- | ----------------------------- |
| Phase 0 | Bootstrap          | Antigravity    | Load constitution & context   |
| Phase 1 | Architecture Lock  | Antigravity    | Fix structure & boundaries    |
| Phase 2 | Parallel Execution | All Agents     | Produce working changes       |
| Phase 3 | Review & Approval  | Antigravity    | Validate against constitution |
| Phase 4 | Debug & Stabilize  | VSCode         | Ensure runtime correctness    |

---

## Phase 0 — Bootstrap

### Objective

* Ensure all agents share the same constitutional baseline
* Prevent implicit or divergent assumptions

### Lead Authority

* **Antigravity**

### Required Actions

* All agents MUST read the root `README.md` (or `START_HERE.md`) to identify the entry point.
* Then, read `SHARED_CONTEXT.md` to determine active phase and operational context. (Bootstrap Gate)
* Finally, read the Constitution:
  * CONSTITUTION.md (Index)
  * ROLE_MODEL.md
  * AUTHORITY.md
  * POLICIES.md
  * WORKFLOW.md
* Active context must be recorded in `SHARED_CONTEXT.md`

### Gate (Phase 0 → Phase 1)

* All agents acknowledge constitution
* SHARED_CONTEXT.md initialized

---

## Phase 1 — Architecture Lock

### Objective

* Define and lock architectural boundaries
* Establish module ownership and contracts

### Lead Authority

* **Antigravity**

### Allowed Actions

* Structural design
* Policy refinement
* Minimal exploratory code (non-binding)

### Forbidden Actions

* Feature development
* Long-lived branches

### Gate (Phase 1 → Phase 2)

* Architecture decisions documented
* Boundaries approved
* Phase transition explicitly declared

---

## Phase 2 — Parallel Execution

### Objective

* Produce working code collaboratively
* Maximize parallelism without violating policies

### Lead Authority

* **Distributed (All Agents)**

### Allowed Actions

* Feature implementation
* Refactoring within approved scope
* Test and automation writing

### Constraints

* Must comply with POLICIES.md
* Approval required for Category B/C changes

### Gate (Phase 2 → Phase 3)

* Features implemented
* Tests passing
* No unresolved policy violations

---

## Phase 3 — Review & Approval

### Objective

* Validate work against constitution
* Decide acceptance, revision, or rejection

### Lead Authority

* **Antigravity**

### Allowed Actions

* Review code and logs
* Request revisions
* Approve or reject changes

### Forbidden Actions

* New feature introduction

### Gate (Phase 3 → Phase 4)

* Explicit approval recorded
* Review outcomes documented

---

## Phase 4 — Debug & Stabilize

### Objective

* Ensure the system runs correctly and reliably
* Resolve runtime issues

### Lead Authority

* **VSCode**

### Allowed Actions

* Debugging
* Environment fixes
* Minimal corrective patches

### Constraints

* Structural changes require re-entry to Phase 3

### Gate (Completion)

* No critical runtime errors
* Stable execution verified

---

## Phase Transitions

* Phase transitions must be explicit
* Declared in `SHARED_CONTEXT.md`
* No implicit phase skipping allowed

---

## Workflow Violations

When workflow violations occur:

1. Pause execution
2. Identify violated Phase or Gate
3. Escalate to Antigravity
4. Decide rollback or correction

---

## Amendment Rules

* WORKFLOW.md is **Immutable by Agents**.
* Only **Human User** may amend this document.
* All overrides must be recorded in `docs/90_AMENDMENTS/`.

---

## Enforcement Model

poly-tech2 enforces workflow through:

* Explicit phases
* Gate checks
* Human-readable records

It does NOT:

* Auto-transition phases
* Enforce timing
* Replace judgment

---

**Location**: docs/00_CONSTITUTION/WORKFLOW.md
**Maintainer**: Antigravity
**Status**: Active Constitution Component
