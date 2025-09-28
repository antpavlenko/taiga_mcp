# Marketplace Listing Draft

## Short Description
Bring Taiga into VS Code. Connect to your instance, pick a project, and manage Epics, User Stories, Tasks, and Issues with rich editors and trees.

## Long Description
Taiga MCP Extension integrates Taiga (cloud or self‑hosted) directly into VS Code.
- Connect once, token stored securely
- Browse projects and filter Epics, Sprints, Stories, and Issues
- Open items with double‑click and edit in rich, theme‑aware editors
- Robust closed‑state detection and clear styling in linked lists
- Future milestone: embedded MCP tools for automation

## Features
- Instance config via `taiga.baseUrl` (auto `/api/v1`)
- Secure auth (VS Code Secret Storage)
- Epics, Sprints, Stories, Issues trees with filters
- Editors for Epics/Stories/Tasks/Issues
- Theme‑aware icons and consistent UI

## Requirements
- VS Code 1.90+
- Access to a Taiga instance (cloud or self‑hosted)

## Extension Settings
- `taiga.baseUrl`: Base URL for your Taiga (e.g., https://taiga.example)
- `taiga.enableVerboseLogging`: Toggle verbose logs

## Known Issues
- None at this time. Please report issues on GitHub.

## Release Notes
See CHANGELOG.

## Images (placeholders)
- media/screenshots/projects.png
- media/screenshots/epic-editor.png
- media/screenshots/story-editor.png
- media/screenshots/task-editor.png
- media/screenshots/issue-editor.png
