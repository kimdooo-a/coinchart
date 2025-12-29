# CHECKLIST: PROJECT API UPDATE

Use this guide when the Poly-Tech2 Library releases a new API Catalog version.

## 1. Sync Registry
- [ ] Overwrite `config/apis/registry.yaml` with new version from `kdy-addon`.
- [ ] Overwrite `config/apis/specs/` with new specs.

## 2. Sync Environment Template
- [ ] Diff `kdy-addon/.../env/.env.example` vs Project `.env.example`.
- [ ] Add any **NEW** keys to Project `.env.example`.
- [ ] **Action**: Notify team of new required variables.

## 3. Update Local Secrets
- [ ] Add new keys to your local `.env`.
- [ ] Run validation (if implemented) using `config/env.schema.json`.

## 4. Regression Test
- [ ] Run `npm test` or `python -m pytest` to verify connectivity with new specs.
- [ ] Verify no deprecated APIs are being used (Check Changelog).
