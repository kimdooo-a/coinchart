# LAW 10: AUTOMATED ROUTING ACT

## 1. References
- **Constitution Article 2**: Latency Stratification.
- **Constitution Article 3**: File System Sovereignty.

## 2. Purpose
To eliminate ambiguity in task assignment by enforcing **Deterministic Routing** based on file types and content, prioritizing low-latency agents.

## 3. Rules

### Rule 1. Route by File Extension (Deterministic)
**Automation: Fully Automatable (Regex)**
- `*.test.ts`, `*.spec.js` -> Routed to **Operator** (Test Runner).
- `*.md` (Docs) -> Routed to **Architect** (if 'Planning') or **Operator** (if 'SSG Build').
- `*.css`, `*.tsx` (UI) -> Routed to **Interface** (User/Cursor).

### Rule 2. Route by Latency Budget
**Automation: Logic-Based**
- If task estimated time < 1s -> **Interface** MUST execute.
- If task estimated time > 10m -> **Architect** MUST plan first.

### Rule 3. Fallback to Human
**Automation: Manual**
- If no rule matches, the system must pause and query the Human User via `TO_USER.md` or Console.

## 4. Variability
- **Core Logic**: Immutable.
- **Pattern List**: Configurable per project in `20_REGULATIONS/routing_patterns.json`.
