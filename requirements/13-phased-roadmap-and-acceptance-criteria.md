# Phased Roadmap & Acceptance Criteria

Defines milestone-based delivery plan with goals, scope boundaries, success metrics, and non-functional requirements (NFRs).

## 1. Milestone Overview
| Milestone | Version Tag | Focus |
|-----------|-------------|-------|
| M1 | 0.1.0 | Core scaffolding, Connect flow (username/password), project selection, list projects/stories/issues (read-only) |
| M2 | 0.2.0 | Sprints (milestones) view + filters; Epics view; basic create (epic, story, issue, sprint) |
| M3 | 0.3.0 | CRUD for User Stories & Tasks; filters (epic multi-select, sprint single-select); MCP minimal tools |
| M4 | 0.4.0 | Editors (webviews) for Epic/Sprint/Story/Task/Issue with delete; robust error handling, rate limiting, telemetry opt-in |
| M5 | 1.0.0 | Performance polish, offline mode, documentation completeness, MCP full parity |

## 2. Milestone Details
### 2.1 M1 (0.1.0)
Scope:
- Single server baseUrl config (auto-append /api/v1) & Connect flow (username/password → token stored).
- List projects & select active project.
- List user stories (flat) and issues (flat) for active project (read-only).
- Core API client (GET only) + error translation skeleton.
- Logging channel & diagnostics stub.
Out of Scope: CRUD operations, tasks, caching beyond simple in-memory.
Acceptance Criteria:
- Connect flow succeeds; token validated via /users/me; token stored securely.
- After connect, user can select a project from list.
- Command `Taiga: Select Project` lists projects.
- User stories appear within 2s (network permitting) for medium-sized project (<500 stories) with pagination.
- Issues list shows non-closed issues by default.
Success Metrics:
- <3 critical bugs in initial test.

### 2.2 M2 (0.2.0)
Scope:
- Sprints (milestones) view with single-select; Backlog synthetic entry.
- Epics view with color indicators and multi-select filter.
- Basic create flows: epic, sprint, user story, issue.
- Caching layer with soft TTL; retry & basic rate limiting.
- MCP: `list_projects`, `set_active_project`, `list_user_stories`, `list_issues`.
Acceptance Criteria:
- CRUD commands update UI without full refresh.
- Cache hit ratio >60% in manual test scenario (navigating same lists repeatedly).
- Retries perform ≤2 attempts on transient errors.
Success Metrics:
- No data corruption (validated via random sampling after operations).

### 2.3 M3 (0.3.0)
Scope:
- CRUD for User Stories & Tasks; grouping by status or epic.
- Filters (status, assignee, tags); epics multi-select and sprint single-select wired to stories list.
- MCP: Add CRUD for stories/tasks; extend tools for filters.
Acceptance Criteria:
- Changing grouping updates tree within 500ms.
- Filtered list reflects tags + statuses accurately with pagination.
- MCP envelope responses validated for all new tools.
Success Metrics:
- <5% MCP tool calls failing due to schema mismatch during test suite.

### 2.4 M4 (0.4.0)
Scope:
- Editors (webview) for Epic/Sprint/User Story/Task/Issue (create/edit/delete).
- Enhanced error handling & offline mode toggle.
- Rate limit backoff & countdown.
- Telemetry opt-in (minimal events).
- Diff preview before save (configurable).
Acceptance Criteria:
- Editing description in webview updates entity & tree label (if subject changed) within 1s.
- Offline mode triggered by network loss and surfaces banner; read-only enforced.
- Telemetry disabled by default; enabling generates `activate` event.
Success Metrics:
- 95% success rate for update operations under simulated latency (200ms) with no UI lockups.

### 2.5 M5 (1.0.0)
Scope:
- Performance optimization (parallel metadata prefetch, selective refresh).
- Finalize MCP parity (search tools, metadata tools).
- Comprehensive documentation & README.
- Export cache snapshot & diagnostics completeness.
- Security hardening (HTTPS warnings, redaction tests).
Acceptance Criteria:
- Initial project load p95 < 1500ms test environment.
- Story list expansion p95 < 800ms (cached), <1200ms (fresh).
- All MCP tools documented & schema tests passing.
Success Metrics:
- Zero open P1 defects.
- >80% coverage on critical paths.

## 3. Cross-Milestone Non-Functional Requirements
| NFR | Target |
|-----|--------|
| Security | No secrets in logs; tokens only in SecretStorage |
| Performance | See milestone-specific KPIs |
| Reliability | Graceful degradation on network errors |
| Usability | Commands discoverable via `Taiga:` prefix |
| Accessibility | Webview components keyboard navigable |
| Observability | Diagnostics command provides actionable info |

## 4. Risk Register (High-Level)
| Risk | Impact | Mitigation |
|------|--------|------------|
| Taiga API changes | Medium | Abstract via mappers, version check |
| Large projects (scaling) | High | Pagination + lazy loading + partial caches |
| Rate limiting unpredictability | Medium | Central limiter + exponential backoff |
| User misconfiguration (bad URL) | Low | Early validation + health probe |
| Webview performance | Medium | Lightweight UI libs + on-demand render |

## 5. Release Readiness Checklist (Pre-1.0)
- All schemas versioned & locked.
- README includes MCP tool reference table.
- CHANGELOG documents user-impacting changes.
- Security review: scanning dependencies, redaction tests pass.
- Manual exploratory test log recorded.

## 6. Rollback Plan
- Maintain previous packaged VSIX artifacts in releases.
- If critical regression reported: revert tag & republish previous stable version.

## 7. Versioning Strategy
- Pre-1.0 minor bumps (0.x) introduce features, patch for fixes.
- 1.0.0 when CRUD parity + MCP completeness + performance thresholds met.
- Semantic versioning after 1.0 (MCP schema additive changes → minor, breaking → major with migration notes).

## 8. Definition of Done (Global)
A milestone considered complete when:
- All scoped features implemented & tests passing.
- Acceptance criteria verified via automated + manual checks.
- Documentation updated (README, requirements docs adjusted if drift).
- No open P1/P2 defects labeled against milestone.

## 9. Post-1.0 Potential Enhancements
- OAuth auth type implementation.
- Bulk operations (multi-select).
- AI-assisted story creation templates.
- Attachment uploads & comment thread display.
- Workspace code annotation scanning & linking.

---
**End of Phased Roadmap & Acceptance Criteria**
