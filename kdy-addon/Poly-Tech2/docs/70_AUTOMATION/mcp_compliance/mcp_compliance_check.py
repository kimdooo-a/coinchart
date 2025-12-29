import os
import sys
import yaml
import re

# Relative constants (assuming script is in docs/70_AUTOMATION/mcp_compliance/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../"))
MCP_CATALOG = os.path.join(DOCS_ROOT, "66_MCP_CATALOG")

def check_mcp_compliance():
    print(f"MCP Compliance Check on: {MCP_CATALOG}")
    errors = []
    
    registry_path = os.path.join(MCP_CATALOG, "registry.yaml")
    
    # 1. Load Registry
    if not os.path.exists(registry_path):
        print("FAIL: registry.yaml missing")
        sys.exit(1)

    try:
        with open(registry_path, 'r') as f:
            registry = yaml.safe_load(f)
    except Exception as e:
        print(f"FAIL: Invalid registry YAML: {e}")
        sys.exit(1)

    registered_ids = [s['id'] for s in registry.get('servers', [])]
    
    # 2. Check Server Definitions
    servers_dir = os.path.join(MCP_CATALOG, "servers")
    for filename in os.listdir(servers_dir):
        if not filename.endswith(".yaml"): continue
        path = os.path.join(servers_dir, filename)
        
        with open(path, 'r') as f:
            try:
                server_def = yaml.safe_load(f)
            except:
                errors.append(f"Invalid YAML: {filename}")
                continue

        # Rule: No secrets in YAML text
        with open(path, 'r') as f:
            content = f.read()
            # Heuristic for secrets
            if re.search(r"(sk-[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]+)", content):
                errors.append(f"SECRET LEAK: {filename} contains potential secret")

        # Rule: env_keys must not have values (we check if it looks like a list of strings)
        env_keys = server_def.get("env_keys", [])
        if isinstance(env_keys, list):
            for k in env_keys:
                if "=" in str(k) or ":" in str(k): 
                     # Loose check, but good enough to catch "KEY=VALUE"
                     errors.append(f"BAD ENV KEY: {filename} - {k} looks like an assignment")
        
        # Rule: Filesystem write checks
        sec = server_def.get("security", {})
        if sec.get("filesystem") == "read-write":
            # Must contain template variable in args to be "scoped"
            args_str = str(server_def.get("args", []))
            if "{{" not in args_str:
                errors.append(f"UNSAFE WRITE: {filename} has read-write FS access without unscoped args variables")

    # 3. Check Profiles
    profiles_dir = os.path.join(MCP_CATALOG, "profiles")
    for filename in os.listdir(profiles_dir):
        if not filename.endswith(".yaml"): continue
        path = os.path.join(profiles_dir, filename)
        
        with open(path, 'r') as f:
            profile = yaml.safe_load(f)
            
        for s_id in profile.get("servers", []):
            if s_id not in registered_ids:
                errors.append(f"BROKEN PROFILE: {filename} references unknown server '{s_id}'")

    if errors:
        print("\nMCP Violations Found:")
        for e in errors:
            print(f" - {e}")
        sys.exit(1)
    else:
        print("SUCCESS: MCP Catalog is compliant.")
        sys.exit(0)

if __name__ == "__main__":
    check_mcp_compliance()
