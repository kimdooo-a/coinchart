# BUILD VERIFICATION CHECKLIST

## Purpose
Verify that `kdy-addon/Poly-Tech2/docs` is correctly excluded from production builds, ensuring it remains a development-time asset only.

## Pre-Build Configuration Check

### 1. Verify Exclusion Rules Exist
- [ ] `.npmignore` contains `kdy-addon/` (if publishing to npm)
- [ ] `package.json` → `"files"` array does NOT include `kdy-addon`
- [ ] `tsconfig.json` → `"exclude"` array includes `"kdy-addon"`
- [ ] `.gitignore` allows docs but blocks runtime artifacts:
  ```gitignore
  !kdy-addon/Poly-Tech2/docs
  kdy-addon/Poly-Tech2/runtime/bus/processing/*
  kdy-addon/Poly-Tech2/runtime/bus/output/*
  kdy-addon/Poly-Tech2/runtime/bus/error/*
  *.agent_lock
  ```

## Build Process Verification

### 2. Run Production Build
Execute your project's build command:

```bash
# NPM/Yarn Projects
npm run build
# or
yarn build

# Next.js
npm run build && npm run export

# Vite
npm run build

# Webpack
npm run build:prod
```

### 3. Inspect Build Output

#### Option A: Manual Inspection
Navigate to your build output directory:
```bash
# Common output directories:
cd dist/          # Vite, Webpack, Rollup
cd build/         # Create React App
cd .next/         # Next.js
cd out/           # Next.js (static export)
```

Check for kdy-addon presence:
```bash
# Unix/Linux/macOS
find . -type d -name "kdy-addon"
find . -type f -path "*kdy-addon*"

# Windows PowerShell
Get-ChildItem -Recurse -Directory -Filter "kdy-addon"
Get-ChildItem -Recurse -File | Where-Object { $_.FullName -like "*kdy-addon*" }

# Windows CMD
dir /s /b | findstr "kdy-addon"
```

**Expected Result**: No output (kdy-addon should not exist in build)

#### Option B: Automated Grep Check
```bash
# Search for "kdy-addon" string in all build files
grep -r "kdy-addon" dist/ || echo "✓ PASS: kdy-addon not found in build"
grep -r "Poly-Tech2" dist/ || echo "✓ PASS: Poly-Tech2 not found in build"
```

**Expected Output**: `✓ PASS: kdy-addon not found in build`

### 4. Verify Bundle Size
Compare bundle size before/after adding kdy-addon:
```bash
# Check total build size
du -sh dist/      # Unix/Linux/macOS
dir dist /s       # Windows

# Typical sizes:
# - Small app: 100KB - 1MB (minified)
# - Medium app: 1MB - 5MB
# - Large app: 5MB - 20MB
#
# If kdy-addon (several MB of docs) leaked in, size will be noticeably larger
```

## Framework-Specific Checks

### Next.js
```bash
# Check .next/static for kdy-addon references
grep -r "kdy-addon" .next/static/ && echo "⚠ FAIL" || echo "✓ PASS"

# Inspect webpack build stats
npm run build -- --debug
# Look for "kdy-addon" in module list
```

### Vite
```bash
# Enable build analysis
npm run build -- --mode production --minify

# Check dist/assets for unexpected .md/.py files
find dist/assets -type f \( -name "*.md" -o -name "*.py" \) && echo "⚠ FAIL" || echo "✓ PASS"
```

### Webpack
```bash
# Use webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# Add to webpack.config.js:
# const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
# plugins: [new BundleAnalyzerPlugin()]

# Run build and inspect visual graph for kdy-addon modules
```

## Post-Build Quality Checks

### 5. Test Production Bundle Locally
```bash
# Next.js
npm run start

# Static sites (using serve)
npx serve -s dist

# Check browser DevTools → Network tab:
# - No requests to kdy-addon paths
# - No .md/.py files loaded
```

### 6. Verify Source Maps (if enabled)
```bash
# Source maps should NOT expose kdy-addon
grep -r "kdy-addon" dist/**/*.map && echo "⚠ WARNING: kdy-addon in source maps" || echo "✓ PASS"
```

## NPM Package Publishing (if applicable)

### 7. Dry-Run Package Publish
```bash
# Preview what will be published
npm pack --dry-run

# Check tarball contents
npm pack
tar -tzf *.tgz | grep "kdy-addon" && echo "⚠ FAIL: kdy-addon in package" || echo "✓ PASS"
rm *.tgz
```

## Automated CI/CD Integration

### 8. Add to GitHub Actions / GitLab CI
```yaml
# .github/workflows/build-verification.yml
name: Build Verification
on: [push, pull_request]
jobs:
  verify-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - name: Verify kdy-addon exclusion
        run: |
          if grep -r "kdy-addon" dist/; then
            echo "❌ FAIL: kdy-addon found in build output"
            exit 1
          else
            echo "✅ PASS: kdy-addon correctly excluded"
          fi
```

## Troubleshooting

### kdy-addon Found in Build
**Cause**: Build tool is copying all files indiscriminately

**Fixes**:
1. Add `kdy-addon` to bundler's `exclude` config
2. Check for wildcard copy operations (e.g., `copy-webpack-plugin`)
3. Verify `public/` folder doesn't contain kdy-addon symlinks

### Source Maps Expose kdy-addon Paths
**Cause**: TypeScript/transpiler including absolute paths

**Fix**: Configure `sourceRoot` in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "sourceRoot": ".",
    "sourceMap": true,
    "inlineSources": false
  }
}
```

### Python Scripts in dist/
**Cause**: Asset bundler treating .py files as static assets

**Fix**: Add to bundler config:
```javascript
// vite.config.ts
export default {
  assetsInclude: [],  // Don't bundle .py as assets
  build: {
    rollupOptions: {
      external: [/\.py$/]
    }
  }
}
```

## Final Checklist

- [ ] No `kdy-addon` directories in `dist/` or equivalent
- [ ] No `.md`, `.py`, or `.yaml` files from docs in build output
- [ ] Bundle size is reasonable (no 5MB+ docs included)
- [ ] `npm pack --dry-run` shows no kdy-addon (if publishing)
- [ ] CI/CD pipeline includes automated verification
- [ ] Local production server runs without kdy-addon files

## Related Policies
- [BUILD_EXCLUSION_POLICY.md](../20_REGULATIONS/BUILD_EXCLUSION_POLICY.md)
- [PROJECT_EMBEDDING_POLICY.md](../20_REGULATIONS/PROJECT_EMBEDDING_POLICY.md)
- [compliance_checklist.md](../70_AUTOMATION/compliance/compliance_checklist.md)
