import os
import json
import time
import datetime
import uuid
import glob

LOCK_EXTENSION = ".agent_lock"

class LockManager:
    def __init__(self, agent_id="unknown_agent"):
        self.agent_id = agent_id

    def _get_lock_path(self, target_path):
        """Standardizes lock file path (Sidecar pattern)."""
        if os.path.isdir(target_path):
            return os.path.join(target_path, LOCK_EXTENSION)
        else:
            return f"{target_path}{LOCK_EXTENSION}"

    def check_lock(self, target_path):
        """
        Checks if a valid lock exists.
        Returns metadata dict if locked, None if clear.
        """
        lock_path = self._get_lock_path(target_path)
        if not os.path.exists(lock_path):
            return None
        
        try:
            with open(lock_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Check Expiry
            expiry = data.get("expiryTimestamp")
            if expiry:
                exp_dt = datetime.datetime.fromisoformat(expiry)
                if datetime.datetime.now() > exp_dt:
                    print(f"[Watchdog] Stale lock detected at {lock_path}. Ignoring (cleaning required).")
                    return None # Treat as unlocked (or should clean?)
            
            return data
        except (json.JSONDecodeError, ValueError):
            print(f"[Error] Corrupted lock file at {lock_path}")
            return {"status": "corrupted"}

    def acquire_lock(self, target_path, intent_action, intent_desc, ttl_seconds=60):
        """
        Atomically acquires a lock.
        Returns lock_id if successful, None if failed.
        """
        lock_path = self._get_lock_path(target_path)
        
        # 1. Check existing
        existing = self.check_lock(target_path)
        if existing:
            print(f"[Lock] Failed to acquire {target_path}. Locked by {existing.get('owner', {}).get('agent')}")
            return None

        # 2. Prepare Metadata (Schema V1)
        now = datetime.datetime.now()
        expiry = now + datetime.timedelta(seconds=ttl_seconds)
        
        meta = {
            "schemaVersion": "1.0",
            "lockId": str(uuid.uuid4()),
            "createdTimestamp": now.isoformat(),
            "expiryTimestamp": expiry.isoformat(),
            "owner": {
                "agent": self.agent_id,
                "processId": os.getpid(),
                "host": "localhost"
            },
            "intent": {
                "action": intent_action,
                "description": intent_desc
            }
        }

        # 3. Atomic Write (Exclusive Creation)
        try:
            # 'x' mode fails if file exists
            with open(lock_path, 'x', encoding='utf-8') as f:
                json.dump(meta, f, indent=2)
            
            print(f"[Lock] Acquired on {target_path} for {self.agent_id}")
            return meta["lockId"]
        except FileExistsError:
            print(f"[Lock] Race condition! Failed to acquire {target_path}")
            return None
        except OSError as e:
            print(f"[Lock] OS Error: {e}")
            return None

    def release_lock(self, target_path, lock_id=None):
        """
        Releases the lock if ID matches (or force if ID is None).
        """
        lock_path = self._get_lock_path(target_path)
        if not os.path.exists(lock_path):
            return True # Already gone

        if lock_id:
            existing = self.check_lock(target_path)
            if existing and existing.get("lockId") != lock_id:
                print(f"[Lock] Security violation: Cannot release lock owned by others.")
                return False

        try:
            os.remove(lock_path)
            print(f"[Lock] Released {target_path}")
            return True
        except OSError as e:
            print(f"[Error] Failed to release lock: {e}")
            return False

if __name__ == "__main__":
    # Test
    lm = LockManager("test_runner")
    path = "./test_resource"
    
    # Create dummy resource
    with open(path, 'w') as f: f.write("data")
    
    lid = lm.acquire_lock(path, "testing", "unit test lock")
    if lid:
        print("Locked!")
        time.sleep(1)
        lm.release_lock(path, lid)
        print("Released!")
    
    os.remove(path)
