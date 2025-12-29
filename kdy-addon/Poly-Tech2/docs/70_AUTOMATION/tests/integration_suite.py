#!/usr/bin/env python
"""
Poly-Tech2 Integration Test Suite
Master test runner for all system tests
"""

import sys
import time
import unittest
from io import StringIO

# Import all test modules
import test_lock_manager
import test_routing
import test_orchestrator
import test_compliance

class ColoredTextTestResult(unittest.TextTestResult):
    """Custom test result class with colored output"""

    def addSuccess(self, test):
        super().addSuccess(test)

    def addError(self, test, err):
        super().addError(test, err)

    def addFailure(self, test, err):
        super().addFailure(test, err)


def print_banner():
    """Print test suite banner"""
    print("=" * 50)
    print("  Poly-Tech2 Integration Test Suite")
    print("=" * 50)
    print()


def run_test_module(module, module_name, test_number, total_tests):
    """Run tests from a single module and return results"""
    print(f"[{test_number}/{total_tests}] {module_name}...", end=" ", flush=True)

    # Capture output
    test_output = StringIO()
    runner = unittest.TextTestRunner(stream=test_output, verbosity=0)

    # Load and run tests
    suite = unittest.TestLoader().loadTestsFromModule(module)
    start_time = time.time()
    result = runner.run(suite)
    elapsed = time.time() - start_time

    # Calculate results
    total = result.testsRun
    passed = total - len(result.failures) - len(result.errors)
    failed = len(result.failures) + len(result.errors)

    # Print results
    if result.wasSuccessful():
        print(f"PASS ({passed}/{total}) [{elapsed:.2f}s]")
        status = "PASS"
    else:
        print(f"FAIL ({passed}/{total}, {failed} failed) [{elapsed:.2f}s]")
        status = "FAIL"

        # Print failure details
        for test, traceback in result.failures + result.errors:
            print(f"  ✗ {test} FAILED")
            if '-v' in sys.argv or '--verbose' in sys.argv:
                print(f"    {traceback}")

    return {
        "name": module_name,
        "total": total,
        "passed": passed,
        "failed": failed,
        "status": status,
        "elapsed": elapsed,
        "result": result
    }


def print_summary(results, total_elapsed):
    """Print test suite summary"""
    print()
    print("=" * 50)
    print("  Summary")
    print("=" * 50)

    total_tests = sum(r['total'] for r in results)
    total_passed = sum(r['passed'] for r in results)
    total_failed = sum(r['failed'] for r in results)

    all_passed = all(r['status'] == "PASS" for r in results)

    if all_passed:
        print(f"TOTAL: {total_passed}/{total_tests} PASS")
        print(f"Result: SUCCESS [OK]")
    else:
        print(f"TOTAL: {total_passed}/{total_tests} PASS ({total_failed} FAILED)")
        print(f"Result: FAILURE [FAILED]")
        print()
        print("Failed test modules:")
        for r in results:
            if r['status'] == "FAIL":
                print(f"  - {r['name']}")

    print(f"Execution Time: {total_elapsed:.2f}s")
    print("=" * 50)


def main():
    """Main test suite entry point"""
    print_banner()

    # Define test modules to run (in order)
    test_modules = [
        (test_lock_manager, "Lock Manager Tests"),
        (test_routing, "Routing Tests"),
        (test_orchestrator, "Orchestrator Tests"),
        (test_compliance, "Compliance Tests"),
    ]

    # Run all test modules
    results = []
    total_start = time.time()

    for i, (module, name) in enumerate(test_modules, 1):
        result = run_test_module(module, name, i, len(test_modules))
        results.append(result)

    total_elapsed = time.time() - total_start

    # Print summary
    print_summary(results, total_elapsed)

    # Exit with appropriate code
    all_passed = all(r['status'] == "PASS" for r in results)
    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    main()
