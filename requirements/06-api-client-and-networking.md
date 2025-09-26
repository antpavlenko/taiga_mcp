# API Client & Networking Design

Defines the HTTP abstraction, endpoint coverage, error normalization, retry & rate limiting logic, pagination helpers, and self-host flexibility.

## 1. Objectives
- Provide a single, well-typed gateway (`TaigaApiClient`) for all network calls.
- Centralize concerns: authentication headers, error translation, retries, rate limiting, pagination, conditional requests (ETag), logging redaction.
- Support multiple base URLs (cloud + self-host) without leaking state between instances.

## 2. Core Abstractions
```ts
interface HttpRequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'HEAD';
  path: string;             // e.g., '/epics'
  query?: Record<string, any>; // serialized to ?key=value
  body?: any;               // JSON-serializable
  headers?: Record<string, string>;
  etag?: string;            // For conditional GET / update
  timeoutMs?: number;       // Default 15_000
  sensitive?: boolean;      // If true, body omitted from verbose logs
}

interface HttpResponse<T=any> {
  status: number;
  headers: Record<string, string>;
  data: T;
  etag?: string;
}
```

### 2.1 TaigaApiClient Skeleton
```ts
class TaigaApiClient {
  constructor(private readonly cfg: { baseUrl: string; tokenProvider: () => Promise<string>; fetchFn?: typeof fetch; logger: Logger; rateLimiter: RateLimiter; }) {}

  async get<T>(path: string, query?: any, opts: Partial<HttpRequestOptions> = {}): Promise<HttpResponse<T>> { /* ... */ }
  async post<T>(path: string, body: any, opts: Partial<HttpRequestOptions> = {}): Promise<HttpResponse<T>> { /* ... */ }
  async patch<T>(path: string, body: any, opts: Partial<HttpRequestOptions> = {}): Promise<HttpResponse<T>> { /* ... */ }
  async delete<T>(path: string, opts: Partial<HttpRequestOptions> = {}): Promise<HttpResponse<T>> { /* ... */ }

  // Higher-level helpers
  async pagedList<T>(path: string, query: any, pageSize: number, mapFn?: (d:any)=>T): Promise<PagedResult<T>> { /* ... */ }
}
```

## 3. Request Pipeline Steps
1. Merge base headers (Accept: application/json, Content-Type if body present).
2. Acquire auth token (lazy via `tokenProvider`).
3. Serialize query params (omit undefined/null).
4. Apply ETag headers if provided (`If-None-Match` for GET, `If-Match` for PATCH/DELETE when concurrency enforced).
5. Rate limiter `await rateLimiter.schedule()`.
6. Execute `fetch()` with abort timeout.
7. Collect headers; parse JSON (handle empty body gracefully).
8. Translate HTTP → `NormalizedError` on non-2xx.
9. Log (redacted) under verbose mode.

## 4. Endpoint Coverage (Initial CRUD)
| Entity | List | Get | Create | Update | Delete |
|--------|------|-----|--------|--------|--------|
| Project | `GET /projects` | `GET /projects/{id}` | — | — | — |
| Epic | `GET /epics?project=<id>` | `GET /epics/{id}` | `POST /epics` | `PATCH /epics/{id}` | `DELETE /epics/{id}` |
| User Story | `GET /userstories?project=<id>` | `GET /userstories/{id}` | `POST /userstories` | `PATCH /userstories/{id}` | `DELETE /userstories/{id}` |
| Task | `GET /tasks?user_story=<id>` or `?project=...` | `GET /tasks/{id}` | `POST /tasks` | `PATCH /tasks/{id}` | `DELETE /tasks/{id}` |
| Issue | `GET /issues?project=<id>` | `GET /issues/{id}` | `POST /issues` | `PATCH /issues/{id}` | `DELETE /issues/{id}` |

> NOTE: Actual Taiga endpoints may include additional parameters or naming (e.g., snake_case). Adjust during implementation with full spec confirmation.

## 5. Query Assembly Rules
- Ignore undefined/null values.
- Arrays serialized as repeated keys: `tags=foo&tags=bar`.
- Text search param standardized as `q`.
- Pagination: `limit`, `offset`.

## 6. Pagination Helper
```ts
async function pagedList<T>(path: string, query: any, pageSize: number, mapFn?: (d:any)=>T): Promise<PagedResult<T>> {
  const q = { ...query, limit: pageSize, offset: query.offset ?? 0 };
  const resp = await this.get<any[]>(path, q);
  const items = mapFn ? resp.data.map(mapFn) : resp.data;
  const total = parseInt(resp.headers['x-total-count'] || resp.headers['x-total'] || '0', 10);
  const offset = q.offset;
  return {
    meta: { limit: pageSize, offset, total, hasNext: offset + items.length < total },
    items
  };
}
```
Fallback: If total header absent, derive `hasNext = items.length === pageSize` (optimistic).

## 7. Retry Strategy
- Applies to idempotent methods: GET, HEAD only.
- Conditions: network errors (ECONNRESET, ENOTFOUND, timeout), HTTP 502/503/504.
- Backoff: exponential (500ms * 2^attempt) + jitter, max 2 retries.
- No retries on 429 (handled via rate limiter) or 4xx except network-level resets.

## 8. Rate Limiting
### 8.1 Token Bucket (Simple)
```ts
class RateLimiter {
  constructor(private concurrency = 4) {}
  private active = 0;
  private queue: (()=>void)[] = [];
  async schedule(): Promise<void> { /* Acquire slot */ }
  done() { /* Release slot */ }
}
```
Enhancement: If any response returns 429 with `Retry-After` header, pause scheduling new requests until the delay passes.

## 9. Error Translation
```ts
function translateError(resp: Response, body: any): NormalizedError { /* Map status + taiga codes */ }
```
Mapping examples:
- 401 → auth
- 403 → auth (scope) with detail
- 404 → not_found
- 409 / 412 → validation (conflict) or specialized concurrency category folded into validation
- 422 / 400 → validation
- 429 → rate_limit (include retryAfterMs)
- 5xx → server
- Fetch exception → network

Include original snippet of server error (first 200 chars) in `details` when verbose.

## 10. Conditional Requests / ETags
- On GET: if cached entity has `etag`, send `If-None-Match`.
- 304 Not Modified → return a synthetic HttpResponse with status 304 and no data (caller uses cache).
- On PATCH/DELETE: if cache holds `etag` add `If-Match`; if 412, surface conflict error.

## 11. Self-Hosted Instance Handling
- Do not assume domain; use configured `baseUrl`.
- Health probe (optional) `HEAD /projects` to confirm reachability.
- Provide setting override for self-signed certificates (Node fetch may require `NODE_TLS_REJECT_UNAUTHORIZED=0` — NOT recommended; instead warn). *Implementation should avoid automatically disabling verification.*

## 12. Version Detection
- Attempt `GET /` or `GET /api/v1/info` (if available) to parse version.
- Store version in memory; if unsupported major, warn user once.

## 13. Logging Redaction Policy
Redact:
- Authorization header
- Set-Cookie headers
- Bodies for auth endpoints (credentials exchange)
Log line format (verbose):
```
[TaigaAPI] GET /userstories?project=21 (200 184ms) etag=W/"abc123"
```
Errors include category + truncated message.

## 14. Timeout Handling
- Default 15s per call, configurable via internal constant.
- AbortController used; on abort classify as network error with message "Request timed out".

## 15. Utility: buildUrl
```ts
function buildUrl(base: string, path: string, query?: Record<string, any>): string { /* Normalize slashes & encode */ }
```
Ensure: single slash join, encode components, arrays multi-key pattern.

## 16. High-Level Service Usage Pattern
```ts
// In UserStoryService
async function list(projectId: ID, filters: UserStoryFilters, paging: { offset: number; limit: number }): Promise<PagedResult<UserStory>> {
  const query = { project: projectId, q: filters.query, tags: filters.tags, status: filters.statusIds, offset: paging.offset, limit: paging.limit };
  const resp = await apiClient.get<any[]>('/userstories', query);
  const mapped = resp.data.map(mapUserStory);
  return { meta: deriveMeta(resp, mapped.length, paging), items: mapped };
}
```

## 17. Bulk / Parallel Fetching
- Metadata (statuses, priorities) fetched in parallel at activation: `Promise.all` with concurrency guard.
- Avoid saturating rate limiter by grouping non-critical calls sequentially if concurrency slots consumed.

## 18. Network Resilience Features
| Feature | Description |
|---------|-------------|
| Retry GET | Exponential with jitter |
| Rate pause | On 429, schedule resume after header delay |
| Circuit breaker (future) | Track consecutive failures; if threshold exceeded, backoff & show warning |

## 19. Testing Strategy (API Layer)
- Inject mock `fetchFn` returning programmable responses.
- Unit tests for: retry conditions, error translation mapping, query serialization, ETag usage, rate limiting concurrency.
- Integration test fixture: simulate 304 path to verify cache short-circuit.

## 20. MCP Considerations
- API client never exposed directly to MCP layer; only services.
- MCP operations should tag logs with prefix `[MCP]` for origin traceability.

## 21. Performance KPIs (Instrumentation Hooks)
- Capture per-endpoint latency histogram (if telemetry enabled) else internal in-memory counters accessible via diagnostics command.

## 22. Example Error Translation Pseudocode
```ts
function translate(status: number, payload: any, networkErr?: Error): NormalizedError {
  if (networkErr) return { category: 'network', message: networkErr.message };
  if (status === 401 || status === 403) return { category: 'auth', httpStatus: status, message: payload?.detail || 'Unauthorized' };
  if (status === 404) return { category: 'not_found', httpStatus: status, message: 'Resource not found' };
  if (status === 429) return { category: 'rate_limit', httpStatus: status, message: 'Rate limited', retryAfterMs: parseRetryAfter(payload) };
  if (status === 409 || status === 412 || status === 422 || status === 400) return { category: 'validation', httpStatus: status, message: extractValidationMsg(payload), details: payload };
  if (status >= 500) return { category: 'server', httpStatus: status, message: 'Server error' };
  return { category: 'unknown', httpStatus: status, message: 'Unexpected response' };
}
```

## 23. Extensibility Hooks
- Middleware array: `(req: HttpRequestOptions, next: ()=>Promise<HttpResponse>) => Promise<HttpResponse>` for future cross-cutting features (metrics, extra headers).
- Add `beforeRetry` & `afterResponse` event emitters for instrumentation.

## 24. Security Considerations
- Reject responses with `Content-Type` other than `application/json` unless empty or explicitly allowed (prevents HTML error injection interpreted wrongly).
- Limit JSON body parse size (e.g., >5MB abort) to prevent memory abuse.

## 25. Implementation Order
1. Minimal client (GET/POST + auth) → list projects
2. Add error translation + logging
3. Add PATCH/DELETE
4. Add pagination helper
5. Add retry + rate limiter
6. Add ETag conditional support
7. Add middleware & diagnostics instrumentation

---
**End of API Client & Networking Document**
