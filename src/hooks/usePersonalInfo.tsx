"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { PersonalFormData } from "@/components/profile";

export function usePersonalInfo() {
  const [data, setData] = useState<PersonalFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUserPersonalInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const employeeInfo = await getEmployeeInfo();
      if (!employeeInfo) throw new Error("User not authenticated");
      
      const { data: result, error } = await supabase
        .from('personal_infos')
        .select('*')
        .eq('id', employeeInfo.id)
        .single();

      if (error) throw error;
      
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch personal info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserPersonalInfo = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('personal_infos')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;
      
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user's personal info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePersonalInfo = useCallback(async (data: PersonalFormData) => {
    setLoading(true);
    setError(null);
    try {
      const employeeInfo = await getEmployeeInfo();
      if (!employeeInfo) throw new Error("User not authenticated");
      
      const { data: result, error } = await supabase
        .from('personal_infos')
        .update(data)
        .eq('id', employeeInfo.id)
        .select()
        .single();

      if (error) throw error;
      
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update personal info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    loading,
    error,
    fetchCurrentUserPersonalInfo,
    fetchUserPersonalInfo,
    updatePersonalInfo
  };
} 