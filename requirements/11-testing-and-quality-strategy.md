# Testing & Quality Strategy

Outlines the multi-layer quality approach: unit, integration, UI (extension host), MCP contract, linting, type safety, and CI/CD workflow.

## 1. Principles
- Fast feedback: majority of tests are unit & run under 2 minutes.
- Deterministic: avoid real network; use fixtures/mocks.
- Isolation: each test resets global singletons (EventBus, caches).
- Confidence: representative integration tests cover activation & basic CRUD flows.

## 2. Tooling Choices
| Area | Tool |
|------|------|
| Unit/Service Tests | Vitest (ts-node/transpileOnly) |
| Schema Validation Tests | AJV (compiled schemas) |
| Extension Host Tests | @vscode/test-electron |
| Coverage | c8 (V8) |
| Linting | ESLint + TypeScript ESLint |
| Formatting | Prettier |
| Type Checking | tsc --noEmit |
| Commit Hooks | Husky + lint-staged (optional) |

## 3. Test Layers
### 3.1 Unit Tests
Target: utilities (query builder, error translator, pagination), mappers, rate limiter, retry logic, cache API.

### 3.2 Service Tests
- Use mock `TaigaApiClient` (spy on calls & inject responses).
- Verify caching decisions & event emission.

### 3.3 Integration (Extension) Tests
Scenarios:
1. Activation with no instances → dormant state commands.
2. Add instance + set token (mock validation) → project list loads.
3. Select project → epics & stories tree providers register & populate (using mock data provider).
4. Create user story command → service call & tree refresh.
5. Update story status → partial update & node refresh.
6. Offline mode simulation (network errors) → offline context key set.

### 3.4 MCP Contract Tests
- Spin up MCP adapter in process.
- Validate each tool with valid & invalid payload.
- Ensure envelope shape & error category mapping.

### 3.5 UI Interaction Tests (Selective)
- Use VS Code API + commands to test TreeDataProvider dynamic updates.
- Avoid heavy reliance on brittle label checks; prefer context values & item counts.

## 4. Fixtures & Mocking
- `tests/fixtures/apiResponses/*.json` for canonical entity payloads.
- Builder utilities for generating entities with overrides.
- Clock freezing for deterministic modifiedDate (Vitest `vi.useFakeTimers()`).

## 5. Coverage Targets
| Metric | Target |
|--------|--------|
| Statements | 85% |
| Branches | 75% |
| Lines | 85% |
| Functions | 85% |

Critical paths (error translation, auth flows) must reach >90% statement coverage.

## 6. Performance Regression Guard
- Add micro benchmark (optional) for rate limiter & retry pipeline (<50ms for simple GET under mock environment).

## 7. Linting & Formatting
- ESLint rules: no implicit any, prefer const, no unused vars, complexity threshold moderate (~12).
- Prettier enforced pre-commit.

## 8. Type Safety
- `strict: true`, `noUncheckedIndexedAccess: true` in tsconfig.
- Disallow `any` except in boundary adapters with explicit `// eslint-disable-next-line @typescript-eslint/no-explicit-any` justification.

## 9. Test Directory Structure
```
/tests
  /unit
    errorTranslator.test.ts
    rateLimiter.test.ts
    cacheLayer.test.ts
  /service
    userStoryService.test.ts
    epicService.test.ts
  /integration
    activation.test.ts
    crudUserStory.test.ts
  /mcp
    toolsUserStories.test.ts
  /fixtures
    userStory.json
    epic.json
```

## 10. Mock Fetch Strategy
- Provide `createMockFetch(scenarios: Scenario[])` returning function intercepting requested path.
- Scenario shape:
```ts
interface Scenario { method: string; path: RegExp; status: number; body: any; headers?: Record<string,string>; }
```
- Default fallback: 404.

## 11. Test Utilities
- `withTempConfig(instanceConfig, fn)` sets up temp config & tears down.
- `captureLogs(fn)` collects logger output for assertions.

## 12. CI Pipeline (GitHub Actions Example)
Jobs:
1. `lint` → install + run ESLint + type-check.
2. `test` → run unit + service + coverage.
3. `integration` → run extension host tests (matrix: macOS, ubuntu, windows minimal if cost allows). 
4. `package` (on main) → vsce package artifact.

Cache node modules via actions/cache keyed by lockfile hash.

## 13. Failing Test Policy
- No merging with failing tests or < target coverage.
- WIP branches permitted to skip packaging but must pass unit layer.

## 14. Flakiness Mitigation
- Retry flaky tests up to 2 times (only integration layer) using custom Vitest / wrapper script.
- Avoid fixed sleeps; poll for expected tree items with timeout (e.g., 2s).

## 15. Static Analysis Enhancements (Future)
- Add dependency vulnerability scan (npm audit / osv-scanner).
- Use TypeScript project references for faster incremental builds.

## 16. Error Snapshot Testing
- Normalize dynamic fields (timestamps, IDs) before snapshot (replace with tokens) to keep snapshots stable.

## 17. MCP Schema Drift Detection
- Generate JSON from in-code schemas; compare hash with previous commit hash file to detect accidental changes requiring version bump.

## 18. Developer Workflow Aids
NPM Scripts:
```
lint
lint:fix
build
test:unit
test:service
test:integration
coverage
watch
package
```

## 19. Definition of Done (Quality Gate)
Feature cannot be marked done unless:
- Unit tests for new logic
- Service tests for any new service
- Updated/added schema tests if altering MCP tools
- No uncovered lines in new files (threshold >90%)
- Changelog entry added (if publishing cadence established)

## 20. Release Checklist (Quality)
- All tests green
- Coverage thresholds met
- Security audit (npm audit) no critical
- Manual exploratory test (token rotation, offline, create/update/delete core entities)
- Increment version & tag

---
**End of Testing & Quality Strategy**
