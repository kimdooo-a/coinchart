# REGULATION: API MANAGEMENT POLICY

## 1. Governance Model
- **Source of Truth**: `kdy-addon/Poly-Tech2/docs/65_API_CATALOG` (The Library).
- **Runtime Configuration**: `[Project Root]/config/apis` (The Implementation).
- **Secrets**: `[Project Root]/.env` (Local, Machine-Specific).

## 2. Directory Mapping (Internalization)
When a project consumes the API Catalog, it MUST copy the following:

| Source (Library) | Destination (Project) | Purpose |
| :--- | :--- | :--- |
| `registry.yaml` | `config/apis/registry.yaml` | Service Definitions |
| `specs/*.json` | `config/apis/specs/*.json` | Schemas/Contracts |
| `env/.env.example` | `[Root]/.env.example` | Template for developers |
| `env/env.schema.json` | `config/env.schema.json` | Validation Logic |

## 3. Secret Management
### 3.1 The `.env` File
- **Location**: Project Root.
- **Content**: Real API keys, Secrets.
- **Git Policy**: **STRICTLY IGNORED** via `.gitignore`.

### 3.2 The `.env.example` File
- **Location**: Project Root.
- **Content**: Keys ONLY (Values must be empty or logic placeholders).
- **Git Policy**: COMMITTED to repo.

## 4. Updates
- When `Poly-Tech2` is updated, the **Project Implementation** (`config/apis`) accepts the new `registry.yaml`.
- The developer must manually update `.env` if new keys are introduced (checked against `.env.example`).
