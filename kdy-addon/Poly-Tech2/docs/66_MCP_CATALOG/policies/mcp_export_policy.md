# MCP Export Policy

## 1. Export Destination
Generated configuration files MUST be placed in:
`config/mcp/exported/`

## 2. Naming Convention
- `claude_desktop_config.json` (for Anthropic Desktop)
- `cursor_mcp.json` (for Cursor)
- `vscode_mcp.json` (for VS Code)

## 3. Generation Process
1.  **Select Profile**: User chooses a profile (e.g., `coding`).
2.  **Load Servers**: System reads `registry.yaml` for server definitions.
3.  **Apply Adapter**: System applies the target adapter (e.g., `adapters/cursor_config_template.json`).
4.  **Write Output**: Resulting JSON is written to `config/mcp/exported/`.

## 4. Constraint
- **Do not edit exported files directly.** They are build artifacts.
- Edit the `registry.yaml` or `profile` instead, then regenerate.
