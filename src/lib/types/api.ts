/**
 * API-related type definitions
 */

// API Response wrapper types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Query and FunnelSimple types
export interface BaseQuery {
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface BaseFilter {
  company_id?: number;
  department_id?: number;
  status?: string;
  created_at_gte?: string;
  created_at_lte?: string;
}

export interface EntityQuery extends BaseQuery {
  filters?: BaseFilter;
}

// CRUD Operation types
export interface CreateEntityData<T> {
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>;
}

export interface UpdateEntityData<T> {
  id: number;
  data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;
}

export interface DeleteEntityData {
  id: number;
}

// Batch operation types
export interface BatchCreateData<T> {
  items: Array<Omit<T, 'id' | 'created_at' | 'updated_at'>>;
}

export interface BatchUpdateData<T> {
  items: Array<{ id: number; data: Partial<T> }>;
}

export interface BatchDeleteData {
  ids: number[];
}

// API Client configuration
export interface ApiClientConfig {
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  validateResponse?: boolean;
}

// Supabase specific types
export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
  count?: number;
  status: number;
  statusText: string;
}

// Hook return types
export interface UseEntityResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<T[]>;
  createItem: (data: Omit<T, 'id'>) => Promise<ApiResponse<T>>;
  updateItem: (id: number, data: Partial<T>) => Promise<ApiResponse<T>>;
  deleteItem: (id: number) => Promise<ApiResponse<null>>;
  refreshItems: () => Promise<void>;
}

export interface UseFormResult<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  resetForm: () => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void>) => Promise<void>;
}
