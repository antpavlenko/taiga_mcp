import { TaigaApiClient } from '../api/taigaApiClient';
import { Epic, ID } from '../models/types';

export interface EpicStatus { id: ID; name: string; color?: string; slug?: string }
export interface CreateEpicInput {
  projectId: ID;
  title: string; // maps to 'subject'
  description?: string;
  color?: string;
  teamRequirement?: boolean;
  clientRequirement?: boolean;
  isBlocked?: boolean;
  statusId?: ID;
  tags?: string[];
  assignedTo?: ID;
}
export interface UpdateEpicInput {
  title?: string | null; // maps to 'subject'
  description?: string | null;
  color?: string | null;
  teamRequirement?: boolean;
  clientRequirement?: boolean;
  isBlocked?: boolean;
  statusId?: ID | null;
  tags?: string[];
  assignedTo?: ID | null;
  version?: number;
}

export class EpicService {
  constructor(private api: TaigaApiClient) {}

  async listEpics(projectId: number): Promise<Epic[]> {
    const { data, error } = await this.api.get<any>('/epics', { query: { project: projectId } });
    if (error || data == null) return [];
    if (Array.isArray(data)) return data as Epic[];
    if (Array.isArray((data as any).results)) return (data as any).results as Epic[];
    return [];
  }

  async listEpicStatuses(projectId: number): Promise<EpicStatus[]> {
    const { data, error } = await (this.api as any).get?.('/epic-statuses', { query: { project: projectId } });
    if (error || !data) return [];
    if (Array.isArray(data)) return data as EpicStatus[];
    if (Array.isArray((data as any).results)) return (data as any).results as EpicStatus[];
    return [];
  }

  async getEpic(id: ID): Promise<Epic | undefined> {
    const { data, error } = await (this.api as any).get?.(`/epics/${id}`);
    if (error) return undefined;
    return data as Epic;
  }

  async createEpic(input: CreateEpicInput): Promise<Epic | undefined> {
    const payload: any = {
      project: input.projectId,
      subject: input.title,
    };
    if (input.description !== undefined) payload.description = input.description;
    if (input.color !== undefined) payload.color = input.color;
    if (input.teamRequirement !== undefined) payload.team_requirement = input.teamRequirement;
    if (input.clientRequirement !== undefined) payload.client_requirement = input.clientRequirement;
    if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;
    if (input.statusId !== undefined) payload.status = input.statusId;
    if (input.tags !== undefined) payload.tags = input.tags;
    if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo;
    const { data, error } = await (this.api as any).post?.('/epics', payload) || { data: undefined, error: { message: 'POST not implemented', category: 'unknown' } };
    if (error) return undefined;
    return data as Epic;
  }

  async updateEpic(id: ID, input: UpdateEpicInput): Promise<Epic | undefined> {
    const payload: any = {};
    if (input.title !== undefined) payload.subject = input.title;
    if (input.description !== undefined) payload.description = input.description;
    if (input.color !== undefined) payload.color = input.color;
    if (input.teamRequirement !== undefined) payload.team_requirement = input.teamRequirement;
    if (input.clientRequirement !== undefined) payload.client_requirement = input.clientRequirement;
    if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;
    if (input.statusId !== undefined) payload.status = input.statusId;
    if (input.tags !== undefined) payload.tags = input.tags;
    if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo;
    if (input.version !== undefined) payload.version = input.version;
    const { data, error } = await (this.api as any).patch?.(`/epics/${id}`, payload) || { data: undefined, error: { message: 'PATCH not implemented', category: 'unknown' } };
    if (error) return undefined;
    return data as Epic;
  }

  async deleteEpic(id: ID): Promise<boolean> {
    const { status, error } = await (this.api as any).delete?.(`/epics/${id}`) || { status: 0, error: { message: 'DELETE not implemented', category: 'unknown' } };
    return !error && status >= 200 && status < 300;
  }
}
