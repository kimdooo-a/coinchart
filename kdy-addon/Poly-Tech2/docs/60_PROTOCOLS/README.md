# 60_PROTOCOLS - Machine-Readable Schemas

## Status: Reserved for Future Use

This directory is reserved for machine-readable protocol definitions that will standardize agent communication and system behavior.

## Planned Contents

### Task Protocols
- **task_schema.json**: JSON Schema defining task structure, priorities, and metadata
- **task_lifecycle.md**: State machine for task progression (PENDING → IN_PROGRESS → COMPLETE/FAILED)

### Lock Protocols
- **lock_protocol.md**: Formal specification for `.agent_lock` file format
- **lock_schema.json**: JSON Schema for lock metadata (agent ID, timestamp, scope)

### Communication Protocols
- **message_format.json**: Standard format for inter-agent messages
- **bus_protocol.md**: File-based message bus specifications (input/processing/output/error)

### Agent Contracts
- **agent_interface.json**: JSON Schema for agent capability declarations
- **handoff_protocol.md**: Formal rules for agent-to-agent task transfers

## Injection Rule

Per `manifest.json`, protocols are injected `ON_DEMAND`:
- Agents should not load these schemas by default
- Only load when validating or generating protocol-compliant artifacts
- Use for tooling (linters, validators, generators) rather than runtime

## Development Notes

When creating protocols:
1. Define human-readable `.md` specification first
2. Extract JSON Schema for machine validation
3. Add validation scripts to `70_AUTOMATION/validators/`
4. Update `compliance_check.py` if protocols become mandatory
