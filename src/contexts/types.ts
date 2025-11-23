/**
 * Shared types for context-based data management
 */

// Base entity interface
export interface BaseEntity {
  id: string | number;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}

// Loading states for granular control
export interface LoadingStates {
  fetching: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

// Error states
export interface ErrorStates {
  fetchError: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
}

// Success response for mutations
export interface MutationResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Context state wrapper
export interface ContextState<T> {
  data: T[];
  loading: LoadingStates;
  error: ErrorStates;
  initialized: boolean;
}

// Optimistic update options
export interface OptimisticUpdateOptions {
  skipOptimistic?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Context configuration
export interface ContextConfig {
  tableName: string;
  entityName: string;
  autoFetch?: boolean;
  cacheTimeout?: number; // in milliseconds
}

// Dev tools configuration
export interface DevToolsConfig {
  enabled: boolean;
  logActions: boolean;
  logState: boolean;
}
