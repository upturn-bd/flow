"use client";

import { NewsAndNoticeType } from "@/lib/types";
import { validateNewsAndNoticeType } from "@/lib/utils/validation";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

export type { NewsAndNoticeType };

export function useNewsAndNoticesTypes() {
  const [newsAndNoticeTypes, setNewsAndNoticesTypes] = useState<
    NewsAndNoticeType[]
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchNewsAndNoticesTypes = useCallback(async () => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("notice_types")
        .select("*")
        .eq("company_id", company_id);

      if (error) throw error;
      setNewsAndNoticesTypes(data || []);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewsAndNoticesType = useCallback(async (values: NewsAndNoticeType) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateNewsAndNoticeType(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase.from("notice_types").insert({
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

  const deleteNewsAndNoticesType = useCallback(async (id: number) => {
    try {
      const company_id = await getCompanyId();

      const { error } = await supabase
        .from("notice_types")
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
    newsAndNoticeTypes,
    loading,
    fetchNewsAndNoticesTypes,
    createNewsAndNoticesType,
    deleteNewsAndNoticesType,
  };
}
