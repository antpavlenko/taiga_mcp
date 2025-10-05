# Taiga MCP Server — Commands & Metadata (Canonical)

This document enumerates the MCP server command surface provided by this project. It’s intended as a canonical reference for implementers and integrations. Unless stated otherwise, all commands operate in the context of the active Taiga project configured by the extension.

General rules

- Identifiers: Use ref for external object references (user stories, tasks, epics, issues). Internal numeric ids are not accepted as inputs unless explicitly noted.
- Tags: Accept a string or array of strings. When sent to Taiga, tags are normalized to the Taiga tag tuple format.
- Status/sprint normalization: Status may be passed by display name; sprint may be passed by name. These are resolved to numeric ids internally.
  - Backlog: To move an item to the backlog (no sprint), pass sprint as null, 0, empty string, or the string "backlog" (case-insensitive). This clears the milestone.
- Optimistic concurrency: Update operations auto-inject the current version when not provided.
- Output trimming: Results are mapped to human-friendly shapes and omit noisy/computed fields.

Contents
- Projects
- Epics
- User stories
- Tasks
- Issues
- Sprints
- Comments

## Projects

- Command: taiga_project_get
- Purpose: Return active project metadata.
- Args: none
- Output: { id, name, slug, description, created_date, modified_date, owner: { username }, members: string[] }

## Epics

- Command: taiga_epics_list
  - Filters: datefrom (ISO), status (string|string[])
  - Output (each): { id, ref, subject, description, status, tags[], assigned_to, owner, created_date, modified_date, client_requirement, team_requirement, is_blocked, blocked_note, user_stories_counts: { total, progress } }

- Command: taiga_epic_get
  - Args: ref (number)
  - Output: same as list + comments[] where comment = { created_date, author, text }

- Command: taiga_epic_create
  - Args: body { subject, description?, status(name|id)?, assigned_to(username|id)?, owner(username|id)?, tags(string|string[])? }
  - Notes: project inferred; tags normalized.

- Command: taiga_epic_update
  - Args: ref (number), patch { subject?, description?, status(name|id)?, assigned_to(username|id)?, owner(username|id)?, tags(string|string[])? , version? }
  - Notes: version auto-injected if omitted.

- Alias: taiga_list_epics → taiga_epics_list

## User stories

- Command: taiga_userstories_list
  - Filters: sprint (name|id), epic (subject|id), datefrom (ISO), assigned_to (username|id), statuses (name|id|array), due_date_from (ISO date), due_date_to (ISO date)
  - Output (each): { id, ref, subject, description, status, assigned_to, owner, sprint, tags[], points: { roleName -> numeric|string }, total_points, created_date, modified_date, finish_date, client_requirement, team_requirement, is_blocked, blocked_note, due_date, epics[] }

- Command: taiga_userstory_get
  - Args: ref (number)
  - Output: same trimmed story as list + comments[] + tasks[] (minimal { id, subject })

- Command: taiga_userstory_create
  - Args: body { subject (required), description?, assigned_to(username|id)?, status(name|id)?, sprint(name|id)?, tags(string|string[])?, due_date?, client_requirement?, team_requirement?, points { role -> label|value }?, epics (subject|id|array)? }
  - Notes: points are normalized role->pointId; epics are linked post-create.

- Command: taiga_userstory_update
  - Args: ref (number), patch: same fields as create plus version?
  - Notes: version auto-injected if omitted; epics links sync to desired set.

## Tasks

- Command: taiga_tasks_list
  - Filters: sprint (name|id), user_story_ref (number), epic_ref (number), datefrom (ISO), assigned_to (username|id), statuses (name|id|array), tags (string|string[]), due_date_from (ISO date), due_date_to (ISO date)
  - Output (each): { id, ref, subject, description, status, assigned_to, owner, tags[], created_date, modified_date, finish_date, due_date, is_blocked, blocked_note }

- Command: taiga_task_get
  - Args: ref (number)
  - Output: trimmed task + comments[]

- Command: taiga_task_create
  - Args: body { subject (required), user_story_ref (required), description?, assigned_to(username|id)?, status(name|id)?, sprint(name|id)?, tags(string|string[])?, due_date?, is_blocked?, blocked_note? }

- Command: taiga_task_update
  - Args: ref (number), patch: same fields as create plus version?
  - Notes: version auto-injected if omitted.

- Command: taiga_tasks_promote_to_userstory
  - Args: ref (task ref), options { keep_tags?, sprint(name)?, assigned_to(username)?, epic_ref?, userstory_status(name)?, close_task?, comment_text? }
  - Output: human-readable message with new user story ref

## Issues

- Command: taiga_issues_list
  - Filters: status (string), sprintId (number)
  - Output (each): { id, ref, subject, status, assigned_to, owner, tags[], due_date, created_date, modified_date, finished_date, severity(name), priority(name), type(name), sprint, is_blocked, blocked_note }

- Command: taiga_issue_get
  - Args: ref (number)
  - Output: normalized issue view (same fields as list item) + comments[]

- Command: taiga_issue_create
  - Args: body { subject (recommended), description?, assigned_to(username|id)?, owner(username|id)?, status(name|id)?, severity(name|id)?, priority(name|id)?, type(name|id)?, sprint(name|id)?, tags(string|string[])? }

- Command: taiga_issue_update
  - Args: ref (number), patch: same fields as create plus version?
  - Notes: version auto-injected if omitted; ref is resolved to internal id automatically.

## Sprints

- Command: taiga_sprints_list
  - Args: none
  - Output (each): { id, name, start_date, finish_date, is_closed, created_date, modified_date, project }

Missing commands vs. requested spec

- userstory_delete: not implemented
- issue_delete by ref: not implemented
- epic_delete: not implemented
- sprint_get: not implemented
- tasks_delete: not implemented
- projects_list: the server exposes only taiga_project_get (active project); there is no projects_list

Recommended alignment changes

- Add delete commands: taiga_userstory_delete, taiga_issue_delete, taiga_epic_delete, taiga_task_delete
- Add taiga_sprint_get accepting sprint ref or id (prefer ref); return the same trimmed sprint view as list
- Consider adding taiga_projects_list if multi-project workspaces are needed; otherwise keep taiga_project_get only

Testing and examples

- Example request/response pairs should be added for each command.
- Unit tests should assert filter behavior and input normalization. Current test coverage focuses on get/list and normalization paths.
  - Add tests for: due_date range filters on stories/tasks; statuses by name/id; epic filtering of stories/tasks via epic_ref; promote-to-userstory flow; version auto-injection on update

