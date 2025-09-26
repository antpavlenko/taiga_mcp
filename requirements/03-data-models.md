# Data Models & Schemas

This document defines canonical in-extension TypeScript interfaces and JSON Schemas (conceptual) for entities, metadata, filtering, pagination, and error handling. These models unify UI, caching, and MCP server I/O.

> Note: Real Taiga API fields can be richer; we include core + extensibility hooks. Unknown extra fields from the API should be preserved in a generic `raw?: Record<string, any>` when needed for forward compatibility.

## 1. Common Foundations

### 1.1 Identifier & Timestamp Types
```ts
export type ID = number; // Taiga uses numeric IDs
export type ISODate = string; // ISO 8601
```

### 1.2 BaseEntity
```ts
export interface BaseEntity {
  id: ID;
  ref?: number;             // Human-friendly reference number if provided (e.g., user story ref)
  createdDate: ISODate;
  modifiedDate: ISODate;
  createdBy: UserRef;
  modifiedBy?: UserRef;
  version?: number;         // Local optimistic concurrency token (incremented on edit)
  etag?: string;            // HTTP entity tag for conditional requests
  slug?: string;            // Where applicable (projects, epics)
}
```

### 1.3 UserRef
```ts
export interface UserRef {
  id: ID;
  username: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}
```

### 1.4 Tag & Enum Types
```ts
export type Tag = string;
export type Priority = 'lowest' | 'low' | 'normal' | 'high' | 'highest';
export type Severity = 'trivial' | 'minor' | 'normal' | 'major' | 'critical' | 'blocker';
export type StatusCategory = 'new' | 'in_progress' | 'blocked' | 'done' | 'closed' | 'other';
```

### 1.5 Status
```ts
export interface Status {
  id: ID;
  name: string;
  order: number;
  isClosed: boolean;
  category?: StatusCategory;
  color?: string; // Hex or theme name
}
```

### 1.6 Pagination
```ts
export interface PageMeta {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
}

export interface PagedResult<T> {
  meta: PageMeta;
  items: T[];
}
```

### 1.7 Filtering Primitives
```ts
export interface TextFilter { query?: string; }
export interface TagFilter { tags?: Tag[]; match?: 'any' | 'all'; }
export interface StatusFilter { statusIds?: ID[]; }
export interface AssigneeFilter { assigneeIds?: ID[]; unassigned?: boolean; }
export interface DateRange { from?: ISODate; to?: ISODate; }

export interface CommonFilters extends TextFilter, TagFilter, StatusFilter, AssigneeFilter {
  modifiedSince?: ISODate;
}
```

### 1.8 NormalizedError (Canonical)
```ts
export interface NormalizedError {
  category: 'auth' | 'not_found' | 'validation' | 'rate_limit' | 'network' | 'server' | 'unknown';
  httpStatus?: number;
  taigaCode?: string;
  message: string;
  retryAfterMs?: number;
  details?: any;
}
```

## 2. Project
```ts
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  isPrivate: boolean;
  owner: UserRef;
  members: UserRef[]; // Optional truncated list for performance
  defaultPriority?: Priority;
  defaultSeverity?: Severity;
  tags?: Tag[]; // Tag cloud reference
  color?: string;
  raw?: Record<string, any>; // Extra fields from Taiga
}
```

### 2.1 ProjectSummary
A lightweight shape for lists.
```ts
export interface ProjectSummary { id: ID; name: string; slug?: string; }
```

## 3. Epic
```ts
export interface Epic extends BaseEntity {
  projectId: ID;
  title: string;
  description?: string; // Markdown
  statusId?: ID;
  status?: Status; // Optionally hydrated
  assignedTo?: UserRef;
  tags?: Tag[];
  color?: string;
  userStoryIds?: ID[]; // Linked user stories
  progress?: ProgressMetrics;
  raw?: Record<string, any>;
}
```

## 4. User Story
```ts
export interface UserStory extends BaseEntity {
  projectId: ID;
  epicId?: ID;
  subject: string;
  description?: string; // Markdown
  statusId: ID;
  status?: Status;
  assignedTo?: UserRef;
  tags?: Tag[];
  points?: StoryPoints; // Per role or aggregate
  tasks?: ID[]; // Task IDs
  isBlocked?: boolean;
  blockedReason?: string;
  priority?: Priority;
  raw?: Record<string, any>;
}
```

## 4.1 Sprint (Milestone)
```ts
export interface Sprint extends BaseEntity {
  projectId: ID;
  name: string;
  description?: string;
  startDate?: ISODate;
  endDate?: ISODate;
  closed?: boolean;
  raw?: Record<string, any>;
}
```

### 4.1 StoryPoints
```ts
export interface StoryPoints {
  total?: number; // Calculated
  byRole?: Record<string, number>; // Role -> points
}
```

## 5. Task
```ts
export interface Task extends BaseEntity {
  projectId: ID;
  userStoryId: ID;
  subject: string;
  description?: string; // Markdown
  statusId: ID;
  status?: Status;
  assignedTo?: UserRef;
  tags?: Tag[];
  isBlocked?: boolean;
  blockedReason?: string;
  remainingTimeHours?: number; // If supported / estimated
  priority?: Priority;
  raw?: Record<string, any>;
}
```

## 6. Issue
```ts
export interface Issue extends BaseEntity {
  projectId: ID;
  subject: string;
  description?: string;
  statusId: ID;
  status?: Status;
  assignedTo?: UserRef;
  tags?: Tag[];
  severity?: Severity;
  priority?: Priority;
  isBlocked?: boolean;
  blockedReason?: string;
  raw?: Record<string, any>;
}
```

## 7. Progress & Metrics
```ts
export interface ProgressMetrics {
  total?: number; // total child items (e.g., stories in epic)
  completed?: number;
  percent?: number; // derived
}
```

## 8. Create / Update Payloads
Use narrow payload interfaces to avoid accidentally sending read-only fields.

```ts
export interface CreateEpicInput {
  projectId: ID;
  title: string;
  description?: string;
  assignedToId?: ID;
  tags?: Tag[];
  color?: string;
}

export interface UpdateEpicInput {
  title?: string;
  description?: string;
  assignedToId?: ID | null;
  statusId?: ID;
  tags?: Tag[];
  color?: string | null;
}
```
(Repeat analogous patterns for UserStory, Task, Issue.)

### 8.0 Create/Update Sprint Inputs
```ts
export interface CreateSprintInput {
  projectId: ID;
  name: string;
  description?: string;
  startDate?: ISODate;
  endDate?: ISODate;
}

export interface UpdateSprintInput {
  name?: string;
  description?: string | null;
  startDate?: ISODate | null;
  endDate?: ISODate | null;
}
```

### 8.1 Example: CreateUserStoryInput
```ts
export interface CreateUserStoryInput {
  projectId: ID;
  subject: string;
  description?: string;
  epicId?: ID;
  assignedToId?: ID;
  tags?: Tag[];
  priority?: Priority;
}
```

### 8.2 Example: UpdateUserStoryInput
```ts
export interface UpdateUserStoryInput {
  subject?: string;
  description?: string;
  epicId?: ID | null;
  assignedToId?: ID | null;
  statusId?: ID;
  tags?: Tag[];
  priority?: Priority;
  blocked?: { isBlocked: boolean; reason?: string };
}
```

## 9. Filter Interfaces by Entity
```ts
export interface EpicFilters extends CommonFilters { projectId: ID; }
export interface UserStoryFilters extends CommonFilters { projectId: ID; epicId?: ID; statusCategory?: StatusCategory; }
export interface TaskFilters extends CommonFilters { projectId: ID; userStoryId?: ID; }
export interface IssueFilters extends CommonFilters { projectId: ID; severity?: Severity[]; }
```

### 9.1 View Filter State
```ts
export interface ViewFiltersState {
  epicIds: ID[];        // multi-select
  sprintId?: ID;        // single-select (undefined implies Backlog)
  showClosedIssues: boolean;
}
```

## 10. MCP Tool I/O Schemas (Conceptual)
Each tool will have a JSON Schema paralleling these interfaces. Example (Create User Story):

```json
{
  "$id": "taiga.create_user_story.input.schema.json",
  "type": "object",
  "required": ["projectId", "subject"],
  "properties": {
    "projectId": { "type": "number" },
    "subject": { "type": "string", "minLength": 1 },
    "description": { "type": "string" },
    "epicId": { "type": ["number", "null"] },
    "assignedToId": { "type": ["number", "null"] },
    "tags": { "type": "array", "items": { "type": "string" }, "maxItems": 32 },
    "priority": { "enum": ["lowest","low","normal","high","highest"] }
  },
  "additionalProperties": false
}
```

Output schema example (User Story):
```json
{
  "$id": "taiga.user_story.schema.json",
  "type": "object",
  "required": ["id", "projectId", "subject", "statusId"],
  "properties": {
    "id": { "type": "number" },
    "projectId": { "type": "number" },
    "epicId": { "type": ["number", "null"] },
    "subject": { "type": "string" },
    "description": { "type": ["string", "null"] },
    "statusId": { "type": "number" },
    "assignedTo": { "type": ["object", "null"] },
    "tags": { "type": "array", "items": { "type": "string" } },
    "priority": { "enum": ["lowest","low","normal","high","highest"], "nullable": true },
    "createdDate": { "type": "string", "format": "date-time" },
    "modifiedDate": { "type": "string", "format": "date-time" }
  },
  "additionalProperties": true
}
```

## 11. Error Schema (MCP)
```json
{
  "$id": "taiga.error.schema.json",
  "type": "object",
  "required": ["category", "message"],
  "properties": {
    "category": { "enum": ["auth","not_found","validation","rate_limit","network","server","unknown"] },
    "message": { "type": "string" },
    "httpStatus": { "type": "number" },
    "retryAfterMs": { "type": "number" },
    "details": {}
  },
  "additionalProperties": false
}
```

## 12. Caching Metadata Wrapper
```ts
export interface CachedEntity<T extends BaseEntity> {
  entity: T;
  fetchedAt: number; // epoch ms
  etag?: string;
  staleAfter: number; // epoch ms threshold
}
```

## 13. Validation Strategy
- Use `zod` or `ajv` at runtime for MCP tool input.
- Internal service layer may trust shapes after initial validation.
- Length limits: subject/title <= 200 chars, tag <= 40 chars, tags array <= 32.

## 14. Optimistic Concurrency
- Store `etag` & send `If-Match` on update if available.
- Fallback: if 409/412, refetch then present diff to user.

## 15. Extensibility
- Add `customFields?: Record<string, any>` placeholder if future custom fields needed.

```ts
export interface CustomFieldValue { fieldKey: string; value: any; }
```

## 16. Derived / Computed Fields
- `percent` in `ProgressMetrics` computed when both `total` and `completed` available.
- `StoryPoints.total` computed from sum of `byRole` values.

## 17. Minimal Transport Shapes
For large lists, services may use stripped versions:
```ts
export interface LiteUserStory { id: ID; subject: string; statusId: ID; epicId?: ID; assignedToId?: ID; modifiedDate: ISODate; }
```

## 18. Mapping Strategy
- API raw → `Mapper` functions convert to internal canonical objects (normalizing date fields, renaming snake_case to camelCase).
- Mappers centralized: `mappers/{entity}Mapper.ts`.

## 19. Example Mapper Signature
```ts
export function mapUserStory(api: any): UserStory { /* ... */ }
```

## 20. JSON Serialization Policy
- Do not serialize caches to disk except optional debug snapshot.
- MCP always returns canonical objects matching schemas.

---
**End of Data Models Document**
