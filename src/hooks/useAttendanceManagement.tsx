"use client";

import { Site } from "@/lib/types";
import { validateSite } from "@/lib/utils/validation";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

// Re-export Site type for components
export type { Site };

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("company_id", company_id);

      if (error) throw error;
      setSites(data || []);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createSite = useCallback(async (
    values: Omit<Site, "id" | "company_id" | "created_at" | "updated_at">
  ) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateSite(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase.from("sites").insert({
        ...values,
        company_id,
      });

      if (error) throw error;
      return { success: true, status: 200, data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const updateSite = useCallback(async (values: Site) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateSite(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase
        .from("sites")
        .update(values)
        .eq("id", values.id)
        .eq("company_id", company_id);

      if (error) throw error;
      return { success: true, status: 200, data };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  const deleteSite = useCallback(async (id: number) => {
    try {
      const company_id = await getCompanyId();

      const { error } = await supabase
        .from("sites")
        .delete()
        .eq("id", id)
        .eq("company_id", company_id);

      if (error) throw error;
      return { success: true, status: 200, data: null };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, []);

  return {
    sites,
    loading,
    fetchSites,
    createSite,
    updateSite,
    deleteSite,
  };
}
