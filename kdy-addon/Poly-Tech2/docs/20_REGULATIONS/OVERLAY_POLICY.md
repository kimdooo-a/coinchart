# REGULATION: OVERLAY POLICY

## 1. Principles
- **Immutability**: The Core Library (`kdy-addon/Poly-Tech2`) is immutable within the project scope.
- **Composition**: Project-specific customizations must be accepted via an **Overlay Layer**.
- **Precedence**: Overlay files `>` Core files. Or, in the case of Rules/Contracts, Overlay `extends` Core.

## 2. Directory Structure
Projects requiring customization MUST create a parallel structure:
`[Project Root]/kdy-addon/overlay`

### 2.1 Mapping
The Overlay mirrors the Core structure:
- Core: `Poly-Tech2/docs/20_REGULATIONS/SOME_RULE.md`
- Overlay: `overlay/20_REGULATIONS/SOME_RULE.md`

## 3. Override Rules

### 3.1 Strict Replacements (Configuration)
If a file exists in Overlay, Agents should use the Overlay version as the source of truth for:
- `rules.yaml` (Automation Logic)
- `.cursorrules` (Interface Logic)
- `rules.md` (Agent Logic)

### 3.2 Extensions (Documentation)
For Markdown documentation, Agents should append the Overlay content to their context window after the Core content.
- Example: Read `Core/20_REGULATIONS` -> Then Read `Overlay/20_REGULATIONS`.

### 3.3 Forbidden Overrides
The following CANNOT be overridden. If a Project needs to change these, it is no longer a Poly-Tech2 project.
- `00_CONSTITUTION/*`: The Supreme Law is absolute.
- `10_LAWS/*`: The Core Acts are immutable.

## 4. Maintenance
- **Analysis**: Before updating the Core Library, the Project Maintainer must check if Overlay files conflict with new Core features.
- **Drift**: Overlays should be kept minimal to avoid "Policy Drift".
