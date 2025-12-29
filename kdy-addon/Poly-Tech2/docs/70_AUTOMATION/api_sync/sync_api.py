import os
import shutil
import argparse
import sys

# Constants relative to this script
# Lib Root = 70_AUTOMATION/api_sync/../../
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LIB_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../"))
CATALOG_DIR = os.path.join(LIB_ROOT, "65_API_CATALOG")

def sync_api(project_root):
    print(f"Starting API Sync...")
    print(f"Library Source: {CATALOG_DIR}")
    print(f"Project Target: {project_root}")

    # 1. Define Destinations
    config_api_dir = os.path.join(project_root, "config", "apis")
    specs_dir = os.path.join(config_api_dir, "specs")
    root_env_example = os.path.join(project_root, ".env.example")
    
    # 2. Sync Registry & Schema
    os.makedirs(config_api_dir, exist_ok=True)
    
    print(f"-> Syncing registry.yaml")
    shutil.copy2(os.path.join(CATALOG_DIR, "registry.yaml"), os.path.join(config_api_dir, "registry.yaml"))
    
    print(f"-> Syncing env.schema.json")
    # Mapping env/env.schema.json -> config/env.schema.json
    shutil.copy2(os.path.join(CATALOG_DIR, "env", "env.schema.json"), os.path.join(project_root, "config", "env.schema.json"))

    # 3. Sync Specs (Recursive)
    if os.path.exists(specs_dir):
        shutil.rmtree(specs_dir) # Clean slate to remove deleted specs
    shutil.copytree(os.path.join(CATALOG_DIR, "specs"), specs_dir)
    print(f"-> Synced {len(os.listdir(specs_dir))} spec files")

    # 4. Merge .env.example
    print(f"-> Merging .env.example")
    lib_env_path = os.path.join(CATALOG_DIR, "env", ".env.example")
    
    if os.path.exists(lib_env_path):
        with open(lib_env_path, 'r') as f:
            lib_lines = f.readlines()
            
        current_content = ""
        if os.path.exists(root_env_example):
            with open(root_env_example, 'r') as f:
                current_content = f.read()

        # Append new keys if not present (Simple append logic for safety)
        # Detailed logic would parse keys, but for MVP we ensure sections exist
        with open(root_env_example, 'a') as f:
            f.write("\n\n# --- Poly-Tech2 Managed APIs ---\n")
            for line in lib_lines:
                clean_line = line.strip()
                if "=" in clean_line and not clean_line.startswith("#"):
                    key = clean_line.split("=")[0]
                    if key not in current_content:
                        f.write(line)
                        print(f"   + Added {key}")
                    else:
                        print(f"   . Skipped {key} (Exists)")

    print("API Sync Completed Successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync Poly-Tech2 API Catalog to Project")
    parser.add_argument("project_root", help="Absolute path to the project root")
    
    args = parser.parse_args()
    
    if not os.path.exists(CATALOG_DIR):
        print(f"Error: Catalog not found at {CATALOG_DIR}")
        sys.exit(1)
        
    sync_api(args.project_root)
