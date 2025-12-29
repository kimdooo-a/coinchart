# Research Summary: Git Worktree Automation

## Source
- **File**: `40_RESEARCH_LIBRARY/41_SOURCES_RAW/Git Worktree 자동화 스크립트 연구.txt`
- **Classification**: Reference-Level (Technical Pattern)

## Key Technical Patterns

### 1. Bare Repository Pattern
- **Concept**: Use a `.git` bare repository as the root, with all worktrees (including main) as siblings.
- **Benefit**: Ensures all contexts are disposable and equal. Prevents lock-in to a single main working directory.

### 2. Shadow Workspace (AI Isolation)
- **Concept**: Create temporary worktrees (`.shadow/task-id`) for AI agents.
- **Mechanism**:
    - Use `git checkout-index` to replicate current state without switching branches.
    - Run AI tools in this isolated environment.
    - Squash merge back to main upon completion.

### 3. Dependency Optimization
- **Concept**: Avoid duplicating `node_modules` for every worktree.
- **Technique**: Use `pnpm` (hardlinks) or `cp --reflink` (CoW) to share dependency files across implementation contexts.

## Recommended Usage
This research provides the **implementation detail** for the "Physical Isolation" principle mentioned in the Constitution. It should be used to write automation scripts (`50_TEMPLATES/worktree_manager.sh`), but not enforced as a rigid law.
