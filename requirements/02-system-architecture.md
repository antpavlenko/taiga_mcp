# System Architecture

## 1. Layered Overview (Outer → Inner)
1. UI Layer (VS Code contributions)
2. Interaction Services (domain orchestrators)
3. Domain Models (entity interfaces & validation)
4. Infrastructure (API client, auth, cache, logger)
5. MCP Adapter Layer (tool exposure)
6. Core Utilities (HTTP, rate limiting, retry, schema validators)
7. Persistence (globalState/memento, in-memory caches, optional debug snapshot)

## 2. Activation Sequence
1. Read configuration (instances, active instance)
2. Init logger & secret storage adapter
3. Resolve active instance credentials (prompt if needed)
4. Instantiate `TaigaApiClient`
5. Warm (async) fetch of projects list (show progress)
6. Register tree providers (projects + entity trees)
7. Register commands & MCP server (if enabled)
8. Update status bar (instance / project / sync)
9. Start optional refresh scheduler

## 3. Core Components
### 3.1 ConfigurationManager
- Wraps VS Code settings & emits on change
- Validates shape of `taiga.instances`

### 3.2 AuthManager
- Retrieves token from SecretStorage
- Prompts for token or credentials
- Future: opaque refresh flow hook

### 3.3 TaigaApiClient
- Adds auth header per request
- Methods map to endpoints (REST wrappers)
- Handles pagination & query assembly
- Normalizes errors → `NormalizedError`

### 3.4 RateLimiter
- Queue + concurrency limit (default 4)
- Backoff on 429 with `Retry-After`

### 3.5 CacheLayer
- Per-entity caches keyed by ID
- Stores metadata: etag, updatedAt, lastFetched
- Stale-while-revalidate pattern

### 3.6 Services (Project/Epic/UserStory/Task/Issue)
- CRUD orchestration
- Input validation & transformation
- Cache coordination and selective invalidation

### 3.7 Tree Providers
- `ProjectTreeProvider`
- `EpicTreeProvider`
- `UserStoryTreeProvider` (optional grouping by status/epic)
- `TaskTreeProvider` (children of user story)
- `IssueTreeProvider` (flat or grouped by severity)

### 3.8 Entity Editors
- QuickInput forms for simple create/edit
- Webview panel for rich description, tags, status transitions

### 3.9 DetailWebviewManager
- Renders HTML/React bundle
- Message passing (request save / show diff)

### 3.10 MCP Server
- In-process server exposing tool descriptors
- Delegates to services
- Validates JSON schema I/O

### 3.11 EventBus
- Topics: `entity:updated`, `entity:deleted`, `project:changed`, `config:changed`
- Tree providers subscribe for granular refresh

## 4. Data Flow Examples
### 4.1 List Epics
Tree expand → Service list (cache hit?) → API if stale → cache update → nodes returned.

### 4.2 Update User Story
Command → form → Service.update → API PATCH → cache mutate → emit event → tree refresh node.

### 4.3 MCP Create Task
Tool input → schema validate → Service.create → API POST → return canonical task JSON.

## 5. Error Normalization
```
interface NormalizedError {
  category: 'auth' | 'not_found' | 'validation' | 'rate_limit' | 'network' | 'server' | 'unknown';
  httpStatus?: number;
  taigaCode?: string;
  message: string;
  retryAfterMs?: number;
  details?: any;
}
```
Central translator maps HTTP & Taiga error payloads.

## 6. MCP Integration
- Tools named `taiga.*`
- Project context implicit; separate `taiga.set_active_project`
- Errors surfaced with categories + optional retryAfter

## 7. Security Considerations
- Secrets only in SecretStorage + memory
- Logger redaction middleware
- Webview CSP (no inline scripts; use nonce)
- Input size limits for description fields

## 8. Config Change Handling
- On instance list change: validate active instance; prompt if missing
- On active instance change: flush caches & re-init client

## 9. Scheduling & Refresh
- Interval (>=30s) executes lightweight conditional GET (etag) for top-level lists
- On change detection: targeted entity list refresh

## 10. Build & Packaging
- TypeScript + esbuild bundling
- Entries: `src/extension.ts`, `src/mcp/server.ts`, `src/webview/index.tsx`
- Output: `dist/` (single JS bundles)

## 11. Diagnostics
- Command `taiga.showDiagnostics` prints: versions, cache counts, last sync timestamps, active filters

## 12. Fallback / Degraded Mode
- If activation fetch fails: mark mode read-only, banner notification
- CRUD commands disabled (context key)

## 13. Performance Measures
- Parallel metadata prefetch (statuses, priorities)
- Lazy load detail data when expanding or opening entity

## 14. Extensibility Points
- `EntityService` interface for new artifact types
- Pluggable grouping strategies (user stories)
- FilterBuilder reused across entities

## 15. Testing Hooks
- `TaigaApiClient` injectable `fetchFn`
- EventBus inspection in test mode
- Schema validator exported for MCP contract tests

## 16. Sequence Diagram (Textual Approx.)
List Epics:
User → VS Code Command → EpicService.list → Cache? → TaigaApiClient.GET → Normalize → Cache store → Return → Tree render

Update Issue:
User → Webview Save → IssueService.update → TaigaApiClient.PATCH → Cache update → Emit event → Tree refresh node

MCP Create Task:
Tool Call → MCP Adapter → Validate Input → TaskService.create → TaigaApiClient.POST → Normalize → Return JSON

## 17. Non-Functional Requirements
- Reliability: graceful degradation, limited retries
- Security: no plaintext secret persistence, redaction, CSP
- Performance: targeted refresh, caching, minimized re-render
- Observability: structured logs, diagnostics command

## 18. Out-of-Scope (Architecture Phase)
- Real-time WebSocket streaming
- Advanced analytics dashboards
- Attachment binary upload pipeline
