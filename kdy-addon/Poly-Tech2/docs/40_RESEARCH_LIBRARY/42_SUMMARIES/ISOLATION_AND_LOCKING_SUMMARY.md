# Summary: IDE Isolation & Agent Locking

## Sources
- `41_SOURCES_RAW/IDE 프로세스 격리 연구.txt`
- `41_SOURCES_RAW/파일 기반 세마포어 및 락 연구.txt`

## 1. Isolation Method Comparison

| Feature | Profile (`--profile`) | User Data Dir (`--user-data-dir`) | Verdict |
| :--- | :--- | :--- | :--- |
| **Isolation Level** | Logical (Settings only) | Physical (Process, Cache, Storage) | **User Data Dir** |
| **Persistence** | Shared `state.vscdb` | Isolated `state.vscdb` | **User Data Dir** |
| **Extensions** | Shared Installation | Separable via `--extensions-dir` | **User Data Dir** |
| **Use Case** | Human Context Switching | **AI Agent Sandboxing** | **User Data Dir** |

**Conclusion**: For "Shadow Workspaces" (Constitution Art. 3), logical profiles are insufficient. We must use physical directory isolation.

## 2. Locking Mechanism Comparison

| Feature | OS Lock (`flock`/`Hold`) | Agent Lock (`.agent_lock`) | Verdict |
| :--- | :--- | :--- | :--- |
| **Visibility** | Invisible to User | Visible File | **Agent Lock** |
| **Information** | None (Binary) | JSON Metadata (Intent, Owner) | **Agent Lock** |
| **Cross-Platform** | Fragmented (POSIX/Win) | Universal (File System) | **Agent Lock** |
| **Recovery** | PID Check (Hard) | Expiry Timestamp (Self-Healing) | **Agent Lock** |

**Conclusion**: OS locks are too low-level. We need a semantic `Agent_Lock` protocol with JSON metadata to communicate "Intent" between AI and Humans.

## 3. Integrated Workflow
1.  **Isolation**: Use `Git Worktree` + `--user-data-dir` to create a "Shadow Workspace".
2.  **Locking**: Use `.agent_lock` files within that workspace to prevent internal collisions if multiple sub-agents operate? (Less critical if fully isolated, but still needed for shared resources).
