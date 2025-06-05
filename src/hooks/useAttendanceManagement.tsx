"use client";


import { siteSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

export type Site = z.infer<typeof siteSchema>;

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
      const validated = siteSchema.safeParse(values);
      if (!validated.success) throw validated.error;

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
      const validated = siteSchema.safeParse(values);
      if (!validated.success) throw validated.error;

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
