"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

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

      // Check if email already exists for a different user
      const { data: existingEmployee, error: checkError } = await supabase
        .from("employees")
        .select("id, email")
        .eq("email", data.email)
        .neq("id", user.id)
        .maybeSingle();

      if (checkError) {
        throw new Error(checkError.message);
      }

      if (existingEmployee) {
        throw new Error("This email is already associated with another employee account. Please use a different email address.");
      }

      // Check max_users limit
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("max_users")
        .eq("id", data.company_id)
        .single();

      if (companyError) {
        throw new Error("Failed to fetch company settings: " + companyError.message);
      }

      const { count: currentEmployeeCount, error: countError } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("company_id", data.company_id)
        .eq("job_status", "Active");

      if (countError) {
        throw new Error("Failed to count employees: " + countError.message);
      }

      if (companyData.max_users && (currentEmployeeCount || 0) >= companyData.max_users) {
        throw new Error(`Company has reached its maximum user limit of ${companyData.max_users}. Please contact support or upgrade your plan.`);
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

  // Set up polling for pending employees (replaces realtime)
  const subscribeToOnboardingUpdates = useCallback((callback?: (payload: any) => void) => {
    let intervalId: NodeJS.Timeout;

    const pollForUpdates = async () => {
      try {
        await fetchPendingEmployees();
        if (callback) {
          callback({ type: 'polling_update' });
        }
      } catch (error) {
        console.error('Error polling for onboarding updates:', error);
      }
    };

    // Poll every 30 seconds for updates
    intervalId = setInterval(pollForUpdates, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchPendingEmployees]);

  // Set up polling for user's onboarding status (replaces realtime)
  const subscribeToUserOnboardingUpdates = useCallback((userId: string, callback?: (payload: any) => void) => {
    let intervalId: NodeJS.Timeout;

    const pollForUserUpdates = async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("has_approval, rejection_reason")
          .eq("id", userId)
          .single();

        if (!error && data && callback) {
          callback({ new: data });
        }
      } catch (error) {
        console.error('Error polling for user onboarding updates:', error);
      }
    };

    // Poll every 10 seconds for user status updates
    intervalId = setInterval(pollForUserUpdates, 10000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
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

    // Polling subscriptions (replaces realtime)
    subscribeToOnboardingUpdates,
    subscribeToUserOnboardingUpdates,
  };
}