# API Compliance Checklist

## 1. Structure Verification
- [ ] `config/apis/registry.yaml` exists.
- [ ] `config/apis/specs/` contains files referenced in registry.
- [ ] `config/env.schema.json` exists.

## 2. Environment Verification
- [ ] `.env.example` contains ALL keys listed in `registry.yaml` > `env_keys`.
- [ ] `.env` is listed in `.gitignore`.
- [ ] `kdy-addon` is listed in `.npmignore` / `.gitignore`.

## 3. Security Verification
- [ ] Scan `config/apis` for hardcoded secrets (using grep or the automated tool).
- [ ] Ensure `registry.yaml` does NOT contain `value: ...` fields (only key names).

## 4. Automated Check
Run:
```bash
python 70_AUTOMATION/api_sync/compliance/api_compliance_check.py .
```
