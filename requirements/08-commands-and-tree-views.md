# Commands & Tree Views Specification

Defines all VS Code contribution points for command palette entries, tree hierarchy design, context values, status bar integration, and command → service mappings.

## 1. Command Naming Conventions
- Prefix all command IDs with `taiga.`
- Human-readable titles start with `Taiga:`
- Context commands reuse same underlying IDs when possible.

## 2. Command Registry Table
| ID | Title | Type | Arguments | Service Call | Notes |
|----|-------|------|-----------|--------------|-------|
| `taiga.connect` | Taiga: Connect | palette/view-title | — | AuthManager.login(username,password) | Prompts for username/password; stores token |
| `taiga.selectInstance` | Taiga: Select Instance | palette | — | ConfigManager.setActiveInstance | Prompts QuickPick |
| `taiga.addInstance` | Taiga: Add Instance | palette | — | ConfigManager.addInstanceWizard | Writes to settings |
| `taiga.removeInstance` | Taiga: Remove Instance | palette | instanceName? | ConfigManager.removeInstance | Purges secrets |
| `taiga.setToken` | Taiga: Set / Update Token | palette | instanceName? | AuthManager.setToken | Validates token |
| `taiga.invalidateToken` | Taiga: Invalidate Token | palette | instanceName? | AuthManager.invalidateToken | Flush caches |
| `taiga.selectProject` | Taiga: Select Project | palette | — | ProjectService.selectProject | Updates status bar |
| `taiga.refreshAll` | Taiga: Refresh All | palette | — | Cache.invalidateAll + Services.list | Parallel refresh |
| `taiga.search` | Taiga: Search | palette | entityType? | SearchService.search | Multi-step wizard |
| `taiga.createEpic` | Taiga: Create Epic | palette/context | projectId? | EpicService.create | Default project is active |
| `taiga.createSprint` | Taiga: Create Sprint | palette/context | projectId? | SprintService.create | Milestone create |
| `taiga.createUserStory` | Taiga: Create User Story | palette/context | epicId? | UserStoryService.create | Optionally from epic context |
| `taiga.createTask` | Taiga: Create Task | palette/context | userStoryId? | TaskService.create | |
| `taiga.createIssue` | Taiga: Create Issue | palette/context | projectId? | IssueService.create | |
| `taiga.openDetail` | Taiga: Open Detail | context | entityId | DetailPanelManager.open | Also double-click |
| `taiga.editEntity` | Taiga: Edit | context | entityId | GenericService.edit | Decides quick vs webview |
| `taiga.changeStatus` | Taiga: Change Status | context | entityId | GenericService.updateStatus | QuickPick statuses |
| `taiga.assignUser` | Taiga: Assign To | context | entityId | GenericService.assign | QuickPick members |
| `taiga.addTag` | Taiga: Add Tag | context | entityId | GenericService.addTag | Multi-select tags |
| `taiga.toggleBlocked` | Taiga: Toggle Blocked | context | entityId | GenericService.toggleBlocked | Prompt reason if blocking |
| `taiga.deleteEntity` | Taiga: Delete | context | entityId | GenericService.delete | Confirmation modal |
| `taiga.copyId` | Taiga: Copy ID | context | entityId | Clipboard.copy | Simple utility |
| `taiga.copyRef` | Taiga: Copy Ref | context | entityId | Clipboard.copy | For stories/tasks with ref |
| `taiga.openInBrowser` | Taiga: Open In Browser | context | entityId | UrlBuilder.open | External link |
| `taiga.showDiagnostics` | Taiga: Show Diagnostics | palette | — | DiagnosticsService.report | Output channel |
| `taiga.exportCacheSnapshot` | Taiga: Export Cache Snapshot | palette | — | Cache.exportSnapshot | Debug only |
| `taiga.clearFilters` | Taiga: Clear Filters | view title | entityType | FilterService.clear | Refresh list |
| `taiga.filterEntities` | Taiga: Filter... | view title/context | entityType | FilterService.configure | Multi-step wizard |

## 3. Tree Views
### 3.1 Registered Views
| View ID | Name | Purpose |
|---------|------|---------|
| `taigaProjects` | Taiga Projects | List & select projects |
| `taigaEpics` | Taiga Epics | Project epics hierarchy |
| `taigaSprints` | Taiga Sprints | Milestones + Backlog (single-select) |
| `taigaUserStories` | Taiga User Stories | Stories grouped by status or epic; filtered by Epics/Sprint |
| `taigaIssues` | Taiga Issues | Issues list (severity coloring) |

Tasks are displayed under user stories; no separate top-level view in initial version.

### 3.2 Tree Item Context Values
| Entity | Context Value | Notes |
|--------|---------------|-------|
| Project | `taiga.project` | Selected project may have additional `active` flag via `resourceUri` or description |
| Epic | `taiga.epic` | Supports create story child |
| Sprint | `taiga.sprint` | Backlog is a synthetic sprint |
| User Story | `taiga.userStory` | Children tasks, create task child |
| Task | `taiga.task` | Leaf node |
| Issue | `taiga.issue` | Leaf node |
| Loading Placeholder | `taiga.loading` | Spinner style icon |
| Error Placeholder | `taiga.error` | Retry command |
| Group (Status/Epic) | `taiga.group` | Not directly editable |

### 3.3 Icon & Decoration Strategy
- Use codicons: epics (rocket), stories (symbol-string), tasks (checklist or circle), issues (issue-opened style), blocked (warning overlay), closed (pass or check). 
- Severity decoration: colorize issue icon or add badge letter (C=critical, B=blocker). If color override conflicts with theme, fallback to badge.

### 3.4 Lazy Loading
- Expanding a group (status or epic grouping) triggers on-demand fetch if grouping index stale.
- Tasks fetched only when user story node expanded.
- Epics/Sprints lists fetched on project change; filters applied client-side where possible.

### 3.5 Sorting Rules
- Projects: alphabetical (case-insensitive).
- Epics: custom order by `order` field if available else by modifiedDate desc.
- Sprints: by start date asc; Backlog shown at top.
- User Stories: status group order by status.order, inside group by modifiedDate desc.
- Tasks: status.order then subject lexicographically.
- Issues: severity priority (blocker→trivial) then modifiedDate desc.

## 4. Status Bar Integration
- Command on click: `taiga.selectProject`.
- Text pattern: `Taiga: <instance>/<projectSlug>`; appended `(Offline)` or `(Stale)` badges conditionally.
- Tooltip includes last refresh timestamp & filter summary.
 - When not connected: shows `Taiga: Connect`.

## 5. Command → Service Mapping Rules
- All entity commands go through appropriate service to maintain caching & events.
- Generic update commands use discriminated union: `{ type: 'assign' | 'status' | 'tags' | 'blocked'; payload: ... }` routed to generic update helper.

## 6. Error Handling in Trees
- If list fetch fails: show single error node with label: `Failed to load (Retry)`.
- Clicking error node or context command `Retry` re-invokes load.
 - If not connected (no token): show `Not connected. Click Connect` info node with command `taiga.connect`.

## 7. Filter Indicators
- When filters active for a view, set `TreeView.description = "Filtered"` and add root pseudo-node `[Filters: status=In Progress, tag=backend]` with context `taiga.filterSummary` (click to modify / clear).
 - Epics multi-select and Sprint single-select states are reflected in User Stories view description.

## 8. Refresh Mechanics
- View title action `Refresh` mapped to `taiga.refreshAll` or entity-specific refresh (prefer entity-specific for minimal load).
- After create/update/delete operations, programmatic refresh of only impacted view or node.

## 9. Grouping Preference Updates
- Changing grouping (stories by status vs epic) triggers rebuild of grouping map; no full refetch unless stale.

## 10. Performance Considerations
- Use `TreeItem` `resourceUri` to leverage theming & caching of icons.
- Avoid recomputing all tree items on small updates: targeted `onDidChangeTreeData` with specific element when possible.

## 11. Context Menu Conditions (when clauses)
Examples:
```json
"when": "view == taigaEpics && viewItem == taiga.epic"
```
Custom context keys:
- `taiga:activeProject` true when project selected (for enabling create commands globally).
- `taiga:offline` disables write operations.

## 12. Command Argument Passing
- Tree items store minimal metadata: `{ entityType, id }` in `TreeItem.command.arguments` (avoid heavy objects).
- Services fetch full entity from cache or API as needed.

## 13. Diagnostics Command Output
- Summaries: project, cache counts, active filters, rate limiter queue depth.

## 14. Accessibility / Labels
- `TreeItem.tooltip` includes: subject/title, status, assignee, updated relative time.
- Blocked flag indicated with prefix `[BLOCKED]` in label if icons insufficient for screen readers.

## 15. Open Detail Behavior
- Double-click navigates to webview panel or quick view depending on entity type & complexity (epics, stories, issues open detail; tasks may quick edit by default with option to open full view).

## 16. Future Enhancements
- Multi-select actions for bulk status change.
- Inline renaming (F2) for epic/story subject.
- Virtualization if very large lists ( > 2k items ) using partial paging in tree.

---
**End of Commands & Tree Views Document**
