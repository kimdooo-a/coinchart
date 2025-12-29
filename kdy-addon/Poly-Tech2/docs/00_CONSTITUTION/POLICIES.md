# 📜 POLICIES.md

## Purpose

This document defines the **Operational Policies** for **poly-tech2**.

Policies translate the Constitution (Role Model & Authority) into **explicit, enforceable rules** that guide day-to-day collaboration.

> **If ROLE_MODEL defines who you are, and AUTHORITY defines who decides, POLICIES defines what is allowed.**

This document applies to **all projects embedding poly-tech2**.

---

## Policy Principles

1. **Explicit over Implicit**

   * Any non-trivial change must be written down.

2. **Approval over Assumption**

   * If unsure whether approval is required, request approval.

3. **Reversibility over Speed**

   * Changes must be traceable and revertible.

4. **Local First**

   * poly-tech2 assumes local, file-based operation by default.

---

## Change Categories

All changes fall into one of the following categories.

---

### 🟢 Category A — Free Changes (No Approval Required)

Allowed by any agent at any time:

* UI/layout adjustments
* Comment-only changes
* Test additions or updates
* Internal refactors **without public contract changes**
* Logging, debugging aids

**Rules**:

* Must not alter external behavior
* Must not change public interfaces

---

### 🟡 Category B — Governed Changes (Single Approval Required)

Require **Antigravity OR Human** approval:

* Public type/interface changes
* Algorithm parameter tuning
* Non-breaking behavior changes
* Refactors that may affect downstream code

**Approval Channel**:

* `TO_ANTIGRAVITY.md`

---

### 🔴 Category C — Critical Changes (Dual Approval Required)

Require **Antigravity + Human** approval:

* Core behavior changes
* Scope expansion
* New agent roles or removal of roles
* Workflow phase modifications

**Approval Channels**:

* `TO_ANTIGRAVITY.md`
* Final confirmation in `TO_HUMAN.md`

---

### 🚨 Category D — Emergency Changes (Temporary Exception)

May be executed immediately by **any agent** when necessary:

* Build-breaking fixes
* Security issues
* Data corruption prevention

**Post-Conditions**:

* Must be documented within 24 hours
* Must receive retroactive approval
* Must include rollback notes

---

## Code Modification Policies

### Public Contracts

* Public types, interfaces, schemas are protected
* Changes require approval (Category B or C)

### Internal Logic

* Internal logic may be modified freely **if contracts remain stable**

### Configuration & Tooling

* Tooling and config changes are allowed
* Must not silently affect execution semantics

---

## Communication Policies

### Mandatory Usage

* All non-trivial work must be reflected in communication files
* Verbal or implicit agreements are invalid

### Channel Discipline

| Channel           | Allowed Content                           |
| ----------------- | ----------------------------------------- |
| TO_ANTIGRAVITY.md | Approvals, architecture, policy questions |
| TO_CURSOR.md      | Implementation tasks                      |
| TO_CLAUDE.md      | Tests, automation, refactoring            |
| TO_VSCODE.md      | Execution, debugging, environment         |
| TO_HUMAN.md       | Final decisions, summaries                |
| SHARED_CONTEXT.md | Active baseline state                     |

---

## Phase Compliance

* Work must comply with the current Phase
* Skipping phases is prohibited
* Phase transitions must be explicit

---

## Documentation Policy

* Decisions must be written
* Rationale should be brief but explicit
* Undocumented decisions may be reverted

---

## Violation Handling

When a policy violation is detected:

1. Stop further execution
2. Document the violation
3. Escalate to Antigravity
4. Decide: revert, amend, or approve retroactively

---

## Amendment Rules

* POLICIES.md is **Immutable by Agents**.
* Only **Human User** may amend this document.
* All overrides must be recorded in `docs/90_AMENDMENTS/`.

---

## Enforcement Model

poly-tech2 enforces policies through:

* Transparency
* Review gates
* Human-readable audit trails

It does NOT:

* Prevent edits
* Auto-merge decisions
* Replace human judgment

---

**Location**: docs/00_CONSTITUTION/POLICIES.md
**Maintainer**: Antigravity
**Status**: Active Constitution Component
