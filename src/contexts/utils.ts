/**
 * Utility functions for context management
 */

import { MutationResponse, DevToolsConfig } from "./types";

// Development-only logger
const isDev = process.env.NODE_ENV === "development";

export const devLog = {
  action: (contextName: string, action: string, payload?: unknown) => {
    if (isDev) {
      console.log(`[${contextName}] ${action}`, payload || "");
    }
  },
  state: (contextName: string, state: unknown) => {
    if (isDev) {
      console.log(`[${contextName}] State:`, state);
    }
  },
  error: (contextName: string, error: string) => {
    console.error(`[${contextName}] Error:`, error);
  },
};

// Create initial loading states
export const createInitialLoadingStates = () => ({
  fetching: false,
  creating: false,
  updating: false,
  deleting: false,
});

// Create initial error states
export const createInitialErrorStates = () => ({
  fetchError: null,
  createError: null,
  updateError: null,
  deleteError: null,
});

// Success response helper
export function createSuccessResponse<T>(data: T): MutationResponse<T> {
  return {
    success: true,
    data,
  };
}

// Error response helper
export function createErrorResponse(error: string): MutationResponse {
  return {
    success: false,
    error,
  };
}

// Extract error message from unknown error
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

// Check if company ID is available
export function validateCompanyId(companyId: number | string | undefined): number {
  if (!companyId) {
    throw new Error("Company ID is required but not available");
  }
  return typeof companyId === "string" ? parseInt(companyId, 10) : companyId;
}

// Optimistic update helper - adds item to array
export function optimisticAdd<T extends { id: string | number }>(
  items: T[],
  newItem: T
): T[] {
  return [...items, newItem];
}

// Optimistic update helper - updates item in array
export function optimisticUpdate<T extends { id: string | number }>(
  items: T[],
  id: string | number,
  updates: Partial<T>
): T[] {
  return items.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
}

// Optimistic update helper - removes item from array
export function optimisticRemove<T extends { id: string | number }>(
  items: T[],
  id: string | number
): T[] {
  return items.filter((item) => item.id !== id);
}

// Rollback helper - restores previous state
export function rollback<T>(previousState: T): T {
  return previousState;
}
