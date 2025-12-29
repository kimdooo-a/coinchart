import os
import time
import json
import re
import shutil
import uuid
import datetime
import subprocess
import argparse
import sys

# Try importing YAML, handle if missing
try:
    import yaml
except ImportError:
    print("CRITICAL: PyYAML not installed. Please run 'pip install pyyaml'")
    exit(1)

# --- Configuration ---
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_BUS_DIR = os.path.join(ROOT_DIR, "runtime", "bus")
RULES_PATH = os.path.join(ROOT_DIR, "runtime", "rules", "rules.v0.1.yaml")
CONTEXT_PATH = os.path.join(ROOT_DIR, "SHARED_CONTEXT.md")

# Global Config (updated by args)
CONFIG = {
    "BUS_DIR": DEFAULT_BUS_DIR,
    "DRY_RUN": False
}

def get_dirs():
    return {
        "INPUT": os.path.join(CONFIG["BUS_DIR"], "input"),
        "PROCESSING": os.path.join(CONFIG["BUS_DIR"], "processing"),
        "OUTPUT": os.path.join(CONFIG["BUS_DIR"], "output"),
        "ERROR": os.path.join(CONFIG["BUS_DIR"], "error")
    }

# --- Helpers ---

def ensure_dirs():
    dirs = get_dirs()
    for d in dirs.values():
        os.makedirs(d, exist_ok=True)

def load_context():
    """Parses SHARED_CONTEXT.md for Active Phase."""
    if not os.path.exists(CONTEXT_PATH):
        return {"phase": 0} # Default to bootstrap
    
    with open(CONTEXT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find phase: * **Active Phase**: `0`
    match = re.search(r'\*\*Active Phase\*\*:\s*`(\d+)`', content)
    if match:
        return {"phase": int(match.group(1))}
    return {"phase": 0} # Fallback

def load_rules():
    if not os.path.exists(RULES_PATH):
        print(f"WARNING: Rules file not found at {RULES_PATH}")
        return []
    with open(RULES_PATH, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    return data.get('rules', [])

def move_file(src, dest_dir):
    filename = os.path.basename(src)
    dest = os.path.join(dest_dir, filename)
    shutil.move(src, dest)
    return dest

def write_evidence(channel, msg_id, content_dict):
    """Writes evidence json to output or error."""
    dirs = get_dirs()
    target_dir = dirs["ERROR"] if channel == 'error' else dirs["OUTPUT"]
    filename = f"ev_poly_{msg_id}_{int(time.time())}.json"
    path = os.path.join(target_dir, filename)
    
    # Inject DRY_RUN notice
    if CONFIG["DRY_RUN"]:
        content_dict["_meta"] = "DRY_RUN EXECUTION - NO CHANGES MADE"
    
    wrapper = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.datetime.now().isoformat(),
        "type": "EVIDENCE",
        "ref_msg_id": msg_id,
        "payload": content_dict
    }
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(wrapper, f, indent=2)
    print(f"[{channel.upper()}] Wrote evidence: {filename}")

# --- Action Executors ---

def render_template(template_str, msg, context):
    """
    Minimal template engine.
    Supports:
    {{msg_id}} -> msg['msg_id']
    {{category}} -> msg['category']
    {{msg_run_0}} -> msg['run'][0] if exists
    """
    if not isinstance(template_str, str):
        return template_str
        
    s = template_str
    
    # Common replacements
    replacements = {
        "{{msg_id}}": str(msg.get('msg_id', 'unknown')),
        "{{category}}": str(msg.get('category', '?')),
        "{{msg_category}}": str(msg.get('category', '?')), # Alias
        "{{title}}": str(msg.get('title', '')),
        "{{msg_title}}": str(msg.get('title', ''))
    }
    
    # Handle msg_run_0
    if 'run' in msg and isinstance(msg['run'], list) and len(msg['run']) > 0:
        replacements["{{msg_run_0}}"] = msg['run'][0]
    else:
        replacements["{{msg_run_0}}"] = ""

    for k, v in replacements.items():
        s = s.replace(k, v)
        
    return s

def exec_run_cmd(action, msg, context):
    raw_cmd = action.get('cmd')
    formatted_cmd = render_template(raw_cmd, msg, context)
    
    # Whitelist check (Minimal) on the FINAL formatted command
    allowed_prefixes = ["npm", "node", "python", "git", "echo"]
    if not any(formatted_cmd.strip().startswith(p) for p in allowed_prefixes):
        raise ValueError(f"Command not allowed: {formatted_cmd}")

    if CONFIG["DRY_RUN"]:
        print(f"[DRY-RUN] Would execute: '{formatted_cmd}'")
        return {
            "cmd": formatted_cmd,
            "exit_code": 0,
            "stdout": "[DRY-RUN] Simulated Success",
            "stderr": ""
        }

    print(f"EXEC: Running '{formatted_cmd}'")
    try:
        # cwd is root
        res = subprocess.run(formatted_cmd, shell=True, cwd=ROOT_DIR, capture_output=True, text=True, timeout=action.get('timeout_sec', 60))
        return {
            "cmd": formatted_cmd,
            "exit_code": res.returncode,
            "stdout": res.stdout[:500] + "..." if len(res.stdout) > 500 else res.stdout,
            "stderr": res.stderr
        }
    except Exception as e:
        raise RuntimeError(f"Command execution failed: {str(e)}")

def exec_request_approval(action, msg, context):
    req_id = f"REQ_{msg.get('msg_id', 'unknown')}"
    
    rendered_payload_str = render_template(action.get('payload_template', ''), msg, context)
    
    payload = {
        "msg_id": req_id,
        "msg_type": "COMMAND",
        "command_type": "approval_request",
        "category": msg.get("category", "B"),
        "title": f"Approval Request for {msg.get('msg_id')}",
        "payload": {
            "original_msg": msg,
            "reason": "Policy Category Restriction",
            "details": rendered_payload_str
        }
    }
    
    dir_path = get_dirs()["INPUT"]
    path = os.path.join(dir_path, f"approval_{req_id}.json")
    
    if CONFIG["DRY_RUN"]:
        print(f"[DRY-RUN] Would request approval: {req_id}")
        payload["_meta"] = "DRY_RUN REQUEST"
        
    with open(path, 'w') as f:
        json.dump(payload, f, indent=2)
    
    return {"status": "Approval Requested", "req_id": req_id}

# --- Engine ---

def process_file(filepath):
    filename = os.path.basename(filepath)
    print(f"Processing: {filename}")
    
    dirs = get_dirs()
    
    # 1. Lock (Move to processing)
    processing_path = move_file(filepath, dirs["PROCESSING"])
    
    try:
        # Load Message
        with open(processing_path, 'r', encoding='utf-8') as f:
            msg = json.load(f)
        
        context = load_context()
        rules = load_rules()
        
        msg_type = msg.get('command_type', 'unknown')
        msg_cat = msg.get('category', 'A')
        
        executed = False
        
        # 2. Evaluate Rules
        rules.sort(key=lambda x: x.get('priority', 100))
        
        for rule in rules:
            # A. Trigger Match
            trigger = rule.get('trigger', {})
            if trigger.get('kind') != 'bus_input':
                continue 
            
            t_match = trigger.get('match', {})
            if msg_type not in t_match.get('command_types', []):
                continue
            
            # B. Guards
            guards = rule.get('guards', {})
            
            # Phase Guard
            if 'phase_in' in guards:
                if context['phase'] not in guards['phase_in']:
                    continue
            
            # Category Guard
            if 'category_in' in guards:
                if msg_cat not in guards['category_in']:
                    continue
            
            # Approval Guard
            if 'approval' in guards:
                # Stub Logic: We assume NO approval exists for now in Sandbox
                req_mode = guards['approval'].get('mode', 'none')
                
                # If rule requires 'single' or 'dual' approval, and we have none -> Fail
                if req_mode in ['single', 'dual']:
                    # TODO: Real SHARED_CONTEXT lookup
                    print(f"Skipping Rule {rule['rule_id']}: Requires approval (Not implemented/Found)")
                    continue
                
                # If rule requires 'none' (i.e. blocking guard), it passes (since we have none)
                if req_mode == 'none':
                    pass
            
            print(f"MATCH: Rule {rule['rule_id']}")
            
            # C. Execute Actions
            actions = rule.get('actions', [])
            results = []
            
            for action in actions:
                atype = action.get('type')
                if atype in ['write_processing_lock', 'release_lock']:
                    pass
                elif atype == 'write_bus':
                    tmpl = action.get('template', '')
                    rendered_text = render_template(tmpl, msg, context)
                    write_evidence(action.get('channel'), msg.get('msg_id'), {"text": rendered_text})
                elif atype == 'run_cmd':
                    res = exec_run_cmd(action, msg, context)
                    results.append(res)
                elif atype == 'request_approval':
                    res = exec_request_approval(action, msg, context)
                    results.append(res)
                else:
                    print(f"Unknown action type: {atype}")
            
            executed = True
            break 
            
        if not executed:
            print("No matching rule found for message.")
            write_evidence('error', msg.get('msg_id'), {"error": "No matching rule"})
        
        # Cleanup (Move to processed or delete?)
        # Standard: Delete from processing
        os.remove(processing_path)

    except Exception as e:
        print(f"ERROR processing {filename}: {e}")
        try:
             if os.path.exists(processing_path):
                 move_file(processing_path, dirs["ERROR"])
                 write_evidence('error', 'SYSTEM', {"error": str(e), "file": filename})
        except:
            pass

def main():
    parser = argparse.ArgumentParser(description="Poly-Tech2 Orchestrator Loop")
    parser.add_argument("--bus-root", help="Override bus directory (e.g., runtime/_sandbox/bus)", default=DEFAULT_BUS_DIR)
    parser.add_argument("--dry-run", action="store_true", help="Simulate execution without running commands")
    parser.add_argument("--once", action="store_true", help="Process existing files and exit (no loop)")
    args = parser.parse_args()
    
    CONFIG["BUS_DIR"] = os.path.abspath(args.bus_root)
    CONFIG["DRY_RUN"] = args.dry_run
    CONFIG["ONCE"] = args.once
    
    print("Orchestrator Loop Starting...")
    print(f"Root: {ROOT_DIR}")
    print(f"Bus:  {CONFIG['BUS_DIR']}")
    print(f"Mode: {'DRY-RUN' if CONFIG['DRY_RUN'] else 'LIVE'}")
    
    ensure_dirs()
    dirs = get_dirs()
    
    while True:
        # Simple Poll
        try:
            files = [f for f in os.listdir(dirs["INPUT"]) if f.endswith('.json')]
        except FileNotFoundError:
            ensure_dirs()
            files = []
            
        if not files:
            if CONFIG.get("ONCE"):
                print("No input files. Exiting (--once).")
                break
            time.sleep(2)
            continue
        
        for f in files:
            process_file(os.path.join(dirs["INPUT"], f))

if __name__ == "__main__":
    main()
