"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
import { useNotifications } from "./useNotifications";
import { 
  Stakeholder, 
  StakeholderIssue, 
  StakeholderType,
  StakeholderIssueStatus,
  StakeholderIssuePriority 
} from "@/lib/types/schemas";

export interface StakeholderFormData {
  name: string;
  address?: string;
  stakeholder_type_id?: number;
  manager_id?: number;
  contact_details?: {
    contacts: Array<{
      name: string;
      role: string;
      phone: string;
      email: string;
      address: string;
    }>;
  };
  assigned_employees?: string[];
}

export interface StakeholderIssueFormData {
  stakeholder_id: number;
  transaction_id?: number;
  title: string;
  description?: string;
  status: StakeholderIssueStatus;
  priority: StakeholderIssuePriority;
  assigned_to?: number;
}

export function useStakeholders() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [stakeholderTypes, setStakeholderTypes] = useState<StakeholderType[]>([]);
  const [stakeholderIssues, setStakeholderIssues] = useState<StakeholderIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { createNotification } = useNotifications();

  // Fetch stakeholder types
  const fetchStakeholderTypes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("stakeholder_types")
        .select("*")
        .eq("company_id", company_id)
        .order("name");

      if (error) {
        setError("Failed to fetch stakeholder types");
        throw error;
      }

      setStakeholderTypes(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching stakeholder types:", error);
      setError("Failed to fetch stakeholder types");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stakeholders
  const fetchStakeholders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("stakeholders")
        .select(`
          *,
          stakeholder_type:stakeholder_types(*)
        `)
        .eq("company_id", company_id)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Failed to fetch stakeholders");
        throw error;
      }

      setStakeholders(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching stakeholders:", error);
      setError("Failed to fetch stakeholders");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stakeholder issues
  const fetchStakeholderIssues = useCallback(async (stakeholderId?: number, status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      let query = supabase
        .from("stakeholder_issues")
        .select(`
          *,
          stakeholder:stakeholders(name, stakeholder_type:stakeholder_types(name))
        `)
        .eq("company_id", company_id);

      if (stakeholderId) {
        query = query.eq("stakeholder_id", stakeholderId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        setError("Failed to fetch stakeholder issues");
        throw error;
      }

      setStakeholderIssues(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching stakeholder issues:", error);
      setError("Failed to fetch stakeholder issues");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create stakeholder
  const createStakeholder = useCallback(async (stakeholderData: StakeholderFormData, userId?: string) => {
    setError(null);
    try {
      const company_id = await getCompanyId();
      
      // Get current user if userId not provided
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
        userId = user.id;
      }

      const { data, error } = await supabase
        .from("stakeholders")
        .insert([
          {
            ...stakeholderData,
            company_id,
            created_by: userId,
          }
        ])
        .select(`
          *,
          stakeholder_type:stakeholder_types(*)
        `)
        .single();

      if (error) throw error;

      // Update local state
      setStakeholders(prev => [data, ...prev]);
      
      // Send notification for stakeholder creation
      try {
        const user = await getEmployeeInfo();
        const recipients = stakeholderData.assigned_employees || [];
        if (stakeholderData.manager_id) {
          recipients.push(stakeholderData.manager_id.toString());
        }

        if (recipients.length > 0) {
          await createNotification({
            title: 'New Stakeholder Added',
            message: `A new stakeholder "${data.name}" has been added to the system.`,
            priority: 'normal',
            type_id: 6,
            recipient_id: recipients,
            action_url: '/operations-and-services/services/stakeholder',
            company_id: user.company_id,
            department_id: user.department_id
          });
        }
      } catch (notificationError) {
        console.warn("Failed to send notification:", notificationError);
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = "Failed to create stakeholder";
      setError(errorMessage);
      console.error(error);
      return { success: false, error: errorMessage };
    }
  }, [createNotification]);

  // Update stakeholder
  const updateStakeholder = useCallback(async (id: number, stakeholderData: Partial<StakeholderFormData>) => {
    setProcessingId(id);
    try {
      const company_id = await getCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("stakeholders")
        .update({
          ...stakeholderData,
          updated_by: user.id,
        })
        .eq("company_id", company_id)
        .eq("id", id)
        .select(`
          *,
          stakeholder_type:stakeholder_types(*)
        `)
        .single();

      if (error) throw error;

      // Update local state
      setStakeholders(prev => prev.map(stakeholder => 
        stakeholder.id === id ? data : stakeholder
      ));

      return { success: true, data };
    } catch (error) {
      const errorMessage = "Failed to update stakeholder";
      setError(errorMessage);
      console.error(error);
      return { success: false, error: errorMessage };
    } finally {
      setProcessingId(null);
    }
  }, []);

  // Create stakeholder issue
  const createStakeholderIssue = useCallback(async (issueData: StakeholderIssueFormData) => {
    setError(null);
    try {
      const company_id = await getCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("stakeholder_issues")
        .insert([
          {
            ...issueData,
            company_id,
            created_by: user.id,
          }
        ])
        .select(`
          *,
          stakeholder:stakeholders(name, stakeholder_type:stakeholder_types(name))
        `)
        .single();

      if (error) throw error;

      // Update local state
      setStakeholderIssues(prev => [data, ...prev]);
      
      // Send notification for issue creation
      try {
        const userInfo = await getEmployeeInfo();
        const recipients = [];
        
        if (issueData.assigned_to) {
          recipients.push(issueData.assigned_to.toString());
        }

        if (recipients.length > 0) {
          await createNotification({
            title: 'New Stakeholder Issue',
            message: `A new issue "${data.title}" has been created for stakeholder.`,
            priority: issueData.priority === 'Critical' || issueData.priority === 'High' ? 'high' : 'normal',
            type_id: 6,
            recipient_id: recipients,
            action_url: '/operations-and-services/services/stakeholder',
            company_id: userInfo.company_id,
            department_id: userInfo.department_id
          });
        }
      } catch (notificationError) {
        console.warn("Failed to send notification:", notificationError);
      }

      return { success: true, data };
    } catch (error) {
      const errorMessage = "Failed to create stakeholder issue";
      setError(errorMessage);
      console.error(error);
      return { success: false, error: errorMessage };
    }
  }, [createNotification]);

  // Update stakeholder issue
  const updateStakeholderIssue = useCallback(async (id: number, issueData: Partial<StakeholderIssueFormData>) => {
    setProcessingId(id);
    try {
      const company_id = await getCompanyId();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const updateData: any = {
        ...issueData,
      };

      // If status is being changed to resolved, set resolved fields
      if (issueData.status === 'Resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
      }

      const { data, error } = await supabase
        .from("stakeholder_issues")
        .update(updateData)
        .eq("company_id", company_id)
        .eq("id", id)
        .select(`
          *,
          stakeholder:stakeholders(name, stakeholder_type:stakeholder_types(name))
        `)
        .single();

      if (error) throw error;

      // Update local state
      setStakeholderIssues(prev => prev.map(issue => 
        issue.id === id ? data : issue
      ));

      return { success: true, data };
    } catch (error) {
      const errorMessage = "Failed to update stakeholder issue";
      setError(errorMessage);
      console.error(error);
      return { success: false, error: errorMessage };
    } finally {
      setProcessingId(null);
    }
  }, []);

  // Memoized values
  const stakeholdersByType = useMemo(() => {
    return stakeholders.reduce((acc, stakeholder) => {
      const typeName = stakeholder.stakeholder_type?.name || 'Unknown';
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(stakeholder);
      return acc;
    }, {} as Record<string, Stakeholder[]>);
  }, [stakeholders]);

  const issuesByStatus = useMemo(() => {
    return stakeholderIssues.reduce((acc, issue) => {
      if (!acc[issue.status]) {
        acc[issue.status] = [];
      }
      acc[issue.status].push(issue);
      return acc;
    }, {} as Record<string, StakeholderIssue[]>);
  }, [stakeholderIssues]);

  return {
    // Data
    stakeholders,
    stakeholderTypes,
    stakeholderIssues,
    stakeholdersByType,
    issuesByStatus,
    
    // State
    loading,
    error,
    processingId,
    
    // Actions
    fetchStakeholders,
    fetchStakeholderTypes,
    fetchStakeholderIssues,
    createStakeholder,
    updateStakeholder,
    createStakeholderIssue,
    updateStakeholderIssue,
  };
}