# Orchestrator Runtime

This directory contains the reference implementation of the Antigravity Orchestrator Loop.

## 🏃 Usage

### Prerequisites
*   Python 3.8+
*   PyYAML (`pip install pyyaml`)

### Running the Loop
```bash
# From project root
python runtime/orchestrator/orchestrator_loop.py
```

The orchestrator will:
1.  Read `SHARED_CONTEXT.md` for active phase.
2.  Load `runtime/rules/rules.v0.1.yaml`.
3.  Watch `runtime/bus/input/*.json` for new messages.
4.  Execute Rules -> Actions -> Evidence.

## 🧪 Testing

1.  Start the loop in a terminal.
2.  Drop a sample JSON into `runtime/bus/input/`.
    *   (See `sample_commands/` for examples)
3.  Watch `runtime/bus/processing`, `output`, and `error`.
