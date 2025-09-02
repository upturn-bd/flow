"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getEmployeeInfo } from "@/lib/utils/auth";

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
        
        // Get current user employee info
        const employeeInfo = await getEmployeeInfo();
        
        // Fetch complete employee data
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeInfo.id)
          .single();

        if (error) throw error;
        
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
          id: employeeInfo.id,
          role: data.role,
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
      
      // Get current user employee info
      const employeeInfo = await getEmployeeInfo();
      
      // Fetch complete employee data
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeInfo.id)
        .single();

      if (error) throw error;
      
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
        id: employeeInfo.id,
        role: data.role,
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