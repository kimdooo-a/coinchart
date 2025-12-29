# REGULATION: LIBRARY DISTRIBUTION POLICY

## 1. Governance Model
The Poly-Tech2 Document Library (`Poly-Tech2/docs`) is the **Single Source of Truth** for the AI Agent Ecosystem.
When embedded into a project, it acts as a **Read-Only Dependency** (similar to `node_modules`).

## 2. The "Copy & Overlay" Strategy

### 2.1 The Core (Read-Only)
The following directories MUST NOT be modified by the target project:
- `00_CONSTITUTION/`
- `10_LAWS/`
- `60_PROTOCOLS/`
- `70_AUTOMATION/`

### 2.2 The Overlay (Writable)
Projects MAY extend or override functionality in:
- `20_REGULATIONS/` (Project-specific rules)
- `50_TEMPLATES/` (Project-specific templates)
- `80_RUNTIME_CONTRACTS/` (Tweaked agent prompts)

### 2.3 Conflict Resolution
If a project modifies a Core file:
- On **Update**: The project's changes WILL be overwritten by the new library version.
- **Rule**: "If you touch Core, you own the merge debt."

## 3. Versioning (SemVer)
The library follows Semantic Versioning (`MAJOR.MINOR.PATCH`):
- **MAJOR**: Constitutional change (e.g., removing a Role). Breaking change.
- **MINOR**: New Law or Automation feature.
- **PATCH**: Typos, clear clarifications, bug fixes in scripts.

## 4. Build Exclusion Mandate
As per `BUILD_EXCLUSION_POLICY.md`, the `kdy-addon` directory MUST serve purely as a **Development-Time Asset**.
- It SHALL NOT be bundled into production binaries.
- It SHALL NOT be published to public package registries intact.

## 5. Synchronization Methods
1.  **Manual Copy**: Replace `kdy-addon/Poly-Tech2/docs` with the new version.
2.  **Git Submodule**: `git submodule add ... kdy-addon/Poly-Tech2`.
3.  **Monorepo Symlink**: `ln -s ... kdy-addon/Poly-Tech2`.
