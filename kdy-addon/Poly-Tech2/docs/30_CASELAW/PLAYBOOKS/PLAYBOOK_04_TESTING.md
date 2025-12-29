# PLAYBOOK 04: Testing Best Practices

## Overview

This playbook documents best practices, common patterns, and lessons learned from testing the Poly-Tech2 document library system.

## Test Philosophy

### Test Pyramid
```
       /\
      /  \      E2E Tests (Few)
     /____\
    /      \    Integration Tests (Some)
   /________\
  /          \  Unit Tests (Many)
 /____________\
```

- **Unit Tests**: Test individual components in isolation (lock manager, routing logic)
- **Integration Tests**: Test components working together (orchestrator workflows)
- **Compliance Tests**: Validate adherence to Constitution and policies

### Coverage Goals
- 100% coverage of lock manager operations
- 100% coverage of routing patterns
- Representative scenarios for orchestrator workflows
- Structural validation for compliance

## Test Organization

### Directory Structure
```
tests/
├── test_lock_manager.py     # Unit tests
├── test_routing.py           # Unit tests
├── test_orchestrator.py      # Integration tests
├── test_compliance.py        # Compliance tests
├── integration_suite.py      # Master runner
├── fixtures/                 # Test data
└── mocks/                    # Isolated test environments
```

### Naming Conventions
- Test files: `test_<component>.py`
- Test classes: `Test<Component>` (e.g., `TestLockManager`)
- Test methods: `test_<number>_<description>` (e.g., `test_01_acquire_lock_on_free_resource`)
- Fixtures: `sample.<extension>` (e.g., `sample.test.ts`)

## Common Patterns

### Pattern 1: Isolated Test Environment
**Problem**: Tests interfere with actual runtime directories

**Solution**: Use isolated mock directories in `tests/mocks/`
```python
def setUp(self):
    self.test_dir = os.path.join(os.path.dirname(__file__), 'mocks', 'test_temp')
    os.makedirs(self.test_dir, exist_ok=True)

def tearDown(self):
    shutil.rmtree(self.test_dir)
```

### Pattern 2: Lock Testing
**Problem**: Lock files may persist between test runs

**Solution**: Always cleanup in tearDown, even on test failure
```python
def tearDown(self):
    # Remove test files and locks
    for file in os.listdir(self.test_dir):
        try:
            os.remove(os.path.join(self.test_dir, file))
        except:
            pass
```

### Pattern 3: Glob Pattern Matching
**Problem**: fnmatch doesn't handle `**` glob patterns correctly

**Solution**: Use pathlib.Path().match() and prepend directory for testing
```python
from pathlib import Path

def match_rule(self, filename):
    if '/' not in filename:
        filepath = Path('dir') / filename  # Add directory for ** matching
    else:
        filepath = Path(filename)

    for rule in rules:
        if filepath.match(rule['pattern']):
            return rule
```

### Pattern 4: Simulating Agent Behavior
**Problem**: Need to test agent compliance without running actual agents

**Solution**: Create mock agents that simulate key behaviors
```python
def mock_agent_write_with_lock_check(filepath):
    lock_path = f"{filepath}.agent_lock"
    if os.path.exists(lock_path):
        return {"allowed": False, "reason": "lock exists"}
    # Proceed with write...
```

## Common Test Failures

### Failure 1: Lock File Persistence
**Symptom**: `Test fails because lock file already exists`

**Cause**: Previous test didn't clean up lock file

**Solution**:
1. Check tearDown() cleanup logic
2. Add exception handling in tearDown()
3. Use unique test resource paths

**Prevention**: Always use try-except in tearDown()

### Failure 2: Path Separator Issues (Windows vs Unix)
**Symptom**: `Tests pass on Windows but fail on Linux (or vice versa)`

**Cause**: Hard-coded path separators (/ or \)

**Solution**: Always use `os.path.join()` or `pathlib.Path()`
```python
# BAD
path = "mocks/test_dir/file.txt"

# GOOD
path = os.path.join("mocks", "test_dir", "file.txt")
```

### Failure 3: Unicode Encoding Errors
**Symptom**: `UnicodeEncodeError: 'cp949' codec can't encode character`

**Cause**: Using Unicode symbols (✓, ✗) on Windows with cp949 encoding

**Solution**: Use ASCII-safe alternatives
```python
# BAD
print("Result: SUCCESS ✓")

# GOOD
print("Result: SUCCESS [OK]")
```

### Failure 4: Module Import Errors
**Symptom**: `ModuleNotFoundError: No module named 'lock_manager'`

**Cause**: Python can't find the module in parent directory

**Solution**: Add parent directory to sys.path
```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'orchestrator'))
from lock_manager import LockManager
```

## Adding New Tests

### Checklist for New Unit Tests
- [ ] Test file named `test_<component>.py`
- [ ] Test class inherits from `unittest.TestCase`
- [ ] setUp() creates isolated test environment
- [ ] tearDown() cleans up all resources
- [ ] Each test is independent (can run alone)
- [ ] Descriptive test method names
- [ ] Assertions have failure messages
- [ ] Added to integration_suite.py

### Checklist for New Integration Tests
- [ ] Tests realistic end-to-end scenarios
- [ ] Uses actual components (not mocks)
- [ ] Tests happy path AND error paths
- [ ] Verifies side effects (files created, locks released)
- [ ] Cleans up test artifacts

## Running Tests

### Run Individual Test File
```bash
cd docs/70_AUTOMATION/tests
python test_lock_manager.py
```

### Run Specific Test Method
```bash
python -m unittest test_lock_manager.TestLockManager.test_01_acquire_lock_on_free_resource
```

### Run Full Suite
```bash
python integration_suite.py
```

### Run with Verbose Output
```bash
python integration_suite.py --verbose
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        python-version: ['3.10', '3.11', '3.12', '3.14']

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install dependencies
        run: pip install pyyaml

      - name: Run tests
        run: |
          cd docs/70_AUTOMATION/tests
          python integration_suite.py

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.os }}-${{ matrix.python-version }}
          path: docs/70_AUTOMATION/tests/
```

## Performance Benchmarks

### Current Performance (as of 2025-12-26)
- Lock Manager Tests: 0.03s (8 tests)
- Routing Tests: 0.01s (6 tests)
- Orchestrator Tests: 0.03s (3 tests)
- Compliance Tests: 0.00s (3 tests)
- **Total Suite: 0.07s (20 tests)**

### Performance Targets
- Individual test: < 100ms
- Test module: < 1s
- Full suite: < 30s

If tests exceed these targets, investigate:
- Unnecessary file I/O
- Missing cleanup (accumulating files)
- Inefficient loops or operations

## Test Data Management

### Test Fixtures
Location: `tests/fixtures/`

Purpose: Provide realistic sample files for routing tests

Maintenance:
- Keep fixtures minimal (< 1KB each)
- One fixture per file type/pattern
- Update when rules.yaml changes

### Mock Environments
Location: `tests/mocks/`

Purpose: Isolated runtime directories for integration tests

Cleanup:
- Automatically cleaned in tearDown()
- Not committed to git (add to .gitignore if persistent)

## Debugging Tests

### Verbose Output
```bash
python test_lock_manager.py -v
```

### Print Debugging
Add debug output in tests:
```python
def test_example(self):
    result = some_function()
    print(f"DEBUG: result = {result}")  # Will show in test output
    self.assertEqual(result, expected)
```

### Interactive Debugging
```bash
python -m pdb test_lock_manager.py
```

Common pdb commands:
- `n` - next line
- `s` - step into function
- `c` - continue execution
- `p variable` - print variable value
- `l` - list source code

## Related Documentation

- [Test Suite README](../../70_AUTOMATION/tests/README.md) - How to run tests
- [L20_LOCK_GOVERNANCE_ACT](../../10_LAWS/L20_LOCK_GOVERNANCE_ACT.md) - Lock requirements being tested
- [Compliance README](../../70_AUTOMATION/compliance/README.md) - Structural validation

## Revision History

- **2025-12-26**: Initial playbook created for STEP 17 (Integration Testing)
  - Documented test patterns and common failures
  - Added CI/CD integration examples
  - Established performance benchmarks
