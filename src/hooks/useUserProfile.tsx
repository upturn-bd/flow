"use client";

import { useState, useCallback } from "react";
import { isCurrentUserProfile as isCurrentUserProfileApi } from "@/lib/api/profile/basicInfo";
import { supabase } from "@/lib/supabase/client";

export interface UserInfo {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
}

export function useUserProfile() {
  const [isCurrentUser, setIsCurrentUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const checkIsCurrentUser = useCallback(async (uid?: string | null) => {
    if (!uid) {
      setIsCurrentUser(true);
      return true;
    }

    try {
      const result = await isCurrentUserProfileApi(uid);
      setIsCurrentUser(result);
      return result;
    } catch (err) {
      console.error("Error checking if current user", err);
      return false;
    }
  }, []);

  const fetchUserName = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("first_name, last_name")
        .eq("id", uid)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const userInfo = {
          id: uid,
          first_name: data.first_name,
          last_name: data.last_name,
          name: `${data.first_name} ${data.last_name}`
        };
        setUserInfo(userInfo);
        return userInfo;
      }

      return null;
    } catch (err) {
      console.error("Error fetching user name:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isCurrentUser,
    userInfo,
    loading,
    checkIsCurrentUser,
    fetchUserName
  };
} 