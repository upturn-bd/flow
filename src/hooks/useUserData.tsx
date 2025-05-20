"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export type UserProfileData = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone_number?: string;
  department_id?: number;
  designation?: string;
  job_status?: string;
  hire_date?: string;
  avatar_url?: string;
  department_name?: string;
} | null;

export function useUserData() {
  const [userData, setUserData] = useState<UserProfileData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch basic user info from API
        const response = await fetch("/api/basic-info");
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const { data } = await response.json();
        
        // If we have a department ID, fetch the department name
        let departmentName = undefined;
        if (data.department_id) {
          const supabase = createClient();
          const { data: deptData, error: deptError } = await supabase
            .from("departments")
            .select("name")
            .eq("id", data.department_id)
            .single();
            
          if (!deptError && deptData) {
            departmentName = deptData.name;
          }
        }
        
        // Get the user auth data for the ID
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        setUserData({
          ...data,
          id: user?.id || "",
          department_name: departmentName
        });
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError(error instanceof Error ? error.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Failed to log out:", error);
      setError(error instanceof Error ? error.message : "Failed to log out");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const refreshUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/basic-info");
      if (!response.ok) {
        throw new Error("Failed to refresh user data");
      }
      
      const { data } = await response.json();
      
      // If we have a department ID, fetch the department name
      let departmentName = undefined;
      if (data.department_id) {
        const supabase = createClient();
        const { data: deptData } = await supabase
          .from("departments")
          .select("name")
          .eq("id", data.department_id)
          .single();
          
        if (deptData) {
          departmentName = deptData.name;
        }
      }
      
      // Get the user auth data for the ID
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      setUserData({
        ...data,
        id: user?.id || "",
        department_name: departmentName
      });
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    userData, 
    loading, 
    error,
    logout,
    refreshUserData
  };
}