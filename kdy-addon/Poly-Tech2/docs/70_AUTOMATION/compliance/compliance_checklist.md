# COMPLIANCE CHECKLIST

Use this list to verify that `Poly-Tech2/docs` is correctly installed and technically compliant.

## 1. Critical Files (Must Exist)
- [ ] `00_CONSTITUTION/CONSTITUTION.md` (Without this, Agents have no purpose)
- [ ] `10_LAWS/L10_ROUTING_ACT.md` (Without this, routing fails)
- [ ] `10_LAWS/L20_LOCK_GOVERNANCE_ACT.md` (Without this, race conditions occur)
- [ ] `80_RUNTIME_CONTRACTS/rules.md` (Entry point for generic agents)

## 2. Automation Integrity
- [ ] `70_AUTOMATION/orchestrator/orchestrator.py` exists by default.
- [ ] `70_AUTOMATION/orchestrator/rules.yaml` contains "rules" key.
- [ ] `runtime/bus/input` exists (or is created on startup).

## 3. Policy Adherence
- [ ] **Read-Only**: `00_CONSTITUTION` content matches the Master Library (SHA check if possible).
- [ ] **Overlay**: Custom rules are in `kdy-addon/overlay`, not modifying Core files.
- [ ] **Exclusion**: `package.json` or `.gitignore` excludes `kdy-addon` from production.
  - See [BUILD_VERIFICATION_CHECKLIST.md](../../50_TEMPLATES/BUILD_VERIFICATION_CHECKLIST.md) for detailed verification steps.

## 4. Run Automated Check
```bash
python 70_AUTOMATION/compliance/compliance_check.py
```
- [ ] Output must be `SUCCESS`.
