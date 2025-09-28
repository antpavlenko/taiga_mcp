import { TaigaApiClient } from '../api/taigaApiClient';
import { UserRef } from '../models/types';

export class UserService {
  constructor(private api: TaigaApiClient) {}

  async listProjectUsers(projectId: number): Promise<UserRef[]> {
    // Try memberships endpoint first
    const { data, error } = await this.api.get<any>('/memberships', { query: { project: projectId } });
    if (!error && data) {
      const arr = Array.isArray(data) ? data : Array.isArray((data as any).results) ? (data as any).results : [];
      if (Array.isArray(arr)) {
        const mapped = arr.map((m: any) => {
          // Taiga memberships sometimes return user as object, sometimes just an ID
          const u = (typeof m.user === 'object' && m.user) ? m.user : (typeof m.member === 'object' && m.member) ? m.member : undefined;
          const id = u?.id ?? m.user ?? m.member;
          const usernameFromUser = u?.username || u?.user_name || u?.email;
          const fullNameFromUser = u?.full_name || u?.fullName || u?.user_full_name;
          // When no embedded user object, memberships often include full_name and user_email
          const usernameFromMembership = m.user_email || m.email || (typeof id !== 'undefined' ? String(id) : undefined);
          const fullNameFromMembership = m.full_name || m.user_full_name || undefined;
          const username = usernameFromUser || usernameFromMembership;
          const fullName = fullNameFromUser || fullNameFromMembership;
          return { id, username, fullName } as UserRef;
        }).filter((u: UserRef) => u.id !== undefined && u.id !== null);
        if (mapped.length) return mapped;
      }
    }
    // Fallback: users endpoint by project filter
    const { data: data2 } = await this.api.get<any>('/users', { query: { project: projectId } });
    const arr2 = Array.isArray(data2) ? data2 : Array.isArray((data2 as any)?.results) ? (data2 as any).results : [];
    return (arr2 || []).map((u: any) => ({ id: u.id, username: u.username || u.email || String(u.id), fullName: u.full_name || u.fullName } as UserRef));
  }
}
