import os
import sys

# Define the Expected Structure relative to 'docs/' root
REQUIRED_STRUCTURE = {
    # 00_CONSTITUTION (Supreme Law)
    "00_CONSTITUTION/CONSTITUTION.md": "file",
    "00_CONSTITUTION/PRINCIPLES.md": "file",
    "00_CONSTITUTION/ROLES_AND_POWERS.md": "file",
    "00_CONSTITUTION/SAFETY_GATES.md": "file",
    
    # 10_LAWS (Core Acts)
    "10_LAWS/L10_ROUTING_ACT.md": "file",
    "10_LAWS/L20_LOCK_GOVERNANCE_ACT.md": "file",

    # 40_RESEARCH_LIBRARY
    "40_RESEARCH_LIBRARY/43_RULE_CANDIDATES": "dir",
    
    # 60_PROTOCOLS
    "60_PROTOCOLS": "dir",
    
    # 70_AUTOMATION (Runtime)
    "70_AUTOMATION/orchestrator/orchestrator.py": "file",
    "70_AUTOMATION/orchestrator/lock_manager.py": "file",
    "70_AUTOMATION/orchestrator/rules.yaml": "file",

    # 80_RUNTIME_CONTRACTS (Agent Bindings)
    "80_RUNTIME_CONTRACTS/CLAUDE.md": "file",
    "80_RUNTIME_CONTRACTS/.cursorrules": "file",
    "80_RUNTIME_CONTRACTS/rules.md": "file",

    # Manifest (System Metadata)
    "manifest.json": "file",
}

def check_compliance(docs_root):
    print(f"Compliance Check Started on: {docs_root}")
    missing_items = []

    for path, item_type in REQUIRED_STRUCTURE.items():
        full_path = os.path.join(docs_root, path)
        exists = os.path.exists(full_path)
        
        status = "OK" if exists else "MISSING"
        if not exists:
            missing_items.append(path)
            
        # Optional: Check type (file vs dir)
        if exists:
            if item_type == "file" and not os.path.isfile(full_path):
                status = "TYPE_MISMATCH (Expected File)"
                missing_items.append(path)
            elif item_type == "dir" and not os.path.isdir(full_path):
                status = "TYPE_MISMATCH (Expected Dir)"
                missing_items.append(path)

        print(f"[{status}] {path}")

    print("-" * 30)
    if missing_items:
        print(f"FAILED: {len(missing_items)} required items missing or invalid.")
        sys.exit(1)
    else:
        print("SUCCESS: Library structure is compliant.")
        sys.exit(0)

if __name__ == "__main__":
    # Assume script is in docs/70_AUTOMATION/compliance/
    # We want to find docs/ root.
    script_dir = os.path.dirname(os.path.abspath(__file__))
    docs_root = os.path.abspath(os.path.join(script_dir, "../.."))
    
    check_compliance(docs_root)
