# High-Level Goals & Scope

## 1. Objective
Develop a VS Code extension plus embedded MCP server enabling developers to interact with Taiga (cloud or any self‑hosted base URL) for project-centric agile artifact management (Epics, User Stories, Tasks, Issues) with full CRUD and search/filter from inside the editor or via MCP tools.

## 2. Supported Entities (Initial)
- Projects (selection only)
- Epics
- User Stories
- Tasks
- Issues

## 3. CRUD Coverage
- Create, List, Get (detail), Update (partial & full), Delete (with confirmation)
- Status transitions (where supported by Taiga) in Update scope

## 4. Access Modes
1. Interactive VS Code UI (tree views, forms, optional webviews)
2. Command Palette actions
3. MCP Server tools (structured JSON input/output)

## 5. Instance Support
- Multiple named Taiga instances
- Each: base URL, auth type, token secret reference, optional default project slug

## 6. Authentication Methods (Phased)
1. Personal API token (initial)
2. Username + password (token exchange; store only token)
3. OAuth 2.0 (placeholder design only, not implemented initially)

## 7. Security & Secrets
- Tokens stored in VS Code SecretStorage; never logged
- Config references secret IDs; raw secrets never persist in workspace files
- MCP server never outputs raw tokens

## 8. User Experience Pillars
- Fast hierarchical navigation
- Incremental loading & pagination
- Inline create/edit using QuickInput; rich edit via webview for description markdown & tags
- Diff preview toggle before save
- Conflict awareness (ETag / last-modified)
- Status bar indicator: Active instance + project + sync state

## 9. Offline & Caching
- Graceful degraded read-only mode using cached data
- Manual + timed refresh

## 10. Search & Filter
- Text search + facet filters (status, assignee, tags, priority/severity)
- Persist last filters per project

## 11. MCP Server Requirements
Tools (namespaced `taiga.`):
- list_projects, set_active_project
- list_epics, get_epic, create_epic, update_epic, delete_epic
- list_user_stories, get_user_story, create_user_story, update_user_story, delete_user_story
- list_tasks, get_task, create_task, update_task, delete_task
- list_issues, get_issue, create_issue, update_issue, delete_issue
- search_epics / search_user_stories / search_tasks / search_issues (filters + text)

Responses include canonical entity representations; errors normalized.

## 12. Error Normalization Categories
- auth_error
- not_found
- validation_error
- rate_limited
- network_error
- server_error
- unknown

## 13. Extensibility / Future (Not Initial DoD)
- Sprints/backlog management
- Attachments
- Comments/activity feed
- AI-assisted story templating
- Workspace file annotation with entity references

## 14. Performance Targets
- Initial project list < 2s (network permitting)
- Tree expansion < 1.2s p95
- Cached refresh < 300ms

## 15. Reliability
- Retry idempotent GET/HEAD (max 2) on transient errors (ECONNRESET, 502/503/504)
- Non-idempotent ops not retried unless safe

## 16. Logging / Diagnostics
- Output channel: "Taiga"
- Verbose toggle
- Redact secrets (Authorization header, tokens)

## 17. Configuration (Representative Keys)
- taiga.instances (array)
- taiga.activeInstanceName
- taiga.autoRefreshIntervalSeconds
- taiga.maxPageSize
- taiga.enableVerboseLogging
- taiga.mcp.enable

## 18. Versioning & Compatibility
- Detect Taiga API version; warn on incompatibility

## 19. Internationalization
- English only initial; extractable strings

## 20. Telemetry & Privacy
- No telemetry by default; optional opt-in (anonymous usage counts)

## 21. Definition of Done (Per Feature)
- Types declared
- Commands registered and documented
- Tree updates reactive to CRUD
- Error paths covered by tests
- MCP schemas validated
- README updated

## 22. Out of Scope (Initial)
- Real-time push/WebSockets
- Attachments upload
- Custom fields beyond standard base set
- Sprint capacity planning UI
