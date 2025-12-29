# API Policy: Authentication

## 1. Principles
- **No Hardcoded Secrets**: Keys must never appear in `registry.yaml` or code.
- **Environment Injection**: Startups must validate `env.schema.json`.

## 2. Standard Methods

### Bearer Token
- **Header**: `Authorization: Bearer <TOKEN>`
- **Source**: `os.environ["API_KEY"]`

### API Key Header
- **Header**: `X-API-Key: <KEY>`

## 3. Rotation
- Keys should be rotated every 90 days.
- Use `Poly-Tech2/runtime/bus/admin` to trigger rotation events (if automated).
