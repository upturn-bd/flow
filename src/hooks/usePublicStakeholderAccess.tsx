"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Stakeholder, StakeholderIssue, StakeholderIssueAttachment } from "@/lib/types/schemas";
import { captureSupabaseError, logError } from "@/lib/sentry";

// ==============================================================================
// Form Data Interfaces for Public Access
// ==============================================================================

export interface PublicStakeholderIssueFormData {
  stakeholder_id: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category_id?: number;
  subcategory_id?: number;
  attachments?: File[];
  contact_name?: string; // Optional: Stakeholder's contact person name
  contact_email?: string; // Optional: Stakeholder's contact person email
  contact_phone?: string; // Optional: Stakeholder's contact person phone
}

export interface PublicStakeholderVerificationResult {
  valid: boolean;
  stakeholder?: Stakeholder;
  error?: string;
}

// ==============================================================================
// Public Stakeholder Access Hook
// ==============================================================================

export function usePublicStakeholderAccess() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================================
  // VERIFICATION
  // ==========================================================================

  /**
   * Verify stakeholder access using company name/code and stakeholder name with access code
   */
  const verifyStakeholderAccess = useCallback(
    async (companyIdentifier: string, stakeholderName: string, accessCode: string): Promise<PublicStakeholderVerificationResult> => {
      setLoading(true);
      setError(null);

      try {
        // First, find the company by name or code
        const { data: companies, error: companyError } = await supabase
          .from("companies")
          .select("id, name, code")
          .or(`name.ilike.%${companyIdentifier}%,code.ilike.%${companyIdentifier}%`)
          .limit(1);

        if (companyError) {
          captureSupabaseError(companyError, "verifyStakeholderAccess - company lookup", { companyIdentifier });
          throw new Error("Failed to verify company");
        }

        if (!companies || companies.length === 0) {
          return {
            valid: false,
            error: "Company not found. Please check the company name.",
          };
        }

        const company = companies[0];

        // Now verify stakeholder with access code
        const { data: stakeholder, error: stakeholderError } = await supabase
          .from("stakeholders")
          .select(`
            *,
            stakeholder_type:stakeholder_types(id, name),
            kam:employees!kam_id(id, first_name, last_name, email)
          `)
          .eq("company_id", company.id)
          .ilike("name", `%${stakeholderName}%`)
          .eq("access_code", accessCode.toUpperCase())
          .eq("is_active", true)
          .single();

        if (stakeholderError) {
          if (stakeholderError.code === "PGRST116") {
            // No rows returned
            return {
              valid: false,
              error: "Invalid stakeholder name or access code. Please check and try again.",
            };
          }
          captureSupabaseError(stakeholderError, "verifyStakeholderAccess - stakeholder lookup", { 
            companyId: company.id, 
            stakeholderName 
          });
          throw new Error("Failed to verify stakeholder");
        }

        // Transform KAM data
        const transformedStakeholder = {
          ...stakeholder,
          kam: stakeholder.kam ? {
            id: stakeholder.kam.id,
            name: `${stakeholder.kam.first_name} ${stakeholder.kam.last_name}`,
            email: stakeholder.kam.email,
          } : undefined,
        };

        return {
          valid: true,
          stakeholder: transformedStakeholder,
        };
      } catch (err) {
        logError("Error verifying stakeholder access", err);
        setError(err instanceof Error ? err.message : "Failed to verify access");
        return {
          valid: false,
          error: "An error occurred while verifying access",
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ==========================================================================
  // TICKET OPERATIONS
  // ==========================================================================

  /**
   * Fetch tickets created by this stakeholder from the public page
   */
  const fetchPublicTickets = useCallback(
    async (stakeholderId: number): Promise<StakeholderIssue[]> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("stakeholder_issues")
          .select(`
            *,
            category:stakeholder_issue_categories(id, name, color),
            subcategory:stakeholder_issue_subcategories(id, name)
          `)
          .eq("stakeholder_id", stakeholderId)
          .eq("created_from_public_page", true)
          .order("created_at", { ascending: false });

        if (fetchError) {
          captureSupabaseError(fetchError, "fetchPublicTickets", { stakeholderId });
          throw new Error("Failed to fetch tickets");
        }

        return data || [];
      } catch (err) {
        logError("Error fetching public tickets", err);
        setError("Failed to load tickets");
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Create a new ticket from the public page
   */
  const createPublicTicket = useCallback(
    async (issueData: PublicStakeholderIssueFormData, companyId: number, stakeholder: Stakeholder): Promise<StakeholderIssue | null> => {
      setLoading(true);
      setError(null);

      try {
        // Process file attachments if any
        const attachments: StakeholderIssueAttachment[] = [];
        
        if (issueData.attachments && issueData.attachments.length > 0) {
          for (const file of issueData.attachments) {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `${companyId}/stakeholder-issues/${issueData.stakeholder_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('stakeholder-documents')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              logError("File upload error", uploadError);
              throw new Error(`Failed to upload ${file.name}`);
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

        // Create the ticket
        const { data, error: insertError } = await supabase
          .from("stakeholder_issues")
          .insert([
            {
              stakeholder_id: issueData.stakeholder_id,
              title: issueData.title,
              description: issueData.description,
              status: 'Pending', // Always start as Pending for public tickets
              priority: issueData.priority,
              category_id: issueData.category_id || null,
              subcategory_id: issueData.subcategory_id || null,
              attachments,
              company_id: companyId,
              created_from_public_page: true, // Mark as public page creation
              // Note: created_by will be null for public tickets
            },
          ])
          .select()
          .single();

        if (insertError) {
          captureSupabaseError(insertError, "createPublicTicket", { companyId });
          throw new Error("Failed to create ticket");
        }

        // Send notification to KAM if assigned
        try {
          if (stakeholder.kam_id) {
            // Import notification function only when needed
            const { createStakeholderIssueNotification } = await import("@/lib/utils/notifications");
            await createStakeholderIssueNotification(
              stakeholder.kam_id,
              'created',
              {
                stakeholderName: stakeholder.name,
                issueTitle: issueData.title,
                priority: issueData.priority,
              },
              {
                referenceId: data.id,
                actionUrl: `/stakeholder-issues/${data.id}`,
              }
            );
          }
        } catch (notificationError) {
          // Log but don't fail the ticket creation
          logError("Failed to send public ticket notification", notificationError);
        }

        // Send email notification
        try {
          if (stakeholder.kam?.email) {
            // Import email function dynamically
            const { sendPublicTicketNotificationEmail } = await import("@/lib/email/stakeholder-ticket-email");
            await sendPublicTicketNotificationEmail({
              recipientEmail: stakeholder.kam.email,
              recipientName: stakeholder.kam.name,
              stakeholderName: stakeholder.name,
              ticketTitle: issueData.title,
              ticketDescription: issueData.description || "",
              priority: issueData.priority,
              ticketUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/stakeholder-issues/${data.id}`,
            });
          }
        } catch (emailError) {
          // Log but don't fail the ticket creation
          logError("Failed to send public ticket email", emailError);
        }

        return data;
      } catch (err) {
        logError("Error creating public ticket", err);
        setError(err instanceof Error ? err.message : "Failed to create ticket");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get public URL for attachment
   */
  const getAttachmentUrl = useCallback(
    async (filePath: string) => {
      try {
        const { data: publicData } = supabase.storage
          .from('stakeholder-documents')
          .getPublicUrl(filePath);
        
        if (publicData?.publicUrl) {
          return publicData.publicUrl;
        }

        return null;
      } catch (err) {
        logError("Error getting attachment URL", err);
        return null;
      }
    },
    []
  );

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    loading,
    error,

    // Operations
    verifyStakeholderAccess,
    fetchPublicTickets,
    createPublicTicket,
    getAttachmentUrl,
  };
}
