"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { usePublicStakeholderAccess } from "@/hooks/usePublicStakeholderAccess";
import { StakeholderIssue, StakeholderIssueCategory, Account } from "@/lib/types/schemas";
import { Button } from "@/components/ui/button";
import { Badge, Alert, Tabs, PublicPageFooter } from "@/components/ui";
import { 
  Ticket, 
  CheckCircle, 
  Plus,
  ArrowLeft,
  User,
  CurrencyDollar,
  Package,
  Receipt
} from "@phosphor-icons/react";
import { captureError } from "@/lib/sentry";
import { toast } from "sonner";
import PublicAccessCodeModal from "./PublicAccessCodeModal";
import PublicTicketForm from "./PublicTicketForm";
import PublicTicketList from "./PublicTicketList";
import StakeholderInfoPanel from "@/components/stakeholders/StakeholderInfoPanel";
import PublicStakeholderTransactions from "@/components/stakeholders/PublicStakeholderTransactions";
import PublicStakeholderServices from "@/components/stakeholders/PublicStakeholderServices";
import PublicStakeholderInvoices from "@/components/stakeholders/PublicStakeholderInvoices";

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
    fetchPublicTransactions,
    fetchPublicServices,
    fetchPublicInvoices,
  } = usePublicStakeholderAccess();

  const [categories, setCategories] = useState<StakeholderIssueCategory[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [stakeholder, setStakeholder] = useState<any>(null);
  const [showCodeModal, setShowCodeModal] = useState(!codeFromUrl);
  const [tickets, setTickets] = useState<StakeholderIssue[]>([]);
  const [transactions, setTransactions] = useState<Account[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "tickets" | "transactions" | "services" | "invoices">("tickets");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  // Tab configuration
  const tabs = useMemo(() => [
    { key: "info", label: "Information", icon: <User size={16} /> },
    { key: "tickets", label: "Tickets", icon: <Ticket size={16} />, count: tickets.length },
    { key: "transactions", label: "Transactions", icon: <CurrencyDollar size={16} />, count: transactions.length },
    { key: "services", label: "Services", icon: <Package size={16} />, count: services.length },
    { key: "invoices", label: "Invoices", icon: <Receipt size={16} />, count: invoices.length },
  ], [tickets.length, transactions.length, services.length, invoices.length]);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as "info" | "tickets" | "transactions" | "services" | "invoices");
    setShowCreateForm(false);
    setSelectedServiceId(null);
  }, []);

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

  const loadCategories = useCallback(async () => {
    const fetchedCategories = await fetchPublicIssueCategories(companyIdentifier);
    setCategories(fetchedCategories);
  }, [fetchPublicIssueCategories, companyIdentifier]);

  const loadTickets = useCallback(async () => {
    if (!stakeholder?.id) return;

    try {
      const fetchedTickets = await fetchPublicTickets(stakeholder.id);
      setTickets(fetchedTickets);
    } catch (err) {
      captureError(err, { context: "Loading public tickets" });
      toast.error("Failed to load tickets");
    }
  }, [stakeholder?.id, fetchPublicTickets]);

  const loadTransactions = useCallback(async () => {
    if (!stakeholder?.id) return;

    try {
      const fetchedTransactions = await fetchPublicTransactions(stakeholder.id);
      setTransactions(fetchedTransactions);
    } catch (err) {
      captureError(err, { context: "Loading public transactions" });
      toast.error("Failed to load transactions");
    }
  }, [stakeholder?.id, fetchPublicTransactions]);

  const loadServices = useCallback(async () => {
    if (!stakeholder?.id) return;

    try {
      const fetchedServices = await fetchPublicServices(stakeholder.id);
      setServices(fetchedServices);
    } catch (err) {
      captureError(err, { context: "Loading public services" });
      toast.error("Failed to load services");
    }
  }, [stakeholder?.id, fetchPublicServices]);

  const loadInvoices = useCallback(async (serviceId?: number) => {
    if (!stakeholder?.id) return;

    try {
      const fetchedInvoices = await fetchPublicInvoices(stakeholder.id, serviceId);
      setInvoices(fetchedInvoices);
    } catch (err) {
      captureError(err, { context: "Loading public invoices" });
      toast.error("Failed to load invoices");
    }
  }, [stakeholder?.id, fetchPublicInvoices]);

  // Load tickets, transactions and categories when stakeholder is verified
  useEffect(() => {
    if (isVerified && stakeholder?.id) {
      loadTickets();
      loadTransactions();
      loadCategories();
      loadServices();
      loadInvoices();
    }
  }, [isVerified, stakeholder?.id, loadTickets, loadTransactions, loadCategories, loadServices, loadInvoices]);

  // Handler for viewing invoices from a specific service
  const handleViewServiceInvoices = useCallback((serviceId: number) => {
    setSelectedServiceId(serviceId);
    loadInvoices(serviceId);
    setActiveTab("invoices");
  }, [loadInvoices]);

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
                {stakeholder?.name}
              </h1>
              <p className="text-sm text-foreground-secondary mt-1">
                Stakeholder Portal
              </p>
            </div>
          </div>

          {/* Verified Badge */}
          <Badge variant="success" icon={<CheckCircle size={16} weight="fill" />}>
            Access Verified
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <Alert variant="info" title="Welcome to your stakeholder portal" className="mb-6">
          View your information, create and manage support tickets, and track your transactions.
        </Alert>

        {/* Error Message */}
        {hookError && (
          <Alert variant="error" title="Error" className="mb-6">
            {hookError}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="mb-6"
        />

        {/* Tab Content */}
        {activeTab === "info" ? (
          // Information Tab
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              {stakeholder && (
                <StakeholderInfoPanel 
                  stakeholder={stakeholder} 
                  showAdditionalData={true}
                />
              )}
            </div>
          </div>
        ) : activeTab === "tickets" ? (
          // Tickets Tab
          <>
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
          </>
        ) : activeTab === "transactions" ? (
          // Transactions Tab
          <PublicStakeholderTransactions
            transactions={transactions}
            loading={loading}
            stakeholderName={stakeholder?.name || ""}
          />
        ) : activeTab === "services" ? (
          // Services Tab
          <PublicStakeholderServices
            services={services}
            loading={loading}
            stakeholderName={stakeholder?.name || ""}
            onViewInvoices={handleViewServiceInvoices}
          />
        ) : (
          // Invoices Tab
          <PublicStakeholderInvoices
            invoices={invoices}
            loading={loading}
            stakeholderName={stakeholder?.name || ""}
            serviceId={selectedServiceId || undefined}
            onBack={selectedServiceId ? () => {
              setSelectedServiceId(null);
              loadInvoices();
              setActiveTab("services");
            } : undefined}
          />
        )}
      </div>

      {/* Footer */}
      <PublicPageFooter />
    </div>
  );
}
