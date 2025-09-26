# Taiga MCP VS Code Extension

![status](https://img.shields.io/badge/status-alpha-orange)
![license](https://img.shields.io/badge/license-MIT-green)
![vscode](https://img.shields.io/badge/VS%20Code-%E2%89%A51.90-1f6feb)

Integrate Taiga (cloud or self-hosted) into VS Code with an embedded Model Context Protocol (MCP) server (future milestone). Milestone 1 delivers project & user story read-only listing, instance selection, token handling, and diagnostics.

## Status
- Milestone 1: Core scaffolding + read-only Projects & User Stories loading (DONE)
- Upcoming: Caching, CRUD, Epics/Tasks/Issues trees, MCP tools exposure, richer diagnostics & tests

## Features (Milestone 1)
- Configure multiple Taiga instances (cloud or self-hosted)
- Select active instance & store token securely in VS Code Secret Storage
- Dedicated Activity Bar panel: `Taiga` with views:
  - `Projects`
  - `User Stories`
  - `Issues`
- Select a project to load its user stories
- Refresh all data
- Show basic diagnostics snapshot

## Installation (Local Dev)
1. Clone repo
2. Install dependencies:
```bash
npm install
```
3. Build:
```bash
npm run build
```
4. Open this folder in VS Code and press `F5` (Launch Extension) – a new Extension Development Host window appears.

### Activity Bar Icon
The current icon file is `media/taiga-vscode-icon-512.png`. VS Code recommends a square, small (typically 24x24 or 32x32) transparent PNG. For sharper rendering you may want to generate downsized variants (e.g. 32 and 24) and substitute the path. A future enhancement can introduce theme-specific icons by supplying SVG or separate light/dark PNG assets.

## Configuration
Add to your VS Code `settings.json` (User or Workspace):
```jsonc
"taiga.instances": [
  {
    "name": "self-host",
    "baseUrl": "https://tasks.hmcorp.us"
  },
  {
    "name": "cloud",
    "baseUrl": "https://api.taiga.io" // example if using public Taiga
  }
],
"taiga.activeInstanceName": "self-host",
"taiga.enableVerboseLogging": true
```
After selecting an instance, set its token via command palette.

### Connect (Username/Password)
- Run command: "Taiga: Connect (Username/Password)"
- Enter your username (or email) and password; the extension will POST to `/auth` and securely store the returned `auth_token`.
- Alternatively, you can still paste a token manually via "Taiga: Set / Update Token".

## Commands
Open Command Palette (`⌘⇧P` / `Ctrl+Shift+P`) and run:
- `Taiga: Select Instance` – choose configured instance
- `Taiga: Set / Update Token` – store token for active instance
- `Taiga: Connect (Username/Password)` – exchange credentials for `auth_token` and store it
- `Taiga: Select Project` – (also by clicking a project in Projects view)
- `Taiga: Refresh All` – reload projects & user stories
- `Taiga: Show Diagnostics` – show counts & active context

## Manual Testing Guide
### 1. Launch
- Run `npm run build`
- Press `F5` to start the Extension Development Host

### 2. Configure Instances
- In the dev host: open Settings (JSON) and paste configuration snippet above, adjusting `baseUrl` and names as needed.

### 3. Set Token
- Run `Taiga: Select Instance` to ensure the correct instance is active
- Run `Taiga: Set / Update Token` and paste the API token

### 4. Load Projects
- Open Explorer: you should see `Taiga Projects`
- If it shows `Loading...` briefly then lists projects, success; if `No projects`, verify token & base URL.

### 5. Select Project & View User Stories
- Click a project entry (Project tree) or run `Taiga: Select Project`.
- The `User Stories` view should populate; if empty with `No user stories` verify that project actually has stories.

### 6. Diagnostics
- Run `Taiga: Show Diagnostics` to confirm: Active Instance, Active Project, Projects Loaded count, User Stories Loaded count.

### 7. Verbose Logging (Optional)
- Enable `taiga.enableVerboseLogging`: true
- Open Output panel → `Taiga` channel to see debug lines.

### 8. Error Checks
- Wrong token → expect empty lists (future milestone will surface clearer errors).
- Change instance → run `Refresh All` to see new data.

## Development Scripts
```bash
npm run build       # Build once
npm run watch       # Watch & rebuild
npm run lint        # Lint
npm run lint:fix    # Auto-fix
npm run typecheck   # Type-only check
```

## Folder Structure (abridged)
```
src/
  extension.ts
  api/taigaApiClient.ts
  auth/authManager.ts
  commands/registerCommands.ts
  config/configurationManager.ts
  diagnostics/diagnostics.ts
  models/types.ts
  services/{projectService,userStoryService}.ts
  tree/{projectTree,userStoriesTree}.ts
  utils/{logger,eventBus}.ts
```

## Next Milestones (Preview)
- Caching & pagination
- CRUD (Epics, User Stories, Tasks, Issues)
- Epics/Tasks/Issues tree views
- MCP server exposing tools (list/create/update/delete)
- Diagnostics panel + telemetry (opt-in)
- Test harness & integration tests

## Troubleshooting
| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| `Loading...` never resolves | Network / invalid base URL | Check base URL & connectivity |
| `No projects` but expected | Token missing/invalid | Re-run Set Token command |
| User stories empty | Selected project has none | Confirm in Taiga web UI |
| Commands missing | Extension not activated | Ensure dev host launched via F5 |

## License

MIT © 2025 HMCorp Fund

Contact: apavlenko@hmcorp.fund — Anton Pavlenko

---
Contributions and issue reports welcome as milestones progress.
