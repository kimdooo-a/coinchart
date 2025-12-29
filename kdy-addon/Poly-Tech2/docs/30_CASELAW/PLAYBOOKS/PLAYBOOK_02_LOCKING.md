# PLAYBOOK 02: LOCK CONTENTION & RESOLUTION

## 1. Objective
To resolve situations where multiple agents compete for the same resource, ensuring system stability.

## 2. Scenario A: Atomic Acquisition (Happy Path)
1. Agent A requests lock on `src/db`.
2. Lock Manager checks existence -> None.
3. Agent A writes `.agent_lock`.
4. Agent B requests lock on `src/db`.
5. Lock Manager checks existence -> Exists.
6. Agent B **Aborts** or **Waits** (Backoff strategy).

## 3. Scenario B: Stale Lock (Zombie)
**Symptom**: Agent A crashed 2 hours ago, but `.agent_lock` remains.
**Resolution**:
1. Watchdog scans locks.
2. Checks `expiryTimestamp` in JSON.
3. If `Now > Expiry`:
    - Checks OS Process ID (if local).
    - If PID dead: **Force Delete** lock.
    - Log: "Zombie lock removed."

## 4. Scenario C: Human Override
**Symptom**: User needs urgent hotfix on locked file.
**Resolution**:
1. User sees "Locked by Claude" in VS Code.
2. User runs command: `Unlock Force`.
3. System deletes `.agent_lock`.
4. Claude (if running) fails on next write (Lock stolen), moves to Error Bus.
