import { TaigaApiClient } from '../api/taigaApiClient';
import { ID, Sprint } from '../models/types';

export interface CreateSprintInput { projectId: ID; name: string; startDate?: string; endDate?: string; }
export interface UpdateSprintInput { name?: string | null; startDate?: string | null; endDate?: string | null; closed?: boolean; }

export class SprintService {
  constructor(private api: TaigaApiClient) {}

  async listSprints(projectId: number): Promise<Sprint[]> {
    const { data, error } = await this.api.get<any>('/milestones', { query: { project: projectId } });
    if (error || data == null) return [];
    if (Array.isArray(data)) return data as Sprint[];
    if (Array.isArray((data as any).results)) return (data as any).results as Sprint[];
    return [];
  }

  async createSprint(input: CreateSprintInput): Promise<Sprint | undefined> {
    const payload: any = { project: input.projectId, name: input.name };
    if (input.startDate !== undefined) payload.estimated_start = input.startDate;
    if (input.endDate !== undefined) payload.estimated_finish = input.endDate;
    const { data, error } = await this.api.post<Sprint>('/milestones', payload);
    if (error) return undefined;
    return data as Sprint;
  }

  async updateSprint(id: ID, input: UpdateSprintInput): Promise<Sprint | undefined> {
    const payload: any = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.startDate !== undefined) payload.estimated_start = input.startDate;
    if (input.endDate !== undefined) payload.estimated_finish = input.endDate;
    if (input.closed !== undefined) payload.closed = input.closed;
    const { data, error } = await this.api.patch<Sprint>(`/milestones/${id}`, payload);
    if (error) return undefined;
    return data as Sprint;
  }

  async deleteSprint(id: ID): Promise<boolean> {
    const { status, error } = await this.api.delete(`/milestones/${id}`);
    return !error && status >= 200 && status < 300;
  }

  async getSprint(id: ID): Promise<Sprint | undefined> {
    const { data, error } = await this.api.get<Sprint>(`/milestones/${id}`);
    if (error) return undefined;
    return data as Sprint;
  }
}
