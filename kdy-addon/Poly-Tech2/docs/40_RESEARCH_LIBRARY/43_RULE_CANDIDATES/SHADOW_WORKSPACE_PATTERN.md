# Rule Candidate: Shadow Workspace Protocol (Pattern)

## [PATTERN-CANDIDATE] AI Shadow Workspace
- **Type**: Technical Pattern (Recommendation)
- **Idea**: AI Agents should operate in "Shadow Worktrees" (`.shadow/*`) rather than the main user directory.
- **Implementation**:
    1. Detect idle time or explicit command.
    2. Clone current state to a temporary worktree.
    3. Execute tasks (Refactor/Test).
    4. Propose Squash Merge.
- **Relation**: Supports Constitution Article 3 (Isolation) but defines the *how*, not the *must*.

## [PATTERN-CANDIDATE] Disposable Contexts
- **Type**: Best Practice
- **Idea**: Treat every development context (branch/worktree) as disposable.
- **Implementation**:
    - Use "Bare Repository" structure.
    - Automate the creation/destruction of worktrees.
