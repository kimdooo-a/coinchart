# CHECKLIST: PROJECT API INSTALLATION

Use this guide to initialize API connectivity in your project using the Poly-Tech2 Catalog.

## 1. Directory Setup
- [ ] Create `config/apis` directory.
- [ ] Create `config/apis/specs` directory.

## 2. Copy Resources
- [ ] Copy `kdy-addon/Poly-Tech2/docs/65_API_CATALOG/registry.yaml` -> `config/apis/registry.yaml`.
- [ ] Copy `kdy-addon/Poly-Tech2/docs/65_API_CATALOG/specs/*` -> `config/apis/specs/`.
- [ ] Copy `kdy-addon/Poly-Tech2/docs/65_API_CATALOG/env/env.schema.json` -> `config/env.schema.json`.

## 3. Environment Setup
- [ ] **Example File**: Cat `kdy-addon/.../env/.env.example` >> `.env.example`.
- [ ] **Local Secrets**: Copy `.env.example` -> `.env`.
- [ ] **Fill Secrets**: Enter real API keys into `.env`.

## 4. Security Verification
- [ ] Check `.gitignore`: Ensure `.env` is ignored.
- [ ] Check `.env.example`: Ensure NO real secrets are committed.

## 5. Automation (Optional)
- [ ] Config loader script reads `config/apis/registry.yaml`.
- [ ] Config loader validates `.env` against `config/env.schema.json`.
