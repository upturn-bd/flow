import { supabase } from "@/lib/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Query options for API requests
 */
export interface QueryOptions {
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

/**
 * Helper function to handle Supabase errors
 */
function handleSupabaseError(error: PostgrestError): never {
  throw new ApiError(
    error.message || 'Database operation failed',
    error.code,
    error.details
  );
}

/**
 * Simple, secure API client for Supabase operations
 */
export class ApiClient {
  /**
   * Get the underlying Supabase client for complex queries
   */
  get client() {
    return supabase;
  }

  /**
   * Get all records from a table
   */
  async getAll<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
    const { select = '*', orderBy, limit, offset, filters = {} } = options;
    
    let query = supabase.from(table).select(select);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }
    
    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data as T[];
  }

  /**
   * Get a single record by ID
   */
  async getById<T>(table: string, id: string | number, select: string = '*'): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      handleSupabaseError(error);
    }
    
    return data as T;
  }

  /**
   * Create a new record
   */
  async create<T>(table: string, data: Partial<T>, select: string = '*'): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select(select)
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return result as T;
  }

  /**
   * Create multiple records
   */
  async createMany<T>(table: string, data: Partial<T>[], select: string = '*'): Promise<T[]> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select(select);
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return result as T[];
  }

  /**
   * Update a record by ID
   */
  async update<T>(table: string, id: string | number, data: Partial<T>, select: string = '*'): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select(select)
      .single();
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return result as T;
  }

  /**
   * Update multiple records with filters
   */
  async updateMany<T>(table: string, data: Partial<T>, filters: Record<string, any>, select: string = '*'): Promise<T[]> {
    let query = supabase.from(table).update(data);
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { data: result, error } = await query.select(select);
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return result as T[];
  }

  /**
   * Delete a record by ID
   */
  async delete(table: string, id: string | number): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Delete multiple records with filters
   */
  async deleteMany(table: string, filters: Record<string, any>): Promise<void> {
    let query = supabase.from(table).delete();
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { error } = await query;
    
    if (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Search records with a text query
   */
  async search<T>(
    table: string, 
    column: string, 
    query: string, 
    options: QueryOptions = {}
  ): Promise<T[]> {
    const { select = '*', orderBy, limit, filters = {} } = options;
    
    let supabaseQuery = supabase
      .from(table)
      .select(select)
      .ilike(column, `%${query}%`);
    
    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        supabaseQuery = supabaseQuery.eq(key, value);
      }
    });
    
    // Apply ordering
    if (orderBy) {
      supabaseQuery = supabaseQuery.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }
    
    // Apply limit
    if (limit) {
      supabaseQuery = supabaseQuery.limit(limit);
    }
    
    const { data, error } = await supabaseQuery;
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data as T[];
  }

  /**
   * Count records in a table
   */
  async count(table: string, filters: Record<string, any> = {}): Promise<number> {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { count, error } = await query;
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return count || 0;
  }
}

// Export singleton instance
export const api = new ApiClient();

// For backward compatibility, also export as apiClient
export const apiClient = api;
