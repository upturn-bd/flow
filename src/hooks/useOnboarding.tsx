"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { z } from "zod";

// Types for onboarding
export interface OnboardingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  designation: string;
  department_id: number;
  job_status: string;
  hire_date: string;
  company_id: number;
  supervisor_id?: string;
}

export interface PendingEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  department_id: number;
  designation: string;
  job_status: string;
  hire_date: string;
  supervisor_id: string;
  has_approval: string;
  rejection_reason?: string;
}

export interface UserOnboardingInfo {
  userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    department_id: number;
    designation: string;
    job_status: string;
    hire_date: string;
    company_id: number;
    role: string;
  };
  companyData: {
    name: string;
    code: string;
  };
}

const generateIdInput = () => {
  const letters = Array(3)
    .fill(null)
    .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    .join("");

  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return letters + digits;
};

export function useOnboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [userInfo, setUserInfo] = useState<UserOnboardingInfo | null>(null);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get current user's onboarding info
  const getUserOnboardingInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Not authenticated");
      }

      // Get employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select(`
          first_name,
          last_name,
          email,
          phone_number,
          department_id,
          designation,
          job_status,
          hire_date,
          company_id,
          role
        `)
        .eq("id", user.id)
        .single();

      if (employeeError?.code === "PGRST116") {
        // No employee record found
        return null;
      }

      if (employeeError) {
        throw new Error(employeeError.message);
      }

      // Get company data
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("name, code")
        .eq("id", employeeData.company_id)
        .single();

      if (companyError) {
        throw new Error(companyError.message);
      }

      const userInfo = {
        userData: employeeData,
        companyData: companyData,
      };

      setUserInfo(userInfo);
      return userInfo;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit onboarding data
  const submitOnboarding = useCallback(async (data: OnboardingData) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from("employees").upsert([
        {
          id: user.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone_number: data.phone_number,
          designation: data.designation,
          department_id: data.department_id,
          job_status: data.job_status,
          role: "Employee",
          is_supervisor: false,
          hire_date: data.hire_date,
          company_id: data.company_id,
          rejection_reason: null,
          has_approval: "PENDING",
          id_input: generateIdInput(),
          supervisor_id: data.supervisor_id || null,
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, message: "Employee data submitted successfully." };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get pending employees (for admin approval)
  const fetchPendingEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone_number,
          department_id,
          designation,
          job_status,
          hire_date,
          supervisor_id,
          has_approval,
          rejection_reason
        `)
        .eq("has_approval", "PENDING");

      if (error) {
        throw new Error(error.message);
      }

      setPendingEmployees(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Approve or reject employee onboarding
  const processOnboardingAction = useCallback(async (
    employeeId: string, 
    action: "ACCEPTED" | "REJECTED", 
    reason?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Not authenticated");
      }

      if (!["ACCEPTED", "REJECTED"].includes(action)) {
        throw new Error("Invalid action");
      }

      // Update employee approval status
      const { data: updateData, error: updateError } = await supabase
        .from("employees")
        .update({
          has_approval: action,
          rejection_reason: action === "REJECTED" ? reason || "No reason provided" : null,
        })
        .eq("id", employeeId)
        .select("supervisor_id, company_id")
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // If accepted and has supervisor, add to supervisor_employees
      if (action === "ACCEPTED" && updateData.supervisor_id && updateData.supervisor_id !== "Not Applicable") {
        const { error: supervisorError } = await supabase
          .from("supervisor_employees")
          .insert({
            supervisor_id: updateData.supervisor_id,
            employee_id: employeeId,
            company_id: updateData.company_id,
          });

        if (supervisorError) {
          console.error("Error adding supervisor relationship:", supervisorError);
          // Don't throw here as the main action succeeded
        }
      }

      // Remove from pending list in local state
      setPendingEmployees(prev => prev.filter(emp => emp.id !== employeeId));

      return { success: true, message: `User ${action.toLowerCase()} successfully` };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up realtime subscription for pending employees
  const subscribeToOnboardingUpdates = useCallback((callback?: (payload: any) => void) => {
    const channel = supabase
      .channel("onboarding-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "employees",
          filter: "has_approval=eq.PENDING",
        },
        (payload) => {
          console.log("Onboarding update:", payload);
          
          // Update local state based on the change
          if (payload.eventType === "INSERT") {
            setPendingEmployees(prev => [...prev, payload.new as PendingEmployee]);
          } else if (payload.eventType === "UPDATE") {
            setPendingEmployees(prev => 
              prev.map(emp => 
                emp.id === payload.new.id ? payload.new as PendingEmployee : emp
              )
            );
          } else if (payload.eventType === "DELETE") {
            setPendingEmployees(prev => prev.filter(emp => emp.id !== payload.old.id));
          }

          // Call custom callback if provided
          if (callback) {
            callback(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to changes for a specific user's onboarding status
  const subscribeToUserOnboardingUpdates = useCallback((userId: string, callback?: (payload: any) => void) => {
    const channel = supabase
      .channel(`user-onboarding-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "employees",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log("User onboarding update:", payload);
          
          // Call custom callback if provided
          if (callback) {
            callback(payload);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    // State
    loading,
    error,
    pendingEmployees,
    userInfo,
    
    // Actions
    getUserOnboardingInfo,
    submitOnboarding,
    fetchPendingEmployees,
    processOnboardingAction,
    clearError,
    
    // Realtime subscriptions
    subscribeToOnboardingUpdates,
    subscribeToUserOnboardingUpdates,
  };
} 