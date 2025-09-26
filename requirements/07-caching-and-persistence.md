# Caching & Persistence Strategy

Defines how entity data, metadata, and user preferences are cached in-memory and persisted across sessions, including invalidation triggers.

## 1. Goals
- Reduce redundant network calls.
- Provide fast navigation & offline read fallback.
- Maintain consistency with minimal full refreshes.
- Avoid stale dangerous updates (optimistic concurrency via ETag).

## 2. Cache Layers
| Layer | Scope | Medium | TTL | Contents |
|-------|-------|--------|-----|----------|
| Entity Cache | Per instance + project | In-memory Map | 2–5 min soft | Epics, Stories, Tasks, Issues objects |
| Metadata Cache | Per instance | In-memory | 30 min | Status lists, priorities, severities, project members |
| Preferences | Workspace/global state | VS Code memento | Until changed | Grouping mode, last filters, last project |
| Draft Edits | Workspace state | Memento | 24h | Unsubmitted description edits |

## 3. Data Structures
```ts
interface EntityCache<T extends BaseEntity> {
  byId: Map<number, CachedEntity<T>>;
  index: number[]; // for list ordering (filtered)
  lastFullFetch?: number; // epoch ms
}
```

Separate caches per entity type: `epicCache`, `userStoryCache`, `taskCache`, `issueCache` keyed by project (and user story for tasks optionally).

## 4. CachedEntity
(Defined previously) includes `fetchedAt`, `etag`, `staleAfter`.

TTL rules:
- Soft TTL: after stale threshold, background refresh triggered; stale data still served.
- Hard TTL: (e.g., 30 min) after which data must be refetched before serving (unless offline mode).

## 5. Invalidation Triggers
| Action | Invalidate |
|--------|------------|
| Create Story | Insert into story cache + epic progress recompute (if epicId set) |
| Update Story | Replace entry; if status changed, adjust any grouping indexes |
| Delete Story | Remove entry; remove from epic progress metrics |
| Update Epic | Replace entry; no full list reload unless order key changed |
| Change Active Project | Flush all entity caches (project-specific) |
| Token Rotation | Flush all caches (safety) |

## 6. Background Refresh (Stale-While-Revalidate)
- When entity list requested and `lastFullFetch` older than soft TTL, return cached list immediately but schedule async refresh.
- On refresh completion, if data changed (hash / length / etag diff), emit update event for view to re-render unobtrusively.

## 7. Hashing Strategy
- Maintain simple hash: JSON.stringify of sorted IDs + last modified timestamps (capped length) for O(1) change detection.

## 8. Offline Mode
- If network error on refresh: mark cache snapshot with `offlineSince` timestamp.
- UI shows offline banner; caches served read-only.
- Periodic ping (metadata endpoint) attempts to clear offline state.

## 9. Draft Persistence
```ts
interface DraftEdit { entityType: string; id: number; field: string; value: string; updatedAt: number; }
```
- Stored in workspaceState under key `taiga:drafts`.
- Reap drafts older than 24h on activation.

## 10. Filter Persistence
- Filters by entity stored per project: `taiga:filters:<projectId>:<entityType>`.
- Structure: serialized filter object (JSON) with version number for migrations.

## 11. Cache API (Service Layer)
```ts
interface EntityCacheApi<T extends BaseEntity> {
  get(id: number): T | undefined;
  set(entity: T, etag?: string): void;
  remove(id: number): void;
  list(): T[]; // returns in index order
  overwriteAll(entities: T[], etagMap?: Record<number,string>): void;
  markStale(): void;
}
```

## 12. ETag Handling
- Store per entity on fetch detail or list if available.
- On 304 for detail: update `fetchedAt` only.
- If PATCH returns new ETag, replace.

## 13. Concurrency Guard
- Prevent multiple simultaneous full refreshes for same entity type & project using a keyed promise registry.

## 14. Memory Management
- Cap task cache per story (e.g., only keep last 500 tasks globally). Use LRU eviction if threshold exceeded.
- Provide diagnostics metrics: entity counts + memory estimate (rough).

## 15. Metrics & Instrumentation
- Track cache hit ratio: hits / (hits + misses) per entity type.
- Expose stats via diagnostics command.

## 16. Serialization (Optional Debug Snapshot)
- Command `Taiga: Export Cache Snapshot` writes sanitized JSON (no secrets) for debugging.
- Not auto-run; user triggered only.

## 17. Error Recovery Flows
- If parsing/mapping fails for a fetched entity list, discard result and log error; do not overwrite existing cache.

## 18. Task List Partial Fetches
- Support incremental task loading per user story: store a flag `fullyLoaded`.
- If not fully loaded, append results; avoid duplicates by ID set.

## 19. Progress Metrics Computation
- Epic progress recomputed on story list changes: `completed = stories.filter(s => status.isClosed).length`.
- Cached in epic entity to avoid repeated scans.

## 20. Future Enhancements
- Persistent disk cache with versioned schema.
- WebSocket diff application (if Taiga supports push events).

---
**End of Caching & Persistence Document**
