# Error Handling & Telemetry Plan

Defines standardized error taxonomy, user notification strategy, logging patterns, optional telemetry (opt-in), and diagnostic tooling.

## 1. Objectives
- Consistent classification & messaging for all failures.
- Avoid noisy notifications; surface actionable guidance.
- Provide redacted structured logs for debugging.
- Telemetry is strictly optional and privacy-preserving.

## 2. Error Taxonomy
| Category | Description | Typical Sources | User Action |
|----------|-------------|-----------------|-------------|
| auth | Authentication or authorization failure | 401/403, missing token | Re-authenticate / update token |
| not_found | Resource does not exist | 404 | Validate ID or refresh |
| validation | Invalid input or conflict | 400/409/412/422 | Correct input; possibly refetch |
| rate_limit | Throttled by server | 429 | Wait and retry |
| network | Connectivity or DNS issues | Fetch errors, timeouts | Check network, retry |
| server | 5xx server-side errors | 500–599 | Retry later |
| unknown | Anything uncategorized | Unexpected payloads | Report issue |

## 3. Error Object (Canonical)
Already defined as `NormalizedError`.

## 4. Translation Layers
1. **HTTP Layer**: Maps status + payload to `NormalizedError`.
2. **Service Layer**: Enhances with context (entity type, operation) when adding logs.
3. **UI Adapter**: Chooses notification severity & copy text.

## 5. User Notification Rules
| Category | VS Code Message Type | Title Prefix | Additional Action |
|----------|----------------------|--------------|------------------|
| auth | warning | Auth Required | "Update Token" button |
| not_found | info | Not Found | "Refresh" button |
| validation | error | Validation Error | "Show Details" |
| rate_limit | info | Rate Limited | Countdown auto-dismiss |
| network | warning | Network Error | "Retry" |
| server | error | Server Error | "Retry" |
| unknown | error | Unexpected Error | "Report" (opens issue URL) |

## 6. Notification Throttling
- Same `category+message` combination suppressed after 3 repeats within 60s; only logged.
- Rate limit countdown updates existing message rather than spawning new.

## 7. Logging Strategy
### 7.1 Channels
- Output channel: `Taiga`.
- Verbose mode includes request IDs & durations.

### 7.2 Log Line Formats
```
[INFO] 2025-09-23T12:00:00Z Project list loaded (count=12, latency=184ms)
[WARN] 2025-09-23T12:01:05Z Network error (retry=1) message="ECONNRESET"
[ERROR] 2025-09-23T12:02:10Z Update story failed category=validation id=42 details="statusId invalid"
```

### 7.3 Redaction
- Replace tokens with `***`.
- Omit large body payloads unless in debug export.

## 8. Error Propagation Contract
- UI commands catch `NormalizedError` and decide on messaging.
- MCP adapter always wraps in envelope with `ok=false`.
- Services may throw `NormalizedError` or return union `Result<T>`.

## 9. Result Type (Internal)
```ts
export type Result<T> = { ok: true; value: T } | { ok: false; error: NormalizedError };
```
Use when operations can continue gracefully; throw for truly exceptional scenarios (coding errors, invariant violations).

## 10. Diagnostics Command Content
- Active instance & project
- Cache counts & hit ratios
- Last refresh timestamps per entity
- Pending rate limiter queue size
- Recent 10 errors summary

## 11. Telemetry (Opt-In Only)
### 11.1 Setting
- `taiga.telemetry.enable` (default false) — not created unless user explicitly consents (or added commented in README guidance).

### 11.2 Events (Minimal)
| Event | Properties |
|-------|------------|
| `activate` | version, hasInstances(bool) |
| `command` | id |
| `api_call` | endpoint, status (bucketed), latencyMs (bucketed) |
| `error` | category |
| `mcp_tool` | name, ok(bool) |

### 11.3 Privacy Measures
- No PII (strip titles/subjects/IDs replaced with generic counts where possible).
- No raw URLs beyond path pattern.
- Latency bucketed (e.g., `<100ms`, `100-500ms`, `>500ms`).

### 11.4 Implementation Stub
Telemetry module with `record(eventName: string, props?: Record<string,string>)` no-op unless enabled.

## 12. Rate Limit UX
- On 429: show info message: `Taiga: Rate limited. Retry in 1.2s` (dynamic).
- Auto-dismiss after retry window; queued requests proceed automatically.

## 13. Conflict (412/409) Handling
- Service surfaces validation error with details including `conflict=true`.
- UI triggers refetch entity; if still divergent shows diff & asks user to reapply changes.

## 14. Network Retry Visibility
- On first retry attempt for GET show status bar spinner (not message). Only escalate to notification after final retry fails.

## 15. Offline Mode Signaling
- Set context key `taiga:offline=true`.
- Status bar suffix `(Offline)`.
- Disable create/update/delete commands via `when` clauses.

## 16. Structured Error Export
- Command: `Taiga: Copy Last Error JSON` copies the last normalized error array (max 20) to clipboard (redacted) for bug reports.

## 17. Internal Invariants
- Code bugs (unexpected null, unreachable states) logged with `[BUG]` prefix and stack trace (not shown as user notification unless operation impacted).

## 18. Performance Degradation Alerts (Future)
- If average API latency > threshold for 5 consecutive minutes, log warning once.

## 19. Testing Coverage
- Unit tests verify mapping for representative HTTP statuses.
- Notification throttling logic test with simulated loops.
- Telemetry no-op path vs enabled path test.

## 20. Example Normalized Error Log Serialization
```json
{
  "time": "2025-09-23T12:10:00.000Z",
  "category": "validation",
  "message": "statusId invalid",
  "httpStatus": 400,
  "operation": "update_user_story",
  "entityId": 42
}
```

---
**End of Error Handling & Telemetry Plan**
