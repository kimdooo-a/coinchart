import unittest
import os
import sys
import json

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

class TestCompliance(unittest.TestCase):
    """Compliance tests for Constitution and policy adherence"""

    def setUp(self):
        """Set up paths to docs structure"""
        self.docs_root = os.path.join(os.path.dirname(__file__), '..', '..')
        self.docs_root = os.path.abspath(self.docs_root)

    def test_a_runtime_contract_readability(self):
        """Test A: Runtime contracts exist and are readable"""
        contracts_dir = os.path.join(self.docs_root, '80_RUNTIME_CONTRACTS')

        # Test CLAUDE.md exists
        claude_contract = os.path.join(contracts_dir, 'CLAUDE.md')
        self.assertTrue(os.path.exists(claude_contract),
                       "CLAUDE.md runtime contract must exist")

        # Verify it's readable and contains lock requirements
        with open(claude_contract, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn("agent_lock", content.lower(),
                         "CLAUDE.md should reference .agent_lock")
            self.assertIn("Lock", content,
                         "CLAUDE.md should contain lock governance references")

        # Test .cursorrules exists
        cursorrules = os.path.join(contracts_dir, '.cursorrules')
        self.assertTrue(os.path.exists(cursorrules),
                       ".cursorrules runtime contract must exist")

        # Test rules.md exists
        rules_md = os.path.join(contracts_dir, 'rules.md')
        self.assertTrue(os.path.exists(rules_md),
                       "rules.md runtime contract must exist")

        # Verify rules.md contains constitutional references
        with open(rules_md, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn("Constitution", content,
                         "rules.md should reference Constitution")
            self.assertIn("manifest.json", content,
                         "rules.md should reference manifest.json")

    def test_b_lock_enforcement_simulation(self):
        """Test B: Simulate agent respecting .agent_lock"""
        # Simulate a mock agent checking for locks before writing
        test_file = os.path.join(os.path.dirname(__file__), 'mocks', 'compliance_test_file.txt')
        lock_file = f"{test_file}.agent_lock"

        # Cleanup first
        for f in [test_file, lock_file]:
            if os.path.exists(f):
                os.remove(f)

        # Scenario 1: No lock - agent should proceed
        def mock_agent_write_with_lock_check(filepath):
            """Mock agent that checks for locks before writing"""
            lock_path = f"{filepath}.agent_lock"
            if os.path.exists(lock_path):
                return {"allowed": False, "reason": "lock exists"}
            else:
                with open(filepath, 'w') as f:
                    f.write("agent wrote this")
                return {"allowed": True, "written": True}

        # Test without lock
        result = mock_agent_write_with_lock_check(test_file)
        self.assertTrue(result['allowed'], "Agent should proceed when no lock")
        self.assertTrue(os.path.exists(test_file), "File should be written")

        # Scenario 2: Lock exists - agent should abort
        # Create lock
        with open(lock_file, 'w') as f:
            json.dump({"owner": {"agent": "other_agent"}}, f)

        os.remove(test_file)  # Remove file
        result = mock_agent_write_with_lock_check(test_file)

        self.assertFalse(result['allowed'], "Agent should abort when lock exists")
        self.assertFalse(os.path.exists(test_file), "File should NOT be written when locked")

        # Cleanup
        if os.path.exists(lock_file):
            os.remove(lock_file)

    def test_c_constitutional_compliance(self):
        """Test C: Verify Constitutional structure compliance"""
        # Import REQUIRED_STRUCTURE from compliance_check.py
        sys.path.insert(0, os.path.join(self.docs_root, '70_AUTOMATION', 'compliance'))
        from compliance_check import REQUIRED_STRUCTURE

        # Verify 00_CONSTITUTION files exist
        constitution_files = [
            path for path in REQUIRED_STRUCTURE.keys()
            if path.startswith('00_CONSTITUTION/')
        ]

        self.assertGreater(len(constitution_files), 0,
                          "REQUIRED_STRUCTURE should define Constitution files")

        # Verify each Constitution file exists
        for rel_path in constitution_files:
            full_path = os.path.join(self.docs_root, rel_path)
            self.assertTrue(os.path.exists(full_path),
                           f"Constitutional file {rel_path} must exist")

        # Verify manifest.json exists
        manifest_path = os.path.join(self.docs_root, 'manifest.json')
        self.assertTrue(os.path.exists(manifest_path),
                       "manifest.json must exist")

        # Verify manifest.json has injection_priority
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
            self.assertIn('injection_priority', manifest,
                         "manifest.json must define injection_priority")

            priority = manifest['injection_priority']
            self.assertIn('00_CONSTITUTION', priority,
                         "Constitution must be in injection_priority")
            self.assertIn('10_LAWS', priority,
                         "Laws must be in injection_priority")
            self.assertIn('80_RUNTIME_CONTRACTS', priority,
                         "Runtime contracts must be in injection_priority")

            # Verify Constitution is FIRST (highest priority)
            self.assertEqual(priority[0], '00_CONSTITUTION',
                           "Constitution must be first in injection_priority")

        # Verify compliance_check.py validates manifest.json
        self.assertIn('manifest.json', REQUIRED_STRUCTURE,
                     "compliance_check.py should validate manifest.json existence")

def run_tests():
    """Run all compliance tests"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestCompliance)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
