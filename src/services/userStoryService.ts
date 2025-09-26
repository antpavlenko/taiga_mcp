import { TaigaApiClient } from '../api/taigaApiClient';
import { UserStory } from '../models/types';

export class UserStoryService {
  constructor(private api: TaigaApiClient) {}

  async listUserStories(projectId: number): Promise<UserStory[]> {
    const { data, error } = await this.api.get<any>('/userstories', { query: { project: projectId } });
    if (error || data == null) return [];
    if (Array.isArray(data)) return data as UserStory[];
    if (Array.isArray((data as any).results)) return (data as any).results as UserStory[];
    return [];
  }
}
