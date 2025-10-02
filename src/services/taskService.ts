import { TaigaApiClient } from '../api/taigaApiClient';
import { ID, Task } from '../models/types';

export interface CreateTaskInput { projectId: ID; userStoryId: ID; subject: string; description?: string; statusId?: ID; assignedTo?: ID; dueDate?: string; tags?: string[]; isBlocked?: boolean; blockedReason?: string; }
export interface UpdateTaskInput { subject?: string | null; description?: string | null; statusId?: ID | null; assignedTo?: ID | null; userStoryId?: ID | null; dueDate?: string | null; tags?: string[]; isBlocked?: boolean | null; blockedReason?: string | null; version?: number; }

export class TaskService {
  constructor(private api: TaigaApiClient) {}

  async listTasksByUserStory(userStoryId: number): Promise<Task[]> {
    const { data, error } = await this.api.get<any>('/tasks', { query: { user_story: userStoryId } });
    if (error || data == null) return [];
    if (Array.isArray(data)) return data as Task[];
    if (Array.isArray((data as any).results)) return (data as any).results as Task[];
    return [];
  }

  async listTasksByProject(projectId: number): Promise<Task[]> {
    const { data, error } = await this.api.get<any>('/tasks', { query: { project: projectId } });
    if (error || data == null) return [];
    if (Array.isArray(data)) return data as Task[];
    if (Array.isArray((data as any).results)) return (data as any).results as Task[];
    return [];
  }

  async createTask(input: CreateTaskInput): Promise<Task | undefined> {
    const payload: any = { project: input.projectId, user_story: input.userStoryId, subject: input.subject };
    if (input.description !== undefined) payload.description = input.description;
    if (input.statusId !== undefined) payload.status = input.statusId;
    if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo;
    if (input.dueDate !== undefined) payload.due_date = input.dueDate;
    if (input.tags !== undefined) payload.tags = input.tags;
  if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;
  if (input.blockedReason !== undefined) payload.blocked_note = input.blockedReason;
    const { data, error } = await this.api.post<Task>('/tasks', payload);
    if (error) return undefined;
    return data as Task;
  }

  async updateTask(id: ID, input: UpdateTaskInput): Promise<Task | undefined> {
    const payload: any = {};
    if (input.subject !== undefined) payload.subject = input.subject;
    if (input.description !== undefined) payload.description = input.description;
    if (input.statusId !== undefined) payload.status = input.statusId;
    if (input.assignedTo !== undefined) payload.assigned_to = input.assignedTo;
    if (input.userStoryId !== undefined) payload.user_story = input.userStoryId;
    if (input.dueDate !== undefined) payload.due_date = input.dueDate;
    if (input.tags !== undefined) payload.tags = input.tags;
  if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;
  if (input.blockedReason !== undefined) payload.blocked_note = input.blockedReason;
    if (input.version !== undefined) payload.version = input.version;
    const { data, error } = await this.api.patch<Task>(`/tasks/${id}`, payload);
    if (error) return undefined;
    return data as Task;
  }

  async deleteTask(id: ID): Promise<boolean> {
    const { status, error } = await this.api.delete(`/tasks/${id}`);
    return !error && status >= 200 && status < 300;
  }

  async getTask(id: ID): Promise<Task | undefined> {
    const { data, error } = await this.api.get<Task>(`/tasks/${id}`);
    if (error) return undefined;
    return data as Task;
  }

  async listTaskStatuses(projectId: number): Promise<Array<{ id: ID; name: string; slug?: string }>> {
    const { data, error } = await this.api.get<any>('/task-statuses', { query: { project: projectId } });
    if (error || data == null) return [];
    const arr = Array.isArray(data) ? data : (Array.isArray((data as any).results) ? (data as any).results : []);
    // Deduplicate by id
    const seen = new Set<string>();
    const out: Array<{ id: ID; name: string; slug?: string }> = [];
    for (const s of arr as any[]) {
      const key = String((s as any)?.id);
      if (!seen.has(key)) { seen.add(key); out.push({ id: (s as any).id, name: (s as any).name, slug: (s as any).slug }); }
    }
    return out;
  }

  async listTasksNotInStory(projectId: number, userStoryId: number): Promise<Task[]> {
    const all = await this.listTasksByProject(projectId);
    const target = String(userStoryId);
    return (all as any[]).filter((t: any) => String(t?.user_story ?? t?.userStoryId ?? '') !== target);
  }
}
