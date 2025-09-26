import { NormalizedError } from '../models/types';

export function translate(status: number, body: any, networkErr?: Error): NormalizedError {
  if (networkErr) return { category: 'network', message: networkErr.message };
  if (status === 401 || status === 403) return { category: 'auth', httpStatus: status, message: body?.detail || 'Unauthorized' };
  if (status === 404) return { category: 'not_found', httpStatus: status, message: 'Not Found' };
  if (status === 429) return { category: 'rate_limit', httpStatus: status, message: 'Rate limited' };
  if ([400, 409, 412, 422].includes(status)) return { category: 'validation', httpStatus: status, message: body?.message || 'Validation error', details: body };
  if (status >= 500) return { category: 'server', httpStatus: status, message: 'Server error' };
  return { category: 'unknown', httpStatus: status, message: 'Unexpected response', details: body };
}
