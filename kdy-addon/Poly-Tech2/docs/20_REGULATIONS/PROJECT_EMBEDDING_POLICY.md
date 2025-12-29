# REGULATION: PROJECT EMBEDDING POLICY

## 1. The "kdy-addon" Standard
Implementation of the Poly-Tech2 library MUST strictly follow the `kdy-addon` directory pattern. This standardizes the path for all AI Agents, allowing them to find the **Constitution** regardless of the project they are in.

## 2. Structure Mandate
Every project utilizing this system must have the following structure:

```text
[Project Root]
├── src/                # Project Source Code
├── package.json
└── kdy-addon/          # The Addon Namespace
    └── Poly-Tech2/     # The Library ID
        └── docs/       # The Document Root
            ├── 00_CONSTITUTION/
            ├── 10_LAWS/
            ├── 70_AUTOMATION/
            └── ...
```

## 3. Updates and Synchronization
- **One-Way Sync**: Changes should flow from the Master Library (`Poly-Tech2`) to the Project (`kdy-addon`).
- **No Modifications**: Do not edit `00_CONSTITUTION` or `10_LAWS` inside a project.
- **Overrides**: Use `20_REGULATIONS` for project-specific rules if absolutely necessary, but do not alter the Core Laws.

## 4. Agent Configuration
- **VS Code**: `settings.json` should exclude `kdy-addon` from search if it becomes too large.
- **Cursor**: `.cursorrules` should point to `kdy-addon/Poly-Tech2/docs/00_CONSTITUTION/CONSTITUTION.md` as the source of truth.
