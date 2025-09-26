# Directory Structure & Scaffolding

Proposed layout for a single-package TypeScript VS Code extension with MCP server integration.

## 1. Top-Level Layout
```
/ (repo root)
  package.json
  tsconfig.json
  tsconfig.build.json
  esbuild.config.js (or build scripts)
  .eslintrc.cjs
  .prettierrc
  README.md
  CHANGELOG.md
  LICENSE (if applicable)
  /src
  /webview
  /schemas
  /dist (build output)
  /tests
  /requirements (current docs)
  /scripts
```

## 2. Source Tree (`/src`)
```
/src
  extension.ts                # Activation entry
  mcp/
    server.ts                 # MCP tools registration
    tools/
      epicsTools.ts
      userStoriesTools.ts
      tasksTools.ts
      issuesTools.ts
      metadataTools.ts
    schemas/                  # Generated or static JSON schemas (if checked in)
  api/
    taigaApiClient.ts
    rateLimiter.ts
    errorTranslator.ts
    middleware.ts
    queryBuilder.ts
  auth/
    authManager.ts
    tokenPrompt.ts
  config/
    configurationManager.ts
    schemaValidation.ts
  services/
    projectService.ts
    epicService.ts
    userStoryService.ts
    taskService.ts
    issueService.ts
    filterService.ts
  cache/
    entityCache.ts
    cacheRegistry.ts
  models/
    types.ts                  # Shared interfaces
    mappers/
      epicMapper.ts
      userStoryMapper.ts
      taskMapper.ts
      issueMapper.ts
  ui/
    trees/
      projectTree.ts
      epicsTree.ts
      userStoriesTree.ts
      issuesTree.ts
    webview/
      detailPanelManager.ts
      panelMessageProtocol.ts
    commands/
      registerCommands.ts
      commandHandlers.ts
  utils/
    logger.ts
    eventBus.ts
    diagnostics.ts
    objectHash.ts
  telemetry/
    telemetryClient.ts (no-op if disabled)
```

## 3. Webview Source (`/webview`)
```
/webview
  index.html
  main.tsx (React or vanilla)
  components/
    DescriptionEditor.tsx
    TagsEditor.tsx
    FieldGroup.tsx
  styles/
    base.css
  vite.config.ts (if using Vite) or esbuild script
```

Output bundle to `dist/webview.js` referenced via `asWebviewUri`.

## 4. Schemas (`/schemas`)
- Optionally store MCP tool JSON Schemas and generate index at build.
- Use script to validate schemas with AJV during CI.

## 5. Tests (`/tests`)
See testing strategy document for structure.

## 6. Build Pipeline
### 6.1 TypeScript Config
`tsconfig.json` (dev) and `tsconfig.build.json` (composite) with `outDir: dist`, `declaration: true` (optional for internal usage).

### 6.2 Bundling
Use `esbuild` for speed.
Example build script function (conceptual):
```js
// scripts/build.js
const esbuild = require('esbuild');
await esbuild.build({
  entryPoints: ['src/extension.ts', 'src/mcp/server.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'dist',
  external: ['vscode'],
  sourcemap: true,
  target: 'node18',
  format: 'cjs'
});
```
Webview built separately (target: `es2019`, format: `iife`).

### 6.3 NPM Scripts
```json
{
  "scripts": {
    "clean": "rimraf dist",
    "build": "npm run clean && node scripts/build.js && node scripts/build-webview.js",
    "watch": "nodemon --watch src --exec 'node scripts/build.js'",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "npm run lint -- --fix",
    "package": "vsce package",
    "compile:schemas": "node scripts/generate-schemas.js"
  }
}
```

## 7. package.json Key Sections
```json
{
  "name": "taiga-mcp",
  "version": "0.1.0",
  "engines": { "vscode": "^1.90.0" },
  "main": "./dist/extension.js",
  "activationEvents": [
    "onCommand:taiga.selectInstance",
    "onView:taigaProjects",
    "onStartupFinished"
  ],
  "contributes": {
    "commands": [ /* see commands spec */ ],
    "views": { "explorer": [ { "id": "taigaProjects", "name": "Taiga Projects" }, { "id": "taigaEpics", "name": "Taiga Epics" }, { "id": "taigaUserStories", "name": "Taiga User Stories" }, { "id": "taigaIssues", "name": "Taiga Issues" } ] },
    "configuration": { /* config schema summarized */ }
  },
  "devDependencies": { /* tooling */ },
  "dependencies": { /* runtime libs */ }
}
```

## 8. Dependencies (Initial)
| Purpose | Library |
|---------|---------|
| Schema Validation | ajv |
| HTTP (fetch polyfill if needed) | node-fetch (or undici) |
| Webview UI (optional) | react + react-dom + monaco-editor markdown? |
| State mgmt (webview) | zustand (lightweight) |
| Utility | zod (if needed) or just TypeScript | 
| Build | esbuild |
| Testing | vitest, @vscode/test-electron |

Keep runtime dependencies minimal; prefer devDependencies for build & test.

## 9. Scripts Directory
- `build.js`, `build-webview.js`
- `generate-schemas.js` (aggregate tool schemas)
- `prepare-release.js` (bump version, update changelog - future)

## 10. Environment Variables
- None required for base; allow `TAIGA_DEBUG=1` to force verbose logging regardless of setting.

## 11. Source Conventions
- Barrel exports discouraged for deep layers (explicit imports assist tree-shaking).
- Paths use relative imports (avoid tsconfig path aliases initially to keep complexity low for newcomers).

## 12. ESLint Rules of Note
- `@typescript-eslint/explicit-module-boundary-types = warn`
- `no-console` (error) except allowed in scripts folder.
- Custom rule to prevent imports from `src/api` inside webview bundle.

## 13. VS Code Specifics
- Use `ExtensionContext.globalState` vs `workspaceState` for instance configs? (Settings drive config; state for ephemeral selection).
- Register disposables in activation aggregator array.

## 14. Build Artifacts
- Only keep compiled `.js` + `.map` in `dist/`.
- Exclude tests & requirements folder from packaged extension via `.vscodeignore`.

## 15. .vscodeignore (Key Entries)
```
requirements/**
tests/**
webview/** (except built assets if not under dist)
.eslint*
.prettierrc*
tsconfig*.json
scripts/**
```

## 16. Monorepo Future (If Needed)
Potential split:
- `packages/extension`
- `packages/mcp-core` (pure service + schemas)
- `packages/webview-ui`
But defer until complexity justifies.

## 17. Initial Scaffolding Order
1. package.json skeleton
2. tsconfig + eslint + prettier
3. Basic `extension.ts` with activation log
4. Implement `TaigaApiClient` minimal + auth prompt stub
5. Add Project tree view + select instance command
6. Add user story service + list command
7. Add create story command
8. Integrate MCP minimal (list projects, set active project)
9. Add remaining entities & caching
10. Implement webview detail panel

## 18. README Skeleton Sections
- Features
- Installation
- Quick Start
- Configuration
- Commands
- MCP Tools
- Development (build/test/package)
- Roadmap
- License

---
**End of Directory Structure & Scaffolding Document**
