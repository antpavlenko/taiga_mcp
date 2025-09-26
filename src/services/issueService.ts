import { TaigaApiClient } from '../api/taigaApiClient';
import { Issue } from '../models/types';

export class IssueService {
  constructor(private api: TaigaApiClient) {}

  async listIssues(projectId: number): Promise<Issue[]> {
    const { data, error } = await this.api.get<any>('/issues', { query: { project: projectId } });
    if (error || data == null) return [];
    if (Array.isArray(data)) return data as Issue[];
    if (Array.isArray((data as any).results)) return (data as any).results as Issue[];
    return [];
  }
}
