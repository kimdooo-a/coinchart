# API Synchronization Tool

## Purpose
Automates the propogation of API definitions from the embedded library to the project's active configuration.

## Usage
Run this script whenever you update `Poly-Tech2` (e.g., `git pull` in `kdy-addon`).

```bash
python 70_AUTOMATION/api_sync/sync_api.py "C:/path/to/your/project_root"
```

## Actions Performed
1.  **Registry**: Overwrites `config/apis/registry.yaml`.
2.  **Specs**: Replaces `config/apis/specs/` folder entirely (Clean Sync).
3.  **Schema**: Updates `config/env.schema.json`.
4.  **Environment**: Safe-merges keys from `env/.env.example` into your project's `.env.example`.
    - Note: It does **NOT** touch your real `.env` file (Secrets are safe).

## Requirements
- Python 3.6+
