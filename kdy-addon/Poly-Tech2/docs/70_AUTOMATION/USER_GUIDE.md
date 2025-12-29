# User Guide: Local Execution Layer (MVP)

## Introduction
The Local Execution Layer allows you to run the Poly-Tech2 orchestration logic on your local machine. It uses a **File-Based Message Exchange System (F-MES)** to simulate agent communication.

## Quick Start

### 1. Start the Orchestrator
Open a terminal in `docs/70_AUTOMATION/orchestrator` and run:
```bash
python orchestrator.py
```
*The system is now watching `runtime/bus/input`.*

### 2. Trigger an Action
Create a test file in the input directory:
```bash
echo "Hello World" > c:/develop/Poly-Tech2/runtime/bus/input/hello.md
```

### 3. Observe Results
- **Console**: You will see "[Event] Detected: hello.md" -> "Routing to: Antigravity".
- **File System**: The file will move from `input` -> `processing` -> `output`.
- **Locking**: During processing, a `.agent_lock` will briefly appear (simulated).

## Configuration
- Modify `rules.yaml` to change which agent handles which file type.
- This enforces **Law 10 (Routing Act)** immediately without code changes.

## Testing

### Running Integration Tests
The system includes a comprehensive test suite to verify all components work correctly.

**Quick Test:**
```bash
cd docs/70_AUTOMATION/tests
python integration_suite.py
```

**Expected Output:**
```
==================================================
  Poly-Tech2 Integration Test Suite
==================================================

[1/4] Lock Manager Tests... PASS (8/8) [0.03s]
[2/4] Routing Tests... PASS (6/6) [0.01s]
[3/4] Orchestrator Tests... PASS (3/3) [0.03s]
[4/4] Compliance Tests... PASS (3/3) [0.00s]

==================================================
  Summary
==================================================
TOTAL: 20/20 PASS
Result: SUCCESS [OK]
Execution Time: 0.07s
==================================================
```

### Test Coverage
- **Unit Tests**: Lock manager (8 tests), Routing logic (6 tests)
- **Integration Tests**: Orchestrator workflows (3 scenarios)
- **Compliance Tests**: Constitutional adherence (3 tests)

### Individual Test Modules
```bash
# Test specific components
python test_lock_manager.py      # Lock acquisition/release
python test_routing.py            # Pattern matching
python test_orchestrator.py       # End-to-end workflows
python test_compliance.py         # Policy validation
```

For detailed testing documentation, see:
- [Test Suite README](tests/README.md)
- [PLAYBOOK_04_TESTING](../30_CASELAW/PLAYBOOKS/PLAYBOOK_04_TESTING.md)

## Troubleshooting
- **Stale Locks**: If the script crashes, a `.agent_lock` might remain. Delete it manually or implement the watchdog cleaner.
- **Errors**: Failed files move to `runtime/bus/error`.
- **Test Failures**: Run `python integration_suite.py --verbose` for detailed error output.
