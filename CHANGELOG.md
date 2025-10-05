# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [1.1.0] - 2025-10-03
## [1.1.1] - 2025-10-05

### Changed
- MCP: Issue update now accepts ref instead of id and auto-resolves internal ids; descriptions updated to consistently signal ref usage across commands.
- MCP: Normalized Issues outputs to return human-readable severity/priority/type names; added robust fallbacks for Taiga variants.
- MCP: Backlog support — setting sprint to null/0/""/"backlog" clears the milestone for issues, tasks, and user stories.
- MCP: Removed computed field `is_closed` from list/get results to avoid invalid updates by tools.
- Docs: Updated command catalog to reflect ref-only updates, backlog behavior, and removed `is_closed`.

### Fixed
- Resolved an issue where Copilot tools would surface numeric severity/priority for Issues on some Taiga servers.
- Ensured moving items to backlog via the MCP server works reliably across entities.


### Added
- MCP: Context-aware server now receives the active project from the extension and uses it to scope list tools.
- MCP: Comment tools added for Epics, User Stories, Tasks, and Issues:
  - `<resource>_comments_list` to read comments by id
  - `<resource>_comments_create` to create a new comment (text)
- Docs: README updated with MCP settings (Chat MCP Access/Discovery/NuGet/Autostart) and troubleshooting.
- Docs: MCP architecture and decoupling guide at `docs/mcp/ARCHITECTURE.md`.

### Changed
- Bumped extension version to 1.1.0 and aligned embedded MCP server version.

## [1.0.1] - 2025-10-02

### Fixed
- Added Blocked property and Reason field across all editors (Issues, Epics, User Stories, Tasks). Reason input appears to the right of the Blocked control where applicable and is saved as blocked_note.
- Issues now include a Sprint field in the editor and can be filtered by Sprint in the Issues view. Backlog is supported via the tri-state sprint filter.
- Epic filter no longer affects Issues; Issues are independent of epic filter settings.
- Webview tab icons are now set for all editors using the Taiga emblem (light/dark), ensuring no blank tab icons.

### Changed
- Bumped extension version to 1.0.1.

## [1.0.0] - 2025-09-28

### Added
- Full-featured editors for Epics, User Stories, Tasks, and Issues
  - Epic: color, flags, status, assign, tags, description; linked User Stories table with search/sort and context menu
  - Story: roles/points grid, multi-epic select, sprint/status/assign/tags/due date; linked Tasks table with search/sort and context menu
  - Task: subject/description/status/assign/tags/due date/blocked; optimistic concurrency via version on update
  - Issue: subject/description/status/assign/tags/due date; plus Type, Severity, Priority fields
- Tree views: Epics, Sprints, User Stories, Issues with filters and double-click open
- Robust "closed" detection/styling and closed-last sorting in linked lists (stories under epics, tasks under stories)
- Theme-aware webview icons (light/dark); activity bar icon; marketplace PNG asset
- Token acquisition via Connect, secure storage, and token-expiry handling during saves

### Changed
- Stabilized date inputs across themes by reverting to native indicators with CSS filters
- Standardized editor layouts, labels, and button styling for consistency

### Fixed
- Epic editor webview parsing error caused by TS-only inline cast
- Issue metadata compatibility across Taiga servers (fallback endpoints for types/severities/priorities)
