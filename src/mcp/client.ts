export type Json = any;

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface TaigaConfig {
  baseUrl: string;
  token: string;
  projectId?: number | string;
}

export class TaigaClient {
  private base: string;
  private token: string;
  private projectId?: string;
  private fetchFn: FetchLike;
  private memberCache?: Map<string, number>; // username(lowercase) -> id
  private issueSeverityNameById?: Map<number, string>;
  private issuePriorityNameById?: Map<number, string>;
  private issueTypeNameById?: Map<number, string>;

  constructor(cfg: TaigaConfig, fetchImpl?: FetchLike) {
    this.base = (cfg.baseUrl || '').replace(/\/$/, '');
    this.token = cfg.token || '';
    this.projectId = cfg.projectId ? String(cfg.projectId) : undefined;
    this.fetchFn = fetchImpl ?? (globalThis.fetch as FetchLike);
  }

  private async request(path: string, init: RequestInit = {}): Promise<Json> {
    if (!this.base) throw new Error('TAIGA_BASE_URL is not set');
    if (!this.token) throw new Error('TAIGA_TOKEN is not set');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...(init.headers || {})
    } as Record<string, string>;
    const url = `${this.base}${path.startsWith('/') ? '' : '/'}${path}`;
    const res = await this.fetchFn(url, { ...init, headers });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`Taiga API ${res.status}: ${text}`);
    }
    try { return text ? JSON.parse(text) : undefined; } catch { return text; }
  }

  // Resolve a username to user id within the active project context (cached)
  async resolveUserId(user: string | number): Promise<number> {
    if (typeof user === 'number') return user;
    const s = String(user || '').trim();
    if (!s) throw new Error('Empty username');
    const asNum = Number(s);
    if (!Number.isNaN(asNum) && s === String(asNum)) return asNum;
    if (!this.projectId) throw new Error('TAIGA_PROJECT_ID is not set (required for resolving usernames)');
    // Warm cache from project memberships/owner -> users
    if (!this.memberCache) {
      this.memberCache = new Map<string, number>();
      try {
        // 1) memberships endpoint is the most reliable source for username/id in a project
        const memberships = await this.request(`/api/v1/memberships?project=${encodeURIComponent(this.projectId!)}`);
        if (Array.isArray(memberships)) {
          for (const m of memberships) {
            const uid = Number(m?.user);
            const u = (m?.user_extra_info || m?.user_detail || m?.user_info || {}) as any;
            const uname = String(u?.username || u?.full_name_display || '').trim().toLowerCase();
            if (!Number.isNaN(uid) && uname) this.memberCache!.set(uname, uid);
          }
        }
        // 2) also consider project owner details when present
        const proj = await this.getProject({});
        const raw: any = proj as any;
        if (raw?.owner_extra_info) {
          const uname = String(raw.owner_extra_info.username || raw.owner_extra_info.full_name_display || '').trim().toLowerCase();
          const uid = Number(raw.owner_extra_info.id || raw.owner);
          if (!Number.isNaN(uid) && uname) this.memberCache!.set(uname, uid);
        } else if (raw?.owner && typeof raw.owner === 'object') {
          const uname = String(raw.owner.username || raw.owner.full_name_display || '').trim().toLowerCase();
          const uid = Number(raw.owner.id || raw.owner.pk);
          if (!Number.isNaN(uid) && uname) this.memberCache!.set(uname, uid);
        }
      } catch {
        // ignore; we'll try direct fetch below
      }
    }
    const key = s.toLowerCase();
    const cached = this.memberCache?.get(key);
    if (cached) return cached;
    // As a last resort, try to fetch a user by querying users API or iterating IDs again
    try {
      // Attempt direct user search endpoints
      // Try exact username filter if supported
      try {
        const byUsername = await this.request(`/api/v1/users?username=${encodeURIComponent(s)}`);
        if (Array.isArray(byUsername)) {
          const match = byUsername.find((u: any) => String(u?.username || '').trim().toLowerCase() === key);
          if (match?.id) return Number(match.id);
        }
      } catch {}
      // Fallback to generic search
      try {
        const bySearch = await this.request(`/api/v1/users?search=${encodeURIComponent(s)}`);
        if (Array.isArray(bySearch)) {
          // prefer exact match on username
          const exact = bySearch.find((u: any) => String(u?.username || '').trim().toLowerCase() === key);
          if (exact?.id) return Number(exact.id);
          const first = bySearch[0];
          if (first?.id) return Number(first.id);
        }
      } catch {}
    } catch {}
    throw new Error(`Unknown username '${s}' in active project`);
  }

  // Helpers
  private qProject(basePath: string) {
    if (!this.projectId) return basePath;
    const join = basePath.includes('?') ? '&' : '?';
    return `${basePath}${join}project=${encodeURIComponent(this.projectId)}`;
  }
  private ensureProjectOnBody(body: any) {
    if (!this.projectId) throw new Error('TAIGA_PROJECT_ID is not set');
    const proj = this.projectId;
    // Force the active project; ignore any provided project in body
    return { ...(body || {}), project: proj };
  }

  // Projects
  listProjects() { return this.request('/api/v1/projects'); }
  async getProject(args: { id?: number; slug?: string }) {
    if (args.id) return this.request(`/api/v1/projects/${args.id}`);
    // Fallback: fetch all and filter client-side by slug
    if (args.slug) {
      const all = await this.listProjects();
      const match = Array.isArray(all) ? all.find((p: any) => String(p.slug) === String(args.slug)) : undefined;
      return match ?? null;
    }
    // New: if neither id nor slug provided, use active project context if available
    if (this.projectId) {
      return this.request(`/api/v1/projects/${this.projectId}`);
    }
    throw new Error('id or slug is required');
  }

  // Epics
  listEpics() { return this.request(this.qProject('/api/v1/epics')); }
  listEpicStatuses() { return this.request(this.qProject('/api/v1/epic-statuses')); }
  getEpic(id: number) { return this.request(`/api/v1/epics/${id}`); }
  createEpic(body: any) { return this.request('/api/v1/epics', { method: 'POST', body: JSON.stringify(this.ensureProjectOnBody(body)) }); }
  updateEpic(id: number, patch: any) { return this.request(`/api/v1/epics/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); }
  // Related user stories for an epic
  async listEpicRelatedUserStories(epicId: number) {
    return this.request(`/api/v1/epics/${epicId}/related_userstories`);
  }
  async linkEpicToUserStory(epicId: number, userStoryId: number) {
    const body = { epic: epicId, user_story: userStoryId } as any;
    return this.request(`/api/v1/epics/${epicId}/related_userstories`, { method: 'POST', body: JSON.stringify(body) });
  }
  async unlinkEpicFromUserStory(epicId: number, userStoryId: number) {
    return this.request(`/api/v1/epics/${epicId}/related_userstories/${userStoryId}`, { method: 'DELETE' });
  }

  // User Stories
  listUserStories() { return this.request(this.qProject('/api/v1/userstories')); }
  listUserStoryStatuses() { return this.request(this.qProject('/api/v1/userstory-statuses')); }
  getUserStory(id: number) { return this.request(`/api/v1/userstories/${id}`); }
  createUserStory(body: any) { return this.request('/api/v1/userstories', { method: 'POST', body: JSON.stringify(this.ensureProjectOnBody(body)) }); }
  updateUserStory(id: number, patch: any) { return this.request(`/api/v1/userstories/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); }

  // Tasks
  listTasks(args?: { userStoryId?: number }) {
    if (args?.userStoryId) return this.request(`/api/v1/tasks?user_story=${encodeURIComponent(String(args.userStoryId))}`);
    return this.request(this.qProject('/api/v1/tasks'));
  }
  listTaskStatuses() { return this.request(this.qProject('/api/v1/task-statuses')); }
  getTask(id: number) { return this.request(`/api/v1/tasks/${id}`); }
  createTask(body: any) { return this.request('/api/v1/tasks', { method: 'POST', body: JSON.stringify(this.ensureProjectOnBody(body)) }); }
  updateTask(id: number, patch: any) { return this.request(`/api/v1/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); }

  // Issues
  listIssues(args?: { status?: string; sprintId?: number }) {
    let path = this.qProject('/api/v1/issues');
    const qs: string[] = [];
    if (args?.status) qs.push(`status=${encodeURIComponent(args.status)}`);
    if (args?.sprintId) qs.push(`milestone=${encodeURIComponent(String(args.sprintId))}`);
    if (qs.length) path += (path.includes('?') ? '&' : '?') + qs.join('&');
    return this.request(path);
  }
  listIssueStatuses() { return this.request(this.qProject('/api/v1/issue-statuses')); }
  async listIssueSeverities() {
    try {
      const res = await this.request(this.qProject('/api/v1/issue-severities'));
      if (Array.isArray(res) && res.length) return res;
    } catch {}
    // Fallback: some Taiga versions do not support project scoping for this endpoint
    try {
      const res = await this.request('/api/v1/issue-severities');
      if (Array.isArray(res) && res.length) return res;
    } catch {}
    // Older/alternate endpoint
    return this.request('/api/v1/severities');
  }
  async listIssuePriorities() {
    try {
      const res = await this.request(this.qProject('/api/v1/issue-priorities'));
      if (Array.isArray(res) && res.length) return res;
    } catch {}
    try {
      const res = await this.request('/api/v1/issue-priorities');
      if (Array.isArray(res) && res.length) return res;
    } catch {}
    return this.request('/api/v1/priorities');
  }
  async listIssueTypes() {
    try {
      const res = await this.request(this.qProject('/api/v1/issue-types'));
      if (Array.isArray(res) && res.length) return res;
    } catch {}
    try {
      const res = await this.request('/api/v1/issue-types');
      if (Array.isArray(res) && res.length) return res;
    } catch {}
    return this.request('/api/v1/types');
  }

  // Single-item fetch helpers with fallbacks
  private async getIssueSeverity(id: number) {
    try { return await this.request(`/api/v1/issue-severities/${id}`); } catch {}
    try { return await this.request(`/api/v1/severities/${id}`); } catch {}
    return undefined;
  }
  private async getIssuePriority(id: number) {
    try { return await this.request(`/api/v1/issue-priorities/${id}`); } catch {}
    try { return await this.request(`/api/v1/priorities/${id}`); } catch {}
    return undefined;
  }
  private async getIssueType(id: number) {
    try { return await this.request(`/api/v1/issue-types/${id}`); } catch {}
    try { return await this.request(`/api/v1/types/${id}`); } catch {}
    return undefined;
  }

  // Name resolvers with caching
  async resolveIssueSeverityName(id: number): Promise<string | null> {
    const n = Number(id);
    if (Number.isNaN(n)) return null;
    if (!this.issueSeverityNameById) this.issueSeverityNameById = new Map();
    const cached = this.issueSeverityNameById.get(n);
    if (cached) return cached;
    try {
      const list = await this.listIssueSeverities();
      if (Array.isArray(list)) {
        for (const s of list) {
          const sid = Number((s as any)?.id);
          const name = (s as any)?.name;
          if (!Number.isNaN(sid) && name) this.issueSeverityNameById.set(sid, String(name));
        }
        const fromList = this.issueSeverityNameById.get(n);
        if (fromList) return fromList;
      }
    } catch {}
    const one = await this.getIssueSeverity(n).catch(() => undefined);
    const name = one?.name ?? one?.text ?? null;
    if (name) this.issueSeverityNameById.set(n, String(name));
    return name ? String(name) : null;
  }
  async resolveIssuePriorityName(id: number): Promise<string | null> {
    const n = Number(id);
    if (Number.isNaN(n)) return null;
    if (!this.issuePriorityNameById) this.issuePriorityNameById = new Map();
    const cached = this.issuePriorityNameById.get(n);
    if (cached) return cached;
    try {
      const list = await this.listIssuePriorities();
      if (Array.isArray(list)) {
        for (const p of list) {
          const pid = Number((p as any)?.id);
          const name = (p as any)?.name;
          if (!Number.isNaN(pid) && name) this.issuePriorityNameById.set(pid, String(name));
        }
        const fromList = this.issuePriorityNameById.get(n);
        if (fromList) return fromList;
      }
    } catch {}
    const one = await this.getIssuePriority(n).catch(() => undefined);
    const name = one?.name ?? one?.text ?? null;
    if (name) this.issuePriorityNameById.set(n, String(name));
    return name ? String(name) : null;
  }
  async resolveIssueTypeName(id: number): Promise<string | null> {
    const n = Number(id);
    if (Number.isNaN(n)) return null;
    if (!this.issueTypeNameById) this.issueTypeNameById = new Map();
    const cached = this.issueTypeNameById.get(n);
    if (cached) return cached;
    try {
      const list = await this.listIssueTypes();
      if (Array.isArray(list)) {
        for (const t of list) {
          const tid = Number((t as any)?.id);
          const name = (t as any)?.name;
          if (!Number.isNaN(tid) && name) this.issueTypeNameById.set(tid, String(name));
        }
        const fromList = this.issueTypeNameById.get(n);
        if (fromList) return fromList;
      }
    } catch {}
    const one = await this.getIssueType(n).catch(() => undefined);
    const name = one?.name ?? one?.text ?? null;
    if (name) this.issueTypeNameById.set(n, String(name));
    return name ? String(name) : null;
  }
  listSprints() { return this.request(this.qProject('/api/v1/milestones')); }
  getIssue(id: number) { return this.request(`/api/v1/issues/${id}`); }
  createIssue(body: any) { return this.request('/api/v1/issues', { method: 'POST', body: JSON.stringify(this.ensureProjectOnBody(body)) }); }
  updateIssue(id: number, patch: any) { return this.request(`/api/v1/issues/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }); }

  // Comments
  async listComments(resource: 'epics' | 'userstories' | 'tasks' | 'issues', id: number) {
    // Taiga exposes history endpoints for user stories, tasks, issues (not epics)
    const historyMap: Record<string, string | null> = {
      epics: null, // no documented history endpoint for epics
      userstories: 'userstory',
      tasks: 'task',
      issues: 'issue'
    };
    const kind = historyMap[resource];
    if (!kind) {
      // Best effort for epics: try an undocumented history path first; then fallback to project timeline
      // 1) Attempt /api/v1/history/epic/{id}
      try {
        const items = await this.request(`/api/v1/history/epic/${id}`);
        const list = Array.isArray(items) ? items : [];
        return list
          .filter((h: any) => (h && (h.comment || h.comment_html)))
          .map((h: any) => {
            const user = h?.user || {};
            const username = user.username || user.full_name_display || user.name || user.pk || null;
            return {
              created_date: h?.created_at || h?.date || null,
              author: username,
              text: h?.comment || ''
            };
          });
      } catch {}
      // 2) Fallback to timeline for the active project and filter entries related to this epic id
      try {
        if (!this.projectId) return [] as any[];
        const timeline = await this.request(`/api/v1/timeline/project/${this.projectId}`);
        const arr = Array.isArray(timeline) ? timeline : [];
        const out: any[] = [];
        for (const t of arr) {
          const data = t?.data || {};
          const epicObj = data?.epic;
          const key: string | undefined = t?.key;
          const matchesKey = typeof key === 'string' && key.toLowerCase().includes('epic') && key.endsWith(`:${id}`);
          const matchesEpic = epicObj && Number(epicObj.id) === Number(id);
          const text = data?.comment || t?.comment || '';
          if ((matchesKey || matchesEpic) && text) {
            const u = data?.user || {};
            const author = u.username || u.full_name_display || u.name || null;
            out.push({
              created_date: t?.created || t?.date || null,
              author,
              text
            });
          }
        }
        return out;
      } catch {}
      return [] as any[];
    }
    const items = await this.request(`/api/v1/history/${kind}/${id}`);
    // Normalize to a simple comment view
    const list = Array.isArray(items) ? items : [];
    return list
      .filter((h: any) => (h && (h.comment || h.comment_html)))
      .map((h: any) => {
        const user = h?.user || {};
        const username = user.username || user.full_name_display || user.name || user.pk || null;
        return {
          created_date: h?.created_at || h?.date || null,
          author: username,
          text: h?.comment || ''
        };
      });
  }
  async createComment(resource: 'epics' | 'userstories' | 'tasks' | 'issues', id: number, text: string) {
    // Per Taiga API, comments are created by PATCHing the entity with { comment, version }
    // Fetch current entity to obtain version
    let current: any;
    let path: string;
    switch (resource) {
      case 'epics':
        current = await this.getEpic(id);
        path = `/api/v1/epics/${id}`;
        break;
      case 'userstories':
        current = await this.getUserStory(id);
        path = `/api/v1/userstories/${id}`;
        break;
      case 'tasks':
        current = await this.getTask(id);
        path = `/api/v1/tasks/${id}`;
        break;
      case 'issues':
        current = await this.getIssue(id);
        path = `/api/v1/issues/${id}`;
        break;
      default:
        throw new Error(`Unsupported resource: ${resource}`);
    }
    if (!current) throw new Error(`${resource} ${id} not found`);
    const body = { comment: text, version: current.version } as any;
    return this.request(path, { method: 'PATCH', body: JSON.stringify(body) });
  }

  // Users
  getUser(id: number) { return this.request(`/api/v1/users/${id}`); }

  // Resolve entity id by ref within active project
  async resolveIdByRef(kind: 'epics' | 'userstories' | 'tasks' | 'issues', ref: number): Promise<number | undefined> {
    if (!this.projectId) throw new Error('TAIGA_PROJECT_ID is not set');
    const r = Number(ref);
    if (Number.isNaN(r)) return undefined;
    let list: any[] = [];
    switch (kind) {
      case 'epics': list = await this.listEpics(); break;
      case 'userstories': list = await this.listUserStories(); break;
      case 'tasks': list = await this.listTasks(); break;
      case 'issues': list = await this.listIssues(); break;
    }
    if (!Array.isArray(list)) return undefined;
    const item = list.find((x: any) => Number(x?.ref) === r);
    return item?.id ? Number(item.id) : undefined;
  }

  // Roles and Points (for mapping user story points)
  async listRoles() {
    if (!this.projectId) throw new Error('TAIGA_PROJECT_ID is not set');
    return this.request(`/api/v1/roles?project=${encodeURIComponent(this.projectId)}`);
  }
  async listPoints() {
    if (!this.projectId) throw new Error('TAIGA_PROJECT_ID is not set');
    return this.request(`/api/v1/points?project=${encodeURIComponent(this.projectId)}`);
  }
}

export function createClientFromEnv(fetchImpl?: FetchLike) {
  // Source order: config file -> CLI args -> env
  let base = '';
  let token = '';
  let projectId: string | undefined = undefined;

  try {
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--config' && argv[i + 1]) {
        try {
          const fs = require('fs');
          const raw = fs.readFileSync(argv[i + 1], 'utf8');
          const cfg = JSON.parse(raw || '{}');
          base = String(cfg.baseUrl || base || '');
          token = String(cfg.token || token || '');
          projectId = cfg.projectId ? String(cfg.projectId) : projectId;
        } catch {}
      }
    }
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--base' && argv[i + 1]) base = String(argv[i + 1]);
      if (argv[i] === '--project' && argv[i + 1]) projectId = String(argv[i + 1]);
    }
  } catch {}

  base = (base || process.env.TAIGA_BASE_URL || '').replace(/\/$/, '');
  token = token || (process.env.TAIGA_TOKEN || '');
  projectId = projectId || (process.env.TAIGA_PROJECT_ID || '').trim() || undefined;

  return new TaigaClient({ baseUrl: base, token, projectId }, fetchImpl);
}
