# MCP Security Policy

## 1. No Auto-Execution
MCP servers must generally run in a restricted mode.
- **Rule**: `stdio` is preferred over `sse` for local servers to prevent network exposure.

## 2. Token Security
- Tokens must be passed via environment variables, NEVER command line arguments.
- Use `env` mapping in adapter generation.

## 3. Review
- Before adding a generic MCP server (e.g. `npx -y`), verify the package source.
