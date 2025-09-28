# Taiga MCP Extension for VS Code

![license](https://img.shields.io/badge/license-MIT-green)
![vscode](https://img.shields.io/badge/VS%20Code-%E2%89%A51.90-1f6feb)
![version](https://img.shields.io/badge/version-1.0.0-blue)

Bring Taiga into VS Code. Connect to your Taiga instance (cloud or self‑hosted), pick a project, and manage Epics, User Stories, Tasks, and Issues using rich, theme‑aware editors. Future milestone: embedded Model Context Protocol (MCP) tools.

## Highlights
- One-time instance setup via `taiga.baseUrl` with automatic `/api/v1` handling
- Secure token flow: exchange credentials via `/auth` and store tokens in VS Code Secret Storage
- Project‑centric navigation: Epics, Sprints, Stories, Issues trees with filters and double‑click open
- Rich editors with productivity features:
  - Epics: color, flags, status, assign, tags, description; linked Stories list with search/sort
  - Stories: roles/points grid, multi‑epic select, sprint/status/assign/tags/due; linked Tasks list
  - Tasks: subject/description/status/assign/tags/due/blocked; optimistic concurrency
  - Issues: subject/description/status/assign/tags/due; Type/Severity/Priority supported
- Robust “closed” detection with grey/strikethrough styling and closed‑last sorting in linked lists
- Theme‑aware icons (light/dark) and consistent UI across VS Code themes

## Quick start
1) Install the extension (local dev or Marketplace).
2) Set your Taiga base URL in Settings: `taiga.baseUrl` (e.g., `https://taiga.example`).
3) Connect: run “Taiga: Connect (Username/Password)” and sign in; token is stored securely.
4) Select a project from the Projects view; browse and manage Epics, Sprints, Stories, and Issues.

## Configuration
Add to Settings (User or Workspace):

```jsonc
{
  "taiga.baseUrl": "https://your-taiga.example", // auto-append /api/v1 if missing
  "taiga.enableVerboseLogging": false
}
```

## Commands
Open Command Palette (⌘⇧P / Ctrl+Shift+P):
- Taiga: Connect (Username/Password)
- Taiga: Set / Update Token
- Taiga: Select Project
- Taiga: Refresh All
- Taiga: Show Diagnostics
- Taiga: Toggle Epic Filter
- Taiga: Select Sprint Filter
- Taiga: Toggle Show Closed Issues
- Create/Edit/Delete for Epic, Sprint, User Story, Issue

## Screenshots / GIFs
- Projects/Filters sidebar — media/screenshots/projects.png
- Epic editor — media/screenshots/epic-editor.png
- Story editor — media/screenshots/story-editor.png
- Task editor — media/screenshots/task-editor.png
- Issue editor — media/screenshots/issue-editor.png

Place the images above in `media/screenshots/` and update names as needed. GIFs are welcome for flows (connect, create epic, edit story).

## Troubleshooting
- Loading never completes: check base URL and network. Ensure `/api/v1` is reachable.
- Empty lists: token missing/expired. Re-run Set / Update Token or Connect.
- Can’t see Sprints/Stories: ensure a project is selected.
- Save fails due to token: the editor shows a token‑expiry message; re‑connect and retry.

## Development
Local development commands:

```bash
npm install
npm run build
npm run watch
npm run lint
npm run lint:fix
npm run typecheck
```

Launch the Extension Development Host with F5 in VS Code.

## Changelog
See `CHANGELOG.md` for release notes. Current: 1.0.0.

## License
MIT © 2025 Anton Pavlenko

## Links
- Marketplace: TBD
- Repository: https://github.com/antpavlenko/taiga_mcp
- Issues: https://github.com/antpavlenko/taiga_mcp/issues
- Publishing: see `PUBLISHING.md`
