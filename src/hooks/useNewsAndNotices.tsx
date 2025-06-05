"use client";


import { newsAndNoticeTypeSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";

export type NewsAndNoticesType = z.infer<typeof newsAndNoticeTypeSchema>;

export function useNewsAndNoticesTypes() {
  const [newsAndNoticeTypes, setNewsAndNoticesTypes] = useState<
    NewsAndNoticesType[]
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

  const createNewsAndNoticesType = useCallback(async (values: NewsAndNoticesType) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validated = newsAndNoticeTypeSchema.safeParse(values);
      if (!validated.success) throw validated.error;

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
