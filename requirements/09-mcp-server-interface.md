# MCP Server Interface Specification

Defines the Model Context Protocol (MCP) tools exposed by the extension, including naming, JSON Schemas (conceptual), error model usage, rate limit handling, and context negotiation.

## 1. Goals
- Provide reliable, schema-validated programmable access to Taiga entities.
- Maintain parity with UI CRUD operations while ensuring safety (validation & size limits).
- Propagate meaningful errors with categories.

## 2. Tool Naming Convention
- Prefix: `taiga.`
- Pattern: `taiga.<verb>_<nounPluralOrSingular>`
- List operations plural; CRUD entity verbs singular after action (e.g., `create_user_story`).

## 3. Shared Concepts
### 3.1 Context
- Active Instance & Project implicitly used.
- If tool requires project and none selected → return `validation` error with message `Active project not set`.

### 3.2 Pagination Standard
Input properties (optional):
```json
{
  "offset": { "type": "number", "minimum": 0, "default": 0 },
  "limit":  { "type": "number", "minimum": 1, "maximum": 200, "default": 50 }
}
```
Response wrapper for list tools:
```json
{
  "type": "object",
  "required": ["items", "meta"],
  "properties": {
    "items": { "type": "array" },
    "meta": {
      "type": "object",
      "required": ["limit", "offset", "total", "hasNext"],
      "properties": { "limit": {"type":"number"}, "offset": {"type":"number"}, "total": {"type":"number"}, "hasNext": {"type":"boolean"} }
    }
  }
}
```

### 3.3 Error Object
As defined earlier: `taiga.error.schema.json` reused.

### 3.4 Rate Limit Metadata
If an operation hit or is subject to rate limiting, attach extension field:
```json
"_rateLimit": { "retryAfterMs": 1200 }
```

## 4. Tool Catalog
| Tool Name | Purpose | Requires Project | Input Schema Ref | Output Schema Ref |
|-----------|---------|------------------|------------------|-------------------|
| `taiga.list_projects` | Enumerate accessible projects | No | listProjectsInput | projectListOutput |
| `taiga.set_active_project` | Set active project by id or slug | No | setActiveProjectInput | setActiveProjectOutput |
| `taiga.get_project` | Fetch single project detail | No (project chosen explicit) | getProjectInput | projectSchema |
| `taiga.list_epics` | List epics (filters) | Yes | listEpicsInput | pagedEpicOutput |
| `taiga.get_epic` | Get epic detail | Yes | getEntityInput | epicSchema |
| `taiga.create_epic` | Create epic | Yes | createEpicInput | epicSchema |
| `taiga.update_epic` | Update epic (partial) | Yes | updateEpicInput | epicSchema |
| `taiga.delete_epic` | Delete epic | Yes | deleteEntityInput | deleteResult |
| `taiga.list_user_stories` | List stories | Yes | listUserStoriesInput | pagedUserStoryOutput |
| `taiga.get_user_story` | Get story detail | Yes | getEntityInput | userStorySchema |
| `taiga.create_user_story` | Create story | Yes | createUserStoryInput | userStorySchema |
| `taiga.update_user_story` | Update story | Yes | updateUserStoryInput | userStorySchema |
| `taiga.delete_user_story` | Delete story | Yes | deleteEntityInput | deleteResult |
| `taiga.list_tasks` | List tasks | Yes | listTasksInput | pagedTaskOutput |
| `taiga.get_task` | Get task detail | Yes | getEntityInput | taskSchema |
| `taiga.create_task` | Create task | Yes | createTaskInput | taskSchema |
| `taiga.update_task` | Update task | Yes | updateTaskInput | taskSchema |
| `taiga.delete_task` | Delete task | Yes | deleteEntityInput | deleteResult |
| `taiga.list_issues` | List issues | Yes | listIssuesInput | pagedIssueOutput |
| `taiga.get_issue` | Get issue detail | Yes | getEntityInput | issueSchema |
| `taiga.create_issue` | Create issue | Yes | createIssueInput | issueSchema |
| `taiga.update_issue` | Update issue | Yes | updateIssueInput | issueSchema |
| `taiga.delete_issue` | Delete issue | Yes | deleteEntityInput | deleteResult |
| `taiga.search_user_stories` | Text + filters search | Yes | searchUserStoriesInput | pagedUserStoryOutput |
| `taiga.search_epics` | Search epics | Yes | searchEpicsInput | pagedEpicOutput |
| `taiga.search_tasks` | Search tasks | Yes | searchTasksInput | pagedTaskOutput |
| `taiga.search_issues` | Search issues | Yes | searchIssuesInput | pagedIssueOutput |
| `taiga.get_statuses` | Get statuses metadata | Yes | getStatusesInput | statusListOutput |
| `taiga.get_members` | Get project members | Yes | getMembersInput | memberListOutput |

## 5. Representative Schemas (Conceptual JSON)
### 5.1 setActiveProjectInput
```json
{
  "$id": "taiga.set_active_project.input.schema.json",
  "type": "object",
  "properties": {
    "projectId": { "type": "number" },
    "projectSlug": { "type": "string" }
  },
  "oneOf": [
    { "required": ["projectId"] },
    { "required": ["projectSlug"] }
  ],
  "additionalProperties": false
}
```

### 5.2 createTaskInput
```json
{
  "$id": "taiga.create_task.input.schema.json",
  "type": "object",
  "required": ["userStoryId", "subject"],
  "properties": {
    "userStoryId": { "type": "number" },
    "subject": { "type": "string", "minLength": 1, "maxLength": 200 },
    "description": { "type": "string" },
    "assignedToId": { "type": ["number", "null"] },
    "tags": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 40 }, "maxItems": 32 },
    "priority": { "enum": ["lowest","low","normal","high","highest"] }
  },
  "additionalProperties": false
}
```

### 5.3 updateTaskInput
```json
{
  "$id": "taiga.update_task.input.schema.json",
  "type": "object",
  "properties": {
    "subject": { "type": "string", "minLength": 1, "maxLength": 200 },
    "description": { "type": "string" },
    "assignedToId": { "type": ["number", "null"] },
    "statusId": { "type": "number" },
    "tags": { "type": "array", "items": { "type": "string", "minLength": 1, "maxLength": 40 }, "maxItems": 32 },
    "priority": { "enum": ["lowest","low","normal","high","highest"] },
    "blocked": { "type": "object", "properties": { "isBlocked": {"type": "boolean"}, "reason": {"type": "string", "maxLength": 500} }, "required": ["isBlocked"], "additionalProperties": false }
  },
  "minProperties": 1,
  "additionalProperties": false
}
```

### 5.4 deleteEntityInput
```json
{
  "$id": "taiga.delete_entity.input.schema.json",
  "type": "object",
  "required": ["id"],
  "properties": { "id": { "type": "number" } },
  "additionalProperties": false
}
```

### 5.5 deleteResult
```json
{
  "$id": "taiga.delete_result.schema.json",
  "type": "object",
  "required": ["id", "deleted"],
  "properties": {
    "id": { "type": "number" },
    "deleted": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

## 6. Tool Execution Lifecycle
1. Receive JSON input.
2. Fetch active instance & project context (if required).
3. Validate input via AJV/Zod compiled schema cache.
4. Invoke service method (ensuring rate limiter engaged indirectly via API client).
5. On success: map entity/entities to canonical schema shape.
6. On error: catch & transform to `error` response envelope.

## 7. Response Envelope
Two patterns:
1. Direct entity / list schema (success)
2. Error object (failure)

Optionally unify with discriminated union:
```json
{ "ok": true, "data": { /* entity or list */ } }
{ "ok": false, "error": { /* normalized error */ } }
```
Decision: adopt envelope for consistency (`ok` boolean) even if tool spec allows raw results.

## 8. Rate Limit Propagation
- If API returns 429: envelope: `{ "ok": false, "error": { category: 'rate_limit', retryAfterMs: X } }`.
- If request accepted but nearing limit (optional future): attach `_rateLimit` extension metadata in success envelope.

## 9. Size & Safety Limits
- Reject description fields > 100k chars at tool input layer (prevent runaway token usage in AI contexts).
- Cap returned list length to requested `limit` (never exceed 200) even if API misbehaves.

## 10. Idempotency Notes
- Create operations not retried automatically in MCP adapter; rely on upstream caller to reissue.
- Update operations: adapter may include `etag` support later for concurrency (phase 2).

## 11. Logging & Traceability
- Each tool call logs: `[MCP] <toolName> (success|failure) <durationMs>` in verbose mode.
- Correlation ID (uuid v4) generated per call; included in error envelope `_traceId` for debugging.

## 12. Tool Registration API
```ts
interface McpToolDescriptor {
  name: string;
  description: string;
  inputSchema: object; // JSON Schema
  outputSchema?: object; // Optional; may rely on envelope doc
}
```
`registerTools(descriptors: McpToolDescriptor[])` invoked during extension activation if `taiga.mcp.enable`.

## 13. Implementation Order
1. Infrastructure: schema validator cache.
2. Core list tools: `list_projects`, `set_active_project`, `list_user_stories`.
3. CRUD for user stories.
4. Add tasks, epics, issues.
5. Search tools.
6. Metadata tools (statuses, members).
7. Add optional rate limit metadata decoration.

## 14. Testing Strategy
- Unit test each schema validation (valid/invalid cases).
- Mock service layer for tool adapter tests (simulate success/error categories).
- Contract test: ensure envelope shape consistent and JSON serializable.

## 15. Security Considerations
- No secret values returned.
- Input validation rejects unexpected properties (schema `additionalProperties=false`).
- Truncate large text fields in error messages.

## 16. Failure Scenarios Examples
| Scenario | Response |
|----------|----------|
| No active project for `create_task` | `{ ok: false, error: { category:'validation', message:'Active project not set' } }` |
| Invalid status ID on update | `{ ok:false, error:{ category:'validation', message:'Invalid statusId' } }` |
| Network outage | `{ ok:false, error:{ category:'network', message:'Network unreachable' } }` |
| Rate limited | `{ ok:false, error:{ category:'rate_limit', message:'Rate limited', retryAfterMs:1200 } }` |

## 17. Example Envelope (Success)
```json
{
  "ok": true,
  "data": {
    "id": 42,
    "projectId": 3,
    "subject": "Implement caching",
    "statusId": 7,
    "createdDate": "2025-09-23T12:00:00Z",
    "modifiedDate": "2025-09-23T12:10:00Z"
  }
}
```

## 18. Example Envelope (Error)
```json
{
  "ok": false,
  "error": {
    "category": "validation",
    "message": "subject: Required",
    "httpStatus": 400,
    "details": { "subject": "Required" },
    "_traceId": "b2f0c3b4-2d8d-4d1e-9f2a-5d9f1d2b6c55"
  }
}
```

## 19. Future Enhancements
- Batch tools: `batch_update_user_stories`.
- Streaming tool variant for large lists (chunked responses).
- Tool to generate smart summaries of stories (AI augmentation) referencing existing data.

---
**End of MCP Server Interface Document**
