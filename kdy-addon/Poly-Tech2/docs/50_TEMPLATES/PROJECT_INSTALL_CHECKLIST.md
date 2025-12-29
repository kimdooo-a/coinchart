# CHECKLIST: PROJECT INSTALLATION

Follow this guide to embed specific Poly-Tech2 capabilities into your project.

## 1. Preparation
- [ ] Ensure `git status` is clean.
- [ ] Verify you are at the Project Root.

## 2. Installation
- [ ] Create directory: `mkdir -p kdy-addon/Poly-Tech2`
- [ ] Copy Library:
  - Source: `[Library Root]/docs`
  - Dest: `kdy-addon/Poly-Tech2/docs`
- [ ] **Validation**: Check that `kdy-addon/Poly-Tech2/docs/00_CONSTITUTION/CONSTITUTION.md` exists.

## 3. Configuration (Safety)
- [ ] Add to `.gitignore`:
  ```gitignore
  kdy-addon/Poly-Tech2/runtime/bus/*
  !kdy-addon/Poly-Tech2/runtime/bus/.keep
  *.agent_lock
  ```
- [ ] Add to `.kdyignore` (if using KDY builder) or `.npmignore`.

## 4. Activation
- [ ] Initialize Orchestrator (if using automation):
  `python kdy-addon/Poly-Tech2/docs/70_AUTOMATION/orchestrator/orchestrator.py`
- [ ] Configure Agents:
  - Point Cursor/Claude to `kdy-addon/Poly-Tech2/docs/80_RUNTIME_CONTRACTS/rules.md`.

## 5. Commit
- [ ] Git Add & Commit: "chore: install Poly-Tech2 library v1.0.0"
