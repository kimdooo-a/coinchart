# Recommended Config Changes

## .eslintignore
```
kdy-addon/monet-registry-main/**
```

## package.json (scripts)
```json
"lint": "eslint app/ lib/ scripts/ components/ middleware.ts next.config.ts --ignore-pattern 'kdy-addon/**'"
```

## lib/env.ts (new file)
```typescript
export function validateEnv() {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing ${key}`);
  }
}
```

## Supabase Graceful Handling (example in lib/supabaseAdmin.ts)
```typescript
try {
  const data = await supabase.from('table').select();
  return data;
} catch (error) {
  console.error('Supabase error:', error);
  return { error: 'Service unavailable' };
}
```