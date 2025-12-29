# Template: Project Overlay

## Usage
Copy this directory structure to `[Project Root]/kdy-addon/overlay` if you need to customize Poly-Tech2 behaviors.

## Structure
- `20_REGULATIONS/`: Override non-critical policies here.
- `80_RUNTIME_CONTRACTS/`: Customize Agent prompts (e.g., `CLAUDE.md`) for project-specific stack (React vs Vue, etc).
- `70_AUTOMATION/`: Provide a custom `rules.yaml`.

## Warning
Do **NOT** copy `00_CONSTITUTION` or `10_LAWS` here. They cannot be overridden.
