# REGULATION: BUILD EXCLUSION POLICY

## 1. Purpose
To ensure that the `Poly-Tech2` document library, when embedded in a project, serves strictly as a **Development-Time Asset** and never leaks into the **Production Bundle**.

## 2. Standard Path
All documentation must be located at:
`[Project Root]/kdy-addon/Poly-Tech2/docs`

## 3. Exclusion Rules by Tool

### 3.1 Git (Version Control)
We DO want to commit these files, but we might want to ignore local runtime artifacts.
*File: `.gitignore`*
```gitignore
# Allow docs, but ignore orchestration runtime noise
!kdy-addon/Poly-Tech2/docs
kdy-addon/Poly-Tech2/runtime/bus/processing/*
kdy-addon/Poly-Tech2/runtime/bus/output/*
kdy-addon/Poly-Tech2/runtime/bus/error/*
*.agent_lock
```

### 3.2 NPM / Yarn (Package Publishing)
If the project is a library, `docs` must NOT be published to npm.
*File: `.npmignore`*
```text
kdy-addon/
```
*File: `package.json`*
```json
{
  "files": [
    "dist",
    "README.md"
    // Do NOT include kdy-addon
  ]
}
```

### 3.3 TypeScript (Compilation)
Do not waste CPU cycles compiling python scripts or markdown assets.
*File: `tsconfig.json`*
```json
{
  "exclude": [
    "kdy-addon",
    "**/*.agent_lock"
  ]
}
```

### 3.4 Bundlers (Webpack / Vite / Next.js)
Ensure these files are not bundled as static assets unless explicitly requested for a documentation site.
*File: `next.config.js` or `vite.config.ts`*
- Ensure `kdy-addon` is not in the `public` folder.
- Ensure import aliases do not point to it for production code.

## 4. Verification
Before deployment, run:
`npm run build`
And verify that `dist/` or `.next/` does not contain `kdy-addon`.
