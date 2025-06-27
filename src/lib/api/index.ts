/**
 * Simple, secure API client
 * Direct access to Supabase with clean error handling
 */

export { api, apiClient, ApiClient, ApiError } from './client';
export type { QueryOptions } from './client';

// Context utilities for company and user scoping
export { getCompanyId, getCompanyInfo, getEmployeeInfo, getUserId, getEmployeeId, getUser, uploadManyFiles, uploadFile } from './context';
