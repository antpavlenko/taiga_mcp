import { TaigaClient } from './client';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { z } from 'zod';

function ok(data: any) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] } as any;
}

type ServerLike = {
  tool: (...args: any[]) => void;
  registerTool?: (name: string, config: any, cb: (...args: any[]) => any) => void;
};

type Commentable = 'epics' | 'userstories' | 'tasks' | 'issues';

export function registerTools(server: ServerLike, client: TaigaClient) {
  // Optional debug: capture tool registrations for inspection via a debug tool
  const debugEnabled = !!process.env.TAIGA_MCP_DEBUG;
  const debugRegistry: Array<{ name: string; title?: string; description?: string; hasInputSchema?: boolean }> = [];
  // Robust registration across SDK variants (some expect 4 params: name, description, { input_schema }, handler)
  const addTool = (
    name: string,
    description: string,
    inputSchema: any | undefined,
    handler: (args?: any) => Promise<any>
  ) => {
    const s: any = server as any;
    // Derive a short, human-friendly title (hosts often display title, not description)
    const titleFrom = (n: string, d: string) => {
      const firstSentence = (d || '').split(/\.(\s|$)/)[0].trim();
      if (firstSentence.length >= 4) return firstSentence;
      const t = n.replace(/^taiga_/, '').replace(/_/g, ' ');
      return t.replace(/\b\w/g, (c: string) => c.toUpperCase());
    };

    const title = titleFrom(name, description);
    if (debugEnabled) debugRegistry.push({ name, title, description, hasInputSchema: !!inputSchema });

  // Preferred: explicit registerTool so we can set a title (shown in many UIs)
  // Pass a Zod RawShape to let hosts surface argument names/types in metadata.
  try { return s.registerTool(name, { title, description, inputSchema }, async (args: any) => handler(args)); } catch {}
    // Fallback: runtime overload tool(name, description, cb)
    try { return s.tool(name, description, async (args: any) => handler(args)); } catch {}
    // Last resort: minimal two-arg call
    try { return s.tool(name, async (args: any) => handler(args)); } catch {}
  };
  // Helper to trim project fields to user-requested shape
  const toProjectView = async (p: any) => {
    const ownerUsername = p?.owner?.username ?? null;
    let memberUsernames: string[] = [];
    try {
      const memberIds: number[] = Array.isArray(p?.members) ? p.members.filter((x: any) => typeof x === 'number') : [];
      const unique = Array.from(new Set(memberIds));
      // Fetch usernames for each user id in parallel
      const users = await Promise.all(unique.map(async (uid) => {
        try { return await (client as any).getUser?.(uid); } catch { return undefined; }
      }));
      const mapping = new Map<number, string>();
      unique.forEach((uid, i) => {
        const u = users[i]; const uname = u?.username ?? undefined; if (uname) mapping.set(uid, String(uname));
      });
      memberUsernames = memberIds.map((uid) => mapping.get(uid) || String(uid));
    } catch {}
    return {
      id: p?.id,
      name: p?.name,
      slug: p?.slug,
      description: p?.description ?? null,
      created_date: p?.created_date ?? null,
      modified_date: p?.modified_date ?? null,
      owner: ownerUsername ? { username: ownerUsername } : null,
      members: memberUsernames
    };
  };

  // Helper to trim epic fields to the shape requested by the user
  const toEpicView = (e: any) => {
    const statusName = e?.status_extra_info?.name ?? null;
    // removed is_closed from outputs (calculated field)
    const assignedTo = e?.assigned_to_extra_info?.username ?? null;
    const owner = e?.owner_extra_info?.username ?? null;
    const tags = Array.isArray(e?.tags)
      ? e.tags.map((t: any) => Array.isArray(t) ? String(t[0]) : String(t)).filter(Boolean)
      : [];
    const usc = e?.user_stories_counts ?? {};
    return {
      id: e?.id,
      ref: e?.ref,
      subject: e?.subject ?? null,
      description: e?.description ?? null,
      status: statusName,
      tags,
      assigned_to: assignedTo,
      owner,
      created_date: e?.created_date ?? null,
      modified_date: e?.modified_date ?? null,
      client_requirement: e?.client_requirement ?? null,
      team_requirement: e?.team_requirement ?? null,
      is_blocked: e?.is_blocked ?? null,
      blocked_note: e?.blocked_note ?? null,
      user_stories_counts: {
        total: usc?.total ?? null,
        progress: usc?.progress ?? null
      }
    };
  };
  // Remove read-only/computed fields that should never be sent to Taiga
  const sanitizeBody = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const body = { ...obj };
    const drop = [
      'id','ref','project','created_date','modified_date','finished_date','finish_date',
      'is_closed','total_points','owner_extra_info','assigned_to_extra_info','status_extra_info',
      'milestone_name','user_stories_counts'
    ];
    for (const k of drop) delete (body as any)[k];
    return body;
  };

  // Helper to trim user story fields to the requested shape
  const toUserStoryView = (u: any) => {
    const statusName = u?.status_extra_info?.name ?? null;
    // removed is_closed from outputs (calculated field)
  const assignedName = u?.assigned_to_extra_info?.name || u?.assigned_to_extra_info?.full_name_display || u?.assigned_to_extra_info?.username || null;
  const ownerName = u?.owner_extra_info?.name || u?.owner_extra_info?.full_name_display || u?.owner_extra_info?.username || null;
    const tags = Array.isArray(u?.tags)
      ? u.tags.map((t: any) => Array.isArray(t) ? String(t[0]) : String(t)).filter(Boolean)
      : [];
    const epics = Array.isArray(u?.epics) ? u.epics.map((e: any) => e?.subject).filter(Boolean) : [];
    // points mapping is filled later when roles/points lists are available (async path below)
    const view: any = {
      id: u?.id,
      ref: u?.ref,
      subject: u?.subject ?? null,
      description: u?.description ?? null,
      status: statusName,
      assigned_to: assignedName,
      owner: ownerName,
      sprint: u?.milestone_name ?? null,
      tags,
      points: u?.points ?? {},
      total_points: u?.total_points ?? null,
      created_date: u?.created_date ?? null,
      modified_date: u?.modified_date ?? null,
      finish_date: u?.finish_date ?? null,
      client_requirement: u?.client_requirement ?? null,
      team_requirement: u?.team_requirement ?? null,
      is_blocked: u?.is_blocked ?? null,
      blocked_note: u?.blocked_note ?? null,
      due_date: u?.due_date ?? null,
      epics
    };
    return view;
  };

  // Normalize sprint input to milestone id or null (backlog)
  const resolveSprintInput = async (val: any): Promise<number | null | undefined> => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (typeof val === 'number') {
      if (Number.isNaN(val)) return undefined;
      return val === 0 ? null : Number(val);
    }
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s) return null;
      const key = s.toLowerCase();
      const noneSet = new Set(['backlog','none','no sprint','nosprint','unassigned','unscheduled','null','nil']);
      if (noneSet.has(key)) return null;
      const sprints = await client.listSprints();
      const match = Array.isArray(sprints) ? sprints.find((m: any) => String(m.name).toLowerCase() === key) : undefined;
      if (!match) throw new Error(`Unknown sprint: ${val}`);
      return Number(match.id);
    }
    return undefined;
  };

  // Helper to trim task fields
  const toTaskView = (t: any) => {
    const statusName = t?.status_extra_info?.name ?? null;
    // removed is_closed from outputs (calculated field)
    const assignedName = t?.assigned_to_extra_info?.name || t?.assigned_to_extra_info?.full_name_display || t?.assigned_to_extra_info?.username || null;
    const ownerName = t?.owner_extra_info?.name || t?.owner_extra_info?.full_name_display || t?.owner_extra_info?.username || null;
    const tags = Array.isArray(t?.tags) ? t.tags.map((x: any) => Array.isArray(x) ? String(x[0]) : String(x)).filter(Boolean) : [];
    return {
      id: t?.id,
      ref: t?.ref,
      subject: t?.subject ?? null,
      description: t?.description ?? null,
      status: statusName,
      assigned_to: assignedName,
      owner: ownerName,
      tags,
      created_date: t?.created_date ?? null,
      modified_date: t?.modified_date ?? null,
      finish_date: t?.finished_date ?? t?.finish_date ?? null,
      due_date: t?.due_date ?? null,
      is_blocked: t?.is_blocked ?? null,
      blocked_note: t?.blocked_note ?? null
    };
  };

  // Helper to trim issue fields to a human-friendly shape
  const toIssueView = (
    i: any,
    sprintNameById?: Map<number, string>,
    maps?: {
      severityNameById?: Map<number, string>;
      priorityNameById?: Map<number, string>;
      typeNameById?: Map<number, string>;
    }
  ) => {
  const statusName = i?.status_extra_info?.name ?? null;
  // removed is_closed from outputs (calculated field)
  const assignedUser = i?.assigned_to_extra_info?.name || i?.assigned_to_extra_info?.full_name_display || i?.assigned_to_extra_info?.username || null;
  const ownerUser = i?.owner_extra_info?.name || i?.owner_extra_info?.full_name_display || i?.owner_extra_info?.username || null;
    const tags = Array.isArray(i?.tags)
      ? i.tags.map((x: any) => (Array.isArray(x) ? String(x[0]) : String(x))).filter(Boolean)
      : [];
    const sprintName = (i?.milestone_name ?? (sprintNameById?.get(Number(i?.milestone)) ?? null)) || null;
  const sevName = i?.severity_extra_info?.name ?? maps?.severityNameById?.get(Number(i?.severity)) ?? null;
  const priName = i?.priority_extra_info?.name ?? maps?.priorityNameById?.get(Number(i?.priority)) ?? null;
  const typName = i?.type_extra_info?.name ?? maps?.typeNameById?.get(Number(i?.type)) ?? null;
    return {
      id: i?.id,
      ref: i?.ref,
      subject: i?.subject ?? null,
      status: statusName,
      assigned_to: assignedUser,
      owner: ownerUser,
      tags,
      due_date: i?.due_date ?? null,
      created_date: i?.created_date ?? null,
      modified_date: i?.modified_date ?? null,
      finished_date: i?.finished_date ?? i?.finish_date ?? null,
      severity: sevName ?? (i?.severity ?? null),
      priority: priName ?? (i?.priority ?? null),
      type: typName ?? (i?.type ?? null),
      sprint: sprintName,
      is_blocked: i?.is_blocked ?? null,
      blocked_note: i?.blocked_note ?? null
    };
  };

  // Normalize points object from { roleName|roleId: label|string|number } to { roleId: pointId }
  const normalizeUserStoryPoints = async (body: any) => {
    if (!body || typeof body !== 'object' || body.points == null) return body;
    const src = body.points as Record<string, string | number>;
    if (typeof src !== 'object' || Array.isArray(src)) return body;
    // Fetch roles and points for mapping
    const roles = await (client as any).listRoles?.().catch?.(() => []) || [];
    const points = await (client as any).listPoints?.().catch?.(() => []) || [];
    const roleIdByName = new Map<string, number>();
    const roleExists = new Set<number>();
    for (const r of roles) {
      const id = Number((r as any)?.id);
      const name = String((r as any)?.name ?? (r as any)?.slug ?? '').trim().toLowerCase();
      if (!isNaN(id)) roleExists.add(id);
      if (name) roleIdByName.set(name, id);
    }
    const pointIdByLabel = new Map<string, number>();
    for (const p of points) {
      const id = Number((p as any)?.id);
      const label = String((p as any)?.name ?? (p as any)?.label ?? '').trim();
      if (!isNaN(id) && label) pointIdByLabel.set(label, id);
    }
    const mapped: Record<number, number> = {} as any;
    for (const [rk, lv] of Object.entries(src)) {
      // resolve role id
      let roleId: number | undefined = undefined;
      const maybeNum = Number(rk);
      if (!Number.isNaN(maybeNum) && roleExists.has(maybeNum)) roleId = maybeNum;
      if (roleId === undefined) {
        const key = rk.trim().toLowerCase();
        roleId = roleIdByName.get(key);
      }
      if (roleId === undefined) throw new Error(`Invalid role '${rk}'`);
      // resolve point id by label (keep '?' and numeric labels)
      const label = typeof lv === 'number' ? String(lv) : String(lv || '').trim();
      const pid = pointIdByLabel.get(label);
      if (pid === undefined) throw new Error(`Unknown points label '${lv}'`);
      mapped[roleId] = pid;
    }
    body.points = mapped;
    return body;
  };

  // Projects
  addTool(
    'taiga_project_get',
    'Get the active project from the extension context. Args: none. Output fields: id, name, slug, description, created_date, modified_date, owner.username, members (usernames).',
    {},
    async () => {
      const p = await client.getProject({});
      if (!p) return ok(null);
      return ok(await toProjectView(p));
    }
  );

  // Epics
  addTool(
    'taiga_epics_list',
    'List epics in the active project. Optional filters: datefrom (ISO datetime) to include epics created on/after this date; status (string or list of strings) matching status name. Returns a trimmed payload including: status (name), is_closed, tags, assigned_to, owner, created_date, modified_date, subject, description, client_requirement, team_requirement, is_blocked, blocked_note, user_stories_counts { total, progress }.',
    {
      datefrom: z.string().describe('Include epics created on/after this ISO datetime').optional(),
      status: z.union([z.string(), z.array(z.string())]).describe('Filter by status name(s)').optional()
    },
    async (args: any) => {
      const list = await client.listEpics();
      let epics = Array.isArray(list) ? list : [];
      // datefrom filter
      const df = args?.datefrom ? new Date(String(args.datefrom)) : undefined;
      if (df && !isNaN(df.getTime())) {
        epics = epics.filter((e: any) => {
          const cd = e?.created_date ? new Date(e.created_date) : undefined;
          return cd && !isNaN(cd.getTime()) ? cd.getTime() >= df.getTime() : false;
        });
      }
      // status filter (by status name)
      if (args?.status) {
        const names = Array.isArray(args.status) ? args.status : [args.status];
        const wanted = new Set(names.map((s: any) => String(s).toLowerCase().trim()).filter(Boolean));
        if (wanted.size) {
          epics = epics.filter((e: any) => wanted.has(String(e?.status_extra_info?.name || '').toLowerCase().trim()));
        }
      }
      const trimmed = epics.map((e: any) => toEpicView(e));
      return ok(trimmed);
    }
  );
  addTool(
    'taiga_epic_get',
    'Get an epic by ref (project-visible number). Args: ref: number. Returns the same trimmed payload as epics_list plus comments with dates, authors, and text.',
    { ref: z.number().int().positive().describe('Epic ref (project-visible number)') },
    async (args: any) => {
      const id = await (client as any).resolveIdByRef('epics', Number(args.ref));
      if (!id) throw new Error('ref is required');
      const epic = await client.getEpic(id);
      if (!epic) return ok(null);
      const base = toEpicView(epic);
      let comments: any[] = [];
      try {
        const raw = await client.listComments('epics', id);
        comments = Array.isArray(raw) ? raw.map((c: any) => ({
          created_date: c?.created_date ?? c?.date ?? null,
          author: c?.author ?? c?.user?.username ?? c?.owner_extra_info?.username ?? c?.user?.full_name_display ?? c?.user ?? null,
          text: c?.text ?? c?.comment ?? ''
        })) : [];
      } catch {}
      return ok({ ...base, comments });
    }
  );
  // Utility: enrich epic body accepting human-friendly values
  const normalizeEpicBody = async (raw: any) => {
    const body = { ...(raw || {}) };
    // Status: allow string name
    if (typeof body.status === 'string' && body.status.trim()) {
      try {
        const statuses = await client.listEpicStatuses();
        const wanted = body.status.trim().toLowerCase();
        const match = Array.isArray(statuses) ? statuses.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
        if (!match) throw new Error(`Unknown epic status: ${body.status}`);
        body.status = match.id;
      } catch (e: any) {
        throw new Error(`Failed to resolve status '${body.status}': ${e?.message || e}`);
      }
    }
    // Assigned to: allow username
    if (typeof body.assigned_to === 'string' && body.assigned_to.trim()) {
      try { body.assigned_to = await (client as any).resolveUserId(body.assigned_to); } catch (e: any) { throw new Error(e?.message || String(e)); }
    }
    // Owner: allow username (same caveat as assigned_to)
    if (typeof body.owner === 'string' && body.owner.trim()) {
      try { body.owner = await (client as any).resolveUserId(body.owner); } catch (e: any) { throw new Error(e?.message || String(e)); }
    }
    // Tags: allow string or array of strings; convert to Taiga format [[tag,null], ...]
    if (typeof body.tags === 'string') body.tags = [body.tags];
    if (Array.isArray(body.tags)) {
      body.tags = body.tags.map((t: any) => [String(t), null]);
    }
    return body;
  };
  addTool(
    'taiga_epic_create',
    'Create an epic in the active project. Args: body: object (must include subject; project is inferred). Accepts human-friendly values: status (name), assigned_to (username), owner (username), tags (string or list). Example: { "body": { "subject": "New epic", "status": "In progress", "tags": ["mcp"] } }',
    { body: z.any().describe('Epic payload') },
    async (args: any) => {
      const raw = args?.body; if (!raw) throw new Error('body is required');
      const body = await normalizeEpicBody(raw);
      await client.createEpic(body);
      return ok('epic created');
    }
  );
  addTool(
    'taiga_epic_update',
    'Update an epic by ref. Args: ref: number, patch: object. Accepts human-friendly values: status (name), assigned_to (username), owner (username), tags (string or list).',
    { ref: z.number().int().positive().describe('Epic ref (project-visible number)'), patch: z.any().describe('Partial epic patch') },
    async (args: any) => {
      const patch = args?.patch; if (!patch) throw new Error('patch is required');
      const id = await (client as any).resolveIdByRef('epics', Number(args.ref));
      if (!id) throw new Error('ref is required');
      // Fetch current epic to obtain version if not provided
      const current = await client.getEpic(id);
      if (!current) throw new Error(`Epic ${id} not found`);
      const body = await normalizeEpicBody(patch);
      if (body.version === undefined || body.version === null) {
        body.version = current.version;
      }
      await client.updateEpic(id, body);
      return ok(`epic ${id} updated`);
    }
  );

  // User Stories
  addTool(
    'taiga_userstories_list',
    'List user stories in the active project with filters. Optional filters: sprint (id or name), epic (id or subject), datefrom (ISO), assigned_to (id or username), statuses (name or list of names or ids), due_date_from (ISO), due_date_to (ISO). Output is a trimmed view with status, is_closed, tags, assigned_to/owner names, sprint name, points, totals, dates, subject, requirements flags, blocked info, total_points, epics (subjects), description.',
    {
      sprint: z.union([z.string(), z.number()]).describe('Sprint name or id').optional(),
      epic: z.union([z.string(), z.number()]).describe('Epic subject or id').optional(),
      datefrom: z.string().describe('Created on/after this ISO datetime').optional(),
      assigned_to: z.union([z.string(), z.number()]).describe('Assigned to username or id').optional(),
      statuses: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).describe('Status name(s) or id(s)').optional(),
      due_date_from: z.string().describe('Due date on/after this ISO date').optional(),
      due_date_to: z.string().describe('Due date on/before this ISO date').optional()
    },
    async (args: any) => {
      let stories = await client.listUserStories();
      stories = Array.isArray(stories) ? stories : [];
      // Filter: sprint
      if (args?.sprint !== undefined) {
        let milestoneId: number | undefined;
        if (typeof args.sprint === 'number') milestoneId = args.sprint;
        else if (typeof args.sprint === 'string' && args.sprint.trim()) {
          const sprints = await client.listSprints();
          const wanted = args.sprint.trim().toLowerCase();
          const match = Array.isArray(sprints) ? sprints.find((m: any) => String(m.name).toLowerCase() === wanted) : undefined;
          if (match) milestoneId = Number(match.id);
        }
        if (milestoneId !== undefined) {
          stories = stories.filter((u: any) => Number(u?.milestone) === Number(milestoneId));
        }
      }
      // Filter: epic
      if (args?.epic !== undefined) {
        let epicId: number | undefined;
        if (typeof args.epic === 'number') epicId = args.epic;
        else if (typeof args.epic === 'string' && args.epic.trim()) {
          const epics = await client.listEpics();
          const wanted = args.epic.trim().toLowerCase();
          const match = Array.isArray(epics) ? epics.find((e: any) => String(e.subject).toLowerCase() === wanted) : undefined;
          if (match) epicId = Number(match.id);
        }
        if (epicId !== undefined) {
          // Get related user stories for that epic and filter
          const rel = await (client as any).listEpicRelatedUserStories?.(epicId).catch?.(() => []) || [];
          const set = new Set((Array.isArray(rel) ? rel : []).map((r: any) => Number(r?.user_story)).filter((n: number) => !isNaN(n)));
          stories = stories.filter((u: any) => set.has(Number(u?.id)));
        }
      }
      // Filter: created date from
      if (args?.datefrom) {
        const df = new Date(String(args.datefrom));
        if (!isNaN(df.getTime())) {
          const t = df.getTime();
          stories = stories.filter((u: any) => {
            const cd = u?.created_date ? new Date(u.created_date) : undefined;
            return cd && !isNaN(cd.getTime()) ? cd.getTime() >= t : false;
          });
        }
      }
      // Filter: assigned_to
      if (args?.assigned_to !== undefined) {
        let uid: number | undefined;
        if (typeof args.assigned_to === 'number') uid = args.assigned_to;
        else if (typeof args.assigned_to === 'string' && args.assigned_to.trim()) {
          try { uid = await (client as any).resolveUserId(args.assigned_to); } catch {}
        }
        if (uid !== undefined) stories = stories.filter((u: any) => Number(u?.assigned_to) === Number(uid));
      }
      // Filter: statuses (names or ids)
      if (args?.statuses !== undefined) {
        const arr = Array.isArray(args.statuses) ? args.statuses : [args.statuses];
        const names = new Set<string>();
        const ids = new Set<number>();
        for (const v of arr) {
          if (typeof v === 'number') ids.add(v);
          else if (typeof v === 'string' && v.trim()) names.add(v.trim().toLowerCase());
        }
        let idSet = ids;
        if (names.size) {
          const statuses = await client.listUserStoryStatuses();
          const mapping = new Map<string, number>();
          for (const s of (Array.isArray(statuses) ? statuses : [])) {
            const key = String((s as any).name || '').toLowerCase();
            mapping.set(key, Number((s as any).id));
          }
          for (const n of names) { const id = mapping.get(n); if (id !== undefined) idSet.add(id); }
        }
        if (idSet.size) stories = stories.filter((u: any) => idSet.has(Number(u?.status)));
      }
      // Filter: due_date range
      const dfrom = args?.due_date_from ? new Date(String(args.due_date_from)) : undefined;
      const dto = args?.due_date_to ? new Date(String(args.due_date_to)) : undefined;
      const hasFrom = dfrom && !isNaN((dfrom as Date).getTime());
      const hasTo = dto && !isNaN((dto as Date).getTime());
      if (hasFrom || hasTo) {
        const tf = hasFrom ? (dfrom as Date).getTime() : undefined;
        const tt = hasTo ? (dto as Date).getTime() : undefined;
        stories = stories.filter((u: any) => {
          if (!u?.due_date) return false;
          const du = new Date(u.due_date); const t = du.getTime();
          if (isNaN(t)) return false;
          if (tf !== undefined && t < tf) return false;
          if (tt !== undefined && t > tt) return false;
          return true;
        });
      }
      // Build mappings for points: roleId -> roleName, pointId -> numeric value
  let roleNameById = new Map<number, string>();
  let pointLabelById = new Map<number, string>();
      try {
        const roles = await (client as any).listRoles?.();
        const points = await (client as any).listPoints?.();
        if (Array.isArray(roles)) {
          for (const r of roles) {
            const id = Number(r?.id);
            const name = (r?.name || r?.slug || r?.code || '').toString();
            if (!isNaN(id) && name) roleNameById.set(id, name);
          }
        }
        if (Array.isArray(points)) {
          for (const p of points) {
            const id = Number(p?.id);
            const name = (p?.name ?? p?.label ?? '').toString();
            if (!isNaN(id) && name) pointLabelById.set(id, name);
          }
        }
      } catch {}
      // Map to view and transform points {roleId: pointId} => {roleName: numeric}
      const out = stories.map((u: any) => {
        const v = toUserStoryView(u) as any;
        const src = (u?.points || {}) as Record<string, any>;
        const mapped: Record<string, number | string> = {};
        for (const [k, pv] of Object.entries(src)) {
          const rid = Number(k);
          const roleName = roleNameById.get(rid) || k;
          const label = pointLabelById.get(Number(pv));
          if (label != null) {
            const trimmed = String(label).trim();
            const num = Number(trimmed);
            mapped[roleName] = Number.isNaN(num) ? trimmed : num;
          }
        }
        v.points = mapped;
        return v;
      });
      return ok(out);
    }
  );
  addTool(
    'taiga_userstory_get',
    'Get a user story by ref (project-visible number). Args: ref: number. Includes normalized comments and tasks.',
    { ref: z.number().int().positive().describe('User story ref (project-visible number)') },
    async (args: any) => {
    const id = await (client as any).resolveIdByRef('userstories', Number(args.ref));
    if (!id) throw new Error('ref is required');
    const us = await client.getUserStory(id);
    if (!us) return ok(null);
    // points mapping
  let roleNameById = new Map<number, string>();
  let pointLabelById = new Map<number, string>();
    try {
      const roles = await (client as any).listRoles?.();
      const points = await (client as any).listPoints?.();
      if (Array.isArray(roles)) {
        for (const r of roles) {
          const id = Number(r?.id);
          const name = (r?.name || r?.slug || r?.code || '').toString();
          if (!isNaN(id) && name) roleNameById.set(id, name);
        }
      }
      if (Array.isArray(points)) {
        for (const p of points) {
          const id = Number(p?.id);
          const name = (p?.name ?? p?.label ?? '').toString();
          if (!isNaN(id) && name) pointLabelById.set(id, name);
        }
      }
    } catch {}
    const baseRaw = toUserStoryView(us) as any;
    const src = (us?.points || {}) as Record<string, any>;
    const mapped: Record<string, number | string> = {};
    for (const [k, pv] of Object.entries(src)) {
      const rid = Number(k);
      const roleName = roleNameById.get(rid) || k;
      const label = pointLabelById.get(Number(pv));
      if (label != null) {
        const trimmed = String(label).trim();
        const num = Number(trimmed);
        mapped[roleName] = Number.isNaN(num) ? trimmed : num;
      }
    }
    const base = { ...baseRaw, points: mapped };
    let comments: any[] = [];
    try {
      const raw = await client.listComments('userstories', id);
      comments = Array.isArray(raw) ? raw.map((c: any) => ({
        created_date: c?.created_date ?? c?.date ?? null,
        author: c?.author ?? c?.user?.username ?? c?.owner_extra_info?.username ?? c?.user?.full_name_display ?? c?.user ?? null,
        text: c?.text ?? c?.comment ?? ''
      })) : [];
    } catch {}
    // tasks: list minimal
    let tasks: any[] = [];
    try {
      const list = await client.listTasks({ userStoryId: id });
      tasks = Array.isArray(list) ? list.map((t: any) => ({ id: t?.id, subject: t?.subject ?? null })) : [];
    } catch {}
    return ok({ ...base, comments, tasks });
  }
  );
  addTool(
    'taiga_userstory_create',
    'Create a user story in the active project. Required: subject. Optional: description, assigned_to (username or id), tags (string or list), status (name or id), sprint (name or id), due_date, client_requirement, team_requirement, points, epics (subject/id or list). Read-only/computed fields like total_points, is_closed, created/modified/finish dates are ignored.',
    { body: z.object({
        subject: z.string().min(1).describe('Title of the user story'),
        description: z.string().optional(),
        assigned_to: z.union([z.number(), z.string()]).optional(),
        // owner is intentionally not advertised; defaults to current user, but still accepted if provided
        status: z.union([z.number(), z.string()]).optional(),
        sprint: z.union([z.number(), z.string()]).optional(),
        tags: z.union([z.string(), z.array(z.string())]).optional(),
        due_date: z.string().optional(),
        client_requirement: z.boolean().optional(),
        team_requirement: z.boolean().optional(),
        points: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
        epics: z.union([z.number(), z.string(), z.array(z.union([z.number(), z.string()]))]).optional()
      }).describe('User story payload') },
    async (args: any) => {
    const body = { ...(args?.body || {}) }; if (!Object.keys(body).length) throw new Error('body is required');
    sanitizeBody(body);
    if (typeof body.assigned_to === 'string' && body.assigned_to.trim()) body.assigned_to = await (client as any).resolveUserId(body.assigned_to);
    if (typeof body.owner === 'string' && body.owner.trim()) body.owner = await (client as any).resolveUserId(body.owner);
    if (typeof body.tags === 'string') body.tags = [body.tags]; if (Array.isArray(body.tags)) body.tags = body.tags.map((t: any) => [String(t), null]);
    if (typeof body.status === 'string' && body.status.trim()) {
      const statuses = await client.listUserStoryStatuses();
      const wanted = body.status.trim().toLowerCase();
      const match = Array.isArray(statuses) ? statuses.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown user story status: ${body.status}`);
      body.status = match.id;
    }
    if (body.hasOwnProperty('sprint')) {
      const ms = await resolveSprintInput(body.sprint);
      delete body.sprint;
      if (ms !== undefined) {
        if (ms === null) { delete (body as any).milestone; }
        else { body.milestone = ms; }
      }
    }
  // Points: map role names/ids and labels to roleIds/pointIds
  if (body.points !== undefined) await normalizeUserStoryPoints(body);
    // Create first
    const created = await client.createUserStory(body);
    // Link epics if provided
    const epicsInput = body.epics ?? body.epic;
    if (epicsInput !== undefined && created?.id) {
      const arr = Array.isArray(epicsInput) ? epicsInput : [epicsInput];
      const wantedIds: number[] = [];
      const epics = await client.listEpics();
      for (const v of arr) {
        if (typeof v === 'number') wantedIds.push(v);
        else if (typeof v === 'string' && v.trim()) {
          const match = Array.isArray(epics) ? epics.find((e: any) => String(e.subject).toLowerCase() === v.trim().toLowerCase()) : undefined;
          if (match) wantedIds.push(Number(match.id));
        }
      }
      for (const eid of wantedIds) { try { await (client as any).linkEpicToUserStory?.(eid, Number(created.id)); } catch {} }
    }
    return ok('userstory created');
  }
  );
  addTool(
    'taiga_userstory_update',
    'Update a user story by ref. Accepts human-friendly values: status (name), sprint (name), tags (string or list), assigned_to (username), epics (list by subject or id). Do not include read-only/computed fields (total_points, is_closed, created/modified/finish dates).',
    { ref: z.number().int().positive().describe('User story ref (project-visible number)'), patch: z.object({
        subject: z.string().optional(),
        description: z.string().optional(),
        assigned_to: z.union([z.number(), z.string()]).optional(),
        status: z.union([z.number(), z.string()]).optional(),
        sprint: z.union([z.number(), z.string()]).optional(),
        tags: z.union([z.string(), z.array(z.string())]).optional(),
        due_date: z.string().optional(),
        client_requirement: z.boolean().optional(),
        team_requirement: z.boolean().optional(),
        points: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
        epics: z.union([z.number(), z.string(), z.array(z.union([z.number(), z.string()]))]).optional(),
        version: z.number().optional()
      }).describe('Partial user story patch') },
    async (args: any) => {
    const patch = args?.patch; if (!patch) throw new Error('patch is required');
    const id = await (client as any).resolveIdByRef('userstories', Number(args.ref));
    if (!id) throw new Error('ref is required');
    const body = { ...(patch || {}) };
    sanitizeBody(body);
    if (typeof body.assigned_to === 'string' && body.assigned_to.trim()) body.assigned_to = await (client as any).resolveUserId(body.assigned_to);
    if (typeof body.owner === 'string' && body.owner.trim()) body.owner = await (client as any).resolveUserId(body.owner);
    // Normalize status by name
    if (typeof body.status === 'string' && body.status.trim()) {
      const statuses = await client.listUserStoryStatuses();
      const wanted = body.status.trim().toLowerCase();
      const match = Array.isArray(statuses) ? statuses.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown user story status: ${body.status}`);
      body.status = match.id;
    }
    if (body.hasOwnProperty('sprint')) {
      const ms = await resolveSprintInput(body.sprint);
      delete body.sprint;
      if (ms !== undefined) {
        if (ms === null) { body.milestone = null as any; } else { body.milestone = ms; }
      }
    }
    // Normalize tags like epics
    if (typeof body.tags === 'string') body.tags = [body.tags];
    if (Array.isArray(body.tags)) body.tags = body.tags.map((t: any) => [String(t), null]);
    // Points: map role names/ids and labels to roleIds/pointIds
    if (body.points !== undefined) await normalizeUserStoryPoints(body);
    // Ensure version for optimistic concurrency if not provided
    try {
      if (body.version === undefined || body.version === null) {
        const current = await client.getUserStory(id);
        if (!current) throw new Error(`User story ${id} not found`);
        body.version = current.version;
      }
    } catch (e: any) { throw new Error(e?.message || String(e)); }
    await client.updateUserStory(id, body);
    // Handle epics links if provided
    if (body.epics !== undefined || body.epic !== undefined) {
      const epicsInput = body.epics ?? body.epic;
      const arr = Array.isArray(epicsInput) ? epicsInput : [epicsInput];
      const wantedIds: number[] = [];
      const epics = await client.listEpics();
      for (const v of arr) {
        if (typeof v === 'number') wantedIds.push(v);
        else if (typeof v === 'string' && v.trim()) {
          const match = Array.isArray(epics) ? epics.find((e: any) => String(e.subject).toLowerCase() === v.trim().toLowerCase()) : undefined;
          if (match) wantedIds.push(Number(match.id));
        }
      }
      // Current links from user story
      const cur = await client.getUserStory(id);
      const currentIds = new Set(((cur as any)?.epics || []).map((e: any) => Number(e?.id)).filter((n: number) => !isNaN(n)));
      const desired = new Set(wantedIds.map((n) => Number(n)));
      for (const eid of desired) { if (!currentIds.has(eid)) { try { await (client as any).linkEpicToUserStory?.(eid, id); } catch {} } }
  const currentIdsArr = Array.from(currentIds) as number[];
  for (const eid of currentIdsArr) { if (!desired.has(Number(eid))) { try { await (client as any).unlinkEpicFromUserStory?.(Number(eid), id); } catch {} } }
    }
    return ok(`userstory ${id} updated`);
  }
  );

  // Tasks
  addTool(
    'taiga_tasks_list',
    'List tasks in the active project. Filters: sprint (name or id), user_story_ref (number), epic_ref (number), datefrom (ISO), assigned_to (username or id), statuses (name/id or array), tags (string or array), due_date_from/to (ISO). Returns trimmed tasks.',
    {
      sprint: z.union([z.string(), z.number()]).optional().describe('Filter by sprint name or id'),
      user_story_ref: z.number().int().positive().optional().describe('Filter by user story ref (project-visible number)'),
      epic_ref: z.number().int().positive().optional().describe('Filter by epic ref (project-visible number)'),
      datefrom: z.string().optional().describe('Include tasks created on/after this ISO datetime'),
      assigned_to: z.union([z.string(), z.number()]).optional().describe('Assignee (username or id)'),
      statuses: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).optional().describe('Status name(s) or id(s) to include'),
      tags: z.union([z.string(), z.array(z.string())]).optional().describe('Tasks having any of these tag names'),
      due_date_from: z.string().optional().describe('Due date on/after this ISO date'),
      due_date_to: z.string().optional().describe('Due date on/before this ISO date')
    },
    async (args: any) => {
      let tasks = await client.listTasks();
      tasks = Array.isArray(tasks) ? tasks : [];
      // sprint filter
      if (args?.sprint !== undefined) {
        let sprintId: number | undefined;
        if (typeof args.sprint === 'number') sprintId = args.sprint;
        else if (typeof args.sprint === 'string' && args.sprint.trim()) {
          const sprints = await client.listSprints();
          const wanted = args.sprint.trim().toLowerCase();
          const match = Array.isArray(sprints) ? sprints.find((m: any) => String(m.name).toLowerCase() === wanted) : undefined;
          if (match) sprintId = Number(match.id);
        }
        if (sprintId !== undefined) tasks = tasks.filter((t: any) => Number(t?.milestone) === Number(sprintId));
      }
      // user_story filter (ref)
      if (args?.user_story_ref !== undefined) {
        const usId = await (client as any).resolveIdByRef('userstories', Number(args.user_story_ref));
        if (usId !== undefined) tasks = tasks.filter((t: any) => Number(t?.user_story) === Number(usId));
      }
      // epic filter via related user stories (ref)
      if (args?.epic_ref !== undefined) {
        const epicId = await (client as any).resolveIdByRef('epics', Number(args.epic_ref));
        if (epicId !== undefined) {
          const rel = await (client as any).listEpicRelatedUserStories?.(epicId).catch?.(() => []) || [];
          const usSet = new Set((Array.isArray(rel) ? rel : []).map((r: any) => Number(r?.user_story)).filter((n: number) => !isNaN(n)));
          tasks = tasks.filter((t: any) => usSet.has(Number(t?.user_story)));
        }
      }
      // created date from
      if (args?.datefrom) {
        const df = new Date(String(args.datefrom));
        if (!isNaN(df.getTime())) {
          const t0 = df.getTime();
          tasks = tasks.filter((t: any) => {
            const cd = t?.created_date ? new Date(t.created_date) : undefined;
            return cd && !isNaN(cd.getTime()) ? cd.getTime() >= t0 : false;
          });
        }
      }
      // assigned_to
      if (args?.assigned_to !== undefined) {
        let uid: number | undefined;
        if (typeof args.assigned_to === 'number') uid = args.assigned_to;
        else if (typeof args.assigned_to === 'string' && args.assigned_to.trim()) {
          try { uid = await (client as any).resolveUserId(args.assigned_to); } catch {}
        }
        if (uid !== undefined) tasks = tasks.filter((t: any) => Number(t?.assigned_to) === Number(uid));
      }
      // statuses
      if (args?.statuses !== undefined) {
        const arr = Array.isArray(args.statuses) ? args.statuses : [args.statuses];
        const names = new Set<string>();
        const ids = new Set<number>();
        for (const v of arr) {
          if (typeof v === 'number') ids.add(v); else if (typeof v === 'string' && v.trim()) names.add(v.trim().toLowerCase());
        }
        let idSet = ids;
        if (names.size) {
          const statuses = await client.listTaskStatuses();
          const mapping = new Map<string, number>();
          for (const s of (Array.isArray(statuses) ? statuses : [])) {
            const key = String((s as any).name || '').toLowerCase(); mapping.set(key, Number((s as any).id));
          }
          for (const n of names) { const id = mapping.get(n); if (id !== undefined) idSet.add(id); }
        }
        if (idSet.size) tasks = tasks.filter((t: any) => idSet.has(Number(t?.status)));
      }
      // due_date range
      const dfrom = args?.due_date_from ? new Date(String(args.due_date_from)) : undefined;
      const dto = args?.due_date_to ? new Date(String(args.due_date_to)) : undefined;
      const hasFrom = dfrom && !isNaN((dfrom as Date).getTime());
      const hasTo = dto && !isNaN((dto as Date).getTime());
      if (hasFrom || hasTo) {
        const tf = hasFrom ? (dfrom as Date).getTime() : undefined;
        const tt = hasTo ? (dto as Date).getTime() : undefined;
        tasks = tasks.filter((t: any) => {
          if (!t?.due_date) return false;
          const du = new Date(t.due_date); const tm = du.getTime();
          if (isNaN(tm)) return false;
          if (tf !== undefined && tm < tf) return false;
          if (tt !== undefined && tm > tt) return false;
          return true;
        });
      }
      return ok(tasks.map((t: any) => toTaskView(t)));
    }
  );
  addTool(
    'taiga_task_get',
    'Get a task by ref (project-visible number). Args: ref: number. Includes normalized comments.',
    { ref: z.number().int().positive().describe('Task ref (project-visible number)') },
    async (args: any) => {
    const id = await (client as any).resolveIdByRef('tasks', Number(args.ref));
    if (!id) throw new Error('ref is required');
    const task = await client.getTask(id);
    if (!task) return ok(null);
  let comments: any[] = [];
    try {
      const raw = await client.listComments('tasks', id);
      comments = Array.isArray(raw) ? raw.map((c: any) => ({
        created_date: c?.created_date ?? c?.date ?? null,
        author: c?.author ?? c?.user?.username ?? c?.owner_extra_info?.username ?? c?.user?.full_name_display ?? c?.user ?? null,
        text: c?.text ?? c?.comment ?? ''
      })) : [];
    } catch {}
    return ok({ ...toTaskView(task), comments });
  }
  );
  addTool(
    'taiga_task_create',
    'Create a task in the active project. Required: subject, user_story_ref (ref number). Optional: description, assigned_to (username or id), status (name or id), sprint (name or id), tags (string or list), due_date, is_blocked, blocked_note. Read-only fields (is_closed, created/modified/finish) are ignored.',
    { body: z.object({
        subject: z.string().min(1).describe('Task title'),
        user_story_ref: z.number().int().positive().describe('User story ref (project-visible number)'),
        description: z.string().optional(),
        assigned_to: z.union([z.number(), z.string()]).optional(),
        status: z.union([z.number(), z.string()]).optional(),
        sprint: z.union([z.number(), z.string()]).optional(),
        tags: z.union([z.string(), z.array(z.string())]).optional(),
        due_date: z.string().optional(),
        is_blocked: z.boolean().optional(),
        blocked_note: z.string().optional()
      }).describe('Task payload') },
    async (args: any) => {
    const body = { ...(args?.body || {}) }; if (!Object.keys(body).length) throw new Error('body is required');
    sanitizeBody(body);
    if (typeof body.assigned_to === 'string' && body.assigned_to.trim()) body.assigned_to = await (client as any).resolveUserId(body.assigned_to);
    if (typeof body.owner === 'string' && body.owner.trim()) body.owner = await (client as any).resolveUserId(body.owner);
    // Resolve user story ref to id
    if (body.user_story_ref === undefined) throw new Error('user_story_ref is required');
    {
      const uid = await (client as any).resolveIdByRef('userstories', Number(body.user_story_ref));
      if (!uid) throw new Error(`Unknown user story ref '${body.user_story_ref}'`);
      body.user_story = uid; delete (body as any).user_story_ref;
    }
    // Status by name
    if (typeof body.tags === 'string') body.tags = [body.tags]; if (Array.isArray(body.tags)) body.tags = body.tags.map((t: any) => [String(t), null]);
    if (typeof body.status === 'string' && body.status.trim()) {
      const statuses = await client.listTaskStatuses();
      const wanted = body.status.trim().toLowerCase();
      const match = Array.isArray(statuses) ? statuses.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown task status: ${body.status}`);
      body.status = match.id;
    }
    if (body.hasOwnProperty('sprint')) {
      const ms = await resolveSprintInput(body.sprint);
      delete body.sprint;
      if (ms !== undefined) {
        if (ms === null) { delete (body as any).milestone; } else { body.milestone = ms; }
      }
    }
    await client.createTask(body);
    return ok('task created');
  }
  );
  addTool(
    'taiga_task_update',
    'Update a task by ref. Accepts human-friendly values: status (name), sprint (name), tags (string or list), assigned_to (username). Read-only/computed fields are ignored.',
    { ref: z.number().int().positive().describe('Task ref (project-visible number)'), patch: z.object({
        subject: z.string().optional(),
        description: z.string().optional(),
        assigned_to: z.union([z.number(), z.string()]).optional(),
        status: z.union([z.number(), z.string()]).optional(),
        sprint: z.union([z.number(), z.string()]).optional(),
        tags: z.union([z.string(), z.array(z.string())]).optional(),
        due_date: z.string().optional(),
        is_blocked: z.boolean().optional(),
        blocked_note: z.string().optional(),
        version: z.number().optional()
      }).describe('Partial task patch') },
    async (args: any) => {
    const patch = args?.patch; if (!patch) throw new Error('patch is required');
    const id = await (client as any).resolveIdByRef('tasks', Number(args.ref));
    if (!id) throw new Error('ref is required');
    const body = { ...(patch || {}) };
    sanitizeBody(body);
    if (typeof body.assigned_to === 'string' && body.assigned_to.trim()) body.assigned_to = await (client as any).resolveUserId(body.assigned_to);
    if (typeof body.owner === 'string' && body.owner.trim()) body.owner = await (client as any).resolveUserId(body.owner);
    if (typeof body.status === 'string' && body.status.trim()) {
      const statuses = await client.listTaskStatuses();
      const wanted = body.status.trim().toLowerCase();
      const match = Array.isArray(statuses) ? statuses.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown task status: ${body.status}`);
      body.status = match.id;
    }
    if (body.hasOwnProperty('sprint')) {
      const ms = await resolveSprintInput(body.sprint);
      delete body.sprint;
      if (ms !== undefined) {
        if (ms === null) { body.milestone = null as any; } else { body.milestone = ms; }
      }
    }
    if (typeof body.tags === 'string') body.tags = [body.tags];
    if (Array.isArray(body.tags)) body.tags = body.tags.map((t: any) => [String(t), null]);
    // Ensure version for optimistic concurrency if not provided
    try {
      if (body.version === undefined || body.version === null) {
        const current = await client.getTask(id);
        if (!current) throw new Error(`Task ${id} not found`);
        body.version = current.version;
      }
    } catch (e: any) { throw new Error(e?.message || String(e)); }
    await client.updateTask(id, body);
    return ok(`task ${id} updated`);
  }
  );

  // Issues
  addTool(
    'taiga_issues_list',
    'List issues in the active project context. Optional filters: status: string, sprintId: number (both refer to active project). Returns a trimmed view similar to tasks/user stories.',
    { status: z.string().describe('Filter by status').optional(), sprintId: z.number().int().positive().describe('Filter by sprint id').optional() },
    async (args: any) => {
      const raw = await client.listIssues({ status: args?.status, sprintId: args?.sprintId ? Number(args.sprintId) : undefined });
      const arr = Array.isArray(raw) ? raw : [];
      // Build sprint id -> name map to populate sprint field when milestone_name is missing
      let sprintNameById = new Map<number, string>();
      let severityNameById = new Map<number, string>();
      let priorityNameById = new Map<number, string>();
      let typeNameById = new Map<number, string>();
      try {
        const sprints = await client.listSprints();
        for (const m of (Array.isArray(sprints) ? sprints : [])) {
          const id = Number((m as any)?.id);
          const name = (m as any)?.name;
          if (!isNaN(id) && name) sprintNameById.set(id, String(name));
        }
        // Issue metadata for name mappings
        const [sevs, pris, tys] = await Promise.all([
          (client as any).listIssueSeverities?.().catch?.(() => []),
          (client as any).listIssuePriorities?.().catch?.(() => []),
          (client as any).listIssueTypes?.().catch?.(() => [])
        ]);
        for (const s of (Array.isArray(sevs) ? sevs : [])) {
          const id = Number((s as any)?.id); const name = (s as any)?.name;
          if (!isNaN(id) && name) severityNameById.set(id, String(name));
        }
        for (const p of (Array.isArray(pris) ? pris : [])) {
          const id = Number((p as any)?.id); const name = (p as any)?.name;
          if (!isNaN(id) && name) priorityNameById.set(id, String(name));
        }
        for (const t of (Array.isArray(tys) ? tys : [])) {
          const id = Number((t as any)?.id); const name = (t as any)?.name;
          if (!isNaN(id) && name) typeNameById.set(id, String(name));
        }
      } catch {}
      // Map to views and then enforce name resolution for any numeric leftovers
      const views = arr.map((i: any) => toIssueView(i, sprintNameById, { severityNameById, priorityNameById, typeNameById })) as any[];
      for (const v of views) {
        if (typeof v.severity === 'number') {
          try { v.severity = await (client as any).resolveIssueSeverityName(v.severity) ?? v.severity; } catch {}
        }
        if (typeof v.priority === 'number') {
          try { v.priority = await (client as any).resolveIssuePriorityName(v.priority) ?? v.priority; } catch {}
        }
        if (typeof v.type === 'number') {
          try { v.type = await (client as any).resolveIssueTypeName(v.type) ?? v.type; } catch {}
        }
      }
      return ok(views);
    }
  );

  // Sprints
  const toSprintView = (m: any) => ({
    id: m?.id,
    name: m?.name ?? null,
    start_date: m?.estimated_start || m?.start || m?.start_date || null,
    finish_date: m?.estimated_finish || m?.end || m?.finish_date || null,
    is_closed: m?.closed ?? m?.is_closed ?? null,
    created_date: m?.created_date ?? null,
    modified_date: m?.modified_date ?? null,
    project: m?.project ?? null
  });
  addTool(
    'taiga_sprints_list',
    'List sprints (milestones) for the active project. Output fields: id, name, start_date, finish_date, is_closed, created_date, modified_date, project.',
    {},
    async () => {
      const sprints = await client.listSprints();
      const arr = Array.isArray(sprints) ? sprints : [];
      return ok(arr.map(toSprintView));
    }
  );
  addTool(
    'taiga_issue_get',
    'Get an issue by ref (project-visible number). Args: ref: number.',
    { ref: z.number().int().positive().describe('Issue ref (project-visible number)') },
    async (args: any) => {
    const id = await (client as any).resolveIdByRef('issues', Number(args.ref));
    if (!id) throw new Error('ref is required');
    const issue = await client.getIssue(id);
    if (!issue) return ok(null);
    // Prepare sprint name map for completeness
    let sprintNameById = new Map<number, string>();
    let severityNameById = new Map<number, string>();
    let priorityNameById = new Map<number, string>();
    let typeNameById = new Map<number, string>();
    try {
      const sprints = await client.listSprints();
      for (const m of (Array.isArray(sprints) ? sprints : [])) {
        const mid = Number((m as any)?.id);
        const name = (m as any)?.name;
        if (!isNaN(mid) && name) sprintNameById.set(mid, String(name));
      }
      const [sevs, pris, tys] = await Promise.all([
        (client as any).listIssueSeverities?.().catch?.(() => []),
        (client as any).listIssuePriorities?.().catch?.(() => []),
        (client as any).listIssueTypes?.().catch?.(() => [])
      ]);
      for (const s of (Array.isArray(sevs) ? sevs : [])) {
        const id2 = Number((s as any)?.id); const name2 = (s as any)?.name;
        if (!isNaN(id2) && name2) severityNameById.set(id2, String(name2));
      }
      for (const p of (Array.isArray(pris) ? pris : [])) {
        const id2 = Number((p as any)?.id); const name2 = (p as any)?.name;
        if (!isNaN(id2) && name2) priorityNameById.set(id2, String(name2));
      }
      for (const t of (Array.isArray(tys) ? tys : [])) {
        const id2 = Number((t as any)?.id); const name2 = (t as any)?.name;
        if (!isNaN(id2) && name2) typeNameById.set(id2, String(name2));
      }
    } catch {}
    let comments: any[] = [];
    try {
      const raw = await client.listComments('issues', id);
      comments = Array.isArray(raw) ? raw.map((c: any) => ({
        created_date: c?.created_date ?? c?.date ?? null,
        author: c?.author ?? c?.user?.username ?? c?.owner_extra_info?.username ?? c?.user?.full_name_display ?? c?.user ?? null,
        text: c?.text ?? c?.comment ?? ''
      })) : [];
    } catch {}
    const base = toIssueView(issue, sprintNameById, { severityNameById, priorityNameById, typeNameById }) as any;
    if (typeof base.severity === 'number') {
      try { base.severity = await (client as any).resolveIssueSeverityName(base.severity) ?? base.severity; } catch {}
    }
    if (typeof base.priority === 'number') {
      try { base.priority = await (client as any).resolveIssuePriorityName(base.priority) ?? base.priority; } catch {}
    }
    if (typeof base.type === 'number') {
      try { base.type = await (client as any).resolveIssueTypeName(base.type) ?? base.type; } catch {}
    }
    return ok({ ...base, comments });
  }
  );
  addTool(
    'taiga_issue_create',
    'Create an issue in the active project. Args: body: object (must include at least subject; project is inferred). Example: { "body": { "subject": "Bug" } }',
    { body: z.any().describe('Issue payload') },
    async (args: any) => {
    const body = { ...(args?.body || {}) }; if (!Object.keys(body).length) throw new Error('body is required');
    if (typeof body.assigned_to === 'string' && body.assigned_to.trim()) body.assigned_to = await (client as any).resolveUserId(body.assigned_to);
    if (typeof body.owner === 'string' && body.owner.trim()) body.owner = await (client as any).resolveUserId(body.owner);
    if (typeof body.tags === 'string') body.tags = [body.tags]; if (Array.isArray(body.tags)) body.tags = body.tags.map((t: any) => [String(t), null]);
    // Resolve human-friendly issue fields: status, severity, priority, type, sprint
    // Status by name
    if (typeof body.status === 'string' && body.status.trim()) {
      const statuses = await client.listIssueStatuses();
      const wanted = body.status.trim().toLowerCase();
      const match = Array.isArray(statuses) ? statuses.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown issue status: ${body.status}`);
      body.status = match.id;
    }
    // Severity by name
    if (typeof body.severity === 'string' && body.severity.trim()) {
      const sevs = await (client as any).listIssueSeverities?.();
      const wanted = body.severity.trim().toLowerCase();
      const match = Array.isArray(sevs) ? sevs.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown issue severity: ${body.severity}`);
      body.severity = match.id;
    }
    // Priority by name
    if (typeof body.priority === 'string' && body.priority.trim()) {
      const pris = await (client as any).listIssuePriorities?.();
      const wanted = body.priority.trim().toLowerCase();
      const match = Array.isArray(pris) ? pris.find((p: any) => String(p.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown issue priority: ${body.priority}`);
      body.priority = match.id;
    }
    // Type by name
    if (typeof body.type === 'string' && body.type.trim()) {
      const tys = await (client as any).listIssueTypes?.();
      const wanted = body.type.trim().toLowerCase();
      const match = Array.isArray(tys) ? tys.find((t: any) => String(t.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown issue type: ${body.type}`);
      body.type = match.id;
    }
    // Sprint mapping (supports backlog clearing)
    if (body.hasOwnProperty('sprint')) {
      const ms = await resolveSprintInput(body.sprint);
      delete body.sprint;
      if (ms !== undefined) {
        if (ms === null) { delete (body as any).milestone; } else { body.milestone = ms; }
      }
    }
    await client.createIssue(body);
    return ok('issue created');
  }
  );
  addTool(
    'taiga_issue_update',
    'Update an issue by ref. Args: ref: number, patch: object. Accepts human-friendly values: status (name), severity (name), priority (name), type (name), sprint (name), tags (string or list). Example: { "ref": 1001, "patch": { "status": "In progress" } }',
    { ref: z.number().int().positive().describe('Issue ref (project-visible number)'), patch: z.any().describe('Partial issue patch') },
    async (args: any) => {
    const ref = Number(args?.ref); const patch = args?.patch;
    if (!ref) throw new Error('ref is required'); if (!patch) throw new Error('patch is required');
    const id = await (client as any).resolveIdByRef('issues', ref);
    if (!id) throw new Error(`issue with ref ${ref} not found`);
    const body = { ...(patch || {}) };
    if (typeof body.assigned_to === 'string' && body.assigned_to.trim()) body.assigned_to = await (client as any).resolveUserId(body.assigned_to);
    if (typeof body.owner === 'string' && body.owner.trim()) body.owner = await (client as any).resolveUserId(body.owner);
    if (typeof body.status === 'string' && body.status.trim()) {
      const statuses = await client.listIssueStatuses();
      const wanted = body.status.trim().toLowerCase();
      const match = Array.isArray(statuses) ? statuses.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown issue status: ${body.status}`);
      body.status = match.id;
    }
    if (typeof body.severity === 'string' && body.severity.trim()) {
      const sevs = await (client as any).listIssueSeverities?.();
      const wanted = body.severity.trim().toLowerCase();
      const match = Array.isArray(sevs) ? sevs.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown issue severity: ${body.severity}`);
      body.severity = match.id;
    }
    if (typeof body.priority === 'string' && body.priority.trim()) {
      const pris = await (client as any).listIssuePriorities?.();
      const wanted = body.priority.trim().toLowerCase();
      const match = Array.isArray(pris) ? pris.find((p: any) => String(p.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown issue priority: ${body.priority}`);
      body.priority = match.id;
    }
    if (typeof body.type === 'string' && body.type.trim()) {
      const tys = await (client as any).listIssueTypes?.();
      const wanted = body.type.trim().toLowerCase();
      const match = Array.isArray(tys) ? tys.find((t: any) => String(t.name).toLowerCase() === wanted) : undefined;
      if (!match) throw new Error(`Unknown issue type: ${body.type}`);
      body.type = match.id;
    }
    if (body.hasOwnProperty('sprint')) {
      const ms = await resolveSprintInput(body.sprint);
      delete body.sprint;
      if (ms !== undefined) {
        if (ms === null) { body.milestone = null as any; } else { body.milestone = ms; }
      }
    }
    if (typeof body.tags === 'string') body.tags = [body.tags];
    if (Array.isArray(body.tags)) body.tags = body.tags.map((t: any) => [String(t), null]);
    // Ensure version for optimistic concurrency if not provided
    try {
      if (body.version === undefined || body.version === null) {
        const current = await client.getIssue(id);
        if (!current) throw new Error(`Issue ${id} not found`);
        body.version = current.version;
      }
    } catch (e: any) { throw new Error(e?.message || String(e)); }
    await client.updateIssue(id, body);
    return ok(`issue ${ref} updated`);
  }
  );

  // Comment creation tools use ref (list endpoints removed; comments are available via *_get)
  for (const type of ['userstories','tasks','issues'] as Commentable[]) {
    addTool(
      `taiga_${type}_comments_create`,
      `Create a new comment on ${type} by resource ref. Args: ref: number, text: string. Example: { "ref": 123, "text": "Hello" }`,
      { ref: z.number().int().positive().describe(`${type} ref (project-visible number)`), text: z.string().min(1).describe('Comment text') },
      async (args: any) => {
      const ref = Number(args?.ref); const text = String(args?.text || '').trim();
      if (!ref) throw new Error('ref is required'); if (!text) throw new Error('text is required');
      const id = await (client as any).resolveIdByRef(type, ref);
      if (!id) throw new Error(`${type} with ref ${ref} not found`);
      await client.createComment(type, id, text);
      return ok(`${type} comment created`);
      }
    );
  }

  // Add back create comment for epics (list is removed; comments are available via epic_get)
  addTool(
    'taiga_epics_comments_create',
    'Create a new comment on an epic by epic ref. Args: ref: number, text: string. Example: { "ref": 123, "text": "Hello" }',
    { ref: z.number().int().positive().describe('Epic ref (project-visible number)'), text: z.string().min(1).describe('Comment text') },
    async (args: any) => {
      const ref = Number(args?.ref); const text = String(args?.text || '').trim();
      if (!ref) throw new Error('ref is required'); if (!text) throw new Error('text is required');
      const id = await (client as any).resolveIdByRef('epics', ref);
      if (!id) throw new Error(`epic with ref ${ref} not found`);
      await client.createComment('epics', id, text);
      return ok('epic comment created');
    }
  );

  // Back-compat alias for earlier tool name
  addTool(
    'taiga_list_epics',
    'Alias of taiga_epics_list. Lists epics in the active project. Args: none.',
    {},
    async () => ok(await client.listEpics())
  );

  // Promote a task into a user story (by task ref)
  addTool(
    'taiga_tasks_promote_to_userstory',
    'Promote a task (by ref) into a new user story in the same project. Options: keep_tags, sprint (name), assigned_to (username), epic_ref (number), userstory_status (name), close_task (bool), comment_text (string). Returns the new user story ref.',
    {
      ref: z.number().int().positive().describe('Task ref to promote'),
      options: z.object({
        keep_tags: z.boolean().optional().describe('Copy task tags to the new user story'),
        sprint: z.string().optional().describe('Sprint name for the new user story'),
        assigned_to: z.string().optional().describe('Username to assign the user story'),
        epic_ref: z.number().int().positive().optional().describe('Epic ref to link the new user story to'),
        userstory_status: z.string().optional().describe('User story status name (e.g., New)'),
        close_task: z.boolean().optional().describe('Close the original task after creating the user story'),
        comment_text: z.string().optional().describe('Additional comment to post on the task')
      }).optional()
    },
    async (args: any) => {
      const ref = Number(args?.ref); if (!ref) throw new Error('ref is required');
      const id = await (client as any).resolveIdByRef('tasks', ref);
      if (!id) throw new Error(`task with ref ${ref} not found`);
      const task = await client.getTask(id);
      if (!task) throw new Error(`task ${ref} not found`);

      const opts = args?.options || {};
      const payload: any = {
        subject: task.subject || `Promoted from task ${task.ref}`,
        description: task.description || ''
      };
      // Tags
      if (opts.keep_tags && Array.isArray(task.tags)) {
        const tagNames = task.tags.map((x: any) => Array.isArray(x) ? String(x[0]) : String(x)).filter(Boolean);
        payload.tags = tagNames.map((t: string) => [t, null]);
      }
      // Assigned_to
      if (typeof opts.assigned_to === 'string' && opts.assigned_to.trim()) {
        payload.assigned_to = await (client as any).resolveUserId(opts.assigned_to);
      } else if (task.assigned_to) {
        payload.assigned_to = task.assigned_to;
      }
      // Sprint mapping (supports backlog clearing)
      if (opts.hasOwnProperty('sprint')) {
        const ms = await resolveSprintInput(opts.sprint);
        if (ms === null) { delete (payload as any).milestone; }
        else if (ms !== undefined) { payload.milestone = ms; }
        else if (task.milestone) { payload.milestone = task.milestone; }
      } else if (task.milestone) {
        payload.milestone = task.milestone;
      }
      // User story status by name
      if (typeof opts.userstory_status === 'string' && opts.userstory_status.trim()) {
        const statuses = await client.listUserStoryStatuses();
        const wanted = opts.userstory_status.trim().toLowerCase();
        const match = Array.isArray(statuses) ? statuses.find((s: any) => String(s.name).toLowerCase() === wanted) : undefined;
        if (!match) throw new Error(`Unknown user story status: ${opts.userstory_status}`);
        payload.status = match.id;
      }

      // Create the user story
      const us = await client.createUserStory(payload);
      // Optionally link to epic by ref
      if (opts.epic_ref) {
        const epicId = await (client as any).resolveIdByRef('epics', Number(opts.epic_ref));
        if (!epicId) throw new Error(`epic with ref ${opts.epic_ref} not found`);
        try { await (client as any).linkEpicToUserStory?.(epicId, us.id); } catch {}
      }
      // Post a comment back on the task referencing new user story
      const linkText = `Promoted to user story #${us.ref}.`;
      const extra = opts.comment_text ? ` ${String(opts.comment_text)}` : '';
      try { await client.createComment('tasks', id, linkText + extra); } catch {}
      // Optionally close task
      if (opts.close_task) {
        try {
          const statuses = await client.listTaskStatuses();
          const closed = (Array.isArray(statuses) ? statuses : []).find((s: any) => !!s.is_closed);
          const current = await client.getTask(id);
          if (closed && current) {
            await client.updateTask(id, { status: closed.id, version: current.version });
          }
        } catch {}
      }
      return ok(`promoted to user story ${us.ref}`);
    }
  );

  // Expose a debug tool returning visible tool metadata captured at registration time
  if (debugEnabled && (server as any).tool) {
    try {
      (server as any).tool('taiga_debug_tools_list', 'List tool metadata captured during registration.', async () => {
        return ok({ tools: debugRegistry });
      });
    } catch {}
  }
  // Persist debug registry to a temp file for offline inspection regardless of tool visibility
  try {
    const dir = path.join(os.tmpdir(), 'taiga-mcp');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'last-tools.json');
    fs.writeFileSync(file, JSON.stringify({ ts: new Date().toISOString(), tools: debugRegistry }, null, 2), 'utf8');
  } catch {}
}
