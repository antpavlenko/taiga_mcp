export type ID = number;
export type ISODate = string;

export interface UserRef { id: ID; username: string; fullName?: string; }

export interface Project { id: ID; name: string; slug?: string; description?: string; }

export interface UserStory { id: ID; projectId: ID; subject: string; statusId: ID; createdDate: ISODate; modifiedDate: ISODate; ref?: number; }

export interface NormalizedError {
  category: 'auth' | 'not_found' | 'validation' | 'rate_limit' | 'network' | 'server' | 'unknown';
  httpStatus?: number;
  message: string;
  details?: any;
}

export interface InstanceConfig { name: string; baseUrl: string; }

export interface Issue { id: ID; projectId: ID; subject: string; status?: string; createdDate?: ISODate; }
