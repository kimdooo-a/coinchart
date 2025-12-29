"""
Poly-Tech2 Orchestrator DSL - Reference Implementation Stub
This script demonstrates how to parse L30_ORCHESTRATION_DSL logic and route events.
Note: This is a governance reference, not a production-grade file watcher.
"""

import fnmatch
import os
import yaml

class Orchestrator:
    def __init__(self, rule_file_path):
        self.rules = self._load_rules(rule_file_path)
        self.context = {"phase": "0"} # Default Phase

    def _load_rules(self, path):
        # In a real impl, this would read L30_ORCHESTRATION_DSL.md (extracting YAML)
        # For this stub, we simulate a loaded rule set consistent with L30.
        return [
            {
                "id": "RULE_001_TASK_INTAKE",
                "trigger": {"event": "file_created", "path_pattern": "runtime/bus/input/TASK_*.md"},
                "condition": {"phase": "*"},
                "action": {"type": "route", "target": "TO_CURSOR", "template": "prompts/09_Automation.md"}
            },
            {
                "id": "RULE_099_EMERGENCY",
                "trigger": {"event": "file_created", "path_pattern": "runtime/bus/input/EMERGENCY_*.md"},
                "condition": {"phase": "*"},
                "action": {"type": "notify", "target": "TO_HUMAN", "msg": "EMERGENCY STOP TRIGGERED"}
            }
        ]

    def handle_event(self, event_type, file_path):
        print(f"[Event] {event_type}: {file_path}")
        
        for rule in self.rules:
            if self._matches_trigger(rule, event_type, file_path):
                if self._check_condition(rule):
                    self._execute_action(rule, file_path)
                    return # Stop after first match (Priority First)

    def _matches_trigger(self, rule, event_type, file_path):
        t = rule['trigger']
        if t['event'] != event_type:
            return False
        # Normalize paths for matching
        rel_path = os.path.relpath(file_path).replace("\\", "/")
        return fnmatch.fnmatch(rel_path, t['path_pattern'])

    def _check_condition(self, rule):
        cond = rule['condition']
        if cond['phase'] == "*":
            return True
        return cond['phase'] == self.context['phase']

    def _execute_action(self, rule, file_path):
        action = rule['action']
        print(f"  -> MATCHED: {rule['id']}")
        print(f"  -> EXECUTING: {action['type']} -> {action['target']}")
        # In real runtime, this would move files or append to markdown channels.

# Mock Execution
if __name__ == "__main__":
    orch = Orchestrator("docs/10_LAWS/L30_ORCHESTRATION_DSL.md")
    
    # Simulate an event
    orch.handle_event("file_created", "runtime/bus/input/TASK_Refactor_Login.md")
