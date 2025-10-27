"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getCompanyId } from "@/lib/utils/auth";
import { StakeholderIssue, StakeholderIssueAttachment } from "@/lib/types/schemas";

// ==============================================================================
// Form Data Interfaces
// ==============================================================================

export interface StakeholderIssueFormData {
  stakeholder_id: number;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  attachments?: File[];
}

// ==============================================================================
// Main Hook
// ==============================================================================

export function useStakeholderIssues() {
  const [issues, setIssues] = useState<StakeholderIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // ==========================================================================
  // ISSUE OPERATIONS
  // ==========================================================================

  const fetchIssues = useCallback(async (stakeholderId?: number) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      let query = supabase
        .from("stakeholder_issues")
        .select(`
          *,
          stakeholder:stakeholders(
            id,
            name,
            address,
            issue_handler_id
          ),
          creator:employees!stakeholder_issues_created_by_fkey(
            id,
            name,
            email
          ),
          resolver:employees!stakeholder_issues_resolved_by_fkey(
            id,
            name,
            email
          )
        `)
        .eq("company_id", company_id);

      if (stakeholderId) {
        query = query.eq("stakeholder_id", stakeholderId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        setError("Failed to fetch issues");
        throw error;
      }

      setIssues(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching stakeholder issues:", error);
      setError("Failed to fetch issues");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIssueById = useCallback(async (issueId: number) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();

      const { data, error } = await supabase
        .from("stakeholder_issues")
        .select(`
          *,
          stakeholder:stakeholders(
            id,
            name,
            address,
            issue_handler_id,
            contact_persons
          ),
          creator:employees!stakeholder_issues_created_by_fkey(
            id,
            name,
            email
          ),
          resolver:employees!stakeholder_issues_resolved_by_fkey(
            id,
            name,
            email
          )
        `)
        .eq("company_id", company_id)
        .eq("id", issueId)
        .single();

      if (error) {
        setError("Failed to fetch issue");
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching issue:", error);
      setError("Failed to fetch issue");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIssuesByHandler = useCallback(async (handlerId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = await getCompanyId();
      const employeeInfo = await getEmployeeInfo();
      const targetHandlerId = handlerId || employeeInfo?.id;

      if (!targetHandlerId) {
        throw new Error("No handler ID provided");
      }

      const { data, error } = await supabase
        .from("stakeholder_issues")
        .select(`
          *,
          stakeholder:stakeholders!inner(
            id,
            name,
            address,
            issue_handler_id
          )
        `)
        .eq("company_id", company_id)
        .eq("stakeholder.issue_handler_id", targetHandlerId)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Failed to fetch issues");
        throw error;
      }

      setIssues(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching issues by handler:", error);
      setError("Failed to fetch issues");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createIssue = useCallback(
    async (issueData: StakeholderIssueFormData) => {
      setError(null);
      try {
        const company_id = await getCompanyId();
        const employeeInfo = await getEmployeeInfo();

        // Process file attachments if any
        const attachments: StakeholderIssueAttachment[] = [];
        
        if (issueData.attachments && issueData.attachments.length > 0) {
          for (const file of issueData.attachments) {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${company_id}/stakeholder-issues/${issueData.stakeholder_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('stakeholder-documents')
              .upload(filePath, file);

            if (uploadError) {
              throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
            }

            attachments.push({
              path: filePath,
              originalName: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
            });
          }
        }

        const { data, error } = await supabase
          .from("stakeholder_issues")
          .insert([
            {
              stakeholder_id: issueData.stakeholder_id,
              title: issueData.title,
              description: issueData.description,
              status: issueData.status,
              priority: issueData.priority,
              attachments,
              company_id,
              created_by: employeeInfo?.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await fetchIssues(issueData.stakeholder_id);
        return data;
      } catch (error) {
        console.error("Error creating issue:", error);
        setError(error instanceof Error ? error.message : "Failed to create issue");
        throw error;
      }
    },
    [fetchIssues]
  );

  const updateIssue = useCallback(
    async (issueId: number, issueData: Partial<StakeholderIssueFormData>) => {
      setError(null);
      setProcessingId(issueId);

      try {
        const employeeInfo = await getEmployeeInfo();

        // Get current issue data
        const { data: currentIssue } = await supabase
          .from("stakeholder_issues")
          .select("attachments, stakeholder_id")
          .eq("id", issueId)
          .single();

        let attachments = currentIssue?.attachments || [];

        // Process new file attachments if any
        if (issueData.attachments && issueData.attachments.length > 0) {
          const company_id = await getCompanyId();
          
          for (const file of issueData.attachments) {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${company_id}/stakeholder-issues/${currentIssue?.stakeholder_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('stakeholder-documents')
              .upload(filePath, file);

            if (uploadError) {
              throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
            }

            attachments.push({
              path: filePath,
              originalName: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
            });
          }
        }

        const updateData: any = {
          ...issueData,
          attachments,
          updated_by: employeeInfo?.id,
        };

        // Remove the attachments from issueData if present as File[]
        delete updateData.attachments;
        updateData.attachments = attachments;

        // If status is being changed to Resolved, add resolved metadata
        if (issueData.status === 'Resolved') {
          updateData.resolved_at = new Date().toISOString();
          updateData.resolved_by = employeeInfo?.id;
        }

        const { data, error } = await supabase
          .from("stakeholder_issues")
          .update(updateData)
          .eq("id", issueId)
          .select()
          .single();

        if (error) throw error;

        await fetchIssues(currentIssue?.stakeholder_id);
        return data;
      } catch (error) {
        console.error("Error updating issue:", error);
        setError("Failed to update issue");
        throw error;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchIssues]
  );

  const deleteIssue = useCallback(
    async (issueId: number) => {
      setError(null);
      setProcessingId(issueId);

      try {
        // Get issue data to clean up files
        const { data: issue } = await supabase
          .from("stakeholder_issues")
          .select("attachments, stakeholder_id")
          .eq("id", issueId)
          .single();

        // Delete uploaded files if any
        if (issue?.attachments && issue.attachments.length > 0) {
          const filePaths = issue.attachments.map((att: StakeholderIssueAttachment) => att.path);
          
          await supabase.storage
            .from('stakeholder-documents')
            .remove(filePaths);
        }

        const { error } = await supabase
          .from("stakeholder_issues")
          .delete()
          .eq("id", issueId);

        if (error) throw error;

        await fetchIssues(issue?.stakeholder_id);
        return true;
      } catch (error) {
        console.error("Error deleting issue:", error);
        setError("Failed to delete issue");
        return false;
      } finally {
        setProcessingId(null);
      }
    },
    [fetchIssues]
  );

  const deleteAttachment = useCallback(
    async (issueId: number, attachmentPath: string) => {
      setError(null);

      try {
        // Get current issue
        const { data: issue } = await supabase
          .from("stakeholder_issues")
          .select("attachments")
          .eq("id", issueId)
          .single();

        if (!issue) throw new Error("Issue not found");

        // Remove attachment from array
        const updatedAttachments = (issue.attachments || []).filter(
          (att: StakeholderIssueAttachment) => att.path !== attachmentPath
        );

        // Delete file from storage
        await supabase.storage
          .from('stakeholder-documents')
          .remove([attachmentPath]);

        // Update issue
        const { error } = await supabase
          .from("stakeholder_issues")
          .update({ attachments: updatedAttachments })
          .eq("id", issueId);

        if (error) throw error;

        return true;
      } catch (error) {
        console.error("Error deleting attachment:", error);
        setError("Failed to delete attachment");
        return false;
      }
    },
    []
  );

  const getAttachmentUrl = useCallback(
    async (filePath: string) => {
      try {
        const { data } = await supabase.storage
          .from('stakeholder-documents')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        return data?.signedUrl || null;
      } catch (error) {
        console.error("Error getting attachment URL:", error);
        return null;
      }
    },
    []
  );

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const pendingIssues = useMemo(
    () => issues.filter((i) => i.status === 'Pending'),
    [issues]
  );

  const inProgressIssues = useMemo(
    () => issues.filter((i) => i.status === 'In Progress'),
    [issues]
  );

  const resolvedIssues = useMemo(
    () => issues.filter((i) => i.status === 'Resolved'),
    [issues]
  );

  const highPriorityIssues = useMemo(
    () => issues.filter((i) => i.priority === 'High' || i.priority === 'Urgent'),
    [issues]
  );

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    issues,
    loading,
    error,
    processingId,

    // Computed
    pendingIssues,
    inProgressIssues,
    resolvedIssues,
    highPriorityIssues,

    // Operations
    fetchIssues,
    fetchIssueById,
    fetchIssuesByHandler,
    createIssue,
    updateIssue,
    deleteIssue,
    deleteAttachment,
    getAttachmentUrl,
  };
}
