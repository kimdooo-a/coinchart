# API Compliance Tools

## script: api_compliance_check.py
Validates that the Internalized API Configuration is consistent and secure.

### Checks:
1.  **Referential Integrity**: Do specs listed in registry actually exist?
2.  **Env Completeness**: Are required keys present in `.env.example`?
3.  **Secret Scanning**: Checks for accidental commits of API keys.

## checklist: compliance_checklist.md
Manual steps to ensure policies are followed during code reviews.
