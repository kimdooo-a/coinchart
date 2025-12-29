# Project Overrides Example

## Target: CLAUDE.md
**Path**: `80_RUNTIME_CONTRACTS/CLAUDE.md`

### Original Rule:
> "Run tests (`npm test`) after every batch change."

### Project Override (Overlay):
> "Run tests (`./gradlew test`) after every batch change."

## Target: rules.yaml
**Path**: `70_AUTOMATION/orchestrator/rules.yaml`

### Extension:
```yaml
- name: "Java Backend"
  pattern: "**/*.java"
  target_agent: "Claude Code"
  action: "compile_and_test"
```
