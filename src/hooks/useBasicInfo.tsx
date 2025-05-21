"use client";

import { useState, useCallback } from "react";
import { 
  fetchCurrentUserBasicInfo as fetchCurrentUserBasicInfoApi, 
  fetchUserBasicInfo as fetchUserBasicInfoApi, 
  updateBasicInfo as updateBasicInfoApi,
  isCurrentUserProfile as isCurrentUserProfileApi
} from "@/lib/api/profile/basicInfo";
import { BasicInfoFormData } from "@/app/(home)/hris/tabs/basicInfo.constants";

export function useBasicInfo() {
  const [data, setData] = useState<BasicInfoFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(true);

  const fetchCurrentUserBasicInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCurrentUserBasicInfoApi();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch basic info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserBasicInfo = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserBasicInfoApi(uid);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user's basic info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBasicInfo = useCallback(async (data: BasicInfoFormData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateBasicInfoApi(data);
      setData(result.data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update basic info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkIsCurrentUser = useCallback(async (uid?: string | null) => {
    try {
      const result = await isCurrentUserProfileApi(uid);
      setIsCurrentUser(result);
      return result;
    } catch (err) {
      console.error("Error checking if current user", err);
      return false;
    }
  }, []);

  return {
    data,
    loading,
    error,
    isCurrentUser,
    fetchCurrentUserBasicInfo,
    fetchUserBasicInfo,
    updateBasicInfo,
    checkIsCurrentUser
  };
} 