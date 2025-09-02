"use client";

import { useState, useCallback, useMemo } from "react";
import {
  BaseEntity,
  CrudHookResult,
  QueryFilters,
  QueryOptions,
  EnhancedQueryOptions,
  ApiResponse,
} from "./types";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId, getUserId, getEmployeeInfo, DatabaseError } from "@/lib/utils/auth";

interface BaseEntityHookConfig<T> {
  tableName: string;
  entityName: string;
  companyScoped?: boolean;
  userScoped?: boolean;
  departmentScoped?: boolean;
}

export function useBaseEntity<T extends BaseEntity>(
  config: BaseEntityHookConfig<T>
): CrudHookResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [item, setItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  config.companyScoped = config.companyScoped ?? true;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearItem = useCallback(() => {
    setItem(null);
  }, []);

  // Helper function to build query with filters
  const buildQuery = useCallback((baseQuery: any, filters: QueryFilters) => {
    let query = baseQuery;

    // Apply eq filters
    if (filters.eq) {
      Object.entries(filters.eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply neq filters
    if (filters.neq) {
      Object.entries(filters.neq).forEach(([key, value]) => {
        query = query.neq(key, value);
      });
    }

    // Apply gt filters
    if (filters.gt) {
      Object.entries(filters.gt).forEach(([key, value]) => {
        query = query.gt(key, value);
      });
    }

    // Apply gte filters
    if (filters.gte) {
      Object.entries(filters.gte).forEach(([key, value]) => {
        query = query.gte(key, value);
      });
    }

    // Apply lt filters
    if (filters.lt) {
      Object.entries(filters.lt).forEach(([key, value]) => {
        query = query.lt(key, value);
      });
    }

    // Apply lte filters
    if (filters.lte) {
      Object.entries(filters.lte).forEach(([key, value]) => {
        query = query.lte(key, value);
      });
    }

    // Apply like filters
    if (filters.like) {
      Object.entries(filters.like).forEach(([key, value]) => {
        query = query.like(key, value);
      });
    }

    // Apply ilike filters
    if (filters.ilike) {
      Object.entries(filters.ilike).forEach(([key, value]) => {
        query = query.ilike(key, value);
      });
    }

    // Apply in filters
    if (filters.in) {
      Object.entries(filters.in).forEach(([key, value]) => {
        query = query.in(key, value);
      });
    }

    // Apply contains filters
    if (filters.contains) {
      Object.entries(filters.contains).forEach(([key, value]) => {
        query = query.contains(key, value);
      });
    }

    // Apply is filters
    if (filters.is) {
      Object.entries(filters.is).forEach(([key, value]) => {
        query = query.is(key, value);
      });
    }

    // Apply or filter
    if (filters.or) {
      query = query.or(filters.or);
    }

    return query;
  }, []);

  // Helper function to apply query options
  const applyQueryOptions = useCallback((query: any, options: QueryOptions) => {
    // Apply select
    if (options.select) {
      query = query.select(options.select);
    }

    // Apply order by
    if (options.orderBy) {
      options.orderBy.forEach(({ column, ascending = true }) => {
        query = query.order(column, { ascending });
      });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Apply offset
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    // Apply single
    if (options.single) {
      query = query.single();
    }

    return query;
  }, []);

  // Helper to apply scoping
  const applyScoping = useCallback(async (filters: QueryFilters) => {
    const newFilters = { ...filters };
    
    // Apply company scoping if required
    if (config.companyScoped) {
      const companyId = await getCompanyId();
      if (!companyId) {
        throw new DatabaseError("Company context required");
      }
      newFilters.eq = { ...newFilters.eq, company_id: companyId };
    }

    // Apply user scoping if required
    if (config.userScoped) {
      const userId = await getUserId();
      if (!userId) {
        throw new DatabaseError("User context required");
      }
      newFilters.eq = { ...newFilters.eq, user_id: userId };
    }

    // Apply department scoping if required
    if (config.departmentScoped) {
      const employeeInfo = await getEmployeeInfo();
      if (!employeeInfo?.department_id) {
        throw new DatabaseError("Department context required");
      }
      newFilters.eq = { ...newFilters.eq, department_id: employeeInfo.department_id };
    }

    return newFilters;
  }, [config]);

  // Fetch multiple items
  const fetchItems = useCallback(
    async (company_id?: number): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        let filters: QueryFilters = {};
        
        if (company_id) {
          filters.eq = { company_id };
        } else {
          filters = await applyScoping({});
        }

        let query = supabase.from(config.tableName).select("*");
        query = buildQuery(query, filters);

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw new DatabaseError(`Failed to fetch ${config.entityName}: ${supabaseError.message}`);
        }

        const result = data || [];
        setItems(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to fetch ${config.entityName}`;
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [config, buildQuery, applyScoping]
  );

  // Fetch items with enhanced query
  const fetchItemsWithQuery = useCallback(
    async (queryConfig: EnhancedQueryOptions): Promise<T[]> => {
      try {
        setLoading(true);
        setError(null);

        const { filters = {}, options = {} } = queryConfig;
        const scopedFilters = await applyScoping(filters);

        let query = supabase.from(config.tableName)
          .select(options.select || "*");

        // Apply filters
        query = buildQuery(query, scopedFilters);

        // Apply query options
        query = applyQueryOptions(query, options);

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw new DatabaseError(`Failed to fetch ${config.entityName}: ${supabaseError.message}`);
        }

        const result = (data || []) as unknown as T[];
        setItems(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to fetch ${config.entityName}`;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [config, buildQuery, applyScoping, applyQueryOptions]
  );

  // Fetch single item with enhanced query
  const fetchSingleWithQuery = useCallback(
    async (queryConfig: EnhancedQueryOptions): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const { filters = {}, options = {} } = queryConfig;
        const scopedFilters = await applyScoping(filters);

        let query = supabase.from(config.tableName)
          .select(options.select || "*");

        // Apply filters
        query = buildQuery(query, scopedFilters);

        // Apply query options (excluding limit and select since we want single)
        const singleOptions = {
          ...options,
          limit: undefined,
          select: undefined,
        };
        query = applyQueryOptions(query, singleOptions);

        // Force single result
        const { data, error: supabaseError } = await query.single();

        if (supabaseError) {
          if (supabaseError.code === 'PGRST116') {
            // No rows found
            setItem(null);
            return null;
          }
          throw new DatabaseError(`Failed to fetch ${config.entityName}: ${supabaseError.message}`);
        }

        const result = data as unknown as T;
        setItem(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to fetch ${config.entityName}`;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [config, buildQuery, applyScoping, applyQueryOptions]
  );

  // Fetch item by ID
  const fetchItem = useCallback(
    async (id: string | number): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const filters: QueryFilters = { eq: { id } };
        const scopedFilters = await applyScoping(filters);

        let query = supabase.from(config.tableName)
          .select("*");

        // Apply filters and get single result
        query = buildQuery(query, scopedFilters);
        const { data, error: supabaseError } = await query.single();

        if (supabaseError && supabaseError.code !== 'PGRST116') {
          throw new DatabaseError(`Failed to fetch ${config.entityName}: ${supabaseError.message}`);
        }

        const result = data as T | null;
        setItem(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to fetch ${config.entityName}`;
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [config, buildQuery, applyScoping]
  );

  // Create new item
  const createItem = useCallback(
    async (data: Partial<T>): Promise<ApiResponse<T>> => {
      try {
        setCreating(true);
        setError(null);

        const createData = { ...data } as any;

        // Apply company scoping if required
        if (config.companyScoped) {
          const companyId = await getCompanyId();
          if (!companyId) {
            throw new DatabaseError("Company context required");
          }
          createData.company_id = companyId;
        }

        // Apply user scoping if required
        if (config.userScoped) {
          const userId = await getUserId();
          if (!userId) {
            throw new DatabaseError("User context required");
          }
          createData.user_id = userId;
        }

        const { data: result, error: supabaseError } = await supabase
          .from(config.tableName)
          .insert(createData)
          .select()
          .single();

        if (supabaseError) {
          throw new DatabaseError(`Failed to create ${config.entityName}: ${supabaseError.message}`);
        }

        if (result) {
          setItems(prev => [...prev, result]);
        }

        return { success: true, data: result };
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to create ${config.entityName}`;
        setError(message);
        return { success: false, error: message };
      } finally {
        setCreating(false);
      }
    },
    [config]
  );

  // Update item
  const updateItem = useCallback(
    async (id: string | number, data: Partial<T>): Promise<ApiResponse<T>> => {
      try {
        setUpdating(true);
        setError(null);

        let query = supabase
          .from(config.tableName)
          .update(data)
          .eq('id', id);

        // Apply company scoping if required
        if (config.companyScoped) {
          const companyId = await getCompanyId();
          if (!companyId) {
            throw new DatabaseError("Company context required");
          }
          query = query.eq('company_id', companyId);
        }

        const { data: result, error: supabaseError } = await query
          .select()
          .single();

        if (supabaseError) {
          throw new DatabaseError(`Failed to update ${config.entityName}: ${supabaseError.message}`);
        }

        if (result) {
          setItems(prev => prev.map(item => 
            item.id === id ? result : item
          ));
          setItem(result);
        }

        return { success: true, data: result };
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to update ${config.entityName}`;
        setError(message);
        return { success: false, error: message };
      } finally {
        setUpdating(false);
      }
    },
    [config]
  );

  // Delete item
  const deleteItem = useCallback(
    async (id: string | number): Promise<ApiResponse<boolean>> => {
      try {
        setDeleting(true);
        setError(null);

        let query = supabase
          .from(config.tableName)
          .delete()
          .eq('id', id);

        // Apply company scoping if required
        if (config.companyScoped) {
          const companyId = await getCompanyId();
          if (!companyId) {
            throw new DatabaseError("Company context required");
          }
          query = query.eq('company_id', companyId);
        }

        const { error: supabaseError } = await query;

        if (supabaseError) {
          throw new DatabaseError(`Failed to delete ${config.entityName}: ${supabaseError.message}`);
        }

        setItems(prev => prev.filter(item => item.id !== id));
        
        if (item?.id === id) {
          setItem(null);
        }

        return { success: true, data: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : `Failed to delete ${config.entityName}`;
        setError(message);
        return { success: false, error: message };
      } finally {
        setDeleting(false);
      }
    },
    [config, item]
  );

  const memoizedResult = useMemo(
    () => ({
      // Data
      items,
      item,
      
      // Loading states
      loading,
      creating,
      updating,
      deleting,
      
      // Error handling
      error,
      clearError,
      clearItem,
      
      // CRUD operations
      fetchItems,
      fetchItemsWithQuery,
      fetchSingleWithQuery,
      fetchItem,
      createItem,
      updateItem,
      deleteItem,
    }),
    [
      items,
      item,
      loading,
      creating,
      updating,
      deleting,
      error,
      clearError,
      clearItem,
      fetchItems,
      fetchItemsWithQuery,
      fetchSingleWithQuery,
      fetchItem,
      createItem,
      updateItem,
      deleteItem,
    ]
  );

  return memoizedResult;
}

export default useBaseEntity;
