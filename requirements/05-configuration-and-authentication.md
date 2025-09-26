# Configuration & Authentication

Defines extension settings, secret storage usage, validation logic, auth flows, and future OAuth extensibility.

## 1. Settings Namespace
All settings under `taiga.` prefix in `contributes.configuration`.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `taiga.baseUrl` | string | "" | Base URL of the Taiga server. If no `/api` segment present, the extension auto-appends `/api/v1`. |
| `taiga.rememberProject` | boolean | true | Persist selected project between sessions. |
| `taiga.autoRefreshIntervalSeconds` | number | 0 | Interval for automatic conditional refresh (0 disables). Min enforced: 30. |
| `taiga.maxPageSize` | number | 50 | Page size cap for list queries (10–200). |
| `taiga.enableVerboseLogging` | boolean | false | Enables extra diagnostic logging (redacted). |
| `taiga.mcp.enable` | boolean | true | Enables MCP server exposure. |
| `taiga.preview.enableDiffBeforeSave` | boolean | true | Show diff preview before persisting edits. |
| `taiga.ui.groupUserStoriesBy` | string | "status" | Either `status` or `epic`. |
| `taiga.security.blockLargeDescriptions` | boolean | false | Prevent saving descriptions >50k chars. |

## 2. Secret Storage
- Stored via VS Code `ExtensionContext.secrets`.
- Key namespace: derived from `baseUrl`, e.g., `taiga:${baseHost}:token`.
- Retrieval always occurs through `AuthManager.getToken()`; never expose raw secret to logs.

## 3. Authentication Flow (Connect)
1. User sets `taiga.baseUrl`.
2. User clicks `Connect` or runs `Taiga: Connect`.
3. Extension prompts for Username and Password (QuickInput), exchanges for `auth_token` via `POST /auth`.
4. Token stored in Secret Storage; validation via `GET /users/me`.
5. On success, prompt user to select a project; selection is persisted if `rememberProject` is true.

Notes:
- Passwords are never stored. Only the token persists.
- If server returns a refresh token, future versions may implement refresh logic.

## 4. AuthManager Responsibilities
```ts
interface AuthManager {
  getToken(): Promise<string | undefined>;
  loginWithCredentials(baseUrl: string): Promise<void>; // prompts user, stores token
  setToken(token: string): Promise<void>; // dev/backdoor path
  invalidateToken(): Promise<void>;
}
```

## 5. Validation & Health Check
- On activation: if `baseUrl` set and a token exists, validate via `/users/me`.
- Diagnostics command shows baseUrl, active project, and counts.
- If not connected, views display an info node with `Connect` command.

## 6. Error Cases
- Invalid credentials: show warning with retry option.
- Network errors: show info with retry; backoff on repeated failures.
- Rate limiting: respect server headers; show countdown to retry for write operations.

## 7. Secret Rotation
- User can re-login or update token; old token overwritten.
- After rotation, caches flushed and trees refresh automatically.

## 8. Security Hardening
- Enforce HTTPS by default: warn if baseUrl starts with http:// (allow proceed with explicit confirmation for self-hosted LAN).
- Strip trailing slashes and auto-append `/api/v1` when appropriate.
- Disallow embedding credentials in URL.

## 9. MCP Integration
- MCP server reads active connection; tools error with `auth` if not connected.

## 10. Future OAuth Placeholder
- Add OAuth device code / PKCE flow; store access+refresh tokens under secrets.
- Proactive refresh when nearing expiry.

---
**End of Configuration & Authentication Document**
