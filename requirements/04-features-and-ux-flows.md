# Features & UX Flows

This document specifies user-facing behaviors, command designs, interaction patterns, and edge case handling for the Taiga VS Code extension.

## 1. Primary User Personas
1. **Developer**: Needs quick access to tasks/user stories/issues while coding.
2. **Tech Lead / Product Owner**: Bulk reviews epics & stories, updates statuses, creates new items.
3. **AI Agent (via MCP)**: Structured programmatic access for retrieval and creation.

## 2. Core Views
- **Projects View**: Lists accessible projects. Selecting one sets active project context and persists across sessions.
- **Epics View**: Flat list of epics with color indicators (from Taiga). Supports multi-select as a filter for User Stories.
- **Sprints View (Milestones + Backlog)**: Single-select list of sprints/milestones plus a synthetic "Backlog" entry (stories without milestone). Selection filters User Stories. Only one sprint may be selected at a time.
- **User Stories View**: Filtered by selected Epics (multi) and Sprint (single). Default list shows `[REF] Subject`. Expanding a story reveals tasks; tasks can be created from story context.
- **Issues View**: Flat list of non-closed issues by default. A view-level toggle shows closed issues as well when enabled.
- **Detail Panel (Webview)**: Rich display + edit for a single entity (Epic, Sprint, User Story, Task, Issue) with create/delete capabilities.

## 3. Navigation Flows
### 3.1 Installing and Connecting
1. Install the extension from Marketplace.
2. Configure settings: provide a single `baseUrl` for the server. The extension auto-appends `/api/v1` if no `/api` segment is present.
3. Click the Connect action in the Taiga panel or run `Taiga: Connect`.
4. The extension prompts for Username and Password, authenticates via Taiga `/auth`, securely stores the `auth_token` in Secret Storage, and validates access.

### 3.2 Selecting a Project
1. After successful connection, a QuickPick lists accessible projects; user selects one.
2. The active project is persisted (restored on next VS Code run) and shown in the status bar.
3. Epics, Sprints, User Stories, and Issues views load and reflect the active project context.

### 3.2 Selecting a Project
1. Expand Projects View or run `Taiga: Select Project`.
2. Project chosen → active project stored (memento) & status bar updated.
3. Epics / User Stories / Issues views load.

### 3.3 Browsing Entities
- Expand entity nodes; lazy fetch if not cached.
- Loading spinner placeholder while fetching.

## 4. Creation Flows
Actions are available via: view title "+" buttons, context menus, or command palette. All creates are scoped to the active project (and optionally to a selected parent entity).

### 4.1 Create Epic
Inputs: Title → (optional) Description → Color → Tags. Appears immediately in Epics list.

### 4.2 Create Sprint (Milestone)
Inputs: Name → Start/End Dates → (optional) Description. Appears in Sprints list.

### 4.3 Create User Story (Quick Form)
1. Command: `Taiga: Create User Story`.
2. Inputs (multi-step QuickInput): Subject → (optional) Description → (optional) Epic selection → Tags → Priority.
3. Confirmation step (preview) if enabled in settings.
4. POST → on success, story appears in tree (auto-expand correct group) & selection moves to new item.

### 4.4 Create Task
1. Trigger from context menu of a User Story or via command (then prompts for user story).
2. Steps: Subject → (optional) Description → (optional) Assignee → Tags → Priority.

### 4.5 Create Issue
Similar to task; includes severity field.

### 4.4 Create Epic
Inputs: Title → (optional) Description → Color → Tags.

## 5. Editing & Updating
### 5.1 Quick Edit
- Context menu: `Change Status`, `Assign To`, `Add Tag`, `Toggle Blocked`.
- Uses QuickPick for enumerations.

### 5.2 Full Edit (Webview)
- Opens detail panel with markdown editor (description), tags editor (chips), assignee dropdown, status dropdown.
- Save triggers diff preview if enabled.

### 5.3 Diff Preview
- Shows side-by-side (original vs proposed) for text fields (description) and summarized field changes.

## 6. Deletion Flow
1. Context menu `Delete <Entity>`.
2. Confirmation modal summarizing ID, title/subject.
3. On success: remove from tree, show undo toast if feasible (soft delete simulation by refetching? If API permanent delete, undo not available → show warning).

## 7. Search & Filter
### 7.1 Global Search Command
- `Taiga: Search` → choose entity type → text query + optional status/assignee/tag filters.
- Results displayed in a temporary virtual tree or quick pick list with open-on-select.

### 7.2 Persistent Filters
- Each view has `Filter...` context command opening multi-step wizard.
- Active filters summary displayed atop view (pseudo-node or view description).
- Clear filters command resets cache for that entity list.

### 7.3 Filter by Epics and Sprint
- Epics view supports multi-select; selected epics filter User Stories to only those linked to any selected epic.
- Sprints view supports single select; selected sprint filters User Stories to those assigned to that milestone; selecting Backlog shows stories without a milestone.
- Issues view has a `Show Closed Issues` toggle (off by default); when on, closed issues are included.

## 8. Status Bar Indicators
- Shows: `Taiga: <instanceName> / <projectSlug> (Synced|Stale|Offline)`.
- Clicking opens project selector.

## 9. Refresh Patterns
- Per-view `Refresh` action (icon in view title).
- Global `Taiga: Refresh All`.
- Auto-refresh interval if configured (lightweight conditional GET).

## 10. Error Handling UX
- Inline tree node error placeholder on load failures with `Retry` command.
- Notification severity mapping: auth/network = warning; validation = error; rate limit = info with retry after.
- “Show Details” button opens output channel focusing last normalized error JSON.

## 11. Blocked Items UX
- Blocked items display an icon badge.
- `Toggle Blocked` prompts for (un)block reason if blocking.

## 12. Tag Management
- QuickPick multi-select with existing project tags (fetched lazily) + freeform entry validation.
- Tags displayed as comma list or colored badges (webview only).

## 13. Keyboard Accessibility
- All commands accessible via Command Palette.
- Focus management in webview: first field autofocus; ESC to close panel (if unsaved changes → confirmation prompt).

## 14. Theming & Icons
- Use codicon set for statuses (e.g., `circle-large-outline`, `pass`, `warning` for blocked).
- Severity coloring (issues): trivial=grey, minor=blue, normal=default, major=orange, critical=red, blocker=magenta.

## 15. MCP Interaction Flows
### 15.1 Retrieve Stories
- Tool call `taiga.list_user_stories` with filters.
- Returns paged result + lightweight shapes unless `includeDetails=true` specified.

### 15.2 Create Task
- Tool call with validated schema; returns canonical task.

### 15.3 Error Propagation
- Tools return structured error object; no thrown exceptions crossing JSON boundary.

### 15.4 Project Context
- If no active project, tools requiring project emit `project_not_selected` validation error category (maps to `validation`).

## 16. Notifications & Toasts
- Success create/update shows ephemeral info message with entity ref + `Open` action.
- Batch operations show progress with cancellation token where applicable (future).

## 17. Performance Feedback
- Loading spinners for network waits >150ms.
- Shimmer placeholder (optional future) for large list loads.

## 18. Settings Impact on UX
- `taiga.enableVerboseLogging`: adds “Copy Debug Context” button in error notifications.
- `taiga.autoRefreshIntervalSeconds`: shows countdown hover tooltip in status bar.
- `taiga.maxPageSize`: influences pagination size in list fetch calls.
- `taiga.baseUrl`: single server entry; `/api/v1` auto-appended if no `/api` segment present.
- `taiga.rememberProject`: when enabled (default), persists active project selection across sessions.

## 19. Edge Cases
- Project with zero epics: show placeholder “No epics. Create one...” with create action.
- Network down mid-edit: prompt to keep draft; store draft in memento until retried.
- Large description (>50k chars): warn user and truncate preview (save still allowed if API permits).
- Tags exceeding limit: validation stops submission with actionable message.

## 20. Accessibility Considerations
- All color-coded statuses also have text labels.
- Webview ensures ARIA labels for interactive controls.

## 21. Internationalization Prep
- All user-facing strings routed through a localization helper function for future extraction.

## 22. Command List (Initial)
```
Taiga: Select Instance
Taiga: Select Project
Taiga: Refresh All
Taiga: Search
Taiga: Create Epic
Taiga: Create User Story
Taiga: Create Task
Taiga: Create Issue
Taiga: Edit (contextual per entity)
Taiga: Change Status (context)
Taiga: Assign To (context)
Taiga: Add Tag (context)
Taiga: Toggle Blocked (context)
Taiga: Delete (context)
Taiga: Show Diagnostics
```

## 23. Context Menu Actions (Tree Items)
- Open Detail
- Create Child (epic → story, story → task)
- Copy ID / Copy Ref
- Open in Browser

## 24. Diff View UX
- If diff enabled: show VS Code diff editor (virtual documents) or inline webview section with unified diff.

## 25. Persistence of User Preferences
- Stored in workspaceState: chosen grouping mode, last filters per entity, last search query.
- Also stored: selected epic IDs (multi), selected sprint ID (or Backlog), showClosedIssues flag, active project info.

## 26. MCP Tool Naming Conventions
- All verbs lowercase, nouns singular after verb, lists plural: `list_user_stories`, `create_task`.

## 27. Failure Recovery
- If MCP tool call fails due to auth → attempt silent revalidation once; if still failing return auth error.

## 28. Future Enhancements (Not Implemented Initially)
- Bulk status change multi-select.
- Inline markdown preview toggle in quick edits.
- Workspace file annotation scanning (detect IDs like US#123).

---
Clarifications (to confirm):
- Sprints map to Taiga Milestones. Backlog is modeled as stories with no milestone (we show a synthetic "Backlog" entry).
- Epic multi-select filter uses OR semantics (stories linked to any selected epic).
- Closed issues definition uses Taiga issue status `is_closed` flag.
- Editors (webviews) include Delete action and will reflect relationships (e.g., adding existing or new user stories to an epic; editing sprint dates).

---
**End of Features & UX Flows Document**
