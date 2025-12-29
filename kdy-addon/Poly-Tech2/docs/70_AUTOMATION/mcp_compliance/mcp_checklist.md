# MCP Compliance Checklist

## 1. Safety
- [ ] **No Hardcoded Tokens**: Verify `env_keys` in `servers/*.yaml` lists ONLY the variable names (e.g., `GITHUB_TOKEN`), not values.
- [ ] **Scoped Write Access**: If `security.filesystem` is `read-write`, ensure the command `args` restrict the path (e.g., `{{PROJECT_ROOT}}`).

## 2. Integrity
- [ ] **Registry Linkage**: Every file in `servers/` is referenced in `registry.yaml`.
- [ ] **Profile Validity**: Every server ID in `profiles/*.yaml` exists in the registry.

## 3. Deployment
- [ ] **Export Policy**: Users are aware they must NOT edit generated JSON configs manually.
- [ ] **Environment**: `.env` is properly ignored in the project root.

## 4. Automation
Run the checker:
```bash
python 70_AUTOMATION/mcp_compliance/mcp_compliance_check.py
```
