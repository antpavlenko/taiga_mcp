# Taiga MCP Extension for VS Code

![license](https://img.shields.io/badge/license-MIT-green)
![vscode](https://img.shields.io/badge/VS%20Code-%E2%89%A51.102-1f6feb)
![version](https://img.shields.io/badge/version-1.1.1-blue)

Bring Taiga into VS Code. Connect to your Taiga instance (cloud or self‑hosted), pick a project, and manage Epics, User Stories, Tasks, and Issues using rich, theme‑aware editors. Includes a minimal Model Context Protocol (MCP) server that’s auto‑registered for Copilot tools.

## Highlights
- One-time instance setup via `taiga.baseUrl` with automatic `/api/v1` handling
- Secure token flow: exchange credentials via `/auth` and store tokens in VS Code Secret Storage
- Project‑centric navigation: Epics, Sprints, Stories, Issues trees with filters and double‑click open
- Rich editors with productivity features:
  - Epics: color, flags, status, assign, tags, description; linked Stories list with search/sort
  - Stories: roles/points grid, multi‑epic select, sprint/status/assign/tags/due; linked Tasks list
  - Tasks: subject/description/status/assign/tags/due/blocked; optimistic concurrency
  - Issues: subject/description/status/assign/tags/due; Type/Severity/Priority supported (names resolved)
- Robust “closed” detection with grey/strikethrough styling and closed‑last sorting in linked lists
- Theme‑aware icons (light/dark) and consistent UI across VS Code themes

## Quick start
1) Install the extension (local dev or Marketplace).
2) Set your Taiga base URL in Settings: `taiga.baseUrl` (e.g., `https://taiga.example`).
3) Connect: run “Taiga: Connect (Username/Password)” and sign in; token is stored securely.
4) Select a project from the Projects view; browse and manage Epics, Sprints, Stories, and Issues.
5) (Optional) Use MCP tools in Copilot: see the MCP section below (the server auto-uses your selected project).

## Configuration
Add to Settings (User or Workspace):
If you run into configuration issues, enable the setting "Taiga MCP: Debug" and use the commands:

- "Taiga: Show MCP Env (Debug)" — shows what the extension will pass to the MCP server.
- "Taiga: Open MCP Server Debug" — opens a file with the actual argv/env snapshot written by the MCP server at startup.

```jsonc
{
  "taiga.baseUrl": "https://your-taiga.example", // auto-append /api/v1 if missing
  "taiga.enableVerboseLogging": false
}
```

MCP-specific:

```jsonc
{
  // Preferred if MCP should target a different base than the extension UI
  "taigaMcp.baseUrl": "https://your-taiga.example"
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

### MCP tools not visible in Configure Tools
This extension registers a local MCP stdio server (“Taiga MCP (local)”) programmatically. It uses your active Taiga project from the extension as context for list tools. To make Copilot list and use it, ensure the following VS Code settings are enabled:

- Chat: MCP Access = Enabled (or not set to "none")
- Chat > MCP: Discovery = Enabled
- Chat > MCP: NuGet Tools = Enabled (if using the discovery catalog)
- Chat > MCP: Autostart = Enabled (optional; otherwise start on demand)

After enabling, use Command Palette → "MCP: List Servers" and hit the Refresh action; you should see “Taiga MCP (local)”. If prompted, enter your Taiga API token. The base URL is taken from `taigaMcp.baseUrl` or falls back to your main `taiga.baseUrl` (normalized to remove trailing /api).

If the server still doesn't appear:
- Make sure VS Code is v1.102+.
- Check the Output panel → "Taiga" for lines like "Registered Taiga MCP provider definition".
- Verify that `chat.mcp.access` is not set to "none".

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

## MCP — Architecture and Decoupling
The MCP server is embedded and runs via stdio. It exposes a minimal tool set today (e.g., list epics) and is designed to be decoupled into a reusable package/runner so it can be used standalone or with Docker.

- Design/roadmap and command catalog: see `docs/mcp/ARCHITECTURE.md`.
- Planned: extract server core to a package (e.g., `@taiga-mcp/server`) with stdio and HTTP runners.

### Available MCP tools (v1.1.1)
- taiga_project_get
- taiga_epics_list (alias: taiga_list_epics)
- taiga_epic_get
- taiga_epic_create
- taiga_epic_update
- taiga_userstories_list
- taiga_userstory_get
- taiga_userstory_create
- taiga_userstory_update
- taiga_tasks_list (filters: sprint, user_story_ref, epic_ref, assigned_to, statuses, tags, due date range)
- taiga_task_get
- taiga_task_create
- taiga_task_update
- taiga_issues_list
- taiga_issue_get
- taiga_issue_create
- taiga_issue_update (by ref)
- taiga_epics_comments_create
- taiga_userstories_comments_create
- taiga_tasks_comments_create
- taiga_issues_comments_create

Notes:
- Updates accept human-friendly names for status/sprint/tags, and issues accept type/severity/priority names; version is auto-injected when omitted.
- Moving items to backlog: pass sprint as null, 0, "", or "backlog" to clear milestone.

## Changelog
See `CHANGELOG.md` for release notes. Current: 1.1.1.

## License
MIT © 2025 Anton Pavlenko

## Links
- Marketplace: https://marketplace.visualstudio.com/items?itemName=AntonPavlenko.taiga-mcp-extension
- Repository: https://github.com/antpavlenko/taiga_mcp
- Issues: https://github.com/antpavlenko/taiga_mcp/issues
- Publishing: see `PUBLISHING.md`

### Release notes
See the Marketplace page “Changelog” tab or `CHANGELOG.md` in this repo. Highlights in 1.1.1:
- Issue update now uses ref (not id) and resolves internal ids automatically.
- Issues show human-readable Severity/Priority/Type names.
- Moving items to backlog supported via sprint clearing (null/0/"backlog").
- Removed computed `is_closed` from outputs to prevent invalid updates by tools.
