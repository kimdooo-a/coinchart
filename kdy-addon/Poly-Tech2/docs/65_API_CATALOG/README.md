# API Catalog

## Purpose
This directory contains the definitions for all APIs used by the system.

## Components
- `registry.yaml`: The central database of APIs.
- `registry.schema.json`: The validation rules for the registry.
- `specs/`: OpenAPI/Swagger/JSON-Schema files for individual APIs.
- `env/`: Environment variable templates.
- `policies/`: Security and Operational guidelines.

## Validation
To verify the `registry.yaml` is valid:
```bash
# Requires 'check-jsonschema' (pip install check-jsonschema)
check-jsonschema --schemafile registry.schema.json registry.yaml
```
