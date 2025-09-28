import { TaigaApiClient } from '../api/taigaApiClient';
import { ID, UserStory } from '../models/types';

export class UserStoryService {
  constructor(private api: TaigaApiClient) {}

  async listUserStories(projectId: number, opts?: { milestoneId?: number | null }): Promise<UserStory[]> {
    const query: Record<string, any> = { project: projectId };
    if (opts) {
      if (opts.milestoneId === null) query['milestone__isnull'] = true;
      else if (typeof opts.milestoneId === 'number') query['milestone'] = opts.milestoneId;
    }
    const { data, error } = await this.api.get<any>('/userstories', { query });
    if (error || data == null) return [];
    if (Array.isArray(data)) return data as UserStory[];
    if (Array.isArray((data as any).results)) return (data as any).results as UserStory[];
    return [];
  }

  async createUserStory(input: { projectId: ID; subject: string; description?: string; epicId?: ID; epicIds?: ID[]; milestoneId?: ID; statusId?: ID; assignedTo?: ID; tags?: string[]; isBlocked?: boolean; isPrivate?: boolean; teamRequirement?: boolean; clientRequirement?: boolean; dueDate?: string; points?: Record<string | number, number>; }): Promise<UserStory | undefined> {
    const payload: any = { project: input.projectId, subject: input.subject };
    if (input.description !== undefined) payload.description = input.description;
    // Do not send epic/epics in payload; we'll link via related_userstories endpoint after creation
    if (input.milestoneId !== undefined) payload.milestone = input.milestoneId;
    if (input.statusId !== undefined) payload.status = input.statusId;
    if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo;
    if (input.tags !== undefined) payload.tags = input.tags;
    if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;
    if (input.isPrivate !== undefined) payload.is_private = input.isPrivate;
  if (input.teamRequirement !== undefined) payload.team_requirement = input.teamRequirement;
  if (input.clientRequirement !== undefined) payload.client_requirement = input.clientRequirement;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate;
  if (input.points !== undefined) payload.points = input.points;
    const { data, error } = await this.api.post<UserStory>('/userstories', payload);
    if (error || !data) return undefined;
    const created = data as any;
    // Link epics if provided
    const epicIds = (input.epicIds && Array.isArray(input.epicIds)) ? input.epicIds : (input.epicId != null ? [input.epicId] : []);
    if (created?.id && epicIds && epicIds.length) {
      for (const eid of epicIds) {
        await this.linkEpicToUserStory(eid as ID, created.id as ID);
      }
      // fetch updated story to include epics array
      return await this.getUserStory(created.id as ID) || (created as UserStory);
    }
    return created as UserStory;
  }

  async updateUserStory(id: ID, input: { subject?: string | null; description?: string | null; epicId?: ID | null; epicIds?: ID[]; milestoneId?: ID | null; statusId?: ID | null; assignedTo?: ID | null; tags?: string[]; isBlocked?: boolean | null; isPrivate?: boolean | null; teamRequirement?: boolean | null; clientRequirement?: boolean | null; dueDate?: string | null; points?: Record<string | number, number>; version?: number; }): Promise<UserStory | undefined> {
    const payload: any = {};
    if (input.subject !== undefined) payload.subject = input.subject;
    if (input.description !== undefined) payload.description = input.description;
    // Do not send epic/epics in patch; link after update
    if (input.milestoneId !== undefined) payload.milestone = input.milestoneId;
    if (input.statusId !== undefined) payload.status = input.statusId;
    if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo;
    if (input.tags !== undefined) payload.tags = input.tags;
    if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;
    if (input.isPrivate !== undefined) payload.is_private = input.isPrivate;
  if (input.teamRequirement !== undefined) payload.team_requirement = input.teamRequirement;
  if (input.clientRequirement !== undefined) payload.client_requirement = input.clientRequirement;
  if (input.dueDate !== undefined) payload.due_date = input.dueDate;
  if (input.points !== undefined) payload.points = input.points;
    if (input.version !== undefined) payload.version = input.version;
    const { data, error } = await this.api.patch<UserStory>(`/userstories/${id}`, payload);
    if (error) return undefined;
    const updated = data as any;
    // Handle epic links: add new ones and remove unselected using documented endpoints
    if (input.epicIds !== undefined) {
      const desired = new Set((input.epicIds || []).map((x:any)=>Number(x)).filter((n:number)=>!isNaN(n)));
      // Get current links
      const cur = await this.getUserStory(id);
      const currentIds = new Set(((cur as any)?.epics || []).map((e:any)=>Number(e?.id)).filter((n:number)=>!isNaN(n)));
      for (const eid of desired) {
        if (!currentIds.has(eid)) await this.linkEpicToUserStory(eid as ID, id);
      }
      // Remove links that are not desired anymore
      for (const eid of currentIds) {
        const num = Number(eid);
        if (!desired.has(num)) await this.unlinkEpicFromUserStory(num as ID, id);
      }
      return await this.getUserStory(id) || (updated as UserStory);
    }
    return updated as UserStory;
  }

  async deleteUserStory(id: ID): Promise<boolean> {
    const { status, error } = await this.api.delete(`/userstories/${id}`);
    return !error && status >= 200 && status < 300;
  }

  async getUserStory(id: ID): Promise<UserStory | undefined> {
    const { data, error } = await this.api.get<UserStory>(`/userstories/${id}`);
    if (error) return undefined;
    return data as UserStory;
  }

  // Link a user story to an epic using nested endpoint: POST /epics/{epicId}/related_userstories
  private async linkEpicToUserStory(epicId: ID, userStoryId: ID): Promise<boolean> {
    const body = { epic: epicId, user_story: userStoryId } as any;
    const { status, error } = await (this.api as any).post?.(`/epics/${epicId}/related_userstories`, body) || { status: 0, error: { message: 'POST not implemented', category: 'unknown' } };
    return !error && status >= 200 && status < 300;
  }

  // Unlink a user story from an epic: DELETE /epics/{epicId}/related_userstories/{userStoryId}
  private async unlinkEpicFromUserStory(epicId: ID, userStoryId: ID): Promise<boolean> {
    const { status, error } = await (this.api as any).delete?.(`/epics/${epicId}/related_userstories/${userStoryId}`) || { status: 0, error: { message: 'DELETE not implemented', category: 'unknown' } };
    return !error && status >= 200 && status < 300;
  }

  async listUserStoryStatuses(projectId: number): Promise<Array<{ id: ID; name: string; slug?: string; color?: string }>> {
    const { data, error } = await this.api.get<any>('/userstory-statuses', { query: { project: projectId } });
    if (error || data == null) return [];
    let arr = Array.isArray(data) ? data : (Array.isArray((data as any).results) ? (data as any).results : []);
    // Filter by project when records expose a project field
    arr = (arr as any[]).filter((s: any) => {
      const p = (s?.projectId ?? s?.project_id ?? s?.project);
      // Accept if no project field, or if numeric/string matches, or if it's an object with id/pk matching
      if (p == null) return true;
      const val = typeof p === 'object' ? (('id' in p ? p.id : ('pk' in p ? p.pk : undefined))) : p;
      return String(val) === String(projectId);
    });
    // Deduplicate by id
    const seen = new Set<string>();
    const out: Array<{ id: ID; name: string; slug?: string; color?: string }> = [];
    for (const s of arr as any[]) {
      const key = String((s as any)?.id);
      if (!seen.has(key)) { seen.add(key); out.push(s as any); }
    }
    return out;
  }

  async listRoles(projectId: number): Promise<Array<{ id: ID; name: string; slug?: string; computable?: boolean }>> {
    const { data, error } = await this.api.get<any>('/roles', { query: { project: projectId } });
    if (error || data == null) return [];
    const arr = Array.isArray(data) ? data : (Array.isArray((data as any).results) ? (data as any).results : []);
    // De-duplicate by id
    const seen = new Set<string>();
    const out: Array<{ id: ID; name: string; slug?: string; computable?: boolean }> = [];
    for (const r of arr as any[]) {
      const key = String((r as any)?.id);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ id: (r as any).id, name: (r as any).name, slug: (r as any).slug, computable: (r as any).computable });
      }
    }
    return out;
  }

  async listPoints(projectId: number): Promise<Array<{ id: ID; name?: string; value?: number }>> {
    const { data, error } = await this.api.get<any>('/points', { query: { project: projectId } });
    if (error || data == null) return [];
    let arr = Array.isArray(data) ? data : (Array.isArray((data as any).results) ? (data as any).results : []);
    // Filter by project when available
    arr = (arr as any[]).filter((p: any) => {
      const proj = (p?.projectId ?? p?.project_id ?? p?.project);
      if (proj == null) return true;
      const val = typeof proj === 'object' ? (('id' in proj ? proj.id : ('pk' in proj ? proj.pk : undefined))) : proj;
      return String(val) === String(projectId);
    });
    // Deduplicate by id
    const seen = new Set<string>();
    const out: Array<{ id: ID; name?: string; value?: number }> = [];
    for (const p of arr as any[]) {
      const key = String((p as any)?.id);
      if (!seen.has(key)) { seen.add(key); out.push(p as any); }
    }
    return out;
  }

  // Public wrappers for epic linking
  async addUserStoryToEpic(epicId: ID, userStoryId: ID): Promise<boolean> {
    return this.linkEpicToUserStory(epicId, userStoryId);
  }

  async removeUserStoryFromEpic(epicId: ID, userStoryId: ID): Promise<boolean> {
    return this.unlinkEpicFromUserStory(epicId, userStoryId);
  }

  // List user stories linked to a given epic within a project (best-effort client-side filter)
  async listUserStoriesForEpic(projectId: number, epicId: ID): Promise<UserStory[]> {
    const all = await this.listUserStories(projectId);
    const target = String(epicId);
    return (all as any[]).filter((s: any) => {
      const single = s?.epicId ?? s?.epic;
      const singleId = (single && typeof single === 'object') ? (single.id ?? single.pk ?? undefined) : single;
      if (singleId != null && String(singleId) === target) return true;
      const arr = Array.isArray(s?.epics) ? s.epics : [];
      return arr.some((e: any) => String((e && typeof e === 'object') ? (e.id ?? e.pk ?? e) : e) === target);
    });
  }

  // List user stories not linked to a given epic (for "Add existing…" picker)
  async listUserStoriesNotInEpic(projectId: number, epicId: ID): Promise<UserStory[]> {
    const all = await this.listUserStories(projectId);
    const target = String(epicId);
    return (all as any[]).filter((s: any) => {
      const single = s?.epicId ?? s?.epic;
      const singleId = (single && typeof single === 'object') ? (single.id ?? single.pk ?? undefined) : single;
      if (singleId != null && String(singleId) === target) return false;
      const arr = Array.isArray(s?.epics) ? s.epics : [];
      return !arr.some((e: any) => String((e && typeof e === 'object') ? (e.id ?? e.pk ?? e) : e) === target);
    });
  }
}
