"use client";

import { useState, useCallback } from "react";
import { BaseEntity, CrudHookResult, ApiResponse } from "./types";
import { useApiCall } from "./useApiCall";
import { api } from "@/lib/api";

interface BaseEntityHookConfig<T> {
  tableName: string;
  entityName: string;
  companyScoped?: boolean;
  userScoped?: boolean;
  departmentScoped?: boolean; // New option for department scoping
}

export function useBaseEntity<T extends BaseEntity>(
  config: BaseEntityHookConfig<T>
): CrudHookResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [item, setItem] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const { loading, error, callApi, clearError } = useApiCall();

  const fetchItems = useCallback(async (): Promise<void> => {
    const filters: Record<string, any> = {};
    
    // Add company scoping if enabled
    if (config.companyScoped) {
      const { getCompanyId } = await import('@/lib/api');
      filters.company_id = await getCompanyId();
    }
    
    // Add user scoping if enabled
    if (config.userScoped) {
      const { getUserId } = await import('@/lib/api');
      filters.user_id = await getUserId();
    }
    
    // Handle department scoping with direct Supabase query
    if (config.departmentScoped) {
      const { getEmployeeInfo } = await import('@/lib/api');
      const employeeInfo = await getEmployeeInfo();
      
      // For department scoped items, we want items that are either:
      // 1. For the user's department, OR
      // 2. Global (department_id is null)
      if (employeeInfo.department_id) {
        let query = api.client
          .from(config.tableName)
          .select('*');
        
        // Apply company scoping if enabled
        if (config.companyScoped && filters.company_id) {
          query = query.eq('company_id', filters.company_id);
        }
        
        // Apply department OR null filter
        query = query.or(`department_id.eq.${employeeInfo.department_id},department_id.is.null`);
        
        const result = await callApi(
          async () => {
            const { data, error } = await query;
            if (error) throw error;
            return data;
          },
          {
            showErrorMessage: true,
          }
        );
        if (result) {
          setItems(result || []);
        }
        return;
      }
    }
    
    const result = await callApi(
      () => api.getAll<T>(config.tableName, { filters }), 
      {
        showErrorMessage: true,
      }
    );
    if (result) {
      setItems(result);
    }
  }, [callApi, config.tableName, config.companyScoped, config.userScoped, config.departmentScoped]);

  const fetchItem = useCallback(async (id: string | number): Promise<void> => {
    const result = await callApi(
      () => api.getById<T>(config.tableName, id), 
      {
        showErrorMessage: true,
      }
    );
    if (result) {
      setItem(result);
    }
  }, [callApi, config.tableName]);

  const createItem = useCallback(async (data: Partial<T>): Promise<ApiResponse<T>> => {
    setCreating(true);
    try {
      const createData = { ...data };
      
      // Add company scoping if enabled
      if (config.companyScoped) {
        const { getCompanyId } = await import('@/lib/api');
        (createData as any).company_id = await getCompanyId();
      }
      
      // Add user scoping if enabled
      if (config.userScoped) {
        const { getUserId } = await import('@/lib/api');
        (createData as any).user_id = await getUserId();
      }
      
      const result = await callApi(
        () => api.create<T>(config.tableName, createData), 
        {
          showSuccessMessage: true,
          showErrorMessage: true,
        }
      );
      
      if (result) {
        setItems(prev => [...prev, result]);
        setCreating(false);
        return { success: true, data: result };
      }
      
      setCreating(false);
      return { success: false, error: error || 'Failed to create item' };
    } catch (err) {
      setCreating(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
      return { success: false, error: errorMessage };
    }
  }, [callApi, config.tableName, config.companyScoped, config.userScoped, error]);

  const updateItem = useCallback(async (
    id: string | number, 
    data: Partial<T>
  ): Promise<ApiResponse<T>> => {
    setUpdating(true);
    try {
      const result = await callApi(
        () => api.update<T>(config.tableName, id, data), 
        {
          showSuccessMessage: true,
          showErrorMessage: true,
        }
      );
      
      if (result) {
        setItems(prev => prev.map(item => 
          (item.id === id) ? result : item
        ));
        setItem(result);
        setUpdating(false);
        return { success: true, data: result };
      }
      
      setUpdating(false);
      return { success: false, error: error || 'Failed to update item' };
    } catch (err) {
      setUpdating(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
      return { success: false, error: errorMessage };
    }
  }, [callApi, config.tableName, error]);

  const deleteItem = useCallback(async (id: string | number): Promise<ApiResponse<boolean>> => {
    setDeleting(true);
    try {
      await callApi(
        () => api.delete(config.tableName, id), 
        {
          showSuccessMessage: true,
          showErrorMessage: true,
        }
      );
      
      setItems(prev => prev.filter(item => item.id !== id));
      if (item?.id === id) {
        setItem(null);
      }
      setDeleting(false);
      return { success: true, data: true };
    } catch (err) {
      setDeleting(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete item';
      return { success: false, error: errorMessage };
    }
  }, [callApi, config.tableName, error, item]);

  const clearItem = useCallback(() => {
    setItem(null);
  }, []);

  return {
    items,
    item,
    loading,
    creating,
    updating,
    deleting,
    error,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    clearError,
    clearItem,
  };
}

export default useBaseEntity;
