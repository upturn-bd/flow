"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { usePublicStakeholderAccess } from "@/hooks/usePublicStakeholderAccess";
import { StakeholderIssue, StakeholderIssueCategory } from "@/lib/types/schemas";
import { Button } from "@/components/ui/button";
import { 
  Ticket, 
  LockKey, 
  CheckCircle, 
  Warning, 
  Info,
  Plus,
  ArrowLeft
} from "@phosphor-icons/react";
import { captureError } from "@/lib/sentry";
import { toast } from "sonner";
import PublicAccessCodeModal from "./PublicAccessCodeModal";
import PublicTicketForm from "./PublicTicketForm";
import PublicTicketList from "./PublicTicketList";

export default function PublicTicketsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const companyIdentifier = decodeURIComponent(params.company as string);
  const stakeholderName = decodeURIComponent(params.stakeholder as string);
  const codeFromUrl = searchParams.get("code");

  const {
    loading,
    error: hookError,
    verifyStakeholderAccess,
    fetchPublicTickets,
    createPublicTicket,
    fetchPublicIssueCategories,
    getAttachmentUrl,
  } = usePublicStakeholderAccess();

  const [categories, setCategories] = useState<StakeholderIssueCategory[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [stakeholder, setStakeholder] = useState<any>(null);
  const [showCodeModal, setShowCodeModal] = useState(!codeFromUrl);
  const [tickets, setTickets] = useState<StakeholderIssue[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyAccess = useCallback(async (code: string) => {
    if (isVerified || isVerifying) return;
    
    setVerificationError(null);
    setIsVerifying(true);
    
    try {
      const result = await verifyStakeholderAccess(
        companyIdentifier,
        stakeholderName,
        code
      );

      if (result.valid && result.stakeholder) {
        setIsVerified(true);
        setStakeholder(result.stakeholder);
        setShowCodeModal(false);
        toast.success("Access verified successfully");
      } else {
        setVerificationError(result.error || "Invalid access code");
        setShowCodeModal(true);
      }
    } catch (err) {
      captureError(err, { context: "Public ticket access verification" });
      setVerificationError("An error occurred while verifying access");
      setShowCodeModal(true);
    } finally {
      setIsVerifying(false);
    }
  }, [isVerified, isVerifying, verifyStakeholderAccess, companyIdentifier, stakeholderName]);

  // Verify access on mount if code is provided in URL
  useEffect(() => {
    if (codeFromUrl && !isVerified && !isVerifying) {
      handleVerifyAccess(codeFromUrl);
    }
  }, [codeFromUrl, isVerified, isVerifying, handleVerifyAccess]);

  // Load tickets and categories when stakeholder is verified
  useEffect(() => {
    if (isVerified && stakeholder?.id) {
      loadTickets();
      loadCategories();
    }
  }, [isVerified, stakeholder?.id]);

  const loadCategories = async () => {
    const fetchedCategories = await fetchPublicIssueCategories(companyIdentifier);
    setCategories(fetchedCategories);
  };

  const loadTickets = async () => {
    if (!stakeholder?.id) return;

    try {
      const fetchedTickets = await fetchPublicTickets(stakeholder.id);
      setTickets(fetchedTickets);
    } catch (err) {
      captureError(err, { context: "Loading public tickets" });
      toast.error("Failed to load tickets");
    }
  };

  const handleCreateTicket = async (data: any) => {
    if (!stakeholder?.id || !stakeholder?.company_id) return;

    try {
      const newTicket = await createPublicTicket(
        {
          ...data,
          stakeholder_id: stakeholder.id,
        },
        stakeholder.company_id,
        stakeholder
      );

      if (newTicket) {
        toast.success("Ticket created successfully");
        setShowCreateForm(false);
        await loadTickets();
      } else {
        throw new Error("Failed to create ticket");
      }
    } catch (err) {
      captureError(err, { context: "Creating public ticket" });
      toast.error("Failed to create ticket");
    }
  };

  // Show code modal if not verified
  if (!isVerified) {
    return (
      <PublicAccessCodeModal
        isOpen={showCodeModal || !codeFromUrl}
        companyName={companyIdentifier}
        stakeholderName={stakeholderName}
        onVerify={handleVerifyAccess}
        loading={loading}
        error={verificationError}
      />
    );
  }

  // Main authenticated view
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <Ticket size={32} weight="duotone" className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground-primary">
                {stakeholder?.name} Tickets
              </h1>
              <p className="text-sm text-foreground-secondary mt-1">
                View and create support tickets
              </p>
            </div>
          </div>

          {/* Verified Badge */}
          <div className="items-center gap-2 text-sm text-success bg-success/10 dark:bg-success/20 px-3 py-2 rounded-lg inline-flex">
            <CheckCircle size={18} weight="fill" />
            <span className="font-medium">Access Verified</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-info/10 dark:bg-info/20 border border-info/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info size={20} weight="fill" className="text-info shrink-0 mt-0.5" />
          <div className="text-sm text-foreground-primary">
            <p className="font-medium mb-1">Welcome to your ticket portal</p>
            <p className="text-foreground-secondary">
              You can view all your previously created tickets and submit new ones. 
              Our team will be notified and will respond to your tickets promptly.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {!showCreateForm ? (
            <Button
              size="md"
              variant="primary"
              onClick={() => setShowCreateForm(true)}
              className="flex items-center justify-center gap-2"
            >
              <Plus size={18} weight="bold" />
              Create New Ticket
            </Button>
          ) : (
            <Button
              size="md"
              variant="outline"
              onClick={() => setShowCreateForm(false)}
              className="flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} weight="bold" />
              Back to Tickets
            </Button>
          )}
        </div>

        {/* Error Message */}
        {hookError && (
          <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <Warning size={20} weight="fill" className="shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Error</p>
              <p>{hookError}</p>
            </div>
          </div>
        )}

        {/* Create Form or Ticket List */}
        {showCreateForm ? (
          <PublicTicketForm
            categories={categories}
            onSubmit={handleCreateTicket}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : (
          <PublicTicketList
            tickets={tickets}
            loading={loading}
            onRefresh={loadTickets}
            getAttachmentUrl={getAttachmentUrl}
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border-primary mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-foreground-secondary">
            <p>Powered by Flow HRIS</p>
            <div className="flex items-center gap-2">
              <LockKey size={16} />
              <span>Secure Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
