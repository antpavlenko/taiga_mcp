# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

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

[1.0.0]: https://github.com/antpavlenko/taiga_mcp/releases/tag/v1.0.0
