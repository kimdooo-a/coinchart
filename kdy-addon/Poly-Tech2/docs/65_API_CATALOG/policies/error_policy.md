# API Policy: Error Handling

## 1. Classification
| Code | Type | Action |
| :--- | :--- | :--- |
| **400** | Client Error | **Fail Fast**. Do not retry. Fix Request. |
| **401/403** | Auth Error | **Fail Fast**. Alert Admin. |
| **429** | Rate Limit | **Wait/Retry**. Use `Retry-After` header. |
| **5xx** | Server Error | **Retry**. See `retry_policy.md`. |

## 2. Logging
- All API failures must be logged to standard error or the `runtime/bus/error` directory.
- Redact API Keys from logs (e.g., `sk-****`).
