import os
import time
import shutil
import yaml
import glob
from lock_manager import LockManager

# Configuration
BUS_ROOT = "c:/develop/Poly-Tech2/runtime/bus"
INPUT_DIR = os.path.join(BUS_ROOT, "input")
PROCESSING_DIR = os.path.join(BUS_ROOT, "processing")
OUTPUT_DIR = os.path.join(BUS_ROOT, "output")
ERROR_DIR = os.path.join(BUS_ROOT, "error")
RULES_FILE = "rules.yaml"

lock_manager = LockManager(agent_id="Orchestrator_Daemon")

def load_rules():
    with open(RULES_FILE, 'r') as f:
        return yaml.safe_load(f)

def match_rule(filename, rules):
    import fnmatch
    for rule in rules.get('rules', []):
        if fnmatch.fnmatch(filename, rule['pattern']):
            return rule
    return rules.get('default', {})

def process_file(filepath):
    filename = os.path.basename(filepath)
    print(f"[Event] Detected: {filename}")

    # 1. Route (L10)
    rules = load_rules()
    rule = match_rule(filename, rules)
    print(f"  -> Routing to: {rule['target_agent']} (Action: {rule['action']})")

    # 2. Lock Check (L20)
    # Orchestrator "locks" the processing slot for this file
    lock_id = lock_manager.acquire_lock(filepath, rule['action'], f"Routing to {rule['target_agent']}")
    
    if not lock_id:
        print("  -> Locked by another process. Skipping.")
        return

    # 3. Process (Move to Processing)
    try:
        dest_path = os.path.join(PROCESSING_DIR, filename)
        shutil.move(filepath, dest_path)
        print(f"  -> Moved to Processing: {dest_path}")
        
        # --- Simulate Agent Execution ---
        time.sleep(1) 
        # In real scenario, we would trigger `claude -p ...` here
        # --------------------------------
        
        # 4. Result (Move to Output)
        final_path = os.path.join(OUTPUT_DIR, f"PROCESSED_{filename}")
        shutil.move(dest_path, final_path)
        print(f"  -> Completed. Output: {final_path}")

    except Exception as e:
        print(f"  -> Error: {e}")
        shutil.move(filepath, os.path.join(ERROR_DIR, filename))
    finally:
        # 5. Release Lock
        lock_manager.release_lock(filepath, lock_id)

def main_loop():
    print(f"poly-orchestrator started.")
    print(f"Watching {INPUT_DIR}...")
    
    while True:
        files = glob.glob(os.path.join(INPUT_DIR, "*"))
        for f in files:
            if os.path.isfile(f):
                process_file(f)
        time.sleep(2)

if __name__ == "__main__":
    # Ensure Dirs
    for d in [INPUT_DIR, PROCESSING_DIR, OUTPUT_DIR, ERROR_DIR]:
        os.makedirs(d, exist_ok=True)
        
    try:
        main_loop()
    except KeyboardInterrupt:
        print("Stopping orchestrator.")
