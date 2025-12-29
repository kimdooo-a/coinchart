# CHECKLIST: PROJECT SETUP

Use this checklist when embedding `Poly-Tech2` into a new or existing project.

## 1. Installation
- [ ] Create `kdy-addon` directory in project root.
- [ ] Copy `Poly-Tech2/docs` to `kdy-addon/Poly-Tech2/docs`.
- [ ] Verify existence of `kdy-addon/Poly-Tech2/docs/00_CONSTITUTION`.

## 2. Build Exclusion (Safety)
- [ ] **.gitignore**: Add `*.agent_lock` and runtime bus folders.
- [ ] **.npmignore**: Add `kdy-addon/`.
- [ ] **tsconfig.json**: Add `"exclude": ["kdy-addon"]`.
- [ ] **Verification**: Run build and check output size.

## 3. Agent Configuration
- [ ] **VS Code**: Copy `70_AUTOMATION/USER_GUIDE.md` instructions to project wiki if needed.
- [ ] **Orchestrator**: (Optional) Setup `python orchestrator.py` as a background task.
- [ ] **Context**: Ensure `.cursorrules` or `CLAUDE.md` in the root points to the new `docs` location.

## 4. Final Verification
- [ ] Drop a test file into `kdy-addon/Poly-Tech2/docs/runtime/bus/input`.
- [ ] Verify it acts according to `L10_ROUTING_ACT`.
