"use client";

import { Notice } from "@/lib/types";
import { validateNotice } from "@/lib/utils/validation";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/api/employee";
import { getCompanyId } from "@/lib/api/company/companyInfo";

export type { Notice };

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotices = useCallback(async (departmentOnly: boolean = false) => {
    setLoading(true);
    try {
      const company_id = await getCompanyId();
      const currentDate = new Date().toISOString();
      
      let data, error;
      
      if (departmentOnly) {
        const user = await getEmployeeInfo();
        ({ data, error } = await supabase
          .from("notice_records")
          .select("*")
          .eq("company_id", company_id)
          .or(`department_id.eq.${user.department_id},department_id.is.null`)
          .gte("valid_till", currentDate)
          .order("valid_from", { ascending: false }));
      } else {
        ({ data, error } = await supabase
          .from("notice_records")
          .select("*")
          .eq("company_id", company_id)
          .gte("valid_till", currentDate)
          .order("valid_from", { ascending: false }));
      }

      if (error) throw error;
      setNotices(data || []);
      return data;
    } catch (error) {
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotice = useCallback(async (values: Notice) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateNotice(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase
        .from("notice_records")
        .insert({
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

  const updateNotice = useCallback(async (values: Notice) => {
    try {
      const company_id = await getCompanyId();
      
      // Validate the payload
      const validation = validateNotice(values);
      if (!validation.success) {
        const error = new Error("Validation failed");
        (error as any).issues = validation.errors;
        throw error;
      }

      const { data, error } = await supabase
        .from("notice_records")
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

  const deleteNotice = useCallback(async (id: number) => {
    try {
      const company_id = await getCompanyId();

      const { error } = await supabase
        .from("notice_records")
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
    notices,
    loading,
    fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice,
  };
}
