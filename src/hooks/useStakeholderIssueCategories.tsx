"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { StakeholderIssueCategory, StakeholderIssueSubcategory } from "@/lib/types/schemas";
import { captureSupabaseError, logError } from "@/lib/sentry";

// ==============================================================================
// Form Data Interfaces
// ==============================================================================

export interface IssueCategoryFormData {
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
}

export interface IssueSubcategoryFormData {
  category_id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

// ==============================================================================
// Main Hook
// ==============================================================================

export function useStakeholderIssueCategories() {
  const { employeeInfo } = useAuth();
  const [categories, setCategories] = useState<StakeholderIssueCategory[]>([]);
  const [subcategories, setSubcategories] = useState<StakeholderIssueSubcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // CATEGORY OPERATIONS
  // ==========================================================================

  const fetchCategories = useCallback(async (includeInactive = false) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return [];
      }

      let query = supabase
        .from("stakeholder_issue_categories")
        .select(`
          *,
          subcategories:stakeholder_issue_subcategories(*)
        `)
        .eq("company_id", companyId);

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error: fetchError } = await query.order("name");

      if (fetchError) {
        captureSupabaseError(fetchError, "fetchStakeholderIssueCategories", { companyId });
        setError("Failed to fetch categories");
        throw fetchError;
      }

      setCategories(data || []);
      return data || [];
    } catch (err) {
      logError("Error fetching issue categories", err);
      setError("Failed to fetch categories");
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  const fetchCategoryById = useCallback(async (categoryId: number) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return null;
      }

      const { data, error: fetchError } = await supabase
        .from("stakeholder_issue_categories")
        .select(`
          *,
          subcategories:stakeholder_issue_subcategories(*)
        `)
        .eq("company_id", companyId)
        .eq("id", categoryId)
        .single();

      if (fetchError) {
        captureSupabaseError(fetchError, "fetchIssueCategoryById", { companyId, categoryId });
        setError("Failed to fetch category");
        throw fetchError;
      }

      return data;
    } catch (err) {
      logError("Error fetching category", err);
      setError("Failed to fetch category");
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  const createCategory = useCallback(
    async (categoryData: IssueCategoryFormData) => {
      setError(null);
      try {
        const companyId = employeeInfo?.company_id;
        const userId = employeeInfo?.id;
        if (!companyId || !userId) {
          throw new Error("Company ID or User ID not available");
        }

        const { data, error: createError } = await supabase
          .from("stakeholder_issue_categories")
          .insert([
            {
              ...categoryData,
              company_id: companyId,
              created_by: userId,
            },
          ])
          .select()
          .single();

        if (createError) {
          captureSupabaseError(createError, "createIssueCategory", { companyId });
          throw createError;
        }

        await fetchCategories(true);
        return data;
      } catch (err) {
        logError("Error creating category", err);
        setError("Failed to create category");
        throw err;
      }
    },
    [employeeInfo?.company_id, employeeInfo?.id, fetchCategories]
  );

  const updateCategory = useCallback(
    async (categoryId: number, categoryData: Partial<IssueCategoryFormData>) => {
      if (!employeeInfo) {
        return null;
      }

      setError(null);
      setProcessingId(categoryId);

      try {
        const { data, error: updateError } = await supabase
          .from("stakeholder_issue_categories")
          .update({
            ...categoryData,
            updated_by: employeeInfo.id,
          })
          .eq("id", categoryId)
          .select()
          .single();

        if (updateError) {
          captureSupabaseError(updateError, "updateIssueCategory", { categoryId });
          throw updateError;
        }

        await fetchCategories(true);
        return data;
      } catch (err) {
        logError("Error updating category", err);
        setError("Failed to update category");
        throw err;
      } finally {
        setProcessingId(null);
      }
    },
    [employeeInfo, fetchCategories]
  );

  const deleteCategory = useCallback(
    async (categoryId: number) => {
      setError(null);
      setProcessingId(categoryId);

      try {
        const { error: deleteError } = await supabase
          .from("stakeholder_issue_categories")
          .delete()
          .eq("id", categoryId);

        if (deleteError) {
          captureSupabaseError(deleteError, "deleteIssueCategory", { categoryId });
          throw deleteError;
        }

        await fetchCategories(true);
        return true;
      } catch (err) {
        logError("Error deleting category", err);
        setError("Failed to delete category");
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchCategories]
  );

  // ==========================================================================
  // SUBCATEGORY OPERATIONS
  // ==========================================================================

  const fetchSubcategories = useCallback(async (categoryId?: number, includeInactive = false) => {
    setLoading(true);
    setError(null);

    try {
      const companyId = employeeInfo?.company_id;
      if (!companyId) {
        setLoading(false);
        return [];
      }

      let query = supabase
        .from("stakeholder_issue_subcategories")
        .select(`
          *,
          category:stakeholder_issue_categories(id, name, color)
        `)
        .eq("company_id", companyId);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error: fetchError } = await query.order("name");

      if (fetchError) {
        captureSupabaseError(fetchError, "fetchIssueSubcategories", { companyId, categoryId });
        setError("Failed to fetch subcategories");
        throw fetchError;
      }

      setSubcategories(data || []);
      return data || [];
    } catch (err) {
      logError("Error fetching subcategories", err);
      setError("Failed to fetch subcategories");
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  const createSubcategory = useCallback(
    async (subcategoryData: IssueSubcategoryFormData) => {
      setError(null);
      try {
        const companyId = employeeInfo?.company_id;
        const userId = employeeInfo?.id;
        if (!companyId || !userId) {
          throw new Error("Company ID or User ID not available");
        }

        const { data, error: createError } = await supabase
          .from("stakeholder_issue_subcategories")
          .insert([
            {
              ...subcategoryData,
              company_id: companyId,
              created_by: userId,
            },
          ])
          .select()
          .single();

        if (createError) {
          captureSupabaseError(createError, "createIssueSubcategory", { companyId });
          throw createError;
        }

        await fetchSubcategories(subcategoryData.category_id, true);
        return data;
      } catch (err) {
        logError("Error creating subcategory", err);
        setError("Failed to create subcategory");
        throw err;
      }
    },
    [employeeInfo?.company_id, employeeInfo?.id, fetchSubcategories]
  );

  const updateSubcategory = useCallback(
    async (subcategoryId: number, subcategoryData: Partial<IssueSubcategoryFormData>) => {
      if (!employeeInfo) {
        return null;
      }

      setError(null);
      setProcessingId(subcategoryId);

      try {
        const { data, error: updateError } = await supabase
          .from("stakeholder_issue_subcategories")
          .update({
            ...subcategoryData,
            updated_by: employeeInfo.id,
          })
          .eq("id", subcategoryId)
          .select()
          .single();

        if (updateError) {
          captureSupabaseError(updateError, "updateIssueSubcategory", { subcategoryId });
          throw updateError;
        }

        await fetchCategories(true);
        return data;
      } catch (err) {
        logError("Error updating subcategory", err);
        setError("Failed to update subcategory");
        throw err;
      } finally {
        setProcessingId(null);
      }
    },
    [employeeInfo, fetchCategories]
  );

  const deleteSubcategory = useCallback(
    async (subcategoryId: number) => {
      setError(null);
      setProcessingId(subcategoryId);

      try {
        const { error: deleteError } = await supabase
          .from("stakeholder_issue_subcategories")
          .delete()
          .eq("id", subcategoryId);

        if (deleteError) {
          captureSupabaseError(deleteError, "deleteIssueSubcategory", { subcategoryId });
          throw deleteError;
        }

        await fetchCategories(true);
        return true;
      } catch (err) {
        logError("Error deleting subcategory", err);
        setError("Failed to delete subcategory");
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchCategories]
  );

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active),
    [categories]
  );

  const activeSubcategories = useMemo(
    () => subcategories.filter((s) => s.is_active),
    [subcategories]
  );

  const getSubcategoriesByCategory = useCallback(
    (categoryId: number) => {
      return categories.find((c) => c.id === categoryId)?.subcategories?.filter((s) => s.is_active) || [];
    },
    [categories]
  );

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    categories,
    subcategories,
    loading,
    error,
    processingId,

    // Computed
    activeCategories,
    activeSubcategories,
    getSubcategoriesByCategory,

    // Category Operations
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,

    // Subcategory Operations
    fetchSubcategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}
