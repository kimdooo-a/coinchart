# Orchestrator MVP - README

This is the executable implementation of the **Poly-Tech2 Constitution and Laws**.

## Components
1. **orchestrator.py**: The main loop. Watches `runtime/bus/input` and moves files to `output` based on rules.
2. **lock_manager.py**: Implements `L20_LOCK_GOVERNANCE_ACT`. Ensures atomic locking.
3. **rules.yaml**: Configuration for `L10_ROUTING_ACT`.

## Usage
1. Run `python orchestrator.py`.
2. Drop a file (e.g., `test.md`) into `c:/develop/Poly-Tech2/runtime/bus/input`.
3. Watch the console log.
4. Check `c:/develop/Poly-Tech2/runtime/bus/output` for the result.
