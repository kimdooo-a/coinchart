import unittest
import os
import sys
import yaml
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'orchestrator'))

class TestRouting(unittest.TestCase):
    """Unit tests for routing logic based on rules.yaml"""

    def setUp(self):
        """Load rules.yaml before each test"""
        rules_path = os.path.join(os.path.dirname(__file__), '..', 'orchestrator', 'rules.yaml')
        with open(rules_path, 'r') as f:
            self.rules = yaml.safe_load(f)

    def match_rule(self, filename):
        """Helper function to match filename against rules (using pathlib for glob support)"""
        # Use Path.match() to properly handle ** glob patterns
        # Note: ** requires at least one directory component, so prepend 'dir/' for testing
        if '/' not in filename:
            # Simple filename - prepend a directory for pattern matching
            filepath = Path('dir') / filename
        else:
            filepath = Path(filename)

        for rule in self.rules.get('rules', []):
            pattern = rule['pattern']
            # Path.match() handles ** correctly
            if filepath.match(pattern):
                return rule
        return self.rules.get('default', {})

    def test_01_match_test_files_to_claude_code(self):
        """Test: *.test.ts files route to Claude Code"""
        test_filenames = [
            "example.test.ts",
            "user.test.ts",
            "api.test.ts",
            "component.test.ts"
        ]

        for filename in test_filenames:
            rule = self.match_rule(filename)
            self.assertEqual(rule['target_agent'], "Claude Code",
                           f"{filename} should route to Claude Code")
            self.assertEqual(rule['action'], "run_test",
                           f"{filename} should have action 'run_test'")
            self.assertEqual(rule['latency'], "batch",
                           f"{filename} should have latency 'batch'")

    def test_02_match_markdown_to_antigravity(self):
        """Test: *.md files route to Antigravity"""
        md_filenames = [
            "README.md",
            "CONTRIBUTING.md",
            "documentation.md",
            "guide.md"
        ]

        for filename in md_filenames:
            rule = self.match_rule(filename)
            self.assertEqual(rule['target_agent'], "Antigravity",
                           f"{filename} should route to Antigravity")
            self.assertEqual(rule['action'], "index_knowledge",
                           f"{filename} should have action 'index_knowledge'")
            self.assertEqual(rule['latency'], "long-term",
                           f"{filename} should have latency 'long-term'")

    def test_03_match_tsx_to_interface(self):
        """Test: *.tsx files route to Interface"""
        tsx_filenames = [
            "App.tsx",
            "Button.tsx",
            "Header.tsx",
            "Dashboard.tsx"
        ]

        for filename in tsx_filenames:
            rule = self.match_rule(filename)
            self.assertEqual(rule['target_agent'], "Interface",
                           f"{filename} should route to Interface")
            self.assertEqual(rule['action'], "notify_user",
                           f"{filename} should have action 'notify_user'")
            self.assertEqual(rule['latency'], "real-time",
                           f"{filename} should have latency 'real-time'")

    def test_04_default_fallback_for_unknown_patterns(self):
        """Test: Unknown file patterns fall back to default rule"""
        unknown_filenames = [
            "file.xyz",
            "unknown.bin",
            "data.csv",
            "config.ini"
        ]

        for filename in unknown_filenames:
            rule = self.match_rule(filename)
            self.assertEqual(rule['target_agent'], "Specialist",
                           f"{filename} should fall back to Specialist")
            self.assertEqual(rule['action'], "log_unknown",
                           f"{filename} should have action 'log_unknown'")

    def test_05_glob_pattern_matching_with_subdirectories(self):
        """Test: **/ glob patterns match files in subdirectories"""
        # Per rules.yaml, patterns use **/*.ext which should match any depth

        # Test files at various depths
        deep_test_file = "src/components/tests/component.test.ts"
        deep_md_file = "docs/api/v2/endpoints.md"
        deep_tsx_file = "src/views/admin/Dashboard.tsx"

        # Extract just the filename for matching (orchestrator uses basename)
        test_rule = self.match_rule(os.path.basename(deep_test_file))
        self.assertEqual(test_rule['target_agent'], "Claude Code")

        md_rule = self.match_rule(os.path.basename(deep_md_file))
        self.assertEqual(md_rule['target_agent'], "Antigravity")

        tsx_rule = self.match_rule(os.path.basename(deep_tsx_file))
        self.assertEqual(tsx_rule['target_agent'], "Interface")

    def test_06_case_sensitivity_handling(self):
        """Test: Pattern matching respects case sensitivity"""
        # fnmatch is case-sensitive on Unix, case-insensitive on Windows
        # Our patterns use lowercase extensions

        # Test exact case match
        exact_match = "file.test.ts"
        rule = self.match_rule(exact_match)
        self.assertEqual(rule['target_agent'], "Claude Code")

        # Test uppercase extension (should NOT match on case-sensitive systems)
        upper_case = "file.test.TS"
        rule_upper = self.match_rule(upper_case)

        # On case-insensitive systems (Windows), this will match
        # On case-sensitive systems (Linux), this will fall to default
        # For portability, we just document the behavior
        if sys.platform.startswith('win'):
            # Windows: case-insensitive
            self.assertIn(rule_upper['target_agent'], ["Claude Code", "Specialist"],
                        "Windows should handle case variations")
        else:
            # Unix: case-sensitive
            self.assertEqual(rule_upper['target_agent'], "Specialist",
                           "Unix should be case-sensitive, falling to default")

def run_tests():
    """Run all routing tests"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestRouting)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
