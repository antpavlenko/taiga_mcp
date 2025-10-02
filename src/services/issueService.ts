import { TaigaApiClient } from '../api/taigaApiClient';
import { ID, Issue } from '../models/types';

export class IssueService {
  constructor(private api: TaigaApiClient) {}

  async listIssues(projectId: number, includeClosed: boolean, milestoneId?: number | null): Promise<Issue[]> {
    const query: any = { project: projectId };
    if (!includeClosed) { (query as any)['status__is_closed'] = false; }
    if (milestoneId === null) { (query as any)['milestone__isnull'] = true; }
    else if (typeof milestoneId === 'number') { (query as any)['milestone'] = milestoneId; }
    const { data, error } = await this.api.get<any>('/issues', { query });
    if (error || data == null) return [];
    if (Array.isArray(data)) return data as Issue[];
    if (Array.isArray((data as any).results)) return (data as any).results as Issue[];
    return [];
  }

  async createIssue(input: { projectId: ID; subject: string; description?: string; statusId?: ID; assignedTo?: ID; tags?: string[]; dueDate?: string; typeId?: ID; severityId?: ID; priorityId?: ID; milestoneId?: ID; isBlocked?: boolean; blockedReason?: string }): Promise<Issue | undefined> {
    const payload: any = { project: input.projectId, subject: input.subject };
    if (input.description !== undefined) payload.description = input.description;
    if (input.statusId !== undefined) payload.status = input.statusId;
    if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo;
    if (input.tags !== undefined) payload.tags = input.tags;
    if (input.dueDate !== undefined) payload.due_date = input.dueDate;
    if (input.typeId !== undefined) payload.type = input.typeId;
    if (input.severityId !== undefined) payload.severity = input.severityId;
    if (input.priorityId !== undefined) payload.priority = input.priorityId;
    if (input.milestoneId !== undefined) payload.milestone = input.milestoneId;
    if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;
    if (input.blockedReason !== undefined) payload.blocked_note = input.blockedReason;
    const { data, error } = await this.api.post<Issue>('/issues', payload);
    if (error) return undefined;
    return data as Issue;
  }

  async updateIssue(id: ID, input: { subject?: string | null; description?: string | null; statusId?: ID | null; assignedTo?: ID | null; tags?: string[]; dueDate?: string | null; typeId?: ID | null; severityId?: ID | null; priorityId?: ID | null; milestoneId?: ID | null; isBlocked?: boolean | null; blockedReason?: string | null; version?: number }): Promise<Issue | undefined> {
    const payload: any = {};
    if (input.subject !== undefined) payload.subject = input.subject;
    if (input.description !== undefined) payload.description = input.description;
    if (input.statusId !== undefined) payload.status = input.statusId;
    if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo;
    if (input.tags !== undefined) payload.tags = input.tags;
    if (input.dueDate !== undefined) payload.due_date = input.dueDate;
    if (input.typeId !== undefined) payload.type = input.typeId;
    if (input.severityId !== undefined) payload.severity = input.severityId;
    if (input.priorityId !== undefined) payload.priority = input.priorityId;
    if (input.milestoneId !== undefined) payload.milestone = input.milestoneId;
    if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;
    if (input.blockedReason !== undefined) payload.blocked_note = input.blockedReason;
    if (input.version !== undefined) payload.version = input.version;
    const { data, error } = await this.api.patch<Issue>(`/issues/${id}`, payload);
    if (error) return undefined;
    return data as Issue;
  }

  async deleteIssue(id: ID): Promise<boolean> {
    const { status, error } = await this.api.delete(`/issues/${id}`);
    return !error && status >= 200 && status < 300;
  }

  async listIssueStatuses(projectId: number): Promise<Array<{ id: ID; name: string; slug?: string }>> {
    const { data, error } = await this.api.get<any>('/issue-statuses', { query: { project: projectId } });
    if (error || data == null) return [];
    const arr = Array.isArray(data) ? data : (Array.isArray((data as any).results) ? (data as any).results : []);
    const seen = new Set<string>();
    const out: Array<{ id: ID; name: string; slug?: string }> = [];
    for (const s of arr as any[]) {
      const key = String((s as any)?.id);
      if (!seen.has(key)) { seen.add(key); out.push({ id: (s as any).id, name: (s as any).name, slug: (s as any).slug }); }
    }
    return out;
  }

  async listIssueTypes(projectId: number): Promise<Array<{ id: ID; name: string; slug?: string }>> {
    // Try with project filter; if empty or error, retry without filter
    let data: any, error: any;
    ({ data, error } = await this.api.get<any>('/issue-types', { query: { project: projectId } }));
    if (error || data == null || (Array.isArray(data) && data.length === 0) || ((data as any)?.results && (data as any).results.length === 0)) {
      ({ data, error } = await this.api.get<any>('/issue-types'));
    }
    if (error || data == null) return [];
    const arr = Array.isArray(data) ? data : (Array.isArray((data as any).results) ? (data as any).results : []);
    const seen = new Set<string>();
  const out: Array<{ id: ID; name: string; slug?: string }> = [] as any;
    for (const s of arr as any[]) {
      const key = String((s as any)?.id);
      if (!seen.has(key)) { seen.add(key); out.push({ id: (s as any).id, name: (s as any).name, slug: (s as any).slug }); }
    }
    return out;
  }

  async listIssueSeverities(projectId: number): Promise<Array<{ id: ID; name: string; slug?: string }>> {
    // Try known endpoints: /issue-severities, /severities with and without project filter
    let data: any = null, error: any = null;
    // /issue-severities?project=ID
    ({ data, error } = await this.api.get<any>('/issue-severities', { query: { project: projectId } }));
    let arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.results) ? (data as any).results : []);
    // /issue-severities (no filter)
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get<any>('/issue-severities'));
      arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.results) ? (data as any).results : []);
    }
    // /severities?project=ID (observed on this server)
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get<any>('/severities', { query: { project: projectId } }));
      arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.results) ? (data as any).results : []);
    }
    // /severities (no filter)
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get<any>('/severities'));
      arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.results) ? (data as any).results : []);
    }
    if (error || data == null) return [];
    const seen = new Set<string>();
  const out: Array<{ id: ID; name: string; slug?: string }> = [] as any;
    for (const s of arr as any[]) {
      const key = String((s as any)?.id);
      if (!seen.has(key)) { seen.add(key); out.push({ id: (s as any).id, name: (s as any).name, slug: (s as any).slug }); }
    }
    return out;
  }

  async listIssuePriorities(projectId: number): Promise<Array<{ id: ID; name: string; slug?: string }>> {
    // Priorities endpoint varies; try /priorities with project, then /issue-priorities, then without project
    let data: any, error: any;
    ({ data, error } = await this.api.get<any>('/priorities', { query: { project: projectId } }));
    let arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.results) ? (data as any).results : []);
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get<any>('/issue-priorities', { query: { project: projectId } }));
      arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.results) ? (data as any).results : []);
    }
    if (error || data == null || arr.length === 0) {
      ({ data, error } = await this.api.get<any>('/priorities'));
      arr = Array.isArray(data) ? data : (Array.isArray((data as any)?.results) ? (data as any).results : []);
    }
    if (error || data == null) return [];
    const seen = new Set<string>();
  const out: Array<{ id: ID; name: string; slug?: string }> = [] as any;
    for (const s of arr as any[]) {
      const key = String((s as any)?.id);
      if (!seen.has(key)) { seen.add(key); out.push({ id: (s as any).id, name: (s as any).name, slug: (s as any).slug }); }
    }
    return out;
  }
}
