# CHECKLIST: PROJECT UPDATE

Use this guide when a new version of Poly-Tech2 Library is released.

## 1. Pre-Flight Check
- [ ] **Backup**: Ensure all local work is committed.
- [ ] **Review Changelog**: Check `Poly-Tech2/docs/CHANGELOG.md` (if avail) for Breaking Changes.

## 2. The Clean Update (Standard)
*Use this if you adhered to the "Read-Only Core" policy.*
- [ ] Delete `kdy-addon/Poly-Tech2/docs/00_CONSTITUTION`.
- [ ] Delete `kdy-addon/Poly-Tech2/docs/10_LAWS`.
- [ ] Delete `kdy-addon/Poly-Tech2/docs/70_AUTOMATION`.
- [ ] **Copy New Version**: Copy these folders from the new Library source.

## 3. The Custom Overlay (Advanced)
*Use this if you customized Prompts or Regulations.*
- [ ] **Regulations**: Diff `20_REGULATIONS` vs New Version. deciding whether to keep your overrides.
- [ ] **Contracts**: Diff `80_RUNTIME_CONTRACTS`.
    - If new Constitution changed Role definitions, you MUST update your customized contracts to match.

## 4. Verification
- [ ] Run `python orchestrator.py` to ensure scripts are compatible.
- [ ] Check `00_CONSTITUTION/CONSTITUTION.md` version.

## 5. Commit
- [ ] Git Commit: "chore: update Poly-Tech2 library to vX.Y.Z"
