import os
import sys
import yaml
import re

def check_api_compliance(project_root):
    print(f"API Compliance Check for: {project_root}")
    errors = []

    # Paths
    config_dir = os.path.join(project_root, "config", "apis")
    registry_path = os.path.join(config_dir, "registry.yaml")
    specs_dir = os.path.join(config_dir, "specs")
    env_example_path = os.path.join(project_root, ".env.example")

    # 1. Check Registry Existence
    if not os.path.exists(registry_path):
        errors.append("MISSING: config/apis/registry.yaml")
        print("FAIL: Registry missing")
        return errors

    try:
        with open(registry_path, 'r') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        errors.append(f"INVALID: registry.yaml is not valid YAML - {e}")
        return errors

    # 2. Check Specs & Env Keys
    if "apis" in data:
        with open(env_example_path, 'r') as f:
            env_content = f.read()
            
        for api in data["apis"]:
            # Check Spec
            if "spec_path" in api:
                # spec_path is relative like "./specs/foo.json"
                # We need to resolve it relative to config/apis/
                clean_path = api["spec_path"].replace("./", "")
                full_spec_path = os.path.join(config_dir, clean_path)
                if not os.path.exists(full_spec_path):
                    errors.append(f"MISSING SPEC: {api['id']} -> {clean_path}")

            # Check Env Keys
            if "env_keys" in api:
                for key in api["env_keys"]:
                    if key not in env_content:
                        errors.append(f"MISSING ENV: {key} not found in .env.example")

    # 3. Secret Leak Scan (Heuristic)
    # Scan config/apis for things that look like keys
    suspicious_patterns = [
        re.compile(r"sk-[a-zA-Z0-9]{20,}"), # OpenAI style
        re.compile(r"ghp_[a-zA-Z0-9]{20,}"), # GitHub style
    ]
    
    for root, _, files in os.walk(config_dir):
        for file in files:
            path = os.path.join(root, file)
            try:
                with open(path, 'r') as f:
                    content = f.read()
                    for pattern in suspicious_patterns:
                        if pattern.search(content):
                            errors.append(f"SECRET LEAK: Suspicious pattern found in {file}")
            except:
                pass

    if errors:
        print("\nCompliance Violations Found:")
        for e in errors:
            print(f" - {e}")
        sys.exit(1)
    else:
        print("SUCCESS: API Configuration is compliant.")
        sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python api_compliance_check.py <project_root>")
        sys.exit(1)
    check_api_compliance(sys.argv[1])
