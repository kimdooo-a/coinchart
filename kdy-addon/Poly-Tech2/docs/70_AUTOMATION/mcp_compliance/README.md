# MCP Compliance Tools

## script: mcp_compliance_check.py
Validates the structure and security of the `66_MCP_CATALOG`.

### Checks
1.  **Secret leaks**: Regex scan for keys in YAML.
2.  **Environment Integrity**: Validates `env_keys` format.
3.  **Filesystem Safety**: Enforces scoped variables (`{{VAR}}`) for any read-write server.
4.  **Referential Integrity**: Ensures profiles point to valid servers.

## usage
```bash
python mcp_compliance_check.py
```
