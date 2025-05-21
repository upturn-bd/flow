"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUserBasicInfo } from "@/lib/api/profile/basicInfo";

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
        
        // Fetch basic user info using client-side function instead of API
        const data = await fetchCurrentUserBasicInfo();
        
        // Get the user auth data for the ID
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("User not authenticated");
        }
        
        // Fetch additional user data including role
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("role")
          .eq("id", user.id)
          .single();
          
        if (employeeError) {
          throw new Error("Failed to fetch employee role");
        }
        
        // If we have a department ID, fetch the department name
        let departmentName = undefined;
        if (data.department_id) {
          const { data: deptData, error: deptError } = await supabase
            .from("departments")
            .select("name")
            .eq("id", data.department_id)
            .single();
            
          if (!deptError && deptData) {
            departmentName = deptData.name;
          }
        }
        
        setUserData({
          ...data,
          id: user.id,
          role: employeeData.role,
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
      await supabase.auth.signOut();
      router.push("/login");
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
      
      // Use client-side function instead of API
      const data = await fetchCurrentUserBasicInfo();
      
      // Get the user auth data for the ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Fetch additional user data including role
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("role")
        .eq("id", user.id)
        .single();
        
      if (employeeError) {
        throw new Error("Failed to fetch employee role");
      }
      
      // If we have a department ID, fetch the department name
      let departmentName = undefined;
      if (data.department_id) {
        const { data: deptData } = await supabase
          .from("departments")
          .select("name")
          .eq("id", data.department_id)
          .single();
          
        if (deptData) {
          departmentName = deptData.name;
        }
      }
      
      setUserData({
        ...data,
        id: user.id,
        role: employeeData.role,
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