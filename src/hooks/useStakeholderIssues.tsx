"use client";

import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { StakeholderIssue, StakeholderIssueAttachment } from "@/lib/types/schemas";
import { createStakeholderIssueNotification } from "@/lib/utils/notifications";

// ==============================================================================
// Form Data Interfaces
// ==============================================================================

export interface StakeholderIssueFormData {
  stakeholder_id: number;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigned_to?: string; // Employee ID assigned to handle this issue
  attachments?: File[];
}

export interface StakeholderIssueSearchOptions {
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  filterStatus?: "all" | "Pending" | "In Progress" | "Resolved";
  filterPriority?: "all" | "Low" | "Medium" | "High" | "Urgent";
  assignedToId?: string; // Filter by assigned employee
}

export interface StakeholderIssueSearchResult {
  issues: StakeholderIssue[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

// ==============================================================================
// Main Hook
// ==============================================================================

export function useStakeholderIssues() {
  const { employeeInfo } = useAuth();
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
      const company_id = employeeInfo?.company_id as number | undefined;
      if (!company_id) {
        throw new Error('Company ID not available');
      }

      let query = supabase
        .from("stakeholder_issues")
        .select(`
          *,
          stakeholder:stakeholders(
            id,
            name,
            address,
            kam_id
          ),
          assigned_employee:employees!stakeholder_issues_assigned_to_fkey(
            id,
            first_name,
            last_name,
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

      // Transform employee data to combine first_name and last_name
      const transformedData = data?.map((issue) => ({
        ...issue,
        assigned_employee: issue.assigned_employee ? {
          id: issue.assigned_employee.id,
          name: `${issue.assigned_employee.first_name} ${issue.assigned_employee.last_name}`,
          email: issue.assigned_employee.email,
        } : undefined,
      })) || [];

      setIssues(transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error fetching stakeholder issues:", error);
      setError("Failed to fetch issues");
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo]);

  const fetchIssueById = useCallback(async (issueId: number) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = employeeInfo?.company_id as number | undefined;
      if (!company_id) {
        throw new Error('Company ID not available');
      }

      const { data, error } = await supabase
        .from("stakeholder_issues")
        .select(`
          *,
          stakeholder:stakeholders(
            id,
            name,
            address,
            kam_id,
            contact_persons
          ),
          assigned_employee:employees!stakeholder_issues_assigned_to_fkey(
            id,
            first_name,
            last_name,
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

      // Transform employee data to combine first_name and last_name
      const transformedData = data ? {
        ...data,
        assigned_employee: data.assigned_employee ? {
          id: data.assigned_employee.id,
          name: `${data.assigned_employee.first_name} ${data.assigned_employee.last_name}`,
          email: data.assigned_employee.email,
        } : undefined,
      } : null;

      return transformedData;
    } catch (error) {
      console.error("Error fetching issue:", error);
      setError("Failed to fetch issue");
      return null;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo]);

  const fetchIssuesByAssignedEmployee = useCallback(async (assignedToId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const company_id = employeeInfo?.company_id as number | undefined;
      if (!company_id) {
        throw new Error('Company ID not available');
      }
      
      const targetAssignedToId = assignedToId || employeeInfo?.id;

      if (!targetAssignedToId) {
        throw new Error("No assigned employee ID provided");
      }

      const { data, error } = await supabase
        .from("stakeholder_issues")
        .select(`
          *,
          stakeholder:stakeholders(
            id,
            name,
            address,
            kam_id
          ),
          assigned_employee:employees!stakeholder_issues_assigned_to_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("company_id", company_id)
        .eq("assigned_to", targetAssignedToId)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Failed to fetch issues");
        throw error;
      }

      // Transform employee data to combine first_name and last_name
      const transformedData = data?.map((issue) => ({
        ...issue,
        assigned_employee: issue.assigned_employee ? {
          id: issue.assigned_employee.id,
          name: `${issue.assigned_employee.first_name} ${issue.assigned_employee.last_name}`,
          email: issue.assigned_employee.email,
        } : undefined,
      })) || [];

      setIssues(transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error fetching issues by assigned employee:", error);
      setError("Failed to fetch issues");
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo]);

  const searchIssues = useCallback(async (options: StakeholderIssueSearchOptions = {}) => {
    const { 
      searchQuery = "", 
      page = 1, 
      pageSize = 25, 
      filterStatus = "all",
      filterPriority = "all",
      assignedToId
    } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      const company_id = employeeInfo?.company_id as number | undefined;
      if (!company_id) {
        throw new Error('Company ID not available');
      }
      
      const targetAssignedToId = assignedToId || employeeInfo?.id;

      if (!targetAssignedToId) {
        throw new Error("No assigned employee ID provided");
      }
      
      // Build query
      let query = supabase
        .from("stakeholder_issues")
        .select(`
          *,
          stakeholder:stakeholders(
            id,
            name,
            address,
            kam_id
          ),
          assigned_employee:employees!stakeholder_issues_assigned_to_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .eq("company_id", company_id)
        .eq("assigned_to", targetAssignedToId);
      
      // Add search filter if provided
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }
      
      // Add status filter
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      
      // Add priority filter
      if (filterPriority !== "all") {
        query = query.eq("priority", filterPriority);
      }
      
      // Add pagination
      const startIndex = (page - 1) * pageSize;
      query = query.range(startIndex, startIndex + pageSize - 1);
      
      // Order by created_at for consistent results
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Transform employee data to combine first_name and last_name
      const transformedData = data?.map((issue) => ({
        ...issue,
        assigned_employee: issue.assigned_employee ? {
          id: issue.assigned_employee.id,
          name: `${issue.assigned_employee.first_name} ${issue.assigned_employee.last_name}`,
          email: issue.assigned_employee.email,
        } : undefined,
      })) || [];
      
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      
      const result: StakeholderIssueSearchResult = {
        issues: transformedData,
        totalCount,
        totalPages,
        currentPage: page,
      };
      
      setIssues(transformedData);
      return result;
    } catch (error) {
      console.error("Error searching issues:", error);
      setError("Failed to search issues");
      return {
        issues: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      };
    } finally {
      setLoading(false);
    }
  }, [employeeInfo]);

  const createIssue = useCallback(
    async (issueData: StakeholderIssueFormData) => {
      setError(null);
      try {
        const company_id = employeeInfo?.company_id as number | undefined;
        if (!company_id) {
          throw new Error('Company ID not available');
        }
        if (!employeeInfo) {
          throw new Error('Employee info not available');
        }

        // Get stakeholder data for notifications
        const { data: stakeholderData, error: stakeholderError } = await supabase
          .from("stakeholders")
          .select("id, name, kam_id")
          .eq("id", issueData.stakeholder_id)
          .single();

        if (stakeholderError) throw stakeholderError;

        // Process file attachments if any
        const attachments: StakeholderIssueAttachment[] = [];
        
        if (issueData.attachments && issueData.attachments.length > 0) {
          for (const file of issueData.attachments) {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${company_id}/stakeholder-issues/${issueData.stakeholder_id}/${fileName}`;

            console.log('Uploading file to path:', filePath);

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('stakeholder-documents')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
            }

            console.log('Upload successful:', uploadData);

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
              assigned_to: issueData.assigned_to,
              attachments,
              company_id,
              created_by: employeeInfo?.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        console.log('Issue created with attachments:', data);

        // Send notifications
        try {
          // Notify KAM about new issue
          if (stakeholderData.kam_id) {
            await createStakeholderIssueNotification(
              stakeholderData.kam_id,
              'created',
              {
                stakeholderName: stakeholderData.name,
                issueTitle: issueData.title,
                priority: issueData.priority,
              },
              {
                referenceId: data.id,
                actionUrl: `/stakeholder-issues/${data.id}`,
              }
            );
          }

          // Notify assigned employee if different from KAM
          if (issueData.assigned_to && issueData.assigned_to !== stakeholderData.kam_id) {
            await createStakeholderIssueNotification(
              issueData.assigned_to,
              'assigned',
              {
                stakeholderName: stakeholderData.name,
                issueTitle: issueData.title,
              },
              {
                referenceId: data.id,
                actionUrl: `/stakeholder-issues/${data.id}`,
              }
            );
          }
        } catch (notificationError) {
          console.warn('Failed to send issue creation notifications:', notificationError);
        }

        await fetchIssues(issueData.stakeholder_id);
        return data;
      } catch (error) {
        console.error("Error creating issue:", error);
        setError(error instanceof Error ? error.message : "Failed to create issue");
        throw error;
      }
    },
    [fetchIssues, employeeInfo]
  );

  const updateIssue = useCallback(
    async (issueId: number, issueData: Partial<StakeholderIssueFormData>) => {
      setError(null);
      setProcessingId(issueId);

      try {
        if (!employeeInfo) {
          throw new Error('Employee info not available');
        }

        // Get current issue data
        const { data: currentIssue } = await supabase
          .from("stakeholder_issues")
          .select(`
            attachments, 
            stakeholder_id,
            status,
            assigned_to,
            title,
            stakeholder:stakeholders(id, name, kam_id)
          `)
          .eq("id", issueId)
          .single();

        let attachments = currentIssue?.attachments || [];

        // Process new file attachments if any
        if (issueData.attachments && issueData.attachments.length > 0) {
          const company_id = employeeInfo?.company_id as number | undefined;
          if (!company_id) {
            throw new Error('Company ID not available');
          }
          
          for (const file of issueData.attachments) {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${company_id}/stakeholder-issues/${currentIssue?.stakeholder_id}/${fileName}`;

            console.log('Uploading file to path:', filePath);

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('stakeholder-documents')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
            }

            console.log('Upload successful:', uploadData);

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

        // Send notifications based on what changed
        try {
          const stakeholder = Array.isArray(currentIssue?.stakeholder) 
            ? currentIssue?.stakeholder[0] 
            : currentIssue?.stakeholder;
          const stakeholderName = stakeholder?.name || 'Stakeholder';
          const issueTitle = currentIssue?.title || 'Issue';
          const kamId = stakeholder?.kam_id;

          // Notify about status change
          if (issueData.status && issueData.status !== currentIssue?.status) {
            // Notify KAM
            if (kamId) {
              if (issueData.status === 'Resolved') {
                await createStakeholderIssueNotification(
                  kamId,
                  'resolved',
                  {
                    stakeholderName,
                    issueTitle,
                  },
                  {
                    referenceId: issueId,
                    actionUrl: `/stakeholder-issues/${issueId}`,
                  }
                );
              } else {
                await createStakeholderIssueNotification(
                  kamId,
                  'statusChanged',
                  {
                    stakeholderName,
                    issueTitle,
                    newStatus: issueData.status,
                  },
                  {
                    referenceId: issueId,
                    actionUrl: `/stakeholder-issues/${issueId}`,
                  }
                );
              }
            }

            // Notify assigned employee if different from KAM
            const assignedTo = issueData.assigned_to || currentIssue?.assigned_to;
            if (assignedTo && assignedTo !== kamId) {
              if (issueData.status === 'Resolved') {
                await createStakeholderIssueNotification(
                  assignedTo,
                  'resolved',
                  {
                    stakeholderName,
                    issueTitle,
                  },
                  {
                    referenceId: issueId,
                    actionUrl: `/stakeholder-issues/${issueId}`,
                  }
                );
              } else {
                await createStakeholderIssueNotification(
                  assignedTo,
                  'statusChanged',
                  {
                    stakeholderName,
                    issueTitle,
                    newStatus: issueData.status,
                  },
                  {
                    referenceId: issueId,
                    actionUrl: `/stakeholder-issues/${issueId}`,
                  }
                );
              }
            }
          }

          // Notify about assignment change
          if (issueData.assigned_to && issueData.assigned_to !== currentIssue?.assigned_to) {
            await createStakeholderIssueNotification(
              issueData.assigned_to,
              'assigned',
              {
                stakeholderName,
                issueTitle,
              },
              {
                referenceId: issueId,
                actionUrl: `/stakeholder-issues/${issueId}`,
              }
            );
          }
        } catch (notificationError) {
          console.warn('Failed to send issue update notifications:', notificationError);
        }

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
    [fetchIssues, employeeInfo]
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
        console.log('Getting URL for file path:', filePath);

        // Since the bucket is public, use public URLs directly
        // Public URLs work even if the file was just uploaded
        const { data: publicData } = supabase.storage
          .from('stakeholder-documents')
          .getPublicUrl(filePath);
        
        if (publicData?.publicUrl) {
          console.log('Using public URL:', publicData.publicUrl);
          return publicData.publicUrl;
        }

        return null;
      } catch (error) {
        console.error("Error getting attachment URL:", error);
        return null;
      }
    },
    []
  );

  const downloadAttachment = useCallback(
    async (filePath: string, originalName: string) => {
      try {
        console.log('Downloading file:', filePath, 'as', originalName);

        // Download the file as a blob
        const { data, error } = await supabase.storage
          .from('stakeholder-documents')
          .download(filePath);

        if (error) {
          console.error('Download error:', error);
          throw error;
        }

        if (!data) {
          throw new Error('No data received');
        }

        // Create a blob URL and trigger download with correct filename
        const blob = new Blob([data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return true;
      } catch (error) {
        console.error("Error downloading attachment:", error);
        throw error;
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
    fetchIssuesByAssignedEmployee,
    searchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
    deleteAttachment,
    getAttachmentUrl,
    downloadAttachment,
  };
}
