import unittest
import os
import sys
import shutil
import json
import yaml
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'orchestrator'))
from lock_manager import LockManager

class TestOrchestrator(unittest.TestCase):
    """Integration tests for orchestrator end-to-end workflow"""

    def setUp(self):
        """Create isolated test runtime environment"""
        self.test_root = os.path.join(os.path.dirname(__file__), 'mocks', 'orchestrator_test')
        self.input_dir = os.path.join(self.test_root, 'input')
        self.processing_dir = os.path.join(self.test_root, 'processing')
        self.output_dir = os.path.join(self.test_root, 'output')
        self.error_dir = os.path.join(self.test_root, 'error')

        # Create directories
        for d in [self.input_dir, self.processing_dir, self.output_dir, self.error_dir]:
            os.makedirs(d, exist_ok=True)

        # Load rules
        rules_path = os.path.join(os.path.dirname(__file__), '..', 'orchestrator', 'rules.yaml')
        with open(rules_path, 'r') as f:
            self.rules = yaml.safe_load(f)

        self.lm = LockManager("orchestrator_test")

    def tearDown(self):
        """Clean up test environment"""
        if os.path.exists(self.test_root):
            shutil.rmtree(self.test_root)

    def match_rule(self, filename):
        """Match filename against rules (mimics orchestrator logic)"""
        filepath = Path('dir') / filename  # Add directory for ** pattern matching
        for rule in self.rules.get('rules', []):
            if filepath.match(rule['pattern']):
                return rule
        return self.rules.get('default', {})

    def simulate_orchestrator_process(self, filename, content="test data"):
        """Simulate orchestrator processing a file"""
        # 1. Create file in input
        input_file = os.path.join(self.input_dir, filename)
        with open(input_file, 'w') as f:
            f.write(content)

        # 2. Match routing rule
        rule = self.match_rule(filename)

        # 3. Acquire lock
        lock_id = self.lm.acquire_lock(input_file, rule['action'], f"Routing to {rule['target_agent']}")

        if not lock_id:
            return None  # Lock conflict

        # 4. Process (move to processing)
        try:
            processing_file = os.path.join(self.processing_dir, filename)
            shutil.move(input_file, processing_file)

            # 5. Simulate agent work (instant for test)
            # (In real scenario, agent would process here)

            # 6. Move to output
            output_file = os.path.join(self.output_dir, f"PROCESSED_{filename}")
            shutil.move(processing_file, output_file)

            return {"status": "success", "output": output_file, "rule": rule}

        except Exception as e:
            # Move to error on failure
            error_file = os.path.join(self.error_dir, filename)
            if os.path.exists(input_file):
                shutil.move(input_file, error_file)
            return {"status": "error", "error": str(e)}

        finally:
            # Release lock
            self.lm.release_lock(input_file, lock_id)

    def test_scenario_a_happy_path(self):
        """Test Scenario A: Happy path - file processed successfully"""
        # Test with markdown file
        filename = "test.md"

        result = self.simulate_orchestrator_process(filename, "# Test Document")

        # Assertions
        self.assertIsNotNone(result, "Processing should succeed")
        self.assertEqual(result['status'], "success")
        self.assertEqual(result['rule']['target_agent'], "Antigravity")
        self.assertEqual(result['rule']['action'], "index_knowledge")

        # Verify file exists in output
        expected_output = os.path.join(self.output_dir, "PROCESSED_test.md")
        self.assertTrue(os.path.exists(expected_output), "File should be in output directory")

        # Verify file NOT in input
        input_file = os.path.join(self.input_dir, filename)
        self.assertFalse(os.path.exists(input_file), "File should not remain in input")

        # Verify lock removed
        lock_file = f"{input_file}.agent_lock"
        self.assertFalse(os.path.exists(lock_file), "Lock should be released")

    def test_scenario_b_lock_conflict(self):
        """Test Scenario B: Lock conflict - file processing skipped"""
        filename = "locked_file.test.ts"

        # 1. Create file
        input_file = os.path.join(self.input_dir, filename)
        with open(input_file, 'w') as f:
            f.write("console.log('test');")

        # 2. Manually acquire lock (simulate another agent)
        other_agent = LockManager("competing_agent")
        lock_id = other_agent.acquire_lock(input_file, "testing", "competing lock")
        self.assertIsNotNone(lock_id, "Competing lock should be acquired")

        # 3. Attempt to process (should fail due to lock)
        result = self.simulate_orchestrator_process(filename)

        # Assertions
        self.assertIsNone(result, "Processing should be skipped due to lock conflict")

        # Verify file remains in input (not moved)
        self.assertTrue(os.path.exists(input_file), "File should remain in input when locked")

        # Cleanup: release lock
        other_agent.release_lock(input_file, lock_id)

    def test_scenario_c_error_handling(self):
        """Test Scenario C: Error handling - file moved to error directory"""
        filename = "error_trigger.tsx"

        # Create file
        input_file = os.path.join(self.input_dir, filename)
        with open(input_file, 'w') as f:
            f.write("export const Component = () => <div>Test</div>;")

        # Match rule
        rule = self.match_rule(filename)

        # Acquire lock
        lock_id = self.lm.acquire_lock(input_file, rule['action'], "test")

        # Simulate error during processing
        try:
            processing_file = os.path.join(self.processing_dir, filename)
            shutil.move(input_file, processing_file)

            # Simulate error (e.g., processing failure)
            raise Exception("Simulated processing error")

        except Exception as e:
            # Handle error - move to error directory
            error_file = os.path.join(self.error_dir, filename)
            if os.path.exists(processing_file):
                shutil.move(processing_file, error_file)
            error_result = {"status": "error", "error": str(e)}

        finally:
            # Release lock
            # Note: input_file no longer exists, but lock path is based on original path
            self.lm.release_lock(input_file, lock_id)

        # Assertions
        self.assertEqual(error_result['status'], "error")

        # Verify file in error directory
        expected_error = os.path.join(self.error_dir, filename)
        self.assertTrue(os.path.exists(expected_error), "File should be in error directory")

        # Verify file NOT in output
        output_file = os.path.join(self.output_dir, f"PROCESSED_{filename}")
        self.assertFalse(os.path.exists(output_file), "File should not be in output on error")

        # Verify lock released
        lock_file = f"{input_file}.agent_lock"
        self.assertFalse(os.path.exists(lock_file), "Lock should be released even on error")

def run_tests():
    """Run all orchestrator integration tests"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestOrchestrator)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
