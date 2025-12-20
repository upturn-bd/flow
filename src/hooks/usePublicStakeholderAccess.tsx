"use client";

import { useState, useCallback, useRef } from "react";
import { Stakeholder, StakeholderIssue } from "@/lib/types/schemas";
import { logError, captureError } from "@/lib/sentry";

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
  
  // Store verification credentials for subsequent API calls
  const credentialsRef = useRef<{
    companyIdentifier: string;
    stakeholderName: string;
    accessCode: string;
  } | null>(null);

  // ==========================================================================
  // VERIFICATION
  // ==========================================================================

  /**
   * Verify stakeholder access using company name/code and stakeholder name with access code
   * Uses server-side API route to bypass RLS
   */
  const verifyStakeholderAccess = useCallback(
    async (companyIdentifier: string, stakeholderName: string, accessCode: string): Promise<PublicStakeholderVerificationResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/public/stakeholder/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyIdentifier, stakeholderName, accessCode }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            valid: false,
            error: data.error || 'Failed to verify access',
          };
        }

        // Store credentials for subsequent API calls
        if (data.valid) {
          credentialsRef.current = { companyIdentifier, stakeholderName, accessCode };
        }

        return data;
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
   * Uses server-side API route to bypass RLS
   */
  const fetchPublicTickets = useCallback(
    async (stakeholderId: number): Promise<StakeholderIssue[]> => {
      setLoading(true);
      setError(null);

      try {
        if (!credentialsRef.current) {
          throw new Error("Not verified");
        }

        const response = await fetch('/api/public/stakeholder/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stakeholderId,
            accessCode: credentialsRef.current.accessCode,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch tickets');
        }

        return data.tickets || [];
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
   * Uses server-side API route to bypass RLS
   */
  const createPublicTicket = useCallback(
    async (issueData: PublicStakeholderIssueFormData, _companyId: number, stakeholder: Stakeholder): Promise<StakeholderIssue | null> => {
      setLoading(true);
      setError(null);

      try {
        if (!credentialsRef.current) {
          throw new Error("Not verified");
        }

        const response = await fetch('/api/public/stakeholder/tickets/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stakeholderId: issueData.stakeholder_id,
            accessCode: credentialsRef.current.accessCode,
            title: issueData.title,
            description: issueData.description,
            priority: issueData.priority,
            category_id: issueData.category_id,
            subcategory_id: issueData.subcategory_id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create ticket');
        }

        return data.ticket;
      } catch (err) {
        logError("Error creating public ticket", err);
        captureError(err, { context: "createPublicTicket" });
        setError(err instanceof Error ? err.message : "Failed to create ticket");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fetch issue categories for a company (public access - no auth required)
   * Uses server-side API route to bypass RLS
   */
  const fetchPublicIssueCategories = useCallback(
    async (companyIdentifier: string, stakeholderName?: string, accessCode?: string) => {
      setLoading(true);
      setError(null);

      try {
        // Use provided credentials or stored credentials
        const creds = {
          companyIdentifier,
          stakeholderName: stakeholderName || credentialsRef.current?.stakeholderName || '',
          accessCode: accessCode || credentialsRef.current?.accessCode || '',
        };

        if (!creds.stakeholderName || !creds.accessCode) {
          // Can't fetch categories without verification
          return [];
        }

        const response = await fetch('/api/public/stakeholder/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch categories');
        }

        return data.categories || [];
      } catch (err) {
        logError("Error fetching public issue categories", err);
        setError("Failed to load categories");
        return [];
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
        // For public URLs, we can construct them directly
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!supabaseUrl) return null;
        
        return `${supabaseUrl}/storage/v1/object/public/stakeholder-documents/${filePath}`;
      } catch (err) {
        logError("Error getting attachment URL", err);
        return null;
      }
    },
    []
  );

  /**
   * Fetch transactions for a stakeholder (public access)
   * Uses server-side API route to bypass RLS
   */
  const fetchPublicTransactions = useCallback(
    async (stakeholderId: number) => {
      setLoading(true);
      setError(null);

      try {
        if (!credentialsRef.current) {
          throw new Error("Not verified");
        }

        const response = await fetch('/api/public/stakeholder/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stakeholderId,
            accessCode: credentialsRef.current.accessCode,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || 'Failed to fetch transactions';
          setError(errorMessage);
          throw new Error(errorMessage);
        }

        return data.transactions || [];
      } catch (err) {
        logError("Error fetching public transactions", err);
        setError("Failed to load transactions");
        throw err;
      } finally {
        setLoading(false);
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
    fetchPublicIssueCategories,
    getAttachmentUrl,
    fetchPublicTransactions,
  };
}
