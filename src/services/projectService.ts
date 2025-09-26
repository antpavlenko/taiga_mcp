import { TaigaApiClient } from '../api/taigaApiClient';
import { Project } from '../models/types';

export class ProjectService {
  constructor(private api: TaigaApiClient) {}

  async listProjects(): Promise<Project[]> {
    const { data, error } = await this.api.get<any>('/projects');
    if (error || data == null) return [];
    // Support both array and paginated object shapes
    if (Array.isArray(data)) return data as Project[];
    if (Array.isArray((data as any).results)) return (data as any).results as Project[];
    return [];
  }
}
