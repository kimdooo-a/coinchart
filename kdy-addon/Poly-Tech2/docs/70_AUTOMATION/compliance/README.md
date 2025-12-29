# Compliance Automation

## Purpose
Ensures that the `Poly-Tech2` document library maintains its structural integrity when distributed to various projects.

## Contents
- **compliance_check.py**: A standalone script to verify file existence and types against the Constitution's requirements.
- **compliance_checklist.md**: A human-readable version of the validation logic.

## Usage
Run the script from the root of the library (or any subfolder):
```bash
python 70_AUTOMATION/compliance/compliance_check.py
```

## Exit Codes
- `0`: Compliant.
- `1`: Violation detected (Missing files or Type mismatch).
