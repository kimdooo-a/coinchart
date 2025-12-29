# ⚖️ AUTHORITY.md

## Purpose

This document defines the **Authority & Approval Model** for **poly-tech2**.

It answers the core question:

> **Who is allowed to decide what, when multiple agents collaborate and everyone can code?**

AUTHORITY.md is a **constitutional document** and applies to **all projects embedding poly-tech2**.

---

## Core Principle

### ❝ Authority is not about who writes code, but who finalizes decisions ❞

* Any agent may propose or implement changes
* Only designated authorities may **finalize, approve, or reject** them
* Authority is exercised through **explicit approval events**, not implicit action

---

## Authority Layers (Decision Stack)

All decisions are resolved through the following hierarchy:

1. **Constitution & Policies** (Highest)
2. **Antigravity (Governance Authority)**
3. **Human (Intent Authority)**
4. **Phase Gates**
5. **Execution Agents** (Cursor / Claude / VSCode)

If a lower layer conflicts with a higher one, the higher layer always prevails.

---

## Authority Types

poly-tech2 recognizes **four types of authority**:

| Type                   | Description                | Example              |
| ---------------------- | -------------------------- | -------------------- |
| Governance Authority   | Defines structure & rules  | Architecture changes |
| Intent Authority       | Defines purpose & priority | Scope, deadlines     |
| Execution Authority    | Performs work              | Coding, refactoring  |
| Verification Authority | Confirms correctness       | Tests, debugging     |

---

## Agent Authority Matrix

### 🏛 Antigravity — Governance Authority

**Primary Authority**:

* Architecture decisions
* Policy definition and modification
* Module boundary changes
* Approval of gated changes

**May Unilaterally Approve**:

* Structural changes
* Policy updates
* Emergency halts

**May Veto**:

* Any change that violates constitution or policies

---

### 👤 Human — Intent Authority

**Primary Authority**:

* Product intent
* Priority and scope
* Trade-offs and pivots

**May Override**:

* Execution decisions
* Scheduling decisions

**Limitations**:

* May not override constitutional rules without formal amendment

---

### ⚡ Cursor AI — Execution Authority

**Authority Scope**:

* Feature implementation
* UI/UX decisions within approved structure

**Cannot Finalize**:

* Policy changes
* Public contract changes

---

### 🧪 Claude Code — Execution & Verification Authority

**Authority Scope**:

* Testing strategy
* Automation scripts
* Refactoring for clarity

**Cannot Finalize**:

* Functional requirement changes

---

### 🛠 VSCode — Verification Authority

**Authority Scope**:

* Execution validation
* Debugging outcomes
* Environment stability

**Cannot Finalize**:

* Architectural or policy decisions

---

## Approval Categories

> **Detailed definitions of these categories are located in [POLICIES.md](./POLICIES.md).**

### Category A — Auto-Approved
*(See [POLICIES.md](./POLICIES.md#category-a--free-changes-no-approval-required))*

### Category B — Single Approval Required
*(See [POLICIES.md](./POLICIES.md#category-b--governed-changes-single-approval-required))*

### Category C — Dual Approval Required
*(See [POLICIES.md](./POLICIES.md#category-c--critical-changes-dual-approval-required))*

### Category D — Emergency Actions
*(See [POLICIES.md](./POLICIES.md#category-d--emergency-changes-temporary-exception))*

---

## Approval Process (Canonical)

1. Proposal submitted via appropriate TO_*.md
2. Authority reviews and responds explicitly
3. Decision recorded in TO_HUMAN.md or SHARED_CONTEXT.md
4. Execution proceeds or is reverted

---

## Conflict Resolution

When disputes occur:

1. Check Constitution & Policies
2. Escalate to Antigravity
3. If intent conflict, Human decides
4. Record final decision

---

## Amendment Rules

* AUTHORITY.md is **Immutable by Agents**.
* Only **Human User** may amend this document.
* All overrides must be recorded in `docs/90_AMENDMENTS/`.

---

## Enforcement Model

poly-tech2 enforces authority by:

* Visibility (everything is written)
* Traceability (who approved what)
* Escalation (nothing is implicit)

It does NOT:

* Prevent edits
* Lock files
* Automate judgment

---

**Location**: docs/00_CONSTITUTION/AUTHORITY.md
**Maintainer**: Antigravity
**Status**: Active Constitution Component
