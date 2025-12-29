# LAW 20: LOCK GOVERNANCE ACT

## 1. References
- **Constitution Article 3**: File System Sovereignty (Isolation).
- **Safety Gate 1**: Locking Protocol.

## 2. Purpose
To prevent **Race Conditions** and ensure data integrity when multiple agents operate concurrently.

## 3. Rules

### Rule 1. The .agent_lock File
**Automation: Fully Automatable (Check File Existence)**
- Presence of `.agent_lock` in a directory indicates "Exclusive Right".
- Any Agent encountering this file MUST `WAIT` or `ABORT`.

### Rule 2. Lock Acquisition
**Automation: Scriptable (flock/mkdir)**
- An Agent must create `.agent_lock` **BEFORE** starting modifications.
- Locking must be atomic.

### Rule 3. Lock Expiry
**Automation: Daemon Required**
- Locks older than 1 hour (Stale Locks) may be forcefully cleared by the **Specialist** (or Watchdog Script) after warning user.

## 4. Variability
- **Lock Name**: Fixed (`.agent_lock`).
- **Timeout Duration**: Configurable in `20_REGULATIONS/lock_policy.yaml`.
