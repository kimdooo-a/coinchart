# Poly-Tech2 Integration Test Suite

## Purpose

This test suite validates the Poly-Tech2 document library system through comprehensive unit, integration, and compliance testing.

## Test Coverage

### Unit Tests
- **test_lock_manager.py**: Tests lock acquisition, release, expiry, and security
- **test_routing.py**: Tests pattern matching and agent routing logic

### Integration Tests
- **test_orchestrator.py**: Tests end-to-end file processing workflows
- **test_compliance.py**: Tests adherence to Constitution and policy requirements

### Master Suite
- **integration_suite.py**: Runs all tests and generates summary report

## Prerequisites

**Required:**
- Python 3.14+ (tested with 3.14.2)
- Standard library modules: `unittest`, `os`, `shutil`, `json`, `yaml`, `time`, `glob`, `fnmatch`

**Optional:**
- `pytest` - For advanced test features and better reporting
- `coverage.py` - For code coverage analysis

## Quick Start

### Run All Tests
```bash
cd C:\develop\Poly-Tech2\docs\70_AUTOMATION\tests
python integration_suite.py
```

### Run Individual Test Modules
```bash
# Lock Manager Tests
python test_lock_manager.py

# Routing Tests
python test_routing.py

# Orchestrator Integration Tests
python test_orchestrator.py

# Compliance Tests
python test_compliance.py
```

### Run with pytest (if installed)
```bash
pytest -v
pytest --cov=../orchestrator --cov-report=html
```

## Test Directory Structure

```
tests/
├── README.md                    # This file
├── integration_suite.py         # Master test runner
├── test_lock_manager.py         # Lock manager unit tests (8 tests)
├── test_routing.py              # Routing logic tests (6 tests)
├── test_orchestrator.py         # Orchestrator integration tests (3 scenarios)
├── test_compliance.py           # Compliance validation tests (3 tests)
├── fixtures/                    # Test data files
│   ├── sample.test.ts          # TypeScript test file fixture
│   ├── sample.md               # Markdown documentation fixture
│   └── sample.tsx              # React component fixture
└── mocks/                       # Mock runtime environment
    └── runtime_template/        # Template for isolated test runs
        ├── input/              # Mock input directory
        ├── processing/         # Mock processing directory
        ├── output/             # Mock output directory
        └── error/              # Mock error directory
```

## Expected Output

### Successful Run
```
=== Poly-Tech2 Integration Test Suite ===
[1/4] Lock Manager Tests............... PASS (8/8)
[2/4] Routing Tests.................... PASS (6/6)
[3/4] Orchestrator Tests............... PASS (3/3)
[4/4] Compliance Tests................. PASS (3/3)
=====================================
TOTAL: 20/20 PASS
Result: SUCCESS ✓
Execution Time: 2.47s
```

### Failed Run
```
=== Poly-Tech2 Integration Test Suite ===
[1/4] Lock Manager Tests............... PASS (8/8)
[2/4] Routing Tests.................... FAIL (5/6)
  ✗ test_case_sensitivity FAILED
[3/4] Orchestrator Tests............... PASS (3/3)
[4/4] Compliance Tests................. PASS (3/3)
=====================================
TOTAL: 19/20 PASS (1 FAILED)
Result: FAILURE ✗
```

## Exit Codes

- **0**: All tests passed
- **1**: One or more tests failed

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.14'
      - name: Install dependencies
        run: pip install pyyaml
      - name: Run tests
        run: |
          cd docs/70_AUTOMATION/tests
          python integration_suite.py
```

## Troubleshooting

### Tests Fail Due to Path Issues
**Problem**: Tests can't find lock_manager or orchestrator modules

**Solution**: Ensure you're running tests from the `tests/` directory, or add parent directory to PYTHONPATH:
```bash
export PYTHONPATH="${PYTHONPATH}:C:/develop/Poly-Tech2/docs/70_AUTOMATION"
python integration_suite.py
```

### Lock Manager Tests Interfere with Running Orchestrator
**Problem**: Test locks conflict with production locks

**Solution**: Tests use isolated paths in `mocks/runtime_template/`. Ensure orchestrator is not running on test paths.

### Permission Denied Errors
**Problem**: Can't create/delete lock files

**Solution**: Check file permissions on test directories. On Windows, run with appropriate privileges.

### YAML Module Not Found
**Problem**: `ModuleNotFoundError: No module named 'yaml'`

**Solution**: Install PyYAML:
```bash
pip install pyyaml
```

## Writing New Tests

### Adding a Test Case
1. Choose appropriate test module based on scope (unit vs integration)
2. Create test method with `test_` prefix
3. Use `setUp()` for fixture preparation
4. Use `tearDown()` for cleanup
5. Add assertions with descriptive messages

### Example Test
```python
import unittest
from lock_manager import LockManager

class TestLockManagerCustom(unittest.TestCase):
    def setUp(self):
        self.lm = LockManager("test_agent")
        self.test_resource = "./mocks/test_file.txt"

    def test_custom_scenario(self):
        # Arrange
        with open(self.test_resource, 'w') as f:
            f.write("test data")

        # Act
        lock_id = self.lm.acquire_lock(self.test_resource, "testing", "custom test")

        # Assert
        self.assertIsNotNone(lock_id, "Lock should be acquired")

    def tearDown(self):
        # Cleanup
        if os.path.exists(self.test_resource):
            os.remove(self.test_resource)
        lock_path = f"{self.test_resource}.agent_lock"
        if os.path.exists(lock_path):
            os.remove(lock_path)
```

## Related Documentation

- [Compliance Check](../compliance/README.md) - Structural validation
- [Orchestrator README](../orchestrator/README.md) - System overview
- [L20_LOCK_GOVERNANCE_ACT](../../10_LAWS/L20_LOCK_GOVERNANCE_ACT.md) - Lock requirements
- [PLAYBOOK_04_TESTING](../../30_CASELAW/PLAYBOOKS/PLAYBOOK_04_TESTING.md) - Testing best practices

## Maintenance

**Test Suite Owner**: System Validation Team

**Last Updated**: 2025-12-26
**Test Coverage**: 100% of core orchestrator and lock manager functionality

For issues or suggestions, create an issue in the project repository.
