export type ID = number;
export type ISODate = string;

export interface UserRef { id: ID; username: string; fullName?: string; }

export interface Project { id: ID; name: string; slug?: string; description?: string; }

// Expanded models based on requirements
export interface Epic { id: ID; projectId: ID; title: string; description?: string; color?: string; statusId?: ID; createdDate?: ISODate; modifiedDate?: ISODate; userStoryIds?: ID[]; }

export interface Sprint { id: ID; projectId: ID; name: string; description?: string; startDate?: ISODate; endDate?: ISODate; closed?: boolean; createdDate?: ISODate; modifiedDate?: ISODate; }

export interface UserStory { id: ID; projectId: ID; subject: string; statusId: ID; createdDate: ISODate; modifiedDate: ISODate; ref?: number; epicId?: ID; milestoneId?: ID | null; }

export interface Task { id: ID; projectId: ID; userStoryId: ID; subject: string; statusId: ID; createdDate?: ISODate; modifiedDate?: ISODate; }

export interface NormalizedError {
  category: 'auth' | 'not_found' | 'validation' | 'rate_limit' | 'network' | 'server' | 'unknown';
  httpStatus?: number;
  message: string;
  details?: any;
}

export interface InstanceConfig { name: string; baseUrl: string; }

export interface Issue { id: ID; projectId: ID; subject: string; status?: any; createdDate?: ISODate; ref?: number; type?: ID | { id: ID; name?: string; slug?: string }; severity?: ID | { id: ID; name?: string; slug?: string }; priority?: ID | { id: ID; name?: string; slug?: string }; }
