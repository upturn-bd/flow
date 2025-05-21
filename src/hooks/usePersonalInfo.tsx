"use client";

import { useState, useCallback } from "react";
import { 
  fetchCurrentUserPersonalInfo as fetchCurrentUserPersonalInfoApi, 
  fetchUserPersonalInfo as fetchUserPersonalInfoApi, 
  updatePersonalInfo as updatePersonalInfoApi
} from "@/lib/api/profile/personalInfo";
import { PersonalFormData } from "@/app/(home)/hris/tabs/personalInfo.constants";

export function usePersonalInfo() {
  const [data, setData] = useState<PersonalFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUserPersonalInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCurrentUserPersonalInfoApi();
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
      const result = await fetchUserPersonalInfoApi(uid);
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
      const result = await updatePersonalInfoApi(data);
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