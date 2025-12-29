# API Policy: Retry & Backoff

## 1. Global Rule
Agents MUST implement **Exponential Backoff** for all network calls to external APIs.

## 2. Standard Algorithm
```python
wait_time = min(cap, base * (2 ** attempt)) + jitter
```
- **Base**: 0.5s
- **Cap**: 10s
- **Max Attempts**: 3

## 3. Idempotency
- Only retry **Safe** (GET) or **Idempotent** (PUT/DELETE) requests blindly.
- POST requests require check before retry.
